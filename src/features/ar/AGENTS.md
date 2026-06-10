# AR Module AGENTS.md

## 概覽

MindAR + Three.js 的 WebAR 體驗，使用 DOM island 模式。`scene.html` 同時用於 AR 體驗和 ModelViewer 測試頁。

## 核心檔案

| 檔案 | 職責 |
|------|------|
| `scene.html` | A-Frame 場景 HTML（AR + ModelViewer 共用） |
| `MindARScene.tsx` | React 與 island 的橋接元件 |
| `createArV5Island.ts` | 初始化邏輯（MindAR 啟動、A-Frame 場景建立） |
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

- GLB 模型：`public/assets/fizzt/test.glb`（暫時，待替換成正式模型）
- MindAR 特徵檔：`public/assets/web-ar/card.mind`
- 影片：`public/assets/web-ar/portfolio/`

## scene.html 設定

- `mindar-image`：MindAR image tracking（AR 模式使用）
- `reflection`：PBR 材質反射（AR 和 ModelViewer 都用）
- model scale：`1 1 1`（在 Blender 調整模型大小，A-Frame 不縮放）
- model position：`0 0 0`（在 Blender 調整模型位置）

## 注意事項

- AR 模組使用 DOM island 模式，`scene.html` 是獨立的 HTML 文件
- MindAR 需要相機權限，`ArScanner` 會處理使用者授權流程
- ModelViewer（`/3d-model`）共用 `scene.html`，但不載入 MindAR
- 調整 model 位置/大小在 Blender 進行，A-Frame 維持 `scale="1 1 1"`
