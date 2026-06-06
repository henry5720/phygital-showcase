export function ArV2Scene() {
  return (
    <div className="h-dvh w-full">
      <a-scene
        mindar-image="imageTargetSrc: /assets/ar-v2/targets/card.mind; uiLoading: no; uiError: no; uiScanning: yes;"
        embedded
        color-space="sRGB"
        renderer="colorManagement: true, physicallyCorrectLights"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        <a-assets>
          <img id="card" src="/assets/ar-v2/targets/card.png" />
          <img id="icon-left" src="/assets/ar-v2/icons/left.png" />
          <img id="icon-right" src="/assets/ar-v2/icons/right.png" />
          <img id="paintandquest-preview" src="/assets/ar-v2/portfolio/paintandquest-preview.png" />
          <img id="coffeemachine-preview" src="/assets/ar-v2/portfolio/coffeemachine-preview.png" />
          <img id="peak-preview" src="/assets/ar-v2/portfolio/peak-preview.png" />
          <video id="paintandquest-video-mp4" playsInline src="/assets/ar-v2/videos/paintandquest.mp4" />
          <video id="paintandquest-video-webm" playsInline src="/assets/ar-v2/videos/paintandquest.webm" />
          <a-asset-item id="avatarModel" src="/assets/ar-v2/models/softmind/scene.gltf" />
        </a-assets>

        <a-camera
          position="0 0 0"
          look-controls="enabled: false"
          cursor="fuse: false; rayOrigin: mouse;"
          raycaster="far: 10000; objects: .clickable"
        />

        <a-entity id="ar-v2-target" mindar-image-target="targetIndex: 0">
          <a-plane src="#card" position="0 0 0" height="0.552" width="1" rotation="0 0 0" />
          <a-entity id="portfolio-panel" visible="false" position="0 0 -0.01">
            <a-entity id="portfolio-item0">
              <a-video id="paintandquest-video-link" width="1" height="0.552" position="0 0 0" />
              <a-image id="paintandquest-preview-button" class="clickable" src="#paintandquest-preview" position="0 0 0" height="0.552" width="1" />
            </a-entity>
            <a-entity id="portfolio-item1" visible="false">
              <a-image class="clickable" src="#coffeemachine-preview" position="0 0 0" height="0.552" width="1" />
            </a-entity>
            <a-entity id="portfolio-item2" visible="false">
              <a-image class="clickable" src="#peak-preview" position="0 0 0" height="0.552" width="1" />
            </a-entity>
            <a-image id="portfolio-left-button" class="clickable" visible="false" src="#icon-left" position="-0.7 0 0" height="0.15" width="0.15" />
            <a-image id="portfolio-right-button" class="clickable" visible="false" src="#icon-right" position="0.7 0 0" height="0.15" width="0.15" />
          </a-entity>
          <a-gltf-model id="avatar" position="0 -0.25 0" scale="0.004 0.004 0.004" src="#avatarModel" />
        </a-entity>
      </a-scene>
    </div>
  )
}
