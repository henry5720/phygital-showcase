import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export async function loadGLB(
  url: string,
  envMap?: THREE.Texture,
): Promise<THREE.Group> {
  const loader = new GLTFLoader()
  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf),
      undefined,
      (error) => reject(error),
    )
  })

  if (envMap) {
    gltf.scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          for (const material of materials) {
            if ('envMap' in material) {
              ;(material as THREE.MeshStandardMaterial).envMap = envMap
              material.needsUpdate = true
            }
          }
        }
      }
    })
  }

  return gltf.scene
}
