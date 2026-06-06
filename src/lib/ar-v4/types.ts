export type ArV4ActionId = 'profile' | 'web' | 'play-video'

export type ArV4Status = 'initializing' | 'scanning' | 'tracking' | 'lost' | 'error'

export type ArV4Action = {
  readonly id: ArV4ActionId
  readonly label: string
  readonly description: string
}

export type ArV4Assets = {
  readonly targetMind: `${string}.mind`
  readonly targetImage: `${string}.png`
  readonly model: `${string}.gltf` | `${string}.glb`
  readonly videoMp4: `${string}.mp4`
  readonly videoWebm: `${string}.webm`
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
