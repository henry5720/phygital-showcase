# 植酌 Fizz't Phygital Showcase — 當前進度

> 最後更新：2026-06-06
> 分支：main（clean，無未提交變更）

---

## 全貌

React 19 + TypeScript + Vite SPA，品牌行銷微網站。  
部署於 Cloudflare Pages，純靜態，無後端。

---

## 模組狀態

### ✅ Landing Page (`/`)
- [x] 品牌名稱 + 副標題 GSAP stagger fade-in
- [x] 三個 CTA：WebAR 體驗、互動測驗、加入 LINE@
- [x] Config-driven 內容（`fizzt.config.json`）

### ✅ Quiz 測驗 (`/quiz` → `/quiz/result/:type`)
- [x] 5 題問答，3 種人格結果（fresh / ritual / layered）
- [x] `calculateResult()` 純函式，完整單元測試（5 tests）
- [x] QuizCard GSAP slide-in 動畫、進度條
- [x] ResultCard GSAP scale-in + LINE CTA
- [x] fallback 錯誤處理（invalid type）

### ✅ WebAR 體驗 (`/ar` → `/ar/scanner`)
- [x] ArGuide 引導頁（說明 + 開始按鈕）
- [x] ArScanner 狀態機：idle → tracking → video_playing
- [x] MindArCanvas：MindAR + Three.js scene
  - [x] GLB 模型載入（錨定於 Logo 影像）
  - [x] 3 個圓形熱點（A/B/C），Raycaster 觸碰偵測
  - [x] VideoOverlay 2D fixed 影片播放
- [x] 清理邏輯（dispose geometry/material, remove listeners）

### ⏳ Product Page (`/product`)
- [ ] 僅佔位符 `<div>` — 尚未實作

### ⏳ GA4 事件追蹤
- [ ] 設計文件有定義事件，尚未實作

---

## 測試狀態

```
Test Files  5 passed (5)
     Tests  20 passed (20)
```

| 測試檔 | 數量 |
|--------|------|
| `quiz.test.ts` | 5 |
| `useConfig.test.ts` | 4 |
| `QuizCard.test.tsx` | 4 |
| `ResultCard.test.tsx` | 4 |
| `VideoOverlay.test.tsx` | 3 |

---

## 技術棧對照 (設計 vs 實際)

| 層面 | 設計文件 | 實際 |
|------|----------|------|
| 框架 | React 19 + TypeScript | ✅ |
| 建置 | Vite 8 | ✅ |
| 路由 | React Router v7 | ✅ |
| 樣式 | Tailwind CSS v4 + CSS vars | ✅ |
| 動畫 | GSAP | ✅ |
| WebAR | MindAR.js + Three.js | ✅ |
| 狀態管理 | React context / props | ✅（無 Zustand） |
| 驗證 | TypeScript interface | ✅（無 Zod） |
| 部署 | Cloudflare Pages | ✅ `public/_redirects` |
| GA4 | 選用 | ⬜ 未實作 |

---

## 偏離原始設計紀錄

1. **`docs/plan.md`** 與 `docs/config.json` 為早期設計草稿，內容已過時。實際實作以 `docs/superpowers/specs/2026-06-03-fizzt-design.md` 為準。
2. Plan 1（基礎 + Landing + Quiz）已完成。**Plan 2（WebAR）也已實作完成**，但原始 plan 文件中未追蹤此進度。
3. AR 影片從設計文件的 stage1/stage2/stage3 命名，實作為 stageA/stageB/stageC（三階段 vs 三種類別）。
4. `docs/plan.md` 提及 Framer Motion + Zustand + Zod，實際全數以 GSAP + React hooks 取代。

---

## 素材現狀 (`public/assets/fizzt/`)

| 素材 | 路徑 | 狀態 |
|------|------|------|
| GLB 3D 模型 | `fizzt.glb` | ✅ 就位 |
| MindAR 特徵檔 | `targets.mind` | ✅ 就位 |
| 影片 Stage A | `video-stage-a.mp4` | ✅ 就位 |
| 影片 Stage B | `video-stage-b.mp4` | ✅ 就位 |
| 影片 Stage C | `video-stage-c.mp4` | ✅ 就位 |
| Hero 圖片 | `hero.png` | ❌ 不存在於 assets |

---

## 下一步可能的工項

1. **Product Page** (`/product`) — GSAP ScrollTrigger 電影級捲動
2. **GA4 事件追蹤** — gtag 埋點
3. **SensoryOverlay**（五感互動）— 設計文件有提及但未實作
4. **LINE LIFF 整合** — 目前僅 window.location.href 跳轉
