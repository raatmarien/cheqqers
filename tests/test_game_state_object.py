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
import pytest

from enums import GameType
from game import Game
from game_state_object import GameStateObject


class TestGameStateObject:
    @pytest.fixture
    def game(self):
        return Game(8, 1, GameType.INTERFERENCE)

    def test_from_game(self, game):
        game_object = GameStateObject.from_game(game)

        assert GameStateObject.model_validate_json(
            game_object.model_dump_json()) == game_object
        assert game_object.board_size == 8
        assert game_object.moves_since_take == game.moves_since_take

    def test_to_game(self, game):
        game_object = GameStateObject.from_game(game)
        game2 = game_object.to_game()
        game_object2 = GameStateObject.from_game(game2)
        assert game_object == game_object2
