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

import type { Puzzle } from "./puzzles";

// Board reference — 6×6 (indices 0–17):
//   Row 5 [Black promo]:  [  ][15][  ][16][  ][17]
//   Row 4:                [12][  ][13][  ][14][  ]
//   Row 3:                [  ][ 9][  ][10][  ][11]
//   Row 2:                [ 6][  ][ 7][  ][ 8][  ]
//   Row 1:                [  ][ 3][  ][ 4][  ][ 5]
//   Row 0 [White promo]:  [ 0][  ][ 1][  ][ 2][  ]

const tutorials: Puzzle[] = [
    {
        id: "ftue-1-welcome",
        title: "Welcome",
        description: "Welcome to the tutorial! \
        It will teach you the basics rules of checkers and it will introduce you to the new quantum moves.\n\n \
        Checkers comes in many variants, but the international standard is played on a 10x10 board. \
        We'll be demonstrating it on a 6x6 board here. \
        The goal is simple. You win either by capturing all your opponent's pieces, or when they have no valid moves left.",
        message: "Click 'LET'S GO!' to begin.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 0, color: 0 }, { index: 1, color: 0 }, { index: 2, color: 0 },
            { index: 15, color: 1 }, { index: 16, color: 1 }, { index: 17, color: 1 }
        ],
        difficulty: "easy",
        expectedMoves: [],
        isIntro: true
    },
    {
        id: "ftue-2-movement",
        title: "The Step",
        description: "Standard movement: pieces move one square diagonally forward. A piece cannot move backwards.Select your white piece, and then click either of the green dots.",
        message: "Move the white piece to either square.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 1, color: 0 }
        ],
        difficulty: "easy",
        expectedMoves: [
            { from_index: 1, to_index: 3 },
            { from_index: 1, to_index: 4 }
        ]
    },
    {
        id: "ftue-3-captures",
        title: "Capturing",
        description: "You jump over an opponent's piece to capture it. Here is an important rule: \
        If you *can* capture, you *must* capture! You cannot decide to leave the capture for another turn.",
        message: "Jump over the black piece.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 3, color: 0 }, { index: 7, color: 1 }
        ],
        difficulty: "easy",
        expectedMoves: [{ from_index: 3, to_index: 10 }]
    },
    {
        id: "ftue-4-multijump",
        title: "The Multijump",
        description: "If you can capture another piece after your landing, you must continue!",
        message: "Jump over both pieces!",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 2, color: 0 }, { index: 4, color: 1 }, { index: 10, color: 1 }
        ],
        difficulty: "easy",
        expectedMoves: [],
        expectedSequence: [
            { expectedMoves: [{ from_index: 2, to_index: 7 }], message: "First jump." },
            { expectedMoves: [{ from_index: 7, to_index: 14 }], message: "Now jump again! Your piece stays selected automatically." }
        ]
    },
    {
        id: "ftue-5-longest-path",
        title: "Quality over Quantity",
        description: "Longest path: if there are two different ways to capture, you are required to take the path that captures the most pieces! Always aim for the biggest chain.",
        message: "One path captures one piece, another captures two. You must take the path that captures two.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 4, color: 0 },
            { index: 7, color: 1 },  // Left (Len 1)
            { index: 8, color: 1 },  // Right 1 (Start of Len 2)
            { index: 14, color: 1 }  // Right 2 (Continuation)
        ],
        difficulty: "easy",
        expectedMoves: [],
        expectedSequence: [
            { expectedMoves: [{ from_index: 4, to_index: 11 }], message: "First jump!" },
            { expectedMoves: [{ from_index: 11, to_index: 16 }], message: "Great choice!" }
        ]
    },
    {
        id: "ftue-6-queens-promotion",
        title: "The Queen - Promotion",
        description: "Queens: if you reach the opponent's back row, your piece promotes to a Queen!",
        message: "Reach the top row to promote your piece.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 14, color: 0 },
            { index: 0, color: 1 } // Dummy to prevent game end
        ],
        difficulty: "easy",
        expectedMoves: [
            { from_index: 14, to_index: 16 },
            { from_index: 14, to_index: 17 }
        ]
    },
    {
        id: "ftue-7-queens-movement",
        title: "The Queen - Movement",
        description: "Once promoted, a Queen can move arbitrary lengths along any open diagonal.",
        message: "Now fly! Move your new Queen all the way across the board.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 17, color: 0, crowned: true },
            { index: 2, color: 1 }
        ],
        difficulty: "easy",
        expectedMoves: [
            { from_index: 17, to_index: 14 },
            { from_index: 17, to_index: 10 },
            { from_index: 17, to_index: 7 },
            { from_index: 17, to_index: 3 }
        ]
    },
    {
        id: "ftue-8-queen-capture",
        title: "The Striker",
        description: "Capturing with a Queen is devastating: she can strike from a distance, land anywhere behind the target, and perform multijumps!\
        Try to prevent your opponent from ever getting one!",
        message: "Jump over the black piece and choose your landing spot wisely.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [
            { index: 0, color: 0, crowned: true },
            { index: 7, color: 1 },
            { index: 11, color: 1 }
        ],
        difficulty: "easy",
        expectedMoves: [
            { from_index: 0, to_index: 10 },
            { from_index: 0, to_index: 17 }
        ],
        wrongMoves: [
            { from_index: 0, to_index: 14, feedback: "While you can land here, you'll be captured next turn! Try landing at the very end of the diagonal (square 17) or earlier (square 10)." }
        ]
    },
    // --- Quantum Tutorials ---
    {
        id: "ftue-9-quantum-intro",
        title: "The Quantum Leap",
        description: "Welcome to Quantum Checkers! From quantumness level 1 onwards, pieces can enter quantum mode and split (aka go into 'superposition').\
        Your split pieces have 50% probability to be in either square.\
        If an enemy tries to capture your split piece, a 'measurement' occurs to resolve the superposition.\
        If you weren't actually there, their attack fails!",
        message: "Double click your piece to enter Quantum Mode, then select two destination squares.",
        boardSize: 6,
        gameType: 1, // SUPERPOSITION
        turn: 0,
        pieces: [
            { index: 3, color: 0 },
            { index: 14, color: 1 } // Black piece for measurement threat later
        ],
        difficulty: "medium",
        expectedMoves: [],
        expectedSequence: [
            {
                expectedMoves: [{ from_index: 3, to_index1: 6, to_index2: 7 }],
                message: "Double click your piece to enter Quantum Mode, then select two destinations squares."
            },
        ]
    },
    {
        id: "ftue-10-quantum-measurement",
        title: "Measurement",
        description: "You are forced to try and capture a split black piece here.\
        In this scenario, two things can happen:\n\
        1. You capture the black piece (50% chance)\n\
        2. You don't capture the black piece (50% chance)\n\
        If you capture the black piece, the game ends. If you don't capture the black piece, the game continues.\
        You can't influence the outcome, you'll have to take a risk!",

        message: "Capture the quantum black piece.",
        boardSize: 6,
        gameType: 1, // SUPERPOSITION
        turn: 0,
        pieces: [
            { index: 7, color: 0 },
            { superposition: [10, 11], color: 1 }
        ],
        difficulty: "medium",
        expectedMoves: [{ from_index: 7, to_index: 14 }]
    },
    {
        id: "ftue-11-congratulations",
        title: "Congratulations!",
        description: "You've completed the core Cheqqers tutorial! You now know all the basics of classical movement and the first steps of quantum superposition.\n\nThe final two advanced steps (Entanglement and Interference) will be available soon. For now, you're ready to test your skills in regular matches or try the available puzzles!",
        message: "Tap FINISH to head back to the main menu.",
        boardSize: 6,
        gameType: 0,
        turn: 0,
        pieces: [],
        difficulty: "easy",
        isIntro: true,
        expectedMoves: []
    }
];

export default tutorials;
