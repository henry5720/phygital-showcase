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
