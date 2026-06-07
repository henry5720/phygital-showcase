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
