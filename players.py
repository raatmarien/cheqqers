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
import random

from enums import GameState
from moves import ClassicalMove, SplitMove, MergeMove
from game import Game
from mcts import MCTS


class Player:
    def get_move(self, game: Game):
        raise NotImplementedError()


class CliPlayer(Player):
    def get_move(self, game: Game):
        print(f"Turn: {game.turn.name}")
        print("Chances:")
        print(game.get_all_chances())
        print("Board:")
        print(game.board.display())
        
        moves = game.board.get_possible_moves(game.turn, game.superpositions)
        
        print("Possible moves:")
        for idx, move in enumerate(moves):
            if isinstance(move, ClassicalMove):
                from_x, from_y = game.board.index_xy_map[move.from_index]
                to_x, to_y = game.board.index_xy_map[move.to_index]
                print(f"{idx}: Move from ({from_x}, {from_y}) to ({to_x}, {to_y})")
            elif isinstance(move, SplitMove):
                from_x, from_y = game.board.index_xy_map[move.from_index]
                to_x1, to_y1 = game.board.index_xy_map[move.to_index1]
                to_x2, to_y2 = game.board.index_xy_map[move.to_index2]
                print(f"{idx}: Split move from ({from_x}, {from_y}) to ({to_x1}, {to_y1}) and ({to_x2}, {to_y2})")
            elif isinstance(move, MergeMove):
                from_x1, from_y1 = game.board.index_xy_map[move.from_index1]
                from_x2, from_y2 = game.board.index_xy_map[move.from_index2]
                to_x, to_y = game.board.index_xy_map[move.to_index]
                print(f"{idx}: Merge move from ({from_x1}, {from_y1}) and ({from_x2}, {from_y2}) to ({to_x}, {to_y})")
        
        move_idx = int(input("Enter the move index: ").strip())
        return moves[move_idx]


class RandomPlayer(Player):
    def get_move(self, game: Game):
        moves = game.board.get_possible_moves(game.turn, game.superpositions)
        return random.choice(moves)


class MctsPlayer(Player):
    def __init__(self, is_white_player: bool, args: dict = None):
        self.args = args
        if args is None:
            self.args = {
                "C": 1.4,  # srqt 2
                "num_searches": 50,  # Budget per rollout
                "num_simulations": 1,  # Budget for extra simulations per node
                "attempt": 0,
            }

        self.goal_state = GameState.WHITE_WON
        if not is_white_player:
            self.goal_state = GameState.BLACK_WON

        self.mcts = MCTS(self.args, self.goal_state)

    def get_move(self, game: Game):
        return self.mcts.search(game)
