import { describe, expect, it, vi, beforeEach } from 'vitest'
import { initArV2Experience, cleanupArV2Artifacts } from './ar-v2'

describe('cleanupArV2Artifacts', () => {
  it('removes MindAR overlays and styles from the document', () => {
    document.body.innerHTML = '<div class="mindar-ui-overlay"></div>'
    const style = document.createElement('style')
    style.textContent = '.mindar-ui-overlay { color: red; }'
    document.head.appendChild(style)

    cleanupArV2Artifacts(document)

    expect(document.querySelector('.mindar-ui-overlay')).toBeNull()
    const remainingStyle = document.head.querySelector('style')?.textContent || ''
    expect(remainingStyle).not.toContain('mindar-ui-overlay')
  })
})

describe('initArV2Experience', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="ar-v2-target"></div>
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
    `
  })

  it('shows portfolio panel and switches items on targetFound and button clicks', () => {
    const cleanup = initArV2Experience(document)

    document.getElementById('ar-v2-target')?.dispatchEvent(new Event('targetFound'))

    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('portfolio-left-button')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('portfolio-right-button')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('portfolio-item0')?.getAttribute('visible')).toBe('true')

    // left = previous (wraps to item2 when at item0)
    document.getElementById('portfolio-left-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item2')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('portfolio-item0')?.getAttribute('visible')).toBe('false')

    // right = next (goes back to item0)
    document.getElementById('portfolio-right-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item0')?.getAttribute('visible')).toBe('true')

    // right again = next (item1)
    document.getElementById('portfolio-right-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item1')?.getAttribute('visible')).toBe('true')

    cleanup()
  })

  it('only activates on first targetFound event', () => {
    const cleanup = initArV2Experience(document)

    document.getElementById('ar-v2-target')?.dispatchEvent(new Event('targetFound'))
    document.getElementById('ar-v2-target')?.dispatchEvent(new Event('targetFound'))

    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBe('true')

    cleanup()
  })

  it('cleans up all event listeners', () => {
    const cleanup = initArV2Experience(document)

    cleanup()
    document.getElementById('ar-v2-target')?.dispatchEvent(new Event('targetFound'))
    expect(document.getElementById('portfolio-panel')?.getAttribute('visible')).toBeNull()
  })

  it('selects mp4 format on preview click when webm is unsupported', () => {
    const cleanup = initArV2Experience(document)
    const setAttributeSpy = vi.spyOn(document.getElementById('paintandquest-video-link')!, 'setAttribute')

    document.getElementById('ar-v2-target')?.dispatchEvent(new Event('targetFound'))
    document.getElementById('paintandquest-preview-button')?.dispatchEvent(new Event('click'))

    expect(setAttributeSpy).toHaveBeenCalledWith('src', '#paintandquest-video-mp4')
    cleanup()
  })

  it('selects webm format on preview click when webm is supported', () => {
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const el = originalCreateElement(tagName, options)
      if (tagName === 'video') {
        vi.spyOn(el, 'canPlayType').mockReturnValue('probably')
      }
      return el
    })

    const cleanup = initArV2Experience(document)
    const setAttributeSpy = vi.spyOn(document.getElementById('paintandquest-video-link')!, 'setAttribute')

    document.getElementById('ar-v2-target')?.dispatchEvent(new Event('targetFound'))
    document.getElementById('paintandquest-preview-button')?.dispatchEvent(new Event('click'))

    expect(setAttributeSpy).toHaveBeenCalledWith('src', '#paintandquest-video-webm')
    createElementSpy.mockRestore()
    cleanup()
  })
})
