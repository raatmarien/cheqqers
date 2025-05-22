from enum import Enum


class GameType(Enum):
    CLASSIC = 0
    SUPERPOSITION = 1
    ENTANGLEMENT = 2
    INTERFERENCE = 3


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


class GameState(Enum):
    IN_PROGRESS = 0
    WHITE_WON = 1
    BLACK_WON = 2
    DRAW = 3
