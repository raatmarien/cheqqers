# Copyright 2025 Marien Raat <mail@marienraat.nl>
#
# This file is part of Cheqqers.
#
# Cheqqers is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Cheqqers is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with Cheqqers. If not, see
# <https://www.gnu.org/licenses/>.
import unittest

from enums import ClassicalSquareState
from game import Game
from moves import SplitMove, ClassicalMove
from quantum_state import PieceSuperposition


class TestQuantumMeasurement(unittest.TestCase):
    def setUp(self):
        """Set up a simple 4x4 board to avoid complexity."""
        self.board_size = 4
        self.start_rows = 1
        self.game = Game(self.board_size, self.start_rows)

    def test_measure_two_square_superposition(self):
        """Test that a piece in superposition between two squares collapses to one."""
        # Manually create a split move
        move = SplitMove(
            is_take_move=False, from_index=1,
            to_index1=2, to_index2=3)
        self.game.superpositions.append(PieceSuperposition.create(move, 0))
        self.game.board.classic_occupancy[2] = ClassicalSquareState.QUANTUM
        self.game.board.classic_occupancy[3] = ClassicalSquareState.QUANTUM

        # Measure at square 2
        measured = self.game.measure(2)

        # Expect one of the squares to be occupied, the other empty
        occupied_squares = [
            i for i in [2, 3] if self.game.board.classic_occupancy[i] == ClassicalSquareState.OCCUPIED
        ]
        empty_squares = [
            i for i in [2, 3] if self.game.board.classic_occupancy[i] == ClassicalSquareState.EMPTY
        ]

        self.assertEqual(len(occupied_squares), 1, "Measurement should collapse to exactly one square")
        self.assertEqual(len(empty_squares), 1, "Measurement should clear the other square")

    def test_measure_three_square_superposition(self):
        """Test that a piece in superposition between three squares collapses to one."""
        move1 = SplitMove(
            is_take_move=False, from_index=1,
            to_index1=2, to_index2=3)
        move2 = SplitMove(
            is_take_move=False, from_index=2,
            to_index1=4, to_index2=5)

        superposition = PieceSuperposition.create(move1, 0)
        superposition.apply_move(move2)
        self.game.superpositions.append(superposition)

        self.game.board.classic_occupancy[3] = ClassicalSquareState.QUANTUM
        self.game.board.classic_occupancy[4] = ClassicalSquareState.QUANTUM
        self.game.board.classic_occupancy[5] = ClassicalSquareState.QUANTUM

        measured = self.game.measure(3)

        occupied_squares = [
            i for i in [3, 4, 5] if self.game.board.classic_occupancy[i] == ClassicalSquareState.OCCUPIED
        ]
        empty_squares = [
            i for i in [3, 4, 5] if self.game.board.classic_occupancy[i] == ClassicalSquareState.EMPTY
        ]

        self.assertEqual(len(occupied_squares), 1, "Measurement should collapse to exactly one square")
        self.assertEqual(len(empty_squares), 2, "Measurement should clear the other two squares")

    def test_measure_after_classical_move(self):
        """Test that measuring after a classical move results in the expected collapse."""
        move1 = SplitMove(
            is_take_move=False, from_index=1,
            to_index1=2, to_index2=3)
        move2 = ClassicalMove(
            is_take_move=False, from_index=3, to_index=4)

        superposition = PieceSuperposition.create(move1, 0)
        superposition.apply_move(move2)
        self.game.superpositions.append(superposition)

        self.game.board.classic_occupancy[4] = ClassicalSquareState.QUANTUM
        self.game.measure(4)

        # Expect piece to collapse at square 4 or 2
        self.assertTrue(self.game.board.classic_occupancy[4] == ClassicalSquareState.OCCUPIED or
                        self.game.board.classic_occupancy[2] == ClassicalSquareState.OCCUPIED)
        self.assertEqual(self.game.board.classic_occupancy[3], ClassicalSquareState.EMPTY)
