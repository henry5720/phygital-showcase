# AR V4 MindAR Three Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/ar/v4` as the React + official MindAR Three.js API version of the interactive AR experience.

**Architecture:** Keep `/ar/v3` as the A-Frame reference implementation. Build V4 as a React page that owns UI state, a focused `ArV4Experience` component that owns mount/unmount wiring, and a `createMindArV4Experience` runtime factory that owns MindARThree, Three.js scene objects, raycasting, video texture, and cleanup.

**Tech Stack:** React 19, React Router, TypeScript, Vite, Vitest, Testing Library, MindAR `mindar-image-three`, Three.js, GLTFLoader.

---

## File Structure

- Create: `src/lib/ar-v4/assets.ts`
  - Owns V4 demo asset paths and action metadata.
- Create: `src/lib/ar-v4/types.ts`
  - Owns narrow public types shared between React and the runtime factory.
- Create: `src/lib/ar-v4/createMindArV4Experience.ts`
  - Owns MindAR dynamic import, Three.js object setup, pointer raycasting, video playback, render loop, and cleanup.
- Create: `src/lib/ar-v4/assets.test.ts`
  - Verifies required demo asset paths and fixed action IDs.
- Create: `src/lib/ar-v4/createMindArV4Experience.test.ts`
  - Verifies runtime factory starts MindAR, wires callbacks, and cleanup is safe using mocks.
- Create: `src/components/ar-v4/ArV4Experience.tsx`
  - React wrapper around the runtime factory. It should not contain Three.js scene logic.
- Create: `src/components/ar-v4/ArV4Experience.test.tsx`
  - Verifies mount/unmount contract and callback wiring with a mocked runtime factory.
- Create: `src/pages/ArV4Page.tsx`
  - Page layout, status text, selected action panel, back navigation, and `ArV4Experience` rendering.
- Create: `src/pages/ArV4Page.test.tsx`
  - Verifies page shell and mocked action updates.
- Modify: `src/router.tsx`
  - Registers `/ar/v4`.
- Modify: `src/pages/ArGuide.tsx`
  - Adds a secondary V4 entry below the existing AR start button.

---

### Task 1: Add V4 Asset And Type Contracts

**Files:**
- Create: `src/lib/ar-v4/types.ts`
- Create: `src/lib/ar-v4/assets.ts`
- Create: `src/lib/ar-v4/assets.test.ts`

- [ ] **Step 1: Write the failing asset contract test**

Create `src/lib/ar-v4/assets.test.ts`:

```ts
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
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/lib/ar-v4/assets.test.ts
```

Expected: FAIL because `src/lib/ar-v4/assets.ts` does not exist.

- [ ] **Step 3: Add the shared V4 types**

Create `src/lib/ar-v4/types.ts`:

```ts
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
```

- [ ] **Step 4: Add the demo asset config**

Create `src/lib/ar-v4/assets.ts`:

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm test:run src/lib/ar-v4/assets.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/lib/ar-v4/types.ts src/lib/ar-v4/assets.ts src/lib/ar-v4/assets.test.ts
git commit -m "feat: add ar v4 asset contract"
```

---

### Task 2: Add Runtime Factory Skeleton With Cleanup Contract

**Files:**
- Create: `src/lib/ar-v4/createMindArV4Experience.ts`
- Create: `src/lib/ar-v4/createMindArV4Experience.test.ts`

- [ ] **Step 1: Write the failing runtime cleanup test**

Create `src/lib/ar-v4/createMindArV4Experience.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { AR_V4_ACTIONS, AR_V4_ASSETS } from './assets'
import { createMindArV4Experience } from './createMindArV4Experience'

const startMock = vi.fn(async () => undefined)
const stopMock = vi.fn()
const setAnimationLoopMock = vi.fn()
const addAnchorMock = vi.fn(() => ({
  group: new THREE.Group(),
  onTargetFound: undefined as (() => void) | undefined,
  onTargetLost: undefined as (() => void) | undefined,
}))

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    load(_src: string, onLoad: (gltf: { scene: THREE.Group }) => void) {
      onLoad({ scene: new THREE.Group() })
    }
  },
}))

vi.mock('mind-ar/dist/mindar-image-three.prod.js', () => ({
  MindARThree: class {
    renderer = {
      setAnimationLoop: setAnimationLoopMock,
      render: vi.fn(),
    }

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera()

    addAnchor = addAnchorMock
    start = startMock
    stop = stopMock
  },
}))

afterEach(() => {
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

describe('createMindArV4Experience', () => {
  it('starts MindAR and cleans up renderer and MindAR on cleanup', async () => {
    const container = document.createElement('div')
    document.body.append(container)

    const experience = await createMindArV4Experience({
      container,
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
    })

    expect(startMock).toHaveBeenCalledOnce()
    expect(setAnimationLoopMock).toHaveBeenCalledWith(expect.any(Function))

    experience.cleanup()

    expect(setAnimationLoopMock).toHaveBeenLastCalledWith(null)
    expect(stopMock).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/lib/ar-v4/createMindArV4Experience.test.ts
```

Expected: FAIL because `createMindArV4Experience.ts` does not exist.

- [ ] **Step 3: Add the minimal runtime factory**

Create `src/lib/ar-v4/createMindArV4Experience.ts`:

```ts
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { CreateMindArV4ExperienceOptions, MindArV4Experience } from './types'

type MindArThreeConstructor = new (options: {
  container: HTMLElement
  imageTargetSrc: string
  maxTrack: number
  uiLoading: string
  uiScanning: string
  uiError: string
}) => {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.Camera
  addAnchor: (targetIndex: number) => {
    group: THREE.Group
    onTargetFound?: () => void
    onTargetLost?: () => void
  }
  start: () => Promise<void>
  stop: () => void
}

type MindArThreeModule = {
  MindARThree: MindArThreeConstructor
}

function cleanupMindArDom() {
  document.querySelectorAll('.mindar-ui-overlay').forEach((el) => el.remove())
  document.head.querySelectorAll('style').forEach((el) => {
    if (el.textContent?.includes('mindar-ui-overlay')) el.remove()
  })
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return

    mesh.geometry?.dispose()
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => material.dispose())
  })
}

export async function createMindArV4Experience({
  container,
  assets,
  onReady,
  onTargetFound,
  onTargetLost,
}: CreateMindArV4ExperienceOptions): Promise<MindArV4Experience> {
  const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js') as MindArThreeModule

  const mindarThree = new MindARThree({
    container,
    imageTargetSrc: assets.targetMind,
    maxTrack: 1,
    uiLoading: 'no',
    uiScanning: 'yes',
    uiError: 'no',
  })

  const { renderer, scene, camera } = mindarThree
  const anchor = mindarThree.addAnchor(0)
  anchor.onTargetFound = () => onTargetFound?.()
  anchor.onTargetLost = () => onTargetLost?.()

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(0, 1, 2)
  scene.add(ambientLight, directionalLight)

  let model: THREE.Group | undefined
  const loader = new GLTFLoader()
  loader.load(assets.model, (gltf) => {
    model = gltf.scene
    model.scale.set(0.004, 0.004, 0.004)
    model.position.set(0, -0.2, 0.1)
    anchor.group.add(model)
  })

  await mindarThree.start()
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera)
  })
  onReady?.()

  return {
    cleanup() {
      renderer.setAnimationLoop(null)
      if (model) disposeObject3D(model)
      scene.remove(ambientLight, directionalLight)
      mindarThree.stop()
      cleanupMindArDom()
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test:run src/lib/ar-v4/createMindArV4Experience.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib/ar-v4/createMindArV4Experience.ts src/lib/ar-v4/createMindArV4Experience.test.ts
git commit -m "feat: add ar v4 mindar runtime skeleton"
```

---

### Task 3: Add Video Plane, Action Buttons, And Raycaster Events

**Files:**
- Modify: `src/lib/ar-v4/createMindArV4Experience.ts`
- Modify: `src/lib/ar-v4/createMindArV4Experience.test.ts`

- [ ] **Step 1: Add a failing action callback test**

Append this test inside the existing `describe('createMindArV4Experience', ...)` block in `src/lib/ar-v4/createMindArV4Experience.test.ts`:

```ts
  it('emits an action when a pointer hits an AR button mesh', async () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    })
    document.body.append(container)
    const onAction = vi.fn()
    const intersectSpy = vi
      .spyOn(THREE.Raycaster.prototype, 'intersectObjects')
      .mockReturnValue([{ object: new THREE.Mesh() } as THREE.Intersection])

    await createMindArV4Experience({
      container,
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
      onAction,
    })

    container.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 50 }))

    expect(onAction).toHaveBeenCalledWith('profile')
    intersectSpy.mockRestore()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/lib/ar-v4/createMindArV4Experience.test.ts
```

Expected: FAIL because pointer events and buttons are not implemented.

- [ ] **Step 3: Replace the runtime factory with button and video support**

Replace the full contents of `src/lib/ar-v4/createMindArV4Experience.ts` with:

```ts
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ArV4ActionId, CreateMindArV4ExperienceOptions, MindArV4Experience } from './types'

type MindArThreeConstructor = new (options: {
  container: HTMLElement
  imageTargetSrc: string
  maxTrack: number
  uiLoading: string
  uiScanning: string
  uiError: string
}) => {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.Camera
  addAnchor: (targetIndex: number) => {
    group: THREE.Group
    onTargetFound?: () => void
    onTargetLost?: () => void
  }
  start: () => Promise<void>
  stop: () => void
}

type MindArThreeModule = {
  MindARThree: MindArThreeConstructor
}

type HitTarget = {
  mesh: THREE.Object3D
  action: ArV4ActionId
}

function cleanupMindArDom() {
  document.querySelectorAll('.mindar-ui-overlay').forEach((el) => el.remove())
  document.head.querySelectorAll('style').forEach((el) => {
    if (el.textContent?.includes('mindar-ui-overlay')) el.remove()
  })
}

function disposeMaterial(material: THREE.Material) {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) value.dispose()
  })
  material.dispose()
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return

    mesh.geometry?.dispose()
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach(disposeMaterial)
  })
}

function createVideoElement(src: string) {
  const video = document.createElement('video')
  video.src = src
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.setAttribute('webkit-playsinline', 'true')
  return video
}

function createButtonMesh(index: number) {
  const geometry = new THREE.CircleGeometry(0.08, 32)
  const material = new THREE.MeshBasicMaterial({
    color: [0x4ade80, 0x38bdf8, 0xfacc15][index] ?? 0xffffff,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(-0.24 + index * 0.24, -0.48, 0.02)
  return mesh
}

export async function createMindArV4Experience({
  container,
  assets,
  actions,
  onReady,
  onTargetFound,
  onTargetLost,
  onAction,
}: CreateMindArV4ExperienceOptions): Promise<MindArV4Experience> {
  const { MindARThree } = await import('mind-ar/dist/mindar-image-three.prod.js') as MindArThreeModule

  const mindarThree = new MindARThree({
    container,
    imageTargetSrc: assets.targetMind,
    maxTrack: 1,
    uiLoading: 'no',
    uiScanning: 'yes',
    uiError: 'no',
  })

  const { renderer, scene, camera } = mindarThree
  const anchor = mindarThree.addAnchor(0)
  anchor.onTargetFound = () => onTargetFound?.()
  anchor.onTargetLost = () => onTargetLost?.()

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(0, 1, 2)
  scene.add(ambientLight, directionalLight)

  const hitTargets: HitTarget[] = []

  let model: THREE.Group | undefined
  const loader = new GLTFLoader()
  loader.load(assets.model, (gltf) => {
    model = gltf.scene
    model.scale.set(0.004, 0.004, 0.004)
    model.position.set(0, -0.2, 0.1)
    anchor.group.add(model)
  })

  const video = createVideoElement(assets.videoMp4)
  const videoTexture = new THREE.VideoTexture(video)
  const videoPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.39),
    new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide })
  )
  videoPlane.position.set(0, 0.3, 0.02)
  anchor.group.add(videoPlane)
  hitTargets.push({ mesh: videoPlane, action: 'play-video' })

  actions.forEach((action, index) => {
    const button = createButtonMesh(index)
    anchor.group.add(button)
    hitTargets.push({ mesh: button, action: action.id })
  })

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  function handlePointerDown(event: PointerEvent) {
    const rect = container.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)

    const hits = raycaster.intersectObjects(hitTargets.map((target) => target.mesh), true)
    const hit = hits[0]
    if (!hit) return

    const found = hitTargets.find((target) => target.mesh === hit.object || target.mesh.children.includes(hit.object))
    if (!found) return

    if (found.action === 'play-video') {
      void video.play().catch(() => undefined)
    }
    onAction?.(found.action)
  }

  container.addEventListener('pointerdown', handlePointerDown)

  await mindarThree.start()
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera)
  })
  onReady?.()

  return {
    cleanup() {
      container.removeEventListener('pointerdown', handlePointerDown)
      renderer.setAnimationLoop(null)
      video.pause()
      videoTexture.dispose()
      disposeObject3D(videoPlane)
      hitTargets.forEach((target) => disposeObject3D(target.mesh))
      if (model) disposeObject3D(model)
      scene.remove(ambientLight, directionalLight)
      mindarThree.stop()
      cleanupMindArDom()
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test:run src/lib/ar-v4/createMindArV4Experience.test.ts
```

Expected: PASS. If jsdom logs `HTMLMediaElement's play() method` as not implemented, keep the `catch` and assert the callback behavior rather than media playback.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/lib/ar-v4/createMindArV4Experience.ts src/lib/ar-v4/createMindArV4Experience.test.ts
git commit -m "feat: add ar v4 scene interactions"
```

---

### Task 4: Add React Experience Wrapper

**Files:**
- Create: `src/components/ar-v4/ArV4Experience.tsx`
- Create: `src/components/ar-v4/ArV4Experience.test.tsx`

- [ ] **Step 1: Write the failing React wrapper test**

Create `src/components/ar-v4/ArV4Experience.test.tsx`:

```tsx
import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ArV4Experience } from './ArV4Experience'

const cleanupMock = vi.fn()
const createExperienceMock = vi.fn(async () => ({ cleanup: cleanupMock }))

vi.mock('../../lib/ar-v4/createMindArV4Experience', () => ({
  createMindArV4Experience: (...args: unknown[]) => createExperienceMock(...args),
}))

describe('ArV4Experience', () => {
  it('creates the runtime on mount and cleans it on unmount', async () => {
    const { container, unmount } = render(
      <ArV4Experience
        onReady={vi.fn()}
        onTargetFound={vi.fn()}
        onTargetLost={vi.fn()}
        onAction={vi.fn()}
        onError={vi.fn()}
      />
    )

    expect(container.firstChild).toHaveClass('absolute', 'inset-0')
    await waitFor(() => expect(createExperienceMock).toHaveBeenCalledOnce())

    unmount()

    expect(cleanupMock).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/components/ar-v4/ArV4Experience.test.tsx
```

Expected: FAIL because `ArV4Experience.tsx` does not exist.

- [ ] **Step 3: Add the wrapper component**

Create `src/components/ar-v4/ArV4Experience.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { AR_V4_ACTIONS, AR_V4_ASSETS } from '../../lib/ar-v4/assets'
import { createMindArV4Experience } from '../../lib/ar-v4/createMindArV4Experience'
import type { ArV4ActionId } from '../../lib/ar-v4/types'

type Props = {
  onReady: () => void
  onTargetFound: () => void
  onTargetLost: () => void
  onAction: (action: ArV4ActionId) => void
  onError: (error: unknown) => void
}

export function ArV4Experience({
  onReady,
  onTargetFound,
  onTargetLost,
  onAction,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callbacksRef = useRef({ onReady, onTargetFound, onTargetLost, onAction, onError })

  useEffect(() => {
    callbacksRef.current = { onReady, onTargetFound, onTargetLost, onAction, onError }
  }, [onReady, onTargetFound, onTargetLost, onAction, onError])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let disposed = false
    let cleanup: (() => void) | undefined

    createMindArV4Experience({
      container,
      assets: AR_V4_ASSETS,
      actions: AR_V4_ACTIONS,
      onReady: () => callbacksRef.current.onReady(),
      onTargetFound: () => callbacksRef.current.onTargetFound(),
      onTargetLost: () => callbacksRef.current.onTargetLost(),
      onAction: (action) => callbacksRef.current.onAction(action),
      onError: (error) => callbacksRef.current.onError(error),
    })
      .then((experience) => {
        if (disposed) {
          experience.cleanup()
          return
        }
        cleanup = experience.cleanup
      })
      .catch((error: unknown) => {
        if (!disposed) callbacksRef.current.onError(error)
      })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 ar-v4-container" />
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm test:run src/components/ar-v4/ArV4Experience.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/components/ar-v4/ArV4Experience.tsx src/components/ar-v4/ArV4Experience.test.tsx
git commit -m "feat: add ar v4 react experience wrapper"
```

---

### Task 5: Add V4 Page And Route

**Files:**
- Create: `src/pages/ArV4Page.tsx`
- Create: `src/pages/ArV4Page.test.tsx`
- Modify: `src/router.tsx`
- Modify: `src/pages/ArGuide.tsx`

- [ ] **Step 1: Write the failing page test**

Create `src/pages/ArV4Page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ArV4Page } from './ArV4Page'

let latestActionHandler: ((action: 'profile' | 'web' | 'play-video') => void) | undefined

vi.mock('../components/ar-v4/ArV4Experience', () => ({
  ArV4Experience: ({ onAction }: { onAction: (action: 'profile' | 'web' | 'play-video') => void }) => {
    latestActionHandler = onAction
    return <div data-testid="ar-v4-experience" />
  },
}))

describe('ArV4Page', () => {
  it('renders the V4 shell and updates the info panel from AR actions', async () => {
    render(
      <MemoryRouter>
        <ArV4Page />
      </MemoryRouter>
    )

    expect(screen.getByText('AR V4 實作頁')).toBeInTheDocument()
    expect(screen.getByTestId('ar-v4-experience')).toBeInTheDocument()

    latestActionHandler?.('profile')
    expect(await screen.findByText('AR, VR solutions and consultation')).toBeInTheDocument()

    latestActionHandler?.('web')
    expect(await screen.findByRole('link', { name: '開啟連結' })).toHaveAttribute('href', 'https://softmind.tech')
  })

  it('navigates back to the AR guide', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ArV4Page />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '← 返回 AR 首頁' }))

    expect(screen.getByRole('button', { name: '← 返回 AR 首頁' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm test:run src/pages/ArV4Page.test.tsx
```

Expected: FAIL because `ArV4Page.tsx` does not exist.

- [ ] **Step 3: Add the V4 page**

Create `src/pages/ArV4Page.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArV4Experience } from '../components/ar-v4/ArV4Experience'
import { AR_V4_ACTIONS } from '../lib/ar-v4/assets'
import type { ArV4ActionId, ArV4Status } from '../lib/ar-v4/types'

function getActionText(action: ArV4ActionId | null) {
  if (!action) return '對準 Logo 或示範卡片開始 AR V4 體驗。'
  return AR_V4_ACTIONS.find((item) => item.id === action)?.description ?? ''
}

export function ArV4Page() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ArV4Status>('initializing')
  const [selectedAction, setSelectedAction] = useState<ArV4ActionId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const actionText = getActionText(selectedAction)

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black text-white font-sans">
      <button
        type="button"
        onClick={() => navigate('/ar')}
        className="absolute top-4 left-4 z-50 text-sm opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-1 transition-opacity"
      >
        ← 返回 AR 首頁
      </button>

      <div className="absolute top-16 inset-x-0 z-40 px-4 text-center pointer-events-none">
        <h1 className="text-xl font-semibold tracking-tight">AR V4 實作頁</h1>
        <p className="mt-2 text-sm opacity-60">
          React + MindAR Three.js API 實作，保留 V3 作為 A-Frame 對照版。
        </p>
      </div>

      <ArV4Experience
        onReady={() => setStatus('scanning')}
        onTargetFound={() => setStatus('tracking')}
        onTargetLost={() => setStatus('lost')}
        onAction={(action) => setSelectedAction(action)}
        onError={(runtimeError) => {
          console.error('AR V4 runtime error', runtimeError)
          setStatus('error')
          setError('AR 初始化失敗，請確認相機權限與瀏覽器支援。')
        }}
      />

      <div className="absolute inset-x-4 bottom-6 z-50 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">{status}</p>
        <p className="mt-2 text-sm text-white/85">{error ?? actionText}</p>
        {selectedAction === 'web' ? (
          <a
            href="https://softmind.tech"
            className="mt-3 inline-flex text-sm font-medium text-cyan-300 underline underline-offset-4"
          >
            開啟連結
          </a>
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Register the route**

Modify `src/router.tsx`:

```tsx
import { createBrowserRouter } from 'react-router'
import { Landing } from './pages/Landing'
import { ArGuide } from './pages/ArGuide'
import { ArScanner } from './pages/ArScanner'
import { ArV2Page } from './pages/ArV2Page'
import { ArV3Page } from './pages/ArV3Page'
import { ArV4Page } from './pages/ArV4Page'
import { Quiz } from './pages/Quiz'
import { QuizResult } from './pages/QuizResult'

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/ar', element: <ArGuide /> },
  { path: '/ar/scanner', element: <ArScanner /> },
  { path: '/ar/v2', element: <ArV2Page /> },
  { path: '/ar/v3', element: <ArV3Page /> },
  { path: '/ar/v4', element: <ArV4Page /> },
  { path: '/quiz', element: <Quiz /> },
  { path: '/quiz/result/:type', element: <QuizResult /> },
  { path: '/product', element: <div style={{ color: '#fff', padding: '2rem' }}>Product page — Plan 3</div> },
])
```

- [ ] **Step 5: Add a V4 entry to the AR guide**

Modify `src/pages/ArGuide.tsx` by adding this secondary button immediately after the existing `開始體驗 AR` button:

```tsx
        <button
          onClick={() => navigate('/ar/v4')}
          className="w-full rounded-full border border-white/15 px-8 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 cursor-pointer"
        >
          AR V4：React + MindAR Three.js
        </button>
```

- [ ] **Step 6: Run page test to verify it passes**

Run:

```bash
pnpm test:run src/pages/ArV4Page.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/pages/ArV4Page.tsx src/pages/ArV4Page.test.tsx src/router.tsx src/pages/ArGuide.tsx
git commit -m "feat: add ar v4 route shell"
```

---

### Task 6: Final Verification

**Files:**
- Verify all files changed by Tasks 1-5.

- [ ] **Step 1: Run the full test suite**

Run:

```bash
pnpm test:run
```

Expected: all tests pass. Existing jsdom warnings about unimplemented media playback are acceptable only if assertions pass.

- [ ] **Step 2: Run the production build**

Run:

```bash
pnpm build
```

Expected: build completes successfully. Existing Vite chunk-size warnings from MindAR are acceptable only if the command exits 0.

- [ ] **Step 3: Inspect git state**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: only intended files are changed or the worktree is clean after the task commits.

- [ ] **Step 4: Manual browser verification**

Run:

```bash
pnpm dev
```

Open `https://localhost:3009/ar/v4` or the host URL printed by Vite. Confirm camera permission, target scanning, model render, button hit areas, video playback behavior, and route cleanup by leaving and returning to the page.

- [ ] **Step 5: Commit verification fixes if needed**

If final verification requires code fixes, commit them with a focused message. Stage only files from this V4 implementation scope:

```bash
git add src/lib/ar-v4 src/components/ar-v4 src/pages/ArV4Page.tsx src/pages/ArV4Page.test.tsx src/router.tsx src/pages/ArGuide.tsx
git commit -m "fix: stabilize ar v4 runtime verification"
```

If no fixes are required, do not create an empty commit.
