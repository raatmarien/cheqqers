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
import { CheqqersGame } from "../game/CheqqersGame";

// Helper function to restore a game from its saved React state
function restoreGame(boardState: any): CheqqersGame {
  if (!boardState || !boardState.init_params) return new CheqqersGame();

  const p = boardState.init_params;
  let game: CheqqersGame;

  if (p.type === 'puzzle') {
    game = new CheqqersGame();
    game.setupPuzzle(p.data);
  } else {
    game = new CheqqersGame(p.size, p.startRows, p.gameType);
  }

  // Replay moves
  if (boardState.move_history) {
    for (const moveIndex of boardState.move_history) {
      game.applyMove(moveIndex);
    }
  }

  return game;
}

export const fetchInitialBoard = async (gameType: number, boardSize: number = 8, startRows: number = 3) => {
  const game = new CheqqersGame(boardSize, startRows, gameType as any);
  return game.toGameStateObject();
};

export const doMove = async (boardState: any, moveIndex: number) => {
  const game = restoreGame(boardState);
  game.applyMove(moveIndex);

  // In original architecture, Do AI move was processed inline.
  // The App.tsx actually calls `doAiMove` explicitly on the returned state anyway.
  return game.toGameStateObject();
};

export const setupPuzzle = async (puzzleData: {
  board_size: number;
  game_type: number;
  turn: number;
  pieces: { index: number; color: number; crowned?: boolean }[];
}) => {
  const game = new CheqqersGame();
  game.setupPuzzle(puzzleData);
  return game.toGameStateObject();
};

export const doAiMove = async (boardState: any) => {
  const game = restoreGame(boardState);

  // Very simplistic AI simulation since MCTS isn't ported.
  // We'll just pick a random move for Black.
  const moves = game.getPossibleMoves();
  if (moves.length > 0) {
    const randomIndex = Math.floor(Math.random() * moves.length);
    game.applyMove(randomIndex);
  }

  return game.toGameStateObject();
};

export const undoMove = async (boardState: any, againstAi: boolean = false) => {
  if (!boardState || !boardState.move_history || boardState.move_history.length === 0) {
    return boardState;
  }

  const stateToRestore = {
    ...boardState,
    move_history: [...boardState.move_history]
  };

  // Pop at least 1 move
  stateToRestore.move_history.pop();
  let game = restoreGame(stateToRestore);

  // If playing against AI, keep undoing any AI moves until it is the Human's turn (White)
  if (againstAi) {
    while (game.turn === 1 /* BLACK */ && stateToRestore.move_history.length > 0) {
      stateToRestore.move_history.pop();
      game = restoreGame(stateToRestore);
    }
  }

  return game.toGameStateObject();
};

