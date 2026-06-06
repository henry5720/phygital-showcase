import type { ArV4Action, ArV4Assets } from './types'

export const AR_V4_ASSETS: ArV4Assets = {
  targetMind: '/assets/ar-v3/targets/card.mind',
  targetImage: '/assets/ar-v3/targets/card.png',
  model: '/assets/ar-v3/models/softmind/scene.gltf',
  videoMp4: '/assets/ar-v3/portfolio/paintandquest.mp4',
  videoWebm: '/assets/ar-v3/portfolio/paintandquest.webm',
}

export const AR_V4_ACTIONS: readonly ArV4Action[] = [
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
]
