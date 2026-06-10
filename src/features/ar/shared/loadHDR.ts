import * as THREE from 'three'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'

export async function loadHDR(
  url: string,
  renderer: THREE.WebGLRenderer,
): Promise<THREE.Texture> {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  try {
    const loader = new HDRLoader()
    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(
        url,
        (loadedTexture) => {
          loadedTexture.mapping = THREE.EquirectangularReflectionMapping
          resolve(loadedTexture)
        },
        undefined,
        (error) => reject(error),
      )
    })

    const envMap = pmremGenerator.fromEquirectangular(texture).texture
    texture.dispose()
    return envMap
  } finally {
    pmremGenerator.dispose()
  }
}
