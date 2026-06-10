/* global AFRAME, THREE */

/**
 * HDR Environment Component for A-Frame
 * Loads an HDR texture and sets it as scene.environment for PBR reflections.
 * Does NOT affect the background (camera feed remains visible in AR).
 *
 * Best practices:
 * - Waits for scene loaded event before loading HDR
 * - Applies envMap to ALL meshes in scene (not just current entity)
 * - Supports envMapIntensity for reflection brightness control
 *
 * Requires RGBELoader.js (Three.js r128) to be loaded separately.
 * Usage: <a-scene hdr-environment="src: /assets/web-ar/church_meeting_room_1k.hdr; envMapIntensity: 1.5">
 */
AFRAME.registerComponent('hdr-environment', {
  schema: {
    src: { type: 'string' },
    envMapIntensity: { type: 'number', default: 1.0 }
  },

  init: function () {
    this.envMap = null;
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.onModelLoaded = this.onModelLoaded.bind(this);

    this.el.addEventListener('loaded', this.onSceneLoaded);
  },

  onSceneLoaded: function () {
    this.loadHDR();
  },

  onModelLoaded: function () {
    // When new model loads, re-apply envMap to all meshes
    this.applyEnvMapToAllMeshes();
  },

  loadHDR: function () {
    const self = this;
    const el = this.el;
    const src = this.data.src;

    if (!src) {
      console.warn('hdr-environment: No src provided');
      return;
    }

    if (typeof THREE.RGBELoader === 'undefined') {
      console.error('hdr-environment: RGBELoader not loaded. Include RGBELoader.js script.');
      return;
    }

    const renderer = el.renderer;
    if (!renderer) {
      console.warn('hdr-environment: Renderer not ready');
      return;
    }

    const scene = el.object3D;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;

    const loader = new THREE.RGBELoader();
    loader.load(
      src,
      function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        self.envMap = texture;

        // Apply to ALL meshes in scene immediately
        self.applyEnvMapToAllMeshes();

        // Listen for future model loads
        el.addEventListener('model-loaded', self.onModelLoaded);
      },
      undefined,
      function (error) {
        console.error('hdr-environment: Failed to load HDR', error);
      }
    );
  },

  applyEnvMapToAllMeshes: function () {
    if (!this.envMap) return;

    const scene = this.el.object3D;
    const intensity = this.data.envMapIntensity;

    // Traverse entire scene to find ALL meshes
    scene.traverse(function (node) {
      if (node.isMesh && node.material) {
        node.material.envMap = this.envMap;
        node.material.envMapIntensity = intensity;
        node.material.needsUpdate = true;
      }
    }.bind(this));
  },

  update: function () {
    // Reload if src changes
    if (this.data.src && this.envMap) {
      this.loadHDR();
    }
  },

  remove: function () {
    this.el.object3D.environment = null;
    this.el.removeEventListener('model-loaded', this.onModelLoaded);
    this.envMap = null;
  }
});
