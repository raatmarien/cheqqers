from enum import Enum
import copy
import cirq
import random
import numpy as np
from players import *
from qcheckers_with_interference import Game, GameState, PieceColor

def run_game(size, start_rows, agent1, agent2):
    game = Game(size=size, start_rows=start_rows)

    p1 = random_bot()
    p2 = random_bot()

    args_low = {
        "C": 1.4,  # srqt 2
        "num_searches": 800,  # Budget per rollout
        "num_simulations": 2,  # Budget for extra simulations per node
        "attempt": 0,
    }
    p2 = mcts_bot(args_low)
    
    while game.get_game_state() == GameState.IN_PROGRESS:
        
        # moves = game.board.get_possible_moves(game.turn, game.superpositions)
        selected_move = p1.select_move(game) if game.turn == PieceColor.WHITE else p2.select_move(game)
        game.apply_move(selected_move)
    
    if game.get_game_state() == GameState.WHITE_WON:
        print("White won the game!")
    elif game.get_game_state() == GameState.BLACK_WON:
        print("Black won the game!")
    else:
        print("The game is a draw!")    


if __name__ == '__main__':
    run_game(5, 1, None, None)
