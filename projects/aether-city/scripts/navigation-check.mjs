import assert from 'node:assert/strict'
globalThis.location = new URL('http://localhost/')
const { isWalkable, segmentWalkable, planRoute } = await import('../src/lib/navigation.ts')
const { VIEWS, GARDEN_RAMP, BRIDGE_FLOOR } = await import('../src/lib/world.ts')
for (const view of Object.values(VIEWS)) assert.ok(isWalkable({x:view.walk[0],z:view.walk[2]}),'復帰地点は歩ける')
for (const point of [{x:0,z:-6},{x:15,z:9},{x:-11.5,z:10.5},{x:29,z:20},{x:-45,z:-17}]) {
  assert.equal(isWalkable(point),false,'建物・池・雲海へ移動しない')
  assert.equal(planRoute({x:0,z:18},point),null)
}
const cases = [
  [{x:0,z:18},{x:0,z:10}],
  [{x:0,z:18},{x:0,z:-20}],
  [{x:0,z:18},{x:51,z:11}],
  [{x:51,z:11},{x:0,z:18}],
  [{x:0,z:18},{x:-42,z:-11}],
  [{x:0,z:18},{x:3,z:-42}],
  [{x:-42,z:-11},{x:51,z:11}],
]
// Both slope endpoints match their adjacent floors; no jumping is needed.
const top=GARDEN_RAMP.position[1]+0.04*Math.cos(GARDEN_RAMP.rotation[2])
const rise=GARDEN_RAMP.scale[0]/2*Math.sin(-GARDEN_RAMP.rotation[2])
assert.ok(Math.abs(top-rise-BRIDGE_FLOOR)<1e-9)
assert.ok(Math.abs(top+rise-0.26)<1e-9)
const begin=performance.now()
for (const [start,goal] of cases) {
  const path=planRoute(start,goal)
  assert.ok(path,`到達可能: ${JSON.stringify(goal)}`)
  assert.deepEqual(path.at(-1),goal)
  let previous=start
  for(const waypoint of path) { assert.ok(segmentWalkable(previous,waypoint),'全区間が床の上で障害物を避ける');previous=waypoint }
  assert.deepEqual(planRoute(start,goal),path,'経路は再現可能')
}
const mutableGoal={...cases[1][1]}
const independentPath=planRoute(cases[1][0],mutableGoal)
mutableGoal.x=999
assert.deepEqual(independentPath.at(-1),cases[1][1],'ホバーの更新で移動先が変わらない')
assert.ok(planRoute(...cases[1]).length>1,'建物を通り抜けず迂回する')
console.log(`PASS: 復帰先・立入禁止・直進・建物迂回・3本の橋・往復・経路再現性 (${(performance.now()-begin).toFixed(1)}ms / 14経路)`)
