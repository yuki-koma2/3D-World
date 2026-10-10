import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useWorld } from '../state/world'

export function Effects() {
  const quality = useWorld((s) => s.quality)
  if (quality === 'low') return null
  return <EffectComposer multisampling={quality === 'high' ? 4 : 2}>
    <Bloom mipmapBlur intensity={0.27} luminanceThreshold={1.7} luminanceSmoothing={0.45} levels={6} />
    <Vignette eskil={false} offset={0.22} darkness={0.36} />
  </EffectComposer>
}
