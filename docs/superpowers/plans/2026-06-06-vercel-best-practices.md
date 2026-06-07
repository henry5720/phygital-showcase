# Vercel React Best Practices Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix lint errors, enable React Compiler, and add route-level code splitting to align with Vercel React Best Practices.

**Architecture:** Route-level code splitting via React Router v7 `lazy` property splits AR/A-Frame code into separate chunks. React Compiler (`babel-plugin-react-compiler`) enabled for automatic memoization. Lint errors fixed across AR module and tests.

**Tech Stack:** React 19, React Router v7, Vite 8, TypeScript 6

**Spec:** `docs/superpowers/specs/2026-06-06-vercel-best-practices-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/router.tsx` | Route definitions with lazy loading |
| Modify | `src/features/ar/MindARScene.tsx` | Fix render-body ref update lint error |
| Modify | `vite.config.ts` | Enable React Compiler + manual chunks |
| Modify | `src/features/ar/createArV5Island.ts` | Fix `any` and empty catch lint errors |
| Modify | `src/features/ar/ar-v5-interactions.test.ts` | Fix `no-explicit-any` lint errors |
| Modify | `src/features/ar/createArV5Island.test.ts` | Fix `no-explicit-any` lint error |

---

### Task 1: Route-Level Code Splitting

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: Verify current build output**

Run: `npm run build && ls -la dist/assets/*.js | wc -l`
Expected: `1` (single JS chunk — all pages in main bundle)

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
    path: '/ar/guide',
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
Expected: Multiple JS files (one per route + shared chunks)

- [ ] **Step 4: Verify TypeScript passes**

Run: `npm run build`
Expected: `tsc -b` succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add src/router.tsx
git commit -m "perf: add route-level code splitting with React Router lazy"
```

---

### Task 2: Fix MindARScene Lint Error

**Files:**
- Modify: `src/features/ar/MindARScene.tsx`

- [ ] **Step 1: Move ref update into useEffect**

In `src/features/ar/MindARScene.tsx`, change line 15:

```tsx
// Before (line 15 — lint error: Cannot update ref during render)
callbacksRef.current = { onReady, onTargetFound, onTargetLost, onError }

// After: wrap in useEffect
useEffect(() => {
  callbacksRef.current = { onReady, onTargetFound, onTargetLost, onError }
})
```

Also update the import on line 1 to include `useEffect` (it's already imported — verify).

- [ ] **Step 2: Verify lint passes for this file**

Run: `npx eslint src/features/ar/MindARScene.tsx`
Expected: No errors

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/features/ar/MindARScene.tsx
git commit -m "fix: move ref update into useEffect in MindARScene"
```

---

### Task 3: Enable React Compiler

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add React Compiler plugin config**

In `vite.config.ts`, change the `react()` plugin call:

```tsx
// Before (line 7)
plugins: [basicSsl(), react(), tailwindcss()],

// After: enable React Compiler
plugins: [basicSsl(), react({ babel: { plugins: [['babel-plugin-react-compiler']] } }), tailwindcss()],
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds (React Compiler compiles all components)

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: No new errors introduced

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "perf: enable React Compiler for automatic memoization"
```

---

### Task 4: Vite Manual Chunks

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add manualChunks to build config**

In `vite.config.ts`, add `build` configuration:

```tsx
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [basicSsl(), react({ babel: { plugins: [['babel-plugin-react-compiler']] } }), tailwindcss()],
  server: {
    host: true,
    port: 3009,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-gsap': ['gsap'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    passWithNoTests: true,
  },
})
```

- [ ] **Step 2: Verify build produces vendor chunks**

Run: `npm run build && ls -la dist/assets/*.js`
Expected: Separate vendor-react and vendor-gsap chunks appear

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "perf: add manual chunk splitting for vendor code"
```

---

### Task 5: Fix createArV5Island Lint Errors

**Files:**
- Modify: `src/features/ar/createArV5Island.ts`

- [ ] **Step 1: Fix `no-explicit-any` on line 94**

```tsx
// Before (line 94)
const arSystem = (sceneEl as any).systems?.['mindar-image-system']

// After
const arSystem = (sceneEl as HTMLElement & { systems?: Record<string, { stop?: () => void }> })
  .systems?.['mindar-image-system']
```

- [ ] **Step 2: Fix `no-explicit-any` on line 99**

```tsx
// Before (line 99)
const sceneEl = container.querySelector('a-scene') as any

// After
const sceneEl = container.querySelector('a-scene') as (HTMLElement & { renderer?: { setAnimationLoop?: (fn: null) => void }; pause?: () => void }) | null
```

- [ ] **Step 3: Fix empty catch blocks on lines 101-102, 113**

```tsx
// Before
try { sceneEl.renderer?.setAnimationLoop?.(null) } catch {}
try { sceneEl.pause?.() } catch {}
// ... (line 113)
} catch {}

// After
try { sceneEl.renderer?.setAnimationLoop?.(null) } catch { /* ignore — renderer may not be initialized */ }
try { sceneEl.pause?.() } catch { /* ignore — scene may not be paused */ }
// ... (line 113)
} catch { /* ignore — video cleanup is best-effort */ }
```

- [ ] **Step 4: Verify lint passes for this file**

Run: `npx eslint src/features/ar/createArV5Island.ts`
Expected: No errors

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/features/ar/createArV5Island.ts
git commit -m "fix: resolve lint errors in createArV5Island"
```

---

### Task 6: Fix Test Lint Errors

**Files:**
- Modify: `src/features/ar/ar-v5-interactions.test.ts`
- Modify: `src/features/ar/createArV5Island.test.ts`

- [ ] **Step 1: Fix `no-explicit-any` in ar-v5-interactions.test.ts**

Read the file to find lines 137 and 140, then replace `any` with `unknown` or the correct type.

- [ ] **Step 2: Fix `no-explicit-any` in createArV5Island.test.ts**

Read the file to find line 35, then replace `any` with `unknown` or the correct type.

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 4: Verify tests pass**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/features/ar/ar-v5-interactions.test.ts src/features/ar/createArV5Island.test.ts
git commit -m "fix: resolve lint errors in AR test files"
```

---

## Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors (0 problems)

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with multiple chunks in `dist/assets/`

- [ ] **Step 4: Verify code splitting**

Run: `ls dist/assets/*.js | wc -l`
Expected: More than 3 JS files (route chunks + vendor chunks)

- [ ] **Step 5: Verify bundle sizes**

Run: `ls -lh dist/assets/*.js`
Expected: No single file > 200KB; vendor chunks separated

- [ ] **Step 6: Test in browser**

Run: `npm run dev`
Expected: App loads, navigation between routes works, AR scanner loads correctly
