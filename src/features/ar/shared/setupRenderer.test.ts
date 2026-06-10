import { setupRenderer } from './setupRenderer'

vi.mock('three', () => {
  class MockWebGLRenderer {
    toneMapping = 0
    outputColorSpace = ''
    pixelRatio = 1
    sortObjects = false
    dispose = vi.fn()
    domElement = document.createElement('canvas')
    setAnimationLoop = vi.fn()
    render = vi.fn()
    setSize = vi.fn()
    setPixelRatio = vi.fn()
  }
  return {
    WebGLRenderer: MockWebGLRenderer,
    ACESFilmicToneMapping: 4,
    SRGBColorSpace: 'srgb',
  }
})

describe('setupRenderer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a WebGLRenderer with correct defaults', () => {
    const { renderer } = setupRenderer(document.createElement('div'))

    expect(renderer).toBeDefined()
    expect(renderer.toneMapping).toBe(4) // ACESFilmicToneMapping
    expect(renderer.outputColorSpace).toBe('srgb')
    expect(renderer.sortObjects).toBe(true)
  })

  it('accepts custom alpha option', () => {
    const container = document.createElement('div')
    const { renderer } = setupRenderer(container, { alpha: false })

    expect(renderer).toBeDefined()
  })

  it('returns a dispose function that cleans up', () => {
    const container = document.createElement('div')
    const { dispose } = setupRenderer(container)

    dispose()
    // No assertion needed — just verify it doesn't throw
  })
})