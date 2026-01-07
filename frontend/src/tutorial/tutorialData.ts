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
 */

// Piece representation: color (0 = white, 1 = black), crowned (boolean)
export interface TutorialPiece {
  color: number;
  crowned: boolean;
}

// Move types for validation
export interface TutorialMove {
  type: 'classical' | 'split' | 'merge';
  from_index?: number;
  to_index?: number;
  from_index1?: number;
  from_index2?: number;
  to_index1?: number;
  to_index2?: number;
}

// Board setup for a tutorial scenario
export interface TutorialScenario {
  pieces: { [index: number]: TutorialPiece };
  // Squares in superposition (with chances) - for display purposes
  superpositions?: { [index: number]: number };
  // Valid moves for this scenario
  validMoves: TutorialMove[];
  // Optional: which pieces can be selected
  selectablePieces?: number[];
}

// A single tutorial step
export interface TutorialStep {
  title: string;
  description: string;
  // If there's an interactive scenario
  scenario?: TutorialScenario;
  // Instructions for what the player needs to do
  instructions?: string;
  // Whether the step is purely informational (no interaction needed)
  isInformational?: boolean;
}

// A section of the tutorial (e.g., "Moving Pieces")
export interface TutorialSection {
  title: string;
  steps: TutorialStep[];
}

// Create a board index from row and column (0-indexed from bottom-left)
// Only black squares are used, so we map to the 32 playable squares
const getIndex = (row: number, col: number): number => {
  return Math.floor((col + (row * 8)) / 2);
};

// Tutorial sections
export const tutorialSections: TutorialSection[] = [
  // ====================
  // CLASSICAL CHECKERS
  // ====================
  {
    title: "Classical Checkers Basics",
    steps: [
      {
        title: "Welcome to Cheqqers!",
        description: "Cheqqers is a quantum version of checkers. Before learning the quantum rules, let's start with the basics of classical checkers. In this tutorial, you'll learn how to play step by step.",
        isInformational: true,
      },
      {
        title: "The Board",
        description: "Checkers is played on an 8×8 board with alternating light and dark squares. Pieces can only move on the dark squares. White pieces start at the bottom, black pieces at the top. White always moves first.",
        isInformational: true,
      },
      {
        title: "Moving Pieces",
        description: "Regular pieces can only move diagonally forward (toward the opponent's side). Each move goes to an adjacent empty dark square.",
        scenario: {
          pieces: {
            [getIndex(2, 2)]: { color: 0, crowned: false }, // White piece
          },
          validMoves: [
            { type: 'classical', from_index: getIndex(2, 2), to_index: getIndex(3, 1) },
            { type: 'classical', from_index: getIndex(2, 2), to_index: getIndex(3, 3) },
          ],
          selectablePieces: [getIndex(2, 2)],
        },
        instructions: "Click on the white piece, then click on one of the highlighted squares to move it forward diagonally.",
      },
      {
        title: "Capturing Pieces",
        description: "You can capture an opponent's piece by jumping over it diagonally. The square behind the opponent's piece must be empty. Capturing is mandatory when possible!",
        scenario: {
          pieces: {
            [getIndex(2, 2)]: { color: 0, crowned: false }, // White piece
            [getIndex(3, 3)]: { color: 1, crowned: false }, // Black piece to capture
          },
          validMoves: [
            { type: 'classical', from_index: getIndex(2, 2), to_index: getIndex(4, 4) },
          ],
          selectablePieces: [getIndex(2, 2)],
        },
        instructions: "Click on the white piece, then click on the square behind the black piece to capture it.",
      },
      {
        title: "Crowning (Becoming a King)",
        description: "When a piece reaches the opposite end of the board, it becomes 'crowned' (a king). Kings are shown with a crown symbol and have special abilities.",
        scenario: {
          pieces: {
            [getIndex(6, 4)]: { color: 0, crowned: false }, // White piece about to be crowned
          },
          validMoves: [
            { type: 'classical', from_index: getIndex(6, 4), to_index: getIndex(7, 3) },
            { type: 'classical', from_index: getIndex(6, 4), to_index: getIndex(7, 5) },
          ],
          selectablePieces: [getIndex(6, 4)],
        },
        instructions: "Move the white piece to the top row to crown it. Click the piece, then click on a highlighted square.",
      },
      {
        title: "King Movement",
        description: "Crowned pieces (kings) can move and capture both forwards AND backwards diagonally. This makes them very powerful!",
        scenario: {
          pieces: {
            [getIndex(4, 4)]: { color: 0, crowned: true }, // White king
          },
          validMoves: [
            { type: 'classical', from_index: getIndex(4, 4), to_index: getIndex(5, 3) },
            { type: 'classical', from_index: getIndex(4, 4), to_index: getIndex(5, 5) },
            { type: 'classical', from_index: getIndex(4, 4), to_index: getIndex(3, 3) },
            { type: 'classical', from_index: getIndex(4, 4), to_index: getIndex(3, 5) },
          ],
          selectablePieces: [getIndex(4, 4)],
        },
        instructions: "Notice the crowned piece can move in any diagonal direction. Click it and move it to any highlighted square.",
      },
      {
        title: "Winning the Game",
        description: "You win by either capturing all opponent pieces or blocking them so they have no legal moves. The game is a draw if 40 moves pass without any captures.",
        isInformational: true,
      },
    ],
  },
  // ====================
  // QUANTUM LEVEL 1 - SUPERPOSITION
  // ====================
  {
    title: "Quantum Level 1: Superposition",
    steps: [
      {
        title: "Introduction to Quantum Checkers",
        description: "Now let's learn the quantum rules! In quantum mechanics, particles can exist in multiple states at once - this is called 'superposition'. In Cheqqers, pieces can also be in multiple places at once!",
        isInformational: true,
      },
      {
        title: "The Split Move",
        description: "Instead of moving to one square, you can 'split' a piece to move to TWO squares simultaneously! The piece exists in both locations at once (in superposition). Look for the split icon (↗↘) between two possible destination squares.",
        scenario: {
          pieces: {
            [getIndex(2, 2)]: { color: 0, crowned: false }, // White piece
          },
          validMoves: [
            { type: 'classical', from_index: getIndex(2, 2), to_index: getIndex(3, 1) },
            { type: 'classical', from_index: getIndex(2, 2), to_index: getIndex(3, 3) },
            { type: 'split', from_index: getIndex(2, 2), to_index1: getIndex(3, 1), to_index2: getIndex(3, 3) },
          ],
          selectablePieces: [getIndex(2, 2)],
        },
        instructions: "Click on the white piece, then click the split icon (↗↘) that appears between the two possible squares to split the piece into superposition.",
      },
      {
        title: "Probability Display",
        description: "When a piece is in superposition, each location shows the probability (%) of finding the piece there when measured. After a split, each square has 50% chance.",
        scenario: {
          pieces: {
            [getIndex(3, 1)]: { color: 0, crowned: false },
            [getIndex(3, 3)]: { color: 0, crowned: false },
          },
          superpositions: {
            [getIndex(3, 1)]: 0.5,
            [getIndex(3, 3)]: 0.5,
          },
          validMoves: [
            { type: 'classical', from_index: getIndex(3, 1), to_index: getIndex(4, 0) },
            { type: 'classical', from_index: getIndex(3, 1), to_index: getIndex(4, 2) },
            { type: 'classical', from_index: getIndex(3, 3), to_index: getIndex(4, 2) },
            { type: 'classical', from_index: getIndex(3, 3), to_index: getIndex(4, 4) },
          ],
          selectablePieces: [getIndex(3, 1), getIndex(3, 3)],
        },
        instructions: "See the 50% on each piece? They're in superposition! You can move either part like a normal piece. Try moving one of them.",
      },
      {
        title: "Splitting Again",
        description: "A piece already in superposition can split again! When it does, the probability divides further. For example, splitting a 50% piece creates two 25% pieces.",
        scenario: {
          pieces: {
            [getIndex(3, 1)]: { color: 0, crowned: false },
            [getIndex(3, 3)]: { color: 0, crowned: false },
          },
          superpositions: {
            [getIndex(3, 1)]: 0.5,
            [getIndex(3, 3)]: 0.5,
          },
          validMoves: [
            { type: 'split', from_index: getIndex(3, 1), to_index1: getIndex(4, 0), to_index2: getIndex(4, 2) },
            { type: 'split', from_index: getIndex(3, 3), to_index1: getIndex(4, 2), to_index2: getIndex(4, 4) },
          ],
          selectablePieces: [getIndex(3, 1), getIndex(3, 3)],
        },
        instructions: "Click on one of the pieces in superposition and use the split move to divide it further.",
      },
      {
        title: "Measurement: Capturing Superpositions",
        description: "When you try to capture a piece in superposition, a 'measurement' occurs. The piece randomly 'collapses' to one location based on probabilities. If it's where you're capturing, success! If not, the piece appears elsewhere and your turn is wasted (counts as a pass).",
        isInformational: true,
      },
      {
        title: "Measurement: Being Captured",
        description: "If YOUR piece is in superposition and tries to capture, it's also measured first. The piece must actually be at the position you're attacking from, or the capture fails.",
        isInformational: true,
      },
    ],
  },
  // ====================
  // QUANTUM LEVEL 2 - ENTANGLEMENT
  // ====================
  {
    title: "Quantum Level 2: Entanglement",
    steps: [
      {
        title: "What is Entanglement?",
        description: "In quantum mechanics, particles can become 'entangled' - their states become correlated in a special way. In Cheqqers Level 2, when a classical piece tries to capture a piece in superposition, they become entangled instead of measuring!",
        isInformational: true,
      },
      {
        title: "Creating Entanglement",
        description: "When your solid piece attempts to capture an opponent's piece in superposition, both pieces become entangled. The capturing piece enters superposition too - in one state it captured, in another it stayed still. The pieces' fates are now linked!",
        isInformational: true,
      },
      {
        title: "Entangled States",
        description: "Entangled pieces are shown connected by a line. When either entangled piece is measured, both collapse together! Their outcomes are correlated - if the capture happened in one reality, both pieces reflect that.",
        isInformational: true,
      },
      {
        title: "Strategic Implications",
        description: "Entanglement adds strategic depth! You can create complex board states where multiple pieces have correlated fates. Choosing when to trigger measurement becomes crucial.",
        isInformational: true,
      },
    ],
  },
  // ====================
  // QUANTUM LEVEL 3 - INTERFERENCE
  // ====================
  {
    title: "Quantum Level 3: Interference",
    steps: [
      {
        title: "What is Interference?",
        description: "In quantum mechanics, waves can combine and either reinforce (constructive interference) or cancel out (destructive interference). In Cheqqers Level 3, parts of a superposition can merge back together!",
        isInformational: true,
      },
      {
        title: "The Merge Move",
        description: "If two parts of the same superposition can both move to the same square, you can perform a 'merge' move. Due to quantum phases, the probabilities redistribute - they don't simply add up! Look for the merge icon (arrows pointing inward).",
        scenario: {
          pieces: {
            [getIndex(4, 0)]: { color: 0, crowned: false },
            [getIndex(4, 4)]: { color: 0, crowned: false },
          },
          superpositions: {
            [getIndex(4, 0)]: 0.5,
            [getIndex(4, 4)]: 0.5,
          },
          validMoves: [
            { type: 'merge', from_index1: getIndex(4, 0), from_index2: getIndex(4, 4), to_index: getIndex(5, 2) },
          ],
          selectablePieces: [],
        },
        instructions: "See the merge icon on the square between the two pieces? Click it to perform a merge move.",
      },
      {
        title: "Interference Effects",
        description: "When pieces merge, quantum interference affects the result. Depending on the phases (which accumulate with each move), the merge might: concentrate probability on the target square, leave some probability on source squares, or create complex probability distributions.",
        isInformational: true,
      },
      {
        title: "True Quantum Behavior",
        description: "This interference is truly quantum - it cannot be simulated by simply tracking probabilities! The game actually computes quantum states using real quantum mechanics math. This makes Level 3 the most authentic quantum game experience.",
        isInformational: true,
      },
    ],
  },
  // ====================
  // CONCLUSION
  // ====================
  {
    title: "Ready to Play!",
    steps: [
      {
        title: "You're Ready!",
        description: "Congratulations! You now understand all the rules of Cheqqers. Start with Classical (Level 0) to practice the basics, then work your way up to Level 3 to experience full quantum gameplay!",
        isInformational: true,
      },
      {
        title: "Tips for Quantum Play",
        description: "• Use split moves to create strategic flexibility\n• Remember that capturing triggers measurement\n• In Level 2, entanglement lets you avoid immediate measurement\n• In Level 3, merge moves can concentrate your pieces\n• The player who masters probability management often wins!",
        isInformational: true,
      },
    ],
  },
];

// Total number of steps across all sections
export const getTotalSteps = (): number => {
  return tutorialSections.reduce((total, section) => total + section.steps.length, 0);
};

// Get a specific step by global index
export const getStepByIndex = (globalIndex: number): { section: TutorialSection; step: TutorialStep; sectionIndex: number; stepIndex: number } | null => {
  let currentIndex = 0;
  for (let sectionIndex = 0; sectionIndex < tutorialSections.length; sectionIndex++) {
    const section = tutorialSections[sectionIndex];
    for (let stepIndex = 0; stepIndex < section.steps.length; stepIndex++) {
      if (currentIndex === globalIndex) {
        return { section, step: section.steps[stepIndex], sectionIndex, stepIndex };
      }
      currentIndex++;
    }
  }
  return null;
};
