# 3D Model Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `/3d-model` test page that renders the full A-Frame scene (model + UI elements) without MindAR, allowing developers to preview and adjust 3D assets before Web AR integration.

**Architecture:** Reuse existing `scene.html` and `createArV5Island.ts` utility functions. Load A-Frame + orbit-controls via CDN (skip MindAR). Inject scene into a React page with proper cleanup on unmount.

**Tech Stack:** React 19, A-Frame 1.5.0 (CDN), orbit-controls (CDN), TypeScript, Vite

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/config/routes.ts` | Add `MODEL_VIEWER` route constant |
| `src/pages/ModelViewer.tsx` | New page: load A-Frame, inject scene, add orbit-controls, cleanup |
| `src/router.tsx` | Register `/3d-model` route with lazy loading |

---

## Task 1: Add Route Constant

**Files:**
- Modify: `src/config/routes.ts`

- [ ] **Step 1: Add MODEL_VIEWER to ROUTES**

```typescript
export const ROUTES = {
  HOME: '/',
  AR_GUIDE: '/ar/guide',
  AR_SCANNER: '/ar/scanner',
  QUIZ: '/quiz',
  QUIZ_RESULT: '/quiz/result/:type',
  PRODUCT: '/product',
  MODEL_VIEWER: '/3d-model',
} as const
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/config/routes.ts
git commit -m "feat: add MODEL_VIEWER route constant"
```

---

## Task 2: Create ModelViewer Page

**Files:**
- Create: `src/pages/ModelViewer.tsx`

- [ ] **Step 1: Create ModelViewer.tsx**

```tsx
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

function isOrbitControlsReady() {
  return Boolean(getAFrameWindow().AFRAME?.components?.['orbit-controls'])
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

function addOrbitControls(sceneHtmlEl: Element) {
  const target = sceneHtmlEl.querySelector('#ar-v5-target')
  if (!target) return

  const camera = sceneHtmlEl.querySelector('a-camera')
  if (camera) {
    camera.setAttribute('position', '0 1.6 3')
    camera.setAttribute('look-controls', 'enabled: false')
  }

  const orbitEntity = document.createElement('a-entity')
  orbitEntity.setAttribute('orbit-controls', `
    target: 0 0 0;
    minDistance: 0.5;
    maxDistance: 10;
    rotateSpeed: 0.5;
    zoomSpeed: 1.2;
    enabled: true;
  `)
  orbitEntity.setAttribute('position', '0 1.6 3')
  sceneHtmlEl.appendChild(orbitEntity)
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
      await loadScript('https://aframe.io/releases/1.5.0/aframe.min.js', isAframeReady)
      await loadScript('https://cdn.jsdelivr.net/npm/aframe-orbit-controls-component@1.0.1/dist/aframe-orbit-controls-component.min.js', isOrbitControlsReady)

      if (cleaned || !container.isConnected) return

      styleEl = injectScene(container)
      addOrbitControls(container)
    }

    init().catch(() => {
      if (container.isConnected) {
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/ModelViewer.tsx
git commit -m "feat: add ModelViewer page with A-Frame scene preview"
```

---

## Task 3: Register Route

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: Add MODEL_VIEWER route to router**

```typescript
import { createBrowserRouter } from 'react-router'
import { ROUTES } from './config/routes'
import { ErrorBoundary } from './components/ErrorBoundary'

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { Landing } = await import('./pages/Landing')
      return { Component: Landing }
    },
  },
  {
    path: ROUTES.AR_GUIDE,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { ArGuide } = await import('./pages/ArGuide')
      return { Component: ArGuide }
    },
  },
  {
    path: ROUTES.AR_SCANNER,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { ArScanner } = await import('./pages/ArScanner')
      return { Component: ArScanner }
    },
  },
  {
    path: ROUTES.QUIZ,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { Quiz } = await import('./pages/Quiz')
      return { Component: Quiz }
    },
  },
  {
    path: ROUTES.QUIZ_RESULT,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { QuizResult } = await import('./pages/QuizResult')
      return { Component: QuizResult }
    },
  },
  {
    path: ROUTES.PRODUCT,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { Product } = await import('./pages/Product')
      return { Component: Product }
    },
  },
  {
    path: ROUTES.MODEL_VIEWER,
    errorElement: <ErrorBoundary />,
    lazy: async () => {
      const { ModelViewer } = await import('./pages/ModelViewer')
      return { Component: ModelViewer }
    },
  },
])
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/router.tsx
git commit -m "feat: register /3d-model route with lazy loading"
```

---

## Task 4: Verify Build and Manual Test

**Files:**
- None (verification only)

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: Build succeeds without errors

- [ ] **Step 2: Run dev server**

Run: `pnpm dev`
Expected: Server starts on port 3009

- [ ] **Step 3: Manual test — visit /3d-model**

1. Open `https://localhost:3009/3d-model`
2. Verify A-Frame scene loads with 3D model and UI elements
3. Verify no camera permission request (MindAR not loaded)
4. Verify orbit-controls work (drag to rotate, scroll to zoom)
5. Verify no console errors

- [ ] **Step 4: Manual test — verify AR still works**

1. Open `https://localhost:3009/ar/scanner`
2. Verify Web AR functionality is unaffected

- [ ] **Step 5: Run lint**

Run: `pnpm lint`
Expected: No errors

- [ ] **Step 6: Run tests**

Run: `pnpm test:run`
Expected: All tests pass

---

## Success Criteria

- [ ] `/3d-model` renders full A-Frame scene (model + UI elements)
- [ ] No camera permission request (MindAR not loaded)
- [ ] Orbit-controls work (drag to rotate, scroll to zoom)
- [ ] Scene cleanup on unmount (no memory leak)
- [ ] Existing AR functionality at `/ar/scanner` unaffected
