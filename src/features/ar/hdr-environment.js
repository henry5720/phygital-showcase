/* global AFRAME, THREE */

/**
 * HDR Environment Component for A-Frame
 * Loads an HDR texture and sets it as scene.environment for PBR reflections.
 * Does NOT affect the background (camera feed remains visible in AR).
 */
AFRAME.registerComponent('hdr-environment', {
  schema: {
    src: { type: 'string' }
  },

  init: function () {
    this.loadHDR();
  },

  loadHDR: function () {
    const self = this;
    const el = this.el;
    const src = this.data.src;

    if (!src) {
      console.warn('hdr-environment: No src provided');
      return;
    }

    const renderer = el.renderer;
    if (!renderer) {
      console.warn('hdr-environment: Renderer not ready');
      return;
    }

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const loader = new THREE.RGBELoader();
    loader.load(
      src,
      function (texture) {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        el.object3D.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
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
