import { useEffect, useRef } from 'react'
import 'aframe'
// @ts-expect-error - three/examples/jsm has no type declarations
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

// Register RGBELoader on global THREE for A-Frame components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _window = window as any
if (!_window.THREE) _window.THREE = {}
_window.THREE.RGBELoader = RGBELoader

// Register hdr-environment component
_window.AFRAME?.registerComponent('hdr-environment', {
  schema: {
    src: { type: 'string' },
    showBackground: { type: 'boolean', default: false },
  },

  init() {
    this.el.addEventListener('loaded', () => this.loadHDR())
  },

  loadHDR() {
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
        if (this.data.showBackground) el.object3D.background = texture
      },
      undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => console.error('hdr-environment: Failed to load HDR', error),
    )
  },
})

export function ModelViewer() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false

    try {
      const sceneEl = document.createElement('a-scene')
      sceneEl.setAttribute('loading-screen', 'enabled: false')
      sceneEl.setAttribute('vr-mode-ui', 'enabled: false')
      sceneEl.setAttribute(
        'renderer',
        'colorManagement: true; toneMapping: ACESFilmic',
      )
      sceneEl.setAttribute('color-space', 'sRGB')
      sceneEl.setAttribute(
        'hdr-environment',
        'src: /assets/web-ar/env.hdr; showBackground: true',
      )
      sceneEl.setAttribute('embedded', '')
      sceneEl.setAttribute('reflection', '')

      const camera = document.createElement('a-entity')
      camera.setAttribute('camera', 'fov: 50')
      camera.setAttribute('look-controls', 'enabled: false')
      camera.setAttribute(
        'orbit-controls',
        'target: 0 0 0; minDistance: 1; maxDistance: 10; enableDamping: true',
      )
      sceneEl.appendChild(camera)

      const model = document.createElement('a-entity')
      model.setAttribute('gltf-model', '/assets/web-ar/fizzt.glb')
      sceneEl.appendChild(model)

      container.appendChild(sceneEl)
    } catch (error) {
      if (!cancelled) {
        console.error('ModelViewer init failed', error)
        container.innerHTML =
          '<p style="color:red;padding:1rem">Failed to load 3D scene</p>'
      }
    }

    return () => {
      cancelled = true
      container.innerHTML = ''
    }
  }, [])

  return (
    <div className="min-h-dvh bg-background">
      <div ref={containerRef} className="w-full h-dvh" />
    </div>
  )
}
