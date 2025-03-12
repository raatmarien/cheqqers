from qcheckers_with_interference import Board, Piece, PieceColor, ClassicalSquareState, Game, GameState, Move, SplitMove, MergeMove, ClassicalMove, PieceSuperposition
import statistics
import random
import enum


class GameType(enum.Enum):
    CLASSIC = 0
    SUPERPOSITION = 1
    ENTANGLEMENT = 2
    INTERFERENCE = 3


def run_one_experiment(game_type, board_size, amount = 1000, draw = True):
    """Run a random game of quantum checkers with superposition + entanglement"""
    moves = []
    branches = []
    takes = []
    take_percentages = []
    start_rows = 1
    white_won = 0
    black_won = 0
    for _ in range(amount):
        game = Game(board_size, start_rows,
                    game_type == GameType.ENTANGLEMENT or
                    game_type == GameType.INTERFERENCE,
                    draw)
        move_count = 0
        take_count = 0

        while game.get_game_state() == GameState.IN_PROGRESS:
            possible_moves = game.board.get_possible_moves(game.turn, game.superpositions)

            # Filter for only classical moves for this test
            if game_type == GameType.CLASSIC:
                possible_moves = [
                    move for move in possible_moves
                    if isinstance(move, ClassicalMove)]
            elif game_type == GameType.SUPERPOSITION or game_type == GameType.ENTANGLEMENT:
                possible_moves = [
                    move for move in possible_moves
                    if isinstance(move, ClassicalMove) or isinstance(move, SplitMove)]
            if not possible_moves:
                break

            branches.append(len(possible_moves))

            # Select a random move
            random_move = random.choice(possible_moves)

            # Apply the move
            game.apply_move(random_move)

            if game.moves_since_take == 0:
                take_count += 1

            move_count += 1

        moves.append(move_count)
        takes.append(take_count)
        take_percentages.append(take_count / move_count)
        result = game.get_game_state()
        if result == GameState.WHITE_WON:
            white_won += 1
        elif result == GameState.BLACK_WON:
            black_won += 1

    return {
        "average_moves": statistics.mean(moves),
        "stdev_moves": statistics.stdev(moves),
        "average_branching": statistics.mean(branches),
        "stdev_branching": statistics.stdev(branches),
        "average_takes": statistics.mean(takes),
        "stdev_takes": statistics.mean(takes),
        "average_take_percentage": statistics.mean(take_percentages),
        "stdev_take_percentage": statistics.mean(take_percentages),
        "white_win": white_won / amount,
        "black_win": black_won / amount,
        "draw": (amount - white_won - black_won) / amount,
        }


if __name__ == "__main__":
    file_name = f"random-game-results-{random.randint(0, 10000)}.txt"
    f = open(file_name, "w")
    print(f"Writing to {file_name}")
    results = {}
    amount = 1000
    for draw in [True, False]:
        for game_type in [GameType.CLASSIC, GameType.SUPERPOSITION,
                          GameType.ENTANGLEMENT, GameType.INTERFERENCE]:
            for size in [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]:
                results[f"{draw}-{game_type}-{size}"]\
                    = run_one_experiment(game_type, size, amount, draw)
    f.write(str(results) + '\n')
    f.flush()
    f.close()
