import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

interface GameBoardProps {
  boardState: any;
  onMove: (moveIndex: number) => void;
  onMeasure?: (squareIndex: number) => void;
  measuringSquares?: number[];
  isDesignMode?: boolean;
  onSquareDrop?: (squareIndex: number, pieceData: any) => void;
  onForceTurn?: (color: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ boardState, onMove, onMeasure, measuringSquares, isDesignMode, onSquareDrop, onForceTurn }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const stateRef = useRef(boardState);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; squareIndex: number } | null>(null);
  const contextMenuRef = useRef<{ x: number; y: number; squareIndex: number } | null>(null);
  const onMeasureRef = useRef(onMeasure);
  const measuringRef = useRef<number[]>([]);

  useEffect(() => { onMeasureRef.current = onMeasure; }, [onMeasure]);
  useEffect(() => { contextMenuRef.current = contextMenu; }, [contextMenu]);
  useEffect(() => { measuringRef.current = measuringSquares || []; }, [measuringSquares]);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => { stateRef.current = boardState; }, [boardState]);
  useEffect(() => { selectedRef.current = selectedPiece; }, [selectedPiece]);

  const onMoveRef = useRef(onMove);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

  // ─── Click handler ───
  const handlePixiSquareClick = (index: number) => {
    const currentState = stateRef.current;
    if (!currentState) return;
    if (!isDesignMode && currentState.game_state !== 0) return;

    if (selectedRef.current === null) {
      const piece = currentState.piece_map[index];
      if (piece) {
        if (isDesignMode && piece.color !== currentState.turn && onForceTurn) {
          onForceTurn(piece.color);
        }

        if (piece.color === currentState.turn || isDesignMode) {
          const hasMove = currentState.possible_moves.some((m: any) => m.from_index === index || m.from_index1 === index || m.from_index2 === index);
          if (!hasMove && !isDesignMode) {
            const hasTakes = currentState.possible_moves.some((m: any) => m.is_take_move);
            if (hasTakes) {
              showToast('⚠️ You must capture! Look for the glowing square.');
            }
          }
          setSelectedPiece(index);
        } else {
          setSelectedPiece(index);
        }
      } else {
        setSelectedPiece(index);
      }
      return;
    }

    const sel = selectedRef.current;
    if (sel === index) { setSelectedPiece(null); return; }

    const moveIndex = currentState.possible_moves.findIndex(
      (m: any) => m.from_index === sel && m.to_index === index
    );

    if (moveIndex !== -1) {
      setSelectedPiece(null);
      onMoveRef.current(moveIndex);
    } else {
      setSelectedPiece(index);
    }
  };

  const handleSplit = (split1: number, split2: number) => {
    if (!isDesignMode && stateRef.current?.game_state !== 0) return;
    const sel = selectedPiece;
    if (sel === null) return;
    const moveIndex = boardState.possible_moves.findIndex(
      (m: any) => (m.from_index === sel &&
        (m.to_index1 === split1 || m.to_index1 === split2) &&
        (m.to_index2 === split1 || m.to_index2 === split2))
    );
    setSelectedPiece(null);
    onMoveRef.current(moveIndex);
  };

  const handleMerge = (index: number) => {
    if (!isDesignMode && stateRef.current?.game_state !== 0) return;
    const moveIndex = boardState.possible_moves.findIndex(
      (m: any) => m.from_index1 !== undefined && m.from_index2 !== undefined && m.to_index === index
    );
    setSelectedPiece(null);
    onMoveRef.current(moveIndex);
  };

  // ─── Futuristic Color Palette ───
  const COLORS = {
    boardDark: 0x1a1e2e,
    boardLight: 0x2a2f42,
    boardBorder: 0x3a3f55,
    bgColor: 0x0f111c,
    // Pieces
    pieceWhite: 0xe8e0f0,
    pieceWhiteEdge: 0xc4b8d8,
    pieceBlack: 0x09090b,
    pieceBlackEdge: 0x27272a,
    // Highlights
    selectGlow: 0x22d3ee,   // cyan
    targetGlow: 0x34d399,   // emerald
    captureGlow: 0xf43f5e,  // rose
    quantumGlow: 0xa78bfa,  // purple
    crownGold: 0xfbbf24,
  };

  // ─── PixiJS Init ───
  useEffect(() => {
    let isDestroyed = false;

    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({
        width: 800, height: 800,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });
      if (isDestroyed) { app.destroy(true); return; }

      appRef.current = app;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(app.canvas as any);
      }
      (app.canvas as HTMLCanvasElement).style.width = '100%';
      (app.canvas as HTMLCanvasElement).style.height = '100%';
      (app.canvas as HTMLCanvasElement).style.display = 'block';

      const boardSize = stateRef.current.board_size;
      const margin = 12;
      const boardPixels = 800 - margin * 2;
      const squareSize = boardPixels / boardSize;

      // Layers
      const boardLayer = new PIXI.Container();
      const captureLayer = new PIXI.Container(); // capture square highlights
      const highlightLayer = new PIXI.Container();
      const pieceLayer = new PIXI.Container();
      app.stage.addChild(boardLayer, captureLayer, highlightLayer, pieceLayer);

      // Board border
      const borderGfx = new PIXI.Graphics();
      borderGfx.roundRect(margin - 4, margin - 4, boardPixels + 8, boardPixels + 8, 8);
      borderGfx.fill({ color: COLORS.boardBorder, alpha: 0.6 });
      boardLayer.addChild(borderGfx);

      const pieceSprites: PIXI.Graphics[] = [];
      const highlightSprites: PIXI.Graphics[] = [];
      const captureSprites: PIXI.Graphics[] = [];

      // Draw board squares
      for (let row = boardSize - 1; row >= 0; row--) {
        for (let col = 0; col < boardSize; col++) {
          const isPlayable = (row + col) % 2 === 0;
          const index = Math.floor((col + (row * boardSize)) / 2);
          const vY = margin + (boardSize - 1 - row) * squareSize;
          const vX = margin + col * squareSize;

          const sqGfx = new PIXI.Graphics();
          sqGfx.rect(0, 0, squareSize, squareSize);
          sqGfx.fill(isPlayable ? COLORS.boardDark : COLORS.boardLight);
          sqGfx.x = vX;
          sqGfx.y = vY;

          if (isPlayable) {
            sqGfx.eventMode = 'static';
            sqGfx.cursor = 'pointer';
            sqGfx.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
              if (e.button === 2) {
                // Right-click: show context menu
                const canvasRect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
                const scaleX = canvasRect.width / 800;
                const scaleY = canvasRect.height / 800;
                setContextMenu({
                  x: vX * scaleX + (squareSize * scaleX / 2),
                  y: vY * scaleY + (squareSize * scaleY / 2),
                  squareIndex: index
                });
              } else {
                setContextMenu(null);
                handlePixiSquareClick(index);
              }
            });
            // Prevent browser context menu
            sqGfx.on('rightclick', (e: PIXI.FederatedPointerEvent) => {
              e.preventDefault?.();
            });

            if (isDesignMode && onSquareDrop) {
              sqGfx.on('pointerup', () => {
                // Drag and drop is handled by HTML5 drag/drop usually, but PIXI pointer events
                // could interfere or be used instead if dragging PIXI objects.
                // Since palette uses HTML drag and drop, we'll handle drop on the canvas container level.
              });
            }
          }
          boardLayer.addChild(sqGfx);

          if (isPlayable) {
            // Capture highlight (red square glow)
            const capGfx = new PIXI.Graphics();
            capGfx.rect(2, 2, squareSize - 4, squareSize - 4);
            capGfx.fill({ color: COLORS.captureGlow, alpha: 0.5 });
            capGfx.x = vX;
            capGfx.y = vY;
            capGfx.visible = false;
            captureLayer.addChild(capGfx);
            captureSprites[index] = capGfx;

            // Target highlight (green dot)
            const hlGfx = new PIXI.Graphics();
            hlGfx.circle(squareSize / 2, squareSize / 2, squareSize * 0.15);
            hlGfx.fill({ color: COLORS.targetGlow, alpha: 0.7 });
            hlGfx.x = vX;
            hlGfx.y = vY;
            hlGfx.visible = false;
            highlightLayer.addChild(hlGfx);
            highlightSprites[index] = hlGfx;

            // Piece graphic
            const pieceGfx = new PIXI.Graphics();
            pieceGfx.x = vX;
            pieceGfx.y = vY;
            pieceGfx.visible = false;
            pieceGfx.eventMode = 'none';
            pieceLayer.addChild(pieceGfx);
            pieceSprites[index] = pieceGfx;
          }
        }
      }

      // ─── Draw piece function ───
      const drawPiece = (gfx: PIXI.Graphics, isWhite: boolean, isCrowned: boolean, isSelected: boolean, isQuantum: boolean, chance: number, time: number) => {
        gfx.clear();
        // Remove old child display objects (e.g. Text labels from previous frames)
        while (gfx.children.length > 0) gfx.removeChildAt(0);
        const cx = squareSize / 2;
        const cy = squareSize / 2;
        // Scale piece size by probability — 50% piece is noticeably smaller
        const sizeScale = isQuantum ? 0.6 + 0.4 * chance : 1.0;
        const r = (squareSize / 2) * 0.72 * sizeScale;

        // Quantum shimmer border (drawn behind piece)
        if (isQuantum) {
          const shimmer = 0.4 + 0.5 * Math.sin(time * 3);
          gfx.circle(cx, cy, r + 4);
          gfx.stroke({ color: COLORS.quantumGlow, width: 2.5, alpha: shimmer });
        }

        // Selection ring
        if (isSelected) {
          const pulse = 0.7 + 0.3 * Math.sin(time * 5);
          gfx.circle(cx, cy, r + 6);
          gfx.fill({ color: COLORS.selectGlow, alpha: 0.4 * pulse });
          gfx.circle(cx, cy, r + 3);
          gfx.stroke({ color: COLORS.selectGlow, width: 2, alpha: 0.9 });
        }

        // Piece body - outer ring (edge color)
        gfx.circle(cx, cy, r);
        gfx.fill(isWhite ? COLORS.pieceWhiteEdge : COLORS.pieceBlackEdge);

        // Piece body - inner fill
        gfx.circle(cx, cy, r * 0.85);
        gfx.fill(isWhite ? COLORS.pieceWhite : COLORS.pieceBlack);

        // Inner sheen / highlight
        gfx.circle(cx - r * 0.15, cy - r * 0.2, r * 0.45);
        gfx.fill({ color: isWhite ? 0xffffff : 0x5a5a7a, alpha: 0.3 });

        // King 'Q' symbol
        if (isCrowned) {
          // The 'O' part of the Q
          gfx.circle(cx, cy, r * 0.35);
          gfx.stroke({ color: COLORS.crownGold, width: r * 0.12 });

          // The tail of the Q (bottom right)
          gfx.moveTo(cx + r * 0.15, cy + r * 0.15);
          gfx.lineTo(cx + r * 0.45, cy + r * 0.45);
          // @ts-ignore - cap is valid in PIXI v8 but might complain in older typings
          gfx.stroke({ color: COLORS.crownGold, width: r * 0.12, cap: 'round' });
        }

        // Probability label for quantum pieces
        if (isQuantum) {
          const pctText = `${Math.round(chance * 100)}%`;
          const style = new PIXI.TextStyle({
            fontSize: squareSize * 0.14,
            fill: 0xa78bfa,
            fontFamily: 'monospace',
            fontWeight: 'bold',
          });
          const label = new PIXI.Text({ text: pctText, style });
          label.anchor.set(0.5, 0);
          label.x = cx;
          label.y = cy + r + 2;
          gfx.addChild(label);
        }
      };

      // ─── Ticker ───
      app.ticker.add((ticker) => {
        const state = stateRef.current;
        const sel = selectedRef.current;
        if (!state) return;

        const time = ticker.lastTime / 1000;

        // Compute capture pieces
        const hasTakes = state.possible_moves.some((m: any) => m.is_take_move);
        const mustCapturePieces = new Set<number>();
        if (hasTakes) {
          for (const m of state.possible_moves) {
            if ((m as any).is_take_move) mustCapturePieces.add((m as any).from_index);
          }
        }

        for (let i = 0; i < pieceSprites.length; i++) {
          if (!pieceSprites[i]) continue;
          const gfx = pieceSprites[i];
          const hlGfx = highlightSprites[i];
          const capGfx = captureSprites[i];

          const pieceObj = state.piece_map[i];
          const chance = state.chances[i] !== undefined ? state.chances[i] : (pieceObj ? 1.0 : 0.0);
          const isQuantum = chance < 0.99 && chance > 0.01;

          if (chance > 0 && pieceObj) {
            gfx.visible = true;
            const isMeasuring = measuringRef.current.includes(i);
            if (isMeasuring) {
              // Rapid flickering during measurement: oscillate between visible/invisible
              const flickerRate = 12 + 8 * Math.sin(time * 2); // Accelerating flicker
              const flickerAlpha = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(time * flickerRate));
              gfx.alpha = flickerAlpha;
            } else {
              // More dramatic alpha: 50% piece = 0.5 alpha
              gfx.alpha = isQuantum ? chance : 1.0;
            }
            drawPiece(gfx, pieceObj.color === 0, pieceObj.crowned, sel === i, isQuantum, chance, time);
          } else {
            gfx.visible = false;
          }

          // Target highlight
          let isTarget = false;
          if (sel !== null) {
            isTarget = state.possible_moves.some((m: any) => m.from_index === sel && m.to_index === i);
          }
          hlGfx.visible = isTarget;

          // Capture square highlight OR measurement animation
          const isMeasuring = measuringRef.current.includes(i);
          if (isMeasuring) {
            // Measurement animation: pulsing purple scanning ring
            capGfx.visible = true;
            capGfx.clear();
            const cx = squareSize / 2;
            const cy = squareSize / 2;
            // Contracting ring
            const ringProgress = (time * 2) % 1; // 0→1 repeating
            const ringRadius = squareSize * 0.6 * (1 - ringProgress);
            const ringAlpha = 0.3 + 0.7 * (1 - ringProgress);
            capGfx.circle(cx, cy, ringRadius);
            capGfx.stroke({ color: 0xa78bfa, width: 3, alpha: ringAlpha });
            // Inner glow
            capGfx.circle(cx, cy, ringRadius * 0.5);
            capGfx.fill({ color: 0xa78bfa, alpha: 0.15 * ringAlpha });
            // Border flash
            const borderPulse = 0.5 + 0.5 * Math.sin(time * 15);
            capGfx.rect(1, 1, squareSize - 2, squareSize - 2);
            capGfx.stroke({ color: 0xa78bfa, width: 2, alpha: borderPulse * 0.6 });
          } else if (mustCapturePieces.has(i)) {
            capGfx.visible = true;
            capGfx.clear();
            capGfx.rect(2, 2, squareSize - 4, squareSize - 4);
            capGfx.fill({ color: COLORS.captureGlow, alpha: 0.5 });
            capGfx.alpha = 0.2 + 0.4 * (0.5 + 0.5 * Math.sin(time * 4));
          } else {
            capGfx.visible = false;
          }

          // Entanglement highlight (purple border when context menu targets an entangled partner)
          const ctxMenu = contextMenuRef.current;
          if (ctxMenu && state.quantum_states) {
            const ctxSq = ctxMenu.squareIndex;
            const isEntangled = state.quantum_states.some((qs: any) =>
              qs.squares.includes(ctxSq) && qs.squares.includes(i) && ctxSq !== i
            );
            if (isEntangled) {
              const ePulse = 0.4 + 0.4 * Math.sin(time * 3);
              capGfx.visible = true;
              // Repurpose graphics: draw purple border
              capGfx.clear();
              capGfx.rect(2, 2, squareSize - 4, squareSize - 4);
              capGfx.stroke({ color: COLORS.quantumGlow, width: 3, alpha: ePulse });
              capGfx.fill({ color: COLORS.quantumGlow, alpha: 0.1 });
            } else if (!mustCapturePieces.has(i)) {
              // Reset capture sprite if it was repurposed
              if (capGfx.visible) {
                capGfx.clear();
                capGfx.rect(2, 2, squareSize - 4, squareSize - 4);
                capGfx.fill({ color: COLORS.captureGlow, alpha: 0.5 });
                capGfx.visible = false;
              }
            }
          }
        }
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      if (appRef.current) appRef.current.destroy(true);
    };
  }, [boardState.board_size]);

  // ─── Overlay JSX (split/merge buttons) ───
  const boardSize = boardState.board_size;
  const squaresPerRow = Math.floor(boardSize / 2);
  const getRow = (index: number) => Math.floor(index / squaresPerRow);
  const getCol = (index: number) => {
    const row = Math.floor(index / squaresPerRow);
    const colInRow = index % squaresPerRow;
    return row % 2 === 0 ? colInRow * 2 : colInRow * 2 + 1;
  };
  const getIndex = (row: number, col: number) => Math.floor((col + (row * boardSize)) / 2);

  const overlays: React.ReactNode[] = [];
  // Account for the margin in overlay positioning
  const marginPercent = (12 / 800) * 100;
  const boardPercent = 100 - marginPercent * 2;

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const isBlack = (row + col) % 2 === 0;
      const visualYPercent = marginPercent + ((boardSize - 1 - row) / boardSize) * boardPercent;
      const visualXPercent = marginPercent + (col / boardSize) * boardPercent;
      const szPercent = boardPercent / boardSize;

      if (!isBlack) {
        if (selectedPiece !== null) {
          // Horizontal split
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
                className="absolute z-10 cursor-pointer hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]"
                style={{ left: `${visualXPercent}%`, top: `${visualYPercent}%`, width: `${szPercent}%`, height: `${szPercent}%` }}
              />);
            }
          }
          // Vertical split
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
                className="absolute z-10 rotate-90 cursor-pointer hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]"
                style={{ left: `${visualXPercent}%`, top: `${visualYPercent}%`, width: `${szPercent}%`, height: `${szPercent}%` }}
              />);
            }
          }
        }
      } else {
        const index = getIndex(row, col);
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
            className="absolute z-10 cursor-pointer hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]"
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

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDesignMode) return;
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isDesignMode || !onSquareDrop || !containerRef.current) return;
    e.preventDefault();

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;
      const pieceData = JSON.parse(dataStr);

      // Calculate square index based on drop coordinates
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const marginPct = marginPercent / 100;
      const boardPct = boardPercent / 100;
      const relativeX = (x / rect.width - marginPct) / boardPct;
      const relativeY = (y / rect.height - marginPct) / boardPct;

      if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) return; // Dropped outside board area but within margin

      const col = Math.floor(relativeX * boardSize);
      // y is from top to bottom, but rows are 0 at bottom
      const row = boardSize - 1 - Math.floor(relativeY * boardSize);

      if ((row + col) % 2 === 0) {
        // It's a playable square
        const index = getIndex(row, col);
        onSquareDrop(index, pieceData);
      }

    } catch (err) {
      console.error("Drop parsing error", err);
    }
  };

  return (
    <div
      className="relative aspect-square w-full max-w-[500px] rounded-lg overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)]"
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => contextMenu && setContextMenu(null)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {overlays}
      {toast && (
        <div className="toast-enter absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-rose-950/90 border border-rose-500/30 text-rose-200 px-4 py-2 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap backdrop-blur-sm">
          {toast}
        </div>
      )}
      {contextMenu && (
        <div
          className="absolute z-30 bg-[#1a1e2e]/95 backdrop-blur-md border border-indigo-500/30 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] py-1 min-w-[140px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-700/50">
            Square {contextMenu.squareIndex + 1}
            {boardState.quantum_states && (() => {
              const entangledWith = boardState.quantum_states
                .filter((qs: any) => qs.squares.includes(contextMenu.squareIndex))
                .flatMap((qs: any) => qs.squares)
                .filter((sq: number) => sq !== contextMenu.squareIndex);
              const unique = [...new Set(entangledWith)];
              if (unique.length > 0) {
                return <div className="text-purple-400 mt-0.5 normal-case tracking-normal">⚛ Entangled with sq {unique.map(s => (s as number) + 1).join(', ')}</div>;
              }
              return null;
            })()}
          </div>
          {isDesignMode && boardState.piece_map[contextMenu.squareIndex] && (
            <button
              className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-2 border-b border-zinc-700/50"
              onClick={() => {
                if (onSquareDrop) onSquareDrop(contextMenu.squareIndex, { remove: true });
                setContextMenu(null);
              }}
            >
              <span>🗑️</span>
              <span>Remove Piece</span>
            </button>
          )}
          {boardState.chances[contextMenu.squareIndex] !== undefined &&
            boardState.chances[contextMenu.squareIndex] < 0.99 &&
            boardState.chances[contextMenu.squareIndex] > 0.01 ? (
            <button
              className="w-full px-3 py-2 text-left text-sm text-purple-300 hover:bg-purple-500/20 transition-colors flex items-center gap-2"
              onClick={() => {
                if (onMeasureRef.current) {
                  onMeasureRef.current(contextMenu.squareIndex);
                }
                setContextMenu(null);
              }}
            >
              <span>⚛</span>
              <span>Measure</span>
              <span className="ml-auto text-[10px] text-zinc-500">
                {((boardState.chances[contextMenu.squareIndex] || 0) * 100).toFixed(0)}%
              </span>
            </button>
          ) : (
            <div className="px-3 py-2 text-sm text-zinc-600 italic">
              Not in superposition
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameBoard;
