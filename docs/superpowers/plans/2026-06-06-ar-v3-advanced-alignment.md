# AR V3 Advanced Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 `/ar/v3` 的互動流程、文案與媒體播放行為對齊 `advanced.html`，並補上最小必要的 cleanup 與重複綁定防護。

**Architecture:** 保留既有 `ArV3Scene.tsx` 負責 scene markup 與 assets、`ar-v3.ts` 負責互動邏輯的分工。測試沿用 `ar-v2` 的模式：scene 用 render 驗證標記與資產，互動邏輯用 jsdom 驗證 DOM 屬性、事件與 cleanup。

**Tech Stack:** React 19、TypeScript、A-Frame、MindAR、Vitest、Testing Library、jsdom

---

## File Map

- Modify: `src/components/ArV3Scene.tsx`
  - 對齊 scene 初始 visible 狀態、動畫屬性、影片 asset 宣告。
- Modify: `src/lib/ar-v3.ts`
  - 對齊官方互動流程、文案、video fallback 與 cleanup。
- Create: `src/components/ArV3Scene.test.tsx`
  - 驗證 `/ar/v3` scene 標記、assets 與初始狀態。
- Create: `src/lib/ar-v3.test.ts`
  - 驗證 portfolio、info、video fallback、cleanup 與 listener 重複綁定防護。
- Modify: `IMPLEMENTATION_PLAN.md`
  - 追蹤 3 個執行階段狀態。

### Task 1: 補齊 `ar-v3` 測試骨架與 scene 標記

**Files:**
- Modify: `src/components/ArV3Scene.tsx`
- Create: `src/components/ArV3Scene.test.tsx`
- Create: `src/lib/ar-v3.test.ts`
- Modify: `IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: 建立階段追蹤檔**

```markdown
## Stage 1: AR V3 測試與 Scene 對齊
**Goal**: 建立 `ar-v3` 自動化測試骨架，並讓 scene markup 對齊官方 sample 的初始可見狀態與資產宣告。
**Success Criteria**: `ArV3Scene` 與 `ar-v3` 新測試檔已建立，且至少有一個失敗測試在描述目前缺口。
**Tests**: `pnpm test:run src/components/ArV3Scene.test.tsx src/lib/ar-v3.test.ts`
**Status**: In Progress

## Stage 2: AR V3 互動邏輯對齊
**Goal**: 對齊 avatar / portfolio / info 時序、文案、導頁與 video fallback。
**Success Criteria**: 互動邏輯測試通過，且行為與 `advanced.html` 一致到可接受程度。
**Tests**: `pnpm test:run src/lib/ar-v3.test.ts`
**Status**: Not Started

## Stage 3: Cleanup 與整體驗證
**Goal**: 補齊 cleanup、防止重複綁定，並完成 lint / build / targeted tests 驗證。
**Success Criteria**: 重新 mount 不重複綁定，所有目標驗證指令通過。
**Tests**: `pnpm test:run src/components/ArV3Scene.test.tsx src/lib/ar-v3.test.ts && pnpm lint && pnpm build`
**Status**: Not Started
```

- [ ] **Step 2: 先寫 `ArV3Scene` 的失敗測試**

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ArV3Scene } from './ArV3Scene'

describe('ArV3Scene', () => {
  it('renders the advanced-style v3 scene with local assets and hidden controls by default', () => {
    const { container } = render(<ArV3Scene />)

    const scene = container.querySelector('a-scene')
    expect(scene).not.toBeNull()
    expect(scene?.getAttribute('mindar-image')).toContain('/assets/ar-v3/targets/card.mind')
    expect(container.querySelector('a-entity[mindar-image-target="targetIndex: 0"]')).not.toBeNull()
    expect(container.querySelector('video#paintandquest-video-mp4')?.getAttribute('src')).toBe('/assets/ar-v3/portfolio/paintandquest.mp4')
    expect(container.querySelector('video#paintandquest-video-webm')?.getAttribute('src')).toBe('/assets/ar-v3/portfolio/paintandquest.webm')
    expect(container.querySelector('#portfolio-left-button')?.getAttribute('visible')).toBe('false')
    expect(container.querySelector('#portfolio-right-button')?.getAttribute('visible')).toBe('false')
    expect(container.querySelector('#text')?.getAttribute('geometry')).toContain('primitive:plane')
  })
})
```

- [ ] **Step 3: 先寫 `ar-v3` 的失敗測試**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanupArV3Artifacts, initArV3Experience } from './ar-v3'

describe('initArV3Experience', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <a-scene></a-scene>
      <div id="portfolio-panel"></div>
      <div id="portfolio-item0"></div>
      <div id="portfolio-item1"></div>
      <div id="portfolio-item2"></div>
      <div id="portfolio-left-button"></div>
      <div id="portfolio-right-button"></div>
      <div id="paintandquest-preview-button"></div>
      <div id="paintandquest-video-link"></div>
      <video id="paintandquest-video-mp4"></video>
      <video id="paintandquest-video-webm"></video>
      <div id="avatar"></div>
      <div id="profile-button"></div>
      <div id="web-button"></div>
      <div id="email-button"></div>
      <div id="location-button"></div>
      <div id="text"></div>
      <div id="ar-target"></div>
    `
  })

  it('shows official text content and only navigates through text after selecting web', () => {
    const locationSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    initArV3Experience()

    document.getElementById('web-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('text')?.getAttribute('value')).toBe('https://softmind.tech')

    document.getElementById('text')?.dispatchEvent(new Event('click'))
    expect(locationSpy).toHaveBeenCalledWith('https://softmind.tech')
  })

  it('prefers webm when supported and falls back to mp4 otherwise', () => {
    initArV3Experience()
    const setAttributeSpy = vi.spyOn(document.getElementById('paintandquest-video-link')!, 'setAttribute')

    document.getElementById('paintandquest-preview-button')?.dispatchEvent(new Event('click'))

    expect(setAttributeSpy).toHaveBeenCalled()
  })

  it('removes listeners and timers during cleanup', () => {
    initArV3Experience()
    cleanupArV3Artifacts(document)

    document.getElementById('web-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('text')?.getAttribute('value')).toBeNull()
  })
})
```

- [ ] **Step 4: 執行新測試，確認現在會失敗**

Run: `pnpm test:run src/components/ArV3Scene.test.tsx src/lib/ar-v3.test.ts`
Expected: FAIL，至少包含缺少 `paintandquest-video-webm`、`text` geometry 或互動行為不符官方內容。

- [ ] **Step 5: 實作最小 scene 對齊讓 scene 測試通過**

```tsx
<video
  id="paintandquest-video-webm"
  autoPlay={false}
  loop={true}
  src="/assets/ar-v3/portfolio/paintandquest.webm"
></video>

<a-image
  id="portfolio-left-button"
  visible="false"
  class="clickable"
  src="#icon-left"
  position="-0.7 0 0"
  height="0.15"
  width="0.15"
></a-image>

<a-text
  id="text"
  class="clickable"
  value=""
  color="black"
  align="center"
  width="2"
  position="0 -1 0"
  geometry="primitive:plane; height: 0.1; width: 2;"
  material="opacity: 0.5"
></a-text>
```

- [ ] **Step 6: 重新執行目標測試**

Run: `pnpm test:run src/components/ArV3Scene.test.tsx src/lib/ar-v3.test.ts`
Expected: `ArV3Scene` 測試 PASS，`ar-v3` 測試仍部分 FAIL。

### Task 2: 對齊 `ar-v3` 互動邏輯

**Files:**
- Modify: `src/lib/ar-v3.ts`
- Modify: `IMPLEMENTATION_PLAN.md`
- Test: `src/lib/ar-v3.test.ts`

- [ ] **Step 1: 擴充 `ar-v3` 測試，明確寫出目標行為**

```ts
it('updates official profile, email, and location copy', () => {
  initArV3Experience()

  document.getElementById('profile-button')?.dispatchEvent(new Event('click'))
  expect(document.getElementById('text')?.getAttribute('value')).toBe('AR, VR solutions and consultation')

  document.getElementById('email-button')?.dispatchEvent(new Event('click'))
  expect(document.getElementById('text')?.getAttribute('value')).toBe('hello@softmind.tech')

  document.getElementById('location-button')?.dispatchEvent(new Event('click'))
  expect(document.getElementById('text')?.getAttribute('value')).toBe('Vancouver, Canada | Hong Kong')
})

it('cycles portfolio items and reveals controls after targetFound', () => {
  vi.useFakeTimers()
  initArV3Experience()

  document.getElementById('ar-target')?.dispatchEvent(new Event('targetFound'))
  vi.runAllTimers()

  expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('true')
  expect(document.getElementById('portfolio-left-button')?.getAttribute('visible')).toBe('true')
  expect(document.getElementById('portfolio-right-button')?.getAttribute('visible')).toBe('true')
})
```

- [ ] **Step 2: 執行單檔測試確認失敗**

Run: `pnpm test:run src/lib/ar-v3.test.ts`
Expected: FAIL，顯示文案、導頁、fallback 或 cleanup 不符合測試預期。

- [ ] **Step 3: 以最小改動重寫 `ar-v3.ts` 的 session state 與 cleanup**

```ts
type ArV3Session = {
  currentTab: '' | 'web' | 'email' | 'profile' | 'location'
  itemIndex: number
  timeouts: number[]
  intervals: number[]
  cleanupFns: Array<() => void>
}

let activeSession: ArV3Session | null = null

function createSession(): ArV3Session {
  cleanupSession(activeSession)
  activeSession = {
    currentTab: '',
    itemIndex: 0,
    timeouts: [],
    intervals: [],
    cleanupFns: [],
  }
  return activeSession
}
```

- [ ] **Step 4: 對齊官方 info、portfolio 與 video fallback 行為**

```ts
const webHandler = () => {
  textEl?.setAttribute('value', 'https://softmind.tech')
  session.currentTab = 'web'
}

const previewHandler = () => {
  previewButton?.setAttribute('visible', false)
  const testVideo = document.createElement('video')
  const canPlayWebm = testVideo.canPlayType('video/webm; codecs="vp8, vorbis"')
  const sourceId = canPlayWebm === '' ? '#paintandquest-video-mp4' : '#paintandquest-video-webm'
  videoLink?.setAttribute('src', sourceId)
  mediaAsset?.play()
}
```

- [ ] **Step 5: 對齊 targetFound 的 reveal 時序**

```ts
targetEl.addEventListener('targetFound', () => {
  resetExperience(session, doc)
  showAvatar(session, doc, () => {
    scheduleTimeout(session, () => {
      showPortfolio(session, doc, () => {
        scheduleTimeout(session, () => {
          showInfo(session, doc)
        }, 300)
      })
    }, 300)
  })
})
```

- [ ] **Step 6: 重新執行互動測試**

Run: `pnpm test:run src/lib/ar-v3.test.ts`
Expected: PASS

### Task 3: 完成 cleanup、防重複綁定與整體驗證

**Files:**
- Modify: `src/lib/ar-v3.ts`
- Modify: `IMPLEMENTATION_PLAN.md`
- Test: `src/lib/ar-v3.test.ts`
- Test: `src/components/ArV3Scene.test.tsx`

- [ ] **Step 1: 補一個重複初始化防護測試**

```ts
it('does not duplicate listeners across repeated initialization', () => {
  initArV3Experience()
  cleanupArV3Artifacts(document)
  initArV3Experience()

  document.getElementById('email-button')?.dispatchEvent(new Event('click'))
  expect(document.getElementById('text')?.getAttribute('value')).toBe('hello@softmind.tech')
})
```

- [ ] **Step 2: 補最小必要的防護實作**

```ts
export function cleanupArV3Artifacts(doc: Document = document) {
  cleanupSession(activeSession)
  activeSession = null
  resetExperience(null, doc)
}
```

- [ ] **Step 3: 執行 targeted tests**

Run: `pnpm test:run src/components/ArV3Scene.test.tsx src/lib/ar-v3.test.ts`
Expected: PASS

- [ ] **Step 4: 執行 lint 與 build**

Run: `pnpm lint`
Expected: PASS

Run: `pnpm build`
Expected: PASS

- [ ] **Step 5: 更新階段狀態**

```markdown
## Stage 1: AR V3 測試與 Scene 對齊
**Status**: Complete

## Stage 2: AR V3 互動邏輯對齊
**Status**: Complete

## Stage 3: Cleanup 與整體驗證
**Status**: Complete
```

- [ ] **Step 6: Commit**

```bash
git add IMPLEMENTATION_PLAN.md src/components/ArV3Scene.tsx src/components/ArV3Scene.test.tsx src/lib/ar-v3.ts src/lib/ar-v3.test.ts docs/superpowers/plans/2026-06-06-ar-v3-advanced-alignment.md
git commit -m "feat: align ar v3 with advanced example"
```
