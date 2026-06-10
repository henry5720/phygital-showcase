import { useEffect, useEffectEvent, useRef } from 'react'
import * as THREE from 'three'
import { loadHDR } from '../shared/loadHDR'
import { loadGLB } from '../shared/loadGLB'

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mindar: any = null
    let cancelled = false

    async function init() {
      console.log('[MindAR] Loading module...')
      const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js')
      console.log('[MindAR] Module loaded, creating MindARThree...')

      mindar = new MindARThree({
        container: container!,
        imageTargetSrc: '/assets/web-ar/card.mind',
      })

      const { scene, renderer, camera } = mindar
      console.log('[MindAR] Scene:', scene, 'Renderer:', renderer, 'Camera:', camera)
      const anchor = mindar.addAnchor(0)

      // Match original A-Frame renderer settings
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.0

      const envMap = await loadHDR('/assets/web-ar/env.hdr', renderer)
      if (cancelled) return

      scene.environment = envMap

      const model = await loadGLB('/assets/web-ar/fizzt.glb', envMap)
      if (cancelled) return

      // Match original A-Frame scale="3 3 3"
      model.scale.set(3, 3, 3)

      anchor.group.add(model)

      mindar.onTargetFound = () => {
        console.log('[MindAR] Target found')
        handleTargetFound()
      }
      mindar.onTargetLost = () => {
        console.log('[MindAR] Target lost')
        handleTargetLost()
      }

      console.log('[MindAR] Starting...')
      await mindar.start()
      console.log('[MindAR] Started, renderer:', renderer)
      if (cancelled) return

      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera)
      })

      handleReady()
    }

    init().catch((error) => {
      if (!cancelled) handleError(error)
    })

    return () => {
      cancelled = true
      mindar?.stop()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0 ar-container" />
}
