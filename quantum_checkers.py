from enums import (
    CheckersResult,
    CheckersRules,
    CheckersSquare
)
from typing import List, Dict
from copy import deepcopy
from unitary.alpha import QuantumObject, QuantumWorld
from unitary.alpha.qudit_effects import QuditFlip
from math import ceil

# https://quantumchess.net/play/

_MARK_SYMBOLS = {CheckersSquare.EMPTY: ".", CheckersSquare.WHITE: "w", CheckersSquare.BLACK: "b"}

def _histogram(num_vertical, num_horizontal, results: List[List[CheckersSquare]]) -> List[Dict[CheckersSquare, int]]:
    """Turns a list of whole board measurements into a histogram.

    Returns:
        A num_horizontal*num_vertical element list (one for each square) that contains a dictionary with
        counts for EMPTY, X, and O.
    """
    hist = []
    for idx in range(num_vertical*num_horizontal):
        hist.append({CheckersSquare.EMPTY: 0, CheckersSquare.WHITE: 0, CheckersSquare.BLACK: 0})
    for r in results:
        for idx in range(num_vertical*num_horizontal):
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
    def __init__(self, run_on_hardware = False, num_vertical = 5, num_horizontal = 5, num_vertical_pieces = 1) -> None:
        # self.board = Board(num_vertical, num_horizontal, num_vertical_pieces)
        self.num_vertical = num_vertical
        self.num_horizontal = num_horizontal
        self.num_vertical_pieces = num_vertical_pieces # how many rows of one color need to be filled with pieces
        if(num_vertical_pieces*2 >= num_vertical):
            print(f"Too many rows ({num_vertical_pieces}) filled with pieces. Decrease this number for this size of board. [{num_vertical}]x[{num_horizontal}]")
            exit()
        # Initialize empty board
        self.clear(run_on_hardware)
        # Add initial pieces to board
        for y in range(num_vertical_pieces):
            for x in range(self.num_horizontal):
                if(y%2==0 and x%2==0):
                    QuditFlip(3, 0, CheckersSquare.BLACK.value)(self.squares[str(self.convert_xy_to_id(x,y))])
                    QuditFlip(3, 0, CheckersSquare.WHITE.value)(self.squares[str(self.convert_xy_to_id(x,self.num_vertical-1-y))])
                    # self.board_matrix[y][x].occupant = Piece(CheckersSquare.BLACK)
                    # self.board_matrix[self.num_vertical-1-y][x].occupant = Piece(CheckersSquare.WHITE)

                elif(y%2!=0 and x%2!=0):
                    QuditFlip(3, 0, CheckersSquare.BLACK.value)(self.squares[str(self.convert_xy_to_id(x,y))])
                    QuditFlip(3, 0, CheckersSquare.WHITE.value)(self.squares[str(self.convert_xy_to_id(x,self.num_vertical-1-y))])
                    # self.board_matrix[y][x].occupant = Piece(CheckersSquare.BLACK)
                    # self.board_matrix[self.num_vertical-1-y][x].occupant = Piece(CheckersSquare.WHITE)
    
    def on_board(self, x, y):
        """
        Checks if given location is on the board on not. 
        Returns true if [x][y] is on the board
        """
        if(x < 0 or x > self.num_horizontal-1 or y < 0 or y > self.num_vertical-1):
            return False
        return True

    def get_positions(self, player):
        """
        Returns all ids for player pieces and opponent pieces
        """
        results = self.board.peek(count=100)
        hist = _histogram(self.num_vertical, self.num_horizontal,
            [
                [CheckersSquare.from_result(square) for square in result]
                for result in results
            ]
        )
        player_ids = []
        opponent_ids = []
        for y in range(self.num_vertical):
            for mark in (CheckersSquare.BLACK, CheckersSquare.WHITE):
                for x in range(self.num_horizontal):
                    id = self.convert_xy_to_id(x,y)
                    if(hist[id][mark] != 0): # For the current player (white or black)
                        if(mark == player):
                            player_ids.append(id)
                        else:
                            opponent_ids.append(id)
        return player_ids, opponent_ids

    def calculate_possible_moves(self, player: CheckersSquare):
        """
        Loop over all pieces, if there is a chance that there is a piece in the right color calculate legal moves for that piece
        """
        print(player)
        player_ids, opponent_ids = self.get_positions(player)
        print(player_ids)
        # for id in player_ids:
        #     print(self.convert_id_to_xy(id)) 
        print(opponent_ids)
        # For each player id, calculate legal moves
        blind_moves = []
        for id in player_ids:
            blind_moves += self.calculate_blind_moves(id, player)
        for i in blind_moves:
            print(f"[{i.start_col}][{i.start_row}] to [{i.end_col}][{i.end_row}]")
        pass
    
    def calculate_blind_moves(self, id, player):
        """
        For the piece in id, that belongs to player, calculate all 'possible' moves ignoring other pieces, but checking for boundaries of the board
        Important: Assumes there is a piece in the position of the id that belongs to the current player
        """
        x, y = self.convert_id_to_xy(id)
        legal_moves = []
        if(str(id) not in self.king_squares): # If the current piece is not a king
            if player == CheckersSquare.WHITE: # White moves up
                if(self.on_board(x-1, y-1)):
                    legal_moves.append(Move(x,y,x-1,y-1))
                if(self.on_board(x+1, y-1)):
                    legal_moves.append(Move(x,y,x+1,y-1))
            else: # Black piece that moves down
                if(self.on_board(x-1, y+1)):
                    legal_moves.append(Move(x,y,x-1,y+1))
                if(self.on_board(x+1, y+1)):
                    legal_moves.append(Move(x,y,x+1,y+1))
        else: # King piece that can move in all for directions
            if(self.on_board(x-1, y-1)):
                    legal_moves.append(Move(x,y,x-1,y-1))
            if(self.on_board(x+1, y-1)):
                legal_moves.append(Move(x,y,x+1,y-1))
            if(self.on_board(x-1, y+1)):
                    legal_moves.append(Move(x,y,x-1,y+1))
            if(self.on_board(x+1, y+1)):
                legal_moves.append(Move(x,y,x+1,y+1))
        return legal_moves
    
    def clear(self, run_on_hardware):
        """
        Create empty the board
        """
        self.squares = {}
        self.king_squares = {}
        self.empty_squares = set()
        self.last_result = [CheckersSquare.EMPTY] * 9
        # self.empty_squares = [True]*(self.num_vertical*self.num_horizontal)

        for i in range(self.num_vertical*self.num_horizontal):
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
        return ((y*self.num_horizontal+x))
    
    def convert_id_to_xy(self, id) -> (int, int):
        return (id % self.num_horizontal, id // self.num_horizontal)

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
        # if(len(self.board.calculate_all_possible_moves(CheckersSquare.WHITE))==0 and len(self.board.calculate_all_possible_moves(CheckersSquare.BLACK))==0):
        #     return(CheckersResult.DRAW)
        # elif(len(self.board.calculate_all_possible_moves(CheckersSquare.WHITE))==0):
        #     return(CheckersResult.WHITE_WINS)
        # elif(len(self.board.calculate_all_possible_moves(CheckersSquare.BLACK))==0):
        #     return(CheckersResult.BLACK_WINS)
        # else:
        #     return(CheckersResult.UNFINISHED)
        
    def do_move(self, move: Move):
        self.board.move_piece(move.start_row, move.start_col, move.end_row, move.end_col)
        print(move.start_row, move.start_col, move.end_row, move.end_col)
        
class GameInterface:
    def __init__(self, game: Checkers) -> None:
        self.game = game
        self.player = CheckersSquare.WHITE
        self.quit = False

    def get_move(self):
        return input(f'Player {self.player.name} to move: ')

    def play(self):
        while(self.game.result() == CheckersResult.UNFINISHED and not self.quit):
            # move = Move(0, 0, 1, 1)
            # self.game.move(move, CheckersSquare.BLACK)
            self.print_board()
            # exit()
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

            self.player = CheckersSquare.BLACK if self.player == CheckersSquare.WHITE else CheckersSquare.WHITE

    def print_board(self) -> str:
        str_board = self.get_board()
        print(str_board)
        return str_board

    def get_board(self) -> str:
        """Returns the Checkers board in ASCII form.
        Function take from quantum tiq taq toe"""
        
        results = self.game.board.peek(count=100)
        hist = _histogram(self.game.num_vertical, self.game.num_horizontal,
            [
                [CheckersSquare.from_result(square) for square in result]
                for result in results
            ]
        )
        output = "\n"
        for y in range(self.game.num_vertical):
            for mark in CheckersSquare:
                output += " "
                for x in range(self.game.num_horizontal):
                    idx = self.game.convert_xy_to_id(x,y)               
                    output += f" {_MARK_SYMBOLS[mark]} {hist[idx][mark]:3}"
                    if x != self.game.num_horizontal-1:
                        output += " |"
                output += "\n"
            if y != self.game.num_vertical-1:
                output += "--------"*self.game.num_horizontal + "\n"
        return output
    
    def get_legal_moves(self) -> list:
        return self.game.calculate_possible_moves(self.player)

    def print_legal_moves(self) -> list:
        """
        Prints all legal moves the current player can do
        """
        legal_moves = self.get_legal_moves()
        for i in legal_moves:
            print(f"{index}. [{i.start_col}][{i.start_row}] to [{i.end_col}][{i.end_row}]")
            index += 1
        return legal_moves

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