from game_runner import GameRunner
from players import CliPlayer, RandomPlayer


if __name__ == '__main__':
    game_runner = GameRunner(CliPlayer(), RandomPlayer())
    game_runner.run_game()
