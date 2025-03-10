from enum import Enum


class ClassicalSquareState(Enum):
    EMPTY = 0
    OCCUPIED = 1
    QUANTUM = 2


class PieceColor(Enum):
    WHITE = 0
    BLACK = 1


class Piece:
    color: PieceColor
    crowned: bool

    def __init__(self, color, crowned):
        self.color = color
        self.crowned = crowned


class Move:
    def print_move(self):
        return "TODO"


class ClassicalMove(Move):
    from_index: int
    to_index: int

    def __init__(self, from_index, to_index):
        self.from_index = from_index
        self.to_index = to_index


class SplitMove(Move):
    from_index: int
    to_index1: int
    to_index2: int

    def __init__(self, from_index, to_index1, to_index2):
        self.from_index = from_index
        self.to_index1 = to_index1
        self.to_index2 = to_index2


class MergeMove(Move):
    from_index1: int
    from_index2: int
    to_index: int

    def __init__(self, from_index1, from_index2, to_index):
        self.from_index1 = from_index1
        self.from_index2 = from_index2
        self.to_index = to_index


class Board:
    size: int
    piece_map: list[Piece]
    classic_occupancy: list[ClassicalSquareState]
    xy_index_map: dict
    index_xy_map: dict

    def __init__(self, size, start_rows):
        self.size = size
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
                    self.piece_map.append(Piece(PieceColor.WHITE, False))
                elif y >= (self.size - start_rows):
                    self.piece_map.append(Piece(PieceColor.BLACK, False))
                else:
                    self.piece_map.append(None)
                    occupancy = ClassicalSquareState.EMPTY
                self.classic_occupancy.append(occupancy)

                i += 1

    def get_possible_moves(self, color: PieceColor):
        take_moves = self.get_take_moves(color)
        if len(take_moves) > 0:
            return take_moves
        else:
            return self._get_possible_moves(color, False)

    def get_take_moves(self, color: PieceColor):
        return self._get_possible_moves(color, True)

    def _get_possible_moves(self, color: PieceColor, take: bool):
        moves = []
        for y in range(self.size):
            for x in range(self.size):
                if (x, y) not in self.xy_index_map:
                    continue

                i = self.xy_index_map[(x, y)]
                if self.classic_occupancy[i] == ClassicalSquareState.EMPTY or\
                   self.piece_map[i].color != color:
                    continue

                possible_squares = [(x - 1, y + 1), (x + 1, y + 1)]
                if self.piece_map[i].crowned:
                    possible_squares += [(x - 1, y - 1), (x + 1, y - 1)]

                for (x_, y_) in possible_squares:
                    if (x_, y_) not in self.xy_index_map:
                        continue
                    i_ = self.xy_index_map[(x_, y_)]
                    if take:
                        if self.classic_occupancy[i_] == ClassicalSquareState.EMPTY or\
                           self.piece_map[i_].color == color:
                            continue
                        x_to = x_ + (x_ - x)
                        y_to = y + (y_ - y)
                        if (x_to, y_to) not in self.xy_index_map:
                            continue
                        i_to = self.xy_index_map[(x_to, y_to)]
                        if self.classic_occupancy[i_to] != ClassicalSquareState.EMPTY:
                            continue
                        moves.append(ClassicalMove(i, i_to))
                    else:
                        if self.classic_occupancy[i_] != ClassicalSquareState.EMPTY:
                            continue
                        moves.append(ClassicalMove(i, i_))

        # Note: We don't allow split or merge moves with takes
        if not take:
            moves += self._find_split_and_merge_moves(moves)

        return moves

    def _find_split_and_merge_moves(self, moves: list[Move]):

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
                    split_moves.append(
                        SplitMove(move.from_index,
                                  related_moves[i].to_index,
                                  related_moves[j].to_index))

        # Merge mvoes
        merge_moves = []
        for move in moves:
            if len([mv for mv in merge_moves
                    if mv.to_index == move.to_index]) > 0:
                continue

            related_moves = [rm for rm in moves
                             if rm.to_index == move.to_index
                             and self.from_same_piece(move.from_index,
                                                      rm.from_index)]
            if len(related_moves) < 2:
                continue
            for i in range(len(related_moves)):
                for j in range(i + 1, len(related_moves)):
                    merge_moves.append(
                        MergeMove(related_moves[i].from_index,
                                  related_moves[j].from_index,
                                  move.to_index))

        return split_moves + merge_moves

    def from_same_piece(self, index1, index2):
        if index1 == index2:
            return True
        return True  # TODO actually check


class GameState(Enum):
    IN_PROGRESS = 0
    WHITE_WON = 1
    BLACK_WON = 2
    DRAW = 3


class Game:
    board: Board
    moves: list[Move]
    state: GameState
    white_turn: bool

    def __init__(self, size, start_rows):
        self.board = Board(size, start_rows)
        self.moves = []
        self.state = GameState.IN_PROGRESS
        self.white_turn = True
