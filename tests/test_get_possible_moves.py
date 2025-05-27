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

from board import Board
from enums import PieceColor
from moves import SplitMove, MergeMove, ClassicalMove


class TestGetPossibleMoves(unittest.TestCase):

    def test_white_possible_moves_standard_board(self):
        """Test that the correct number of moves are available for white in a standard board setup."""
        # Create a standard checkers board (8x8 with 3 rows of pieces on each side)
        board_size = 8
        start_rows = 3
        board = Board(board_size, start_rows)

        for color in [PieceColor.WHITE, PieceColor.BLACK]:
            # Get all possible moves for white
            all_moves = board.get_possible_moves(color)

            # Extract each type of move
            classical_moves = [move for move in all_moves if isinstance(move, ClassicalMove)
                              and not isinstance(move, SplitMove) and not isinstance(move, MergeMove)]
            split_moves = [move for move in all_moves if isinstance(move, SplitMove)]
            merge_moves = [move for move in all_moves if isinstance(move, MergeMove)]

            # Check the counts
            self.assertEqual(len(classical_moves), 7,
                             f"Expected 7 classical moves, but found {len(classical_moves)}")
            self.assertEqual(len(split_moves), 3,
                             f"Expected 3 split moves, but found {len(split_moves)}")
            self.assertEqual(len(merge_moves), 0,
                             f"Expected 0 merge moves, but found {len(merge_moves)}")

            # Check the total count
            self.assertEqual(len(all_moves), 10,
                             f"Expected 10 total moves, but found {len(all_moves)}")

            # Validate a few of the classical moves by checking coordinates
            # We expect the pieces in the third row (y=2) to be able to move forward
            for move in classical_moves:
                from_x, from_y = board.index_xy_map[move.from_index]
                to_x, to_y = board.index_xy_map[move.to_index]

                if color == PieceColor.BLACK:
                    temp = to_y
                    to_y = from_y
                    from_y = temp

                # Check that the move is forward (increasing y for white)
                self.assertTrue(to_y > from_y,
                               f"Expected forward move, but move goes from y={from_y} to y={to_y}")

                # Check that the move is diagonal (x changes by 1)
                self.assertEqual(abs(to_x - from_x), 1,
                                f"Expected diagonal move, but x changes by {abs(to_x - from_x)}")

                # Check that the move is just one square (y changes by 1)
                self.assertEqual(to_y - from_y, 1,
                                f"Expected move of one square, but y changes by {to_y - from_y}")
