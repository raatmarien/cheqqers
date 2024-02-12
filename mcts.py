# https://www.youtube.com/watch?v=wuSQpLinRB4&list=WL&index=31&t=4650s&ab_channel=freeCodeCamp.org

import numpy as np
import math
from enums import CheckersResult, CheckersPlayer, MoveType
import random
from copy import deepcopy

args = {
    'C': 1.41,
    'num_searches': 1000
}


class MCTS():
    def __init__(self, game, args):
        self.game = game
        game.SIMULATE_QUANTUM = True 
        self.args = args

    def search(self, state):
        # Define root node
        root = Node(self.game, self.args, state)

        for srch in range(self.args['num_searches']):
            node = root
            while node.is_fully_expanded():
                node = node.select()

            result = node.game.result()
            if(result != CheckersResult.DRAW and result != CheckersResult.UNFINISHED):
                if(node.game.player == self.game.player): # player can move twice in a row
                    value = 1
                elif(node.game.player != self.game.player):
                    value = -1
            elif(result == CheckersResult.DRAW):
                value = 0
            else: # game unfinished
                node = node.expand()
                value = node.simulate()
            # backpropogation
            node.backpropogate(value)

        action_probs = np.zeros(len(root.game.legal_moves))
        for idx, child in enumerate(root.children):
            action_probs[idx] = child.visit_count
        action_probs /= np.sum(action_probs) # normalize
        return action_probs

class Node():
    def __init__(self, game, args, parent=None) -> None:
        self.game = game
        self.args = args
        self.state = state
        self.parent = parent
        self.action_taken = action_taken

        self.children = []
        self.expandable_moves = self.game.legal_moves
        self.visit_count = 0
        self.value_sum = 0

    def is_fully_expanded(self):
        return np.sum(self.expandable_moves) == 0 and len(self.children) > 0
    
    def select(self):
        best_child = None
        best_ucb = -np.inf

        for child in self.children:
            ucb = self.get_ucb(child)
            if ucb > best_ucb:
                best_child = child
                best_ucb = ucb
        
        return best_child
    
    def get_ucb(self, child):
        # q_value is what child think of itself so we reverse it
        # TODO: fix with checkers being able to move twice in a row
        q_value = 1 - (((child.value_sum / child.visit_count) + 1) / 2)
        return q_value + self.args['C'] * math.sqrt(math.log(self.visit_count / child.visit_count))
        
    def expand(self):
        action = random.choice(self.expandable_moves)
        self.expandable_moves.remove(action)

        # child_state = self.state.copy()
        # child_state = self.game.get_next_state(child_state, action, 1)
        # Change player (if not handled?)
        child_state = deepcopy(self.game)
        if(action.movetype == MoveType.TAKE):
            # Multiple states can come from this move.
        child_state.player_move(action, child_state.player)

        child = Node(child_state, self.args, self)
        self.children.append(child) # TODO: What if we measured? Different states from a move?

    def simulate(self):
        sim_game = deepcopy(self.game)
        # sim_game.SIMULATE_QUANTUM = True
        rollout_player = sim_game.player 
        while True:
            if(sim_game.status == CheckersResult.UNFINISHED):
                sim_game.player_move(random.choice(sim_game.legal_moves))
            elif(sim_game.status == CheckersResult.BLACK_WINS or sim_game.status == CheckersResult.WHITE_WINS):
                if(rollout_player == CheckersPlayer.BLACK):
                    if(sim_game.status == CheckersResult.BLACK_WINS):
                        return 1
                    else:
                        return -1
                else:
                    if(sim_game.status == CheckersResult.WHITE_WINS):
                        return 1
                    else:
                        return -1
            else: #draw
                return 0   

    def backpropogate(self, value):
        self.value_sum += value
        self.visit_count += 1
        if(self.game.player != self.parent.game.player):
            value = value*-1
        if(self.parent != None):
            self.parent.backpropogate(value)

