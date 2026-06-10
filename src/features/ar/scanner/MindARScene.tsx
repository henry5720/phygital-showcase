import { useEffect, useEffectEvent, useRef } from 'react'
import { setupRenderer } from '../shared/setupRenderer'
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

    let cleanupRenderer: (() => void) | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mindar: any = null
    let cancelled = false

    async function init() {
      const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js')
      const { renderer, dispose } = setupRenderer(container!, { alpha: true })
      cleanupRenderer = dispose

      mindar = new MindARThree({
        container: container!,
        imageTargetSrc: '/assets/web-ar/card.mind',
      })

      const { scene } = mindar
      const anchor = mindar.addAnchor(0)

      const envMap = await loadHDR('/assets/web-ar/env.hdr', renderer)
      if (cancelled) return

      scene.environment = envMap

      const model = await loadGLB('/assets/web-ar/fizzt.glb', envMap)
      if (cancelled) return

      anchor.group.add(model)

      mindar.onTargetFound = () => handleTargetFound()
      mindar.onTargetLost = () => handleTargetLost()

      await mindar.start()
      if (cancelled) return

      renderer.setAnimationLoop(() => {
        renderer.render(scene, mindar!.camera)
      })

      handleReady()
    }

    init().catch((error) => {
      if (!cancelled) handleError(error)
    })

    return () => {
      cancelled = true
      mindar?.stop()
      cleanupRenderer?.()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0 ar-container" />
}
