# 植酌 Fizz't Phygital Showcase

> 品牌行銷微網站 — 結合 WebAR 體驗與互動測驗

## Demo

![Landing Page](docs/superpowers/specs/2026-06-03-fizzt-design.md)

## 功能

- **Landing Page** — 品牌展示 + GSAP stagger 動畫
- **Quiz 測驗** — 5 題問答，3 種人格結果（fresh / ritual / layered）
- **WebAR 體驗** — MindAR + Three.js 擴增實境，支援 GLB 模型與影片疊加

## Tech Stack

| 層面 | 技術 |
|------|------|
| 框架 | React 19 + TypeScript |
| 建置 | Vite 8 |
| 樣式 | Tailwind CSS v4 + shadcn/ui |
| 動畫 | GSAP |
| WebAR | MindAR.js + Three.js |
| 測試 | Vitest + Testing Library |
| 部署 | Cloudflare Pages |

## 開發

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 建置
pnpm build

# 測試
pnpm test
```

## 專案結構

```
src/
├── pages/              # 路由頁面（Landing, Quiz, AR）
├── components/         # UI 元件
│   └── ui/             # shadcn/ui 元件
├── features/ar/        # AR 模組（MindAR + Three.js）
├── config/             # 品牌設定與 quiz 資料
├── hooks/              # 共用 hooks
├── lib/                # 工具函式
└── generated/          # Style Dictionary 產生的 CSS 變數
```

## 文件

- [AGENTS.md](./AGENTS.md) — 智能體導航入口
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 架構地圖
- [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) — Design Token 使用指南

## License

MIT
