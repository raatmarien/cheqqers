import unittest
import statistics
import random

from enums import GameState, GameType
from game import Game
from moves import SplitMove, ClassicalMove


class TestEntanglementGame(unittest.TestCase):
    def test_random_entanglement_game(self, board_size=8, start_rows=1):
        """Run a random game of quantum checkers with superposition + entanglement"""
        amount = 100
        moves = []
        white_won = 0
        black_won = 0
        for _ in range(amount):
            game = Game(board_size, start_rows, GameType.ENTANGLEMENT)
            move_count = 0

            while game.get_game_state() == GameState.IN_PROGRESS:
                possible_moves = game.board.get_possible_moves(game.turn)

                # Filter for only classical moves for this test
                classical_or_split_moves = [
                    move for move in possible_moves
                    if isinstance(move, ClassicalMove) or isinstance(move, SplitMove)]
                if not classical_or_split_moves:
                    break

                # Select a random move
                random_move = random.choice(classical_or_split_moves)

                # Apply the move
                game.apply_move(random_move)
                move_count += 1

            moves.append(move_count)
            result = game.get_game_state()
            if result == GameState.WHITE_WON:
                white_won += 1
            elif result == GameState.BLACK_WON:
                black_won += 1

        print(statistics.mean(moves))
        print(white_won)
        print(black_won)
        self.assertGreater(statistics.mean(moves), 45)
        self.assertLess(statistics.mean(moves), 65)
        self.assertGreater(white_won, 20)
        self.assertLess(white_won, 45)
        self.assertGreater(black_won, 20)
        self.assertLess(black_won, 45)
