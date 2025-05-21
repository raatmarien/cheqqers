import pytest
from pytest import approx

from enums import GameType
from moves import ClassicalMove, SplitMove
from game import Game


class TestGameChances:
    @pytest.fixture
    def game(self):
        return Game(8, 1, GameType.INTERFERENCE)

    @pytest.fixture
    def xy(self, game):
        return game.board.xy_index_map

    def test_single_split(self, game, xy):
        game.apply_move(
            SplitMove(False, xy[(2, 0)],
                      xy[(1, 1)], xy[(3, 1)]))
        chances = game.get_all_chances()
        assert chances[(1, 1)] == approx(0.5)
        assert chances[(3, 1)] == approx(0.5)

    def test_double_split(self, game, xy):
        game.apply_move(
            SplitMove(False, xy[(2, 0)],
                      xy[(1, 1)], xy[(3, 1)]))
        game.apply_move(
            SplitMove(False, xy[(3, 1)],
                      xy[(2, 2)], xy[(4, 2)]))
        chances = game.get_all_chances()
        assert chances[(1, 1)] == approx(0.5)
        assert chances[(2, 2)] == approx(0.25)
        assert chances[(4, 2)] == approx(0.25)

    def test_split_after_move(self, game, xy):
        game.apply_move(
            SplitMove(False, xy[(2, 0)],
                      xy[(1, 1)], xy[(3, 1)]))
        game.apply_move(
            ClassicalMove(False, xy[(1, 1)], xy[(0, 2)]))
        chances = game.get_all_chances()
        assert chances[(0, 2)] == approx(0.5)
        assert chances[(3, 1)] == approx(0.5)
