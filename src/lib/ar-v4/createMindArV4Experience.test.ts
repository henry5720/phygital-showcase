import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AR_V4_ACTIONS, AR_V4_ASSETS } from './assets'
import { createMindArV4Experience } from './createMindArV4Experience'

const loadMock = vi.fn()
const setAnimationLoopMock = vi.fn()
const renderMock = vi.fn()
const addAnchorMock = vi.fn()
const startMock = vi.fn()
const stopMock = vi.fn()
let sceneMock: THREE.Scene
let cameraMock: THREE.Camera

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: vi.fn(function () {
    return {
      load: loadMock,
    }
  }),
}))

vi.mock('mind-ar/dist/mindar-image-three.prod.js', () => ({
  MindARThree: vi.fn(function () {
    sceneMock = new THREE.Scene()
    cameraMock = new THREE.Camera()

    return {
      renderer: {
        setAnimationLoop: setAnimationLoopMock,
        render: renderMock,
        setClearColor: vi.fn(),
      },
      scene: sceneMock,
      camera: cameraMock,
      addAnchor: addAnchorMock,
      start: startMock,
      stop: stopMock,
    }
  }),
}))

describe('createMindArV4Experience', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
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
    setAnimationLoopMock.mock.calls[0]?.[0]()
    expect(renderMock).toHaveBeenCalledWith(sceneMock, cameraMock)

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

  it('disposes GLTF material textures during cleanup', async () => {
    const anchor = { group: new THREE.Group() }
    const texture = new THREE.Texture()
    const material = new THREE.MeshBasicMaterial({ map: texture })
    const geometry = new THREE.BoxGeometry()
    const model = new THREE.Group()
    model.add(new THREE.Mesh(geometry, material))
    const textureDisposeSpy = vi.spyOn(texture, 'dispose')
    const materialDisposeSpy = vi.spyOn(material, 'dispose')
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockResolvedValue(undefined)
    stopMock.mockResolvedValue(undefined)
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: model })
    })

    const experience = await createMindArV4Experience({
      container: document.createElement('div'),
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
    })

    experience.cleanup()

    expect(textureDisposeSpy).toHaveBeenCalledTimes(1)
    expect(materialDisposeSpy).toHaveBeenCalledTimes(1)
  })

  it('cleans partial runtime resources when start rejects', async () => {
    const style = document.createElement('style')
    style.textContent = '.mindar-ui-overlay { display: block; }'
    document.head.appendChild(style)
    const anchor = { group: new THREE.Group() }
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockRejectedValue(new Error('start failed'))
    stopMock.mockResolvedValue(undefined)
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: new THREE.Group() })
    })

    await expect(
      createMindArV4Experience({
        container: document.createElement('div'),
        assets: AR_V4_ASSETS,
        actions: AR_V4_ACTIONS,
      }),
    ).rejects.toThrow('start failed')

    expect(setAnimationLoopMock).toHaveBeenCalledTimes(1)
    expect(setAnimationLoopMock).toHaveBeenCalledWith(null)
    expect(stopMock).toHaveBeenCalledTimes(1)
    expect(style.isConnected).toBe(false)
  })

  it('keeps cleanup safe and idempotent when stop throws', async () => {
    const anchor = { group: new THREE.Group() }
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockResolvedValue(undefined)
    stopMock.mockImplementation(() => {
      throw new Error('stop failed')
    })
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: new THREE.Group() })
    })

    const experience = await createMindArV4Experience({
      container: document.createElement('div'),
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
    })

    expect(() => experience.cleanup()).not.toThrow()
    expect(() => experience.cleanup()).not.toThrow()

    expect(stopMock).toHaveBeenCalledTimes(1)
    expect(setAnimationLoopMock).toHaveBeenCalledTimes(2)
  })

  it('keeps cleanup safe and idempotent when stop rejects', async () => {
    const anchor = { group: new THREE.Group() }
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockResolvedValue(undefined)
    stopMock.mockRejectedValue(new Error('stop rejected'))
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: new THREE.Group() })
    })

    const experience = await createMindArV4Experience({
      container: document.createElement('div'),
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
    })

    expect(() => experience.cleanup()).not.toThrow()
    expect(() => experience.cleanup()).not.toThrow()
    await Promise.resolve()

    expect(stopMock).toHaveBeenCalledTimes(1)
    expect(setAnimationLoopMock).toHaveBeenCalledTimes(2)
  })

  it('triggers onAction when an action button is clicked', async () => {
    const anchor = { group: new THREE.Group() }
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockResolvedValue(undefined)
    stopMock.mockResolvedValue(undefined)
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: new THREE.Group() })
    })

    const onAction = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    await createMindArV4Experience({
      container,
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
      onAction,
    })

    // Find the button in the group (Task 3 buttons are CircleGeometry meshes)
    const button = anchor.group.children.find(
      (child) =>
        child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.CircleGeometry &&
        child.userData.actionId === 'profile',
    )
    expect(button).toBeDefined()

    // Mock Raycaster to hit this button
    const intersectSpy = vi
      .spyOn(THREE.Raycaster.prototype, 'intersectObjects')
      .mockReturnValue([{ object: button } as any])

    // Simulate click
    container.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }),
    )

    expect(onAction).toHaveBeenCalledWith('profile')
    intersectSpy.mockRestore()
  })

  it('plays video when the video plane is clicked', async () => {
    const anchor = { group: new THREE.Group() }
    addAnchorMock.mockReturnValue(anchor)
    startMock.mockResolvedValue(undefined)
    stopMock.mockResolvedValue(undefined)
    loadMock.mockImplementation((_url, onLoad) => {
      onLoad({ scene: new THREE.Group() })
    })

    const container = document.createElement('div')
    document.body.appendChild(container)

    await createMindArV4Experience({
      container,
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
    })

    // Find the video plane (Task 3 video plane is a PlaneGeometry mesh)
    const videoPlane = anchor.group.children.find(
      (child) =>
        child instanceof THREE.Mesh &&
        child.geometry instanceof THREE.PlaneGeometry &&
        child.userData.isVideo,
    )
    expect(videoPlane).toBeDefined()

    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play')

    // Mock Raycaster to hit the video plane
    const intersectSpy = vi
      .spyOn(THREE.Raycaster.prototype, 'intersectObjects')
      .mockReturnValue([{ object: videoPlane } as any])

    // Simulate click
    container.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }),
    )

    expect(playSpy).toHaveBeenCalled()
    intersectSpy.mockRestore()
  })
})
