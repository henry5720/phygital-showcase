# Vercel React Best Practices 修正版設計

**日期**: 2026-06-07
**狀態**: Approved
**範圍**: React/Vite best-practices 文件鏈修復、已驗證問題收斂、後續 implementation plan 邊界

---

## 背景

`docs/superpowers/plans/2026-06-07-vercel-react-best-practices.md` 是新的實作計畫，但它缺少對應 design spec。舊版 `docs/superpowers/specs/2026-06-06-vercel-best-practices-design.md` 與 `docs/superpowers/plans/2026-06-06-vercel-best-practices.md` 已 commit，可保留作歷史紀錄，但其中部分假設已過期。

這份設計作為 06-07 implementation plan 的來源，並取代 06-06 文件中的技術判斷。舊文件不刪除，但後續執行應以本文件與 06-07 plan 為準。

## 目標

1. 修復 best-practices 文件鏈：先有 approved design spec，再有 implementation plan。
2. 只把已由原始碼或 lint 證實的問題列為 confirmed scope。
3. 修正舊文件中對 React Compiler、package manager、manual chunks、`useConfig` side effect 的過期判斷。
4. 讓後續 implementation plan 先處理 correctness/test blockers，再做 bundle/performance optimization。

## 已驗證問題

以下問題已透過原始碼檢查或 `pnpm lint` 證實，納入 implementation 範圍。

| 問題 | 證據 | 影響 |
|---|---|---|
| `MindARScene` render 時更新 ref | `src/features/ar/MindARScene.tsx:15`，`pnpm lint` 報 `react-hooks/refs` | React Compiler / hooks lint blocker |
| AR production code 有 `any` 與 empty catch | `src/features/ar/createArV5Island.ts:94`, `99`, `101`, `102`, `113` | lint blocker，cleanup 意圖不清 |
| AR tests 有 `any` | `src/features/ar/ar-v5-interactions.test.ts:137`, `140`; `src/features/ar/createArV5Island.test.ts:35` | lint blocker |
| `createArV5Island.test.ts` self-mock 被測模組 | `vi.mock('./createArV5Island', ...)` | 測試未覆蓋 production implementation |
| Router static import 所有 page modules | `src/router.tsx:2-6` | route-level code splitting 缺失風險 |
| AR navigate bridge 斷線 | `createArV5Island` 支援 `callbacks.navigate`，但 `MindARSceneProps` 與 `ArScanner` 未傳入 | AR island 內導航無法走 React Router bridge |
| `useConfig` mount 時寫 DOM | `src/hooks/useConfig.ts:6-11` | startup-only side effect 被分散到 hook consumers |
| `calculateResult` 用 `sort()` 找最大值 | `src/lib/quiz.ts:15` | 低風險 JS perf cleanup |
| React Compiler 已安裝但未啟用 | `package.json` 有 `babel-plugin-react-compiler`，`vite.config.ts` 仍是 `react()` | Compiler 未參與 build |
| GSAP static imports | Landing、ArGuide、QuizCard、ResultCard | 非關鍵動畫成為 eager dependency |

## 需實作階段驗證的項目

以下項目不可在 spec 中宣稱已量測，必須由 implementation 階段的 build output 或 browser smoke test 驗證。

- 實際 bundle size。
- 實際 JS chunk 數量。
- AR scanner route chunk 是否與 landing/quiz route chunk 分離。
- GSAP 是否變成 async chunk。
- React Compiler 是否出現在 build output 或 React DevTools memo badge。
- `/ar/scanner` 是否能進入相機權限流程且 permission 前沒有 JS error。

## 技術設計

### AR Callback Bridge

`MindARScene` 是 React lifecycle 與 imperative AR island 的邊界。它應避免在 render 階段讀寫 mutable refs。改用 React 19 `useEffectEvent` 讀取最新 callback props，讓 AR island 初始化只發生一次，同時讓 rerender 後的 `onReady`、`onTargetFound`、`onTargetLost`、`onError`、`navigate` 都能呼叫最新 props。

`navigate` 應成為 `MindARSceneProps` 的明確 prop，由 `ArScanner` 的 `useNavigate()` 傳入，再由 `createArV5Island` 傳給 `initArV5Experience`。

### AR Island Tests

`createArV5Island.test.ts` 不應 mock `./createArV5Island` 自己。測試可以 mock raw `scene.html?raw`、`styles.css?raw` 與 `ar-v5-interactions`，但 production `createArV5Island` 必須被直接執行。

測試應覆蓋 scene/style injection、cleanup、idempotent cleanup、target events，以及 detached container 的安全處理。

### Design Tokens

`useConfig` 應保持 pure，只回傳 config。CSS design tokens 的 DOM 寫入應移到 `applyDesignTokens()`，並在 `main.tsx` app startup 執行一次。這符合 `advanced-init-once`，也讓 hook 測試不依賴 DOM side effect。

### Bundle Splitting

`src/router.tsx` 應改用 React Router v7 route object `lazy`，讓 route modules 依需求載入。這是第一層 bundle optimization。

GSAP 是非關鍵進場動畫，不應因 static import 提早進入 route/module 解析路徑。Landing、ArGuide、QuizCard、ResultCard 應在 effect 內 dynamic import GSAP，並處理 component unmount 後 promise resolve 的取消旗標。Landing 使用 `gsap.context` 時仍需 cleanup `ctx.revert()`。

本階段不預設新增 `manualChunks`。manual chunks 應等 route splitting 與 GSAP defer 的 build output 驗證後再決定。

### React Compiler

React Compiler 應放在 correctness、test coverage、side-effect 邊界與 lint blockers 修完後啟用，避免把 source bug 與 compiler compatibility 問題混在一起。

專案使用 `@vitejs/plugin-react@6.0.1`。React 官方文件指出 `@vitejs/plugin-react@6.0.0` 起 inline Babel option 已移除，因此不得使用舊式 `react({ babel: { plugins: [...] } })`。正確方向是使用 `@rolldown/plugin-babel` 與 `reactCompilerPreset()`：

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
})
```

ESLint 也應使用 compiler-aware React Hooks preset。若 `eslint-plugin-react-hooks` 提供 `recommended-latest`，implementation plan 應改用該 preset，避免 compiler compatibility 假通過。

### Small JS Perf

`calculateResult` 不需要排序整個 totals entry list 才取得最高分。改成單次 loop 可以保留行為、降低 work、符合 `js-min-max-loop`。這是低風險 cleanup，優先級低於 correctness 與 bundle splitting。

## 錯誤處理

`createArV5Island` cleanup 仍維持 best-effort，因為 A-Frame renderer、scene pause、video stream cleanup 可能各自失敗。catch block 應保留，但需加上簡短註解說明 best-effort cleanup，避免 silent swallow 看起來像遺漏。

初始化失敗時應繼續停止 MindAR system、移除 injected DOM/style、清理 MindAR artifacts。只有 container 仍 connected 時才呼叫 `callbacks.onError`，避免 unmount 後觸發 React state update。

## 測試策略

Implementation plan 應先補或修測試，再改 source。

- `MindARScene.test.tsx`: mount 初始化一次、unmount cleanup、callback prop rerender 後呼叫最新版、`navigate` 轉接。
- `createArV5Island.test.ts`: production implementation 的 injection、cleanup、idempotent cleanup、target events、detached container 行為。
- `useConfig.test.ts`: 分別測 `applyDesignTokens()` 與 pure `useConfig()`。
- `quiz.test.ts`: 沿用既有行為測試，確認 loop 改寫不改結果。
- `ar-v5-interactions.test.ts`: 僅移除 `any` cast，不改行為。

## 驗證策略

每個 task 應跑對應 narrow tests。最後驗證應包含：

- `pnpm lint`
- `pnpm test:run`
- `pnpm build`
- build 後檢查 `dist/assets/*.js` 是否有 route chunks
- 檢查 source 中沒有 static `import gsap from 'gsap'`
- Browser smoke test: `/`, `/ar/guide`, `/ar/scanner`, `/quiz`, `/quiz/result/:type`

## 排除範圍

以下不納入本設計與後續 plan：

- UI redesign。
- AR 整體架構重寫。
- StrictMode 全面恢復。
- manualChunks 作為第一階段優化。
- 無關 accessibility cleanup。
- README 或產品內容重寫。

## 風險與決策

- React Compiler 放最後，因為它可能揭露更多 hooks/ref 問題。
- 不預設使用 `"use no memo"` 逃避 compiler 問題；只有遇到明確第三方或 AR integration blocker 才能局部 opt out。
- 不宣稱 bundle size 已改善，直到 build output 驗證。
- 舊 06-06 文件保留作歷史紀錄，但後續實作以本 spec 與 06-07 plan 為準。
