import cirq
import numpy as np

from enums import GameType, ClassicalSquareState, PieceColor, GameState
from moves import Move, ClassicalMove, SplitMove, MergeMove
from board import Board
from quantum_state import PieceSuperposition, PieceEntanglement


class Game:
    board: Board
    moves: list[Move]
    turn: PieceColor
    game_type: GameType
    allow_draws: bool
    moves_since_take: int
    superpositions: list[PieceSuperposition]
    entanglements: list[PieceEntanglement]

    def __init__(self, size, start_rows,
                 game_type: GameType = GameType.INTERFERENCE,
                 allow_draws: bool = True):
        self.board = Board(size, start_rows, game_type)
        self.allow_draws = allow_draws
        self.game_type = game_type
        self.moves = []
        self.turn = PieceColor.WHITE
        self.moves_since_take = 0
        self.superpositions = []
        self.entanglements = []

    def get_game_state(self) -> GameState:
        if self.allow_draws and self.moves_since_take >= 40:
            return GameState.DRAW

        moves = self.board.get_possible_moves(self.turn, self.superpositions)
        if len(moves) == 0:
            return GameState.WHITE_WON if self.turn == PieceColor.BLACK\
                else GameState.BLACK_WON

        return GameState.IN_PROGRESS

    def apply_move(self, move: Move):
        self.moves_since_take += 1
        canceled = False
        taken = False
        if isinstance(move, ClassicalMove):
            canceled, taken = self._apply_classical_move(move)
        elif isinstance(move, SplitMove):
            self._apply_split_move(move)
        elif isinstance(move, MergeMove):
            self._apply_merge_move(move)

        # Add the move to the history
        self.moves.append(move)

        # If the take move didn't go through because the measurement went off
        # then we don't reset the takes.
        if taken or (not canceled and move.is_take_move):
            self.moves_since_take = 0

        last_row = 0 if self.turn == PieceColor.BLACK else self.board.size - 1
        if not move.is_take_move or\
           not self._has_another_take_move(self.turn, move) or\
           self.board.index_xy_map[move.to_index][1] == last_row: # Also reset if piece is kinged
            self.turn = self.turn.other()

    def _has_another_take_move(self, turn: PieceColor, move: ClassicalMove):
        next_moves = self.board.get_take_moves(turn, None)
        return len([m for m in next_moves
                    if m.from_index == move.to_index]) > 0

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
        else:
            piece = piece.apply_phase()

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

        return False, False

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
            if self.game_type == GameType.ENTANGLEMENT or self.game_type == GameType.INTERFERENCE:
                # This is the only condition in which we entangle
                self.board.classic_occupancy[move.from_index] = ClassicalSquareState.QUANTUM
                self.board.classic_occupancy[move.to_index] = ClassicalSquareState.QUANTUM
                self.board.piece_map[move.to_index] = piece

                superposition_taken = self._find_superposition_on_square(taken_index)
                superposition_taken.insert_entanglement_placeholder()
                superposition_from = PieceSuperposition.create(move, piece.moves_since_measure)

                self.superpositions.append(superposition_from)
                self.entanglements.append(
                    PieceEntanglement(
                        superposition_taken=superposition_taken,
                        superposition_from=superposition_from))

                # But the taken piece is definitely not there anymore
                self.board.classic_occupancy[taken_index] = ClassicalSquareState.EMPTY
                self.board.piece_map[taken_index] = None
                superposition_taken.occupied_squares.remove(taken_index)

                return True, False  # This does not count as a take
            else:
                is_there, taken = self.measure(taken_index)
                if not is_there:
                    return True, taken
        elif (from_occupancy == ClassicalSquareState.OCCUPIED and
              taken_occupancy == ClassicalSquareState.QUANTUM and
              self._is_entangled(taken_index)):
            # Now we need to measure the taken piece
            is_there, taken = self.measure(taken_index)
            if not is_there:
                return True, taken 
        elif (from_occupancy == ClassicalSquareState.QUANTUM and
              taken_occupancy == ClassicalSquareState.OCCUPIED):
            # Now we first need to measure the from piece
            is_there, taken = self.measure(move.from_index)
            if not is_there:
                return True, taken
        elif (from_occupancy == ClassicalSquareState.QUANTUM and
              taken_occupancy == ClassicalSquareState.QUANTUM):
            # First measure the from piece
            from_is_there, taken1 = self.measure(move.from_index)
            if not from_is_there:
                return True, taken1
            taken_is_there, taken2 = self.measure(taken_index)
            if not taken_is_there:
                return True, taken1 or taken2

        piece = piece.apply_phase()

        # Remove the taken piece
        self.board.piece_map[taken_index] = None
        self.board.classic_occupancy[taken_index] = ClassicalSquareState.EMPTY

        # Move the piece to the new position
        self.board.piece_map[move.to_index] = piece
        self.board.classic_occupancy[move.to_index] = ClassicalSquareState.OCCUPIED

        # Clear the original position
        self.board.piece_map[move.from_index] = None
        self.board.classic_occupancy[move.from_index] = ClassicalSquareState.EMPTY

        return False, True

    def _apply_split_move(self, move: SplitMove):
        # Implement split move logic here
        piece = self.board.piece_map[move.from_index]

        if self.board.classic_occupancy[move.from_index] == ClassicalSquareState.QUANTUM:
            superposition = self._find_superposition_on_square(move.from_index)
            superposition.apply_move(move)
        else:
            self.superpositions.append(PieceSuperposition.create(move, piece.moves_since_measure))

        self.board.classic_occupancy[move.from_index] = ClassicalSquareState.EMPTY
        self.board.piece_map[move.from_index] = None

        # Check if the piece should be crowned (reached the opposite edge)
        if not piece.crowned:
            to_x, to_y = self.board.index_xy_map[move.to_index1]
            if (piece.color == PieceColor.WHITE and to_y == self.board.size - 1) or \
               (piece.color == PieceColor.BLACK and to_y == 0):
                piece = piece.copy()
                piece.crowned = True

        for i in [move.to_index1, move.to_index2]:
            self.board.classic_occupancy[i] = ClassicalSquareState.QUANTUM
            self.board.piece_map[i] = piece

    def _apply_merge_move(self, move: MergeMove):
        piece = self.board.piece_map[move.from_index1]

        superposition = self._find_superposition_on_square(move.from_index1)
        superposition.apply_move(move)

        # Check if the piece should be crowned (reached the opposite edge)
        if not piece.crowned:
            to_x, to_y = self.board.index_xy_map[move.to_index]
            if (piece.color == PieceColor.WHITE and to_y == self.board.size - 1) or \
               (piece.color == PieceColor.BLACK and to_y == 0):
                piece = piece.copy()
                piece.crowned = True

        self.board.classic_occupancy[move.to_index] = ClassicalSquareState.QUANTUM
        self.board.piece_map[move.to_index] = piece

    def _get_circuit_for_square(self, square_index):
        def handle_move(qubit_by_current_square, circuit, qubit_name_counter, prefix):
            def add_prefix(index):
                return f"{prefix}-{index}"

            if isinstance(move, ClassicalMove) and not move.is_take_move:
                # Simply change the mapping of the qubit and then add a S gate for the phase.
                qubit = qubit_by_current_square[add_prefix(move.from_index)]
                qubit_by_current_square[add_prefix(move.to_index)] = qubit
                del qubit_by_current_square[add_prefix(move.from_index)]

                circuit.append(cirq.S(qubit_by_current_square[add_prefix(move.to_index)]))
            elif isinstance(move, SplitMove):
                # Here we create a new qubit for the superposition
                qubit_from = qubit_by_current_square[add_prefix(move.from_index)]
                qubit_by_current_square[add_prefix(move.to_index1)] = cirq.NamedQubit(f"{qubit_name_counter}")
                qubit_name_counter += 1
                del qubit_by_current_square[add_prefix(move.from_index)]

                qubit_by_current_square[add_prefix(move.to_index2)] = cirq.NamedQubit(f"{qubit_name_counter}")
                qubit_name_counter += 1

                # From quantum chess split
                split_jump = np.array([
                    [1, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 1j, 0, 0, 0],
                    [0, 1j/np.sqrt(2), 1/np.sqrt(2), 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, -1/np.sqrt(2), 1j/np.sqrt(2), 0],
                    [0, 1j/np.sqrt(2), -1/np.sqrt(2), 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 1j/np.sqrt(2), -1/np.sqrt(2), 0],
                    [0, 0, 0, 1j, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 1],
                ])

                circuit.append(cirq.MatrixGate(split_jump).on(
                    qubit_by_current_square[add_prefix(move.to_index1)],
                    qubit_by_current_square[add_prefix(move.to_index2)],
                    qubit_from))
            elif isinstance(move, MergeMove):
                # From quantum chess merge jum
                merge_jump = np.array([
                    [1, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, -1j/np.sqrt(2), 0, -1j/np.sqrt(2), 0, 0, 0],
                    [0, 0, 1/np.sqrt(2), 0, -1/np.sqrt(2), 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, -1j, 0],
                    [0, -1j, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, -1/np.sqrt(2), 0, -1j/np.sqrt(2), 0, 0],
                    [0, 0, 0, -1j/np.sqrt(2), 0, -1/np.sqrt(2), 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 1],
                ])

                # Add a qubit for the target
                qubit_by_current_square[add_prefix(move.to_index)] = cirq.NamedQubit(f"{qubit_name_counter}")
                qubit_name_counter += 1

                # Now apply the matrix
                circuit.append(cirq.MatrixGate(merge_jump).on(
                    qubit_by_current_square[add_prefix(move.from_index1)],
                    qubit_by_current_square[add_prefix(move.from_index2)],
                    qubit_by_current_square[add_prefix(move.to_index)]))

            return qubit_name_counter

        superposition = self._find_superposition_on_square(square_index)

        superposition_from = None
        entanglement = None
        if self._is_entangled(square_index):
            for e in self.entanglements:
                if e.superposition_from == superposition or\
                   e.superposition_taken == superposition:
                    entanglement = e
                    superposition = e.superposition_taken
                    superposition_from = e.superposition_from
                    break

        prefix = "to_be_captured"
        qubit_name_counter = 0
        qubit_by_current_square = {
            f"{prefix}-{superposition.moves[0].from_index}":
            cirq.NamedQubit(f"{qubit_name_counter}")
        }
        qubit_name_counter += 1

        # Create a quantum circuit
        circuit = cirq.Circuit()

        # Set up the initial state - we know the initial square was occupied
        # Initialize the first qubit to |1⟩ (occupied)
        circuit.append(cirq.X(qubit_by_current_square[
            f"{prefix}-{superposition.moves[0].from_index}"]))

        # Now apply the phase
        for i in range(superposition.moves_since_measure % 4):
            circuit.append(cirq.S(qubit_by_current_square[
                f"{prefix}-{superposition.moves[0].from_index}"]))

        taker_prefix = "taker"
        # Apply the gates corresponding to each move in the superposition's history
        for move in superposition.moves:
            if move is None:
                # This is where the entanglement magic should happen
                # We set up the circuit for the taken part so far, and
                # now we need to entangle it with the part that is
                # taking it. This part doesn't start in superposition!
                # We apply the first move of the superposition_from on both together.
                take_move = superposition_from.moves[0]

                # We need a new qubit for the piece that is taking
                qubit_by_current_square[f"{taker_prefix}-{take_move.from_index}"]\
                    = cirq.NamedQubit(f"{qubit_name_counter}")
                qubit_name_counter += 1
                # It should be initialized to 1
                circuit.append(cirq.X(
                    qubit_by_current_square[f"{taker_prefix}-{take_move.from_index}"]))

                # Now apply the phase
                for i in range(superposition_from.moves_since_measure % 4):
                    circuit.append(cirq.S(qubit_by_current_square[
                        f"{taker_prefix}-{take_move.from_index}"]))

                # We also need a new qubit for where the piece is taking to
                qubit_by_current_square[f"{taker_prefix}-{take_move.to_index}"]\
                    = cirq.NamedQubit(f"{qubit_name_counter}")
                qubit_name_counter += 1

                # We need to find the square that is taken
                from_x, from_y = self.board.index_xy_map[take_move.from_index]
                to_x, to_y = self.board.index_xy_map[take_move.to_index]
                taken_x = (from_x + to_x) // 2
                taken_y = (from_y + to_y) // 2
                taken_index = self.board.xy_index_map[(taken_x, taken_y)]

                # Now we need to apply the gate on these three qubits
                # This is simply a CCNOT (we only take if both are there)
                # Followed by two CNOTs to remove the taken piece
                # Followed by an S gate for the phase change on the moving piece
                circuit.append(cirq.CCX(
                    qubit_by_current_square[f"{taker_prefix}-{take_move.from_index}"],
                    qubit_by_current_square[f"{prefix}-{taken_index}"],
                    qubit_by_current_square[f"{taker_prefix}-{take_move.to_index}"])) 
                circuit.append(cirq.CX(
                    qubit_by_current_square[f"{taker_prefix}-{take_move.to_index}"],
                    qubit_by_current_square[f"{prefix}-{taken_index}"]))
                circuit.append(cirq.CX(
                    qubit_by_current_square[f"{taker_prefix}-{take_move.to_index}"],
                    qubit_by_current_square[f"{taker_prefix}-{take_move.from_index}"]))
                circuit.append(cirq.S(
                    qubit_by_current_square[f"{taker_prefix}-{take_move.to_index}"]))

                del qubit_by_current_square[f"{prefix}-{taken_index}"]
            else:
                qubit_name_counter\
                    = handle_move(qubit_by_current_square,
                                  circuit, qubit_name_counter, prefix)

        if superposition_from is not None:
            # We are entangled, so we still have to do the other part.
            # We already did the first move
            for move in superposition_from.moves[1:]:
                qubit_name_counter\
                    = handle_move(qubit_by_current_square,
                                  circuit, qubit_name_counter, taker_prefix)

        return circuit, qubit_by_current_square, entanglement, superposition,\
            superposition_from

    def measure(self, square_index: int) -> bool:
        """
        Measure whether a piece exists at a specific square.

        Args:
            square_index: The index of the square to measure

        Returns:
            bool: True if a piece is found at the square, False otherwise
            bool: Whether anything was found to be taken during measurement
        """
        if self.board.classic_occupancy[square_index] != ClassicalSquareState.QUANTUM:
            return (self.board.classic_occupancy[square_index] == ClassicalSquareState.OCCUPIED,
                    False)

        circuit, qubit_by_current_square, entanglement, superposition, superposition_from\
            = self._get_circuit_for_square(square_index)

        # Measure all qubits
        circuit.append(cirq.measure(*qubit_by_current_square.values(), key="result"))

        # Simulate the measurement
        simulator = cirq.Simulator()
        result = simulator.run(circuit)

        # Extract which qubit was measured as |1⟩ (occupied)
        measurement = result.measurements["result"][0]

        s = 0
        square_found = {}
        for square, qubit in qubit_by_current_square.items():
            square = int(square.split('-')[1])

            if measurement[list(qubit_by_current_square.values()).index(qubit)] == 1:
                s += 1
                square_found[square] = True
            else:
                if square not in square_found:
                    square_found[square] = False
        taken = s == 1 and entanglement is not None

        for square, found in square_found.items():
            if found:
                self.board.classic_occupancy[square] = ClassicalSquareState.OCCUPIED
            else:
                self.board.classic_occupancy[square] = ClassicalSquareState.EMPTY
                self.board.piece_map[square] = None


        # Remove the superposition
        self.superpositions.remove(superposition)

        # Remove the entanglement if applicable
        if entanglement is not None:
            self.entanglements.remove(entanglement)
            self.superpositions.remove(superposition_from)

        return square_found[square_index], taken

    def get_all_chances(self):
        chances = {}
        for i, occupancy in enumerate(self.board.classic_occupancy):
            if occupancy == ClassicalSquareState.QUANTUM\
               and i not in chances:
                chances |= self._get_chances_for(i)
        return chances

    def _get_chances_for(self, square_index):
        circuit, qubit_by_current_square, entanglement, superposition, superposition_from\
            = self._get_circuit_for_square(square_index)

        simulator = cirq.Simulator()
        squares = []
        observables = []
        for name, qubit in qubit_by_current_square.items():
            square = int(name.split('-')[1])
            squares.append(square)
            observables.append(cirq.Z(qubit))

        ev_list = simulator.simulate_expectation_values(
            circuit, observables=observables)
        for i in range(len(ev_list)):
            # Convert from Z eigenvalues (-1, 1) to chance of |1>
            ev_list[i] = abs((1 - ev_list[i]) / 2.0)

        return dict(zip(squares, ev_list))

