import { useLayoutEffect, useRef } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, ConeGeometry, MeshStandardMaterial, Color, Object3D, InstancedMesh, MeshPhysicalMaterial } from 'three'
import type { Vec3 } from '../lib/world'

export const geometry = {
  box: new BoxGeometry(1, 1, 1),
  cylinder: new CylinderGeometry(1, 1, 1, 48),
  lowCylinder: new CylinderGeometry(1, 1, 1, 12),
  sphere: new SphereGeometry(1, 16, 12),
  dome: new SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
  torus: new TorusGeometry(1, 0.025, 6, 72),
  cone: new ConeGeometry(1, 1, 12),
}

export const materials = {
  stone: new MeshStandardMaterial({ color: '#a4b0b0', roughness: 0.79, metalness: 0.15 }),
  ivory: new MeshStandardMaterial({ color: '#c9cebe', roughness: 0.52, metalness: 0.23 }),
  dark: new MeshStandardMaterial({ color: '#263944', roughness: 0.62, metalness: 0.55 }),
  metal: new MeshStandardMaterial({ color: '#6b8b92', roughness: 0.33, metalness: 0.78 }),
  bronze: new MeshStandardMaterial({ color: '#b58752', roughness: 0.38, metalness: 0.73 }),
  glass: new MeshPhysicalMaterial({ color: '#153d49', roughness: 0.15, metalness: 0.67, clearcoat: 1, clearcoatRoughness: 0.15 }),
  glassLight: new MeshPhysicalMaterial({ color: '#376976', roughness: 0.18, metalness: 0.55, clearcoat: 0.8 }),
  warm: new MeshStandardMaterial({ color: '#f2be77', emissive: '#ffb15d', emissiveIntensity: 2.7, toneMapped: false, roughness: 0.38 }),
  cyan: new MeshStandardMaterial({ color: '#89d8d0', emissive: '#58ded3', emissiveIntensity: 2.3, toneMapped: false, roughness: 0.35 }),
  water: new MeshPhysicalMaterial({ color: '#205b68', roughness: 0.12, metalness: 0.6, clearcoat: 1 }),
  moss: new MeshStandardMaterial({ color: '#334e47', roughness: 0.97 }),
  leaves: new MeshStandardMaterial({ color: '#427369', roughness: 0.88 }),
  foliage: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }),
  bark: new MeshStandardMaterial({ color: '#675b4b', roughness: 0.86 }),
  cloud: new MeshStandardMaterial({ color: '#d6b8b0', emissive: '#617a99', emissiveIntensity: 0.16, roughness: 1, flatShading: false, transparent: true, opacity: 0.15, depthWrite: false }),
}

export type Shape = keyof typeof geometry
export type Surface = keyof typeof materials
export function Part({ shape = 'box', surface = 'stone', ...props }: ThreeElements['mesh'] & { shape?: Shape; surface?: Surface }) {
  return <mesh geometry={geometry[shape]} material={materials[surface]} dispose={null} {...props} />
}

export interface Instance {
  position: Vec3
  scale: Vec3
  rotation?: Vec3
  color?: string
}

export function Batch({ items, shape = 'box', surface = 'stone', castShadow = false }: { items: Instance[]; shape?: Shape; surface?: Surface; castShadow?: boolean }) {
  const ref = useRef<InstancedMesh>(null!)
  useLayoutEffect(() => {
    const obj = new Object3D()
    const color = new Color()
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      obj.position.set(...item.position)
      obj.scale.set(...item.scale)
      obj.rotation.set(...(item.rotation ?? [0, 0, 0]))
      obj.updateMatrix()
      ref.current.setMatrixAt(i, obj.matrix)
      if (item.color) ref.current.setColorAt(i, color.set(item.color))
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [items])
  if (!items.length) return null
  return <instancedMesh ref={ref} args={[geometry[shape], materials[surface], items.length]} castShadow={castShadow} receiveShadow dispose={null} />
}
