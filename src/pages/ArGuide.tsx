import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import gsap from 'gsap'
import { useConfig } from '../hooks/useConfig'

export function ArGuide() {
  useConfig()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.4 })
  }, [])

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div ref={ref}>
        <div className="text-6xl mb-6 opacity-30" style={{ color: 'var(--color-primary)' }}>
          AR
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>
          WebAR 體驗
        </h1>
        <p className="opacity-50 text-sm mb-10" style={{ color: 'var(--color-text)' }}>
          AR 模組開發中 — 敬請期待
        </p>
        <button
          onClick={() => navigate('/')}
          className="underline opacity-50 text-sm cursor-pointer"
          style={{ color: 'var(--color-text)' }}
        >
          返回首頁
        </button>
      </div>
    </div>
  )
}
