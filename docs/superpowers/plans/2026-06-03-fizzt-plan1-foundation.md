# Fizz't Plan 1: 基礎架構 + Landing + Quiz

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Vite + React 19 SPA 基礎架構，實作 Landing Page 與 Quiz 模組，可部署至 Cloudflare Pages 驗收，不依賴任何 AR 素材。

**Architecture:** React Router v7 管理 `/`, `/ar`, `/quiz`, `/quiz/result/:type`, `/product` 五條路由。`config.json` 集中管理品牌設定與 quiz 題目，`useConfig` hook 在掛載時將 design token 注入 CSS custom properties。Quiz 計分為純函式（`calculateResult`），完全可單元測試。

**Tech Stack:** React 19, TypeScript, Vite 8, React Router v7, Tailwind CSS v4, Framer Motion, Vitest + Testing Library

---

## 檔案結構

```
src/
├── config/
│   ├── types.ts                  # ProductConfig interface（所有型別定義）
│   ├── fizzt.config.json         # 完整品牌設定 + 5 題 quiz + 3 種結果
│   └── index.ts                  # typed export of config
├── hooks/
│   ├── useConfig.ts              # CSS vars 注入 + 回傳 config
│   └── useConfig.test.ts
├── lib/
│   ├── quiz.ts                   # calculateResult() 純函式
│   └── quiz.test.ts
├── pages/
│   ├── Landing.tsx               # 3 CTA 按鈕
│   ├── ArGuide.tsx               # Plan 2 placeholder
│   ├── Quiz.tsx                  # 測驗主流程
│   └── QuizResult.tsx            # 結果 + LINE CTA
├── components/
│   ├── QuizCard.tsx              # 單題卡片 + Framer Motion
│   ├── QuizCard.test.tsx
│   ├── ResultCard.tsx            # 風味人格結果卡
│   └── ResultCard.test.tsx
├── test/
│   └── setup.ts                  # @testing-library/jest-dom setup
├── router.tsx                    # createBrowserRouter
├── main.tsx                      # 修改：RouterProvider
└── index.css                     # 修改：@import tailwindcss + CSS vars
public/
└── _redirects                    # Cloudflare Pages SPA fallback
```

---

## Task 1: 安裝依賴 + 測試框架設定

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/index.css`
- Modify: `package.json` (scripts)
- Create: `src/test/setup.ts`

- [ ] **Step 1: 安裝 runtime 依賴**

```bash
pnpm add react-router framer-motion
```

Expected: `node_modules/react-router` 與 `node_modules/framer-motion` 出現。

- [ ] **Step 2: 安裝 Tailwind CSS v4 + dev 依賴**

```bash
pnpm add -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 3: 更新 vite.config.ts**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    passWithNoTests: true,
  },
})
```

- [ ] **Step 4: 建立測試 setup 檔**

```ts
// src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: 更新 src/index.css**

完整替換原有內容：

```css
@import "tailwindcss";

:root {
  --color-primary: #D4AF37;
  --color-bg: #051129;
  --color-text: #FFFFFF;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 6: 新增 test scripts 至 package.json**

在 `scripts` 內加入：

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 7: 驗證測試框架可執行**

```bash
pnpm test:run
```

Expected: `No test files found` 或 `0 tests passed`，不報錯。

- [ ] **Step 8: Commit**

```bash
git add vite.config.ts src/index.css src/test/setup.ts package.json pnpm-lock.yaml
git commit -m "chore: 安裝 Tailwind v4、React Router v7、Framer Motion、Vitest"
```

---

## Task 2: Config 型別系統 + 完整設定檔

**Files:**
- Create: `src/config/types.ts`
- Create: `src/config/fizzt.config.json`
- Create: `src/config/index.ts`

- [ ] **Step 1: 建立 types.ts**

```ts
// src/config/types.ts
export interface QuizOption {
  text: string
  scores: Record<string, number>
}

export interface QuizQuestion {
  id: string
  text: string
  options: QuizOption[]
}

export interface QuizResult {
  type: string
  name: string
  recommendation: string
  description: string
  lineJoinUrl: string
}

export interface ProductConfig {
  theme: {
    primaryColor: string
    backgroundColor: string
    textColor: string
  }
  brand: {
    name: string
    subtitle: string
    heroImage: string
    logoMindFile: string
  }
  ar: {
    model: string
    videos: {
      stageA: string
      stageB: string
      stageC: string
    }
    ctaText: string
  }
  quiz: {
    title: string
    questions: QuizQuestion[]
    results: Record<string, QuizResult>
  }
  line: {
    joinUrl: string
  }
}
```

- [ ] **Step 2: 建立 fizzt.config.json（5 題完整版）**

```json
{
  "theme": {
    "primaryColor": "#D4AF37",
    "backgroundColor": "#051129",
    "textColor": "#FFFFFF"
  },
  "brand": {
    "name": "植酌 Fizz't",
    "subtitle": "鳳梨發酵酵素飲",
    "heroImage": "/assets/hero.png",
    "logoMindFile": "/assets/fizzt-logo.mind"
  },
  "ar": {
    "model": "/assets/bottle.glb",
    "videos": {
      "stageA": "/assets/video-stage-a.mp4",
      "stageB": "/assets/video-stage-b.mp4",
      "stageC": "/assets/video-stage-c.mp4"
    },
    "ctaText": "了解更多"
  },
  "quiz": {
    "title": "找出你的植酌風味人格",
    "questions": [
      {
        "id": "q1",
        "text": "你通常在什麼時候最需要一杯飲料？",
        "options": [
          { "text": "早晨清醒時", "scores": { "fresh": 2, "ritual": 0, "layered": 0 } },
          { "text": "下午疲憊時", "scores": { "fresh": 1, "ritual": 0, "layered": 1 } },
          { "text": "餐桌佐餐時", "scores": { "fresh": 0, "ritual": 1, "layered": 1 } },
          { "text": "聚會社交時", "scores": { "fresh": 0, "ritual": 2, "layered": 0 } }
        ]
      },
      {
        "id": "q2",
        "text": "你偏好的飲料風味是？",
        "options": [
          { "text": "清爽果香", "scores": { "fresh": 2, "ritual": 0, "layered": 0 } },
          { "text": "微甜順口", "scores": { "fresh": 1, "ritual": 1, "layered": 0 } },
          { "text": "層次豐富", "scores": { "fresh": 0, "ritual": 0, "layered": 2 } },
          { "text": "茶感香氣", "scores": { "fresh": 0, "ritual": 1, "layered": 1 } }
        ]
      },
      {
        "id": "q3",
        "text": "對你來說，喝飲料是一種？",
        "options": [
          { "text": "補充水分的日常", "scores": { "fresh": 2, "ritual": 0, "layered": 0 } },
          { "text": "享受當下的片刻", "scores": { "fresh": 0, "ritual": 2, "layered": 0 } },
          { "text": "品味生活的儀式", "scores": { "fresh": 0, "ritual": 1, "layered": 1 } },
          { "text": "探索風味的旅程", "scores": { "fresh": 0, "ritual": 0, "layered": 2 } }
        ]
      },
      {
        "id": "q4",
        "text": "你最常在哪裡享用飲料？",
        "options": [
          { "text": "通勤路上隨行喝", "scores": { "fresh": 2, "ritual": 0, "layered": 0 } },
          { "text": "咖啡廳輕鬆坐著", "scores": { "fresh": 0, "ritual": 1, "layered": 1 } },
          { "text": "精緻餐廳用餐中", "scores": { "fresh": 0, "ritual": 0, "layered": 2 } },
          { "text": "朋友家中聚會", "scores": { "fresh": 0, "ritual": 2, "layered": 0 } }
        ]
      },
      {
        "id": "q5",
        "text": "你最想如何享用植酌？",
        "options": [
          { "text": "直接純飲感受原味", "scores": { "fresh": 1, "ritual": 0, "layered": 1 } },
          { "text": "加氣泡水輕盈喝", "scores": { "fresh": 2, "ritual": 0, "layered": 0 } },
          { "text": "配茶飲感受層次", "scores": { "fresh": 0, "ritual": 0, "layered": 2 } },
          { "text": "調成派對特調", "scores": { "fresh": 0, "ritual": 2, "layered": 0 } }
        ]
      }
    ],
    "results": {
      "fresh": {
        "type": "fresh",
        "name": "清新探索型",
        "recommendation": "植酌 × 柑橘氣泡飲",
        "description": "喜歡嘗試新鮮事物，追求清爽自然的風味體驗。每一口都是新的探索。",
        "lineJoinUrl": "https://line.me/R/ti/p/@fizzt_crm"
      },
      "ritual": {
        "type": "ritual",
        "name": "微醺儀式型",
        "recommendation": "植酌 × 香草氣泡特調",
        "description": "生活需要儀式感，每次享用都是給自己的小獎勵。微甜順口，從容不迫。",
        "lineJoinUrl": "https://line.me/R/ti/p/@fizzt_crm"
      },
      "layered": {
        "type": "layered",
        "name": "層次品味型",
        "recommendation": "植酌 × 茶感風味調飲",
        "description": "懂得品味層次，欣賞複雜而豐富的風味。每一口都有不同的驚喜。",
        "lineJoinUrl": "https://line.me/R/ti/p/@fizzt_crm"
      }
    }
  },
  "line": {
    "joinUrl": "https://line.me/R/ti/p/@fizzt_crm"
  }
}
```

- [ ] **Step 3: 建立 src/config/index.ts**

```ts
// src/config/index.ts
import rawConfig from './fizzt.config.json'
import type { ProductConfig } from './types'

export const config = rawConfig as ProductConfig
```

- [ ] **Step 4: 確認 TypeScript 編譯**

```bash
pnpm tsc --noEmit
```

Expected: 無錯誤輸出。

- [ ] **Step 5: Commit**

```bash
git add src/config/
git commit -m "feat: config 型別系統 + 植酌完整設定檔"
```

---

## Task 3: useConfig Hook（CSS vars 注入）

**Files:**
- Create: `src/hooks/useConfig.ts`
- Create: `src/hooks/useConfig.test.ts`

- [ ] **Step 1: 寫 failing test**

```ts
// src/hooks/useConfig.test.ts
import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useConfig } from './useConfig'

describe('useConfig', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--color-primary')
    document.documentElement.style.removeProperty('--color-bg')
    document.documentElement.style.removeProperty('--color-text')
  })

  it('injects --color-primary on mount', () => {
    renderHook(() => useConfig())
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#D4AF37')
  })

  it('injects --color-bg on mount', () => {
    renderHook(() => useConfig())
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe('#051129')
  })

  it('injects --color-text on mount', () => {
    renderHook(() => useConfig())
    expect(document.documentElement.style.getPropertyValue('--color-text')).toBe('#FFFFFF')
  })

  it('returns the config object with brand name', () => {
    const { result } = renderHook(() => useConfig())
    expect(result.current.brand.name).toBe("植酌 Fizz't")
  })
})
```

- [ ] **Step 2: 執行確認 fail**

```bash
pnpm test:run
```

Expected: `Cannot find module './useConfig'` 或類似錯誤。

- [ ] **Step 3: 實作 useConfig**

```ts
// src/hooks/useConfig.ts
import { useEffect } from 'react'
import { config } from '../config'
import type { ProductConfig } from '../config/types'

export function useConfig(): ProductConfig {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', config.theme.primaryColor)
    root.style.setProperty('--color-bg', config.theme.backgroundColor)
    root.style.setProperty('--color-text', config.theme.textColor)
  }, [])

  return config
}
```

- [ ] **Step 4: 執行確認 pass**

```bash
pnpm test:run
```

Expected: `4 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: useConfig hook，CSS vars 注入 design token"
```

---

## Task 4: Router + App 骨架

**Files:**
- Create: `src/router.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`（簡化為空殼，實際由 router 接管）

- [ ] **Step 1: 建立 router.tsx**

```tsx
// src/router.tsx
import { createBrowserRouter } from 'react-router'
import { Landing } from './pages/Landing'
import { ArGuide } from './pages/ArGuide'
import { Quiz } from './pages/Quiz'
import { QuizResult } from './pages/QuizResult'

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/ar', element: <ArGuide /> },
  { path: '/quiz', element: <Quiz /> },
  { path: '/quiz/result/:type', element: <QuizResult /> },
  { path: '/product', element: <div style={{ color: '#fff', padding: '2rem' }}>Product page — Plan 2</div> },
])
```

注意：Landing、ArGuide、Quiz、QuizResult 此時尚未建立，下一步先建 placeholder 讓 TypeScript 不報錯。

- [ ] **Step 2: 建立頁面 placeholders（讓 router 可以 import）**

```tsx
// src/pages/Landing.tsx
export function Landing() { return <div /> }
```

```tsx
// src/pages/ArGuide.tsx
export function ArGuide() { return <div /> }
```

```tsx
// src/pages/Quiz.tsx
export function Quiz() { return <div /> }
```

```tsx
// src/pages/QuizResult.tsx
export function QuizResult() { return <div /> }
```

- [ ] **Step 3: 更新 src/main.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

- [ ] **Step 4: 刪除不再需要的檔案**

```bash
rm src/App.tsx src/App.css src/assets/react.svg src/assets/vite.svg
```

- [ ] **Step 5: 確認 dev server 啟動無報錯**

```bash
pnpm dev
```

Expected: `Local: http://localhost:5173/` — 瀏覽器開啟後顯示空白頁（無 console 錯誤）。

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: React Router v7 路由設定 + 頁面骨架"
```

---

## Task 5: Landing Page

**Files:**
- Modify: `src/pages/Landing.tsx`（替換 placeholder）

- [ ] **Step 1: 實作 Landing.tsx**

```tsx
// src/pages/Landing.tsx
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useConfig } from '../hooks/useConfig'

export function Landing() {
  const config = useConfig()
  const navigate = useNavigate()

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h1
          className="text-5xl font-bold tracking-tight mb-3"
          style={{ color: 'var(--color-primary)' }}
        >
          {config.brand.name}
        </h1>
        <p className="text-base opacity-70" style={{ color: 'var(--color-text)' }}>
          {config.brand.subtitle}
        </p>
      </motion.div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {[
          {
            label: 'WebAR 體驗',
            delay: 0.2,
            onClick: () => navigate('/ar'),
            style: {
              borderColor: 'var(--color-primary)',
              color: 'var(--color-primary)',
              backgroundColor: 'transparent',
            } as React.CSSProperties,
            className: 'border-2',
          },
          {
            label: '互動測驗',
            delay: 0.35,
            onClick: () => navigate('/quiz'),
            style: {
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-bg)',
            } as React.CSSProperties,
            className: '',
          },
          {
            label: '加入 LINE@',
            delay: 0.5,
            onClick: () => { window.location.href = config.line.joinUrl },
            style: {
              borderColor: '#22c55e',
              color: '#22c55e',
              backgroundColor: 'transparent',
            } as React.CSSProperties,
            className: 'border-2',
          },
        ].map(({ label, delay, onClick, style, className }) => (
          <motion.button
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onClick={onClick}
            className={`py-4 px-8 rounded-full font-semibold text-base cursor-pointer ${className}`}
            style={style}
          >
            {label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 瀏覽器驗證**

```bash
pnpm dev
```

開啟 `http://localhost:5173/`，確認：
- 三個 CTA 按鈕依序淡入
- 品牌名稱 `植酌 Fizz't` 顯示金色
- 背景為深藍 `#051129`
- 點擊「互動測驗」→ 導至 `/quiz`（目前空白）
- 點擊「WebAR 體驗」→ 導至 `/ar`（目前空白）

- [ ] **Step 3: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "feat: Landing Page，三個 CTA 按鈕 + Framer Motion 動畫"
```

---

## Task 6: Quiz 計分邏輯（純函式，TDD）

**Files:**
- Create: `src/lib/quiz.ts`
- Create: `src/lib/quiz.test.ts`

- [ ] **Step 1: 寫 failing tests**

```ts
// src/lib/quiz.test.ts
import { describe, it, expect } from 'vitest'
import { calculateResult } from './quiz'
import type { QuizOption } from '../config/types'

const fresh: QuizOption = { text: '清爽', scores: { fresh: 2, ritual: 0, layered: 0 } }
const ritual: QuizOption = { text: '儀式', scores: { fresh: 0, ritual: 2, layered: 0 } }
const layered: QuizOption = { text: '層次', scores: { fresh: 0, ritual: 0, layered: 2 } }
const mixedFreshRitual: QuizOption = { text: '混合', scores: { fresh: 1, ritual: 1, layered: 0 } }

describe('calculateResult', () => {
  it('returns "fresh" when all fresh answers selected', () => {
    expect(calculateResult([fresh, fresh, fresh])).toBe('fresh')
  })

  it('returns "ritual" when ritual scores dominate', () => {
    // ritual: 2+2+1=5, fresh: 0+0+1=1
    expect(calculateResult([ritual, ritual, mixedFreshRitual])).toBe('ritual')
  })

  it('returns "layered" when layered scores dominate', () => {
    // layered: 2+2=4, fresh: 2
    expect(calculateResult([layered, layered, fresh])).toBe('layered')
  })

  it('sums scores across all answers', () => {
    // fresh: 2+1=3, ritual: 0+1=1
    expect(calculateResult([fresh, mixedFreshRitual])).toBe('fresh')
  })

  it('throws when no answers provided', () => {
    expect(() => calculateResult([])).toThrow('No answers provided')
  })
})
```

- [ ] **Step 2: 執行確認 fail**

```bash
pnpm test:run
```

Expected: `Cannot find module './quiz'`

- [ ] **Step 3: 實作 calculateResult**

```ts
// src/lib/quiz.ts
import type { QuizOption } from '../config/types'

export function calculateResult(answers: QuizOption[]): string {
  if (answers.length === 0) {
    throw new Error('No answers provided')
  }

  const totals: Record<string, number> = {}
  for (const answer of answers) {
    for (const [key, value] of Object.entries(answer.scores)) {
      totals[key] = (totals[key] ?? 0) + value
    }
  }

  return Object.entries(totals).sort(([, a], [, b]) => b - a)[0][0]
}
```

- [ ] **Step 4: 執行確認 pass**

```bash
pnpm test:run
```

Expected: `5 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: calculateResult() 純函式 + 完整單元測試"
```

---

## Task 7: QuizCard Component

**Files:**
- Create: `src/components/QuizCard.tsx`
- Create: `src/components/QuizCard.test.tsx`

- [ ] **Step 1: 寫 failing tests**

```tsx
// src/components/QuizCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QuizCard } from './QuizCard'
import type { QuizQuestion } from '../config/types'

const question: QuizQuestion = {
  id: 'q1',
  text: '你偏好的風味是？',
  options: [
    { text: '清爽果香', scores: { fresh: 2 } },
    { text: '層次豐富', scores: { layered: 2 } },
  ],
}

describe('QuizCard', () => {
  it('renders question text', () => {
    render(<QuizCard question={question} questionNumber={1} total={5} onSelect={vi.fn()} />)
    expect(screen.getByText('你偏好的風味是？')).toBeInTheDocument()
  })

  it('renders all option buttons', () => {
    render(<QuizCard question={question} questionNumber={1} total={5} onSelect={vi.fn()} />)
    expect(screen.getByText('清爽果香')).toBeInTheDocument()
    expect(screen.getByText('層次豐富')).toBeInTheDocument()
  })

  it('calls onSelect with the chosen option when clicked', async () => {
    const onSelect = vi.fn()
    render(<QuizCard question={question} questionNumber={1} total={5} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('清爽果香'))
    expect(onSelect).toHaveBeenCalledWith(question.options[0])
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('shows progress indicator', () => {
    render(<QuizCard question={question} questionNumber={3} total={5} onSelect={vi.fn()} />)
    expect(screen.getByText('3 / 5')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 執行確認 fail**

```bash
pnpm test:run
```

Expected: `Cannot find module './QuizCard'`

- [ ] **Step 3: 實作 QuizCard**

```tsx
// src/components/QuizCard.tsx
import { motion } from 'framer-motion'
import type { QuizQuestion, QuizOption } from '../config/types'

interface Props {
  question: QuizQuestion
  questionNumber: number
  total: number
  onSelect: (option: QuizOption) => void
}

export function QuizCard({ question, questionNumber, total, onSelect }: Props) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.28 }}
      className="w-full max-w-sm mx-auto"
    >
      <p className="text-sm mb-3 opacity-50" style={{ color: 'var(--color-text)' }}>
        {questionNumber} / {total}
      </p>
      <div className="w-full h-0.5 rounded-full mb-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-0.5 rounded-full transition-all duration-500"
          style={{
            backgroundColor: 'var(--color-primary)',
            width: `${(questionNumber / total) * 100}%`,
          }}
        />
      </div>
      <h2 className="text-xl font-semibold mb-6 leading-snug" style={{ color: 'var(--color-text)' }}>
        {question.text}
      </h2>
      <div className="flex flex-col gap-3">
        {question.options.map((option) => (
          <button
            key={option.text}
            onClick={() => onSelect(option)}
            className="py-3.5 px-5 rounded-2xl text-left border transition-opacity duration-150 active:opacity-70 cursor-pointer"
            style={{
              borderColor: 'var(--color-primary)',
              color: 'var(--color-text)',
              backgroundColor: 'transparent',
            }}
          >
            {option.text}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 4: 執行確認 pass**

```bash
pnpm test:run
```

Expected: `9 tests passed`（含前面所有 task 的測試）

- [ ] **Step 5: Commit**

```bash
git add src/components/QuizCard.tsx src/components/QuizCard.test.tsx
git commit -m "feat: QuizCard component + Framer Motion 轉場"
```

---

## Task 8: Quiz 主流程頁

**Files:**
- Modify: `src/pages/Quiz.tsx`（替換 placeholder）

- [ ] **Step 1: 實作 Quiz.tsx**

```tsx
// src/pages/Quiz.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence } from 'framer-motion'
import { useConfig } from '../hooks/useConfig'
import { calculateResult } from '../lib/quiz'
import { QuizCard } from '../components/QuizCard'
import type { QuizOption } from '../config/types'

export function Quiz() {
  const config = useConfig()
  const navigate = useNavigate()
  const { questions, title } = config.quiz
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizOption[]>([])

  function handleSelect(option: QuizOption) {
    const newAnswers = [...answers, option]
    if (currentIndex < questions.length - 1) {
      setAnswers(newAnswers)
      setCurrentIndex(currentIndex + 1)
    } else {
      const result = calculateResult(newAnswers)
      navigate(`/quiz/result/${result}`)
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <h1
        className="text-xl font-bold text-center mb-10"
        style={{ color: 'var(--color-primary)' }}
      >
        {title}
      </h1>
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <QuizCard
            key={currentIndex}
            question={questions[currentIndex]}
            questionNumber={currentIndex + 1}
            total={questions.length}
            onSelect={handleSelect}
          />
        </AnimatePresence>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 瀏覽器端對端驗證**

```bash
pnpm dev
```

開啟 `http://localhost:5173/quiz`，手動走完 5 題，確認：
- 每題選完後下一題以動畫切換進場
- 進度條隨題數增加
- 第 5 題選完後自動跳轉到 `/quiz/result/<type>`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Quiz.tsx
git commit -m "feat: Quiz 主流程頁，5 題問答 + 自動導流"
```

---

## Task 9: ResultCard + QuizResult 頁

**Files:**
- Create: `src/components/ResultCard.tsx`
- Create: `src/components/ResultCard.test.tsx`
- Modify: `src/pages/QuizResult.tsx`（替換 placeholder）

- [ ] **Step 1: 寫 ResultCard 的 failing tests**

```tsx
// src/components/ResultCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ResultCard } from './ResultCard'
import type { QuizResult } from '../config/types'

const freshResult: QuizResult = {
  type: 'fresh',
  name: '清新探索型',
  recommendation: '植酌 × 柑橘氣泡飲',
  description: '喜歡嘗試新鮮事物。',
  lineJoinUrl: 'https://line.me/R/ti/p/@fizzt_crm',
}

describe('ResultCard', () => {
  it('renders personality name', () => {
    render(<ResultCard result={freshResult} onJoinLine={vi.fn()} />)
    expect(screen.getByText('清新探索型')).toBeInTheDocument()
  })

  it('renders recommendation', () => {
    render(<ResultCard result={freshResult} onJoinLine={vi.fn()} />)
    expect(screen.getByText('植酌 × 柑橘氣泡飲')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<ResultCard result={freshResult} onJoinLine={vi.fn()} />)
    expect(screen.getByText('喜歡嘗試新鮮事物。')).toBeInTheDocument()
  })

  it('calls onJoinLine when LINE button clicked', async () => {
    const onJoinLine = vi.fn()
    render(<ResultCard result={freshResult} onJoinLine={onJoinLine} />)
    await userEvent.click(screen.getByRole('button', { name: /LINE/ }))
    expect(onJoinLine).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: 執行確認 fail**

```bash
pnpm test:run
```

Expected: `Cannot find module './ResultCard'`

- [ ] **Step 3: 實作 ResultCard**

```tsx
// src/components/ResultCard.tsx
import { motion } from 'framer-motion'
import type { QuizResult } from '../config/types'

interface Props {
  result: QuizResult
  onJoinLine: () => void
}

export function ResultCard({ result, onJoinLine }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-sm mx-auto text-center"
    >
      <p className="text-sm opacity-50 mb-2" style={{ color: 'var(--color-text)' }}>
        你是
      </p>
      <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
        {result.name}
      </h2>
      <p
        className="mb-8 opacity-75 leading-relaxed text-sm"
        style={{ color: 'var(--color-text)' }}
      >
        {result.description}
      </p>
      <div
        className="rounded-2xl p-5 mb-8 border"
        style={{ borderColor: 'var(--color-primary)' }}
      >
        <p className="text-xs opacity-50 mb-1" style={{ color: 'var(--color-text)' }}>
          推薦調飲
        </p>
        <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>
          {result.recommendation}
        </p>
      </div>
      <button
        onClick={onJoinLine}
        className="w-full py-4 rounded-full font-semibold text-base cursor-pointer"
        style={{ backgroundColor: '#22c55e', color: '#fff' }}
      >
        加入 LINE 取得完整酒譜
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 4: 執行確認 pass**

```bash
pnpm test:run
```

Expected: `13 tests passed`

- [ ] **Step 5: 實作 QuizResult.tsx**

```tsx
// src/pages/QuizResult.tsx
import { useParams, useNavigate } from 'react-router'
import { useConfig } from '../hooks/useConfig'
import { ResultCard } from '../components/ResultCard'

export function QuizResult() {
  const { type } = useParams<{ type: string }>()
  const config = useConfig()
  const navigate = useNavigate()

  const result = type ? config.quiz.results[type] : null

  if (!result) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
      >
        <p>找不到結果，請重新測驗。</p>
        <button
          onClick={() => navigate('/quiz')}
          className="underline opacity-60 cursor-pointer"
          style={{ color: 'var(--color-text)' }}
        >
          重新測驗
        </button>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh flex flex-col justify-center px-6 py-16"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <ResultCard
        result={result}
        onJoinLine={() => { window.location.href = result.lineJoinUrl }}
      />
    </div>
  )
}
```

- [ ] **Step 6: 瀏覽器端對端驗證**

```bash
pnpm dev
```

- 開啟 `http://localhost:5173/quiz`，走完 5 題，確認結果頁正確顯示
- 直接開啟 `http://localhost:5173/quiz/result/fresh`、`/ritual`、`/layered` 確認三種結果皆正常
- 開啟 `http://localhost:5173/quiz/result/invalid` 確認顯示 fallback 錯誤頁

- [ ] **Step 7: Commit**

```bash
git add src/components/ResultCard.tsx src/components/ResultCard.test.tsx src/pages/QuizResult.tsx
git commit -m "feat: ResultCard + QuizResult 結果頁，含 fallback 錯誤處理"
```

---

## Task 10: ArGuide Placeholder + Cloudflare Pages 設定 + Build 驗證

**Files:**
- Modify: `src/pages/ArGuide.tsx`（從空殼升級為有意義的 placeholder）
- Create: `public/_redirects`

- [ ] **Step 1: 實作 ArGuide.tsx（Plan 2 placeholder）**

```tsx
// src/pages/ArGuide.tsx
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useConfig } from '../hooks/useConfig'

export function ArGuide() {
  useConfig()
  const navigate = useNavigate()

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div
          className="text-6xl mb-6 opacity-30"
          style={{ color: 'var(--color-primary)' }}
        >
          AR
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>
          WebAR 體驗
        </h1>
        <p className="opacity-50 text-sm mb-10" style={{ color: 'var(--color-text)' }}>
          AR 模組開發中 — 敬請期待
        </p>
        <button
          onClick={() => navigate('/')}
          className="underline opacity-50 text-sm cursor-pointer"
          style={{ color: 'var(--color-text)' }}
        >
          返回首頁
        </button>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: 建立 Cloudflare Pages SPA fallback**

```
// public/_redirects
/* /index.html 200
```

- [ ] **Step 3: 執行完整測試套件**

```bash
pnpm test:run
```

Expected: `13 tests passed, 0 failed`

- [ ] **Step 4: TypeScript 全域檢查**

```bash
pnpm tsc --noEmit
```

Expected: 無任何錯誤輸出。

- [ ] **Step 5: 執行 production build**

```bash
pnpm build
```

Expected:
```
✓ built in ~Xs
dist/index.html     ~0.5 kB
dist/assets/...     (js + css bundles)
```
無任何 TypeScript 或 Vite build 錯誤。

- [ ] **Step 6: 預覽 production build**

```bash
pnpm preview
```

開啟 `http://localhost:4173/`，手動走完完整路徑：
- Landing → Quiz（選完 5 題）→ 結果頁 → 點 LINE 按鈕
- Landing → WebAR → 看到 placeholder
- 直接在網址欄輸入 `/quiz/result/ritual`，重新整理後仍正常顯示（SPA fallback 驗證）

- [ ] **Step 7: Final commit**

```bash
git add src/pages/ArGuide.tsx public/_redirects
git commit -m "feat: ArGuide placeholder + Cloudflare Pages _redirects，Plan 1 完成"
```

---

## Plan 1 完成標準

- [ ] `pnpm test:run` → 13 tests passed, 0 failed
- [ ] `pnpm tsc --noEmit` → 無錯誤
- [ ] `pnpm build` → 成功產出 `dist/`
- [ ] Landing → Quiz → Result 完整路徑可走通
- [ ] 直接開啟 `/quiz/result/fresh` 重新整理後正常（SPA fallback）

## 下一步：Plan 2

- WebAR 模組（MindAR + Three.js + .glb 3D model + 熱點互動）
- 產品介紹頁（GSAP ScrollTrigger 電影級捲動）
- 需要素材：`/assets/bottle.glb`、`/assets/fizzt-logo.mind`、三段影片 `.mp4`
