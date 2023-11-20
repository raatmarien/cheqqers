from enums import (
    CheckersResult,
    CheckersRules,
    CheckersSquare
)
from typing import List, Dict
from copy import deepcopy
from unitary.alpha import QuantumObject, QuantumWorld, Move, Split
from unitary.alpha.qudit_effects import QuditFlip
from math import ceil
from quantum_split import CheckersSplit, CheckersClassicMove
from unitary.alpha.qudit_gates import QuditXGate, QuditISwapPowGate
# from cirq import ISWAP
import cirq

# https://quantumchess.net/play/
# https://entanglement-chess.netlify.app/qm
# https://github.com/quantumlib/unitary/blob/main/docs/unitary/getting_started.ipynb

# GLOBAL GAME SETTINGS
_forced_take = True
_MARK_SYMBOLS = {CheckersSquare.EMPTY: ".", CheckersSquare.WHITE: "w", CheckersSquare.BLACK: "b", CheckersSquare.WHITE_KING: "W", CheckersSquare.BLACK_KING: "B"}

def _histogram(num_vertical, num_horizontal, results: List[List[CheckersSquare]]) -> List[Dict[CheckersSquare, int]]:
    """Turns a list of whole board measurements into a histogram.

    Returns:
        A num_horizontal*num_vertical element list (one for each square) that contains a dictionary with
        counts for EMPTY, X, and O.
    """
    hist = []
    for idx in range(num_vertical*num_horizontal):
        hist.append({CheckersSquare.EMPTY: 0, CheckersSquare.WHITE: 0, CheckersSquare.BLACK: 0, CheckersSquare.WHITE_KING: 0, CheckersSquare.BLACK_KING: 0})
    for r in results:
        for idx in range(num_vertical*num_horizontal):
            hist[idx][r[idx]] += 1
    return hist


class Move_temp:
    def __init__(self, source_x: int, source_y: int, target1_x: int, target1_y: int, target2_x: int = None, target2_y: int = None) -> None:
        self.source_x = source_x
        self.source_y = source_y
        self.target1_x = target1_x
        self.target1_y = target1_y
        self.target2_x = target2_x
        self.target2_y = target2_y

    # def print_move(self, index = -1) -> None:
    #     if(index <= 0):
    #         print(f"[{self.source_x}][{self.source_y}] to [{self.target1_x}][{self.target1_y}]")
    #     else:
    #         print(f"{index}. [{self.source_x}][{self.source_y}] to [{self.target1_x}][{self.target1_y}]")

class Checkers:
    def __init__(self, run_on_hardware = False, num_vertical = 5, num_horizontal = 5, num_vertical_pieces = 1, rules = CheckersRules.QUANTUM_V3) -> None:
        # self.board = Board(num_vertical, num_horizontal, num_vertical_pieces)
        self.rules = rules
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
                    QuditFlip(5, 0, CheckersSquare.BLACK.value)(self.squares[str(self.convert_xy_to_id(x,y))])
                    QuditFlip(5, 0, CheckersSquare.WHITE.value)(self.squares[str(self.convert_xy_to_id(x,self.num_vertical-1-y))])
                    # self.board_matrix[y][x].occupant = Piece(CheckersSquare.BLACK)
                    # self.board_matrix[self.num_vertical-1-y][x].occupant = Piece(CheckersSquare.WHITE)

                elif(y%2!=0 and x%2!=0):
                    QuditFlip(5, 0, CheckersSquare.BLACK.value)(self.squares[str(self.convert_xy_to_id(x,y))])
                    QuditFlip(5, 0, CheckersSquare.WHITE.value)(self.squares[str(self.convert_xy_to_id(x,self.num_vertical-1-y))])
                    # self.board_matrix[y][x].occupant = Piece(CheckersSquare.BLACK)
                    # self.board_matrix[self.num_vertical-1-y][x].occupant = Piece(CheckersSquare.WHITE)
    
    def measure(self) -> None:
        """Measures all squares on the TicTacToe board.

        Once the board is measured, a new board is created
        that is initialized to the measured state.
        This should happen when no more squares are empty.
        """
        self.last_result = [
            CheckersSquare.from_result(square) for square in self.board.pop()
        ]
        for id in range(self.num_horizontal*self.num_vertical):
            # if self.last_result[idx] == CheckersSquare.EMPTY:
            #     self.empty_squares.add(name)
            self.squares[str(id)] = QuantumObject(str(id), self.last_result[id])
        self.board = QuantumWorld(list(self.squares.values()))

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
        Returns player_ids: list, opponent_ids: list
        player_ids and opponent_ids contain the ids
        """
        results = self.board.peek(count=100)
        hist = _histogram(self.num_vertical, self.num_horizontal,
            [
                [CheckersSquare.from_result(square) for square in result]
                for result in results
            ]
        )
        white_ids = []
        black_ids = []
        for id in range(self.num_vertical*self.num_horizontal):
            for mark in (CheckersSquare.BLACK, CheckersSquare.WHITE, CheckersSquare.WHITE_KING, CheckersSquare.BLACK_KING):
                if(hist[id][mark] != 0): # For the current player (white or black). Check both for entanglement (if that will be implemented)
                    if(mark == CheckersSquare.WHITE or mark == CheckersSquare.WHITE_KING):
                        white_ids.append(id)
                    if(mark == CheckersSquare.WHITE or mark == CheckersSquare.WHITE_KING):
                        black_ids.append(id)
        if(player == CheckersSquare.WHITE):
            return white_ids, black_ids
        else:
            return black_ids, white_ids

    def calculate_possible_moves(self, player: CheckersSquare) -> list:
        """
        Calculates all possible moves for 'player'
        Loop over all pieces, if there is a chance that there is a piece in the right color calculate legal moves for that piece
        """
        legal_moves = [] # All legal moves
        legal_take_moves = [] # Only the moves which can take another player
        player_ids, opponent_ids = self.get_positions(player)
        blind_moves = []
        for id in player_ids:
            blind_moves += self.calculate_blind_moves(id, player)
        for move in blind_moves:
            # For each move check if there is a piece in the position
            # If it is empty it is a legal move
            # If there is another piece, check if it is a different color than your own color
            # If so, check if one square further is empty
            # If so you can take a piece
            Move_temp()
            source_id = self.convert_xy_to_id(move.source_x)

            end_id = self.convert_xy_to_id(move.target1_x, move.target1_y)
            if(end_id not in player_ids and end_id not in opponent_ids): # it is an empty square, so it is possible move there
               legal_moves.append(move)
            elif(end_id in opponent_ids): # There is an opponent in this coordinate, check if we can jump over them
                jump_y = move.target1_y+(move.target1_y-move.source_y)
                jump_x = move.target1_x+(move.target1_x-move.source_x)
                jump_id = self.convert_xy_to_id(jump_x, jump_y)
                if(self.on_board(jump_x, jump_y) and jump_id not in (player_ids+opponent_ids)): # we can jump over if the coordinates are on the board and the piece is empty
                    legal_moves.append(Move_temp(move.source_x, move.source_y, jump_x, jump_y))
                    legal_take_moves.append(Move_temp(move.source_x, move.source_y, jump_x, jump_y))
        if(len(legal_take_moves) != 0 and _forced_take): # If we can take a piece and taking a piece is forced, return only the moves that can take a piece
            return legal_take_moves
        return legal_moves
    
    def calculate_blind_moves(self, id, player):
        """
        For the piece in id, that belongs to player, calculate all 'possible' moves ignoring other pieces, but checking for boundaries of the board
        Important: Assumes there is a piece in the position of the id that belongs to the current player
        """
        x, y = self.convert_id_to_xy(id)
        blind_moves = []
        # if(str(id) not in self.king_squares): # If the current piece is not a king
        if player == CheckersSquare.WHITE: # White moves up -> y-1
            left = False
            right = False
            if(self.on_board(x-1, y-1)):
                blind_moves.append(Move_temp(x,y,x-1,y-1))
                left = True
            if(self.on_board(x+1, y-1)):
                blind_moves.append(Move_temp(x,y,x+1,y-1))
                right = True
            if(left and right):
                blind_moves.append(Move_temp(x,y,x-1,y-1,x+1,y-1))
        elif player == CheckersSquare.BLACK: # Black piece that moves down -> y+1
            left = False
            right = False
            if(self.on_board(x-1, y+1)):
                blind_moves.append(Move_temp(x,y,x-1,y+1))
                left = True
            if(self.on_board(x+1, y+1)):
                blind_moves.append(Move_temp(x,y,x+1,y+1))
                right = True
            if(left and right):
                blind_moves.append(Move_temp(x,y,x-1,y-1,x+1,y-1))
        else: # King piece that can move in all for directions
            bottom_left, bottom_right, top_left, top_right = False, False, False, False
            if(self.on_board(x-1, y-1)):
                blind_moves.append(Move_temp(x,y,x-1,y-1))
                top_left = True
            if(self.on_board(x+1, y-1)):
                blind_moves.append(Move_temp(x,y,x+1,y-1))
                top_right = True
            if(self.on_board(x-1, y+1)):
                blind_moves.append(Move_temp(x,y,x-1,y+1))
                bottom_left = False
            if(self.on_board(x+1, y+1)):
                blind_moves.append(Move_temp(x,y,x+1,y+1))
                bottom_right = True
            # TODO: fix this mess, currently checking all possible combinations. Can probably be done more optimally.
            if(top_left):
                if(top_right):
                    blind_moves.append(Move_temp(x,y,x-1,y-1,x+1,y-1))
                if(bottom_left):
                    blind_moves.append(Move_temp(x,y,x-1,y-1,x-1,y+1))
                if(bottom_right):
                    blind_moves.append(Move_temp(x,y,x-1,y-1,x+1,y+1))
            if(top_right):
                if(bottom_left):
                    blind_moves.append(Move_temp(x,y,x+1,y-1,x-1,y+1))
                if(bottom_right):
                    blind_moves.append(Move_temp(x,y,x+1,y-1,x+1,y+1))
            if(bottom_left and bottom_right):
                blind_moves.append(Move_temp(x,y,x-1,y+1,x+1,y+1))
        return blind_moves
    
    def clear(self, run_on_hardware):
        """
        Create empty the board
        """
        self.squares = {}
        self.king_squares = {}
        # self.last_result = [CheckersSquare.EMPTY] * 9

        for i in range(self.num_vertical*self.num_horizontal):
            self.squares[str(i)] = QuantumObject(str(i), CheckersSquare.EMPTY)
        self.board = QuantumWorld(
            list(self.squares.values()), compile_to_qubits=run_on_hardware
        )

    # def move(self, move: Move_temp, mark: CheckersSquare):
    #     # Moving one piece to an empty tile
    #     start_id = self.convert_xy_to_id(move.source_x, move.source_y)
    #     end_id = self.convert_xy_to_id(move.target1_x, move.target1_y)
    #     QuditFlip(5, 0, mark.value)(self.squares[str(end_id)])
    #     self.remove_piece((move.source_x, move.source_y), mark)
    #     # if we jump over a piece, we have to remove that piece as well
    #     if(abs(move.target1_y-move.source_y) > 1):
    #         opponent_mark = CheckersSquare.BLACK if mark == CheckersSquare.WHITE else CheckersSquare.WHITE
    #         removed_piece_id = self.convert_xy_to_id((int((move.target1_x+move.source_x)/2), int((move.target1_y+move.source_y)/2)))
    #         self.remove_piece(removed_piece_id, opponent_mark)

    def classic_move(self, move: Move_temp, mark: CheckersSquare):
        # Moving one piece to an empty tile
        start_id = self.convert_xy_to_id(move.source_x, move.source_y)
        end_id = self.convert_xy_to_id(move.target1_x, move.target1_y)
        CheckersClassicMove(5, 1)(self.squares[str(start_id)], self.squares[str(end_id)])
            
    # def classic_take_move(self, move: Move_temp, mark: CheckersSquare):
    #     # Moving one piece to an empty tile
    #     start_id = self.convert_xy_to_id(move.source_x, move.source_y)
    #     end_id = self.convert_xy_to_id(move.target1_x, move.target1_y)
    #     QuditFlip(5, 0, mark.value)(self.squares[str(end_id)])
    #     self.remove_piece((move.source_x, move.source_y), mark)
    #     # if we jump over a piece, we have to remove that piece as well 
    #     if(abs(move.target1_y-move.source_y) > 1):
    #         opponent_mark = CheckersSquare.BLACK if mark == CheckersSquare.WHITE else CheckersSquare.WHITE
    #         removed_piece_id = self.convert_xy_to_id((int((move.target1_x+move.source_x)/2), int((move.target1_y+move.source_y)/2)))
    #         self.remove_piece(removed_piece_id, opponent_mark)

    def split_move(self, move: Move_temp, mark: CheckersSquare):
        source_id = self.convert_xy_to_id(move.source_x, move.source_y)
        target1_id = self.convert_xy_to_id(move.target1_x, move.target1_y)
        if(move.target2_x == None or move.target2_y == None):
            raise ValueError("No second target given")
        target2_id = self.convert_xy_to_id(move.target2_x, move.target2_y)
            
        
        player_ids, opponent_ids = self.get_positions(mark)
        if target1_id not in player_ids+opponent_ids:
            # CheckersSplit(mark, self.rules)(self.squares[str(end_id1)], self.squares[str(end_id2)])
            CheckersSplit(mark, self.rules)(self.squares[source_id], self.squares[target1_id], self.squares[target2_id])
        else:
            CheckersSplit(mark, self.rules)(self.squares[source_id], self.squares[target2_id], self.squares[target1_id])
            


    def remove_piece(self, id: int or (int,int), mark: CheckersSquare):
        if(type(id) is tuple):
            id = self.convert_xy_to_id(id[0], id[1])
        # self.squares[id] = CheckersSquare.EMPTY
        # self.squares[id] = QuantumObject(id, CheckersSquare.EMPTY)
        # QuditFlip(3, 0, CheckersSquare.EMPTY.value)(self.squares[id])
        # QuditFlip(3, CheckersSquare.WHITE.value, CheckersSquare.EMPTY.value)(self.squares[id])
        # QuditFlip(3, CheckersSquare.BLACK.value, CheckersSquare.EMPTY.value)(self.squares[id])
        QuditFlip(5, mark.value, CheckersSquare.EMPTY.value)(self.squares[str(id)])
        return
        
    def convert_xy_to_id(self, x, y) -> int:
        """
        x = horizontal (columns)
        y = vertical (rows)
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
        
    # def do_move(self, move: Move_temp):
    #     self.board.move_piece(move.source_y, move.source_x, move.target1_y, move.target1_x)
    #     print(move.source_y, move.source_x, move.target1_y, move.target1_x)
        
class GameInterface:
    def __init__(self, game: Checkers) -> None:
        self.game = game
        self.player = CheckersSquare.WHITE
        self.quit = False

    def get_move(self):
        return input(f'Player {self.player.name} to move: ')

    def play(self):
        while(self.game.result() == CheckersResult.UNFINISHED and not self.quit):
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
            self.game.move(legal_moves[move-1], self.player)

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
                output += "----------"*self.game.num_horizontal + "\n"
        return output
    
    def get_legal_moves(self) -> list:
        return self.game.calculate_possible_moves(self.player)

    def print_legal_moves(self) -> list:
        """
        Prints all legal moves the current player can do
        """
        index = 1 # Start counter at 1
        legal_moves = self.get_legal_moves()
        for i in legal_moves:
            i.print_move(index)
            index += 1
        return legal_moves

def main():
    game = GameInterface(Checkers())
    game.play()

if __name__ == "__main__":
    main()