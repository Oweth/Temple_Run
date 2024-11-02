let scene, camera, renderer;
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

let stars = []; // Array to store stars

let bubbles = []; // Array to store bubbles

// Function to create and position bubbles
function spawnBubbles() {
    const bubbleGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Small spheres as bubbles
    const bubbleMaterial = new THREE.MeshBasicMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.6 }); // Light blue bubbles

    for (let i = 0; i < 1000; i++) { // Create multiple bubbles
        const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble.position.x = Math.random() > 0.5 ? -5 : 5; // Left or right side
        bubble.position.y = Math.random() * 2 + 1; // Random height above the ground
        bubble.position.z = -Math.random() * 100; // Spread bubbles along the path

        scene.add(bubble); // Add bubble to the scene
        bubbles.push(bubble); // Store in array for future use
    }
}

// Initialize the scene, camera, and renderer
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;

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

    player = createCarModel();
    player.scale.set(0.25, 0.25, 0.25);
    player.rotation.y = Math.PI / 2;
    player.position.y = 0.5;
    scene.add(player);

    const groundGeometry = new THREE.PlaneGeometry(10, 100);
    const material2 = new THREE.MeshPhongMaterial({ color: 0x808080, shininess: 3 });
    ground = new THREE.Mesh(groundGeometry, material2);
    ground.rotation.x = -Math.PI / 2;
    ground.scale.y = 10000;
    scene.add(ground);

    // Listen for keypress to control player
    document.addEventListener('keydown', handleKeyDown);

    // Start obstacle spawning
    setInterval(spawnObstacle, obstacleInterval);

    spawnBubbles();

    animate();
}

document.addEventListener('click', function playMusic() {
    const audio = document.getElementById('background-music');
    audio.play().then(() => {
        // Remove the event listener after the music starts playing
        document.removeEventListener('click', playMusic);
    }).catch(error => {
        console.log("Failed to play audio:", error);
    });
});

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
function animate() {
    if (!isGameOver) {
        requestAnimationFrame(animate);

        // Move the player forward
        ground.position.z += playerSpeed;

        bubbles.forEach(bubble => {
            bubble.position.z += playerSpeed; // Move bubbles forward
            if (bubble.position.z > 5) {
                bubble.position.z = -100; // Reset bubbles to start behind the player
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

        if (coinScore >= 30) {
            console.log("You win");
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

// Spawn obstacles (simple cubes and spheres)
function spawnObstacle() {
    const obstacleType = Math.random() > 0.5 ? 'pyramid' : 'sphere'; // Randomly choose between pyramid or sphere

    let obstacle;

    if (obstacleType === 'pyramid') {
        const obstacleGeometry = new THREE.ConeGeometry(1, 2, 4); // A pyramid-shaped obstacle
        const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color
        obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    } else {
        const obstacleGeometry = new THREE.SphereGeometry(1, 32, 32); // A sphere-shaped obstacle
        const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color
        obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    }

    obstacle.position.z = -100;
    obstacle.position.y = 1; // Adjust the height so it sits on the ground
    obstacle.position.x = Math.random() > 0.5 ? 1.5 : -1.5; // Randomly place on left or right
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function createCarModel() {
    // Create a wheel (tire + spokes)
    function createWheel() {
        let wheel = new THREE.Mesh(
            new THREE.TorusGeometry(0.75, 0.25, 16, 32),
            new THREE.MeshLambertMaterial({ color: 0x0000A0 })
        );
        
        let yellow = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            specular: 0x303030,
            shininess: 16
        });
        
        let cylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1, 32, 1),
            yellow
        );
        cylinder.scale.set(0.15, 1.2, 0.15); // Thin long cylinder (spoke)
        
        // Add spokes to the wheel
        wheel.add(cylinder.clone());
        cylinder.rotation.z = Math.PI / 3;
        wheel.add(cylinder.clone());
        cylinder.rotation.z = -Math.PI / 3;
        wheel.add(cylinder.clone());
        
        return wheel;
    }

    // Create an axle with two wheels
    function createAxle() {
        let wheel = createWheel();
        let axleModel = new THREE.Object3D();
        
        // Create a yellow cylinder for the axle
        let yellow = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            specular: 0x303030,
            shininess: 16
        });
        let axle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 3, 32, 1),
            yellow
        );
        axle.rotation.z = Math.PI / 2; // Make the axle horizontal
        axle.position.z = 0.5;
        
        // Add wheels to the axle
        axleModel.add(wheel);
        wheel.position.x = -1.5; // Position left wheel
        axleModel.add(wheel.clone());
        wheel.position.x = 1.5; // Position right wheel
        axleModel.add(axle);
        
        return axleModel;
    }

    // Create the car model
    let carModel = new THREE.Object3D();
    let body = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0x007700 }) // Dark green color for the body
    );
    
    carModel.add(body);
    let axle = createAxle();
    carModel.add(axle);

    return carModel;
}

// Function to check collisions with obstacles
function checkCollision(obstacle) {
    const distance = player.position.distanceTo(obstacle.position);
    if (distance < 1.5) { // Collision threshold
        health -= 1; // Decrease health on collision
        healthBar.style.width = health + '%'; // Update health bar
        if (health <= 0) {
            isGameOver = true;
            alert('Game Over! Your score was: ' + score);
            resetGame(); // Reset game after game over
        }
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

// Function to spawn coins
function spawnCoin() {
    const coinGeometry = new THREE.CircleGeometry(0.1, 32); // Small circle as coin
    const coinMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 }); // Gold color
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    
    coin.position.z = -100; // Start behind the player
    coin.position.y = Math.random() * 2 + 0.5; // Random height
    coin.position.x = Math.random() > 0.5 ? -1.5 : 1.5; // Random position on left or right
    scene.add(coin);
    coins.push(coin);
}

// Start coin spawning
setInterval(spawnCoin, coinInterval);

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

init(); // Initialize the game
