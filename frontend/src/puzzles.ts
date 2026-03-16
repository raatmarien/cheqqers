/* Copyright 2025 Evert van Nieuwenburg <evert@quantumplayed.com>
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
  feedback?: string; // Optional feedback if this SPECIFIC move is made
}

export interface PuzzleSequenceStep {
  expectedMoves: PuzzleMove[];
  aiResponse?: PuzzleMove;
  message?: string; // Optional toast/message mid-sequence
  wrongMoves?: PuzzleMove[]; // List of specific incorrect moves with feedback
}

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  message: string;
  boardSize: number;
  gameType: number; // 3 = INTERFERENCE (full quantum)
  turn: number; // 0 = WHITE
  pieces: PiecePlacement[];
  difficulty: "easy" | "medium" | "hard";
  expectedMoves: PuzzleMove[];
  aiResponse?: PuzzleMove;
  expectedSequence?: PuzzleSequenceStep[];
  wrongMoves?: PuzzleMove[]; // List of specific incorrect moves with feedback
  isIntro?: boolean;
  disabled?: boolean;
}

// ===== ENDGAME PUZZLES =====
// Positions where classical draughts endgame theory predicts draws or losses,
// but quantum mechanics (split moves & forced measurement) changes the outcome.
//
// Board reference — 4×4 (indices 0–7):
//   Row 3 [Black promo]:  [ ][6][ ][7]
//   Row 2:                [4][ ][5][ ]
//   Row 1:                [ ][2][ ][3]
//   Row 0 [White promo]:  [0][ ][1][ ]
//
// Board reference — 6×6 (indices 0–17):
//   Row 5 [Black promo]:  [ ][15][ ][16][ ][17]
//   Row 4:                [12][ ][13][ ][14][ ]
//   Row 3:                [ ][9][ ][10][ ][11]
//   Row 2:                [6][ ][7][ ][8][ ]
//   Row 1:                [ ][3][ ][4][ ][5]
//   Row 0 [White promo]:  [0][ ][1][ ][2][ ]

const puzzles: Puzzle[] = [
  // -----------------------------------------------------------------------
  // PUZZLE 1 — "Schrödinger's Queen"
  // 4×4 board, Black to move.
  // Classical: BQ@7 must move to 5 or 2. Either way, a White queen
  //   immediately captures it (WQ@3 jumps 5→6, or WQ@0 jumps 2→5).
  //   Classical survival rate: 0%.
  // Quantum: Splitting BQ@7 to {5,2} forces White to gamble on one ghost.
  //   Forced measurement gives Black a 50% chance of survival.
  // -----------------------------------------------------------------------
  {
    id: "schrodingers-queen",
    title: "Schrödinger's Queen",
    description:
      "Two White queens have your lone Black queen cornered on this tiny 4×4 board. Every classical move walks straight into a capture — there is no safe square to run to. In classical checkers this position is hopeless. But in quantum checkers you don't have to choose a square: split your queen into two ghost positions at once and make White gamble on which one is real.",
    message: "Split your queen to both available diagonal squares simultaneously. White can only attack one ghost per turn — and sometimes ghosts can't be found.",
    boardSize: 4,
    gameType: 3,
    turn: 1, // Black
    pieces: [
      { index: 0, color: 0, crowned: true },  // WQ at (0,0)
      { index: 3, color: 0, crowned: true },  // WQ at (3,1)
      { index: 7, color: 1, crowned: true },  // BQ at (3,3)
    ],
    difficulty: "easy",
    expectedMoves: [
      { from_index: 7, to_index1: 5, to_index2: 2 },
    ],
    // WK@3 tries to capture ghost at 5, landing at 6 — 50% chance it fails
    aiResponse: { from_index: 3, to_index: 6 },
  },

  // -----------------------------------------------------------------------
  // PUZZLE 2 — "The Quantum Drawbridge"
  // 6×6 board, White to move.
  // Classical: BQ@17 is cornered but its only escape diagonal (SW through
  //   14→10→7…) cannot be safely blocked — every White queen placed on that
  //   diagonal can be captured by the flying Black queen.
  //   Classical outcome: Black escapes freely or captures a White queen.
  // Quantum: WQ@11 splits to {14, 8}, placing a ghost on square 14 —
  //   the ONLY exit step from 17. Now Black must trigger a forced
  //   measurement to escape. 50% of the time the drawbridge is "up"
  //   and Black's move fails, giving White another turn to close in.
  // -----------------------------------------------------------------------
  {
    id: "quantum-drawbridge",
    title: "The Quantum Drawbridge",
    description:
      "The Black queen is cornered at the top-right of this 6×6 board. Its only escape leads through square 14 — but every time you classically block that square with a queen, Black just captures it and flies to freedom. Quantum changes the math: split your queen to create a ghost on the exit square. Now Black must gamble every time it tries to escape.",
    message: "Split the queen that can reach square 14 so it exists there as a ghost. Black's only escape route now triggers a forced measurement — with only a 50% chance of succeeding.",
    boardSize: 6,
    gameType: 3,
    turn: 0, // White
    pieces: [
      { index: 10, color: 0, crowned: true },  // WQ at (3,3)
      { index: 11, color: 0, crowned: true },  // WQ at (5,3)
      { index: 17, color: 1, crowned: true },  // BQ at (5,5) — cornered
    ],
    difficulty: "medium",
    expectedMoves: [
      { from_index: 11, to_index1: 14, to_index2: 8 },
    ],
    // BK@17 tries to escape by landing on ghost square 14 — forced measurement
    aiResponse: { from_index: 17, to_index: 14 },
  },

  // -----------------------------------------------------------------------
  // PUZZLE 3 — "The Promotion Race"
  // 6×6 board, White to move.
  // Classical: WM@13 and BM@3 are both one step from promotion. White
  //   crowns on one path; Black crowns. Both become queens → classic draw.
  // Quantum: White splits WM@13 to {15, 16}, crowning on BOTH promotion
  //   squares simultaneously. Now White has two ghost queens covering the
  //   two long diagonals, while Black only gets one classical queen.
  //   A single queen cannot match two quantum queens in the endgame.
  // -----------------------------------------------------------------------
  {
    id: "promotion-race",
    title: "The Promotion Race",
    description:
      "You're one step from crowning — and so is Black. In classical draughts, both players promote and the resulting queen-vs-queen endgame is a draw. But quantum gives you a secret weapon: instead of crowning on one square, split your man to crown on BOTH promotion squares at once. Black gets one classical queen. You get two quantum queens.",
    message: "Your man at 13 can reach both promotion squares (15 and 16) in one step. Split instead of moving to cover both diagonals simultaneously.",
    boardSize: 6,
    gameType: 3,
    turn: 0, // White
    pieces: [
      { index: 13, color: 0 },  // WM at (2,4) — one step from promotion
      { index: 3, color: 1 },  // BM at (1,1) — one step from promotion
    ],
    difficulty: "easy",
    expectedMoves: [
      { from_index: 13, to_index1: 15, to_index2: 16 },
    ],
    // Black crowns immediately in response
    aiResponse: { from_index: 3, to_index: 0 },
  },

  // -----------------------------------------------------------------------
  // PUZZLE 4 — "The Quantum Corral"
  // 6×6 board, Black to move.
  // Classical: BM@16 can move to 13 or 14. Either way, a White man
  //   immediately captures it and crowns:
  //   - BM→13: WM@9 captures over 13, crowns at 16.
  //   - BM→14: WM@10 captures over 14, crowns at 17.
  //   Classical survival rate: 0%.
  // Quantum: BM@16 splits to {13, 14}, occupying BOTH squares as ghosts.
  //   White can only attempt one capture. The forced measurement gives Black
  //   a 50% chance the capture misses entirely, collapsing the piece to
  //   the other square where it is temporarily safe.
  // -----------------------------------------------------------------------
  {
    id: "quantum-corral",
    title: "The Quantum Corral",
    description:
      "Your Black man is surrounded: two White men are perfectly positioned to capture it no matter where it steps. Move left, White crowns right. Move right, White crowns left. Classically, you lose your piece for certain. But quantum checkers lets you step in BOTH directions at once — and White can only swing at one ghost.",
    message: "Split your man to both squares. White must pick one to capture. There's a 50% chance the chosen square measures as empty, and the capture fails entirely.",
    boardSize: 6,
    gameType: 3,
    turn: 1, // Black
    pieces: [
      { index: 9, color: 0 },  // WM at (1,3)
      { index: 10, color: 0 },  // WM at (3,3)
      { index: 16, color: 1 },  // BM at (3,5) — trapped
    ],
    difficulty: "medium",
    expectedMoves: [
      { from_index: 16, to_index1: 13, to_index2: 14 },
    ],
    // WM@10 attempts to capture ghost at 14 and land at 17 (crowning)
    aiResponse: { from_index: 10, to_index: 17 },
  },

  // -----------------------------------------------------------------------
  // PUZZLE 5 — "The Endgame Mirage"
  // 6×6 board, White to move.
  // Classical: 1 Queen vs 1 Queen is an automatic draw in international
  //   draughts — neither side can force a capture.
  // Quantum: WQ@7 splits to {14, 0}, placing ghosts at both ends of the
  //   board's main long diagonals. Square 14 sits on Black's only escape
  //   path. Every time the Black queen tries to reach or pass square 14,
  //   it triggers a forced measurement — a 50% chance the escape fails.
  //   A classically unwinnable queen ending becomes a quantum pressure game.
  // -----------------------------------------------------------------------
  {
    id: "endgame-mirage",
    title: "The Endgame Mirage",
    description:
      "One queen each — a textbook draw in classical international draughts. Neither side can force a capture, so the game goes on forever. But quantum checkers shatters this rule: split your queen to haunt BOTH ends of the board simultaneously. Your ghost on square 14 sits right in Black's only escape corridor. Every time the Black queen tries to flee, it walks into a measurement.",
    message: "Split your queen to reach both square 14 (blocking Black's escape diagonal) and square 0 (the opposite corner). Black's queen cannot safely bypass your ghost at 14.",
    boardSize: 6,
    gameType: 3,
    turn: 0, // White
    pieces: [
      { index: 7, color: 0, crowned: true },  // WQ at (2,2)
      { index: 17, color: 1, crowned: true },  // BQ at (5,5)
    ],
    difficulty: "hard",
    expectedMoves: [
      { from_index: 7, to_index1: 14, to_index2: 0 },
    ],
    // BK@17 tries to escape by landing on ghost at 14 — forced measurement
    aiResponse: { from_index: 17, to_index: 14 },
  },

  // -----------------------------------------------------------------------
  // PUZZLE 6 — "Entanglement Erasure"
  // -----------------------------------------------------------------------
  {
    id: "entanglement-erasure",
    title: "Entanglement Erasure",
    description: "Quantum superpositions are fragile. When a piece splits into two ghosts, jumping over one of them forces the universe to check if it's really there. But here's the magic: even if your jump fails (because the ghost wasn't there), the very act of checking completely erases that ghost from existence! Play out this sequence to erase a phantom.",
    message: "Black will split into two ghosts. Jump over one of them to force a measurement. Even if you don't capture it, the ghost you jumped over will disappear!",
    boardSize: 6,
    gameType: 3,
    turn: 1, // Black (AI)
    pieces: [
      { index: 13, color: 0 },
      { index: 16, color: 0 },
      { index: 7, color: 1 },
    ],
    difficulty: "medium",
    expectedMoves: [], // handled by sequence
    expectedSequence: [
      {
        message: "Watch Black split their piece into two ghosts.",
        expectedMoves: [],
        aiResponse: { from_index: 7, to_index1: 10, to_index2: 11 }
      },
      {
        message: "Black split! Now jump over the ghost at 10 to land on 6. Even if the jump fails, the ghost at 10 will be erased from all universes!",
        expectedMoves: [{ from_index: 13, to_index: 6 }]
      }
    ]
  },

  // -----------------------------------------------------------------------
  // PUZZLE 7 — "The Phantom Move"
  // -----------------------------------------------------------------------
  {
    id: "phantom-move",
    title: "The Phantom Move",
    description: "Sometimes the UI highlights a move that is mathematically impossible. This happens because the pieces involved exist in mutually exclusive universes! Follow this exact chain reaction to experience the 'Phantom Move' — a move that you can play, but does absolutely nothing.",
    message: "Follow the instructions to entangle the board, then try the impossible jump.",
    boardSize: 6,
    gameType: 3,
    turn: 1, // Black
    pieces: [
      { index: 7, color: 0 },
      { index: 0, color: 0 },
      { index: 14, color: 1, crowned: true },
      { index: 16, color: 1 },
    ],
    difficulty: "hard",
    expectedMoves: [], // handled by sequence
    expectedSequence: [
      {
        message: "Move your piece from 16 to 13 to pass the turn. Watch White split to create two universes.",
        expectedMoves: [{ from_index: 16, to_index: 13 }],
        aiResponse: { from_index: 7, to_index1: 10, to_index2: 11 }
      },
      {
        message: "White is now on 10 and 11. Capture the ghost on 11 by jumping your Queen from 14 to 7! White will then make a waiting move.",
        expectedMoves: [{ from_index: 14, to_index: 7 }],
        aiResponse: { from_index: 0, to_index: 4 }
      },
      {
        message: "The trap is set! Look at your Queen on 7. The game says you can jump to 12 (over 10). Try it. The move is a phantom—it does absolutely nothing because your Queen on 7 and the enemy on 10 exist in mutually exclusive universes!",
        expectedMoves: [{ from_index: 7, to_index: 12 }]
      }
    ]
  }
];

export default puzzles;
