import { useMemo } from 'react'
import { Batch, Part, type Instance } from './primitives'
import { SEED, seeded } from '../lib/world'

export function Skyline() {
  const data = useMemo(() => {
    const random = seeded(SEED + 520)
    const buildings: Instance[] = []
    const tiers: Instance[] = []
    const windows: Instance[] = []
    const platforms: Instance[] = []
    const under: Instance[] = []
    for (let island = 0; island < 14; island++) {
      const a = -Math.PI * 0.48 + island / 13 * Math.PI * 1.05
      const distance = 135 + random() * 220
      const cx = Math.sin(a) * distance
      const cz = -Math.cos(a) * distance - 44
      const r = 12 + random() * 16
      const y = -5 + random() * 11
      platforms.push({ position: [cx, y, cz], scale: [r, 1.7, r] })
      under.push({ position: [cx, y - 9, cz], scale: [r * 0.8, 18, r * 0.8], rotation: [Math.PI, 0, 0] })
      for (let j = 0; j < 6 + Math.floor(random() * 5); j++) {
        const radius = random() * r * 0.72
        const angle = random() * Math.PI * 2
        const x = cx + Math.sin(angle) * radius
        const z = cz + Math.cos(angle) * radius
        const h = 7 + random() ** 1.1 * 26
        const width = 2.2 + random() * 2.3
        buildings.push({ position: [x, y + h / 2 + 1, z], scale: [width, h, width * 1.4] })
        tiers.push({ position: [x, y + h + 2, z], scale: [width * 0.7, 3, width] })
        for (let row = 2; row < h; row += 3.4) {
          if (random() > 0.25) windows.push({ position: [x, y + row, z + width * 0.71], scale: [width * 0.55, 0.16, 0.07] })
        }
      }
    }
    return { buildings, tiers, windows, platforms, under }
  }, [])
  return <group>
    <Batch items={data.platforms} shape="lowCylinder" surface="dark" />
    <Batch items={data.under} shape="cone" surface="dark" />
    <Batch items={data.buildings} surface="dark" />
    <Batch items={data.tiers} surface="metal" />
    <Batch items={data.windows} surface="warm" />
    {/* An orbital transit arc gives distant silhouettes a shared scale. */}
    <group position={[0, -5, -160]} rotation={[Math.PI / 2, 0.07, 0]}>
      <Part shape="torus" surface="metal" scale={[123, 80, 1.8]} />
      <Part shape="torus" surface="cyan" scale={[123, 80, 0.25]} position={[0, 0, 0.12]} />
    </group>
  </group>
}
