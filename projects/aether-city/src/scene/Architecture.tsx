import { useMemo } from 'react'
import { CylinderGeometry, ExtrudeGeometry, Path, Shape } from 'three'
import { Batch, Part, materials, type Instance } from './primitives'
import { SEED, seeded, type Vec3 } from '../lib/world'

function makeArch() {
  const shape = new Shape()
  shape.moveTo(-4.8, 0)
  shape.lineTo(-4.8, 6)
  shape.quadraticCurveTo(-4.8, 11, 0, 12)
  shape.quadraticCurveTo(4.8, 11, 4.8, 6)
  shape.lineTo(4.8, 0)
  shape.closePath()
  const hole = new Path()
  hole.moveTo(-3.3, 0.01)
  hole.lineTo(3.3, 0.01)
  hole.lineTo(3.3, 5.7)
  hole.quadraticCurveTo(3.3, 8.9, 0, 9.8)
  hole.quadraticCurveTo(-3.3, 8.9, -3.3, 5.7)
  hole.closePath()
  shape.holes.push(hole)
  return new ExtrudeGeometry(shape, { depth: 1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.12, bevelThickness: 0.12, curveSegments: 16 })
}

function Spire() {
  const core = useMemo(() => new CylinderGeometry(3.0, 6.2, 40, 8), [])
  const crown = useMemo(() => new CylinderGeometry(0.6, 3.4, 10, 8), [])
  const podium = useMemo(() => new CylinderGeometry(8.2, 8.8, 6.5, 8), [])
  const arch = useMemo(makeArch, [])
  const details = useMemo(() => {
    const random = seeded(SEED)
    const ribs: Instance[] = []
    const bands: Instance[] = []
    const windows: Instance[] = []
    const lit: Instance[] = []
    for (let face = 0; face < 8; face++) {
      const a = face * Math.PI / 4 + Math.PI / 8
      for (let row = 0; row < 25; row++) {
        const y = 10.6 + row * 1.48
        const radius = (6.2 - (y - 9.5) * 0.08) * Math.cos(Math.PI / 8)
        const width = 2 * radius * Math.tan(Math.PI / 8) - 0.3
        bands.push({ position: [Math.sin(a) * radius, y - 0.54, Math.cos(a) * radius], scale: [width, 0.16, 0.18], rotation: [0, a, 0] })
        for (let column = 0; column < 4; column++) {
          const offset = (column - 1.5) * width / 4
          const data = { position: [Math.sin(a) * (radius + 0.075) + Math.cos(a) * offset, y, Math.cos(a) * (radius + 0.075) - Math.sin(a) * offset] as Vec3, scale: [width / 4 - 0.1, 0.53, 0.035] as Vec3, rotation: [0, a, 0] as Vec3 }
          if (random() > 0.54) lit.push(data)
          else windows.push(data)
        }
      }
      const edge = face * Math.PI / 4
      const r = 4.82
      ribs.push({ position: [Math.sin(edge) * r, 29, Math.cos(edge) * r], scale: [0.4, 40.4, 0.55], rotation: [-Math.cos(edge) * 0.079, edge, Math.sin(edge) * 0.079] })
    }
    return { ribs, bands, windows, lit }
  }, [])
  return <group position={[0, 0, -6]}>
    {/* Art-deco podium, hollow entry arch and a tapering eight-sided facade. */}
    <Part shape="lowCylinder" surface="bronze" position={[0, 0.35, 0]} scale={[10.4, 0.7, 10.4]} receiveShadow />
    <Part shape="lowCylinder" surface="ivory" position={[0, 0.95, 0]} scale={[9.5, 0.5, 9.5]} receiveShadow />
    <mesh geometry={podium} material={materials.dark} position={[0, 4.65, 0]} castShadow receiveShadow />
    <Part shape="lowCylinder" surface="metal" position={[0, 8.05, 0]} scale={[8.6, 0.5, 8.6]} castShadow />
    <Part shape="lowCylinder" surface="warm" position={[0, 8.38, 0]} scale={[8.45, 0.1, 8.45]} />
    <Part shape="lowCylinder" surface="ivory" position={[0, 8.7, 0]} scale={[7.55, 0.5, 7.55]} />
    <mesh geometry={core} material={materials.glass} position={[0, 29.5, 0]} castShadow />
    <Batch items={details.ribs} surface="ivory" castShadow />
    <Batch items={details.bands} surface="metal" />
    <Batch items={details.windows} surface="glassLight" />
    <Batch items={details.lit} surface="warm" />
    {[17, 28.5, 40, 49.6].map((y, index) => <group key={y} position={[0, y, 0]}>
      <Part shape="lowCylinder" surface="ivory" scale={[6.6 - index * 0.95, 0.42, 6.6 - index * 0.95]} />
      <Part shape="torus" surface="cyan" position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[6.7 - index * 0.95, 6.7 - index * 0.95, 0.16]} />
    </group>)}
    <mesh geometry={crown} material={materials.metal} position={[0, 55, 0]} castShadow />
    <Part shape="cylinder" surface="bronze" position={[0, 62, 0]} scale={[0.15, 9, 0.15]} />
    <Part shape="sphere" surface="cyan" position={[0, 66.6, 0]} scale={[0.22, 0.22, 0.22]} />
    <group position={[0, 45.5, 0]} rotation={[0.2, 0, -0.22]}>
      <Part shape="torus" surface="ivory" scale={[11.7, 11.7, 11.7]} rotation={[Math.PI / 2, 0, 0]} />
      <Part shape="torus" surface="cyan" scale={[11.75, 11.75, 0.8]} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <Part shape="torus" surface="bronze" scale={[11.25, 11.25, 4]} rotation={[Math.PI / 2, 0, 0]} />
      {[-1, 1].map((sign) => <Part key={sign} surface="metal" scale={[19, 0.2, 0.24]} rotation={[0, sign * Math.PI / 4, 0]} />)}
    </group>
    <mesh geometry={arch} material={materials.ivory} position={[0, 0, 8.2]} castShadow receiveShadow />
    <mesh geometry={arch} material={materials.bronze} position={[0, 0, 6.8]} scale={[0.94, 0.95, 1]} />
    <Part surface="glass" position={[0, 3.4, 6.6]} scale={[6.1, 6.3, 0.14]} />
    <Part surface="warm" position={[0, 3.2, 6.72]} scale={[0.045, 6, 0.03]} />
    <Part surface="warm" position={[0, 7.5, 9.3]} scale={[3.8, 0.05, 0.06]} />
    <pointLight position={[0, 4, 9]} color="#ffd1a0" intensity={38} distance={14} decay={2} />
    {[-1, 1].map((sign) => <group key={sign} position={[sign * 10.4, 0, -1.8]}>
      <Part surface="dark" position={[0, 7.4, 0]} scale={[5.4, 14.8, 7.6]} castShadow receiveShadow />
      <Part surface="glass" position={[0, 9.6, 0]} scale={[4.9, 8, 7.65]} />
      {[3, 5, 7, 9, 11, 13].map((y) => <group key={y}>
        <Part surface="ivory" position={[0, y, 0]} scale={[5.8, 0.18, 8]} />
        <Part surface="warm" position={[0, y + 0.15, 4.01]} scale={[4.4, 0.045, 0.045]} />
      </group>)}
      {[-1, 1].map((edge) => <Part key={edge} surface="ivory" position={[edge * 2.5, 7.5, 3.9]} scale={[0.38, 15, 0.45]} castShadow />)}
      <Part surface="ivory" position={[0, 15.2, 0]} scale={[6, 0.65, 8.2]} rotation={[0, 0, sign * -0.09]} />
      <Part surface="moss" position={[0, 15.65, 0]} scale={[5.1, 0.2, 6.3]} />
    </group>)}
  </group>
}

export function Tower({ position, height = 22, radius = 3.5, seed = 1 }: { position: Vec3; height?: number; radius?: number; seed?: number }) {
  const shell = useMemo(() => new CylinderGeometry(radius * 0.72, radius, height, 8), [radius, height])
  const rows = useMemo(() => {
    const random = seeded(SEED + seed)
    const warm: Instance[] = []
    const metal: Instance[] = []
    for (let row = 1; row < height / 1.4; row++) {
      const y = row * 1.4
      const r = (radius * (1 - y / height * 0.28)) * Math.cos(Math.PI / 8)
      for (let side = 0; side < 8; side++) {
        const a = side * Math.PI / 4 + Math.PI / 8
        metal.push({ position: [Math.sin(a) * r, y, Math.cos(a) * r], scale: [r * 0.83, 0.13, 0.11], rotation: [0, a, 0] })
        if (random() > 0.36) warm.push({ position: [Math.sin(a) * (r + 0.08), y + 0.32, Math.cos(a) * (r + 0.08)], scale: [r * 0.62, 0.3, 0.03], rotation: [0, a, 0] })
      }
    }
    return { warm, metal }
  }, [height, radius, seed])
  return <group position={position}>
    <Part shape="lowCylinder" surface="ivory" position={[0, 0.3, 0]} scale={[radius + 0.7, 0.6, radius + 0.7]} />
    <mesh geometry={shell} material={materials.glass} position={[0, height / 2 + 0.6, 0]} castShadow />
    <Batch items={rows.metal} surface="metal" />
    <Batch items={rows.warm} surface="warm" />
    <Part shape="lowCylinder" surface="ivory" position={[0, height + 0.6, 0]} scale={[radius * 0.84, 0.55, radius * 0.84]} />
    <Part shape="torus" surface="cyan" position={[0, height + 0.87, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[radius * 0.8, radius * 0.8, 0.25]} />
    <Part shape="cone" surface="metal" position={[0, height + 2.8, 0]} scale={[radius * 0.65, 4, radius * 0.65]} />
    <Part shape="cylinder" surface="warm" position={[0, height + 5.4, 0]} scale={[0.06, 2, 0.06]} />
  </group>
}

function Pavilion({ position, radius = 5.2, height = 5.4 }: { position: Vec3; radius?: number; height?: number }) {
  const ribs = useMemo(() => {
    const data: Instance[] = []
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * Math.PI * 2
      data.push({ position: [Math.sin(a) * (radius - 0.3), height / 2, Math.cos(a) * (radius - 0.3)], scale: [0.1, height, 0.18], rotation: [0, a, 0] })
    }
    return data
  }, [height, radius])
  return <group position={position}>
    <Part shape="cylinder" surface="dark" position={[0, 0.22, 0]} scale={[radius + 0.4, 0.44, radius + 0.4]} receiveShadow />
    <Part shape="cylinder" surface="glassLight" position={[0, height / 2, 0]} scale={[radius - 0.4, height, radius - 0.4]} castShadow />
    <Batch items={ribs} surface="bronze" />
    <Part shape="cylinder" surface="ivory" position={[0, height, 0]} scale={[radius + 0.35, 0.22, radius + 0.35]} castShadow />
    <Part shape="torus" surface="warm" position={[0, height - 0.25, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[radius + 0.1, radius + 0.1, 0.45]} />
    <Part shape="dome" surface="glass" position={[0, height, 0]} scale={[radius * 0.9, radius * 0.36, radius * 0.9]} />
    <Part shape="torus" surface="metal" position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[radius * 0.9, radius * 0.9, 2]} />
  </group>
}

function Terrace() {
  const arc = useMemo(() => new CylinderGeometry(10.4, 10.4, 0.18, 64, 1, true, -Math.PI * 0.32, Math.PI * 1.65), [])
  const columns = useMemo(() => {
    const list: Instance[] = []
    for (let i = 0; i < 34; i++) {
      const a = -Math.PI * 0.32 + i / 33 * Math.PI * 1.65
      list.push({ position: [Math.sin(a) * 10.4, 0.66, Math.cos(a) * 10.4], scale: [0.08, 1.28, 0.08] })
    }
    return list
  }, [])
  return <group position={[49, 0, 7]}>
    <Part shape="cylinder" surface="ivory" position={[0, 0.055, 0]} scale={[9.6, 0.11, 9.6]} receiveShadow />
    <Part shape="torus" surface="bronze" position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 8, 0.2]} />
    <Part shape="torus" surface="warm" position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[9.15, 9.15, 0.15]} />
    <mesh geometry={arc} material={materials.bronze} position={[0, 1.25, 0]} />
    <Batch items={columns} surface="metal" />
    <Pavilion position={[2.2, 0, -3.4]} radius={3.5} height={3.3} />
    <group position={[-2.2, 0, 3.5]} rotation={[0, -0.4, 0]}>
      <Part shape="cylinder" surface="bronze" position={[0, 0.9, 0]} scale={[0.15, 1.8, 0.15]} />
      <Part shape="cylinder" surface="ivory" position={[0, 1.6, 0]} rotation={[Math.PI / 3, 0, 0]} scale={[0.3, 1.7, 0.3]} />
      <Part shape="cylinder" surface="glass" position={[0, 1.94, 0.4]} rotation={[Math.PI / 3, 0, 0]} scale={[0.32, 0.09, 0.32]} />
    </group>
    {[-1, 1].map((sign) => <group key={sign} position={[sign * 4, 0, 4]} rotation={[0, sign * -0.3, 0]}><Part surface="bronze" position={[0, 0.42, 0]} scale={[2.7, 0.22, 0.75]} /><Part surface="dark" position={[-0.85, 0.18, 0]} scale={[0.17, 0.36, 0.5]} /><Part surface="dark" position={[0.85, 0.18, 0]} scale={[0.17, 0.36, 0.5]} /></group>)}
    <pointLight color="#ffbb77" position={[0, 3, 2]} intensity={25} distance={16} />
  </group>
}

export function Architecture() {
  return <group>
    <Spire />
    <Pavilion position={[15, 0, 9]} radius={4.8} height={4.3} />
    <Tower position={[-11, 0, -14]} radius={3.0} height={23} seed={28} />
    <group position={[7, 0, -49]}>
      <Tower position={[-4.5, 0, 0]} height={29} radius={3.3} seed={61} />
      <Tower position={[4, 0, -4]} height={37} radius={3.1} seed={44} />
      <Pavilion position={[3, 0, 7]} height={4.8} radius={3.2} />
      <Part surface="metal" position={[0, 19, -1.7]} scale={[8, 0.6, 2.7]} />
      <Part surface="warm" position={[0, 19.3, -0.35]} scale={[8, 0.06, 0.08]} />
    </group>
    <Terrace />
  </group>
}
