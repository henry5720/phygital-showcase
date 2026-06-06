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
  stop(): Promise<void> | void
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
      material.forEach(disposeMaterial)
      return
    }

    if (material) {
      disposeMaterial(material)
    }
  })
}

function disposeMaterial(material: THREE.Material) {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) {
      value.dispose()
    }
  })
  material.dispose()
}

function cleanupMindArDom() {
  document.querySelectorAll('.mindar-ui-overlay, [data-mindar-overlay]').forEach((element) => {
    element.remove()
  })
  document.head.querySelectorAll('style').forEach((style) => {
    if (style.textContent?.includes('mindar-ui-overlay')) {
      style.remove()
    }
  })
}

function stopMindArRuntime(mindarThree: MindArThreeRuntime | undefined) {
  try {
    const stopResult = mindarThree?.stop()
    void Promise.resolve(stopResult).catch(() => undefined)
  } catch {
    // Cleanup must stay safe even if the runtime is already torn down.
  }
}

export async function createMindArV4Experience(
  options: CreateMindArV4ExperienceOptions,
): Promise<MindArV4Experience> {
  let sawConnectedContainer = options.container.isConnected
  const isDetachedAfterUse = () => {
    sawConnectedContainer ||= options.container.isConnected
    return sawConnectedContainer && !options.container.isConnected
  }
  let cleaned = false
  let mindarThree: MindArThreeRuntime | undefined
  let anchor: MindArAnchor | undefined
  let model: THREE.Group | undefined
  let ambientLight: THREE.AmbientLight | undefined
  let directionalLight: THREE.DirectionalLight | undefined
  let video: HTMLVideoElement | undefined
  let videoTexture: THREE.VideoTexture | undefined
  let videoPlane: THREE.Mesh | undefined
  const buttonMeshes: THREE.Mesh[] = []

  const onPointerDown = (event: PointerEvent) => {
    if (!mindarThree || !anchor) return
    const { container } = options
    const rect = container.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), mindarThree.camera)

    const intersects = raycaster.intersectObjects(anchor.group.children, true)
    if (intersects.length > 0) {
      const clickedObject = intersects[0]?.object
      if (clickedObject?.userData.isVideo) {
        void video?.play().catch(() => undefined)
        options.onAction?.('play-video')
      } else if (clickedObject?.userData.actionId) {
        options.onAction?.(clickedObject.userData.actionId)
      }
    }
  }

  const cleanup = () => {
    if (cleaned) return
    cleaned = true

    options.container.removeEventListener('pointerdown', onPointerDown)
    mindarThree?.renderer.setAnimationLoop(null)

    if (video) {
      video.pause()
      video.src = ''
      video.load()
    }
    videoTexture?.dispose()

    if (model) {
      disposeObject(model)
      anchor?.group.remove(model)
    }

    if (videoPlane) {
      disposeObject(videoPlane)
      anchor?.group.remove(videoPlane)
    }

    buttonMeshes.forEach((button) => {
      disposeObject(button)
      anchor?.group.remove(button)
    })

    if (mindarThree && ambientLight && directionalLight) {
      mindarThree.scene.remove(ambientLight, directionalLight)
    }
    stopMindArRuntime(mindarThree)
    cleanupMindArDom()
  }

  // @ts-expect-error MindAR ships this official runtime bundle without TypeScript declarations.
  const mindArModule = (await import('mind-ar/dist/mindar-image-three.prod.js')) as MindArModule

  try {
    mindarThree = new mindArModule.MindARThree({
      container: options.container,
      imageTargetSrc: options.assets.targetMind,
      maxTrack: 1,
      uiLoading: 'no',
      uiScanning: 'yes',
      uiError: 'no',
    })
    if (isDetachedAfterUse()) {
      cleanup()
      return { cleanup }
    }

    const { renderer, scene, camera } = mindarThree
    anchor = mindarThree.addAnchor(0)
    anchor.onTargetFound = () => options.onTargetFound?.()
    anchor.onTargetLost = () => options.onTargetLost?.()

    ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(ambientLight, directionalLight)

    // Setup Video
    video = document.createElement('video')
    video.setAttribute('src', options.assets.videoMp4)
    video.setAttribute('loop', 'true')
    video.setAttribute('muted', 'true')
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')

    videoTexture = new THREE.VideoTexture(video)
    const videoGeometry = new THREE.PlaneGeometry(0.7, 0.39)
    const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture })
    videoPlane = new THREE.Mesh(videoGeometry, videoMaterial)
    videoPlane.position.set(0, 0.3, 0.02)
    videoPlane.userData.isVideo = true
    anchor.group.add(videoPlane)

    const currentAnchor = anchor
    // Setup Buttons
    options.actions.forEach((action, index) => {
      const buttonGeometry = new THREE.CircleGeometry(0.08, 32)
      const buttonMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
      })
      const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial)
      buttonMesh.position.set(-0.24 + index * 0.24, -0.48, 0.02)
      buttonMesh.userData.actionId = action.id
      currentAnchor.group.add(buttonMesh)
      buttonMeshes.push(buttonMesh)
    })

    options.container.addEventListener('pointerdown', onPointerDown)

    model = await new Promise<THREE.Group>((resolve, reject) => {
      new GLTFLoader().load(
        options.assets.model,
        (gltf) => {
          try {
            resolve(gltf.scene)
          } catch (error) {
            reject(error)
          }
        },
        undefined,
        reject,
      )
    })
    if (isDetachedAfterUse()) {
      cleanup()
      return { cleanup }
    }

    model.scale.setScalar(0.004)
    model.position.set(0, -0.2, 0.1)
    anchor.group.add(model)

    await mindarThree.start()
    if (isDetachedAfterUse()) {
      cleanup()
      return { cleanup }
    }

    renderer.setAnimationLoop(() => renderer.render(scene, camera))
    options.onReady?.()

    return { cleanup }
  } catch (error) {
    cleanup()
    throw error
  }
}
