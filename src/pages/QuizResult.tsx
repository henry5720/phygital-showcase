import { useParams } from 'react-router'
import { Link } from 'react-router'
import { ROUTES } from '@/config/routes'
import { getConfig } from '../hooks/getConfig'
import { ResultCard } from '../components/ResultCard'

export function QuizResult() {
  const { type } = useParams<{ type: string }>()
  const config = getConfig()

  const result = type ? config.quiz.results[type] : null

  if (!result) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-background text-foreground"
      >
        <p>找不到結果，請重新測驗。</p>
        <Link
          to={ROUTES.QUIZ}
          className="underline opacity-60 cursor-pointer text-foreground"
        >
          重新測驗
        </Link>
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
