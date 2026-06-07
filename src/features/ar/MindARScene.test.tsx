import { render } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MindARScene } from './MindARScene'
import type { ArV5IslandCallbacks } from './createArV5Island'

vi.mock('./createArV5Island', () => ({
  createArV5Island: vi.fn().mockResolvedValue(() => {}),
}))

describe('MindARScene', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a container div', () => {
    const { container } = render(<MindARScene />)
    expect(container.querySelector('.absolute.inset-0')).not.toBeNull()
  })

  it('calls createArV5Island on mount', async () => {
    const { createArV5Island } = await import('./createArV5Island')
    render(<MindARScene />)
    expect(createArV5Island).toHaveBeenCalledTimes(1)
  })

  it('calls cleanup on unmount', async () => {
    const cleanup = vi.fn()
    const { createArV5Island } = await import('./createArV5Island')
    vi.mocked(createArV5Island).mockResolvedValue(cleanup)

    const { unmount } = render(<MindARScene />)
    unmount()

    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1))
  })

  it('does not re-initialize on callback prop changes', async () => {
    const { createArV5Island } = await import('./createArV5Island')
    const onReady1 = vi.fn()
    const { rerender } = render(<MindARScene onReady={onReady1} />)

    rerender(<MindARScene onReady={vi.fn()} />)

    expect(createArV5Island).toHaveBeenCalledTimes(1)
  })

  it('forwards events to the latest callback props after rerender', async () => {
    const { createArV5Island } = await import('./createArV5Island')
    const onReady1 = vi.fn()
    const onReady2 = vi.fn()
    const { rerender } = render(<MindARScene onReady={onReady1} />)

    const callbacks = vi.mocked(createArV5Island).mock.calls[0][1] as ArV5IslandCallbacks
    rerender(<MindARScene onReady={onReady2} />)
    callbacks.onReady?.()

    expect(onReady1).not.toHaveBeenCalled()
    expect(onReady2).toHaveBeenCalledTimes(1)
  })

  it('passes navigate through to createArV5Island callbacks', async () => {
    const { createArV5Island } = await import('./createArV5Island')
    const navigate = vi.fn()

    render(<MindARScene navigate={navigate} />)

    const callbacks = vi.mocked(createArV5Island).mock.calls[0][1] as ArV5IslandCallbacks
    callbacks.navigate?.('/product')
    expect(navigate).toHaveBeenCalledWith('/product')
  })
})
