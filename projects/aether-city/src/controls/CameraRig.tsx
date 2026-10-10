import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Vector3, PerspectiveCamera } from 'three'
import { useWorld } from '../state/world'
import { VIEWS } from '../lib/world'

export function CameraRig() {
  const { camera } = useThree()
  const mode = useWorld((s) => s.mode)
  const view = useWorld((s) => s.view)
  const resetId = useWorld((s) => s.resetId)
  const controls = useRef<OrbitControlsImpl>(null!)
  const target = useRef(new Vector3())

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov = mode === 'walk' ? 66 : VIEWS[view].fov
      camera.updateProjectionMatrix()
    }
    if (mode !== 'orbit') return
    const preset = VIEWS[view]
    camera.position.set(...preset.position)
    camera.lookAt(...preset.target)
    target.current.set(...preset.target)
    if (controls.current) {
      controls.current.target.copy(target.current)
      controls.current.update()
    }
  }, [camera, mode, view, resetId])

  return mode === 'orbit' ? <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.07}
    minDistance={5} maxDistance={225} maxPolarAngle={Math.PI * 0.515} target={VIEWS[view].target}
    enablePan rotateSpeed={0.52} zoomSpeed={0.8} /> : null
}
