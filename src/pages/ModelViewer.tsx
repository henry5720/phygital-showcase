import { useEffect, useRef } from 'react'
import sceneHtml from '@/features/ar/scene.html?raw'
import sceneCss from '@/features/ar/styles.css?raw'

type AFrameWindow = Window & typeof globalThis & {
  AFRAME?: {
    components?: Record<string, unknown>
    registerComponent: (name: string, def: Record<string, unknown>) => void
  }
}

function getAFrameWindow(): AFrameWindow {
  return window as AFrameWindow
}

function isAframeReady() {
  return typeof getAFrameWindow().AFRAME !== 'undefined'
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

function injectScene(container: HTMLElement): HTMLStyleElement {
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

type AFrameSceneElement = HTMLElement & {
  renderer?: { setAnimationLoop?: (callback: null) => void }
  pause?: () => void
}

function destroyScene(container: HTMLElement, style: HTMLStyleElement) {
  const sceneEl = container.querySelector('a-scene') as AFrameSceneElement | null
  if (sceneEl) {
    try { sceneEl.renderer?.setAnimationLoop?.(null) } catch { /* best-effort */ }
    try { sceneEl.pause?.() } catch { /* best-effort */ }
  }

  container.querySelectorAll('video').forEach((v) => {
    const video = v as HTMLVideoElement
    video.pause()
    if (video.srcObject instanceof MediaStream) {
      video.srcObject.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
    video.src = ''
  })

  while (container.firstChild) container.removeChild(container.firstChild)
  style.remove()
}

export function ModelViewer() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let styleEl: HTMLStyleElement | null = null
    let cleaned = false

    async function init() {
      await loadScript('https://aframe.io/releases/1.7.0/aframe.min.js', isAframeReady)

      if (cleaned || !container?.isConnected) return

      styleEl = injectScene(container)
    }

    container.innerHTML = '<p style="color:#666;padding:1rem">Loading 3D scene...</p>'

    init().catch((err) => {
      console.error('ModelViewer init failed', err)
      if (container?.isConnected) {
        container.innerHTML = '<p style="color:red;padding:1rem">Failed to load 3D scene</p>'
      }
    })

    return () => {
      cleaned = true
      if (styleEl) destroyScene(container, styleEl)
    }
  }, [])

  return (
    <div className="min-h-dvh bg-background">
      <div ref={containerRef} className="w-full h-dvh" />
    </div>
  )
}
