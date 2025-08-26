// three-sketch.js
// This script creates a Three.js scene with a rotating box on a wireframe grid

(function() {
  // Scene, camera, renderer setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 800 / 400, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(800, 400);
  renderer.setClearColor(0xf0f0f0); // Light gray background

  document.getElementById('threejs-container-1').appendChild(renderer.domElement);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  // Create a wireframe grid
  const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x888888);
  scene.add(gridHelper);

  // Create a box
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({ color: 0x3264a8, shininess: 100 });
  const box = new THREE.Mesh(geometry, material);
  box.position.y = 0.5; // Sit on top of the grid
  scene.add(box);

  // Position the camera
  camera.position.set(3, 3, 5);
  camera.lookAt(0, 0.5, 0);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    box.rotation.x += 0.01;
    box.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
})(); 