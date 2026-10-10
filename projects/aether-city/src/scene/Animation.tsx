import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, BufferGeometry, Float32BufferAttribute, ShaderMaterial, AdditiveBlending } from 'three'
import { Part } from './primitives'
import { SEED, seeded, telemetry } from '../lib/world'

function Drone({ index }: { index: number }) {
  const drone = useRef<Group>(null!)
  const rotors = useRef<Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * (0.065 + index * 0.008) + index * 1.53
    const radius = 32 + index * 7
    drone.current.position.set(Math.cos(t) * radius + 7, 12 + Math.sin(t * 1.5) * 3 + index * 3.1, Math.sin(t) * radius * 0.64 - 7)
    drone.current.rotation.set(Math.sin(t * 2) * 0.04, -t - Math.PI / 2, Math.cos(t * 1.4) * 0.06)
    rotors.current.rotation.y = clock.elapsedTime * 18
    if (index === 0) {
      telemetry.drones[0] = drone.current.position.x
      telemetry.drones[1] = drone.current.position.y
      telemetry.drones[2] = drone.current.position.z
    }
  })
  return <group ref={drone} scale={index === 0 ? 0.95 : 0.8}>
    <Part shape="sphere" surface="ivory" scale={[0.95, 0.24, 0.43]} castShadow />
    <Part shape="sphere" surface="glass" position={[0, 0.04, -0.26]} scale={[0.53, 0.22, 0.3]} />
    <Part surface="metal" scale={[2.8, 0.08, 0.12]} />
    <Part surface="cyan" position={[0, -0.19, 0]} scale={[1.15, 0.06, 0.22]} />
    {[-1, 1].map((s) => <group key={s} position={[s * 1.26, 0.12, 0]}><Part shape="torus" surface="metal" rotation={[Math.PI / 2, 0, 0]} scale={[0.48, 0.48, 3.6]} /><Part shape="torus" surface="cyan" rotation={[Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} scale={[0.42, 0.42, 0.4]} /></group>)}
    <group ref={rotors}><Part surface="dark" position={[0, 0.17, 0]} scale={[2.7, 0.02, 0.06]} /><Part surface="dark" position={[0, 0.17, 0]} scale={[0.06, 0.02, 2.7]} /></group>
    <Part shape="sphere" surface="warm" position={[0, 0, -0.49]} scale={[0.08, 0.08, 0.04]} />
  </group>
}

function Sculpture() {
  const group = useRef<Group>(null!)
  useFrame(({ clock }) => {
    group.current.rotation.y = clock.elapsedTime * 0.14
    group.current.position.y = 3.4 + Math.sin(clock.elapsedTime * 0.7) * 0.1
  })
  return <group position={[-11.5, 0, 10.5]}>
    <Part shape="cylinder" surface="ivory" position={[0, 0.8, 0]} scale={[0.8, 1.6, 0.8]} />
    <Part shape="cylinder" surface="bronze" position={[0, 1.65, 0]} scale={[1.1, 0.18, 1.1]} />
    <group ref={group} position={[0, 3.4, 0]}>
      <Part shape="torus" surface="bronze" scale={[1.65, 1.65, 1.65]} rotation={[0.3, 0, 0.3]} />
      <Part shape="torus" surface="cyan" scale={[1.18, 1.18, 0.6]} rotation={[0.8, 1.2, 0.3]} />
      <Part shape="sphere" surface="metal" scale={[0.45, 0.45, 0.45]} />
    </group>
    <pointLight position={[0, 2.5, 0]} color="#6dd9da" intensity={14} distance={8} />
  </group>
}

function Fireflies() {
  const geo = useMemo(() => {
    const g = new BufferGeometry()
    const random = seeded(SEED + 399)
    const positions = new Float32Array(65 * 3)
    for (let i = 0; i < 65; i++) {
      positions[i * 3] = -43 + (random() - 0.5) * 18
      positions[i * 3 + 1] = 0.7 + random() * 4
      positions[i * 3 + 2] = -15 + (random() - 0.5) * 18
    }
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return g
  }, [])
  const material = useMemo(() => new ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `uniform float uTime; varying float vGlow; void main(){vec3 p=position;p.y+=sin(uTime*.5+position.x)*.24;p.x+=cos(uTime*.2+position.z)*.17;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(5.,40./-mv.z);vGlow=.4+.6*sin(uTime+position.x*9.);}`,
    fragmentShader: `varying float vGlow;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.85,1.,.73,(1.-smoothstep(.1,.5,d))*vGlow*.6);}`,
    transparent: true, blending: AdditiveBlending, depthWrite: false,
  }), [])
  useFrame(({ clock }) => { material.uniforms.uTime.value = clock.elapsedTime })
  return <points geometry={geo} material={material} />
}

export function Animation() {
  return <><Sculpture /><Fireflies />{[0, 1, 2, 3, 4].map((index) => <Drone key={index} index={index} />)}</>
}
