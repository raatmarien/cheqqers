import unittest
from enum import Enum
from qcheckers_with_interference import Board, Piece, PieceColor, ClassicalSquareState, Game, GameState, Move, SplitMove, MergeMove, ClassicalMove
import statistics
import random


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


class TestGetPossibleMoves(unittest.TestCase):
    
    def test_white_possible_moves_standard_board(self):
        """Test that the correct number of moves are available for white in a standard board setup."""
        # Create a standard checkers board (8x8 with 3 rows of pieces on each side)
        board_size = 8
        start_rows = 3
        board = Board(board_size, start_rows)

        for color in [PieceColor.WHITE, PieceColor.BLACK]:
            # Get all possible moves for white
            all_moves = board.get_possible_moves(color)
            
            # Extract each type of move
            classical_moves = [move for move in all_moves if isinstance(move, ClassicalMove) 
                              and not isinstance(move, SplitMove) and not isinstance(move, MergeMove)]
            split_moves = [move for move in all_moves if isinstance(move, SplitMove)]
            merge_moves = [move for move in all_moves if isinstance(move, MergeMove)]
    
            # Check the counts
            self.assertEqual(len(classical_moves), 7, 
                             f"Expected 7 classical moves, but found {len(classical_moves)}")
            self.assertEqual(len(split_moves), 3, 
                             f"Expected 3 split moves, but found {len(split_moves)}")
            self.assertEqual(len(merge_moves), 3, 
                             f"Expected 3 merge moves, but found {len(merge_moves)}")
            
            # Check the total count
            self.assertEqual(len(all_moves), 13, 
                             f"Expected 13 total moves, but found {len(all_moves)}")
            
            # Validate a few of the classical moves by checking coordinates
            # We expect the pieces in the third row (y=2) to be able to move forward
            for move in classical_moves:
                from_x, from_y = board.index_xy_map[move.from_index]
                to_x, to_y = board.index_xy_map[move.to_index]
                
                if color == PieceColor.BLACK:
                    temp = to_y
                    to_y = from_y
                    from_y = temp

                # Check that the move is forward (increasing y for white)
                self.assertTrue(to_y > from_y, 
                               f"Expected forward move, but move goes from y={from_y} to y={to_y}")
                
                # Check that the move is diagonal (x changes by 1)
                self.assertEqual(abs(to_x - from_x), 1, 
                                f"Expected diagonal move, but x changes by {abs(to_x - from_x)}")
                
                # Check that the move is just one square (y changes by 1)
                self.assertEqual(to_y - from_y, 1, 
                                f"Expected move of one square, but y changes by {to_y - from_y}")
    

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
        take_moves = board.get_take_moves(PieceColor.WHITE)
        
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
        take_moves = board.get_take_moves(PieceColor.WHITE)
        
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
        take_moves = board.get_take_moves(PieceColor.WHITE)
        
        # Check that get_possible_moves only returns take moves
        self.assertEqual(len(all_moves), len(take_moves), 
                        "get_possible_moves should only return take moves when available")
        
        # Ensure that all moves returned by get_possible_moves are take moves
        all_move_set = {(move.from_index, move.to_index) for move in all_moves}
        take_move_set = {(move.from_index, move.to_index) for move in take_moves}
        self.assertEqual(all_move_set, take_move_set, 
                        "get_possible_moves should return the exact same moves as get_take_moves")


class TestClassicalGame(unittest.TestCase):
    def test_random_classical_game(self, board_size=8, start_rows=1):
        """Run a random game of quantum checkers with only classical moves"""
        amount = 1000
        moves = []
        white_won = 0
        black_won = 0
        for _ in range(amount):
            game = Game(board_size, start_rows)
            move_count = 0
            
            while game.get_game_state() == GameState.IN_PROGRESS:
                possible_moves = game.board.get_possible_moves(game.turn)
                
                # Filter for only classical moves for this test
                classical_moves = [move for move in possible_moves
                                   if isinstance(move, ClassicalMove)]
                if not classical_moves:
                    break
                
                # Select a random move
                random_move = random.choice(classical_moves)
                
                # Apply the move
                prev_turn = game.turn
                game.apply_move(random_move)
                if game.turn != prev_turn:
                    move_count += 1
                
            moves.append(move_count)
            result = game.get_game_state()
            if result == GameState.WHITE_WON:
                white_won += 1
            elif result == GameState.BLACK_WON:
                black_won += 1
        
        self.assertGreater(statistics.mean(moves), 40)
        self.assertLess(statistics.mean(moves), 55)
        self.assertGreater(white_won, 350)
        self.assertLess(white_won, 500)
        self.assertGreater(black_won, 350)
        self.assertLess(black_won, 500)
    


if __name__ == '__main__':
    unittest.main()

