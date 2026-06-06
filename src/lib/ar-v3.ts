/**
 * AR V3 Interaction Logic
 * Ported from MindAR official advanced.html example.
 */

type AFrameRegistry = {
  components?: Record<string, unknown>
  registerComponent: (name: string, definition: Record<string, unknown>) => void
}

declare const AFRAME: AFrameRegistry | undefined

type ArV3Tab = '' | 'web' | 'email' | 'profile' | 'location'

type ArV3Session = {
  currentTab: ArV3Tab
  itemIndex: number
  hasActivated: boolean
  timeouts: number[]
  intervals: number[]
  cleanupFns: Array<() => void>
}

type InitArV3Options = {
  navigate?: (url: string) => void
}

let activeSession: ArV3Session | null = null

function setVisible(el: Element | null, visible: boolean) {
  if (!el) return
  el.setAttribute('visible', visible ? 'true' : 'false')
}

function setPosition(el: Element | null, value: string) {
  if (!el) return
  el.setAttribute('position', value)
}

function showPortfolioItem(doc: Document, index: number) {
  for (let item = 0; item <= 2; item += 1) {
    setVisible(doc.getElementById(`portfolio-item${item}`), item === index)
  }
}

function scheduleTimeout(session: ArV3Session, callback: () => void, delay: number) {
  const id = window.setTimeout(callback, delay)
  session.timeouts.push(id)
  return id
}

function scheduleInterval(session: ArV3Session, callback: () => void, delay: number) {
  const id = window.setInterval(callback, delay)
  session.intervals.push(id)
  return id
}

function bindEvent(session: ArV3Session, el: Element | null, type: string, handler: EventListener) {
  if (!el) return
  el.addEventListener(type, handler)
  session.cleanupFns.push(() => el.removeEventListener(type, handler))
}

function cleanupSession(session: ArV3Session | null) {
  if (!session) return

  session.timeouts.forEach((id) => window.clearTimeout(id))
  session.intervals.forEach((id) => window.clearInterval(id))
  session.cleanupFns.forEach((cleanup) => cleanup())
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
  try {
    video.currentTime = 0
  } catch {
    // jsdom can be incomplete here; best-effort reset is enough.
  }
}

function resetExperience(doc: Document, session?: ArV3Session | null, resetActivation = true) {
  if (session) {
    session.currentTab = ''
    session.itemIndex = 0
    if (resetActivation) {
      session.hasActivated = false
    }
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

function showAvatar(session: ArV3Session, doc: Document, onDone: () => void) {
  const avatar = doc.getElementById('avatar')
  if (!avatar) {
    onDone()
    return
  }

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

function showPortfolio(session: ArV3Session, doc: Document, onDone: () => void) {
  const portfolio = doc.getElementById('portfolio-panel')
  if (!portfolio) {
    onDone()
    return
  }

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

function showInfo(session: ArV3Session, doc: Document) {
  const profileButton = doc.getElementById('profile-button')
  const webButton = doc.getElementById('web-button')
  const emailButton = doc.getElementById('email-button')
  const locationButton = doc.getElementById('location-button')

  setVisible(profileButton, true)
  scheduleTimeout(session, () => setVisible(webButton, true), 300)
  scheduleTimeout(session, () => setVisible(emailButton, true), 600)
  scheduleTimeout(session, () => setVisible(locationButton, true), 900)
}

function registerAframeComponents() {
  if (typeof AFRAME === 'undefined') {
    console.error('AFRAME is not loaded')
    return false
  }

  if (!AFRAME.components?.mytarget) {
    AFRAME.registerComponent('mytarget', {})
  }

  if (!AFRAME.components?.['portfolio-item-actions']) {
    AFRAME.registerComponent('portfolio-item-actions', {})
  }

  return true
}

export function initArV3Experience(doc: Document = document, options: InitArV3Options = {}) {
  if (!registerAframeComponents()) {
    return () => {}
  }

  const session = createSession()
  const navigate = options.navigate ?? ((url: string) => window.location.assign(url))

  resetExperience(doc, session)

  const target = doc.getElementById('ar-target') ?? doc.querySelector('[mindar-image-target]')
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

  const setText = (value: string, tab: ArV3Tab) => {
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

  bindEvent(session, profileButton, 'click', () => {
    setText('AR, VR solutions and consultation', 'profile')
  })

  bindEvent(session, webButton, 'click', () => {
    setText('https://softmind.tech', 'web')
  })

  bindEvent(session, emailButton, 'click', () => {
    setText('hello@softmind.tech', 'email')
  })

  bindEvent(session, locationButton, 'click', () => {
    setText('Vancouver, Canada | Hong Kong', 'location')
  })

  bindEvent(session, textEl, 'click', () => {
    if (session.currentTab === 'web') {
      navigate('https://softmind.tech')
    }
  })

  return () => {
    if (activeSession === session) {
      activeSession = null
    }
    cleanupSession(session)
  }
}

export function cleanupArV3Artifacts(doc: Document = document) {
  cleanupSession(activeSession)
  activeSession = null
  resetExperience(doc)
  doc.querySelectorAll('.mindar-ui-overlay').forEach((el) => el.remove())
  doc.head.querySelectorAll('style[data-mindar-overlay="true"]').forEach((el) => {
    el.remove()
  })
}
