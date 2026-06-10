/* global AFRAME, THREE */

/**
 * HDR Environment Component for A-Frame
 * Loads an HDR texture and sets it as scene.environment for PBR reflections.
 * Does NOT affect the background (camera feed remains visible in AR).
 *
 * Requires RGBELoader.js (Three.js r128) to be loaded separately.
 * Usage: <a-scene hdr-environment="src: /assets/web-ar/env.hdr">
 */
AFRAME.registerComponent('hdr-environment', {
  schema: {
    src: { type: 'string' }
  },

  init: function () {
    this.loadHDR();
  },

  loadHDR: function () {
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
      },
      undefined,
      function (error) {
        console.error('hdr-environment: Failed to load HDR', error);
      }
    );
  },

  remove: function () {
    this.el.object3D.environment = null;
  }
});
