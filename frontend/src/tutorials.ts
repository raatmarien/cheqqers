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

import type { Puzzle } from "./puzzles";

const generateStandardBoard = (): any[] => {
    const pieces: any[] = [];
    for (let i = 0; i < 12; i++) {
        pieces.push({ index: i, color: 0 });
    }
    for (let i = 20; i < 32; i++) {
        pieces.push({ index: i, color: 1 });
    }
    return pieces;
};

const tutorials: Puzzle[] = [
    {
        id: "ftue-1-welcome",
        title: "Welcome to Cheqqers",
        description: "In classic Checkers, the goal is to capture all opponent pieces or block them from making any moves. The game is played on an 8x8 board. Try making an opening move by selecting a white piece and tapping on an allowed square (green dots).",
        hint: "Tap any of the white pieces in the front row, then tap an empty diagonal square in front of it.",
        boardSize: 8,
        gameType: 0, // CLASSIC
        turn: 0,
        pieces: generateStandardBoard(),
        difficulty: "easy",
        expectedMoves: [] // Any valid opening move is fine
    },
    {
        id: "ftue-2-micro",
        title: "The Micro-Board",
        description: "To make learning the advanced mechanics easier, the rest of this tutorial will take place on smaller focused boards. Pieces still move diagonally forward exactly like the big board.",
        hint: "Select your white piece and move it diagonally forward.",
        boardSize: 4,
        gameType: 0, // CLASSIC
        turn: 0,
        pieces: [
            { index: 2, color: 0 }, // White at 2
            { index: 6, color: 1 }  // Black at 6
        ],
        difficulty: "easy",
        expectedMoves: [] // Any valid move is fine
    },
    {
        id: "ftue-3-capture",
        title: "The Capture",
        description: "Combat is simple: if an opponent is directly in front of you, and the square immediately behind them is empty, you MUST jump over them to capture. Required captures will be highlighted in red.",
        hint: "Select your white piece and tap the square behind the black piece to capture it.",
        boardSize: 4,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 0, color: 0 }, // White
            { index: 2, color: 1 }  // Black in front of white
        ],
        difficulty: "easy",
        expectedMoves: [
            { from_index: 0, to_index: 5 } // Capture move
        ]
    },
    {
        id: "ftue-4-momentum",
        title: "Momentum",
        description: "If you land from a jump and immediately have another valid capture available with the same piece, you must continue jumping! You can capture multiple pieces in a single turn this way.",
        hint: "Capture the first black piece, then immediately capture the second one.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 1, color: 0 }, // White start
            { index: 4, color: 1 }, // Black 1
            { index: 10, color: 1 } // Black 2
        ],
        difficulty: "easy",
        expectedMoves: [
            { from_index: 1, to_index: 8 },   // Jump 1
            { from_index: 8, to_index: 13 }   // Jump 2
        ]
    },
    {
        id: "ftue-5-king",
        title: "Crowning Glory",
        description: "When a piece survives the journey to the furthest opposite row, it transforms into a 'King'. Kings are incredibly powerful because they can move (and capture) both backwards and forwards, and can move across multiple empty squares.",
        hint: "Move the white piece into the top row to crown it.",
        boardSize: 4,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 4, color: 0 } // White near top
        ],
        difficulty: "easy",
        expectedMoves: [
            { from_index: 4, to_index: 6 }, // Move to king row (right)
            { from_index: 4, to_index: 7 }  // Move to king row (left)
        ]
    },
    {
        id: "ftue-6-flying-king",
        title: "The Flying King",
        description: "Kings don't just move one square. They can 'fly' across any number of empty squares along a diagonal. When capturing, they can strike from a distance and choose to land anywhere on the empty diagonal behind their victim.",
        hint: "Select your white King and jump over the black piece. You can choose how far past it you land.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 0, color: 0, crowned: true }, // White King at bottom left
            { index: 7, color: 1 } // Black piece in the middle
        ],
        difficulty: "easy",
        expectedMoves: [
            { from_index: 0, to_index: 10 }, // Land right behind
            { from_index: 0, to_index: 14 }, // Land further
            { from_index: 0, to_index: 17 }  // Land max distance
        ]
    },
    {
        id: "ftue-7-superposition",
        title: "The Quantum Leap",
        description: "Welcome to Quantum Level 1! Instead of just moving to a single square, pieces can enter a 'superposition'. By splitting your movement, your piece will literally exist in BOTH destination squares at the same time (50% probability in each).",
        hint: "Select your white piece, then tap the split icon between the two green target squares to enter a superposition.",
        boardSize: 4,
        gameType: 1, // SUPERPOSITION
        turn: 0,
        pieces: [
            { index: 2, color: 0 }
        ],
        difficulty: "medium",
        expectedMoves: [
            { from_index: 2, to_index1: 4, to_index2: 5 } // Split move
        ]
    },
    {
        id: "ftue-8-defense",
        title: "Schrödinger's Defense",
        description: "Superposition isn't just a trick, it's a defensive strategy. If you exist in two places at once, an enemy capturing one of your 'ghosts' won't necessarily kill you. The universe has to measure you first!",
        hint: "Black is threatening to capture you from both sides! Split your piece so that Black is forced to guess which branch to attack.",
        boardSize: 6,
        gameType: 1, // SUPERPOSITION
        turn: 0,
        pieces: [
            { index: 4, color: 0 }, // White at 4
            { index: 10, color: 1 }, // Black at 10 (threatens 7)
            { index: 12, color: 1 }  // Black at 12 (threatens 8)
        ],
        difficulty: "medium",
        expectedMoves: [
            { from_index: 4, to_index1: 7, to_index2: 8 } // Split 
        ],
        aiResponse: { from_index: 10, to_index: 4 } // AI captures the left branch!
    },
    {
        id: "ftue-9-measurement",
        title: "The Measurement",
        description: "Welcome to Quantum Level 1! The universe dislikes uncertainty. If an enemy attempts to capture your ghost, it forces an 'Observation' (measurement). If the measurement reveals you were in the OTHER location, their attack completely misses and their turn is wasted!",
        hint: "Split your piece! The black piece is forced to attack you, triggering a measurement. Watch Black waste their turn hitting empty space.",
        boardSize: 4,
        gameType: 1, // SUPERPOSITION
        turn: 0,
        pieces: [
            { index: 2, color: 0 },
            { index: 7, color: 1 },
        ],
        difficulty: "hard",
        expectedMoves: [
            { from_index: 2, to_index1: 4, to_index2: 5 }
        ],
        aiResponse: { from_index: 7, to_index: 2 } // AI triggers forced measurement by attacking 5
    },
    {
        id: "ftue-10-spooky-action",
        title: "Spooky Action",
        description: "Welcome to Quantum Level 2 (Entanglement)! Superpositioned branches can actually re-merge back into a single, solid 100% piece. This allows you to navigate obstacles by splitting apart and then pulling yourself back together.",
        hint: "Turn 1: Split your white piece. Turn 2: Tap the Merge icon where your two tracking ghosts intersect!",
        boardSize: 6,
        gameType: 2,
        turn: 0,
        pieces: [
            { index: 4, color: 0 }, // White
            { index: 17, color: 1 } // Harmless Black far away
        ],
        difficulty: "medium",
        expectedMoves: [], // overwritten by sequence
        expectedSequence: [
            {
                expectedMoves: [{ from_index: 4, to_index1: 7, to_index2: 8 }],
                aiResponse: { from_index: 17, to_index: 14 }
            },
            {
                expectedMoves: [{ from_index1: 7, from_index2: 8, to_index: 11 }],
                message: "Excellent! Your piece is whole again."
            }
        ]
    },
    {
        id: "ftue-11-ghostly-strike",
        title: "The Ghostly Strike",
        description: "You've caught two Black pieces in a pincer. By using Quantum Interference, you can execute a devastating 'Merge-Capture'! Your two ghosts will simultaneously jump over BOTH Black pieces, merge in mid-air, and land as a single solid piece.",
        hint: "Select one of your ghosts, and click the Merge icon behind the enemy lines (it will show an attack indicator!).",
        boardSize: 6,
        gameType: 2,
        turn: 0,
        pieces: [
            { superposition: [6, 8], color: 0 }, // White's entangled ghosts
            { index: 9, color: 1 }, // Black target 1
            { index: 10, color: 1 }  // Black target 2
        ],
        difficulty: "hard",
        // 6 jumps over 9 to land on 13.
        // 8 jumps over 10 to land on 13. 
        expectedMoves: [
            { from_index1: 6, from_index2: 8, to_index: 13 },
            { from_index1: 8, from_index2: 6, to_index: 13 }
        ]
    },
    {
        id: "ftue-12-master",
        title: "Quantum Master",
        description: "This is your final exam. The Black King is trying to escape down the center of the board. You must use your Quantum abilities over multiple turns to corner and merge-capture it!",
        hint: "Turn 1: Split to widen your net. Turn 2: Collapse your wave function onto the King by capturing it!",
        boardSize: 6,
        gameType: 3, // Full Quantum
        turn: 0,
        pieces: [
            { index: 4, color: 0 }, // White start
            { index: 14, color: 1, crowned: true }, // Black King
        ],
        difficulty: "hard",
        expectedMoves: [], // overwritten by sequence
        expectedSequence: [
            {
                // Turn 1: Split!
                expectedMoves: [{ from_index: 4, to_index1: 7, to_index2: 8 }],
                aiResponse: { from_index: 14, to_index: 10 } // King maliciously attacks the 7 branch!
            },
            {
                // Turn 2: Collapse the wave function by capturing! 7 takes 10, lands on 14. branch 8 vanishes.
                expectedMoves: [{ from_index: 7, to_index: 14 }]
            }
        ]
    }
];

export default tutorials;
