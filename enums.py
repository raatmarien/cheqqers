# Copyright 2025 Marien Raat <mail@marienraat.nl>
#
# This file is part of Cheqqers.
#
# Cheqqers is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Cheqqers is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with Cheqqers. If not, see
# <https://www.gnu.org/licenses/>.
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
