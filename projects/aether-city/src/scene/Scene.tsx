import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { lazy, Suspense, useEffect, useRef } from 'react'
import { ACESFilmicToneMapping, PCFShadowMap } from 'three'
import { Environment } from './Environment'
import { Terrain } from './Terrain'
import { Architecture } from './Architecture'
import { Gardens } from './Gardens'
import { Skyline } from './Skyline'
import { Animation } from './Animation'
import { Effects } from './Effects'
import { Signage } from './Signage'
import { CameraRig } from '../controls/CameraRig'
import { useWorld } from '../state/world'
import { QUALITY, telemetry, VIEWS, benchmark } from '../lib/world'
import { adaptQuality } from '../lib/adaptive'

const WalkPhysics = lazy(() => import('../controls/WalkPhysics'))

function Monitor() {
  const { gl, camera } = useThree()
  const ticks = useRef({ seconds: 0, frames: 0, slow: 0, elapsed: 0, dpr: 1.25 })
  const capture = useRef({ request: 0, frameTimes: new Float32Array(4000), count: 0, calls: 0, triangles: 0 })
  const quality = useWorld((s) => s.quality)
  const renderDpr = useWorld((s) => s.renderDpr)
  useEffect(() => {
    gl.info.autoReset = false
    const dpr = renderDpr
    ticks.current.dpr = dpr
    ticks.current.slow = 0
    telemetry.dpr = dpr
  }, [quality, renderDpr, gl])
  useEffect(() => {
    const ctx = gl.getContext()
    const info = ctx.getExtension('WEBGL_debug_renderer_info')
    telemetry.renderer = info ? String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'WebGL2'
    if (import.meta.env.DEV) window.__AETHER__ = { telemetry, getState: () => useWorld.getState(), respawn: () => useWorld.getState().reset() }
    return () => { delete window.__AETHER__ }
  }, [gl])
  useFrame((_, delta) => {
    const sample = ticks.current
    sample.seconds += delta
    sample.elapsed += delta
    sample.frames++
    telemetry.frames++
    telemetry.camera[0] = camera.position.x
    telemetry.camera[1] = camera.position.y
    telemetry.camera[2] = camera.position.z
    telemetry.ready = telemetry.frames > 5
    telemetry.drawCalls = gl.info.render.calls
    telemetry.triangles = gl.info.render.triangles
    const recorder = capture.current
    if (benchmark.requested !== recorder.request) {
      recorder.request = benchmark.requested
      recorder.count = 0
      recorder.calls = 0
      recorder.triangles = 0
      benchmark.elapsed = 0
      benchmark.frames = 0
      benchmark.running = true
      benchmark.done = false
      benchmark.width = gl.domElement.clientWidth
      benchmark.height = gl.domElement.clientHeight
      benchmark.dpr = telemetry.dpr
      benchmark.quality = useWorld.getState().quality
    }
    if (benchmark.running) {
      benchmark.elapsed += delta
      benchmark.frames++
      if (recorder.count < recorder.frameTimes.length) recorder.frameTimes[recorder.count++] = delta * 1000
      recorder.calls += telemetry.drawCalls
      recorder.triangles += telemetry.triangles
      if (benchmark.elapsed >= 10) {
        const sorted = recorder.frameTimes.slice(0, recorder.count).sort()
        benchmark.averageFps = benchmark.frames / benchmark.elapsed
        benchmark.p95Ms = sorted[Math.floor(sorted.length * 0.95)]
        benchmark.p99Ms = sorted[Math.floor(sorted.length * 0.99)]
        benchmark.drawCalls = Math.round(recorder.calls / benchmark.frames)
        benchmark.triangles = Math.round(recorder.triangles / benchmark.frames)
        benchmark.running = false
        benchmark.done = true
      }
    }
    gl.info.reset()
    if (sample.seconds < 1) return
    telemetry.fps = Math.round(sample.frames / sample.seconds)
    telemetry.frameMs = sample.seconds * 1000 / sample.frames
    sample.slow = telemetry.fps < 43 ? sample.slow + 1 : 0
    const adjustment = useWorld.getState().autoQuality ? adaptQuality(telemetry.fps, sample.slow, sample.elapsed, sample.dpr, useWorld.getState().quality) : null
    if (adjustment) {
      sample.dpr = adjustment.dpr
      telemetry.dpr = adjustment.dpr
      telemetry.qualityChanges++
      useWorld.setState({ renderDpr: adjustment.dpr, quality: adjustment.quality })
      sample.slow = 0
    }
    sample.seconds = 0
    sample.frames = 0
  })
  return null
}

export function WorldCanvas() {
  const quality = useWorld((s) => s.quality)
  const mode = useWorld((s) => s.mode)
  const renderDpr = useWorld((s) => s.renderDpr)
  return <Canvas shadows={QUALITY[quality].shadow > 0 ? 'percentage' : false} dpr={renderDpr}
    camera={{ position: VIEWS.city.position, fov: 43, near: 0.1, far: 1400 }}
    gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => { gl.toneMapping = ACESFilmicToneMapping; gl.toneMappingExposure = 1.0; gl.shadowMap.type = PCFShadowMap }}>
    <Suspense fallback={null}>
      <Environment />
      <Terrain />
      <Architecture />
      <Gardens />
      <Signage />
      <Skyline />
      <Animation />
      <CameraRig />
      <Monitor />
      <Suspense fallback={null}>{mode === 'walk' && <WalkPhysics />}</Suspense>
      <Effects />
    </Suspense>
  </Canvas>
}
