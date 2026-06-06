import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ArV2Scene } from './ArV2Scene'

describe('ArV2Scene', () => {
  it('renders a local-asset aframe scene for the v2 validation flow', () => {
    const { container } = render(<ArV2Scene />)

    const scene = container.querySelector('a-scene')
    expect(scene).not.toBeNull()
    expect(scene?.getAttribute('mindar-image')).toContain('/assets/ar-v2/targets/card.mind')
    expect(container.querySelector('a-entity[mindar-image-target="targetIndex: 0"]')).not.toBeNull()
    expect(container.querySelector('a-asset-item#avatarModel')?.getAttribute('src')).toBe('/assets/ar-v2/models/softmind/scene.gltf')
    expect(container.querySelector('video#paintandquest-video-mp4')?.getAttribute('src')).toBe('/assets/ar-v2/videos/paintandquest.mp4')
  })
})
