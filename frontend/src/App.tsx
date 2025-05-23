import React, { useEffect, useState } from "react";
import GameBoard from "./components/GameBoard";
import { fetchInitialBoard, doMove } from "./services/api";

const App: React.FC = () => {
  const [boardState, setBoardState] = useState(() => {
    const savedState = localStorage.getItem("boardState");
    return savedState ? JSON.parse(savedState) : null;
  });

  const [gameStarted, setGameStarted] = useState(() => {
    return localStorage.getItem("gameStarted") === "true";
  });

  const [againstAi, setAgainstAi] = useState(true);

  const onMove = async (moveIndex: number) => {
    const data = await doMove(boardState, moveIndex, againstAi);
    setBoardState(data);
    localStorage.setItem("boardState", JSON.stringify(data)); // Save the updated board state
  };

  const startNewGame = async () => {
    try {
      const data = await fetchInitialBoard();
      setBoardState(data);
      setGameStarted(true);
      localStorage.setItem("boardState", JSON.stringify(data));
      localStorage.setItem("gameStarted", "true");
    } catch (error) {
      console.error("Failed to load initial board state:", error);
    }
  };

  const handleStartGameClick = () => {
    localStorage.removeItem("boardState");
    localStorage.setItem("gameStarted", "true");
    startNewGame();
  };

  const handleExitToMainMenu = () => {
    setGameStarted(false);
    localStorage.removeItem("boardState");
    localStorage.removeItem("gameStarted");
  };

  let startMenu = (
    <div className="start-menu">
      <h1>Welcome to Quantum Checkers</h1>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={againstAi}
          onChange={(e) => setAgainstAi(e.target.checked)}
        />
        Play against AI
      </label>
      <button onClick={handleStartGameClick} className="start-button">
        Start Game!
      </button>
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Cheqqers</h1>
        {gameStarted && (
          <button onClick={handleExitToMainMenu} className="exit-button">
            Exit to Main Menu
          </button>
        )}
      </header>
      {gameStarted ? (
        boardState ? (
          <GameBoard boardState={boardState} onMove={onMove} />
        ) : (
          <p>Loading board...</p>
        )
      ) : (
        startMenu
      )}
    </div>
  );
};

export default App;
