export type ArV4ActionId = 'profile' | 'web' | 'play-video'

export type ArV4Status = 'initializing' | 'scanning' | 'tracking' | 'lost' | 'error'

export type ArV4Action = {
  id: ArV4ActionId
  label: string
  description: string
}

export type ArV4Assets = {
  targetMind: string
  targetImage: string
  model: string
  videoMp4: string
  videoWebm: string
}

export type CreateMindArV4ExperienceOptions = {
  container: HTMLElement
  assets: ArV4Assets
  actions: readonly ArV4Action[]
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onAction?: (action: ArV4ActionId) => void
  onError?: (error: unknown) => void
}

export type MindArV4Experience = {
  cleanup: () => void
}
