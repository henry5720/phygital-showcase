import { loadGLB } from './loadGLB'
import * as THREE from 'three'

const { mockScene, gltfLoaderInstance } = vi.hoisted(() => {
  const mockScene = {
    isGroup: true,
    traverse: vi.fn(),
  }
  const mockGltf = { scene: mockScene }
  const gltfLoaderInstance = {
    load: vi.fn((_url: string, onLoad: (gltf: typeof mockGltf) => void) => {
      onLoad(mockGltf)
    }),
  }
  return { mockScene, gltfLoaderInstance }
})

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => {
  class MockGLTFLoader {
    constructor() {
      return gltfLoaderInstance
    }
  }
  return {
    GLTFLoader: MockGLTFLoader,
  }
})

describe('loadGLB', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads a GLB file and returns the scene group', async () => {
    const model = await loadGLB('/assets/web-ar/fizzt.glb')

    expect(model).toBeDefined()
    expect(model).toBe(mockScene)
  })

  it('accepts optional envMap parameter', async () => {
    const mockEnvMap = {} as THREE.Texture
    const model = await loadGLB('/assets/web-ar/fizzt.glb', mockEnvMap)

    expect(model).toBeDefined()
  })
})
