from enum import Enum
import copy
import cirq
import random
import numpy as np


class ClassicalSquareState(Enum):
    EMPTY = 0
    OCCUPIED = 1
    QUANTUM = 2


class PieceColor(Enum):
    WHITE = 0
    BLACK = 1

    def other(self):
        if self == PieceColor.WHITE:
            return PieceColor.BLACK
        else:
            return PieceColor.WHITE


class Piece:
    color: PieceColor
    crowned: bool

    def __init__(self, color, crowned):
        self.color = color
        self.crowned = crowned

    def copy(self):
        return copy.deepcopy(self)


class Move:
    is_take_move: bool

    def __init__(self, is_take_move):
        self.is_take_move = is_take_move

    def print_move(self):
        return "TODO"


class ClassicalMove(Move):
    from_index: int
    to_index: int

    def __init__(self, is_take_move, from_index, to_index):
        super().__init__(is_take_move)
        self.from_index = from_index
        self.to_index = to_index


class SplitMove(Move):
    from_index: int
    to_index1: int
    to_index2: int

    def __init__(self, is_take_move, from_index, to_index1, to_index2):
        super().__init__(is_take_move)
        self.from_index = from_index
        self.to_index1 = to_index1
        self.to_index2 = to_index2


class MergeMove(Move):
    from_index1: int
    from_index2: int
    to_index: int

    def __init__(self, is_take_move, from_index1, from_index2, to_index):
        super().__init__(is_take_move)
        self.from_index1 = from_index1
        self.from_index2 = from_index2
        self.to_index = to_index


class Board:
    size: int
    piece_map: list[Piece]
    classic_occupancy: list[ClassicalSquareState]
    xy_index_map: dict
    index_xy_map: dict

    def __init__(self, size, start_rows):
        self.size = size
        self.piece_map = []
        self.classic_occupancy = []
        self.xy_index_map = {}
        self.index_xy_map = {}

        self.reset_board(start_rows)

    def reset_board(self, start_rows):
        i = 0
        for y in range(self.size):
            for x in range(self.size):
                if (x+y) % 2 == 1:
                    continue  # White square, not used

                self.xy_index_map[(x, y)] = i
                self.index_xy_map[i] = (x, y)

                occupancy = ClassicalSquareState.OCCUPIED
                if y < start_rows:
                    self.piece_map.append(Piece(PieceColor.WHITE, False))
                elif y >= (self.size - start_rows):
                    self.piece_map.append(Piece(PieceColor.BLACK, False))
                else:
                    self.piece_map.append(None)
                    occupancy = ClassicalSquareState.EMPTY
                self.classic_occupancy.append(occupancy)

                i += 1

    def get_possible_moves(self, color: PieceColor):
        take_moves = self.get_take_moves(color)
        if len(take_moves) > 0:
            return take_moves
        else:
            return self._get_possible_moves(color, False)

    def get_take_moves(self, color: PieceColor):
        return self._get_possible_moves(color, True)

    def _get_possible_moves(self, color: PieceColor, take: bool):
        moves = []
        for y in range(self.size):
            for x in range(self.size):
                if (x, y) not in self.xy_index_map:
                    continue

                i = self.xy_index_map[(x, y)]
                if self.classic_occupancy[i] == ClassicalSquareState.EMPTY or\
                   self.piece_map[i].color != color:
                    continue

                standard_dir = 1 if color == PieceColor.WHITE else -1
                possible_squares = [(x - 1, y + standard_dir), (x + 1, y + standard_dir)]
                if self.piece_map[i].crowned:
                    possible_squares += [(x - 1, y - standard_dir), (x + 1, y - standard_dir)]

                for (x_, y_) in possible_squares:
                    if (x_, y_) not in self.xy_index_map:
                        continue
                    i_ = self.xy_index_map[(x_, y_)]
                    if take:
                        if self.classic_occupancy[i_] == ClassicalSquareState.EMPTY or\
                           self.piece_map[i_].color == color:
                            continue
                        x_to = x_ + (x_ - x)
                        y_to = y_ + (y_ - y)
                        if (x_to, y_to) not in self.xy_index_map:
                            continue
                        i_to = self.xy_index_map[(x_to, y_to)]
                        if self.classic_occupancy[i_to] != ClassicalSquareState.EMPTY:
                            continue
                        moves.append(ClassicalMove(True, i, i_to))
                    else:
                        if self.classic_occupancy[i_] != ClassicalSquareState.EMPTY:
                            continue
                        moves.append(ClassicalMove(False, i, i_))

        # Note: We don't allow split or merge moves with takes
        if not take:
            moves += self._find_split_and_merge_moves(moves)

        return moves

    def _find_split_and_merge_moves(self, moves: list[Move]):

        # Split moves
        split_moves = []
        for move in moves:
            if len([mv for mv in split_moves
                    if mv.from_index == move.from_index]) > 0:
                continue

            related_moves = [rm for rm in moves
                             if rm.from_index == move.from_index]
            if len(related_moves) < 2:
                continue
            for i in range(len(related_moves)):
                for j in range(i + 1, len(related_moves)):
                    split_moves.append(
                        SplitMove(False,
                                  move.from_index,
                                  related_moves[i].to_index,
                                  related_moves[j].to_index))

        # Merge mvoes
        merge_moves = []
        for move in moves:
            if len([mv for mv in merge_moves
                    if mv.to_index == move.to_index]) > 0:
                continue

            related_moves = [rm for rm in moves
                             if rm.to_index == move.to_index
                             and self.from_same_piece(move.from_index,
                                                      rm.from_index)]
            if len(related_moves) < 2:
                continue
            for i in range(len(related_moves)):
                for j in range(i + 1, len(related_moves)):
                    merge_moves.append(
                        MergeMove(False,
                                  related_moves[i].from_index,
                                  related_moves[j].from_index,
                                  move.to_index))

        return split_moves + merge_moves

    def from_same_piece(self, index1, index2):
        if index1 == index2:
            return True
        return True  # TODO actually check. Probably need some info on the superpositions.

    def display(self):
        """Display the current board state"""
        board_display = ""
        for y in range(self.size):
            row = ""
            for x in range(self.size):
                if (x, y) not in self.xy_index_map:
                    row += "□ "  # White square
                    continue

                i = self.xy_index_map[(x, y)]
                if self.classic_occupancy[i] == ClassicalSquareState.EMPTY:
                    row += "· "  # Empty black square
                elif self.piece_map[i].color == PieceColor.WHITE:
                    row += "○ " if not self.piece_map[i].crowned else "♔ "  # White piece
                else:
                    row += "● " if not self.piece_map[i].crowned else "♚ "  # Black piece
            board_display += row + "\n"
        return board_display


class PieceSuperposition():
    """Keeps track of the quantum state of one piece over the board
    """
    occupied_squares: list[int]
    moves: list[Move]

    def __init__(self, move: SplitMove):
        self.occupied_squares = [move.to_index1, move.to_index1]
        self.moves = [move]

    def apply_move(self, move: Move):
        self.moves.append(move)
        if isinstance(ClassicalMove, move):
            self._apply_classical_move(move)
        elif isinstance(SplitMove, move):
            self._apply_split_move(move)
        elif isinstance(MergeMove, move):
            self._apply_merge_move(move)

    def _apply_classical_move(self, move: ClassicalMove):
        if move.is_take_move:
            raise 'Error: take moves should always result in measurement'

        self.occupied_squares.remove(move.from_index)
        self.occupied_squares.append(move.to_index)

    def insert_entanglement_placeholder(self):
        self.moves.append(None)

    def _apply_split_move(self, move: SplitMove):
        self.occupied_squares.remove(move.from_index)
        self.occupied_squares += [move.to_index1, move.to_index2]

    def _apply_merge_move(self, move: MergeMove):
        raise 'TODO: implement'


class PieceEntanglement:
    superposition_taken: PieceSuperposition
    superposition_from: PieceSuperposition

    def __init__(self, superposition_taken, superposition_from):
        self.superposition_taken = superposition_taken
        self.superposition_from = superposition_from


class GameState(Enum):
    IN_PROGRESS = 0
    WHITE_WON = 1
    BLACK_WON = 2
    DRAW = 3


class Game:
    board: Board
    moves: list[Move]
    turn: PieceColor
    allow_entanglement: bool
    moves_since_take: int
    superpositions: list[PieceSuperposition]
    entanglements: list[PieceEntanglement]

    def __init__(self, size, start_rows, allow_entanglement: bool = True):
        self.board = Board(size, start_rows)
        self.allow_entanglement = allow_entanglement
        self.moves = []
        self.turn = PieceColor.WHITE
        self.moves_since_take = 0

    def get_game_state(self) -> GameState:
        if self.moves_since_take >= 40:
            return GameState.DRAW

        moves = self.board.get_possible_moves(self.turn)
        if len(moves) == 0:
            return GameState.WHITE_WON if self.turn == PieceColor.BLACK\
                else GameState.BLACK_WON

        return GameState.IN_PROGRESS

    def apply_move(self, move: Move):
        self.moves_since_take += 1
        if isinstance(move, ClassicalMove):
            self._apply_classical_move(move)
        elif isinstance(move, SplitMove):
            self._apply_split_move(move)
        elif isinstance(move, MergeMove):
            self._apply_merge_move(move)

        # Add the move to the history
        self.moves.append(move)

        if move.is_take_move:
            self.moves_since_take = 0

        if not move.is_take_move or\
           len(self.board.get_take_moves(self.turn)) == 0:
            self.turn = self.turn.other()

    def _find_superposition_on_square(self, square_id):
        for superposition in self.superpositions:
            if square_id in superposition.occupied_squares:
                return superposition

    def _is_entangled(self, square_id):
        superposition = self._find_superposition_on_square(square_id)
        if superposition is None:
            return False

        for entanglement in self.entanglements:
            if entanglement.superposition_from == superposition or\
               entanglement.superposition_taken == superposition:
                return True

        return False

    def _apply_classical_move(self, move: ClassicalMove):
        if move.is_take_move:
            return self._apply_classical_take_move(move)

        piece = self.board.piece_map[move.from_index]
        occupancy_state = self.board.classic_occupancy[move.from_index]

        if occupancy_state == ClassicalSquareState.QUANTUM:
            superposition = self._find_superposition_on_square(move.from_index)
            superposition.apply_move(move)

        # Check if the piece should be crowned (reached the opposite edge)
        if not piece.crowned:
            to_x, to_y = self.board.index_xy_map[move.to_index]
            if (piece.color == PieceColor.WHITE and to_y == self.board.size - 1) or \
               (piece.color == PieceColor.BLACK and to_y == 0):
                piece = piece.copy()
                piece.crowned = True

        # Move the piece to the new position
        self.board.piece_map[move.to_index] = piece
        self.board.classic_occupancy[move.to_index] = occupancy_state

        # Clear the original position
        self.board.piece_map[move.from_index] = None
        self.board.classic_occupancy[move.from_index] = ClassicalSquareState.EMPTY

    def _apply_classical_take_move(self, move: ClassicalMove):
        piece = self.board.piece_map[move.from_index]
        from_occupancy = self.board.classic_occupancy[move.from_index]

        # Calculate the position of the taken piece
        from_x, from_y = self.board.index_xy_map[move.from_index]
        to_x, to_y = self.board.index_xy_map[move.to_index]

        # The taken piece is in between the from and to positions
        taken_x = (from_x + to_x) // 2
        taken_y = (from_y + to_y) // 2
        taken_index = self.board.xy_index_map[(taken_x, taken_y)]
        taken_occupancy = self.board.classic_occupancy[taken_index]

        # Check if the piece should be crowned (reached the opposite edge)
        if not piece.crowned:
            to_x, to_y = self.board.index_xy_map[move.to_index]
            if (piece.color == PieceColor.WHITE and to_y == self.board.size - 1) or \
               (piece.color == PieceColor.BLACK and to_y == 0):
                piece = piece.copy()
                piece.crowned = True

        if (
                from_occupancy == ClassicalSquareState.OCCUPIED and
                taken_occupancy == ClassicalSquareState.QUANTUM and
                not self._is_entangled(taken_index)):
            if self.allow_entanglement:
                # This is the only condition in which we entangle
                self.board.classic_occupancy[move.from_index] = ClassicalSquareState.QUANTUM
                self.board.classic_occupancy[move.to_index] = ClassicalSquareState.QUANTUM
                self.board.piece_map[move.to_index] = piece

                superposition_taken = self._find_superposition_on_square(taken_index)
                self.superposition_taken.insert_entanglement_placeholder()
                superposition_from = PieceSuperposition(move)#TODO: Later interpret this correctly
                self.superpositions.append(superposition_from)
                self.entanglements.append(
                    PieceEntanglement(superposition_taken, superposition_from))

                return
            else:
                is_there = self.measure(taken_index)
                if not is_there:
                    return
        elif (from_occupancy == ClassicalSquareState.OCCUPIED and
              taken_occupancy == ClassicalSquareState.QUANTUM and
              self._is_entangled(taken_index)):
            # Now we need to measure the taken piece
            is_there = self.measure(taken_index)
            if not is_there:
                return
        elif (from_occupancy == ClassicalSquareState.QUANTUM and
              taken_occupancy == ClassicalSquareState.OCCUPIED):
            # Now we first need to measure the from piece
            is_there = self.measure(move.from_index)
            if not is_there:
                return
        elif (from_occupancy == ClassicalSquareState.QUANTUM and
              taken_occupancy == ClassicalSquareState.QUANTUM):
            # First measure the from piece
            from_is_there = self.measure(move.from_index)
            if not from_is_there:
                return
            taken_is_there = self.measure(taken_index)
            if not taken_is_there:
                return

        # Remove the taken piece
        self.board.piece_map[taken_index] = None
        self.board.classic_occupancy[taken_index] = ClassicalSquareState.EMPTY

        # Move the piece to the new position
        self.board.piece_map[move.to_index] = piece
        self.board.classic_occupancy[move.to_index] = ClassicalSquareState.OCCUPIED

        # Clear the original position
        self.board.piece_map[move.from_index] = None
        self.board.classic_occupancy[move.from_index] = ClassicalSquareState.EMPTY

    def _apply_split_move(self, move: SplitMove):
        # Implement split move logic here
        piece = self.board.piece_map[move.from_index]

        if self.board.classic_occupancy[move.from_index] == ClassicalSquareState.QUANTUM:
            superposition = self._find_superposition_on_square(move.from_index)
            superposition.apply_move(move)
        else:
            self.superpositions.append(PieceSuperposition(move))

        self.board.classic_occupancy[move.from_index] = ClassicalSquareState.EMPTY
        self.board.piece_map[move.from_index] = None

        # Check if the piece should be crowned (reached the opposite edge)
        if not piece.crowned:
            to_x, to_y = self.board.index_xy_map[move.to_index]
            if (piece.color == PieceColor.WHITE and to_y == self.board.size - 1) or \
               (piece.color == PieceColor.BLACK and to_y == 0):
                piece = piece.copy()
                piece.crowned = True

        for i in [move.to_index1, move.to_index2]:
            self.board.classic_occupancy[i] = ClassicalSquareState.QUANTUM
            self.board.piece_map[i] = piece

    def _apply_merge_move(self, move: MergeMove):
        # Implement merge move logic here
        pass

    def measure(self, square_index: int) -> bool:
        """
        Measure whether a piece exists at a specific square.

        Args:
            square_index: The index of the square to measure

        Returns:
            bool: True if a piece is found at the square, False otherwise
        """
        #TODO: Deal with entanglements

        # Find the superposition that contains this square
        superposition = self._find_superposition_on_square(square_index)
        if superposition is None:
            # If the square is not part of any superposition, check the classical state
            return self.board.classic_occupancy[square_index] == ClassicalSquareState.OCCUPIED

        qubit_name_counter = 0
        qubit_by_current_square = {
            superposition.moves[0].from_index: cirq.NamedQubit(f"{qubit_name_counter}")
        }
        qubit_name_counter += 1

        # Create a quantum circuit
        circuit = cirq.Circuit()

        # Set up the initial state - we know the initial square was occupied
        # Initialize the first qubit to |1⟩ (occupied)
        circuit.append(cirq.X(qubit_by_current_square.values()[0]))

        # Apply the gates corresponding to each move in the superposition's history
        for move in superposition.moves:
            if move is None:  # Skip entanglement placeholders
                continue

            if isinstance(move, ClassicalMove) and not move.is_take_move:
                # Simply change the mapping of the qubit and then add a S gate for the phase.
                qubit = qubit_by_current_square[move.from_index]
                qubit_by_current_square[move.to_index] = qubit
                del qubit_by_current_square[move.from_index]

                circuit.append(cirq.S(qubit_by_current_square[move.to_index]))
            elif isinstance(move, SplitMove):
                # Here we create a new qubit for the superposition
                # And we change the square of the original qubit
                # Then we apply a sqrt-i-swap between them to make up the difference.
                qubit = qubit_by_current_square[move.from_index]
                qubit_by_current_square[move.to_index1] = qubit
                del qubit_by_current_square[move.from_index]

                qubit_by_current_square[move.to_index2] = cirq.NamedQubit(f"{qubit_name_counter}")
                qubit_name_counter += 1

                in_qubit_sqrt_iswap = np.array([
                    [1, 0, 0, 0],
                    [0, 1j/np.sqrt(2), 1j/np.sqrt(2), 0],
                    [0, 1j/np.sqrt(2), -1j/np.sqrt(2), 0],
                    [0, 0, 0, 1]
                ])

                circuit.append(cirq.MatrixGate(in_qubit_sqrt_iswap).on(
                    qubit_by_current_square[move.to_index1],
                    qubit_by_current_square[move.to_index2]))

        # Measure all qubits
        circuit.append(cirq.measure(*qubit_by_current_square.values(), key="result"))

        # Simulate the measurement
        simulator = cirq.Simulator()
        result = simulator.run(circuit)

        # Extract which qubit was measured as |1⟩ (occupied)
        measurement = result.measurements["result"][0]
        collapsed_square = None
        for square, qubit in qubit_by_current_square.items():
            if measurement[list(qubit_by_current_square.values()).index(qubit)] == 1:
                collapsed_square = square
                break

        # Update the board occupancy
        for square in superposition.occupied_squares:
            self.board.classic_occupancy[square] = ClassicalSquareState.EMPTY
        
        self.board.classic_occupancy[collapsed_square] = ClassicalSquareState.OCCUPIED
        
        # Remove the superposition
        self.superpositions.remove(superposition)

        return collapsed_square == square_index
