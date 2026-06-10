import * as THREE from 'three'

type SetupRendererOptions = {
  alpha?: boolean
}

type SetupRendererResult = {
  renderer: THREE.WebGLRenderer
  dispose: () => void
}

export function setupRenderer(
  container: HTMLElement,
  options: SetupRendererOptions = {},
): SetupRendererResult {
  const { alpha = true } = options

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha,
  })

  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.sortObjects = true

  const canvas = renderer.domElement
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  container.appendChild(canvas)

  const dispose = () => {
    renderer.setAnimationLoop(null)
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }

  return { renderer, dispose }
}