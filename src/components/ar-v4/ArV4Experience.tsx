import { useEffect, useRef } from 'react'
import { AR_V4_ACTIONS, AR_V4_ASSETS } from '../../lib/ar-v4/assets'
import { createMindArV4Experience } from '../../lib/ar-v4/createMindArV4Experience'
import type { ArV4ActionId } from '../../lib/ar-v4/types'

export type ArV4ExperienceProps = {
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onAction?: (action: ArV4ActionId) => void
  onError?: (error: unknown) => void
}

export function ArV4Experience({
  onReady,
  onTargetFound,
  onTargetLost,
  onAction,
  onError,
}: ArV4ExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const onReadyRef = useRef(onReady)
  const onTargetFoundRef = useRef(onTargetFound)
  const onTargetLostRef = useRef(onTargetLost)
  const onActionRef = useRef(onAction)
  const onErrorRef = useRef(onError)

  onReadyRef.current = onReady
  onTargetFoundRef.current = onTargetFound
  onTargetLostRef.current = onTargetLost
  onActionRef.current = onAction
  onErrorRef.current = onError

  useEffect(() => {
    if (!containerRef.current) return

    console.log('[ArV4Experience] Component mounted, initializing...')

    const experiencePromise = createMindArV4Experience({
      container: containerRef.current,
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
      onReady: () => {
        console.log('[ArV4Experience] Experience Ready')
        onReadyRef.current?.()
      },
      onTargetFound: () => onTargetFoundRef.current?.(),
      onTargetLost: () => onTargetLostRef.current?.(),
      onAction: (id) => onActionRef.current?.(id),
      onError: (err) => {
        console.error('[ArV4Experience] onError callback:', err)
        onErrorRef.current?.(err)
      },
    })

    experiencePromise.catch((err) => {
      console.error('[ArV4Experience] Initialization Promise rejected:', err)
      onErrorRef.current?.(err)
    })

    return () => {
      console.log('[ArV4Experience] Component unmounting, cleaning up...')
      void experiencePromise.then((experience) => {
        experience.cleanup()
      })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      data-testid="ar-v4-container"
      className="absolute inset-0"
    />
  )
}
