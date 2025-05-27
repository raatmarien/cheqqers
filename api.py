# Copyright 2025 Marien Raat <mail@marienraat.nl>
#
# This file is part of Cheqqers.
#
# Cheqqers is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Cheqqers is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with Cheqqers. If not, see
# <https://www.gnu.org/licenses/>.
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
def get_start_state(game_type: str):
    game_type_enum = GameType.INTERFERENCE
    if game_type == "0":
        game_type_enum = GameType.CLASSIC
    if game_type == "1":
        game_type_enum = GameType.SUPERPOSITION
    if game_type == "2":
        game_type_enum = GameType.ENTANGLEMENT
    game = Game(size=8, start_rows=3,
                game_type=game_type_enum)
    return GameStateObject.from_game(game)


@app.post("/move/{move_index}")
def read_item(move_index: int, game_state: GameStateObject,
              do_ai_move: bool):
    game = game_state.to_game()

    moves = game.board.get_possible_moves(
        game.turn, game.superpositions)
    game.apply_move(moves[move_index])

    if do_ai_move:
        while game.turn != PieceColor.WHITE:
            opponent = MctsPlayer(
                is_white_player=(game.turn == PieceColor.WHITE))
            opponent_move = opponent.get_move(game=game)
            game.apply_move(opponent_move)

    return GameStateObject.from_game(game)
