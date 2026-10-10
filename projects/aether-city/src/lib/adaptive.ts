import type { Quality } from './world'

export function adaptQuality(fps: number, slowSeconds: number, elapsed: number, dpr: number, quality: Quality): { dpr: number; quality: Quality } | null {
  if (fps >= 43 || slowSeconds < 4 || elapsed < 8) return null
  if (dpr > 0.75) return { dpr: Math.max(0.75, Math.round((dpr - 0.2) * 100) / 100), quality }
  if (quality === 'high') return { dpr, quality: 'balanced' }
  if (quality === 'balanced') return { dpr, quality: 'low' }
  return null
}
