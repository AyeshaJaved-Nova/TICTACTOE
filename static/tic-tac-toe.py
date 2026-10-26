from flask import Flask, redirect, request, jsonify, send_from_directory, url_for # type: ignore
from pathlib import Path
import random
from flask_cors import CORS # type: ignore
STATIC_DIR = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=str(STATIC_DIR))
CORS(app)
# Game state variables
board = ["-"] * 9
currentplayer = "X"
winner = None
gameRunning = True

# Helper Functions
def printBoard():
    """Prints the board state (for debugging)."""
    return "\n".join([
        f"{board[0]} | {board[1]} | {board[2]}",
        "--|---|---",
        f"{board[3]} | {board[4]} | {board[5]}",
        "--|---|---",
        f"{board[6]} | {board[7]} | {board[8]}"
    ])

def checkHorizontal():
    global winner
    if board[0] == board[1] == board[2] and board[0] != "-":
        winner = board[0]
        return True
    elif board[3] == board[4] == board[5] and board[3] != "-":
        winner = board[3]
        return True
    elif board[6] == board[7] == board[8] and board[6] != "-":
        winner = board[6]
        return True

def checkRow():
    global winner
    if board[0] == board[3] == board[6] and board[0] != "-":
        winner = board[0]
        return True
    elif board[1] == board[4] == board[7] and board[1] != "-":
        winner = board[1]
        return True
    elif board[2] == board[5] == board[8] and board[2] != "-":
        winner = board[2]
        return True

def checkdiag():
    global winner
    if board[0] == board[4] == board[8] and board[0] != "-":
        winner = board[0]
        return True
    elif board[2] == board[4] == board[6] and board[2] != "-":
        winner = board[2]
        return True

def checktie():
    global gameRunning
    if "-" not in board:
        gameRunning = False
        return True
    return False

def checkwin():
    global gameRunning
    if checkHorizontal() or checkRow() or checkdiag():
        gameRunning = False
        return True
    return False

def switchplayer():
    global currentplayer
    currentplayer = "O" if currentplayer == "X" else "X"

def computerMove():
    """Random move by the computer."""
    global board, currentplayer
    while currentplayer == "O":
        position = random.randint(0, 8)
        if board[position] == "-":
            board[position] = "O"
            switchplayer()
            break

# API Endpoints
@app.route("/start", methods=["POST"])
def start_game():
    """Starts a new game."""
    global board, currentplayer, winner, gameRunning
    board = ["-"] * 9
    currentplayer = "X"
    winner = None
    gameRunning = True
    return jsonify({"message": "Game started", "board": board, "currentplayer": currentplayer})

@app.route("/play", methods=["POST"])
def play_turn():
    """Handles a player's move."""
    global board, currentplayer, gameRunning, winner
    # Parse input
    data = request.json
    position = data.get("position")

    if position is None or not (0 <= position <= 8):
        return jsonify({"error": "Invalid position"}), 400

    if board[position] != "-":
        return jsonify({"error": "Position already occupied"}), 400

    # Update board
    board[position] = currentplayer

    # Check win/tie
    if checkwin():
        return jsonify({"message": f"{winner} wins!", "board": board})
    if checktie():
        return jsonify({"message": "It's a tie!", "board": board})

    # Switch player
    switchplayer()
    return jsonify({"message": "Move successful", "board": board, "currentplayer": currentplayer})

@app.route("/computer", methods=["POST"])
def computer_turn():
    """Handles the computer's move."""
    global board, gameRunning

    if currentplayer != "O":
        return jsonify({"error": "It's not the computer's turn"}), 400

    computerMove()

    # Check win/tie
    if checkwin():
        return jsonify({"message": f"{winner} wins!", "board": board})
    if checktie():
        return jsonify({"message": "It's a tie!", "board": board})

    return jsonify({"message": "Computer played", "board": board, "currentplayer": currentplayer})

@app.route("/status", methods=["GET"])
def get_status():
    """Returns the current game state."""
    return jsonify({
        "board": board,
        "currentplayer": currentplayer,
        "gameRunning": gameRunning,
        "winner": winner
    })
@app.route('/')
def serve_html():
    return redirect(url_for('static', filename='homepage.html'))

@app.route('/friends.html')
def serve_friends():
    return redirect(url_for('static', filename='friends.html'))

@app.route('/computer.html')
def serve_computer():
    return redirect(url_for('static', filename='computer.html'))

    
if __name__ == "__main__":
    app.run(debug=True,host="127.0.0.1", port=5000)