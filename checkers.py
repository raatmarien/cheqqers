import sys
from typing import Dict, List, TextIO
from enums import (
    CheckersResult,
    CheckersRules
)
# Implemented by Luuk van den Nouweland, university of Leiden

class Checkers:
    def __init__(self, num_rows = 5, num_cols = 5):
        self.num_rows = num_rows
        self.num_cols = num_cols
        self.board = [[None for x in range(self.num_cols)] for x in range(self.num_rows)]
        for col in range(num_cols):
             if (col % 2) == 0:
                  self.board[0][col] = Piece("b")
                  self.board[num_rows-1][col] = Piece("w")


    def possibleMoves(self):
        print("test")

class Piece:
	def __init__(self, color, king = False):
		self.color = color
		self.king = king

        


class GameInterface:
    """
    A class that provides a command-line interface to play Quantum checkers.

    Initialize by providing an instance of a checkers game, then call play()
    to run the game.

    Args:
        game: A checkers instance for the game interface to wrap.
        file:  Optional IOBase file object to write output to.from typing import Dict, List, TextIO
    """

    def __init__(self, game: Checkers, file: TextIO = sys.stdout):
        self.game = game
        self.file = file
        self.player = "X"
        self.player_quit = False

    def get_move(self) -> str:
        """
        Gets and returns the plapeekyer's move.

        Basically a wrapper around input to facilitate testing.
        """
        return input(f'Player {self.player} to move ("help" for help): ')

    def player_move(self) -> None:
        """2 the player's move and takes the appropriate action.

        A move can be a one or two letter string within the set [abcdefghi],
        in which case this function hands the move off to the TicTacToe instance,
        or one of the GameMoves enums (GameMoves.MAP, GameMoves.EXIT, GameMoves.HELP),
        which prevent the game loop from alternating to the next player.
        """
        move = self.get_move()

        
    def print_welcome(self) -> str:
        """
        Prints the welcome message for the game interface.
        """
        message = """
        Welcome to checkers!
        Here is the board:
        """
        return message

    def play(self) -> None:
        """
        Run the game loop, requesting player moves, alternating players, until
        the checkers instance reports that the game ends with a winner or a tie
        or one of the players has quit.
        """
        print(self.print_welcome(), file=self.file)
        # while self.game.result() == TicTacResult.UNFINISHED and not self.player_quit:
        #     try:
        #         self.player_move()
        #     except ValueError as e:
        #         print(e)
        # while self.game.results() == CheckersResult.UNFINISHED and not self.player_quit:
            
        self.print_board()
        # print(self.game.result(), file=self.file)

    def print_board(self) -> str:
        """Returns the TicTacToe board in ASCII form."""
        # results = self.game.board.peek(count=100)
        # hist = _histogram(
        #     [
        #         [TicTacSquare.from_result(square) for square in result]
        #         for result in results
        #     ]
        # )
        output = "\n"
        # for k in range(self.game.num_cols):
            # output += str(k)
        output += "\n"
        for i in range(self.game.num_rows):
            output += str(i) + " | "
            for j in range(self.game.num_cols):
                # output += str(self.game.board[i][j]) + " | "
                if(isinstance(self.game.board[i][j], Piece)):
                     output += self.game.board[i][j].color + " | "
                else:
                     print(type(self.game.board[i][j]))
                     output += "  | "
            output += "\n"
            output += "----"*(self.game.num_cols+1)
            output += "\n"
        print(output)
                
        # output = "\n"
        # for row in range(3):
        #     for mark in TicTacSquare:
        #         output += " "
        #         for col in range(3):
        #             idx = row * 3 + col
        #             output += f" {_MARK_SYMBOLS[mark]} {hist[idx][mark]:3}"
        #             if col != 2:
        #                 output += " |"
        #         output += "\n"
        #     if idx in TicTacToe[2, 5, 8] and row != 2:
        #         output += "--------------------------\n"
        # return output

def main():
    game = GameInterface(Checkers())
    game.play()


if __name__ == "__main__":
    main()