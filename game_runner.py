from enums import GameState, GameType, PieceColor
from players import Player
from game import Game


class GameRunner:
    def __init__(self, white_player: Player, black_player: Player,
                 game_type: GameType = GameType.INTERFERENCE,
                 size: int = 8, start_rows: int = 3):
        self.game = Game(size=size, start_rows=start_rows,
                         game_type=game_type)
        self.white_player = white_player
        self.black_player = black_player
        self.game_type = game_type

    def turn(self):
        current_player = self.white_player\
            if self.game.turn == PieceColor.WHITE\
            else self.black_player

        move = current_player.get_move(game=self.game)
        self.game.apply_move(move)

    def run_game(self):
        while self.game.get_game_state() == GameState.IN_PROGRESS:
            self.turn()

        print("Final board: ")
        print(self.game.board.display())
        if self.game.get_game_state() == GameState.WHITE_WON:
            print("White won the game!")
        elif self.game.get_game_state() == GameState.BLACK_WON:
            print("Black won the game!")
        else:
            print("The game is a draw!")
