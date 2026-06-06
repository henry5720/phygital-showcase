# Vercel React Best Practices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize bundle size and re-render performance to align with Vercel React Best Practices.

**Architecture:** Route-level code splitting via React Router v7 `lazy` property splits AR/Three.js code into separate chunks. Functional setState stabilizes callback references. Passive event listeners improve scroll/touch performance.

**Tech Stack:** React 19, React Router v7, Vite 8, TypeScript 6

**Spec:** `docs/superpowers/specs/2026-06-06-vercel-best-practices-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/router.tsx` | Route definitions with lazy loading |
| Modify | `index.html` | Dev-only Eruda loading |
| Modify | `src/pages/ArV4Page.tsx` | useCallback for stable callbacks |
| Modify | `src/pages/ArScanner.tsx` | useCallback for stable callbacks |
| Modify | `src/pages/Quiz.tsx` | useCallback for stable callbacks |
| Modify | `src/pages/QuizResult.tsx` | useCallback for stable callbacks |
| Modify | `src/components/MindArCanvas.tsx` | Passive event listener |
| Modify | `src/lib/ar-v4/createMindArV4Experience.ts` | Passive event listener |
| Modify | `src/hooks/useConfig.ts` | ESLint disable comment for deps |
| Modify | `src/lib/quiz.ts` | .toSorted() instead of .sort() |

---

### Task 1: Route-Level Code Splitting

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: Verify current build output**

Run: `npm run build && ls -la dist/assets/*.js | wc -l`
Expected: Single or few JS chunks (all pages in main bundle)

- [ ] **Step 2: Rewrite router with lazy loading**

Replace `src/router.tsx` with:

```tsx
import { createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: async () => {
      const { Landing } = await import('./pages/Landing')
      return { Component: Landing }
    },
  },
  {
    path: '/ar',
    lazy: async () => {
      const { ArGuide } = await import('./pages/ArGuide')
      return { Component: ArGuide }
    },
  },
  {
    path: '/ar/scanner',
    lazy: async () => {
      const { ArScanner } = await import('./pages/ArScanner')
      return { Component: ArScanner }
    },
  },
  {
    path: '/ar/v2',
    lazy: async () => {
      const { ArV2Page } = await import('./pages/ArV2Page')
      return { Component: ArV2Page }
    },
  },
  {
    path: '/ar/v3',
    lazy: async () => {
      const { ArV3Page } = await import('./pages/ArV3Page')
      return { Component: ArV3Page }
    },
  },
  {
    path: '/ar/v4',
    lazy: async () => {
      const { ArV4Page } = await import('./pages/ArV4Page')
      return { Component: ArV4Page }
    },
  },
  {
    path: '/quiz',
    lazy: async () => {
      const { Quiz } = await import('./pages/Quiz')
      return { Component: Quiz }
    },
  },
  {
    path: '/quiz/result/:type',
    lazy: async () => {
      const { QuizResult } = await import('./pages/QuizResult')
      return { Component: QuizResult }
    },
  },
  {
    path: '/product',
    lazy: async () => {
      return {
        Component: () => (
          <div style={{ color: '#fff', padding: '2rem' }}>
            Product page — Plan 3
          </div>
        ),
      }
    },
  },
])
```

- [ ] **Step 3: Verify build produces multiple chunks**

Run: `npm run build && ls -la dist/assets/*.js`
Expected: Multiple JS files (one per route + shared vendor chunks)

- [ ] **Step 4: Verify app still works**

Run: `npm run dev`
Expected: App loads, navigation works between routes

- [ ] **Step 5: Commit**

```bash
git add src/router.tsx
git commit -m "perf: add route-level code splitting with React Router lazy"
```

---

### Task 2: Eruda Dev-Only Loading

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace Eruda scripts with conditional loading**

Replace lines 11-14 in `index.html`:

```html
<!-- Before -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>
  eruda.init();
</script>

<!-- After -->
<script>
  if (import.meta.env.DEV) {
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/eruda';
    s.onload = function() { eruda.init(); };
    document.head.appendChild(s);
  }
</script>
```

- [ ] **Step 2: Verify dev mode still loads Eruda**

Run: `npm run dev`
Expected: Eruda console appears in browser

- [ ] **Step 3: Verify production does not load Eruda**

Run: `npm run build && npm run preview`
Expected: Eruda does NOT appear when visiting the preview URL

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "perf: load Eruda only in development mode"
```

---

### Task 3: useCallback in ArV4Page

**Files:**
- Modify: `src/pages/ArV4Page.tsx`

- [ ] **Step 1: Add useCallback imports and wrap handlers**

Replace the component body in `src/pages/ArV4Page.tsx`:

```tsx
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArV4Experience } from '../components/ar-v4/ArV4Experience'
import { AR_V4_ACTIONS } from '../lib/ar-v4/assets'
import type { ArV4ActionId, ArV4Status } from '../lib/ar-v4/types'

export function ArV4Page() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ArV4Status>('initializing')
  const [selectedActionId, setSelectedActionId] = useState<ArV4ActionId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedAction = AR_V4_ACTIONS.find((a) => a.id === selectedActionId)

  const handleReady = useCallback(() => setStatus('scanning'), [])
  const handleTargetFound = useCallback(() => setStatus('tracking'), [])
  const handleTargetLost = useCallback(() => setStatus('lost'), [])
  const handleAction = useCallback((id: ArV4ActionId) => setSelectedActionId(id), [])
  const handleError = useCallback((err: unknown) => {
    setStatus('error')
    setError(String(err))
  }, [])

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black text-white">
      <ArV4Experience
        onReady={handleReady}
        onTargetFound={handleTargetFound}
        onTargetLost={handleTargetLost}
        onAction={handleAction}
        onError={handleError}
      />

      {/* UI Shell - keep the rest unchanged */}
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        <div className="p-6 flex justify-between items-start pointer-events-auto">
          <button
            onClick={() => navigate('/ar')}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer"
          >
            ← 返回
          </button>
          <div className="text-right">
            <h1 className="text-xl font-bold tracking-tight">AR V4</h1>
            <p className="text-xs opacity-50">Three.js + MindAR</p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="p-6 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
            <div className="flex items-center gap-2 mb-4">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  status === 'tracking' ? 'bg-green-400' : status === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                }`}
              />
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">{status}</span>
            </div>

            {error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : !selectedAction ? (
              <p className="text-sm opacity-50 leading-relaxed">
                {status === 'tracking' ? '點擊虛擬熱點來查看詳細資訊。' : '請對準識別圖以開始。'}
              </p>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-lg font-bold text-primary">{selectedAction.label}</h2>
                <p className="text-sm opacity-80 leading-relaxed">{selectedAction.description}</p>
                {selectedAction.id === 'web' && (
                  <a
                    href="https://softmind.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-bold text-blue-400 underline"
                  >
                    https://softmind.tech
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/ArV4Page.tsx
git commit -m "perf: stabilize ArV4Page callbacks with useCallback"
```

---

### Task 4: useCallback in ArScanner

**Files:**
- Modify: `src/pages/ArScanner.tsx`

- [ ] **Step 1: Convert handlers to useCallback**

Replace the component body in `src/pages/ArScanner.tsx`:

```tsx
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { useConfig } from '../hooks/useConfig'
import { MindArCanvas } from '../components/MindArCanvas'
import { VideoOverlay } from '../components/VideoOverlay'

type ArState = 'idle' | 'tracking' | 'video_playing'

export function ArScanner() {
  const config = useConfig()
  const navigate = useNavigate()
  const [arState, setArState] = useState<ArState>('idle')
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  const handleTargetFound = useCallback(() => {
    setArState('tracking')
  }, [])

  const handleTargetLost = useCallback(() => {
    setArState(prev => prev === 'video_playing' ? prev : 'idle')
  }, [])

  const handleHotspot = useCallback((type: 'A' | 'B' | 'C') => {
    const src = {
      A: config.brand.ar.videos.stageA,
      B: config.brand.ar.videos.stageB,
      C: config.brand.ar.videos.stageC,
    }[type]
    setVideoSrc(src)
    setArState('video_playing')
  }, [config.brand.ar.videos])

  const handleVideoEnd = useCallback(() => {
    setVideoSrc(null)
    setArState('tracking')
  }, [])

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <MindArCanvas
        modelSrc={config.brand.ar.model}
        mindFileSrc={config.brand.logoMindFile}
        onTargetFound={handleTargetFound}
        onTargetLost={handleTargetLost}
        onHotspot={handleHotspot}
      />

      {arState === 'idle' && (
        <div className="absolute inset-x-0 bottom-16 flex flex-col items-center gap-4 pointer-events-none">
          <p className="text-sm opacity-50" style={{ color: '#fff' }}>
            對準 Fizz't Logo 開始體驗
          </p>
        </div>
      )}

      <button
        onClick={() => navigate('/ar')}
        className="absolute top-4 left-4 z-50 text-sm opacity-50 hover:opacity-100 cursor-pointer"
        style={{ color: '#fff' }}
      >
        ← 返回
      </button>

      {arState === 'video_playing' && videoSrc && (
        <VideoOverlay
          src={videoSrc}
          onEnd={handleVideoEnd}
          onClose={handleVideoEnd}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/ArScanner.tsx
git commit -m "perf: stabilize ArScanner callbacks with useCallback"
```

---

### Task 5: useCallback in Quiz

**Files:**
- Modify: `src/pages/Quiz.tsx`

- [ ] **Step 1: Convert handler to useCallback with functional setState**

Replace the component body in `src/pages/Quiz.tsx`:

```tsx
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
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

  const handleSelect = useCallback((option: QuizOption) => {
    setAnswers(prev => {
      const newAnswers = [...prev, option]
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        const result = calculateResult(newAnswers)
        navigate(`/quiz/result/${result}`)
      }
      return newAnswers
    })
  }, [currentIndex, questions.length, navigate])

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
        <QuizCard
          key={currentIndex}
          question={questions[currentIndex]}
          questionNumber={currentIndex + 1}
          total={questions.length}
          onSelect={handleSelect}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/Quiz.tsx
git commit -m "perf: stabilize Quiz handler with useCallback"
```

---

### Task 6: useCallback in QuizResult

**Files:**
- Modify: `src/pages/QuizResult.tsx`

- [ ] **Step 1: Convert handler to useCallback**

Replace the component body in `src/pages/QuizResult.tsx`:

```tsx
import { useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useConfig } from '../hooks/useConfig'
import { ResultCard } from '../components/ResultCard'

export function QuizResult() {
  const { type } = useParams<{ type: string }>()
  const config = useConfig()
  const navigate = useNavigate()

  const result = type ? config.quiz.results[type] : null

  const handleJoinLine = useCallback(() => {
    if (result) {
      window.location.href = result.lineJoinUrl
    }
  }, [result])

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
        onJoinLine={handleJoinLine}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/QuizResult.tsx
git commit -m "perf: stabilize QuizResult handler with useCallback"
```

---

### Task 7: Passive Event Listener in MindArCanvas

**Files:**
- Modify: `src/components/MindArCanvas.tsx:108`

- [ ] **Step 1: Add passive option to addEventListener**

Change line 108 in `src/components/MindArCanvas.tsx`:

```tsx
// Before
container.addEventListener('pointerdown', onPointerDown)

// After
container.addEventListener('pointerdown', onPointerDown, { passive: true })
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/MindArCanvas.tsx
git commit -m "perf: use passive event listener in MindArCanvas"
```

---

### Task 8: Passive Event Listener in createMindArV4Experience

**Files:**
- Modify: `src/lib/ar-v4/createMindArV4Experience.ts:224`

- [ ] **Step 1: Add passive option to addEventListener**

Change line 224 in `src/lib/ar-v4/createMindArV4Experience.ts`:

```tsx
// Before
options.container.addEventListener('pointerdown', onPointerDown)

// After
options.container.addEventListener('pointerdown', onPointerDown, { passive: true })
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/ar-v4/createMindArV4Experience.ts
git commit -m "perf: use passive event listener in createMindArV4Experience"
```

---

### Task 9: useEffect Dependency Lint Fix

**Files:**
- Modify: `src/hooks/useConfig.ts`

- [ ] **Step 1: Add ESLint disable comment with explanation**

Replace `src/hooks/useConfig.ts`:

```tsx
import { useEffect } from 'react'
import { config } from '../config'
import type { ProductConfig } from '../config/types'

export function useConfig(): ProductConfig {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', config.tokens.primaryColor)
    root.style.setProperty('--color-bg', config.tokens.backgroundColor)
    root.style.setProperty('--color-text', config.tokens.textColor)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config is module-level constant, never changes
  }, [])

  return config
}
```

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Run existing tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useConfig.ts
git commit -m "chore: add eslint disable comment for useConfig deps"
```

---

### Task 10: .toSorted() in quiz.ts

**Files:**
- Modify: `src/lib/quiz.ts:15`

- [ ] **Step 1: Replace .sort() with .toSorted()**

Change line 15 in `src/lib/quiz.ts`:

```tsx
// Before
return Object.entries(totals).sort(([, a], [, b]) => b - a)[0][0]

// After
return Object.entries(totals).toSorted(([, a], [, b]) => b - a)[0][0]
```

- [ ] **Step 2: Run existing tests**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/quiz.ts
git commit -m "refactor: use toSorted() for immutable sort in calculateResult"
```

---

## Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with multiple chunks in `dist/assets/`

- [ ] **Step 4: Verify code splitting**

Run: `ls dist/assets/*.js | wc -l`
Expected: More than 3 JS files (one per route + vendor chunks)

- [ ] **Step 5: Test in browser**

Run: `npm run preview`
Expected: App works correctly, navigation between routes functions properly
