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


class Move(BaseModel):
    is_take_move: bool

    def print_move(self):
        return "TODO"


class ClassicalMove(Move):
    from_index: int
    to_index: int


class SplitMove(Move):
    from_index: int
    to_index1: int
    to_index2: int


class MergeMove(Move):
    from_index1: int
    from_index2: int
    to_index: int
