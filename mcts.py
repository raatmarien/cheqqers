# https://www.youtube.com/watch?v=wuSQpLinRB4&list=WL&index=31&t=4650s&ab_channel=freeCodeCamp.org

import numpy as np
import math
from enums import CheckersResult, CheckersPlayer, MoveType
import random
from copy import deepcopy
from quantum_checkers import Sim_Checkers
import traceback

args = {
    'C': 1.41, # sqrt of 2
    'num_searches': 100 #Budget per rollout
}


class MCTS():
    def __init__(self, game, args):
        self.game = game
        game.SIMULATE_QUANTUM = True 
        self.args = args
        self.root = Node(self.game, self.args)

    def search(self):
        # Define root node
        for srch in range(self.args['num_searches']):
            # print(f"Search {srch}")
            node = self.root
            # print(f"Fully expandend: {node.is_fully_expanded()}")
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
                nodes = node.expand() # Can add multiple nodes if quantum state is measured
                for node in nodes:
                    # print(node.game.get_sim_board())
                    value = node.simulate()
                    # backpropogation
                    node.backpropogate(value)

        action_probs = np.zeros(len(self.root.children))
        for idx, child in enumerate(self.root.children):
            action_probs[idx] = child.visit_count
        action_probs /= np.sum(action_probs) # normalize
        # self.root = # Chance root node to keep part of tree that has been simulated
        # for idx, child in enumerate(self.root.children):
        #     print(f"{action_probs[idx]:.2f}: ", end="")
        #     child.move.print_move()
        return self.root.children[np.argmax(action_probs)].move
    
    # def new_root(self, move):
    #     self.root = node


class Node():
    def __init__(self, game, args, move=None, parent=None, weight = 1) -> None:
        self.game = game
        self.args = args
        self.move = move # the move done to get to this state
        self.parent = parent
        self.weight = weight

        self.children = []
        self.expandable_moves = self.game.legal_moves
        self.visit_count = 0
        self.value_sum = 0

    def is_fully_expanded(self):
        return len(self.expandable_moves) == 0 and len(self.children) > 0
    
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
        q_value = (((child.value_sum / child.visit_count) + 1) / 2)
        if(child.game.player != self.game.player):
            q_value = 1 - q_value
        return child.weight * (q_value + self.args['C'] * math.sqrt(math.log(self.visit_count / child.visit_count)))
        
    def expand(self):
        action = random.choice(self.expandable_moves)
        self.expandable_moves.remove(action)

        # child_state = self.state.copy()
        # child_state = self.game.get_next_state(child_state, action, 1)
        # Change player (if not handled?)
        # child_state = deepcopy(self.game)
        if(action.movetype == MoveType.TAKE):
            child_states, weights = self.game.return_all_possible_states(action)
            # child_state.player_move(action, child_state.player)
            # print( "True")
        else:
            temp = Sim_Checkers(run_on_hardware=False, num_vertical=self.game.num_vertical, num_horizontal=self.game.num_horizontal, num_vertical_pieces=self.game.num_vertical_pieces, classical_squares=deepcopy(self.game.classical_squares), related_squares=deepcopy(self.game.related_squares), q_rel_moves=deepcopy(self.game.q_rel_moves), q_moves=deepcopy(self.game.q_moves), superposition_pieces=deepcopy(self.game.superposition_pieces), status=deepcopy(self.game.status), moves_since_take=deepcopy(self.game.moves_since_take), king_squares=deepcopy(self.game.king_squares), legal_moves=[], rules=self.game.rules)
            temp.player_move(action)
            child_states = [temp]
            weights = [1]
        for i, child_state in enumerate(child_states):
            # print(f"Length of legal moves new child: {len(child_state.legal_moves)}")
            # print(child_state.get_sim_board())
            child = Node(child_state, self.args, action, self, weights[i])
            self.children.append(child)
        return self.children

    def simulate(self):
        sim_game = Sim_Checkers(run_on_hardware=False, num_vertical=self.game.num_vertical, num_horizontal=self.game.num_horizontal, num_vertical_pieces=self.game.num_vertical_pieces, classical_squares=deepcopy(self.game.classical_squares), related_squares=deepcopy(self.game.related_squares), q_rel_moves=deepcopy(self.game.q_rel_moves), q_moves=deepcopy(self.game.q_moves), superposition_pieces=deepcopy(self.game.superposition_pieces), status=deepcopy(self.game.status), moves_since_take=deepcopy(self.game.moves_since_take), king_squares=deepcopy(self.game.king_squares), legal_moves=deepcopy(self.game.legal_moves),rules=self.game.rules)
        # sim_game.SIMULATE_QUANTUM = True
        rollout_player = sim_game.player
        prev_board = sim_game.get_sim_board()
        while True:
            if(sim_game.result() == CheckersResult.UNFINISHED):
                # print(len(sim_game.legal_moves))
                # if(len(sim_game.legal_moves) == 0):
                #     print(prev_board)
                #     print(sim_game.get_sim_board())
                #     print(len(sim_game.calculate_possible_moves()))
                try: 
                    move = random.choice(sim_game.legal_moves)
                    sim_game.player_move(move)
                except Exception as error:
                    print("TEST")
                    print(traceback.format_exc())
                    print(len(sim_game.legal_moves))
                    if(len(sim_game.legal_moves) > 0):
                        move.print_move()
                       
                    leg2 = sim_game.calculate_possible_moves()
                    print(len(leg2))
                    if(len(leg2) > 0):
                        leg2[0].print_move()
                    # print(prev_board)
                    print(sim_game.get_sim_board())
                   
                    print(sim_game.classical_squares.keys())
                    print(sim_game.status)
                    exit()
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
            prev_board = sim_game.get_sim_board()

    def backpropogate(self, value):
        self.value_sum += value
        self.visit_count += 1
        if(self.parent != None and self.game.player != self.parent.game.player):
            value = value*-1
        if(self.parent != None):
            self.parent.backpropogate(value)

