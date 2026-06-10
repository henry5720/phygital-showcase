# AR 模組遷移實作計畫：A-Frame → Three.js

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 AR 模組從 A-Frame CDN 架構遷移到 Three.js npm 架構，共用渲染管線，完整 TypeScript 支援

**Architecture:** imperative Three.js + MindARThree（npm），共享 loadGLB / loadHDR / setupRenderer 模組，AR Scanner 和 ModelViewer 共用渲染管線

**Tech Stack:** three@0.173, mind-ar@1.2.5, vitest, jsdom

---

## File Structure

### 新增檔案

| 檔案 | 職責 |
|------|------|
| `src/features/ar/shared/setupRenderer.ts` | 建立 WebGLRenderer + tone mapping + color space |
| `src/features/ar/shared/setupRenderer.test.ts` | 測試 renderer 設定 |
| `src/features/ar/shared/loadHDR.ts` | RGBELoader + PMREMGenerator |
| `src/features/ar/shared/loadHDR.test.ts` | 測試 HDR 載入 |
| `src/features/ar/shared/loadGLB.ts` | GLTFLoader + envMap 套用 |
| `src/features/ar/shared/loadGLB.test.ts` | 測試 GLB 載入 |
| `src/features/ar/scanner/MindARScene.tsx` | AR Scanner React component |
| `src/features/ar/scanner/MindARScene.test.tsx` | 測試 lifecycle |
| `src/features/ar/scanner/styles.css` | Scanning overlay 樣式 |
| `src/features/ar/viewer/ModelViewerScene.tsx` | 3D Model Viewer React component |
| `src/features/ar/viewer/ModelViewerScene.test.tsx` | 測試 lifecycle |

### 修改檔案

| 檔案 | 改動 |
|------|------|
| `src/pages/ModelViewer.tsx` | 改為薄 wrapper，用 ModelViewerScene |
| `src/features/ar/AGENTS.md` | 更新架構說明 |

### 刪除檔案

| 檔案 | 原因 |
|------|------|
| `src/features/ar/scene.html` | A-Frame HTML 字串，不再需要 |
| `src/features/ar/hdr-environment.js` | 自寫 RGBE parser，不再需要 |
| `src/features/ar/createArV5Island.ts` | CDN 腳本載入 + DOM island |
| `src/features/ar/createArV5Island.test.ts` | 配合刪除 |
| `src/features/ar/ar-v5-interactions.ts` | DOM querySelector 邏輯 |
| `src/features/ar/ar-v5-interactions.test.ts` | 配合刪除 |
| `src/features/ar/scene.test.ts` | 配合刪除 |
| `src/features/ar/MindARScene.tsx` | 舊版，由 scanner/ 取代 |
| `src/features/ar/MindARScene.test.tsx` | 配合刪除 |

---

### Task 1: Install dependencies

- [ ] **Step 1: Install three and mind-ar**

Run:
```bash
pnpm add three mind-ar
```

- [ ] **Step 2: Verify installation**

Run:
```bash
ls node_modules/three/package.json node_modules/mind-ar/package.json
```
Expected: both files exist

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
pnpm tsc -b --noEmit
```
Expected: no errors (or only pre-existing errors unrelated to three/mind-ar)

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add three and mind-ar npm dependencies"
```

---

### Task 2: Create shared/setupRenderer.ts

**Files:**
- Create: `src/features/ar/shared/setupRenderer.ts`
- Create: `src/features/ar/shared/setupRenderer.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/ar/shared/setupRenderer.test.ts
import { setupRenderer } from './setupRenderer'
import * as THREE from 'three'

vi.mock('three', () => {
  const mockRenderer = {
    toneMapping: 0,
    outputColorSpace: '',
    pixelRatio: 1,
    sortObjects: false,
    dispose: vi.fn(),
    domElement: document.createElement('canvas'),
    setAnimationLoop: vi.fn(),
    render: vi.fn(),
    setSize: vi.fn(),
  }
  return {
    WebGLRenderer: vi.fn(() => mockRenderer),
    ACESFilmicToneMapping: 4,
    SRGBColorSpace: 'srgb',
  }
})

describe('setupRenderer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a WebGLRenderer with correct defaults', () => {
    const { renderer } = setupRenderer(document.createElement('div'))

    expect(renderer).toBeDefined()
    expect(renderer.toneMapping).toBe(4) // ACESFilmicToneMapping
    expect(renderer.outputColorSpace).toBe('srgb')
    expect(renderer.sortObjects).toBe(true)
  })

  it('accepts custom alpha option', () => {
    const container = document.createElement('div')
    const { renderer } = setupRenderer(container, { alpha: false })

    expect(renderer).toBeDefined()
  })

  it('returns a dispose function that cleans up', () => {
    const container = document.createElement('div')
    const { dispose } = setupRenderer(container)

    dispose()
    // No assertion needed — just verify it doesn't throw
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm vitest run src/features/ar/shared/setupRenderer.test.ts
```
Expected: FAIL — `setupRenderer` not found

- [ ] **Step 3: Write implementation**

```typescript
// src/features/ar/shared/setupRenderer.ts
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

  container.appendChild(renderer.domElement)

  const dispose = () => {
    renderer.setAnimationLoop(null)
    renderer.dispose()
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }

  return { renderer, dispose }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm vitest run src/features/ar/shared/setupRenderer.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/ar/shared/setupRenderer.ts src/features/ar/shared/setupRenderer.test.ts
git commit -m "feat(ar): add setupRenderer shared module"
```

---

### Task 3: Create shared/loadHDR.ts

**Files:**
- Create: `src/features/ar/shared/loadHDR.ts`
- Create: `src/features/ar/shared/loadHDR.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/ar/shared/loadHDR.test.ts
import { loadHDR } from './loadHDR'
import * as THREE from 'three'

const mockTexture = {
  mapping: 0,
  colorSpace: '',
  needsUpdate: false,
  dispose: vi.fn(),
}

vi.mock('three', () => {
  const RGBELoaderInstance = {
    load: vi.fn((_url: string, onLoad: (texture: typeof mockTexture) => void) => {
      onLoad(mockTexture)
    }),
  }
  const PMREMGeneratorInstance = {
    fromEquirectangular: vi.fn(() => mockTexture),
    dispose: vi.fn(),
  }
  return {
    RGBELoader: vi.fn(() => RGBELoaderInstance),
    PMREMGenerator: vi.fn(() => PMREMGeneratorInstance),
    EquirectangularReflectionMapping: 301,
    SRGBColorSpace: 'srgb',
  }
})

describe('loadHDR', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads an HDR file and returns a texture', async () => {
    const mockRenderer = { domElement: document.createElement('canvas') } as unknown as THREE.WebGLRenderer
    const texture = await loadHDR('/assets/web-ar/env.hdr', mockRenderer)

    expect(texture).toBeDefined()
    expect(texture.mapping).toBe(301) // EquirectangularReflectionMapping
  })

  it('sets texture.mapping to EquirectangularReflectionMapping', async () => {
    const mockRenderer = { domElement: document.createElement('canvas') } as unknown as THREE.WebGLRenderer
    const texture = await loadHDR('/test.hdr', mockRenderer)

    expect(texture.mapping).toBe(301)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm vitest run src/features/ar/shared/loadHDR.test.ts
```
Expected: FAIL — `loadHDR` not found

- [ ] **Step 3: Write implementation**

```typescript
// src/features/ar/shared/loadHDR.ts
import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

export async function loadHDR(
  url: string,
  renderer: THREE.WebGLRenderer,
): Promise<THREE.Texture> {
  const pmremGenerator = new PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  const loader = new RGBELoader()
  const texture = await new Promise<THREE.Texture>((resolve, reject) => {
    loader.load(
      url,
      (loadedTexture) => {
        loadedTexture.mapping = THREE.EquirectangularReflectionMapping
        resolve(loadedTexture)
      },
      undefined,
      (error) => reject(error),
    )
  })

  const envMap = pmremGenerator.fromEquirectangular(texture).texture
  pmremGenerator.dispose()
  texture.dispose()

  return envMap
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm vitest run src/features/ar/shared/loadHDR.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/ar/shared/loadHDR.ts src/features/ar/shared/loadHDR.test.ts
git commit -m "feat(ar): add loadHDR shared module"
```

---

### Task 4: Create shared/loadGLB.ts

**Files:**
- Create: `src/features/ar/shared/loadGLB.ts`
- Create: `src/features/ar/shared/loadGLB.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/ar/shared/loadGLB.test.ts
import { loadGLB } from './loadGLB'
import * as THREE from 'three'

const mockScene = new THREE.Group()
const mockGltf = { scene: mockScene }

vi.mock('three', () => {
  const GLTFLoaderInstance = {
    load: vi.fn((_url: string, onLoad: (gltf: typeof mockGltf) => void) => {
      onLoad(mockGltf)
    }),
  }
  return {
    GLTFLoader: vi.fn(() => GLTFLoaderInstance),
  }
})

describe('loadGLB', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads a GLB file and returns the scene group', async () => {
    const model = await loadGLB('/assets/web-ar/fizzt.glb')

    expect(model).toBeDefined()
    expect(model).toBe(mockScene)
  })

  it('accepts optional envMap parameter', async () => {
    const mockEnvMap = {} as THREE.Texture
    const model = await loadGLB('/assets/web-ar/fizzt.glb', mockEnvMap)

    expect(model).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm vitest run src/features/ar/shared/loadGLB.test.ts
```
Expected: FAIL — `loadGLB` not found

- [ ] **Step 3: Write implementation**

```typescript
// src/features/ar/shared/loadGLB.ts
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export async function loadGLB(
  url: string,
  envMap?: THREE.Texture,
): Promise<THREE.Group> {
  const loader = new GLTFLoader()
  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf),
      undefined,
      (error) => reject(error),
    )
  })

  if (envMap) {
    gltf.scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh
        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          for (const material of materials) {
            if ('envMap' in material) {
              ;(material as THREE.MeshStandardMaterial).envMap = envMap
              material.needsUpdate = true
            }
          }
        }
      }
    })
  }

  return gltf.scene
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm vitest run src/features/ar/shared/loadGLB.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/ar/shared/loadGLB.ts src/features/ar/shared/loadGLB.test.ts
git commit -m "feat(ar): add loadGLB shared module"
```

---

### Task 5: Create viewer/ModelViewerScene.tsx

**Files:**
- Create: `src/features/ar/viewer/ModelViewerScene.tsx`
- Create: `src/features/ar/viewer/ModelViewerScene.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/ar/viewer/ModelViewerScene.test.tsx
import { render, cleanup } from '@testing-library/react'
import { ModelViewerScene } from './ModelViewerScene'

vi.mock('../shared/setupRenderer', () => ({
  setupRenderer: vi.fn(() => ({
    renderer: {
      setAnimationLoop: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
    },
    dispose: vi.fn(),
  })),
}))

vi.mock('../shared/loadHDR', () => ({
  loadHDR: vi.fn(() => Promise.resolve({})),
}))

vi.mock('../shared/loadGLB', () => ({
  loadGLB: vi.fn(() => Promise.resolve(new (window as any).THREE?.Group?.() ?? {})),
}))

vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn(() => ({
    enableDamping: true,
    dispose: vi.fn(),
    update: vi.fn(),
    target: { set: vi.fn() },
  })),
}))

describe('ModelViewerScene', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a container div', () => {
    const { container } = render(<ModelViewerScene />)
    expect(container.firstChild).toBeDefined()
  })

  it('calls onError when initialization fails', async () => {
    const { loadHDR } = await import('../shared/loadHDR')
    vi.mocked(loadHDR).mockRejectedValueOnce(new Error('HDR load failed'))

    const onError = vi.fn()
    render(<ModelViewerScene onError={onError} />)

    // Wait for async error
    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm vitest run src/features/ar/viewer/ModelViewerScene.test.tsx
```
Expected: FAIL — `ModelViewerScene` not found

- [ ] **Step 3: Write implementation**

```typescript
// src/features/ar/viewer/ModelViewerScene.tsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { setupRenderer } from '../shared/setupRenderer'
import { loadHDR } from '../shared/loadHDR'
import { loadGLB } from '../shared/loadGLB'

export type ModelViewerSceneProps = {
  onError?: (error: unknown) => void
}

export function ModelViewerScene({ onError }: ModelViewerSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cleanupRenderer: (() => void) | null = null
    let animationId: number | null = null
    let controls: OrbitControls | null = null
    let cancelled = false

    async function init() {
      const { renderer, dispose } = setupRenderer(container, { alpha: false })
      cleanupRenderer = dispose

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(
        50,
        container.clientWidth / container.clientHeight,
        0.1,
        1000,
      )

      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true

      const envMap = await loadHDR('/assets/web-ar/env.hdr', renderer)
      if (cancelled) return

      scene.environment = envMap
      scene.background = envMap

      const model = await loadGLB('/assets/web-ar/fizzt.glb', envMap)
      if (cancelled) return

      scene.add(model)

      // Fit camera to model bounding box
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)
      const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.5

      camera.position.set(center.x, center.y, center.z + cameraZ)
      controls.target.copy(center)
      controls.update()

      renderer.setSize(container.clientWidth, container.clientHeight)

      renderer.setAnimationLoop(() => {
        controls?.update()
        renderer.render(scene, camera)
      })
    }

    init().catch((error) => {
      if (!cancelled) onError?.(error)
    })

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return
      const canvas = container.querySelector('canvas')
      if (canvas) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    })
    resizeObserver.observe(container)

    return () => {
      cancelled = true
      if (animationId !== null) cancelAnimationFrame(animationId)
      controls?.dispose()
      cleanupRenderer?.()
      resizeObserver.disconnect()
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
pnpm vitest run src/features/ar/viewer/ModelViewerScene.test.tsx
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/ar/viewer/ModelViewerScene.tsx src/features/ar/viewer/ModelViewerScene.test.tsx
git commit -m "feat(ar): add ModelViewerScene component"
```

---

### Task 6: Update ModelViewer.tsx page

**Files:**
- Modify: `src/pages/ModelViewer.tsx`

- [ ] **Step 1: Read current file**

Run:
```bash
cat src/pages/ModelViewer.tsx
```

- [ ] **Step 2: Rewrite as thin wrapper**

```typescript
// src/pages/ModelViewer.tsx
import { useState } from 'react'
import { ModelViewerScene } from '@/features/ar/viewer/ModelViewerScene'

export function ModelViewer() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="min-h-dvh bg-background">
      {error ? (
        <div className="flex items-center justify-center h-dvh">
          <p className="text-red-500">Failed to load 3D model: {error}</p>
        </div>
      ) : (
        <ModelViewerScene onError={(err) => setError(err instanceof Error ? err.message : String(err))} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
pnpm tsc -b --noEmit
```
Expected: no errors from ModelViewer.tsx

- [ ] **Step 4: Commit**

```bash
git add src/pages/ModelViewer.tsx
git commit -m "refactor(pages): rewrite ModelViewer as thin wrapper"
```

---

### Task 7: Create scanner/MindARScene.tsx

**Files:**
- Create: `src/features/ar/scanner/MindARScene.tsx`
- Create: `src/features/ar/scanner/MindARScene.test.tsx`
- Create: `src/features/ar/scanner/styles.css`

- [ ] **Step 1: Copy styles.css from existing**

Run:
```bash
cp src/features/ar/styles.css src/features/ar/scanner/styles.css
```

- [ ] **Step 2: Write the failing test**

```typescript
// src/features/ar/scanner/MindARScene.test.tsx
import { render, cleanup } from '@testing-library/react'
import { MindARScene } from './MindARScene'

vi.mock('../shared/setupRenderer', () => ({
  setupRenderer: vi.fn(() => ({
    renderer: {
      setAnimationLoop: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
    },
    dispose: vi.fn(),
  })),
}))

vi.mock('../shared/loadHDR', () => ({
  loadHDR: vi.fn(() => Promise.resolve({})),
}))

vi.mock('../shared/loadGLB', () => ({
  loadGLB: vi.fn(() => Promise.resolve({})),
}))

vi.mock('mind-ar/dist/mindar-image-three.prod.js', () => ({
  MindARThree: vi.fn(() => ({
    renderer: { setAnimationLoop: vi.fn(), render: vi.fn(), dispose: vi.fn(), domElement: document.createElement('canvas'), setSize: vi.fn() },
    scene: new (window as any).THREE?.Scene?.() ?? {},
    camera: {},
    addAnchor: vi.fn(() => ({ group: { add: vi.fn() } })),
    start: vi.fn(),
    stop: vi.fn(),
  })),
}))

describe('MindARScene', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a container div', () => {
    const { container } = render(<MindARScene />)
    expect(container.firstChild).toBeDefined()
  })

  it('calls onReady after initialization', async () => {
    const onReady = vi.fn()
    render(<MindARScene onReady={onReady} />)

    await vi.waitFor(() => {
      expect(onReady).toHaveBeenCalled()
    })
  })

  it('calls onError when initialization fails', async () => {
    const { loadHDR } = await import('../shared/loadHDR')
    vi.mocked(loadHDR).mockRejectedValueOnce(new Error('HDR failed'))

    const onError = vi.fn()
    render(<MindARScene onError={onError} />)

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
pnpm vitest run src/features/ar/scanner/MindARScene.test.tsx
```
Expected: FAIL — `MindARScene` not found

- [ ] **Step 4: Write implementation**

```typescript
// src/features/ar/scanner/MindARScene.tsx
import { useEffect, useEffectEvent, useRef } from 'react'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import { setupRenderer } from '../shared/setupRenderer'
import { loadHDR } from '../shared/loadHDR'
import { loadGLB } from '../shared/loadGLB'

export type MindARSceneProps = {
  onReady?: () => void
  onTargetFound?: () => void
  onTargetLost?: () => void
  onError?: (error: unknown) => void
  navigate?: (url: string) => void
}

export function MindARScene({
  onReady,
  onTargetFound,
  onTargetLost,
  onError,
}: MindARSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleReady = useEffectEvent(() => onReady?.())
  const handleTargetFound = useEffectEvent(() => onTargetFound?.())
  const handleTargetLost = useEffectEvent(() => onTargetLost?.())
  const handleError = useEffectEvent((error: unknown) => onError?.(error))

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cleanupRenderer: (() => void) | null = null
    let mindar: InstanceType<typeof MindARThree> | null = null
    let cancelled = false

    async function init() {
      const { renderer, dispose } = setupRenderer(container, { alpha: true })
      cleanupRenderer = dispose

      mindar = new MindARThree({
        container,
        imageTargetSrc: '/assets/web-ar/card.mind',
      })

      const { scene } = mindar
      const anchor = mindar.addAnchor(0)

      const envMap = await loadHDR('/assets/web-ar/env.hdr', renderer)
      if (cancelled) return

      scene.environment = envMap

      const model = await loadGLB('/assets/web-ar/fizzt.glb', envMap)
      if (cancelled) return

      anchor.group.add(model)

      mindar.onTargetFound = () => handleTargetFound()
      mindar.onTargetLost = () => handleTargetLost()

      await mindar.start()
      if (cancelled) return

      renderer.setAnimationLoop(() => {
        renderer.render(scene, mindar!.camera)
      })

      handleReady()
    }

    init().catch((error) => {
      if (!cancelled) handleError(error)
    })

    return () => {
      cancelled = true
      mindar?.stop()
      cleanupRenderer?.()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0 ar-container" />
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
pnpm vitest run src/features/ar/scanner/MindARScene.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/ar/scanner/MindARScene.tsx src/features/ar/scanner/MindARScene.test.tsx src/features/ar/scanner/styles.css
git commit -m "feat(ar): add MindARScene scanner component"
```

---

### Task 8: Delete old files and clean up

**Files:**
- Delete: `src/features/ar/scene.html`
- Delete: `src/features/ar/hdr-environment.js`
- Delete: `src/features/ar/createArV5Island.ts`
- Delete: `src/features/ar/createArV5Island.test.ts`
- Delete: `src/features/ar/ar-v5-interactions.ts`
- Delete: `src/features/ar/ar-v5-interactions.test.ts`
- Delete: `src/features/ar/scene.test.ts`
- Delete: `src/features/ar/MindARScene.tsx`
- Delete: `src/features/ar/MindARScene.test.tsx`
- Delete: `src/features/ar/styles.css`

- [ ] **Step 1: Delete old files**

Run:
```bash
rm src/features/ar/scene.html
rm src/features/ar/hdr-environment.js
rm src/features/ar/createArV5Island.ts
rm src/features/ar/createArV5Island.test.ts
rm src/features/ar/ar-v5-interactions.ts
rm src/features/ar/ar-v5-interactions.test.ts
rm src/features/ar/scene.test.ts
rm src/features/ar/MindARScene.tsx
rm src/features/ar/MindARScene.test.tsx
rm src/features/ar/styles.css
```

- [ ] **Step 2: Verify no remaining imports of deleted files**

Run:
```bash
grep -r "createArV5Island\|ar-v5-interactions\|scene\.html\|hdr-environment" src/ --include="*.ts" --include="*.tsx" --include="*.js"
```
Expected: no matches

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
pnpm tsc -b --noEmit
```
Expected: no errors from deleted files

- [ ] **Step 4: Verify lint**

Run:
```bash
pnpm lint
```
Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add -A src/features/ar/
git commit -m "refactor(ar): remove A-Frame scene, CDN loaders, and DOM island code"
```

---

### Task 9: Update AGENTS.md

**Files:**
- Modify: `src/features/ar/AGENTS.md`

- [ ] **Step 1: Rewrite AGENTS.md**

```markdown
# AR Module AGENTS.md

## 概覽

Three.js + MindAR 的 WebAR 體驗，使用 npm 依賴。AR Scanner 和 ModelViewer 共用 Three.js 渲染管線。

## 核心檔案

### `shared/` — AR + ModelViewer 共用模組

| 檔案 | 職責 |
|------|------|
| `setupRenderer.ts` | 建立 WebGLRenderer，設定 tone mapping + color space |
| `loadHDR.ts` | RGBELoader + PMREMGenerator，載入 HDR 環境貼圖 |
| `loadGLB.ts` | GLTFLoader，載入 GLB 模型 |

### `scanner/` — AR 掃描功能

| 檔案 | 職責 |
|------|------|
| `MindARScene.tsx` | AR Scanner React component（MindARThree + Three.js） |
| `styles.css` | Scanning overlay 樣式 |

### `viewer/` — 3D 模型檢視功能

| 檔案 | 職責 |
|------|------|
| `ModelViewerScene.tsx` | 3D Model Viewer React component（Three.js + OrbitControls） |

## 依賴

| 套件 | 版本 | 用途 |
|------|------|------|
| three | ^0.173 | 3D 渲染引擎 |
| mind-ar | ^1.2.5 | AR image tracking（Three.js integration） |

## 架構決策

- **全部走 npm** — 不再 CDN 載入 A-Frame 或 Three.js
- **imperative Three.js** — 不用 R3F，直接操作 Three.js API
- **共用模組** — loadGLB、loadHDR、setupRenderer 被 scanner 和 viewer 共用
- **MindARThree** — 使用 MindAR 的 Three.js integration（不是 A-Frame integration）
- **Phase 2** — 互動邏輯（portfolio、buttons、video）之後處理

## 素材

- GLB 模型：`public/assets/web-ar/fizzt.glb`
- MindAR 特徵檔：`public/assets/web-ar/card.mind`
- HDR 環境貼圖：`public/assets/web-ar/env.hdr`

## 測試

- vitest + jsdom + @testing-library/react
- Mock strategy：mock `three`、`mind-ar`、`../shared/*`
- Lifecycle tests：mount → init, unmount → cleanup

## 注意事項

- Scanner 使用 `alpha: true`（相機穿透）
- ModelViewer 使用 `alpha: false`（不透明背景）
- ModelViewer 顯示 HDR 為背景，Scanner 不顯示
- `MindARScene.tsx` 的 props 介面保持與舊版相同，ArScanner.tsx 頁面不需要改動
```

- [ ] **Step 2: Commit**

```bash
git add src/features/ar/AGENTS.md
git commit -m "docs(ar): update AGENTS.md for Three.js architecture"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run full test suite**

Run:
```bash
pnpm test:run
```
Expected: only pre-existing failures (ar-v5-interactions.test.ts, createArV5Island.test.ts, scene.test.ts should no longer exist)

- [ ] **Step 2: Run lint**

Run:
```bash
pnpm lint
```
Expected: no new errors

- [ ] **Step 3: Run typecheck**

Run:
```bash
pnpm tsc -b --noEmit
```
Expected: no errors

- [ ] **Step 4: Run dev server and verify**

Run:
```bash
pnpm dev
```
Expected: dev server starts, navigate to `/3d-model` and `/ar` to verify

- [ ] **Step 5: Final commit (if needed)**

```bash
git add -A
git commit -m "chore: final cleanup for AR migration"
```
