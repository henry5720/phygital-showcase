import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { setupRenderer } from '../shared/setupRenderer'
import { loadHDR } from '../shared/loadHDR'
import { loadGLB } from '../shared/loadGLB'

export type ModelViewerSceneProps = {
  onError?: (error: unknown) => void
}

export function ModelViewerScene({ onError }: ModelViewerSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onErrorRef.current = onError
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cleanupRenderer: (() => void) | null = null
    let controls: OrbitControls | null = null
    let renderer: THREE.WebGLRenderer | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let cancelled = false

    async function init() {
      const el = container
      if (!el) return

      const result = setupRenderer(el, { alpha: false })
      cleanupRenderer = result.dispose
      renderer = result.renderer

      const scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(
        50,
        el.clientWidth / el.clientHeight,
        0.1,
        1000,
      )

      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true

      const envMap = await loadHDR('/assets/web-ar/env.hdr', renderer)
      if (cancelled) return

      scene.environment = envMap
      scene.background = envMap

      const model = await loadGLB('/assets/web-ar/fizzt.glb', envMap)
      if (cancelled) return

      scene.add(model)

      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)
      const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.5

      camera.position.set(center.x, center.y, center.z + cameraZ)
      controls.target.copy(center)
      controls.update()

      renderer.setSize(el.clientWidth, el.clientHeight)

      renderer!.setAnimationLoop(() => {
        controls?.update()
        renderer!.render(scene, camera!)
      })
    }

    init().catch((error) => {
      if (!cancelled) onErrorRef.current?.(error)
    })

    const resizeObserver = new ResizeObserver(() => {
      if (!renderer || !camera) return
      renderer.setSize(container.clientWidth, container.clientHeight)
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(container)

    return () => {
      cancelled = true
      controls?.dispose()
      cleanupRenderer?.()
      resizeObserver.disconnect()
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
