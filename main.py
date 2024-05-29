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
    p1 = human_player()
    p2 = human_player()
    agent_wincount = {
        'random': 0,
        'heuristic': 0,
        'low_mcts': 0,
        'high_mcts': 0
    }
    agent_map = {
        'random': random_bot,
        'heuristic': heuristic_bot,
        'human': human_player,
        'low_mcts': None,
        'high_mcts': None
    }
    if(args.num_columns % 2 == 1 and args.num_rows % 2 == 0):
        warning_len = len("# WARNING: If the number of columns is uneven and the number of rows is even the board is not symmetrical. #")
        print("#"*warning_len)
        print("# WARNING: If the number of columns is uneven and the number of rows is even the board is not symmetrical. #\n# To assure an equal number of pieces, set the number of vertical pieces to an even value.                 #")
        print("#"*warning_len)
        time.sleep(5)
    file = open("./results2.txt", "w")
    file.close()
    file = open("./results2.txt", "a")
    # rules = [CheckersRules.CLASSICAL, CheckersRules.QUANTUM_V1, CheckersRules.QUANTUM_V2]
    rules = [CheckersRules.QUANTUM_V1]
    sizes = [5]
    # agents = ["random", "heuristic", "low_mcts", "high_mcts"]
    # just mcts agents
    agents = ["human", "high_mcts"]
    for rule in rules:
        for size in sizes:  
            ratings = {
                'random': trueskill.Rating(),
                'heuristic': trueskill.Rating(),
                'low_mcts': trueskill.Rating(),
                'high_mcts': trueskill.Rating()
            }
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
            file.write("-"*100 + "\n")
            print(f"Board size: {size}x{size}, Rule: {rule}")
            iterations = 5
            stime = time.time()
            low_white_wins = 0
            high_white_wins = 0
            low_black_wins = 0
            high_black_wins = 0
            low_wins = 0
            high_wins = 0
            for k in range(iterations):
                print(time.time() - stime)
                stime = time.time()
                if(k%10 == 0):
                    print(f"Iteration: {k+1}")
                sd = random.randint(0, 100000000000000000)
                # sd = 4271756581358815
                random.seed(sd)
                random.shuffle(agents)
                matches = generate_matches(agents)
                print(matches)
                for i, j in matches:
                    white_mcts = False
                    black_mcts = False
                    args1 = None
                    args2 = None
                    p1 = None
                    p2 = None

                    if(i == "random" or i == "heuristic" or i == "human"):
                        p1 = agent_map[i]()
                    if(j == "random" or j == "heuristic" or j == "human"):
                        p2 = agent_map[j]()
                    if i == "low_mcts":
                        args1 = args_low
                        white_mcts = True
                    elif i == "high_mcts":
                        args1 = args_high
                        white_mcts = True

                    if j == "low_mcts":
                        args2 = args_low
                        black_mcts = True
                    elif j == "high_mcts":
                        args2 = args_high
                        black_mcts = True
                    args_low['attempt'] = k
                    args_high['attempt'] = k
                    seed_str = f"Seed: {sd}\n"
                    # write_attempt(k, seed_str)
                    start_t = time.time()
                    checkers = Checkers(num_vertical=size, num_horizontal=size, num_vertical_pieces=args.num_vertical_pieces, SIMULATE_QUANTUM=args.sim_q, rules=rule)
                    game = GameInterface(checkers, white_player=p1, black_player=p2, GUI=args.GUI, white_mcts=white_mcts, black_mcts=black_mcts, args_1=args1, args_2=args2, print=False, attempt=k)
                    result, num_moves, avg_time, single_movetypes = (game.play())
                    results.append(result)
                    # if(result == CheckersResult.WHITE_WINS):
                    #     new_r1, new_r2 = env.rate_1vs1(ratings[i], ratings[j])
                    #     agent_wincount[i] += 1
                    #     if(i == "low_mcts"):
                    #         low_wins += 1
                    #         low_white_wins += 1
                    #     else:
                    #         high_white_wins += 1
                    #         high_wins += 1
                    # elif(result == CheckersResult.BLACK_WINS):
                    #     agent_wincount[j] += 1
                    #     if(j == "low_mcts"):
                    #         low_wins += 1
                    #         low_black_wins += 1
                    #     else:
                    #         high_wins += 1
                    #         high_black_wins += 1
                    #     new_r2, new_r1 = env.rate_1vs1(ratings[j], ratings[i])
                    # else: # draw
                    #     new_r1, new_r2 = env.rate_1vs1(ratings[i], ratings[j], drawn=True)
                    
                    # ratings[i] = new_r1
                    # ratings[j] = new_r2
                    number_of_moves.append(num_moves)
                    avg_mcts_time.append(avg_time)
                    times.append(time.time()-start_t)
                    for l in movetypes:
                        movetypes[l] += single_movetypes[l]
                    if((k+1)%10 == 0 and k+1 != iterations):
                        print(f"Random agent: {ratings['random']}")
                        print(f"Heuristic agent: {ratings['heuristic']}")
                        print(f"Low MCTS agent: {ratings['low_mcts']}")
                        print(f"High MCTS agent: {ratings['high_mcts']}")
                        # print(f"All ratings: Random agent: {random_rating}, Heuristic agent: {heuristic_rating}, Low MCTS agent: {mcts_low_rating}, High MCTS agent: {mcts_high_rating}")
                        print(f"Low wins: {low_wins}, High wins: {high_wins}")
                        print(f"low_white_wins: {low_white_wins}, high_white_wins: {high_white_wins}")
                        print(f"low_black_wins: {low_black_wins}, high_black_wins: {high_black_wins}")
                        print(f"Agent wincount: {agent_wincount}")
                        print(f"Draw: {results.count(CheckersResult.DRAW)}, White wins: {results.count(CheckersResult.WHITE_WINS)}, Black wins: {results.count(CheckersResult.BLACK_WINS)}")
                
                    #     print(f"Draw: {results.count(CheckersResult.DRAW)}, White wins: {results.count(CheckersResult.WHITE_WINS)}, Black wins: {results.count(CheckersResult.BLACK_WINS)}")
                    #     print(f"Average number of moves: {sum(number_of_moves)/len(number_of_moves)}")
                    #     print(f"Average time for mcts move: {sum(avg_mcts_time)/len(avg_mcts_time)}")
                print("#"*100)
                # print(f"Average time: {sum(times)/len(times)}, minimum time: {min(times)}, max time: {max(times)}")
                # print(f"Average number of moves: {sum(number_of_moves)/len(number_of_moves)}")
                # print(f"Average time for mcts move: {sum(avg_mcts_time)/len(avg_mcts_time)}")
                # print(f"Movetypes: {movetypes}")
                print(f"Random agent: {ratings['random']}")
                print(f"Heuristic agent: {ratings['heuristic']}")
                print(f"Low MCTS agent: {ratings['low_mcts']}")
                print(f"High MCTS agent: {ratings['high_mcts']}")
                # print(f"All ratings: Random agent: {random_rating}, Heuristic agent: {heuristic_rating}, Low MCTS agent: {mcts_low_rating}, High MCTS agent: {mcts_high_rating}")
                print(f"Low wins: {low_wins}, High wins: {high_wins}")
                print(f"low_white_wins: {low_white_wins}, high_white_wins: {high_white_wins}")
                print(f"low_black_wins: {low_black_wins}, high_black_wins: {high_black_wins}")
                print(f"Agent wincount: {agent_wincount}")
                print(f"Draw: {results.count(CheckersResult.DRAW)}, White wins: {results.count(CheckersResult.WHITE_WINS)}, Black wins: {results.count(CheckersResult.BLACK_WINS)}")
                file.write("iteration: " + str(k) + "\n")
                # file.write(f"White agent: {i}, Black agent: {j}\n")
                # file.write(f"Average time: {sum(times)/len(times)}, minimum time: {min(times)}, max time: {max(times)}\n")
                # file.write(f"Average number of moves: {sum(number_of_moves)/len(number_of_moves)}\n")
                # file.write(f"Average time for mcts move: {sum(avg_mcts_time)/len(avg_mcts_time)}\n")
                file.write(f"Movetypes: {movetypes}\n")
                file.write(f"Random agent: {ratings['random']}\n")
                file.write(f"Heuristic agent: {ratings['heuristic']}\n")
                file.write(f"Low MCTS agent: {ratings['low_mcts']}\n")
                file.write(f"High MCTS agent: {ratings['high_mcts']}\n")
                file.write(f"low_white_wins: {low_white_wins}, high_white_wins: {high_white_wins}\n")
                file.write(f"low_black_wins: {low_black_wins}, high_black_wins: {high_black_wins}\n")
                file.write(f"Agent wincount: {agent_wincount}\n")
                # file.write(f"All ratings: Random agent: {random_rating}, Heuristic agent: {heuristic_rating}, Low MCTS agent: {mcts_low_rating}, High MCTS agent: {mcts_high_rating}\n")
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