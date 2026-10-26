# Little Tic Tac Toe

A browser-based Tic-Tac-Toe game with a colorful, responsive interface. Play against the computer or share the board with a friend.

## Features

- Homepage with links to both game modes and an animated Tic-Tac-Toe preview.
- Friend mode with player name entry and personalized turn and winner messages.
- Computer mode with the player moving as X and the computer responding as O.
- X and O win counters that continue across rounds during the browser tab session.
- Animated line across the winning row, column, or diagonal.
- New-game button and a confirmation before leaving an unfinished game.
- Flask backend for game state and computer moves.

## Requirements

- Python 3.9 or newer
- Flask
- Flask-Cors

No Node.js or frontend build step is required.

## Run locally

Open PowerShell in the project directory and install the Python packages:

```powershell
python -m pip install Flask Flask-Cors
```

Start the Flask server:

```powershell
python .\static\tic-tac-toe.py
```

Open [http://127.0.0.1:5000/](http://127.0.0.1:5000/) in your browser. You can also visit the pages directly:

- Homepage: [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
- Play with a friend: [http://127.0.0.1:5000/friends.html](http://127.0.0.1:5000/friends.html)
- Play with the computer: [http://127.0.0.1:5000/computer.html](http://127.0.0.1:5000/computer.html)

Keep the terminal running while you play. Press **Ctrl+C** in the terminal to stop the server.

## Project structure

```text
static/
├── tic-tac-toe.py       # Flask server and game API
├── homepage.html        # Home page and game mode selection
├── homepage.css         # Home page styles
├── friends.html         # Local two-player game
├── computer.html        # Play against the computer
├── TicTacToe.css        # Shared game page styles
└── game.js              # Board interaction and game UI behavior
```

## Game API

The Flask server exposes these endpoints, used by the game pages:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/start` | Start a new game |
| `POST` | `/play` | Submit a move with a JSON `position` from `0` to `8` |
| `POST` | `/computer` | Make the computer's move |
| `GET` | `/status` | Read the current board and game state |

## Notes

- The computer chooses a random available square; it does not use a strategy or difficulty level.
- Game state is held in the Flask server's memory and is reset when a new game starts or the server restarts.
