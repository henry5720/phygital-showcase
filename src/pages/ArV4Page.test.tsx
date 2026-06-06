import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { ArV4Page } from './ArV4Page'
import type { ArV4ExperienceProps } from '../components/ar-v4/ArV4Experience'

vi.mock('../components/ar-v4/ArV4Experience', () => ({
  ArV4Experience: ({ onAction }: ArV4ExperienceProps) => (
    <div data-testid="mock-experience">
      <button onClick={() => onAction?.('profile')}>Trigger Profile</button>
      <button onClick={() => onAction?.('web')}>Trigger Web</button>
    </div>
  ),
}))

describe('ArV4Page', () => {
  it('renders title and handles action selection', () => {
    render(
      <MemoryRouter>
        <ArV4Page />
      </MemoryRouter>
    )

    expect(screen.getByText(/AR V4/i)).toBeInTheDocument()
    
    // Initially should show status and a hint
    expect(screen.getByText(/initializing/i)).toBeInTheDocument()
    
    // Trigger profile action
    fireEvent.click(screen.getByText('Trigger Profile'))
    expect(screen.getByText('AR, VR solutions and consultation')).toBeInTheDocument()
    
    // Trigger web action
    fireEvent.click(screen.getByText('Trigger Web'))
    expect(screen.getAllByText('https://softmind.tech').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('link', { name: 'https://softmind.tech' })).toBeInTheDocument()
  })
})
