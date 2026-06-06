# Task: 將 MindAR advanced.html 改造成 React 專案內可用的 WebAR Viewer

## 背景

目前專案是 React 專案，已有 MindAR Three.js 嘗試版本，但目前只做到可以開啟相機。

現在需求更接近 MindAR 官方 `advanced.html` 範例：

* 掃描 logo/image target
* 顯示 3D model
* 顯示上方影片
* 顯示下方互動按鈕
* 點擊按鈕後控制 model / video / animation

因此本任務不要繼續把 `advanced.html` 翻成 Three.js，而是改用：

```txt
React 外殼
+
MindAR A-Frame DOM island
+
advanced.html 改版
```

React 只負責 mount / unmount / open / close，WebAR 場景交給 A-Frame + MindAR 處理。

---

## 目標

建立一個新的 React component：

```txt
MindARAFrameViewer.tsx
```

它需要：

1. 在 React 裡建立一個 container DOM
2. 在 `useEffect` 裡注入 A-Frame / MindAR 的 HTML scene
3. 使用 A-Frame 版本的 MindAR
4. 支援掃描 logo target
5. 顯示 GLB model
6. 顯示影片 plane
7. 顯示下方按鈕
8. 按鈕可控制 model 互動
9. component unmount 時清掉 scene，避免 camera / scene lifecycle 殘留

---

## 不要做的事

不要把 A-Frame scene JSX 化。

避免這種寫法：

```tsx
<a-scene>
  <a-entity />
</a-scene>
```

不要把每個 AR 元素拆成 React component。

不要繼續在這個任務內補 Three.js Raycaster / GLTFLoader / VideoTexture。

---

## 建議檔案結構

```txt
src/
  features/
    ar/
      MindARAFrameViewer.tsx
      mindar-interactions.ts

public/
  ar/
    targets/
      logo.mind
    models/
      product.glb
    videos/
      demo.mp4
    icons/
      rotate.png
      play.png
```

---

## 套件需求

確認專案有安裝：

```bash
npm install aframe mind-ar
```

或依目前專案 package manager 調整。

---

## React Component 實作方向

建立：html

---

## 驗收標準

完成後需要確認：

* 手機瀏覽器可開啟相機
* 掃描 logo 後可以觸發 target found
* 3D model 顯示
* 上方影片 plane 顯示
* 下方兩個按鈕顯示
* 點 Rotate 按鈕後 model 旋轉
* 點 Video 按鈕後 video 播放 / 暫停
* target lost 後內容隱藏
* 離開頁面後 camera 不會殘留
* 重新進入 AR 頁面可以再次正常啟動

---

## 實作順序

請按以下順序執行，不要一次做太多：

1. 建立 `MindARAFrameViewer.tsx`
2. 先只放 `a-scene + camera + target`
3. 確認掃描 logo 後 target found
4. 加入 GLB model
5. 加入 video plane
6. 加入一個 clickable button
7. 實作 Rotate
8. 實作 Video play/pause
9. 最後補 close/unmount cleanup

---

## 注意事項

影片在手機上需要：

```html
muted
playsinline
webkit-playsinline
```

按鈕要被點擊，需要 camera 有：

```html
cursor="fuse: false; rayOrigin: mouse"
raycaster="objects: .clickable"
```

可點擊物件需要：

```html
class="clickable"
```

若 React dev mode 有 StrictMode 導致重複 mount 問題，先在 AR POC 頁面確認是否需要暫時避開 StrictMode，或確保 cleanup 能完全清除 scene。

---

## 最終策略

本任務不是要建立完美 React WebAR 架構。

本任務目標是：

```txt
用最低風險方式，把 advanced.html 的 WebAR 效果搬進 React 專案。
```

優先順序：

```txt
能跑
↓
穩定
↓
互動正確
↓
再工程化
```
