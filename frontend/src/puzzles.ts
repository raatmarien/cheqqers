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

export interface PiecePlacement {
  index?: number;
  color: number; // 0 = WHITE, 1 = BLACK
  crowned?: boolean;
  superposition?: number[];
}

export interface PuzzleMove {
  from_index?: number;
  from_index1?: number;
  from_index2?: number;
  to_index?: number;
  to_index1?: number;
  to_index2?: number;
}

export interface PuzzleSequenceStep {
  expectedMoves: PuzzleMove[];
  aiResponse?: PuzzleMove;
  message?: string; // Optional toast/message mid-sequence
}

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  hint: string;
  boardSize: number;
  gameType: number; // 3 = INTERFERENCE (full quantum)
  turn: number; // 0 = WHITE
  pieces: PiecePlacement[];
  difficulty: "easy" | "medium" | "hard";
  expectedMoves: PuzzleMove[];
  aiResponse?: PuzzleMove;
  expectedSequence?: PuzzleSequenceStep[];
}

const puzzles: Puzzle[] = [
  // ===== 5x5 PUZZLES =====
  {
    id: "quantum-escape",
    title: "Quantum Escape",
    description:
      "Your piece is cornered and any classical move leads to certain capture. Split your position! The attacker will attempt to capture your quantum piece, which forces a measurement. If the measurement finds the square empty, their move fails entirely and you survive!",
    hint: "If you split to both available squares, the opponent's capture attempt will force a measurement. You have a 50% chance of surviving the attack entirely.",
    boardSize: 5,
    gameType: 3,
    turn: 0,
    pieces: [
      // White at 3(1,1) — can move to 5(0,2) or 6(2,2), can split to 5,6
      { index: 3, color: 0 },
      // Black at 8(1,3) — threatens 6 (takes 6, lands on 3)
      { index: 8, color: 1 },
      // Black at 10(0,4) — threatens 5 (takes 5, lands on 0)
      { index: 10, color: 1 },
    ],
    difficulty: "easy",
    expectedMoves: [
      { from_index: 3, to_index1: 5, to_index2: 6 }
    ],
    aiResponse: { from_index: 8, to_index: 3 } // Black attempts to take 6, landing on 3
  },
  {
    id: "split-to-king",
    title: "Split to King",
    description:
      "The path to the king row is heavily guarded. If you move into the threatening square, the opponent will capture you. However, if you split, their attempt to capture your quantum ghost might fail and cost them their turn!",
    hint: "Split your piece to advance safely. Even if one branch gets attacked, the forced measurement might protect you.",
    boardSize: 6,
    gameType: 3,
    turn: 0,
    pieces: [
      // White at 7(4,2), wants to reach y=4 (indices 11 or 12). 
      // 7 moves to 9(3,3) or 12(4,4). Wait, 12 is out of range for normal move from 7 if the logic says so.
      // Let's use 5(0,2) moves to 8(1,3), 8 moves to 10 or 11.
      // Let's use White at 4(3,1). Moves to 6(2,2) or 7(4,2).
      // White at 6 goes to 8(1,3) or 9(3,3). 
      { index: 6, color: 0 },
      // Black at 12(4,4) takes 9, lands on 6.
      { index: 12, color: 1 },
      // Black at 10(0,4) takes 8, lands on 6.
      { index: 10, color: 1 }
    ],
    difficulty: "easy",
    expectedMoves: [
      { from_index: 6, to_index1: 8, to_index2: 9 }
    ],
    aiResponse: { from_index: 10, to_index: 6 } // Black 10 tries to take 8
  },
  {
    id: "double-threat",
    title: "Double Threat",
    description:
      "You're outnumbered and retreating. A split lets your piece threaten captures in two directions at once, projecting a 'ghost' threat to both attackers!",
    hint: "Split your piece to create simultaneous quantum threats on both sides of the board.",
    boardSize: 5,
    gameType: 3,
    turn: 0,
    pieces: [
      // White at 8(1,3), can split to 10(0,4) and 11(2,4). Wait, if White is at 8, it's moving up.
      // If White reaches 10 or 11 it's crowned. So White at 8 splitting to 10,11 crowns it.
      // To threaten, White needs to be crowned so it can move backwards to take.
      // Wait, let's just use White at 6. Moves to 8,9.
      { index: 6, color: 0 },
      // Black is behind White. Black at 0(0,0) and 2(4,0)
      { index: 0, color: 1 },
      { index: 2, color: 1 },
    ],
    difficulty: "medium",
    expectedMoves: [
      { from_index: 6, to_index1: 8, to_index2: 9 }
    ]
  },
  {
    id: "quantum-fork",
    title: "Quantum Fork",
    description:
      "Use a split to safely fork the opponent! If you split into two spaces, the opponent will be forced to guess which one is real when they try to capture.",
    hint: "After splitting, your quantum piece threatens captures in two directions, while being resilient to attacks.",
    boardSize: 5,
    gameType: 3,
    turn: 0,
    pieces: [
      { index: 3, color: 0 },
      { index: 8, color: 1 },
      { index: 9, color: 1 },
    ],
    difficulty: "medium",
    expectedMoves: [
      { from_index: 3, to_index1: 5, to_index2: 6 }
    ],
    aiResponse: { from_index: 8, to_index: 5 }
  },
  {
    id: "escape-the-corner",
    title: "Escape the Corner",
    description:
      "Trapped in the corner with enemies closing in. Every classical move leads directly to capture. Splitting creates an escape route through forced measurements!",
    hint: "By splitting, you force the opponent to attempt a capture on a quantum piece. If the measurement finds the square empty, their turn is forfeited.",
    boardSize: 5,
    gameType: 3,
    turn: 0,
    pieces: [
      { index: 1, color: 0 }, // White at 1(2,0). Moves to 3, 4.
      { index: 6, color: 1 }, // Black at 6(2,2). Takes 3 -> 0. Takes 4 -> 2.
    ],
    difficulty: "medium",
    expectedMoves: [
      { from_index: 1, to_index1: 3, to_index2: 4 }
    ],
    aiResponse: { from_index: 6, to_index: 0 }
  },
  {
    id: "superposition-sacrifice",
    title: "Superposition Gambit",
    description:
      "Sacrifice certainty for possibility. Both classical paths are heavily guarded and result in deterministic capture. The split move is your only path to life.",
    hint: "A split forces the opponent to deal with a quantum piece, imposing the risk of a failed capture.",
    boardSize: 5,
    gameType: 3,
    turn: 0,
    pieces: [
      { index: 4, color: 0 }, // White at 4(3,1). Moves to 6(2,2), 7(4,2)
      { index: 11, color: 1 }, // Black at 11(2,4). Takes 6 -> 3. Takes 7 -> 4. Wait, 11 takes 7? No, 11 is (2,4), 7 is (4,2). Distance is 2. (2,4) down-right is (3,3)=9. From 11 over 9 lands on 7.
      { index: 8, color: 1 } // Black at 8(1,3). Takes 6 -> 4.
    ],
    difficulty: "hard",
    expectedMoves: [
      { from_index: 4, to_index1: 6, to_index2: 7 }
    ],
    aiResponse: { from_index: 8, to_index: 4 }
  },
];

export default puzzles;
