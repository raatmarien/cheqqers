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
