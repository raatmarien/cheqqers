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
from enums import GameType, ClassicalSquareState, PieceColor
from moves import Move, ClassicalMove, SplitMove, MergeMove
from piece import Piece


class Board:
    size: int
    game_type: GameType
    piece_map: list[Piece]
    classic_occupancy: list[ClassicalSquareState]
    xy_index_map: dict
    index_xy_map: dict

    def __init__(self, size, start_rows, game_type: GameType = GameType.INTERFERENCE):
        self.size = size
        self.game_type = game_type
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
                    self.piece_map.append(Piece(color=PieceColor.WHITE,
                                                crowned=False))
                elif y >= (self.size - start_rows):
                    self.piece_map.append(Piece(color=PieceColor.BLACK,
                                                crowned=False))
                else:
                    self.piece_map.append(None)
                    occupancy = ClassicalSquareState.EMPTY
                self.classic_occupancy.append(occupancy)

                i += 1

    def get_possible_moves(self, color: PieceColor, superpositions=None):
        take_moves = self.get_take_moves(color, superpositions)
        if len(take_moves) > 0:
            return take_moves
        else:
            possible_moves = self._get_possible_moves(color, False, superpositions)
            if self.game_type == GameType.INTERFERENCE:
                return possible_moves
            elif self.game_type == GameType.SUPERPOSITION or self.game_type == GameType.ENTANGLEMENT:
                return [m for m in possible_moves if isinstance(m, ClassicalMove) or isinstance(m, SplitMove)]
            elif self.game_type == GameType.CLASSIC:
                return [m for m in possible_moves if isinstance(m, ClassicalMove)]

    def get_take_moves(self, color: PieceColor, superpositions):
        return self._get_possible_moves(color, True, superpositions)

    def _get_possible_moves(self, color: PieceColor, take: bool, superpositions):
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
                        moves.append(ClassicalMove(
                            is_take_move=True, from_index=i, to_index=i_to))
                    else:
                        if self.classic_occupancy[i_] != ClassicalSquareState.EMPTY:
                            continue
                        moves.append(ClassicalMove(
                            is_take_move=False, from_index=i, to_index=i_))

        # Note: We don't allow split or merge moves with takes
        if not take:
            moves += self._find_split_and_merge_moves(moves, superpositions)

        return moves

    def _find_split_and_merge_moves(self, moves: list[Move], superpositions):
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
                    split_moves.append(SplitMove(
                        is_take_move=False,
                        from_index=move.from_index,
                        to_index1=related_moves[i].to_index,
                        to_index2=related_moves[j].to_index))

        # Merge moves
        merge_moves = []
        for move in moves:
            if len([mv for mv in merge_moves
                    if mv.to_index == move.to_index]) > 0:
                continue

            related_moves = [rm for rm in moves
                             if rm.to_index == move.to_index]
            if len(related_moves) < 2:
                continue
            for i in range(len(related_moves)):
                for j in range(i + 1, len(related_moves)):
                    # Apply same piece and no-double occupancy rule
                    if (
                            self.from_same_piece(
                                related_moves[i].from_index,
                                related_moves[j].from_index, superpositions) and
                            self.piece_map[related_moves[i].from_index].crowned ==
                            self.piece_map[related_moves[j].from_index].crowned):

                        merge_moves.append(MergeMove(
                            is_take_move=False,
                            from_index1=related_moves[i].from_index,
                            from_index2=related_moves[j].from_index,
                            to_index=move.to_index))

        return split_moves + merge_moves

    def from_same_piece(self, index1, index2, superpositions):
        if superpositions is None:
            return False

        for superposition in superpositions:
            if index1 in superposition.occupied_squares and\
               index2 in superposition.occupied_squares:
                return True

        return False

    def display(self):
        """Display the current board state"""
        board_display = ""
        for y in range(self.size-1, -1, -1):
            row = f"{y} "
            for x in range(self.size):
                if (x, y) not in self.xy_index_map:
                    row += "  "  # White square
                    continue

                i = self.xy_index_map[(x, y)]
                if self.classic_occupancy[i] == ClassicalSquareState.EMPTY:
                    row += "- "  # Empty black square
                elif self.piece_map[i].color == PieceColor.WHITE:
                    row += "● " if not self.piece_map[i].crowned else "♚ "  # White piece
                else:
                    row += "○ " if not self.piece_map[i].crowned else "♔ "  # Black piece
            board_display += row + "\n"
        board_display += "  "
        for x in range(self.size):
            board_display += f"{x} "
        return board_display
