import * as THREE from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AR_V4_ACTIONS, AR_V4_ASSETS } from './assets'
import { createMindArV4Experience } from './createMindArV4Experience'

const loadMock = vi.fn()
const setAnimationLoopMock = vi.fn()
const renderMock = vi.fn()
const addAnchorMock = vi.fn()
const startMock = vi.fn()
const stopMock = vi.fn()

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: vi.fn(function () {
    return {
      load: loadMock,
    }
  }),
}))

vi.mock('mind-ar/dist/mindar-image-three.prod.js', () => ({
  MindARThree: vi.fn(function () {
    return {
      renderer: {
        setAnimationLoop: setAnimationLoopMock,
        render: renderMock,
      },
      scene: new THREE.Scene(),
      camera: new THREE.Camera(),
      addAnchor: addAnchorMock,
      start: startMock,
      stop: stopMock,
    }
  }),
}))

describe('createMindArV4Experience', () => {
  afterEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('starts the MindAR runtime and stops rendering during cleanup', async () => {
    const anchor = { group: new THREE.Group() }
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockResolvedValue(undefined)
    stopMock.mockResolvedValue(undefined)
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: new THREE.Group() })
    })
    const container = document.createElement('div')

    const experience = await createMindArV4Experience({
      container,
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
    })

    expect(startMock).toHaveBeenCalledTimes(1)
    expect(setAnimationLoopMock).toHaveBeenCalledWith(expect.any(Function))

    experience.cleanup()

    expect(setAnimationLoopMock).toHaveBeenLastCalledWith(null)
    expect(stopMock).toHaveBeenCalledTimes(1)
  })
})
