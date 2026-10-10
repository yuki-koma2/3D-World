import { useCallback, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useBeforePhysicsStep, useRapier, type RapierRigidBody } from '@react-three/rapier'
import { Euler, Vector3 } from 'three'
import { useWorld, startWalking } from '../state/world'
import { telemetry, VIEWS } from '../lib/world'

export function WalkController() {
  const body = useRef<RapierRigidBody>(null!)
  const { camera, gl } = useThree()
  const { world, rapier } = useRapier()
  const view = useWorld((s) => s.view)
  const resetId = useWorld((s) => s.resetId)
  const input = useRef({ forward: false, back: false, left: false, right: false, sprint: false, jump: false, locked: false, dragging: false, yaw: 0, pitch: 0 })
  const scratch = useRef({ direction: new Vector3(), side: new Vector3(), forward: new Vector3(), rotation: new Euler(0, 0, 0, 'YXZ'), velocity: { x: 0, y: 0, z: 0 }, origin: { x: 0, y: 0, z: 0 }, spawn: { x: 0, y: 1.15, z: 18 }, ray: new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }) })
  const resetKeys = useCallback(() => {
    Object.assign(input.current, { forward: false, back: false, left: false, right: false, sprint: false, jump: false })
  }, [])
  const respawn = useCallback(() => {
    if (!body.current) return
    const preset = VIEWS[useWorld.getState().view]
    const spawn = scratch.current.spawn
    spawn.x = preset.walk[0]
    spawn.y = 1.1
    spawn.z = preset.walk[2]
    body.current.setTranslation(spawn, true)
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    const dx = preset.target[0] - spawn.x
    const dz = preset.target[2] - spawn.z
    input.current.yaw = Math.atan2(-dx, -dz)
    input.current.pitch = 0.035
    telemetry.respawns++
  }, [])

  useEffect(() => { respawn() }, [view, resetId, respawn])
  useEffect(() => {
    useWorld.setState({ walkReady: true })
    const keys: Record<string, 'forward' | 'back' | 'left' | 'right' | 'sprint' | 'jump'> = { KeyW: 'forward', KeyS: 'back', KeyA: 'left', KeyD: 'right', ShiftLeft: 'sprint', ShiftRight: 'sprint', Space: 'jump' }
    const keydown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') { useWorld.setState({ walkActive: false }); resetKeys(); return }
      if (!useWorld.getState().walkActive || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
      if (event.code === 'KeyR') { respawn(); return }
      const key = keys[event.code]
      if (key) { event.preventDefault(); input.current[key] = true }
    }
    const keyup = (event: KeyboardEvent) => { const key = keys[event.code]; if (key) input.current[key] = false }
    const mouse = (event: MouseEvent) => {
      if (!input.current.locked && !(useWorld.getState().walkActive && input.current.dragging)) return
      input.current.yaw -= event.movementX * 0.002
      input.current.pitch = Math.max(-1.25, Math.min(1.25, input.current.pitch - event.movementY * 0.002))
    }
    const lockchange = () => {
      input.current.locked = document.pointerLockElement === gl.domElement
      telemetry.locked = input.current.locked
      useWorld.setState({ walkActive: input.current.locked, dragLook: false })
      resetKeys()
    }
    const lockerror = () => { useWorld.setState({ walkActive: true, dragLook: true }) }
    const click = () => { if (useWorld.getState().mode === 'walk' && !useWorld.getState().walkActive) startWalking() }
    const mousedown = (event: MouseEvent) => { if (event.target === gl.domElement) input.current.dragging = true }
    const mouseup = () => { input.current.dragging = false }
    const blur = () => { resetKeys() }
    const visibility = () => { if (document.hidden) resetKeys() }
    document.addEventListener('keydown', keydown)
    document.addEventListener('keyup', keyup)
    document.addEventListener('mousemove', mouse)
    document.addEventListener('pointerlockchange', lockchange)
    document.addEventListener('pointerlockerror', lockerror)
    document.addEventListener('mousedown', mousedown)
    document.addEventListener('mouseup', mouseup)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('blur', blur)
    gl.domElement.addEventListener('click', click)
    lockchange()
    if (window.__AETHER__ && import.meta.env.DEV) {
      window.__AETHER__.testFall = () => body.current?.setTranslation({ x: 100, y: -39, z: 100 }, true)
    }
    return () => {
      useWorld.setState({ walkReady: false })
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('keyup', keyup)
      document.removeEventListener('mousemove', mouse)
      document.removeEventListener('pointerlockchange', lockchange)
      document.removeEventListener('pointerlockerror', lockerror)
      document.removeEventListener('mousedown', mousedown)
      document.removeEventListener('mouseup', mouseup)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('blur', blur)
      gl.domElement.removeEventListener('click', click)
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock()
      telemetry.locked = false
      resetKeys()
      if (window.__AETHER__) delete window.__AETHER__.testFall
    }
  }, [gl, resetKeys, respawn])

  useBeforePhysicsStep(() => {
    if (!body.current) return
    const state = input.current
    const temp = scratch.current
    const position = body.current.translation()
    if (position.y < -32 || Math.abs(position.x) > 150 || Math.abs(position.z) > 160) { respawn(); return }
    temp.origin.x = position.x
    temp.origin.y = position.y - 0.76
    temp.origin.z = position.z
    temp.ray.origin = temp.origin
    const hit = world.castRay(temp.ray, 0.26, false, undefined, undefined, undefined, body.current)
    const grounded = hit !== null && hit.timeOfImpact < 0.25
    telemetry.grounded = grounded
    temp.forward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw))
    temp.side.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw))
    temp.direction.set(0, 0, 0)
    if (useWorld.getState().walkActive) {
      if (state.forward) temp.direction.add(temp.forward)
      if (state.back) temp.direction.sub(temp.forward)
      if (state.right) temp.direction.add(temp.side)
      if (state.left) temp.direction.sub(temp.side)
    }
    temp.direction.normalize().multiplyScalar(state.sprint ? 9.2 : 4.4)
    const current = body.current.linvel()
    temp.velocity.x = current.x + (temp.direction.x - current.x) * (grounded ? 0.25 : 0.08)
    temp.velocity.z = current.z + (temp.direction.z - current.z) * (grounded ? 0.25 : 0.08)
    temp.velocity.y = current.y
    if (state.jump && grounded && useWorld.getState().walkActive) { temp.velocity.y = 6.0; state.jump = false }
    body.current.setLinvel(temp.velocity, true)
  })

  useFrame(() => {
    if (!body.current) return
    const position = body.current.translation()
    camera.position.set(position.x, position.y + 0.69, position.z)
    scratch.current.rotation.set(input.current.pitch, input.current.yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(scratch.current.rotation)
    telemetry.player[0] = position.x
    telemetry.player[1] = position.y
    telemetry.player[2] = position.z
  })

  return <RigidBody ref={body} type="dynamic" colliders={false} position={[0, 1.1, 18]} enabledRotations={[false, false, false]} mass={1} canSleep={false} ccd linearDamping={0} friction={0} restitution={0}>
    <CapsuleCollider args={[0.5, 0.35]} />
  </RigidBody>
}
