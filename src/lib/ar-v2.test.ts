import { describe, expect, it } from 'vitest'
import { initArV2Experience } from './ar-v2'

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

    document.getElementById('portfolio-left-button')?.dispatchEvent(new Event('click'))
    expect(document.getElementById('portfolio-item1')?.getAttribute('visible')).toBe('true')
    expect(document.getElementById('portfolio-item0')?.getAttribute('visible')).toBe('false')

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

  it('selects correct video format on preview click', () => {
    const cleanup = initArV2Experience(document)

    document.getElementById('ar-v2-target')?.dispatchEvent(new Event('targetFound'))
    document.getElementById('paintandquest-preview-button')?.dispatchEvent(new Event('click'))
    cleanup()
  })
})
