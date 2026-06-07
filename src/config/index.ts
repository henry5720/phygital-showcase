import quizRaw from './quiz/fizzt.json'
import { brandConfig } from './brand/fizzt'
import type { ProductConfig } from './types'

export const config: ProductConfig = {
  brand: brandConfig,
  quiz: quizRaw satisfies ProductConfig['quiz'],
}
