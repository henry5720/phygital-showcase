import sceneHtml from './scene.html?raw'
import sceneCss from './styles.css?raw'
import { initArV5Experience, cleanupArV5Artifacts } from './ar-v5-interactions'

type ArWindow = Window & typeof globalThis & {
  AFRAME?: {
    components?: Record<string, unknown>;
    registerComponent: (name: string, def: Record<string, unknown>) => void;
    systems?: Record<string, { start?: () => void; stop?: () => void }>;
  }
}

declare const THREE: {
  RGBELoader?: new () => unknown
}

function getArWindow(): ArWindow {
  return window as ArWindow
}

function isAframeReady() {
  return typeof getArWindow().AFRAME !== 'undefined'
}

function isMindArReady() {
  return Boolean(getArWindow().AFRAME?.components?.['mindar-image'])
}

function isRGBELoaderReady() {
  return typeof THREE !== 'undefined' && typeof THREE.RGBELoader !== 'undefined'
}

function isHdrEnvironmentReady() {
  return Boolean(getArWindow().AFRAME?.components?.['hdr-environment'])
}


function loadScript(src: string, isReady: () => boolean): Promise<void> {
  const existing = document.querySelector(`script[src="${src}"]`)
  if (existing) {
    const loaded = existing.getAttribute('data-loaded') === 'true' || isReady()
    if (loaded) {
      existing.setAttribute('data-loaded', 'true')
      return Promise.resolve()
    }
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true })
    })
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => { script.setAttribute('data-loaded', 'true'); resolve() }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

export async function loadArV5Scripts(): Promise<void> {
  await loadScript('https://aframe.io/releases/1.7.0/aframe.min.js', isAframeReady)
  await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/RGBELoader.js', isRGBELoaderReady)
  await loadScript('/src/features/ar/hdr-environment.js', isHdrEnvironmentReady)
  await loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js', isMindArReady)
}

function assertContainerConnected(container: HTMLElement): void {
  if (!container.isConnected) {
    throw new Error('AR V5 container detached before initialization completed')
  }
}

function registerArV5Components(): void {
  const w = getArWindow()
  if (!w.AFRAME?.registerComponent) return
  if (!w.AFRAME.components?.['ar-v5-target']) {
    w.AFRAME.registerComponent('ar-v5-target', { init() {} })
  }
}

function injectArV5Scene(container: HTMLElement): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = sceneCss
  document.head.appendChild(style)

  const parser = new DOMParser()
  const doc = parser.parseFromString(sceneHtml, 'text/html')
  const fragment = document.createDocumentFragment()
  Array.from(doc.body.childNodes).forEach((node) => {
    fragment.appendChild(document.importNode(node, true))
  })
  container.appendChild(fragment)

  return style
}

function waitForArV5SceneLoad(container: HTMLElement): Promise<HTMLElement> {
  const sceneEl = container.querySelector('a-scene') as HTMLElement & { hasLoaded?: boolean } | null
  if (!sceneEl) return Promise.reject(new Error('a-scene not found in container'))
  if (sceneEl.hasLoaded) return Promise.resolve(sceneEl)
  return new Promise<HTMLElement>((resolve) => {
    sceneEl.addEventListener('loaded', () => resolve(sceneEl), { once: true })
  })
}

type AFrameSceneElement = HTMLElement & {
  systems?: Record<string, { stop?: () => void }>
  renderer?: { setAnimationLoop?: (callback: null) => void }
  pause?: () => void
}

function stopMindARSystem(sceneEl: HTMLElement): void {
  const arSystem = (sceneEl as AFrameSceneElement).systems?.['mindar-image-system']
  if (arSystem?.stop) arSystem.stop()
}

function destroyArV5Scene(container: HTMLElement, style: HTMLStyleElement): void {
  const sceneEl = container.querySelector('a-scene') as AFrameSceneElement | null
  if (sceneEl) {
    try { sceneEl.renderer?.setAnimationLoop?.(null) } catch { /* renderer cleanup is best-effort */ }
    try { sceneEl.pause?.() } catch { /* scene pause is best-effort */ }
    try {
      container.querySelectorAll('video').forEach((v) => {
        const video = v as HTMLVideoElement
        video.pause()
        if (video.srcObject instanceof MediaStream) {
          video.srcObject.getTracks().forEach((track) => track.stop())
          video.srcObject = null
        }
        video.src = ''
      })
    } catch { /* video cleanup is best-effort */ }
  }

  document.querySelectorAll('video').forEach((v) => {
    const video = v as HTMLVideoElement
    if (video.srcObject instanceof MediaStream) {
      video.srcObject.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
  })
  while (container.firstChild) container.removeChild(container.firstChild)
  style.remove()
}

export type ArV5IslandCallbacks = {
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onError?: (error: unknown) => void
  navigate?: (url: string) => void
}

export async function createArV5Island(
  container: HTMLElement,
  callbacks: ArV5IslandCallbacks = {},
): Promise<() => void> {
  let styleEl: HTMLStyleElement | null = null
  let interactionCleanup: (() => void) | null = null
  let sceneEl: HTMLElement | null = null
  let cleaned = false

  try {
    assertContainerConnected(container)
    await loadArV5Scripts()
    assertContainerConnected(container)

    registerArV5Components()
    styleEl = injectArV5Scene(container)
    assertContainerConnected(container)

    const loadPromise = waitForArV5SceneLoad(container)
    const timeoutPromise = new Promise<HTMLElement>((_, reject) =>
      setTimeout(() => reject(new Error('scene loaded timeout')), 10000)
    )
    try {
      sceneEl = await Promise.race([loadPromise, timeoutPromise])
    } catch {
      sceneEl = container.querySelector('a-scene') as HTMLElement | null
      if (!sceneEl) {
        throw new Error('a-scene not found')
      }
    }
    assertContainerConnected(container)

    const target = container.querySelector('#ar-v5-target')
    const onTargetFound = () => callbacks.onTargetFound?.()
    const onTargetLost = () => callbacks.onTargetLost?.()
    target?.addEventListener('targetFound', onTargetFound)
    target?.addEventListener('targetLost', onTargetLost)

    interactionCleanup = initArV5Experience(document, { navigate: callbacks.navigate })
    callbacks.onReady?.()

    return () => {
      if (cleaned) return
      cleaned = true
      interactionCleanup?.()
      target?.removeEventListener('targetFound', onTargetFound)
      target?.removeEventListener('targetLost', onTargetLost)
      if (sceneEl) stopMindARSystem(sceneEl)
      if (styleEl) destroyArV5Scene(container, styleEl)
      cleanupArV5Artifacts(document)
    }
  } catch (error) {
    if (sceneEl) stopMindARSystem(sceneEl)
    if (styleEl) destroyArV5Scene(container, styleEl)
    cleanupArV5Artifacts(document)
    if (container.isConnected) callbacks.onError?.(error)
    return () => {}
  }
}
