# https://www.youtube.com/watch?v=wuSQpLinRB4&list=WL&index=31&t=4650s&ab_channel=freeCodeCamp.org

import numpy as np
import math
from enums import CheckersResult, CheckersPlayer, MoveType
import random
from copy import deepcopy
from quantum_checkers import Sim_Checkers, Checkers
import traceback
from time import sleep

def write_to_file(file_name, text):
    temp = open(file_name, "a")
    temp.write(text)
    temp.close()

class MCTS():
    def __init__(self, game, args):
        # self.game = deepcopy(game)
        self.game = game.get_copy()
        self.args = args
        self.root = Node(self.game, self.args)

    def search(self):
        # Define root node
        inp = False
        for srch in range(self.args['num_searches']):
            # if(inp):
                # input(f"###############Press enter to start search {i}")
            # print(f"Search {srch}")
            node = self.root
            # print("ROOT NODE")
            # print(node.game.get_sim_board())
            # print("entagled objects: ", len(node.game.entangled_objects))
            # for i in node.game.entangled_objects:
            #     i.print_all()
            # print(f"Fully expandend: {node.is_fully_expanded()}")
            while node.is_fully_expanded():
                node = node.select()
            print("Selected NODE")
            print(node.game.get_sim_board())
            print("entagled objects: ", len(node.game.entangled_objects))
            for i in node.game.entangled_objects:
                i.print_all()
            result = node.game.status

            # If it is a leaf node
            if(result != CheckersResult.DRAW and result != CheckersResult.UNFINISHED):
                # print(node.game.status)
                if(node.game.player == CheckersPlayer.BLACK):
                    if(result == CheckersResult.BLACK_WINS):
                        value = 0
                    else:
                        value = 1
                else:
                    if(result == CheckersResult.WHITE_WINS):
                        value = 0
                    else:
                        value = 1
                # if(node.game.player == self.game.player): # player can move twice in a row
                #     value = -1
                # elif(node.game.player != self.game.player):
                #     value = 1
                # print(value)
                node.backpropogate(value)
            elif(result == CheckersResult.DRAW):
                value = 0
                node.backpropogate(value)
            else: # game unfinished
                print("Expanding")
                nodes = node.expand() # Can add multiple nodes if quantum state is measured
                print("After expanding NODE")
                print(node.game.get_sim_board())
                print(node.game.classical_squares.keys())
                print("entagled objects: ", len(node.game.entangled_objects))
                for i in node.game.entangled_objects:
                    i.print_all()
                for node in nodes:
                    value = 0
                    for i in range(self.args['num_simulations']):
                        value += node.simulate()
                    print("After simulating NODE")
                    print(node.game.get_sim_board())
                    print(node.game.classical_squares.keys())
                    print("entagled objects: ", len(node.game.entangled_objects))
                    if(len(node.game.entangled_objects) > 0):
                        inp = True
                    # backpropogation
                    node.backpropogate(value)

        action_probs = np.zeros(len(self.root.children))
        for idx, child in enumerate(self.root.children):
            action_probs[idx] = child.visit_count
        # print(action_probs)
        # action_probs /= np.sum(action_probs) # normalize
        # print(action_probs)
        # self.root = # Chance root node to keep part of tree that has been simulated
        # print("All moves: ")
        # for idx, child in enumerate(self.root.children):
        #     print(f"{action_probs[idx]:.2f}: ", end="")
        #     child.move.print_move()

        str = "All moves: \n"
        str += f"Own visits: {self.root.visit_count}\n"
        for idx, child in enumerate(self.root.children):
            str += f"{action_probs[idx]:.2f}: "
            str += child.move.get_move()
            str += "\n"
            str += f"{child.visit_count} visits\n"
            str += f"{child.value_sum} value\n"
            str+= f"{child.weight} weight\n"
            ucb = self.root.get_ucb(child)
            str+= f"{ucb} ucb\n"
        file_name = f"attempts/log_{self.args['attempt']}.txt"
        write_to_file(file_name, str + "\n")
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
        # print(f"Legal moves: {(self.game.legal_moves)}")
        # print(self.game.get_sim_board())
        self.expandable_moves = self.game.legal_moves
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
                best_children = [child]  # Reset the list if found a better child
                best_ucb = ucb
            elif ucb == best_ucb:
                best_children.append(child)  # Add to the list if it's tied
        return random.choice(best_children)
    
    def get_ucb(self, child):
        # q_value is what child think of itself so we reverse it
        # TODO: fix with checkers being able to move twice in a row
        # q_value = (((child.value_sum / child.visit_count) + 1) / 2)
        q_value = (child.value_sum / child.visit_count)
        if(child.game.player == self.game.player):
            q_value = 1 - q_value
        # return (child.value_sum / child.visit_count) + self.args['C'] * (math.sqrt(math.log(self.visit_count) / child.visit_count))
        return child.weight * (q_value + self.args['C'] *(math.sqrt(math.log(self.visit_count) / child.visit_count)))
        
    def expand(self):
        print("*"*100)
        print(self.game.get_sim_board())
        for i in self.game.entangled_objects:
            i.print_all()
        print("Expandable moves:")
        
        for move in self.expandable_moves:
            move.print_move()
        action = random.choice(self.expandable_moves)
        print("Chosen move: ", end="")
        action.print_move()
        self.expandable_moves.remove(action)

        # child_state = self.state.copy()
        # child_state = self.game.get_next_state(child_state, action, 1)
        # Change player (if not handled?)
        # child_state = deepcopy(self.game)
        if(action.movetype == MoveType.TAKE):
            try:
                child_states, weights = self.game.return_all_possible_states(action)
            except Exception as error:
                # print("%"*100)
                # self.backprop_print()
                # print("%"*100)
                print("Error in expand")
                print(traceback.format_exc())
                print(self.game.get_sim_board())
                exit()
            # temp = self.game.get_copy()
            # temp.player_move(action)
            # child_states = [temp]
            # weights = [1]
            # print( "True")
        else:
            temp = self.game.get_copy()
            # temp = deepcopy(self.game)
            temp.player_move(action)
            child_states = [temp]
            weights = [1]
        to_backprop = []
        print("Child states: ", child_states)
        print(weights)
        for i, child_state in enumerate(child_states):
            # print(f"Length of legal moves new child: {len(child_state.legal_moves)}")
            # print(child_state.get_sim_board())
            child = Node(child_state, self.args, action, self, weights[i])
            if(type(weights[i]) != int and type(weights[i]) != float):
                print("Weight is not int or float")
                print(weights[i])
                print(type(weights[i]))
                exit()
            self.children.append(child)
            to_backprop.append(child)
        return to_backprop

    def simulate(self):
        # Simulate is from the persepective of the parent node
        sim_game = self.game.get_copy()
        # sim_game.SIMULATE_QUANTUM = True
        rollout_player = sim_game.player
        prev_board = sim_game.get_sim_board()
        while True:
            if(sim_game.status == CheckersResult.UNFINISHED):
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
                    print(sim_game.status)
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
                if(rollout_player == CheckersPlayer.BLACK): # because player just changed to other player. If black finished the last game by winning, the player changed to white just before the game finished
                    if(sim_game.status == CheckersResult.BLACK_WINS):
                        return 0
                    else:
                        return 1
                else:
                    if(sim_game.status == CheckersResult.WHITE_WINS):
                        return 0
                    else:
                        return 1
            else: #draw
                return 0

    def backprop_print(self):
        print(self.game.get_sim_board())
        print(self.game.related_squares)
        for i in self.game.entangled_objects:
            print(i.all_ids)
        if(self.parent != None):
            self.parent.backprop_print()

    def backpropogate(self, value):
        self.value_sum += value
        self.visit_count += 1
        # if(self.parent != None and self.game.player != self.parent.game.player):
        if(self.parent != None and self.parent.game.player != self.game.player):
            value = 1 - value
        # value = value * -1
        if(self.parent != None):
            self.parent.backpropogate(value)

