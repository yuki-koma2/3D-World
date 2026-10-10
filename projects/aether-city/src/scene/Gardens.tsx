import { useMemo } from 'react'
import { Part, Batch, type Instance } from './primitives'
import { SEED, seeded, type Vec3 } from '../lib/world'

function Tree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const leaves = useMemo(() => {
    const random = seeded(SEED + Math.floor(position[0] * 19 + position[2] * 7))
    const data: Instance[] = []
    for (let i = 0; i < 13; i++) {
      const a = random() * Math.PI * 2
      const r = random() * 1.3
      data.push({ position: [Math.cos(a) * r, 3.5 + random() * 1.2, Math.sin(a) * r], scale: [0.75 + random() * 0.75, 0.85 + random() * 0.5, 0.75 + random() * 0.75], color: ['#779486', '#94a894', '#6c897f'][i % 3] })
    }
    return data
  }, [position])
  return <group position={position} scale={scale}>
    <Part shape="cylinder" surface="ivory" position={[0, 0.2, 0]} scale={[1.75, 0.4, 1.75]} receiveShadow />
    <Part shape="cylinder" surface="moss" position={[0, 0.42, 0]} scale={[1.58, 0.04, 1.58]} />
    <Part shape="cylinder" surface="bark" position={[0, 1.75, 0]} scale={[0.14, 2.6, 0.14]} castShadow />
    <Part shape="cylinder" surface="bark" position={[0.5, 2.5, 0]} scale={[0.08, 1.8, 0.08]} rotation={[0, 0, -0.55]} />
    <Batch shape="sphere" surface="foliage" items={leaves} castShadow />
    <Part shape="torus" surface="warm" position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.79, 1.79, 0.25]} />
  </group>
}

function Lamp({ position }: { position: Vec3 }) {
  return <group position={position}>
    <Part shape="cylinder" surface="bronze" position={[0, 1.55, 0]} scale={[0.055, 3.1, 0.055]} />
    <Part shape="cylinder" surface="warm" position={[0, 2.88, 0]} scale={[0.12, 0.52, 0.12]} />
    <Part shape="cylinder" surface="dark" position={[0, 3.17, 0]} scale={[0.25, 0.07, 0.25]} />
    <Part shape="cylinder" surface="dark" position={[0, 0.1, 0]} scale={[0.27, 0.2, 0.27]} />
  </group>
}

function ReflectingPool({ position, radius }: { position: Vec3; radius: number }) {
  return <group position={position}>
    <Part shape="cylinder" surface="bronze" position={[0, 0.18, 0]} scale={[radius, 0.36, radius]} receiveShadow />
    <Part shape="cylinder" surface="water" position={[0, 0.37, 0]} scale={[radius - 0.22, 0.03, radius - 0.22]} />
    <Part shape="torus" surface="warm" position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[radius - 0.12, radius - 0.12, 0.13]} />
  </group>
}

function GardenIsland() {
  const slats = useMemo(() => {
    const list: Instance[] = []
    for (let i = 0; i < 18; i++) list.push({ position: [(i - 8.5) * 0.5, 5.1, -2.3], scale: [0.12, 0.12, 9.3] })
    return list
  }, [])
  return <group position={[-43, 0, -15]}>
    <Part shape="cylinder" surface="moss" position={[0, 0.08, -2]} scale={[8.5, 0.16, 8.5]} receiveShadow />
    <Part surface="stone" position={[0, 0.18, 4]} scale={[18.5, 0.16, 3.7]} receiveShadow />
    <Part surface="stone" position={[2, 0.18, -2.5]} scale={[3.7, 0.16, 13.5]} receiveShadow />
    <ReflectingPool position={[-2, 0, -2]} radius={3.1} />
    {([-7.5, 7] as number[]).map((x) => <Tree key={x} position={[x, 0, -3.8]} scale={1.35} />)}
    <Tree position={[-5.2, 0, 7.1]} scale={0.92} />
    <Tree position={[3.7, 0, 8.2]} scale={1.05} />
    <Tree position={[0.3, 0, -8.9]} scale={1.2} />
    {[-4, 4].map((x) => [-6.4, 2].map((z) => <Part key={`${x}-${z}`} surface="bronze" position={[x, 2.6, z]} scale={[0.22, 5.2, 0.22]} castShadow />))}
    <Batch items={slats} surface="ivory" castShadow />
    <Part surface="warm" position={[0, 4.9, 2]} scale={[8.5, 0.07, 0.07]} />
    <Lamp position={[8.9, 0, 3.8]} /><Lamp position={[-8.3, 0, 3.8]} />
  </group>
}

export function Gardens() {
  const paths = useMemo(() => {
    const tiles: Instance[] = []
    for (let z = 3.8; z < 22; z += 1.8) {
      for (let x = -2; x <= 2; x += 2) tiles.push({ position: [x, 0.027, z], scale: [1.92, 0.045, 1.73] })
    }
    return tiles
  }, [])
  const shrubs = useMemo(() => {
    const random = seeded(SEED + 400)
    const data: Instance[] = []
    for (let i = 0; i < 150; i++) {
      const a = random() * Math.PI * 2
      const r = 17.8 + random() * 2.1
      const x = Math.sin(a) * r
      const z = Math.cos(a) * r
      if (Math.abs(x) < 4 || (x > 16 && z > 0) || (x < -16 && z < 0)) continue
      data.push({ position: [x, 0.38, z], scale: [0.5 + random() * 0.4, 0.6 + random() * 0.5, 0.5 + random() * 0.4] })
    }
    return data
  }, [])
  const lamps: Vec3[] = [[-4.3, 0, 9], [4.3, 0, 9], [-4.3, 0, 18], [4.3, 0, 18], [21, 0, 0], [-19, 0, 1], [-7, 0, -22], [16, 0, -13]]
  return <group>
    <Batch items={paths} surface="ivory" />
    <Batch items={shrubs} shape="sphere" surface="leaves" />
    <ReflectingPool position={[-11.5, 0, 10.5]} radius={3.7} />
    <Tree position={[-18, 0, 7]} scale={1.2} />
    <Tree position={[-9, 0, 17.5]} scale={1.05} />
    <Tree position={[9, 0, 17]} scale={1.15} />
    <Tree position={[18, 0, -9]} scale={1.25} />
    <Tree position={[-17, 0, -6]} scale={1.1} />
    {lamps.map((p) => <Lamp key={p.join()} position={p} />)}
    <GardenIsland />
  </group>
}
