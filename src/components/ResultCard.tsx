import { useEffect, useRef } from 'react'
import type { QuizResult } from '../config/types'

interface Props {
  result: QuizResult
  onJoinLine: () => void
}

export function ResultCard({ result, onJoinLine }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    void import('gsap').then(({ default: gsap }) => {
      if (cancelled || !cardRef.current) return
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' },
      )
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div ref={cardRef} className="w-full max-w-sm mx-auto text-center">
      <p className="text-sm opacity-50 mb-2 text-foreground">
        你是
      </p>
      <h2 className="text-4xl font-bold mb-4 text-primary">
        {result.name}
      </h2>
      <p
        className="mb-8 opacity-75 leading-relaxed text-sm text-foreground"
      >
        {result.description}
      </p>
      <div
        className="rounded-2xl p-5 mb-8 border border-primary"
      >
        <p className="text-xs opacity-50 mb-1 text-foreground">
          推薦調飲
        </p>
        <p className="font-semibold text-primary">
          {result.recommendation}
        </p>
      </div>
      <button
        onClick={onJoinLine}
        className="w-full py-4 rounded-full font-semibold text-base cursor-pointer bg-line text-white"
      >
        加入 LINE 取得完整酒譜
      </button>
    </div>
  )
}
