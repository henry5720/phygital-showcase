import { useRef, useCallback, useEffect } from 'react'

type CleanupFn = () => void

export function useMountAnimation(
  factory: (el: HTMLElement, gsap: typeof import('gsap')['default']) => CleanupFn,
  ref: React.RefObject<HTMLElement | null>,
) {
  const cleanupRef = useRef<CleanupFn | null>(null)

  const setup = useCallback(() => {
    if (!ref.current) return
    void import('gsap').then(({ default: gsap }) => {
      if (!ref.current) return
      cleanupRef.current = factory(ref.current, gsap)
    })
  }, [factory, ref])

  useEffect(() => {
    setup()
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [setup])
}
