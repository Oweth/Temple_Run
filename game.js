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

let stars = []; // Array to store stars

// Function to create and position stars
function spawnStars() {
    const starGeometry = new THREE.SphereGeometry(0.05, 16, 16); // Small spheres as stars
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 1000; i++) { // Create multiple stars
        const star = new THREE.Mesh(starGeometry, starMaterial);

        // Randomly position stars on the left and right sides of the path
        star.position.x = Math.random() > 0.5 ? -5 : 5; // Left or right side
        star.position.y = Math.random() * 2 + 1; // Random height above the ground
        star.position.z = -Math.random() * 100; // Spread stars along the path

        scene.add(star); // Add star to the scene
        stars.push(star); // Store in array for future use
    }
}

// Initialize the scene, camera, and renderer
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;

    //add light
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

    /*/ Create the player (sphere)
    const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0040 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5; // Start above the ground
    scene.add(player);*/

    player = createCarModel();
    player.scale.set(0.25,0.25,0.25);
    player.rotation.y = Math.PI / 2;
    player.position.y = 0.5;
    //player.position.set(0, 0.5, 0);
    scene.add(player);

    /*/ Create the ground
    const groundGeometry = new THREE.PlaneGeometry(10, 1000);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.DoubleSide });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    //ground.scale.x = 0.25;
    ground.scale.y = 10;
    scene.add(ground);*/
    const groundGeometry = new THREE.PlaneGeometry(10,100);
    const material2 = new THREE.MeshPhongMaterial({color: 0x8B4513, shininess: 3});
    ground = new THREE.Mesh(groundGeometry, material2);
    ground.rotation.x = -Math.PI / 2;
    ground.scale.y = 10000;
    scene.add(ground);

    // Listen for keypress to control player
    document.addEventListener('keydown', handleKeyDown);

    // Start obstacle spawning
    setInterval(spawnObstacle, obstacleInterval);

    spawnStars();

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

        stars.forEach(star => {
            star.position.z += playerSpeed; // Move stars forward
            if (star.position.z > 5) {
                star.position.z = -100; // Reset stars to start behind the player
            }
        });

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

/*/ Spawn obstacles (simple cubes)
function spawnObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.z = -100;
    obstacle.position.y = 0.5; // Place on the ground
    obstacle.position.x = Math.random() > 0.5 ? 1.5 : -1.5; // Randomly place on left or right
    scene.add(obstacle);
    obstacles.push(obstacle);
}*/

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
        let cylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1, 32, 1),
            yellow
        );
        cylinder.scale.set(0.2, 4.3, 0.2);  // Long and thin for axle
        cylinder.rotation.set(Math.PI / 2, 0, 0); // Rotate to align with z-axis
        
        axleModel.add(cylinder);
        
        // Add wheels to the axle
        wheel.position.z = 2;
        axleModel.add(wheel.clone());
        wheel.position.z = -2;
        axleModel.add(wheel);
        
        return axleModel;
    }

    // Create the car model
    let carModel = new THREE.Object3D();
    let red = new THREE.MeshPhongMaterial({
        color: "red",
        specular: 0x404040,
        shininess: 8,
        flatShading: true
    });

    // Body of the car
    let body = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 3), red);
    body.position.y = 0.6;
    
    // Hood of the car
    let hood = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 2.8), red);
    hood.position.set(0.5, 1.4, 0);
    
    // Headlights
    let yellow = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        specular: 0x303030,
        shininess: 16
    });
    let headlight1 = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), yellow);
    headlight1.scale.set(0.1, 0.25, 0.25);
    headlight1.position.set(-3, 0.6, -1);

    let headlight2 = headlight1.clone();
    headlight2.position.set(-3, 0.6, 1);

    // Axles
    let carAxle1 = createAxle();
    carAxle1.position.x = -2.5;
    
    let carAxle2 = createAxle();
    carAxle2.position.x = 2.5;

    // Add all parts to the car model
    carModel.add(carAxle1);
    carModel.add(carAxle2);
    carModel.add(body);
    carModel.add(hood);
    carModel.add(headlight1);
    carModel.add(headlight2);

    return carModel;
}

function spawnObstacle() {
    let tree = new THREE.Object3D();

    // Create the trunk
    let trunkMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        shininess: 10
    });
    let trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1), trunkMaterial);
    trunk.position.y = 0.5; // Move trunk to origin
    
    // Create the leaves
    let leavesMaterial = new THREE.MeshPhongMaterial({
        color: 0x00DD00,
        specular: 0x006000,
        shininess: 5
    });
    let leaves = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2, 16), leavesMaterial);
    leaves.position.y = 2; // Position leaves at the top of the trunk
    
    // Add trunk and leaves to the tree object
    tree.add(trunk);
    tree.add(leaves);

    tree.position.z = -100;
    tree.position.y = 0.5; // Place on the ground
    tree.position.x = Math.random() > 0.5 ? 1.5 : -1.5; // Randomly place on left or right
    scene.add(tree);
    obstacles.push(tree);
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
