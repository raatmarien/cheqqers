from enums import (
    CheckersResult,
    CheckersRules,
    Colors
)
from typing import List

# GLOBAL GAME SETTINGS
forced_take = True

class Checkers:
    def __init__(self, num_rows = 4, num_cols = 5, num_rows_pieces = 1) -> None:
        self.board = Board(num_rows, num_cols, num_rows_pieces)
        pass

class Square:
    def __init__(self) -> None:
        self.occupant = None

class Board:
    def __init__(self, num_rows, num_cols, num_rows_pieces) -> None:
        self.num_rows = num_rows
        self.num_cols = num_cols

        # Initalize empty board
        # test = Square()
        self.board_matrix = [[Square() for x in range(self.num_cols)] for x in range(self.num_rows)]
        if(num_rows_pieces*2 >= num_rows):
            print(f"Too many rows ({num_rows_pieces}) filled with pieces. Decrease this number for this size of board. [{num_rows}]x[{num_cols}]")
            exit()
        
        # Initialize pieces on correct squares
        for y in range(num_rows_pieces):
            for x in range(self.num_cols):
                if(y%2==0 and x%2==0):
                    self.board_matrix[y][x].occupant = Piece(Colors.BLACK)
                    self.board_matrix[self.num_rows-1-y][x].occupant = Piece(Colors.WHITE)

                elif(y%2!=0 and x%2!=0):
                    self.board_matrix[y][x].occupant = Piece(Colors.BLACK)
                    self.board_matrix[self.num_rows-1-y][x].occupant = Piece(Colors.WHITE)
        self.board_matrix[1][3].occupant = Piece(Colors.WHITE)

        # Test to see if king works
        # self.board_matrix[4][4].occupant = Piece(Colors.BLACK, king=True)
        # self.board_matrix[4][5].occupant = Piece(Colors.WHITE)
        # self.board_matrix[3][3].occupant = Piece(Colors.WHITE)
        # self.board_matrix[3][5].occupant = Piece(Colors.WHITE)


    def move_piece(self, from_row, from_col, to_row, to_col):
        self.board_matrix[to_row][to_col] = self.board_matrix[from_row][from_col]
        self.remove_piece(from_row, from_col)
        pass

    def remove_piece(self, row, col):
        self.board_matrix[row][col].occupant = None
        pass

    def print_board(self):
        output = "\n"
        output += "   |"
        for i in range(self.num_cols):
            output += f" {i} |"
        output += "\n" + "---|"*(self.num_cols+1)
        output += "\n"
        for i in range(self.num_rows):
            output += f" {i} |"
            for j in range(self.num_cols):
                # print(f"{self.board_matrix[i][j].occupant.color}")
                if(self.board_matrix[i][j].occupant != None):
                    # print(self.board_matrix[i][j].occupant.color)
                    if(self.board_matrix[i][j].occupant.color == Colors.WHITE):
                        output += " w "
                    else:
                        output += " b "
                    # print(type(self.board_matrix[i][j].occupant))
                    # output += f" {self.board_matrix[i][j].occupant.color} " 
                else:
                    output += "   "
                output += "|"
            output += "\n" + "---|"*(self.num_cols+1)
            output += "\n"
        return output
    
    def calculate_all_possible_moves(self, color: Colors):
        legal_moves = []
        legal_take_moves = []
        # Loop over all squares, if there is a piece there check what moves are possible.
        # Moves will be
        for i in range(self.num_rows):
            for j in range(self.num_cols):
                if(self.board_matrix[i][j].occupant != None and self.board_matrix[i][j].occupant.color == color):
                    # temp1, temp2 = self.calculate_legal_move(i, j, color)
                    # legal_moves.extend(temp1)
                    # legal_take_moves.extend(temp2)
                    temp_legal_moves, temp_take_moves = self.possible_moves(i, j)
                    legal_moves.extend(temp_legal_moves)
                    legal_take_moves.extend(temp_take_moves)
        if(len(legal_take_moves) != 0 and forced_take):
            return legal_take_moves
        return legal_moves
    
    def on_board(self, row, col):
        """
        Checks if given location is on the board on not. 
        Returns true if [row][col] is on the board
        """
        if(row < 0 or row > self.num_rows-1 or col < 0 or col > self.num_cols-1):
            return False
        return True

    def possible_blind_moves(self, row, col):
        """
        Returns for one piece the possible moves that pieces can move in without checking if that moves is on the board or if there is a piece in the way
        Returns empty list if there is no piece
        """
        legal_moves = []
        if(self.board_matrix[row][col].occupant != None):
            if(self.board_matrix[row][col].occupant.king == False):
                if(self.board_matrix[row][col].occupant.color == Colors.WHITE): # White non king piece
                    legal_moves.append(Move(row,col,row-1,col-1))
                    legal_moves.append(Move(row,col,row-1,col+1)) 
                else: # Black non king piece
                    legal_moves.append(Move(row,col,row+1,col-1))
                    legal_moves.append(Move(row,col,row+1,col+1)) 
            else: # King piece can move in all directions
                legal_moves.append(Move(row,col,row-1,col-1))
                legal_moves.append(Move(row,col,row-1,col+1))
                legal_moves.append(Move(row,col,row+1,col-1))
                legal_moves.append(Move(row,col,row+1,col+1))  
        return legal_moves
    
    def possible_moves(self, row, col): # For one
        """
        For one piece, calculate all legal moves
        """
        legal_moves = self.possible_blind_moves(row, col)
        new_legal_moves = [] # all possible moves        
        take_moves = [] # Moves that take another piece
        for i in legal_moves:
            # For each move, check if the coordinates are on the board
            # If so, check if it is empty. If so, it is a legal move
            # If there is another piece, check if it is a different color than your own color
            # If so, check if one square further is empty
            # If so you can take a piece
            if(self.on_board(i.end_row, i.end_col)): # Coordinate is on board
                if(self.board_matrix[i.end_row][i.end_col].occupant == None): #Empty
                    # print(f"{i.end_row},{i.end_col}")
                    new_legal_moves.append(i)
                elif(self.board_matrix[i.end_row][i.end_col].occupant.color != self.board_matrix[i.start_row][i.start_col].occupant.color):
                    # Different color so we have to check if we can jump over
                    # Jump from column 2 over 3 to 4 we add 3+(3-2)
                    # Jump from column 3 over 2 to 1 we add 2+(2-3)
                    jump_row = i.end_row+(i.end_row-i.start_row)
                    jump_col = i.end_col+(i.end_col-i.start_col)
                    if(self.on_board(jump_row, jump_col) and self.board_matrix[jump_row][jump_col].occupant == None): # we can jump over. For readibility not in previous if statement
                        new_legal_moves.append(Move(i.start_row, i.start_col, jump_row, jump_col))
                        take_moves.append(Move(i.start_row, i.start_col, jump_row, jump_col))
        return new_legal_moves, take_moves

class Piece:
    def __init__(self, color = None, king = False) -> None:
        self.color = color
        self.king = king

class Move:
    def __init__(self, start_row, start_col, end_row, end_col) -> None:
        self.start_row = start_row
        self.start_col = start_col
        self.end_row = end_row
        self.end_col = end_col

class GameInterface:
    def __init__(self, game: Checkers) -> None:
        self.game = game

    def play(self):
        pass

    def print_board(self):
        print(self.game.board.print_board())

    def print_legal_moves(self):
        print("Legal moves:")
        for i in self.game.board.calculate_all_possible_moves(Colors.BLACK):
            print(f"[{i.start_row}][{i.start_col}] to [{i.end_row}][{i.end_col}] AND ", end="")
        print("")


def main():
    game = GameInterface(Checkers())
    game.print_board()
    game.print_legal_moves()

if __name__ == "__main__":
    main()