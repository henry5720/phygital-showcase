import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanupArV3Artifacts, initArV3Experience } from './ar-v3'

function renderScene() {
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
}

describe('initArV3Experience', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    renderScene()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())

    vi.stubGlobal('AFRAME', {
      components: {},
      registerComponent(name: string, definition: unknown) {
        this.components[name] = definition
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows official text content and only navigates through text after selecting web', () => {
    const navigate = vi.fn()

    initArV3Experience(document, { navigate })

    document.getElementById('profile-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('text')?.getAttribute('value')).toBe('AR, VR solutions and consultation')

    document.getElementById('text')?.dispatchEvent(new Event('click'))
    expect(navigate).not.toHaveBeenCalled()

    document.getElementById('web-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('text')?.getAttribute('value')).toBe('https://softmind.tech')

    document.getElementById('text')?.dispatchEvent(new Event('click'))
    expect(navigate).toHaveBeenCalledWith('https://softmind.tech')
  })

  it('prefers webm when supported and falls back to mp4 otherwise', () => {
    const videoLink = document.getElementById('paintandquest-video-link')!
    const webmVideo = document.getElementById('paintandquest-video-webm') as HTMLVideoElement
    const mp4Video = document.getElementById('paintandquest-video-mp4') as HTMLVideoElement
    const webmPlaySpy = vi.spyOn(webmVideo, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(mp4Video, 'play').mockImplementation(() => Promise.resolve())
    const canPlayTypeSpy = vi.spyOn(HTMLMediaElement.prototype, 'canPlayType')

    initArV3Experience()

    canPlayTypeSpy.mockReturnValueOnce('probably')
    document.getElementById('paintandquest-preview-button')?.dispatchEvent(new Event('click'))
    expect(videoLink.getAttribute('src')).toBe('#paintandquest-video-webm')
    expect(webmPlaySpy).toHaveBeenCalled()

    renderScene()
    initArV3Experience()

    const fallbackLink = document.getElementById('paintandquest-video-link')!
    const fallbackMp4Video = document.getElementById('paintandquest-video-mp4') as HTMLVideoElement
    const fallbackMp4PlaySpy = vi.spyOn(fallbackMp4Video, 'play').mockImplementation(() => Promise.resolve())
    canPlayTypeSpy.mockReturnValueOnce('')
    document.getElementById('paintandquest-preview-button')?.dispatchEvent(new Event('click'))
    expect(fallbackLink.getAttribute('src')).toBe('#paintandquest-video-mp4')
    expect(fallbackMp4PlaySpy).toHaveBeenCalled()
  })

  it('uses left as previous and right as next for portfolio navigation', () => {
    vi.useFakeTimers()

    initArV3Experience()

    document.getElementById('ar-target')?.dispatchEvent(new Event('targetFound'))
    vi.runAllTimers()

    expect(document.getElementById('portfolio-item0')?.getAttribute('visible')).toBe('true')

    document.getElementById('portfolio-left-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item2')?.getAttribute('visible')).toBe('true')

    document.getElementById('portfolio-right-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item0')?.getAttribute('visible')).toBe('true')

    document.getElementById('portfolio-right-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item1')?.getAttribute('visible')).toBe('true')
  })

  it('resets interactive state and removes MindAR overlay residue during cleanup', () => {
    const overlay = document.createElement('div')
    overlay.className = 'mindar-ui-overlay'
    document.body.appendChild(overlay)

    const style = document.createElement('style')
    style.setAttribute('data-mindar-overlay', 'true')
    style.textContent = '.mindar-ui-overlay { color: red; }'
    document.head.appendChild(style)

    initArV3Experience()

    document.getElementById('web-button')?.dispatchEvent(new Event('click'))
    document.getElementById('paintandquest-preview-button')?.dispatchEvent(new Event('click'))

    cleanupArV3Artifacts(document)

    expect(document.querySelector('.mindar-ui-overlay')).toBeNull()
    expect(style.isConnected).toBe(false)
    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('false')
    expect(document.getElementById('portfolio-left-button')?.getAttribute('visible')).toBe('false')
    expect(document.getElementById('portfolio-right-button')?.getAttribute('visible')).toBe('false')
    expect(document.getElementById('paintandquest-preview-button')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('paintandquest-video-link')?.getAttribute('visible')).toBe('false')
    expect(document.getElementById('paintandquest-video-link')?.getAttribute('src')).toBeNull()
    expect(document.getElementById('profile-button')?.getAttribute('visible')).toBe('false')
    expect(document.getElementById('web-button')?.getAttribute('visible')).toBe('false')
    expect(document.getElementById('email-button')?.getAttribute('visible')).toBe('false')
    expect(document.getElementById('location-button')?.getAttribute('visible')).toBe('false')
    expect(document.getElementById('text')?.getAttribute('value')).toBe('')
  })

  it('does not duplicate listeners across cleanup and repeated initialization', () => {
    const navigate = vi.fn()

    initArV3Experience(document, { navigate })
    cleanupArV3Artifacts(document)
    initArV3Experience(document, { navigate })

    document.getElementById('web-button')?.dispatchEvent(new Event('click'))
    document.getElementById('text')?.dispatchEvent(new Event('click'))

    expect(document.getElementById('text')?.getAttribute('value')).toBe('https://softmind.tech')
    expect(navigate).toHaveBeenCalledTimes(1)
  })
})
