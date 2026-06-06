import { useEffect, useRef } from 'react'
import { createArV5Island, type ArV5IslandCallbacks } from './createArV5Island'

export type MindARSceneProps = {
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onError?: (error: unknown) => void
}

export function MindARScene({ onReady, onTargetFound, onTargetLost, onError }: MindARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const callbacksRef = useRef<ArV5IslandCallbacks>({ onReady, onTargetFound, onTargetLost, onError })
  callbacksRef.current = { onReady, onTargetFound, onTargetLost, onError }

  useEffect(() => {
    if (!containerRef.current) return

    let cleanupIsland: (() => void) | null = null
    let cancelled = false

    const bridge: ArV5IslandCallbacks = {
      onReady: () => { if (!cancelled) callbacksRef.current.onReady?.() },
      onTargetFound: () => { if (!cancelled) callbacksRef.current.onTargetFound?.() },
      onTargetLost: () => { if (!cancelled) callbacksRef.current.onTargetLost?.() },
      onError: (err) => { if (!cancelled) callbacksRef.current.onError?.(err) },
    }

    void createArV5Island(containerRef.current, bridge).then((cleanup) => {
      if (cancelled) { cleanup(); return }
      cleanupIsland = cleanup
    })

    return () => {
      cancelled = true
      cleanupIsland?.()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0 ar-container" />
}
