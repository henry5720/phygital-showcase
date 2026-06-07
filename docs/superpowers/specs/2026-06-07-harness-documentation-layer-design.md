# Harness Engineering Documentation Layer Design

> 為 phygital-showcase 建立文件層（軟約束），讓多智能體協作時有統一的架構共識。

## 目標

解決多智能體協作的三大問題：
1. 智能體破壞其他智能體的成果（衝突）
2. 智能體產出的程式碼品質不一致
3. 智能體之間重複工作

## 方案

**階段 1（本次）：文件層（軟約束）**
- 強化 AGENTS.md 為導航入口
- 建立 ARCHITECTURE.md 描述架構
- 為重要目錄加 AGENTS.md

**階段 2（之後觀察決定）：**
- 如果智能體仍然破壞架構 → 加機械化執行
- 如果文件已經足夠 → 不加

## 架構設計

### AGENTS.md（導航入口）

**定位**：~80 行的目錄頁，只負責導航，不負責解釋。

**結構：**

```markdown
# AGENTS.md

## 專案概覽
一句話說明這是什麼、用什麼技術、部署在哪。

## 開發指令
- pnpm dev — Vite dev server，port 3009
- pnpm build — build:tokens → tsc -b → vite build
- pnpm build:tokens — Style Dictionary 產生 CSS 變數
- pnpm lint — eslint .
- pnpm test — vitest（watch mode）
- pnpm test:run — vitest run（單次執行）

## 建置順序
build:tokens 必須在 vite build 之前，因為 Tailwind v4 依賴 src/generated/ 下的 token 檔案。

## 重要架構
- Design Token 雙系統 → 指向 DESIGN_TOKENS.md
- 路由 → React Router v7，全部 lazy load
- 測試 → vitest + jsdom + @testing-library/react
- AR 模組 → 指向 src/features/ar/AGENTS.md

## 風格慣例
- shadcn/ui 元件在 src/components/ui/，使用 base-nova style
- CSS 使用 Tailwind v4 utility class
- TypeScript strict（noUnusedLocals, noUnusedParameters）
- 語言：繁體中文

## 注意事項
- 不要手動編輯 src/generated/ — 每次 build:tokens 會覆蓋
- ESLint 對 src/components/ui/** 關閉 react-refresh/only-export-components
- 部署用 public/_redirects（Cloudflare Pages SPA routing）
```

### ARCHITECTURE.md（架構地圖）

**定位**：深層參考文件，描述模組邊界、依賴方向、資料流。

**結構：**

```markdown
# ARCHITECTURE.md

## 模組結構
- config/ — 品牌 token、quiz 資料、型別定義
- components/ — 共用 UI 元件（shadcn + 自訂）
- components/ui/ — shadcn/ui 元件（base-nova style）
- features/ar/ — AR 模組（MindAR + Three.js，DOM island）
- pages/ — 路由頁面（React Router lazy load）
- hooks/ — 共用 hooks
- lib/ — 工具函式

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

禁止反向依賴：ui/ 不能依賴 pages/、config/ 不能依賴 features/。

## 資料流
config-driven 架構：
```
src/config/index.ts（單一入口）
  ├── brandConfig → Landing、各頁面
  └── quizRaw → Quiz、QuizResult
```

## Design Token 系統
雙系統運作（詳細說明見 DESIGN_TOKENS.md）：
- 品牌 token：tokens.json → build:tokens → src/generated/
- UI token：index.css 的 :root / .dark

## AR 模組架構
DOM island 模式：
- scene.html：Three.js 場景
- MindARScene.tsx：React 與 island 的橋接
- createArV5Island.ts：初始化邏輯
```

### src/features/ar/AGENTS.md（子目錄導航）

```markdown
# AR Module AGENTS.md

## 概覽
MindAR + Three.js 的 WebAR 體驗，使用 DOM island 模式。

## 核心檔案
- scene.html — Three.js 場景 HTML
- MindARScene.tsx — React 與 island 的橋接元件
- createArV5Island.ts — 初始化邏輯（MindAR 啟動、Three.js 場景建立）
- ar-v5-interactions.ts — 互動邏輯（Raycaster、熱點偵測）
- styles.css — AR 模組專用樣式

## 測試
- scene.test.ts — 場景邏輯測試
- createArV5Island.test.ts — 初始化測試
- ar-v5-interactions.test.ts — 互動邏輯測試
- MindARScene.test.tsx — React 元件測試

## 注意事項
- GLB 模型在 public/assets/fizzt/fizzt.glb
- MindAR 特徵檔在 public/assets/fizzt/targets.mind
- 影片在 public/assets/fizzt/video-stage-{a,b,c}.mp4
```

## 實施步驟

1. 重寫 AGENTS.md（導航入口）
2. 建立 ARCHITECTURE.md
3. 建立 src/features/ar/AGENTS.md
4. 驗證所有引用正確

## 驗證標準

- AGENTS.md 在 80 行以內
- ARCHITECTURE.md 覆蓋所有模組
- 子目錄 AGENTS.md 指向正確的檔案路徑
- 所有文件互相引用正確
