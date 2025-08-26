// your-script.js
// This script sets up a Three.js scene inside the DOM element with ID "threejs-container"

(function () {
  // 1. Get the container DOM element
  const container = document.getElementById('threejs-container');

  // Get the actual width and height of the container in pixels
  const width = container.clientWidth;
  const height = container.clientHeight;

  // 2. Create the Three.js scene
  const scene = new THREE.Scene();

  // 3. Set up the camera
  // PerspectiveCamera(FOV, aspect ratio, near clip, far clip)
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);

  // 4. Create the renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias smooths edges
  renderer.setSize(width, height);            // Match canvas size to container
  renderer.setClearColor(0xf0f0f0);           // Light grey background
  container.appendChild(renderer.domElement); // Add the renderer canvas to the DOM

  // 5. Handle window resize to keep canvas responsive
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;

    // Update camera settings
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    // Resize renderer to match new container size
    renderer.setSize(newWidth, newHeight);
  });

  // 7. Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.7); // Soft light everywhere
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7); // Directional light like the sun
  dirLight.position.set(5, 10, 7); // Set position above the scene
  scene.add(dirLight);

  // ===== Controls panel: visibility toggles for loaded objects =====
  function ensureControlsPanel() {
    let panel = document.getElementById('controls-3');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'controls-3';
      panel.className = 'controls';
      // Insert panel above the threejs container
      const h = document.createElement('div');
      h.style.gridColumn = '1 / -1';
      h.style.fontWeight = '700';
      h.textContent = 'Toggle Structures:';
      panel.appendChild(h);
      container.parentNode.insertBefore(panel, container);
    }
    return panel;
  }

  const objects = { ground: null, shell: null, trench: null, cleanroom: null, shellFoundation: null, cleanroomFoundation: null };
  const checkboxes = {};
  function addToggle(key, label) {
    const panel = ensureControlsPanel();
    const wrapper = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true; // default visible
    cb.addEventListener('change', () => {
      if (objects[key]) objects[key].visible = cb.checked;
    });
    const span = document.createElement('span');
    span.textContent = label;
    wrapper.appendChild(cb);
    wrapper.appendChild(span);
    panel.appendChild(wrapper);
    checkboxes[key] = cb;
  }

  addToggle('ground', 'Ground');
  addToggle('shell', 'Shell');
  addToggle('trench', 'Trench');
  addToggle('cleanroom', 'Cleanroom');
  addToggle('shellFoundation', 'Shell Foundation');
  addToggle('cleanroomFoundation', 'Cleanroom Foundation');

  // (no helper required now; foundations are separate GLBs)

  // GLB Model Loader (ground.glb)
  // =============================
  // GLB MODEL LOADING SECTION
  // This part loads and adds the ground.glb file to the scene
  // =============================
  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.load('3d-obj/ground.glb', function (gltf) {
    const model = gltf.scene;
  model.name = 'ground';
    // Position the model at the origin
    model.position.set(0, 0, 0);
    // Scale the model down by 1:100
    model.scale.set(0.1, 0.1, 0.1);
    scene.add(model);
    objects.ground = model;
    if (checkboxes.ground) model.visible = checkboxes.ground.checked;
  }, undefined, function (error) {
    console.error('Error loading GLB model:', error);
  });

  gltfLoader.load('3d-obj/shell.glb', function (gltf) {
    const model = gltf.scene;
  model.name = 'shell';
    // Position the model at the origin
    model.position.set(0, 0, 0);
    // Scale the model down by 1:100
    model.scale.set(0.1, 0.1, 0.1);
    scene.add(model);
    objects.shell = model;
    if (checkboxes.shell) model.visible = checkboxes.shell.checked;
  }, undefined, function (error) {
    console.error('Error loading GLB model:', error);
  });

  gltfLoader.load('3d-obj/trench.glb', function (gltf) {
    const model = gltf.scene;
  model.name = 'trench';
    // Position the model at the origin
    model.position.set(0, 0, 0);
    // Scale the model down by 1:100
    model.scale.set(0.1, 0.1, 0.1);
    scene.add(model);
    objects.trench = model;
    if (checkboxes.trench) model.visible = checkboxes.trench.checked;
  }, undefined, function (error) {
    console.error('Error loading GLB model:', error);
  });

  gltfLoader.load('3d-obj/cleanroom.glb', function (gltf) {
    const model = gltf.scene;
  model.name = 'cleanroom';
    // Position the model at the origin
    model.position.set(0, 0, 0);
    // Scale the model down by 1:100
    model.scale.set(0.1, 0.1, 0.1);
    scene.add(model);
    objects.cleanroom = model;
    if (checkboxes.cleanroom) model.visible = checkboxes.cleanroom.checked;
  }, undefined, function (error) {
    console.error('Error loading GLB model:', error);
  });

  // Load separate Foundation GLBs and bind to their toggles
  gltfLoader.load('3d-obj/shell-foundation.glb', function (gltf) {
    const model = gltf.scene;
  model.name = 'shellFoundation';
    model.position.set(0, 0, 0);
    model.scale.set(0.1, 0.1, 0.1);
    scene.add(model);
    objects.shellFoundation = model;
    if (checkboxes.shellFoundation) model.visible = checkboxes.shellFoundation.checked;
  }, undefined, function (error) {
    console.error('Error loading GLB model:', error);
  });

  gltfLoader.load('3d-obj/cleanroom-foundation.glb', function (gltf) {
    const model = gltf.scene;
  model.name = 'cleanroomFoundation';
    model.position.set(0, 0, 0);
    model.scale.set(0.1, 0.1, 0.1);
    scene.add(model);
    objects.cleanroomFoundation = model;
    if (checkboxes.cleanroomFoundation) model.visible = checkboxes.cleanroomFoundation.checked;
  }, undefined, function (error) {
    console.error('Error loading GLB model:', error);
  });


  // =============================



  // 9. Position the camera to look at the scene
  camera.position.set(8, 8, 8); // pull back and up
  camera.lookAt(0, 0, 0);       // center the view on the origin

  // 10. Add orbit controls for user interaction
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;        // Smooth camera motion
  controls.dampingFactor = 0.1;         // Strength of damping
  controls.screenSpacePanning = false;  // Only allow panning vertically and horizontally
  controls.minDistance = 4;             // Zoom limits
  controls.maxDistance = 40;
  controls.target.set(0, 1, 0);         // Camera looks slightly above the ground

  // 11. Animation loop to keep rendering
  function animate() {
    requestAnimationFrame(animate); // Call animate again on next frame
    controls.update();              // Update camera controls
    renderer.render(scene, camera); // Draw the scene
  }

  animate(); // Start animation
})();
