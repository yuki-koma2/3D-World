import { BRIDGES, ISLANDS } from './world.ts'

export type GroundPoint = { x: number; z: number }
type Obstacle = GroundPoint & ({ radius: number } | { halfX: number; halfZ: number })
// Includes low plinths, pools and planters that must not become walking shortcuts.
export const WALK_OBSTACLES: Obstacle[] = [
  { x: 0, z: -6, radius: 10.55 },
  ...[-1, 1].map(s => ({ x: s * 10.4, z: -7.8, halfX: 3.1, halfZ: 4.4 })),
  { x: -4.1, z: 2.8, halfX: 0.9, halfZ: 1.15 }, { x: 4.1, z: 2.8, halfX: 0.9, halfZ: 1.15 },
  { x: -11, z: -14, radius: 3.7 }, { x: 15, z: 9, radius: 5.25 },
  { x: -11.5, z: 10.5, radius: 3.8 }, { x: -45, z: -17, radius: 3.2 },
  { x: 2.5, z: -49, radius: 4 }, { x: 11, z: -53, radius: 3.8 },
  { x: 10, z: -42, radius: 5.65 }, { x: 51.2, z: 3.6, radius: 3.95 },
  { x: 45, z: 11, halfX: 1.4, halfZ: 0.5 }, { x: 53, z: 11, halfX: 1.4, halfZ: 0.5 },
  { x: 46.8, z: 10.5, radius: 0.5 },
  ...[[-18,7,2.1],[-9,17.5,1.84],[9,17,2.02],[18,-9,2.2],[-17,-6,1.93],
    [-50.5,-18.8,2.37],[-36,-18.8,2.37],[-48.2,-7.9,1.62],[-39.3,-6.8,1.84],[-42.7,-23.9,2.1]]
    .map(([x,z,radius]) => ({ x,z,radius })),
  ...[-47,-39].flatMap(x => [-21.4,-13].map(z => ({ x,z,halfX:0.16,halfZ:0.16 }))),
  ...[[-4.3,9],[4.3,9],[-4.3,18],[4.3,18],[21,0],[-19,1],[-7,-22],[16,-13],[-34.1,-11.2],[-51.3,-11.2]]
    .map(([x,z]) => ({ x,z,radius:0.27 })),
]

const CLEARANCE = 0.55 // Player radius 0.35m plus room to turn and stop.
const terraceBenchClearance = 0.4
const distance = (a: GroundPoint, b: GroundPoint) => Math.hypot(a.x-b.x,a.z-b.z)

export function isWalkable(point: GroundPoint): boolean {
  const onIsland = ISLANDS.some(island => {
    const dx=point.x-island.position[0], dz=point.z-island.position[2]
    const radius = island.id === 'terrace' ? 9.55 : island.radius-1.4
    if (Math.hypot(dx,dz)>radius) return false
    if (island.id !== 'garden') return true
    // Garden paths, rather than flower beds and the reflecting pool.
    return (Math.abs(dx)<=9.25 && Math.abs(dz-4)<=1.85) || (Math.abs(dx-2)<=1.85 && Math.abs(dz+2.5)<=6.75)
  })
  const onBridge = BRIDGES.some(bridge => {
    const dx=bridge.end[0]-bridge.start[0], dz=bridge.end[2]-bridge.start[2]
    const length=Math.hypot(dx,dz)
    const px=point.x-bridge.start[0], pz=point.z-bridge.start[2]
    const along=(px*dx+pz*dz)/length, across=Math.abs(px*dz-pz*dx)/length
    return along>=0 && along<=length && across<=bridge.width/2-CLEARANCE
  })
  if (!onIsland && !onBridge) return false
  return !WALK_OBSTACLES.some(obstacle => {
    const margin = obstacle.z === 11 && 'halfX' in obstacle ? terraceBenchClearance : CLEARANCE
    return 'radius' in obstacle ? distance(point,obstacle)<obstacle.radius+margin :
      Math.abs(point.x-obstacle.x)<obstacle.halfX+margin && Math.abs(point.z-obstacle.z)<obstacle.halfZ+margin
  })
}

export function segmentWalkable(a: GroundPoint, b: GroundPoint) {
  const count=Math.max(1,Math.ceil(distance(a,b)/0.16))
  for(let i=0;i<=count;i++) {
    const t=i/count
    if(!isWalkable({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t})) return false
  }
  return true
}

// Built once when Walk is loaded. Routing work happens on clicks, never every frame.
const STEP=0.6, MIN_X=-58, MIN_Z=-65, COLS=203, ROWS=155
const grid=new Uint8Array(COLS*ROWS)
const pointAt=(id:number):GroundPoint=>({x:MIN_X+(id%COLS)*STEP,z:MIN_Z+Math.floor(id/COLS)*STEP})
for(let id=0;id<grid.length;id++) grid[id]=Number(isWalkable(pointAt(id)))

function nearestNode(point:GroundPoint) {
  const col=Math.round((point.x-MIN_X)/STEP), row=Math.round((point.z-MIN_Z)/STEP)
  let best=-1, closest=Infinity
  for(let dz=-3;dz<=3;dz++) for(let dx=-3;dx<=3;dx++) {
    const x=col+dx,z=row+dz,id=z*COLS+x
    if(x<0 || x>=COLS || z<0 || z>=ROWS || !grid[id]) continue
    const candidate=pointAt(id), d=distance(point,candidate)
    if(d<closest && segmentWalkable(point,candidate)) { best=id;closest=d }
  }
  return best
}

class MinHeap {
  private entries:{id:number;score:number}[]=[]
  push(id:number,score:number) {
    const item={id,score}, list=this.entries
    let index=list.length;list.push(item)
    while(index>0) { const parent=(index-1)>>1;if(list[parent].score<=score) break;list[index]=list[parent];index=parent }
    list[index]=item
  }
  pop() {
    const list=this.entries, first=list[0], last=list.pop()
    if(list.length && last) {
      let index=0
      while(index*2+1<list.length) {
        let child=index*2+1
        if(child+1<list.length && list[child+1].score<list[child].score) child++
        if(list[child].score>=last.score) break
        list[index]=list[child];index=child
      }
      list[index]=last
    }
    return first
  }
  get size() { return this.entries.length }
}

export function planRoute(start:GroundPoint,goal:GroundPoint):GroundPoint[]|null {
  if(!isWalkable(start) || !isWalkable(goal)) return null
  if(segmentWalkable(start,goal)) return [{...goal}]
  const source=nearestNode(start), target=nearestNode(goal)
  if(source<0 || target<0) return null
  const cost=new Float64Array(grid.length).fill(Infinity), parent=new Int32Array(grid.length).fill(-1)
  const closed=new Uint8Array(grid.length), open=new MinHeap()
  cost[source]=0;open.push(source,distance(pointAt(source),goal))
  while(open.size) {
    const current=open.pop().id
    if(closed[current]) continue
    if(current===target) {
      const path:GroundPoint[]=[{...goal}]
      for(let id=target;id!==source;id=parent[id]) path.push(pointAt(id))
      path.push(pointAt(source),start);path.reverse()
      const smooth:GroundPoint[]=[]
      let anchor=0
      while(anchor<path.length-1) {
        let next=path.length-1
        while(next>anchor+1 && !segmentWalkable(path[anchor],path[next])) next--
        smooth.push(path[next]);anchor=next
      }
      return smooth
    }
    closed[current]=1
    const row=Math.floor(current/COLS), col=current%COLS, here=pointAt(current)
    for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++) {
      if(!dx && !dz) continue
      const x=col+dx,z=row+dz,id=z*COLS+x
      if(x<0||x>=COLS||z<0||z>=ROWS||!grid[id]||closed[id]) continue
      if(dx && dz && (!grid[row*COLS+x] || !grid[z*COLS+col])) continue
      const neighbor=pointAt(id)
      if(!segmentWalkable(here,neighbor)) continue
      const nextCost=cost[current]+Math.hypot(dx,dz)*STEP
      if(nextCost>=cost[id]) continue
      cost[id]=nextCost;parent[id]=current;open.push(id,nextCost+distance(neighbor,goal))
    }
  }
  return null
}

export function markerHeight(point:GroundPoint) {
  if(point.x>37) return 0.16
  if(point.x< -29) return 0.31
  return 0.12
}
