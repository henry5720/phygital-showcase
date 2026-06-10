import { render, cleanup } from '@testing-library/react'
import { ModelViewerScene } from './ModelViewerScene'

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    },
  )
})

vi.mock('../shared/setupRenderer', () => ({
  setupRenderer: vi.fn(() => ({
    renderer: {
      setAnimationLoop: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
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

vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn(() => ({
    enableDamping: true,
    dispose: vi.fn(),
    update: vi.fn(),
    target: { set: vi.fn() },
  })),
}))

describe('ModelViewerScene', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a container div', () => {
    const { container } = render(<ModelViewerScene />)
    expect(container.firstChild).toBeDefined()
  })

  it('calls onError when initialization fails', async () => {
    const { loadHDR } = await import('../shared/loadHDR')
    vi.mocked(loadHDR).mockRejectedValueOnce(new Error('HDR load failed'))

    const onError = vi.fn()
    render(<ModelViewerScene onError={onError} />)

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })
})
