import { render, screen, fireEvent } from '@testing-library/react'
import { VideoOverlay } from './VideoOverlay'

describe('VideoOverlay', () => {
  it('renders video with given src', () => {
    render(
      <VideoOverlay
        src="/test/video.mp4"
        onEnd={vi.fn()}
        onClose={vi.fn()}
      />
    )
    const video = screen.getByRole('video') as HTMLVideoElement
    expect(video.src).toContain('/test/video.mp4')
  })

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn()
    render(
      <VideoOverlay src="/test/video.mp4" onEnd={vi.fn()} onClose={onClose} />
    )
    fireEvent.click(screen.getByRole('button', { name: '✕' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onEnd when video ends', () => {
    const onEnd = vi.fn()
    render(
      <VideoOverlay src="/test/video.mp4" onEnd={onEnd} onClose={vi.fn()} />
    )
    fireEvent.ended(screen.getByRole('video'))
    expect(onEnd).toHaveBeenCalledTimes(1)
  })
})
