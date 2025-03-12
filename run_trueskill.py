from enum import Enum
import copy
import cirq
import random
import numpy as np
from players import *
import trueskill
from qcheckers_with_interference import Game, GameState, PieceColor, GameType

def generate_matches(agents):
    matches = []
    num_agents = len(agents)

    for i in range(num_agents):
        for j in range(i + 1, num_agents):
            matches.append( (agents[i], agents[j]))  # Agent i as player 1, Agent j as player 2
            matches.append( (agents[j], agents[i]))  # Agent j as player 1, Agent i as player 2
    return matches

args_low = {
    "C": 1.4,  # srqt 2
    "num_searches": 200,  # Budget per rollout
    "num_simulations": 1,  # Budget for extra simulations per node
    "attempt": 0,
}
args_medium = {
    "C": 1.4,  # srqt 2
    "num_searches": 400,  # Budget per rollout
    "num_simulations": 1,  # Budget for extra simulations per node
    "attempt": 0,
}
args_high = {
    "C": 1.4,  # srqt 2
    "num_searches": 800,  # Budget per rollout
    "num_simulations": 1,  # Budget for extra simulations per node
    "attempt": 0,
}

def run_tournament(size, start_rows, num_iterations, game_type):
    env = trueskill.TrueSkill()

    ratings = {
        "random": trueskill.Rating(),
        "low_mcts": trueskill.Rating(),
        "medium_mcts": trueskill.Rating(),
        "high_mcts": trueskill.Rating(),
    }

    for k in range(num_iterations):
        sd = random.randint(0, 100000000000000000)
        random.seed(sd)

        # print("Running iteration", k)

        
        agent_names = ['random', 'low_mcts', 'medium_mcts', 'high_mcts']
        matches = generate_matches(range(4))
        # print("Matches:", matches)

        # For each match
        for i, j in matches:

            # print("\t Match:", agent_names[i], "vs", agent_names[j])
            # Translate ruleset to right Game
            game = Game(size=size, start_rows=start_rows, game_type=game_type)
            # Generate new agents
            white = GameState.WHITE_WON
            black = GameState.BLACK_WON
            agents_white = [random_bot(), mcts_bot(args_low, white), mcts_bot(args_medium, white), mcts_bot(args_high, white)]
            agents_black = [random_bot(), mcts_bot(args_low, black), mcts_bot(args_medium, black), mcts_bot(args_high, black)]

            p1 = agents_white[i]
            p2 = agents_black[j]

            while game.get_game_state() == GameState.IN_PROGRESS:
                selected_move = p1.select_move(game) if game.turn == PieceColor.WHITE else p2.select_move(game)
                game.apply_move(selected_move)

            # Get game statistics
            if game.get_game_state() == GameState.WHITE_WON:
                new_r1, new_r2 = env.rate_1vs1(ratings[agent_names[i]], ratings[agent_names[j]])
            elif game.get_game_state() == GameState.BLACK_WON:
                new_r2, new_r1 = env.rate_1vs1(ratings[agent_names[j]], ratings[agent_names[i]])
            else:  # draw
                new_r1, new_r2 = env.rate_1vs1(ratings[agent_names[i]], ratings[agent_names[j]], drawn=True)

            ratings[agent_names[i]] = new_r1
            ratings[agent_names[j]] = new_r2

    return ratings


if __name__ == '__main__':
    print("Experiment 5x5 with 150 games per agent")
    for game_type in [GameType.CLASSIC, GameType.SUPERPOSITION, GameType.ENTANGLEMENT, GameType.INTERFERENCE]:
        print(f"Playing tournament for 5x5 in mode {game_type}")
        ratings = run_tournament(5, 1, 25, game_type)
        print(ratings)
