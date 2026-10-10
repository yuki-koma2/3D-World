import assert from 'node:assert/strict'

globalThis.location = new URL('http://127.0.0.1:5173/?seed=0')
const { seeded, SEED, BRIDGES, BRIDGE_FLOOR, ISLANDS, VIEWS, bridgeTransform } = await import('../src/lib/world.ts')
const { adaptQuality } = await import('../src/lib/adaptive.ts')

assert.equal(SEED, 0, 'Seed=0を指定できる')
const sequence = (seed) => { const next = seeded(seed); return Array.from({ length: 20 }, next) }
assert.deepEqual(sequence(271828), sequence(271828), '同じSeedから同じ都市を作る')
assert.notDeepEqual(sequence(271828), sequence(271829), '異なるSeedの都市は変化する')
assert.ok(sequence(0).every((n) => n >= 0 && n < 1), 'Seed=0でも乱数は範囲内')

for (const bridge of BRIDGES) {
  const touchesIsland = (point) => ISLANDS.some((island) => Math.hypot(point[0] - island.position[0], point[2] - island.position[2]) < island.radius - 0.5)
  assert.ok(touchesIsland(bridge.start) && touchesIsland(bridge.end), '橋の両端は島の床と重なる')
  const { length, position, angle } = bridgeTransform(bridge.start, bridge.end)
  assert.ok(length > 0 && length < 40 && Number.isFinite(angle))
  assert.equal(position[1], 0, '橋の基準位置は島と同じ高さ')
  assert.ok(BRIDGE_FLOOR >= 0 && BRIDGE_FLOOR < 0.1, '島との段差はカプセルで越えられる10cm未満')
}
for (const view of Object.values(VIEWS)) assert.ok(ISLANDS.some((island) => Math.hypot(view.walk[0] - island.position[0], view.walk[2] - island.position[2]) < island.radius - 0.5), '復帰先は床の内側')

assert.equal(adaptQuality(43, 4, 10, 1, 'high'), null, '43fps以上で画質を下げない')
assert.equal(adaptQuality(30, 3, 10, 1, 'high'), null, '一時的な低fpsには反応しない')
assert.equal(adaptQuality(30, 4, 7.99, 1, 'high'), null, '初期準備中は調整しない')
assert.deepEqual(adaptQuality(30, 4, 10, 1, 'high'), { dpr: 0.8, quality: 'high' })
assert.deepEqual(adaptQuality(30, 4, 10, 0.8, 'high'), { dpr: 0.75, quality: 'high' })
assert.deepEqual(adaptQuality(30, 4, 10, 0.75, 'high'), { dpr: 0.75, quality: 'balanced' })
assert.deepEqual(adaptQuality(30, 4, 10, 0.75, 'balanced'), { dpr: 0.75, quality: 'low' })
assert.equal(adaptQuality(30, 4, 10, 0.75, 'low'), null, '下限より解像度を落とさない')
console.log('PASS: Seed再現、橋と復帰地点の連続性、自動画質の境界')
