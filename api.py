from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from game_state_object import GameStateObject
from game import Game
from enums import GameType, PieceColor
from players import MctsPlayer


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_credentials=True,
    allow_methods=["GET", "POST"],
    # allow_headers=["*"],  # Allow all headers
)


@app.get("/start")
def get_start_state():
    game = Game(size=8, start_rows=3,
                game_type=GameType.INTERFERENCE)
    return GameStateObject.from_game(game)


@app.post("/move/{move_index}")
def read_item(move_index: int, game_state: GameStateObject,
              do_ai_move: bool):
    game = game_state.to_game()

    moves = game.board.get_possible_moves(
        game.turn, game.superpositions)
    game.apply_move(moves[move_index])

    if do_ai_move:
        opponent = MctsPlayer(
            is_white_player=(game.turn == PieceColor.WHITE))
        opponent_move = opponent.get_move(game=game)
        game.apply_move(opponent_move)

    return GameStateObject.from_game(game)
