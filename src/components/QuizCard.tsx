import { useEffect, useRef } from 'react'
import type { QuizQuestion, QuizOption } from '../config/types'

interface Props {
  question: QuizQuestion
  questionNumber: number
  total: number
  onSelect: (option: QuizOption) => void
}

export function QuizCard({ question, questionNumber, total, onSelect }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    void import('gsap').then(({ default: gsap }) => {
      if (cancelled || !cardRef.current) return
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out' },
      )
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div ref={cardRef} className="w-full max-w-sm mx-auto">
      <p className="text-sm mb-3 opacity-50 text-foreground">
        {questionNumber} / {total}
      </p>
      <div
        className="w-full h-0.5 rounded-full mb-8 bg-white/10"
      >
        <div
          className="h-0.5 rounded-full transition-all duration-500 bg-primary"
          style={{
            width: `${(questionNumber / total) * 100}%`,
          }}
        />
      </div>
      <h2
        className="text-xl font-semibold mb-6 leading-snug text-foreground"
      >
        {question.text}
      </h2>
      <div className="flex flex-col gap-3">
        {question.options.map((option) => (
          <button
            key={option.text}
            onClick={() => onSelect(option)}
            className="py-3.5 px-5 rounded-2xl text-left border cursor-pointer border-primary text-foreground bg-transparent"
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  )
}
