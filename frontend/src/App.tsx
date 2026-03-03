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
import React, { useState, useEffect, useRef } from "react";
import GameBoard from "./components/GameBoard";
import PuzzleSelect from "./components/PuzzleSelect";
import { fetchInitialBoard, doMove, doAiMove, setupPuzzle, undoMove } from "./services/api";
import type { Puzzle } from "./puzzles";

// Default rows of pieces for each board size
const defaultRowsForSize: { [key: number]: number } = {
  4: 1,
  5: 2,
  6: 2,
  7: 3,
  8: 3,
};

type AppMode = "menu" | "game" | "puzzleSelect" | "puzzle";

const ogLog = console.log;
console.log = (...args) => {
  ogLog(...args);
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('[checkWinStates]') || args[0].includes('[App.tsx]') || args[0].includes('[STATE_CHANGE]'))) {
    try {
      const stored = JSON.parse(localStorage.getItem('debugLogs') || '[]');
      stored.push(args.join(' '));
      if (stored.length > 20) stored.shift();
      localStorage.setItem('debugLogs', JSON.stringify(stored));
    } catch (e) { }
  }
};

const App: React.FC = () => {
  const [boardState, setBoardState] = useState(() => {
    const savedState = localStorage.getItem("boardState");
    return savedState ? JSON.parse(savedState) : null;
  });

  const [mode, setMode] = useState<AppMode>(() => {
    const savedMode = localStorage.getItem("appMode");
    if (savedMode === "game" || savedMode === "puzzle" || savedMode === "puzzleSelect") {
      return savedMode as AppMode;
    }
    return localStorage.getItem("gameStarted") === "true" ? "game" : "menu";
  });

  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(() => {
    const saved = localStorage.getItem("currentPuzzle");
    return saved ? JSON.parse(saved) : null;
  });

  const [showHint, setShowHint] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

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
  const [showDebugHistory, setShowDebugHistory] = useState(false);
  const [showQuantumState, setShowQuantumState] = useState(false);

  const boardStateRef = useRef(boardState);
  useEffect(() => {
    boardStateRef.current = boardState;
  }, [boardState]);

  const onMove = async (moveIndex: number) => {
    let data = await doMove(boardStateRef.current, moveIndex);
    setBoardState(data);
    localStorage.setItem("boardState", JSON.stringify(data));

    if (mode === "game" && againstAi) {
      setThinking(true);
      // Let the AI take as many consecutive turns as the game logic demands (multi-captures!)
      while (data.turn === 1 /* BLACK */ && data.game_state === 0) {
        data = await doAiMove(data);
        setBoardState(data);
        localStorage.setItem("boardState", JSON.stringify(data));
      }
      setThinking(false);
    }
  };

  const onPuzzleMove = async (moveIndex: number) => {
    const move = boardState.possible_moves[moveIndex];
    const isSplitMove = move.to_index1 !== undefined;

    const data = await doMove(boardState, moveIndex);
    setBoardState(data);
    localStorage.setItem("boardState", JSON.stringify(data));

    // If the player used a split move, mark the puzzle as solved
    if (isSplitMove && currentPuzzle) {
      setTimeout(() => {
        setPuzzleSolved(true);
      }, 1500);
      // Save completion to localStorage
      const completed = JSON.parse(
        localStorage.getItem("completedPuzzles") || "[]"
      ) as string[];
      if (!completed.includes(currentPuzzle.id)) {
        completed.push(currentPuzzle.id);
        localStorage.setItem("completedPuzzles", JSON.stringify(completed));
      }
    }

    // After player's move, let AI respond for Black
    if (data.game_state === 0 && data.turn === 1) {
      setThinking(true);
      try {
        const dataNext = await doAiMove(data);
        setBoardState(dataNext);
        localStorage.setItem("boardState", JSON.stringify(dataNext));
      } catch (e) {
        console.error("AI move failed:", e);
      }
      setThinking(false);
    }
  };

  const handleUndo = async () => {
    if (boardState && boardState.move_history && boardState.move_history.length > 0) {
      setThinking(true);
      const isPuzzleMode = mode === "puzzle";
      // Puzzles don't use the standard AI loop
      const data = await undoMove(boardState, isPuzzleMode ? false : againstAi);
      setBoardState(data);
      localStorage.setItem("boardState", JSON.stringify(data));
      setThinking(false);
    }
  };

  React.useEffect(() => {
    (window as any).runDebugSequence = async (seq: number[]) => {
      console.log("Starting Debug Sequence...");
      // Ensure we are in an 6x6 Quantum Level 1 game
      let data = await fetchInitialBoard(1, 6, 2);
      setBoardState(data);
      setMode("game");

      for (const move of seq) {
        console.log(`Executing move ${move}...`);
        console.log(`Available moves: ${data.possible_moves.length}`);
        const m = data.possible_moves[move];
        if (!m) {
          console.error(`Invalid move index ${move}`);
          break;
        }
        if ((m as any).is_take_move) {
          console.log(`Move type: Take from ${(m as any).from_index} to ${(m as any).to_index}`);
        } else if ((m as any).to_index1 !== undefined) {
          console.log(`Move type: Split from ${(m as any).from_index} to ${(m as any).to_index1}, ${(m as any).to_index2}`);
        } else if ((m as any).from_index1 !== undefined) {
          console.log(`Move type: Merge to ${(m as any).to_index}`);
        } else {
          console.log(`Move type: Slide from ${(m as any).from_index} to ${(m as any).to_index}`);
        }
        data = await doMove(data, move);
        setBoardState(data);
        // Add a small delay so human eyes can see it if looking at the screen
        await new Promise(r => setTimeout(r, 500));
      }
      console.log("Debug Sequence Complete. Board State:");
      console.log(data);
    };
  }, []);

  // TODO: Display king
  const startNewGame = async () => {
    try {
      const data = await fetchInitialBoard(parseInt(quantumnessLevel), boardSize, startRows);
      setBoardState(data);
      setMode("game");
      localStorage.setItem("boardState", JSON.stringify(data));
      localStorage.setItem("appMode", "game");
    } catch (error) {
      console.error("Failed to load initial board state:", error);
    }
  };

  const handleStartGameClick = () => {
    localStorage.removeItem("boardState");
    startNewGame();
  };

  const handlePuzzlesClick = () => {
    setMode("puzzleSelect");
    localStorage.setItem("appMode", "puzzleSelect");
  };

  const handleSelectPuzzle = async (puzzle: Puzzle) => {
    try {
      const data = await setupPuzzle({
        board_size: puzzle.boardSize,
        game_type: puzzle.gameType,
        turn: puzzle.turn,
        pieces: puzzle.pieces,
      });
      setBoardState(data);
      setCurrentPuzzle(puzzle);
      setMode("puzzle");
      setPuzzleSolved(false);
      setShowHint(false);
      localStorage.setItem("boardState", JSON.stringify(data));
      localStorage.setItem("currentPuzzle", JSON.stringify(puzzle));
      localStorage.setItem("appMode", "puzzle");
    } catch (error) {
      console.error("Failed to set up puzzle:", error);
    }
  };

  const handleRetryPuzzle = async () => {
    if (currentPuzzle) {
      await handleSelectPuzzle(currentPuzzle);
    }
  };

  const handleExitToMainMenu = () => {
    setMode("menu");
    setBoardState(null);
    setCurrentPuzzle(null);
    setPuzzleSolved(false);
    setShowHint(false);
    localStorage.removeItem("boardState");
    localStorage.removeItem("currentPuzzle");
    localStorage.setItem("appMode", "menu");
    localStorage.removeItem("gameStarted");
  };

  const handleQuantumnessChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLevel = event.target.value;
    setQuantumnessLevel(selectedLevel);
    localStorage.setItem("quantumnessLevel", selectedLevel);
  };

  const handleAiChange = (event: any) => {
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
    <div className="text-center flex flex-col items-center gap-4 mt-20">
      <h1 className="text-4xl font-bold mb-4">Cheqqers</h1>
      <p className="text-lg text-gray-400 mb-8 mt-[-1rem]">A Quantum Checkers Game</p>
      <div className="flex items-center gap-3 text-lg">
        <label htmlFor="quantumness-level" className="min-w-[120px] text-right">Quantumness Level:</label>
        <select
          id="quantumness-level"
          value={quantumnessLevel}
          onChange={handleQuantumnessChange}
          className="p-1 rounded border border-gray-600 bg-zinc-800 text-white w-64"
        >
          <option value="0">Classical</option>
          <option value="1">Quantum level 1 (superpositions)</option>
          <option value="2">Quantum level 2 (entanglement)</option>
          <option value="3">Quantum level 3 (interference)</option>
        </select>
      </div>
      <div className="flex items-center gap-3 text-lg">
        <label htmlFor="board-size" className="min-w-[120px] text-right">Board Size:</label>
        <select
          id="board-size"
          value={boardSize}
          onChange={handleBoardSizeChange}
          className="p-1 rounded border border-gray-600 bg-zinc-800 text-white"
        >
          <option value="4">4x4</option>
          <option value="5">5x5</option>
          <option value="6">6x6</option>
          <option value="7">7x7</option>
          <option value="8">8x8</option>
        </select>
      </div>
      <div className="flex items-center gap-3 text-lg">
        <label htmlFor="start-rows" className="min-w-[120px] text-right">Rows of pieces:</label>
        <input
          type="number"
          id="start-rows"
          value={startRows}
          onChange={handleStartRowsChange}
          min={1}
          max={maxStartRows}
          className="p-1 rounded border border-gray-600 bg-zinc-800 text-white w-20 text-center"
        />
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-lg mt-4">
        <input
          type="checkbox"
          checked={againstAi == true}
          onChange={handleAiChange}
        />
        Play against AI
      </label>
      <div className="flex gap-4 justify-center mt-6">
        <button onClick={handleStartGameClick} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors">
          Start Game!
        </button>
        <button onClick={handlePuzzlesClick} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors">
          🧩 Puzzles
        </button>
      </div>
    </div>
  );

  let endGameScreen = (
    boardState?.game_state != 0 ?
      (<div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[2000]">
        <div className="bg-zinc-800 p-6 rounded-xl text-center shadow-2xl border border-zinc-700 max-w-sm w-full mx-4">
          <h2 className="text-2xl font-bold mb-6 text-white">
            {boardState?.game_state == 1 ? "White won!"
              : (boardState?.game_state == 2 ? "Black won!" : "It's a draw")}
          </h2>
          <button onClick={handleExitToMainMenu} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors border-0">
            Exit to Main Menu
          </button>
        </div>
      </div>) : (<div></div>)
  );

  let puzzleSolvedOverlay = puzzleSolved ? (
    <div className="fixed inset-0 pointer-events-none flex justify-center items-end pb-10 z-[2000]">
      <div className="pointer-events-auto bg-gradient-to-br from-indigo-950 to-blue-900 border border-green-500 p-6 rounded-xl text-center shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-5 duration-300">
        <h2 className="text-green-400 text-3xl font-bold mb-2">🎉 Puzzle Solved!</h2>
        <p className="text-gray-300 mb-2">You used a split move to change the outcome!</p>
        {currentPuzzle && <p className="text-purple-400 font-bold mb-6 text-lg">{currentPuzzle.title}</p>}
        <div className="flex gap-3 justify-center">
          <button onClick={handleRetryPuzzle} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors border-0">
            Retry
          </button>
          <button onClick={() => { setMode("puzzleSelect"); localStorage.setItem("appMode", "puzzleSelect"); setPuzzleSolved(false); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors border-0">
            More Puzzles
          </button>
          <button onClick={handleExitToMainMenu} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors border-0">
            Main Menu
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center pt-20 pb-10 px-4 overflow-y-auto w-full">
      <header className="fixed top-0 left-0 w-full bg-zinc-950 border-b border-zinc-800 text-white p-3 px-6 flex justify-between items-center z-50 shadow-md">
        <h1 className="m-0 text-xl font-bold tracking-wider">Cheqqers</h1>
        {mode !== "menu" && (
          <button onClick={handleExitToMainMenu} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors border-0">
            Exit to Main Menu
          </button>
        )}
      </header>
      {mode === "menu" && startMenu}
      {mode === "puzzleSelect" && (
        <PuzzleSelect
          onSelectPuzzle={handleSelectPuzzle}
          onBack={handleExitToMainMenu}
        />
      )}
      {mode === "game" && (
        boardState ? (
          <div>
            <div style={thinking ? { pointerEvents: "none" } : {}} className="flex flex-col items-center">
              <GameBoard boardState={boardState} onMove={onMove} />

              <div className="flex gap-4 justify-center mt-6 w-full max-w-[400px]">
                <button
                  onClick={handleUndo}
                  disabled={!boardState?.move_history?.length}
                  className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors w-full"
                >
                  ↩ Undo Move
                </button>
                <button
                  onClick={() => setShowDebugHistory(!showDebugHistory)}
                  className="px-5 py-2 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 text-white rounded font-medium transition-colors whitespace-nowrap"
                  title="Show Debug History"
                >
                  🐛
                </button>
                <button
                  onClick={() => setShowQuantumState(!showQuantumState)}
                  className="px-5 py-2 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 text-purple-400 rounded font-medium transition-colors whitespace-nowrap"
                  title="Show Quantum States"
                >
                  ⚛️
                </button>
              </div>

              {showDebugHistory && (
                <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 text-green-400 font-mono text-xs w-full max-w-[400px] break-all rounded shadow-inner">
                  <div className="mb-2 text-zinc-500 uppercase tracking-widest text-[10px]">Bug Report String:</div>
                  {(boardState?.move_history || []).length > 0 ? JSON.stringify(boardState.move_history) : "[]"}
                </div>
              )}

              {showQuantumState && boardState?.quantum_states && (
                <div className="mt-4 p-4 bg-zinc-950 border border-purple-900/50 text-indigo-200 text-sm w-full max-w-[600px] break-all rounded-lg shadow-inner text-left max-h-[400px] overflow-y-auto">
                  <div className="mb-3 text-purple-400 font-bold uppercase tracking-widest text-xs flex items-center justify-between gap-2">
                    <span>⚛️ Quantum State Inspector</span>
                    <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full text-[10px]">{boardState.quantum_states.length} active systems</span>
                  </div>
                  {boardState.quantum_states.length === 0 ? (
                    <div className="text-zinc-500 italic text-center py-4">No superpositions or entangled systems active.</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {boardState.quantum_states.map((qs: any, idx: number) => (
                        <div key={idx} className="bg-zinc-900/80 p-3 rounded border border-zinc-800">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${qs.type === 'entangled' ? 'bg-indigo-900/60 text-indigo-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                              {qs.type.toUpperCase()}
                            </span>
                            <span className="text-xs font-mono text-zinc-400">Sq: [{qs.squares.join(', ')}]</span>
                          </div>
                          <div className="pl-2 border-l-2 border-zinc-800 flex flex-col gap-1">
                            {qs.amplitudes.map((amp: any, aIdx: number) => (
                              <div key={aIdx} className="font-mono text-xs flex justify-between">
                                <span className="text-zinc-300">|{amp.state}⟩</span>
                                <span className="text-zinc-500">
                                  {amp.re.toFixed(3)}{amp.im >= 0 ? '+' : ''}{amp.im.toFixed(3)}i
                                  <span className="ml-2 text-zinc-400 w-12 inline-block text-right">{((amp.re * amp.re + amp.im * amp.im) * 100).toFixed(1)}%</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {endGameScreen}
            </div>
            <div className="h-6 mt-4 text-center text-gray-400">{thinking ? (<p>AI is thinking...</p>) : null}</div>
          </div>
        ) : (
          <p>Loading board...</p>
        )
      )}
      {mode === "puzzle" && (
        boardState ? (
          <div>
            {currentPuzzle && (
              <div className="text-center mb-6 px-4 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-200 mb-2">{currentPuzzle.title}</h2>
                <p className="text-gray-400 mb-4">{currentPuzzle.description}</p>
                <div className="flex gap-3 justify-center mb-4">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors border-0 font-medium"
                  >
                    {showHint ? "Hide Hint" : "💡 Show Hint"}
                  </button>
                  <button onClick={handleRetryPuzzle} className="px-4 py-1.5 text-sm bg-zinc-700 text-white rounded hover:bg-zinc-600 transition-colors border-0 font-medium">
                    🔄 Retry
                  </button>
                </div>
                {showHint && (
                  <p className="text-sm text-orange-200 italic bg-orange-500/10 py-3 px-5 rounded-lg border-l-4 border-orange-500 my-2 mx-auto max-w-md text-left leading-relaxed">
                    {currentPuzzle.hint}
                  </p>
                )}
              </div>
            )}
            <div style={thinking ? { pointerEvents: "none" } : {}} className="flex flex-col items-center">
              <GameBoard boardState={boardState} onMove={onPuzzleMove} />

              <div className="flex gap-4 justify-center mt-6 w-full max-w-[400px]">
                <button
                  onClick={handleUndo}
                  disabled={!boardState?.move_history?.length}
                  className="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium transition-colors w-full"
                >
                  ↩ Undo Move
                </button>
                <button
                  onClick={() => setShowDebugHistory(!showDebugHistory)}
                  className="px-5 py-2 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 text-white rounded font-medium transition-colors whitespace-nowrap"
                  title="Show Debug History"
                >
                  🐛
                </button>
                <button
                  onClick={() => setShowQuantumState(!showQuantumState)}
                  className="px-5 py-2 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 text-purple-400 rounded font-medium transition-colors whitespace-nowrap"
                  title="Show Quantum States"
                >
                  ⚛️
                </button>
              </div>

              {showDebugHistory && (
                <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 text-green-400 font-mono text-xs w-full max-w-[400px] break-all rounded shadow-inner">
                  <div className="mb-2 text-zinc-500 uppercase tracking-widest text-[10px]">Bug Report String:</div>
                  {(boardState?.move_history || []).length > 0 ? JSON.stringify(boardState.move_history) : "[]"}
                </div>
              )}

              {showQuantumState && boardState?.quantum_states && (
                <div className="mt-4 p-4 bg-zinc-950 border border-purple-900/50 text-indigo-200 text-sm w-full max-w-[600px] break-all rounded-lg shadow-inner text-left max-h-[400px] overflow-y-auto">
                  <div className="mb-3 text-purple-400 font-bold uppercase tracking-widest text-xs flex items-center justify-between gap-2">
                    <span>⚛️ Quantum State Inspector</span>
                    <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full text-[10px]">{boardState.quantum_states.length} active systems</span>
                  </div>
                  {boardState.quantum_states.length === 0 ? (
                    <div className="text-zinc-500 italic text-center py-4">No superpositions or entangled systems active.</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {boardState.quantum_states.map((qs: any, idx: number) => (
                        <div key={idx} className="bg-zinc-900/80 p-3 rounded border border-zinc-800">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${qs.type === 'entangled' ? 'bg-indigo-900/60 text-indigo-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                              {qs.type.toUpperCase()}
                            </span>
                            <span className="text-xs font-mono text-zinc-400">Sq: [{qs.squares.join(', ')}]</span>
                          </div>
                          <div className="pl-2 border-l-2 border-zinc-800 flex flex-col gap-1">
                            {qs.amplitudes.map((amp: any, aIdx: number) => (
                              <div key={aIdx} className="font-mono text-xs flex justify-between">
                                <span className="text-zinc-300">|{amp.state}⟩</span>
                                <span className="text-zinc-500">
                                  {amp.re.toFixed(3)}{amp.im >= 0 ? '+' : ''}{amp.im.toFixed(3)}i
                                  <span className="ml-2 text-zinc-400 w-12 inline-block text-right">{((amp.re * amp.re + amp.im * amp.im) * 100).toFixed(1)}%</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {puzzleSolvedOverlay}
            {!puzzleSolved && endGameScreen}
            <div className="h-6 mt-4 text-center text-gray-400">{thinking ? (<p>AI is thinking...</p>) : null}</div>
          </div>
        ) : (
          <p>Loading puzzle...</p>
        )
      )}
    </div>
  );
};

export default App;
