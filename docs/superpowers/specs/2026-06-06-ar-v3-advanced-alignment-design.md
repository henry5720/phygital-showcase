## 概述

這份 spec 的目標，是讓 `phygital-showcase` 的 `/ar/v3` 體驗，在使用者可見的行為與整體呈現上，對齊 MindAR 官方互動式 image tracking 範例 `mind-ar-js-doc/static/samples/advanced.html`。

這次不追求 pixel-perfect，也不追求 DOM 結構完全一致；重點是用務實方式把互動流程、場景表現與操作感受拉回到官方範例，同時保留目前 repo 已經存在的 React + A-Frame 架構。

## 參考依據

主要參考來源：

1. `../mind-ar-js-doc/static/samples/advanced.html`
2. `../mind-ar-js-doc/docs/examples/interactive.md`
3. `src/pages/ArV3Page.tsx`
4. `src/components/ArV3Scene.tsx`
5. `src/lib/ar-v3.ts`

解讀原則：

1. 以 docs repo 的 `advanced.html` 作為行為上的主要對照來源。
2. 只要不妨礙對齊，就保留目前專案既有的 route、asset 路徑與 React 元件邊界。

## 問題描述

`/ar/v3` 看起來已經是從官方 `advanced.html` 移植過來，但目前仍有幾個明顯差異：

1. 部分按鈕行為與官方範例不同。
2. 文字內容與導頁方式沒有遵循官方 demo 流程。
3. portfolio 媒體播放邏輯被簡化。
4. 初始顯示狀態與分階段出場時序只對齊了一部分。
5. event listener 與 timer 的生命週期管理，在 React mount/unmount 場景下偏脆弱。

目前版本能動，但還不算是一個穩定、且足夠接近官方 interactive example 的實作。

## 目標

1. 讓 `/ar/v3` 對終端使用者來說，互動感受與 `advanced.html` 大致一致。
2. 保留既有 `/ar/v3` 路由與目前 React + A-Frame 整合方式。
3. 改善生命週期安全性，避免頁面重進後累積重複 listener 或 timer。
4. 讓修改盡量最小，集中在現有 `ar/v3` 相關檔案中。

## 非目標

1. 不新增 `/ar/v4` 路由。
2. 不把整個體驗重構成大型抽象層。
3. 不改寫成 Three.js 版本。
4. 不追求與上游 sample 在 DOM 或 assets 上嚴格 1:1。
5. 不做超出行為對齊需求的重新設計。

## 目標行為

### 場景流程

當 target 被辨識到時：

1. avatar 沿著 z 軸往前移動。
2. 經過短暫延遲後，portfolio panel 顯示並向上滑入。
3. panel 動畫完成後，左右切換按鈕才顯示。
4. 再經過短暫延遲後，info icons 依序出現。

當 target 遺失時：

1. 場景不應崩潰，也不應持續堆疊額外 listener。
2. 任何用於 staged reveal 的 timer 不應在 remount 後殘留。

### Portfolio 互動

1. portfolio panel 內有三個 item。
2. 任一時刻只顯示一個 portfolio item。
3. 左右控制按鈕可以循環切換 item。
4. 點擊第一個 portfolio preview 後，會從預覽圖切換為影片播放。
5. 若瀏覽器支援 WebM，優先播放 WebM；否則退回 MP4。

左右方向是否與上游範例完全一致，不是最高優先；只要切換行為直覺且穩定即可。

### Info 區互動

四個按鈕應與官方範例有一致行為：

1. Profile 將文字設為 `AR, VR solutions and consultation`。
2. Web 將文字設為 `https://softmind.tech`，並把目前 tab 標記為 `web`。
3. Email 將文字設為 `hello@softmind.tech`。
4. Location 將文字設為 `Vancouver, Canada | Hong Kong`。
5. 只有在目前 tab 是 `web` 時，點擊文字區才會導頁。

### 視覺對齊

以下視覺要素應保留或對齊上游 sample：

1. 自訂 scanning overlay。
2. portfolio panel 組成方式。
3. 延遲依序出現的 icons。
4. pulsing / animation 的 info icons。
5. icons 下方持續存在的文字區。

允許有些微 CSS 差異，只要整體辨識度與官方範例足夠接近即可。

## 技術設計

### 檔案邊界

除非缺少必要媒體資產，否則實作應限制在以下檔案：

1. `src/components/ArV3Scene.tsx`
2. `src/lib/ar-v3.ts`
3. `public/assets/ar-v3/**`，僅在缺少必要 media asset 時才調整

### `ArV3Scene.tsx`

職責：

1. 載入 A-Frame 與 MindAR scripts。
2. 輸出 scene markup 與資產宣告。
3. 提供互動邏輯所依賴的 element ID。
4. 讓 asset 宣告與初始 visible 狀態符合目標行為。

預期修改：

1. 確保 portfolio 左右按鈕初始為隱藏，並由互動邏輯控制顯示。
2. 若檔案存在或需要補上，加入 WebM video asset 宣告。
3. 在需要時，讓 icon animation 與 text entity attributes 更貼近官方 demo。
4. 保留目前 `/assets/ar-v3/...` 的本地 asset 路徑。

### `ar-v3.ts`

職責：

1. 確保 A-Frame components 只註冊一次。
2. 將互動行為綁到 scene entities 上。
3. 管理分階段動畫用的 timers。
4. 在 teardown 時重置並清理 listeners / timers。

預期修改：

1. 在可行範圍內，把脆弱的 module-global interaction state 收斂成較明確的單次 session state。
2. 避免頁面重進時重複綁定 event listener。
3. 讓 `showAvatar`、`showPortfolio`、`showInfo` 的時序更接近官方範例。
4. 還原官方文字內容與 web click-through 行為。
5. 加入影片格式 fallback 邏輯。
6. 提供實際會清掉 interval / timeout / stale binding 的 cleanup。

這裡的設計應保持單純：優先使用少量 module-level registration guard 搭配明確 cleanup，而不是引入大型 state machine。

## 錯誤處理

1. 若 `AFRAME` 不存在，直接輸出 console error，並停止後續處理。
2. 若必要 scene elements 缺失，略過該段行為，不要直接 throw。
3. Cleanup 必須能容忍部分初始化完成、部分未完成的狀態。
4. 影片播放 fallback 必須能從 WebM 安全退回 MP4，而不丟出錯誤。

## 測試策略

這次工作本質上是行為整合，因此驗證應以可行的自動化邏輯測試，加上瀏覽器中的手動 runtime 檢查為主，尤其 AR 行為不容易在純測試環境完整重現。

若要補 automated tests，應優先涵蓋：

1. 不依賴真實 AR camera session 也能驗證的邏輯。
2. 媒體格式 fallback 的選擇邏輯。
3. 若現有測試基礎可支援，則驗證 timers / listeners 的 cleanup 行為。

手動檢查項目：

1. 開啟 `/ar/v3`。
2. 確認 scanning overlay 會正確顯示。
3. 確認 target detection 依序觸發 avatar、portfolio、info reveal。
4. 確認左右 portfolio navigation 可反覆操作。
5. 確認點擊 preview 後會隱藏預覽圖並開始播放影片。
6. 確認 web / email / profile / location 會正確更新文字。
7. 確認只有在選到 web tab 後，點擊文字區才會導頁。
8. 離開再回到頁面後，確認互動不會重複觸發多次。

## 風險

1. A-Frame component registration 是全域的，若處理不慎，容易造成重複註冊或 listener 堆疊。
2. 瀏覽器 autoplay / media policy 可能影響影片播放觀察結果。
3. 上游 sample 依賴較鬆散的 DOM scripting 寫法，移植到 React 時容易做出表面像、但細節不穩的版本。

## 完成標準

當以下條件成立時，這次工作才算完成：

1. `/ar/v3` 仍是主要 interactive example 路由。
2. 使用者可見的互動流程與 `advanced.html` 足夠接近。
3. 官方文字互動行為已恢復。
4. portfolio preview 轉影片的行為包含格式 fallback。
5. 頁面 remount 後，不會明顯重複綁定 handler 或殘留 timers。
6. 變更保持最小，且只集中在 `ar/v3` 實作範圍。
