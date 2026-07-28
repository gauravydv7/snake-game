// ===========================
// DOM Elements
// ===========================

const boardWrapper = document.querySelector(".board-wrapper");
const board = document.querySelector(".board");

const modal = document.querySelector(".modal");
const startGameModal = document.querySelector(".start-game");
const gameOverModal = document.querySelector(".game-over");
const pausedModal = document.querySelector(".paused");

const startButton = document.querySelector(".btn-start");
const restartButton = document.querySelector(".btn-restart");
const resumeButton = document.querySelector(".btn-resume");
const pauseButton = document.querySelector("#pause-btn");
const pauseIcon = pauseButton.querySelector(".icon-pause");
const playIcon = pauseButton.querySelector(".icon-play");

const scoreElement = document.querySelector("#score");
const finalScoreElement = document.querySelector("#final-score");
const highScoreElement = document.querySelector("#high-score");
const timeElement = document.querySelector("#time");

const dpad = document.querySelector("#dpad");

// ===========================
// Game Settings
// ===========================

const BLOCK_SIZE = 24;   // px, only used to decide how many cells fit
const MIN_CELLS = 8;     // never render a grid smaller than this

let rows;
let cols;
let blocks = {};

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

let isPaused = false;
let hasStarted = false;

highScoreElement.innerText = highScore;

// ===========================
// Build Board (grid size derived from actual container size,
// so it always matches the screen it's running on)
// ===========================

function buildBoard() {

    rows = Math.max(MIN_CELLS, Math.floor(board.clientHeight / BLOCK_SIZE));
    cols = Math.max(MIN_CELLS, Math.floor(board.clientWidth / BLOCK_SIZE));

    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    board.innerHTML = "";
    blocks = {};

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < cols; col++) {

            const block = document.createElement("div");

            block.classList.add("block");

            board.appendChild(block);

            blocks[`${row}-${col}`] = block;

        }

    }

}

// ===========================
// Reset Game
// ===========================

function resetGame() {

    snake = [
        {
            x: Math.floor(rows / 2),
            y: Math.floor(cols / 2),
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
// Draw / Clear Snake
// ===========================

function drawSnake() {

    snake.forEach((segment, index) => {

        const block = blocks[`${segment.x}-${segment.y}`];

        if (!block) return;

        block.classList.add(index === 0 ? "head" : "fill");

    });

}

function clearSnake() {

    snake.forEach(segment => {

        const block = blocks[`${segment.x}-${segment.y}`];

        if (!block) return;

        block.classList.remove("fill", "head");

    });

}

// ===========================
// Draw / Clear Food
// ===========================

function drawFood() {

    document.querySelectorAll(".food").forEach(block => {
        block.classList.remove("food");
    });

    blocks[`${food.x}-${food.y}`].classList.add("food");

}

function clearFood() {

    const block = blocks[`${food.x}-${food.y}`];

    if (block) block.classList.remove("food");

}

// ===========================
// Timer
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
// High Score
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

    hasStarted = false;

    finalScoreElement.innerText = score;

    modal.style.display = "flex";

    startGameModal.style.display = "none";
    pausedModal.style.display = "none";
    gameOverModal.style.display = "flex";

}

// ===========================
// Direction Helper
// (shared by keyboard, swipe and D-pad)
// ===========================

function setDirection(newDirection) {

    const opposite = {
        up: "down",
        down: "up",
        left: "right",
        right: "left",
    };

    if (opposite[newDirection] !== direction) {
        nextDirection = newDirection;
    }

}

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
// Collisions
// ===========================

function hitWall(head) {

    return (
        head.x < 0 ||
        head.x >= rows ||
        head.y < 0 ||
        head.y >= cols
    );

}

function hitSelf(head) {

    return snake.some(segment =>
        segment.x === head.x &&
        segment.y === head.y
    );

}

// ===========================
// Increase Speed every 50 score
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

    if (hitWall(head) || hitSelf(head)) {

        gameOver();
        return;

    }

    if (head.x === food.x && head.y === food.y) {

        snake.unshift(head);

        clearFood();

        food = randomFood();

        drawFood();

        score += 10;

        scoreElement.innerText = score;

        updateHighScore();

        increaseSpeed();

    } else {

        snake.unshift(head);
        snake.pop();

    }

}

// ===========================
// Render / Loop
// ===========================

function render() {

    clearSnake();
    moveSnake();
    drawSnake();

}

function gameLoop() {

    render();

}

// ===========================
// Start / Restart
// ===========================

function startGame() {

    clearInterval(gameInterval);
    clearInterval(timerInterval);

    hasStarted = true;
    isPaused = false;

    modal.style.display = "none";

    startGameModal.style.display = "flex";
    gameOverModal.style.display = "none";
    pausedModal.style.display = "none";

    setPauseIcon();

    gameInterval = setInterval(gameLoop, gameSpeed);
    timerInterval = setInterval(updateTimer, 1000);

}

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

function setPauseIcon() {

    pauseIcon.style.display = isPaused ? "none" : "block";
    playIcon.style.display = isPaused ? "block" : "none";

}

function togglePause() {

    if (!hasStarted) return;

    if (isPaused) {

        gameInterval = setInterval(gameLoop, gameSpeed);
        timerInterval = setInterval(updateTimer, 1000);

        isPaused = false;

        modal.style.display = "none";
        pausedModal.style.display = "none";

    } else {

        clearInterval(gameInterval);
        clearInterval(timerInterval);

        isPaused = true;

        modal.style.display = "flex";
        startGameModal.style.display = "none";
        gameOverModal.style.display = "none";
        pausedModal.style.display = "flex";

    }

    setPauseIcon();

}

// ===========================
// Keyboard Controls
// ===========================

document.addEventListener("keydown", (event) => {

    switch (event.key) {

        case "ArrowUp":
            setDirection("up");
            break;

        case "ArrowDown":
            setDirection("down");
            break;

        case "ArrowLeft":
            setDirection("left");
            break;

        case "ArrowRight":
            setDirection("right");
            break;

        case " ":
            event.preventDefault();
            togglePause();
            break;

    }

});

// ===========================
// Mobile Swipe Controls
// (touchmove is prevented + { passive: false } so the browser
// never hijacks the gesture for page-scroll / pull-to-refresh)
// ===========================

let touchStartX = 0;
let touchStartY = 0;

board.addEventListener("touchstart", (e) => {

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

}, { passive: false });

board.addEventListener("touchmove", (e) => {

    e.preventDefault();

}, { passive: false });

board.addEventListener("touchend", (e) => {

    e.preventDefault();

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    const SWIPE_THRESHOLD = 24;

    if (Math.abs(dx) > Math.abs(dy)) {

        if (dx > SWIPE_THRESHOLD) setDirection("right");
        else if (dx < -SWIPE_THRESHOLD) setDirection("left");

    } else {

        if (dy > SWIPE_THRESHOLD) setDirection("down");
        else if (dy < -SWIPE_THRESHOLD) setDirection("up");

    }

}, { passive: false });

// ===========================
// On-screen D-pad (mobile fallback / alternative to swipe)
// ===========================

dpad.querySelectorAll(".dpad-btn").forEach(btn => {

    const dir = btn.dataset.dir;

    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        setDirection(dir);
    }, { passive: false });

    btn.addEventListener("click", () => {
        setDirection(dir);
    });

});

// ===========================
// Buttons
// ===========================

startButton.addEventListener("click", () => {

    buildBoard();

    resetGame();

    clearSnake();
    clearFood();

    drawFood();
    drawSnake();

    startGame();

});

restartButton.addEventListener("click", restartGame);
resumeButton.addEventListener("click", togglePause);
pauseButton.addEventListener("click", togglePause);

// ===========================
// Resize / Orientation Change
// Rebuilds the grid so it always matches the real screen size
// instead of freezing at whatever size loaded first.
// ===========================

let resizeTimeout;

window.addEventListener("resize", () => {

    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {

        const wasRunning = hasStarted && !isPaused;

        clearInterval(gameInterval);
        clearInterval(timerInterval);

        buildBoard();
        resetGame();
        drawFood();
        drawSnake();

        if (wasRunning) {
            startGame();
        } else if (!hasStarted) {
            modal.style.display = "flex";
            startGameModal.style.display = "flex";
            gameOverModal.style.display = "none";
            pausedModal.style.display = "none";
        }

    }, 200);

});

// ===========================
// Initial State
// ===========================

buildBoard();
resetGame();
drawFood();
drawSnake();

modal.style.display = "flex";
startGameModal.style.display = "flex";
gameOverModal.style.display = "none";
pausedModal.style.display = "none";