import { Physics } from '@react-three/rapier'
import { WalkController } from './WalkController'
import { CollisionWorld } from './CollisionWorld'

export default function WalkPhysics() {
  return <Physics gravity={[0, -15, 0]} timeStep={1 / 60}>
    <CollisionWorld />
    <WalkController />
  </Physics>
}
