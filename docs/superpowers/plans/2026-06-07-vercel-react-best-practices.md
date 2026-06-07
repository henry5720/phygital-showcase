# Vercel React Best Practices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 降低初始 bundle 成本、修正 React Compiler blocker、補強 AR 測試覆蓋，並讓專案更符合 Vercel React Best Practices。

**Architecture:** 先修正 correctness 與測試覆蓋，再做效能優化。使用 React Router v7 `lazy` 做 route-level code splitting；將非關鍵 GSAP 動畫改成 effect 內 dynamic import；把設計 token 的 DOM 寫入移到 app startup，只執行一次；最後才啟用 React Compiler，降低除錯成本。

**Tech Stack:** React 19, React Router v7, Vite 8, TypeScript 6, Vitest, ESLint 10, pnpm。

**Spec:** `docs/superpowers/specs/2026-06-07-vercel-react-best-practices-design.md`

---

## 背景與實際掃描結論

這份 plan 取代舊版 `docs/superpowers/plans/2026-06-06-vercel-best-practices.md` 的執行順序與細節。舊版方向 works, but 有幾個風險：

- 舊版使用 `npm`，但專案宣告 `packageManager` 是 `pnpm@10.33.0`，所有指令應改用 `pnpm`。
- 舊版把 React Compiler 視為可解決 `useConfig` DOM side effect 的工具，這不準確；CSS variables 應在 app startup 初始化一次。
- 舊版只修 `MindARScene` render 期間更新 ref，沒有補測 rerender 後是否會呼叫最新版 callback。
- `ArScanner` 目前沒有把 `navigate` 傳給 `MindARScene`，但 `createArV5Island` 已支援 `callbacks.navigate`，這條互動路徑實際上是斷的。
- `createArV5Island.test.ts` 目前 mock 掉 `./createArV5Island` 自己，測試通過不代表 production code 正常。
- `manualChunks` 強切 `vendor-gsap` works, but considering GSAP 是非關鍵動畫，更符合目前專案的做法是先 route split，再用 dynamic import defer GSAP。
- `calculateResult()` 用 `sort()` 找最高分，符合 `js-min-max-loop` 可改成單次迴圈，但優先級低於 correctness 與 bundle splitting。

---

## File Structure

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/features/ar/MindARScene.tsx` | 用 `useEffectEvent` 建立穩定 AR callback bridge，避免 render 中更新 ref |
| Modify | `src/pages/ArScanner.tsx` | 將 React Router `navigate` 傳進 AR island |
| Modify | `src/features/ar/MindARScene.test.tsx` | 驗證 callback rerender 後仍使用最新版、並驗證 navigate 轉接 |
| Modify | `src/features/ar/createArV5Island.ts` | 移除 `any`，補上 best-effort cleanup catch 說明 |
| Modify | `src/features/ar/createArV5Island.test.ts` | 移除 self-mock，改測 production implementation |
| Modify | `src/features/ar/ar-v5-interactions.test.ts` | 移除測試中的 `any` cast |
| Create | `src/config/applyDesignTokens.ts` | app startup 時套用 CSS design tokens |
| Modify | `src/hooks/useConfig.ts` | 保持 pure hook，只回傳 config |
| Modify | `src/hooks/useConfig.test.ts` | 分別測 `applyDesignTokens` 與 pure `useConfig` |
| Modify | `src/main.tsx` | 初始化 design tokens 後 render app |
| Modify | `src/router.tsx` | 改成 React Router v7 lazy route modules |
| Modify | `src/pages/Landing.tsx` | 將 GSAP static import 改為 effect 內 dynamic import |
| Modify | `src/pages/ArGuide.tsx` | 將 GSAP static import 改為 effect 內 dynamic import |
| Modify | `src/components/QuizCard.tsx` | 將 GSAP static import 改為 effect 內 dynamic import |
| Modify | `src/components/ResultCard.tsx` | 將 GSAP static import 改為 effect 內 dynamic import |
| Modify | `src/lib/quiz.ts` | 用單次迴圈取代 sort-for-max |
| Modify | `vite.config.ts` | 在 blocker 修完後用 `@rolldown/plugin-babel` 啟用 React Compiler |
| Modify | `eslint.config.js` | 使用 compiler-aware React Hooks lint preset |

---

### Task 1: 修正 AR callback bridge

**目的:** 修正 `MindARScene` render body 更新 ref 的 lint/Compiler blocker，並補上 callback freshness 與 navigate 轉接測試。

**Files:**
- Modify: `src/features/ar/MindARScene.tsx`
- Modify: `src/pages/ArScanner.tsx`
- Modify: `src/features/ar/MindARScene.test.tsx`

- [ ] **Step 1: 寫入失敗測試**

將 `src/features/ar/MindARScene.test.tsx` 更新成以下內容：

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MindARScene } from './MindARScene'
import type { ArV5IslandCallbacks } from './createArV5Island'

vi.mock('./createArV5Island', () => ({
  createArV5Island: vi.fn().mockResolvedValue(() => {}),
}))

describe('MindARScene', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a container div', () => {
    const { container } = render(<MindARScene />)
    expect(container.querySelector('.absolute.inset-0')).not.toBeNull()
  })

  it('calls createArV5Island on mount', async () => {
    const { createArV5Island } = await import('./createArV5Island')
    render(<MindARScene />)
    expect(createArV5Island).toHaveBeenCalledTimes(1)
  })

  it('calls cleanup on unmount', async () => {
    const cleanup = vi.fn()
    const { createArV5Island } = await import('./createArV5Island')
    vi.mocked(createArV5Island).mockResolvedValue(cleanup)

    const { unmount } = render(<MindARScene />)
    unmount()

    await vi.waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1))
  })

  it('does not re-initialize on callback prop changes', async () => {
    const { createArV5Island } = await import('./createArV5Island')
    const { rerender } = render(<MindARScene onReady={vi.fn()} />)

    rerender(<MindARScene onReady={vi.fn()} />)

    expect(createArV5Island).toHaveBeenCalledTimes(1)
  })

  it('forwards events to the latest callback props after rerender', async () => {
    const { createArV5Island } = await import('./createArV5Island')
    const onReady1 = vi.fn()
    const onReady2 = vi.fn()
    const { rerender } = render(<MindARScene onReady={onReady1} />)

    const callbacks = vi.mocked(createArV5Island).mock.calls[0][1] as ArV5IslandCallbacks
    rerender(<MindARScene onReady={onReady2} />)
    callbacks.onReady?.()

    expect(onReady1).not.toHaveBeenCalled()
    expect(onReady2).toHaveBeenCalledTimes(1)
  })

  it('passes navigate through to createArV5Island callbacks', async () => {
    const { createArV5Island } = await import('./createArV5Island')
    const navigate = vi.fn()

    render(<MindARScene navigate={navigate} />)

    const callbacks = vi.mocked(createArV5Island).mock.calls[0][1] as ArV5IslandCallbacks
    callbacks.navigate?.('/product')
    expect(navigate).toHaveBeenCalledWith('/product')
  })
})
```

- [ ] **Step 2: 確認測試先失敗**

Run: `pnpm test:run src/features/ar/MindARScene.test.tsx`

Expected: `navigate` prop 相關測試失敗，因為 `MindARSceneProps` 尚未支援 `navigate`。

- [ ] **Step 3: 實作 `useEffectEvent` callback bridge**

將 `src/features/ar/MindARScene.tsx` 更新成以下內容：

```tsx
import { useEffect, useEffectEvent, useRef } from 'react'
import { createArV5Island, type ArV5IslandCallbacks } from './createArV5Island'

export type MindARSceneProps = {
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onError?: (error: unknown) => void
  navigate?: (url: string) => void
}

export function MindARScene({
  onReady,
  onTargetFound,
  onTargetLost,
  onError,
  navigate,
}: MindARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleReady = useEffectEvent(() => onReady?.())
  const handleTargetFound = useEffectEvent(() => onTargetFound?.())
  const handleTargetLost = useEffectEvent(() => onTargetLost?.())
  const handleError = useEffectEvent((error: unknown) => onError?.(error))
  const handleNavigate = useEffectEvent((url: string) => navigate?.(url))

  useEffect(() => {
    if (!containerRef.current) return

    let cleanupIsland: (() => void) | null = null
    let cancelled = false

    const bridge: ArV5IslandCallbacks = {
      onReady: () => { if (!cancelled) handleReady() },
      onTargetFound: () => { if (!cancelled) handleTargetFound() },
      onTargetLost: () => { if (!cancelled) handleTargetLost() },
      onError: (error) => { if (!cancelled) handleError(error) },
      navigate: (url) => { if (!cancelled) handleNavigate(url) },
    }

    void createArV5Island(containerRef.current, bridge).then((cleanup) => {
      if (cancelled) {
        cleanup()
        return
      }
      cleanupIsland = cleanup
    })

    return () => {
      cancelled = true
      cleanupIsland?.()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0 ar-container" />
}
```

在 `src/pages/ArScanner.tsx` 的 `<MindARScene />` 加上 `navigate={navigate}`：

```tsx
<MindARScene
  onReady={() => setStatus('scanning')}
  onTargetFound={() => setStatus('tracking')}
  onTargetLost={() => setStatus('lost')}
  onError={(err) => { setStatus('error'); setError(String(err)) }}
  navigate={navigate}
/>
```

- [ ] **Step 4: 驗證**

Run: `pnpm test:run src/features/ar/MindARScene.test.tsx`

Expected: 全部通過。

Run: `pnpm lint`

Expected: `MindARScene.tsx` 沒有 `react-hooks/refs` 或 hooks deps 錯誤。

- [ ] **Step 5: Commit**

```bash
git add src/features/ar/MindARScene.tsx src/pages/ArScanner.tsx src/features/ar/MindARScene.test.tsx
git commit -m "fix: stabilize AR callback bridge"
```

---

### Task 2: 修正 `createArV5Island` 測試覆蓋假象

**目的:** 移除 `createArV5Island.test.ts` 對被測模組自己的 mock，讓測試真正覆蓋 production implementation。

**Files:**
- Modify: `src/features/ar/createArV5Island.ts`
- Modify: `src/features/ar/createArV5Island.test.ts`

- [ ] **Step 1: 移除 self-mock，改測 production implementation**

將 `src/features/ar/createArV5Island.test.ts` 更新成以下內容：

```tsx
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
  window.AFRAME = {
    components: { 'mindar-image': {} },
    registerComponent: vi.fn(),
  } as unknown as Window['AFRAME']
}

describe('createArV5Island', () => {
  beforeEach(() => {
    setupAframe()
    appendLoadedScript(aframeScript)
    appendLoadedScript(mindarScript)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    document.head.innerHTML = ''
    delete window.AFRAME
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
    expect(document.head.querySelector('style')?.textContent).not.toContain('.ar-container')
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
})
```

- [ ] **Step 2: 執行測試，確認目前 production behavior**

Run: `pnpm test:run src/features/ar/createArV5Island.test.ts`

Expected: 測試應開始覆蓋 production `createArV5Island`。如果失敗，先讀錯誤，不要改回 self-mock。

- [ ] **Step 3: 移除 production code 中的 `any` 與空 catch**

在 `src/features/ar/createArV5Island.ts` 加入型別並更新相關 function：

```ts
type AFrameSceneElement = HTMLElement & {
  systems?: Record<string, { stop?: () => void }>
  renderer?: { setAnimationLoop?: (callback: null) => void }
  pause?: () => void
}
```

將 `stopMindARSystem` 與 `destroyArV5Scene` 改成：

```ts
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
```

- [ ] **Step 4: 驗證**

Run: `pnpm test:run src/features/ar/createArV5Island.test.ts`

Expected: 全部通過。

Run: `pnpm lint`

Expected: `createArV5Island.ts` 沒有 `no-explicit-any` 或 empty catch 錯誤。

- [ ] **Step 5: Commit**

```bash
git add src/features/ar/createArV5Island.ts src/features/ar/createArV5Island.test.ts
git commit -m "test: cover AR island production cleanup"
```

---

### Task 3: 將 design tokens 移到 app startup 初始化一次

**目的:** 符合 `advanced-init-once` 與 `rerender-move-effect-to-event` 的精神，避免每個使用 `useConfig` 的頁面 mount 時重複寫 DOM。

**Files:**
- Create: `src/config/applyDesignTokens.ts`
- Modify: `src/hooks/useConfig.ts`
- Modify: `src/hooks/useConfig.test.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: 更新測試**

將 `src/hooks/useConfig.test.ts` 更新成：

```tsx
import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { applyDesignTokens } from '../config/applyDesignTokens'
import { useConfig } from './useConfig'

describe('applyDesignTokens', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--color-primary')
    document.documentElement.style.removeProperty('--color-bg')
    document.documentElement.style.removeProperty('--color-text')
  })

  it('injects design token CSS variables', () => {
    applyDesignTokens()

    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#D4AF37')
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#051129')
    expect(document.documentElement.style.getPropertyValue('--color-text')).toBe('#FFFFFF')
  })
})

describe('useConfig', () => {
  it('returns the config object with brand name', () => {
    const { result } = renderHook(() => useConfig())

    expect(result.current.brand.name).toBe("植酌 Fizz't")
  })
})
```

- [ ] **Step 2: 確認測試先失敗**

Run: `pnpm test:run src/hooks/useConfig.test.ts`

Expected: 因 `src/config/applyDesignTokens.ts` 尚不存在而失敗。

- [ ] **Step 3: 新增 token applier 並移除 hook side effect**

建立 `src/config/applyDesignTokens.ts`：

```ts
import { config } from './index'

export function applyDesignTokens(root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--color-primary', config.tokens.primaryColor)
  root.style.setProperty('--color-bg', config.tokens.backgroundColor)
  root.style.setProperty('--color-text', config.tokens.textColor)
}
```

將 `src/hooks/useConfig.ts` 改成：

```ts
import { config } from '../config'
import type { ProductConfig } from '../config/types'

export function useConfig(): ProductConfig {
  return config
}
```

將 `src/main.tsx` 改成：

```tsx
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { applyDesignTokens } from './config/applyDesignTokens'
import { router } from './router'
import './index.css'

applyDesignTokens()

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
```

- [ ] **Step 4: 驗證**

Run: `pnpm test:run src/hooks/useConfig.test.ts`

Expected: 全部通過。

Run: `pnpm test:run`

Expected: 全部測試通過。

- [ ] **Step 5: Commit**

```bash
git add src/config/applyDesignTokens.ts src/hooks/useConfig.ts src/hooks/useConfig.test.ts src/main.tsx
git commit -m "perf: apply design tokens once at startup"
```

---

### Task 4: 加上 route-level code splitting

**目的:** 符合 `bundle-dynamic-imports`，避免 `/quiz`、`/` 等非 AR route 初始載入 AR scanner 相關程式。

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: 改寫 router 為 lazy routes**

將 `src/router.tsx` 改成：

```tsx
import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { Landing } = await import('./pages/Landing')
      return { Component: Landing }
    },
  },
  {
    path: '/ar/guide',
    lazy: async () => {
      const { ArGuide } = await import('./pages/ArGuide')
      return { Component: ArGuide }
    },
  },
  {
    path: '/ar/scanner',
    lazy: async () => {
      const { ArScanner } = await import('./pages/ArScanner')
      return { Component: ArScanner }
    },
  },
  {
    path: '/quiz',
    lazy: async () => {
      const { Quiz } = await import('./pages/Quiz')
      return { Component: Quiz }
    },
  },
  {
    path: '/quiz/result/:type',
    lazy: async () => {
      const { QuizResult } = await import('./pages/QuizResult')
      return { Component: QuizResult }
    },
  },
  {
    path: '/product',
    lazy: async () => ({
      Component: () => (
        <div style={{ color: '#fff', padding: '2rem' }}>
          Product page - Plan 3
        </div>
      ),
    }),
  },
])
```

- [ ] **Step 2: 驗證 build output**

Run: `pnpm build`

Expected: build 成功。

Run: `ls -lh dist/assets/*.js`

Expected: 產生多個 JS chunks；AR scanner chunk 與 quiz/landing route chunk 分離。

- [ ] **Step 3: Commit**

```bash
git add src/router.tsx
git commit -m "perf: lazy load route modules"
```

---

### Task 5: 延後載入 GSAP 動畫程式

**目的:** 符合 `bundle-defer-third-party` 與 `bundle-conditional`，讓 GSAP 不成為每個 route module 的 eager dependency。

**Files:**
- Modify: `src/pages/Landing.tsx`
- Modify: `src/pages/ArGuide.tsx`
- Modify: `src/components/QuizCard.tsx`
- Modify: `src/components/ResultCard.tsx`

- [ ] **Step 1: 移除 static GSAP imports**

對四個檔案移除：

```tsx
import gsap from 'gsap'
```

- [ ] **Step 2: 在 effect 中 dynamic import GSAP**

以 `src/pages/ArGuide.tsx` 為範例，改成：

```tsx
useEffect(() => {
  let cancelled = false

  void import('gsap').then(({ default: gsap }) => {
    if (cancelled || !ref.current) return
    gsap.fromTo(ref.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
  })

  return () => {
    cancelled = true
  }
}, [])
```

`Landing.tsx` 的 `gsap.context` 需保留 cleanup：

```tsx
useEffect(() => {
  let cancelled = false
  let revert: (() => void) | null = null

  void import('gsap').then(({ default: gsap }) => {
    if (cancelled) return
    const ctx = gsap.context(() => {
      gsap.from('.landing-hero', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
      })
      gsap.from('.cta-btn', {
        opacity: 0,
        y: 12,
        duration: 0.4,
        stagger: 0.12,
        delay: 0.3,
        ease: 'power2.out',
      })
    }, rootRef)
    revert = () => ctx.revert()
  })

  return () => {
    cancelled = true
    revert?.()
  }
}, [])
```

`QuizCard.tsx` 與 `ResultCard.tsx` 使用同樣的 dynamic import pattern，並在動畫前檢查 `ref.current`。

- [ ] **Step 3: 驗證沒有 static GSAP import**

Run: `rg "import gsap from 'gsap'|import gsap from \"gsap\"" src`

Expected: no matches。

- [ ] **Step 4: 驗證測試與 build**

Run: `pnpm test:run`

Expected: 全部通過。

Run: `pnpm build`

Expected: build 成功，GSAP 變成 async chunk，不再被 route module eager 載入。

- [ ] **Step 5: Commit**

```bash
git add src/pages/Landing.tsx src/pages/ArGuide.tsx src/components/QuizCard.tsx src/components/ResultCard.tsx
git commit -m "perf: defer GSAP animation loading"
```

---

### Task 6: 移除 AR interaction test 中的 `any`

**目的:** 清掉 `no-explicit-any` lint error，不降低測試可讀性。

**Files:**
- Modify: `src/features/ar/ar-v5-interactions.test.ts`

- [ ] **Step 1: 改寫 webm support test 的 createElement mock**

將 `selects webm on preview click when webm supported` 測試中的 mock 改成：

```ts
const originalCreate = document.createElement.bind(document)
vi.spyOn(document, 'createElement').mockImplementation(<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: ElementCreationOptions,
): HTMLElementTagNameMap[K] => {
  const el = originalCreate(tagName, options)
  if (tagName === 'video') {
    vi.spyOn(el as HTMLVideoElement, 'canPlayType').mockReturnValue('probably')
  }
  return el
})
```

- [ ] **Step 2: 驗證**

Run: `pnpm lint`

Expected: `src/features/ar/ar-v5-interactions.test.ts` 沒有 `no-explicit-any` 錯誤。

Run: `pnpm test:run src/features/ar/ar-v5-interactions.test.ts`

Expected: 全部通過。

- [ ] **Step 3: Commit**

```bash
git add src/features/ar/ar-v5-interactions.test.ts
git commit -m "test: remove AR interaction any casts"
```

---

### Task 7: 用單次迴圈取代 quiz score sorting

**目的:** 符合 `js-min-max-loop`，避免為了找最大值排序整個陣列。

**Files:**
- Modify: `src/lib/quiz.ts`
- Verify: `src/lib/quiz.test.ts`

- [ ] **Step 1: 先跑既有測試**

Run: `pnpm test:run src/lib/quiz.test.ts`

Expected: 修改前通過。

- [ ] **Step 2: 改寫 `calculateResult`**

將 `src/lib/quiz.ts` 改成：

```ts
import type { QuizOption } from '../config/types'

export function calculateResult(answers: QuizOption[]): string {
  if (answers.length === 0) {
    throw new Error('No answers provided')
  }

  const totals: Record<string, number> = {}
  for (const answer of answers) {
    for (const [key, value] of Object.entries(answer.scores)) {
      totals[key] = (totals[key] ?? 0) + value
    }
  }

  let bestType = ''
  let bestScore = Number.NEGATIVE_INFINITY

  for (const [type, score] of Object.entries(totals)) {
    if (score > bestScore) {
      bestType = type
      bestScore = score
    }
  }

  return bestType
}
```

- [ ] **Step 3: 驗證**

Run: `pnpm test:run src/lib/quiz.test.ts`

Expected: 全部通過。

- [ ] **Step 4: Commit**

```bash
git add src/lib/quiz.ts
git commit -m "perf: avoid sorting quiz scores"
```

---

### Task 8: 啟用 React Compiler

**目的:** 在 hooks/ref/test blocker 修完後再啟用 Compiler，避免把 correctness 問題和 compiler compatibility 混在一起。

**Files:**
- Modify: `vite.config.ts`
- Modify: `eslint.config.js`

- [ ] **Step 1: 更新 Vite React plugin 設定**

將 `vite.config.ts` 改成：

```ts
import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 3009,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    passWithNoTests: true,
  },
})
```

`@vitejs/plugin-react@6.0.0` 起已移除 inline Babel option，因此不要使用舊式 `react({ babel: { plugins: [...] } })`。

- [ ] **Step 2: 更新 React Hooks lint preset**

將 `eslint.config.js` 中的 React Hooks preset 改成 compiler-aware preset：

```js
reactHooks.configs.flat['recommended-latest']
```

Expected: `eslint-plugin-react-hooks` 的 compiler rules 能檢查無法最佳化的 component/hook。

- [ ] **Step 3: 驗證 compiler compatibility**

Run: `pnpm lint`

Expected: no React Compiler 或 hooks lint errors。

Run: `pnpm build`

Expected: `tsc -b` 與 `vite build` 都成功。

Run: `pnpm test:run`

Expected: 全部測試通過。

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts eslint.config.js
git commit -m "perf: enable React Compiler"
```

---

### Task 9: Final verification

**目的:** 確認所有改動整體運作，尤其是 route chunk、GSAP async chunk、AR scanner 與 quiz flow。

**Files:**
- No source edits unless verification exposes a concrete issue.

- [ ] **Step 1: 全量靜態檢查**

Run: `pnpm lint`

Expected: no errors。

- [ ] **Step 2: 全量測試**

Run: `pnpm test:run`

Expected: all tests pass。

- [ ] **Step 3: production build**

Run: `pnpm build`

Expected: build succeeds。

- [ ] **Step 4: 檢查 chunks**

Run: `ls -lh dist/assets/*.js`

Expected:
- 有多個 route chunks。
- AR scanner route chunk 與 quiz/landing route chunk 分離。
- GSAP 不再是 route module 的 static eager dependency。

- [ ] **Step 5: browser smoke test**

Run: `pnpm dev`

Expected:
- `/` 正常載入。
- `/ar/guide` 正常載入並可前往 `/ar/scanner`。
- `/quiz` 正常載入並可前往 `/quiz/result/:type`。
- `/ar/scanner` 能進入相機權限流程，且 permission 前不丟 JS error。

- [ ] **Step 6: 若 verification 發現需要修 source，修完後 commit**

只有在實際修了 source code 才 commit：

```bash
git add <changed-files>
git commit -m "fix: resolve final Vercel best practices verification issues"
```

---

## 執行順序理由

1. Task 1-2 先修 correctness 與測試真實性，避免後續效能改動蓋住 bug。
2. Task 3 移除 config hook 的 DOM side effect，讓 React Compiler 更安全。
3. Task 4-5 處理 critical bundle 問題：route splitting 與 GSAP defer。
4. Task 6-7 清 lint 與低風險 JS perf。
5. Task 8 最後啟用 React Compiler，因為它會放大 hooks/ref 規則問題。
6. Task 9 做整體驗證，不把「有 chunks」誤判成「route behavior 正確」。

## 不納入本 plan 的事項

- 不新增 `manualChunks`。目前較好的第一步是 route-level splitting + dynamic GSAP import；manual chunks 應等 build output 實測後再決定。
- 不新增 React.memo。React Compiler 啟用後不應預設手動 memo。
- 不重構整體 UI 或 AR 架構。此 plan 聚焦 Vercel React Best Practices 與已掃描出的實際風險。
