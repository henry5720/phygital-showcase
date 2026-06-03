import { describe, it, expect } from 'vitest'
import { calculateResult } from './quiz'
import type { QuizOption } from '../config/types'

const fresh: QuizOption = { text: '清爽', scores: { fresh: 2, ritual: 0, layered: 0 } }
const ritual: QuizOption = { text: '儀式', scores: { fresh: 0, ritual: 2, layered: 0 } }
const layered: QuizOption = { text: '層次', scores: { fresh: 0, ritual: 0, layered: 2 } }
const mixedFreshRitual: QuizOption = { text: '混合', scores: { fresh: 1, ritual: 1, layered: 0 } }

describe('calculateResult', () => {
  it('returns "fresh" when all fresh answers selected', () => {
    expect(calculateResult([fresh, fresh, fresh])).toBe('fresh')
  })

  it('returns "ritual" when ritual scores dominate', () => {
    expect(calculateResult([ritual, ritual, mixedFreshRitual])).toBe('ritual')
  })

  it('returns "layered" when layered scores dominate', () => {
    expect(calculateResult([layered, layered, fresh])).toBe('layered')
  })

  it('sums scores across all answers', () => {
    expect(calculateResult([fresh, mixedFreshRitual])).toBe('fresh')
  })

  it('throws when no answers provided', () => {
    expect(() => calculateResult([])).toThrow('No answers provided')
  })
})
