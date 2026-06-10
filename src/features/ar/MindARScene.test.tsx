import { render, cleanup } from '@testing-library/react'
import { MindARScene } from './MindARScene'

vi.mock('aframe', () => ({}))
vi.mock('mind-ar/dist/mindar-image-aframe.prod.js', () => ({}))
vi.mock('three/examples/jsm/loaders/RGBELoader.js', () => ({
  RGBELoader: vi.fn(),
}))

describe('MindARScene', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a container div', () => {
    const { container } = render(<MindARScene />)
    expect(container.querySelector('.absolute.inset-0')).not.toBeNull()
  })

  it('renders with ar-container class', () => {
    const { container } = render(<MindARScene />)
    expect(container.querySelector('.ar-container')).not.toBeNull()
  })

  it('accepts callback props without errors', () => {
    const onReady = vi.fn()
    const onTargetFound = vi.fn()
    const onTargetLost = vi.fn()
    const onError = vi.fn()

    render(
      <MindARScene
        onReady={onReady}
        onTargetFound={onTargetFound}
        onTargetLost={onTargetLost}
        onError={onError}
      />,
    )
  })
})
