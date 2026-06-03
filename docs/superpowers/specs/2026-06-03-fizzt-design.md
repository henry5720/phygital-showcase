# 植酌 Fizz't WebAR 風味互動體驗 — 系統設計文件

**日期**：2026-06-03  
**狀態**：待確認

---

## 1. 專案範疇

以植酌 Fizz't 為直接實作目標，不做多品牌通用平台。  
透過 `config.json` + CSS custom properties 實現**輕量換膚**（換品牌只改 config 與素材，版型不動）。  
純靜態部署，無後端，無 LINE 自動貼標。

---

## 2. 技術選型

| 層面 | 技術 | 理由 |
|------|------|------|
| 框架 | React 19 + TypeScript | 現有起點 |
| 建置 | Vite 8 | 現有起點 |
| 路由 | React Router v7 | SPA 路由，輕量 |
| 樣式 | Tailwind CSS v4 | Design token via CSS vars |
| 動畫 | Framer Motion | 頁面轉場、Quiz 動畫 |
| WebAR | MindAR.js（mindar-image） | 免費、Image Target、文件穩定 |
| 部署 | Cloudflare Pages | 免費 CDN、自訂 domain |
| 分析 | GA4 via gtag（選用） | 純瀏覽器 SDK，無後端 |

不引入 Zustand（三條路徑狀態簡單，React context 或 props 即可）。  
不引入 Zod（config 來源可控，TypeScript interface 驗證即可）。

---

## 3. 路由結構

```
/                   → Landing Page（三個 CTA 入口）
/ar                 → WebAR 引導頁 → AR Scanner（七個流程）
/quiz               → 互動測驗（N 題 → 結果頁）
/quiz/result/:type  → 測驗結果（清新探索型 / 微醺儀式型 / 層次品味型）
```

LINE 加入 OA → 純 `window.location.href` redirect，不需要獨立路由。

---

## 4. 元件架構

```
src/
├── config/
│   ├── config.json          # 品牌設定（色票、素材路徑、問題、LINE URL）
│   └── types.ts             # ProductConfig interface
├── hooks/
│   └── useConfig.ts         # 讀取 config，注入 CSS custom properties
├── pages/
│   ├── Landing.tsx          # 三個 CTA 按鈕
│   ├── ArGuide.tsx          # WebAR 引導頁（說明 + 開始按鈕）
│   ├── ArScanner.tsx        # MindAR canvas 容器（隔離 React DOM）
│   ├── Quiz.tsx             # 測驗主流程
│   └── QuizResult.tsx       # 結果展示 + LINE CTA
├── components/
│   ├── MindArCanvas.tsx     # useRef + useEffect 掛載 MindAR，無 React 管理 AR DOM
│   ├── VideoOverlay.tsx     # AR 場景內的影片播放（三階段）
│   ├── QuizCard.tsx         # 單題問答卡片
│   └── ResultCard.tsx       # 風味人格結果卡
└── router.tsx               # React Router 設定
```

### MindAR 整合策略（關鍵）

MindAR 直接操作 DOM（透過 A-Frame 或其 vanilla API），**不讓 React reconciler 碰 AR canvas 的子節點**：

```tsx
// MindArCanvas.tsx
export function MindArCanvas({ onTracked, onLost }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 在 effect 內初始化 MindAR，React 只管理 container div
    const mindarThree = new MindARThree({ container: containerRef.current, ... })
    // 事件回呼傳回 React 層
    return () => mindarThree.stop()
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
}
```

Three.js renderer（MindAR 的 vanilla API，不走 A-Frame）避免 A-Frame 的全域 DOM 污染。

---

## 5. Config 設計

```typescript
// config/types.ts
interface ProductConfig {
  theme: {
    primaryColor: string      // e.g. "#D4AF37"
    backgroundColor: string   // e.g. "#051129"
    textColor: string
  }
  brand: {
    name: string
    subtitle: string
    heroImage: string         // public/ 路徑
    logoMindFile: string      // .mind 特徵檔路徑
  }
  ar: {
    videos: {
      stage1: string          // 品牌故事 20s
      stage2: string          // 產品特色（A/B/C）
      stage3: string          // 調飲示範 5 步驟
    }
    ctaText: string
  }
  quiz: {
    title: string
    questions: Array<{
      id: string
      text: string
      options: Array<{
        text: string
        scores: Record<string, number>   // { fruity: 1, sour: 0 }
      }>
    }>
    results: Record<string, {
      type: string            // "清新探索型"
      name: string
      recommendation: string
      description: string
      lineJoinUrl: string
    }>
  }
}
```

CSS custom properties 在 `useConfig.ts` 啟動時注入到 `:root`：

```ts
document.documentElement.style.setProperty('--color-primary', config.theme.primaryColor)
document.documentElement.style.setProperty('--color-bg', config.theme.backgroundColor)
```

---

## 6. WebAR 七個流程對應實作

| 流程 | 實作位置 | 說明 |
|------|---------|------|
| 0. 引導頁 | `ArGuide.tsx` | 說明掃描方式、開啟相機說明、「開始體驗」按鈕 |
| 1. 掃描 Logo | `MindArCanvas` | MindAR image target，偵測到 Logo 觸發 `onTracked` |
| 2. 品牌故事（stage1） | `VideoOverlay` | 追蹤成功後播放 20s 影片 |
| 3. 產品特色（stage2） | `VideoOverlay` | A/B/C 三個切換點（點擊 HUD icon 切換） |
| 4. 五感互動 | `VideoOverlay` | 同 stage2，五感 icon 切換內容 |
| 5. 調飲示範（stage3） | `VideoOverlay` | 5 步驟動畫 |
| 6. LINE CTA | `ArScanner.tsx` | 影片結束後顯示 2D 懸浮按鈕，redirect 至 LINE OA |

---

## 7. Quiz 計分邏輯

```
每題選項帶 scores: { [personality]: number }
→ 累計所有題目的分數
→ 取最高分的 personality key
→ 對應 config.quiz.results[key]
→ 路由至 /quiz/result/:key
```

三種結果：`fresh`（清新探索型）、`ritual`（微醺儀式型）、`layered`（層次品味型）。

---

## 8. 事件追蹤（選用 GA4）

若啟用 GA4，以下事件以 `gtag('event', ...)` 送出（純前端，無後端）：

- `landing_page_view`
- `click_webar` / `click_quiz` / `click_line`
- `logo_scan_success`
- `quiz_complete` + `{ result_type: 'fresh' }`
- `line_redirect` + `{ source: 'quiz' | 'ar' | 'landing' }`

---

## 9. 部署

- **Cloudflare Pages**：`pnpm build` → `dist/` 靜態輸出
- SPA fallback：Cloudflare Pages 設定 `_redirects`：`/* /index.html 200`
- 素材（影片、`.mind` 檔）放 `public/assets/`，透過 Cloudflare CDN 分發

---

## 10. 尚未確認的素材 Scope

以下素材為**開發者 placeholder**，實際由客戶提供：

- [ ] 三段 AI 動畫影片（`.mp4`）
- [ ] MindAR 特徵檔（`.mind`）— 需上傳 Logo 至 MindAR 官方工具產生
- [ ] 產品瓶身主視覺（`heroImage`）
- [ ] 測驗題目完整版（現有 config 只有 1 題）

開發期間使用 placeholder 影片 + 預製 `.mind` 範例檔進行功能開發。

---

## 11. 不在範疇內

- LINE 自動貼標（需後端 Messaging API）
- 多品牌動態切換（當前只實作 Fizz't）
- 後端 / 資料庫
- Server-side rendering
