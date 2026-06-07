import { describe, expect, it } from 'vitest'
import sceneHtml from './scene.html?raw'

describe('AR scene asset URLs', () => {
  it('uses active web-ar asset paths', () => {
    expect(sceneHtml).toContain('/assets/web-ar/card.png')
    expect(sceneHtml).toContain('/assets/web-ar/card.mind')
    expect(sceneHtml).toContain('/assets/web-ar/icons/web.png')
    expect(sceneHtml).toContain('/assets/web-ar/portfolio/paintandquest.mp4')
    expect(sceneHtml).toContain('/assets/web-ar/portfolio/paintandquest.webm')
    expect(sceneHtml).toContain('/assets/web-ar/softmind/scene.gltf')
  })

  it('does not reference retired AR asset directories', () => {
    expect(sceneHtml).not.toContain('/assets/ar-v2/')
    expect(sceneHtml).not.toContain('/assets/ar-v3/')
    expect(sceneHtml).not.toContain('/assets/ar-v4/')
  })
})
