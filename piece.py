from pydantic import BaseModel
import copy

from enums import PieceColor


class Piece(BaseModel):
    color: PieceColor
    crowned: bool
    moves_since_measure: int = 0

    def copy(self):
        return copy.deepcopy(self)

    def apply_phase(self):
        n = self.copy()
        n.moves_since_measure += 1
        return n
