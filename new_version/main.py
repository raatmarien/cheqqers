from enums import GameState
from moves import ClassicalMove, SplitMove, MergeMove
from game import Game


def run_game():
    game = Game(size=8, start_rows=3)
    
    while game.get_game_state() == GameState.IN_PROGRESS:
        print(f"Turn: {game.turn.name}")
        print("Board:")
        print(game.board.display())
        
        moves = game.board.get_possible_moves(game.turn, game.superpositions)
        
        print("Possible moves:")
        for idx, move in enumerate(moves):
            if isinstance(move, ClassicalMove):
                from_x, from_y = game.board.index_xy_map[move.from_index]
                to_x, to_y = game.board.index_xy_map[move.to_index]
                print(f"{idx}: Move from ({from_x}, {from_y}) to ({to_x}, {to_y})")
            elif isinstance(move, SplitMove):
                from_x, from_y = game.board.index_xy_map[move.from_index]
                to_x1, to_y1 = game.board.index_xy_map[move.to_index1]
                to_x2, to_y2 = game.board.index_xy_map[move.to_index2]
                print(f"{idx}: Split move from ({from_x}, {from_y}) to ({to_x1}, {to_y1}) and ({to_x2}, {to_y2})")
            elif isinstance(move, MergeMove):
                from_x1, from_y1 = game.board.index_xy_map[move.from_index1]
                from_x2, from_y2 = game.board.index_xy_map[move.from_index2]
                to_x, to_y = game.board.index_xy_map[move.to_index]
                print(f"{idx}: Merge move from ({from_x1}, {from_y1}) and ({from_x2}, {from_y2}) to ({to_x}, {to_y})")
        
        move_idx = int(input("Enter the move index: ").strip())
        selected_move = moves[move_idx]
        
        game.apply_move(selected_move)
    
    if game.get_game_state() == GameState.WHITE_WON:
        print("White won the game!")
    elif game.get_game_state() == GameState.BLACK_WON:
        print("Black won the game!")
    else:
        print("The game is a draw!")    


if __name__ == '__main__':
    run_game()
