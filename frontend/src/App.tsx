/* Copyright 2026 QuantumPlayed
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
import { useNavigate, useLocation } from "react-router-dom";
import QuantumPlayedBranding from './components/QuantumPlayedBranding';
import GameBoard from './components/GameBoard';
import MoveHistory from "./components/MoveHistory";
import { supabase } from './utils/supabase';
import PuzzleSelect from "./components/PuzzleSelect";
import TutorialSelect from "./components/TutorialSelect";

import type { Puzzle } from "./puzzles";
import puzzles from "./puzzles";
import tutorials from "./tutorials";
import { CheqqersGame } from "./game/CheqqersGame";
import Logo from "./components/Logo";


// Default rows of pieces for each board size
const defaultRowsForSize: { [key: number]: number } = {
  4: 1,
  5: 2,
  6: 2,
  7: 3,
  8: 3,
  10: 4,
};

type AppMode = "menu" | "game" | "puzzleSelect" | "puzzle" | "tutorialSelect" | "tutorial" | "design" | "splash";

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [boardState, setBoardState] = useState(() => {
    const savedState = localStorage.getItem("boardState");
    return savedState ? JSON.parse(savedState) : null;
  });

  const [mode, setMode] = useState<AppMode>("splash");
  const navigate = useNavigate();
  const location = useLocation();
  // Prevent the URL-sync effect from reacting to navigations we ourselves triggered
  const isInternalNav = useRef(false);

  // Map AppMode → URL path
  const pathForMode = (m: AppMode, puzzle?: Puzzle | null): string => {
    if (m === "puzzle" && puzzle) return `/puzzles/${encodeURIComponent(puzzle.id)}`;
    if (m === "tutorial" && puzzle) return `/tutorials/${encodeURIComponent(puzzle.id)}`;
    if (m === "puzzleSelect") return "/puzzles";
    if (m === "tutorialSelect") return "/tutorials";
    if (m === "game") return "/game";
    if (m === "design") return "/editor";
    return "/";
  };

  // Navigation helper — updates both state AND URL
  const goTo = (newMode: AppMode, puzzle?: Puzzle | null) => {
    setMode(newMode);
    if (newMode !== "splash") {
      isInternalNav.current = true;
      navigate(pathForMode(newMode, puzzle));
    }
  };

  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);

  // ─── URL → State sync (refresh / back button / direct links) ───
  useEffect(() => {
    if (isInternalNav.current) {
      // We triggered this navigation ourselves — URL is already correct, skip
      isInternalNav.current = false;
      return;
    }

    const path = location.pathname;
    const allPuzzles = [...puzzles, ...tutorials];

    if (path.startsWith('/puzzles/')) {
      const id = decodeURIComponent(path.replace('/puzzles/', ''));
      const found = allPuzzles.find(p => p.id === id);
      if (found) {
        (async () => {
          try {
            const isTut = !!tutorials.find(t => t.id === found.id);
            const game = new CheqqersGame();
            game.forceAllMoves = isTut;
            game.setupPuzzle({ board_size: found.boardSize, game_type: found.gameType, turn: found.turn, pieces: found.pieces });
            const data = game.toGameStateObject();
            gameRef.current = game;
            setBoardState(data);
            setCurrentPuzzle(found);
            setPuzzleSolved(false);
            setShowHint(false);
            setPuzzleSequenceIndex(0);
            localStorage.setItem('boardState', JSON.stringify(data));
            localStorage.setItem('currentPuzzle', JSON.stringify(found));
            setMode(isTut ? 'tutorial' : 'puzzle');
          } catch (e) { navigate('/puzzles'); }
        })();
      } else { navigate('/puzzles'); }

    } else if (path === '/puzzles') {
      setMode('puzzleSelect');

    } else if (path.startsWith('/tutorials/')) {
      const id = decodeURIComponent(path.replace('/tutorials/', ''));
      const found = tutorials.find(t => t.id === id);
      if (found) {
        (async () => {
          try {
            const game = new CheqqersGame();
            game.forceAllMoves = true;
            game.setupPuzzle({ board_size: found.boardSize, game_type: found.gameType, turn: found.turn, pieces: found.pieces });
            const data = game.toGameStateObject();
            gameRef.current = game;
            setBoardState(data);
            setCurrentPuzzle(found);
            setPuzzleSolved(false);
            setShowHint(false);
            setPuzzleSequenceIndex(0);
            localStorage.setItem('boardState', JSON.stringify(data));
            setMode('tutorial');
          } catch (e) { navigate('/tutorials'); }
        })();
      } else { navigate('/tutorials'); }

    } else if (path === '/tutorials') {
      setMode('tutorialSelect');

    } else if (path === '/game') {
      // Restore game from localStorage, or redirect to menu
      const savedState = localStorage.getItem('boardState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setBoardState(parsed);
        setMode('game');
      } else {
        navigate('/');
      }

    } else if (path === '/editor') {
      setMode('design');

    } else {
      setMode('splash');
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const [showHint, setShowHint] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const [quantumnessLevel, setQuantumnessLevel] = useState(() => {
    return localStorage.getItem("quantumnessLevel") || "3";
  });

  const [tutorialCompleted, setTutorialCompleted] = useState(() => {
    return localStorage.getItem("tutorialCompleted") === "true";
  });

  const [boardSize, setBoardSize] = useState(() => {
    const saved = localStorage.getItem("boardSize");
    const parsed = saved ? parseInt(saved) : 8;
    // Clamp to even sizes only
    return [4, 6, 8].includes(parsed) ? parsed : 8;
  });

  const [startRows, setStartRows] = useState(() => {
    const saved = localStorage.getItem("startRows");
    return saved ? parseInt(saved) : 3;
  });

  const [thinking, setThinking] = useState(false);
  const [showDebugHistory, setShowDebugHistory] = useState(false);
  const [showQuantumState, setShowQuantumState] = useState(false);
  const [hideMeasured, setHideMeasured] = useState(true);
  const [puzzleSequenceIndex, setPuzzleSequenceIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayOptions, setShowPlayOptions] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("gameVolume");
    return saved ? parseInt(saved) : 80;
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    return localStorage.getItem("musicEnabled") !== "false";
  });
  const [backgroundBoardState, setBackgroundBoardState] = useState<any>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio("https://cdn.pixabay.com/audio/2026/01/12/audio_8ae093576e.mp3");
    audio.loop = true;
    audioRef.current = audio;

    // Browser autoplay policy: attempt to play on first user interaction
    const unlockAudio = () => {
      if (musicEnabled && audio.paused) {
        audio.play().catch(e => console.log("[Audio] Playback blocked or failed:", e));
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      audio.pause();
      audio.src = "";
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Sync Audio Settings
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    // Update volume (0.0 to 1.0)
    audio.volume = volume / 100;

    // Handle Enable/Disable
    if (musicEnabled) {
      if (audio.paused) {
        audio.play().catch(() => {
          // This usually fails if the user hasn't interacted yet, 
          // which is handled by the unlockAudio listener above.
        });
      }
    } else {
      audio.pause();
    }
  }, [musicEnabled, volume]);

  const isMenuMode = ["menu", "splash", "puzzleSelect", "tutorialSelect", "design", "settings"].includes(mode) || showPlayOptions || showSettings;


  // Splash Mode Engine
  const splashRef = useRef<{ active: boolean, timeout: any, inactivityTimeout: any }>({ active: false, timeout: null, inactivityTimeout: null });

  useEffect(() => {
    // Idle detection
    const resetIdleTimer = (e?: Event) => {
      // If we are playing in Splash mode (screensaver), any interaction breaks us out back to menu
      if (mode === "splash" && e && (e.type === 'pointerdown' || e.type === 'keydown')) {
        goTo("menu");
      }

      if (splashRef.current.timeout) clearTimeout(splashRef.current.timeout);
      if (splashRef.current.inactivityTimeout) clearTimeout(splashRef.current.inactivityTimeout);

      // Start or maintain the background game during any menu-like modes
      if (isMenuMode) {
        if (!splashRef.current.active) {
          splashRef.current.timeout = setTimeout(() => {
            startSplashMode();
          }, 0); // Start background game immediately
        }

        // Return to splash after 10s of inactivity ONLY if in menu mode
        if (mode === "menu") {
          const inactivityTimeout = setTimeout(() => {
            goTo("splash");
          }, 10000);

          splashRef.current.inactivityTimeout = inactivityTimeout;
        }
      } else {
        // Stop background game if we wander into actual gameplay
        splashRef.current.active = false;
      }
    };

    window.addEventListener('pointermove', resetIdleTimer);
    window.addEventListener('pointerdown', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);

    // Call immediately to handle mode transitions correctly
    resetIdleTimer();

    return () => {
      window.removeEventListener('pointermove', resetIdleTimer);
      window.removeEventListener('pointerdown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      if (splashRef.current.timeout) clearTimeout(splashRef.current.timeout);
      if (splashRef.current.inactivityTimeout) clearTimeout(splashRef.current.inactivityTimeout);
      splashRef.current.active = false;
    };
  }, [mode]);


  const backgroundGameRef = useRef<CheqqersGame>(new CheqqersGame());

  const startSplashMode = async () => {
    if (splashRef.current.active) return;
    splashRef.current.active = true;



    while (splashRef.current.active) {
      // Create a massive 10x10 board with 4 rows of pieces (Quantum Level 3)
      backgroundGameRef.current = new CheqqersGame(10, 4, 3);
      setBackgroundBoardState(backgroundGameRef.current.toGameStateObject());


      // Wait a moment before starting moves
      await new Promise(r => setTimeout(r, 500));
      if (!splashRef.current.active) break;

      // Play random moves until the game finishes
      let currentState = backgroundGameRef.current.toGameStateObject();
      while (currentState.game_state === 0 && splashRef.current.active) {
        const pMoves = backgroundGameRef.current.getPossibleMoves();

        // If there are no moves but game_state is 0 (shouldn't happen, but safety check)
        if (pMoves.length === 0) break;

        // Pick a random move
        const randomMoveIndex = Math.floor(Math.random() * pMoves.length);
        backgroundGameRef.current.applyMove(randomMoveIndex);

        currentState = backgroundGameRef.current.toGameStateObject();
        setBackgroundBoardState(currentState);

        // Faster delay between AI moves
        await new Promise(r => setTimeout(r, 1000));
      }

      // If finished, linger on the completed board briefly
      if (splashRef.current.active) {
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  };

  const gameRef = useRef<CheqqersGame>(new CheqqersGame());

  // Helper function to restore game state exactly as api.ts did
  const restoreGame = (state: any): CheqqersGame => {
    if (!state || !state.init_params) return new CheqqersGame();

    const p = state.init_params;
    let game: CheqqersGame;

    if (p.type === 'puzzle') {
      game = new CheqqersGame();
      game.setupPuzzle(p.data);
    } else {
      game = new CheqqersGame(p.size, p.startRows, p.gameType);
    }

    if (state.move_history) {
      for (const entry of state.move_history) {
        if (typeof entry === 'string') {
          if (entry.startsWith('M')) {
            // Manual measurement notation: M{sq}={outcome}
            const parts = entry.substring(1).split('=');
            if (parts.length === 2) {
              game.measureSquare(parseInt(parts[0]), parseInt(parts[1]));
            }
          } else {
            // General move notation: 12->16;M:1,0
            const seg = entry.split(';');
            const moveNot = seg[0];
            let forced: number[] | undefined;
            if (seg.length > 1 && seg[1].startsWith('M:')) {
              forced = seg[1].substring(2).split(',').map(s => parseInt(s));
            }

            // Find matching index comparing encoded target to possible moves
            const possible = game.getPossibleMoves();
            // Also accept old "4->6" notation for backwards compat with saved games
            const normalizedMoveNot = moveNot.replace(/->/g, '-');
            const moveIdx = possible.findIndex(m => CheqqersGame.encodeMoveNotation(m) === normalizedMoveNot);
            if (moveIdx !== -1) {
              game.applyMove(moveIdx, forced);
            }
          }
        } else {
          // Backward compatibility for old JSON saves if any exist during dev
          if (typeof entry === 'number') {
            game.applyMove(entry as any);
          } else if (entry.type === 'measurement') {
            game.measureSquare(entry.squareIndex, entry.outcome);
          } else {
            // For old moves that had random arrays, just drop the array since engine ignores it now
            // Or let the user replay via manual moves
            game.applyMove(entry.moveIndex);
          }
        }
      }
    }
    return game;
  };

  const getActiveGame = (state: any) => {
    // Attempting to keep gameRef in sync with localStorage state
    if (!gameRef.current || (state && (!gameRef.current.initParams || gameRef.current.initParams.type !== state.init_params?.type))) {
      gameRef.current = restoreGame(state);
    }
    if (gameRef.current) {
      const isTut = state?.init_params?.type === 'puzzle' && state.init_params.data?.id?.startsWith('ftue-');
      gameRef.current.forceAllMoves = isTut || mode === "tutorial";
    }
    return gameRef.current;
  };

  const boardStateRef = useRef(boardState);
  useEffect(() => {
    boardStateRef.current = boardState;
  }, [boardState]);

  const saveGameToSupabase = async (finalData: any) => {
    // Only save standard or custom games, not predefined puzzles or tutorials
    if (mode === "puzzle" || mode === "tutorial" || mode === "puzzleSelect") return;

    try {
      let statusStr = 'in_progress';
      if (finalData.game_state === 1) statusStr = 'white_won';
      if (finalData.game_state === 2) statusStr = 'black_won';
      if (finalData.game_state === 3) statusStr = 'draw';

      const { error } = await supabase.from('games').insert([{
        status: statusStr,
        game_config: finalData.init_params,
        move_history: finalData.move_history
      }]);
      if (error) throw error;
      console.log('Game neatly saved to Supabase!');
    } catch (err) {
      console.error('Failed to save game to Supabase:', err);
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [measuringSquares, setMeasuringSquares] = useState<number[]>([]);

  const onMove = async (moveIndex: number) => {
    const move = boardStateRef.current.possible_moves[moveIndex];
    if (!move) return;

    const activeGame = getActiveGame(boardStateRef.current);
    const involved = activeGame.getInvolvedSquares(move);

    const squaresToMeasure = involved.filter(({ index: sqIdx }) => {
      const chance = boardStateRef.current.chances[sqIdx];
      return chance !== undefined && chance > 0.001 && chance < 0.999;
    }).map(i => i.index);

    if (squaresToMeasure.length > 0) {
      setMeasuringSquares(squaresToMeasure);
      await new Promise(resolve => setTimeout(resolve, 900));
      setMeasuringSquares([]);
    }

    const game = getActiveGame(boardStateRef.current);
    game.applyMove(moveIndex);
    let data = game.toGameStateObject();

    setBoardState(data);
    localStorage.setItem("boardState", JSON.stringify(data));

    // Check if the move just ended the game
    if (data.game_state !== 0) {
      saveGameToSupabase(data);
      return; // No need for AI to move if game is over
    }

    if (false /* AI disabled */) {
      setThinking(true);
      while (data.turn === 1 /* BLACK */ && data.game_state === 0) {
        // Very simplistic AI simulation since MCTS isn't ported.
        const moves = game.getPossibleMoves();
        if (moves.length > 0) {
          const randomIndex = Math.floor(Math.random() * moves.length);
          game.applyMove(randomIndex);
        }
        data = game.toGameStateObject();
        setBoardState(data);
        localStorage.setItem("boardState", JSON.stringify(data));
      }
      setThinking(false);

      if (data.game_state !== 0) {
        saveGameToSupabase(data);
      }
    }
  };

  const onPuzzleMove = async (moveIndex: number) => {
    const move = boardState.possible_moves[moveIndex];

    const currentSeqNode = currentPuzzle?.expectedSequence ? currentPuzzle.expectedSequence[puzzleSequenceIndex] : currentPuzzle;
    const currentExpectedMoves = currentSeqNode?.expectedMoves;

    let isExpected = false;
    if (!currentExpectedMoves || currentExpectedMoves.length === 0) {
      isExpected = true;
    } else {
      for (const expected of currentExpectedMoves) {
        const m = move as any;
        const exactMatch =
          m.from_index === expected.from_index &&
          m.to_index === expected.to_index &&
          m.to_index1 === expected.to_index1 &&
          m.to_index2 === expected.to_index2 &&
          m.from_index1 === expected.from_index1 &&
          m.from_index2 === expected.from_index2;

        if (exactMatch) {
          isExpected = true;
          break;
        }
      }
    }

    if (!isExpected) {
      // Check for specific wrong move feedback
      const wrongMoves = currentSeqNode?.wrongMoves || currentPuzzle?.wrongMoves;
      if (wrongMoves) {
        for (const wrong of wrongMoves) {
          const m = move as any;
          if (
            m.from_index === wrong.from_index && m.to_index === wrong.to_index &&
            m.to_index1 === wrong.to_index1 && m.to_index2 === wrong.to_index2
          ) {
            setToastMessage(wrong.feedback || "Incorrect move, try again!");
            return;
          }
        }
      }
      setToastMessage("Incorrect move, try again!");
      return;
    }

    const game = getActiveGame(boardState);
    const involved = game.getInvolvedSquares(move);

    const squaresToMeasure = involved.filter(({ index: sqIdx }) => {
      const chance = boardState.chances[sqIdx];
      return chance !== undefined && chance > 0.001 && chance < 0.999;
    }).map(i => i.index);

    if (squaresToMeasure.length > 0) {
      setMeasuringSquares(squaresToMeasure);
      await new Promise(resolve => setTimeout(resolve, 900));
      setMeasuringSquares([]);
    }

    game.applyMove(moveIndex);
    const data = game.toGameStateObject();
    setBoardState(data);
    localStorage.setItem("boardState", JSON.stringify(data));

    // Advance sequence if applicable
    if (currentPuzzle?.expectedSequence && puzzleSequenceIndex < currentPuzzle.expectedSequence.length - 1) {
      const nextStepIdx = puzzleSequenceIndex + 1;
      const nextStep = currentPuzzle.expectedSequence[nextStepIdx];
      setTimeout(() => {
        if (nextStep.message) setToastMessage(nextStep.message);
        setPuzzleSequenceIndex(nextStepIdx);

        // Crucial: check for AI response in the NEWLY activated step if it's AI turn
        if (data.game_state === 0 && data.turn === 1 && nextStep.aiResponse) {
          processPuzzleAiResponse(nextStep);
        }
      }, 800);
      return;
    }

    if (data.turn === 0) {
      // The player is mid-multi-jump. Wait for the next jump!
      return;
    }

    if (data.game_state === 0 && data.turn === 1) {
      processPuzzleAiResponse(currentSeqNode);
    } else if (currentPuzzle) {
      // No AI response needed
      if (mode === "tutorial") {
        setTimeout(() => setToastMessage("Good job!"), 400);
      }
      setTimeout(() => {
        setPuzzleSolved(true);
        const completed = JSON.parse(localStorage.getItem("completedPuzzles") || "[]") as string[];
        if (currentPuzzle && !completed.includes(currentPuzzle.id)) {
          completed.push(currentPuzzle.id);
          localStorage.setItem("completedPuzzles", JSON.stringify(completed));
        }
      }, 700);
    }
  };

  const processPuzzleAiResponse = async (seqNode: any) => {
    const currentAiResponse = seqNode?.aiResponse;
    if (!currentPuzzle || !currentAiResponse || boardState?.game_state !== 0 || boardState?.turn !== 1 || thinking) {
      return;
    }

    setThinking(true);
    setTimeout(async () => {
      let aiMoveIndex = -1;
      const data = boardStateRef.current;
      for (let i = 0; i < data.possible_moves.length; i++) {
        const m = data.possible_moves[i] as any;
        if (
          m.from_index === currentAiResponse.from_index &&
          (
            (m.to_index === currentAiResponse.to_index && currentAiResponse.to_index !== undefined) ||
            (m.to_index1 === currentAiResponse.to_index1 && m.to_index2 === currentAiResponse.to_index2 && currentAiResponse.to_index1 !== undefined)
          )
        ) {
          aiMoveIndex = i;
          break;
        }
      }

      if (aiMoveIndex !== -1) {
        // ... same logic ...
        const aiMoveObj = data.possible_moves[aiMoveIndex];
        const activeGame = gameRef.current;
        const involved = activeGame.getInvolvedSquares(aiMoveObj);

        const aiSquaresToMeasure = involved.filter(({ index: sqIdx }) => {
          const chance = data.chances[sqIdx];
          return chance !== undefined && chance > 0.001 && chance < 0.999;
        }).map(i => i.index);

        if (aiSquaresToMeasure.length > 0) {
          setMeasuringSquares(aiSquaresToMeasure);
          await new Promise(resolve => setTimeout(resolve, 900));
          setMeasuringSquares([]);
        }

        gameRef.current.applyMove(aiMoveIndex);
        const dataNext = gameRef.current.toGameStateObject();
        setBoardState(dataNext);
        localStorage.setItem("boardState", JSON.stringify(dataNext));
      } else {
        console.error("Hardcoded AI move not found in possible_moves", currentAiResponse);
        // If the AI move isn't found, maybe it's because the player did something else?
        // In tutorial, we should probably just proceed anyway if it's the AI's turn but no response matches.
      }
      setThinking(false);

      if (currentPuzzle.expectedSequence && puzzleSequenceIndex < currentPuzzle.expectedSequence.length - 1) {
        const nextStep = currentPuzzle.expectedSequence[puzzleSequenceIndex + 1];
        if (nextStep.message) setToastMessage(nextStep.message);
        setPuzzleSequenceIndex(prev => prev + 1);
        return;
      }

      if (mode === "tutorial") setToastMessage("Good job!");
      setTimeout(() => {
        setPuzzleSolved(true);
        const completed = JSON.parse(localStorage.getItem("completedPuzzles") || "[]") as string[];
        if (!completed.includes(currentPuzzle.id)) {
          completed.push(currentPuzzle.id);
          localStorage.setItem("completedPuzzles", JSON.stringify(completed));
        }
      }, 600);
    }, 300);
  };

  useEffect(() => {
    if ((mode === "puzzle" || mode === "tutorial") && boardState && !thinking && !puzzleSolved) {
      const currentSeqNode = currentPuzzle?.expectedSequence ? currentPuzzle.expectedSequence[puzzleSequenceIndex] : currentPuzzle;

      // FIX: If it's NOT the player's turn, but no AI response is defined for this node, 
      // treat it as completed (especially in tutorials).
      const isPlayerTurn = boardState.turn === currentPuzzle?.turn;
      if (!isPlayerTurn && boardState.game_state === 0) {
        if (currentSeqNode?.aiResponse) {
          processPuzzleAiResponse(currentSeqNode);
        } else if (mode === "tutorial") {
          // No AI response defined, but move is made. Proceed!
          setTimeout(() => {
            setPuzzleSolved(true);
            const completed = JSON.parse(localStorage.getItem("completedPuzzles") || "[]") as string[];
            if (currentPuzzle && !completed.includes(currentPuzzle.id)) {
              completed.push(currentPuzzle.id);
              localStorage.setItem("completedPuzzles", JSON.stringify(completed));
            }
          }, 500);
        }
      }
    }
  }, [mode, boardState?.turn, thinking, puzzleSolved, puzzleSequenceIndex, currentPuzzle, boardState?.move_history?.length]);


  const handleUndo = async () => {
    if (boardState && boardState.move_history && boardState.move_history.length > 0) {
      setThinking(true);
      const stateToRestore = {
        ...boardState,
        move_history: [...boardState.move_history]
      };
      stateToRestore.move_history.pop();
      let game = restoreGame(stateToRestore);
      gameRef.current = game;
      const data = game.toGameStateObject();
      setBoardState(data);
      localStorage.setItem("boardState", JSON.stringify(data));
      setThinking(false);
    }
  };

  React.useEffect(() => {
    (window as any).runDebugSequence = async (seq: number[]) => {
      console.log("Starting Debug Sequence...");
      // Ensure we are in an 6x6 Quantum Level 1 game
      gameRef.current = new CheqqersGame(6, 2, 1);
      let data = gameRef.current.toGameStateObject();
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
        gameRef.current.applyMove(move);
        data = gameRef.current.toGameStateObject();
        setBoardState(data);
        // Add a small delay so human eyes can see it if looking at the screen
        await new Promise(r => setTimeout(r, 500));
      }
      console.log("Debug Sequence Complete. Board State:");
      console.log(data);
    };
  }, []);

  // TODO: Display queen
  const startNewGame = async () => {
    try {
      gameRef.current = new CheqqersGame(boardSize, startRows, parseInt(quantumnessLevel) as any);
      const data = gameRef.current.toGameStateObject();
      setBoardState(data);
      goTo("game");
      localStorage.setItem("boardState", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to load initial board state:", error);
    }
  };

  const handleStartGameClick = () => {
    localStorage.removeItem("boardState");
    gameRef.current = new CheqqersGame();
    startNewGame();
  };

  const handlePuzzlesClick = () => { goTo("puzzleSelect"); };

  const handleDesignClick = () => {
    localStorage.removeItem("boardState");
    gameRef.current = new CheqqersGame(boardSize, 0, parseInt(quantumnessLevel) as any);
    const data = gameRef.current.toGameStateObject();
    setBoardState(data);
    localStorage.setItem("boardState", JSON.stringify(data));
    goTo("design");
  };

  const handleTutorialsClick = () => {
    goTo("tutorialSelect");
  };

  const handleSelectPuzzle = async (puzzle: Puzzle) => {
    try {
      const isTutorial = !!tutorials.find(t => t.id === puzzle.id);
      gameRef.current = new CheqqersGame();
      gameRef.current.forceAllMoves = isTutorial;
      gameRef.current.setupPuzzle({
        board_size: puzzle.boardSize,
        game_type: puzzle.gameType,
        turn: puzzle.turn,
        pieces: puzzle.pieces,
      });
      const data = gameRef.current.toGameStateObject();
      setBoardState(data);
      setCurrentPuzzle(puzzle);
      setPuzzleSolved(false);
      setShowHint(false);
      setPuzzleSequenceIndex(0);
      localStorage.setItem("boardState", JSON.stringify(data));
      localStorage.setItem("currentPuzzle", JSON.stringify(puzzle));
      goTo(isTutorial ? "tutorial" : "puzzle", puzzle);
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
    setBoardState(null);
    setCurrentPuzzle(null);
    setPuzzleSolved(false);
    setShowHint(false);
    localStorage.removeItem("boardState");
    localStorage.removeItem("currentPuzzle");
    localStorage.removeItem("gameStarted");
    goTo("menu");
  };

  const handleExitPuzzle = () => {
    setBoardState(null);
    setCurrentPuzzle(null);
    setPuzzleSolved(false);
    setShowHint(false);
    localStorage.removeItem("boardState");
    localStorage.removeItem("currentPuzzle");
    localStorage.removeItem("gameStarted");
    goTo("puzzleSelect");
  };

  const handleQuantumnessChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLevel = event.target.value;
    setQuantumnessLevel(selectedLevel);
    localStorage.setItem("quantumnessLevel", selectedLevel);
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
    const validRows = Math.max(1, Math.min(newRows, maxStartRows));
    setStartRows(validRows);
    localStorage.setItem("startRows", `${validRows}`);
  };

  let startMenu = (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-10">
      <div className="glass-panel p-6 md:p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 fade-slide-up w-full max-w-2xl relative shadow-[0_0_80px_rgba(99,102,241,0.2)]">

        {/* Logo Centerpiece */}
        <div className="flex flex-col items-center w-full animate-float">
          <Logo className="text-[50px] md:text-[70px] lg:text-[100px] mb-2 drop-shadow-[0_0_40px_rgba(129,140,248,0.3)]" />
          <p className="text-sm lg:text-base text-indigo-200/70 mt-1 mb-2 font-light tracking-[0.3em] uppercase text-center w-full">A Quantum Strategy Board Game</p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {/* Main Play CTA - Always at the top */}
          <button onClick={() => setShowPlayOptions(true)} className="quantris-btn quantris-play py-5 lg:py-7 w-full group sm:col-span-2">
            <span className="quantris-title text-3xl md:text-4xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">PLAY GAME</span>
          </button>

          <button onClick={handlePuzzlesClick} className="quantris-btn quantris-puzzles py-4 lg:py-6 w-full group">
            <span className="quantris-title text-2xl md:text-3xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">PUZZLES</span>
          </button>

          <button onClick={handleTutorialsClick} className="quantris-btn quantris-tutorials py-4 lg:py-6 w-full group relative">
            <span className="quantris-title text-2xl md:text-3xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">TUTORIAL {!tutorialCompleted ? "✨" : ""}</span>
            {!tutorialCompleted && (
              <span className="absolute top-2 right-3 bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Start here</span>
            )}
          </button>

          <button onClick={handleDesignClick} className="quantris-btn quantris-design py-4 lg:py-6 w-full group">
            <span className="quantris-title text-2xl md:text-3xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">EDITOR</span>
          </button>

          <button onClick={() => setShowSettings(true)} className="quantris-btn py-4 lg:py-6 w-full group border-indigo-500/30">
            <span className="quantris-title text-2xl md:text-3xl font-black tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">SETTINGS</span>
          </button>
        </div>
      </div>
    </div>
  );

  let playOptionsModalUI = showPlayOptions ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel p-8 rounded-[2rem] w-full max-w-2xl relative shadow-[0_0_60px_rgba(99,102,241,0.5)] border border-indigo-500/40 flex flex-col gap-8 fade-slide-up no-scrollbar overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center border-b border-indigo-500/30 pb-4">
          <h2 className="text-3xl font-black tracking-widest text-indigo-300 uppercase italic drop-shadow-[0_0_10px_rgba(165,180,252,0.5)]">Lobby</h2>
          <button
            onClick={() => setShowPlayOptions(false)}
            className="text-indigo-400 hover:text-white transition-colors p-2 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
          <div className="flex flex-col gap-3">
            <label htmlFor="modal-quantum" className="text-sm text-indigo-300 font-bold tracking-widest uppercase">Quantum Level</label>
            <select
              id="modal-quantum"
              value={quantumnessLevel}
              onChange={handleQuantumnessChange}
              className="p-4 rounded-xl border border-indigo-500/20 bg-black/40 hover:bg-black/80 text-white outline-none focus:border-indigo-400 transition-colors cursor-pointer text-lg"
            >
              <option value="0">Classical</option>
              <option value="1">Level 1 (Superposition)</option>
              <option value="2">Level 2 (Entanglement)</option>
              <option value="3">Level 3 (Interference)</option>
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="modal-size" className="text-sm text-indigo-300 font-bold tracking-widest uppercase">Board Size</label>
            <select
              id="modal-size"
              value={boardSize}
              onChange={handleBoardSizeChange}
              className="p-4 rounded-xl border border-indigo-500/20 bg-black/40 hover:bg-black/80 text-white outline-none focus:border-indigo-400 transition-colors cursor-pointer text-lg"
            >
              <option value="4">4x4 Micro</option>
              <option value="6">6x6 Standard</option>
              <option value="8">8x8 Classic</option>
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="modal-rows" className="text-sm text-indigo-300 font-bold tracking-widest uppercase">Pieces per side</label>
            <input
              type="number"
              id="modal-rows"
              value={startRows}
              onChange={handleStartRowsChange}
              min={1}
              max={maxStartRows}
              className="p-4 rounded-xl border border-indigo-500/20 bg-black/40 hover:bg-black/80 text-white outline-none focus:border-indigo-400 transition-colors text-center text-lg md:text-left"
            />
          </div>


        </div>

        <button
          onClick={() => {
            setShowPlayOptions(false);
            handleStartGameClick();
          }}
          className="quantris-btn quantris-play py-5 w-full group overflow-hidden border-indigo-400/30"
        >
          <span className="quantris-title text-2xl font-black tracking-[0.3em]">START GAME</span>
        </button>
      </div>
    </div>
  ) : null;

  let settingsModalUI = showSettings ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md relative shadow-[0_0_60px_rgba(99,102,241,0.5)] border border-indigo-500/40 flex flex-col gap-8 fade-slide-up">
        <div className="flex justify-between items-center border-b border-indigo-500/30 pb-4">
          <h2 className="text-3xl font-black tracking-widest text-indigo-300 uppercase italic">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-indigo-400 hover:text-white transition-colors p-2 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-8 py-2">
          {/* Volume Control */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label htmlFor="volume-slider" className="text-sm text-indigo-300 font-bold tracking-widest uppercase">Master Volume</label>
              <span className="text-indigo-200 font-mono font-bold tracking-tighter">{volume}%</span>
            </div>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setVolume(val);
                localStorage.setItem("gameVolume", val.toString());
              }}
              className="w-full h-2 bg-indigo-900/30 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Music Toggle */}
          <div className="flex flex-col gap-4">
            <label className="text-sm text-indigo-300 font-bold tracking-widest uppercase">Background Music</label>
            <label className="flex items-center justify-between p-4 rounded-xl bg-black/20 hover:bg-black/60 border border-indigo-500/10 hover:border-indigo-500/30 cursor-pointer text-lg text-white transition-all">
              <span className="font-bold tracking-wide">{musicEnabled ? 'ENABLED' : 'DISABLED'}</span>
              <input
                type="checkbox"
                checked={musicEnabled}
                onChange={() => {
                  const next = !musicEnabled;
                  setMusicEnabled(next);
                  localStorage.setItem("musicEnabled", next.toString());
                }}
                className="w-7 h-7 accent-indigo-500 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="h-px bg-indigo-500/20 my-2"></div>

          {/* Reset Tutorial */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-rose-400 font-bold tracking-widest uppercase">Tutorial Progress</label>
              <p className="text-[10px] text-rose-300/50 uppercase tracking-tighter">Resets the tutorial 'Start here' status</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to reset your tutorial progress?")) {
                  // Clear the global completion flag
                  localStorage.removeItem("tutorialCompleted");

                  // Also clear individual tutorial steps from completedPuzzles
                  const completed = JSON.parse(localStorage.getItem("completedPuzzles") || "[]") as string[];
                  const filtered = completed.filter(id => !id.startsWith("ftue-"));
                  localStorage.setItem("completedPuzzles", JSON.stringify(filtered));

                  setTutorialCompleted(false);
                  setToastMessage("Tutorial progress reset!");
                }
              }}
              className="p-4 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 font-bold tracking-widest text-xs transition-all uppercase"
            >
              Reset Tutorial ✨
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(false)}
          className="quantris-btn py-5 w-full group overflow-hidden border-indigo-400/30"
        >
          <span className="quantris-title text-xl font-black tracking-[0.3em]">SAVE & CLOSE</span>
        </button>
      </div>
    </div>
  ) : null;

  let designModeUI = null;
  if (mode === "design" && boardState) {
    designModeUI = (
      <div className="w-full max-w-6xl mx-auto pl-4 pr-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-center mt-4">
          {/* Left Panel: Design Palette */}
          <div className="flex flex-col gap-3 w-64 pt-4">
            <button
              onClick={handleExitToMainMenu}
              className="w-full mb-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all border border-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] text-center flex items-center justify-center gap-2"
            >
              <span>←</span> BACK TO MENU
            </button>
            <div className="glass-panel p-4 rounded-xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <div className="text-xs text-indigo-300 uppercase tracking-widest mb-3 font-bold drop-shadow-[0_0_5px_rgba(165,180,252,0.4)]">Palette</div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm">Board Size:</span>
                <select
                  value={boardState.board_size}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value);
                    setBoardSize(newSize);
                    gameRef.current = new CheqqersGame(newSize, 0, parseInt(quantumnessLevel) as any);
                    const data = gameRef.current.toGameStateObject();
                    setBoardState(data);
                    localStorage.setItem("boardState", JSON.stringify(data));
                  }}
                  className="bg-zinc-800 text-white border border-zinc-600 rounded px-2 py-1 text-sm"
                >
                  <option value={4}>4x4</option>
                  <option value={6}>6x6</option>
                  <option value={8}>8x8</option>
                </select>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-sm">First Turn:</span>
                <button
                  onClick={() => {
                    gameRef.current.turn = gameRef.current.turn === 0 ? 1 : 0;
                    gameRef.current.getPossibleMoves();
                    const data = gameRef.current.toGameStateObject();
                    setBoardState(data);
                    localStorage.setItem("boardState", JSON.stringify(data));
                  }}
                  className={`px-3 py-1 rounded text-sm font-bold border transition-colors ${boardState.turn === 0 ? 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30' : 'bg-rose-900/50 text-rose-300 border-rose-500/30'}`}
                >
                  {boardState.turn === 0 ? 'White' : 'Black'}
                </button>
              </div>

              <div className="text-xs text-zinc-500 mb-2">Drag pieces to the board</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify({ color: 0, crowned: false }))}
                  className="flex flex-col items-center justify-center p-3 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 cursor-grab active:cursor-grabbing"
                >
                  <div className="w-8 h-8 rounded-full bg-[#e8e0f0] border-2 border-[#c4b8d8]" />
                  <span className="text-xs mt-2 text-zinc-400">White</span>
                </div>
                <div
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify({ color: 1, crowned: false }))}
                  className="flex flex-col items-center justify-center p-3 border border-indigo-500/20 rounded-xl bg-black/40 hover:bg-indigo-500/20 cursor-grab active:cursor-grabbing transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2d2d3d] border-2 border-[#4a4a6a]" />
                  <span className="text-xs mt-2 text-indigo-300/70 font-bold uppercase tracking-tighter">Black</span>
                </div>
                <div
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify({ color: 0, crowned: true }))}
                  className="flex flex-col items-center justify-center p-3 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 cursor-grab active:cursor-grabbing relative"
                >
                  <div className="w-8 h-8 rounded-full bg-[#e8e0f0] border-2 border-[#c4b8d8] flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                  </div>
                  <span className="text-xs mt-2 text-zinc-400">W-Queen</span>
                </div>
                <div
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify({ color: 1, crowned: true }))}
                  className="flex flex-col items-center justify-center p-3 border border-zinc-700 rounded bg-zinc-800 hover:bg-zinc-700 cursor-grab active:cursor-grabbing relative"
                >
                  <div className="w-8 h-8 rounded-full bg-[#2d2d3d] border-2 border-[#4a4a6a] flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                  </div>
                  <span className="text-xs mt-2 text-zinc-400">B-Queen</span>
                </div>
              </div>

              <div
                draggable
                onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify({ remove: true }))}
                className="flex items-center justify-center gap-2 p-3 border border-red-900/50 rounded bg-red-950/30 hover:bg-red-900/50 cursor-grab active:cursor-grabbing text-red-400"
              >
                <span>🗑️</span>
                <span className="text-sm">Eraser</span>
              </div>
            </div>
          </div>

          {/* Center: Board */}
          <div className="flex flex-col items-center flex-1 max-w-[540px] mx-auto opacity-100">
            <div className="mb-3 text-center">
              <span className="text-pink-400 font-bold uppercase tracking-[0.2em] text-sm">
                🎨 Design Mode
              </span>
              <div className="text-xs text-zinc-500 mt-1">Play moves or drag items</div>
            </div>

            <GameBoard
              boardState={boardState}
              onMove={onMove}
              measuringSquares={measuringSquares}
              onMeasure={async (sqIdx) => {
                setMeasuringSquares([sqIdx]);
                await new Promise((resolve) => setTimeout(resolve, 900));
                setMeasuringSquares([]);
                const game = getActiveGame(boardState);
                const outcome = game.measureSquare(sqIdx);
                game.moveHistory.push(`M${sqIdx}=${outcome}`);
                const newState = game.toGameStateObject();
                setBoardState(newState);
                localStorage.setItem("boardState", JSON.stringify(newState));
              }}
              isDesignMode={true}
              onSquareDrop={(squareIndex, pieceData) => {
                const game = getActiveGame(boardState);
                if (pieceData.remove) {
                  game.pieceProperties[squareIndex] = null;
                } else {
                  game.pieceProperties[squareIndex] = {
                    color: pieceData.color,
                    crowned: pieceData.crowned || false,
                    pieceIds: [Date.now() + Math.floor(Math.random() * 1000)], // Generate a unique ID for new pieces in design mode
                  };
                }

                const chances: Record<number, number> = {};
                for (let i = 0; i < game.boardSize * game.boardSize; i++) {
                  if (game.pieceProperties[i]) chances[i] = 1;
                }
                const newPieces = [];
                for (const idx in game.pieceProperties) {
                  if (game.pieceProperties[idx]) {
                    newPieces.push({
                      index: parseInt(idx),
                      color: game.pieceProperties[idx].color,
                      crowned: game.pieceProperties[idx].crowned,
                    });
                  }
                }

                const newGame = new CheqqersGame();
                newGame.setupPuzzle({
                  board_size: game.boardSize,
                  game_type: game.gameType,
                  turn: game.turn,
                  pieces: newPieces,
                });
                gameRef.current = newGame;

                const data = newGame.toGameStateObject();
                setBoardState(data);
                localStorage.setItem("boardState", JSON.stringify(data));
              }}
            />
          </div>

          {/* Right Panel: Actions */}
          <div className="flex flex-col gap-3 w-64 pt-4">
            <div
              className="glass-panel p-4 rounded-xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] flex flex-col gap-3"
            >
              <div className="text-xs text-indigo-300 uppercase tracking-widest mb-1 font-bold drop-shadow-[0_0_5px_rgba(165,180,252,0.4)]">Actions</div>

              <button
                onClick={() => {
                  const game = getActiveGame(boardState);
                  const pieces = [];
                  for (const idx in game.pieceProperties) {
                    if (game.pieceProperties[idx]) {
                      pieces.push({
                        index: parseInt(idx),
                        color: game.pieceProperties[idx].color,
                        crowned: game.pieceProperties[idx].crowned,
                      });
                    }
                  }
                  const exportData = {
                    board_size: game.boardSize,
                    game_type: game.gameType,
                    turn: game.turn,
                    pieces: pieces,
                  };
                  navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
                  setToastMessage("Copied to clipboard!");
                }}
                className="w-full px-4 py-2 bg-indigo-600/50 hover:bg-indigo-600 text-white rounded text-sm transition-colors border border-indigo-500/30 text-left flex justify-between items-center"
              >
                <span>📋 Copy State JSON</span>
              </button>

              <button
                onClick={async () => {
                  const txt = prompt("Paste State JSON here:");
                  if (txt) {
                    try {
                      const data = JSON.parse(txt);
                      const newGame = new CheqqersGame();
                      newGame.setupPuzzle(data);
                      gameRef.current = newGame;
                      const newState = newGame.toGameStateObject();
                      setBoardSize(data.board_size || 8);
                      setBoardState(newState);
                      localStorage.setItem("boardState", JSON.stringify(newState));
                      setToastMessage("Loaded successfully!");
                    } catch (e) {
                      setToastMessage("Invalid JSON!");
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-[#1a1e2e] hover:bg-[#242940] text-zinc-300 rounded text-sm transition-colors border border-indigo-900/30 text-left flex justify-between items-center"
              >
                <span>📥 Load State JSON</span>
              </button>

              <div className="h-px bg-zinc-800 my-2"></div>

              <button
                onClick={() => {
                  goTo("game");
                  setToastMessage("Game started!");
                }}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all hover:scale-[1.02] border-0 text-center"
              >
                ▶️ PLAY!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  let puzzleSolvedOverlay = puzzleSolved ? (
    <div className="fixed inset-0 pointer-events-none flex justify-center items-end pb-10 z-[2000]">
      <div className="pointer-events-auto bg-gradient-to-br from-indigo-950 to-blue-900 border border-green-500 p-6 rounded-xl text-center shadow-2xl max-w-md w-full mx-4 animate-in slide-in-from-bottom-5 duration-300">
        <h2 className="text-green-400 text-3xl font-bold mb-2">🎉 {mode === "tutorial" ? 'Tutorial' : 'Puzzle'} Solved!</h2>
        <p className="text-gray-300 mb-2">Great job finding the correct sequence!</p>
        {currentPuzzle && <p className="text-purple-400 font-bold mb-6 text-lg">{currentPuzzle.title}</p>}
        {mode === "tutorial" ? (
          <div className="flex flex-col gap-3 justify-center w-full mt-4">
            {currentPuzzle && (() => {
              const tutIdx = tutorials.findIndex(t => t.id === currentPuzzle.id);
              if (tutIdx !== -1 && tutIdx < tutorials.length - 1) {
                return (
                  <button onClick={() => handleSelectPuzzle(tutorials[tutIdx + 1])} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors border-0 shadow-lg w-full">
                    Next Step ➡️
                  </button>
                );
              } else {
                return (
                  <button onClick={() => {
                    localStorage.setItem("tutorialCompleted", "true");
                    setTutorialCompleted(true);
                    handleExitToMainMenu();
                  }} className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-lg transition-colors border-0 shadow-lg w-full">
                    Finish Tutorial 🏆
                  </button>
                );
              }
            })()}
            <button onClick={handleRetryPuzzle} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors border-0 shadow-lg w-full">
              Try Again 🔁
            </button>
            <button onClick={handleExitToMainMenu} className="px-4 py-2 mt-2 bg-transparent hover:bg-white/10 text-white/70 rounded font-medium transition-colors border-0 text-sm">
              Return to Menu
            </button>
          </div>
        ) : (
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={handleRetryPuzzle} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors border-0">
              Retry
            </button>
            <button onClick={() => { goTo("puzzleSelect"); setPuzzleSolved(false); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors border-0">
              More Puzzles
            </button>
            <button onClick={handleExitToMainMenu} className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded font-medium transition-colors border-0">
              Main Menu
            </button>
          </div>
        )}
      </div>
    </div>
  ) : null;

  const menuBackgroundUI = (isMenuMode) && backgroundBoardState ? (
    <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none transition-opacity duration-1000 animate-in fade-in">
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${mode === "splash"
        ? "opacity-80 scale-[3.0] md:scale-[3.5] blur-none brightness-150 saturate-[1.8]"
        : "opacity-65 scale-[2.8] md:scale-[3.2] blur-[1px] brightness-125 saturate-[1.5]"
        } drop-shadow-[0_0_100px_rgba(99,102,241,0.5)]`}>
        <GameBoard boardState={backgroundBoardState} onMove={() => { }} />
      </div>
      <div className={`absolute inset-0 pointer-events-none bg-gradient-radial from-transparent to-[#050608]/80 ${mode === "splash" ? "mix-blend-overlay" : ""}`}></div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-[#0f111c] text-white flex flex-col items-center pt-12 pb-4 px-4 overflow-hidden w-full relative" onClick={() => setToastMessage(null)}>
      {menuBackgroundUI}
      {settingsModalUI}
      {playOptionsModalUI}
      <header className="fixed top-0 left-0 w-full bg-transparent p-4 px-6 flex justify-between items-center z-50">
        {mode === "tutorial" && (
          <button
            onClick={handleExitToMainMenu}
            className="group flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-rose-900/40 border border-white/10 hover:border-rose-500/50 text-white/70 hover:text-rose-200 rounded-full transition-all duration-300 backdrop-blur-md"
          >
            <span className="text-lg group-hover:-translate-x-1 transition-transform">⬅</span>
            <span className="text-xs font-black uppercase tracking-widest">Quit Tutorial</span>
          </button>
        )}
      </header>

      {toastMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-rose-600/90 text-white px-6 py-3 rounded-lg shadow-lg z-50 font-bold border border-rose-500 animate-in fade-in slide-in-from-top-5">
          {toastMessage}
        </div>
      )}
      {mode === "menu" && startMenu}
      {mode === "design" && designModeUI}
      {mode === "puzzleSelect" && (
        <PuzzleSelect
          onSelectPuzzle={handleSelectPuzzle}
          onBack={handleExitToMainMenu}
        />
      )}
      {mode === "tutorialSelect" && (
        <TutorialSelect
          onSelectTutorial={(t) => handleSelectPuzzle(t)} // Uses the exact same state loader
          onBack={handleExitToMainMenu}
        />
      )}
      {(mode === "game" || mode === "puzzle") && (
        boardState ? (
          <div className="w-full max-w-6xl mx-auto" style={thinking ? { pointerEvents: "none" } : {}}>
            {/* 3-column layout */}
            <div className="flex flex-col lg:flex-row gap-4 items-start justify-center">
              {/* Left sidebar: Quantum Inspector */}
              <div className="hidden lg:flex flex-col gap-3 w-56 pt-0">
                {showQuantumState && boardState?.quantum_states && (
                  <div className="glass-panel border border-purple-500/30 text-indigo-100 text-sm w-full rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.15)] h-[620px] flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-purple-500/20 bg-purple-950/20">
                      <div className="text-purple-300 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-between gap-2 mb-3">
                        <span className="drop-shadow-[0_0_5px_rgba(216,180,254,0.4)]">⚛️ Quantum Systems</span>
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{boardState.quantum_states.length} active</span>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative w-7 h-4 transition duration-200 ease-linear rounded-full bg-zinc-800 border border-purple-500/30">
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={hideMeasured}
                            onChange={() => setHideMeasured(!hideMeasured)}
                          />
                          <div className={`absolute left-0.5 top-0.5 w-3 h-3 transition-transform duration-200 ease-in-out bg-purple-400 rounded-full ${hideMeasured ? 'translate-x-3 bg-purple-400' : 'translate-x-0 bg-zinc-600'}`}></div>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-500 group-hover:text-purple-400 transition-colors uppercase tracking-widest">Hide 100% Pieces</span>
                      </label>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                      {(() => {
                        const filteredStates = hideMeasured
                          ? boardState.quantum_states.filter((qs: any) =>
                            !qs.amplitudes.some((amp: any) => (amp.re * amp.re + amp.im * amp.im) > 0.999)
                          )
                          : boardState.quantum_states;

                        if (filteredStates.length === 0) {
                          return (
                            <div className="text-zinc-600 italic text-center py-8 text-xs">
                              {hideMeasured && boardState.quantum_states.length > 0
                                ? "All pieces are currently observed."
                                : "No active quantum systems."}
                            </div>
                          );
                        }

                        return filteredStates.map((qs: any, idx: number) => (
                          <div key={idx} className="bg-[#12141f] p-3 rounded border border-zinc-800/50">
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${qs.type === 'entangled' ? 'bg-indigo-900/60 text-indigo-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                                {qs.type.toUpperCase()}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">Sq: [{qs.squares.join(', ')}]</span>
                            </div>
                            <div className="pl-2 border-l-2 border-zinc-800 flex flex-col gap-1">
                              {qs.amplitudes.map((amp: any, aIdx: number) => (
                                <div key={aIdx} className="font-mono text-[10px] flex justify-between">
                                  <span className="text-zinc-400">|{amp.state}⟩</span>
                                  <span className="text-zinc-500">
                                    {((amp.re * amp.re + amp.im * amp.im) * 100).toFixed(0)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Center: Board + Controls */}
              <div className="flex flex-col items-center flex-1 max-w-[540px] mx-auto">
                {/* Compact Game Info Banner */}
                <div className="mb-4 w-full bg-indigo-950/20 border border-indigo-500/20 rounded-full px-4 py-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/60 shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Board: {boardState.board_size}×{boardState.board_size}
                  </div>
                  <div className="h-3 w-px bg-indigo-500/20"></div>
                  <div>Quantum Level {boardState.game_type}</div>
                  <div className="h-3 w-px bg-indigo-500/20"></div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_5px_white]"></div>
                      <span className={boardState.turn === 0 ? 'text-white' : ''}>W</span>
                    </div>
                    <span className="opacity-30">vs</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-900 border border-indigo-500/50"></div>
                      <span className={boardState.turn === 1 ? 'text-indigo-400' : ''}>B</span>
                    </div>
                  </div>
                </div>

                {/* Turn indicator */}
                <div className="mb-4 text-center">
                  <span className={`turn-indicator text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 ${boardState.turn === 0 ? 'text-indigo-300' : 'text-rose-300'
                    }`}>
                    <div className={`w-3 h-3 rounded-full ${boardState.turn === 0 ? 'bg-indigo-400 shadow-[0_0_10px_#818cf8]' : 'bg-rose-400 shadow-[0_0_10px_#fb7185]'} animate-pulse`}></div>
                    {boardState.game_state === 0 ? (
                      boardState.turn === 0 ? 'White to move' : 'Black to move'
                    ) : (
                      <span className="bg-emerald-500 text-black px-3 py-0.5 rounded-full font-black animate-bounce shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                        {boardState.game_state === 1 ? 'White Victorian!' : boardState.game_state === 2 ? 'Black Victorian!' : 'Draw Match'}
                      </span>
                    )}
                  </span>
                  {thinking && <div className="mt-1 text-[10px] text-indigo-500/60 animate-pulse font-mono tracking-widest">Process AI Calculation...</div>}
                </div>

                <GameBoard boardState={boardState} onMove={onMove} measuringSquares={measuringSquares} onMeasure={async (sqIdx) => {
                  setMeasuringSquares([sqIdx]);
                  await new Promise(resolve => setTimeout(resolve, 900));
                  setMeasuringSquares([]);
                  const game = getActiveGame(boardState);
                  const outcome = game.measureSquare(sqIdx);
                  game.moveHistory.push(`M${sqIdx}=${outcome}`);
                  const newState = game.toGameStateObject();
                  setBoardState(newState);
                  localStorage.setItem('boardState', JSON.stringify(newState));
                }} />

                {/* Controls bar */}
                <div className="flex flex-col gap-3 mt-6 w-full">
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={handleUndo}
                      disabled={!boardState?.move_history?.length}
                      className="px-4 py-3 bg-[#131625] border border-indigo-500/20 hover:bg-[#1a1e2e] disabled:opacity-20 disabled:cursor-not-allowed text-indigo-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex-1 shadow-lg hover:border-indigo-500/40"
                    >
                      ↩ Undo Ply
                    </button>
                    <button
                      onClick={() => setShowQuantumState(!showQuantumState)}
                      className={`px-6 py-3 border rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${showQuantumState
                        ? 'bg-purple-900/40 border-purple-500 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'bg-[#131625] border-purple-900/40 text-purple-400/70 hover:bg-[#1a1e2e] hover:border-purple-500/40'
                        }`}
                    >
                      <span className="text-base">⚛️</span>
                      <span>Quantum Inspector</span>
                    </button>
                    {mode === "puzzle" && (
                      <button
                        onClick={handleRetryPuzzle}
                        className="px-4 py-3 bg-blue-900/40 border border-blue-500/50 hover:bg-blue-900/60 text-blue-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                      >
                        Retry 🔄
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure? The current game state will be lost.")) {
                        handleExitToMainMenu();
                      }
                    }}
                    className="w-full px-4 py-3 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-950/40 hover:border-rose-500/50 text-rose-500/60 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300"
                  >
                    ← Back to Menu
                  </button>
                </div>

                {/* Quantum inspector (mobile only or center fallback) */}
                <div className="lg:hidden w-full">
                  {showQuantumState && boardState?.quantum_states && (
                    <div className="mt-3 glass-panel border border-purple-500/30 text-indigo-100 text-sm w-full rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden max-h-[400px]">
                      <div className="p-4 border-b border-purple-500/20 bg-purple-950/20">
                        <div className="text-purple-300 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-between gap-2 mb-3">
                          <span className="drop-shadow-[0_0_5px_rgba(216,180,254,0.4)]">⚛️ Quantum Systems</span>
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{boardState.quantum_states.length} active</span>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative w-7 h-4 transition duration-200 ease-linear rounded-full bg-zinc-800 border border-purple-500/30">
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={hideMeasured}
                              onChange={() => setHideMeasured(!hideMeasured)}
                            />
                            <div className={`absolute left-0.5 top-0.5 w-3 h-3 transition-transform duration-200 ease-in-out bg-purple-400 rounded-full ${hideMeasured ? 'translate-x-3 bg-purple-400' : 'translate-x-0 bg-zinc-600'}`}></div>
                          </div>
                          <span className="text-[9px] font-bold text-zinc-500 group-hover:text-purple-400 transition-colors uppercase tracking-widest">Hide 100% Pieces</span>
                        </label>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 no-scrollbar">
                        {(() => {
                          const filteredStates = hideMeasured
                            ? boardState.quantum_states.filter((qs: any) =>
                              !qs.amplitudes.some((amp: any) => (amp.re * amp.re + amp.im * amp.im) > 0.999)
                            )
                            : boardState.quantum_states;

                          if (filteredStates.length === 0) {
                            return (
                              <div className="text-zinc-600 italic text-center py-6 text-xs">
                                {hideMeasured && boardState.quantum_states.length > 0
                                  ? "All pieces are currently observed."
                                  : "No active quantum systems."}
                              </div>
                            );
                          }

                          return filteredStates.map((qs: any, idx: number) => (
                            <div key={idx} className="bg-[#12141f] p-3 rounded border border-zinc-800/50">
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${qs.type === 'entangled' ? 'bg-indigo-900/60 text-indigo-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                                  {qs.type.toUpperCase()}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500">Sq: [{qs.squares.join(', ')}]</span>
                              </div>
                              <div className="pl-2 border-l-2 border-zinc-800 flex flex-col gap-1">
                                {qs.amplitudes.map((amp: any, aIdx: number) => (
                                  <div key={aIdx} className="font-mono text-[10px] flex justify-between">
                                    <span className="text-zinc-300">|{amp.state}⟩</span>
                                    <span className="text-zinc-500">
                                      {((amp.re * amp.re + amp.im * amp.im) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Move History Panel */}
              <div className="hidden lg:block w-56 rounded-lg border overflow-hidden h-[560px]" style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}>
                <MoveHistory
                  moveHistory={boardState.move_history || []}
                  possibleMoves={boardState.possible_moves || []}
                  boardSize={boardState.board_size}
                />
              </div>
            </div>

            {/* Mobile: Move History below board */}
            <div className="lg:hidden mt-4 w-full max-w-[500px] mx-auto rounded-lg border overflow-hidden h-48" style={{ background: 'var(--panel-bg)', borderColor: 'var(--panel-border)' }}>
              <MoveHistory
                moveHistory={boardState.move_history || []}
                possibleMoves={boardState.possible_moves || []}
                boardSize={boardState.board_size}
              />
            </div>
          </div>
        ) : (
          <p className="text-zinc-500">Loading board...</p>
        )
      )}

      {
        mode === "splash" && (
          backgroundBoardState ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer overflow-hidden splash-overlay bg-black/40" onClick={() => {
              // Screen tap handled by global resetIdleTimer
            }}>
              {/* Neon Accents */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-neon"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] bg-purple-500/10 rounded-full blur-[100px] animate-pulse-neon" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-[40%] right-[20%] w-[20vw] h-[20vw] bg-cyan-500/10 rounded-full blur-[80px] animate-pulse-neon" style={{ animationDelay: '2s' }}></div>
              </div>

              {/* Front UI */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center mt-[-5vh]">
                <Logo className="text-[12vw] md:text-[8vw] lg:text-[140px] mb-8 animate-float filter drop-shadow-[0_0_60px_rgba(129,140,248,0.5)]" />

                <div className="relative mt-4">
                  {/* Inner core text with high-contrast glow */}
                  <div className="relative animate-pulse-glow text-2xl md:text-4xl lg:text-5xl font-bold tracking-[0.4em] uppercase text-white drop-shadow-[0_0_15px_rgba(99,102,241,1)]">
                    press any key to start
                  </div>
                </div>
              </div>
            </div>
          ) : null
        )
      }
      {
        mode === "tutorial" && (
          boardState ? (
            <div className="w-full flex flex-col items-center">
              {currentPuzzle && (() => {
                const tutIdx = tutorials.findIndex(t => t.id === currentPuzzle.id);
                return (
                  <div className="w-full max-w-2xl px-4 flex flex-col items-center">
                    {/* Progress Bar Header */}
                    <div className="flex items-center gap-4 w-full mb-3 mt-1 px-1">
                      <button
                        onClick={() => { if (tutIdx > 0) handleSelectPuzzle(tutorials[tutIdx - 1]) }}
                        disabled={tutIdx === 0}
                        className="w-10 h-10 flex items-center justify-center bg-zinc-900/50 border border-white/10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/30 disabled:opacity-0 transition-all duration-300 shadow-lg shrink-0 group"
                        title="Back"
                      >
                        <span className="text-xl group-hover:-translate-x-0.5 transition-transform">←</span>
                      </button>

                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex justify-center">
                          <span className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] bg-zinc-900/80 px-3 py-0.5 rounded-full border border-white/5 shadow-inner">
                            Step {tutIdx + 1} <span className="text-zinc-700 mx-1">/</span> {tutorials.length}
                          </span>
                        </div>
                        <div className="flex gap-1.5 w-full">
                          {tutorials.map((t, i) => (
                            <div key={t.id} className={`flex-1 h-2 rounded-full transition-all duration-700 ${i < tutIdx ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]' : i === tutIdx ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'bg-zinc-800/80 overflow-hidden'}`}>
                              {i === tutIdx && (
                                <div className="w-full h-full bg-white/20 animate-pulse" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const nextTut = tutorials[tutIdx + 1];
                          if (tutIdx < tutorials.length - 1 && nextTut && !nextTut.disabled) handleSelectPuzzle(nextTut);
                        }}
                        className={`w-10 h-10 flex items-center justify-center bg-zinc-900/50 border border-white/10 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 hover:border-amber-500/30 transition-all duration-300 shadow-lg shrink-0 group ${(!currentPuzzle.isIntro && !puzzleSolved && tutIdx < tutorials.length - 1 && tutorials[tutIdx + 1] && !tutorials[tutIdx + 1].disabled) ? '' : 'opacity-0 pointer-events-none'}`}
                        title="Skip Step"
                      >
                        <span className="text-xl group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    </div>

                    {/* Tutorial Text Box */}
                    <div className="bg-zinc-900/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 mb-2 w-full text-left shadow-2xl relative animate-in slide-in-from-top-4 duration-500">
                      <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-white/5">
                        <h2 className="text-lg font-black text-amber-500 m-0 flex items-center gap-2">
                          <span className="bg-amber-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-black italic">{tutIdx + 1}</span>
                          {currentPuzzle.title}
                        </h2>
                      </div>
                      <p className="text-gray-200 mb-3 leading-relaxed text-sm font-medium whitespace-pre-line">
                        {currentPuzzle.description}

                        {!currentPuzzle.isIntro && !puzzleSolved && (
                          <span className="block mt-4 p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r text-amber-100 font-bold text-sm">
                            <span className="text-amber-500 mr-2 uppercase tracking-tighter text-[10px]">Todo:</span>
                            {(() => {
                              const currentSeqNode = currentPuzzle.expectedSequence ? currentPuzzle.expectedSequence[puzzleSequenceIndex] : null;
                              return currentSeqNode?.message || currentPuzzle.message;
                            })()}
                          </span>
                        )}
                      </p>

                      {/* Primary Action Button */}
                      {(currentPuzzle.isIntro || puzzleSolved) && (
                        <div className="flex flex-col gap-2 mb-2">
                          {/* Retry button - only for challenges, not intro steps */}
                          {!currentPuzzle.isIntro && puzzleSolved && (
                            <button
                              onClick={handleRetryPuzzle}
                              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_40px_rgba(59,130,246,0.3)] text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-0 flex items-center justify-center gap-2 text-sm"
                            >
                              RETRY STEP 🔁
                            </button>
                          )}

                          <button
                            onClick={() => {
                              // Ensure current step is marked as completed
                              const completed = JSON.parse(localStorage.getItem("completedPuzzles") || "[]") as string[];
                              if (currentPuzzle && !completed.includes(currentPuzzle.id)) {
                                completed.push(currentPuzzle.id);
                                localStorage.setItem("completedPuzzles", JSON.stringify(completed));
                              }

                              const nextTut = tutorials[tutIdx + 1];
                              if (tutIdx < tutorials.length - 1 && nextTut && !nextTut.disabled) {
                                handleSelectPuzzle(nextTut);
                              } else {
                                localStorage.setItem("tutorialCompleted", "true");
                                setTutorialCompleted(true);
                                handleExitToMainMenu();
                              }
                            }}
                            className={`w-full py-3 ${puzzleSolved ? 'bg-gradient-to-r from-emerald-400 to-teal-600 shadow-[0_0_40px_rgba(52,211,153,0.3)]' : 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_40px_rgba(251,191,36,0.3)]'} text-black font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border-0 flex items-center justify-center gap-2 text-sm`}
                          >
                            {(tutIdx < tutorials.length - 1 && tutorials[tutIdx + 1] && !tutorials[tutIdx + 1].disabled) ? (puzzleSolved ? "CONTINUE ➔" : "LET'S GO! 🚀") : "FINISH TUTORIAL 🏆"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div style={thinking ? { pointerEvents: "none" } : {}} className="flex flex-col items-center w-full max-w-[340px] md:max-w-[400px] mx-auto mt-2 mb-4">
                <div className="w-full">
                  <GameBoard boardState={boardState} onMove={onPuzzleMove} measuringSquares={measuringSquares} />
                </div>
              </div>
            </div >
          ) : (
            <p className="text-zinc-500">Loading tutorial...</p>
          )
        )
      }
      {
        mode === "puzzle" && (
          boardState ? (
            <div>
              {currentPuzzle && (
                <div className="text-center mb-6 px-4 max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-200 mb-2">{currentPuzzle.title}</h2>
                  <p className="text-gray-400 mb-4">{currentPuzzle.description}</p>

                  {currentPuzzle.expectedSequence && currentPuzzle.expectedSequence[puzzleSequenceIndex] && (
                    <div className="mb-4 p-3 bg-indigo-900/40 border border-indigo-500/50 rounded-lg text-indigo-200 font-medium text-sm text-left max-w-lg mx-auto shadow-inner animate-in fade-in zoom-in-95 duration-300">
                      <span className="text-indigo-400 font-black uppercase tracking-widest text-[10px] block mb-1 drop-shadow-[0_0_5px_rgba(165,180,252,0.4)]">🚀 Current Objective</span>
                      {currentPuzzle.expectedSequence[puzzleSequenceIndex].message}
                    </div>
                  )}

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
                      {currentPuzzle.message}
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
                  <button
                    onClick={handleExitPuzzle}
                    className="px-5 py-2 bg-rose-900/40 border border-rose-500/50 hover:bg-rose-900/60 text-rose-300 rounded font-medium transition-colors whitespace-nowrap uppercase tracking-widest"
                    title="Exit Puzzle"
                  >
                    EXIT
                  </button>
                </div>

                {showDebugHistory && (
                  <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 text-green-400 font-mono text-xs w-full max-w-[400px] break-all rounded shadow-inner">
                    <div className="mb-2 text-zinc-500 uppercase tracking-widest text-[10px]">Bug Report String:</div>
                    {(boardState?.move_history || []).length > 0
                      ? JSON.stringify(boardState.move_history.map((e: any) => typeof e === 'number' ? e : { m: e.moveIndex, r: e.randomValues?.length || 0 }))
                      : "[]"}
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
              <div className="h-6 mt-4 text-center text-gray-400">{thinking ? (<p>AI is thinking...</p>) : null}</div>
            </div>
          ) : (
            <p>Loading puzzle...</p>
          )
        )}
      {/* Persistent Components */}
      <QuantumPlayedBranding />
    </div>
  );
};

export default App;
