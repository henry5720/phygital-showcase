# 植酌 Fizz't WebAR 風味互動體驗 — 系統設計文件

**日期**：2026-06-03  
**狀態**：確認（2026-06-03 修訂）

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
| 捲動動畫 | GSAP ScrollTrigger | 產品介紹頁電影級滾輪動畫 |
| WebAR | MindAR.js（mindar-image）+ Three.js | Image Target + 3D model 渲染（官方支援組合） |
| 部署 | Cloudflare Pages | 免費 CDN、自訂 domain |
| 分析 | GA4 via gtag（選用） | 純瀏覽器 SDK，無後端 |

不引入 Zustand（三條路徑狀態簡單，React context 或 props 即可）。  
不引入 Zod（config 來源可控，TypeScript interface 驗證即可）。

---

## 3. 路由結構

```
/                   → Landing Page（三個 CTA 入口）
/ar                 → WebAR 引導頁 → AR Scanner
/product            → 產品介紹頁（GSAP ScrollTrigger 電影級捲動）
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
│   ├── Product.tsx          # 產品介紹頁（GSAP ScrollTrigger）
│   ├── Quiz.tsx             # 測驗主流程
│   └── QuizResult.tsx       # 結果展示 + LINE CTA
├── components/
│   ├── MindArCanvas.tsx     # useRef + useEffect 掛載 MindAR + Three.js，AR DOM 完全隔離
│   ├── ArHotspot.tsx        # A/B/C 熱點按鈕（Three.js Sprite，billboarded）
│   ├── VideoOverlay.tsx     # 2D HTML overlay 影片（position: fixed，非 3D 貼圖）
│   ├── QuizCard.tsx         # 單題問答卡片
│   └── ResultCard.tsx       # 風味人格結果卡
└── router.tsx               # React Router 設定
```

### MindAR + Three.js 整合策略（關鍵）

使用 MindAR 的 **Three.js API**（`mindar-image-three`），不走 A-Frame，避免全域 DOM 污染。React 只管理 container `<div>`，Three.js scene 完全在 `useEffect` 內建立：

```tsx
// MindArCanvas.tsx
export function MindArCanvas({ onHotspotClick, onProductPageClick }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mindarThree = new MindARThree({ container: containerRef.current })
    const { renderer, scene, camera } = mindarThree

    // 載入 .glb 瓶身 model
    const loader = new GLTFLoader()
    loader.load('/assets/bottle.glb', (gltf) => {
      anchor.group.add(gltf.scene)
    })

    // A/B/C 熱點：Three.js Sprite（永遠面向鏡頭）
    // Raycaster 偵測觸碰 → 回呼 onHotspotClick(type)

    mindarThree.start()
    return () => mindarThree.stop()
  }, [])

  return <div ref={containerRef} className="w-full h-dvh" />
}
```

影片播放為 **2D HTML overlay**（React 管理），MindAR 的 `onTargetFound` / `onTargetLost` 事件透過 callback props 通知 React 層顯示/隱藏 overlay。

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

## 6. WebAR 互動流程（修訂）

```
掃描 Fizz't Logo
  └─► 3D 瓶身 .glb 浮現（錨定 logo 平面，自動旋轉）
        ├─► 熱點 A「產品是什麼」→ VideoOverlay 播放 stage1 影片（8-12s）
        ├─► 熱點 B「產品特色」 → VideoOverlay 播放 stage2 影片
        ├─► 熱點 C「差異化」  → VideoOverlay 播放 stage3 影片
        ├─► 五感 icon（視覺/聽覺/嗅覺/味覺/觸覺）→ 切換 2D 感官文案 overlay
        └─► 「了解更多」按鈕 → 退出 AR → navigate('/product')
```

| 元件 | 職責 |
|------|------|
| `ArGuide.tsx` | 引導頁：說明掃描方式、相機權限提示、「開始體驗」按鈕 |
| `MindArCanvas.tsx` | Three.js scene：載入 .glb、熱點 Sprite、Raycaster 觸碰偵測 |
| `ArScanner.tsx` | 父層：管理 AR 狀態（idle / tracking / hotspot_active），控制 overlay 顯示 |
| `VideoOverlay.tsx` | 2D fixed overlay：播放指定影片，播完後回到 AR 狀態 |
| `SensoryOverlay.tsx` | 2D fixed overlay：五感文案切換 |

**素材需求**：`/assets/bottle.glb`（客戶提供）、`/assets/fizzt-logo.mind`（需上傳 Logo 至 MindAR Compiler 產生）

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

## 11. 產品介紹頁（/product）

GSAP ScrollTrigger 電影級捲動體驗，作為 AR「了解更多」及 Landing 的獨立入口。

**捲動分鏡規劃（初版）**：

| 分鏡 | 動畫 | 內容 |
|------|------|------|
| 1 | 瓶身從黑幕淡入 + scale up | Hero：品牌 slogan |
| 2 | 橫向 pin + 文字逐行進場 | 品牌起源故事 |
| 3 | 粒子爆炸效果（CSS） | 成分特色：鳳梨發酵 |
| 4 | 4 格水平滑入 | 產品特色（果香/清爽/層次/搭配） |
| 5 | 瓶身旋轉（CSS 3D transform） | 差異化 vs 一般飲品 |
| 6 | 全屏 CTA | 加入 LINE OA + 開始測驗 |

實作：GSAP `ScrollTrigger.pin` + `gsap.timeline`，搭配 Tailwind 定義佈局，GSAP 只控制動畫時序。

---

## 12. 不在範疇內

- LINE 自動貼標（需後端 Messaging API）
- 多品牌動態切換（當前只實作 Fizz't）
- 後端 / 資料庫
- Server-side rendering
