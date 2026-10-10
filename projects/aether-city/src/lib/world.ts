export type Vec3 = [number, number, number]
export type Quality = 'low' | 'balanced' | 'high'
export type View = 'city' | 'spire' | 'terrace'

const seedParam = new URLSearchParams(location.search).get('seed')
export const SEED = seedParam !== null && Number.isFinite(Number(seedParam)) ? Math.floor(Number(seedParam)) >>> 0 : 271828

export function seeded(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let n = Math.imul(value ^ (value >>> 15), 1 | value)
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n)
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296
  }
}

export const ISLANDS = [
  { id: 'central', position: [0, 0, 0] as Vec3, radius: 25, depth: 17, name: 'セントラル・スパイア' },
  { id: 'terrace', position: [49, 0, 7] as Vec3, radius: 12, depth: 10, name: 'スカイテラス' },
  { id: 'garden', position: [-43, 0, -15] as Vec3, radius: 13, depth: 12, name: 'エーテル庭園' },
  { id: 'harbor', position: [7, 0, -49] as Vec3, radius: 14, depth: 14, name: 'ルミナ・ハーバー' },
]

export const BRIDGES = [
  { start: [19, 0, 3] as Vec3, end: [41, 0, 7] as Vec3, width: 4.6 },
  { start: [-19, 0, -6] as Vec3, end: [-34, 0, -12] as Vec3, width: 4 },
  { start: [3, 0, -21] as Vec3, end: [6, 0, -38] as Vec3, width: 4 },
]
// Six-centimetre lip clears island paving and perimeter trim without a visible depth conflict.
export const BRIDGE_FLOOR = 0.065
// A short approach joins the bridge to the garden paving at 0.26m.
const gardenRampAngle = -Math.atan(0.26 - BRIDGE_FLOOR)
export const GARDEN_RAMP = {
  position: [-33.25, (0.26 + BRIDGE_FLOOR) / 2 - 0.04 * Math.cos(gardenRampAngle), -11] as Vec3,
  rotation: [0, 0, gardenRampAngle] as Vec3,
  scale: [Math.hypot(1, 0.26 - BRIDGE_FLOOR), 0.08, 3.7] as Vec3,
}

export const VIEWS: Record<View, { position: Vec3; target: Vec3; label: string; short: string; walk: Vec3; fov: number }> = {
  city: { position: [89, 49, 104], target: [2, 15, -10], label: '都市全景', short: '雲の上の、もうひとつの世界。', walk: [0, 2.2, 18], fov: 43 },
  spire: { position: [5, 26, 102], target: [0, 28, -6], label: 'セントラル・スパイア', short: '空に向かう、街の心臓。', walk: [0, 2.2, 13], fov: 44 },
  terrace: { position: [57, 2.5, 14], target: [-5, 30, -13], label: 'スカイテラス', short: '夕陽と、遥かな街のあいだ。', walk: [51, 2.2, 11], fov: 64 },
}

export const QUALITY = {
  low: { dpr: 0.85, shadow: 0, bloom: false, cloudCount: 110, label: '軽量' },
  balanced: { dpr: 1.25, shadow: 1024, bloom: true, cloudCount: 180, label: 'バランス' },
  high: { dpr: 1.65, shadow: 2048, bloom: true, cloudCount: 260, label: '高品質' },
} satisfies Record<Quality, { dpr: number; shadow: number; bloom: boolean; cloudCount: number; label: string }>

export function bridgeTransform(start: Vec3, end: Vec3) {
  const dx = end[0] - start[0]
  const dz = end[2] - start[2]
  return {
    position: [(start[0] + end[0]) / 2, 0, (start[2] + end[2]) / 2] as Vec3,
    length: Math.hypot(dx, dz),
    angle: Math.atan2(dx, dz),
  }
}

// Mutated in the render loop; sampled by the DOM at one-second intervals.
export const telemetry = {
  ready: false, fps: 0, frameMs: 0, drawCalls: 0, triangles: 0, frames: 0,
  dpr: 1, renderer: '', camera: [0, 0, 0] as Vec3,
  player: [0, 0, 0] as Vec3, drones: [0, 0, 0] as Vec3,
  grounded: false, locked: false, respawns: 0, qualityChanges: 0,
  time: 0.23,
  floorHit: [0, 0, 0] as Vec3, navigation: '待機', target: [0, 0] as [number, number], waypoints: 0,
  routeRequests: 0, arrivals: 0, yaw: 0, pitch: 0,
}

export const benchmark = {
  requested: 0, running: false, done: false, elapsed: 0, frames: 0,
  averageFps: 0, p95Ms: 0, p99Ms: 0, drawCalls: 0, triangles: 0,
  width: 0, height: 0, dpr: 0, quality: 'balanced' as Quality,
}

export function startBenchmark() { benchmark.requested++; benchmark.done = false }

declare global {
  interface Window {
    __AETHER__?: {
      telemetry: typeof telemetry
      getState: () => unknown
      respawn: () => void
      testFall?: () => void
    }
  }
}
