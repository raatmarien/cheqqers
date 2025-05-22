import React from "react";
import "./GameBoard.css";

interface GameBoardProps {
  boardState: {
    classic_occupancy: number[]; // Array representing which squares are occupied
    piece_map: { color: number }[]; // Array representing the pieces and their colors
  };
}

const GameBoard: React.FC<GameBoardProps> = ({ boardState }) => {
  const boardSize = 8; // 8x8 checkers board

  // Helper function to determine if a square is black
  const isBlackSquare = (row: number, col: number) => {
    return (row + col) % 2 === 0; // Black squares have odd (row + col)
  };

  // Generate the board squares
  const squares = [];

  for (let row = boardSize - 1; row >= 0; row--) {
    for (let col = 0; col < boardSize; col++) {
      const isBlack = isBlackSquare(row, col);
      let index = Math.floor((col + (row * 8)) / 2);

      let piece = null;
      if (isBlack && boardState.classic_occupancy[index] === 1) {
        const pieceColor = boardState.piece_map[index]?.color;
        const pieceClass = pieceColor === 0 ? "piece-white" : "piece-black";
        const isMoveable = boardState.possible_moves.some(
          m => m.from_index == index)


        piece = <div className={`piece ${pieceClass} ` +
                                `${isMoveable ? "moveable" : ""}`}
                />;
      }

      squares.push(
        <div
          key={`${row}-${col}`}
          className={`square ${isBlack ? "dark" : "light"}`}
        >
          {piece}
        </div>
      );
    }
  }

  return <div className="board">{squares}</div>;
};

export default GameBoard;
