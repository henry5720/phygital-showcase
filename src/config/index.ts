import tokensRaw from './tokens/fizzt.json'
import quizRaw from './quiz/fizzt.json'
import { brandConfig } from './brand/fizzt'
import type { ProductConfig, DesignTokens, QuizConfig } from './types'

export const config: ProductConfig = {
  tokens: tokensRaw as DesignTokens,
  brand: brandConfig,
  quiz: quizRaw as QuizConfig,
}
