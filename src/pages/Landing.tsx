import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import gsap from 'gsap'
import { useConfig } from '../hooks/useConfig'

export function Landing() {
  const config = useConfig()
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="landing-hero text-center mb-14">
        <h1
          className="text-5xl font-bold tracking-tight mb-3"
          style={{ color: 'var(--color-primary)' }}
        >
          {config.brand.name}
        </h1>
        <p className="text-base opacity-70" style={{ color: 'var(--color-text)' }}>
          {config.brand.subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          className="cta-btn py-4 px-8 rounded-full font-semibold text-base cursor-pointer border-2"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'transparent' }}
          onClick={() => navigate('/ar/guide')}
        >
          WebAR 體驗
        </button>
        <button
          className="cta-btn py-4 px-8 rounded-full font-semibold text-base cursor-pointer"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
          onClick={() => navigate('/quiz')}
        >
          互動測驗
        </button>
        <button
          className="cta-btn py-4 px-8 rounded-full font-semibold text-base cursor-pointer border-2"
          style={{ borderColor: '#22c55e', color: '#22c55e', backgroundColor: 'transparent' }}
          onClick={() => { window.location.href = config.brand.line.joinUrl }}
        >
          加入 LINE@
        </button>
      </div>
    </div>
  )
}
