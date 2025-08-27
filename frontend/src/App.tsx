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
import React, { useState } from "react";
import GameBoard from "./components/GameBoard";
import { fetchInitialBoard, doMove } from "./services/api";


const App: React.FC = () => {
  let query = new URLSearchParams(window.location.search);
  let embedded = query.get('embed') === 'true';

  const [boardState, setBoardState] = useState(() => {
    if (embedded) {
      return null;
    }
    const savedState = localStorage.getItem("boardState");
    return savedState ? JSON.parse(savedState) : null;
  });

  const [gameStarted, setGameStarted] = useState(() => {
    return localStorage.getItem("gameStarted") === "true";
  });

  const [quantumnessLevel, setQuantumnessLevel] = useState(() => {
    if (embedded) {
      return query.get('level') || "0";
    }
    return localStorage.getItem("quantumnessLevel") || "3";
  });

  const [againstAi, setAgainstAi] = useState(() => {
    if (embedded) {
      return (query.get('ai') || "false") == "true";
    }
    return (localStorage.getItem("againstAi") || "false") == "true";
  });

  const onMove = async (moveIndex: number) => {
    const data = await doMove(boardState, moveIndex, againstAi);
    setBoardState(data);
    localStorage.setItem("boardState", JSON.stringify(data)); // Save the updated board state
  };

  // TODO: Display king
  const startNewGame = async () => {
    try {
      const data = await fetchInitialBoard(parseInt(quantumnessLevel));
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

  if (embedded) {
    if (!boardState) {
      startNewGame();
    }
    /* todo level */
    return (<div>
      {boardState ? (
      <div>
        <GameBoard boardState={boardState} onMove={onMove} embedded={true} />
        {endGameScreen}
      </div>
      ) : (
      <p>Loading board...</p>
      )}
    </div>);
  }

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
            <GameBoard boardState={boardState} onMove={onMove}
            embedded={false} />
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
