import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import { BRIDGES, BRIDGE_FLOOR, ISLANDS, bridgeTransform } from '../lib/world'

export function CollisionWorld() {
  return <RigidBody type="fixed" colliders={false} friction={0.8}>
    {ISLANDS.map(({ id, position, radius }) => <CylinderCollider key={id} args={[0.5, radius]} position={[position[0], -0.5, position[2]]} />)}
    {BRIDGES.map((b, i) => {
      const { position, length, angle } = bridgeTransform(b.start, b.end)
      return <group key={i} position={position} rotation={[0, angle, 0]}>
        <CuboidCollider args={[b.width / 2, 0.25, length / 2]} position={[0, BRIDGE_FLOOR - 0.25, 0]} />
        {[-1, 1].map((s) => <CuboidCollider key={s} args={[0.11, 0.68, length / 2]} position={[s * b.width / 2, 0.68, 0]} />)}
      </group>
    })}
    <CylinderCollider args={[29, 6.05]} position={[0, 29, -6]} />
    <CuboidCollider args={[8, 4, 5.6]} position={[0, 4, -8.5]} />
    <CuboidCollider args={[3.05, 3.3, 0.15]} position={[0, 3.3, 0.6]} />
    {/* Arch piers preserve its open porch instead of using a solid bounding box. */}
    <CuboidCollider args={[0.8, 3.4, 1.05]} position={[-4.1, 3.4, 2.8]} />
    <CuboidCollider args={[0.8, 3.4, 1.05]} position={[4.1, 3.4, 2.8]} />
    <CuboidCollider args={[4.8, 1.5, 1.05]} position={[0, 10.5, 2.8]} />
    {[-1, 1].map((s) => <CuboidCollider key={s} args={[2.8, 7.6, 4]} position={[s * 10.4, 7.6, -7.8]} />)}
    <CylinderCollider args={[11.5, 3]} position={[-11, 11.5, -14]} />
    <CylinderCollider args={[2.15, 4.8]} position={[15, 2.15, 9]} />
    <CylinderCollider args={[14.5, 3.3]} position={[2.5, 14.5, -49]} />
    <CylinderCollider args={[18.5, 3.1]} position={[11, 18.5, -53]} />
    <CylinderCollider args={[2.4, 3.2]} position={[10, 2.4, -42]} />
    <CylinderCollider args={[1.65, 3.5]} position={[51.2, 1.65, 3.6]} />
    {[[-11.5, 10.5, 3.7], [-45, -17, 3.1]].map(([x, z, r]) => <CylinderCollider key={x} args={[0.22, r]} position={[x, 0.22, z]} />)}
    {/* Actual parapet gaps line up with the bridge on the observatory island. */}
    {Array.from({ length: 32 }, (_, i) => {
      const a = -Math.PI * 0.32 + (i + 0.5) / 32 * Math.PI * 1.65
      return <CuboidCollider key={i} args={[0.85, 0.64, 0.08]} position={[49 + Math.sin(a) * 10.4, 0.64, 7 + Math.cos(a) * 10.4]} rotation={[0, a, 0]} />
    })}
    {[[-18,7],[-9,17.5],[9,17],[18,-9],[-17,-6],[-50.5,-18.8],[-36,-18.8],[-48.2,-7.9],[-39.3,-6.8],[-42.7,-23.9]].map(([x,z]) => <CylinderCollider key={`${x}/${z}`} args={[2, 0.32]} position={[x, 2, z]} />)}
  </RigidBody>
}
