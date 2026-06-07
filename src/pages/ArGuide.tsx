import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/config/routes'
import { useConfig } from '../hooks/useConfig'

export function ArGuide() {
  const config = useConfig()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    void import('gsap').then(({ default: gsap }) => {
      if (cancelled || !ref.current) return
      gsap.fromTo(ref.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-background"
    >
      <div ref={ref} className="flex flex-col items-center gap-6 max-w-xs">
        <div className="text-6xl opacity-30 text-primary">
          AR
        </div>
        <h1 className="text-2xl font-bold text-primary">
          WebAR 體驗
        </h1>
        <p className="opacity-50 text-sm leading-relaxed text-foreground">
          請對準{config.brand.name} Logo，3D 瓶身將浮現於畫面中。
          <br />
          點擊熱點可播放產品介紹影片。
        </p>
        <p className="text-xs opacity-30 text-foreground">
          此功能需要相機權限。
        </p>
        <button
          onClick={() => navigate(ROUTES.AR_SCANNER)}
          className="w-full py-4 px-8 rounded-full font-semibold text-base cursor-pointer mt-4 bg-primary text-background"
        >
          開始體驗 AR
        </button>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="underline opacity-40 text-sm cursor-pointer text-foreground"
        >
          返回首頁
        </button>
      </div>
    </div>
  )
}
