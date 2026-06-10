# AR Module AGENTS.md

## 概覽

Three.js + MindAR 的 WebAR 體驗，使用 npm 依賴。AR Scanner 和 ModelViewer 共用 Three.js 渲染管線。

## 核心檔案

### `shared/` — AR + ModelViewer 共用模組

| 檔案 | 職責 |
|------|------|
| `setupRenderer.ts` | 建立 WebGLRenderer，設定 tone mapping + color space |
| `loadHDR.ts` | RGBELoader + PMREMGenerator，載入 HDR 環境貼圖 |
| `loadGLB.ts` | GLTFLoader，載入 GLB 模型 |

### `scanner/` — AR 掃描功能

| 檔案 | 職責 |
|------|------|
| `MindARScene.tsx` | AR Scanner React component（MindARThree + Three.js） |
| `styles.css` | Scanning overlay 樣式 |

### `viewer/` — 3D 模型檢視功能

| 檔案 | 職責 |
|------|------|
| `ModelViewerScene.tsx` | 3D Model Viewer React component（Three.js + OrbitControls） |

## 依賴

| 套件 | 版本 | 用途 |
|------|------|------|
| three | ^0.184 | 3D 渲染引擎 |
| mind-ar | ^1.2.5 | AR image tracking（Three.js integration） |

## 架構決策

- **全部走 npm** — 不再 CDN 載入 A-Frame 或 Three.js
- **imperative Three.js** — 不用 R3F，直接操作 Three.js API
- **共用模組** — loadGLB、loadHDR、setupRenderer 被 scanner 和 viewer 共用
- **MindARThree** — 使用 MindAR 的 Three.js integration（不是 A-Frame integration）
- **Phase 2** — 互動邏輯（portfolio、buttons、video）之後處理

## 素材

- GLB 模型：`public/assets/web-ar/fizzt.glb`
- MindAR 特徵檔：`public/assets/web-ar/card.mind`
- HDR 環境貼圖：`public/assets/web-ar/env.hdr`

## 測試

- vitest + jsdom + @testing-library/react
- Mock strategy：mock `three`、`mind-ar`、`../shared/*`
- Lifecycle tests：mount → init, unmount → cleanup

## 注意事項

- Scanner 使用 `alpha: true`（相機穿透）
- ModelViewer 使用 `alpha: false`（不透明背景）
- ModelViewer 顯示 HDR 為背景，Scanner 不顯示
- `MindARScene.tsx` 的 props 介面保持與舊版相同，ArScanner.tsx 頁面不需要改動
