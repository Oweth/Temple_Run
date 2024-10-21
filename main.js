import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { TextureLoader } from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Loading the grass texture for the path
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('Assets/background.png');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(10, 10);

// Creating the path
const pathGeometry = new THREE.PlaneGeometry(5, 50);
const pathMaterial = new THREE.MeshBasicMaterial({ map: grassTexture, side: THREE.DoubleSide });
const path = new THREE.Mesh(pathGeometry, pathMaterial);
path.rotation.x = -Math.PI / 2;
scene.add(path);

// Character setup (using a cube as a placeholder)
const characterGeometry = new THREE.BoxGeometry(1, 1, 1);
const characterMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const character = new THREE.Mesh(characterGeometry, characterMaterial);
character.position.set(0, 0.5, 0);
scene.add(character);

// Creating obstacles
const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const obstacles = [];
const obstaclePositions = [
    { x: 0, z: 10 }, { x: 2, z: 15 }, { x: -2, z: 20 }, { x: 1, z: 25 },
    { x: 0, z: 30 }, { x: 2, z: 35 }, { x: -2, z: 40 }, { x: 1, z: 45 },
    { x: 0, z: 50 }, { x: 2, z: 55 }, { x: -2, z: 60 }, { x: 1, z: 65 },
    { x: 0, z: 70 }, { x: 2, z: 75 }, { x: -2, z: 80 }, { x: 1, z: 85 },
    { x: 0, z: 90 }, { x: 2, z: 95 }, { x: -2, z: 100 }, { x: 1, z: 105 }
];

// Adding obstacles to the scene
obstaclePositions.forEach(pos => {
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(pos.x, 0.5, pos.z);
    obstacles.push(obstacle);
    scene.add(obstacle);
});

// Setting up the background
const backgroundTexture = textureLoader.load('Assets/TCom_3dplant_Bushgrass_001_header6.jpg');
const backgroundGeometry = new THREE.PlaneGeometry(1000, 1000);
const backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.DoubleSide });
const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
backgroundMesh.rotation.x = Math.PI / 2;
backgroundMesh.position.set(0, -10, -100);
scene.add(backgroundMesh);

// Camera positioning
camera.position.set(0, 5, 10);
camera.lookAt(character.position);

// Keyboard controls for moving the character
let moveLeft = false;
let moveRight = false;
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') moveLeft = true;
    if (event.key === 'ArrowRight') moveRight = true;
});
document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') moveLeft = false;
    if (event.key === 'ArrowRight') moveRight = false;
});

// Game messages for game over and finish line
const gameOverMessage = document.getElementById('gameOverMessage');
const finishLineMessage = document.createElement('div');
finishLineMessage.id = 'finishLineMessage';
finishLineMessage.innerText = 'Level 1 Completed!';
document.body.appendChild(finishLineMessage);

// Reset function for restarting the game
function resetGame() {
    character.position.set(0, 0.5, 0);
    obstacles.forEach((obstacle, index) => {
        const pos = obstaclePositions[index];
        obstacle.position.set(pos.x, 0.5, pos.z);
    });
    gameOverMessage.style.display = 'none';
    finishLineMessage.style.display = 'none';
}

// Pause, Resume, and Quit listeners
document.addEventListener('keydown', (event) => {
    if (event.key === 'P' || event.key === 'p') {
        pauseGame();
    }
    if (event.key === 'R' || event.key === 'r') {
        resumeGame();
    }
    if (event.key === 'Q' || event.key === 'q') {
        quitGame();
    }
});

let gamePaused = false;

// Function to pause the game
function pauseGame() {
    if (!gamePaused) {
        gamePaused = true;
        renderer.setAnimationLoop(null);  // Stops the animation loop
        console.log("Game paused");
    }
}

// Function to resume the game
function resumeGame() {
    if (gamePaused) {
        gamePaused = false;
        renderer.setAnimationLoop(animate);  // Resumes the animation loop
        console.log("Game resumed");
    }
}

// Function to quit the game
function quitGame() {
    console.log("Game quit");
    setTimeout(resetGame, 2000);
    renderer.setAnimationLoop(null);  // Stops the animation loop
}

// Animation loop
function animate() {
    if (!gamePaused) {
        // Update character movement and camera
        renderer.render(scene, camera);
        grassTexture.offset.y += 0.02;
        character.position.z += 0.1;

        // Move path and camera
        path.position.z = character.position.z - 20;
        camera.position.z = character.position.z + 10;
        camera.lookAt(character.position);

        // Collision detection
        const characterBox = new THREE.Box3().setFromObject(character);
        for (let i = 0; i < obstacles.length; i++) {
            const obstacleBox = new THREE.Box3().setFromObject(obstacles[i]);
            if (characterBox.intersectsBox(obstacleBox)) {
                console.log("Collision detected with obstacle " + i + "! Game Over.");
                gameOverMessage.style.display = 'block';
                setTimeout(resetGame, 2000);
                return;
            }
        }

        // Finish line check
        if (character.position.z >= 110) {
            finishLineMessage.style.display = 'block';
            setTimeout(resetGame, 3000);
            return;
        }

        // Handle left and right movement
        if (moveLeft && character.position.x > -2) character.position.x -= 0.1;
        if (moveRight && character.position.x < 2) character.position.x += 0.1;
    }
}

// Check for WebGL support and start animation
if (WebGL.isWebGL2Available()) {
    renderer.setAnimationLoop(animate);  // Starts the animation loop
} else {
    const warning = WebGL.getWebGL2ErrorMessage();
    document.getElementById('container').appendChild(warning);
}
