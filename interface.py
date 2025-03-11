from quantum_checkers import Checkers, Move_id
from players import human_player

import numpy as np
import pygame
import random
from time import sleep
from enums import CheckersResult, CheckersPlayer, MoveType, CheckersRules
import os
from pygame import gfxdraw
import time

# GUI
import pygame
import sys
from mcts import MCTS
from copy import deepcopy

# https://quantumchess.net/play/
# https://entanglement-chess.netlify.app/qm
# https://github.com/quantumlib/unitary/blob/main/docs/unitary/getting_started.ipynb

# GLOBAL GUI SETTINGS
# Constants
WIDTH, HEIGHT = 600, 600
SQUARE_W, SQUARE_H = 60, 60
FPS = 60
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREY = (51, 51, 51)
DARK_BROWN = (145, 94, 42)
LIGHT_BROWN = (231, 203, 175)
YELLOW = (230, 225, 7)
L_RED = (221, 0, 0)
RED = (180, 2, 1)
BLUE = (0, 0, 255)


class GameInterface:
    def __init__(
        self,
        game: Checkers,
        white_player,
        black_player,
        args_1,
        args_2,
        GUI=False,
        white_mcts=False,
        black_mcts=False,
        print=True,
        attempt=99999999,
    ) -> None:
        self.game = game
        self.scrshot_counter = 0
        self.quit = False
        self.highlighted_squares = []
        self.selected_id = (
            None  # Square select by player, used for highlighting and moving pieces
        )
        self.move_locations = (
            set()
        )  # If a piece is selected, this variable will store the locations the piece can move to
        open("./log.txt", "w").close()
        self.attempt = attempt
        self.file_name = f"./attempts/log_{attempt}.txt"
        # open(self.file_name, 'w').close()
        self.GUI = GUI
        if self.GUI:
            self.init_gui()
        self.draw_chance = True
        self.draw_numbers = False
        self.white_player = white_player
        self.print = print
        self.args1 = args_1
        self.args2 = args_2
        self.black_player = black_player
        self.white_mcts = white_mcts
        self.black_mcts = black_mcts
        # self.black_player = MCTS(self.game, self.args)

    def init_gui(self):
        pygame.init()
        # Initialize the screen
        infoObject = pygame.display.Info()
        width = self.game.num_horizontal * SQUARE_W
        height = self.game.num_vertical * SQUARE_H
        self.screen = pygame.display.set_mode((width, height))
        pygame.display.set_caption("Quantum Checkers")
        self.load_img()
        # Clock to control the frame rate
        clock = pygame.time.Clock()

    def load_img(self):
        CROWN_IMG = pygame.image.load(
            os.path.join(os.path.dirname(__file__), "crown.png")
        )
        self.CROWN_IMG = pygame.transform.smoothscale(
            CROWN_IMG,
            (
                int(SQUARE_W * 0.65),
                int(
                    (CROWN_IMG.get_height() / (CROWN_IMG.get_width() / SQUARE_W)) * 0.65
                ),
            ),
        )
        RED_IMG = pygame.image.load(
            os.path.join(os.path.dirname(__file__), "images/Damsteen-rood.png")
        )
        self.RED_IMG = pygame.transform.smoothscale(
            RED_IMG,
            (
                int(SQUARE_W),
                int((RED_IMG.get_height() / (RED_IMG.get_width() / SQUARE_W))),
            ),
        )
        RED_SELECTED_IMG = pygame.image.load(
            os.path.join(
                os.path.dirname(__file__), "images/Damsteen-rood-geselecteerd.png"
            )
        )
        self.RED_SELECTED_IMG = pygame.transform.smoothscale(
            RED_SELECTED_IMG,
            (
                int(SQUARE_W),
                int(
                    (
                        RED_SELECTED_IMG.get_height()
                        / (RED_SELECTED_IMG.get_width() / SQUARE_W)
                    )
                ),
            ),
        )
        # self.RED_SELECTED_IMG = self.RED_IMG

        BLACK_IMG = pygame.image.load(
            os.path.join(os.path.dirname(__file__), "images/Damsteen-zwart.png")
        )
        self.BLACK_IMG = pygame.transform.smoothscale(
            BLACK_IMG,
            (
                int(SQUARE_W),
                int((BLACK_IMG.get_height() / (BLACK_IMG.get_width() / SQUARE_W))),
            ),
        )
        BLACK_SELECTED_IMG = pygame.image.load(
            os.path.join(
                os.path.dirname(__file__), "images/Damsteen-zwart-geselecteerd.png"
            )
        )
        self.BLACK_SELECTED_IMG = pygame.transform.smoothscale(
            BLACK_SELECTED_IMG,
            (
                int(SQUARE_W),
                int(
                    (
                        BLACK_SELECTED_IMG.get_height()
                        / (BLACK_SELECTED_IMG.get_width() / SQUARE_W)
                    )
                ),
            ),
        )
        # self.BLACK_SELECTED_IMG = self.BLACK_IMG

        BLUE_IMG = pygame.image.load(
            os.path.join(os.path.dirname(__file__), "images/Damsteen-geest.png")
        )
        self.BLUE_IMG = pygame.transform.smoothscale(
            BLUE_IMG,
            (
                int(SQUARE_W),
                int((BLUE_IMG.get_height() / (BLUE_IMG.get_width() / SQUARE_W))),
            ),
        )

    def highlight_squares(self, moves_list: list):
        self.highlighted_squares = []
        self.move_locations.clear()
        movable_pieces = []
        for move in moves_list:
            movable_pieces.append(move.source_id)
            if move.source_id == self.selected_id:
                self.move_locations.add(move.target1_id)
        if len(self.move_locations) > 0:
            self.highlighted_squares.append(self.selected_id)
            for i in self.move_locations:
                self.highlighted_squares.append(i)
            return
        # no piece selected that is able to move TODO
        for idx in movable_pieces:
            self.highlighted_squares.append(idx)

    def write_attempt(self, attempt_str):
        temp = open(self.file_name, "a")
        temp.write(attempt_str)
        temp.close()

    def write_to_log(self, move, counter, moves):
        self.log = open("./log.txt", "a")
        self.log.write("#########################\n")
        self.log.write(str(counter))
        st = ": "
        # st = move.print_move()
        self.log.write(st)
        self.log.write("\n")
        self.log.write(str(moves))
        self.log.write("\n\n")
        # self.log.write(self.game.get_board())
        self.log.close()

    def redraw_board(self):
        self.highlight_squares(self.game.legal_moves)
        self.draw_board()
        pygame.display.flip()  # needs to be called outside draw function

    def play(self):
        counter = 0
        moves = []
        mcts_moves = []
        prev_take = False  # variable to check if a piece has been taken before
        #self.draw_board()
        # pygame.image.save(self.screen, f"screenshots/screenshot{self.scrshot_counter}.jpeg")
        self.scrshot_counter += 1
        # for i in [3, 2, 2, 1, 1, 2, 2, 1]:
        #     # legal_moves = self.get_legal_moves()
        #     self.game.player_move(self.game.legal_moves[i-1], self.game.player)
        #     self.print_board(False)
        times = []
        while self.game.status == CheckersResult.UNFINISHED and not self.quit:
            prev_take = False  # Always reset

            counter += 1
            if self.game.player == CheckersPlayer.WHITE:
                if not self.white_mcts:
                    move = self.white_player.select_move(
                        self.game, self.game.legal_moves
                    )
                else:
                    # Calculate time for function call
                    self.white_player = MCTS(self.game, self.args1)
                    move = self.white_player.search()
                    mcts_moves.append(move)
            else:
                if not self.black_mcts:
                    move = self.black_player.select_move(
                        self.game, self.game.legal_moves
                    )
                else:
                    self.black_player = MCTS(self.game, self.args2)
                    move = self.black_player.search()
                    mcts_moves.append(move)

            moves.append(move)
            self.game.player_move(move, self.game.player)

        return (self.game.status, moves)

    def get_positions(self, player) -> [[list, list], [list, list]]:
        """
        Gets the positions of all the pieces from the game.
        Returns two lists of lists of the player positions and opponent positions separated by the normal pieces and king pieces
        """
        return self.game.get_positions(player)


    def do_game_move(self, move: Move_id):
        """
        Do a game move and reset values for GUI
        """
        self.game.player_move(move, self.game.player)
        self.selected_id = (
            -1
        )  # value used in highlight function to check if we need to return
        self.move_locations.clear()
        self.highlighted_squares = []


    def print_board(self, simulated: bool) -> str:
        # str_board = self.game.get_sim_board()
        if not simulated:
            str_board = self.game.get_board()
        else:
            str_board = self.game.get_sim_board()
        print(str_board)
        return str_board

    def get_legal_moves(self) -> list:
        moves = self.game.calculate_possible_moves(self.game.player)
        return moves

    def print_legal_moves(self, legal_moves=None) -> list:
        """
        Prints all legal moves the current player can do
        """
        index = 1  # Start counter at 1
        if legal_moves == None:
            legal_moves = self.get_legal_moves()
        for move in legal_moves:
            move.print_move(index=index)
            index += 1
        # print(legal_moves)
        # for key, value in legal_moves.items():
        #     if(type(value) == list and len(value) > 1):
        #         print(f"{str(index)}: [{key}] to [{value[0]}]")
        #         legal_moves_list.append(Move_id(source_id=key, target1_id=value[0]))
        #         index += 1
        #         print(f"{str(index)}: [{key}] to [{value[1]}]")
        #         legal_moves_list.append(Move_id(source_id=key, target1_id=value[1]))
        #         index+=1
        #         print(f"{str(index)}: [{key}] to [{value[0]}] and [{value[1]}]")
        #         legal_moves_list.append(Move_id(source_id=key, target1_id=value[0], target2_id=value[1]))
        #     else:
        #         print(f"{str(index)}: [{key}] to [{value[0]}]")
        #         legal_moves_list.append(Move_id(source_id=key, target1_id=value[0]))
        #     index +=1
        return legal_moves
