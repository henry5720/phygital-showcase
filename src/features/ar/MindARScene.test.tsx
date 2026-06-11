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

  it('renders an a-scene element', () => {
    const { container } = render(<MindARScene />)
    expect(container.querySelector('a-scene')).not.toBeNull()
  })

  it('sets mindar-image attribute on scene', () => {
    const { container } = render(<MindARScene />)
    const scene = container.querySelector('a-scene')
    expect(scene?.getAttribute('mindar-image')).toContain('card.mind')
  })

  it('sets hdr-environment attribute on scene', () => {
    const { container } = render(<MindARScene />)
    const scene = container.querySelector('a-scene')
    expect(scene?.getAttribute('hdr-environment')).toContain('env.hdr')
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
