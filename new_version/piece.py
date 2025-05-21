import copy
from enums import PieceColor


class Piece:
    color: PieceColor
    crowned: bool
    moves_since_measure: int

    def __init__(self, color, crowned):
        self.color = color
        self.crowned = crowned
        self.moves_since_measure = 0

    def copy(self):
        return copy.deepcopy(self)

    def apply_phase(self):
        n = self.copy()
        n.moves_since_measure += 1
        return n
