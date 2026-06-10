import { render, cleanup } from '@testing-library/react'
import { MindARScene } from './MindARScene'

vi.mock('../shared/setupRenderer', () => ({
  setupRenderer: vi.fn(() => ({
    renderer: {
      setAnimationLoop: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
    },
    dispose: vi.fn(),
  })),
}))

vi.mock('../shared/loadHDR', () => ({
  loadHDR: vi.fn(() => Promise.resolve({})),
}))

vi.mock('../shared/loadGLB', () => ({
  loadGLB: vi.fn(() => Promise.resolve({})),
}))

vi.mock('mind-ar/dist/mindar-image-three.prod.js', () => ({
  MindARThree: class {
    renderer = { setAnimationLoop: vi.fn(), render: vi.fn(), dispose: vi.fn(), domElement: document.createElement('canvas'), setSize: vi.fn() }
    scene = {}
    camera = {}
    onTargetFound?: () => void
    onTargetLost?: () => void
    addAnchor = vi.fn(() => ({ group: { add: vi.fn() } }))
    start = vi.fn()
    stop = vi.fn()
  },
}))

describe('MindARScene', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a container div', () => {
    const { container } = render(<MindARScene />)
    expect(container.firstChild).toBeDefined()
  })

  it('calls onReady after initialization', async () => {
    const onReady = vi.fn()
    render(<MindARScene onReady={onReady} />)

    await vi.waitFor(() => {
      expect(onReady).toHaveBeenCalled()
    })
  })

  it('calls onError when initialization fails', async () => {
    const { loadHDR } = await import('../shared/loadHDR')
    vi.mocked(loadHDR).mockRejectedValueOnce(new Error('HDR failed'))

    const onError = vi.fn()
    render(<MindARScene onError={onError} />)

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })
})
