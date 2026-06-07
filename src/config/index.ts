import quizRaw from './quiz/fizzt.json'
import { brandConfig } from './brand/fizzt'
import type { ProductConfig, QuizConfig } from './types'

export const config: ProductConfig = {
  brand: brandConfig,
  quiz: quizRaw as QuizConfig,
}
