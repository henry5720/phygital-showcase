# Vercel React Best Practices 實作設計

**日期**: 2026-06-06 (v2)
**狀態**: Approved
**範圍**: Bundle size optimization + lint fixes + build config

---

## 背景

深度稽核發現專案偏離 Vercel React Best Practices 多項規則。最大問題是 route-level code splitting 缺失（單一 379KB JS chunk），以及 React Compiler 已安裝但未啟用。

## 稽核發現

### 確認的問題

| # | 問題 | 規則 | 嚴重度 |
|---|---|---|---|
| 1 | Router 無 code splitting — 單一 379KB JS chunk | `bundle-dynamic-imports` | Critical |
| 2 | MindARScene lint error — render body 中更新 ref | react-hooks/refs | High |
| 3 | React Compiler 未啟用 — babel-plugin-react-compiler 在 devDets 但 vite.config.ts 沒使用 | advanced | High |
| 4 | createArV5Island lint errors — `any` x2 + 空 catch x3 | eslint | Medium |
| 5 | Vite 無 manual chunk splitting — vendor code 未分離 | `bundle-dynamic-imports` | Medium |
| 6 | Test lint errors — `no-explicit-any` x3 | eslint | Low |

### 確認無問題的項目

| 項目 | 狀態 | 原因 |
|---|---|---|
| Barrel imports | ✅ | 所有 import 都是直接引用 |
| useCallback 需求 | ✅ | MindARScene 已用 callbacksRef 正確處理 |
| Passive event listeners | ✅ | 全部是自訂事件或 click，passive 無效 |
| `&&` conditional rendering | ✅ | 無違規 |
| Components inside components | ✅ | 無違規 |
| Inline style 物件 | ✅ | React Compiler 啟用後自動 memoize |
| useConfig 重複副作用 | ✅ | React Compiler 啟用後自動最佳化 |
| GSAP 動態載入 | ✅ | Route splitting 後 gsap 在各 route chunk 中 |
| Eruda dev-only | — | 使用者之後自行處理 |

### 被移除的改動 (v1 → v2)

| 項目 | 原因 |
|------|------|
| Three.js named imports | `import * as THREE` 不影響 Vite/Rollup tree-shaking |
| GSAP 動態載入 | Route splitting 已自然將 GSAP 分到各 route chunk |
| React.memo | 啟用 React Compiler 後自動處理 memoization |
| Hoist ArV3Scene styles | ArV3 已不存在 |
| useCallback (4 pages) | MindARScene 用 callbacksRef 已正確處理；Quiz 用 key remount |
| Passive event listeners | 全部是自訂事件，passive 選項無效 |
| useConfig eslint-disable | React Compiler 啟用後自動處理 |
| .toSorted() | 小陣列 (2-4 elements)，無實際影響 |
| Eruda dev-only | 使用者之後自行處理 |

---

## Stage 1: Route-Level Code Splitting

**規則**: `bundle-dynamic-imports`
**影響**: Critical — 訪問 `/quiz` 時不下載 AR/A-Frame/GSAP 代碼

### 改動

**檔案**: `src/router.tsx`

將所有頁面 import 改為 React Router v7 的 `lazy` property。目前有 5 個路由 + 1 個 placeholder：

- `/` → Landing
- `/ar/guide` → ArGuide
- `/ar/scanner` → ArScanner (含 A-Frame + MindAR)
- `/quiz` → Quiz
- `/quiz/result/:type` → QuizResult
- `/product` → inline placeholder

```tsx
// Before: 所有頁面 static import → 單一 379KB JS
import { Landing } from './pages/Landing'
import { ArGuide } from './pages/ArGuide'
// ...

// After: lazy import → Vite 自動 code split
{
  path: '/',
  lazy: async () => {
    const { Landing } = await import('./pages/Landing')
    return { Component: Landing }
  },
}
```

### 預期效果

```
Before:
  index-BDM4UJt7.js (379KB / 125KB gzip) — 全部打包

After:
  main.js — React + React Router (shared)
  chunks/landing.js — Landing + GSAP
  chunks/ar-scanner.js — ArScanner + A-Frame + MindAR + GSAP
  chunks/quiz.js — Quiz + QuizResult
```

### 驗證

- `npm run build` 後 `ls dist/assets/*.js` 確認多個檔案
- DevTools Network tab 訪問 `/quiz` 確認不下載 AR 相關模組

---

## Stage 2: Fix MindARScene Lint Error

**規則**: react-hooks/refs
**影響**: High — React Compiler 報錯，render body 中更新 ref

### 改動

**檔案**: `src/features/ar/MindARScene.tsx:15`

```tsx
// Before (lint error: Cannot update ref during render)
callbacksRef.current = { onReady, onTargetFound, onTargetLost, onError }

// After: 用 useEffect 同步
useEffect(() => {
  callbacksRef.current = { onReady, onTargetFound, onTargetLost, onError }
})
```

### 驗證

- `npm run lint` 確認 MindARScene 無 error
- `npm run build` 確認 TypeScript 通過

---

## Stage 3: Enable React Compiler

**規則**: advanced
**影響**: High — 自動處理所有 inline style 和 callback 的 memoization

### 背景

`babel-plugin-react-compiler@^1.0.0` 已在 devDependencies 中，但 `vite.config.ts` 的 `react()` plugin 沒有傳入 compiler 設定。目前使用的是預設 Babel transform，所有自動 memoization 都沒跑。

### 改動

**檔案**: `vite.config.ts`

```tsx
// Before
plugins: [basicSsl(), react(), tailwindcss()],

// After: 啟用 React Compiler
plugins: [basicSsl(), react({ babel: { plugins: [['babel-plugin-react-compiler']] } }), tailwindcss()],
```

### 驗證

- `npm run build` 確認 build 成功
- `npm run lint` 確認無新增 error
- DevTools Profiler 確認 component re-render 次數減少

---

## Stage 4: Vite Manual Chunks

**規則**: `bundle-dynamic-imports`
**影響**: Medium — 分離 vendor code，改善長期快取

### 改動

**檔案**: `vite.config.ts`

```tsx
// 加入 build.rollupOptions
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router'],
        'vendor-gsap': ['gsap'],
      },
    },
  },
},
```

### 驗證

- `npm run build` 後確認 `dist/assets/` 有 vendor-react 和 vendor-gsap chunks
- App 功能正常

---

## Stage 5: Fix createArV5Island Lint Errors

**規則**: eslint
**影響**: Medium — 5 個 lint error

### 改動

**檔案**: `src/features/ar/createArV5Island.ts`

- 第 94 行: `(sceneEl as any).systems` → `(sceneEl as Record<string, unknown>).systems` 或用 optional chaining
- 第 99 行: `as any` → 具體型別
- 第 101-102, 113 行: 空 catch block → 加 `// ignored` comment

### 驗證

- `npm run lint` 確認 createArV5Island.ts 無 error
- `npm run build` 通過

---

## Stage 6: Fix Test Lint Errors

**規則**: eslint
**影響**: Low — 3 個 `no-explicit-any`

### 改動

**檔案**:
- `src/features/ar/ar-v5-interactions.test.ts` (第 137, 140 行)
- `src/features/ar/createArV5Island.test.ts` (第 35 行)

將 `any` 改為 `unknown` 或具體型別。

### 驗證

- `npm run lint` 確認無 error
- `npm run test:run` 確認測試通過

---

## 執行順序

1. Stage 1 (Route splitting) — 影響最大，先做
2. Stage 2 (MindARScene lint) — 獨立，簡單
3. Stage 3 (React Compiler) — 需要 vite.config.ts 改動
4. Stage 4 (Manual chunks) — 與 Stage 3 同檔案，接續做
5. Stage 5 (createArV5Island lint) — 獨立
6. Stage 6 (Test lint) — 獨立

## 風險

- Stage 1 改動最大，需確認 React Router v7 `lazy` 行為
- Stage 3 啟用 React Compiler 可能影響現有代碼（experimental feature）
- 所有改動都可以獨立測試，不會互相影響
