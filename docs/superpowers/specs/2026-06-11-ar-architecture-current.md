# AR 架構文件 — MindAR + A-Frame + React 整合

## 概述

本專案的 AR 模組使用 **MindAR + A-Frame + React** 整合方案，遵循 [hiukim/mind-ar-js-react](https://github.com/hiukim/mind-ar-js-react) 官方模式。核心做法是透過 npm 引入 A-Frame 和 MindAR，用 JSX 聲明式建立 A-Frame 場景，`useRef` 取得 scene 引用，`useEffect` 啟動/停止 AR。

## 參考來源

官方 React 範例 (`hiukim/mind-ar-js-react` 的 `mindar-viewer.js`)：

```jsx
import 'aframe';
import 'mind-ar/dist/mindar-image-aframe.prod.js';

export default () => {
  const sceneRef = useRef(null);
  useEffect(() => {
    const sceneEl = sceneRef.current;
    const arSystem = sceneEl.systems["mindar-image-system"];
    sceneEl.addEventListener('renderstart', () => arSystem.start());
    return () => arSystem.stop();
  }, []);

  return (
    <a-scene ref={sceneRef} mindar-image="..." ...>
      <a-assets>...</a-assets>
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      <a-entity mindar-image-target="targetIndex: 0">
        <a-plane src="#card" ...></a-plane>
        <a-gltf-model src="#avatarModel" ...></a-gltf-model>
      </a-entity>
    </a-scene>
  );
};
```

本專案遵循此模式，加上 `hdr-environment` 自訂元件和 RGBELoader 設定。

## 技術選擇

### 為什麼選 MindAR？

MindAR 提供 Image Target 追蹤 + 3D 模型渲染的官方支援組合，免費開源，支援 A-Frame 整合。專案中未評估其他方案（8th Wall、AR.js 等）。

### 為什麼用 A-Frame 而非純 Three.js？

A-Frame 提供：
- 聲明式場景管理（`<a-scene>`, `<a-entity>`, `<a-camera>`）
- 內建 Raycaster、cursor 等互動機制
- 與 MindAR 的 A-Frame 整合 API 直接相容

V4 嘗試純 Three.js + MindAR Three.js API，只做到鏡頭開啟，互動功能無法完成。

### 為什麼用 JSX 而非 `document.createElement`？

早期版本（V2/V3）嘗試 JSX 時遇到 React/A-Frame DOM 衝突，但那是 React 16/17 時期的問題。本專案使用 **React 19**，對 custom elements 支援更好。官方 React 範例也使用 JSX 且運作正常。

JSX 的優勢：
- 聲明式，場景結構一目了然
- 代碼量大幅減少（233 行 → ~150 行）
- 與 MindAR 官方文檔一致
- 更容易理解和維護

### 為什麼不用 DOM Island（外部 HTML）？

`createArV5Island.ts` 和 `scene.html` 是已設計但未採用的替代方案。DOM Island 用 CDN 載入腳本 + `DOMParser` 解析外部 HTML，但選擇 npm 引入是因為：
- Vite build 時打包，零額外 HTTP request
- 統一依賴管理（package.json）
- 型別支援更好

## 實作架構

### 檔案結構

```
src/features/ar/
├─ MindARScene.tsx            ← React 元件（主要使用中）
├─ hdr-environment.js         ← 自訂 A-Frame 元件：HDR 環境貼圖
├─ ar-v5-interactions.ts      ← 互動邏輯（目前未串接）
├─ scene.html                 ← A-Frame 場景 HTML（未使用，保留）
├─ createArV5Island.ts        ← DOM Island 工廠（未使用，保留）
├─ styles.css                 ← scanning overlay 樣式
├─ MindARScene.test.tsx       ← 元件測試
├─ createArV5Island.test.ts   ← 工廠測試
├─ ar-v5-interactions.test.ts ← 互動邏輯測試
└─ scene.test.ts              ← 場景測試
```

### 核心流程

```
ArScanner.tsx (頁面殼：status, nav, back button)
  └─ <MindARScene onReady onTargetFound onTargetLost onError />
       └─ JSX <a-scene ref={sceneRef} ...>
            ├─ <a-camera ...>
            ├─ <a-plane ...>
            └─ <a-entity mindar-image-target="targetIndex: 0">
                 └─ <a-entity gltf-model="fizzt.glb" ...>
       └─ useEffect:
            1. import 'aframe'              ← npm 引入，註冊 AFRAME 全域物件
            2. import 'mind-ar/...'         ← npm 引入，註冊 mindar-image 元件
            3. import { RGBELoader }        ← Three.js RGBELoader，掛到 window.THREE
            4. AFRAME.registerComponent('hdr-environment', ...) ← 註冊自訂元件
            5. 等待 scene 'loaded' 事件 → 啟動 MindAR system
            6. 綁定 targetFound/targetLost 事件
            └─ return cleanup():
                 - renderer.setAnimationLoop(null) ← 停止渲染迴圈
                 - sceneEl.pause()                 ← 暫停場景
                 - mindarSystem.stop()             ← 停止 AR 追蹤
                 - 停止所有 video MediaStream tracks ← 釋放相機
                 - 移除 MindAR UI overlay
```

### MindARScene.tsx 元件

```tsx
import { useEffect, useEffectEvent, useRef } from 'react'
import 'aframe'
import 'mind-ar/dist/mindar-image-aframe.prod.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

// 全域掛載：RGBELoader + hdr-environment 元件
window.THREE = window.THREE || {}
window.THREE.RGBELoader = RGBELoader
window.AFRAME?.registerComponent('hdr-environment', { ... })

export function MindARScene({ onReady, onTargetFound, onTargetLost, onError }) {
  const sceneRef = useRef(null)

  useEffect(() => {
    const sceneEl = sceneRef.current
    // 啟動 MindAR system
    // 綁定 targetFound/targetLost 事件
    return () => { /* cleanup */ }
  }, [])

  return (
    <a-scene
      ref={sceneRef}
      mindar-image="imageTargetSrc: /assets/web-ar/card.mind; ..."
      hdr-environment="src: /assets/web-ar/env.hdr; ..."
      ...
    >
      <a-camera position="0 0 0" look-controls="enabled: false" ... />
      <a-plane src="/assets/web-ar/圖層 1 拷貝＿擴大.png" />
      <a-entity mindar-image-target="targetIndex: 0">
        <a-entity gltf-model="/assets/web-ar/fizzt.glb" ... />
      </a-entity>
    </a-scene>
  )
}
```

### 各檔案職責

#### `MindARScene.tsx`（主要使用中）

React 元件，職責：

1. **模組載入副作用**：檔案頂端 `import 'aframe'` / `import 'mind-ar'` 註冊全域物件
2. **全域掛載**：將 `RGBELoader` 掛到 `window.THREE`，註冊 `hdr-environment` 元件
3. **JSX 場景**：聲明式建立 `<a-scene>` 及其子元素
4. **useEffect**：啟動 MindAR system、綁定 targetFound/targetLost 事件
5. **cleanup**：停止渲染迴圈、暫停場景、停止 AR、釋放相機、移除 UI overlay

#### `hdr-environment.js`

自訂 A-Frame 元件，用 Three.js 的 RGBELoader 載入 HDR 環境貼圖，設定為 PBR 材質的反射環境。在 AR 模式下 `showBackground: false`（不遮擋相機畫面）。

#### `ar-v5-interactions.ts`（目前未串接到 MindARScene）

互動邏輯模組，處理：
- targetFound → avatar 動畫 → portfolio 滑入 → info buttons 顯示
- targetLost → 隱藏內容、停止 video、重設狀態
- button clicks（portfolio 切換、video 播放、text 更新）

使用 session-based 狀態管理，cleanup 可完全清除所有 timer/event。

**注意**：此檔案目前**沒有被 `MindARScene.tsx` 引用**。`MindARScene.tsx` 只處理基本的 scene 建立和 targetFound/targetLost 事件，互動邏輯尚未整合。

#### `scene.html` + `createArV5Island.ts`（未使用）

DOM Island 方案的設計產物，保留作為替代方案。

### 素材路徑

| 素材 | 路徑 |
|------|------|
| MindAR 特徵檔 | `/assets/web-ar/card.mind` |
| 3D 模型 | `/assets/web-ar/fizzt.glb` |
| HDR 環境 | `/assets/web-ar/env.hdr` |
| 圖片 target | `/assets/web-ar/圖層 1 拷貝＿擴大.png` |

### 目前功能範圍

- ✅ 相機開啟
- ✅ Image target 追蹤（targetFound/targetLost）
- ✅ 3D 模型顯示（fizzt.glb）
- ✅ HDR 環境反射
- ⚠️ 圖片 plane 顯示（硬編碼路徑）
- ❌ Portfolio 輪播
- ❌ 按鈕互動
- ❌ Video 播放
- ❌ Scanning overlay

## 測試

| 測試檔 | 測試對象 | 狀態 |
|--------|----------|------|
| `MindARScene.test.tsx` | React 元件 | ✅ |
| `createArV5Island.test.ts` | DOM Island 工廠 | ✅（但未使用） |
| `ar-v5-interactions.test.ts` | 互動邏輯 | ✅（但未整合） |
| `scene.test.ts` | 場景設定 | ✅ |

## 未來考量

1. **整合互動邏輯**：將 `ar-v5-interactions.ts` 接到 `MindARScene.tsx`，補齊 portfolio、buttons、video 功能
2. **考慮 DOM Island**：如果互動邏輯複雜度增加，可考慮切回 `createArV5Island.ts` 方案，把場景定義分離到 `scene.html`
3. **清理未使用檔案**：`scene.html`、`createArV5Island.ts` 目前是死 code，可考慮移除或正式啟用
