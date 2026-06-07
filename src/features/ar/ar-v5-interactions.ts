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

const AVATAR_Z_START = -0.3
const AVATAR_Z_END = 0.3
const AVATAR_Z_STEP = 0.008
const AVATAR_Y = -0.25

const PORTFOLIO_Y_START = 0
const PORTFOLIO_Y_END = 0.6
const PORTFOLIO_Y_STEP = 0.008
const PORTFOLIO_Z = -0.01
const PORTFOLIO_ITEM_COUNT = 3

const INFO_STAGGER_DELAY = 300
const PORTFOLIO_SETTLE_DELAY = 500
const ANIMATION_INTERVAL = 10

const AR_SCENE_LOAD_TIMEOUT = 10_000

const BRAND_NAME = '植酌 Fizz\'t'
const BRAND_TAGLINE = '鳳梨發酵酵素飲'
const BRAND_URL = 'https://line.me/R/ti/p/@fizzt_crm'

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
  for (let i = 0; i < PORTFOLIO_ITEM_COUNT; i += 1) {
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
  setPosition(doc.getElementById('portfolio-panel'), `0 0 ${PORTFOLIO_Z}`)
  setPosition(doc.getElementById('avatar'), `0 ${AVATAR_Y} ${AVATAR_Z_START}`)
  resetVideo(doc.getElementById('paintandquest-video-mp4') as HTMLVideoElement | null)
  resetVideo(doc.getElementById('paintandquest-video-webm') as HTMLVideoElement | null)
}

function showAvatar(session: ArV5Session, doc: Document, onDone: () => void) {
  const avatar = doc.getElementById('avatar')
  if (!avatar) { onDone(); return }
  let z = AVATAR_Z_START
  const id = scheduleInterval(session, () => {
    z += AVATAR_Z_STEP
    if (z >= AVATAR_Z_END) {
      window.clearInterval(id)
      onDone()
    }
    setPosition(avatar, `0 ${AVATAR_Y} ${z}`)
  }, ANIMATION_INTERVAL)
}

function showPortfolio(session: ArV5Session, doc: Document, onDone: () => void) {
  const portfolio = doc.getElementById('portfolio-panel')
  if (!portfolio) { onDone(); return }
  let y = PORTFOLIO_Y_START
  setVisible(portfolio, true)
  const id = scheduleInterval(session, () => {
    y += PORTFOLIO_Y_STEP
    if (y >= PORTFOLIO_Y_END) {
      window.clearInterval(id)
      setVisible(doc.getElementById('portfolio-left-button'), true)
      setVisible(doc.getElementById('portfolio-right-button'), true)
      scheduleTimeout(session, onDone, PORTFOLIO_SETTLE_DELAY)
    }
    setPosition(portfolio, `0 ${y} ${PORTFOLIO_Z}`)
  }, ANIMATION_INTERVAL)
}

function showInfo(session: ArV5Session, doc: Document) {
  setVisible(doc.getElementById('profile-button'), true)
  scheduleTimeout(session, () => setVisible(doc.getElementById('web-button'), true), INFO_STAGGER_DELAY)
  scheduleTimeout(session, () => setVisible(doc.getElementById('email-button'), true), INFO_STAGGER_DELAY * 2)
  scheduleTimeout(session, () => setVisible(doc.getElementById('location-button'), true), INFO_STAGGER_DELAY * 3)
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
          }, INFO_STAGGER_DELAY)
        })
      }, INFO_STAGGER_DELAY)
    })
  })

  bindEvent(session, target, 'targetLost', () => {
    resetExperience(doc, session, true)
  })

  bindEvent(session, leftButton, 'click', () => {
    session.itemIndex = (session.itemIndex - 1 + PORTFOLIO_ITEM_COUNT) % PORTFOLIO_ITEM_COUNT
    showPortfolioItem(doc, session.itemIndex)
  })

  bindEvent(session, rightButton, 'click', () => {
    session.itemIndex = (session.itemIndex + 1) % PORTFOLIO_ITEM_COUNT
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

  bindEvent(session, profileButton, 'click', () => setText(BRAND_NAME, 'profile'))
  bindEvent(session, webButton, 'click', () => setText(BRAND_URL, 'web'))
  bindEvent(session, emailButton, 'click', () => setText(`${BRAND_NAME} 聯絡我們`, 'email'))
  bindEvent(session, locationButton, 'click', () => setText(BRAND_TAGLINE, 'location'))

  bindEvent(session, textEl, 'click', () => {
    if (session.currentTab === 'web') navigate(BRAND_URL)
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

export { AR_SCENE_LOAD_TIMEOUT }
