import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ROUTES } from '@/config/routes'
import { getConfig } from '../hooks/getConfig'

export function Landing() {
  const config = getConfig()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let revert: (() => void) | null = null

    void import('gsap').then(({ default: gsap }) => {
      if (cancelled) return
      const ctx = gsap.context(() => {
        gsap.from('.landing-hero', {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.out',
        })
        gsap.from('.cta-btn', {
          opacity: 0,
          y: 12,
          duration: 0.4,
          stagger: 0.12,
          delay: 0.3,
          ease: 'power2.out',
        })
      }, rootRef)
      revert = () => ctx.revert()
    })

    return () => {
      cancelled = true
      revert?.()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background"
    >
      <div className="landing-hero text-center mb-14">
        <h1
          className="text-5xl font-bold tracking-tight mb-3 text-primary"
        >
          {config.brand.name}
        </h1>
        <p className="text-base opacity-70 text-foreground">
          {config.brand.subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          to={ROUTES.AR_GUIDE}
          className="cta-btn py-4 px-8 rounded-full font-semibold text-base cursor-pointer border-2 border-primary text-primary bg-transparent text-center"
        >
          WebAR 體驗
        </Link>
        <Link
          to={ROUTES.QUIZ}
          className="cta-btn py-4 px-8 rounded-full font-semibold text-base cursor-pointer bg-primary text-background text-center"
        >
          互動測驗
        </Link>
        <button
          className="cta-btn py-4 px-8 rounded-full font-semibold text-base cursor-pointer border-2 border-line text-line bg-transparent"
          onClick={() => { window.location.href = config.brand.line.joinUrl }}
        >
          加入 LINE@
        </button>
      </div>
    </div>
  )
}
