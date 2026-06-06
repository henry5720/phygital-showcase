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
    document.head.querySelectorAll('style').forEach((style) => style.remove())
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

  it('removes MindAR overlay styles from document head during cleanup', async () => {
    const style = document.createElement('style')
    style.textContent = '.mindar-ui-overlay { display: block; }'
    document.head.appendChild(style)
    const anchor = { group: new THREE.Group() }
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockResolvedValue(undefined)
    stopMock.mockResolvedValue(undefined)
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: new THREE.Group() })
    })

    const experience = await createMindArV4Experience({
      container: document.createElement('div'),
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
    })

    experience.cleanup()

    expect(style.isConnected).toBe(false)
  })

  it('runs cleanup only once when called repeatedly', async () => {
    const anchor = { group: new THREE.Group() }
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockResolvedValue(undefined)
    stopMock.mockResolvedValue(undefined)
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: new THREE.Group() })
    })

    const experience = await createMindArV4Experience({
      container: document.createElement('div'),
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
    })

    experience.cleanup()
    experience.cleanup()

    expect(setAnimationLoopMock).toHaveBeenCalledWith(expect.any(Function))
    expect(setAnimationLoopMock).toHaveBeenCalledWith(null)
    expect(setAnimationLoopMock).toHaveBeenCalledTimes(2)
    expect(stopMock).toHaveBeenCalledTimes(1)
  })

  it('cleans up without calling onReady when the container detaches before start resolves', async () => {
    const anchor = { group: new THREE.Group() }
    const onReady = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockImplementation(async () => {
      container.remove()
    })
    stopMock.mockResolvedValue(undefined)
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: new THREE.Group() })
    })

    await createMindArV4Experience({
      container,
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
      onReady,
    })

    expect(onReady).not.toHaveBeenCalled()
    expect(stopMock).toHaveBeenCalledTimes(1)
  })
})
