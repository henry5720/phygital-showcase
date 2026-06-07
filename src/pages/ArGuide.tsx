import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import gsap from 'gsap'
import { useConfig } from '../hooks/useConfig'

export function ArGuide() {
  const config = useConfig()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(ref.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
  }, [])

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div ref={ref} className="flex flex-col items-center gap-6 max-w-xs">
        <div className="text-6xl opacity-30" style={{ color: 'var(--color-primary)' }}>
          AR
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
          WebAR 體驗
        </h1>
        <p className="opacity-50 text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
          請對準{config.brand.name} Logo，3D 瓶身將浮現於畫面中。
          <br />
          點擊熱點可播放產品介紹影片。
        </p>
        <p className="text-xs opacity-30" style={{ color: 'var(--color-text)' }}>
          此功能需要相機權限。
        </p>
        <button
          onClick={() => navigate('/ar/scanner')}
          className="w-full py-4 px-8 rounded-full font-semibold text-base cursor-pointer mt-4"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
        >
          開始體驗 AR
        </button>
        <button
          onClick={() => navigate('/')}
          className="underline opacity-40 text-sm cursor-pointer"
          style={{ color: 'var(--color-text)' }}
        >
          返回首頁
        </button>
      </div>
    </div>
  )
}
