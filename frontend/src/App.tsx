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

  const [quantumnessLevel, setQuantumnessLevel] = useState(() => {
    return localStorage.getItem("quantumnessLevel") || "3";
  });

  const [againstAi, setAgainstAi] = useState(() => {
    return (localStorage.getItem("againstAi") || "true") == "true";
  });

  const onMove = async (moveIndex: number) => {
    const data = await doMove(boardState, moveIndex, againstAi, quantumnessLevel);
    setBoardState(data);
    localStorage.setItem("boardState", JSON.stringify(data)); // Save the updated board state
  };

  const startNewGame = async () => {
    try {
      const data = await fetchInitialBoard(quantumnessLevel);
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

  const handleQuantumnessChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLevel = event.target.value;
    setQuantumnessLevel(selectedLevel);
    localStorage.setItem("quantumnessLevel", selectedLevel);
  };

  const handleAiChange = (event) => {
    const ai = event.target.checked;
    setAgainstAi(ai);
    localStorage.setItem("againstAi", `${ai}`);
  };

  let startMenu = (
    <div className="start-menu">
      <h1>Cheqqers - A Quantum Checkers Game</h1>
      <div className="quantumness-selector">
        <label htmlFor="quantumness-level">Quantumness Level:</label>
        <select
          id="quantumness-level"
          value={quantumnessLevel}
          onChange={handleQuantumnessChange}
        >
          <option value="0">Classical</option>
          <option value="1">Quantum level 1 (superpositions)</option>
          <option value="2">Quantum level 2 (entanglement)</option>
          <option value="3">Quantum level 3 (interference)</option>
        </select>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={againstAi == true}
          onChange={handleAiChange}
        />
        Play against AI
      </label>
      <button onClick={handleStartGameClick} className="start-button">
        Start Game!
      </button>
    </div>
  );

  let endGameScreen = (
    boardState?.game_state != 0 ?
    (<div className="game-over-overlay">
      <div className="game-over-content">
        <h2>
          {boardState?.game_state == 1 ? "White won!"
          : (boardState?.game_state == 2 ? "Black won!" : "It's a draw")}
        </h2>
        <button onClick={handleExitToMainMenu} className="exit-button">
          Exit to Main Menu
        </button>
      </div>
    </div>) : (<div></div>)
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
            <div>
              <GameBoard boardState={boardState} onMove={onMove} />
              {endGameScreen}
            </div>
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
