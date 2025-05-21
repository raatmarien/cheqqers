class Move:
    is_take_move: bool

    def __init__(self, is_take_move):
        self.is_take_move = is_take_move

    def print_move(self):
        return "TODO"


class ClassicalMove(Move):
    from_index: int
    to_index: int

    def __init__(self, is_take_move, from_index, to_index):
        super().__init__(is_take_move)
        self.from_index = from_index
        self.to_index = to_index


class SplitMove(Move):
    from_index: int
    to_index1: int
    to_index2: int

    def __init__(self, is_take_move, from_index, to_index1, to_index2):
        super().__init__(is_take_move)
        self.from_index = from_index
        self.to_index1 = to_index1
        self.to_index2 = to_index2


class MergeMove(Move):
    from_index1: int
    from_index2: int
    to_index: int

    def __init__(self, is_take_move, from_index1, from_index2, to_index):
        super().__init__(is_take_move)
        self.from_index1 = from_index1
        self.from_index2 = from_index2
        self.to_index = to_index
