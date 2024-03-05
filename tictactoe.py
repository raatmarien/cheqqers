# https://www.c-sharpcorner.com/UploadFile/75a48f/tic-tac-toe-game-in-python/
import os
import time
from mcts import MCTS


# Win Flags
Win = 1
Draw = -1
Running = 0
Stop = 1


class tictactoe:
    def __init__(self) -> None:
                
        self.board = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
        self.legal_moves = self.calculate_possible_moves()
        self.player = 1
        self.Game = Running
        self.Mark = 'X'
        self.args = {
            'C': 1.41, # sqrt of 2
            'num_searches': 10 # Budget per rollout
        }
        self.black_player = MCTS(self, self.args)
        


    def DrawBoard(self):
        print(" %c | %c | %c " % (self.board[1], self.board[2], self.board[3]))
        print("___|___|___")
        print(" %c | %c | %c " % (self.board[4], self.board[5], self.board[6]))
        print("___|___|___")
        print(" %c | %c | %c " % (self.board[7], self.board[8], self.board[9]))
        print(" | | ")


    def CheckPosition(self, x):
        if self.board[x] == ' ':
            return True
        else:
            return False


    def CheckWin(self):
        if self.board[1] == self.board[2] and self.board[2] == self.board[3] and self.board[1] != ' ':
            self.Game = Win
        elif self.board[4] == self.board[5] and self.board[5] == self.board[6] and self.board[4] != ' ':
            self.Game = Win
        elif self.board[7] == self.board[8] and self.board[8] == self.board[9] and self.board[7] != ' ':
            self.Game = Win
        elif self.board[1] == self.board[4] and self.board[4] == self.board[7] and self.board[1] != ' ':
            self.Game = Win
        elif self.board[2] == self.board[5] and self.board[5] == self.board[8] and self.board[2] != ' ':
            self.Game = Win
        elif self.board[3] == self.board[6] and self.board[6] == self.board[9] and self.board[3] != ' ':
            self.Game = Win
        elif self.board[1] == self.board[5] and self.board[5] == self.board[9] and self.board[5] != ' ':
            self.Game = Win
        elif self.board[3] == self.board[5] and self.board[5] == self.board[7] and self.board[5] != ' ':
            self.Game = Win
        elif self.board[1] != ' ' and self.board[2] != ' ' and self.board[3] != ' ' and \
                self.board[4] != ' ' and self.board[5] != ' ' and self.board[6] != ' ' and \
                self.board[7] != ' ' and self.board[8] != ' ' and self.board[9] != ' ':
            self.Game = Draw
        else:
            self.Game = Running

    def calculate_possible_moves(self):
        possible_moves = []
        for i in range(9):
            if(self.board[i+1] == ' '):
                possible_moves.append(i+1)
        return possible_moves


    def run(self):
        print("Tic-Tac-Toe Game Designed By Sourabh Somani")
        print("Player 1 [X] --- Player 2 [O]\n")
        print()
        print()
        print("Please Wait...")

        while self.Game == Running:
            print(self.calculate_possible_moves())
            # os.system('cls')
            self.DrawBoard()

            if self.player % 2 != 0:
                print("Player 1's chance")
                Mark = 'X'
                choice = int(input("Enter the position between [1-9] where you want to mark: "))
            else:
                print("Player 2's chance")
                Mark = 'O'
                mc = MCTS(self, self.args)
                choice = mc.search()

            
            if self.CheckPosition(choice):
                self.board[choice] = Mark
                self.player += 1
                self.CheckWin()

            os.system('cls')
            self.DrawBoard()

            if self.Game == Draw:
                print("Game Draw")
            elif self.Game == Win:
                self.player -= 1
                if self.player % 2 != 0:
                    print("Player 1 Won")
                else:
                    print("Player 2 Won")

gm = tictactoe()
gm.run()