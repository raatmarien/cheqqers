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
import statistics
import random

from enums import GameState
from game import Game
from moves import ClassicalMove


class TestClassicalGame(unittest.TestCase):
    def test_random_classical_game(self, board_size=8, start_rows=1):
        """Run a random game of quantum checkers with only classical moves"""
        amount = 1000
        moves = []
        white_won = 0
        black_won = 0
        for _ in range(amount):
            game = Game(board_size, start_rows)
            move_count = 0

            while game.get_game_state() == GameState.IN_PROGRESS:
                possible_moves = game.board.get_possible_moves(game.turn)

                # Filter for only classical moves for this test
                classical_moves = [move for move in possible_moves
                                   if isinstance(move, ClassicalMove)]
                if not classical_moves:
                    break

                # Select a random move
                random_move = random.choice(classical_moves)

                # Apply the move
                prev_turn = game.turn
                game.apply_move(random_move)
                move_count += 1

            moves.append(move_count)
            result = game.get_game_state()
            if result == GameState.WHITE_WON:
                white_won += 1
            elif result == GameState.BLACK_WON:
                black_won += 1

        # print(statistics.mean(moves))
        # print(white_won)
        # print(black_won)

        self.assertGreater(statistics.mean(moves), 40)
        self.assertLess(statistics.mean(moves), 55)
        self.assertGreater(white_won, 350)
        self.assertLess(white_won, 500)
        self.assertGreater(black_won, 350)
        self.assertLess(black_won, 500)
