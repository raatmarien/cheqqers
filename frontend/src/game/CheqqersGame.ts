import { QuantumEntity, EntanglementEngine, Operations, JointQuantumSystem } from 'quantum-game-engine';

export const PieceColor = {
    WHITE: 0,
    BLACK: 1
} as const;
export type PieceColor = typeof PieceColor[keyof typeof PieceColor];

export const GameState = {
    IN_PROGRESS: 0,
    WHITE_WON: 1,
    BLACK_WON: 2,
    DRAW: 3
} as const;
export type GameState = typeof GameState[keyof typeof GameState];

export const GameType = {
    CLASSIC: 0,
    SUPERPOSITION: 1,
    ENTANGLEMENT: 2,
    INTERFERENCE: 3
} as const;
export type GameType = typeof GameType[keyof typeof GameType];

export const SquareState = {
    EMPTY: 0,
    OCCUPIED: 1
} as const;
export type SquareState = typeof SquareState[keyof typeof SquareState];

export interface ClassicalMove {
    from_index: number;
    to_index: number;
    is_take_move: boolean;
}

export interface SplitMove {
    from_index: number;
    to_index1: number;
    to_index2: number;
}

export interface MergeMove {
    from_index1: number;
    from_index2: number;
    to_index: number;
}

export type Move = ClassicalMove | SplitMove | MergeMove;

export interface QuantumStateInfo {
    type: 'independent' | 'entangled';
    squares: number[];
    amplitudes: { state: string, re: number, im: number }[];
}

export type HistoryEntry = string;

export interface GameStateObject {
    board_size: number;
    turn: number;
    game_state: number;
    game_type: number;
    classic_occupancy: number[];
    piece_map: Record<number, { color: number, crowned: boolean, pieceIds: number[] } | null>;
    next_piece_id: number;
    jumped_piece_ids_this_turn: number[];
    possible_moves: Move[];
    chances: Record<number, number>;
    move_history: HistoryEntry[];
    init_params: any;
    quantum_states: QuantumStateInfo[];
}

export class CheqqersGame {
    boardSize: number;
    gameType: GameType;
    turn: PieceColor;
    startRows: number;

    squares: QuantumEntity[];
    pieceProperties: Record<number, { color: PieceColor, crowned: boolean, pieceIds: number[] } | null>;

    nextPieceId: number = 1;
    jumpedPieceIdsThisTurn: number[] = [];

    movesSinceTake: number = 0;
    multiJumpSquare: number | null = null;  // Track piece mid-multi-jump chain
    private justCrowned: boolean = false;

    // Draw rule tracking
    private stateHistory: Map<string, number> = new Map(); // hash -> count
    private consecutiveKingMoves: number = 0;
    private specialEndgameMoves: number = 0; // Moves for 16-move and 5-move rules
    private endgameRuleActive: '16' | '5' | null = null;
    private _isCalculatingDepth: boolean = false;
    public disableDepthCalculation: boolean = false;
    public forceAllMoves: boolean = false;

    private _state: GameState = GameState.IN_PROGRESS;
    public get state(): GameState { return this._state; }
    public set state(val: GameState) {
        if (this._state !== val) {
            console.log(`[STATE_CHANGE] Turn: ${this.turn}, from ${this._state} to ${val}`);
            // Use an Error to get a stack trace!
            console.log(new Error().stack);
            this._state = val;
        }
    }

    moveHistory: HistoryEntry[] = [];
    initParams: any;



    constructor(size: number = 8, startRows: number = 3, gameType: GameType = GameType.INTERFERENCE) {
        this.boardSize = size;
        this.gameType = gameType;
        this.startRows = startRows;
        this.turn = PieceColor.WHITE;

        this.initParams = { type: 'standard', size, startRows, gameType };

        this.squares = [];
        this.pieceProperties = {};
        const totalSquares = Math.floor((size * size) / 2);

        for (let i = 0; i < totalSquares; i++) {
            this.squares.push(new QuantumEntity({ dimension: 2, initialState: SquareState.EMPTY }));
            this.pieceProperties[i] = null;
        }

        this.setupStartingPositions(startRows);
    }

    private setupStartingPositions(startRows: number) {
        const totalSquares = Math.floor((this.boardSize * this.boardSize) / 2);
        const squaresPerRow = Math.floor(this.boardSize / 2);

        // White pieces at the bottom (indices start at 0 -> row 0)
        for (let i = 0; i < startRows * squaresPerRow; i++) {
            this.squares[i].apply(Operations.Shift(SquareState.OCCUPIED));
            this.pieceProperties[i] = { color: PieceColor.WHITE, crowned: false, pieceIds: [this.nextPieceId++] };
        }

        // Black pieces at the top
        for (let i = totalSquares - (startRows * squaresPerRow); i < totalSquares; i++) {
            this.squares[i].apply(Operations.Shift(SquareState.OCCUPIED));
            this.pieceProperties[i] = { color: PieceColor.BLACK, crowned: false, pieceIds: [this.nextPieceId++] };
        }
    }

    public setupPuzzle(puzzleData: any) {
        this.initParams = { type: 'puzzle', data: puzzleData };
        this.boardSize = puzzleData.board_size;
        this.gameType = puzzleData.game_type;
        this.turn = puzzleData.turn;

        this.squares = [];
        this.pieceProperties = {};
        const totalSquares = Math.floor((this.boardSize * this.boardSize) / 2);
        for (let i = 0; i < totalSquares; i++) {
            this.squares.push(new QuantumEntity({ dimension: 2, initialState: SquareState.EMPTY }));
            this.pieceProperties[i] = null;
        }

        for (const placement of puzzleData.pieces) {
            const pieceId = this.nextPieceId++;
            if (placement.superposition && placement.superposition.length > 0) {
                // Determine probability based on number of superposition states
                const numBranches = placement.superposition.length;

                // Set up the first index with full state
                this.squares[placement.superposition[0]].apply(Operations.Shift(SquareState.OCCUPIED));
                this.pieceProperties[placement.superposition[0]] = {
                    color: placement.color === PieceColor.WHITE ? PieceColor.WHITE : PieceColor.BLACK,
                    crowned: placement.crowned || false,
                    pieceIds: [pieceId]
                };

                // For subsequent indices, we simulate a split from the first index
                // Note: For a proper FTUE merge, we just need them to be entangled or at least 
                // have probability amplitudes. Actually, Cheqqers merge logic requires 
                // the pieces to be in the same JointQuantumSystem.
                if (numBranches === 2) {
                    const idx1 = placement.superposition[0];
                    const idx2 = placement.superposition[1];
                    const sq1 = this.squares[idx1];
                    const sq2 = this.squares[idx2];

                    // Create an empty state for sq2
                    sq2.apply(Operations.Shift(SquareState.EMPTY));

                    // Entangle them so exactly one is occupied
                    const getJoint = (f: number, t: number) => f * 2 + t;
                    const transitions: { from: number, to: number, amplitude: { re: number, im: number } }[] = [];

                    // from: sq1=1, sq2=0 -> to: sq1=1,sq2=0 (50%) OR sq1=0,sq2=1 (50%)
                    const rad = 1 / Math.sqrt(2);
                    transitions.push({ from: getJoint(1, 0), to: getJoint(1, 0), amplitude: { re: rad, im: 0 } });
                    transitions.push({ from: getJoint(1, 0), to: getJoint(0, 1), amplitude: { re: rad, im: 0 } });

                    EntanglementEngine.interactMany([sq1, sq2], Operations.SparseTransition(transitions));

                    this.pieceProperties[idx2] = {
                        color: placement.color === PieceColor.WHITE ? PieceColor.WHITE : PieceColor.BLACK,
                        crowned: placement.crowned || false,
                        pieceIds: [pieceId]
                    };
                }
            } else if (placement.index !== undefined) {
                this.squares[placement.index].apply(Operations.Shift(SquareState.OCCUPIED));
                this.pieceProperties[placement.index] = {
                    color: placement.color === PieceColor.WHITE ? PieceColor.WHITE : PieceColor.BLACK,
                    crowned: placement.crowned || false,
                    pieceIds: [pieceId]
                };
            }
        }

        // Initial state hash for Threefold Repetition rule
        this.movesSinceTake = 0;
        this.multiJumpSquare = null;
        this.consecutiveKingMoves = 0;
        this.stateHistory.clear();
        const initialHash = this.getBoardStateHash();
        this.stateHistory.set(initialHash, 1);
    }

    public getIndex(col: number, row: number): number {
        return Math.floor((col + (row * this.boardSize)) / 2);
    }

    public getRowColFromIndex(index: number) {
        const squaresPerRow = Math.floor(this.boardSize / 2);
        const row = Math.floor(index / squaresPerRow);
        const isRowEven = row % 2 === 0;
        const colInRow = index % squaresPerRow;
        const col = isRowEven ? (colInRow * 2) : (colInRow * 2) + 1;
        return { col, row };
    }

    public getPossibleMoves(skipDepthCalculation: boolean = false): Move[] {
        // If mid-multi-jump, only allow captures from the jumping piece
        if (this.multiJumpSquare !== null) {
            return this.findMoves(true, this.multiJumpSquare);
        }

        const takeMoves = this.getTakeMoves();
        if (takeMoves.length > 0) {
            // Apply "Longest Path" rule if there's a choice between different capture lengths
            if (!skipDepthCalculation && !this.forceAllMoves && !this._isCalculatingDepth && !this.disableDepthCalculation && takeMoves.length > 1) {
                this._isCalculatingDepth = true;
                try {
                    const currentState = {
                        board_size: this.boardSize,
                        game_type: this.gameType,
                        turn: this.turn,
                        next_piece_id: this.nextPieceId,
                        jumped_piece_ids_this_turn: this.jumpedPieceIdsThisTurn,
                        piece_map: this.getMinimalPieceMap()
                    };
                    // Map each move to its maximum possible depth
                    const moveDepths = takeMoves.map(m => {
                        const d = this.calculateMaxCaptureDepth(currentState, m as ClassicalMove);
                        console.log(`[getPossibleMoves] Move ${CheqqersGame.encodeMoveNotation(m)} has depth ${d}`);
                        return d;
                    });
                    const maxDepth = Math.max(...moveDepths);
                    console.log(`[getPossibleMoves] maxDepth=${maxDepth}`);
                    return takeMoves.filter((_, i) => moveDepths[i] === maxDepth);
                } finally {
                    this._isCalculatingDepth = false;
                }
            }
            return takeMoves;
        }

        const standardMoves = this.getStandardMoves();

        if (this.gameType === GameType.CLASSIC) {
            return standardMoves.filter(m => !('to_index1' in m) && !('from_index1' in m));
        }
        if (this.gameType === GameType.SUPERPOSITION || this.gameType === GameType.ENTANGLEMENT) {
            return standardMoves.filter(m => !('from_index1' in m));
        }

        return standardMoves;
    }

    private getTakeMoves(): Move[] {
        return this.findMoves(true);
    }

    private getStandardMoves(): Move[] {
        const moves = this.findMoves(false);
        const splitsAndMerges = this.findSplitAndMergeMoves(moves);
        return [...moves, ...splitsAndMerges];
    }

    private findMoves(isTake: boolean, restrictToSquareIndex?: number): Move[] {
        const moves: Move[] = [];
        const squareProbs = this.squares.map(sq => sq.getProbabilities());
        const forwardDirection = this.turn === PieceColor.WHITE ? 1 : -1;

        console.log(`[findMoves] Start: turn=${this.turn}, isTake=${isTake}`);

        for (let i = 0; i < this.squares.length; i++) {
            if (restrictToSquareIndex !== undefined && i !== restrictToSquareIndex) continue;

            const probs = squareProbs[i];
            const isOccupiedProb = probs[SquareState.OCCUPIED] || 0;
            if (isOccupiedProb === 0) continue;

            const pieceProp = this.pieceProperties[i];
            if (!pieceProp || pieceProp.color !== this.turn) continue;

            const canMoveBackwards = pieceProp.crowned;

            const { col: startX, row: startY } = this.getRowColFromIndex(i);

            const directions = [
                { dx: -1, dy: 1 },
                { dx: 1, dy: 1 },
                { dx: -1, dy: -1 },
                { dx: 1, dy: -1 }
            ];

            for (const { dx, dy } of directions) {
                if (!isTake && !canMoveBackwards && dy !== forwardDirection) continue;

                let curX = startX;
                let curY = startY;
                let foundEnemySquareIndex = -1;
                let squaresSurpassed = 0;

                while (true) {
                    curX += dx;
                    curY += dy;
                    squaresSurpassed++;

                    if (curX < 0 || curX >= this.boardSize || curY < 0 || curY >= this.boardSize) break;
                    if ((curX + curY) % 2 !== 0) break;

                    const curIndex = this.getIndex(curX, curY);
                    const curProbs = squareProbs[curIndex];
                    const curOccupiedProb = curProbs[SquareState.OCCUPIED] || 0;
                    const isEmpty = curOccupiedProb < 1;
                    const isOccupied = curOccupiedProb > 0;

                    const curPieceProp = this.pieceProperties[curIndex];
                    const isEnemy = isOccupied && curPieceProp && curPieceProp.color !== this.turn;
                    const isFriendly = isOccupied && curPieceProp && curPieceProp.color === this.turn;

                    // A square is a valid landing target if it has ANY probability of being empty
                    const hasEmptyChance = (curProbs[SquareState.EMPTY] || 0) > 0.001;

                    if (isTake) {
                        if (foundEnemySquareIndex === -1) {
                            if (isFriendly) {
                                break;
                            }
                            if (isEnemy) {
                                // If this enemy shares a pieceId with someone we already jumped this turn,
                                // we CANNOT jump it again! It's like jumping our own tail. Stop searching this ray.
                                const sharesId = curPieceProp.pieceIds?.some(id => this.jumpedPieceIdsThisTurn.includes(id));
                                if (sharesId) break;

                                foundEnemySquareIndex = curIndex;
                            } else if (isEmpty) {
                                if (!canMoveBackwards) break;
                            }
                        } else {
                            if (hasEmptyChance) {
                                moves.push({
                                    is_take_move: true,
                                    from_index: i,
                                    to_index: curIndex
                                } as ClassicalMove);
                                if (!canMoveBackwards) break;
                            } else {
                                break;
                            }
                        }
                    } else {
                        if (hasEmptyChance) {
                            moves.push({
                                is_take_move: false,
                                from_index: i,
                                to_index: curIndex
                            } as ClassicalMove);
                            if (!canMoveBackwards) break;
                        } else {
                            break;
                        }
                    }
                }
            }
        }

        if (restrictToSquareIndex !== undefined) {
            console.log(`[findMoves] restricted to ${restrictToSquareIndex}, found ${moves.length} moves. turn=${this.turn}`);
        }
        return moves;
    }

    private calculateMaxCaptureDepth(state: { 
        board_size: number, 
        game_type: GameType, 
        turn: PieceColor, 
        next_piece_id: number, 
        jumped_piece_ids_this_turn: number[],
        piece_map: (null | { color: number, crowned: boolean, pieceIds: number[] })[]
    }, initialMove: ClassicalMove): number {
        // Create a scratch game to simulate the move sequence
        const game = new CheqqersGame(state.board_size, 0, state.game_type as any);
        game.disableDepthCalculation = true;
        // Minimal setup for simulation
        game.turn = state.turn as any;
        game.nextPieceId = state.next_piece_id;
        game.jumpedPieceIdsThisTurn = [...state.jumped_piece_ids_this_turn];
        
        // Populate pieces
        for (let idx = 0; idx < state.piece_map.length; idx++) {
            const prop = state.piece_map[idx];
            if (prop) {
                game.squares[idx].apply(Operations.Shift(SquareState.OCCUPIED));
                game.pieceProperties[idx] = { 
                    color: prop.color as any,
                    crowned: prop.crowned,
                    pieceIds: [...prop.pieceIds]
                };
            }
        }

        // Find and apply the initial move
        const moves = game.getPossibleMoves(true);
        const moveIdx = moves.findIndex(m => 
            'from_index' in m && !('to_index1' in m) && (m as ClassicalMove).from_index === initialMove.from_index && (m as ClassicalMove).to_index === initialMove.to_index
        );
        
        if (moveIdx === -1) return 1;

        game.applyMove(moveIdx);
        
        // If it's not a multi-jump continuation, we're done with this piece for this "path"
        if (game.multiJumpSquare === null) return 1;
        
        // Recursive exploration of further jumps
        const nextMoves = game.getPossibleMoves(true);
        if (nextMoves.length === 0) return 1;

        const nextState = {
            board_size: game.boardSize,
            game_type: game.gameType,
            turn: game.turn,
            next_piece_id: game.nextPieceId,
            jumped_piece_ids_this_turn: game.jumpedPieceIdsThisTurn,
            piece_map: game.getMinimalPieceMap()
        };

        const nextDepths = nextMoves.map(nm => this.calculateMaxCaptureDepth(nextState, nm as ClassicalMove));
        return 1 + Math.max(0, ...nextDepths);
    }

    private getMinimalPieceMap() {
        const map: (null | { color: number, crowned: boolean, pieceIds: number[] })[] = new Array(this.squares.length).fill(null);
        for (let i = 0; i < this.squares.length; i++) {
            const probs = this.squares[i].getProbabilities();
            if ((probs[SquareState.OCCUPIED] || 0) > 0.001 && this.pieceProperties[i]) {
                map[i] = {
                    color: this.pieceProperties[i]!.color,
                    crowned: this.pieceProperties[i]!.crowned,
                    pieceIds: this.pieceProperties[i]!.pieceIds
                };
            }
        }
        return map;
    }

    private findSplitAndMergeMoves(classicalMoves: Move[]): Move[] {
        const splitMoves: SplitMove[] = [];
        const mergeMoves: MergeMove[] = [];
        const moves = classicalMoves as ClassicalMove[];

        for (let i = 0; i < moves.length; i++) {
            for (let j = i + 1; j < moves.length; j++) {
                if (moves[i].from_index === moves[j].from_index && moves[i].to_index !== moves[j].to_index) {
                    if (!splitMoves.some(sm => sm.from_index === moves[i].from_index &&
                        ((sm.to_index1 === moves[i].to_index && sm.to_index2 === moves[j].to_index) ||
                            (sm.to_index1 === moves[j].to_index && sm.to_index2 === moves[i].to_index)))) {
                        splitMoves.push({
                            from_index: moves[i].from_index,
                            to_index1: moves[i].to_index,
                            to_index2: moves[j].to_index
                        });
                    }
                }
            }
        }

        for (let i = 0; i < moves.length; i++) {
            for (let j = i + 1; j < moves.length; j++) {
                if (moves[i].to_index === moves[j].to_index && moves[i].from_index !== moves[j].from_index) {
                    // Only allow merges if both source pieces are in superposition
                    const occ1 = this.squares[moves[i].from_index].getProbabilities()[SquareState.OCCUPIED] || 0;
                    const occ2 = this.squares[moves[j].from_index].getProbabilities()[SquareState.OCCUPIED] || 0;
                    if (occ1 > 0.99 || occ2 > 0.99) continue;

                    if (!mergeMoves.some(mm => mm.to_index === moves[i].to_index &&
                        ((mm.from_index1 === moves[i].from_index && mm.from_index2 === moves[j].from_index) ||
                            (mm.from_index1 === moves[j].from_index && mm.from_index2 === moves[i].from_index)))) {
                        mergeMoves.push({
                            from_index1: moves[i].from_index,
                            from_index2: moves[j].from_index,
                            to_index: moves[i].to_index
                        });
                    }
                }
            }
        }

        return [...splitMoves, ...mergeMoves];
    }

    /** Get all squares that should be measured or are involved in landing for any move type.
     * Returns a list of objects with index and role ('landing' | 'jumped') */
    public getInvolvedSquares(move: Move): { index: number, role: 'landing' | 'jumped' }[] {
        const result: { index: number, role: 'landing' | 'jumped' }[] = [];
        if ('to_index1' in move && 'to_index2' in move) {
            // Split move
            const sm = move as SplitMove;
            result.push({ index: sm.to_index1, role: 'landing' }, { index: sm.to_index2, role: 'landing' });
        } else if ('from_index1' in move && 'from_index2' in move) {
            // Merge move
            result.push({ index: (move as MergeMove).to_index, role: 'landing' });
        } else {
            // Classical or take move
            const cm = move as ClassicalMove;
            result.push({ index: cm.to_index, role: 'landing' });

            if (cm.is_take_move) {
                // Find the square that was jumped over
                const { col: fC, row: fR } = this.getRowColFromIndex(cm.from_index);
                const { col: tC, row: tR } = this.getRowColFromIndex(cm.to_index);
                const dx = tC > fC ? 1 : -1;
                const dy = tR > fR ? 1 : -1;

                for (let step = 1; step < Math.abs(tC - fC); step++) {
                    const checkC = fC + (step * dx);
                    const checkR = fR + (step * dy);
                    const checkIdx = this.getIndex(checkC, checkR);

                    const p = this.squares[checkIdx].getProbabilities();
                    const emptyProb = p[SquareState.EMPTY] || 0;
                    if (emptyProb < 0.999) {
                        result.push({ index: checkIdx, role: 'jumped' });
                        break;
                    }
                }
            }
        }
        return result;
    }

    public static encodeMoveNotation(move: Move): string {
        const sq = (index: number) => String(index + 1);
        if ('is_take_move' in move && move.is_take_move) {
            return `${sq((move as ClassicalMove).from_index)}x${sq((move as ClassicalMove).to_index)}`;
        } else if ('to_index1' in move && 'to_index2' in move) {
            const sm = move as SplitMove;
            const sorted = [sm.to_index1, sm.to_index2].sort((a, b) => a - b);
            return `${sq(sm.from_index)}-${sq(sorted[0])}^${sq(sorted[1])}`;
        } else if ('from_index1' in move && 'from_index2' in move) {
            const mm = move as MergeMove;
            const sorted = [mm.from_index1, mm.from_index2].sort((a, b) => a - b);
            return `${sq(sorted[0])}^${sq(sorted[1])}-${sq(mm.to_index)}`;
        } else {
            return `${sq((move as ClassicalMove).from_index)}-${sq((move as ClassicalMove).to_index)}`;
        }
    }

    private getBoardStateHash(): string {
        // Build a deterministic string representing the board state
        // Includes: piece positions, colors, crowning, turn, and quantum amplitudes (rounded)
        const parts: string[] = [];
        parts.push(`T:${this.turn}`);

        for (let i = 0; i < this.squares.length; i++) {
            const props = this.pieceProperties[i];
            const probs = this.squares[i].getProbabilities();
            const occ = probs[SquareState.OCCUPIED] || 0;

            if (occ > 0.0001) {
                const color = props?.color === PieceColor.WHITE ? 'W' : 'B';
                const crowned = props?.crowned ? 'K' : 'M';
                // Round probability to avoid floating point jitter in hashes
                const probStr = occ > 0.9999 ? '1' : occ.toFixed(3);
                parts.push(`${i}${color}${crowned}${probStr}`);
            }
        }

        const hash = parts.join('|');
        console.log(`[getBoardStateHash] hash=${hash}`);
        return hash;
    }

    public applyMove(moveIndex: number, replayForcedMeasurements?: number[]) {
        const moves = this.getPossibleMoves();
        const move = moves[moveIndex];
        if (!move) return;

        const fromIdxBefore = ('from_index' in move) ? (move as ClassicalMove).from_index : 
                             (('from_index1' in move) ? (move as MergeMove).from_index1 : -1);
        const pieceBefore = fromIdxBefore !== -1 ? this.pieceProperties[fromIdxBefore] : null;

        const forcedMeasurementOutcomes: number[] = [];
        let replayMeasurementIndex = 0;

        try {
            this.justCrowned = false;

            // Forced measurement: if any landing or jumped square is in superposition, measure it.
            // Level 2 (Entanglement) and above allow interacting with ghosts directly.
            const measurementSquares = this.getInvolvedSquares(move);
            let moveFailed = false;

            const shouldForceMeasure = this.gameType === GameType.SUPERPOSITION;

            if (shouldForceMeasure) {
                for (const { index: sqIdx, role } of measurementSquares) {
                    const occ = this.squares[sqIdx].getProbabilities()[SquareState.OCCUPIED] || 0;
                    if (occ > 0.001 && occ < 0.999) {
                    console.log(`[forcedMeasure] Square ${sqIdx} (${role}) has ${(occ * 100).toFixed(0)}% occupancy, measuring...`);

                    const forcedOutcome = replayForcedMeasurements?.[replayMeasurementIndex];
                    if (forcedOutcome !== undefined) replayMeasurementIndex++;

                    const result = this.measureSquare(sqIdx, forcedOutcome);
                    forcedMeasurementOutcomes.push(result);

                    if (role === 'landing' && result === SquareState.OCCUPIED) {
                        console.log(`[forcedMeasure] Landing square ${sqIdx} measured as OCCUPIED — move fails!`);
                        moveFailed = true;
                        break;
                    } else if (role === 'jumped' && result === SquareState.EMPTY) {
                        console.log(`[forcedMeasure] Jumped square ${sqIdx} measured as EMPTY — move fails (nothing to jump)!`);
                        moveFailed = true;
                        break;
                    }
                }
            }
        }

            if (moveFailed) {
                // Move fails: turn switches as penalty
                this.turn = this.turn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
                this.multiJumpSquare = null;
                this.jumpedPieceIdsThisTurn = [];
                this.cleanupPieceProperties();
                this.disentangleCollapsedEntities();
                this.debugDumpState(`After failed move ${moveIndex} (forced measurement)`);
                this.checkWinStates();
            } else {

                if ('is_take_move' in move && move.is_take_move) {
                    this.applyTakeMove(move as ClassicalMove, replayForcedMeasurements);
                } else if ('to_index1' in move && 'to_index2' in move) {
                    this.applySplitMove(move as SplitMove);
                } else if ('from_index1' in move && 'from_index2' in move) {
                    this.applyMergeMove(move as MergeMove);
                } else {
                    this.applyClassicalMove(move as ClassicalMove);
                }

                this.applyPhasePass();

                // CRITICAL FIX: Cleanup piece properties and disentangle BEFORE checking for further takes.
                // This ensures that 'findMoves(true, landingSquare)' sees an accurate piece map (excluding 0% occupancy pieces).
                this.cleanupPieceProperties();
                this.disentangleCollapsedEntities();

                if (!('is_take_move' in move && move.is_take_move)) {
                    // Check if a piece that can NOT be a king was moved (i.e. a pawn)
                    // If a pawn moves, the game is irreversible, so we clear state history
                    if (!pieceBefore?.crowned) {
                        this.stateHistory.clear();
                        this.consecutiveKingMoves = 0;
                    } else {
                        this.consecutiveKingMoves += 1;
                    }

                    this.turn = this.turn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
                    this.multiJumpSquare = null;
                    this.jumpedPieceIdsThisTurn = [];
                    this.movesSinceTake += 1;
                } else {
                    this.movesSinceTake = 0;
                    this.consecutiveKingMoves = 0;
                    this.stateHistory.clear(); // Capture is irreversible
                    let classicalLandingSquare = ('to_index' in move) ? move.to_index : null;
                    let canTakeAgain = false;

                    if (classicalLandingSquare !== null && !this.justCrowned) {
                        const furtherTakes = this.findMoves(true, classicalLandingSquare);
                        if (furtherTakes.length > 0) {
                            canTakeAgain = true;
                        }
                    }

                    if (!canTakeAgain) {
                        this.turn = this.turn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
                        this.multiJumpSquare = null;
                        this.jumpedPieceIdsThisTurn = [];
                    } else {
                        this.multiJumpSquare = classicalLandingSquare;
                    }
                }

                this.debugDumpState(`After move ${moveIndex}`);
                this.checkWinStates();

            } // end of !moveFailed
        } catch (e) {
            console.error("Move application error", e);
        }

        let notation = CheqqersGame.encodeMoveNotation(move);
        if (forcedMeasurementOutcomes.length > 0) {
            notation += `;M:${forcedMeasurementOutcomes.join(',')}`;
        }
        this.moveHistory.push(notation);
    }

    /** Measure a specific square, collapsing its quantum state.
     *  Returns the outcome (SquareState) for history recording.
     *  If forcedOutcome is provided, collapse directly to that state (for replay). */
    public measureSquare(squareIndex: number, forcedOutcome?: number): number {
        const sq = this.squares[squareIndex];
        if (!sq) return SquareState.EMPTY;

        console.log(`[measureSquare] Square ${squareIndex}, hasSystem: ${!!sq.entangledSystem}, forcedOutcome: ${forcedOutcome}`);

        let result: number = SquareState.EMPTY;

        // Only measure if it's actually in a superposition or entangled system
        if (sq.entangledSystem) {
            const sys = sq.entangledSystem;
            console.log(`[measureSquare] System entities: [${sys.entities.map((e: any) => this.squares.indexOf(e)).join(', ')}]`);
            console.log(`[measureSquare] Joint amps before:`, JSON.stringify(sys.jointAmplitudes));

            // Use forcedOutcome if provided, otherwise let the engine decide probabilistically
            result = sq.entangledSystem.measureTarget(sq, forcedOutcome);

            console.log(`[measureSquare] Measurement result: ${result}`);
            console.log(`[measureSquare] Joint amps after:`, JSON.stringify(sys.jointAmplitudes));

            // Log probabilities of all entities in the system after measurement
            for (const entity of sys.entities) {
                const sqIdx = this.squares.indexOf(entity);
                const probs = sys.getTargetProbabilities(entity);
                console.log(`[measureSquare]   sq[${sqIdx}] probs: ${JSON.stringify(probs)}`);
            }
        } else if (sq.amplitudes) {
            // Independent entity
            result = sq.measure(forcedOutcome);
        }

        // Clean up after measurement
        this.disentangleCollapsedEntities();
        this.cleanupPieceProperties();
        this.debugDumpState(`After measuring square ${squareIndex}`);

        return result;
    }

    private debugDumpState(label: string) {
        console.log(`\n[DEBUG] === ${label} === Turn: ${this.turn === 0 ? 'WHITE' : 'BLACK'}`);
        for (let i = 0; i < this.squares.length; i++) {
            const sq = this.squares[i];
            const probs = sq.getProbabilities();
            const occ = probs[SquareState.OCCUPIED] || 0;
            const prop = this.pieceProperties[i];
            const entangled = sq.entangledSystem ? `entangled(${sq.entangledSystem.entities.length} entities)` : 'independent';
            if (occ > 0.001 || prop) {
                console.log(`  sq[${i}]: occ=${occ.toFixed(4)} prop=${prop ? (prop.color === 0 ? 'W' : 'B') + (prop.crowned ? '+K' : '') : 'null'} ${entangled}`);
            }
        }
        const moves = this.getPossibleMoves();
        console.log(`  Possible moves (${moves.length}):`);
        for (let j = 0; j < moves.length; j++) {
            const m = moves[j] as any;
            if (m.to_index1 !== undefined) {
                console.log(`    [${j}] SPLIT ${m.from_index} -> ${m.to_index1} & ${m.to_index2}`);
            } else if (m.from_index1 !== undefined) {
                console.log(`    [${j}] MERGE ${m.from_index1}+${m.from_index2} -> ${m.to_index}`);
            } else {
                console.log(`    [${j}] ${m.is_take_move ? 'TAKE' : 'MOVE'} ${m.from_index} -> ${m.to_index}`);
            }
        }
    }

    private disentangleCollapsedEntities() {
        const processedSystems = new Set<JointQuantumSystem>();

        for (const sq of this.squares) {
            if (!sq.entangledSystem || processedSystems.has(sq.entangledSystem)) continue;
            const sys = sq.entangledSystem;
            processedSystems.add(sys);

            // Check if every entity in the system is in a definite state
            const definiteStates: Map<QuantumEntity, number> = new Map();
            let allDefinite = true;

            for (const entity of sys.entities) {
                const probs = sys.getTargetProbabilities(entity);
                let definiteState: number | null = null;

                for (const [stateStr, prob] of Object.entries(probs)) {
                    if ((prob as number) > 0.999) {
                        definiteState = parseInt(stateStr);
                        break;
                    }
                }

                if (definiteState !== null) {
                    definiteStates.set(entity, definiteState);
                } else {
                    allDefinite = false;
                }
            }

            if (allDefinite) {
                // ALL entities are definite — dissolve the entire system
                for (const entity of sys.entities) {
                    const state = definiteStates.get(entity)!;
                    entity.entangledSystem = undefined;
                    entity.amplitudes = { [state]: { re: 1, im: 0 } };
                }
            } else {
                // Factor out individual definite entities from the system
                for (const [entity, state] of definiteStates) {
                    entity.entangledSystem = undefined;
                    entity.amplitudes = { [state]: { re: 1, im: 0 } };
                    // Remove from the system's entity list and rebuild
                    const idx = sys.entities.indexOf(entity);
                    if (idx !== -1) {
                        // Rebuild the joint system without this entity
                        this.factorOutEntity(sys, idx, state);
                    }
                }
            }
        }
    }

    private factorOutEntity(sys: JointQuantumSystem, entityIndex: number, definiteState: number) {
        const newEntities = sys.entities.filter((_, i) => i !== entityIndex);

        if (newEntities.length === 0) return;

        if (newEntities.length === 1) {
            // Only one entity left — dissolve to independent
            const remaining = newEntities[0];
            const remainingIdx = entityIndex === 0 ? 1 : 0;
            const probs: Record<number, { re: number, im: number }> = {};

            for (const [jointKStr, amp] of Object.entries(sys.jointAmplitudes)) {
                const jointK = parseInt(jointKStr);
                const states = sys.decomposeState(jointK);
                if (states[entityIndex] === definiteState) {
                    const remainingState = states[remainingIdx];
                    if (!probs[remainingState]) probs[remainingState] = { re: 0, im: 0 };
                    probs[remainingState] = {
                        re: probs[remainingState].re + amp.re,
                        im: probs[remainingState].im + amp.im
                    };
                }
            }

            remaining.entangledSystem = undefined;
            remaining.amplitudes = probs;
            return;
        }

        // Multiple entities remain — rebuild the joint system
        const newDimensions = newEntities.map(e => e.dimension);
        const newAmps: Record<number, { re: number, im: number }> = {};

        for (const [jointKStr, amp] of Object.entries(sys.jointAmplitudes)) {
            const jointK = parseInt(jointKStr);
            const states = sys.decomposeState(jointK);

            if (states[entityIndex] !== definiteState) continue;

            const newStates = states.filter((_, i) => i !== entityIndex);
            let newJointK = 0;
            for (let i = 0; i < newStates.length; i++) {
                newJointK = (newJointK * newDimensions[i]) + newStates[i];
            }

            if (!newAmps[newJointK]) newAmps[newJointK] = { re: 0, im: 0 };
            newAmps[newJointK] = {
                re: newAmps[newJointK].re + amp.re,
                im: newAmps[newJointK].im + amp.im
            };
        }

        sys.entities.splice(entityIndex, 1);
        sys.dimensions.splice(entityIndex, 1);
        sys.totalDimension = sys.dimensions.reduce((a, b) => a * b, 1);
        sys.jointAmplitudes = newAmps;

        for (const entity of sys.entities) {
            entity.entangledSystem = sys;
        }
    }

    private cleanupPieceProperties() {
        for (let i = 0; i < this.squares.length; i++) {
            const probs = this.squares[i].getProbabilities();
            const occ = probs[SquareState.OCCUPIED] || 0;
            if (occ <= 0.0001) {
                this.pieceProperties[i] = null;
            }
        }
    }

    private movePieceProperties(fromIdx: number, toIdx: number) {
        if (!this.pieceProperties[fromIdx]) return;

        const wasCrowned = this.pieceProperties[fromIdx]!.crowned;
        this.pieceProperties[toIdx] = { ...this.pieceProperties[fromIdx]! };

        const { row: toRow } = this.getRowColFromIndex(toIdx);
        if (this.pieceProperties[toIdx]!.color === PieceColor.WHITE && toRow === this.boardSize - 1) {
            this.pieceProperties[toIdx]!.crowned = true;
            if (!wasCrowned) this.justCrowned = true;
        }
        if (this.pieceProperties[toIdx]!.color === PieceColor.BLACK && toRow === 0) {
            this.pieceProperties[toIdx]!.crowned = true;
            if (!wasCrowned) this.justCrowned = true;
        }
    }

    private executeClassicalOverride(fromIdx: number, takenIndices: number[], toIdx: number) {
        const fromSq = this.squares[fromIdx];
        fromSq.entangledSystem = undefined;
        fromSq.amplitudes = { [SquareState.EMPTY]: { re: 1, im: 0 } };

        for (const tIdx of takenIndices) {
            const tSq = this.squares[tIdx];
            tSq.entangledSystem = undefined;
            tSq.amplitudes = { [SquareState.EMPTY]: { re: 1, im: 0 } };
            this.pieceProperties[tIdx] = null;
        }

        const toSq = this.squares[toIdx];
        toSq.entangledSystem = undefined;
        toSq.amplitudes = { [SquareState.OCCUPIED]: { re: 1, im: 0 } };

        this.movePieceProperties(fromIdx, toIdx);
        if (fromIdx !== toIdx) {
            this.pieceProperties[fromIdx] = null;
        }
    }

    private applyClassicalMove(move: ClassicalMove) {
        if (this.gameType === GameType.CLASSIC) {
            this.executeClassicalOverride(move.from_index, [], move.to_index);
            return;
        }

        const fromSq = this.squares[move.from_index];
        const toSq = this.squares[move.to_index];

        if (this.gameType === GameType.SUPERPOSITION) {
            if (fromSq.entangledSystem) fromSq.entangledSystem.measureTarget(fromSq);
            if (toSq.entangledSystem) toSq.entangledSystem.measureTarget(toSq);
        }

        const getJoint = (f: number, t: number) => f * 2 + t;
        const transitions: { from: number, to: number, amplitude: { re: number, im: number } }[] = [];
        transitions.push({ from: getJoint(1, 0), to: getJoint(0, 1), amplitude: { re: 1, im: 0 } });

        EntanglementEngine.interactMany([fromSq, toSq], Operations.SparseTransition(transitions));

        const toProb = toSq.getProbabilities()[SquareState.OCCUPIED] || 0;
        if (toProb > 0.0001) {
            this.movePieceProperties(move.from_index, move.to_index);
        }
    }

    private applyTakeMove(move: ClassicalMove, forcedMeasurementOutcomes: number[] = []) {
        const fromSq = this.squares[move.from_index];
        const toSq = this.squares[move.to_index];

        const { col: fC, row: fR } = this.getRowColFromIndex(move.from_index);
        const { col: tC, row: tR } = this.getRowColFromIndex(move.to_index);

        const dx = tC > fC ? 1 : -1;
        const dy = tR > fR ? 1 : -1;

        let takenIndex = -1;
        for (let step = 1; step < Math.abs(tC - fC); step++) {
            const checkC = fC + (step * dx);
            const checkR = fR + (step * dy);
            const checkIdx = this.getIndex(checkC, checkR);

            const p = this.squares[checkIdx].getProbabilities();
            const emptyProb = p[SquareState.EMPTY] || 0;
            if (emptyProb < 0.999) {
                takenIndex = checkIdx;
                break;
            }
        }

        if (takenIndex === -1) {
            takenIndex = this.getIndex((fC + tC) / 2, (fR + tR) / 2);
        }

        const takenSq = this.squares[takenIndex];
        const takenProps = this.pieceProperties[takenIndex];
        if (takenProps && takenProps.pieceIds) {
            this.jumpedPieceIdsThisTurn.push(...takenProps.pieceIds);
        }

        // 1. Quantum Measurement (All modes except Classic)
        if (this.gameType >= GameType.SUPERPOSITION) {
            let mIdx = 0;
            for (const sq of [fromSq, takenSq, toSq]) {
                const outcome = forcedMeasurementOutcomes[mIdx++];
                if (sq.entangledSystem) sq.entangledSystem.measureTarget(sq, outcome);
                else sq.measure(outcome);
            }
        }

        // 2. Classic Override (Early return)
        if (this.gameType === GameType.CLASSIC) {
            this.movePieceProperties(move.from_index, move.to_index);
            this.pieceProperties[takenIndex] = null;
            this.pieceProperties[move.from_index] = null;

            this.executeClassicalOverride(move.from_index, [takenIndex], move.to_index);
            return;
        }

        // 3. Quantum Interaction
        EntanglementEngine.conditionalInteract({
            controls: [{ entity: fromSq, state: 1 }, { entity: takenSq, state: 1 }],
            targets: [
                { entity: fromSq, operation: Operations.Shift(1) }, // 1 -> 0 wrapper
                { entity: toSq, operation: Operations.Shift(1) }, // 0 -> 1 wrapper
                { entity: takenSq, operation: Operations.Shift(1) } // 1 -> 0 wrapper
            ]
        });

        // 4. Update Properties based on outcome
        const toProbAfter = toSq.getProbabilities()[SquareState.OCCUPIED] || 0;
        if (toProbAfter > 0.0001) {
            this.movePieceProperties(move.from_index, move.to_index);
            
            // If the piece 100% left its starting square, clear its properties there
            const fromProbAfter = fromSq.getProbabilities()[SquareState.OCCUPIED] || 0;
            if (fromProbAfter < 0.001) {
                this.pieceProperties[move.from_index] = null;
            }

            // Likewise, if the taken piece was 100% captured, clear its properties
            const takenProbAfter = takenSq.getProbabilities()[SquareState.OCCUPIED] || 0;
            if (takenProbAfter < 0.001) {
                this.pieceProperties[takenIndex] = null;
            }
        }
    }

    private applySplitMove(move: SplitMove) {
        const fromSq = this.squares[move.from_index];
        const to1Sq = this.squares[move.to_index1];
        const to2Sq = this.squares[move.to_index2];

        // 3 squares: 2*2*2 = 8
        const getJoint = (f: number, t1: number, t2: number) => f * 4 + t1 * 2 + t2;
        const transitions: { from: number, to: number, amplitude: { re: number, im: number } }[] = [];

        // (1, 0, 0) -> 50% (0, 1, 0) + 50% (0, 0, 1)
        transitions.push({ from: getJoint(1, 0, 0), to: getJoint(0, 1, 0), amplitude: { re: 0.70710678, im: 0 } });
        transitions.push({ from: getJoint(1, 0, 0), to: getJoint(0, 0, 1), amplitude: { re: 0.70710678, im: 0 } });

        EntanglementEngine.interactMany([fromSq, to1Sq, to2Sq], Operations.SparseTransition(transitions));

        this.movePieceProperties(move.from_index, move.to_index1);
        this.movePieceProperties(move.from_index, move.to_index2);
        this.pieceProperties[move.from_index] = null; // CRITICAL FIX: The piece physically left the starting square
    }

    private applyMergeMove(move: MergeMove) {
        const from1Sq = this.squares[move.from_index1];
        const from2Sq = this.squares[move.from_index2];
        const toSq = this.squares[move.to_index];

        const getJoint = (f1: number, f2: number, t: number) => f1 * 4 + f2 * 2 + t;
        const transitions: { from: number, to: number, amplitude: { re: number, im: number } }[] = [];

        const branch1 = getJoint(1, 0, 0);
        const branch2 = getJoint(0, 1, 0);

        const merged = getJoint(0, 0, 1);
        const trash = getJoint(1, 1, 0); // "Trash" state

        transitions.push({ from: branch1, to: merged, amplitude: { re: 0.70710678, im: 0 } });
        transitions.push({ from: branch1, to: trash, amplitude: { re: 0.70710678, im: 0 } });

        transitions.push({ from: branch2, to: merged, amplitude: { re: 0.70710678, im: 0 } });
        transitions.push({ from: branch2, to: trash, amplitude: { re: -0.70710678, im: 0 } });

        EntanglementEngine.interactMany([from1Sq, from2Sq, toSq], Operations.SparseTransition(transitions));

        // Copy properties to the target square
        this.movePieceProperties(move.from_index1, move.to_index);

        // Merge the pieceIds! This combines their identity.
        if (this.pieceProperties[move.to_index]) {
            const ids1 = this.pieceProperties[move.from_index1]?.pieceIds || [];
            const ids2 = this.pieceProperties[move.from_index2]?.pieceIds || [];
            this.pieceProperties[move.to_index]!.pieceIds = Array.from(new Set([...ids1, ...ids2]));
        }

        // destroy the original markers
        this.pieceProperties[move.from_index1] = null;
        this.pieceProperties[move.from_index2] = null;
    }

    private applyPhasePass() {
        if (this.gameType === GameType.INTERFERENCE) {
            const phaseAmount = Math.PI / 4;
            for (const sq of this.squares) {
                EntanglementEngine.conditionalInteract({
                    controls: [{ entity: sq, state: 1 }],
                    targets: [{ entity: sq, operation: Operations.Phase(phaseAmount) }]
                });
            }
        }
    }

    private checkWinStates() {
        let whitePieces = 0;
        let blackPieces = 0;
        let whiteKings = 0;
        let blackKings = 0;
        let whiteProb = 0;
        let blackProb = 0;

        for (let i = 0; i < this.squares.length; i++) {
            const probs = this.squares[i].getProbabilities();
            const occ = probs[SquareState.OCCUPIED] || 0;
            const props = this.pieceProperties[i];
            
            if (props && occ > 0.0001) {
                if (props.color === PieceColor.WHITE) {
                    whiteProb += occ;
                    whitePieces++;
                    if (props.crowned) whiteKings++;
                } else {
                    blackProb += occ;
                    blackPieces++;
                    if (props.crowned) blackKings++;
                }
            }
        }

        const possibleMoves = this.getPossibleMoves(true);
        console.log(`[checkWinStates] Turn: ${this.turn}, WhiteProb: ${whiteProb}, BlackProb: ${blackProb}, possibleMoves: ${possibleMoves.length}`);

        // In Quantum Cheqqers, pieces can exist in very tiny branches!
        // We only declare a loss if the probability strictly drops below 0.0001
        if (whiteProb < 0.0001 && blackProb < 0.0001) {
            console.log("[checkWinStates] DRAW due to probability");
            this.state = GameState.DRAW;
            return;
        }
        if (whiteProb < 0.0001) {
            console.log("[checkWinStates] BLACK WON due to probability");
            this.state = GameState.BLACK_WON;
            return;
        }
        if (blackProb < 0.0001) {
            console.log("[checkWinStates] WHITE WON due to probability");
            this.state = GameState.WHITE_WON;
            return;
        }

        // 1) Threefold Repetition
        const hash = this.getBoardStateHash();
        const count = (this.stateHistory.get(hash) || 0) + 1;
        this.stateHistory.set(hash, count);
        if (this.boardSize === 4) console.log(`[REPETITION] hash=${hash} count=${count} turn=${this.turn}`);
        if (count >= 3) {
            console.log("[checkWinStates] DRAW due to threefold repetition");
            this.state = GameState.DRAW;
            return;
        }

        // 2) 25-Move Rule (25 consecutive moves with kings without capture)
        if (whiteKings > 0 && blackKings > 0 && this.consecutiveKingMoves >= 50) { // 50 half-moves = 25 full moves
            console.log("[checkWinStates] DRAW due to 25 move king rule");
            this.state = GameState.DRAW;
            return;
        }

        // 3) 16-Move Rule: 1 king vs 3 pieces (at least one king)
        // 4) 5-Move Rule: 1 king vs 2 pieces or fewer (at least one king)
        const isOneKingWhite = whiteKings === 1 && whitePieces === 1;
        const isOneKingBlack = blackKings === 1 && blackPieces === 1;

        if (isOneKingWhite || isOneKingBlack) {
            const otherPieces = isOneKingWhite ? blackPieces : whitePieces;
            const otherKings = isOneKingWhite ? blackKings : whiteKings;

            if (otherKings >= 1) {
                if (otherPieces === 3) {
                    if (this.endgameRuleActive !== '16') {
                        this.endgameRuleActive = '16';
                        this.specialEndgameMoves = 0;
                    }
                    this.specialEndgameMoves++;
                    if (this.specialEndgameMoves >= 32) { // 32 half-moves
                        console.log("[checkWinStates] DRAW due to 16 move rule");
                        this.state = GameState.DRAW;
                        return;
                    }
                } else if (otherPieces <= 2) {
                    if (this.endgameRuleActive !== '5') {
                        this.endgameRuleActive = '5';
                        this.specialEndgameMoves = 0;
                    }
                    this.specialEndgameMoves++;
                    if (this.specialEndgameMoves >= 10) { // 10 half-moves
                        console.log("[checkWinStates] DRAW due to 5 move rule");
                        this.state = GameState.DRAW;
                        return;
                    }
                } else {
                    this.endgameRuleActive = null;
                }
            } else {
                this.endgameRuleActive = null;
            }
        } else {
            this.endgameRuleActive = null;
        }

        if (this.movesSinceTake >= 100) { // 50 full moves (Standard rule fallback)
            console.log("[checkWinStates] DRAW due to 50 move rule");
            this.state = GameState.DRAW;
            return;
        }

        // Only check if NO moves are possible for the CURRENT player
        if (possibleMoves.length === 0) {
            console.log(`[checkWinStates] NO MOVES FOR TURN ${this.turn}! Winner: ${this.turn === PieceColor.WHITE ? "BLACK" : "WHITE"}`);
            this.state = this.turn === PieceColor.WHITE ? GameState.BLACK_WON : GameState.WHITE_WON;
        }
    }

    public toGameStateObject(): GameStateObject {
        const piece_map: (null | { color: number, crowned: boolean, pieceIds: number[] })[] = new Array(this.squares.length).fill(null);
        const chances: Record<number, number> = {};

        for (let i = 0; i < this.squares.length; i++) {
            const probs = this.squares[i].getProbabilities();
            const occupiedProb = probs[SquareState.OCCUPIED] || 0;

            if (occupiedProb > 0.0001 && this.pieceProperties[i]) {
                piece_map[i] = {
                    color: this.pieceProperties[i]!.color,
                    crowned: this.pieceProperties[i]!.crowned,
                    pieceIds: this.pieceProperties[i]!.pieceIds
                };

                if (occupiedProb < 0.9999 && occupiedProb > 0.001) {
                    console.log(`[toGameStateObject] Sq ${i} has occ ${occupiedProb}`);
                    chances[i] = occupiedProb;
                }
            }
        }

        const quantum_states: QuantumStateInfo[] = [];
        const reportedSystems = new Set<JointQuantumSystem>();

        const getStateString = (s: number, sqIndex: number) => {
            if (s === 0) return "E";
            if (!this.pieceProperties[sqIndex]) return "?";
            const p = this.pieceProperties[sqIndex]!;
            if (p.color === PieceColor.WHITE) return p.crowned ? "WK" : "WM";
            return p.crowned ? "BK" : "BM";
        };

        for (let i = 0; i < this.squares.length; i++) {
            const sq = this.squares[i];
            if (sq.entangledSystem) {
                if (!reportedSystems.has(sq.entangledSystem)) {
                    reportedSystems.add(sq.entangledSystem);

                    const sys = sq.entangledSystem;
                    const indices = sys.entities.map((e: any) => this.squares.indexOf(e));
                    const amps: { state: string, re: number, im: number }[] = [];

                    for (const [kStr, ampObj] of Object.entries(sys.jointAmplitudes)) {
                        const amp: any = ampObj;
                        if (amp.re === 0 && amp.im === 0) continue;
                        const states = sys.decomposeState(parseInt(kStr));
                        const stateStr = states.map((s: number, idx: number) => getStateString(s, indices[idx])).join("⊗");
                        amps.push({ state: stateStr, re: amp.re, im: amp.im });
                    }
                    quantum_states.push({ type: 'entangled', squares: indices, amplitudes: amps });
                }
            } else {
                const amps: { state: string, re: number, im: number }[] = [];
                let hasNonTrivial = false;

                for (const [kStr, ampObj] of Object.entries(sq.amplitudes)) {
                    const amp: any = ampObj;
                    if (amp.re === 0 && amp.im === 0) continue;
                    const state = parseInt(kStr);
                    if (state !== SquareState.EMPTY) hasNonTrivial = true;
                    amps.push({ state: getStateString(state, i), re: amp.re, im: amp.im });
                }

                if (hasNonTrivial) {
                    quantum_states.push({ type: 'independent', squares: [i], amplitudes: amps });
                }
            }
        }

        return {
            board_size: this.boardSize,
            turn: this.turn,
            game_state: this.state,
            game_type: this.gameType,
            classic_occupancy: new Array(this.squares.length).fill(0),
            piece_map: piece_map,
            next_piece_id: this.nextPieceId,
            jumped_piece_ids_this_turn: this.jumpedPieceIdsThisTurn,
            possible_moves: this.getPossibleMoves(),
            chances: chances,
            move_history: this.moveHistory,
            init_params: this.initParams,
            quantum_states: quantum_states
        };
    }
}
