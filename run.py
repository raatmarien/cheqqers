from enum import Enum
import copy
import cirq
import random
import numpy as np
from players import *
from qcheckers_with_interference import Game, GameState, PieceColor, GameType

def run_game(size, start_rows, game_type):
    args_low = {
        "C": 1.4,  # srqt 2
        "num_searches": 800,  # Budget per rollout
        "num_simulations": 1,  # Budget for extra simulations per node
        "attempt": 0,
    }
    win_mcts_white = 0
    win_mcts_black = 0
    for mcts_white, p1, p2 in [(True, mcts_bot(args_low, GameState.WHITE_WON), random_bot()),
                               (False, random_bot(), mcts_bot(args_low, GameState.BLACK_WON))]:

        game = Game(size=size, start_rows=start_rows, game_type=game_type)
            
        while game.get_game_state() == GameState.IN_PROGRESS:
            # moves = game.board.get_possible_moves(game.turn, game.superpositions)
            selected_move = p1.select_move(game) if game.turn == PieceColor.WHITE else p2.select_move(game)
            game.apply_move(selected_move)
        
        if game.get_game_state() == GameState.WHITE_WON:
            if mcts_white:
                win_mcts_white = 1
        elif game.get_game_state() == GameState.BLACK_WON:
            if not mcts_white:
                win_mcts_black = 1
        elif game.get_game_state() == GameState.DRAW:
            if mcts_white:
                win_mcts_white = 0.5
            else:
                win_mcts_black = 0.5
    return win_mcts_white, win_mcts_black
    

if __name__ == '__main__':
    for game_type in [GameType.CLASSIC, GameType.SUPERPOSITION, GameType.ENTANGLEMENT, GameType.INTERFERENCE]:
        print(f"Playing for {game_type}")
        amount = 100
        wins_as_white = 0
        wins_as_black = 0
        loss_as_white = 0
        loss_as_black = 0
        for _ in range(amount):
            win_white, win_black = run_game(5, 1, game_type)
            if win_white == 1:
                wins_as_white += 1
            elif win_white == 0:
                loss_as_white += 1
            if win_black:
                wins_as_black += 1
            elif win_black == 0:
                loss_as_black += 1
        print(f"Percentage won as white: {wins_as_white/amount}")
        print(f"Percentage lost as white: {loss_as_white/amount}")
        print(f"Percentage won as black: {wins_as_black/amount}")
        print(f"Percentage lost as black: {loss_as_black/amount}")
