# Web AR Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `src/features/ar` the only Web AR implementation and move its runtime assets to `/public/assets/web-ar/`.

**Architecture:** Keep the existing v5 DOM island implementation. A-Frame and MindAR continue to load runtime assets by absolute public URLs from raw `scene.html`. Remove legacy v2/v3/v4 code and assets after router references are removed.

**Tech Stack:** React 19, React Router, Vite raw HTML imports, A-Frame, MindAR, Vitest, public static assets.

---

## File Structure

- Create: `public/assets/web-ar/`
  - Owns the only Web AR runtime assets.
- Modify: `src/features/ar/scene.html`
  - Updates A-Frame/MindAR asset URLs from `/assets/ar-v3/...` to `/assets/web-ar/...`.
- Modify: `src/router.tsx`
  - Removes legacy `/ar/v2`, `/ar/v3`, and `/ar/v4` routes.
- Modify: `src/features/ar/createArV5Island.ts`
  - Removes temporary debug/audit logging that is not needed for the production-only Web AR path.
- Modify or create tests under `src/features/ar/`
  - Verifies v5 scene uses `/assets/web-ar/` and no old versioned AR asset path remains in the active scene.
- Delete legacy source files:
  - `src/components/ArV2Scene.tsx`
  - `src/components/ArV2Scene.test.tsx`
  - `src/components/ArV3Scene.tsx`
  - `src/components/ArV3Scene.test.tsx`
  - `src/components/ar-v4/ArV4Experience.tsx`
  - `src/components/ar-v4/ArV4Experience.test.tsx`
  - `src/pages/ArV2Page.tsx`
  - `src/pages/ArV2Page.test.tsx`
  - `src/pages/ArV3Page.tsx`
  - `src/pages/ArV4Page.tsx`
  - `src/pages/ArV4Page.test.tsx`
  - `src/lib/ar-v2.ts`
  - `src/lib/ar-v2.test.ts`
  - `src/lib/ar-v3.ts`
  - `src/lib/ar-v3.test.ts`
  - `src/lib/ar-v4/assets.ts`
  - `src/lib/ar-v4/assets.test.ts`
  - `src/lib/ar-v4/createMindArV4Experience.ts`
  - `src/lib/ar-v4/createMindArV4Experience.test.ts`
  - `src/lib/ar-v4/types.ts`
- Delete legacy public asset directories:
  - `public/assets/ar-v2/`
  - `public/assets/ar-v3/`

No git commits should be made unless the user explicitly asks for them.

---

### Task 1: Create The Web AR Asset Directory

**Files:**
- Create: `public/assets/web-ar/card.png`
- Create: `public/assets/web-ar/card.mind`
- Create: `public/assets/web-ar/icons/*`
- Create: `public/assets/web-ar/portfolio/*`
- Create: `public/assets/web-ar/softmind/*`

- [ ] **Step 1: Verify source directories exist**

Run:

```bash
ls "/home/henry/code/fizzt/mind-ar-js-doc/static/samples/assets/card-example"
ls "/home/henry/code/fizzt/phygital-showcase/public/assets/ar-v3/targets"
ls "/home/henry/code/fizzt/phygital-showcase/public/assets/ar-v3/models/softmind"
```

Expected: first command lists `card.png`, `icons`, and `portfolio`; second lists `card.mind`; third lists `scene.gltf`, `scene.bin`, and `textures`.

- [ ] **Step 2: Create destination directory**

Run:

```bash
mkdir -p "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar"
```

Expected: command exits successfully.

- [ ] **Step 3: Copy official sample images, icons, and portfolio media**

Run:

```bash
cp "/home/henry/code/fizzt/mind-ar-js-doc/static/samples/assets/card-example/card.png" "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar/card.png"
cp -R "/home/henry/code/fizzt/mind-ar-js-doc/static/samples/assets/card-example/icons" "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar/icons"
cp -R "/home/henry/code/fizzt/mind-ar-js-doc/static/samples/assets/card-example/portfolio" "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar/portfolio"
```

Expected: command exits successfully.

- [ ] **Step 4: Copy local compiled target and model assets**

Run:

```bash
cp "/home/henry/code/fizzt/phygital-showcase/public/assets/ar-v3/targets/card.mind" "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar/card.mind"
cp -R "/home/henry/code/fizzt/phygital-showcase/public/assets/ar-v3/models/softmind" "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar/softmind"
```

Expected: command exits successfully.

- [ ] **Step 5: Verify destination structure**

Run:

```bash
ls "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar"
ls "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar/icons"
ls "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar/portfolio"
ls "/home/henry/code/fizzt/phygital-showcase/public/assets/web-ar/softmind"
```

Expected: root lists `card.png`, `card.mind`, `icons`, `portfolio`, and `softmind`; nested folders list their copied files.

---

### Task 2: Update The Active Scene Asset URLs Test-First

**Files:**
- Create or modify: `src/features/ar/scene.test.ts`
- Modify: `src/features/ar/scene.html`

- [ ] **Step 1: Write the failing scene asset path test**

Create `src/features/ar/scene.test.ts` with:

```ts
import { describe, expect, it } from 'vitest'
import sceneHtml from './scene.html?raw'

describe('AR scene asset paths', () => {
  it('uses the versionless web-ar asset root', () => {
    expect(sceneHtml).toContain('/assets/web-ar/card.png')
    expect(sceneHtml).toContain('/assets/web-ar/card.mind')
    expect(sceneHtml).toContain('/assets/web-ar/icons/web.png')
    expect(sceneHtml).toContain('/assets/web-ar/portfolio/paintandquest.mp4')
    expect(sceneHtml).toContain('/assets/web-ar/portfolio/paintandquest.webm')
    expect(sceneHtml).toContain('/assets/web-ar/softmind/scene.gltf')
  })

  it('does not reference legacy versioned AR asset roots', () => {
    expect(sceneHtml).not.toContain('/assets/ar-v2/')
    expect(sceneHtml).not.toContain('/assets/ar-v3/')
    expect(sceneHtml).not.toContain('/assets/ar-v4/')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm vitest run src/features/ar/scene.test.ts
```

Expected: FAIL because `scene.html` still references `/assets/ar-v3/`.

- [ ] **Step 3: Update `src/features/ar/scene.html` paths**

Change these URLs:

```html
/assets/ar-v3/targets/card.png -> /assets/web-ar/card.png
/assets/ar-v3/targets/card.mind -> /assets/web-ar/card.mind
/assets/ar-v3/icons/web.png -> /assets/web-ar/icons/web.png
/assets/ar-v3/icons/email.png -> /assets/web-ar/icons/email.png
/assets/ar-v3/icons/profile.png -> /assets/web-ar/icons/profile.png
/assets/ar-v3/icons/location.png -> /assets/web-ar/icons/location.png
/assets/ar-v3/icons/left.png -> /assets/web-ar/icons/left.png
/assets/ar-v3/icons/right.png -> /assets/web-ar/icons/right.png
/assets/ar-v3/portfolio/paintandquest-preview.png -> /assets/web-ar/portfolio/paintandquest-preview.png
/assets/ar-v3/portfolio/paintandquest.mp4 -> /assets/web-ar/portfolio/paintandquest.mp4
/assets/ar-v3/portfolio/paintandquest.webm -> /assets/web-ar/portfolio/paintandquest.webm
/assets/ar-v3/portfolio/coffeemachine-preview.png -> /assets/web-ar/portfolio/coffeemachine-preview.png
/assets/ar-v3/portfolio/peak-preview.png -> /assets/web-ar/portfolio/peak-preview.png
/assets/ar-v3/models/softmind/scene.gltf -> /assets/web-ar/softmind/scene.gltf
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm vitest run src/features/ar/scene.test.ts
```

Expected: PASS.

---

### Task 3: Remove Legacy Routes And Source Files

**Files:**
- Modify: `src/router.tsx`
- Delete: legacy v2/v3/v4 files listed in File Structure.

- [ ] **Step 1: Update router test coverage if needed**

Search for route tests:

```bash
rg "(/ar/v2|/ar/v3|/ar/v4|/product-ar)" src -g '*.{test.ts,test.tsx,ts,tsx}'
```

Expected: output includes `src/router.tsx` and legacy files. If no router test exists, no new router test is needed for this cleanup because build verifies imports and route objects.

- [ ] **Step 2: Remove legacy route imports and route entries**

Edit `src/router.tsx` so it keeps `ProductARPage` and removes `ArV2Page`, `ArV3Page`, and `ArV4Page` imports and routes. The resulting route section should include:

```tsx
import { ProductARPage } from './pages/ProductARPage'

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/quiz', element: <Quiz /> },
  { path: '/result', element: <QuizResult /> },
  { path: '/ar', element: <ArScanner /> },
  { path: '/product-ar', element: <ProductARPage /> },
])
```

- [ ] **Step 3: Delete legacy v2/v3/v4 source and test files**

Delete the exact files listed in File Structure. Keep `src/features/ar/*` and `src/pages/ProductARPage.tsx`.

- [ ] **Step 4: Verify no legacy source references remain**

Run:

```bash
rg "ArV2|ArV3|ArV4|ar-v2|ar-v3|ar-v4|/ar/v2|/ar/v3|/ar/v4" src
```

Expected: no output.

---

### Task 4: Remove Temporary v5 Debug Logging

**Files:**
- Modify: `src/features/ar/createArV5Island.ts`

- [ ] **Step 1: Remove debug-only console logs and DOM audit callbacks**

In `src/features/ar/createArV5Island.ts`, remove:

```ts
console.log('[AR-V5] startMindARSystem arSystem:', !!arSystem, 'start:', !!arSystem?.start)
console.log('[AR-V5] stopMindARSystem arSystem:', !!arSystem, 'stop:', !!arSystem?.stop)
console.log('[AR-V5] loading scripts...')
console.log('[AR-V5] scripts loaded')
console.log('[AR-V5] waiting for scene loaded...')
console.log('[AR-V5] scene loaded timeout, using fallback')
console.log('[AR-V5] scene ready')
```

Also remove the `enforceCameraVideoVisibility` and `auditDom` functions plus their `setTimeout` calls.

- [ ] **Step 2: Keep functional behavior unchanged**

After the edit, `createArV5Island` should still:

```ts
await loadArV5Scripts()
registerArV5Components()
styleEl = injectArV5Scene(container)
sceneEl = await Promise.race([loadPromise, timeoutPromise])
startMindARSystem(sceneEl)
interactionCleanup = initArV5Experience(document, { navigate: callbacks.navigate })
callbacks.onReady?.()
```

Expected: no behavior changes besides removing debug output.

---

### Task 5: Remove Legacy Public Assets

**Files:**
- Delete: `public/assets/ar-v2/`
- Delete: `public/assets/ar-v3/`

- [ ] **Step 1: Verify active code no longer references legacy public paths**

Run:

```bash
rg "/assets/ar-v2/|/assets/ar-v3/|/assets/ar-v4/" src docs -g '*.{ts,tsx,html,css,md}'
```

Expected: only old historical docs may appear. Active `src` files should have no output.

- [ ] **Step 2: Delete legacy asset directories**

Run:

```bash
rm -rf "/home/henry/code/fizzt/phygital-showcase/public/assets/ar-v2" "/home/henry/code/fizzt/phygital-showcase/public/assets/ar-v3"
```

Expected: command exits successfully.

- [ ] **Step 3: Verify public asset directories**

Run:

```bash
ls "/home/henry/code/fizzt/phygital-showcase/public/assets"
```

Expected: output includes `web-ar` and `fizzt`; output does not include `ar-v2` or `ar-v3`.

---

### Task 6: Update Documentation References

**Files:**
- Modify: `docs/superpowers/plans/2026-06-06-ar-v5-dom-island.md`
- Modify: any active docs that mention v5 reusing `/assets/ar-v3/`.

- [ ] **Step 1: Find stale docs references**

Run:

```bash
rg "assets/ar-v3|ar-v3 assets|復用 `/public/assets/ar-v3/`|复用 `/public/assets/ar-v3/`" docs -g '*.md'
```

Expected: output includes the old v5 DOM island plan.

- [ ] **Step 2: Update stale v5 asset wording**

Replace wording that says v5 reuses `/public/assets/ar-v3/` with:

```md
**素材：** Web AR runtime assets live under `/public/assets/web-ar/`.
```

If a historical doc intentionally describes an earlier state, add a short note instead of rewriting history:

```md
> Current Web AR runtime assets now live under `/public/assets/web-ar/`.
```

---

### Task 7: Full Verification

**Files:**
- No direct file edits unless verification finds a real issue.

- [ ] **Step 1: Run targeted AR tests**

Run:

```bash
pnpm vitest run src/features/ar
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
pnpm test:run
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
pnpm build
```

Expected: TypeScript and Vite build both complete successfully.

- [ ] **Step 4: Verify remaining AR asset references**

Run:

```bash
rg "/assets/(ar-v2|ar-v3|ar-v4)/|ArV2|ArV3|ArV4|ar-v2|ar-v3|ar-v4" src public docs/superpowers/specs/2026-06-07-web-ar-assets-design.md docs/superpowers/plans/2026-06-07-web-ar-assets.md
```

Expected: no active source references. The current spec and this plan may mention old paths only as historical source inputs or removal targets.

- [ ] **Step 5: Inspect git status**

Run:

```bash
git status --short
```

Expected: shows only intended changes from this Web AR asset cleanup.

---

## Self-Review

- Spec coverage: asset path, source asset provenance, active scene URL updates, old version removal, docs update, and verification are covered by Tasks 1-7.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: active implementation names remain `MindARScene`, `createArV5Island`, and `initArV5Experience`; asset root is consistently `/assets/web-ar/`.
