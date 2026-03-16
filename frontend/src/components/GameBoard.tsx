import React, { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";

interface GameBoardProps {
  boardState: any;
  onMove: (moveIndex: number) => void;
  onMeasure?: (squareIndex: number) => void;
  measuringSquares?: number[];
  isDesignMode?: boolean;
  onSquareDrop?: (squareIndex: number, pieceData: any) => void;
}
const GameBoard: React.FC<GameBoardProps> = ({ boardState, onMove, onMeasure, measuringSquares, isDesignMode, onSquareDrop }) => {
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

  // ─── Quantum split mode ───
  const [isQuantumMode, setIsQuantumMode] = useState(false);
  const isQuantumModeRef = useRef(false);
  const [splitFirstTarget, setSplitFirstTarget] = useState<number | null>(null);
  const splitFirstTargetRef = useRef<number | null>(null);

  // ─── Merge discovery mode ───
  const [isMergeMode, setIsMergeMode] = useState(false);
  const isMergeModeRef = useRef(false);
  const mergeFirstRef = useRef<number | null>(null);
  const mergeSecondRef = useRef<number | null>(null);

  const lastClickRef = useRef<{ time: number; index: number | null }>({ time: 0, index: null });

  console.log("GameBoard Render, isQuantumMode:", isQuantumMode, "splitFirstTarget:", splitFirstTarget);

  useEffect(() => { onMeasureRef.current = onMeasure; }, [onMeasure]);
  useEffect(() => { contextMenuRef.current = contextMenu; }, [contextMenu]);
  useEffect(() => { measuringRef.current = measuringSquares || []; }, [measuringSquares]);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { stateRef.current = boardState; }, [boardState]);
  useEffect(() => { selectedRef.current = selectedPiece; }, [selectedPiece]);

  // Auto-select piece when a multi-jump continuation is forced
  useEffect(() => {
    if (!boardState) return;
    
    // Reset selection if we're at the very beginning of a board state (e.g. new tutorial step)
    // We check if history is empty.
    if (!boardState.move_history || boardState.move_history.length === 0) {
      setSelectedPiece(null);
      selectedRef.current = null;
      return;
    }

    if (boardState.game_state !== 0) return;
    const moves = boardState.possible_moves as any[];
    if (moves.length === 0) return;

    const firstFrom = moves[0].from_index;
    const allSameFrom = moves.every((m: any) => m.from_index === firstFrom);
    const allTakes = moves.every((m: any) => m.is_take_move);
    const isMultiJumpContinuation = boardState.jumped_piece_ids_this_turn && boardState.jumped_piece_ids_this_turn.length > 0;

    if (allSameFrom && allTakes && isMultiJumpContinuation && firstFrom !== undefined) {
      setSelectedPiece(firstFrom);
      // Ensure quantum mode is exited if a capture is underway
      if (isQuantumModeRef.current) exitQuantumMode();
    }
  }, [boardState]);

  const onMoveRef = useRef(onMove);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

  // ─── Quantum mode helpers ───
  const enterQuantumMode = () => {
    console.log("Entering quantum mode. selectedPiece:", selectedRef.current);
    setIsQuantumMode(true);
    isQuantumModeRef.current = true;
    setSplitFirstTarget(null);
    splitFirstTargetRef.current = null;
  };

  const exitQuantumMode = () => {
    console.log("Exiting quantum mode");
    setIsQuantumMode(false);
    isQuantumModeRef.current = false;
    setSplitFirstTarget(null);
    splitFirstTargetRef.current = null;
  };

  const enterMergeMode = (firstIndex: number) => {
    console.log("Entering merge mode. firstIndex:", firstIndex);
    setIsMergeMode(true);
    isMergeModeRef.current = true;
    mergeFirstRef.current = firstIndex;
    mergeSecondRef.current = null;
  };

  const exitMergeMode = () => {
    console.log("Exiting merge mode");
    setIsMergeMode(false);
    isMergeModeRef.current = false;
    mergeFirstRef.current = null;
    mergeSecondRef.current = null;
  };

  const handleMergeDiscoveryClick = (index: number) => {
    const currentState = stateRef.current;
    const first = mergeFirstRef.current;
    if (!currentState || first === null) {
      exitMergeMode();
      return;
    }

    // Phase 1: Clicking a partner
    const potentialPartners = currentState.possible_moves.filter((m: any) => 
      m.from_index1 !== undefined && (m.from_index1 === first || m.from_index2 === first)
    ).map((m: any) => m.from_index1 === first ? m.from_index2 : m.from_index1);

    if (potentialPartners.includes(index)) {
      console.log("Partner selected:", index);
      mergeSecondRef.current = index;
      return;
    }

    // Phase 2: Clicking the destination
    const second = mergeSecondRef.current;
    if (second !== null) {
      const moveIndex = currentState.possible_moves.findIndex((m: any) => 
        m.from_index1 !== undefined && 
        ((m.from_index1 === first && m.from_index2 === second) || 
         (m.from_index1 === second && m.from_index2 === first)) &&
        m.to_index === index
      );

      if (moveIndex !== -1) {
        console.log("Executing merge move, index:", moveIndex);
        exitMergeMode();
        setSelectedPiece(null);
        selectedRef.current = null;
        onMoveRef.current(moveIndex);
        return;
      }
    }

    // Clicking elsewhere exits merge mode
    if (index !== first && index !== second) {
      exitMergeMode();
    }
  };

  const handleQuantumSquareClick = (index: number) => {
    const currentState = stateRef.current;
    const sel = selectedRef.current;
    if (!currentState || sel === null) {
      console.log("Quantum click ignored: state or selection null");
      exitQuantumMode();
      return;
    }

    const first = splitFirstTargetRef.current;
    console.log("handleQuantumSquareClick", { index, first, moves: currentState.possible_moves.length });

    if (first === null) {
      const isValidTarget = currentState.possible_moves.some(
        (m: any) => m.from_index === sel && m.to_index1 !== undefined &&
          (m.to_index1 === index || m.to_index2 === index)
      );
      if (isValidTarget) {
        console.log("First target set:", index);
        setSplitFirstTarget(index);
        splitFirstTargetRef.current = index;
      } else {
        console.log("Clicked square is not a valid first target. Ignoring.");
        // Don't exit anymore, just ignore. If they want to exit they can use the X.
      }
    } else {
      if (first === index) {
        console.log("Deselecting first target.");
        setSplitFirstTarget(null);
        splitFirstTargetRef.current = null;
        return;
      }

      const moveIndex = currentState.possible_moves.findIndex(
        (m: any) => m.from_index === sel && m.to_index1 !== undefined &&
          ((m.to_index1 === first && m.to_index2 === index) ||
            (m.to_index1 === index && m.to_index2 === first))
      );

      if (moveIndex !== -1) {
        console.log("Executing quantum split move, index:", moveIndex);
        exitQuantumMode();
        setSelectedPiece(null);
        selectedRef.current = null;
        onMoveRef.current(moveIndex);
      } else {
        console.log("Not a valid second target for selected first target. Ignoring.");
      }
    }
  };

  // ─── Click handler ───
  const handlePixiSquareClick = (index: number | null) => {
    const currentState = stateRef.current;
    if (!currentState) return;
    if (!isDesignMode && currentState.game_state !== 0) return;

    // In quantum/merge mode, clicks are handled by special handlers
    if (isQuantumModeRef.current) return;
    if (isMergeModeRef.current) return;

    const sel = selectedRef.current;

    // CASE 0: Clicking outside playable area or on unplayable square
    if (index === null) {
      setSelectedPiece(null);
      return;
    }

    const piece = currentState.piece_map[index];

    // CASE 1: No piece selected yet
    if (sel === null) {
      if (piece) {
        if (piece.color === currentState.turn || isDesignMode) {
          setSelectedPiece(index);
        } else {
          showToast('Not your turn!');
        }
      }
      return;
    }

    // CASE 2: Piece already selected

    // PRIORITY: Always check if there's a move from current selection to THIS square first
    // This handles the case where there's a ghost piece of your own color on the landing square.
    const moveIndex = currentState.possible_moves.findIndex(
      (m: any) => m.from_index === sel && m.to_index === index
    );

    if (moveIndex !== -1) {
      setSelectedPiece(null);
      onMoveRef.current(moveIndex);
      return;
    }

    // If no move, handle re-selection or deselection
    if (sel === index) {
      // Clicking the already selected piece again deselects it
      setSelectedPiece(null);
    } else if (piece && (piece.color === currentState.turn || isDesignMode)) {
      // Switching selection to another own piece
      setSelectedPiece(index);
    } else {
      // Clicking an empty square (that is not a move) or enemy piece deselects everything
      setSelectedPiece(null);
      if (piece) showToast('Not a valid move!');
    }
  };

  const handlePixiSquareClickRef = useRef(handlePixiSquareClick);
  useEffect(() => { handlePixiSquareClickRef.current = handlePixiSquareClick; }, [handlePixiSquareClick]);

  const handleQuantumSquareClickRef = useRef(handleQuantumSquareClick);
  useEffect(() => { handleQuantumSquareClickRef.current = handleQuantumSquareClick; }, [handleQuantumSquareClick]);
  const handleMergeDiscoveryClickRef = useRef(handleMergeDiscoveryClick);
  useEffect(() => { handleMergeDiscoveryClickRef.current = handleMergeDiscoveryClick; }, [handleMergeDiscoveryClick]);

  // handleMerge is now deprecated in favor of discovery flow
  // handleMerge is now deprecated in favor of discovery flow

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
    mergeGlow: 0xfb923c,    // orange
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
      const captureLayer = new PIXI.Container();
      const highlightLayer = new PIXI.Container();
      const quantumLayer = new PIXI.Container();
      const pieceLayer = new PIXI.Container();
      
      // Ensure layers on top of squares don't block clicks
      captureLayer.eventMode = 'none';
      highlightLayer.eventMode = 'none';
      quantumLayer.eventMode = 'none';
      pieceLayer.eventMode = 'none';
      
      app.stage.addChild(boardLayer, captureLayer, highlightLayer, quantumLayer, pieceLayer);

      // Board border
      const borderGfx = new PIXI.Graphics();
      borderGfx.roundRect(margin - 4, margin - 4, boardPixels + 8, boardPixels + 8, 8);
      borderGfx.fill({ color: COLORS.boardBorder, alpha: 0.6 });
      boardLayer.addChild(borderGfx);

      // Global quantum mode border (pulsing purple)
      const globalQuantumGfx = new PIXI.Graphics();
      globalQuantumGfx.roundRect(margin - 6, margin - 6, boardPixels + 12, boardPixels + 12, 10);
      globalQuantumGfx.stroke({ color: COLORS.quantumGlow, width: 4, alpha: 0 });
      globalQuantumGfx.visible = false;
      boardLayer.addChild(globalQuantumGfx);

      // Interaction Overlay (Topmost invisible layer for reliable hit-testing)
      const interactionLayer = new PIXI.Graphics();
      interactionLayer.rect(margin, margin, boardPixels, boardPixels);
      interactionLayer.fill({ color: 0x000000, alpha: 0 }); // Invisible but catches events
      interactionLayer.eventMode = 'static';
      interactionLayer.cursor = 'pointer';
      
      const getSquareAtPosition = (px: number, py: number) => {
        const boardSizeInternal = stateRef.current.board_size;
        const relativeX = (px - margin) / squareSize;
        const relativeY = (py - margin) / squareSize;
        if (relativeX < 0 || relativeX >= boardSizeInternal || relativeY < 0 || relativeY >= boardSizeInternal) return null;
        
        const col = Math.floor(relativeX);
        const row = boardSizeInternal - 1 - Math.floor(relativeY);
        if ((row + col) % 2 !== 0) return null;
        
        return getIndex(row, col);
      };

      interactionLayer.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
        const pos = interactionLayer.toLocal(e.global);
        const index = getSquareAtPosition(pos.x, pos.y);
        
        // Clicks outside playable squares deselect everything
        if (index === null && selectedRef.current !== null) {
          handlePixiSquareClickRef.current(null);
        }
        
        if (index === null) {
          setContextMenu(null);
          return;
        }

        if (e.button === 2) {
          const canvasRect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
          const scaleX = canvasRect.width / 800;
          const scaleY = canvasRect.height / 800;
          
          // Get screen center of square
          const row = getRow(index);
          const col = getCol(index);
          const vY = margin + (boardSize - 1 - row) * squareSize;
          const vX = margin + col * squareSize;

          setContextMenu({
            x: vX * scaleX + (squareSize * scaleX / 2),
            y: vY * scaleY + (squareSize * scaleY / 2),
            squareIndex: index
          });
          return;
        }

        setContextMenu(null);

        // All interaction logic unified in handlePixiSquareClickRef
        const state = stateRef.current;
        const piece = state?.piece_map[index !== null ? index : -1];
        const isFriendlyPiece = piece && piece.color === state?.turn;

        // Double-click detection for Quantum Mode
        const now = Date.now();
        const isDoubleClick = index !== null && 
                             index === lastClickRef.current.index && 
                             (now - lastClickRef.current.time) < 400; // 400ms threshold for double-tap comfort

        lastClickRef.current = { time: now, index };

        if (isDoubleClick && isFriendlyPiece) {
          if (!isQuantumModeRef.current && !isMergeModeRef.current) {
            // Check for split moves
            const hasSplitMoves = stateRef.current?.possible_moves?.some(
              (m: any) => m.from_index === index && m.to_index1 !== undefined
            );
            // Check for merge moves
            const hasMergeMoves = stateRef.current?.possible_moves?.some(
              (m: any) => m.from_index1 !== undefined && (m.from_index1 === index || m.from_index2 === index)
            );

            if (hasSplitMoves) {
              enterQuantumMode();
              return;
            } else if (hasMergeMoves) {
              enterMergeMode(index);
              return;
            }
          }
        }

        handlePixiSquareClickRef.current(index);
      });

      let swallowNextPointerUp = false;

      interactionLayer.on('pointerup', (e: PIXI.FederatedPointerEvent) => {
        if (swallowNextPointerUp) {
          swallowNextPointerUp = false;
          return;
        }
        if (isQuantumModeRef.current) {
          const pos = interactionLayer.toLocal(e.global);
          const index = getSquareAtPosition(pos.x, pos.y);
          if (index !== null) handleQuantumSquareClickRef.current(index);
        } else if (isMergeModeRef.current) {
          const pos = interactionLayer.toLocal(e.global);
          const index = getSquareAtPosition(pos.x, pos.y);
          if (index !== null) handleMergeDiscoveryClickRef.current(index);
          else exitMergeMode();
        }
      });

      interactionLayer.on('pointermove', () => { 
        // No longer needed for double-click
      });

      app.stage.addChild(interactionLayer);

      const pieceSprites: PIXI.Graphics[] = [];
      const highlightSprites: PIXI.Graphics[] = [];
      const captureSprites: PIXI.Graphics[] = [];
      const quantumHighlightSprites: PIXI.Graphics[] = [];

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
          boardLayer.addChild(sqGfx);

          if (isPlayable) {
            // Quantum target highlight (background purple)
            const qhGfx = new PIXI.Graphics();
            qhGfx.rect(0, 0, squareSize, squareSize);
            qhGfx.fill({ color: COLORS.quantumGlow, alpha: 0.4 });
            qhGfx.x = vX;
            qhGfx.y = vY;
            qhGfx.visible = false;
            quantumLayer.addChild(qhGfx);
            quantumHighlightSprites[index] = qhGfx;
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

        if (isCrowned) {
          // TOTAL REDESIGN: Matching the logo 'Q'
          const primaryColor = isWhite ? COLORS.pieceWhite : 0x818cf8; // Use bright indigo for black queens to be visible
          
          // Double Ring Structure
          gfx.circle(cx, cy, r);
          gfx.stroke({ color: primaryColor, width: r * 0.18 });
          
          gfx.circle(cx, cy, r * 0.72);
          gfx.stroke({ color: primaryColor, width: r * 0.08, alpha: 0.7 });

          // The 'Q' Tail
          const tailLen = r * 0.25;
          const tailAngle = Math.PI / 4; // 45 degrees
          gfx.moveTo(cx + Math.cos(tailAngle) * r * 0.8, cy + Math.sin(tailAngle) * r * 0.8);
          gfx.lineTo(cx + Math.cos(tailAngle) * (r + tailLen), cy + Math.sin(tailAngle) * (r + tailLen));
          // @ts-ignore
          gfx.stroke({ color: primaryColor, width: r * 0.18, cap: 'round' });

          // The Crown inside (Matches logo peaks)
          const crownWidth = r * 0.5;
          const crownHeight = r * 0.35;
          const crownY = cy - r * 0.05;

          gfx.poly([
            cx - crownWidth / 2, crownY + crownHeight / 2, // bottom-left
            cx + crownWidth / 2, crownY + crownHeight / 2, // bottom-right
            cx + crownWidth / 2, crownY - crownHeight / 2, // top-right peak
            cx + crownWidth / 5, crownY - crownHeight / 8, // right valley
            cx, crownY - crownHeight / 2,                  // middle peak
            cx - crownWidth / 5, crownY - crownHeight / 8, // left valley
            cx - crownWidth / 2, crownY - crownHeight / 2, // top-left peak
          ]);
          gfx.fill(primaryColor);

        } else {
          // Standard circular piece body
          // Piece body - outer ring (edge color)
          gfx.circle(cx, cy, r);
          gfx.fill(isWhite ? COLORS.pieceWhiteEdge : COLORS.pieceBlackEdge);

          // Piece body - inner fill
          gfx.circle(cx, cy, r * 0.85);
          gfx.fill(isWhite ? COLORS.pieceWhite : COLORS.pieceBlack);

          // Inner sheen / highlight
          gfx.circle(cx - r * 0.15, cy - r * 0.2, r * 0.45);
          gfx.fill({ color: isWhite ? 0xffffff : 0x5a5a7a, alpha: 0.3 });
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

        const isQuantumMode = isQuantumModeRef.current;
        const time = ticker.lastTime / 1000;

        // Global quantum/merge mode border pulse
        if (globalQuantumGfx) {
          const isActive = isQuantumMode || isMergeMode;
          globalQuantumGfx.visible = isActive;
          if (isActive) {
            const pulse = 0.5 + 0.5 * Math.sin(time * 3);
            globalQuantumGfx.alpha = pulse;
            globalQuantumGfx.stroke({ color: isMergeMode ? COLORS.mergeGlow : COLORS.quantumGlow, width: 4, alpha: pulse });
          }
        }

        // Compute capture pieces
        const hasTakes = state.possible_moves.some((m: any) => m.is_take_move);
        const mustCapturePieces = new Set<number>();
        if (hasTakes) {
          for (const m of state.possible_moves) {
            if ((m as any).is_take_move) mustCapturePieces.add((m as any).from_index);
          }
        }

        for (let i = 0; i < pieceSprites.length; i++) {
          const gfx = pieceSprites[i];
          const hlGfx = highlightSprites[i];
          const capGfx = captureSprites[i];
          const qhGfx = quantumHighlightSprites[i];
          if (!gfx || !hlGfx || !capGfx || !qhGfx) continue;

          const pieceObj = state.piece_map[i];
          const chance = state.chances[i] !== undefined ? state.chances[i] : (pieceObj ? 1.0 : 0.0);
          const isQuantum = chance < 0.99 && chance > 0.01;

          // ─ 1. Piece rendering ─
          if (chance > 0 && pieceObj) {
            gfx.visible = true;
            const isMeasuring = measuringRef.current.includes(i);
            if (isMeasuring) {
              const flickerRate = 12 + 8 * Math.sin(time * 2);
              const flickerAlpha = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(time * flickerRate));
              gfx.alpha = flickerAlpha;
            } else {
              gfx.alpha = isQuantum ? chance : 1.0;
            }
            drawPiece(gfx, pieceObj.color === 0, pieceObj.crowned, sel === i, isQuantum, chance, time);
          } else {
            gfx.visible = false;
          }

          // ─ 2. Classical target highlight (green dot) ─
          let isTarget = false;
          if (sel !== null && !isQuantumMode) {
            isTarget = state.possible_moves.some((m: any) => m.from_index === sel && m.to_index === i);
          }
          hlGfx.visible = isTarget;

          // ─ 3. Capture square highlight OR measurement animation ─
          const isMeasuring = measuringRef.current.includes(i);
          if (isMeasuring) {
            capGfx.visible = true;
            capGfx.clear();
            const cx = squareSize / 2;
            const cy = squareSize / 2;
            const ringProgress = (time * 2) % 1;
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

          // ─ 4. Entanglement highlight (context menu) ─
          const ctxMenu = contextMenuRef.current;
          if (ctxMenu && state.quantum_states) {
            const ctxSq = ctxMenu.squareIndex;
            const isEntangled = state.quantum_states.some((qs: any) =>
              qs.squares.includes(ctxSq) && qs.squares.includes(i) && ctxSq !== i
            );
            if (isEntangled) {
              const ePulse = 0.4 + 0.4 * Math.sin(time * 3);
              capGfx.visible = true;
              capGfx.clear();
              capGfx.rect(2, 2, squareSize - 4, squareSize - 4);
              capGfx.stroke({ color: COLORS.quantumGlow, width: 3, alpha: ePulse });
              capGfx.fill({ color: COLORS.quantumGlow, alpha: 0.1 });
            }
          }

          // ─ 5. Quantum/Merge target highlights ─
          const firstTarget = splitFirstTargetRef.current;
          const isPotentialSplitTarget = isQuantumMode && sel !== null && state.possible_moves.some(
            (m: any) => m.from_index === sel && m.to_index1 !== undefined &&
              (m.to_index1 === i || m.to_index2 === i)
          );

          const mFirst = mergeFirstRef.current;
          const mSecond = mergeSecondRef.current;
          const isMergePartner = isMergeMode && mFirst !== null && state.possible_moves.some(
            (m: any) => m.from_index1 !== undefined && 
              ((m.from_index1 === mFirst && m.from_index2 === i) || 
               (m.from_index2 === mFirst && m.from_index1 === i))
          );
          const isMergeDestination = isMergeMode && mFirst !== null && mSecond !== null && state.possible_moves.some(
            (m: any) => m.from_index1 !== undefined && 
              ((m.from_index1 === mFirst && m.from_index2 === mSecond) || 
               (m.from_index2 === mFirst && m.from_index1 === mSecond)) &&
              m.to_index === i
          );

          if (isPotentialSplitTarget) {
            qhGfx.visible = true;
            const isFirst = firstTarget === i;
            const pulse = 0.6 + 0.4 * Math.sin(time * 6);
            const baseAlpha = isFirst ? 0.9 : 0.55;

            qhGfx.clear();
            qhGfx.rect(2, 2, squareSize - 4, squareSize - 4);
            qhGfx.fill({ color: COLORS.quantumGlow, alpha: baseAlpha * (isFirst ? 1.0 : pulse) });

            if (isFirst) {
              qhGfx.stroke({ color: 0xffffff, width: 3, alpha: 0.8 });
            } else {
              qhGfx.stroke({ color: COLORS.quantumGlow, width: 2, alpha: 0.4 * pulse });
            }
          } else if (isMergePartner || isMergeDestination || mFirst === i) {
            qhGfx.visible = true;
            qhGfx.clear();
            qhGfx.rect(2, 2, squareSize - 4, squareSize - 4);
            
            const pulse = 0.7 + 0.3 * Math.sin(time * 5);
            if (mFirst === i) {
              qhGfx.fill({ color: COLORS.mergeGlow, alpha: 0.4 });
              qhGfx.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });
            } else if (isMergePartner) {
              const baseAlpha = (mSecond === i) ? 0.9 : 0.5;
              qhGfx.fill({ color: COLORS.mergeGlow, alpha: baseAlpha * pulse });
              if (mSecond === i) qhGfx.stroke({ color: 0xffffff, width: 3, alpha: 0.9 });
            } else if (isMergeDestination) {
              qhGfx.fill({ color: 0xffffff, alpha: 0.2 * pulse });
              qhGfx.stroke({ color: COLORS.mergeGlow, width: 4, alpha: 0.9 * pulse });
              
              // Draw a little 'plus' or diamond inside destination
              const cx = squareSize / 2;
              const cy = squareSize / 2;
              const ds = squareSize * 0.2;
              qhGfx.moveTo(cx - ds, cy);
              qhGfx.lineTo(cx + ds, cy);
              qhGfx.moveTo(cx, cy - ds);
              qhGfx.lineTo(cx, cy + ds);
              qhGfx.stroke({ color: COLORS.mergeGlow, width: 3 });
            }
          } else {
            qhGfx.visible = false;
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


  // ─── Merge overlays (Deprecated, using Pixi) ───

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
      onClick={(e) => { e.stopPropagation(); if (contextMenu) setContextMenu(null); }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {overlays}
      {isQuantumMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-purple-950/95 border border-purple-500/40 text-purple-200 px-4 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
          <span>⚛</span>
          <span>{splitFirstTarget === null ? 'Quantum mode — tap first target' : 'Now tap the second target'}</span>
          <button
            className="ml-1 text-purple-400 hover:text-white transition-colors p-1"
            onClick={(e) => { e.stopPropagation(); exitQuantumMode(); setSelectedPiece(null); }}
          >✕</button>
        </div>
      )}
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
