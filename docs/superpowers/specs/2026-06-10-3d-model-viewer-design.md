# 3D Model Viewer 測試頁設計

## 目標

建立 `/3d-model` 測試頁，讓開發者在替換 3D 模型素材後，能獨立預覽 A-Frame 場景的渲染效果（包含所有 UI 元素），不觸發 Web AR image tracking。調整 model 的 scale/position/lighting 確認 OK 後，再接回 MindAR。

## 背景

目前 AR 模組（`src/features/ar/`）使用 MindAR + A-Frame，scene.html 包含 3D model、portfolio panel、影片、icon 按鈕、文字等元素。開發者需要一個不接 MindAR 的測試環境，來確認素材替換後的視覺效果。

## 設計

### 架構

沿用現有 `scene.html`，只差在：
- 載入 A-Frame CDN，不載入 MindAR
- 加 orbit-controls 讓開發者可以用滑鼠找到 model（若 model 在視窗外）
- 離開頁面時清理 A-Frame scene

### 檔案變更

| 檔案 | 變更 |
|------|------|
| `src/config/routes.ts` | 加 `MODEL_VIEWER: '/3d-model'` |
| `src/pages/ModelViewer.tsx` | 新頁面（lazy load） |
| `src/router.tsx` | 加 route，使用 `lazy: async () => import(...)` |
| `src/features/ar/scene.html` | 不變（已改為指向 `fizzt.glb`） |

### ModelViewer.tsx 實作

1. **DOM container**：建立 `<div id="ar-v5-container">` 作為 A-Frame 場景掛載點
2. **載入 A-Frame CDN**：複用 `loadArV5Scripts` 的 `loadScript` 邏輯，但只載入 A-Frame，不載入 MindAR
3. **載入 orbit-controls CDN**：`aframe-orbit-controls-component`（讓開發者可以拖曳旋轉/縮放找到 model）
4. **注入 scene.html**：複用 `injectArV5Scene` 邏輯，將完整 scene.html 注入 container
5. **Scene cleanup**：`useEffect` return 時呼叫清理函數，移除 A-Frame scene 和 style

### 不做的事

- **不加打光**：等素材確認後再處理
- **不改 scale/position**：沿用現有值（`scale="0.004 0.004 0.004"`，`position="0 -0.25 -0.3"`），開發者視覺確認後再調
- **不接互動邏輯**：不載入 `ar-v5-interactions.ts`
- **不載入 MindAR**：不呼叫 `loadMindArScript`，不處理 image tracking

### Orbit Controls 設定

```html
<a-entity
  orbit-controls="
    target: 0 0 0;
    minDistance: 0.5;
    maxDistance: 10;
    rotateSpeed: 0.5;
    zoomSpeed: 1.2;
    enabled: true;
  "
  position="0 1.6 3"
></a-entity>
```

- 開發者可以用滑鼠拖曳旋轉視角
- 滾輪縮放
- 模型在視窗外時可以找到它

### Scene Cleanup

```typescript
useEffect(() => {
  // 載入 A-Frame + orbit-controls
  // 注入 scene.html
  return () => {
    // 移除 scene
    // 移除 style
    // 清理 A-Frame renderer
  }
}, [])
```

## 驗收標準

1. 訪問 `/3d-model` 能看到完整 A-Frame 場景（model + UI 元素）
2. 不會觸發 MindAR（無相機權限請求）
3. Orbit-controls 正常運作（滑鼠拖曳旋轉、滾輪縮放）
4. 離開頁面後無記憶體洩漏（A-Frame scene 被清理）
5. 不影響現有 AR 功能（`/ar/scanner` 仍正常運作）
