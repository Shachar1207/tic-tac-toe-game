// ============================================================
// IMPORTANT: This file only contains code that interacts with
// the browser (DOM manipulation, clicks, timers).
// All data saving/loading happens by talking to the SERVER
// via fetch() calls. The server handles Redis.
// ============================================================

// The URL of your backend server on Render.
// Once you deploy the server to Render, replace this with the actual URL.
const SERVER_URL = 'https://your-tic-tac-toe-server.onrender.com';

// ─────────────────────────────────────────────
// SCREEN MANAGEMENT
// We have two screens in index.html: usernameScreen and gameScreen.
// We show one and hide the other using the "hidden" CSS class.
// ─────────────────────────────────────────────
const usernameScreen = document.getElementById('usernameScreen');
const gameScreen = document.getElementById('gameScreen');
const startGameBtn = document.getElementById('startGameBtn');
const player1Input = document.getElementById('player1Input');
const player2Input = document.getElementById('player2Input');

// Player names (set when the game starts)
let playerXName = 'Player X';
let playerOName = 'Player O';

// When Start Game is clicked, validate inputs and switch to game screen
startGameBtn.addEventListener('click', () => {
    const name1 = player1Input.value.trim();
    const name2 = player2Input.value.trim();

    // Make sure both names are filled in
    if (!name1 || !name2) {
        alert('Please enter names for both players!');
        return;
    }

    // Save the names
    playerXName = name1;
    playerOName = name2;

    // Update the name displays in the score section
    document.getElementById('nameX').textContent = playerXName;
    document.getElementById('nameO').textContent = playerOName;
    document.getElementById('status').textContent = `${playerXName}'s Turn`;

    // Switch screens: hide username screen, show game screen
    usernameScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // Start the game
    resetGame();
});

// ─────────────────────────────────────────────
// GAME VARIABLES
// ─────────────────────────────────────────────
const boardEl = document.getElementById('board');
const squares = document.querySelectorAll('.square');
const statusDisplay = document.getElementById('status');
const timerDisplay = document.getElementById('timer');
const newGameBtn = document.getElementById('newGameBtn');
const scoreXDisplay = document.getElementById('scoreXNum');
const scoreODisplay = document.getElementById('scoreONum');
const scoreDrawDisplay = document.getElementById('scoreDraw');

let currentPlayer = 'X';       // Whose turn it is: 'X' or 'O'
let gameBoard = ['', '', '', '', '', '', '', '', ''];  // 9 squares, empty at start
let gameActive = false;         // Is the game currently running?
let timeLeft = 30;              // Seconds remaining for current move
let timerInterval = null;       // Holds the setInterval reference so we can stop it

// Track session scores (these reset when you refresh the page)
let scores = { X: 0, O: 0, draws: 0 };

// All 8 possible winning combinations (by square index)
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]              // diagonals
];

// ─────────────────────────────────────────────
// ATTACH EVENT LISTENERS
// ─────────────────────────────────────────────
squares.forEach(square => {
    square.addEventListener('click', handleSquareClick);
});

newGameBtn.addEventListener('click', resetGame);

// ─────────────────────────────────────────────
// GAME LOGIC FUNCTIONS
// ─────────────────────────────────────────────

// Called when a player clicks a square
function handleSquareClick(event) {
    const clickedSquare = event.target;
    const clickedIndex = clickedSquare.getAttribute('data-index');

    // Ignore clicks if game is over or square is already taken
    if (!gameActive || gameBoard[clickedIndex] !== '') {
        return;
    }

    makeMove(clickedSquare, clickedIndex);
}

// Places the current player's mark on the board
function makeMove(square, index) {
    gameBoard[index] = currentPlayer;
    square.textContent = currentPlayer;
    square.classList.add('taken', currentPlayer.toLowerCase());

    resetTimer();
    checkForWinner();
}

// Checks if the current state of the board has a winner or a draw
function checkForWinner() {
    let roundWon = false;
    let winningCombo = null;

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];

        if (gameBoard[a] === '' || gameBoard[b] === '' || gameBoard[c] === '') {
            continue; // skip if any square in this combo is empty
        }

        if (gameBoard[a] === gameBoard[b] && gameBoard[b] === gameBoard[c]) {
            roundWon = true;
            winningCombo = winningConditions[i];
            break;
        }
    }

    if (roundWon) {
        announceWinner(currentPlayer, winningCombo);
        return;
    }

    // Check for draw: if no empty squares remain
    if (!gameBoard.includes('')) {
        announceDraw();
        return;
    }

    // No winner yet - switch to the other player
    switchPlayer();
}

// Switches whose turn it is
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    const currentName = currentPlayer === 'X' ? playerXName : playerOName;
    statusDisplay.textContent = `${currentName}'s Turn`;
}

// Called when a player wins
function announceWinner(winner, combo) {
    gameActive = false;
    stopTimer();

    const winnerName = winner === 'X' ? playerXName : playerOName;
    statusDisplay.textContent = `🎉 ${winnerName} Wins!`;

    // Update session score
    scores[winner]++;
    updateScoreDisplay();

    // Highlight the winning squares
    combo.forEach(index => squares[index].classList.add('winner'));

    // Send the win to the server so it gets saved in Redis
    recordWin(winnerName);
}

// Called when the board is full with no winner
function announceDraw() {
    gameActive = false;
    stopTimer();
    statusDisplay.textContent = "It's a Draw!";
    scores.draws++;
    updateScoreDisplay();
}

// Called when the timer runs out
function handleTimeout() {
    gameActive = false;
    stopTimer();

    // The player who ran out of time loses, so the OTHER player wins
    const loser = currentPlayer;
    const winner = loser === 'X' ? 'O' : 'X';
    const winnerName = winner === 'X' ? playerXName : playerOName;
    const loserName = loser === 'X' ? playerXName : playerOName;

    statusDisplay.textContent = `⏰ Time's Up! ${loserName} loses!`;

    scores[winner]++;
    updateScoreDisplay();

    // Record the win for the player who didn't time out
    recordWin(winnerName);
}

// ─────────────────────────────────────────────
// SERVER COMMUNICATION
// This is where the browser talks to the backend.
// fetch() sends an HTTP request to the server URL.
// "async/await" means: wait for the server to respond before continuing.
// ─────────────────────────────────────────────

// Sends a POST request to the server to record a win for a username
async function recordWin(username) {
    try {
        const response = await fetch(`${SERVER_URL}/wins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'  // Tells server we're sending JSON
            },
            body: JSON.stringify({ username: username })  // Convert JS object to JSON text
        });

        if (response.ok) {
            console.log(`Win saved for ${username}`);
        } else {
            console.error('Server error when saving win');
        }
    } catch (error) {
        // This catches network errors (e.g., server is down)
        console.error('Could not connect to server:', error);
    }
}

// ─────────────────────────────────────────────
// TIMER FUNCTIONS
// ─────────────────────────────────────────────

function startTimer() {
    stopTimer(); // Always clear any existing timer first
    timeLeft = 30;
    updateTimerDisplay();

    // setInterval runs the function every 1000ms (1 second)
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            handleTimeout();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    startTimer();
}

function updateTimerDisplay() {
    timerDisplay.textContent = `⏱ Time: ${timeLeft}s`;
    // Turn red when time is running low
    timerDisplay.style.color = timeLeft <= 10 ? '#e74c3c' : '#aaa';
}

// ─────────────────────────────────────────────
// DISPLAY UPDATES
// ─────────────────────────────────────────────

function updateScoreDisplay() {
    scoreXDisplay.textContent = scores.X;
    scoreODisplay.textContent = scores.O;
    scoreDrawDisplay.textContent = scores.draws;
}

// ─────────────────────────────────────────────
// RESET / NEW GAME
// ─────────────────────────────────────────────

function resetGame() {
    currentPlayer = 'X';
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    statusDisplay.textContent = `${playerXName}'s Turn`;

    // Clear all squares visually
    squares.forEach(square => {
        square.textContent = '';
        square.classList.remove('taken', 'x', 'o', 'winner');
    });

    startTimer();
}