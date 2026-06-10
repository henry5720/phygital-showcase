# AR 模組遷移設計：A-Frame → Three.js

**日期**: 2026-06-10
**狀態**: Draft
**範圍**: AR Scanner + ModelViewer，共用 Three.js 渲染管線

---

## 1. 問題陳述

### 現狀痛點

1. **A-Frame 1.7.0 + Three.js r173 CDN 載入** — 版本管理脆弱，CDN 載入順序需手動管理
2. **RGBELoader r128 vs Three.js r173** — 版本不相容導致 HDR 顏色不正確、像素化
3. **DOM island hack** — `scene.html` 作為字串匯入，用 `DOMParser` 解析注入 DOM
4. **沒有 TypeScript** — A-Frame component 只能寫 plain JS
5. **CDN 依賴** — `three`、`aframe`、`mind-ar` 都從 CDN 載入，無法 tree-shake

### 目標

- 依賴全部走 npm（`three` + `mind-ar`）
- 完整 TypeScript 支援
- 保留現有功能：MindAR image tracking + GLB model + HDR environment + scanning overlay
- AR 和 ModelViewer 共用渲染模組

### 範圍

**Phase 1（本次遷移）**：目前啟用的功能（MindAR tracking + GLB + HDR）
**Phase 2（之後）**：被註解掉的互動元素（portfolio panel、info buttons、video）

---

## 2. 架構

### 新資料夾結構

```
src/features/ar/
├── shared/              # AR + ModelViewer 共用
│   ├── loadGLB.ts
│   ├── loadHDR.ts
│   └── setupRenderer.ts
├── scanner/             # AR 掃描 feature
│   ├── MindARScene.tsx
│   ├── MindARScene.test.tsx
│   └── styles.css
├── viewer/              # 3D 模型檢視 feature
│   ├── ModelViewerScene.tsx
│   └── ModelViewerScene.test.tsx
└── AGENTS.md
```

### 依賴變更

```
新增 npm 依賴：
  three          ← npm install three
  mind-ar        ← npm install mind-ar

移除：
  A-Frame CDN          ← 不再需要
  three@0.128.0 CDN    ← 不再需要
  自寫 RGBE parser     ← 不再需要
```

### 頁面影響

| 頁面 | 改動 |
|------|------|
| `/ar` → `ArScanner.tsx` | Props 不變，不需要改動 |
| `/3d-model` → `ModelViewer.tsx` | 改為薄 wrapper，用 `ModelViewerScene` |

---

## 3. 共用模組

### `shared/setupRenderer.ts`

建立 WebGLRenderer，設定 tone mapping 和 color management。

```ts
// 輸出：THREE.WebGLRenderer
// 設定：
// - antialias: true
// - alpha: true（scanner 用，viewer 可覆蓋為 false）
// - toneMapping: THREE.ACESFilmicToneMapping
// - outputColorSpace: THREE.SRGBColorSpace
// - pixelRatio: window.devicePixelRatio
// - sortObjects: true
```

### `shared/loadHDR.ts`

使用 Three.js 內建 RGBELoader 載入 HDR 環境貼圖。

```ts
// 輸入：HDR file path
// 輸出：THREE.Texture（EquirectangularReflectionMapping）
// 處理：
// - RGBELoader 載入
// - PMREMGenerator 產生 prefiltered environment map
// - 設定 texture.mapping = EquirectangularReflectionMapping
// - 回傳已處理的 texture
```

### `shared/loadGLB.ts`

使用 Three.js 內建 GLTFLoader 載入 GLB 模型。

```ts
// 輸入：GLB file path, optional envMap
// 輸出：THREE.Group（GLTF.scene）
// 處理：
// - GLTFLoader 載入
// - 可選：套用 envMap 到所有 mesh（PBR 反射）
// - 回傳 scene group
```

---

## 4. AR Scanner Feature

### `scanner/MindARScene.tsx`

React component，初始化 MindARThree + Three.js 場景。

**初始化流程（useEffect）：**
1. `setupRenderer()` → renderer（alpha: true）
2. `new MindARThree({ container, imageTargetSrc })` → mindarThree
3. `loadHDR()` → envMap → `scene.environment = envMap`
4. `loadGLB()` → model → `anchor.group.add(model)`
5. `mindarThree.start()`
6. `renderer.setAnimationLoop(render)`

**清理流程（useEffect cleanup）：**
1. `renderer.setAnimationLoop(null)`
2. `mindarThree.stop()`
3. `renderer.dispose()`

**Props 介面（與現有相同）：**
```ts
type MindARSceneProps = {
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onError?: (error: unknown) => void
  navigate?: (url: string) => void
}
```

### Scanning Overlay

保留現有 `styles.css` 的 scanning overlay（DOM 元素疊在 Three.js canvas 上）。

### Phase 2 互動邏輯

被註解掉的互動元素（portfolio panel、info buttons、video）在之後處理：
- DOM querySelector → Three.js Raycaster
- `setAttribute('position')` → Three.js Object3D.position
- `setAttribute('visible')` → Three.js Object3D.visible

---

## 5. ModelViewer Feature

### `viewer/ModelViewerScene.tsx`

跟 AR Scanner 共用 `loadGLB`、`loadHDR`、`setupRenderer`，但不用 MindAR。

**初始化流程（useEffect）：**
1. `setupRenderer()` → renderer（alpha: false）
2. 建立 `THREE.PerspectiveCamera` + `OrbitControls`
3. `loadHDR()` → envMap → `scene.environment = envMap` + `scene.background = envMap`
4. `loadGLB()` → model → `scene.add(model)`
5. 自動調整 camera 位置 fit model bounding box
6. `renderer.setAnimationLoop(render)`
7. `ResizeObserver` 處理 container 大小變化

**清理流程：**
1. `renderer.setAnimationLoop(null)`
2. `controls.dispose()`
3. `renderer.dispose()`

**Props 介面：**
```ts
type ModelViewerSceneProps = {
  onError?: (error: unknown) => void
}
```

### 與 AR Scanner 的差異

| 項目 | AR Scanner | ModelViewer |
|------|-----------|-------------|
| MindAR | 需要 | 不需要 |
| Camera | MindARThree 管理 | PerspectiveCamera + OrbitControls |
| HDR background | 不顯示 | 顯示（scene.background） |
| Renderer alpha | true（相機穿透） | false |
| 互動 | targetFound/lost | OrbitControls |

### Pages 層

`ModelViewer.tsx` 改為薄 wrapper：
- 載入狀態 UI
- `<ModelViewerScene onError={...} />`
- 錯誤處理 UI

---

## 6. 測試策略

| 模組 | 測試方式 |
|------|---------|
| `shared/setupRenderer.ts` | mock WebGLRenderer，驗證 toneMapping + colorSpace |
| `shared/loadHDR.ts` | mock RGBELoader，驗證 texture mapping 設定 |
| `shared/loadGLB.ts` | mock GLTFLoader，驗證回傳 Object3D |
| `scanner/MindARScene.tsx` | mock MindARThree + shared modules，驗證 lifecycle |
| `viewer/ModelViewerScene.tsx` | mock Three.js + shared modules，驗證 lifecycle |

---

## 7. 遷移順序

```
1. npm install three mind-ar
2. 建立 shared/ 模組 + 測試
3. 建立 viewer/（ModelViewerScene）+ 測試 → 先驗證渲染管線正確
4. 重寫 scanner/（MindARScene）+ 測試
5. 更新 ModelViewer.tsx 頁面
6. 確認 ArScanner.tsx 不需要改動（props 不變）
7. 刪除舊檔案
8. 更新 AGENTS.md
```

**先做 viewer 再做 scanner 的原因**：viewer 不依賴 MindAR，可以獨立驗證 Three.js 渲染管線（HDR + GLB + tone mapping）是否正確。確認後再處理 AR 整合。

---

## 8. 要刪除的檔案

```
src/features/ar/scene.html
src/features/ar/hdr-environment.js
src/features/ar/createArV5Island.ts
src/features/ar/createArV5Island.test.ts
src/features/ar/ar-v5-interactions.ts
src/features/ar/ar-v5-interactions.test.ts
src/features/ar/scene.test.ts
```

---

## 9. 風險與緩解

| 風險 | 緩解 |
|------|------|
| MindARThree 跟 Three.js 版本不相容 | `mind-ar@1.2.5` peer dep 是 `three@>=0.136.0`，安裝 `three@0.173` 應該 OK |
| GLB 模型渲染結果跟 A-Frame 不一致 | 先做 viewer 驗證，確認 tone mapping + envMap 設定 |
| ModelViewer 的 OrbitControls 跟 MindAR 衝突 | 兩者在不同 page/route，不會同時初始化 |
| Phase 2 互動邏輯遷移複雜度 | Phase 1 先跳過，之後再評估 |

---

## 10. 非目標（Scope Boundary）

- **不改** `ArScanner.tsx` 頁面（props 不變）
- **不改** Quiz 相關元件（之後處理）
- **不做** R3F（React Three Fiber）— 保持 imperative Three.js
- **不做** Phase 2 互動邏輯（portfolio、buttons、video）
