# AR V5 DOM Island 設計文件

## 背景

專案已有四版 AR 實作：

| 版本 | 做法 | 結果 |
|------|------|------|
| V2 | A-Frame 自訂元素直接寫在 JSX 裡 + imperative JS 處理互動 | React 不理解 A-Frame custom elements，lifecycle 衝突 |
| V3 | 同 V2 模式，加上完整互動邏輯 | 同上問題 |
| V4 | 純 Three.js + MindAR Three.js API | 只做到開啟相機，互動未完成 |

**核心問題**：React 的 virtual DOM 和 A-Frame 的 self-managed scene graph 互相打架。V2/V3 把 `<a-scene>` 寫在 JSX 裡，React 會嘗試 diff/patch 這些 custom elements，但 A-Frame 內部自己管 DOM，兩邊衝突。

## 目標

建立 `/product-ar` 路由，實作類似 MindAR 官方 `advanced.html` 的功能：

- 掃描 logo/image target
- 顯示 3D model（帶動畫）
- 顯示上方影片（可播放）
- 顯示下方互動按鈕（profile, web, email, location）
- Portfolio 輪播（左/右切換）
- 點擊按鈕後控制 model / video / animation

## 方案：DOM Island

**核心思路**：React 只管一個空的 `<div ref>`，整個 A-Frame scene 用外部 HTML 檔案定義，在 runtime 注入。

```
React component
  └─ <div ref={containerRef} />  ← 空容器
  └─ useEffect:
       1. 依序載入 aframe.min.js → mindar-image-aframe.prod.js
       2. 用 DOMParser 解析 scene.html → appendChild 注入
       3. 綁定互動事件
       4. cleanup: 銷毀 scene、停止 camera、移除 DOM
```

**為什麼不用 innerHTML？**
- `innerHTML` 會覆蓋 container 內所有內容，包括 React 可能加的東西
- `DOMParser` + `appendChild` 更安全，不會影響其他內容
- `?raw` import 讓 HTML 檔案在 build time 打包，零額外 HTTP request

**為什麼 HTML 放外部檔案？**
- 可以直接編輯 HTML，不用改 TSX
- 更接近原始 `advanced.html` 的結構
- 未來如果要改成 iframe 方案，HTML 可以直接搬過去

## 檔案結構

```
src/
├─ pages/
│   └─ ProductARPage.tsx              ← 頁面殼 (status, nav, back button)
├─ features/ar/
│   ├─ MindARScene.tsx                 ← React wrapper (空 div + useEffect)
│   ├─ scene.html                      ← 完整 A-Frame scene（外部檔案）
│   ├─ styles.css                      ← scanning overlay 樣式
│   ├─ createArV5Island.ts            ← 工廠：載入 → 注入 → 互動 → cleanup
│   ├─ ar-v5-interactions.ts          ← 互動邏輯 (TS, 可測試)
│   └─ ar-v5-interactions.test.ts     ← 互動邏輯測試
├─ router.tsx                          ← 新增 /product-ar 路由
```

**素材**：直接复用 `/public/assets/ar-v3/`（targets, icons, portfolio, videos, 3D model）

## 資料流

```
ProductARPage.tsx
  └─ <MindARScene onReady onTargetFound onTargetLost onError />
       └─ <div ref={containerRef} />
       └─ useEffect → createArV5Island(container, callbacks)
            │
            ├─ 1. loadScripts()        ← 先載 aframe，再載 mindar plugin
            ├─ 2. registerComponents() ← AFRAME.registerComponent
            ├─ 3. injectScene()        ← DOMParser(scene.html?raw) → appendChild
            ├─ 4. injectStyles()       ← <style> from styles.css?raw
            ├─ 5. waitForSceneLoad()   ← a-scene 'loaded' event
            ├─ 6. initInteractions()   ← ar-v5-interactions.ts
            └─ return cleanup()        ← stop runtime/camera, remove DOM, clear timers
```

## 各模組職責

### `scene.html`
- 完整的 A-Frame scene 定義
- 包含 scanning overlay、a-assets、a-camera、a-entity (target)
- 所有 3D model、video、button 都在這裡定義
- 路徑指向 `/assets/ar-v3/`

### `styles.css`
- Scanning overlay 的樣式（corner brackets、scanline animation）
- 用 `?raw` import 後注入 `<style>` 到 `<head>`

### `ar-v5-interactions.ts`
- 純 DOM 操作，不依賴 React 或 A-Frame
- 處理 targetFound → avatar 動畫 → portfolio 滑入 → info buttons 顯示
- 處理 targetLost → 隱藏內容、停止 video、重設狀態，下一次 targetFound 可重新啟動
- 處理 button clicks（portfolio 切換、video 播放、text 更新）
- Session-based timer/event management，cleanup 可完全清除
- **可獨立測試**（用 jsdom + fake timers）

### `createArV5Island.ts`
- 工廠函式，orchestrate 整個流程
- 載入 A-Frame → 載入 MindAR plugin → 註冊 components → 注入 scene → 等待 load → 初始化互動
- 回傳可重複呼叫的 cleanup function
- 初始化期間若 container 已 detach 或 wrapper 已取消，必須停止後續注入並清掉已建立資源
- Cleanup 必須嘗試停止 A-Frame renderer、MindAR runtime、camera media tracks、video playback，並移除注入 DOM/CSS

### `MindARScene.tsx`
- 薄 React wrapper
- 只有 `<div ref>` + `useEffect`
- 用 cancellation controller/cleanup handle 處理 StrictMode double-mount，不允許 unmount 後再注入 scene
- Callbacks 用 ref 包裝，避免 re-render

### `ProductARPage.tsx`
- 頁面殼：back button、status indicator、error display
- 不處理 AR 邏輯，只顯示狀態

## 互動流程（從 advanced.html 移植）

1. **Target Found** → 觸發啟動序列
2. **Avatar 動畫** → 從 z=-0.3 滑到 z=0.3（約 75 個 interval，每個 10ms）
3. **Portfolio 滑入** → 從 y=0 滑到 y=0.6，然後顯示 left/right buttons
4. **Info Buttons 依序顯示** → profile → web → email → location（各間隔 300ms）
5. **Button Clicks**：
   - Left/Right → 切換 portfolio items
   - Preview → 播放影片（判斷 webm/mp4 支援）
   - Profile/Web/Email/Location → 更新下方 text
    - Text click (when web tab) → 導向 softmind.tech
6. **Target Lost** → 隱藏 portfolio / buttons / text，停止影片並重設 activation，重新對準 target 後可重新播放啟動序列

## 風險與緩解

| 風險 | 緩解措施 |
|------|----------|
| Camera 殘留 | `destroyArV5Scene` 停止 renderer/runtime + 停止 media tracks + 清空 videos + 移除所有 DOM |
| A-Frame 全域狀態 | `registerComponent` 有 guard 防重複，scene 銷毀靠 `removeChild` |
| StrictMode double-mount | wrapper cleanup 會取消 pending init，factory 會檢查 container 是否仍 connected |
| Script 重複載入 | `loadScript` 檢查現有 `<script>` 標籤，已載入則直接 resolve；MindAR 必須在 A-Frame 後載入 |
| `?raw` import 型別 | Vite 原生支援，必要時加 `vite/client` 型別宣告 |

## 驗收標準

- [ ] 手機瀏覽器可開啟相機
- [ ] 掃描 logo 後可以觸發 target found
- [ ] 3D model 顯示（帶動畫）
- [ ] 上方影片 plane 顯示
- [ ] 下方四個按鈕顯示（帶 pulse 動畫）
- [ ] Portfolio 可左右切換
- [ ] 點 Preview 按鈕後 video 播放
- [ ] 點 info 按鈕後 text 更新
- [ ] 點 web text 後導向 softmind.tech
- [ ] Target lost 後內容隱藏
- [ ] Target lost 後影片停止，重新掃描可再次啟動序列
- [ ] 離開頁面後 camera 不會殘留
- [ ] 重新進入 AR 頁面可以再次正常啟動
- [ ] 重複進入/離開 3 次無 memory leak

## 和 V2/V3 的差異

| 面向 | V2/V3 (JSX 做法) | V5 (DOM Island) |
|------|------------------|-----------------|
| Scene 定義 | JSX `<a-scene>` | 外部 `scene.html` + `?raw` |
| React 角色 | 管理 A-Frame elements | 只管空 div |
| DOM 注入 | React reconciliation | DOMParser + appendChild |
| DOM 衝突 | A-Frame vs React | 無 — React 不碰 AR DOM |
| 互動邏輯 | 獨立檔案，query document | 相同模式，query document |
| Cleanup | 部分（可能殘留） | 完整 — removeChild + stop renderer |
| 素材 | 各自 `/assets/ar-v2/` 或 `/assets/ar-v3/` | 复用 `/assets/ar-v3/` |
| 可編輯性 | 改 TSX 才能改 scene | 直接改 `scene.html` |

## 未來擴展

- 如果要換 target/model/video，只需改 `scene.html` 和互動邏輯
- 如果要改成 iframe 方案，`scene.html` 可以直接搬到 `public/` 用
- 如果要加更多互動，在 `ar-v5-interactions.ts` 擴充即可

## 必要測試覆蓋

- `ar-v5-interactions.test.ts`：targetFound 啟動序列、targetLost reset、portfolio 切換、video source 選擇、info text、web 導航、event/timer cleanup。
- `createArV5Island.test.ts`：script 順序、scene/CSS 注入、load failure cleanup、idempotent cleanup、container detached/pending init cancellation。
- `MindARScene.test.tsx`：mount 初始化、unmount cleanup、unmount before promise resolve、callback ref 更新不重新初始化。
- `ProductARPage.test.tsx`：ready/found/lost/error 狀態顯示與返回行為。
