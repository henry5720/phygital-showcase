/// <reference types="vite/client" />

import 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any
      'a-assets': any
      'a-asset-item': any
      'a-camera': any
      'a-entity': any
      'a-plane': any
      'a-image': any
      'a-video': any
      'a-gltf-model': any
    }
  }
}
