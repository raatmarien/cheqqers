from enum import Enum

class CheckersResult(Enum):
    UNFINISHED = 0
    X_WINS = 1
    O_WINS = 2
    DRAW = 3
    BOTH_WIN = 4

class CheckersRules(Enum):
    """The different rulesets for Quantum TicTacToe.

    The quantum versions differ in the way split moves work, though in all
    cases a split move is implemented by 1) first flipping a square from empty
    to X or O (depending on the player), and then 2) performing a swap operation
    between the two involved squares. In QUANTUM_V2, this is a custom swap that
    takes XE -> XE + EX (and similarly for OE), but *not* XO -> XO + OX. In
    QUANTUM_V3, this latter type of swap *is* included.

    CLASSICAL        = No split moves, just classical TicTacToe.
    QUANTUM_V1       = Split moves only on two empty squares.
    QUANTUM_V2       = Split moves unrestricted, custom gate.
    QUANTUM_V3       = Split moves unrestircted, sqrt-ISWAP gate.
    """

    CLASSICAL = 0
    QUANTUM_V1 = 1
    QUANTUM_V2 = 2
    QUANTUM_V3 = 3

class Colors(Enum):
    BLACK = 0
    WHITE = 1