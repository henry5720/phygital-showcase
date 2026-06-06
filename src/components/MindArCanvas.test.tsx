import { render } from '@testing-library/react'
import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { MindArCanvas } from './MindArCanvas'

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    load() {}
  },
}))

vi.mock('mind-ar/dist/mindar-image-three.prod.js', () => ({
  MindARThree: class {
    renderer = {
      setAnimationLoop: vi.fn(),
      render: vi.fn(),
    }

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera()

    addAnchor() {
      return {
        group: new THREE.Group(),
        onTargetFound: null,
        onTargetLost: null,
      }
    }

    start = vi.fn(async () => undefined)
    stop = vi.fn()
  },
}))

describe('MindArCanvas', () => {
  it('renders a viewport-filling positioned container for MindAR overlays', () => {
    const { container } = render(
      <MindArCanvas
        modelSrc="/test.glb"
        mindFileSrc="/test.mind"
        onTargetFound={vi.fn()}
        onTargetLost={vi.fn()}
        onHotspot={vi.fn()}
      />
    )

    expect(container.firstChild).toHaveClass('absolute', 'inset-0')
  })
})
