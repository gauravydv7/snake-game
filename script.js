// ===========================
// DOM Elements
// ===========================

const board = document.querySelector(".board");

const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");

const startButton = document.querySelector(".btn-start");
const restartButton = document.querySelector(".btn-restart");

const scoreElement = document.querySelector("#score");
const highScoreElement = document.querySelector("#high-score");
const timeElement = document.querySelector("#time");

// ===========================
// Game Settings
// ===========================

const BLOCK_SIZE = 50;

const rows = Math.floor(board.clientHeight / BLOCK_SIZE);
const cols = Math.floor(board.clientWidth / BLOCK_SIZE);

const blocks = [];

// ===========================
// Game State
// ===========================

let snake;
let food;

let direction;
let nextDirection;

let score;
let highScore = Number(localStorage.getItem("highScore")) || 0;

let minutes;
let seconds;

let gameSpeed = 300;

let gameInterval = null;
let timerInterval = null;

highScoreElement.innerText = highScore;

// ===========================
// Create Board
// ===========================

for (let row = 0; row < rows; row++) {

    for (let col = 0; col < cols; col++) {

        const block = document.createElement("div");

        block.classList.add("block");

        board.appendChild(block);

        blocks[`${row}-${col}`] = block;

    }

}

// ===========================
// Reset Game
// ===========================

function resetGame() {

    snake = [
        {
            x: 3,
            y: 7,
        },
    ];

    direction = "right";
    nextDirection = "right";

    score = 0;

    minutes = 0;
    seconds = 0;

    gameSpeed = 300;

    scoreElement.innerText = score;
    timeElement.innerText = "00:00";

    food = randomFood();

}

// ===========================
// Random Food
// ===========================

function randomFood() {

    let newFood;

    do {

        newFood = {

            x: Math.floor(Math.random() * rows),
            y: Math.floor(Math.random() * cols),

        };

    } while (

        snake.some(segment =>
            segment.x === newFood.x &&
            segment.y === newFood.y
        )

    );

    return newFood;

}

// ===========================
// Draw Snake
// ===========================

function drawSnake() {

    snake.forEach(segment => {

        blocks[`${segment.x}-${segment.y}`]
            .classList.add("fill");

    });

}

// ===========================
// Clear Snake
// ===========================

function clearSnake() {

    snake.forEach(segment => {

        blocks[`${segment.x}-${segment.y}`]
            .classList.remove("fill");

    });

}

// ===========================
// Draw Food
// ===========================

function drawFood() {

    document.querySelectorAll(".food").forEach(block => {
        block.classList.remove("food");
    });

    blocks[`${food.x}-${food.y}`].classList.add("food");

}

// ===========================
// Clear Food
// ===========================

function clearFood() {

    blocks[`${food.x}-${food.y}`]
        .classList.remove("food");

}

// ===========================
// Update Timer
// ===========================

function updateTimer() {

    seconds++;

    if (seconds === 60) {

        minutes++;
        seconds = 0;

    }

    timeElement.innerText =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}

// ===========================
// Update High Score
// ===========================

function updateHighScore() {

    if (score > highScore) {

        highScore = score;

        localStorage.setItem("highScore", highScore);

        highScoreElement.innerText = highScore;

    }

}

// ===========================
// Game Over
// ===========================

function gameOver() {

    clearInterval(gameInterval);
    clearInterval(timerInterval);

    modal.style.display = "flex";

    startGameModal.style.display = "none";
    gameOverModal.style.display = "flex";

}

// ===========================
// Initialize
// ===========================

resetGame();
drawFood();
drawSnake();

// ===========================
// Get Next Head Position
// ===========================

function getNextHead() {

    const head = {
        x: snake[0].x,
        y: snake[0].y,
    };

    switch (nextDirection) {

        case "up":
            head.x--;
            break;

        case "down":
            head.x++;
            break;

        case "left":
            head.y--;
            break;

        case "right":
            head.y++;
            break;

    }

    return head;

}

// ===========================
// Wall Collision
// ===========================

function hitWall(head) {

    return (
        head.x < 0 ||
        head.x >= rows ||
        head.y < 0 ||
        head.y >= cols
    );

}

// ===========================
// Self Collision
// ===========================

function hitSelf(head) {

    return snake.some(segment =>
        segment.x === head.x &&
        segment.y === head.y
    );

}

// ===========================
// Increase Speed
// Every 50 score
// ===========================

function increaseSpeed() {

    const newSpeed = Math.max(
        100,
        300 - Math.floor(score / 50) * 20
    );

    if (newSpeed !== gameSpeed) {

        gameSpeed = newSpeed;

        clearInterval(gameInterval);

        gameInterval = setInterval(gameLoop, gameSpeed);

    }

}

// ===========================
// Move Snake
// ===========================

function moveSnake() {

    direction = nextDirection;

    const head = getNextHead();

    // Wall Collision

    if (hitWall(head)) {

        gameOver();
        return;

    }

    // Self Collision

    if (hitSelf(head)) {

        gameOver();
        return;

    }

    // Food Eat

    if (
        head.x === food.x &&
        head.y === food.y
    ) {

        snake.unshift(head);

        clearFood();

        food = randomFood();

        drawFood();

        score += 10;

        scoreElement.innerText = score;

        updateHighScore();

        increaseSpeed();

    }

    // Normal Move

    else {

        snake.unshift(head);

        snake.pop();

    }

}

// ===========================
// Render
// ===========================

function render() {

    clearSnake();

    moveSnake();

    drawSnake();

}

// ===========================
// Main Game Loop
// ===========================

function gameLoop() {

    render();

}

// ===========================
// Start Game
// ===========================

function startGame() {

    clearInterval(gameInterval);
    clearInterval(timerInterval);

    modal.style.display = "none";

    startGameModal.style.display = "flex";
    gameOverModal.style.display = "none";

    gameInterval = setInterval(gameLoop, gameSpeed);

    timerInterval = setInterval(updateTimer, 1000);

}

// ===========================
// Restart Game
// ===========================

function restartGame() {

    clearInterval(gameInterval);
    clearInterval(timerInterval);

    clearSnake();
    clearFood();

    resetGame();

    drawFood();
    drawSnake();

    startGame();

}

// ===========================
// Pause / Resume
// ===========================

let isPaused = false;

function togglePause() {

    if (isPaused) {

        gameInterval = setInterval(gameLoop, gameSpeed);
        timerInterval = setInterval(updateTimer, 1000);

        isPaused = false;

    } else {

        clearInterval(gameInterval);
        clearInterval(timerInterval);

        isPaused = true;

    }

}

// ===========================
// Keyboard Controls
// ===========================

document.addEventListener("keydown", (event) => {

    switch (event.key) {

        case "ArrowUp":

            if (direction !== "down")
                nextDirection = "up";

            break;

        case "ArrowDown":

            if (direction !== "up")
                nextDirection = "down";

            break;

        case "ArrowLeft":

            if (direction !== "right")
                nextDirection = "left";

            break;

        case "ArrowRight":

            if (direction !== "left")
                nextDirection = "right";

            break;

        case " ":

            event.preventDefault();

            togglePause();

            break;

    }

});

// ===========================
// Mobile Swipe Controls
// ===========================

let touchStartX = 0;
let touchStartY = 0;

board.addEventListener("touchstart", (e) => {

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

});

board.addEventListener("touchend", (e) => {

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {

        if (dx > 30 && direction !== "left") {

            nextDirection = "right";

        } else if (dx < -30 && direction !== "right") {

            nextDirection = "left";

        }

    } else {

        if (dy > 30 && direction !== "up") {

            nextDirection = "down";

        } else if (dy < -30 && direction !== "down") {

            nextDirection = "up";

        }

    }

});

// ===========================
// Buttons
// ===========================

startButton.addEventListener("click", () => {

    resetGame();

    clearSnake();
    clearFood();

    drawFood();
    drawSnake();

    startGame();

});

restartButton.addEventListener("click", restartGame);

// ===========================
// Initial State
// ===========================

modal.style.display = "flex";

startGameModal.style.display = "flex";

gameOverModal.style.display = "none";