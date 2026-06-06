/// <reference types="vite/client" />

import 'react'
import type React from 'react'

type AFrameElementProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  [key: string]: unknown
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': AFrameElementProps
      'a-assets': AFrameElementProps
      'a-asset-item': AFrameElementProps
      'a-camera': AFrameElementProps
      'a-entity': AFrameElementProps
      'a-plane': AFrameElementProps
      'a-image': AFrameElementProps
      'a-video': AFrameElementProps
      'a-gltf-model': AFrameElementProps
      'a-text': AFrameElementProps
    }
  }
}
