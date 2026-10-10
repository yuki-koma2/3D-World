import { create } from 'zustand'
import { QUALITY, type Quality, type View } from '../lib/world'

interface WorldState {
  mode: 'orbit' | 'walk'
  walkActive: boolean
  walkReady: boolean
  dragLook: boolean
  view: View
  time: number
  light: number
  fog: number
  quality: Quality
  renderDpr: number
  autoQuality: boolean
  timeFlow: boolean
  resetId: number
  setMode: (mode: WorldState['mode']) => void
  setView: (view: View) => void
  setTime: (time: number) => void
  setLight: (light: number) => void
  setFog: (fog: number) => void
  setQuality: (quality: Quality) => void
  reset: () => void
}

export const useWorld = create<WorldState>((set) => ({
  mode: 'orbit', walkActive: false, walkReady: false, dragLook: false, view: 'city', time: 0.23, light: 1.0, fog: 0.42,
  quality: 'balanced', renderDpr: Math.min(devicePixelRatio, 1.25), autoQuality: true, timeFlow: false, resetId: 0,
  setMode: (mode) => set((s) => ({ mode, walkActive: false, dragLook: false, resetId: s.resetId + 1 })),
  setView: (view) => set((s) => ({ view, resetId: s.resetId + 1 })),
  setTime: (time) => set({ time: Math.max(0, Math.min(1, time)) }),
  setLight: (light) => set({ light: Math.max(0.2, Math.min(2, light)) }),
  setFog: (fog) => set({ fog: Math.max(0, Math.min(1, fog)) }),
  setQuality: (quality) => set({ quality, renderDpr: Math.min(devicePixelRatio, QUALITY[quality].dpr) }),
  reset: () => set((s) => ({ resetId: s.resetId + 1 })),
}))

export function startWalking() {
  const canvas = document.querySelector('canvas')
  if (!canvas) return
  canvas.tabIndex = 0
  canvas.focus()
  const fallback = () => { if (useWorld.getState().mode === 'walk') useWorld.setState({ walkActive: true, dragLook: true }) }
  try {
    if (!canvas.requestPointerLock) { fallback(); return }
    const result = canvas.requestPointerLock()
    result?.catch(fallback)
  } catch { fallback() }
}
