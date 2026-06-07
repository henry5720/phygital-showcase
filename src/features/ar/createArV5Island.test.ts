import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createArV5Island } from './createArV5Island'

const aframeScript = 'https://aframe.io/releases/1.5.0/aframe.min.js'
const mindarScript = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js'

vi.mock('./ar-v5-interactions', () => ({
  initArV5Experience: vi.fn(() => vi.fn()),
  cleanupArV5Artifacts: vi.fn(),
}))

vi.mock('./scene.html?raw', () => ({
  default: '<a-scene><a-entity id="ar-v5-target" mindar-image-target="targetIndex: 0"></a-entity></a-scene>',
}))

vi.mock('./styles.css?raw', () => ({
  default: '.ar-container { display: block; }',
}))

function appendLoadedScript(src: string) {
  const script = document.createElement('script')
  script.src = src
  script.setAttribute('data-loaded', 'true')
  document.head.appendChild(script)
}

function setupAframe() {
  const w = window as unknown as Record<string, unknown>
  w.AFRAME = {
    components: { 'mindar-image': {} },
    registerComponent: vi.fn(),
  }
}

describe('createArV5Island', () => {
  let disconnectObserver: (() => void) | undefined

  beforeEach(() => {
    setupAframe()
    appendLoadedScript(aframeScript)
    appendLoadedScript(mindarScript)

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLElement && node.tagName === 'A-SCENE') {
            node.dispatchEvent(new Event('loaded'))
          }
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    disconnectObserver = () => observer.disconnect()
  })

  afterEach(() => {
    disconnectObserver?.()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    document.head.innerHTML = ''
    delete (window as unknown as Record<string, unknown>).AFRAME
  })

  it('injects scene HTML and CSS into container', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = await createArV5Island(container)

    expect(container.querySelector('a-scene')).not.toBeNull()
    expect(document.head.querySelector('style')?.textContent).toContain('.ar-container')
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

  it('returns noop cleanup and does not report errors for already detached containers', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const onError = vi.fn()

    container.remove()
    const cleanup = await createArV5Island(container, { onError })

    expect(onError).not.toHaveBeenCalled()
    expect(() => cleanup()).not.toThrow()
  })

  it('forwards targetFound and targetLost callbacks', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const onTargetFound = vi.fn()
    const onTargetLost = vi.fn()

    const cleanup = await createArV5Island(container, { onTargetFound, onTargetLost })
    const target = container.querySelector('#ar-v5-target')

    target?.dispatchEvent(new Event('targetFound'))
    target?.dispatchEvent(new Event('targetLost'))

    expect(onTargetFound).toHaveBeenCalledTimes(1)
    expect(onTargetLost).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('does not forward callbacks after cleanup', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const onTargetFound = vi.fn()
    const cleanup = await createArV5Island(container, { onTargetFound })

    cleanup()

    const target = container.querySelector('#ar-v5-target')
    target?.dispatchEvent(new Event('targetFound'))
    expect(onTargetFound).not.toHaveBeenCalled()
  })
})
