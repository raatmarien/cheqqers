import unittest

from board import Board
from piece import Piece
from enums import PieceColor, ClassicalSquareState


class TestTakeMoves(unittest.TestCase):

    def test_simple_take_move(self):
        """Test that the game correctly identifies a simple take move."""
        # Create a board with a specific configuration
        board_size = 8
        start_rows = 3
        board = Board(board_size, start_rows)

        # Clear the board to set up a specific scenario
        for i in range(len(board.piece_map)):
            board.piece_map[i] = None
            board.classic_occupancy[i] = ClassicalSquareState.EMPTY

        # Set up a simple take scenario:
        # Place a white piece that can take a black piece

        # Find indices for specific positions
        # Find a position at y=3 for white piece
        white_pos = None
        black_pos = None
        target_pos = None

        for i, (x, y) in board.index_xy_map.items():
            if y == 3 and x == 3:  # Position for white piece
                white_pos = i
            elif y == 4 and x == 4:  # Position for black piece to be taken
                black_pos = i
            elif y == 5 and x == 5:  # Target position after take
                target_pos = i

        # Place pieces at the designated positions
        if white_pos is not None and black_pos is not None and target_pos is not None:
            # Place white piece
            board.piece_map[white_pos] = Piece(PieceColor.WHITE, False)
            board.classic_occupancy[white_pos] = ClassicalSquareState.OCCUPIED

            # Place black piece to be taken
            board.piece_map[black_pos] = Piece(PieceColor.BLACK, False)
            board.classic_occupancy[black_pos] = ClassicalSquareState.OCCUPIED
        else:
            self.fail("Could not find suitable positions for the test scenario")

        # Get take moves for white
        take_moves = board.get_take_moves(PieceColor.WHITE, None)

        # check if a take move was found
        self.assertGreater(len(take_moves), 0, "No take moves found")

        # Verify the take move
        found_take = False
        for move in take_moves:
            if move.from_index == white_pos and move.to_index == target_pos:
                found_take = True
                break

        self.assertTrue(found_take,
                        f"Expected take move from index {white_pos} to {target_pos} not found")

    def test_multiple_take_moves(self):
        """Test that the game correctly identifies multiple possible take moves."""
        # Create a standard board
        board_size = 8
        start_rows = 3
        board = Board(board_size, start_rows)

        # Clear the board
        for i in range(len(board.piece_map)):
            board.piece_map[i] = None
            board.classic_occupancy[i] = ClassicalSquareState.EMPTY

        # Set up a scenario with multiple take options
        # We'll place a white piece with two black pieces to take in different directions

        # Define positions - using coordinates to find indices
        positions = [
            ((3, 3), PieceColor.WHITE, False),  # White piece in the middle
            ((2, 4), PieceColor.BLACK, False),  # Black piece to take (left)
            ((4, 4), PieceColor.BLACK, False),  # Black piece to take (right)
        ]

        # Place the pieces
        for (x, y), color, crowned in positions:
            if (x, y) in board.xy_index_map:
                index = board.xy_index_map[(x, y)]
                board.piece_map[index] = Piece(color, crowned)
                board.classic_occupancy[index] = ClassicalSquareState.OCCUPIED
            else:
                self.fail(f"Position ({x}, {y}) not found in the board mapping")

        # Get take moves for white
        take_moves = board.get_take_moves(PieceColor.WHITE, None)

        # Should find 2 take moves
        self.assertEqual(len(take_moves), 2,
                         f"Expected 2 take moves, but found {len(take_moves)}")

        # Verify the take moves are in the expected directions
        white_index = board.xy_index_map[(3, 3)]
        expected_targets = [(1, 5), (5, 5)]  # Coordinates after taking

        found_targets = 0
        for move in take_moves:
            self.assertEqual(move.from_index, white_index,
                            f"Take move should start from index {white_index}")

            to_x, to_y = board.index_xy_map[move.to_index]
            if (to_x, to_y) in expected_targets:
                found_targets += 1

        self.assertEqual(found_targets, 2,
                         "Not all expected take move targets were found")

    def test_take_move_precedence(self):
        """Test that take moves take precedence over regular moves."""
        # Create a board with both regular and take moves possible
        board_size = 8
        start_rows = 3
        board = Board(board_size, start_rows)

        # Clear the board
        for i in range(len(board.piece_map)):
            board.piece_map[i] = None
            board.classic_occupancy[i] = ClassicalSquareState.EMPTY

        # Set up a scenario with both regular and take moves
        positions = [
            ((3, 3), PieceColor.WHITE, False),  # White piece with options
            ((4, 4), PieceColor.BLACK, False),  # Black piece to take
            # Leave empty spaces for regular moves
        ]

        # Place the pieces
        for (x, y), color, crowned in positions:
            if (x, y) in board.xy_index_map:
                index = board.xy_index_map[(x, y)]
                board.piece_map[index] = Piece(color, crowned)
                board.classic_occupancy[index] = ClassicalSquareState.OCCUPIED
            else:
                self.fail(f"Position ({x}, {y}) not found in the board mapping")

        # Get all possible moves (should only return take moves if any exist)
        all_moves = board.get_possible_moves(PieceColor.WHITE)
        take_moves = board.get_take_moves(PieceColor.WHITE, None)

        # Check that get_possible_moves only returns take moves
        self.assertEqual(len(all_moves), len(take_moves),
                        "get_possible_moves should only return take moves when available")

        # Ensure that all moves returned by get_possible_moves are take moves
        all_move_set = {(move.from_index, move.to_index) for move in all_moves}
        take_move_set = {(move.from_index, move.to_index) for move in take_moves}
        self.assertEqual(all_move_set, take_move_set,
                        "get_possible_moves should return the exact same moves as get_take_moves")
