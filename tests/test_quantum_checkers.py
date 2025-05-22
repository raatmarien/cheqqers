import unittest

from board import Board
from enums import PieceColor, ClassicalSquareState, GameState
from game import Game


class TestQuantumCheckers(unittest.TestCase):

    def test_board_initialization_with_one_start_row(self):
        """Test that a board with one start row has pieces in the correct positions."""
        board_size = 8
        start_rows = 1
        board = Board(board_size, start_rows)

        # Check board size
        self.assertEqual(board.size, board_size)

        # Check that we have the right number of usable squares (only black squares are used in checkers)
        # In an 8x8 board, there are 32 usable squares
        expected_squares = (board_size * board_size) // 2
        self.assertEqual(len(board.piece_map), expected_squares)
        self.assertEqual(len(board.classic_occupancy), expected_squares)

        # Check that white pieces are at y=0
        for x in range(board_size):
            if x % 2 == 0:  # Only even x values at y=0 are black squares in standard checkers
                index = board.xy_index_map.get((x, 0))
                self.assertEqual(board.classic_occupancy[index], ClassicalSquareState.OCCUPIED)
                self.assertEqual(board.piece_map[index].color, PieceColor.WHITE)
                self.assertFalse(board.piece_map[index].crowned)

        # Check that black pieces are at y=board_size-1
        for x in range(board_size):
            if x % 2 == 1:  # Only odd x values at y=7 are black squares in standard checkers
                index = board.xy_index_map.get((x, board_size-1))
                self.assertEqual(board.classic_occupancy[index], ClassicalSquareState.OCCUPIED)
                self.assertEqual(board.piece_map[index].color, PieceColor.BLACK)
                self.assertFalse(board.piece_map[index].crowned)

        # Check that middle rows are empty
        for y in range(1, board_size-1):
            for x in range(board_size):
                if (x + y) % 2 == 0:  # Check only black squares
                    index = board.xy_index_map.get((x, y))
                    self.assertEqual(board.classic_occupancy[index], ClassicalSquareState.EMPTY)
                    self.assertIsNone(board.piece_map[index])

    def test_board_initialization_with_three_start_rows(self):
        """Test that a board with three start rows has pieces in the correct positions."""
        board_size = 8
        start_rows = 3
        board = Board(board_size, start_rows)

        # Check white pieces in first three rows
        for y in range(start_rows):
            for x in range(board_size):
                if (x + y) % 2 == 0:  # Only black squares
                    index = board.xy_index_map.get((x, y))
                    if index is not None:
                        self.assertEqual(board.classic_occupancy[index], ClassicalSquareState.OCCUPIED)
                        self.assertEqual(board.piece_map[index].color, PieceColor.WHITE)

        # Check black pieces in last three rows
        for y in range(board_size - start_rows, board_size):
            for x in range(board_size):
                if (x + y) % 2 == 0:  # Only black squares
                    index = board.xy_index_map.get((x, y))
                    if index is not None:
                        self.assertEqual(board.classic_occupancy[index], ClassicalSquareState.OCCUPIED)
                        self.assertEqual(board.piece_map[index].color, PieceColor.BLACK)

        # Check middle rows are empty
        for y in range(start_rows, board_size - start_rows):
            for x in range(board_size):
                if (x + y) % 2 == 0:  # Only black squares
                    index = board.xy_index_map.get((x, y))
                    if index is not None:
                        self.assertEqual(board.classic_occupancy[index], ClassicalSquareState.EMPTY)
                        self.assertIsNone(board.piece_map[index])

    def test_game_initialization(self):
        """Test that a new game is properly initialized."""
        board_size = 8
        start_rows = 3
        game = Game(board_size, start_rows)

        # Check that the game starts with white's turn
        self.assertTrue(game.turn, PieceColor.WHITE)

        # Check that the game starts with IN_PROGRESS state
        self.assertEqual(game.get_game_state(), GameState.IN_PROGRESS)

        # Check that no moves have been made yet
        self.assertEqual(len(game.moves), 0)

        # Check that the board is initialized
        self.assertIsNotNone(game.board)
        self.assertEqual(game.board.size, board_size)

    def test_board_coordinates_mapping(self):
        """Test that the coordinate mappings are correct."""
        board_size = 8
        start_rows = 3
        board = Board(board_size, start_rows)

        # Check that only black squares are mapped
        expected_index = 0
        for y in range(board_size):
            for x in range(board_size):
                if (x + y) % 2 == 0:  # Black square
                    # Check if the coordinate is in the map
                    self.assertIn((x, y), board.xy_index_map)
                    # Check if the index maps back to the coordinate
                    self.assertEqual(board.index_xy_map[board.xy_index_map[(x, y)]], (x, y))
                    # Check if indices are sequential
                    self.assertEqual(board.xy_index_map[(x, y)], expected_index)
                    expected_index += 1
                else:  # White square
                    # Check that white squares are not mapped
                    self.assertNotIn((x, y), board.xy_index_map)
