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

class Move_id:
    """
    Logic for doing moves using ids
    """
    def __init__(self, source_id: int, target1_id: int, target2_id: int = None) -> None:
        self.source_id = source_id
        self.target1_id = target1_id
        self.target2_id = target2_id
    
    def print_move(self, index = -1) -> None:
        output = ""
        if(index != -1):
            output = str(index) + ": "
        output += f"[{self.source_id}] to [{self.target1_id}]"
        if(self.target2_id != None):
            output += f" and [{self.target2_id}]"
        print(output)

class Move_temp:
    def __init__(self, source_x: int, source_y: int, target1_x: int, target1_y: int, target2_x: int = None, target2_y: int = None) -> None:
        self.source_x = source_x
        self.source_y = source_y
        self.target1_x = target1_x
        self.target1_y = target1_y
        self.target2_x = target2_x
        self.target2_y = target2_y

    def print_move(self, index = -1) -> None:
        output = ""
        if(index != -1):
            output = str(index) + ": "
        output += f"[{self.source_id}] to [{self.target1_id}]"
        if(self.target2_id != None):
            output += f" and [{self.target2_id}]"
        print(output)

class Piece():
    def __init__(self, id, color: CheckersSquare, king=False) -> None:
        self.id = id
        self.color = color
        self.king = False

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
                if(y%2==0 and x%2==1):
                    QuditFlip(5, 0, CheckersSquare.BLACK.value)(self.squares[str(self.convert_xy_to_id(x,y))])
                    QuditFlip(5, 0, CheckersSquare.WHITE.value)(self.squares[str(self.convert_xy_to_id(x,self.num_vertical-1-y))])
                elif(y%2!=0 and x%2!=1):
                    QuditFlip(5, 0, CheckersSquare.BLACK.value)(self.squares[str(self.convert_xy_to_id(x,y))])
                    QuditFlip(5, 0, CheckersSquare.WHITE.value)(self.squares[str(self.convert_xy_to_id(x,self.num_vertical-1-y))])
    
    def measure(self) -> None:
        """Measures all squares on the Checkers board.

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

    def get_advanced_positions(self, player):
        """
        Returns dicitionary of players ids and opponent ids Piece class, 
        player_ids and opponent_ids contain the ids
        """
        results = self.board.peek(count=100)
        hist = _histogram(self.num_vertical, self.num_horizontal,
            [
                [CheckersSquare.from_result(square) for square in result]
                for result in results
            ]
        )
        white_pieces = {}
        black_pieces = {}
        for id in range(self.num_vertical*self.num_horizontal):
            for mark in (CheckersSquare.BLACK, CheckersSquare.WHITE, CheckersSquare.WHITE_KING, CheckersSquare.BLACK_KING):
                if(hist[id][mark] != 0): # For the current player (white or black). Check both for entanglement (if that will be implemented)
                    if(mark == CheckersSquare.WHITE):
                        white_pieces[str(id)] = Piece(id, mark, False)
                    elif(mark == CheckersSquare.WHITE_KING):
                        white_pieces[str(id)] = Piece(id, mark, True)
                    if(mark == CheckersSquare.BLACK):
                        black_pieces[str(id)] = Piece(id, mark, False)
                    elif(mark == CheckersSquare.WHITE_KING):
                        black_pieces[str(id)] = Piece(id, mark, True)
        if(player == CheckersSquare.WHITE):
            return white_pieces, black_pieces
        else:
            return black_pieces, white_pieces

    def get_positions(self, player):
        """
        Returns player_ids: [list, list], opponent_ids: [list, list]
        player_ids and opponent_ids contain the ids of the current player and other player
        Returns 2 2d list that contain normal ids and king ids
        """
        results = self.board.peek(count=1)
        hist = _histogram(self.num_vertical, self.num_horizontal,
            [
                [CheckersSquare.from_result(square) for square in result]
                for result in results
            ]
        )
        white_ids = []
        white_king_ids = []
        black_ids = []
        black_king_ids = []
        for id in range(self.num_vertical*self.num_horizontal):
            for mark in (CheckersSquare.BLACK, CheckersSquare.WHITE, CheckersSquare.WHITE_KING, CheckersSquare.BLACK_KING):
                if(hist[id][mark] != 0): # For the current player (white or black). Check both for entanglement (if that will be implemented)
                    if(mark == CheckersSquare.WHITE):
                        white_ids.append(id)
                    if(mark == CheckersSquare.WHITE_KING):
                        white_king_ids.append(id)
                    if(mark == CheckersSquare.BLACK):
                        black_ids.append(id)
                    if(mark == CheckersSquare.BLACK_KING):
                        black_king_ids.append(id)
        if(player == CheckersSquare.WHITE):
            return [white_ids, white_king_ids], [black_ids, black_king_ids]
        else:
            return [black_ids, black_king_ids], [white_ids, white_king_ids]

    def calculate_possible_moves(self, player: CheckersSquare) -> list:
        """
        Calculates all possible moves for 'player'
        Loop over all pieces, if there is a chance that there is a piece in the right color calculate legal moves for that piece
        """
        king_player = CheckersSquare.WHITE_KING if player == CheckersSquare.WHITE else CheckersSquare.BLACK_KING
        legal_moves = {} # All legal moves
        legal_take_moves = {} # Only the moves which can take another player
        player_ids, opponent_ids = self.get_positions(player)
        blind_moves = []
        for id in player_ids[0]: #all normal ids
            blind_moves += self.calculate_blind_moves(id, player)
        for id in player_ids[1]:
            blind_moves += self.calculate_blind_moves(id, king_player)
        
        # Append all ids to one list'
        player_ids = player_ids[0] + player_ids[1]
        opponent_ids = opponent_ids[0] + opponent_ids[1]

        for move in blind_moves:
            print(move)
            print(legal_moves)
            # For each move check if there is a piece in the position
            # If it is empty it is a legal move
            # If there is another piece, check if it is a different color than your own color
            # If so, check if one square further is empty
            # If so you can take a piece
            source_id = self.convert_xy_to_id(move.source_x, move.source_y)
            target1_id = self.convert_xy_to_id(move.target1_x, move.target1_y)
            target2_id = None
            if(move.target2_x != None):
                target2_id = self.convert_xy_to_id(move.target2_x, move.target2_y)

            # CLASSICAL MOVE    
            if(target1_id not in player_ids and target1_id not in opponent_ids and target2_id == None): # it is an empty square, so it is possible move there
                # legal_moves.append(Move_id(source_id, target1_id))
                if(source_id not in legal_moves):
                   legal_moves[source_id] = [target1_id]
                elif(target1_id not in legal_moves[source_id]): # to prevent duplicates
                   legal_moves[source_id].append(target1_id)
            
            # QUANTUM SPLIT MOVE
            elif(target1_id not in player_ids and target1_id not in opponent_ids and target2_id not in player_ids and target2_id not in opponent_ids):
                # jump1_y = move.target1_y+(move.target1_y-move.source_y)
                # jump1_x = move.target1_x+(move.target1_x-move.source_x)
                # jump2_y = move.target1_y+(move.target2_y-move.source_y)
                # jump2_x = move.target1_x+(move.target2_x-move.source_x)
                # jump1_id = self.convert_xy_to_id(jump1_x, jump1_y)
                # jump2_id = self.convert_xy_to_id(jump2_x, jump2_y)
                # legal_moves.append(Move_id(source_id, target1_id, target2_id))
                if(source_id not in legal_moves):
                   legal_moves[source_id] = [target1_id, target2_id]
                else:
                    if(target1_id not in legal_moves[source_id]):
                        legal_moves[source_id].append(target1_id)
                    if(target2_id not in legal_moves[source_id]):
                        legal_moves[source_id].append(target2_id)


            # CLASSICAL TAKE MOVE
            elif(target1_id in opponent_ids and target2_id == None): # There is an opponent in this coordinate, check if we can jump over them
                jump_y = move.target1_y+(move.target1_y-move.source_y)
                jump_x = move.target1_x+(move.target1_x-move.source_x)
                jump_id = self.convert_xy_to_id(jump_x, jump_y)
                if(self.on_board(jump_x, jump_y) and jump_id not in (player_ids+opponent_ids)): # we can jump over if the coordinates are on the board and the piece is empty
                    # legal_moves.append(Move_id(source_id, jump_id))
                    if(source_id not in legal_moves):
                        legal_moves[source_id] = [jump_id]
                    else:
                        legal_moves[source_id].append(jump_id)
                    legal_take_moves.append(Move_id(source_id, jump_id))
                    if(source_id not in legal_take_moves):
                        legal_take_moves[source_id] = [jump_id]
                    else:
                        legal_take_moves[source_id].append(jump_id)
            
        if(len(legal_take_moves) != 0 and _forced_take): # If we can take a piece and taking a piece is forced, return only the moves that can take a piece
            return legal_take_moves
        return legal_moves
    
    def calculate_blind_moves(self, id: int, player):
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
                blind_moves.append(Move_temp(x,y,x-1,y+1,x+1,y+1))
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

    def move(self, move: Move_id, player):
        if(move.target2_id == None):
            self.classic_move(move, player)
            return
        # if not classical move it is a split move
        self.split_move(move, player)

    def get_board(self) -> str:
        """Returns the Checkers board in ASCII form. Also returns dictionary with id as key.
        Function take from quantum tiq taq toe"""
        
        results = self.board.peek(count=100)
        hist = _histogram(self.num_vertical, self.num_horizontal,
            [
                [CheckersSquare.from_result(square) for square in result]
                for result in results
            ]
        )
        output = "\n"
        board_list = {}
        for y in range(self.num_vertical):
            for mark in CheckersSquare:
                output += " "
                for x in range(self.num_horizontal):
                    idx = self.convert_xy_to_id(x,y)  
                    output += f" {_MARK_SYMBOLS[mark]} {hist[idx][mark]:3}"
                    if(hist[idx][mark] > 0):
                        board_list[str(idx)] = hist[idx][mark]
                    if x != self.num_horizontal-1:
                        output += " |"
                output += "\n"
            if y != self.num_vertical-1:
                output += "--------"*self.num_horizontal + "\n"
        return output, board_list
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

    def king(self, id: int, mark):
        if(mark == CheckersSquare.WHITE):
            QuditFlip(5, mark.value, CheckersSquare.WHITE_KING.value)(self.squares[str(id)])
        elif(mark == CheckersSquare.BLACK):
            QuditFlip(5, mark.value, CheckersSquare.BLACK_KING.value)(self.squares[str(id)])
        return

    def is_adjacent(self, id1, id2):
        """
        Checks if id1 is adjacent to id2 (one of the eight squares surrounding it)
        Returns true if id1 and id2 are adjacent
        Returns false and the jumped over id if id1 and id2 are not adjacent
        """
        if(id1 < 0 or id1 > self.num_horizontal*self.num_vertical-1 or id2 < 0 or id2 > self.num_horizontal*self.num_vertical-1):
            return False
        x1, y1 = self.convert_id_to_xy(id1)
        x2, y2 = self.convert_id_to_xy(id2)
        if(abs(x1-x2) > 1 or abs(y1-y2) > 1):
            if(abs(x1-x2) == 2 and abs(y1-y2) == 2):
                return False, self.convert_xy_to_id(max(x1, x2)-1, max(y1, y2)-1)
            return False, None
        return True, None

    def can_take_piece(self, id):
        """
        For a specific ID, checks if it can take pieces. Used for checking if you can take another piece after taking a piece
        """
        jump_y = move.target1_y+(move.target1_y-move.source_y)
        jump_x = move.target1_x+(move.target1_x-move.source_x)
        jump_id = self.convert_xy_to_id(jump_x, jump_y)
        if(self.on_board(jump_x, jump_y) and jump_id not in (player_ids+opponent_ids)): # we can jump over if the coordinates are on the board and the piece is empty
            # legal_moves.append(Move_temp(move.source_x, move.source_y, jump_x, jump_y))
            legal_moves.append(Move_id(source_id, jump_id))
            # legal_take_moves.append(Move_temp(move.source_x, move.source_y, jump_x, jump_y))
            legal_take_moves.append(Move_id(source_id, jump_id))

    def classic_move(self, move: Move_id, mark: CheckersSquare):
        """
        This function moves a piece from one square to another. If it jumps over a piece it also removes this piece.
        It also measures the piece itself or the piece it is taking if it is relevant.
        """
        is_adjacent, jumped_id = self.is_adjacent(move.source_id, move.target1_id)
        if(not is_adjacent): # if ids are not adjacent we jumped over a piece and need to remove it
            # First check if the piece we are using is actually there
            self.board.pop(objects=[self.squares[str(move.source_id)]])
            peek = (self.board.peek(objects=[self.squares[str(move.source_id)]]))
            if(peek[0][0] == CheckersSquare.EMPTY): # If the piece is not there, turn is wasted
                return

            self.board.pop(objects=[self.squares[str(jumped_id)]])
            peek = (self.board.peek(objects=[self.squares[str(jumped_id)]])) # peek returns double list of all object peeked. For one object that looks like [[<CheckersSquare.WHITE: 1>]]
            if(peek[0][0] != CheckersSquare.EMPTY): # if it is not empty we can take the piece
                CheckersClassicMove(5, 1)(self.squares[str(move.source_id)], self.squares[str(move.target1_id)])
                self.remove_piece(jumped_id, peek[0][0])
        else: # not a jump
            CheckersClassicMove(5, 1)(self.squares[str(move.source_id)], self.squares[str(move.target1_id)])
        if(move.target1_id <= self.num_vertical-1 or move.target1_id >= self.num_horizontal*self.num_vertical-self.num_vertical):
                self.king(move.target1_id, mark)
        
        # Check if you can take another piece

            
    def split_move(self, move: Move_id, mark: CheckersSquare):
        # source_id = self.convert_xy_to_id(move.source_x, move.source_y)
        # target1_id = self.convert_xy_to_id(move.target1_x, move.target1_y)
        if(move.target2_id == None):
            raise ValueError("No second target given")
        # target2_id = self.convert_xy_to_id(move.target2_x, move.target2_y)
            
        
        player_ids, opponent_ids = self.get_positions(mark)
        if move.target1_id not in player_ids+opponent_ids:
            # CheckersSplit(mark, self.rules)(self.squares[str(end_id1)], self.squares[str(end_id2)])
            CheckersSplit(mark, self.rules)(self.squares[str(move.source_id)], self.squares[str(move.target1_id)], self.squares[str(move.target2_id)])
        else:
            CheckersSplit(mark, self.rules)(self.squares[str(move.source_id)], self.squares[str(move.target2_id)], self.squares[str(move.target1_id)])
        if(move.target1_id <= self.num_vertical-1 or move.target1_id >= self.num_horizontal*self.num_vertical-self.num_vertical):
            self.king(move.target1_id, mark)
            self.king(move.target2_id, mark)

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
        



#TODO: Toevoegen dat je meerdere stukken achter kan slaan
#TODO: fixen dat stuk niet geslagen worden nadat het gelezen wordt.
#TODO: if piece is in superposition behind another piece, add the possibilty to take the piece
#TODO: Fix dat king pieces niet zichzelf in superpositie kunnen zetten
#TODO: entanglement messes with everything -> 3, 3, 4, 4, 4
#TODO: Push this