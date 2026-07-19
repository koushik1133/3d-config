import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// --- State Management ---
const state = {
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
  renderQuality: 'fast' // 'fast', 'high'
};

// --- DOM Elements ---
const container = document.getElementById('canvas-container');
const loader = document.getElementById('app-loader');
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
  // Load AO & Normal textures
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

  gltfLoader.load('/model/tshirt-sizingtest.gltf', (gltf) => {
    tshirtGroup = gltf.scene;

    // Reset pivot nodes scale to 1, 1, 1 (Verge3D hides options by zero-scaling pivots)
    tshirtGroup.traverse((child) => {
      if (child.name.toLowerCase().includes('pivot')) {
        child.scale.set(1, 1, 1);
      }
    });

    // Traverse first to hide backgrounds, so bounds calculation ignores them
    tshirtGroup.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        if (name.includes('env') || name.includes('bg') || name.includes('camera') || name.includes('sphere')) {
          child.visible = false;
        }
      }
    });

    tshirtGroup.updateMatrixWorld(true);

    // Compute bounding box of visible meshes only (just the T-shirt)
    const box = new THREE.Box3();
    let hasMesh = false;
    tshirtGroup.traverse((child) => {
      if (child.isMesh && child.visible) {
        box.expandByObject(child);
        hasMesh = true;
      }
    });

    if (!hasMesh) {
      box.setFromObject(tshirtGroup);
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    console.log('Tshirt bounds center x:', center.x, 'y:', center.y, 'z:', center.z);
    console.log('Tshirt bounds size x:', size.x, 'y:', size.y, 'z:', size.z);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.2 / (maxDim > 0 ? maxDim : 1); // Target bounding box size of 3.2 units
    tshirtGroup.scale.setScalar(scale);
    
    // Center it on x and z, offset y slightly to align with camera target
    tshirtGroup.position.set(
      -center.x * scale,
      -center.y * scale - 0.5,
      -center.z * scale
    );
    
    scene.add(tshirtGroup);
    controls.target.set(0, 0, 0);

    // Hierarchical debug logging
    tshirtGroup.traverse((child) => {
      console.log('Node info:', child.name, 'type:', child.type, 'visible:', child.visible, 'scale:', child.scale.x, child.scale.y, child.scale.z, 'pos:', child.position.x, child.position.y, child.position.z);
      if (child.isMesh) {
        const pos = child.geometry.attributes.position;
        console.log('Mesh vertices count:', child.name, pos ? pos.count : 'no position attribute');
        console.log('Mesh attributes:', child.name, Object.keys(child.geometry.attributes).join(', '));
        console.log('Mesh groups:', child.name, child.geometry.groups ? child.geometry.groups.map(g => `start:${g.start}, count:${g.count}, index:${g.materialIndex}`).join(' | ') : 'none');
      }
    });

    // Traverse & Set Up Materials
    tshirtGroup.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        // Hide environment spheres, backdrops, and camera rig meshes
        if (name.includes('env') || name.includes('bg') || name.includes('camera') || name.includes('sphere')) {
          child.visible = false;
          return;
        }

        console.log('Original mesh material:', child.name, Array.isArray(child.material) ? child.material.map(m => m.name).join(', ') : child.material.name);
        if (child.material) {
          const mat = child.material;
          console.log('Base Material maps - map:', mat.map ? mat.map.name || 'yes' : 'null', 
                      'aoMap:', mat.aoMap ? mat.aoMap.name || 'yes' : 'null', 
                      'normalMap:', mat.normalMap ? mat.normalMap.name || 'yes' : 'null');
        }

        // Copy uv to uv2 for proper AO mapping in standard materials
        if (child.geometry && child.geometry.attributes.uv && !child.geometry.attributes.uv2) {
          child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
        }

        child.castShadow = true;
        child.receiveShadow = true;
        tshirtMeshes.push(child);
        
        console.log('Mesh found:', child.name);
        setupMeshMaterial(child);
      }
    });

    scene.updateMatrixWorld(true);
    if (tshirtMeshes.length > 0) {
      const worldBox = new THREE.Box3().setFromObject(tshirtMeshes[0]);
      console.log('Tshirt static world bounds min:', worldBox.min.x, worldBox.min.y, worldBox.min.z, 'max:', worldBox.max.x, worldBox.max.y, worldBox.max.z);
    }

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(tshirtGroup);
      console.log('Model contains embedded animations:', gltf.animations.map(a => a.name));
    }

    // Hide loader
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
  }, undefined, (error) => {
    console.error('Error loading GLTF model:', error);
    loader.querySelector('.loader-text').innerText = 'Error loading 3D Model.';
  });
}

// --- Setup Premium Shader Material ---
function setupMeshMaterial(mesh) {
  // Determine if it is outside mesh or inside/other components
  const isOutside = mesh.name.toLowerCase().includes('outside') || mesh.name.toLowerCase().includes('body') || mesh.name.toLowerCase().includes('sleeve') || mesh.name.toLowerCase().includes('collar');
  const isSleeve = mesh.name.toLowerCase().includes('sleeve');
  const isCollar = mesh.name.toLowerCase().includes('collar');

  const aoMap = isOutside ? defaultOutsideAO : defaultInsideAO;

  const meshColor = isSleeve 
    ? new THREE.Color(state.sleevesColor) 
    : (isCollar ? new THREE.Color(state.collarColor) : new THREE.Color(state.garmentColor));

  // Custom standard material
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffffff'), // Base color (controlled by shader uniforms)
    roughness: 0.65,
    metalness: 0.1,
    map: defaultOutsideAO, // Force Three.js to compile UV attributes (vMapUv) in the shader!
    normalMap: normalFabric,
    normalScale: new THREE.Vector2(0.65, 0.65),
    side: THREE.DoubleSide,
    transparent: false,
    depthWrite: true
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGarmentColor = { value: new THREE.Color(state.garmentColor) };
    shader.uniforms.uSleevesColor = { value: new THREE.Color(state.sleevesColor) };
    shader.uniforms.uCollarColor = { value: new THREE.Color(state.collarColor) };
    shader.uniforms.uOutsideAoTex = { value: defaultOutsideAO };
    shader.uniforms.uInsideAoTex = { value: defaultInsideAO };
    shader.uniforms.uAcidWashTex = { value: acidWashTexture };
    shader.uniforms.uAcidWashIntensity = { value: state.acidWash };
    shader.uniforms.uDesignTex = { value: state.activeDesign ? state.activeDesign : defaultDesignTexture };
    shader.uniforms.uDesignEnabled = { value: true };
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

    // Apply color modifications before standard shading output
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      // Base color based on UV regions (flipY=false space — Y axis is inverted vs source image)
      // Sleeves: originally at image bottom (y<0.18) → in model UV y>0.82
      // Collar:  originally at image top (y>0.70) → in model UV y<0.30
      // Body:    middle region 0.30 <= y <= 0.82
      vec3 baseColor = uGarmentColor;
      if (vMapUv.y > 0.82) {
        baseColor = uSleevesColor;
      } else if (vMapUv.y < 0.30) {
        baseColor = uCollarColor;
      }

      diffuseColor.rgb = baseColor;

      // Apply AO mapping manually based on front/back facing
      vec4 aoTexColor = gl_FrontFacing
        ? texture2D(uOutsideAoTex, vMapUv)
        : texture2D(uInsideAoTex, vMapUv);
      diffuseColor.rgb *= mix(vec3(1.0), aoTexColor.rgb, 0.6);

      // Apply Acid Wash texture overlay
      vec4 washColor = texture2D(uAcidWashTex, vMapUv * 2.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * washColor.rgb * 1.5, uAcidWashIntensity);

      // Apply Custom Graphic Design onto the front chest area
      // In flipY=false space the front body panel is roughly:
      //   x: 0.02 – 0.48,  y: 0.30 – 0.82  (body band excl. collar/sleeves)
      // Chest logo sits in upper-centre of that band.
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
  if (mixer) {
    mixer.update(delta * state.motionSpeed);
  }

  // 2. Procedural motion models
  if (tshirtGroup) {
    if (state.motion === 'walk') {
      // Bobbing up and down + subtle torso twisting swaying
      const swaySpeed = state.motionSpeed * 4.0;
      tshirtGroup.position.y = -1.2 + Math.sin(time * swaySpeed) * 0.05;
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
      tshirtGroup.position.y = -1.2;
      tshirtGroup.rotation.set(0, Math.PI, 0);
    } 
    else if (state.motion === 'knit') {
      // Zoom camera in close to show fabric details
      tshirtGroup.position.set(0, -1.2, 0);
      tshirtGroup.rotation.set(0, Math.PI, 0);
      tshirtMeshes.forEach(m => m.position.set(0, 0, 0));
      
      const targetZoomZ = 3.2;
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZoomZ, 0.05);
      controls.target.set(0, 0.2, 0);
    } 
    else {
      // Static mode
      tshirtGroup.position.y = -1.2;
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
    link.download = `custom-tshirt-${Date.now()}.glb`;
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
