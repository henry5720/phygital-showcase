import type { QuizOption } from '../config/types'

export function calculateResult(answers: QuizOption[]): string {
  if (answers.length === 0) {
    throw new Error('No answers provided')
  }

  const totals: Record<string, number> = {}
  for (const answer of answers) {
    for (const [key, value] of Object.entries(answer.scores)) {
      totals[key] = (totals[key] ?? 0) + value
    }
  }

  let bestType = ''
  let bestScore = Number.NEGATIVE_INFINITY

  for (const [type, score] of Object.entries(totals)) {
    if (score > bestScore) {
      bestType = type
      bestScore = score
    }
  }

  return bestType
}
