import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ArV3Scene } from './ArV3Scene'

vi.mock('../lib/ar-v3', () => ({
  initArV3Experience: vi.fn(),
  cleanupArV3Artifacts: vi.fn(),
}))

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
    expect(container.querySelector('#profile-button')?.getAttribute('animation')).toContain('property: scale')
    expect(container.querySelector('#text')?.getAttribute('geometry')).toContain('primitive:plane')
    expect(container.querySelector('#text')?.getAttribute('material')).toContain('opacity: 0.5')
  })
})
