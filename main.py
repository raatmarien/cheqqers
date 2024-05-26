import argparse
from enums import CheckersResult, CheckersRules
from interface import GameInterface
from quantum_checkers import Checkers
import time
from players import * # Imports all possible bots
import os
import glob
import math
import cProfile
import pstats
import os
import glob
import random
import trueskill

def generate_matches(agents):
    matches = []
    num_agents = len(agents)
    
    for i in range(num_agents):
        for j in range(i + 1, num_agents):
            if(agents[i] == agents[j]):
                continue
            matches.append((agents[i], agents[j]))  # Agent i as player 1, Agent j as player 2
            matches.append((agents[j], agents[i]))  # Agent j as player 1, Agent i as player 2
    return matches

def empty_attempts_folder():
    files = glob.glob('./attempts/*')
    for f in files:
        os.remove(f)

def empty_attempts():
    files = glob.glob('./attempts/*')
    for f in files:
        os.remove(f)

def write_attempt(idx, attempt_str):
        temp = open(f"./attempts/log_{idx}.txt", "a")
        temp.write(attempt_str)
        temp.close()

def main():
    args_low = {
        'C': 1.4, # srqt 2
        'num_searches': 200, # Budget per rollout
        'num_simulations': 1, # Budget for extra simulations per node
        'attempt': 0,
    }
    args_high = {
        'C': 1.4, # srqt 2
        'num_searches': 800, # Budget per rollout
        'num_simulations': 1, # Budget for extra simulations per node
        'attempt': 0,
    }
    env = trueskill.TrueSkill()
    empty_attempts_folder()
    parser = argparse.ArgumentParser()
    parser.add_argument('--num_rows', help='The number of rows of the checkboard. INT', default=8)
    parser.add_argument('--num_columns', help='The number of columns of the checkboard. INT', default=8)
    parser.add_argument('--num_vertical_pieces', help='The number of rows that are filled with checkerpieces. INT', default=1)
    parser.add_argument('--sim_q', help='Simulating quantum or actually use quantum mechanics. TRUE if you want to simulate quantum.', default="False")
    parser.add_argument('--GUI', help='If GUI is enabled. True or False', default="False")
    parser.add_argument('--p1', help='Select agent for player 1 to use.', default=human_player())
    parser.add_argument('--p2', help='Select agent for player 2 to use.', default=human_player())
    args = parser.parse_args()
    # p1 = random_bot()
    # p2 = random_bot()
    # p1 = heurisitc_bot()
    # p2 = heurisitc_bot()
    # p1 = human_player()
    # p2 = human_player()
    if(args.num_columns % 2 == 1 and args.num_rows % 2 == 0):
        warning_len = len("# WARNING: If the number of columns is uneven and the number of rows is even the board is not symmetrical. #")
        print("#"*warning_len)
        print("# WARNING: If the number of columns is uneven and the number of rows is even the board is not symmetrical. #\n# To assure an equal number of pieces, set the number of vertical pieces to an even value.                 #")
        print("#"*warning_len)
        time.sleep(5)
    file = open("./results.txt", "w")
    file.close()
    file = open("./results.txt", "a")
    rules = [CheckersRules.CLASSICAL, CheckersRules.QUANTUM_V1, CheckersRules.QUANTUM_V2]
    sizes = [5]
    agents = ["random", "heuristic", "low_mcts", "high_mcts"]
    for rule in rules:
        for size in sizes:
            args1 = None
            args2 = None
            # print(agents)
            random.shuffle(agents)
            # print(agents)
            matches = generate_matches(agents)
            print(matches)
            
            random_rating = trueskill.Rating()
            heuristic_rating = trueskill.Rating()
            mcts_low_rating = trueskill.Rating()
            mcts_high_rating = trueskill.Rating()

            for i, j in matches:
                white_mcts = False
                black_mcts = False
                args1 = None
                args2 = None
                print(i, j)
                if(i == "random"):
                    p1 = random_bot()
                    r1 = random_rating
                elif(i == "heuristic"):
                    p1 = heurisitc_bot()
                    r1 = heuristic_rating
                elif(i == "low_mcts"):
                    p1 = None
                    args1 = args_low
                    white_mcts = True
                    r1 = mcts_low_rating
                elif(i == "high_mcts"):
                    p1 = None
                    args1 = args_high
                    white_mcts = True
                    r1 = mcts_high_rating

                if(j == "random"):
                    p2 = random_bot()
                    r2 = random_rating
                elif(j == "heuristic"):
                    p2 = heurisitc_bot()
                    r2 = heuristic_rating
                elif(j == "low_mcts"):
                    p2 = None
                    args2 = args_low
                    black_mcts = True
                    r2 = mcts_low_rating
                elif(j == "high_mcts"):
                    p2 = None
                    args2 = args_high
                    black_mcts = True
                    r2 = mcts_high_rating               
                # size = 5
                # rule = CheckersRules.CLASSICAL
                times = []
                results = []
                number_of_moves = []
                avg_mcts_time = []
                movetypes = {
                    "CLASSIC": 0,
                    "SPLIT": 0,
                    "ENTANGLE": 0,
                    "TAKE": 0
                }
                file.write("-"*100 + "\n")
                file.write(f"Rule: {rule}\n")
                file.write(f"Board size: {size}x{size}\n")
                print(f"Board size: {size}x{size}, Rule: {rule}")
                iterations = 50
                for k in range(iterations):
                    args_low['attempt'] = k
                    args_high['attempt'] = k
                    sd = random.randint(0, 100000000000000000)
                    # sd = 4271756581358815
                    random.seed(sd)
                    seed_str = f"Seed: {sd}\n"
                    # write_attempt(k, seed_str)
                    if((k+1)%10 == 0):
                        print(f"Game {k}")
                    start_t = time.time()
                    checkers = Checkers(num_vertical=size, num_horizontal=size, num_vertical_pieces=args.num_vertical_pieces, SIMULATE_QUANTUM=args.sim_q, rules=rule)
                    game = GameInterface(checkers, white_player=p1, black_player=p2, GUI=args.GUI, white_mcts=white_mcts, black_mcts=black_mcts, args_1=args1, args_2=args2, print=False, attempt=k)
                    result, num_moves, avg_time, single_movetypes = (game.play())
                    results.append(result)
                    if(result == CheckersResult.WHITE_WINS):
                        new_r1, new_r2 = trueskill.rate_1vs1(r1, r2)
                    elif(result == CheckersResult.BLACK_WINS):
                        new_r2, new_r1 = trueskill.rate_1vs1(r2, r1)
                    else: # draw
                        new_r1, new_r2 = trueskill.rate_1vs1(r1, r2, drawn=True)
                    
                    if(i == "random"):
                        random_rating = new_r1
                    elif(i == "heuristic"):
                        heuristic_rating = new_r1
                    elif(i == "low_mcts"):
                        mcts_low_rating = new_r1
                    elif(i == "high_mcts"):
                        mcts_high_rating = new_r1
                    if(j == "random"):
                        random_rating = new_r2
                    elif(j == "heuristic"):
                        heuristic_rating = new_r2
                    elif(j == "low_mcts"):
                        mcts_low_rating = new_r2    
                    elif(j == "high_mcts"):
                        mcts_high_rating = new_r2

                    # if(result == CheckersResult.WHITE_WINS):
                        # print(f"########################### White wins at {i}")
                        # exit()
                    # elif(result == CheckersResult.DRAW):
                        # print(f"########################### Draw at {i}")
                        # exit()
                    number_of_moves.append(num_moves)
                    avg_mcts_time.append(avg_time)
                    times.append(time.time()-start_t)
                    for l in movetypes:
                        movetypes[l] += single_movetypes[l]
                    if((k+1)%50 == 0 and k+1 != iterations):
                        print(f"Draw: {results.count(CheckersResult.DRAW)}, White wins: {results.count(CheckersResult.WHITE_WINS)}, Black wins: {results.count(CheckersResult.BLACK_WINS)}")
                        print(f"Average number of moves: {sum(number_of_moves)/len(number_of_moves)}")
                        print(f"Average time for mcts move: {sum(avg_mcts_time)/len(avg_mcts_time)}")
                print("#"*100)
                print(f"Average time: {sum(times)/len(times)}, minimum time: {min(times)}, max time: {max(times)}")
                print(f"Average number of moves: {sum(number_of_moves)/len(number_of_moves)}")
                print(f"Average time for mcts move: {sum(avg_mcts_time)/len(avg_mcts_time)}")
                print(f"Movetypes: {movetypes}")
                print(f"Rating for white agent: [{i}]: {r1}")
                print(f"Rating for black agent: [{j}]: {r2}")
                print(f"All ratings: Random agent: {random_rating}, Heuristic agent: {heuristic_rating}, Low MCTS agent: {mcts_low_rating}, High MCTS agent: {mcts_high_rating}")
                print(f"Draw: {results.count(CheckersResult.DRAW)}, White wins: {results.count(CheckersResult.WHITE_WINS)}, Black wins: {results.count(CheckersResult.BLACK_WINS)}")
                file.write(f"Average time: {sum(times)/len(times)}, minimum time: {min(times)}, max time: {max(times)}\n")
                file.write(f"Average number of moves: {sum(number_of_moves)/len(number_of_moves)}\n")
                file.write(f"Average time for mcts move: {sum(avg_mcts_time)/len(avg_mcts_time)}\n")
                file.write(f"Movetypes: {movetypes}\n")
                file.write(f"Rating for white agent: [{i}]: {r1}")
                file.write(f"Rating for black agent: [{j}]: {r2}")
                file.write(f"All ratings: Random agent: {random_rating}, Heuristic agent: {heuristic_rating}, Low MCTS agent: {mcts_low_rating}, High MCTS agent: {mcts_high_rating}\n")
                file.write(f"Draw: {results.count(CheckersResult.DRAW)}, White wins: {results.count(CheckersResult.WHITE_WINS)}, Black wins: {results.count(CheckersResult.BLACK_WINS)}\n")
    file.close()

if __name__ == "__main__":
    main()

# Generate prof:  python3 -m cProfile -o main.prof main.py
# Visualise prof: snakeviz main.prof

# TODO:
# RETURN ALL POSSIBLE STATES WERKT NIET
# PROBLEM:
# self.entangled squares is not cleaned up properly