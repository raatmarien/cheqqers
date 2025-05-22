import unittest
import statistics
import random

from enums import GameState, GameType
from game import Game


class TestInterferenceGame(unittest.TestCase):
    def test_random_interference_game(self, board_size=8, start_rows=1):
        """Run a random game of quantum checkers with superposition + entanglement + interference"""
        amount = 100
        moves = []
        white_won = 0
        black_won = 0
        for _ in range(amount):
            game = Game(board_size, start_rows, GameType.INTERFERENCE)
            move_count = 0

            while game.get_game_state() == GameState.IN_PROGRESS:
                possible_moves = game.board.get_possible_moves(game.turn, game.superpositions)

                # Select a random move
                random_move = random.choice(possible_moves)

                # Apply the move
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
        self.assertLess(statistics.mean(moves), 70)
        self.assertGreater(white_won, 15)
        self.assertLess(white_won, 50)
        self.assertGreater(black_won, 15)
        self.assertLess(black_won, 50)
