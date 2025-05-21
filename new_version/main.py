from game_runner import GameRunner
from players import CliPlayer


if __name__ == '__main__':
    game_runner = GameRunner(CliPlayer(), CliPlayer())
    game_runner.run_game()
