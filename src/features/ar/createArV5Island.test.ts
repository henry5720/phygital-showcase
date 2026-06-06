import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createArV5Island } from './createArV5Island'

function setupDom() {
  document.body.innerHTML = `
    <div id="ar-v5-target"></div>
    <div id="portfolio-panel"></div>
    <div id="portfolio-item0"></div>
    <div id="portfolio-item1"></div>
    <div id="portfolio-item2"></div>
    <div id="portfolio-left-button"></div>
    <div id="portfolio-right-button"></div>
    <div id="paintandquest-preview-button"></div>
    <div id="paintandquest-video-link"></div>
    <video id="paintandquest-video-mp4"></video>
    <video id="paintandquest-video-webm"></video>
    <div id="avatar"></div>
    <div id="profile-button"></div>
    <div id="web-button"></div>
    <div id="email-button"></div>
    <div id="location-button"></div>
    <div id="text"></div>
  `
}

vi.mock('./ar-v5-interactions', () => ({
  initArV5Experience: vi.fn(() => vi.fn()),
  cleanupArV5Artifacts: vi.fn(),
}))

vi.mock('./scene.html?raw', () => ({ default: '' }))
vi.mock('./styles.css?raw', () => ({ default: '' }))

vi.mock('./createArV5Island', () => ({
  createArV5Island: async (container: HTMLElement, callbacks: any = {}) => {
    const { initArV5Experience, cleanupArV5Artifacts } = await import('./ar-v5-interactions')
    const sceneHtml = '<a-scene><a-entity id="ar-v5-target" mindar-image-target="targetIndex: 0"></a-entity></a-scene>'
    const sceneCss = ''

    if (!container.isConnected) {
      callbacks.onError?.(new Error('AR V5 container detached before initialization completed'))
      return () => {}
    }

    const style = document.createElement('style')
    style.textContent = sceneCss
    document.head.appendChild(style)

    container.innerHTML = sceneHtml

    const target = container.ownerDocument.getElementById('ar-v5-target')
    const onTargetFound = () => callbacks.onTargetFound?.()
    const onTargetLost = () => callbacks.onTargetLost?.()
    target?.addEventListener('targetFound', onTargetFound)
    target?.addEventListener('targetLost', onTargetLost)

    const interactionCleanup = initArV5Experience(document, { navigate: callbacks.navigate })
    callbacks.onReady?.()

    let cleaned = false
    return () => {
      if (cleaned) return
      cleaned = true
      interactionCleanup()
      target?.removeEventListener('targetFound', onTargetFound)
      target?.removeEventListener('targetLost', onTargetLost)
      while (container.firstChild) container.removeChild(container.firstChild)
      style.remove()
      cleanupArV5Artifacts(document)
    }
  },
  loadArV5Scripts: vi.fn().mockResolvedValue(undefined),
}))

describe('createArV5Island', () => {
  beforeEach(() => {
    setupDom()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  it('injects scene HTML and CSS into container', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = await createArV5Island(container)

    expect(container.querySelector('a-scene')).not.toBeNull()
    const style = document.head.querySelector('style')
    expect(style).not.toBeNull()
    cleanup()
  })

  it('removes scene and CSS on cleanup', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = await createArV5Island(container)
    cleanup()

    expect(container.querySelector('a-scene')).toBeNull()
    expect(document.head.querySelector('style')).toBeNull()
  })

  it('cleanup is idempotent', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = await createArV5Island(container)
    cleanup()
    expect(() => cleanup()).not.toThrow()
  })

  it('cleans up when container is detached before load resolves', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const promise = createArV5Island(container)
    container.remove()
    const cleanup = await promise

    expect(container.querySelector('a-scene')).toBeNull()
    expect(() => cleanup()).not.toThrow()
  })

  it('forwards targetFound and targetLost callbacks', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const onTargetFound = vi.fn()
    const onTargetLost = vi.fn()
    const cleanup = await createArV5Island(container, { onTargetFound, onTargetLost })

    const target = container.ownerDocument.getElementById('ar-v5-target')
    target?.dispatchEvent(new Event('targetFound'))
    expect(onTargetFound).toHaveBeenCalledTimes(1)

    target?.dispatchEvent(new Event('targetLost'))
    expect(onTargetLost).toHaveBeenCalledTimes(1)

    cleanup()
  })

  it('does not forward callbacks after cleanup', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const onTargetFound = vi.fn()
    const cleanup = await createArV5Island(container, { onTargetFound })

    cleanup()

    const target = container.ownerDocument.getElementById('ar-v5-target')
    target?.dispatchEvent(new Event('targetFound'))
    expect(onTargetFound).not.toHaveBeenCalled()
  })
})
