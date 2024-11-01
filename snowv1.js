let scene, camera, renderer, mixer;
let isPaused = false;
let player, ground, obstacles = [];
let playerSpeed = 0.7, jumpSpeed = 0.7, gravity = 0.01;
let isJumping = false, isGameOver = false;
let obstacleInterval = 500; // Time interval for obstacle spawning
let score = 0, scoreText = document.getElementById('score-display');
let health = 100, healthBar = document.getElementById('health-bar');
let coins = []; // Array to store coins
let coinInterval = 1000; // Time interval for coin spawning
let coinScore = 0; // Score for collecting coins
let coinText = document.getElementById('coin-display'); // Element to display coin score
let player_speed = 0.2;

let snowflakes = []; // Array to store snowflakes

// Function to create and position snowflakes
function spawnSnow() {
    const snowGeometry = new THREE.SphereGeometry(0.05, 8, 8); // Small sphere for snowflakes
    const snowMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // White color for snow

    for (let i = 0; i < 700; i++) { // Create a large number of snowflakes
        const snowflake = new THREE.Mesh(snowGeometry, snowMaterial);
        snowflake.position.x = (Math.random() - 0.5) * 10; // Spread snow across x-axis
        snowflake.position.y = Math.random() * 5 + 3; // Position above the ground
        snowflake.position.z = -Math.random() * 100; // Spread snowflakes along the z-axis

        scene.add(snowflake); // Add to the scene
        snowflakes.push(snowflake); // Store in array
    }
}

function addBackgroundImage(imagePath) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imagePath, (texture) => {
        const backgroundGeometry = new THREE.PlaneGeometry(200, 100); // Adjust size as needed
        const backgroundMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide // Make it visible from both sides
        });
        const backgroundPlane = new THREE.Mesh(backgroundGeometry, backgroundMaterial);

        // Position the background plane behind all objects
        backgroundPlane.position.z = -50; // Position behind the scene
        backgroundPlane.rotation.x = Math.PI / 2; // Rotate it to face the camera
        scene.add(backgroundPlane);
    });
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 3;
    
    addBackgroundImage('Assets/textures/cloud_texture.jpg');

    // Add light
    const ambientLight = new THREE.AmbientLight(0x404040, 1); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light
    directionalLight.position.set(5, 10, 5); // Position the light
    directionalLight.castShadow = true; // Enable shadows
    scene.add(directionalLight);

    const finishLineMessage = document.createElement('div');
    finishLineMessage.id = 'finishLineMessage';
    finishLineMessage.innerText = 'Level 1 Completed!';
    document.body.appendChild(finishLineMessage);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('GameContainer').appendChild(renderer.domElement);

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
            player.scale.set(1.2,1.4,1);
            scene.add(player);

            //animate();
        },
        undefined,
        (error) => {
            console.error('Error loading model:', error);
        }
    );

    // Add ground
    const snowTexture = new THREE.TextureLoader().load('Assets/textures/snow_path.jpg'); // Replace with a local texture path if needed
    snowTexture.wrapS = snowTexture.wrapT = THREE.RepeatWrapping;
    snowTexture.repeat.set(20, 20);
    const snowMaterial = new THREE.MeshStandardMaterial({
        map: snowTexture,
        emissive: new THREE.Color("0x1e90ff"), //new THREE.Color(0x1e90ff),
        emissiveIntensity: 0.5,
        roughness: 0.9,
    });
    ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200000), snowMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.scale.x = 0.07;
    ground.scale.z = 100000;
    scene.add(ground);
    // Listen for keypress to control player
    document.addEventListener('keydown', handleKeyDown);

    // Start obstacle spawning
    setInterval(spawnObstacle, obstacleInterval);

    //spawnBubbles();
    spawnSnow();

    animate();
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

// Handle player movement and jump
function handleKeyDown(event) {
    if (event.key === 'ArrowUp' && !isJumping) {
        isJumping = true;
        jumpSpeed = 0.2;
    }
}

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


// Animate the game (game loop)
// Animate the game (game loop)
function animate() {
    if (!isGameOver) {
        requestAnimationFrame(animate);

        // Update animations
        if (mixer) {
            mixer.update(0.02); // Adjust the delta time as needed
        }
        ground.position.z += playerSpeed;
        //player.position.z -= player_speed;

        // Make snowflakes fall
        snowflakes.forEach(snowflake => {
            snowflake.position.y -= 0.02; // Control fall speed
            if (snowflake.position.y < 0) { // Reset position when reaching the ground
                snowflake.position.y = Math.random() * 5 + 3; // Random height reset
                snowflake.position.x = (Math.random() - 0.5) * 10; // Random x position
                snowflake.position.z = -Math.random() * 100; // Reset z position
            }
        });

        // Move obstacles and check for collisions
        obstacles.forEach((obstacle, index) => {
            obstacle.position.z += playerSpeed;
            if (obstacle.position.z > 5) {
                scene.remove(obstacle);
                obstacles.splice(index, 1);
                score++;
                scoreText.innerHTML = 'Score: ' + score;
            }
            checkCollision(obstacle);
        });

        // Handle jumping logic
        if (isJumping) {
            player.position.y += jumpSpeed;
            jumpSpeed -= gravity;
            if (player.position.y <= 0.5) {
                player.position.y = 0.5;
                isJumping = false;
            }
        }

        // Update the camera to follow the player
        //camera.position.z = player.position.z + 10; // Position camera behind the player
        //camera.position.y = player.position.y + 2;  // Adjust camera height
        camera.lookAt(player.position);             // Keep camera focused on the player

        if (coinScore >= 10) {
            finishLineMessage.style.display = 'block';
            setTimeout(resetGame, 3000);
            return;
        }

        coins.forEach((coin, index) => {
            coin.position.z += playerSpeed; // Move coin forward
            if (coin.position.z > 5) {
                scene.remove(coin); // Remove if out of view
                coins.splice(index, 1); // Remove from array
            }
            checkCoinCollection(coin); // Check if player collects the coin
        });

        // Handle movement left and right
        if (moveLeft && player.position.x > -2) player.position.x -= 0.1;
        if (moveRight && player.position.x < 2) player.position.x += 0.1;
        

        renderer.render(scene, camera);
    }
}


function spawnObstacle() {
    const obstacleType = Math.random() > 0.5 ? 'snowballs' : 'tree'; // Randomly choose between stone or tree
    //let obstacle;

    if (obstacleType === 'snowballs') {
        const geometry = new THREE.SphereGeometry(0.8, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: "gray" });
        let snowbhola = new THREE.Mesh(geometry, material);
        snowbhola.position.z = -100; // Start far in the background
        snowbhola.position.y = 0.5;  // Place on the ground
        snowbhola.position.x = Math.random() > 0.5 ? 1.5 : -1.5; // Randomly place on left or right
        snowbhola.position.y += 1;
        scene.add(snowbhola);
        obstacles.push(snowbhola);
    } else {
        // Create the tree object
        let tree = new THREE.Object3D();
            
        // Create the trunk
        let trunkMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513, // Brown color for the trunk
            shininess: 10
        });
        let trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1), trunkMaterial);
        trunk.position.y = 0.5; // Move trunk to origin

        // Create the lower leaves (green)
        let lowerLeavesMaterial = new THREE.MeshPhongMaterial({
            color: 0x00DD00, // Green color for the lower leaves
            specular: 0x006000,
            shininess: 5
        });
        let lowerLeaves = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2, 16), lowerLeavesMaterial);
        lowerLeaves.position.y = 2; // Position lower leaves at the top of the trunk

        // Create the upper leaves (white, representing snow)
        let upperLeavesMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF, // White color for the upper part (snow)
            specular: 0xAAAAAA,
            shininess: 5
        });
        let upperLeaves = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 16), upperLeavesMaterial); // Slightly smaller cone
        upperLeaves.position.y = 2.45; // Position upper leaves above the lower leaves

        // Create snow effect on lower leaves (optional)
        let snowMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF, // Snow color
            transparent: true,
            opacity: 0.5, // Make it slightly transparent for a soft snow look
            shininess: 5
        });

        // Create a snow layer on the lower leaves
        //let snowLayer = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2), snowMaterial); // Use a cylinder to mimic snow covering
        //snowLayer.position.y = 2.2; // Slightly above the lower leaves to create a snow cap effect

        // Add trunk, leaves, and snow to the tree object
        tree.add(trunk);
        tree.add(lowerLeaves);
        tree.add(upperLeaves); // Add the upper leaves to the tree
        //tree.add(snowLayer); // Add the snow layer on the lower leaves

        // Position the tree in the scene
        tree.position.z = -100; // Start far in the background
        tree.position.y = 0.5;  // Place on the ground
        tree.position.x = Math.random() > 0.5 ? 1.5 : -1.5; // Randomly place on left or right

        // Add the tree to the scene and obstacles array
        scene.add(tree);
        obstacles.push(tree);

    }
}
// Function to spawn coins
function spawnCoin() {
    const coinGeometry = new THREE.TorusGeometry(0.4, 0.15, 16, 100);
    const coinMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffa500,
        emissiveIntensity: 0.8,
    });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    
    coin.position.z = -100; // Start behind the player
    coin.position.y = Math.random() * 2 + 0.5; // Random height
    coin.position.x = Math.random() > 0.5 ? -1.5 : 1.5; // Random position on left or right
    scene.add(coin);
    coins.push(coin);
}

// Start coin spawning
setInterval(spawnCoin, coinInterval);

// Check for collisions with obstacles
function checkCollision(obstacle) {
    const distance = player.position.distanceTo(obstacle.position);
    if (distance < 1) {
        reduceHealth();
    }
}

// Reduce player health and check for game over
function reduceHealth() {
    health -= 2;
    healthBar.style.width = `${health}%`;
    if (health <= 0) {
        gameOver();
        resetGame();
    }
}

// Function to check if the player collects coins
function checkCoinCollection(coin) {
    const distance = player.position.distanceTo(coin.position);
    if (distance < 0.5) { // Collection threshold
        scene.remove(coin); // Remove the coin from the scene
        coinScore += 1; // Increase coin score
        coinText.innerHTML = 'Coins Collected: ' + coinScore; // Update coin display
    }
}


// Reset the game to its initial state
function resetGame() {
    // Reset score, health, and game objects
    score = 0;
    health = 100;
    coinScore = 0;
    scoreText.innerHTML = 'Score: ' + score;
    healthBar.style.width = health + '%';
    coinText.innerHTML = 'Coins Collected: ' + coinScore;
    
    // Clear obstacles and coins
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];
    
    coins.forEach(coin => scene.remove(coin));
    coins = [];
    
    player.position.set(0, 0.5, 0); // Reset player position
    isGameOver = false; // Reset game over status
    finishLineMessage.style.display = 'none'; // Hide finish message
    
    // Restart the game loop
    animate();
}

// Pause game function
function pauseGame() {
    isPaused = true; // Set paused status
}

// Resume game function
function resumeGame() {
    if (isPaused) {
        isPaused = false; // Set paused status to false
        animate(); // Restart animation loop
    }
}

// Quit game function
function quitGame() {
    isGameOver = true; // Set game over status
    alert('You have quit the game! Your score was: ' + score); // Show score on quit
    resetGame(); // Reset game
}

init();