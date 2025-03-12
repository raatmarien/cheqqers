import numpy as np
import math
import random
from copy import deepcopy
import traceback
from time import sleep
from run import GameState, PieceColor
from random import choice

class RandomBot:
    def select_move(self, game):
        possible_moves = game.board.get_possible_moves(game.turn, game.superpositions)
        try:
            if len(possible_moves) == 1:
                return possible_moves[0]
            return choice(possible_moves)
        except Exception:
            print(traceback.format_exc())
            print(possible_moves)
            return None  # Safe fallback

class MCTS:
    def __init__(self, args):
        self.args = args

    def search(self, game):
        self.game = deepcopy(game)
        self.root_color = game.turn
        self.root = Node(self.game, self.args, self.root_color)

        possible_moves = self.game.board.get_possible_moves(self.game.turn, self.game.superpositions)

        if len(possible_moves) == 1:
            return possible_moves[0]

        for _ in range(self.args["num_searches"]):
            # Start from the root
            node = self.root

            # Traverse down as far as possible from here
            while node.is_fully_expanded():
                node = node.select()

            result = node.game.get_game_state().value

            # If the game has ended
            if result != GameState.IN_PROGRESS.value:
                value = 0.5 if result == GameState.DRAW else (0 if result == GameState.BLACK_WON else 1)
                node.backpropagate(value)
            else:
                # Expand all children
                for child in node.expand():
                    value = sum( child.simulate() for _ in range(self.args["num_simulations"]) )
                    child.backpropagate(value)

        action_probs = np.array([child.visit_count for child in self.root.children])
        return self.root.children[np.argmax(action_probs)].move

class Node:
    def __init__(self, game, args, root_color, move=None, parent=None, weight=1):
        self.game = deepcopy(game)
        self.args = args
        self.move = move
        self.root_color = root_color 
        self.parent = parent
        self.weight = weight
        self.children = []
        self.expandable_moves = self.game.board.get_possible_moves(self.game.turn, self.game.superpositions)
        self.visit_count = 0
        self.value_sum = 0

    def is_fully_expanded(self):
        return len(self.expandable_moves) == 0 and len(self.children) > 0

    def select(self):
        best_children = []
        best_ucb = -np.inf
        for child in self.children:
            ucb = self.get_ucb(child)
            if ucb > best_ucb:
                best_children = [child]
                best_ucb = ucb
            elif ucb == best_ucb:
                best_children.append(child)
        return random.choice(best_children) if best_children else random.choice(self.children)

    def get_ucb(self, child):
        q_value = child.value_sum / (child.visit_count + 1e-6)
        if child.game.turn == self.game.turn:
            q_value = 1 - q_value
        return child.weight * (q_value + self.args["C"] * (math.sqrt(math.log(self.visit_count + 1) / (child.visit_count + 1e-6))))

    def expand(self):
        if not self.expandable_moves:
            return []

        action = random.choice(self.expandable_moves)
        self.expandable_moves.remove(action)

        new_game = deepcopy(self.game)
        new_game.apply_move(action)

        child = Node(new_game, self.args, self.root_color, action, self, 1)
        self.children.append(child)
        return [child]

    def simulate(self):
        sim_game = deepcopy(self.game)
        rollout_limit = self.args.get("rollout", 100)

        p1, p2 = RandomBot(), RandomBot()
        counter = 0

        while sim_game.get_game_state() == GameState.IN_PROGRESS and counter < rollout_limit:
            selected_move = p1.select_move(sim_game) if sim_game.turn == PieceColor.WHITE else p2.select_move(sim_game)
            sim_game.apply_move(selected_move)
            counter += 1

        result = sim_game.get_game_state()
        return 1 if (result == GameState.WHITE_WON and self.root_color == PieceColor.WHITE) or (result == GameState.BLACK_WON and self.root_color == PieceColor.BLACK) else 0

    def backpropagate(self, value):
        self.value_sum += value
        self.visit_count += 1

        if self.parent:
            adjusted_value = 1 - value if self.parent.game.turn != self.game.turn else value
            self.parent.backpropagate(adjusted_value)