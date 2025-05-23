import React from "react";
import "./GameBoard.css";

interface GameBoardProps {
  boardState: {
    classic_occupancy: number[]; // Array representing which squares are occupied
    piece_map: { color: number }[]; // Array representing the pieces and their colors
    onMove: (moveIndex: number) => void; // Add this prop
  };
}

const GameBoard: React.FC<GameBoardProps> = ({ boardState, onMove }) => {
  const [selectedPiece, setSelectedPiece] = React.useState<number | null>(null);
  const handlePieceClick = (index: number) => {
    setSelectedPiece(prev => (prev === index ? null : index));
  };

  const handleSquareClick = (index: number) => {
    if (!selectedPiece) return;

    let move = boardState.possible_moves.findIndex(
      m => m.from_index == selectedPiece && m.to_index == index);
    if (move == -1) return;

    setSelectedPiece(null);
    onMove(move);
  };

  const handleSplit = (split1: number, split2: number) => {
    let move = boardState.possible_moves.findIndex(
      m => (m.from_index == selectedPiece &&
            (m.to_index1 == split1 || m.to_index1 == split2) &&
            (m.to_index2 == split1 || m.to_index2 == split2)));
    setSelectedPiece(null);
    onMove(move);
  };

  const handleMerge = (index: number) => {
    let move = boardState.possible_moves.findIndex(
      m => m.to_index == index);
    setSelectedPiece(null);
    onMove(move);
  };

  const boardSize = 8; // 8x8 checkers board

  // Helper function to determine if a square is black
  const isBlackSquare = (row: number, col: number) => {
    return (row + col) % 2 === 0; // Black squares have odd (row + col)
  };
 
 const getIndex = (row: number, col: number) => {
    return Math.floor((col + (row * 8)) / 2);
  };

  const getRowColFromIndex = (index: number) => {
    const row = Math.floor(index / 4);
    const isRowEven = row % 2 === 0;
    const colInRow = index % 4;
    const col = isRowEven ? (colInRow * 2 + 1) : (colInRow * 2);
    return { row, col };
  };

  const getRow = (index: number) => getRowColFromIndex(index).row;
  const getCol = (index: number) => getRowColFromIndex(index).col;
  
  // Generate the board squares
  const squares = [];

  for (let row = boardSize - 1; row >= 0; row--) {
    for (let col = 0; col < boardSize; col++) {
      const isBlack = isBlackSquare(row, col);
      let index = getIndex(row, col);

      let piece = null;
      let highlightSquare = false;
      let icon = null;
      if (isBlack && boardState.piece_map[index]) {
        const pieceColor = boardState.piece_map[index]?.color;
        const pieceClass = pieceColor === 0 ? "piece-white" : "piece-black";
        let chance = boardState.chances[index];
        
        const isMoveable = boardState.possible_moves.some(
          m => m.from_index == index)


        piece = <div className={`piece ${pieceClass} ` +
                                `${isMoveable ? "moveable" : ""}`}
                     onClick={() => isBlack && handlePieceClick(index)}>
        <div className="change-text">{chance ? (Math.round(chance * 100) + "%") : ""}</div>
        </div>;
      } else if (isBlack && selectedPiece) {
        highlightSquare = boardState
          .possible_moves
          .filter(m => m.from_index == selectedPiece)
          .some(m => m.to_index == index)
      } else if (selectedPiece) {
        // Maybe show split?
        if (row > 0 && row < boardSize - 1) {
          // Left/right split
          let left = getIndex(row, col - 1);
          let right = getIndex(row, col + 1);

          if (boardState.possible_moves.some(
            m => (m.from_index == selectedPiece &&
                  (m.to_index1 == left || m.to_index1 == right) &&
                  (m.to_index2 == left || m.to_index2 == right)))) {
            icon = <img src="/split.png"
                        className="split-icon"
                        onClick={() => handleSplit(left, right)}
                   />
          }
        }
        if (col > 0 && col < boardSize - 1) {
          // Up/down split
          let up = getIndex(row + 1, col);
          let down = getIndex(row - 1, col);

          if (boardState.possible_moves.some(
            m => (m.from_index == selectedPiece &&
                  (m.to_index1 == up || m.to_index1 == down) &&
                  (m.to_index2 == up || m.to_index2 == down)))) {
            icon = <img src="/split.png"
                        className="split-icon rotate"
                        onClick={() => handleSplit(up, down)} />
          }
        }
      } else if (isBlack) {
        // Maybe show merge
        let merge_move = boardState.possible_moves.some(
          m => (m.from_index1 && m.from_index2 &&
                m.to_index == index));
        if (merge_move) {
          let f1 = merge_move.from_index1;
          let f2 = merge_move.from_index2;
          let t = merge_move.to_index;
          let rotation = 0;
          if (getRow(f1) == getRow(f2)) {
            // Up/down
            if (getRow(f1) < getRow(t)) {
              // Up
              rotation = 0;
            } else {
              // Down
              rotation = 180;
            }
          } else {
            if (getCol(f1) < getCol(t)) {
              // Right
              rotation = 90;
            } else {
              // Left
              rotation = 270;
            }
          }
          icon = <img src="/merge.png"
                      className="split-icon"
                      style={{transform: `rotate({rotation}deg)`}}
                      onClick={() => handleMerge(index)} />
        }
      }

      squares.push(
        <div
          key={`${row}-${col}`}
          className={`square ${isBlack ? "dark" : "light"} ` +
                     `${highlightSquare ? "highlight-square" : ""}`}
          onClick={() => selectedPiece && isBlack && handleSquareClick(index) }
        >
          {piece || icon}
        </div>
      );
    }
  }

  return <div className="board">{squares}</div>;
};

export default GameBoard;
