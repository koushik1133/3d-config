import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const TEXTURE_MAPS = {
  'oversized-tshirt': { normal: ['normaldetailsv2.jpg', 'NormalFabric.png'], ao: ['ao_tshirt_outside.jpg'] },
  'regular-tshirt': { normal: ['NormalFabric.png'], ao: ['outsideao.jpg'] },
  'boxy-tshirt': { normal: ['Normaldetailsv2_boxyt-shirt.png', 'NormalFabric.png'], ao: ['outsideaocropped.jpg'] },
  'hanging-tshirt': { normal: ['NormalFabric.png'], ao: ['ao_outside.jpg'] },
  'sweatshirt': { normal: ['sweatshirtnormal.jpg', 'NormalFabric.png'], ao: ['ao_outside.jpg'] },
  'hoodie': { normal: ['NormalFabric.png'], ao: ['outsideaohoodie.jpg'] },
  'hanging-hoodie': { normal: ['NormalFabric.png'], ao: ['ambientoutside.jpg'] },
  'polo-shirt': { normal: ['NormalFabric.png'], ao: ['poloshirt_Bake1_CyclesBake_AO.jpg'] },
  'zip-hoodie': { normal: ['normaldetails.jpg', 'NormalFabric.png'], ao: ['outsidenewuv.jpg'] },
  'sweatpants': { normal: ['NormalDetails.jpg', 'NormalFabric.png'], ao: ['eggjog.jpg'] },
  'cap': { normal: ['normalmapv3.jpg'], ao: ['Cap_Bake1_CyclesBake_AO.png'] }
};

// --- State Management ---
const modelsConfig = {
  'oversized-tshirt': { name: 'Oversized T-Shirt', path: '/model/oversized-tshirt/tshirt-sizingtest.gltf', type: 'top' },
  'regular-tshirt': { name: 'Regular T-Shirt', path: '/model/regular-tshirt/tshirt-sizingtest.gltf', type: 'top' },
  'boxy-tshirt': { name: 'Cropped Boxy T-Shirt', path: '/model/boxy-tshirt/tshirt-sizingtest.gltf', type: 'top' },
  'hanging-tshirt': { name: 'Hanging T-Shirt', path: '/model/hanging-tshirt/tshirt-sizingtest.gltf', type: 'top' },
  'sweatshirt': { name: 'Oversized Sweatshirt', path: '/model/sweatshirt/tshirt-sizingtest.gltf', type: 'top' },
  'hoodie': { name: 'Oversized Hoodie', path: '/model/hoodie/tshirt-sizingtest.gltf', type: 'top' },
  'hanging-hoodie': { name: 'Hanging Hoodie', path: '/model/hanging-hoodie/tshirt-sizingtest.gltf', type: 'top' },
  'polo-shirt': { name: 'Oversized Polo Shirt', path: '/model/polo-shirt/tshirt-sizingtest.gltf', type: 'top' },
  'zip-hoodie': { name: 'Zip Hoodie', path: '/model/zip-hoodie/tshirt-sizingtest.gltf', type: 'top' },
  'sweatpants': { name: 'Sweatpants', path: '/model/sweatpants/tshirt-sizingtest.gltf', type: 'bottom' },
  'cap': { name: 'Cap', path: '/model/cap/tshirt-sizingtest.gltf', type: 'accessory' }
};

const state = {
  activeModel: 'oversized-tshirt',
  garmentColor: '#ffffff',
  sleevesColor: '#ffffff',
  collarColor: '#ffffff',
  bgColor: '#1a1a1a',
  bgImage: null,
  activeDesign: null,
  activeDesignUrl: null,
  acidWash: 0.0,
  puffPrint: 0.0,
  designScale: 1.0,
  designX: 0.0,
  designY: 0.0,
  motion: 'static', // 'static', 'walk', 'waves', 'knit'
  motionSpeed: 0.5,
  cameraAnim: 'none', // 'none', 'rotate', 'orbit-zoom'
  frameSize: 'auto', // 'auto', 'portrait'
  renderQuality: 'fast', // 'fast', 'high'
  activeYOffset: -0.5
};

// --- DOM Elements ---
const container = document.getElementById('canvas-container');
const loader = document.getElementById('app-loader');

// Floating controls DOM Elements
const garmentSelect = document.getElementById('garment-select');
const floatColorBody = document.getElementById('float-color-body');
const floatHexBody = document.getElementById('float-hex-body');
const floatColorSleeves = document.getElementById('float-color-sleeves');
const floatHexSleeves = document.getElementById('float-hex-sleeves');
const floatColorCollar = document.getElementById('float-color-collar');
const floatHexCollar = document.getElementById('float-hex-collar');
const pickerSleeves = document.getElementById('picker-sleeves');
const pickerCollar = document.getElementById('picker-collar');
const fullscreenToggle = document.getElementById('fullscreen-toggle');
const designUploadInput = document.getElementById('design-upload-input');
const bgUploadInput = document.getElementById('bg-upload-input');
const uploadDesignBtn = document.getElementById('upload-design-btn');
const bgImageBtn = document.getElementById('bg-image-btn');
const bgResetBtn = document.getElementById('bg-reset-btn');
const previewContainer = document.getElementById('upload-preview-container');
const previewImg = document.getElementById('upload-preview');
const removeDesignBtn = document.getElementById('remove-design-btn');

// Color inputs
const swatches = document.querySelectorAll('.swatch');
const garmentColorPicker = document.getElementById('garment-color-picker');
const garmentColorHex = document.getElementById('garment-color-hex');
const sleevesColorPicker = document.getElementById('sleeves-color-picker');
const collarColorPicker = document.getElementById('collar-color-picker');
const bgColorPicker = document.getElementById('bg-color-picker');
const bgColorHex = document.getElementById('bg-color-hex');

// Advanced toggles
const advancedToggleBtn = document.getElementById('advanced-toggle-btn');
const advancedBackBtn = document.getElementById('advanced-back-btn');
const mainPanels = document.getElementById('main-panels');
const advancedPanels = document.getElementById('advanced-panels');

// Sliders
const animSpeedSlider = document.getElementById('anim-speed');
const animSpeedValue = document.getElementById('anim-speed-value');
const acidWashSlider = document.getElementById('acid-wash-slider');
const acidWashValue = document.getElementById('acid-wash-value');
const puffPrintSlider = document.getElementById('puff-print-slider');
const puffPrintValue = document.getElementById('puff-print-value');
const designScaleSlider = document.getElementById('design-scale-slider');
const designScaleValue = document.getElementById('design-scale-value');
const designXSlider = document.getElementById('design-x-slider');
const designXValue = document.getElementById('design-x-value');
const designYSlider = document.getElementById('design-y-slider');
const designYValue = document.getElementById('design-y-value');

// Accordions
const accordionHeaders = document.querySelectorAll('.accordion-header');

// Selection buttons
const motionBtns = document.querySelectorAll('[data-anim]');
const cameraBtns = document.querySelectorAll('[data-camera]');
const sizeAutoBtn = document.getElementById('btn-size-auto');
const sizePortraitBtn = document.getElementById('btn-size-portrait');
const qualityFastBtn = document.getElementById('btn-quality-fast');
const qualityHighBtn = document.getElementById('btn-quality-high');

// Export actions
const exportImageBtn = document.getElementById('btn-export-image');
const exportVideoBtn = document.getElementById('btn-export-video');
const export3dBtn = document.getElementById('btn-export-3d');
const exportModal = document.getElementById('export-modal');
const exportProgressBar = document.getElementById('export-progress');
const exportStatusText = document.getElementById('export-status-text');

// --- Three.js variables ---
let scene, camera, renderer, controls;
let tshirtGroup = null;
let tshirtMeshes = [];
let gltfLoader, textureLoader;
let environmentMap = null;
let mixer = null; // Animation mixer for GLTF animations
let defaultDesignTexture = null;

// Materials
let customShirtMaterial = null;
let defaultOutsideAO, defaultInsideAO, normalFabric, normalDetails, acidWashTexture;

// --- Initialize Three.js ---
function initEngine() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Camera
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.5, 14);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);



  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 3;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI / 1.8;

  // Basic Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(5, 8, 5);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.bias = -0.0001;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
  rimLight.position.set(0, 5, -8);
  scene.add(rimLight);

  // Initialize loaders
  gltfLoader = new GLTFLoader();
  textureLoader = new THREE.TextureLoader();

  // Load HDR Studio environment map
  new RGBELoader().load('/textures/studio_env.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    environmentMap = texture;
    scene.environment = environmentMap;
    // Lower opacity background fallback
    scene.background = new THREE.Color(state.bgColor);
  });

  // Handle Resize
  window.addEventListener('resize', onWindowResize);
}

// --- Load Textures & Custom Shader ---
function loadTexturesAndModel() {
  // Load fallback/shared textures
  defaultOutsideAO = textureLoader.load('/textures/ao_tshirt_outside.jpg');
  defaultInsideAO = textureLoader.load('/textures/ao_tshirt_inside.jpg');
  normalFabric = textureLoader.load('/textures/NormalFabric.png');
  normalDetails = textureLoader.load('/textures/normaldetailsv2.jpg');
  acidWashTexture = textureLoader.load('/textures/acidwash.jpg');
  defaultDesignTexture = textureLoader.load('/textures/yourdesignhere.png');

  // Set texture properties
  [defaultOutsideAO, defaultInsideAO, normalFabric, normalDetails, acidWashTexture, defaultDesignTexture].forEach(tex => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.flipY = false;
  });

  normalFabric.repeat.set(30, 30); // Fine thread tiling

  // Support ?model=slug URL param for testing
  const urlParams = new URLSearchParams(window.location.search);
  const urlModel = urlParams.get('model');
  if (urlModel && modelsConfig[urlModel]) {
    state.activeModel = urlModel;
    if (garmentSelect) garmentSelect.value = urlModel;
  }

  // Load the initial model
  loadActiveModel(state.activeModel);
}


function loadActiveModel(modelSlug) {
  // Show loader
  loader.style.display = 'flex';
  loader.style.opacity = '1';
  loader.querySelector('.loader-text').innerText = 'Loading 3D Garment...';

  // Remove existing model wrapper
  const existingWrapper = scene.getObjectByName('garmentWrapper');
  if (existingWrapper) {
    scene.remove(existingWrapper);
  }
  if (tshirtGroup) {
    tshirtGroup.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    tshirtGroup = null;
    tshirtMeshes = [];
  }
  if (mixer) { mixer.stopAllAction(); mixer = null; }

  const loadGltf = async (path) => {
    const dir = path.substring(0, path.lastIndexOf('/') + 1);
    try {
      const res = await fetch(path);
      const json = await res.json();
      const binUri = json.buffers[0].uri;
      
      const parts = ['part_aa', 'part_ab', 'part_ac', 'part_ad', 'part_ae', 'part_af', 'part_ag', 'part_ah', 'part_ai'];
      const buffers = [];
      for (const p of parts) {
        const r = await fetch(dir + binUri + '.' + p).catch(() => null);
        if (r && r.ok) {
          buffers.push(await r.arrayBuffer());
        }
      }

      if (buffers.length > 0) {
        const totalLen = buffers.reduce((acc, b) => acc + b.byteLength, 0);
        const combined = new Uint8Array(totalLen);
        let offset = 0;
        for (const b of buffers) {
          combined.set(new Uint8Array(b), offset);
          offset += b.byteLength;
        }
        const blob = new Blob([combined.buffer]);
        const blobUrl = URL.createObjectURL(blob);
        json.buffers[0].uri = blobUrl;
        return new Promise((resolve, reject) => {
          gltfLoader.parse(JSON.stringify(json), dir, (gltf) => {
            URL.revokeObjectURL(blobUrl);
            resolve(gltf);
          }, reject);
        });
      }
    } catch (e) {}

    return new Promise((resolve, reject) => {
      gltfLoader.load(path, resolve, undefined, reject);
    });
  };

  loadGltf(modelInfo.path).then((gltf) => {
    tshirtGroup = gltf.scene;

    // ─── STEP 1: Reveal zero-scaled pivot nodes ───────────────────────────────
    // Verge3D hides garment variants by setting pivot nodes to scale=(0,0,0).
    // We must set these to scale=(1,1,1) BEFORE we do any visibility logic.
    tshirtGroup.traverse((child) => {
      if (child.scale.x === 0 || child.scale.y === 0 || child.scale.z === 0) {
        child.scale.set(1, 1, 1);
        child.matrixAutoUpdate = true;
        child.updateMatrix();
      }
    });

    // ─── STEP 2: Show only the static garment mesh, hide everything else ─────
    // Naming conventions across all 11 models:
    //   GARMENT (show): tshirt_static, Cap.001, hanger*, kgi_SnapLock*, Rope*, Metal lock*, 3Dmodelexport (used for some models as static), t-shirtstaticmodel
    //   BACKGROUND/ENV (hide): env_sphere, cameradefault*, camrotate*, camrotatezoom*, *_bg, v3d_Proxy*, Plane.00*
    //   DUPLICATE EXPORT (hide): 3Dmodelexport (Verge3D duplicate meshes offset by ~12 units on X/Y)
    //   ANIMATION VARIANTS (hide): tshirt_    // Nodes / mesh patterns that should be hidden to keep clean garment presentation without hangers/cameras/env
    const hiddenPatterns = [
      'env_sphere', 'cameradefault', 'camrotate', 'tshirt_walking', 'tshirt_waves',
      '3dmodelexport', 'v3d_proxy', 'snaplock', 'rope', 'plane', 'hanger', 'stand', 'metal01'
    ];

    let meshDebug = [];
    tshirtGroup.traverse((child) => {
      if (!child.isMesh) return;
      const name = child.name.toLowerCase();
      // Hide hanger hardware and duplicate Verge3D variant meshes ending in digits (e.g. tshirt_static002)
      const isDuplicateVariant = (name.includes('tshirt_static') || name.includes('3dmodelexport')) && /\d{3,}$/.test(name);
      const shouldHide = hiddenPatterns.some(p => name.includes(p)) || isDuplicateVariant;
      child.visible = !shouldHide;
      if (!shouldHide) {
        meshDebug.push(name + '→SHOW');
      }
    });

    console.log('MESH VISIBILITY ['+modelSlug+']:', meshDebug.join(', '));

    // CRITICAL: Force update of matrixWorld hierarchy so bounding box uses true node scales & transforms
    tshirtGroup.updateMatrixWorld(true);

    // ─── STEP 4: Compute visible bounding box using exact world matrices ─────
    tshirtGroup.updateMatrixWorld(true);
    const box = new THREE.Box3();
    let hasMesh = false;

    tshirtGroup.traverse((child) => {
      if (child.isMesh && child.visible) {
        if (!child.geometry.boundingBox) {
          child.geometry.computeBoundingBox();
        }
        const tmp = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
        if (!tmp.isEmpty()) {
          const s = tmp.getSize(new THREE.Vector3());
          if (s.x > 0.001 || s.y > 0.001 || s.z > 0.001) {
            box.union(tmp);
            hasMesh = true;
          }
        }
      }
    });

    if (!hasMesh) {
      box.setFromObject(tshirtGroup);
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    console.log('MODEL LOAD LOG:', modelSlug,
      'center:', center.x.toFixed(3), center.y.toFixed(3), center.z.toFixed(3),
      'size:', size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3),
      'maxDim:', maxDim.toFixed(3));

    // ─── STEP 5: Scale and center using clean wrapper group ──────────────────
    let targetSize = 4.2;
    let yOffset = 0.1;
    if (modelSlug === 'cap') {
      targetSize = 2.5; yOffset = 0.1;
    } else if (modelSlug === 'sweatpants') {
      targetSize = 4.0; yOffset = -0.3;
    } else if (modelSlug === 'sweatshirt') {
      targetSize = 4.0; yOffset = -0.6;
    }

    // Offset tshirtGroup so its geometry bounding box center sits at (0, 0, 0)
    tshirtGroup.position.set(-center.x, -center.y, -center.z);

    // Create wrapper group to apply uniform scale and final scene placement
    const wrapper = new THREE.Group();
    wrapper.name = 'garmentWrapper';
    wrapper.add(tshirtGroup);

    const scale = maxDim > 0 ? targetSize / maxDim : 1;
    wrapper.scale.setScalar(scale);
    wrapper.position.set(0, yOffset, 0);

    state.activeYOffset = yOffset;
    scene.add(wrapper);

    wrapper.updateMatrixWorld(true);
    const finalBox = new THREE.Box3();
    wrapper.traverse(c => {
      if (c.isMesh && c.visible) {
        c.geometry.computeBoundingBox();
        finalBox.union(c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld));
      }
    });
    const finalCenter = finalBox.getCenter(new THREE.Vector3());
    const finalSize = finalBox.getSize(new THREE.Vector3());
    console.log('FINAL WRAPPER VISIBLE WORLD BOUNDS:',
      'center:', finalCenter.x.toFixed(3), finalCenter.y.toFixed(3), finalCenter.z.toFixed(3),
      'size:', finalSize.x.toFixed(3), finalSize.y.toFixed(3), finalSize.z.toFixed(3));

    controls.target.set(0, yOffset * 0.25, 0);
    controls.update();

    // ─── STEP 6: Assign premium materials to visible garment meshes ──────────
    let materialCount = 0;
    tshirtGroup.traverse((child) => {
      if (!child.isMesh || !child.visible) return;

      const hasMat = !!child.material;
      const uvs = !!child.geometry?.attributes.uv;
      console.log('  SETUP MATERIAL:', child.name, 'hasMaterial='+hasMat, 'hasUV='+uvs, 'visible='+child.visible);

      // Copy uv → uv2 so aoMap / lightMap can sample it
      if (child.geometry?.attributes.uv && !child.geometry.attributes.uv2) {
        child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
      }

      child.castShadow = true;
      child.receiveShadow = true;
      tshirtMeshes.push(child);
      setupMeshMaterial(child, modelInfo);
      materialCount++;
    });
    console.log('MATERIAL SETUP DONE ['+modelSlug+']: assigned materials to', materialCount, 'meshes');

    // Hide loader
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
  }, undefined, (error) => {
    console.error('Error loading GLTF model:', error);
    loader.querySelector('.loader-text').innerText = 'Error loading 3D Model.';
  });
}

// --- Setup Premium Shader Material ---

function setupMeshMaterial(mesh, modelInfo) {
  const originalMaterial = mesh.material;
  if (!originalMaterial) return;

  // Extract maps directly from the loaded GLTF model's original material
  const aoMap = originalMaterial.aoMap || originalMaterial.map;
  const normalMap = originalMaterial.normalMap;

  console.log('originalMaterial properties:', JSON.stringify({
    name: originalMaterial.name,
    type: originalMaterial.type,
    roughness: originalMaterial.roughness,
    metalness: originalMaterial.metalness,
    hasAoMap: !!originalMaterial.aoMap,
    hasMap: !!originalMaterial.map,
    hasNormalMap: !!originalMaterial.normalMap
  }));

  // Custom standard material
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'), // Base color (controlled by shader uniforms)
    roughness: 0.7,
    metalness: 0.05,
    map: aoMap || defaultOutsideAO, // Force Three.js to compile UV attributes (vMapUv) in the shader!
    normalMap: normalMap || normalFabric,
    normalScale: new THREE.Vector2(0.65, 0.65),

    side: THREE.DoubleSide,
    transparent: false,
    depthWrite: true
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGarmentColor = { value: new THREE.Color(state.garmentColor) };
    shader.uniforms.uSleevesColor = { value: new THREE.Color(state.sleevesColor) };
    shader.uniforms.uCollarColor = { value: new THREE.Color(state.collarColor) };
    
    // Pass custom textures
    const activeAo = aoMap || defaultOutsideAO;
    shader.uniforms.uOutsideAoTex = { value: activeAo };
    shader.uniforms.uInsideAoTex = { value: activeAo };
    
    shader.uniforms.uAcidWashTex = { value: acidWashTexture };
    shader.uniforms.uAcidWashIntensity = { value: state.acidWash };
    shader.uniforms.uDesignTex = { value: state.activeDesign ? state.activeDesign : defaultDesignTexture };
    
    // Toggle chest graphic based on garment type
    const isTop = modelInfo.type === 'top';
    shader.uniforms.uDesignEnabled = { value: isTop };
    shader.uniforms.uDesignScale = { value: state.designScale };
    shader.uniforms.uDesignX = { value: state.designX };
    shader.uniforms.uDesignY = { value: state.designY };

    // Inject Custom Fragment Shader variables
    shader.fragmentShader = `
      uniform vec3 uGarmentColor;
      uniform vec3 uSleevesColor;
      uniform vec3 uCollarColor;
      uniform sampler2D uOutsideAoTex;
      uniform sampler2D uInsideAoTex;
      uniform sampler2D uAcidWashTex;
      uniform float uAcidWashIntensity;
      uniform sampler2D uDesignTex;
      uniform bool uDesignEnabled;
      uniform float uDesignScale;
      uniform float uDesignX;
      uniform float uDesignY;
      \n` + shader.fragmentShader;

    // Sleeve/collar UV division logic for Tops
    let colorLogic = '';
    if (isTop) {
      colorLogic = `
      vec3 baseColor = uGarmentColor;
      if (vMapUv.y > 0.82) {
        baseColor = uSleevesColor;
      } else if (vMapUv.y < 0.30) {
        baseColor = uCollarColor;
      }
      diffuseColor.rgb = baseColor;
      `;
    } else {
      colorLogic = `
      diffuseColor.rgb = uGarmentColor;
      `;
    }

    // Apply color modifications before standard shading output
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      ${colorLogic}

      // Apply AO mapping manually based on front/back facing
      vec4 aoTexColor = gl_FrontFacing
        ? texture2D(uOutsideAoTex, vMapUv)
        : texture2D(uInsideAoTex, vMapUv);
      diffuseColor.rgb *= mix(vec3(1.0), aoTexColor.rgb, 0.6);

      // Apply Acid Wash texture overlay
      vec4 washColor = texture2D(uAcidWashTex, vMapUv * 2.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * washColor.rgb * 1.5, uAcidWashIntensity);

      // Apply Custom Graphic Design onto the front chest area
      if (uDesignEnabled && gl_FrontFacing) {
        // Front-body UV region (flipped-Y)
        float bodyXMin = 0.02;
        float bodyXMax = 0.48;
        float bodyYMin = 0.30;
        float bodyYMax = 0.82;

        if (vMapUv.x >= bodyXMin && vMapUv.x <= bodyXMax &&
            vMapUv.y >= bodyYMin && vMapUv.y <= bodyYMax) {

          // Normalize within the front-body panel [0..1]
          vec2 bodyUv = vec2(
            (vMapUv.x - bodyXMin) / (bodyXMax - bodyXMin),
            (vMapUv.y - bodyYMin) / (bodyYMax - bodyYMin)
          );

          // Design placement — centre chest (upper half of panel)
          float baseSize = 0.40;
          float w = baseSize * uDesignScale;
          float h = baseSize * uDesignScale;

          float cx = 0.50 + uDesignX;   // horizontal centre of panel
          float cy = 0.70 + uDesignY;   // upper portion (flipped Y)

          float uMin = cx - w * 0.5;
          float uMax = cx + w * 0.5;
          float vMin = cy - h * 0.5;
          float vMax = cy + h * 0.5;

          if (bodyUv.x >= uMin && bodyUv.x <= uMax &&
              bodyUv.y >= vMin && bodyUv.y <= vMax) {
            vec2 projectedUv = vec2(
              (bodyUv.x - uMin) / w,
              (bodyUv.y - vMin) / h
            );
            vec4 designColor = texture2D(uDesignTex, projectedUv);
            diffuseColor.rgb = mix(diffuseColor.rgb, designColor.rgb, designColor.a);
          }
        }
      }
      `
    );

    // Inject vertex shader modifications if needed
    shader.vertexShader = `
      uniform float uPuffPrintHeight;
      \n` + shader.vertexShader;

    material.userData.shader = shader;
  };

  mesh.material = material;
}

// --- Update Uniforms & Color States ---
function updateGarmentColors() {
  tshirtMeshes.forEach(mesh => {
    if (mesh.material && mesh.material.userData && mesh.material.userData.shader) {
      const shader = mesh.material.userData.shader;
      if (shader.uniforms.uGarmentColor) {
        shader.uniforms.uGarmentColor.value.set(state.garmentColor);
      }
      if (shader.uniforms.uSleevesColor) {
        shader.uniforms.uSleevesColor.value.set(state.sleevesColor);
      }
      if (shader.uniforms.uCollarColor) {
        shader.uniforms.uCollarColor.value.set(state.collarColor);
      }
    }
  });
}

function updateUniform(name, value) {
  tshirtMeshes.forEach(mesh => {
    if (mesh.material && mesh.material.userData && mesh.material.userData.shader) {
      mesh.material.userData.shader.uniforms[name].value = value;
    }
  });
}

// --- Design Graphics Upload ---
function handleDesignUpload(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const imgUrl = e.target.result;
    
    // Load as Three.js texture
    textureLoader.load(imgUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;

      state.activeDesign = texture;
      state.activeDesignUrl = imgUrl;

      // Update shader uniform
      updateUniform('uDesignTex', texture);
      updateUniform('uDesignEnabled', true);

      // UI Update
      previewImg.src = imgUrl;
      previewContainer.style.display = 'block';
    });
  };
  reader.readAsDataURL(file);
}

// --- Procedural Scene Animations ---
let clock = new THREE.Clock();
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  frameCount++;
  if (frameCount % 200 === 0) {
    console.log('Frame count:', frameCount, 'Camera pos:', camera.position.x, camera.position.y, camera.position.z);
  }

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // 1. Play GLTF embedded animation if present
  if (mixer && state.motion !== 'static') {
    mixer.update(delta * state.motionSpeed);
    
    // Freeze root motion by restoring saved initial root bone positions
    if (tshirtGroup) {
      tshirtGroup.traverse((child) => {
        if (child.isBone && child.userData.initialPosition) {
          child.position.copy(child.userData.initialPosition);
        }
      });
    }
  }



  // 2. Procedural motion models
  if (tshirtGroup) {
    const yo = state.activeYOffset;
    if (state.motion === 'walk') {
      // Bobbing up and down + subtle torso twisting swaying
      const swaySpeed = state.motionSpeed * 4.0;
      tshirtGroup.position.y = yo + Math.sin(time * swaySpeed) * 0.05;
      tshirtGroup.rotation.y = Math.PI + Math.sin(time * (swaySpeed * 0.5)) * 0.08;
      tshirtGroup.rotation.z = Math.cos(time * (swaySpeed * 0.5)) * 0.03;
      
      // Reset mesh wave offsets
      tshirtMeshes.forEach(m => m.position.set(0, 0, 0));
    } 
    else if (state.motion === 'waves') {
      // Deform mesh geometry vertices slightly to simulate wind/ripples
      const waveSpeed = time * state.motionSpeed * 8.0;
      tshirtMeshes.forEach((mesh) => {
        // Reset base position
        mesh.rotation.y = 0;
        mesh.rotation.z = 0;
        
        // Procedural vertex offset emulation (mesh level oscillations)
        mesh.position.z = Math.sin(waveSpeed + mesh.id) * 0.02;
        mesh.position.y = Math.cos(waveSpeed * 0.7 + mesh.id) * 0.01;
      });
      tshirtGroup.position.y = yo;
      tshirtGroup.rotation.set(0, Math.PI, 0);
    } 
    else if (state.motion === 'knit') {
      // Zoom camera in close to show fabric details
      tshirtGroup.position.set(0, yo, 0);
      tshirtGroup.rotation.set(0, Math.PI, 0);
      tshirtMeshes.forEach(m => m.position.set(0, 0, 0));
      
      const targetZoomZ = 3.2;
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZoomZ, 0.05);
      controls.target.set(0, yo * 0.25, 0);
    } 
    else {
      // Static mode — restore to per-garment vertical offset
      tshirtGroup.position.y = yo;
      tshirtGroup.rotation.set(0, Math.PI, 0);
      tshirtMeshes.forEach(m => m.position.set(0, 0, 0));
    }
  }

  // 3. Camera Auto Animations
  if (state.cameraAnim === 'rotate') {
    controls.autoRotate = true;
    controls.autoRotateSpeed = state.motionSpeed * 4.0;
  } else if (state.cameraAnim === 'orbit-zoom') {
    controls.autoRotate = true;
    controls.autoRotateSpeed = state.motionSpeed * 3.0;
    // Pulse camera distance
    const dist = 7.0 + Math.sin(time * 0.5) * 1.5;
    const targetPos = camera.position.clone().normalize().multiplyScalar(dist);
    camera.position.lerp(targetPos, 0.02);
  } else {
    controls.autoRotate = false;
  }

  controls.update();
  renderer.render(scene, camera);
}

// --- Window Resize ---
function onWindowResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// --- Fullscreen Trigger ---
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      fullscreenToggle.querySelector('i').setAttribute('data-lucide', 'minimize');
      lucide.createIcons();
    });
  } else {
    document.exitFullscreen().then(() => {
      fullscreenToggle.querySelector('i').setAttribute('data-lucide', 'maximize');
      lucide.createIcons();
    });
  }
}

// --- Export Features ---

// 1. Export Image
function exportImage() {
  // Clear selection backgrounds or loader indicators temporarily
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  
  const link = document.createElement('a');
  link.download = `tshirt-configurator-${Date.now()}.png`;
  link.href = dataURL;
  link.click();
}

// 2. Export 3D Model (.glb)
function export3DModel() {
  if (!tshirtGroup) return;

  const exporter = new GLTFExporter();
  exporter.parse(tshirtGroup, (gltf) => {
    const blob = new Blob([gltf], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `custom-${state.activeModel}-${Date.now()}.glb`;
    link.click();
  }, (error) => {
    console.error('An error occurred during GLTF export:', error);
  }, { binary: true });
}

// 3. Export Video (WebM)
function exportVideo() {
  // Display recording overlay modal
  exportModal.style.display = 'flex';
  exportProgressBar.style.width = '0%';
  exportStatusText.innerText = 'Initializing Recording...';

  // Set camera to orbit mode temporarily to generate nice rotation clip
  const savedCameraAnim = state.cameraAnim;
  state.cameraAnim = 'rotate';
  
  const stream = renderer.domElement.captureStream(30); // Capture at 30 FPS
  let recorderOptions = { mimeType: 'video/webm;codecs=vp9' };
  
  // Browser compatibility checks
  if (!MediaRecorder.isTypeSupported(recorderOptions.mimeType)) {
    recorderOptions = { mimeType: 'video/webm' };
  }

  const recordedChunks = [];
  const recorder = new MediaRecorder(stream, recorderOptions);

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data);
  };

  recorder.onstop = () => {
    // Compile blob and download
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `tshirt-animation-${Date.now()}.webm`;
    link.click();

    // Hide Modal & Restore settings
    exportModal.style.display = 'none';
    state.cameraAnim = savedCameraAnim;
  };

  // Record for 5 seconds
  const recordDuration = 5000;
  const startTime = Date.now();
  
  recorder.start();

  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const percentage = Math.min(100, Math.floor((elapsed / recordDuration) * 100));
    
    exportProgressBar.style.width = `${percentage}%`;
    exportStatusText.innerText = `Recording video... ${percentage}%`;

    if (elapsed >= recordDuration) {
      clearInterval(progressInterval);
      recorder.stop();
    }
  }, 100);
}

// --- Event Listeners and Setup ---
function setupEvents() {
  // Accordion UI Logic
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const wasExpanded = item.classList.contains('expanded');
      
      // Close all accordions first
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('expanded'));
      
      // Toggle current accordion
      if (!wasExpanded) {
        item.classList.add('expanded');
      }
    });
  });

  // Fullscreen trigger
  fullscreenToggle.addEventListener('click', toggleFullscreen);

  // File Upload Handlers
  uploadDesignBtn.addEventListener('click', () => designUploadInput.click());
  designUploadInput.addEventListener('change', (e) => handleDesignUpload(e.target.files[0]));

  removeDesignBtn.addEventListener('click', () => {
    state.activeDesign = null;
    state.activeDesignUrl = null;
    updateUniform('uDesignEnabled', false);
    previewContainer.style.display = 'none';
    designUploadInput.value = '';
  });

  // Background Image Upload
  bgImageBtn.addEventListener('click', () => bgUploadInput.click());
  bgUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target.result;
        container.style.backgroundImage = `url(${url})`;
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
      };
      reader.readAsDataURL(file);
    }
  });

  bgResetBtn.addEventListener('click', () => {
    container.style.backgroundImage = 'none';
    bgUploadInput.value = '';
  });

  // Floating controls interactions
  garmentSelect.addEventListener('change', (e) => {
    state.activeModel = e.target.value;
    loadActiveModel(state.activeModel);

    // Dynamically show/hide sleeve/collar color pickers
    const modelInfo = modelsConfig[state.activeModel];
    if (modelInfo.type === 'top') {
      pickerSleeves.classList.remove('hidden');
      pickerCollar.classList.remove('hidden');
    } else {
      pickerSleeves.classList.add('hidden');
      pickerCollar.classList.add('hidden');
    }
  });

  floatColorBody.addEventListener('input', (e) => {
    swatches.forEach(s => s.classList.remove('active'));
    const color = e.target.value;
    state.garmentColor = color;
    floatHexBody.innerText = color.toUpperCase();
    updateGarmentColors();
    
    // Sync old picker
    garmentColorPicker.value = color;
    garmentColorHex.innerText = color.toUpperCase();
  });

  floatColorSleeves.addEventListener('input', (e) => {
    const color = e.target.value;
    state.sleevesColor = color;
    floatHexSleeves.innerText = color.toUpperCase();
    updateGarmentColors();
    
    // Sync old picker
    sleevesColorPicker.value = color;
  });

  floatColorCollar.addEventListener('input', (e) => {
    const color = e.target.value;
    state.collarColor = color;
    floatHexCollar.innerText = color.toUpperCase();
    updateGarmentColors();
    
    // Sync old picker
    collarColorPicker.value = color;
  });

  // Color Pickers Changes
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      swatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');

      const color = swatch.getAttribute('data-color');
      state.garmentColor = color;
      state.sleevesColor = color;
      state.collarColor = color;

      // Update Pickers value
      garmentColorPicker.value = color;
      sleevesColorPicker.value = color;
      collarColorPicker.value = color;
      garmentColorHex.innerText = color.toUpperCase();

      updateGarmentColors();
    });
  });

  garmentColorPicker.addEventListener('input', (e) => {
    // Remove active swatches
    swatches.forEach(s => s.classList.remove('active'));

    const color = e.target.value;
    state.garmentColor = color;
    garmentColorHex.innerText = color.toUpperCase();
    updateGarmentColors();
  });

  sleevesColorPicker.addEventListener('input', (e) => {
    state.sleevesColor = e.target.value;
    updateGarmentColors();
  });

  collarColorPicker.addEventListener('input', (e) => {
    state.collarColor = e.target.value;
    updateGarmentColors();
  });

  bgColorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    state.bgColor = color;
    bgColorHex.innerText = color.toUpperCase();
    scene.background = new THREE.Color(color);
  });

  // Advanced Menu toggles navigation
  advancedToggleBtn.addEventListener('click', () => {
    mainPanels.classList.remove('active');
    advancedPanels.classList.add('active');
  });

  advancedBackBtn.addEventListener('click', () => {
    advancedPanels.classList.remove('active');
    mainPanels.classList.add('active');
  });

  // Sliders Change Inputs
  animSpeedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.motionSpeed = val;
    animSpeedValue.innerText = val.toFixed(2) + 'x';
  });

  acidWashSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.acidWash = val;
    acidWashValue.innerText = val.toFixed(2);
    updateUniform('uAcidWashIntensity', val);
  });

  puffPrintSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.puffPrint = val;
    puffPrintValue.innerText = val.toFixed(2);
    updateUniform('uPuffPrintHeight', val);
  });

  designScaleSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.designScale = val;
    designScaleValue.innerText = val.toFixed(2);
    updateUniform('uDesignScale', val);
  });

  designXSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.designX = val;
    designXValue.innerText = val.toFixed(2);
    updateUniform('uDesignX', val);
  });

  designYSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.designY = val;
    designYValue.innerText = val.toFixed(2);
    updateUniform('uDesignY', val);
  });

  // Toggle Motion state click handlers
  motionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      motionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.motion = btn.getAttribute('data-anim');
    });
  });

  // Toggle Camera state click handlers
  cameraBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cameraBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.cameraAnim = btn.getAttribute('data-camera');
    });
  });

  // Frame Sizing config
  sizeAutoBtn.addEventListener('click', () => {
    sizeAutoBtn.classList.add('active');
    sizePortraitBtn.classList.remove('active');
    state.frameSize = 'auto';
    container.classList.remove('portrait');
    container.classList.add('automatic');
    onWindowResize();
  });

  sizePortraitBtn.addEventListener('click', () => {
    sizePortraitBtn.classList.add('active');
    sizeAutoBtn.classList.remove('active');
    state.frameSize = 'portrait';
    container.classList.remove('automatic');
    container.classList.add('portrait');
    onWindowResize();
  });

  // Render Quality toggle config
  qualityFastBtn.addEventListener('click', () => {
    qualityFastBtn.classList.add('active');
    qualityHighBtn.classList.remove('active');
    state.renderQuality = 'fast';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  });

  qualityHighBtn.addEventListener('click', () => {
    qualityHighBtn.classList.add('active');
    qualityFastBtn.classList.remove('active');
    state.renderQuality = 'high';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
  });

  // Export Click Events
  exportImageBtn.addEventListener('click', exportImage);
  exportVideoBtn.addEventListener('click', exportVideo);
  export3dBtn.addEventListener('click', export3DModel);
}

// --- Initialize Project ---
window.addEventListener('DOMContentLoaded', () => {
  initEngine();
  loadTexturesAndModel();
  setupEvents();
  animate();
  
  // Render lucide icons
  lucide.createIcons();
});
