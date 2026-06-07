import { useParams, useNavigate } from 'react-router'
import { useConfig } from '../hooks/useConfig'
import { ResultCard } from '../components/ResultCard'

export function QuizResult() {
  const { type } = useParams<{ type: string }>()
  const config = useConfig()
  const navigate = useNavigate()

  const result = type ? config.quiz.results[type] : null

  if (!result) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-background text-foreground"
      >
        <p>找不到結果，請重新測驗。</p>
        <button
          onClick={() => navigate('/quiz')}
          className="underline opacity-60 cursor-pointer text-foreground"
        >
          重新測驗
        </button>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh flex flex-col justify-center px-6 py-16 bg-background"
    >
      <ResultCard
        result={result}
        onJoinLine={() => { window.location.href = result.lineJoinUrl }}
      />
    </div>
  )
}
