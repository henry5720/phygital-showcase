/* global AFRAME, THREE */

/**
 * HDR Environment Component for A-Frame
 * Loads an HDR texture and sets it as scene.environment for PBR reflections.
 * Supports showBackground for visual display and showGround for floor reflection.
 *
 * Best practices:
 * - Waits for scene loaded event before loading HDR
 * - Applies envMap to ALL meshes in scene (not just current entity)
 * - Supports envMapIntensity for reflection brightness control
 * - showBackground: false in AR mode (don't block camera)
 *
 * Requires RGBELoader.js (Three.js r128) to be loaded separately.
 * Usage: <a-scene hdr-environment="src: /assets/web-ar/church_meeting_room_1k.hdr; showBackground: true; envMapIntensity: 1.5">
 */
AFRAME.registerComponent('hdr-environment', {
  schema: {
    src: { type: 'string' },
    envMapIntensity: { type: 'number', default: 1.0 },
    showBackground: { type: 'boolean', default: false },
    showGround: { type: 'boolean', default: false },
    groundSize: { type: 'number', default: 30 }
  },

  init: function () {
    this.envMap = null;
    this.skyMesh = null;
    this.groundMesh = null;
    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.onModelLoaded = this.onModelLoaded.bind(this);

    this.el.addEventListener('loaded', this.onSceneLoaded);
  },

  onSceneLoaded: function () {
    this.loadHDR();
  },

  onModelLoaded: function () {
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

        // Show background if enabled
        if (self.data.showBackground) {
          if (self.data.showGround) {
            self.createSkyAndGround(texture);
          } else {
            scene.background = texture;
          }
        }

        // Listen for future model loads
        el.addEventListener('model-loaded', self.onModelLoaded);
      },
      undefined,
      function (error) {
        console.error('hdr-environment: Failed to load HDR', error);
      }
    );
  },

  createSkyAndGround: function (envMap) {
    const scene = this.el.object3D;
    const groundSize = this.data.groundSize;

    // Sky
    const skyMap = envMap.clone();
    skyMap.needsUpdate = true;
    skyMap.repeat.set(1, 0.8);
    skyMap.offset.set(0, 0.5);

    const skyGeometry = new THREE.SphereGeometry(1, 32, 32, 0, 2 * Math.PI, 0, Math.PI / 2);
    const skyMaterial = new THREE.MeshBasicMaterial();
    skyMaterial.side = THREE.BackSide;
    skyMaterial.map = skyMap;

    this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    this.skyMesh.scale.set(groundSize, groundSize, -groundSize);
    this.skyMesh.position.y = groundSize * 0.1;
    scene.add(this.skyMesh);

    // Ground
    const groundMap = envMap.clone();
    groundMap.needsUpdate = true;
    groundMap.repeat.set(1, 1);
    groundMap.offset.set(0, -0.5);

    const groundGeometry = new THREE.SphereGeometry(1, 32, 32, 0, 2 * Math.PI, Math.PI / 2, Math.PI);
    const groundMaterial = new THREE.MeshBasicMaterial();
    groundMaterial.side = THREE.BackSide;
    groundMaterial.map = groundMap;

    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.scale.set(groundSize, groundSize * 0.1, -groundSize);
    this.groundMesh.position.y = groundSize * 0.1;
    scene.add(this.groundMesh);
  },

  applyEnvMapToAllMeshes: function () {
    if (!this.envMap) return;

    const scene = this.el.object3D;
    const intensity = this.data.envMapIntensity;

    scene.traverse(function (node) {
      if (node.isMesh && node.material) {
        node.material.envMap = this.envMap;
        node.material.envMapIntensity = intensity;
        node.material.needsUpdate = true;
      }
    }.bind(this));
  },

  update: function () {
    if (this.data.src && this.envMap) {
      this.loadHDR();
    }
  },

  remove: function () {
    const scene = this.el.object3D;
    scene.environment = null;
    scene.background = null;

    if (this.skyMesh) {
      scene.remove(this.skyMesh);
      this.skyMesh = null;
    }
    if (this.groundMesh) {
      scene.remove(this.groundMesh);
      this.groundMesh = null;
    }

    this.el.removeEventListener('model-loaded', this.onModelLoaded);
    this.envMap = null;
  }
});
