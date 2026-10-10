import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { Part } from './primitives'
import type { Vec3 } from '../lib/world'

function Sign({ position, rotation = 0, title, subtitle, width = 3.2 }: { position: Vec3; rotation?: number; title: string; subtitle: string; width?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 768
    canvas.height = 192
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#182e37'
    ctx.fillRect(0, 0, 768, 192)
    ctx.fillStyle = '#84d0c5'
    ctx.fillRect(0, 0, 9, 192)
    ctx.fillStyle = '#e6d4b3'
    ctx.font = '400 38px "Helvetica Neue", Arial, sans-serif'
    ctx.fillText(title, 40, 80)
    ctx.font = '23px "Hiragino Kaku Gothic ProN", sans-serif'
    ctx.fillStyle = '#9fb5b8'
    ctx.fillText(subtitle, 42, 138)
    const result = new CanvasTexture(canvas)
    result.colorSpace = SRGBColorSpace
    result.anisotropy = 4
    return result
  }, [title, subtitle])
  useEffect(() => () => texture.dispose(), [texture])
  return <group position={position} rotation={[0, rotation, 0]}>
    <Part surface="bronze" position={[0, -0.92, 0]} scale={[0.06, 1.84, 0.06]} />
    <Part surface="metal" position={[0, 0, -0.04]} scale={[width + 0.1, width / 4 + 0.1, 0.08]} />
    <mesh><planeGeometry args={[width, width / 4]} /><meshStandardMaterial map={texture} emissive="#a4bfad" emissiveMap={texture} emissiveIntensity={0.28} roughness={0.5} /></mesh>
  </group>
}

export function Signage() {
  return <group>
    <Sign position={[5.5, 1.85, 12]} rotation={-0.16} title="AETHER / 01" subtitle="スパイア ↑　スカイテラス →" />
    <Sign position={[-36.6, 1.8, -11.6]} rotation={1.13} title="BOTANICAL / 02" subtitle="エーテル庭園" width={2.7} />
    <Sign position={[45, 1.8, 11]} rotation={0.28} title="SKY TERRACE / 03" subtitle="街と空を望む場所" width={2.7} />
    <Sign position={[2, 1.8, -38.7]} rotation={Math.PI} title="LUMINA HARBOR / 04" subtitle="ルミナ・ハーバー" width={2.9} />
  </group>
}
