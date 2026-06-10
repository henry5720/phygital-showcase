declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  export class MindARThree {
    constructor(options: { container: HTMLElement; imageTargetSrc: string })
    renderer: import('three').WebGLRenderer
    scene: import('three').Scene
    camera: import('three').Camera
    addAnchor(index: number): { group: import('three').Group }
    start(): Promise<void>
    stop(): void
    onTargetFound?: () => void
    onTargetLost?: () => void
  }
}
