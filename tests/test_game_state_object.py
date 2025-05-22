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
