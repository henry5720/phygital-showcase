import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ArV2Page } from './ArV2Page'

vi.mock('../components/ArV2Scene', () => ({
  ArV2Scene: () => <div data-testid="ar-v2-scene" />,
}))

describe('ArV2Page', () => {
  it('renders the validation-page shell and scene mount', () => {
    render(
      <MemoryRouter>
        <ArV2Page />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'AR V2 驗證頁' })).toBeInTheDocument()
    expect(screen.getByText('使用官網 demo 素材，先確認 A-Frame + MindAR 流程可跑。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '← 返回 AR 首頁' })).toBeInTheDocument()
    expect(screen.getByTestId('ar-v2-scene')).toBeInTheDocument()
  })
})
