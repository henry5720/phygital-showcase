import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ResultCard } from './ResultCard'
import type { QuizResult } from '../config/types'

const freshResult: QuizResult = {
  type: 'fresh',
  name: '清新探索型',
  recommendation: '植酌 × 柑橘氣泡飲',
  description: '喜歡嘗試新鮮事物。',
  lineJoinUrl: 'https://line.me/R/ti/p/@fizzt_crm',
}

describe('ResultCard', () => {
  it('renders personality name', () => {
    render(<ResultCard result={freshResult} onJoinLine={vi.fn()} />)
    expect(screen.getByText('清新探索型')).toBeInTheDocument()
  })

  it('renders recommendation', () => {
    render(<ResultCard result={freshResult} onJoinLine={vi.fn()} />)
    expect(screen.getByText('植酌 × 柑橘氣泡飲')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<ResultCard result={freshResult} onJoinLine={vi.fn()} />)
    expect(screen.getByText('喜歡嘗試新鮮事物。')).toBeInTheDocument()
  })

  it('calls onJoinLine when LINE button clicked', async () => {
    const onJoinLine = vi.fn()
    render(<ResultCard result={freshResult} onJoinLine={onJoinLine} />)
    await userEvent.click(screen.getByRole('button', { name: /LINE/ }))
    expect(onJoinLine).toHaveBeenCalledTimes(1)
  })
})
