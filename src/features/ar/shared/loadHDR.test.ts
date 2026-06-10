import { loadHDR } from './loadHDR'
import * as THREE from 'three'

const mockEnvMap = {
  mapping: 301,
  colorSpace: 'srgb',
  needsUpdate: false,
  dispose: vi.fn(),
}

const mockTexture = {
  mapping: 0,
  colorSpace: '',
  needsUpdate: false,
  dispose: vi.fn(),
}

vi.mock('three/examples/jsm/loaders/RGBELoader.js', () => {
  const RGBELoaderInstance = {
    load: vi.fn((_url: string, onLoad: (texture: typeof mockTexture) => void) => {
      onLoad(mockTexture)
    }),
  }
  class MockRGBELoader {
    constructor() {
      return RGBELoaderInstance
    }
  }
  return {
    RGBELoader: MockRGBELoader,
  }
})

vi.mock('three', () => {
  const PMREMGeneratorInstance = {
    compileEquirectangularShader: vi.fn(),
    fromEquirectangular: vi.fn(() => ({ texture: mockEnvMap })),
    dispose: vi.fn(),
  }
  class MockPMREMGenerator {
    constructor() {
      return PMREMGeneratorInstance
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
    expect(texture.mapping).toBe(301) // EquirectangularReflectionMapping
  })

  it('sets texture.mapping to EquirectangularReflectionMapping', async () => {
    const mockRenderer = { domElement: document.createElement('canvas') } as unknown as THREE.WebGLRenderer
    const texture = await loadHDR('/test.hdr', mockRenderer)

    expect(texture.mapping).toBe(301)
  })
})
