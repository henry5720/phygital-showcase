import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { CreateMindArV4ExperienceOptions, MindArV4Experience } from './types'

type MindArThreeConstructorOptions = {
  container: HTMLElement
  imageTargetSrc: string
  maxTrack: number
  uiLoading: 'yes' | 'no'
  uiScanning: 'yes' | 'no'
  uiError: 'yes' | 'no'
}

type MindArAnchor = {
  group: THREE.Group
  onTargetFound?: () => void
  onTargetLost?: () => void
}

type MindArThreeRuntime = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.Camera
  addAnchor(index: number): MindArAnchor
  start(): Promise<void>
  stop(): Promise<void>
}

type MindArModule = {
  MindARThree: new (options: MindArThreeConstructorOptions) => MindArThreeRuntime
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    mesh.geometry?.dispose()

    const material = mesh.material
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose())
      return
    }

    material?.dispose()
  })
}

function cleanupMindArOverlayResidue() {
  document.querySelectorAll('.mindar-ui-overlay, [data-mindar-overlay]').forEach((element) => {
    element.remove()
  })
}

export async function createMindArV4Experience(
  options: CreateMindArV4ExperienceOptions,
): Promise<MindArV4Experience> {
  // @ts-expect-error MindAR ships this official runtime bundle without TypeScript declarations.
  const mindArModule = (await import('mind-ar/dist/mindar-image-three.prod.js')) as MindArModule
  const mindarThree = new mindArModule.MindARThree({
    container: options.container,
    imageTargetSrc: options.assets.targetMind,
    maxTrack: 1,
    uiLoading: 'no',
    uiScanning: 'yes',
    uiError: 'no',
  })
  const { renderer, scene, camera } = mindarThree
  const anchor = mindarThree.addAnchor(0)

  anchor.onTargetFound = () => options.onTargetFound?.()
  anchor.onTargetLost = () => options.onTargetLost?.()

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(1, 1, 1)
  scene.add(ambientLight, directionalLight)

  const model = await new Promise<THREE.Group>((resolve, reject) => {
    new GLTFLoader().load(
      options.assets.model,
      (gltf) => resolve(gltf.scene),
      undefined,
      reject,
    )
  })
  model.scale.setScalar(0.004)
  model.position.set(0, -0.2, 0.1)
  anchor.group.add(model)

  await mindarThree.start()
  renderer.setAnimationLoop(() => renderer.render(scene, camera))
  options.onReady?.()

  return {
    cleanup() {
      renderer.setAnimationLoop(null)
      disposeObject(model)
      anchor.group.remove(model)
      scene.remove(ambientLight, directionalLight)
      void mindarThree.stop()
      cleanupMindArOverlayResidue()
    },
  }
}
