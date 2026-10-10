import { useEffect, useRef } from 'react'
import { Leva, useControls } from 'leva'
import { useWorld } from '../state/world'
import { telemetry, benchmark, startBenchmark } from '../lib/world'

export function Diagnostics({ close }: { close: () => void }) {
  const output = useRef<HTMLOutputElement>(null!)
  const results = useRef<HTMLOutputElement>(null!)
  useControls('環境', () => ({
    環境光: { value: useWorld.getState().light, min: 0.2, max: 2, step: 0.05, onChange: (n: number) => useWorld.getState().setLight(n) },
    霧の濃さ: { value: useWorld.getState().fog, min: 0, max: 1, step: 0.01, onChange: (n: number) => useWorld.getState().setFog(n) },
  }), [])
  useEffect(() => {
    const render = () => {
      const pos = telemetry.player.map((n) => n.toFixed(2)).join(', ')
      const cam = telemetry.camera.map((n) => n.toFixed(2)).join(', ')
      output.current.textContent = `FPS: ${telemetry.fps}\nFrame: ${telemetry.frameMs.toFixed(2)} ms\nDraw calls: ${telemetry.drawCalls}\nTriangles: ${telemetry.triangles}\nDPR: ${telemetry.dpr.toFixed(2)}\nViewport: ${innerWidth} × ${innerHeight}\nMode: ${useWorld.getState().mode}\nCamera: ${cam}\nPlayer: ${pos}\nGrounded: ${telemetry.grounded}\nPointer lock: ${telemetry.locked}\nWalking: ${useWorld.getState().walkActive}\nFloor hit: ${telemetry.floorHit.map(n => n.toFixed(2)).join(", ")}\nNavigation: ${telemetry.navigation}\nTarget: ${telemetry.target.map(n => n.toFixed(2)).join(", ")}\nWaypoints: ${telemetry.waypoints}\nRoutes: ${telemetry.routeRequests} / Arrivals: ${telemetry.arrivals}\nLook: ${telemetry.yaw.toFixed(3)}, ${telemetry.pitch.toFixed(3)}\nRespawns: ${telemetry.respawns}\nFrames: ${telemetry.frames}\nDrone: ${telemetry.drones.map((n) => n.toFixed(2)).join(', ')}\nAuto quality: ${telemetry.qualityChanges}\nRenderer: ${telemetry.renderer}`
      results.current.textContent = benchmark.running ? `計測中: ${benchmark.elapsed.toFixed(1)} / 10秒` : benchmark.done ? `計測完了: ${benchmark.width} × ${benchmark.height}\nQuality: ${benchmark.quality} / DPR ${benchmark.dpr.toFixed(2)}\n平均: ${benchmark.averageFps.toFixed(1)} fps\np95: ${benchmark.p95Ms.toFixed(2)} ms\np99: ${benchmark.p99Ms.toFixed(2)} ms\n平均draw calls: ${benchmark.drawCalls}\n平均triangles: ${benchmark.triangles}\nFrames: ${benchmark.frames} / ${benchmark.elapsed.toFixed(2)}秒` : '10秒間の連続描画から測定します。'
    }
    render()
    const timer = setInterval(render, 500)
    return () => clearInterval(timer)
  }, [])
  return <aside className="diagnostics"><div className="panel-heading">描画情報<button className="close-button" onClick={close} aria-label="描画情報を閉じる">×</button></div><output aria-label="描画と操作の測定値" ref={output} /><button className="flow-button" onClick={startBenchmark}>10秒間の性能を計測</button><output className="benchmark-result" aria-label="性能計測結果" ref={results} />{import.meta.env.DEV && <button className="flow-button" onClick={() => window.__AETHER__?.testFall?.()}>落下復帰を検証</button>}<Leva hidden={!new URLSearchParams(location.search).has('debug')} collapsed titleBar={{ title: 'Aether / 環境' }} /></aside>
}
