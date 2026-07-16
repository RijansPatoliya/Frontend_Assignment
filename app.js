// --- 3D Interactive Shampoo Bottle Experience ---

// Global Variables for Three.js
let scene, camera, renderer, bottleGroup, floorShadow;
let bottleBodyMesh, labelMesh;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationVelocity = { x: 0, y: 0 };
let targetRotation = { x: 0.1, y: 0 };
let currentRotation = { x: 0.1, y: 0 };
let autoSpinActive = true;
let autoSpinTimer = null;

// Color Customizer mapping
const colorMapping = {
  '#7053E7': 0x7053E7, // Original Purple
  '#E94F37': 0xE94F37, // Sunset Coral
  '#0EAD69': 0x0EAD69, // Emerald Green
  '#F25F5C': 0xF25F5C, // Bubblegum Pink
  '#247BA0': 0x247BA0  // Ocean Blue
};

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  initThree();
  initColorCustomizer();
  initDragHint();
});

// Setup Three.js Scene
function initThree() {
  const container = document.getElementById('canvas-container');
  const loader = document.getElementById('canvas-loader');
  
  // 1. Create Scene
  scene = new THREE.Scene();
  
  // 2. Create Camera
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.4, 4); // Positioned slightly up and back

  // 3. Create WebGL Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  
  // Append Canvas
  container.appendChild(renderer.domElement);
  
  // 4. Create Main Group for the Bottle
  bottleGroup = new THREE.Group();
  scene.add(bottleGroup);

  // 5. Build Procedural Bottle
  buildBottle();
  createFloorShadow();

  // 6. Setup Lighting
  setupLighting();

  // Hide Loader when done
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 500);
  }

  // 7. Bind Interactions
  bindInputEvents(container);

  // 8. Start Animation Loop
  animate();

  // Handle Resize
  window.addEventListener('resize', onWindowResize);
}

// Draw high-resolution dynamic label texture
function createLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Fill Background (Solid Off-White/Premium Paper)
  ctx.fillStyle = '#fbfbfb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle Border/Frame
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 15;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Draw "HAIRCARE" subtitle
  ctx.fillStyle = '#7053E7'; // Brand Accent
  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText('FROM ROOT TO SHINE', canvas.width / 2, 280);

  // Draw Logo "bolly"
  ctx.fillStyle = '#121118';
  ctx.font = '900 130px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '-4px';
  ctx.fillText('bolly', canvas.width / 2, 420);

  // Draw Divider Line
  ctx.fillStyle = '#121118';
  ctx.fillRect(canvas.width / 2 - 120, 480, 240, 4);

  // Draw "Clarify"
  ctx.font = '500 48px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('Clarify', canvas.width / 2, 570);

  // Draw "Shampoo"
  ctx.font = 'italic 50px "Playfair Display", serif';
  ctx.fillStyle = '#565360';
  ctx.fillText('Shampoo', canvas.width / 2, 635);

  // Draw Ingredients
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#7053E7';
  ctx.letterSpacing = '2px';
  ctx.fillText('SALICYLIC ACID + TEA TREE OIL', canvas.width / 2, 730);

  // Draw Details
  ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#8a8795';
  ctx.letterSpacing = '1px';
  ctx.fillText('Anti-Dandruff & Scalp Care', canvas.width / 2, 780);
  ctx.fillText('Eliminates Flakes • Deep Hydration', canvas.width / 2, 815);

  // Draw Capacity
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#121118';
  ctx.fillText('300ml e 10.1 fl. oz.', canvas.width / 2, 900);

  // Create Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  return texture;
}

// Build the Shampoo Bottle using standard Three.js geometries
function buildBottle() {
  // --- Materials ---
  
  // 1. Glassy Purple Bottle Body Material (MeshPhysicalMaterial for maximum premium feel)
  const bottleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x7053E7,
    roughness: 0.1,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transmission: 0.45,  // Translucent look
    thickness: 0.4,       // Glass refraction wall depth
    ior: 1.5,             // Index of refraction
    transparent: true,
    opacity: 0.95
  });
  
  // 2. Matte White Plastic Pump Cap Material
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.05
  });

  // 3. Label Material
  const labelTexture = createLabelTexture();
  // We flip the texture wrap mapping so it displays correctly on the cylindrical surface
  labelTexture.wrapS = THREE.ClampToEdgeWrapping;
  labelTexture.wrapT = THREE.ClampToEdgeWrapping;

  const labelMaterial = new THREE.MeshStandardMaterial({
    map: labelTexture,
    roughness: 0.35,
    metalness: 0.0
  });

  // --- Geometries & Mesh Creation ---

  // Bottle Body Lathe profile points (smooth curves)
  const points = [];
  const segments = 64;
  
  // Construct the silhouette outline of a flat-bottom, round-shouldered bottle
  // bottom flat base
  points.push(new THREE.Vector2(0, -0.9));
  points.push(new THREE.Vector2(0.42, -0.9));
  // rounded bottom corner
  points.push(new THREE.Vector2(0.44, -0.87));
  points.push(new THREE.Vector2(0.45, -0.82));
  // straight vertical body
  points.push(new THREE.Vector2(0.45, 0.45));
  // rounded shoulder
  points.push(new THREE.Vector2(0.44, 0.55));
  points.push(new THREE.Vector2(0.40, 0.64));
  points.push(new THREE.Vector2(0.32, 0.72));
  points.push(new THREE.Vector2(0.24, 0.76));
  // neck transition
  points.push(new THREE.Vector2(0.20, 0.78));
  points.push(new THREE.Vector2(0.18, 0.88));
  points.push(new THREE.Vector2(0.18, 0.95));
  points.push(new THREE.Vector2(0, 0.95)); // Close top neck

  const bottleBodyGeo = new THREE.LatheGeometry(points, segments);
  bottleBodyMesh = new THREE.Mesh(bottleBodyGeo, bottleMaterial);
  bottleBodyMesh.castShadow = true;
  bottleBodyMesh.receiveShadow = true;
  bottleGroup.add(bottleBodyMesh);

  // --- Front Label Sticker ---
  // Create a half-cylinder wrapped around the front of the bottle
  const labelGeo = new THREE.CylinderGeometry(0.455, 0.455, 0.95, 32, 1, true, -Math.PI / 2.3, Math.PI / 1.15);
  labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
  labelMesh.position.set(0, -0.1, 0); // Position on the straight section of the bottle
  labelMesh.castShadow = true;
  bottleGroup.add(labelMesh);

  // --- Cap Collar (Screw cap base) ---
  const collarGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.12, 32);
  const collar = new THREE.Mesh(collarGeo, capMaterial);
  collar.position.set(0, 0.98, 0);
  collar.castShadow = true;
  bottleGroup.add(collar);

  // --- Pump Mechanism ---
  // Vertical stem
  const stemGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.16, 16);
  const stem = new THREE.Mesh(stemGeo, capMaterial);
  stem.position.set(0, 1.12, 0);
  stem.castShadow = true;
  bottleGroup.add(stem);

  // Pump Nozzle Head (Joint)
  const nozzleJointGeo = new THREE.SphereGeometry(0.11, 24, 24);
  const nozzleJoint = new THREE.Mesh(nozzleJointGeo, capMaterial);
  nozzleJoint.position.set(0, 1.2, 0);
  nozzleJoint.castShadow = true;
  bottleGroup.add(nozzleJoint);

  // Pump Nozzle Spout (Extruding forward on the Z-axis)
  const spoutGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.32, 16);
  spoutGeo.rotateX(Math.PI / 2.2); // Rotated forward
  const spout = new THREE.Mesh(spoutGeo, capMaterial);
  spout.position.set(0, 1.22, 0.15);
  spout.castShadow = true;
  bottleGroup.add(spout);

  // --- Align & Center Group ---
  // Adjust group origin to be in the center of the bottle body
  bottleGroup.position.set(0, -0.1, 0);
}

// Studio Lighting Configuration
function setupLighting() {
  // Ambient Soft Fill
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  // Key Studio Light (Front Right, Casts Shadow)
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
  keyLight.position.set(3, 4, 3.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.bias = -0.001;
  scene.add(keyLight);

  // Fill Light (Front Left, Softening Shadows)
  const fillLight = new THREE.DirectionalLight(0xdbe3ff, 0.45);
  fillLight.position.set(-3, 1, 2);
  scene.add(fillLight);

  // Rim Backlight (Creates the glowing translucency edge)
  const rimLight = new THREE.DirectionalLight(0xffffff, 1.3);
  rimLight.position.set(-2, 3, -4);
  scene.add(rimLight);

  // Extra soft bottom bounce light
  const bounceLight = new THREE.DirectionalLight(0xfff6e0, 0.3);
  bounceLight.position.set(0, -4, 0);
  scene.add(bounceLight);
}

// Bind Mouse/Touch Input Events for Rotation
function bindInputEvents(container) {
  // Pointer Down (Mouse & Touch merged)
  container.addEventListener('pointerdown', (e) => {
    isDragging = true;
    autoSpinActive = false;
    clearTimeout(autoSpinTimer);
    
    // Set initial position
    previousMousePosition = {
      x: e.clientX,
      y: e.clientY
    };
    
    // Set active cursor style
    container.style.cursor = 'grabbing';
  });

  // Pointer Move (Mouse Drag / Touch Swipe)
  window.addEventListener('pointermove', (e) => {
    if (!isDragging) {
      // Parallax hover tilt when not dragging
      const mouseX = (e.clientX / window.innerWidth) - 0.5;
      const mouseY = (e.clientY / window.innerHeight) - 0.5;
      
      if (autoSpinActive) {
        targetRotation.x = 0.1 + (mouseY * 0.15);
        // Do not lock Y rotation parallax during autoSpin, let it spin freely
      }
      return;
    }

    const deltaMove = {
      x: e.clientX - previousMousePosition.x,
      y: e.clientY - previousMousePosition.y
    };

    // Sensitivity multipliers
    const sensitivityX = 0.007;
    const sensitivityY = 0.007;

    // Apply rotation targets
    targetRotation.y += deltaMove.x * sensitivityX;
    targetRotation.x += deltaMove.y * sensitivityY;

    // Limit vertical tilting (X-axis) to avoid flipping upside down
    targetRotation.x = Math.max(-0.25, Math.min(0.5, targetRotation.x));

    // Record instantaneous velocity for inertia release
    rotationVelocity = {
      x: deltaMove.y * sensitivityY,
      y: deltaMove.x * sensitivityX
    };

    previousMousePosition = {
      x: e.clientX,
      y: e.clientY
    };
  });

  // Pointer Up / Release Drag
  window.addEventListener('pointerup', () => {
    if (!isDragging) return;
    isDragging = false;
    container.style.cursor = 'grab';

    // Restart auto spin after 4 seconds of inactivity
    autoSpinTimer = setTimeout(() => {
      autoSpinActive = true;
      rotationVelocity = { x: 0, y: 0 }; // Clear residual drag velocity
    }, 4000);
  });
}

// Handle Window Resizing
function onWindowResize() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

// Color Customizer Dots Event Listeners
function initColorCustomizer() {
  const dots = document.querySelectorAll('.color-dot');
  
  const blobColors = {
    '#7053E7': ['rgba(222, 210, 255, 0.5)', 'rgba(253, 218, 255, 0.45)', 'rgba(254, 253, 210, 0.35)'],
    '#E94F37': ['rgba(255, 210, 210, 0.5)', 'rgba(255, 230, 210, 0.45)', 'rgba(255, 254, 220, 0.35)'],
    '#0EAD69': ['rgba(210, 255, 225, 0.5)', 'rgba(215, 255, 250, 0.45)', 'rgba(254, 253, 210, 0.35)'],
    '#F25F5C': ['rgba(255, 215, 225, 0.5)', 'rgba(255, 235, 210, 0.45)', 'rgba(240, 210, 255, 0.35)'],
    '#247BA0': ['rgba(210, 235, 255, 0.5)', 'rgba(210, 255, 250, 0.45)', 'rgba(230, 215, 255, 0.35)']
  };

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      // Remove active from all dots
      dots.forEach(d => d.classList.remove('active'));
      
      // Add active to clicked dot
      const clickedDot = e.target;
      clickedDot.classList.add('active');
      
      // Update Three.js material color with transition
      const colorHex = clickedDot.getAttribute('data-color');
      const targetColor = new THREE.Color(colorMapping[colorHex]);
      
      // Smooth color change animation using tween-like linear interpolation in the loop
      animateColorChange(bottleBodyMesh.material.color, targetColor);

      // Upgrade color theme of HTML document
      document.documentElement.style.setProperty('--color-brand-primary', colorHex);
      
      // Fade the background blob colors dynamically to match
      const blobs = blobColors[colorHex];
      if (blobs) {
        document.documentElement.style.setProperty('--color-blob-1', blobs[0]);
        document.documentElement.style.setProperty('--color-blob-2', blobs[1]);
        document.documentElement.style.setProperty('--color-blob-3', blobs[2]);
      }
    });
  });
}

// Create dynamic soft reflection floor shadow
function createFloorShadow() {
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shadowCtx = shadowCanvas.getContext('2d');
  
  // Radial gradient: dark center, fading to transparent edges
  const gradient = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.08)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  shadowCtx.fillStyle = gradient;
  shadowCtx.fillRect(0, 0, 128, 128);

  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(1.4, 1.4);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false
  });

  floorShadow = new THREE.Mesh(shadowGeo, shadowMat);
  floorShadow.position.set(0, -0.92, 0); // Flat on the floor directly under the bottle
  floorShadow.rotation.x = -Math.PI / 2;
  scene.add(floorShadow);
}

// Linear color interpolator utility
function animateColorChange(currentThreeColor, targetColor) {
  let steps = 0;
  const maxSteps = 25;
  const stepR = (targetColor.r - currentThreeColor.r) / maxSteps;
  const stepG = (targetColor.g - currentThreeColor.g) / maxSteps;
  const stepB = (targetColor.b - currentThreeColor.b) / maxSteps;

  const interval = setInterval(() => {
    currentThreeColor.r += stepR;
    currentThreeColor.g += stepG;
    currentThreeColor.b += stepB;
    steps++;
    if (steps >= maxSteps) {
      clearInterval(interval);
      // Ensure precise color match
      currentThreeColor.copy(targetColor);
    }
  }, 16);
}

// Show/Hide Drag Hint after load
function initDragHint() {
  const hint = document.querySelector('.drag-hint');
  if (hint) {
    setTimeout(() => {
      hint.style.opacity = '1';
      // Fade out hint after 5 seconds
      setTimeout(() => {
        hint.style.opacity = '0';
      }, 5000);
    }, 1500);
  }
}

// Main Render & Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Apply Easing (Inertia Damping) for rotation
  if (isDragging) {
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.25;
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.25;
  } else {
    // Auto rotation active
    if (autoSpinActive) {
      targetRotation.y += 0.004; // Gentle continuous rotation
    } else {
      // Decay velocity when drag is released but before auto-spin restarts
      targetRotation.y += rotationVelocity.y;
      targetRotation.x += rotationVelocity.x;
      rotationVelocity.y *= 0.95; // Damping factor
      rotationVelocity.x *= 0.95;
    }
    
    // Smooth interpolations
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.12;
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.12;
  }

  // Apply rotations to the bottle group
  if (bottleGroup) {
    bottleGroup.rotation.y = currentRotation.y;
    bottleGroup.rotation.x = currentRotation.x;
    
    // Add subtle idle breathing floating animation
    const time = Date.now() * 0.0015;
    const breathe = Math.sin(time) * 0.04;
    bottleGroup.position.y = -0.1 + breathe;

    // Animate floor shadow scale and transparency based on breathing height
    if (floorShadow) {
      floorShadow.scale.setScalar(1 - breathe * 1.2);
      floorShadow.material.opacity = 0.8 - (breathe * 2.0);
    }
  }

  renderer.render(scene, camera);
}
