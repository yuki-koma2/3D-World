import { create } from 'zustand'
import { QUALITY, type Quality, type View } from '../lib/world'

interface WorldState {
  mode: 'orbit' | 'walk'
  walkActive: boolean
  walkReady: boolean
  walkMessage: string
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
  mode: 'orbit', walkActive: false, walkReady: false, walkMessage: '道路・広場・橋をクリックして移動', view: 'city', time: 0.23, light: 1.0, fog: 0.42,
  quality: 'balanced', renderDpr: Math.min(devicePixelRatio, 1.25), autoQuality: true, timeFlow: false, resetId: 0,
  setMode: (mode) => set((s) => ({ mode, walkActive: mode === 'walk', resetId: s.resetId + 1 })),
  setView: (view) => set((s) => ({ view, resetId: s.resetId + 1 })),
  setTime: (time) => set({ time: Math.max(0, Math.min(1, time)) }),
  setLight: (light) => set({ light: Math.max(0.2, Math.min(2, light)) }),
  setFog: (fog) => set({ fog: Math.max(0, Math.min(1, fog)) }),
  setQuality: (quality) => set({ quality, renderDpr: Math.min(devicePixelRatio, QUALITY[quality].dpr) }),
  reset: () => set((s) => ({ resetId: s.resetId + 1 })),
}))
