import { useEffect, useEffectEvent, useRef } from 'react'
import { createArV5Island, type ArV5IslandCallbacks } from './createArV5Island'

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
  navigate,
}: MindARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleReady = useEffectEvent(() => onReady?.())
  const handleTargetFound = useEffectEvent(() => onTargetFound?.())
  const handleTargetLost = useEffectEvent(() => onTargetLost?.())
  const handleError = useEffectEvent((error: unknown) => onError?.(error))
  const handleNavigate = useEffectEvent((url: string) => navigate?.(url))

  useEffect(() => {
    if (!containerRef.current) return

    let cleanupIsland: (() => void) | null = null
    let cancelled = false

    const bridge: ArV5IslandCallbacks = {
      onReady: () => { if (!cancelled) handleReady() },
      onTargetFound: () => { if (!cancelled) handleTargetFound() },
      onTargetLost: () => { if (!cancelled) handleTargetLost() },
      onError: (error) => { if (!cancelled) handleError(error) },
      navigate: (url) => { if (!cancelled) handleNavigate(url) },
    }

    void createArV5Island(containerRef.current, bridge).then((cleanup) => {
      if (cancelled) {
        cleanup()
        return
      }
      cleanupIsland = cleanup
    })

    return () => {
      cancelled = true
      cleanupIsland?.()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0 ar-container" />
}
