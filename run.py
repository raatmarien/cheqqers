import argparse
from enums import CheckersResult, CheckersRules, MoveType
from interface import GameInterface
from quantum_checkers import Checkers
import players
import random

def write_attempt(idx, attempt_str):
    temp = open(f"./attempts/log_{idx}.txt", "a")
    temp.write(attempt_str)
    temp.close()

def get_argument_parser_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--num_rows",
        help="The number of rows of the checkboard. INT",
        default=8,
        type=int,
    )
    parser.add_argument(
        "--num_columns",
        help="The number of columns of the checkboard. INT",
        default=8,
        type=int,
    )
    parser.add_argument(
        "--num_vertical_pieces",
        help="The number of rows that are filled with checkerpieces. INT",
        default=3,
        type=int,
    )
    parser.add_argument(
        "--sim_q",
        help="Simulating quantum or actually use quantum mechanics. TRUE if you want to simulate quantum.",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--disable-GUI",
        help="If GUI is enabled. True or False",
        action="store_true",
        default=False,
    )
    parser.add_argument(
        "--p1", help="Select agent for player 1 to use.",
        default="human",
        choices=["human", "heuristic", "random"]
    )
    parser.add_argument(
        "--p2", help="Select agent for player 2 to use.",
        default="human",
        choices=["human", "heuristic", "random"]
    )
    parser.add_argument(
        "--rule-set", help="What rule set to use. With 'superposition', no "
        "entanglement is possible. With 'entanglement', both superposition "
        "and entanglement are possible",
        default="entanglement",
        choices=["classical", "superposition", "entanglement"]
    )
    return parser.parse_args()


def run_experiment(rules : CheckersRules, board_size : int, agent1 : str, agent2: str, num_games):
    args_low = {
        "C": 1.4,  # srqt 2
        "num_searches": 200,  # Budget per rollout
        "num_simulations": 1,  # Budget for extra simulations per node
        "attempt": 0,
    }
    args_high = {
        "C": 1.4,  # srqt 2
        "num_searches": 800,  # Budget per rollout
        "num_simulations": 1,  # Budget for extra simulations per node
        "attempt": 0,
    }

    agent_map = {
        "random": players.random_bot,
        "heuristic": players.heuristic_bot,
        "human": players.human_player,
        "low_mcts": None,
        "high_mcts": None,
    }

    results = []
    moves = []

    p1 = agent_map[agent1]()
    p2 = agent_map[agent2]()

    wins = [0,0,0]
    for k in range(num_games):
        sd = random.randint(0, 100000000000000000)
        random.seed(sd)

        checkers = Checkers(
            num_vertical=board_size,
            num_horizontal=board_size,
            num_vertical_pieces=1,
            SIMULATE_QUANTUM=True,
            rules=rules,
        )

        game = GameInterface(
            checkers,
            white_player=p1,
            black_player=p2,
            GUI=False,
            white_mcts = agent1[-4:] == "mcts",
            black_mcts = agent2[-4:] == "mcts",
            args_1 = args_low if agent1 == "low_mcts" else args_high,
            args_2 = args_low if agent2 == "low_mcts" else args_high,
            print=False,
            attempt=k,
        )

        result, move_history = game.play()
        results.append(result)
        moves.append(move_history)
        
        if result == CheckersResult.WHITE_WINS:
            wins[0] += 1
        elif result == CheckersResult.BLACK_WINS:
            wins[1] += 1
        else:
            wins[2] += 1

    return results, moves, wins
    

def main():
    # # agents = ["random", "heuristic", "low_mcts", "high_mcts"]
    results, moves, wins = run_experiment(CheckersRules.QUANTUM_V2, 5, "random", "random", 50)

    take_after_collapse = 0
    takes = 0
    for move_history in moves:
        for move in range(len(move_history)-1):
            if move_history[move+1].movetype == MoveType.TAKE:
                takes += 1
                if move_history[move].movetype == MoveType.SPLIT or move_history[move].movetype == MoveType.ENTANGLE:
                    take_after_collapse += 1

    print(takes, take_after_collapse)

if __name__ == "__main__":
    main()
