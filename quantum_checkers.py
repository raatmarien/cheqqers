from enums import (
    CheckersResult,
    CheckersRules,
    Colors,
    CheckersSquare
)
from typing import List, Dict
from copy import deepcopy
from unitary.alpha import QuantumObject, QuantumWorld
from unitary.alpha.qudit_effects import QuditFlip
from math import ceil

# https://quantumchess.net/play/

_MARK_SYMBOLS = {CheckersSquare.EMPTY: ".", CheckersSquare.WHITE: "w", CheckersSquare.BLACK: "b"}

def _histogram(num_rows, num_cols, results: List[List[CheckersSquare]]) -> List[Dict[CheckersSquare, int]]:
    """Turns a list of whole board measurements into a histogram.

    Returns:
        A 9 element list (one for each square) that contains a dictionary with
        counts for EMPTY, X, and O.
    """
    hist = []
    for idx in range(num_rows*num_cols):
        hist.append({CheckersSquare.EMPTY: 0, CheckersSquare.WHITE: 0, CheckersSquare.BLACK: 0})
    for r in results:
        for idx in range(num_rows*num_cols):
            hist[idx][r[idx]] += 1
    return hist

# GLOBAL GAME SETTINGS
forced_take = True
class Move:
    def __init__(self, start_row, start_col, end_row, end_col) -> None:
        self.start_row = start_row
        self.start_col = start_col
        self.end_row = end_row
        self.end_col = end_col

class Checkers:
    def __init__(self, run_on_hardware = False, num_rows = 4, num_cols = 5, num_rows_pieces = 1) -> None:
        # self.board = Board(num_rows, num_cols, num_rows_pieces)
        self.num_rows = num_rows
        self.num_cols = num_cols
        self.num_rows_pieces = num_rows_pieces
        if(num_rows_pieces*2 >= num_rows):
            print(f"Too many rows ({num_rows_pieces}) filled with pieces. Decrease this number for this size of board. [{num_rows}]x[{num_cols}]")
            exit()
        # Initialize empty board
        self.clear(run_on_hardware)
        # Add initial pieces to board
        for y in range(num_rows_pieces):
            for x in range(self.num_cols):
                if(y%2==0 and x%2==0):
                    QuditFlip(3, 0, CheckersSquare.BLACK.value)(self.squares[str(self.convert_xy_to_id(x,y))])
                    QuditFlip(3, 0, CheckersSquare.WHITE.value)(self.squares[str(self.convert_xy_to_id(x,self.num_rows-1-y))])
                    # self.board_matrix[y][x].occupant = Piece(Colors.BLACK)
                    # self.board_matrix[self.num_rows-1-y][x].occupant = Piece(Colors.WHITE)

                elif(y%2!=0 and x%2!=0):
                    QuditFlip(3, 0, CheckersSquare.BLACK.value)(self.squares[str(self.convert_xy_to_id(x,y))])
                    QuditFlip(3, 0, CheckersSquare.WHITE.value)(self.squares[str(self.convert_xy_to_id(x,self.num_rows-1-y))])
                    # self.board_matrix[y][x].occupant = Piece(Colors.BLACK)
                    # self.board_matrix[self.num_rows-1-y][x].occupant = Piece(Colors.WHITE)
    
    def clear(self, run_on_hardware):
        """
        Create empty the board
        """
        self.squares = {}
        self.empty_squares = set()
        self.last_result = [CheckersSquare.EMPTY] * 9
        # self.empty_squares = [True]*(self.num_rows*self.num_cols)

        for i in range(self.num_rows*self.num_cols):
            self.empty_squares.add(str(i))
            self.squares[str(i)] = QuantumObject(str(i), CheckersSquare.EMPTY)
        self.board = QuantumWorld(
            list(self.squares.values()), compile_to_qubits=run_on_hardware
        )

    def move(self, move: Move, mark: CheckersSquare):
        # Flip a tile

        # Moving one piece to an empty tile
        QuditFlip(3, 0, mark.value)(self.squares[str(self.convert_xy_to_id(move.end_row, move.end_col))])
        self.remove_piece((move.start_row, move.start_col))

    def remove_piece(self, id: int or (int,int)):
        # if(isinstance(id, (int, int))):
        if(type(id) is tuple):
            id = self.convert_xy_to_id(id[0], id[1])
        id = str(id)
        self.empty_squares.add(id)
        # self.squares[id] = CheckersSquare.EMPTY
        # self.squares[id] = QuantumObject(id, CheckersSquare.EMPTY)
        # QuditFlip(3, 0, CheckersSquare.EMPTY.value)(self.squares[id])
        QuditFlip(3, CheckersSquare.WHITE.value, CheckersSquare.EMPTY.value)(self.squares[id])
        QuditFlip(3, CheckersSquare.BLACK.value, CheckersSquare.EMPTY.value)(self.squares[id])
        return
        
    def convert_xy_to_id(self, x, y) -> int:
        """
        x = row
        y = column
        """
        return ((y*self.num_cols+x))
    
    def convert_id_to_xy(self, id) -> (int, int):
        return (id % self.num_cols, id // self.num_cols)

    def result(self):
        """
        returns:
            UNFINISHED = 0
            White wins = 1
            Black wins = 2
            DRAW = 3
            BOTH_WIN = 4
        """
        return CheckersResult.UNFINISHED
        # if(len(self.board.calculate_all_possible_moves(Colors.WHITE))==0 and len(self.board.calculate_all_possible_moves(Colors.BLACK))==0):
        #     return(CheckersResult.DRAW)
        # elif(len(self.board.calculate_all_possible_moves(Colors.WHITE))==0):
        #     return(CheckersResult.WHITE_WINS)
        # elif(len(self.board.calculate_all_possible_moves(Colors.BLACK))==0):
        #     return(CheckersResult.BLACK_WINS)
        # else:
        #     return(CheckersResult.UNFINISHED)
        
    def do_move(self, move: Move):
        self.board.move_piece(move.start_row, move.start_col, move.end_row, move.end_col)
        print(move.start_row, move.start_col, move.end_row, move.end_col)
        
class GameInterface:
    def __init__(self, game: Checkers) -> None:
        self.game = game
        self.player = Colors.WHITE
        self.quit = False

    def get_move(self):
        return input(f'Player {self.player.name} to move: ')

    def play(self):
        while(self.game.result() == CheckersResult.UNFINISHED and not self.quit):
            move = Move(0, 0, 1, 1)
            self.game.move(move, CheckersSquare.BLACK)
            print(self.print_board())
            exit()
            legal_moves = self.print_legal_moves()
            move = self.get_move()
            try:
                move = int(move)
            except:
                print("Input has to be an integer!")
                continue
            if(move > len(legal_moves) or move < 1):
                print(f"Input has to be an integer between 1 and {len(legal_moves)}!")
                continue
            self.game.do_move(legal_moves[move-1])

            self.player = Colors.BLACK if self.player == Colors.WHITE else Colors.WHITE

    def print_board(self) -> str:
        """Returns the Checkers board in ASCII form.
        Function take from quantum tiq taq toe"""
        
        results = self.game.board.peek(count=100)
        hist = _histogram(self.game.num_rows, self.game.num_cols,
            [
                [CheckersSquare.from_result(square) for square in result]
                for result in results
            ]
        )
        output = "\n"
        for row in range(self.game.num_rows):
            for mark in CheckersSquare:
                output += " "
                for col in range(self.game.num_cols):
                    idx = self.game.convert_xy_to_id(col,row)
                    # print(f"({row},{col}): {idx}")                 
                    output += f" {_MARK_SYMBOLS[mark]} {hist[idx][mark]:3}"
                    if col != self.game.num_cols-1:
                        output += " |"
                output += "\n"
            if row != self.game.num_rows-1:
                output += "--------"*self.game.num_cols + "\n"
        return output

def main():
    game = GameInterface(Checkers())
    # for col in range(5):
    #     for row in range(4):
    #         print(col, row, end= " - ")
    #         print(game.game.convert_xy_to_id(row,col))
    game.play()
    # game.print_board()
    # game.print_legal_moves()
    # game.play()

if __name__ == "__main__":
    main()