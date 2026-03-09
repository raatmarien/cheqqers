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
    piece_map: Record<number, { color: number, crowned: boolean } | null>;
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
    pieceProperties: Record<number, { color: PieceColor, crowned: boolean } | null>;

    movesSinceTake: number = 0;
    multiJumpSquare: number | null = null;  // Track piece mid-multi-jump chain
    private justCrowned: boolean = false;

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
            this.pieceProperties[i] = { color: PieceColor.WHITE, crowned: false };
        }

        // Black pieces at the top
        for (let i = totalSquares - (startRows * squaresPerRow); i < totalSquares; i++) {
            this.squares[i].apply(Operations.Shift(SquareState.OCCUPIED));
            this.pieceProperties[i] = { color: PieceColor.BLACK, crowned: false };
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
            if (placement.superposition && placement.superposition.length > 0) {
                // Determine probability based on number of superposition states
                const numBranches = placement.superposition.length;

                // Set up the first index with full state
                this.squares[placement.superposition[0]].apply(Operations.Shift(SquareState.OCCUPIED));
                this.pieceProperties[placement.superposition[0]] = {
                    color: placement.color === PieceColor.WHITE ? PieceColor.WHITE : PieceColor.BLACK,
                    crowned: placement.crowned || false
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
                        crowned: placement.crowned || false
                    };
                }
            } else if (placement.index !== undefined) {
                this.squares[placement.index].apply(Operations.Shift(SquareState.OCCUPIED));
                this.pieceProperties[placement.index] = {
                    color: placement.color === PieceColor.WHITE ? PieceColor.WHITE : PieceColor.BLACK,
                    crowned: placement.crowned || false
                };
            }
        }
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

    public getPossibleMoves(): Move[] {
        // If mid-multi-jump, only allow captures from the jumping piece
        if (this.multiJumpSquare !== null) {
            return this.findMoves(true, this.multiJumpSquare);
        }

        const takeMoves = this.getTakeMoves();
        if (takeMoves.length > 0) {
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

        return moves;
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

    /** Get the landing square indices for any move type */
    private getLandingSquares(move: Move): number[] {
        if ('to_index1' in move && 'to_index2' in move) {
            // Split move
            return [(move as SplitMove).to_index1, (move as SplitMove).to_index2];
        } else if ('from_index1' in move && 'from_index2' in move) {
            // Merge move
            return [(move as MergeMove).to_index];
        } else {
            // Classical or take move
            return [(move as ClassicalMove).to_index];
        }
    }

    public static encodeMoveNotation(move: Move): string {
        const sq = (index: number) => String(index + 1);
        if ('is_take_move' in move && move.is_take_move) {
            return `${sq((move as ClassicalMove).from_index)}x${sq((move as ClassicalMove).to_index)}`;
        } else if ('to_index1' in move && 'to_index2' in move) {
            const sm = move as SplitMove;
            const sorted = [sm.to_index1, sm.to_index2].sort((a, b) => a - b);
            return `${sq(sm.from_index)}->${sq(sorted[0])}^${sq(sorted[1])}`;
        } else if ('from_index1' in move && 'from_index2' in move) {
            const mm = move as MergeMove;
            const sorted = [mm.from_index1, mm.from_index2].sort((a, b) => a - b);
            return `${sq(sorted[0])}^${sq(sorted[1])}->${sq(mm.to_index)}`;
        } else {
            return `${sq((move as ClassicalMove).from_index)}->${sq((move as ClassicalMove).to_index)}`;
        }
    }

    public applyMove(moveIndex: number, replayForcedMeasurements?: number[]) {
        const moves = this.getPossibleMoves();
        const move = moves[moveIndex];
        if (!move) return;

        const forcedMeasurementOutcomes: number[] = [];
        let replayMeasurementIndex = 0;

        try {
            this.justCrowned = false;

            // Forced measurement: if any landing square is in superposition, measure it.
            // If measurement reveals it's occupied, the move FAILS and turn ends.
            const landingSquares = this.getLandingSquares(move);
            let moveFailed = false;
            for (const sqIdx of landingSquares) {
                const occ = this.squares[sqIdx].getProbabilities()[SquareState.OCCUPIED] || 0;
                if (occ > 0.001 && occ < 0.999) {
                    // Square is in superposition — force a measurement!
                    console.log(`[forcedMeasure] Landing square ${sqIdx} has ${(occ * 100).toFixed(0)}% occupancy, measuring...`);

                    // Use replay outcome if available, otherwise measure probabilistically
                    const forcedOutcome = replayForcedMeasurements?.[replayMeasurementIndex];
                    if (forcedOutcome !== undefined) replayMeasurementIndex++;

                    const result = this.measureSquare(sqIdx, forcedOutcome);
                    forcedMeasurementOutcomes.push(result);

                    if (result === SquareState.OCCUPIED) {
                        // Measurement revealed the square is occupied — move fails!
                        console.log(`[forcedMeasure] Square ${sqIdx} measured as OCCUPIED — move fails!`);
                        moveFailed = true;
                        break;
                    } else {
                        console.log(`[forcedMeasure] Square ${sqIdx} measured as EMPTY — move proceeds!`);
                    }
                }
            }

            if (moveFailed) {
                // Move fails: turn switches as penalty
                this.turn = this.turn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
                this.multiJumpSquare = null;
                this.cleanupPieceProperties();
                this.disentangleCollapsedEntities();
                this.debugDumpState(`After failed move ${moveIndex} (forced measurement)`);
                this.checkWinStates();
            } else {

                if ('is_take_move' in move && move.is_take_move) {
                    this.applyTakeMove(move as ClassicalMove);
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
                    this.turn = this.turn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
                    this.multiJumpSquare = null;
                    this.movesSinceTake += 1;
                } else {
                    this.movesSinceTake = 0;
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

    /**
     * After measurements, entities in definite states can get trapped inside
     * JointQuantumSystems. This method checks all joint systems and factors out
     * any entity whose marginal probability is 100% for a single state.
     * 
     * If ALL entities in a system are definite, the whole system is dissolved.
     */
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

    /**
     * Remove a single entity from a joint system, given that it's in a definite state.
     * Rebuild the jointAmplitudes without that entity's dimension.
     */
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

            // Compute new joint key without the factored-out entity
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

        // Update the system in-place
        sys.entities.splice(entityIndex, 1);
        sys.dimensions.splice(entityIndex, 1);
        sys.totalDimension = sys.dimensions.reduce((a, b) => a * b, 1);
        sys.jointAmplitudes = newAmps;

        // Update entity references
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

        // 2-square interaction (from, to). Join dimension = 2*2=4
        const getJoint = (f: number, t: number) => f * 2 + t;
        const transitions: { from: number, to: number, amplitude: { re: number, im: number } }[] = [];

        // If from is occupied (1) and to is empty (0) -> (0, 1)
        transitions.push({ from: getJoint(1, 0), to: getJoint(0, 1), amplitude: { re: 1, im: 0 } });

        EntanglementEngine.interactMany([fromSq, toSq], Operations.SparseTransition(transitions));

        // Only copy properties if the piece actually moved there (or exists on some branch)
        const toProb = toSq.getProbabilities()[SquareState.OCCUPIED] || 0;
        if (toProb > 0.0001) {
            this.movePieceProperties(move.from_index, move.to_index);
        }
    }

    private applyTakeMove(move: ClassicalMove) {
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

        if (this.gameType === GameType.SUPERPOSITION) {
            for (const sq of [fromSq, takenSq, toSq]) {
                if (sq.entangledSystem) sq.entangledSystem.measureTarget(sq);
            }
        }

        if (this.gameType === GameType.CLASSIC) {
            this.executeClassicalOverride(move.from_index, [takenIndex], move.to_index);
            return;
        }

        // 3-square CCX equivalent
        EntanglementEngine.conditionalInteract({
            controls: [{ entity: fromSq, state: 1 }, { entity: takenSq, state: 1 }],
            targets: [
                { entity: fromSq, operation: Operations.Shift(1) }, // 1 -> 0 wrapper
                { entity: toSq, operation: Operations.Shift(1) }, // 0 -> 1 wrapper
                { entity: takenSq, operation: Operations.Shift(1) } // 1 -> 0 wrapper
            ]
        });

        // Only copy properties if the take succeeded on at least one branch
        const toProb = toSq.getProbabilities()[SquareState.OCCUPIED] || 0;
        if (toProb > 0.0001) {
            this.movePieceProperties(move.from_index, move.to_index);
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

        // Copy properties to the target square, then destroy the original markers
        this.movePieceProperties(move.from_index1, move.to_index);
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
        let whiteProb = 0;
        let blackProb = 0;

        for (let i = 0; i < this.squares.length; i++) {
            const probs = this.squares[i].getProbabilities();
            const occ = probs[SquareState.OCCUPIED] || 0;
            if (this.pieceProperties[i] && occ > 0) {
                if (this.pieceProperties[i]!.color === PieceColor.WHITE) {
                    whiteProb += occ;
                } else {
                    blackProb += occ;
                }
            }
        }

        const possibleMoves = this.getPossibleMoves();
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

        if (this.movesSinceTake >= 50) {
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
        const piece_map: (null | { color: number, crowned: boolean })[] = new Array(this.squares.length).fill(null);
        const chances: Record<number, number> = {};

        for (let i = 0; i < this.squares.length; i++) {
            const probs = this.squares[i].getProbabilities();
            const occupiedProb = probs[SquareState.OCCUPIED] || 0;

            if (occupiedProb > 0.0001 && this.pieceProperties[i]) {
                piece_map[i] = {
                    color: this.pieceProperties[i]!.color,
                    crowned: this.pieceProperties[i]!.crowned
                };

                if (occupiedProb < 0.9999) {
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
            possible_moves: this.getPossibleMoves(),
            chances: chances,
            move_history: this.moveHistory,
            init_params: this.initParams,
            quantum_states: quantum_states
        };
    }
}
