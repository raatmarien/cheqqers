import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

interface GameBoardProps {
  boardState: any;
  onMove: (moveIndex: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ boardState, onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const stateRef = useRef(boardState);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const selectedRef = useRef<number | null>(null);

  // Update refs
  useEffect(() => {
    stateRef.current = boardState;
  }, [boardState]);

  useEffect(() => {
    selectedRef.current = selectedPiece;
  }, [selectedPiece]);

  // Click handler bridging Pixi -> React
  const handlePixiSquareClick = (index: number) => {
    const currentState = stateRef.current;
    if (!currentState) return;

    // If nothing selected, try to select
    if (selectedRef.current === null) {
      // Check if it's a valid selectable piece
      if (currentState.piece_map[index] && currentState.piece_map[index].color === currentState.turn) {
        setSelectedPiece(index);
      } else {
        setSelectedPiece(index); // Still allow selecting it just in case we need it, but clicking empty usually does nothing
      }
      return;
    }

    const sel = selectedRef.current;

    // Check if we clicked the same piece -> deselect
    if (sel === index) {
      setSelectedPiece(null);
      return;
    }

    // Check if it's a valid move
    const moveIndex = currentState.possible_moves.findIndex(
      (m: any) => m.from_index === sel && m.to_index === index
    );

    if (moveIndex !== -1) {
      setSelectedPiece(null);
      onMove(moveIndex);
    } else {
      // Just change selection
      setSelectedPiece(index);
    }
  };

  const handleSplit = (split1: number, split2: number) => {
    const sel = selectedPiece;
    if (sel === null) return;
    const moveIndex = boardState.possible_moves.findIndex(
      (m: any) => (m.from_index === sel &&
        (m.to_index1 === split1 || m.to_index1 === split2) &&
        (m.to_index2 === split1 || m.to_index2 === split2))
    );
    setSelectedPiece(null);
    onMove(moveIndex);
  };

  const handleMerge = (index: number) => {
    const moveIndex = boardState.possible_moves.findIndex(
      (m: any) => m.from_index1 !== undefined && m.from_index2 !== undefined && m.to_index === index
    );
    setSelectedPiece(null);
    onMove(moveIndex);
  };

  useEffect(() => {
    let isDestroyed = false;

    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({ width: 800, height: 800, backgroundColor: 0x111111, resolution: window.devicePixelRatio || 1, autoDensity: true });
      if (isDestroyed) { app.destroy(true); return; }

      appRef.current = app;
      if (containerRef.current) {
        // Clear old just in case
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(app.canvas as any);
      }

      (app.canvas as HTMLCanvasElement).style.width = '100%';
      (app.canvas as HTMLCanvasElement).style.height = '100%';
      (app.canvas as HTMLCanvasElement).style.display = 'block';

      const boardSize = stateRef.current.board_size;
      const squareSize = 800 / boardSize;

      const squareContainer = new PIXI.Container();
      app.stage.addChild(squareContainer);

      const highlightContainer = new PIXI.Container();
      app.stage.addChild(highlightContainer);

      const piecesContainer = new PIXI.Container();
      app.stage.addChild(piecesContainer);

      const pieceSprites: PIXI.Graphics[] = [];
      const highlightSprites: PIXI.Graphics[] = [];

      for (let row = boardSize - 1; row >= 0; row--) {
        for (let col = 0; col < boardSize; col++) {
          const isBlack = (row + col) % 2 === 0;
          const index = Math.floor((col + (row * boardSize)) / 2);

          const visualY = (boardSize - 1 - row) * squareSize;
          const visualX = col * squareSize;

          const sqGfx = new PIXI.Graphics();
          sqGfx.rect(0, 0, squareSize, squareSize);
          sqGfx.fill(isBlack ? 0xb58863 : 0xf0d9b5);
          sqGfx.x = visualX;
          sqGfx.y = visualY;

          if (isBlack) {
            sqGfx.eventMode = 'static';
            sqGfx.cursor = 'pointer';
            sqGfx.on('pointerdown', () => handlePixiSquareClick(index));
          }

          squareContainer.addChild(sqGfx);

          if (isBlack) {
            const hlGfx = new PIXI.Graphics();
            hlGfx.rect(0, 0, squareSize, squareSize);
            hlGfx.fill({ color: 0x00FF00, alpha: 0.3 });
            hlGfx.x = visualX;
            hlGfx.y = visualY;
            hlGfx.visible = false;
            highlightContainer.addChild(hlGfx);
            highlightSprites[index] = hlGfx;

            const pieceGfx = new PIXI.Graphics();
            pieceGfx.x = visualX;
            pieceGfx.y = visualY;
            pieceGfx.visible = false;
            pieceGfx.eventMode = 'none'; // click goes to square
            piecesContainer.addChild(pieceGfx);
            pieceSprites[index] = pieceGfx;
          }
        }
      }

      const drawPiece = (gfx: PIXI.Graphics, isWhite: boolean, isCrowned: boolean, isSelected: boolean) => {
        gfx.clear();
        const cx = squareSize / 2;
        const cy = squareSize / 2;

        if (isSelected) {
          gfx.circle(cx, cy, (squareSize / 2) * 0.85);
          gfx.fill(0x00FF00); // Selection ring
        }

        gfx.circle(cx, cy, (squareSize / 2) * 0.7);
        gfx.fill(isWhite ? 0xFFFFFF : 0x222222);

        if (isCrowned) {
          gfx.circle(cx, cy, (squareSize / 2) * 0.3);
          gfx.fill(0xFFD700);
        }
      };

      app.ticker.add(() => {
        const state = stateRef.current;
        const sel = selectedRef.current;
        if (!state) return;

        for (let i = 0; i < pieceSprites.length; i++) {
          if (!pieceSprites[i]) continue;
          const gfx = pieceSprites[i];
          const hlGfx = highlightSprites[i];

          const pieceObj = state.piece_map[i];
          const chance = state.chances[i] !== undefined ? state.chances[i] : (pieceObj ? 1.0 : 0.0);

          if (chance > 0 && pieceObj) {
            gfx.visible = true;
            gfx.alpha = chance;
            drawPiece(gfx, pieceObj.color === 0, pieceObj.crowned, sel === i);
          } else {
            gfx.visible = false;
          }

          // Highlight logic for targets
          let isTarget = false;
          if (sel !== null) {
            isTarget = state.possible_moves.some((m: any) => m.from_index === sel && m.to_index === i);
          }
          hlGfx.visible = isTarget;
        }
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      if (appRef.current) appRef.current.destroy(true);
    };
  }, [boardState.board_size]);

  // Helper overlay coordinate mappers
  const boardSize = boardState.board_size;
  const squaresPerRow = Math.floor(boardSize / 2);

  const getRow = (index: number) => Math.floor(index / squaresPerRow);
  const getCol = (index: number) => {
    const row = Math.floor(index / squaresPerRow);
    const colInRow = index % squaresPerRow;
    return row % 2 === 0 ? colInRow * 2 : colInRow * 2 + 1;
  };

  const getIndex = (row: number, col: number) => Math.floor((col + (row * boardSize)) / 2);

  // Collect overlay JSX elements (split/merge buttons)
  const overlays: React.ReactNode[] = [];

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const isBlack = (row + col) % 2 === 0;

      const visualYPercent = ((boardSize - 1 - row) / boardSize) * 100;
      const visualXPercent = (col / boardSize) * 100;
      const szPercent = 100 / boardSize;

      if (!isBlack) {
        if (selectedPiece !== null) {
          // Check horizontal split (left and right of this white square)
          if (col > 0 && col < boardSize - 1) {
            let left = getIndex(row, col - 1);
            let right = getIndex(row, col + 1);
            if (boardState.possible_moves.some(
              (m: any) => (m.from_index === selectedPiece &&
                (m.to_index1 === left || m.to_index1 === right) &&
                (m.to_index2 === left || m.to_index2 === right))
            )) {
              overlays.push(<img
                key={`split-horiz-${row}-${col}`}
                src="/split.png"
                onClick={() => handleSplit(left, right)}
                className="absolute z-10 cursor-pointer hover:scale-125 transition-transform"
                style={{ left: `${visualXPercent}%`, top: `${visualYPercent}%`, width: `${szPercent}%`, height: `${szPercent}%` }}
              />);
            }
          }

          // Check vertical split (up and down of this white square)
          if (row > 0 && row < boardSize - 1) {
            let up = getIndex(row + 1, col);
            let down = getIndex(row - 1, col);
            if (boardState.possible_moves.some(
              (m: any) => (m.from_index === selectedPiece &&
                (m.to_index1 === up || m.to_index1 === down) &&
                (m.to_index2 === up || m.to_index2 === down))
            )) {
              overlays.push(<img
                key={`split-vert-${row}-${col}`}
                src="/split.png"
                onClick={() => handleSplit(up, down)}
                className="absolute z-10 rotate-90 cursor-pointer hover:scale-125 transition-transform"
                style={{ left: `${visualXPercent}%`, top: `${visualYPercent}%`, width: `${szPercent}%`, height: `${szPercent}%` }}
              />);
            }
          }
        }
      } else {
        const index = getIndex(row, col);
        // Check merges targeting this black square
        let merge_move = boardState.possible_moves.find(
          (m: any) => (m.from_index1 !== undefined && m.from_index2 !== undefined && m.to_index === index)
        );
        if (merge_move) {
          let f1 = merge_move.from_index1;
          let f2 = merge_move.from_index2;
          let rotation = 0;
          let flip = false;
          let icon_src = "/merge.png";

          if (getRow(f1) === getRow(f2)) {
            rotation = getRow(f1) < getRow(index) ? 0 : 180;
          } else if (getCol(f1) === getCol(f2)) {
            rotation = getCol(f1) < getCol(index) ? 90 : 270;
          } else {
            icon_src = "/diagonal_merge.png";
            if ((getCol(f1) > getCol(f2) && getRow(f1) > getRow(f2)) ||
              (getCol(f1) < getCol(f2) && getRow(f1) < getRow(f2))) {
              flip = true;
            }
          }

          overlays.push(<img
            key={`merge-${index}`}
            src={icon_src}
            onClick={() => handleMerge(index)}
            className="absolute z-10 cursor-pointer hover:scale-125 transition-transform"
            style={{
              left: `${visualXPercent}%`,
              top: `${visualYPercent}%`,
              width: `${szPercent}%`,
              height: `${szPercent}%`,
              transform: `rotate(${rotation}deg) ${flip ? "scaleX(-1)" : ""}`
            }}
          />);
        }
      }
    }
  }

  return (
    <div className="relative aspect-square w-[90vw] max-w-[400px] border-2 border-black">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {overlays}
    </div>
  );
};

export default GameBoard;
