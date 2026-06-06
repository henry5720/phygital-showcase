import type { ArV4Action, ArV4Assets } from './types'

export const AR_V4_ASSETS = Object.freeze({
  targetMind: '/assets/ar-v3/targets/card.mind',
  targetImage: '/assets/ar-v3/targets/card.png',
  model: '/assets/ar-v3/models/softmind/scene.gltf',
  videoMp4: '/assets/ar-v3/portfolio/paintandquest.mp4',
  videoWebm: '/assets/ar-v3/portfolio/paintandquest.webm',
} as const satisfies ArV4Assets)

export const AR_V4_ACTIONS = Object.freeze([
  Object.freeze({
    id: 'profile',
    label: 'Profile',
    description: 'AR, VR solutions and consultation',
  } as const satisfies ArV4Action),
  Object.freeze({
    id: 'web',
    label: 'Web',
    description: 'https://softmind.tech',
  } as const satisfies ArV4Action),
  Object.freeze({
    id: 'play-video',
    label: 'Video',
    description: 'Play the portfolio video in the AR scene.',
  } as const satisfies ArV4Action),
] as const satisfies readonly ArV4Action[])
