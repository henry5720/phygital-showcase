import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

export async function loadHDR(
  url: string,
  renderer: THREE.WebGLRenderer,
): Promise<THREE.Texture> {
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  const loader = new RGBELoader()
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
  pmremGenerator.dispose()
  texture.dispose()

  return envMap
}
