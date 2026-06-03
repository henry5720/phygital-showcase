import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useConfig } from '../hooks/useConfig'
import { calculateResult } from '../lib/quiz'
import { QuizCard } from '../components/QuizCard'
import type { QuizOption } from '../config/types'

export function Quiz() {
  const config = useConfig()
  const navigate = useNavigate()
  const { questions, title } = config.quiz
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizOption[]>([])

  function handleSelect(option: QuizOption) {
    const newAnswers = [...answers, option]
    if (currentIndex < questions.length - 1) {
      setAnswers(newAnswers)
      setCurrentIndex(currentIndex + 1)
    } else {
      const result = calculateResult(newAnswers)
      navigate(`/quiz/result/${result}`)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <h1
        className="text-xl font-bold text-center mb-10"
        style={{ color: 'var(--color-primary)' }}
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
