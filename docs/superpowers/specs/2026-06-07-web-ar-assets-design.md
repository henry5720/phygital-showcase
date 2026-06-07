# Web AR Assets Design

## Goal

Make the current v5 Web AR implementation the only Web AR version and move its runtime assets to a stable, versionless public path.

## Decisions

- The only supported Web AR code path is `src/features/ar`.
- Runtime assets live under `public/assets/web-ar/`.
- Asset URLs used by A-Frame and MindAR use absolute public paths such as `/assets/web-ar/card.mind`.
- Old versioned AR assets and code paths for v2, v3, and v4 can be removed.
- The `web-ar` path describes product purpose, not implementation history.

## Asset Structure

```txt
public/assets/web-ar/
  card.png
  card.mind
  icons/
    web.png
    location.png
    profile.png
    phone.png
    email.png
    play.png
    left.png
    right.png
  portfolio/
    paintandquest-preview.png
    paintandquest.mp4
    paintandquest.webm
    coffeemachine-preview.png
    peak-preview.png
  softmind/
    scene.gltf
    scene.bin
    textures/
      material_baseColor.png
      material_emissive.png
      material_metallicRoughness.png
      material_normal.png
```

## Source Of Assets

- Copy the official sample images, icons, and portfolio media from `mind-ar-js-doc/static/samples/assets/card-example`.
- Use the existing `public/assets/ar-v3/targets/card.mind` as `public/assets/web-ar/card.mind`, because the local docs sample does not include the compiled `.mind` file.
- Use the existing `public/assets/ar-v3/models/softmind/` as `public/assets/web-ar/softmind/`, because the local docs sample does not include the glTF model files.

## Code Changes

- Update `src/features/ar/scene.html` to reference `/assets/web-ar/...`.
- Keep `src/features/ar/MindARScene.tsx`, `createArV5Island.ts`, `ar-v5-interactions.ts`, and related tests as the supported Web AR implementation.
- Remove legacy v2/v3/v4 AR components, pages, libraries, tests, and public assets when they are no longer referenced.
- Update documentation that says v5 reuses `/assets/ar-v3/`.

## Testing

- Unit tests should verify that the v5 scene references `/assets/web-ar/` instead of old versioned paths.
- Existing interaction tests should continue to pass.
- Build should pass after removing legacy code and references.

## Risks

- Removing legacy pages can break routes if the router still references them.
- Moving assets can break A-Frame loading if any URL is missed.
- The `.mind` file and glTF model remain sourced from the previous local `ar-v3` assets because the local docs sample is incomplete.
