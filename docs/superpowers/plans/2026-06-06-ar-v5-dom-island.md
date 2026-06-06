# AR V5 DOM Island 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Git note:** Do not commit while executing this plan unless the user explicitly asks for commits. Use the `git diff` checkpoints to review each task's changes.

**目標：** 新增 `/product-ar` 路由，用 DOM Island 方式實作 AR 體驗 — React 只管一個空 container div，整個 A-Frame + MindAR scene 定義在外部 HTML/CSS 檔案，用 DOMParser 注入，避免 React/A-Frame DOM 衝突。

**架構：** React 只渲染一個 `<div ref>`。Mount 時，工廠函式依序載入 A-Frame → MindAR scripts，用 DOMParser 解析外部 `scene.html`，appendChild 注入 container，然後初始化互動邏輯。Unmount 時，cleanup 取消 pending init、銷毀 scene、停止 camera/media tracks、移除所有注入的 DOM。React 永遠不碰 A-Frame custom elements。

**技術棧：** React 19, React Router, TypeScript, Vite（用 `?raw` imports）, Vitest, A-Frame 1.4.2 (CDN), A-Frame Extras 7.1.0 (CDN, `animation-mixer`), MindAR A-Frame (local vendor), 复用 `/public/assets/ar-v3/` 素材。

---

## 檔案結構

```
src/
├─ pages/
│   └─ ProductARPage.tsx              ← 頁面殼 (status, nav, back button)
├─ features/ar/
│   ├─ MindARScene.tsx                 ← React wrapper (空 div + useEffect)
│   ├─ scene.html                      ← 完整 A-Frame scene（外部檔案，可直接編輯）
│   ├─ styles.css                      ← scanning overlay 樣式
│   ├─ createArV5Island.ts            ← 工廠：載入 → 注入 → 互動 → cleanup
│   ├─ ar-v5-interactions.ts          ← 互動邏輯 (TS, 可測試)
│   └─ ar-v5-interactions.test.ts     ← 互動邏輯測試
├─ router.tsx                          ← 新增 /product-ar 路由
```

**素材：** 直接复用 `/public/assets/ar-v3/`（targets, icons, portfolio images, videos, 3D model）。

---

### Task 1: 互動邏輯 (TDD)

**檔案：**
- 建立：`src/features/ar/ar-v5-interactions.ts`
- 建立：`src/features/ar/ar-v5-interactions.test.ts`

核心互動邏輯，從 `ar-v3.ts` 適配，完全脫鉤 React。測試模式同 `ar-v3.test.ts`，並補上 targetLost reset。

- [ ] **步驟 1: 寫失敗的測試**

建立 `src/features/ar/ar-v5-interactions.test.ts`：

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { initArV5Experience, cleanupArV5Artifacts } from './ar-v5-interactions'

function setupDom() {
  document.body.innerHTML = `
    <div id="ar-v5-target"></div>
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
  `
}

describe('initArV5Experience', () => {
  beforeEach(() => {
    setupDom()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('shows portfolio panel on first targetFound', () => {
    const cleanup = initArV5Experience(document)

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)

    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('portfolio-item0')?.getAttribute('visible')).toBe('true')
    cleanup()
  })

  it('animates avatar position then shows portfolio with buttons', () => {
    const cleanup = initArV5Experience(document)

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))

    vi.advanceTimersByTime(10)
    const avatar = document.getElementById('avatar')
    expect(avatar?.getAttribute('position')).toBe('0 -0.25 -0.292')

    vi.advanceTimersByTime(1000)
    expect(document.getElementById('portfolio-left-button')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('portfolio-right-button')?.getAttribute('visible')).toBe('true')
    cleanup()
  })

  it('shows info buttons sequentially after portfolio animation completes', () => {
    const cleanup = initArV5Experience(document)

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))

    vi.advanceTimersByTime(10000)

    expect(document.getElementById('profile-button')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('web-button')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('email-button')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('location-button')?.getAttribute('visible')).toBe('true')
    cleanup()
  })

  it('only activates on first targetFound', () => {
    const cleanup = initArV5Experience(document)

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)

    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('true')
    cleanup()
  })

  it('resets content on targetLost and allows targetFound to replay', () => {
    const cleanup = initArV5Experience(document)

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)
    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('true')

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetLost'))
    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('false')
    expect(document.getElementById('profile-button')?.getAttribute('visible')).toBe('false')

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)
    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('true')
    cleanup()
  })

  it('switches portfolio items on left/right button clicks', () => {
    const cleanup = initArV5Experience(document)

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)

    document.getElementById('portfolio-right-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item1')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('portfolio-item0')?.getAttribute('visible')).toBe('false')

    document.getElementById('portfolio-right-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item2')?.getAttribute('visible')).toBe('true')

    document.getElementById('portfolio-left-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item1')?.getAttribute('visible')).toBe('true')
    cleanup()
  })

  it('selects mp4 on preview click when webm unsupported', () => {
    const cleanup = initArV5Experience(document)
    const spy = vi.spyOn(document.getElementById('paintandquest-video-link')!, 'setAttribute')

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)
    document.getElementById('paintandquest-preview-button')?.dispatchEvent(new Event('click'))

    expect(spy).toHaveBeenCalledWith('src', '#paintandquest-video-mp4')
    cleanup()
  })

  it('selects webm on preview click when webm supported', () => {
    const original = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, opts?: any) => {
      const el = original(tag, opts)
      if (tag === 'video') vi.spyOn(el, 'canPlayType').mockReturnValue('probably')
      return el
    })
    const cleanup = initArV5Experience(document)
    const spy = vi.spyOn(document.getElementById('paintandquest-video-link')!, 'setAttribute')

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)
    document.getElementById('paintandquest-preview-button')?.dispatchEvent(new Event('click'))

    expect(spy).toHaveBeenCalledWith('src', '#paintandquest-video-webm')
    cleanup()
  })

  it('updates text on info button clicks', () => {
    const cleanup = initArV5Experience(document)
    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)

    document.getElementById('profile-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('text')?.getAttribute('value')).toBe('AR, VR solutions and consultation')

    document.getElementById('web-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('text')?.getAttribute('value')).toBe('https://softmind.tech')

    document.getElementById('email-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('text')?.getAttribute('value')).toBe('hello@softmind.tech')

    document.getElementById('location-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('text')?.getAttribute('value')).toBe('Vancouver, Canada | Hong Kong')
    cleanup()
  })

  it('navigates on text click when web tab is active', () => {
    const navigate = vi.fn()
    const cleanup = initArV5Experience(document, { navigate })
    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)

    document.getElementById('web-button')?.dispatchEvent(new Event('click'))
    document.getElementById('text')?.dispatchEvent(new Event('click'))

    expect(navigate).toHaveBeenCalledWith('https://softmind.tech')
    cleanup()
  })

  it('does not navigate on text click when no tab is active', () => {
    const navigate = vi.fn()
    const cleanup = initArV5Experience(document, { navigate })
    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    vi.advanceTimersByTime(10000)

    document.getElementById('text')?.dispatchEvent(new Event('click'))

    expect(navigate).not.toHaveBeenCalled()
    cleanup()
  })

  it('cleans up all event listeners', () => {
    const cleanup = initArV5Experience(document)
    cleanup()

    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))
    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBeNull()
  })

  it('clears all timers on cleanup', () => {
    const cleanup = initArV5Experience(document)
    document.getElementById('ar-v5-target')?.dispatchEvent(new Event('targetFound'))

    cleanup()

    expect(() => vi.advanceTimersByTime(10000)).not.toThrow()
  })
})

describe('cleanupArV5Artifacts', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  it('removes MindAR overlays and overlay styles', () => {
    document.body.innerHTML = '<div class="mindar-ui-overlay"></div>'
    const style = document.createElement('style')
    style.textContent = '.mindar-ui-overlay { display: block; }'
    document.head.appendChild(style)

    cleanupArV5Artifacts(document)

    expect(document.querySelector('.mindar-ui-overlay')).toBeNull()
    const remaining = document.head.querySelector('style')?.textContent || ''
    expect(remaining).not.toContain('mindar-ui-overlay')
  })
})
```

- [ ] **步驟 2: 跑測試確認失敗**

執行：`pnpm vitest run src/features/ar/ar-v5-interactions.test.ts`
預期：FAIL — 模組 `./ar-v5-interactions` 不存在。

- [ ] **步驟 3: 實作互動邏輯**

建立 `src/features/ar/ar-v5-interactions.ts`：

```ts
type ArV5Tab = '' | 'web' | 'email' | 'profile' | 'location'

type ArV5Session = {
  currentTab: ArV5Tab
  itemIndex: number
  hasActivated: boolean
  timeouts: number[]
  intervals: number[]
  cleanupFns: Array<() => void>
}

type InitArV5Options = {
  navigate?: (url: string) => void
}

let activeSession: ArV5Session | null = null

function setVisible(el: Element | null, visible: boolean) {
  if (!el) return
  el.setAttribute('visible', visible ? 'true' : 'false')
}

function setPosition(el: Element | null, value: string) {
  if (!el) return
  el.setAttribute('position', value)
}

function showPortfolioItem(doc: Document, index: number) {
  for (let i = 0; i <= 2; i += 1) {
    setVisible(doc.getElementById(`portfolio-item${i}`), i === index)
  }
}

function scheduleTimeout(session: ArV5Session, callback: () => void, delay: number) {
  const id = window.setTimeout(callback, delay)
  session.timeouts.push(id)
}

function scheduleInterval(session: ArV5Session, callback: () => void, delay: number) {
  const id = window.setInterval(callback, delay)
  session.intervals.push(id)
  return id
}

function bindEvent(session: ArV5Session, el: Element | null, type: string, handler: EventListener) {
  if (!el) return
  el.addEventListener(type, handler)
  session.cleanupFns.push(() => el.removeEventListener(type, handler))
}

function cleanupSession(session: ArV5Session | null) {
  if (!session) return
  session.timeouts.forEach((id) => window.clearTimeout(id))
  session.intervals.forEach((id) => window.clearInterval(id))
  session.cleanupFns.forEach((fn) => fn())
}

function clearScheduledWork(session: ArV5Session | null) {
  if (!session) return
  session.timeouts.forEach((id) => window.clearTimeout(id))
  session.intervals.forEach((id) => window.clearInterval(id))
  session.timeouts = []
  session.intervals = []
}

function createSession() {
  cleanupSession(activeSession)
  activeSession = {
    currentTab: '',
    itemIndex: 0,
    hasActivated: false,
    timeouts: [],
    intervals: [],
    cleanupFns: [],
  }
  return activeSession
}

function resetVideo(video: HTMLVideoElement | null) {
  if (!video) return
  video.pause()
  try { video.currentTime = 0 } catch { /* jsdom */ }
}

function resetExperience(doc: Document, session?: ArV5Session | null, resetActivation = true) {
  if (session) {
    clearScheduledWork(session)
    session.currentTab = ''
    session.itemIndex = 0
    if (resetActivation) session.hasActivated = false
  }
  setVisible(doc.getElementById('portfolio-panel'), false)
  setVisible(doc.getElementById('portfolio-left-button'), false)
  setVisible(doc.getElementById('portfolio-right-button'), false)
  setVisible(doc.getElementById('paintandquest-video-link'), false)
  setVisible(doc.getElementById('paintandquest-preview-button'), true)
  setVisible(doc.getElementById('profile-button'), false)
  setVisible(doc.getElementById('web-button'), false)
  setVisible(doc.getElementById('email-button'), false)
  setVisible(doc.getElementById('location-button'), false)
  doc.getElementById('text')?.setAttribute('value', '')
  doc.getElementById('paintandquest-video-link')?.removeAttribute('src')
  showPortfolioItem(doc, 0)
  setPosition(doc.getElementById('portfolio-panel'), '0 0 -0.01')
  setPosition(doc.getElementById('avatar'), '0 -0.25 -0.3')
  resetVideo(doc.getElementById('paintandquest-video-mp4') as HTMLVideoElement | null)
  resetVideo(doc.getElementById('paintandquest-video-webm') as HTMLVideoElement | null)
}

function showAvatar(session: ArV5Session, doc: Document, onDone: () => void) {
  const avatar = doc.getElementById('avatar')
  if (!avatar) { onDone(); return }
  let z = -0.3
  const id = scheduleInterval(session, () => {
    z += 0.008
    if (z >= 0.3) {
      window.clearInterval(id)
      onDone()
    }
    setPosition(avatar, `0 -0.25 ${z}`)
  }, 10)
}

function showPortfolio(session: ArV5Session, doc: Document, onDone: () => void) {
  const portfolio = doc.getElementById('portfolio-panel')
  if (!portfolio) { onDone(); return }
  let y = 0
  setVisible(portfolio, true)
  const id = scheduleInterval(session, () => {
    y += 0.008
    if (y >= 0.6) {
      window.clearInterval(id)
      setVisible(doc.getElementById('portfolio-left-button'), true)
      setVisible(doc.getElementById('portfolio-right-button'), true)
      scheduleTimeout(session, onDone, 500)
    }
    setPosition(portfolio, `0 ${y} -0.01`)
  }, 10)
}

function showInfo(session: ArV5Session, doc: Document) {
  setVisible(doc.getElementById('profile-button'), true)
  scheduleTimeout(session, () => setVisible(doc.getElementById('web-button'), true), 300)
  scheduleTimeout(session, () => setVisible(doc.getElementById('email-button'), true), 600)
  scheduleTimeout(session, () => setVisible(doc.getElementById('location-button'), true), 900)
}

export function initArV5Experience(doc: Document = document, options: InitArV5Options = {}): () => void {
  const session = createSession()
  const navigate = options.navigate ?? ((url: string) => window.location.assign(url))

  resetExperience(doc, session)

  const target = doc.getElementById('ar-v5-target') ?? doc.querySelector('[mindar-image-target]')
  const leftButton = doc.getElementById('portfolio-left-button')
  const rightButton = doc.getElementById('portfolio-right-button')
  const previewButton = doc.getElementById('paintandquest-preview-button')
  const videoLink = doc.getElementById('paintandquest-video-link')
  const mp4Video = doc.getElementById('paintandquest-video-mp4') as HTMLVideoElement | null
  const webmVideo = doc.getElementById('paintandquest-video-webm') as HTMLVideoElement | null
  const profileButton = doc.getElementById('profile-button')
  const webButton = doc.getElementById('web-button')
  const emailButton = doc.getElementById('email-button')
  const locationButton = doc.getElementById('location-button')
  const textEl = doc.getElementById('text')

  const setText = (value: string, tab: ArV5Tab) => {
    textEl?.setAttribute('value', value)
    session.currentTab = tab
  }

  bindEvent(session, target, 'targetFound', () => {
    if (session.hasActivated) return
    session.hasActivated = true
    resetExperience(doc, session, false)
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

  bindEvent(session, target, 'targetLost', () => {
    resetExperience(doc, session, true)
  })

  bindEvent(session, leftButton, 'click', () => {
    session.itemIndex = (session.itemIndex - 1 + 3) % 3
    showPortfolioItem(doc, session.itemIndex)
  })

  bindEvent(session, rightButton, 'click', () => {
    session.itemIndex = (session.itemIndex + 1) % 3
    showPortfolioItem(doc, session.itemIndex)
  })

  bindEvent(session, previewButton, 'click', () => {
    setVisible(previewButton, false)
    setVisible(videoLink, true)
    const canPlayWebm = doc.createElement('video').canPlayType('video/webm; codecs="vp8, vorbis"')
    const prefersWebm = canPlayWebm !== ''
    const source = prefersWebm ? '#paintandquest-video-webm' : '#paintandquest-video-mp4'
    const video = prefersWebm ? webmVideo : mp4Video
    videoLink?.setAttribute('src', source)
    void video?.play()?.catch?.(() => {})
  })

  bindEvent(session, profileButton, 'click', () => setText('AR, VR solutions and consultation', 'profile'))
  bindEvent(session, webButton, 'click', () => setText('https://softmind.tech', 'web'))
  bindEvent(session, emailButton, 'click', () => setText('hello@softmind.tech', 'email'))
  bindEvent(session, locationButton, 'click', () => setText('Vancouver, Canada | Hong Kong', 'location'))

  bindEvent(session, textEl, 'click', () => {
    if (session.currentTab === 'web') navigate('https://softmind.tech')
  })

  return () => {
    if (activeSession === session) activeSession = null
    cleanupSession(session)
  }
}

export function cleanupArV5Artifacts(doc: Document = document) {
  cleanupSession(activeSession)
  activeSession = null
  resetExperience(doc)
  doc.querySelectorAll('.mindar-ui-overlay').forEach((el) => el.remove())
  doc.head.querySelectorAll('style').forEach((el) => {
    if (el.textContent?.includes('mindar-ui-overlay')) el.remove()
  })
}
```

- [ ] **步驟 4: 跑測試確認通過**

執行：`pnpm vitest run src/features/ar/ar-v5-interactions.test.ts`
預期：全部 PASS。

- [ ] **步驟 5: 檢查變更**

```bash
git diff -- src/features/ar/ar-v5-interactions.ts src/features/ar/ar-v5-interactions.test.ts
```

---

### Task 2: 外部 Scene HTML + CSS

**檔案：**
- 建立：`src/features/ar/scene.html`
- 建立：`src/features/ar/styles.css`

靜態檔案，用 Vite `?raw` import。由 factory 測試驗證有被注入，不單獨測 CSS 視覺。

- [ ] **步驟 1: 建立 scene HTML**

建立 `src/features/ar/scene.html`：

```html
<div id="ar-v5-scanning-overlay" class="hidden">
  <div class="inner">
    <img src="/assets/ar-v3/targets/card.png" />
    <div class="scanline"></div>
  </div>
</div>

<a-scene
  mindar-image="imageTargetSrc: /assets/ar-v3/targets/card.mind; showStats: false; uiScanning: #ar-v5-scanning-overlay;"
  embedded
  color-space="sRGB"
  renderer="colorManagement: true, physicallyCorrectLights"
  vr-mode-ui="enabled: false"
  device-orientation-permission-ui="enabled: false"
>
  <a-assets>
    <img id="card" src="/assets/ar-v3/targets/card.png" />
    <img id="icon-web" src="/assets/ar-v3/icons/web.png" />
    <img id="icon-email" src="/assets/ar-v3/icons/email.png" />
    <img id="icon-profile" src="/assets/ar-v3/icons/profile.png" />
    <img id="icon-location" src="/assets/ar-v3/icons/location.png" />
    <img id="icon-left" src="/assets/ar-v3/icons/left.png" />
    <img id="icon-right" src="/assets/ar-v3/icons/right.png" />
    <img id="paintandquest-preview" src="/assets/ar-v3/portfolio/paintandquest-preview.png" />
    <video id="paintandquest-video-mp4" loop="true" playsinline webkit-playsinline src="/assets/ar-v3/portfolio/paintandquest.mp4"></video>
    <video id="paintandquest-video-webm" loop="true" playsinline webkit-playsinline src="/assets/ar-v3/portfolio/paintandquest.webm"></video>
    <img id="coffeemachine-preview" src="/assets/ar-v3/portfolio/coffeemachine-preview.png" />
    <img id="peak-preview" src="/assets/ar-v3/portfolio/peak-preview.png" />
    <a-asset-item id="avatarModel" src="/assets/ar-v3/models/softmind/scene.gltf"></a-asset-item>
  </a-assets>

  <a-camera position="0 0 0" look-controls="enabled: false" cursor="fuse: false; rayOrigin: mouse;" raycaster="far: 10000; objects: .clickable"></a-camera>

  <a-entity id="ar-v5-target" mindar-image-target="targetIndex: 0">
    <a-plane src="#card" position="0 0 0" height="0.552" width="1" rotation="0 0 0"></a-plane>

    <a-entity visible="false" id="portfolio-panel" position="0 0 -0.01">
      <a-text value="Portfolio" color="black" align="center" width="2" position="0 0.4 0"></a-text>
      <a-entity id="portfolio-item0">
        <a-video id="paintandquest-video-link" webkit-playsinline playsinline width="1" height="0.552" position="0 0 0"></a-video>
        <a-image id="paintandquest-preview-button" class="clickable" src="#paintandquest-preview" alpha-test="0.5" position="0 0 0" height="0.552" width="1"></a-image>
      </a-entity>
      <a-entity id="portfolio-item1" visible="false">
        <a-image class="clickable" src="#coffeemachine-preview" alpha-test="0.5" position="0 0 0" height="0.552" width="1"></a-image>
      </a-entity>
      <a-entity id="portfolio-item2" visible="false">
        <a-image class="clickable" src="#peak-preview" alpha-test="0.5" position="0 0 0" height="0.552" width="1"></a-image>
      </a-entity>
      <a-image visible="false" id="portfolio-left-button" class="clickable" src="#icon-left" position="-0.7 0 0" height="0.15" width="0.15"></a-image>
      <a-image visible="false" id="portfolio-right-button" class="clickable" src="#icon-right" position="0.7 0 0" height="0.15" width="0.15"></a-image>
    </a-entity>

    <a-gltf-model id="avatar" rotation="0 0 0" position="0 -0.25 -0.3" scale="0.004 0.004 0.004" src="#avatarModel" animation-mixer></a-gltf-model>

    <a-image visible="false" id="profile-button" class="clickable" src="#icon-profile" position="-0.42 -0.5 0" height="0.15" width="0.15"
      animation="property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"></a-image>
    <a-image visible="false" id="web-button" class="clickable" src="#icon-web" alpha-test="0.5" position="-0.14 -0.5 0" height="0.15" width="0.15"
      animation="property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"></a-image>
    <a-image visible="false" id="email-button" class="clickable" src="#icon-email" position="0.14 -0.5 0" height="0.15" width="0.15"
      animation="property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"></a-image>
    <a-image visible="false" id="location-button" class="clickable" src="#icon-location" position="0.42 -0.5 0" height="0.15" width="0.15"
      animation="property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"></a-image>

    <a-text id="text" class="clickable" value="" color="black" align="center" width="2" position="0 -1 0" geometry="primitive:plane; height: 0.1; width: 2;" material="opacity: 0.5"></a-text>
  </a-entity>
</a-scene>
```

- [ ] **步驟 2: 建立 CSS 檔案**

建立 `src/features/ar/styles.css`：

```css
#ar-v5-scanning-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: transparent;
  z-index: 2;
}

@media (min-aspect-ratio: 1/1) {
  #ar-v5-scanning-overlay .inner {
    width: 50vh;
    height: 50vh;
  }
}

@media (max-aspect-ratio: 1/1) {
  #ar-v5-scanning-overlay .inner {
    width: 80vw;
    height: 80vw;
  }
}

#ar-v5-scanning-overlay .inner {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background:
    linear-gradient(to right, white 10px, transparent 10px) 0 0,
    linear-gradient(to right, white 10px, transparent 10px) 0 100%,
    linear-gradient(to left, white 10px, transparent 10px) 100% 0,
    linear-gradient(to left, white 10px, transparent 10px) 100% 100%,
    linear-gradient(to bottom, white 10px, transparent 10px) 0 0,
    linear-gradient(to bottom, white 10px, transparent 10px) 100% 0,
    linear-gradient(to top, white 10px, transparent 10px) 0 100%,
    linear-gradient(to top, white 10px, transparent 10px) 100% 100%;
  background-repeat: no-repeat;
  background-size: 40px 40px;
}

#ar-v5-scanning-overlay.hidden {
  display: none;
}

#ar-v5-scanning-overlay img {
  opacity: 0.6;
  width: 90%;
  align-self: center;
}

#ar-v5-scanning-overlay .inner .scanline {
  position: absolute;
  width: 100%;
  height: 10px;
  background: white;
  animation: ar-v5-scan 2s linear infinite;
}

@keyframes ar-v5-scan {
  0%, 100% { top: 0% }
  50% { top: calc(100% - 10px) }
}
```

- [ ] **步驟 3: 檢查變更**

```bash
git diff -- src/features/ar/scene.html src/features/ar/styles.css
```

---

### Task 3: Island 工廠函式

**檔案：**
- 建立：`src/features/ar/createArV5Island.ts`
- 建立：`src/features/ar/createArV5Island.test.ts`

- [ ] **步驟 1: 寫 factory 測試**

建立 `src/features/ar/createArV5Island.test.ts`，至少覆蓋：
- `loadScript` 順序：A-Frame → A-Frame Extras → MindAR。
- 注入 scene HTML 和 CSS，cleanup 後 container/head 回到乾淨狀態。
- `cleanup` 可重複呼叫，不重複移除或 throw。
- scene load 前 container detached 時，清掉 partial DOM/CSS，不呼叫 `onReady`。
- script load 或 scene load 失敗時呼叫 `onError`，並清掉 partial DOM/CSS。
- targetFound/targetLost callbacks 正確轉發，cleanup 後不再觸發。

- [ ] **步驟 2: 跑測試確認失敗**

執行：`pnpm vitest run src/features/ar/createArV5Island.test.ts`
預期：FAIL — 模組 `./createArV5Island` 不存在。

- [ ] **步驟 3: 建立 island 工廠**

建立 `src/features/ar/createArV5Island.ts`：

```ts
import sceneHtml from './scene.html?raw'
import sceneCss from './styles.css?raw'
import { initArV5Experience, cleanupArV5Artifacts } from './ar-v5-interactions'

type ArWindow = Window & typeof globalThis & {
  AFRAME?: { components?: Record<string, unknown>; registerComponent: (name: string, def: Record<string, unknown>) => void }
}

function getArWindow(): ArWindow {
  return window as ArWindow
}

function isAframeReady() {
  return typeof getArWindow().AFRAME !== 'undefined'
}

function isMindArReady() {
  return Boolean(getArWindow().AFRAME?.components?.['mindar-image'])
}

function isAframeExtrasReady() {
  return Boolean(getArWindow().AFRAME?.components?.['animation-mixer'])
}

function loadScript(src: string, isReady: () => boolean): Promise<void> {
  const existing = document.querySelector(`script[src="${src}"]`)
  if (existing) {
    const loaded = existing.getAttribute('data-loaded') === 'true' || isReady()
    if (loaded) {
      existing.setAttribute('data-loaded', 'true')
      return Promise.resolve()
    }
    return new Promise<void>((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true })
    })
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => { script.setAttribute('data-loaded', 'true'); resolve() }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

async function loadArV5Scripts(): Promise<void> {
  await loadScript('https://aframe.io/releases/1.4.2/aframe.min.js', isAframeReady)
  await loadScript('https://cdn.jsdelivr.net/npm/aframe-extras@7.1.0/dist/aframe-extras.min.js', isAframeExtrasReady)
  await loadScript('/vendor/mindar-image-aframe.prod.js', isMindArReady)
}

function assertContainerConnected(container: HTMLElement): void {
  if (!container.isConnected) {
    throw new Error('AR V5 container detached before initialization completed')
  }
}

function registerArV5Components(): void {
  const w = getArWindow()
  if (!w.AFRAME?.registerComponent) return
  if (!w.AFRAME.components?.['ar-v5-target']) {
    w.AFRAME.registerComponent('ar-v5-target', { init() {} })
  }
}

function injectArV5Scene(container: HTMLElement): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = sceneCss
  document.head.appendChild(style)

  const parser = new DOMParser()
  const doc = parser.parseFromString(sceneHtml, 'text/html')
  const fragment = document.createDocumentFragment()
  Array.from(doc.body.childNodes).forEach((node) => {
    fragment.appendChild(document.importNode(node, true))
  })
  container.appendChild(fragment)

  return style
}

function waitForArV5SceneLoad(container: HTMLElement): Promise<void> {
  const sceneEl = container.querySelector('a-scene') as HTMLElement & { hasLoaded?: boolean } | null
  if (!sceneEl) return Promise.reject(new Error('a-scene not found in container'))
  if (sceneEl.hasLoaded) return Promise.resolve()
  return new Promise<void>((resolve) => {
    sceneEl.addEventListener('loaded', () => resolve(), { once: true })
  })
}

function destroyArV5Scene(container: HTMLElement, style: HTMLStyleElement): void {
  const sceneEl = container.querySelector('a-scene') as any
  if (sceneEl) {
    try { sceneEl.renderer?.setAnimationLoop?.(null) } catch {}
    try { sceneEl.pause?.() } catch {}
    try {
      container.querySelectorAll('video').forEach((v) => {
        const video = v as HTMLVideoElement
        video.pause()
        if (video.srcObject instanceof MediaStream) {
          video.srcObject.getTracks().forEach((track) => track.stop())
          video.srcObject = null
        }
        video.src = ''
      })
    } catch {}
  }
  document.querySelectorAll('video').forEach((v) => {
    const video = v as HTMLVideoElement
    if (video.srcObject instanceof MediaStream) {
      video.srcObject.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
  })
  while (container.firstChild) container.removeChild(container.firstChild)
  style.remove()
}

export type ArV5IslandCallbacks = {
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onError?: (error: unknown) => void
  navigate?: (url: string) => void
}

export async function createArV5Island(
  container: HTMLElement,
  callbacks: ArV5IslandCallbacks = {},
): Promise<() => void> {
  let styleEl: HTMLStyleElement | null = null
  let interactionCleanup: (() => void) | null = null
  let cleaned = false

  try {
    assertContainerConnected(container)
    await loadArV5Scripts()
    assertContainerConnected(container)

    registerArV5Components()
    styleEl = injectArV5Scene(container)
    assertContainerConnected(container)

    await waitForArV5SceneLoad(container)
    assertContainerConnected(container)

    const target = container.querySelector('#ar-v5-target')
    const onTargetFound = () => callbacks.onTargetFound?.()
    const onTargetLost = () => callbacks.onTargetLost?.()
    target?.addEventListener('targetFound', onTargetFound)
    target?.addEventListener('targetLost', onTargetLost)

    interactionCleanup = initArV5Experience(document, { navigate: callbacks.navigate })
    callbacks.onReady?.()

    return () => {
      if (cleaned) return
      cleaned = true
      interactionCleanup()
      target?.removeEventListener('targetFound', onTargetFound)
      target?.removeEventListener('targetLost', onTargetLost)
      if (styleEl) destroyArV5Scene(container, styleEl)
      cleanupArV5Artifacts(document)
    }
  } catch (error) {
    if (styleEl) destroyArV5Scene(container, styleEl)
    cleanupArV5Artifacts(document)
    if (container.isConnected) callbacks.onError?.(error)
    return () => {}
  }
}
```

- [ ] **步驟 4: 跑 factory 測試確認通過**

執行：`pnpm vitest run src/features/ar/createArV5Island.test.ts`
預期：全部 PASS。

- [ ] **步驟 5: 檢查變更**

```bash
git diff -- src/features/ar/createArV5Island.ts src/features/ar/createArV5Island.test.ts
```

---

### Task 4: React Wrapper + 頁面 + Router

**檔案：**
- 建立：`src/features/ar/MindARScene.tsx`
- 建立：`src/features/ar/MindARScene.test.tsx`
- 建立：`src/pages/ProductARPage.tsx`
- 建立：`src/pages/ProductARPage.test.tsx`
- 修改：`src/router.tsx`

- [ ] **步驟 1: 建立 React wrapper**

建立 `src/features/ar/MindARScene.tsx`：

```tsx
import { useEffect, useRef } from 'react'
import { createArV5Island, type ArV5IslandCallbacks } from './createArV5Island'

export type MindARSceneProps = {
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onError?: (error: unknown) => void
}

export function MindARScene({ onReady, onTargetFound, onTargetLost, onError }: MindARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const callbacksRef = useRef<ArV5IslandCallbacks>({ onReady, onTargetFound, onTargetLost, onError })
  callbacksRef.current = { onReady, onTargetFound, onTargetLost, onError }

  useEffect(() => {
    if (!containerRef.current) return

    let cleanupIsland: (() => void) | null = null
    let cancelled = false

    const bridge: ArV5IslandCallbacks = {
      onReady: () => { if (!cancelled) callbacksRef.current.onReady?.() },
      onTargetFound: () => { if (!cancelled) callbacksRef.current.onTargetFound?.() },
      onTargetLost: () => { if (!cancelled) callbacksRef.current.onTargetLost?.() },
      onError: (err) => { if (!cancelled) callbacksRef.current.onError?.(err) },
    }

    void createArV5Island(containerRef.current, bridge).then((cleanup) => {
      if (cancelled) { cleanup(); return }
      cleanupIsland = cleanup
    })

    return () => {
      cancelled = true
      cleanupIsland?.()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0" />
}
```

- [ ] **步驟 2: 建立頁面**

建立 `src/pages/ProductARPage.tsx`：

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { MindARScene } from '../features/ar/MindARScene'

type ArStatus = 'initializing' | 'scanning' | 'tracking' | 'lost' | 'error'

export function ProductARPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ArStatus>('initializing')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black text-white">
      <MindARScene
        onReady={() => setStatus('scanning')}
        onTargetFound={() => setStatus('tracking')}
        onTargetLost={() => setStatus('lost')}
        onError={(err) => { setStatus('error'); setError(String(err)) }}
      />

      <div className="absolute inset-0 pointer-events-none flex flex-col">
        <div className="p-6 flex justify-between items-start pointer-events-auto">
          <button
            onClick={() => navigate('/ar')}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer"
          >
            ← 返回
          </button>
          <div className="text-right">
            <h1 className="text-xl font-bold tracking-tight">Product AR</h1>
            <p className="text-xs opacity-50">DOM Island</p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="p-6 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                status === 'tracking' ? 'bg-green-400'
                  : status === 'error' ? 'bg-red-400'
                  : 'bg-yellow-400'
              }`} />
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">{status}</span>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {!error && status === 'scanning' && (
              <p className="text-sm opacity-50">請對準識別圖以開始。</p>
            )}
            {!error && status === 'lost' && (
              <p className="text-sm opacity-50">識別圖遺失，請重新對準。</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **步驟 3: 建立 wrapper/page 測試**

建立 `src/features/ar/MindARScene.test.tsx`，至少覆蓋：
- mount 時呼叫 `createArV5Island` 並傳入 container。
- unmount 後呼叫 island cleanup。
- promise resolve 前 unmount 時，resolve 後仍會呼叫 cleanup。
- callback props rerender 後不重新初始化，但觸發 captured callback 時使用最新 prop。

建立 `src/pages/ProductARPage.test.tsx`，至少覆蓋：
- 初始顯示 `initializing`。
- `onReady/onTargetFound/onTargetLost/onError` 會更新 status/error。
- 返回按鈕導向 `/ar`。

- [ ] **步驟 4: 註冊路由**

修改 `src/router.tsx` — 新增 import 和路由：

新增 import：

```tsx
import { ProductARPage } from './pages/ProductARPage'
```

新增到 routes 陣列（在 `/ar/v4` 之後）：

```tsx
{ path: '/product-ar', element: <ProductARPage /> },
```

- [ ] **步驟 5: 跑全部測試**

執行：`pnpm vitest run`
預期：全部通過。

- [ ] **步驟 6: 跑 typecheck**

執行：`pnpm tsc --noEmit`
預期：無錯誤。

- [ ] **步驟 7: 檢查變更**

```bash
git diff -- src/features/ar/MindARScene.tsx src/features/ar/MindARScene.test.tsx src/pages/ProductARPage.tsx src/pages/ProductARPage.test.tsx src/router.tsx
```

---

### Task 5: 手機手動驗證

需要真實手機瀏覽器 + 相機。無法自動化。

- [ ] **步驟 1: 啟動 dev server**

執行：`pnpm dev`

- [ ] **步驟 2: 手機瀏覽器驗證**

在手機開啟 `https://<your-ip>:3009/product-ar`（需要 HTTPS 才能用相機）。

檢查清單：
- [ ] 頁面載入，status 顯示 "initializing" → "scanning"
- [ ] Scanning overlay（角落框 + 掃描線）可見
- [ ] 相機啟動無錯誤
- [ ] 對準 `card.png` target → status 變 "tracking"
- [ ] Avatar model 動畫向上滑入
- [ ] Portfolio panel 滑入，顯示 3 個項目
- [ ] Left/right buttons 出現，可切換 portfolio items
- [ ] Info buttons（profile, web, email, location）依序出現（pulse 動畫）
- [ ] 點 info buttons → text 更新
- [ ] 點 web text → 導向 softmind.tech
- [ ] 點 preview button → video 播放
- [ ] 移開相機 → status 變 "lost"，內容隱藏，影片停止
- [ ] 重新對準 target → 體驗重新觸發啟動序列
- [ ] 按返回鍵 → 回到 /ar
- [ ] 重新進入 /product-ar → 相機正常啟動（無黑屏、無殘留 scene）
- [ ] 重複進出 3 次，確認無 memory leak 或 camera lock

- [ ] **步驟 3: 驗證 React StrictMode 行為（僅 dev）**

開發模式下 React StrictMode 會 double-mount。確認：
- [ ] 無重複 camera streams
- [ ] 無重複 A-Frame scenes
- [ ] Cleanup 正確銷毀第一次 mount 後才啟動第二次

如果 StrictMode 造成重複 camera streams 或殘留 scene，必須先修正 cancellation/cleanup；不能只因 production build 不 double-mount 就略過。

---

## 和 V2/V3 的關鍵差異

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

## 風險緩解

1. **Camera 殘留**：`destroyArV5Scene` 停止 renderer/runtime、停止 video `srcObject` media tracks、清空 videos、移除所有子節點。
2. **A-Frame 全域狀態**：`AFRAME.registerComponent` 有 guard 防重複。Scene 銷毀靠 `removeChild` 移除所有 A-Frame 管理的 DOM。
3. **StrictMode double-mount**：`MindARScene` cleanup + factory `container.isConnected` 檢查避免 unmount 後繼續注入 scene。
4. **Script 重複載入**：`loadScript` 檢查現有 `<script>` 標籤，已載入則直接 resolve；載入順序固定為 A-Frame → A-Frame Extras → MindAR。
5. **`?raw` import 型別**：Vite 原生支援。如果 TypeScript 抱怨，加 `vite/client` 型別宣告或 `*.html?raw` 宣告。
