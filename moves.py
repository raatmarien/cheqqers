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
