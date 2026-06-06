import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMindArV4Experience } from '../../lib/ar-v4/createMindArV4Experience'
import { ArV4Experience } from './ArV4Experience'

vi.mock('../../lib/ar-v4/createMindArV4Experience', () => ({
  createMindArV4Experience: vi.fn(),
}))

describe('ArV4Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls createMindArV4Experience on mount and cleanup on unmount', async () => {
    const cleanup = vi.fn()
    vi.mocked(createMindArV4Experience).mockResolvedValue({ cleanup })

    const { unmount } = render(<ArV4Experience />)

    expect(createMindArV4Experience).toHaveBeenCalledTimes(1)
    const options = vi.mocked(createMindArV4Experience).mock.calls[0][0]
    expect(options.container).toBeInstanceOf(HTMLElement)

    // Wait for the promise to resolve internally so the cleanup is registered
    await vi.waitFor(() => expect(vi.mocked(createMindArV4Experience)).toHaveBeenCalled())
    
    unmount()
    
    // Cleanup is called after the promise resolves
    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1))
  })

  it('renders a container with expected styles', () => {
    vi.mocked(createMindArV4Experience).mockResolvedValue({ cleanup: vi.fn() })
    render(<ArV4Experience />)
    const container = screen.getByTestId('ar-v4-container')
    expect(container).toBeDefined()
    expect(container).toHaveClass('absolute', 'inset-0', 'overflow-hidden')
  })
  
  it('forwards callback props via refs without re-initializing', async () => {
    const cleanup = vi.fn()
    vi.mocked(createMindArV4Experience).mockResolvedValue({ cleanup })
    
    const onReady1 = vi.fn()
    const { rerender } = render(<ArV4Experience onReady={onReady1} />)
    
    expect(createMindArV4Experience).toHaveBeenCalledTimes(1)
    const capturedOptions = vi.mocked(createMindArV4Experience).mock.calls[0][0]
    
    // Rerender with new callback
    const onReady2 = vi.fn()
    rerender(<ArV4Experience onReady={onReady2} />)
    
    // Should NOT have called createMindArV4Experience again
    expect(createMindArV4Experience).toHaveBeenCalledTimes(1)
    
    // Calling the captured onReady should call the LATEST prop
    capturedOptions.onReady!()
    expect(onReady1).not.toHaveBeenCalled()
    expect(onReady2).toHaveBeenCalledTimes(1)
  })
})
