/* Copyright 2025 Marien Raat <mail@marienraat.nl>
 *  
 * This file is part of Cheqqers.
 *                           
 * Cheqqers is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *                                
 * Cheqqers is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Affero General Public License for more details.
 *                                                    
 * You should have received a copy of the GNU Affero General Public
 * License along with Cheqqers. If not, see
 * <https://www.gnu.org/licenses/>.
 *  */
import React, { useState, useEffect } from "react";
import GameBoard from "./components/GameBoard";
import { fetchInitialBoard, doMove, doAiMove } from "./services/api";
import { Tutorial } from "./tutorial";

// Default rows of pieces for each board size
const defaultRowsForSize: { [key: number]: number } = {
  4: 1,
  5: 2,
  6: 2,
  7: 3,
  8: 3,
};

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
    return (localStorage.getItem("againstAi") || "false") == "true";
  });

  const [boardSize, setBoardSize] = useState(() => {
    const saved = localStorage.getItem("boardSize");
    return saved ? parseInt(saved) : 8;
  });

  const [startRows, setStartRows] = useState(() => {
    const saved = localStorage.getItem("startRows");
    return saved ? parseInt(saved) : 3;
  });

  const [thinking, setThinking] = useState(false);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if this is the first visit and show tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("hasSeenTutorial", "true");
  };

  const handleOpenTutorial = () => {
    setShowTutorial(true);
  };

  const onMove = async (moveIndex: number) => {
    const data = await doMove(boardState, moveIndex, false);
    setBoardState(data);
    localStorage.setItem("boardState", JSON.stringify(data)); // Save the updated board state
    if (againstAi) {
      setThinking(true);
      const dataNext = await doAiMove(data);
      setBoardState(dataNext);
      localStorage.setItem("boardState", JSON.stringify(dataNext)); // Save the updated board state
      setThinking(false);
    }
  };

  // TODO: Display king
  const startNewGame = async () => {
    try {
      const data = await fetchInitialBoard(parseInt(quantumnessLevel), boardSize, startRows);
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

  const handleAiChange = (event : any) => {
    const ai = event.target.checked;
    setAgainstAi(ai);
    localStorage.setItem("againstAi", `${ai}`);
  };

  const handleBoardSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(event.target.value);
    setBoardSize(newSize);
    localStorage.setItem("boardSize", `${newSize}`);
    // Update start rows to default for new board size
    const newDefaultRows = defaultRowsForSize[newSize] || 3;
    setStartRows(newDefaultRows);
    localStorage.setItem("startRows", `${newDefaultRows}`);
  };

  // Maximum rows of pieces allowed (leaves middle row empty)
  const maxStartRows = Math.floor((boardSize - 1) / 2);

  const handleStartRowsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRows = parseInt(event.target.value);
    // Ensure rows is at least 1 and at most maxStartRows
    const validRows = Math.max(1, Math.min(newRows, maxStartRows));
    setStartRows(validRows);
    localStorage.setItem("startRows", `${validRows}`);
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
      <div className="board-size-selector">
        <label htmlFor="board-size">Board Size:</label>
        <select
          id="board-size"
          value={boardSize}
          onChange={handleBoardSizeChange}
        >
          <option value="4">4x4</option>
          <option value="5">5x5</option>
          <option value="6">6x6</option>
          <option value="7">7x7</option>
          <option value="8">8x8</option>
        </select>
      </div>
      <div className="start-rows-selector">
        <label htmlFor="start-rows">Rows of pieces:</label>
        <input
          type="number"
          id="start-rows"
          value={startRows}
          onChange={handleStartRowsChange}
          min={1}
          max={maxStartRows}
        />
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={againstAi == true}
          onChange={handleAiChange}
        />
        Play against AI
      </label>
      <div className="menu-buttons">
        <button onClick={handleStartGameClick} className="start-button">
          Start Game!
        </button>
        <button onClick={handleOpenTutorial} className="tutorial-menu-button">
          How to Play
        </button>
      </div>
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
            <div style={thinking ? {pointerEvents: "none"} : {}}>
              <GameBoard boardState={boardState} onMove={onMove} />
              {endGameScreen}
            </div>
            <div>{thinking ? (<p>AI is thinking...</p>) : (<div></div>)}</div>
            </div>
          ) : (
            <p>Loading board...</p>
          )
        ) : (
          startMenu
        )}
        <Tutorial isOpen={showTutorial} onClose={handleCloseTutorial} />
      </div>
    );
};

export default App;
