// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('GameContainer').appendChild(renderer.domElement);

// Variables for player, score, health, and mixers
let player, mixer;
let score = 0;
let coinsCollected = 0;
let player_speed = 0.2;
//let jumpSpeed = 0.8;
// Set up event listeners for character movement
let moveLeft = false, moveRight = false, jump = false;
let health = 100; // Starting health
const healthBar = document.getElementById('health-bar');
const scoreDisplay = document.getElementById('score-display');
const coinDisplay = document.getElementById('coin-display');
const gameOverMessage = document.getElementById('game-over-message');

// Load the GLTF character model
const loader = new THREE.GLTFLoader();
loader.load(
    'Assets/models/female_character_running.glb', // Path to GLB file
    (gltf) => {
        player = gltf.scene;
        player.scale.set(0.6, 0.6, 0.6);
        player.rotation.y = Math.PI;

        mixer = new THREE.AnimationMixer(player);
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        });

        player.position.set(0, 0.5, 0.5);
        scene.add(player);

        animate();
    },
    undefined,
    (error) => {
        console.error('Error loading model:', error);
    }
);
document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft') moveLeft = true;
    if (event.code === 'ArrowRight') moveRight = true;
    if (event.code === 'ArrowUp') jump = true;
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft') moveLeft = false;
    if (event.code === 'ArrowRight') moveRight = false;
    if (event.code === 'ArrowUp') jump = false;
});


// Add ground
const snowTexture = new THREE.TextureLoader().load('Assets/textures/snow_path.jpg'); // Replace with a local texture path if needed
snowTexture.wrapS = snowTexture.wrapT = THREE.RepeatWrapping;
snowTexture.repeat.set(20, 20);

// Add an infinite ground reset mechanism
function resetGroundPosition() {
    if (ground.position.z > player.position.z + 100) {
        ground.position.z = player.position.z - 200;
    }
}

const snowMaterial = new THREE.MeshStandardMaterial({
    map: snowTexture,
    emissive: new THREE.Color(0x1e90ff),
    emissiveIntensity: 0.5,
    roughness: 0.9,
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), snowMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Add lights
const ambientLight = new THREE.AmbientLight(0x87cefa, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// Add coins (collectibles)
function createCoin(x, y, z) {
    const coinGeometry = new THREE.TorusGeometry(0.4, 0.15, 16, 100);
    const coinMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffa500,
        emissiveIntensity: 0.8,
    });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    coin.position.set(x, y, z);
    scene.add(coin);
    return coin;
}

const coins = [];
for (let i = 0; i < 20; i++) {
    coins.push(createCoin(Math.random() * 20 - 10, 0.5, Math.random() * -30));
}

// Add obstacles (snowballs and icy shards)
function createShard(x, y, z) {
    const shardGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
    const shardMaterial = new THREE.MeshStandardMaterial({
        color: 0xadd8e6,
        transparent: true,
        opacity: 0.8,
        emissive: new THREE.Color(0x87cefa),
        emissiveIntensity: 0.4,
    });
    const shard = new THREE.Mesh(shardGeometry, shardMaterial);
    shard.position.set(x, y, z);
    scene.add(shard);
    return shard;
}

// Add function to create moving snowballs
function createSnowball(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const snowball = new THREE.Mesh(geometry, material);
    snowball.position.set(x, y, z);
    scene.add(snowball);
    return snowball;
}

const snowballs = [];
for (let i = 0; i < 5; i++) {
    snowballs.push(createSnowball(Math.random() * 10 - 5, 1, -30 - i * 20));
}

// Create bounding boxes for player and obstacles
function createBoundingBox(object) {
    const box = new THREE.Box3().setFromObject(object);
    return box;
}

function checkCollisions() {
    if (!player) return;

    // Update player bounding box
    const playerBox = createBoundingBox(player);

    // Check for collisions with coins
    coins.forEach((coin, index) => {
        const coinBox = createBoundingBox(coin);
        if (playerBox.intersectsBox(coinBox)) {
            scene.remove(coin);
            coins.splice(index, 1);
            coinsCollected++;
            score += 10;
            coinDisplay.textContent = `Coins: ${coinsCollected}`;
            scoreDisplay.textContent = `Score: ${score}`;
        }
    });

    // Check for collisions with obstacles (snowballs and shards)
    [...snowballs, ...shards].forEach((obstacle) => {
        const obstacleBox = createBoundingBox(obstacle);
        if (playerBox.intersectsBox(obstacleBox)) {
            player.position.z += 1; // Bounce player back on collision
            health -= 10;
            healthBar.style.width = `${health}%`;
            if (health <= 0) endGame();
        }
    });
}

// Function to move snowballs
function moveSnowballs() {
    snowballs.forEach((snowball) => {
        snowball.position.z += player_speed * 2; // Snowballs move towards the player
        if (snowball.position.z > player.position.z + 10) {
            snowball.position.z = player.position.z - 100; // Reset snowball to appear farther back
        }
    });
}

const shards = [];
for (let i = 0; i < 10; i++) {
    shards.push(createShard(Math.random() * 20 - 10, 1, Math.random() * -30));
}

// Snowflake particles
const snowflakeGeometry = new THREE.BufferGeometry();
const snowflakeCount = 1000;
const snowflakePositions = new Float32Array(snowflakeCount * 3);

for (let i = 0; i < snowflakeCount; i++) {
    snowflakePositions[i * 3] = Math.random() * 50 - 25;
    snowflakePositions[i * 3 + 1] = Math.random() * 20 + 5;
    snowflakePositions[i * 3 + 2] = Math.random() * 50 - 25;
}

snowflakeGeometry.setAttribute('position', new THREE.BufferAttribute(snowflakePositions, 3));

const snowflakeMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
});
const snowflakes = new THREE.Points(snowflakeGeometry, snowflakeMaterial);
scene.add(snowflakes);


// End game
function endGame() {
    gameOverMessage.style.display = 'block';
    renderer.setAnimationLoop(null); // Stop the render loop
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update animations
    if (mixer) {
        mixer.update(0.02); // Adjust the delta time as needed
    }

    // Move player forward
    player.position.z -= player_speed;

    // Horizontal controls
    if (moveLeft && player.position.x > -5) player.position.x -= 0.1;
    if (moveRight && player.position.x < 5) player.position.x += 0.1;

    // Jump control
    if (jump) player.position.y = Math.min(player.position.y + 0.15, 2);
    else player.position.y = Math.max(player.position.y - 0.15, 0);

    camera.position.z = player.position.z + 10; // Make camera follow player
    camera.position.x = player.position.x;

    // Update snowfall
    const positions = snowflakes.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.05; // Move each snowflake down
        if (positions[i] < -5) {
            positions[i] = 15; // Reset snowflake to top
        }
    }
    snowflakes.geometry.attributes.position.needsUpdate = true;

    checkCollisions(); // Check for collisions
    resetGroundPosition();
    moveSnowballs();

    renderer.render(scene, camera);
}



// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
