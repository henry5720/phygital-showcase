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

    vi.advanceTimersByTime(2000)
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
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, opts?: any) => {
      const el = originalCreate(tag, opts)
      if (tag === 'video') {
        vi.spyOn(el as any, 'canPlayType').mockReturnValue('probably')
      }
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
    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('false')
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
