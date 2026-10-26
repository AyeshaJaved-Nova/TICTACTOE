const apiBase = window.location.origin;
const isComputerGame = document.body.dataset.gameMode === "computer";
const cells = [...document.querySelectorAll(".board-cell")];
const status = document.getElementById("game-status");
const newGameButton = document.getElementById("new-game");
const homeLink = document.querySelector("[data-quit-confirm]");
const winLine = document.querySelector(".win-line");
const playerXNameInput = document.getElementById("player-x-name");
const playerONameInput = document.getElementById("player-o-name");
const playerSetupDialog = document.getElementById("player-setup-dialog");
const playerSetupForm = document.getElementById("player-setup-form");
const playerXDisplay = document.getElementById("player-x-display");
const playerODisplay = document.getElementById("player-o-display");
const scoreXLabel = document.getElementById("score-x-label");
const scoreOLabel = document.getElementById("score-o-label");
const scoreXCount = document.getElementById("score-x-count");
const scoreOCount = document.getElementById("score-o-count");
const scoreStoragePrefix = "little-tic-tac-toe:scores:";
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];
const lineCoordinates = {
    "0,1,2": [24, 50, 276, 50],
    "3,4,5": [24, 150, 276, 150],
    "6,7,8": [24, 250, 276, 250],
    "0,3,6": [50, 24, 50, 276],
    "1,4,7": [150, 24, 150, 276],
    "2,5,8": [250, 24, 250, 276],
    "0,4,8": [24, 24, 276, 276],
    "2,4,6": [276, 24, 24, 276]
};

let gameOver = !isComputerGame;
let computerThinking = false;
let currentPlayer = "X";
let board = Array(9).fill("-");
let scores = { X: 0, O: 0 };
let scoreStorageKey = `${scoreStoragePrefix}computer`;
let scoredGame = false;

function updateScoreDisplay() {
    scoreXCount.textContent = scores.X;
    scoreOCount.textContent = scores.O;
}

function loadScores() {
    const storedScores = sessionStorage.getItem(scoreStorageKey);
    if (storedScores) {
        try {
            const parsedScores = JSON.parse(storedScores);
            if (Number.isInteger(parsedScores.X) && parsedScores.X >= 0 &&
                Number.isInteger(parsedScores.O) && parsedScores.O >= 0) {
                scores = parsedScores;
            }
        } catch {
            scores = { X: 0, O: 0 };
        }
    } else {
        scores = { X: 0, O: 0 };
    }
    updateScoreDisplay();
}

function recordWin(mark) {
    if (scoredGame) return;
    scoredGame = true;
    scores[mark] += 1;
    sessionStorage.setItem(scoreStorageKey, JSON.stringify(scores));
    updateScoreDisplay();
}

async function requestGame(path, options) {
    const response = await fetch(`${apiBase}/${path}`, options);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "The game could not be updated. Please try again.");
    }
    return data;
}

function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
}

function getPlayerName(mark) {
    const nameInput = mark === "X" ? playerXNameInput : playerONameInput;
    const nameDisplay = mark === "X" ? playerXDisplay : playerODisplay;
    return nameInput?.value.trim() || nameDisplay?.textContent || `Player ${mark}`;
}

function setTurnStatus() {
    setStatus(isComputerGame ? "Your turn, X." : `${getPlayerName(currentPlayer)}'s turn (${currentPlayer}).`);
}

function updateBoard(nextBoard) {
    board = nextBoard;
    cells.forEach((cell, index) => {
        const mark = board[index] === "-" ? "" : board[index];
        cell.textContent = mark;
        cell.classList.toggle("mark-x", mark === "X");
        cell.classList.toggle("mark-o", mark === "O");
        cell.setAttribute(
            "aria-label",
            mark
                ? `${mark}, row ${Math.floor(index / 3) + 1} column ${index % 3 + 1}`
                : `Empty square, row ${Math.floor(index / 3) + 1} column ${index % 3 + 1}`
        );
    });
    updateControls();
}

function updateControls() {
    cells.forEach((cell, index) => {
        cell.disabled = gameOver || computerThinking || board[index] !== "-";
    });
}

function findWinningCombination() {
    return winningCombinations.find(combination =>
        combination.every(index => board[index] !== "-" && board[index] === board[combination[0]])
    );
}

function showWinningLine(combination) {
    const [startX, startY, endX, endY] = lineCoordinates[combination.join(",")];
    winLine.setAttribute("d", `M ${startX} ${startY} L ${endX} ${endY}`);
    winLine.classList.remove("is-visible");
    void winLine.getBoundingClientRect();
    winLine.classList.add("is-visible");
}

function isFinished(data) {
    const message = data.message.toLowerCase();
    if (message.includes("wins")) {
        gameOver = true;
        const combination = findWinningCombination();
        if (combination) showWinningLine(combination);
        const winner = combination ? board[combination[0]] : null;
        if (winner) recordWin(winner);
        setStatus(!isComputerGame && winner ? `${getPlayerName(winner)} wins! (${winner})` : data.message);
        updateControls();
        return true;
    }
    if (message.includes("tie")) {
        gameOver = true;
        setStatus("A lovely little draw. Play again?");
        updateControls();
        return true;
    }
    return false;
}

async function startGame() {
    gameOver = true;
    computerThinking = false;
    scoredGame = false;
    updateControls();
    newGameButton.disabled = true;
    setStatus("Starting a new round…");
    winLine.classList.remove("is-visible");
    winLine.removeAttribute("d");

    try {
        const data = await requestGame("start", { method: "POST" });
        gameOver = false;
        currentPlayer = data.currentplayer;
        updateBoard(data.board);
        setTurnStatus();
    } catch (error) {
        gameOver = true;
        setStatus(error.message, true);
        updateControls();
    } finally {
        newGameButton.disabled = false;
    }
}

async function playMove(position) {
    if (gameOver || computerThinking || board[position] !== "-") return;
    computerThinking = isComputerGame;
    updateControls();

    try {
        const data = await requestGame("play", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ position })
        });
        updateBoard(data.board);
        currentPlayer = data.currentplayer || (currentPlayer === "X" ? "O" : "X");

        if (isFinished(data)) return;

        if (isComputerGame) {
            setStatus("The computer is thinking…");
            const computerData = await requestGame("computer", { method: "POST" });
            updateBoard(computerData.board);
            currentPlayer = computerData.currentplayer || "X";
            if (!isFinished(computerData)) setTurnStatus();
        } else {
            setTurnStatus();
        }
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        computerThinking = false;
        updateControls();
    }
}

cells.forEach((cell, index) => {
    cell.addEventListener("click", () => playMove(index));
});

newGameButton.addEventListener("click", startGame);

if (isComputerGame) {
    loadScores();
    startGame();
} else {
    setStatus("Waiting for player names…");
    updateControls();
    playerSetupDialog.addEventListener("cancel", event => event.preventDefault());
    for (const nameInput of [playerXNameInput, playerONameInput]) {
        nameInput.addEventListener("input", () => nameInput.setCustomValidity(""));
    }
    playerSetupForm.addEventListener("submit", event => {
        event.preventDefault();
        const xName = playerXNameInput.value.trim();
        const oName = playerONameInput.value.trim();

        playerXNameInput.setCustomValidity(xName ? "" : "Enter a name for Player X.");
        playerONameInput.setCustomValidity(oName ? "" : "Enter a name for Player O.");
        if (!playerSetupForm.reportValidity()) return;

        playerXDisplay.textContent = xName;
        playerODisplay.textContent = oName;
        scoreXLabel.textContent = xName;
        scoreOLabel.textContent = oName;
        scoreStorageKey = `${scoreStoragePrefix}friend:${encodeURIComponent(xName.toLowerCase())}:${encodeURIComponent(oName.toLowerCase())}`;
        loadScores();
        playerSetupDialog.close();
        startGame();
    });
    playerSetupDialog.showModal();
}

homeLink.addEventListener("click", event => {
    if (!gameOver && !window.confirm("Do you want to quit the game?")) {
        event.preventDefault();
    }
});
