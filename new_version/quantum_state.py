from moves import Move, ClassicalMove, SplitMove, MergeMove


class PieceSuperposition:
    """Keeps track of the quantum state of one piece over the board
    """
    occupied_squares: list[int]
    moves: list[Move]
    moves_since_measure: int

    def __init__(self, move: Move, moves_since_measure):
        self.moves_since_measure = moves_since_measure
        if isinstance(move, ClassicalMove):
            self.occupied_squares = [move.from_index, move.to_index]
        elif isinstance(move, SplitMove):
            self.occupied_squares = [move.to_index1, move.to_index2]
        else:
            raise 'Superposition can only be start with split or classic take'
        self.moves = [move]

    def apply_move(self, move: Move):
        self.moves.append(move)
        if isinstance(move, ClassicalMove):
            self._apply_classical_move(move)
        elif isinstance(move, SplitMove):
            self._apply_split_move(move)
        elif isinstance(move, MergeMove):
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
        self.occupied_squares.append(move.to_index)


class PieceEntanglement:
    superposition_taken: PieceSuperposition
    superposition_from: PieceSuperposition

    def __init__(self, superposition_taken, superposition_from):
        self.superposition_taken = superposition_taken
        self.superposition_from = superposition_from
