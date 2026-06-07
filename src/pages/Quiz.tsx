import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ROUTES } from '@/config/routes'
import { getConfig } from '../hooks/getConfig'
import { calculateResult } from '../lib/quiz'
import { QuizCard } from '../components/QuizCard'
import type { QuizOption } from '../config/types'

export function Quiz() {
  const config = getConfig()
  const navigate = useNavigate()
  const { questions, title } = config.quiz
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizOption[]>([])

  if (questions.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-background text-foreground">
        <p>測驗題目尚未載入。</p>
      </div>
    )
  }

  function handleSelect(option: QuizOption) {
    const newAnswers = [...answers, option]
    if (currentIndex < questions.length - 1) {
      setAnswers(newAnswers)
      setCurrentIndex(currentIndex + 1)
    } else {
      const result = calculateResult(newAnswers)
      navigate(`${ROUTES.QUIZ_RESULT.replace(':type', result)}`)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 py-16 bg-background"
    >
      <h1
        className="text-xl font-bold text-center mb-10 text-primary"
      >
        {title}
      </h1>
      <div className="w-full max-w-sm">
        {/* key={currentIndex} triggers QuizCard remount → GSAP slide-in animation */}
        <QuizCard
          key={currentIndex}
          question={questions[currentIndex]}
          questionNumber={currentIndex + 1}
          total={questions.length}
          onSelect={handleSelect}
        />
      </div>
    </div>
  )
}
