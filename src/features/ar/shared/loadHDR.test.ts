import { loadHDR } from './loadHDR'
import * as THREE from 'three'

const { mockEnvMap, mockTexture, pmremGeneratorInstance, hdrloaderInstance } = vi.hoisted(() => ({
  mockEnvMap: {
    mapping: 301,
    colorSpace: 'srgb',
    needsUpdate: false,
    dispose: vi.fn(),
  },
  mockTexture: {
    mapping: 0,
    colorSpace: '',
    needsUpdate: false,
    dispose: vi.fn(),
  },
  pmremGeneratorInstance: {
    compileEquirectangularShader: vi.fn(),
    fromEquirectangular: vi.fn(() => ({ texture: mockEnvMap })),
    dispose: vi.fn(),
  },
  hdrloaderInstance: {
    load: vi.fn((_url: string, onLoad: (texture: typeof mockTexture) => void) => {
      onLoad(mockTexture)
    }),
  },
}))

vi.mock('three/examples/jsm/loaders/HDRLoader.js', () => {
  class MockHDRLoader {
    constructor() {
      return hdrloaderInstance
    }
  }
  return {
    HDRLoader: MockHDRLoader,
  }
})

vi.mock('three', () => {
  class MockPMREMGenerator {
    constructor() {
      return pmremGeneratorInstance
    }
  }
  return {
    PMREMGenerator: MockPMREMGenerator,
    EquirectangularReflectionMapping: 301,
    SRGBColorSpace: 'srgb',
  }
})

describe('loadHDR', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads an HDR file and returns a texture', async () => {
    const mockRenderer = { domElement: document.createElement('canvas') } as unknown as THREE.WebGLRenderer
    const texture = await loadHDR('/assets/web-ar/env.hdr', mockRenderer)

    expect(texture).toBeDefined()
    expect(texture.mapping).toBe(301)
  })

  it('rejects when HDR loading fails', async () => {
    hdrloaderInstance.load.mockImplementationOnce(
      (_url: string, _onLoad: unknown, _onProgress: unknown, onError: (error: Error) => void) => {
        onError(new Error('Load failed'))
      },
    )

    const mockRenderer = { domElement: document.createElement('canvas') } as unknown as THREE.WebGLRenderer
    await expect(loadHDR('/bad.hdr', mockRenderer)).rejects.toThrow('Load failed')
  })

  it('disposes PMREMGenerator after processing', async () => {
    const mockRenderer = { domElement: document.createElement('canvas') } as unknown as THREE.WebGLRenderer
    await loadHDR('/test.hdr', mockRenderer)

    expect(pmremGeneratorInstance.dispose).toHaveBeenCalled()
  })
})
