import { useMemo } from 'react'
import { CylinderGeometry } from 'three'
import { ISLANDS, BRIDGES, BRIDGE_FLOOR, GARDEN_RAMP, bridgeTransform, type Vec3 } from '../lib/world'
import { Part, Batch, materials, type Instance } from './primitives'

function Island({ position, radius, depth }: { position: Vec3; radius: number; depth: number }) {
  const hull = useMemo(() => new CylinderGeometry(radius * 0.99, radius * 0.22, depth, 64, 4), [radius, depth])
  const ribs = useMemo(() => {
    const parts: Instance[] = []
    for (let i = 0; i < 36; i++) {
      const a = i / 36 * Math.PI * 2
      parts.push({ position: [Math.sin(a) * radius * 0.86, -3.4, Math.cos(a) * radius * 0.86], scale: [0.36, 5.3, 0.5], rotation: [0, a, Math.sin(a) * 0.1] })
    }
    return parts
  }, [radius])
  return <group position={position}>
    <mesh geometry={hull} material={materials.dark} position={[0, -depth / 2 - 1.2, 0]} castShadow receiveShadow />
    <Part shape="cylinder" surface="stone" position={[0, -0.45, 0]} scale={[radius, 0.9, radius]} receiveShadow />
    <Part shape="cylinder" surface="metal" position={[0, -1.2, 0]} scale={[radius + 0.25, 0.6, radius + 0.25]} />
    <Part shape="cylinder" surface="dark" position={[0, -2.15, 0]} scale={[radius * 0.96, 1.1, radius * 0.96]} />
    <Part shape="torus" surface="cyan" position={[0, -1.48, 0]} scale={[radius + 0.2, radius + 0.2, 0.13]} rotation={[Math.PI / 2, 0, 0]} />
    <Part shape="torus" surface="bronze" position={[0, -3, 0]} scale={[radius * 0.94, radius * 0.94, 0.45]} rotation={[Math.PI / 2, 0, 0]} />
    <Part shape="torus" surface="warm" position={[0, -depth * 0.68, 0]} scale={[radius * 0.47, radius * 0.47, 0.15]} rotation={[Math.PI / 2, 0, 0]} />
    <Part shape="cylinder" surface="metal" position={[0, -depth - 1.3, 0]} scale={[radius * 0.25, 1.7, radius * 0.25]} />
    <Part shape="cylinder" surface="cyan" position={[0, -depth - 2.2, 0]} scale={[radius * 0.16, 0.12, radius * 0.16]} />
    <Batch items={ribs} surface="metal" />
    <Part shape="torus" surface="bronze" position={[0, 0.025, 0]} scale={[radius - 1.2, radius - 1.2, 0.5]} rotation={[Math.PI / 2, 0, 0]} />
  </group>
}

function Bridge({ start, end, width }: { start: Vec3; end: Vec3; width: number }) {
  const { position, length, angle } = bridgeTransform(start, end)
  const posts = useMemo(() => {
    const data: Instance[] = []
    for (let z = -length / 2; z <= length / 2; z += 1.8) {
      for (const x of [-width / 2, width / 2]) data.push({ position: [x, 0.7, z], scale: [0.11, 1.5, 0.11] })
    }
    return data
  }, [length, width])
  return <group position={position} rotation={[0, angle, 0]}>
    <Part surface="ivory" position={[0, BRIDGE_FLOOR - 0.25, 0]} scale={[width, 0.5, length]} receiveShadow />
    <Part surface="dark" position={[0, -1, 0]} scale={[width - 0.3, 1.1, length]} />
    {[-1, 1].map((sign) => <group key={sign}>
      <Part surface="metal" position={[sign * width / 2, 1.25, 0]} scale={[0.14, 0.12, length]} />
      <Part surface="warm" position={[sign * (width / 2 - 0.12), 0.07, 0]} scale={[0.08, 0.03, length]} />
      <Part surface="cyan" position={[sign * (width / 2 + 0.01), -0.68, 0]} scale={[0.07, 0.07, length]} />
    </group>)}
    <Batch items={posts} surface="bronze" />
    <Part surface="metal" rotation={[0, 0, 0.15]} position={[0, -2.7, 0]} scale={[0.25, 3, length * 0.95]} />
  </group>
}

export function Terrain() {
  return <group>
    <Part surface="stone" {...GARDEN_RAMP} receiveShadow />
    {ISLANDS.map((island) => <Island key={island.id} {...island} />)}
    {BRIDGES.map((bridge, i) => <Bridge key={i} {...bridge} />)}
  </group>
}
