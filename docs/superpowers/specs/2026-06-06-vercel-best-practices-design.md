# Vercel React Best Practices 實作設計

**日期**: 2026-06-06
**狀態**: Approved
**範圍**: Bundle size optimization + re-render optimization + rendering fixes

---

## 背景

稽核發現專案偏離 Vercel React Best Practices 多項規則。最大問題是 route-level code splitting 缺失，導致所有 AR/Three.js/GSAP 代碼被打包到主 bundle。

## 決策紀錄

### 被移除的改動

| 項目 | 原因 |
|------|------|
| Three.js named imports | `import * as THREE` 不影響 Vite/Rollup tree-shaking，官方推薦此寫法 |
| GSAP 動態載入 | Route splitting 已自然將 GSAP 分到各 route chunk |
| React.memo | 專案已啟用 React Compiler (`babel-plugin-react-compiler`)，自動處理 memoization |
| Hoist ArV3Scene styles | ArV3 將捨棄，不值得改 |

---

## Stage 1: Route-Level Code Splitting

**規則**: `bundle-dynamic-imports`
**影響**: Critical — 訪問 `/quiz` 時不下載 AR/Three.js/GSAP 代碼

### 改動

**檔案**: `src/router.tsx`

將所有頁面 import 改為 React Router v7 的 `lazy` property：

```tsx
import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'

const router = createBrowserRouter([
  {
    element: Layout,
    children: [
      {
        index: true,
        lazy: async () => {
          const { Landing } = await import('./pages/Landing')
          return { Component: Landing }
        },
      },
      {
        path: 'ar',
        lazy: async () => {
          const { ArGuide } = await import('./pages/ArGuide')
          return { Component: ArGuide }
        },
      },
      {
        path: 'ar/scanner',
        lazy: async () => {
          const { ArScanner } = await import('./pages/ArScanner')
          return { Component: ArScanner }
        },
      },
      {
        path: 'ar/v2',
        lazy: async () => {
          const { ArV2Page } = await import('./pages/ArV2Page')
          return { Component: ArV2Page }
        },
      },
      {
        path: 'ar/v3',
        lazy: async () => {
          const { ArV3Page } = await import('./pages/ArV3Page')
          return { Component: ArV3Page }
        },
      },
      {
        path: 'ar/v4',
        lazy: async () => {
          const { ArV4Page } = await import('./pages/ArV4Page')
          return { Component: ArV4Page }
        },
      },
      {
        path: 'quiz',
        lazy: async () => {
          const { Quiz } = await import('./pages/Quiz')
          return { Component: Quiz }
        },
      },
      {
        path: 'quiz/result/:type',
        lazy: async () => {
          const { QuizResult } = await import('./pages/QuizResult')
          return { Component: QuizResult }
        },
      },
    ],
  },
])
```

### 預期效果

```
Before:
  main.js (~800KB+) — React + Router + Three.js + MindAR + GSAP + 所有頁面

After:
  main.js (~150KB) — React + Router + Layout
  chunks/landing.js — Landing + GSAP
  chunks/ar-v4.js — ArV4Page + Three.js + MindAR + GSAP
  chunks/ar-v3.js — ArV3Page + A-Frame + MindAR
  chunks/quiz.js — Quiz + QuizResult
```

### 驗證

- 打開 DevTools Network tab，訪問 `/quiz`，確認不會下載 `three` 相關模組
- `npm run build` 後檢查 `dist/assets/` 確認 chunks 分離

---

## Stage 2: Eruda 只在 Dev Mode 載入

**規則**: `bundle-defer-third-party`
**影響**: High — Production 不載入 debug console

### 改動

**檔案**: `index.html`

移除無條件載入的 Eruda scripts，改為條件化：

```html
<script>
  if (import.meta.env.DEV) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/eruda';
    s.onload = function() { eruda.init(); };
    document.head.appendChild(s);
  }
</script>
```

### 驗證

- `npm run build && npm run preview` — 確認 production 不載入 Eruda
- `npm run dev` — 確認 dev mode 仍有 Eruda

---

## Stage 3: Functional setState + useCallback

**規則**: `rerender-functional-setstate`
**影響**: Medium — 防止 stale closure，穩定 callback 引用

### 改動

**檔案**: `src/pages/ArV4Page.tsx`, `src/pages/ArScanner.tsx`, `src/pages/Quiz.tsx`, `src/pages/QuizResult.tsx`

將 inline arrow functions 改為 `useCallback`，並使用 functional setState：

```tsx
// Before
const ArV4Page = () => {
  const [status, setStatus] = useState('idle')
  return (
    <ArV4Experience
      onReady={() => setStatus('scanning')}
      onTargetFound={() => setStatus('tracking')}
      onTargetLost={() => setStatus('lost')}
      onAction={(id) => setSelectedActionId(id)}
      onError={(err) => { setStatus('error'); setError(String(err)) }}
    />
  )
}

// After
const ArV4Page = () => {
  const [status, setStatus] = useState('idle')
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReady = useCallback(() => setStatus('scanning'), [])
  const handleTargetFound = useCallback(() => setStatus('tracking'), [])
  const handleTargetLost = useCallback(() => setStatus('lost'), [])
  const handleAction = useCallback((id: string) => setSelectedActionId(id), [])
  const handleError = useCallback((err: unknown) => {
    setStatus('error')
    setError(String(err))
  }, [])

  return (
    <ArV4Experience
      onReady={handleReady}
      onTargetFound={handleTargetFound}
      onTargetLost={handleTargetLost}
      onAction={handleAction}
      onError={handleError}
    />
  )
}
```

### 驗證

- `npm run lint` 通過
- React DevTools Profiler 確認 callback 引用穩定

---

## Stage 4: Passive Event Listeners

**規則**: `client-passive-event-listeners`
**影響**: Medium — 優化 scroll/touch 效能

### 改動

**檔案**: `src/components/MindArCanvas.tsx`, `src/lib/ar-v4/createMindArV4Experience.ts`

```tsx
// Before
container.addEventListener('pointerdown', onPointerDown)

// After
container.addEventListener('pointerdown', onPointerDown, { passive: true })
```

### 驗證

- 確認 pointerdown handler 沒有呼叫 `preventDefault()`
- 功能測試：AR 互動仍然正常

---

## Stage 5: useEffect 依賴修正

**規則**: `rerender-dependencies`
**影響**: Low — lint 合規

### 改動

**檔案**: `src/hooks/useConfig.ts`

```tsx
useEffect(() => {
  const root = document.documentElement
  root.style.setProperty('--color-primary', config.tokens.primaryColor)
  root.style.setProperty('--color-bg', config.tokens.backgroundColor)
  root.style.setProperty('--color-text', config.tokens.textColor)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- config is module-level constant, never changes
}, [])
```

### 驗證

- `npm run lint` 通過

---

## Stage 6: .sort() → .toSorted()

**規則**: `js-tosorted-immutable`
**影響**: Low — immutable pattern

### 改動

**檔案**: `src/lib/quiz.ts`

```tsx
// Before
return Object.entries(totals).sort(([, a], [, b]) => b - a)[0][0]

// After
return Object.entries(totals).toSorted(([, a], [, b]) => b - a)[0][0]
```

### 驗證

- `npm run test:run` 通過
- `npm run lint` 通過

---

## 執行順序

1. Stage 1 (Route splitting) — 影響最大，先做
2. Stage 2 (Eruda) — 獨立，簡單
3. Stage 3 (useCallback) — 需要改 4 個頁面
4. Stage 4 (Passive listeners) — 獨立，簡單
5. Stage 5 (useEffect deps) — 獨立，簡單
6. Stage 6 (.toSorted) — 獨立，簡單

## 風險

- Stage 1 改動最大，需要確認 React Router v7 的 `lazy` property 行為
- 所有改動都可以獨立測試，不會互相影響
