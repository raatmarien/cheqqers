import argparse
from enums import CheckersResult
from interface import GameInterface
from quantum_checkers import Checkers
import time
from players import * # Imports all possible bots
import math
import cProfile
import pstats

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--num_rows', help='The number of rows of the checkboard. INT', default=5)
    parser.add_argument('--num_columns', help='The number of columns of the checkboard. INT', default=5)
    parser.add_argument('--num_vertical_pieces', help='The number of rows that are filled with checkerpieces. INT', default=1)
    parser.add_argument('--sim_q', help='Simulating quantum or actually use quantum mechanics. TRUE if you want to simulate quantum.', default="False")
    parser.add_argument('--GUI', help='If GUI is enabled. True or False', default="False")
    parser.add_argument('--p1', help='Select agent for player 1 to use.', default=human_player())
    parser.add_argument('--p2', help='Select agent for player 2 to use.', default=human_player())
    args = parser.parse_args()
    p1 = human_player()
    p2 = human_player() # Unused, is mcts
    if(args.num_columns % 2 == 1 and args.num_rows % 2 == 0):
        warning_len = len("# WARNING: If the number of columns is uneven and the number of rows is even the board is not symmetrical. #")
        print("#"*warning_len)
        print("# WARNING: If the number of columns is uneven and the number of rows is even the board is not symmetrical. #\n# To assure an equal number of pieces, set the number of vertical pieces to an even value.                 #")
        print("#"*warning_len)
        time.sleep(5)
    times = []
    results = []
    for i in range(1):
        print(i)
        start_t = time.time()
        checkers = Checkers(num_vertical=args.num_rows, num_horizontal=args.num_columns, num_vertical_pieces=args.num_vertical_pieces, SIMULATE_QUANTUM=args.sim_q)
        game = GameInterface(checkers, white_player=p1, black_player=p2, GUI=args.GUI)
        results.append(game.play())
        times.append(time.time()-start_t)
        if((i+1)%5 == 0):
            print(f"Draw: {results.count(CheckersResult.DRAW)}, White wins: {results.count(CheckersResult.WHITE_WINS)}, Black wins: {results.count(CheckersResult.BLACK_WINS)}")
    print(f"Average time: {sum(times)/len(times)}, minimum time: {min(times)}, max time: {max(times)}")
    print(f"Draw: {results.count(CheckersResult.DRAW)}, White wins: {results.count(CheckersResult.WHITE_WINS)}, Black wins: {results.count(CheckersResult.BLACK_WINS)}")

if __name__ == "__main__":
    main()

# Generate prof:  python3 -m cProfile -o main.prof main.py
# Visualise prof: snakeviz main.prof