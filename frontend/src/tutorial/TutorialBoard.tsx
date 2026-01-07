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
 */
import React, { useState } from "react";
import type { TutorialScenario, TutorialMove, TutorialPiece } from "./tutorialData";
import "./TutorialBoard.css";

interface TutorialBoardProps {
  scenario: TutorialScenario;
  onMoveComplete: () => void;
}

const TutorialBoard: React.FC<TutorialBoardProps> = ({ scenario, onMoveComplete }) => {
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [pieces, setPieces] = useState<{ [index: number]: TutorialPiece }>({ ...scenario.pieces });
  const [superpositions, setSuperpositions] = useState<{ [index: number]: number }>(
    scenario.superpositions ? { ...scenario.superpositions } : {}
  );
  const [moveCompleted, setMoveCompleted] = useState(false);

  const boardSize = 8;

  const isBlackSquare = (row: number, col: number) => {
    return (row + col) % 2 === 0;
  };

  const getIndex = (row: number, col: number) => {
    return Math.floor((col + (row * 8)) / 2);
  };

  const getRowColFromIndex = (index: number) => {
    const row = Math.floor(index / 4);
    const isRowEven = row % 2 === 0;
    const colInRow = index % 4;
    const col = isRowEven ? (colInRow * 2) : (colInRow * 2) + 1;
    return { row, col };
  };

  const getRow = (index: number) => getRowColFromIndex(index).row;
  const getCol = (index: number) => getRowColFromIndex(index).col;

  const handlePieceClick = (index: number) => {
    if (moveCompleted) return;
    
    // Check if this piece is selectable
    if (scenario.selectablePieces && !scenario.selectablePieces.includes(index)) {
      return;
    }
    
    setSelectedPiece(prev => (prev === index ? null : index));
  };

  const handleSquareClick = (index: number) => {
    if (moveCompleted || selectedPiece === null) return;

    // Find a matching classical move
    const move = scenario.validMoves.find(
      (m: TutorialMove) => 
        m.type === 'classical' && 
        m.from_index === selectedPiece && 
        m.to_index === index
    );

    if (move && move.from_index !== undefined && move.to_index !== undefined) {
      // Execute the classical move
      const piece = pieces[move.from_index];
      if (!piece) return;

      const newPieces = { ...pieces };
      delete newPieces[move.from_index];
      
      // Check for crowning
      const newPiece = { ...piece };
      const toRow = getRow(move.to_index);
      if (piece.color === 0 && toRow === 7) {
        newPiece.crowned = true;
      } else if (piece.color === 1 && toRow === 0) {
        newPiece.crowned = true;
      }

      // Check for capture (if the move jumps over a square)
      const fromRow = getRow(move.from_index);
      const fromCol = getCol(move.from_index);
      const toCol = getCol(move.to_index);
      if (Math.abs(toRow - fromRow) === 2) {
        const capturedRow = (fromRow + toRow) / 2;
        const capturedCol = (fromCol + toCol) / 2;
        const capturedIndex = getIndex(capturedRow, capturedCol);
        delete newPieces[capturedIndex];
      }

      newPieces[move.to_index] = newPiece;
      setPieces(newPieces);
      
      // Update superpositions if piece was in superposition
      if (superpositions[move.from_index] !== undefined) {
        const newSuperpositions = { ...superpositions };
        newSuperpositions[move.to_index] = superpositions[move.from_index];
        delete newSuperpositions[move.from_index];
        setSuperpositions(newSuperpositions);
      }

      setSelectedPiece(null);
      setMoveCompleted(true);
      onMoveComplete();
    }
  };

  const handleSplit = (split1: number, split2: number) => {
    if (moveCompleted || selectedPiece === null) return;

    const move = scenario.validMoves.find(
      (m: TutorialMove) => 
        m.type === 'split' &&
        m.from_index === selectedPiece &&
        ((m.to_index1 === split1 && m.to_index2 === split2) ||
         (m.to_index1 === split2 && m.to_index2 === split1))
    );

    if (move && move.from_index !== undefined && move.to_index1 !== undefined && move.to_index2 !== undefined) {
      const piece = pieces[move.from_index];
      if (!piece) return;

      const newPieces = { ...pieces };
      delete newPieces[move.from_index];
      newPieces[move.to_index1] = { ...piece };
      newPieces[move.to_index2] = { ...piece };
      setPieces(newPieces);

      // Set up superposition
      const currentChance = superpositions[move.from_index] || 1.0;
      const newSuperpositions = { ...superpositions };
      delete newSuperpositions[move.from_index];
      newSuperpositions[move.to_index1] = currentChance / 2;
      newSuperpositions[move.to_index2] = currentChance / 2;
      setSuperpositions(newSuperpositions);

      setSelectedPiece(null);
      setMoveCompleted(true);
      onMoveComplete();
    }
  };

  const handleMerge = (toIndex: number) => {
    if (moveCompleted) return;

    const move = scenario.validMoves.find(
      (m: TutorialMove) => m.type === 'merge' && m.to_index === toIndex
    );

    if (move && move.from_index1 !== undefined && move.from_index2 !== undefined && move.to_index !== undefined) {
      const piece = pieces[move.from_index1];
      if (!piece) return;

      const newPieces = { ...pieces };
      delete newPieces[move.from_index1];
      delete newPieces[move.from_index2];
      newPieces[move.to_index] = { ...piece };
      setPieces(newPieces);

      // Merge superposition (simplified - actual quantum behavior is more complex)
      const newSuperpositions = { ...superpositions };
      delete newSuperpositions[move.from_index1];
      delete newSuperpositions[move.from_index2];
      newSuperpositions[move.to_index] = 1.0; // Simplified for tutorial
      setSuperpositions(newSuperpositions);

      setSelectedPiece(null);
      setMoveCompleted(true);
      onMoveComplete();
    }
  };

  // Check if a move to a square is valid
  const isValidDestination = (index: number): boolean => {
    if (selectedPiece === null) return false;
    return scenario.validMoves.some(
      (m: TutorialMove) => 
        m.type === 'classical' && 
        m.from_index === selectedPiece && 
        m.to_index === index
    );
  };

  // Check if a split move is available
  const getSplitMove = (row: number, col: number): { split1: number; split2: number } | null => {
    if (selectedPiece === null || moveCompleted) return null;

    // Check for horizontal split (left/right)
    if (row > 0 && row < boardSize - 1) {
      const left = getIndex(row, col - 1);
      const right = getIndex(row, col + 1);

      const splitMove = scenario.validMoves.find(
        (m: TutorialMove) =>
          m.type === 'split' &&
          m.from_index === selectedPiece &&
          ((m.to_index1 === left && m.to_index2 === right) ||
           (m.to_index1 === right && m.to_index2 === left))
      );

      if (splitMove) {
        return { split1: left, split2: right };
      }
    }

    // Check for vertical split (up/down)
    if (col > 0 && col < boardSize - 1) {
      const up = getIndex(row + 1, col);
      const down = getIndex(row - 1, col);

      const splitMove = scenario.validMoves.find(
        (m: TutorialMove) =>
          m.type === 'split' &&
          m.from_index === selectedPiece &&
          ((m.to_index1 === up && m.to_index2 === down) ||
           (m.to_index1 === down && m.to_index2 === up))
      );

      if (splitMove) {
        return { split1: up, split2: down };
      }
    }

    return null;
  };

  // Check if a merge move is available for this square
  const getMergeMove = (index: number): TutorialMove | null => {
    if (moveCompleted) return null;
    
    return scenario.validMoves.find(
      (m: TutorialMove) => m.type === 'merge' && m.to_index === index
    ) || null;
  };

  const squares = [];

  for (let row = boardSize - 1; row >= 0; row--) {
    for (let col = 0; col < boardSize; col++) {
      const isBlack = isBlackSquare(row, col);
      const index = getIndex(row, col);

      let piece = null;
      let highlightSquare = false;
      let icon = null;

      if (isBlack && pieces[index]) {
        const pieceData = pieces[index];
        const pieceClass = pieceData.color === 0 ? "piece-white" : "piece-black";
        const chance = superpositions[index];

        const isSelectable = !moveCompleted && 
          scenario.selectablePieces?.includes(index);

        piece = (
          <div
            className={`piece ${pieceClass} ${isSelectable ? "moveable" : ""} ${pieceData.crowned ? "crowned-piece" : ""}`}
            onClick={() => isBlack && handlePieceClick(index)}
          >
            <div className="change-text">
              {chance !== undefined ? `${Math.round(chance * 100)}%` : ""}
            </div>
          </div>
        );
      } else if (isBlack && selectedPiece !== null && !moveCompleted) {
        highlightSquare = isValidDestination(index);
      } else if (!isBlack && selectedPiece !== null && !moveCompleted) {
        // Check for split icon on light squares
        const splitMove = getSplitMove(row, col);
        if (splitMove) {
          // Determine if it's horizontal or vertical split
          const isVertical = col > 0 && col < boardSize - 1 && 
            getCol(splitMove.split1) === getCol(splitMove.split2);
          
          icon = (
            <img
              src="/split.png"
              className={`split-icon ${isVertical ? "rotate" : ""}`}
              onClick={() => handleSplit(splitMove.split1, splitMove.split2)}
              alt="Split move"
            />
          );
        }
      } else if (isBlack && !moveCompleted) {
        // Check for merge icon
        const mergeMove = getMergeMove(index);
        if (mergeMove && mergeMove.from_index1 !== undefined && mergeMove.from_index2 !== undefined) {
          const f1 = mergeMove.from_index1;
          const f2 = mergeMove.from_index2;
          let rotation = 0;
          let flip = false;
          let iconSrc = "/merge.png";

          if (getRow(f1) === getRow(f2)) {
            // Horizontal merge
            if (getRow(f1) < getRow(index)) {
              rotation = 0;
            } else {
              rotation = 180;
            }
          } else if (getCol(f1) === getCol(f2)) {
            // Vertical merge
            if (getCol(f1) < getCol(index)) {
              rotation = 90;
            } else {
              rotation = 270;
            }
          } else {
            // Diagonal merge
            iconSrc = "/diagonal_merge.png";
            if (
              (getCol(f1) > getCol(f2) && getRow(f1) > getRow(f2)) ||
              (getCol(f1) < getCol(f2) && getRow(f1) < getRow(f2))
            ) {
              flip = true;
            }
          }

          icon = (
            <img
              src={iconSrc}
              className="split-icon"
              style={{
                transform: `rotate(${rotation}deg) ${flip ? "scaleX(-1)" : ""}`,
              }}
              onClick={() => handleMerge(index)}
              alt="Merge move"
            />
          );
        }
      }

      squares.push(
        <div
          key={`${row}-${col}`}
          className={`square ${isBlack ? "dark" : "light"} ${highlightSquare ? "highlight-square" : ""}`}
          onClick={() => !moveCompleted && selectedPiece !== null && isBlack && handleSquareClick(index)}
        >
          {piece || icon}
        </div>
      );
    }
  }

  return <div className="tutorial-board">{squares}</div>;
};

export default TutorialBoard;
