// Initialize Three.js Scene
const container = document.getElementById('container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Set fog for atmospheric effect
scene.fog = new THREE.Fog(0x000000, 10, 100);

// Skybox with texture
const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
    'skybox/right.png',  // Replace with the correct file paths
    'skybox/left.png',
    'skybox/top.png',
    'skybox/bottom.png',
    'skybox/front.png',
    'skybox/back.png'
]);
scene.background = texture;

// Add dynamic lighting
const light1 = new THREE.PointLight(0xff0040, 2, 100);
light1.position.set(50, 50, 50);
scene.add(light1);

const light2 = new THREE.PointLight(0x00ff80, 2, 100);
light2.position.set(-50, -50, 50);
scene.add(light2);

// Create the moving path
const geometry = new THREE.CylinderGeometry(5, 5, 200, 32);
const material = new THREE.MeshStandardMaterial({ color: 0x444444, side: THREE.DoubleSide });
const path = new THREE.Mesh(geometry, material);
path.rotation.x = Math.PI / 2;
scene.add(path);

// Add some floating structures (rocks or trees) along the path
function addFloatingStructures() {
    const structureGeometry = new THREE.DodecahedronGeometry(2, 0);
    const structureMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

    for (let i = 0; i < 10; i++) {
        const structure = new THREE.Mesh(structureGeometry, structureMaterial);
        structure.position.set(Math.random() * 20 - 10, Math.random() * 5, Math.random() * 100 - 50);
        structure.rotation.x = Math.random() * Math.PI;
        structure.rotation.y = Math.random() * Math.PI;
        scene.add(structure);
    }
}
addFloatingStructures();

// Create particle system for more environmental effects (like dust particles)
function createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const positions = [];

    for (let i = 0; i < particlesCount; i++) {
        positions.push((Math.random() - 0.5) * 50);
        positions.push((Math.random() - 0.5) * 50);
        positions.push(Math.random() * 100);
    }

    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.7
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);
}
createParticles();

// Camera position and movement
camera.position.z = 20;
camera.position.y = 10;

// Animate camera movement and the path
function animateScene() {
    requestAnimationFrame(animateScene);

    // Move camera and path for a dynamic feel
    camera.position.y += 0.02;
    path.rotation.z += 0.01;

    renderer.render(scene, camera);
}

animateScene();

// UI Logic for Play Button
const playButton = document.getElementById('play-btn');
const levelSelection = document.getElementById('level-selection');
const mainMenu = document.getElementById('main-menu');

playButton.addEventListener('click', function () {
    mainMenu.style.display = 'none';
    levelSelection.style.display = 'block';
});

// Resize handler
window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
