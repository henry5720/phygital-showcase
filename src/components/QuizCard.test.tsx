import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QuizCard } from './QuizCard'
import type { QuizQuestion } from '../config/types'

const question: QuizQuestion = {
  id: 'q1',
  text: '你偏好的風味是？',
  options: [
    { text: '清爽果香', scores: { fresh: 2 } },
    { text: '層次豐富', scores: { layered: 2 } },
  ],
}

describe('QuizCard', () => {
  it('renders question text', () => {
    render(<QuizCard question={question} questionNumber={1} total={5} onSelect={vi.fn()} />)
    expect(screen.getByText('你偏好的風味是？')).toBeInTheDocument()
  })

  it('renders all option buttons', () => {
    render(<QuizCard question={question} questionNumber={1} total={5} onSelect={vi.fn()} />)
    expect(screen.getByText('清爽果香')).toBeInTheDocument()
    expect(screen.getByText('層次豐富')).toBeInTheDocument()
  })

  it('calls onSelect with the chosen option when clicked', async () => {
    const onSelect = vi.fn()
    render(<QuizCard question={question} questionNumber={1} total={5} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('清爽果香'))
    expect(onSelect).toHaveBeenCalledWith(question.options[0])
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('shows progress indicator', () => {
    render(<QuizCard question={question} questionNumber={3} total={5} onSelect={vi.fn()} />)
    expect(screen.getByText('3 / 5')).toBeInTheDocument()
  })
})
