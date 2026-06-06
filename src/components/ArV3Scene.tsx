import React, { useEffect, useRef } from 'react'
import { cleanupArV3Artifacts, initArV3Experience } from '../lib/ar-v3'

type AFrameSceneElement = HTMLElement & {
  hasLoaded?: boolean
}

type ArWindow = Window & typeof globalThis & {
  AFRAME?: {
    components?: Record<string, unknown>
  }
}

function getArWindow(): ArWindow {
  return window as ArWindow
}

function isAframeReady() {
  return typeof getArWindow().AFRAME !== 'undefined'
}

function isMindArReady() {
  return Boolean(getArWindow().AFRAME?.components?.['mindar-image'])
}

function loadScript(src: string, isReady: () => boolean): Promise<void> {
  const existing = document.querySelector(`script[src="${src}"]`)
  if (existing) {
    const loaded = existing.getAttribute('data-loaded') === 'true' || isReady()
    if (loaded) {
      existing.setAttribute('data-loaded', 'true')
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const handleLoad = () => resolve()
      const handleError = () => reject(new Error(`Failed to load ${src}`))
      existing.addEventListener('load', handleLoad, { once: true })
      existing.addEventListener('error', handleError, { once: true })
    })
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => {
      script.setAttribute('data-loaded', 'true')
      resolve()
    }
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

export const ArV3Scene: React.FC = () => {
  const sceneRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let disposed = false
    let cleanupExperience: (() => void) | null = null
    const sceneEl = sceneRef.current as AFrameSceneElement | null
    const handleLoaded = () => {
      cleanupExperience = initArV3Experience()
    }

    Promise.all([
      loadScript('https://aframe.io/releases/1.4.2/aframe.min.js', isAframeReady),
      loadScript('/vendor/mindar-image-aframe.prod.js', isMindArReady),
    ])
      .then(() => {
        if (disposed) return

        if (sceneEl) {
          if (sceneEl.hasLoaded) {
            handleLoaded()
          } else {
            sceneEl.addEventListener('loaded', handleLoaded)
          }
        }
      })
      .catch((error: unknown) => {
        if (disposed) return
        console.error('Failed to initialize AR V3 scene', error)
      })

    return () => {
      disposed = true
      cleanupExperience?.()
      cleanupArV3Artifacts()
      if (sceneEl) {
        sceneEl.removeEventListener('loaded', handleLoaded)
      }
    }
  }, [])

  return (
    <>
      <style>{`
        #scanning-overlay {
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: transparent;
          z-index: 2;
        }
        @media (min-aspect-ratio: 1/1) {
          #scanning-overlay .inner {
            width: 50vh;
            height: 50vh;
          }
        }
        @media (max-aspect-ratio: 1/1) {
          #scanning-overlay .inner {
            width: 80vw;
            height: 80vw;
          }
        }
        #scanning-overlay .inner {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: linear-gradient(to right, white 10px, transparent 10px) 0 0,
                      linear-gradient(to right, white 10px, transparent 10px) 0 100%,
                      linear-gradient(to left, white 10px, transparent 10px) 100% 0,
                      linear-gradient(to left, white 10px, transparent 10px) 100% 100%,
                      linear-gradient(to bottom, white 10px, transparent 10px) 0 0,
                      linear-gradient(to bottom, white 10px, transparent 10px) 100% 0,
                      linear-gradient(to top, white 10px, transparent 10px) 0 100%,
                      linear-gradient(to top, white 10px, transparent 10px) 100% 100%;
          background-repeat: no-repeat;
          background-size: 40px 40px;
        }
        #scanning-overlay.hidden {
          display: none;
        }
        #scanning-overlay img {
          opacity: 0.6;
          width: 90%;
          align-self: center;
        }
        #scanning-overlay .inner .scanline {
          position: absolute;
          width: 100%;
          height: 10px;
          background: white;
          opacity: 0.3;
          top: 0;
          box-shadow: 0 0 10px 10px white;
          animation: scan 4s linear infinite;
        }
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>

      <div id="scanning-overlay" className="hidden">
        <div className="inner">
          <img src="/assets/ar-v3/targets/card.png" />
          <div className="scanline"></div>
        </div>
      </div>

      <a-scene
        ref={sceneRef}
        mindar-image="imageTargetSrc: /assets/ar-v3/targets/card.mind; showStats: false; uiScanning: #scanning-overlay; filterMinCF:0.0001; filterBeta: 0.001;" 
        color-space="sRGB" 
        renderer="colorManagement: true, physicallyCorrectLights" 
        vr-mode-ui="enabled: false" 
        device-orientation-permission-ui="enabled: false"
      >
        <a-assets>
          <img id="card" src="/assets/ar-v3/targets/card.png" />
          <img id="icon-web" src="/assets/ar-v3/icons/web.png" />
          <img id="icon-email" src="/assets/ar-v3/icons/email.png" />
          <img id="icon-profile" src="/assets/ar-v3/icons/profile.png" />
          <img id="icon-location" src="/assets/ar-v3/icons/location.png" />
          <img id="icon-left" src="/assets/ar-v3/icons/left.png" />
          <img id="icon-right" src="/assets/ar-v3/icons/right.png" />
          <img id="paintandquest-preview" src="/assets/ar-v3/portfolio/paintandquest-preview.png" />
          <video id="paintandquest-video-mp4" autoPlay={false} loop={true} src="/assets/ar-v3/portfolio/paintandquest.mp4"></video>
          <video id="paintandquest-video-webm" autoPlay={false} loop={true} src="/assets/ar-v3/portfolio/paintandquest.webm"></video>
          <img id="coffeemachine-preview" src="/assets/ar-v3/portfolio/coffeemachine-preview.png" />
          <img id="peak-preview" src="/assets/ar-v3/portfolio/peak-preview.png" />
          
          <a-asset-item id="avatarModel" src="/assets/ar-v3/models/softmind/scene.gltf"></a-asset-item>
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false" cursor="fuse: false; rayOrigin: mouse;" raycaster="far: 10000; objects: .clickable"></a-camera>

        <a-entity mytarget portfolio-item-actions mindar-image-target="targetIndex: 0">
          <a-plane src="#card" position="0 0 0" height="0.552" width="1" rotation="0 0 0"></a-plane>

          <a-entity id="portfolio-panel" position="0 0 -0.01" visible="false">
            <a-text value="Portfolio" color="black" align="center" width="2" position="0 0.4 0"></a-text>
            <a-entity id="portfolio-item0">
              <a-video id="paintandquest-video-link" webkit-playsinline playsinline width="1" height="0.552" position="0 0 0" src="#paintandquest-video-mp4" visible="false"></a-video>
              <a-image id="paintandquest-preview-button" class="clickable" src="#paintandquest-preview" alpha-test="0.5" position="0 0 0" height="0.552" width="1"></a-image>
            </a-entity>
            <a-entity id="portfolio-item1" visible="false">
              <a-image class="clickable" src="#coffeemachine-preview" alpha-test="0.5" position="0 0 0" height="0.552" width="1"></a-image>
            </a-entity>
            <a-entity id="portfolio-item2" visible="false">
              <a-image class="clickable" src="#peak-preview" alpha-test="0.5" position="0 0 0" height="0.552" width="1"></a-image>
            </a-entity>

            <a-image id="portfolio-left-button" visible="false" class="clickable" src="#icon-left" position="-0.7 0 0" height="0.15" width="0.15"></a-image>
            <a-image id="portfolio-right-button" visible="false" class="clickable" src="#icon-right" position="0.7 0 0" height="0.15" width="0.15"></a-image>
          </a-entity>

          <a-gltf-model id="avatar" rotation="0 0 0" position="0 -0.25 0" scale="0.004 0.004 0.004" src="#avatarModel" animation-mixer></a-gltf-model>

          <a-image id="profile-button" class="clickable" src="#icon-profile" position="-0.42 -0.5 0" height="0.15" width="0.15" visible="false" animation="property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"></a-image>
          <a-image id="web-button" class="clickable" src="#icon-web" position="-0.14 -0.5 0" height="0.15" width="0.15" visible="false" animation="property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"></a-image>
          <a-image id="email-button" class="clickable" src="#icon-email" position="0.14 -0.5 0" height="0.15" width="0.15" visible="false" animation="property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"></a-image>
          <a-image id="location-button" class="clickable" src="#icon-location" position="0.42 -0.5 0" height="0.15" width="0.15" visible="false" animation="property: scale; to: 1.2 1.2 1.2; dur: 1000; easing: easeInOutQuad; loop: true; dir: alternate"></a-image>

          <a-text id="text" class="clickable" value="" color="black" align="center" width="2" position="0 -1 0" geometry="primitive:plane; height: 0.1; width: 2;" material="opacity: 0.5"></a-text>
        </a-entity>
      </a-scene>
    </>
  )
}
