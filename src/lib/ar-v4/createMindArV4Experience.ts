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
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose()

      const material = child.material
      if (Array.isArray(material)) {
        material.forEach(disposeMaterial)
        return
      }

      if (material) {
        disposeMaterial(material)
      }
    } else if (child instanceof THREE.Light) {
      child.dispose?.()
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
  }
}

function inspectContainer(phase: string, el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const children = Array.from(el.children)
  console.log(`[AR-V4:${phase}] Container: ${rect.width}x${rect.height} connected=${el.isConnected} children=${children.length}`)

  children.forEach((child, i) => {
    const tag = child.tagName.toLowerCase()
    const style = window.getComputedStyle(child)
    console.log(`[AR-V4:${phase}]   child[${i}]: <${tag}> display=${style.display} visibility=${style.visibility} opacity=${style.opacity} zIndex=${style.zIndex} pos=${style.position} size=${style.width}x${style.height} bg=${style.backgroundColor}`)

    if (tag === 'video') {
      const v = child as HTMLVideoElement
      console.log(`[AR-V4:${phase}]   video: readyState=${v.readyState} paused=${v.paused} muted=${v.muted} ${v.videoWidth}x${v.videoHeight} srcObject=${!!v.srcObject}`)
    }
    if (tag === 'canvas') {
      const ctx = (child as HTMLCanvasElement).getContext('webgl2') || (child as HTMLCanvasElement).getContext('webgl')
      console.log(`[AR-V4:${phase}]   canvas: getContext=${!!ctx}`)
    }
  })
}

function inspectBodyOverlays(phase: string) {
  document.querySelectorAll('.mindar-ui-overlay').forEach((el, i) => {
    const style = window.getComputedStyle(el)
    console.log(`[AR-V4:${phase}]   body-overlay[${i}]: display=${style.display} zIndex=${style.zIndex} bg=${style.backgroundColor}`)
  })
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

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  const onPointerDown = (event: PointerEvent) => {
    if (!mindarThree || !anchor || !anchor.group.visible) return
    const { container } = options
    const rect = container.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, mindarThree.camera)

    const intersects = raycaster.intersectObjects(anchor.group.children, true)
    if (intersects.length > 0) {
      const clickedObject = intersects[0]?.object
      if (clickedObject && clickedObject.visible) {
        if (clickedObject.userData.isVideo) {
          void video?.play().catch(() => undefined)
          options.onAction?.('play-video')
        } else if (clickedObject.userData.actionId) {
          options.onAction?.(clickedObject.userData.actionId)
        }
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

    if (ambientLight) disposeObject(ambientLight)
    if (directionalLight) disposeObject(directionalLight)

    if (mindarThree && ambientLight && directionalLight) {
      mindarThree.scene.remove(ambientLight, directionalLight)
    }
    stopMindArRuntime(mindarThree)
    cleanupMindArDom()
  }

  inspectContainer('before-import', options.container)

  console.log('[AR-V4] Step 1/6: Importing MindAR module...')
  // @ts-expect-error MindAR ships this official runtime bundle without TypeScript declarations.
  const mindArModule = (await import('mind-ar/dist/mindar-image-three.prod.js')) as MindArModule

  try {
    console.log('[AR-V4] Step 2/6: Creating MindARThree instance...')
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

    inspectContainer('after-constructor', options.container)

    const { renderer, scene, camera } = mindarThree

    console.log('[AR-V4]   renderer domElement=', renderer.domElement?.width, 'x', renderer.domElement?.height)

    ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(ambientLight, directionalLight)

    options.container.addEventListener('pointerdown', onPointerDown)

    console.log('[AR-V4] Step 3/6: Calling mindarThree.start() — getUserMedia + AR startup...')
    const startTime = performance.now()

    await mindarThree.start()

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1)
    console.log(`[AR-V4] Step 4/6: start() resolved after ${elapsed}s`)
    if (isDetachedAfterUse()) {
      cleanup()
      return { cleanup }
    }

    inspectContainer('after-start', options.container)
    inspectBodyOverlays('after-start')

    anchor = mindarThree.addAnchor(0)
    anchor.onTargetFound = () => {
      console.log('[AR-V4] Target Found')
      options.onTargetFound?.()
    }
    anchor.onTargetLost = () => {
      console.log('[AR-V4] Target Lost')
      options.onTargetLost?.()
    }

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

    renderer.setAnimationLoop(() => renderer.render(scene, camera))
    console.log('[AR-V4]   setAnimationLoop started')

    options.onReady?.()

    console.log('[AR-V4] Step 5/6: Loading 3D model...')
    model = await new Promise<THREE.Group>((resolve, reject) => {
      new GLTFLoader().load(
        options.assets.model,
        (gltf) => {
          if (cleaned || isDetachedAfterUse()) {
            disposeObject(gltf.scene)
            return
          }
          try {
            resolve(gltf.scene)
          } catch (error) {
            reject(error)
          }
        },
        (xhr) => {
          if (xhr.total) {
            console.log(`[AR-V4]   model: ${Math.round((xhr.loaded / xhr.total) * 100)}% loaded`)
          }
        },
        reject,
      )
    })
    if (cleaned || isDetachedAfterUse()) {
      if (model) disposeObject(model)
      cleanup()
      return { cleanup }
    }

    model.scale.setScalar(0.004)
    model.position.set(0, -0.2, 0.1)
    anchor.group.add(model)
    console.log('[AR-V4] Step 6/6: 3D model loaded')

    return { cleanup }
  } catch (error) {
    console.error('[AR-V4] Error:', error)
    if (error instanceof DOMException) {
      console.error(`[AR-V4]   name=${error.name} message=${error.message} code=${error.code}`)
    }
    console.error('[AR-V4]   stack:', (error as Error).stack)
    inspectContainer('after-error', options.container)

    options.onError?.(error)
    cleanup()
    throw error
  }
}
