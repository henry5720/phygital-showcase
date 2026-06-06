## 概述

這份 spec 的目標，是新增 `/ar/v4` 作為正式的 React + MindAR Three.js API 實驗版，保留 `/ar/v3` 作為 MindAR 官方 `advanced.html` 的 A-Frame 對照版。

V4 不追求直接移植 `advanced.html` 的 DOM 結構；它只參考使用者可見的體驗：掃 logo 後出現 3D model、影片面板與可互動按鈕。實作上改用官方 `mind-ar/dist/mindar-image-three.prod.js` 搭配 Three.js，讓 React 負責頁面狀態與互動結果。

## 參考依據

主要參考來源：

1. `../mind-ar-js-doc/static/samples/advanced.html`
2. `../web-ar/src/Experience.jsx`
3. `../web-ar/src/components/ARViewer.jsx`
4. `src/components/MindArCanvas.tsx`
5. `src/pages/ArV3Page.tsx`
6. `src/components/ArV3Scene.tsx`

解讀原則：

1. `advanced.html` 只作為效果與互動流程參考。
2. `web-ar` 作為 React + MindARThree + Three.js 的架構參考。
3. 目前 repo 既有 `MindArCanvas.tsx` 已證明官方 MindAR Three API 可以在 React lifecycle 中使用，V4 應延續這個方向。

## 問題描述

目前 `/ar/v3` 已經能接近 MindAR 官方 advanced 範例，但它是 A-Frame 路線。works, but 它會讓 React 狀態、A-Frame DOM 狀態、MindAR lifecycle 與 Three.js resource lifecycle 混在一起。

使用者後續會替換自己的 logo target、3D model、影片與按鈕素材。若繼續把 V3 改成正式版本，會同時失去官方範例對照組，也會把 A-Frame 移植版和產品化架構混在同一條路由中。

## 目標

1. 新增 `/ar/v4`，定位為 React + MindARThree + Three.js 的正式架構實驗版。
2. 保留 `/ar/v3`，定位為 A-Frame advanced 範例對照版。
3. 使用官方 `mind-ar` 套件，不引入第三方 `mind-ar-react` wrapper。
4. 建立一個可替換素材的最小 AR 閉環：掃 target、顯示 model、顯示影片面板、點擊 3D 按鈕、回傳 React 狀態。
5. 將 Three.js scene 建立、事件綁定與資源清理集中在清楚的邊界中。

## 非目標

1. 不重寫 `/ar/v3`。
2. 不使用 A-Frame 實作 V4。
3. 不使用第三方 `mind-ar-react`。
4. 不導入 React Three Fiber；第一版直接使用 Three.js，降低新增抽象層風險。
5. 不做 CMS、多 target、多 portfolio carousel 或大型動畫系統。
6. 不追求和 `advanced.html` pixel-perfect 或 DOM 1:1。

## 目標行為

### 場景流程

1. 使用者進入 `/ar/v4`。
2. 頁面顯示返回按鈕、簡短說明與 AR viewport。
3. MindAR 啟動相機並等待 image target。
4. 掃到 logo / card target 後，anchor 上顯示 3D model。
5. model 附近顯示影片 preview plane 與 2 到 3 個 3D button。
6. 點擊影片 preview 後，preview 切換為 video texture 並嘗試播放影片。
7. 點擊 3D button 後，事件回傳 React，React 在 overlay 或資訊區顯示對應內容。
8. 離開頁面時停止 MindAR、renderer loop、影片播放並釋放 Three.js resources。

### 互動邏輯

第一版按鈕固定為三個 action：

1. `profile`：顯示簡短介紹文字。
2. `web`：顯示網址，並由 React 資訊區提供開啟外部連結的控制。
3. `play-video`：播放或顯示影片內容。

按鈕應是 Three.js 場景中的可點擊 mesh，使用 `Raycaster` 做 hit test。點擊後不要直接在 scene 內處理所有業務狀態，而是呼叫 callback 交回 React。

### 素材策略

第一版可以沿用現有 V3 demo assets，避免素材遷移阻塞架構驗證：

1. target：`/assets/ar-v3/targets/card.mind`
2. target image：`/assets/ar-v3/targets/card.png`
3. model：`/assets/ar-v3/models/softmind/scene.gltf`
4. video：`/assets/ar-v3/portfolio/paintandquest.mp4`，可保留 WebM fallback
5. icons：可先使用 Three.js primitive button 或現有 icon texture

後續替換使用者正式素材時，只需調整 config，而不是改動 AR runtime 核心。

## 技術設計

### 路由與頁面

新增：

1. `src/pages/ArV4Page.tsx`
2. `src/components/ar-v4/ArV4Experience.tsx`
3. `src/lib/ar-v4/createMindArV4Experience.ts`
4. `src/lib/ar-v4/assets.ts`

若現有 router 需要註冊 route，新增 `/ar/v4`。若 AR 首頁有版本入口，也可新增一個 V4 入口卡片。

### `ArV4Page.tsx`

職責：

1. 提供頁面 layout。
2. 提供返回 AR 首頁按鈕。
3. 顯示目前 AR 狀態，例如 scanning、target found、target lost、selected action。
4. 渲染 `ArV4Experience`。

頁面不直接操作 Three.js 或 MindAR instance。

### `ArV4Experience.tsx`

職責：

1. 建立 AR container ref。
2. 在 mount 時呼叫 `createMindArV4Experience`。
3. 在 unmount 時呼叫 cleanup。
4. 把 `onTargetFound`、`onTargetLost`、`onAction` callback 傳給 runtime。

React callback 應透過 ref 保持最新值，避免每次 render 重建 MindAR session。

### `createMindArV4Experience.ts`

職責：

1. 動態載入 `mind-ar/dist/mindar-image-three.prod.js`。
2. 建立 `MindARThree` instance。
3. 建立 anchor 與 Three.js objects。
4. 載入 GLTF model。
5. 建立 video plane、button meshes、raycaster。
6. 啟動 `mindarThree.start()` 與 `renderer.setAnimationLoop()`。
7. 回傳 cleanup function。

設計上應避免把 React state 放進 Three.js runtime；runtime 只透過 callback 回報事件。

### Three.js Scene 組成

第一版 scene 組成：

1. ambient light 與 directional light。
2. GLTF model，掛在 target anchor group 上。
3. video preview plane，位於 model 上方或旁邊。
4. 2 到 3 個 button mesh，位於 target 下方或側邊。
5. 每個可點擊物件都加入 hit target list。

影片可用 `HTMLVideoElement` 搭配 `THREE.VideoTexture`。考慮 iOS autoplay policy，影片預設 muted、playsInline，並在使用者點擊後才呼叫 `play()`。

### 資源清理

Cleanup 必須處理：

1. 移除 pointer event listener。
2. `renderer.setAnimationLoop(null)`。
3. `mindarThree.stop()`。
4. 暫停並重置 video。
5. dispose geometries、materials、textures。
6. 移除 MindAR 產生的 overlay residue。

這是 V4 的核心品質要求；AR route 會反覆進出，清理不完整會造成 camera、canvas、event listener 或 GPU resources 殘留。

## 錯誤處理

1. 若 MindAR dynamic import 失敗，回報錯誤狀態給 React，頁面顯示可理解的訊息。
2. 若相機權限失敗，保留原始錯誤供 console debugging，React 顯示「請允許相機權限」。
3. 若 model 或 texture 載入失敗，不應讓整個 React app crash；V4 可顯示錯誤 overlay。
4. 若影片播放被瀏覽器拒絕，按鈕狀態保持可再次點擊，並回報播放失敗。

## 測試策略

自動化測試聚焦不依賴真實相機的部分：

1. `ArV4Page` 會 render 標題、返回按鈕與 AR experience 容器。
2. `ArV4Experience` mount 時會呼叫 runtime factory，unmount 時會呼叫 cleanup。
3. callback wiring 可在 mocked runtime 下驗證 target found / lost / action 更新 React UI。
4. assets config 包含必要路徑。

實機 / 瀏覽器手動驗證：

1. 使用 HTTPS dev server 開啟 `/ar/v4`。
2. 允許相機權限。
3. 掃現有 target image。
4. 確認 model 顯示在 target 上。
5. 點擊 video preview 後影片播放或顯示可理解的播放失敗狀態。
6. 點擊 3D button 後 React overlay 更新。
7. 離開再回到頁面，確認 camera、canvas、overlay 與互動不會重複堆疊。

## 風險

1. iOS Safari 對 video texture 播放限制較嚴，必須用使用者手勢觸發播放。
2. GLTF 模型大小會直接影響手機載入與 tracking 體驗。
3. Three.js raycaster 在手機上需要足夠大的 hit area，否則按鈕難點。
4. MindAR package 沒有完整 TypeScript declarations，runtime import 需要局部型別包裝或 `ts-expect-error`。
5. 若第一版同時追求過多 advanced.html 細節，會拖慢架構驗證。

## 完成標準

V4 第一版完成時，應符合：

1. `/ar/v4` route 存在且不影響 `/ar/v3`。
2. V4 使用 MindAR Three.js API，不依賴 A-Frame 或 `mind-ar-react`。
3. 掃 target 後可顯示 3D model、影片 plane 與可點擊 3D buttons。
4. 3D click 事件能回傳 React 並更新 UI 狀態。
5. Unmount cleanup 覆蓋 MindAR、renderer、video、event listener 與 Three.js resources。
6. 自動化測試覆蓋 React wiring 與 runtime cleanup contract。
