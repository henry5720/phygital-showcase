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
