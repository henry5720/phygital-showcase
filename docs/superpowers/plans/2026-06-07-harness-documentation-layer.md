# Harness Documentation Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為 phygital-showcase 建立文件層（軟約束），強化 AGENTS.md 為導航入口，建立 ARCHITECTURE.md 描述架構，為重要目錄加 AGENTS.md。

**Architecture:** 三個文件各自獨立，AGENTS.md 作為導航入口指向 ARCHITECTURE.md 和子目錄 AGENTS.md，形成漸進式披露結構。

**Tech Stack:** Markdown, 無需額外工具

---

## File Structure

| 操作 | 檔案 | 職責 |
|------|------|------|
| 重寫 | `AGENTS.md` | 導航入口（~80行） |
| 建立 | `ARCHITECTURE.md` | 架構地圖（模組邊界、依賴方向、資料流） |
| 建立 | `src/features/ar/AGENTS.md` | AR 模組子導航 |

---

### Task 1: 重寫 AGENTS.md（導航入口）

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: 讀取現有 AGENTS.md 確認當前內容**

Run: `cat AGENTS.md`
確認現有內容結構。

- [ ] **Step 2: 重寫 AGENTS.md 為導航入口**

將 `AGENTS.md` 重寫為以下內容：

```markdown
# AGENTS.md

## 專案概覽

React 19 + TypeScript + Vite SPA，品牌行銷微網站（植酌 Fizz't Phygital Showcase）。部署於 Cloudflare Pages，純靜態無後端。

## 開發指令

```bash
pnpm dev            # Vite dev server，port 3009，啟用 self-signed SSL
pnpm build          # build:tokens → tsc -b → vite build
pnpm build:tokens   # Style Dictionary 產生 CSS 變數到 src/generated/
pnpm lint           # eslint .
pnpm test           # vitest（watch mode）
pnpm test:run       # vitest run（單次執行）
```

## 建置順序

`build:tokens` 必須在 `vite build` 之前，因為 Tailwind v4 依賴 `src/generated/` 下的 token 檔案。

## 重要架構

### Design Token 雙系統

- **品牌 token**（SD 管理）：`src/config/tokens.json` → `pnpm build:tokens` → `src/generated/tokens.css` + `theme-inline.css`
- **shadcn UI token**（手動管理）：`src/index.css` 的 `:root` / `.dark` 區塊
- 改品牌 token 只改 `tokens.json`，跑 `build:tokens`
- 改 UI token 直接改 `index.css`
- **不要手動編輯 `src/generated/`** — 每次 `build:tokens` 會覆蓋
- 詳見 [DESIGN_TOKENS.md](./DESIGN_TOKENS.md)

### 路由

React Router v7，全部 lazy load（`lazy: async () => import(...)`）。頁面在 `src/pages/`。

### 測試

- vitest + jsdom + @testing-library/react
- `vitest.config` 在 `vite.config.ts` 的 `test` 欄位
- `globals: true` — 不用 import describe/it/expect
- setup 檔：`src/test/setup.ts`（僅 import `@testing-library/jest-dom`）
- `passWithNoTests: true`

### 路徑別名

`@/` → `./src/`（在 `tsconfig.app.json` 和 `vite.config.ts` 都有設定）

### AR 模組

`src/features/ar/` — MindAR + Three.js，DOM island 模式。包含 scene.html 和互動邏輯。詳見 [src/features/ar/AGENTS.md](./src/features/ar/AGENTS.md)。

### React Compiler

已啟用 babel-plugin-react-compiler，會影響 Vite dev & build 效能。

## 風格慣例

- shadcn/ui 元件在 `src/components/ui/`，使用 base-nova style
- 自訂元件在 `src/components/`
- 功能模組在 `src/features/`
- 設定在 `src/config/`（config-driven 架構）
- CSS 使用 Tailwind v4 utility class，優先用 shadcn 元件
- TypeScript strict（noUnusedLocals, noUnusedParameters）
- 語言：繁體中文

## 注意事項

- `src/config/tokens.json` 是品牌 token 唯一來源
- ESLint 對 `src/components/ui/**` 關閉 `react-refresh/only-export-components`
- 部署用 `public/_redirects`（Cloudflare Pages SPA routing）
- 素材在 `public/assets/fizzt/`
```

- [ ] **Step 3: 驗證行數**

Run: `wc -l AGENTS.md`
Expected: ~80 行（70-90 行範圍內）

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs: rewrite AGENTS.md as navigation entry point"
```

---

### Task 2: 建立 ARCHITECTURE.md

**Files:**
- Create: `ARCHITECTURE.md`

- [ ] **Step 1: 建立 ARCHITECTURE.md**

建立 `ARCHITECTURE.md`，內容如下：

```markdown
# ARCHITECTURE.md

## 模組結構

src/ 目錄的職責劃分：

| 目錄 | 職責 |
|------|------|
| `config/` | 品牌 token、quiz 資料、型別定義 |
| `components/` | 共用 UI 元件（shadcn + 自訂） |
| `components/ui/` | shadcn/ui 元件（base-nova style） |
| `features/ar/` | AR 模組（MindAR + Three.js，DOM island） |
| `pages/` | 路由頁面（React Router lazy load） |
| `hooks/` | 共用 hooks |
| `lib/` | 工具函式 |
| `generated/` | SD 自動產生的 CSS 變數（不要手動編輯） |

## 依賴方向

```
pages/ → components/ → ui/
pages/ → hooks/
pages/ → config/
features/ar/ → components/ui/
features/ar/ → hooks/
features/ar/ → lib/
config/ → （不依賴任何人）
```

**禁止反向依賴**：ui/ 不能依賴 pages/、config/ 不能依賴 features/。

## 資料流

config-driven 架構：

```
src/config/index.ts（單一入口）
  ├── brandConfig → Landing、各頁面
  └── quizRaw → Quiz、QuizResult
```

## Design Token 系統

雙系統運作（詳細說明見 [DESIGN_TOKENS.md](./DESIGN_TOKENS.md)）：

- **品牌 token**：`tokens.json` → `build:tokens` → `src/generated/`
- **UI token**：`index.css` 的 `:root` / `.dark`

## AR 模組架構

DOM island 模式：

- `scene.html` — Three.js 場景 HTML
- `MindARScene.tsx` — React 與 island 的橋接元件
- `createArV5Island.ts` — 初始化邏輯（MindAR 啟動、Three.js 場景建立）
- `ar-v5-interactions.ts` — 互動邏輯（Raycaster、熱點偵測）
- `styles.css` — AR 模組專用樣式

詳見 [src/features/ar/AGENTS.md](./src/features/ar/AGENTS.md)。
```

- [ ] **Step 2: 驗證內容完整性**

確認以下項目都已涵蓋：
- 所有 src/ 子目錄
- 依賴方向圖
- 資料流
- Design Token 雙系統
- AR 模組架構

- [ ] **Step 3: Commit**

```bash
git add ARCHITECTURE.md
git commit -m "docs: add ARCHITECTURE.md with module boundaries and dependency rules"
```

---

### Task 3: 建立 src/features/ar/AGENTS.md

**Files:**
- Create: `src/features/ar/AGENTS.md`

- [ ] **Step 1: 確認 AR 模組檔案結構**

Run: `ls -la src/features/ar/`
確認所有檔案存在。

- [ ] **Step 2: 建立 AR 模組 AGENTS.md**

建立 `src/features/ar/AGENTS.md`，內容如下：

```markdown
# AR Module AGENTS.md

## 概覽

MindAR + Three.js 的 WebAR 體驗，使用 DOM island 模式。

## 核心檔案

| 檔案 | 職責 |
|------|------|
| `scene.html` | Three.js 場景 HTML |
| `MindARScene.tsx` | React 與 island 的橋接元件 |
| `createArV5Island.ts` | 初始化邏輯（MindAR 啟動、Three.js 場景建立） |
| `ar-v5-interactions.ts` | 互動邏輯（Raycaster、熱點偵測） |
| `styles.css` | AR 模組專用樣式 |

## 測試

| 測試檔 | 測試對象 |
|--------|----------|
| `scene.test.ts` | 場景邏輯 |
| `createArV5Island.test.ts` | 初始化邏輯 |
| `ar-v5-interactions.test.ts` | 互動邏輯 |
| `MindARScene.test.tsx` | React 元件 |

## 素材

- GLB 模型：`public/assets/fizzt/fizzt.glb`
- MindAR 特徵檔：`public/assets/fizzt/targets.mind`
- 影片：`public/assets/fizzt/video-stage-{a,b,c}.mp4`

## 注意事項

- AR 模組使用 DOM island 模式，`scene.html` 是獨立的 HTML 文件
- MindAR 需要相機權限，`ArScanner` 會處理使用者授權流程
- 三個圓形熱點（A/B/C）對應三個影片階段
```

- [ ] **Step 3: 驗證所有引用正確**

確認：
- 所有檔案名稱正確
- 所有素材路徑正確
- 與上層 ARCHITECTURE.md 的描述一致

- [ ] **Step 4: Commit**

```bash
git add src/features/ar/AGENTS.md
git commit -m "docs: add AR module AGENTS.md with file structure and test mapping"
```

---

### Task 4: 最終驗證

- [ ] **Step 1: 驗證 AGENTS.md 行數**

Run: `wc -l AGENTS.md`
Expected: 70-90 行

- [ ] **Step 2: 驗證所有內部連結**

確認以下連結正確：
- `AGENTS.md` → `DESIGN_TOKENS.md`
- `AGENTS.md` → `src/features/ar/AGENTS.md`
- `ARCHITECTURE.md` → `DESIGN_TOKENS.md`
- `ARCHITECTURE.md` → `src/features/ar/AGENTS.md`

- [ ] **Step 3: 驗證目錄結構**

Run: `find . -name "AGENTS.md" -o -name "ARCHITECTURE.md" | sort`
Expected:
```
./AGENTS.md
./ARCHITECTURE.md
./src/features/ar/AGENTS.md
```

- [ ] **Step 4: 確認無遺漏**

檢查：
- 所有 src/ 子目錄在 ARCHITECTURE.md 中都有描述
- 依賴方向圖涵蓋所有模組
- Design Token 系統有完整說明
