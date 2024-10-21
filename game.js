//import { GLTFLoader } from 'GLTFLoader.js'

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

//let loader = new THREE.GLTFLoader();

// Initialize the scene, camera, and renderer
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;

    const finishLineMessage = document.createElement('div');
    finishLineMessage.id = 'finishLineMessage';
    finishLineMessage.innerText = 'Level 1 Completed!';
    document.body.appendChild(finishLineMessage);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('GameContainer').appendChild(renderer.domElement);

    // Create the player (sphere)
    const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0040 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5; // Start above the ground
    scene.add(player);

    // Create the ground
    const groundGeometry = new THREE.PlaneGeometry(10, 1000);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.DoubleSide });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Listen for keypress to control player
    document.addEventListener('keydown', handleKeyDown);

    // Start obstacle spawning
    setInterval(spawnObstacle, obstacleInterval);

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
function animate() {
    if (!isGameOver) {
        requestAnimationFrame(animate);

        // Move the player forward
        ground.position.z += playerSpeed;

        // Move obstacles and check for collisions
        obstacles.forEach((obstacle, index) => {
            obstacle.position.z += playerSpeed;
            if (obstacle.position.z > 5) {
                scene.remove(obstacle);
                obstacles.splice(index, 1);
                score ++;
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

        if (coinScore >= 3) {
            console.log("You win")
            finishLineMessage.style.display = 'block';
            setTimeout(resetGame, 3000);
            return;
        }

        coins.forEach((coin, index) => {
            coin.position.z += playerSpeed; // Move coin forward
            //coin.rotation.y += 0.05; // Spin coin around its Y-axis
            
            // Floating effect (move coin up and down smoothly)
            //coin.position.y += Math.sin(Date.now() * 0.005) * 0.01; // Adjust speed and range
            if (coin.position.z > 5) {
                scene.remove(coin); // Remove if out of view
                coins.splice(index, 1); // Remove from array
            }
            checkCoinCollection(coin); // Check if player collects the coin
        });

        //handle movement left and right
        if (moveLeft && player.position.x > -2) player.position.x -= 0.1;
        if (moveRight && player.position.x < 2) player.position.x += 0.1;

        renderer.render(scene, camera);
    }
}

// Spawn obstacles (simple cubes)
function spawnObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.z = -100;
    obstacle.position.y = 0.5; // Place on the ground
    obstacle.position.x = Math.random() > 0.5 ? 1.5 : -1.5; // Randomly place on left or right
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function spawnCoin() {
    const coinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32); // Create a coin shape
    const coinMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 1 }); // Enable transparency
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    
    coin.position.z = -100; // Start far back
    coin.position.y = Math.random() * 2 + 1; // Randomly place coin floating between 1-3 units high
    coin.position.x = Math.random() > 0.5 ? 1.5 : -1.5; // Randomly place on left or right
    coin.rotation.x = Math.PI / 2; // Rotate coin to stand upright like a real coin
    scene.add(coin);
    coins.push(coin);
}

setInterval(spawnCoin, coinInterval);

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

// Handle game over
function gameOver() {
    isGameOver = true;
    document.getElementById('game-over-message').style.display = 'block';
    //setTimeout(resetGame, 1000);
}

function resetGame() {
    player.position.set(0, 0.5, 0);
    obstacles.forEach((obstacle, index) => {
        const pos = obstaclePositions[index];
        obstacle.position.set(pos.x, 0.5, pos.z);
    });
    //gameOverMessage.style.display = 'none';
    //finishLineMessage.style.display = 'none';
}


// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

function checkCoinCollection(coin) {
    const distance = player.position.distanceTo(coin.position);
    if (distance < 0.5) { // Adjust the threshold as necessary
        coinScore++;
        coinText.innerHTML = 'Coins: ' + coinScore; // Update coin score display
        
        // Start floating the coin upwards and fading out
        floatCoin(coin);
        
        // Remove the coin from the array to avoid collecting it again
        coins.splice(coins.indexOf(coin), 1);
    }
}

function floatCoin(coin) {
    let floatSpeed = 0.01; // Speed at which the coin will float up
    let fadeSpeed = 0.02;  // Speed at which the coin will fade out

    const floatInterval = setInterval(() => {
        // Move the coin upwards
        coin.position.y += floatSpeed;
        
        // Gradually fade out the coin
        coin.material.opacity -= fadeSpeed;
        if (coin.material.opacity <= 0) {
            clearInterval(floatInterval); // Stop the floating effect
            scene.remove(coin); // Finally remove the coin from the scene
        }
    }, 30); // Adjust the interval speed as necessary
}


// Initialize the game
init();
