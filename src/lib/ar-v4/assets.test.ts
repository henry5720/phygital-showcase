import { describe, expect, it } from 'vitest'
import { AR_V4_ACTIONS, AR_V4_ASSETS } from './assets'

describe('AR V4 assets', () => {
  it('points to the shared AR V3 demo assets for the first V4 runtime', () => {
    expect(AR_V4_ASSETS.targetMind).toBe('/assets/ar-v3/targets/card.mind')
    expect(AR_V4_ASSETS.targetImage).toBe('/assets/ar-v3/targets/card.png')
    expect(AR_V4_ASSETS.model).toBe('/assets/ar-v3/models/softmind/scene.gltf')
    expect(AR_V4_ASSETS.videoMp4).toBe('/assets/ar-v3/portfolio/paintandquest.mp4')
    expect(AR_V4_ASSETS.videoWebm).toBe('/assets/ar-v3/portfolio/paintandquest.webm')
  })

  it('uses the fixed first-version action IDs', () => {
    expect(AR_V4_ACTIONS.map((action) => action.id)).toEqual([
      'profile',
      'web',
      'play-video',
    ])
  })

  it('uses the fixed first-version action metadata', () => {
    expect(AR_V4_ACTIONS).toEqual([
      {
        id: 'profile',
        label: 'Profile',
        description: 'AR, VR solutions and consultation',
      },
      {
        id: 'web',
        label: 'Web',
        description: 'https://softmind.tech',
      },
      {
        id: 'play-video',
        label: 'Video',
        description: 'Play the portfolio video in the AR scene.',
      },
    ])
  })

  it('freezes exported asset and action contracts', () => {
    expect(Object.isFrozen(AR_V4_ASSETS)).toBe(true)
    expect(Object.isFrozen(AR_V4_ACTIONS)).toBe(true)
    expect(AR_V4_ACTIONS.every((action) => Object.isFrozen(action))).toBe(true)
  })
})
