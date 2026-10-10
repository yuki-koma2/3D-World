import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, ShaderMaterial, BackSide, DirectionalLight, AmbientLight, HemisphereLight, FogExp2, PlaneGeometry } from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { PMREMGenerator } from 'three'
import { useWorld } from '../state/world'
import { materials, Batch, type Instance } from './primitives'
import { QUALITY, SEED, seeded, telemetry } from '../lib/world'

const noise = `
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
}
float fbm(vec2 p) {
  float v=0.; float a=.5;
  for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(1.6,-1.2,1.2,1.6)*p;a*=.5;}
  return v;
}`

const skyVertex = `varying vec3 vWorld; void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`
const skyFragment = `
uniform float uNight;
uniform float uClock;
varying vec3 vWorld;
${noise}
void main(){
  vec3 d=normalize(vWorld-cameraPosition);
  float h=max(d.y,0.0);
  vec3 horizon=mix(vec3(.77,.32,.16),vec3(.065,.11,.2),uNight);
  vec3 middle=mix(vec3(.24,.24,.36),vec3(.025,.05,.11),uNight);
  vec3 zenith=mix(vec3(.026,.09,.17),vec3(.008,.015,.05),uNight);
  vec3 col=mix(horizon,middle,smoothstep(0.,.17,h));
  col=mix(col,zenith,smoothstep(.12,.42,h));
  col=mix(col,mix(vec3(.29,.27,.37),vec3(.025,.05,.09),uNight),1.-smoothstep(-.22,0.,d.y));
  vec3 sun=normalize(vec3(-.78,.085,-.48));
  float alignment=dot(d,sun);
  float glow=pow(max(alignment,0.),15.);
  col+=vec3(.5,.23,.09)*glow*(1.-uNight)*.6;
  float disk=smoothstep(.9995,.9997,alignment);
  col=mix(col,vec3(1.,.8,.49),disk*(1.-smoothstep(.25,.8,uNight)));
  vec2 cloudUv=vec2(d.x*4.+d.z*2.,d.y*22.);
  float strands=fbm(cloudUv+vec2(uClock*.0007,0.));
  float streak=smoothstep(.53,.74,strands)*(1.-smoothstep(.18,.5,h));
  col=mix(col,mix(vec3(.83,.60,.51),vec3(.10,.15,.23),uNight),streak*.42);
  vec2 starUv=d.xz/(1.+max(d.y,0.))*1100.;
  float star=step(.9984,hash(floor(starUv)))*(1.-smoothstep(.07,.52,length(fract(starUv)-.5)))*smoothstep(.07,.4,h);
  col+=vec3(.64,.81,1.)*star*uNight*.7;
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const seaFragment = `
uniform float uNight;
uniform float uClock;
varying vec3 vWorld;
${noise}
void main(){
  vec2 p=vWorld.xz*.017;
  float n=fbm(p+vec2(uClock*.002,uClock*.0008));
  float fine=fbm(p*4.8+uClock*.001);
  float ridge=smoothstep(.25,.75,n);
  vec3 shaded=mix(vec3(.20,.22,.34),vec3(.04,.075,.14),uNight);
  vec3 lit=mix(vec3(.55,.41,.42),vec3(.12,.19,.28),uNight);
  vec3 col=mix(shaded,lit,ridge*.78+fine*.22);
  float dist=length(vWorld.xz-cameraPosition.xz);
  float fogAmount=1.-exp(-dist*.0028);
  col=mix(col,mix(vec3(.57,.37,.33),vec3(.055,.10,.18),uNight),fogAmount*.65);
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

export function Environment() {
  const { scene, gl } = useThree()
  const quality = useWorld((s) => s.quality)
  const sun = useRef<DirectionalLight>(null!)
  const ambient = useRef<AmbientLight>(null!)
  const hemisphere = useRef<HemisphereLight>(null!)
  const timeline = useRef({ time: 0.23, lastInput: 0.23 })
  const sky = useMemo(() => new ShaderMaterial({ vertexShader: skyVertex, fragmentShader: skyFragment, uniforms: { uNight: { value: 0 }, uClock: { value: 0 } }, side: BackSide, depthWrite: false }), [])
  const sea = useMemo(() => new ShaderMaterial({ vertexShader: `varying vec3 vWorld;uniform float uClock;${noise} void main(){vec3 p=position;vec4 world=modelMatrix*vec4(p,1.);world.y+=fbm(world.xz*.023+vec2(uClock*.0009,0.))*11.;vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`, fragmentShader: seaFragment, uniforms: { uNight: { value: 0 }, uClock: { value: 0 } }, depthWrite: true }), [])
  const seaGeometry = useMemo(() => new PlaneGeometry(1800, 1800, 160, 160), [])
  const clouds = useMemo(() => {
    const random = seeded(SEED + 77)
    const data: Instance[] = []
    for (let i = 0; i < QUALITY[quality].cloudCount / 5; i++) {
      const a = random() * Math.PI * 2
      const radius = 110 + random() * 260
      const size = 12 + random() * 13
      for (let puff = 0; puff < 5; puff++) {
        data.push({ position: [Math.cos(a) * radius + (random() - .5) * size * 1.5, -32 + random() * 10, Math.sin(a) * radius + (random() - .5) * size * 1.7], scale: [size * (.6 + random() * .6), 5 + random() * 7, size * (.6 + random() * .7)] })
      }
    }
    return data
  }, [quality])
  const colors = useMemo(() => ({ fogA: new Color('#ba989b'), fogB: new Color('#182f49'), cloudA: new Color('#9b9aae'), cloudB: new Color('#334f67') }), [])

  useEffect(() => {
    // Generate local image-based ambient lighting; no HDR download or external asset.
    const pmrem = new PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const result = pmrem.fromScene(room, 0.04)
    scene.environment = result.texture
    scene.environmentIntensity = 0.45
    room.dispose()
    pmrem.dispose()
    scene.fog = new FogExp2('#a48588', 0.002)
    return () => { scene.environment = null; result.dispose(); sky.dispose(); sea.dispose(); seaGeometry.dispose() }
  }, [gl, scene, sky, sea])

  useFrame(({ clock }, delta) => {
    const state = useWorld.getState()
    // Time flow is sampled by UI; avoid scheduling React renders every frame.
    if (state.time !== timeline.current.lastInput || !state.timeFlow) timeline.current.time = state.time
    timeline.current.lastInput = state.time
    if (state.timeFlow) timeline.current.time = Math.min(1, timeline.current.time + delta / 160)
    const night = timeline.current.time
    telemetry.time = night
    sky.uniforms.uNight.value = night
    sky.uniforms.uClock.value = clock.elapsedTime
    sea.uniforms.uNight.value = night
    sea.uniforms.uClock.value = clock.elapsedTime
    sun.current.intensity = (3.1 - night * 2.75) * state.light
    sun.current.color.setRGB(1, 0.69 + night * 0.07, 0.46 + night * 0.42)
    ambient.current.intensity = (0.45 - night * 0.2) * state.light
    hemisphere.current.intensity = (1.05 - night * 0.5) * state.light
    scene.environmentIntensity = (0.45 - night * 0.15) * state.light
    if (scene.fog instanceof FogExp2) {
      scene.fog.color.copy(colors.fogA).lerp(colors.fogB, night)
      scene.fog.density = state.fog * 0.0065
    }
    materials.cloud.color.copy(colors.cloudA).lerp(colors.cloudB, night)
    materials.warm.emissiveIntensity = (1.05 + night * 0.9) * (0.97 + Math.sin(clock.elapsedTime * 0.4) * 0.03)
    materials.cyan.emissiveIntensity = 1.35 + night * 0.75
  })

  return <>
    <mesh material={sky} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[700, 32, 16]} />
    </mesh>
    <mesh geometry={seaGeometry} material={sea} position={[0, -27, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-5} frustumCulled={false}>
    </mesh>
    <Batch shape="sphere" surface="cloud" items={clouds} />
    <ambientLight ref={ambient} color="#cbd5ec" intensity={0.45} />
    <hemisphereLight ref={hemisphere} args={['#97bfd0', '#5d4964', 0.9]} />
    <directionalLight ref={sun} position={[-90, 85, -50]} intensity={3.7} color="#ffc288"
      castShadow={QUALITY[quality].shadow > 0} shadow-mapSize={[QUALITY[quality].shadow || 512, QUALITY[quality].shadow || 512]}
      shadow-camera-left={-75} shadow-camera-right={75} shadow-camera-top={80} shadow-camera-bottom={-65}
      shadow-camera-near={1} shadow-camera-far={230} shadow-bias={-0.00045} shadow-normalBias={0.18} />
    <directionalLight position={[60, 50, 65]} color="#83c6da" intensity={0.85} />
  </>
}
