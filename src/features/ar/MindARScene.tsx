import { useEffect, useEffectEvent, useRef } from 'react'
import 'aframe'
import 'mind-ar/dist/mindar-image-aframe.prod.js'
// @ts-expect-error - three/examples/jsm has no type declarations
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

// Register RGBELoader on global THREE for A-Frame components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _window = window as any
if (!_window.THREE) _window.THREE = {}
_window.THREE.RGBELoader = RGBELoader

// Register custom hdr-environment component (plain JS, uses AFRAME + THREE globals)
_window.AFRAME?.registerComponent('hdr-environment', {
  schema: {
    src: { type: 'string' },
    envMapIntensity: { type: 'number', default: 1.0 },
    showBackground: { type: 'boolean', default: false },
    showGround: { type: 'boolean', default: false },
    groundSize: { type: 'number', default: 30 },
  },

  init() {
    this.envMap = null
    this.onSceneLoaded = this.onSceneLoaded.bind(this)
    this.onModelLoaded = this.onModelLoaded.bind(this)
    this.el.addEventListener('loaded', this.onSceneLoaded)
  },

  onSceneLoaded() {
    this.loadHDR()
  },

  onModelLoaded() {
    this.applyEnvMapToAllMeshes()
  },

  loadHDR() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const el = this.el
    const src = this.data.src
    const THREE = _window.THREE

    if (!src || typeof THREE.RGBELoader === 'undefined') return

    const renderer = el.renderer
    if (!renderer) return

    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputEncoding = THREE.sRGBEncoding

    const loader = new THREE.RGBELoader()
    loader.load(
      src,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (texture: any) => {
        texture.mapping = THREE.EquirectangularReflectionMapping
        el.object3D.environment = texture
        self.envMap = texture
        self.applyEnvMapToAllMeshes()
        if (self.data.showBackground) el.object3D.background = texture
        el.addEventListener('model-loaded', self.onModelLoaded)
      },
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => console.error('hdr-environment: Failed to load HDR', error),
    )
  },

  applyEnvMapToAllMeshes() {
    if (!this.envMap) return
    const intensity = this.data.envMapIntensity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.el.object3D.traverse((node: any) => {
      if (node.isMesh && node.material) {
        node.material.envMap = this.envMap
        node.material.envMapIntensity = intensity
        node.material.needsUpdate = true
      }
    })
  },

  remove() {
    this.el.object3D.environment = null
    this.el.object3D.background = null
    this.el.removeEventListener('model-loaded', this.onModelLoaded)
    this.envMap = null
  },
})

export type MindARSceneProps = {
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onError?: (error: unknown) => void
  navigate?: (url: string) => void
}

export function MindARScene({
  onReady,
  onTargetFound,
  onTargetLost,
  onError,
}: MindARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleReady = useEffectEvent(() => onReady?.())
  const handleTargetFound = useEffectEvent(() => onTargetFound?.())
  const handleTargetLost = useEffectEvent(() => onTargetLost?.())
  const handleError = useEffectEvent((error: unknown) => onError?.(error))

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mindarSystem: any = null

    function cleanup() {
      if (mindarSystem?.stop) mindarSystem.stop()
      container?.querySelectorAll('video').forEach((v) => {
        v.pause()
        v.src = ''
      })
      if (container) container.innerHTML = ''
    }

    try {
      const sceneEl = document.createElement('a-scene')
      sceneEl.setAttribute('loading-screen', 'enabled: false')
      sceneEl.setAttribute(
        'mindar-image',
        'imageTargetSrc: /assets/web-ar/card.mind; showStats: false; filterMinCF: 0.0001; filterBeta: 0.001',
      )
      sceneEl.setAttribute('color-space', 'sRGB')
      sceneEl.setAttribute(
        'renderer',
        'colorManagement: true; toneMapping: ACESFilmic',
      )
      sceneEl.setAttribute('vr-mode-ui', 'enabled: false')
      sceneEl.setAttribute('device-orientation-permission-ui', 'enabled: false')
      sceneEl.setAttribute(
        'hdr-environment',
        'src: /assets/web-ar/env.hdr; showBackground: false',
      )
      sceneEl.setAttribute('reflection', '')

      const camera = document.createElement('a-camera')
      camera.setAttribute('position', '0 0 0')
      camera.setAttribute('look-controls', 'enabled: false')
      camera.setAttribute('cursor', 'fuse: false; rayOrigin: mouse')
      camera.setAttribute('raycaster', 'far: 10000; objects: .clickable')
      sceneEl.appendChild(camera)

      const target = document.createElement('a-entity')
      target.setAttribute('mindar-image-target', 'targetIndex: 0')

      const model = document.createElement('a-entity')
      model.setAttribute('scale', '3 3 3')
      model.setAttribute('gltf-model', '/assets/web-ar/fizzt.glb')
      target.appendChild(model)

      sceneEl.appendChild(target)
      container.appendChild(sceneEl)

      const onLoaded = () => {
        if (cancelled) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mindarSystem = (sceneEl as any).systems?.['mindar-image-system']
        if (mindarSystem?.start) mindarSystem.start()

        target.addEventListener('targetFound', () => {
          if (!cancelled) handleTargetFound()
        })
        target.addEventListener('targetLost', () => {
          if (!cancelled) handleTargetLost()
        })

        handleReady()
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((sceneEl as any).hasLoaded) {
        onLoaded()
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sceneEl.addEventListener('loaded', onLoaded, { once: true } as any)
      }
    } catch (error) {
      if (!cancelled) handleError(error)
    }

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0 ar-container" />
}
