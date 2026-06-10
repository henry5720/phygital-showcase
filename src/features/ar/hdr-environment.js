/* global AFRAME, THREE */

/**
 * HDR Environment Component for A-Frame
 * Loads an HDR or EXR texture and sets it as scene.environment for PBR reflections.
 * Does NOT affect the background (camera feed remains visible in AR).
 * Automatically selects RGBELoader (.hdr) or EXRLoader (.exr) based on file extension.
 */
AFRAME.registerComponent('hdr-environment', {
  schema: {
    src: { type: 'string' }
  },

  init: function () {
    this.loadHDR();
  },

  getLoader: function (src) {
    if (src.endsWith('.exr')) {
      return new THREE.EXRLoader();
    }
    return new THREE.RGBELoader();
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

    const loader = this.getLoader(src);
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
        console.error('hdr-environment: Failed to load environment map', error);
      }
    );
  },

  remove: function () {
    this.el.object3D.environment = null;
  }
});
