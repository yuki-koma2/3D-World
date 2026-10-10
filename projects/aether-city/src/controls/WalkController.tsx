import { useCallback, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useBeforePhysicsStep, useRapier, type RapierRigidBody } from '@react-three/rapier'
import { Euler, Group, Raycaster, Vector2, Vector3 } from 'three'
import { useWorld } from '../state/world'
import { telemetry, VIEWS } from '../lib/world'
import { isWalkable, markerHeight, planRoute, type GroundPoint } from '../lib/navigation'

export function WalkController() {
  const body = useRef<RapierRigidBody>(null!)
  const hover = useRef<Group>(null!)
  const destination = useRef<Group>(null!)
  const { camera, gl } = useThree()
  const { world, rapier } = useRapier()
  const view = useWorld((s) => s.view)
  const resetId = useWorld((s) => s.resetId)
  const input = useRef({ forward: false, back: false, left: false, right: false, sprint: false, jump: false, yaw: 0, pitch: 0 })
  const route = useRef({ path: [] as GroundPoint[], index: 0, best: Infinity, stalled: 0 })
  const scratch = useRef({ direction: new Vector3(), side: new Vector3(), forward: new Vector3(), rotation: new Euler(0, 0, 0, 'YXZ'), velocity: { x: 0, y: 0, z: 0 }, origin: { x: 0, y: 0, z: 0 }, spawn: { x: 0, y: 1.15, z: 18 }, ray: new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }), pickRay: new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -1 }), raycaster: new Raycaster(), pointer: new Vector2() })
  const resetKeys = useCallback(() => {
    Object.assign(input.current, { forward: false, back: false, left: false, right: false, sprint: false, jump: false })
  }, [])
  const stopRoute = useCallback((message = '道路・広場・橋をクリックして移動') => {
    route.current.path = []
    telemetry.waypoints = 0
    telemetry.navigation = '待機'
    if (destination.current) destination.current.visible = false
    useWorld.setState({ walkMessage: message })
  }, [])
  const respawn = useCallback(() => {
    if (!body.current) return
    stopRoute(); resetKeys()
    const preset = VIEWS[useWorld.getState().view]
    const spawn = scratch.current.spawn
    spawn.x = preset.walk[0]; spawn.y = 1.1; spawn.z = preset.walk[2]
    body.current.setTranslation(spawn, true)
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    input.current.yaw = Math.atan2(-(preset.target[0] - spawn.x), -(preset.target[2] - spawn.z))
    input.current.pitch = 0.035
    if (hover.current) hover.current.visible = false
    useWorld.setState({ walkActive: true })
    telemetry.respawns++
  }, [stopRoute, resetKeys])

  useEffect(() => { respawn() }, [view, resetId, respawn])
  useEffect(() => {
    const canvas = gl.domElement
    canvas.tabIndex = 0
    canvas.style.cursor = 'grab'
    useWorld.setState({ walkReady: true, walkActive: true })
    const press = { active: false, dragged: false, id: -1, x: 0, y: 0, lastX: 0, lastY: 0 }
    const picked = { x: 0, z: 0 }
    // The closest physical hit must be a low, upward-facing floor. Buildings,
    // railings and pools cannot be clicked through to an invisible destination.
    const pick = (x: number, y: number): GroundPoint | null => {
      if (!body.current) return null
      const rect = canvas.getBoundingClientRect(), temp = scratch.current
      temp.pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2)
      temp.raycaster.setFromCamera(temp.pointer, camera)
      temp.pickRay.origin = temp.raycaster.ray.origin
      temp.pickRay.dir = temp.raycaster.ray.direction
      const hit = world.castRayAndGetNormal(temp.pickRay, 150, false, undefined, undefined, undefined, body.current)
      if (!hit) return null
      const ray = temp.raycaster.ray
      telemetry.floorHit[0] = ray.origin.x + ray.direction.x * hit.timeOfImpact
      telemetry.floorHit[1] = ray.origin.y + ray.direction.y * hit.timeOfImpact
      telemetry.floorHit[2] = ray.origin.z + ray.direction.z * hit.timeOfImpact
      if (hit.normal.y < 0.85) return null
      if (ray.origin.y + ray.direction.y * hit.timeOfImpact > 0.32) return null
      picked.x = ray.origin.x + ray.direction.x * hit.timeOfImpact
      picked.z = ray.origin.z + ray.direction.z * hit.timeOfImpact
      return isWalkable(picked) ? picked : null
    }
    const updateHover = (x: number, y: number) => {
      const point = pick(x, y)
      hover.current.visible = Boolean(point)
      if (point) hover.current.position.set(point.x, markerHeight(point), point.z)
      canvas.style.cursor = point ? 'pointer' : 'grab'
    }
    const moveTo = (x: number, y: number) => {
      const point = pick(x, y)
      if (!point) { useWorld.setState({ walkMessage: '道路・広場・橋の床を選んでください' }); return }
      const position = body.current.translation()
      const path = planRoute(position, point)
      if (!path) { useWorld.setState({ walkMessage: 'そこまでの経路が見つかりません。別の場所を選んでください' }); return }
      resetKeys()
      Object.assign(route.current, { path, index: 0, best: Infinity, stalled: 0 })
      telemetry.routeRequests++
      telemetry.target[0] = point.x; telemetry.target[1] = point.z
      telemetry.waypoints = path.length; telemetry.navigation = '移動中'
      destination.current.position.set(point.x, markerHeight(point) + 0.01, point.z)
      destination.current.visible = true
      useWorld.setState({ walkActive: true, walkMessage: '目的地へ移動中 · ESCで停止' })
    }
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return
      Object.assign(press, { active: true, dragged: false, id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY })
      canvas.focus({ preventScroll: true })
      canvas.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (!press.active) { updateHover(event.clientX, event.clientY); return }
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5) press.dragged = true
      if (press.dragged) {
        // Drag the scene with the pointer, as in Street View (reverse FPS look).
        input.current.yaw += (event.clientX - press.lastX) * 0.003
        input.current.pitch = Math.max(-1.25, Math.min(1.25, input.current.pitch + (event.clientY - press.lastY) * 0.003))
        hover.current.visible = false
        canvas.style.cursor = 'grabbing'
      }
      press.lastX = event.clientX; press.lastY = event.clientY
    }
    const up = (event: PointerEvent) => {
      if (!press.active || event.pointerId !== press.id) return
      press.active = false
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      if (!press.dragged) moveTo(event.clientX, event.clientY)
      updateHover(event.clientX, event.clientY)
    }
    const cancelPress = () => {
      if (press.active && canvas.hasPointerCapture(press.id)) canvas.releasePointerCapture(press.id)
      press.active = false; hover.current.visible = false; canvas.style.cursor = 'grab'
    }
    const keys: Record<string, 'forward' | 'back' | 'left' | 'right' | 'sprint' | 'jump'> = { KeyW: 'forward', KeyS: 'back', KeyA: 'left', KeyD: 'right', ShiftLeft: 'sprint', ShiftRight: 'sprint', Space: 'jump' }
    const keydown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return
      if (event.code === 'Escape') { stopRoute('移動を停止しました · 床をクリックすると再開'); resetKeys(); useWorld.setState({ walkActive: false }); return }
      if (event.code === 'KeyR') { respawn(); return }
      const key = keys[event.code]
      if (key) {
        event.preventDefault()
        if (['forward', 'back', 'left', 'right', 'jump'].includes(key)) { stopRoute(); useWorld.setState({ walkActive: true }) }
        input.current[key] = true
      }
    }
    const keyup = (event: KeyboardEvent) => { const key = keys[event.code]; if (key) input.current[key] = false }
    const blur = () => { resetKeys(); cancelPress(); stopRoute('移動を停止しました · 床をクリックすると再開') }
    const visibility = () => { if (document.hidden) blur() }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', cancelPress)
    const leave = () => { if (!press.active) hover.current.visible = false }
    canvas.addEventListener('pointerleave', leave)
    document.addEventListener('keydown', keydown)
    document.addEventListener('keyup', keyup)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('blur', blur)
    if (window.__AETHER__ && import.meta.env.DEV) window.__AETHER__.testFall = () => body.current?.setTranslation({ x: 100, y: -39, z: 100 }, true)
    return () => {
      useWorld.setState({ walkReady: false })
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', cancelPress)
      canvas.removeEventListener('pointerleave', leave)
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('keyup', keyup)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('blur', blur)
      cancelPress(); canvas.style.cursor = ''
      resetKeys(); stopRoute()
      if (window.__AETHER__) delete window.__AETHER__.testFall
    }
  }, [camera, gl, world, resetKeys, respawn, stopRoute])

  useBeforePhysicsStep(() => {
    if (!body.current) return
    const state = input.current, temp = scratch.current, nav = route.current
    const position = body.current.translation()
    if (position.y < -32 || Math.abs(position.x) > 150 || Math.abs(position.z) > 160) { respawn(); return }
    temp.origin.x = position.x; temp.origin.y = position.y - 0.76; temp.origin.z = position.z
    temp.ray.origin = temp.origin
    const hit = world.castRay(temp.ray, 0.26, false, undefined, undefined, undefined, body.current)
    const grounded = hit !== null && hit.timeOfImpact < 0.25
    telemetry.grounded = grounded
    temp.direction.set(0, 0, 0)
    if (useWorld.getState().walkActive && nav.path.length) {
      const goal = nav.path[nav.index]
      const dx = goal.x - position.x, dz = goal.z - position.z, distance = Math.hypot(dx, dz)
      if (distance < (nav.index === nav.path.length - 1 ? 0.12 : 0.18)) {
        nav.index++; nav.best = Infinity; nav.stalled = 0
        telemetry.waypoints = nav.path.length - nav.index
        if (nav.index >= nav.path.length) {
          nav.path = []; telemetry.navigation = '到着'; telemetry.arrivals++
          useWorld.setState({ walkMessage: '到着しました · 次の場所をクリックして探索' })
        }
      } else {
        temp.direction.set(dx, 0, dz).normalize().multiplyScalar(Math.min(4.4, distance * 5))
        if (distance < nav.best - 0.025) { nav.best = distance; nav.stalled = 0 } else nav.stalled++
        if (nav.stalled > 180) stopRoute('経路が塞がれています · 別の床をクリックしてください')
      }
    } else if (useWorld.getState().walkActive) {
      temp.forward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw))
      temp.side.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw))
      if (state.forward) temp.direction.add(temp.forward)
      if (state.back) temp.direction.sub(temp.forward)
      if (state.right) temp.direction.add(temp.side)
      if (state.left) temp.direction.sub(temp.side)
      temp.direction.normalize().multiplyScalar(state.sprint ? 9.2 : 4.4)
    }
    const current = body.current.linvel()
    temp.velocity.x = current.x + (temp.direction.x - current.x) * (grounded ? 0.25 : 0.08)
    temp.velocity.z = current.z + (temp.direction.z - current.z) * (grounded ? 0.25 : 0.08)
    temp.velocity.y = current.y
    if (state.jump && grounded && useWorld.getState().walkActive) { temp.velocity.y = 6; state.jump = false }
    body.current.setLinvel(temp.velocity, true)
  })
  useFrame(() => {
    if (!body.current) return
    const position = body.current.translation()
    camera.position.set(position.x, position.y + 0.69, position.z)
    scratch.current.rotation.set(input.current.pitch, input.current.yaw, 0, 'YXZ')
    camera.quaternion.setFromEuler(scratch.current.rotation)
    telemetry.player[0] = position.x; telemetry.player[1] = position.y; telemetry.player[2] = position.z
    telemetry.yaw = input.current.yaw; telemetry.pitch = input.current.pitch
  })
  return <>
    <RigidBody ref={body} type="dynamic" colliders={false} position={[0, 1.1, 18]} enabledRotations={[false, false, false]} mass={1} canSleep={false} ccd linearDamping={0} friction={0} restitution={0}><CapsuleCollider args={[0.5, 0.35]} /></RigidBody>
    <group ref={hover} visible={false} rotation={[-Math.PI / 2, 0, 0]}><mesh><ringGeometry args={[0.32, 0.4, 40]} /><meshBasicMaterial color="#b4e7d9" transparent opacity={0.8} depthWrite={false} /></mesh></group>
    <group ref={destination} visible={false} rotation={[-Math.PI / 2, 0, 0]}><mesh><ringGeometry args={[0.48, 0.58, 48]} /><meshBasicMaterial color="#f3c879" depthWrite={false} /></mesh><mesh><circleGeometry args={[0.12, 24]} /><meshBasicMaterial color="#f3c879" /></mesh></group>
  </>
}
