GUI = False

from quantum_checkers import Checkers
import pygame
from enums import (
    CheckersResult,
    CheckersRules,
    CheckersSquare
)
import os
from pygame import gfxdraw

# GUI
import pygame
import sys
# https://quantumchess.net/play/
# https://entanglement-chess.netlify.app/qm
# https://github.com/quantumlib/unitary/blob/main/docs/unitary/getting_started.ipynb

# GLOBAL GUI SETTINGS
# Constants
GUI = False
WIDTH, HEIGHT = 600, 600
SQUARE_W, SQUARE_H = 60, 60
FPS = 60
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
DARK_BROWN = (33, 22, 12)
LIGHT_BROWN = (217, 167, 121)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
CROWN_IMG = pygame.image.load(os.path.join(os.path.dirname(__file__), "crown.png"))
CROWN_IMG = pygame.transform.scale(CROWN_IMG, (int(SQUARE_W*0.65), int((CROWN_IMG.get_height()/(CROWN_IMG.get_width()/SQUARE_W))*0.65)))


class GameInterface:
    def __init__(self, game: Checkers) -> None:
        self.game = game
        self.player = CheckersSquare.WHITE
        self.quit = False
        self.highlighted_squares = []
        self.status = CheckersResult.UNFINISHED

    def get_move(self):
        return input(f'Player {self.player.name} to move: ')

    def play(self):
        if(GUI):
            pygame.init()
            # Initialize the screen
            infoObject = pygame.display.Info()
            width = self.game.num_horizontal*SQUARE_W
            height = self.game.num_vertical*SQUARE_H
            self.screen = pygame.display.set_mode((width, height))
            pygame.display.set_caption("Quantum Checkers")
        
        # self.print_board()
        # Clock to control the frame rate
        clock = pygame.time.Clock()
        while(self.status == CheckersResult.UNFINISHED and not self.quit):
            if(GUI):
                event = pygame.event.wait()
                # for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit(0)
                if event.type == pygame.MOUSEBUTTONDOWN:
                    down_pos = event.pos
                    # self.handle_click(event.pos)
                if event.type == pygame.MOUSEBUTTONUP:
                    # Detect swipes for quantum moves
                    self.handle_click(down_pos, event.pos)
                # self.print_board()
                self.draw_board()
                pygame.display.flip() # needs to be called outside draw function
            else:
                legal_moves = self.get_legal_moves()
                if(len(legal_moves) == 0):
                    self.status = CheckersResult.DRAW
                    continue
                self.print_board()
                self.print_legal_moves(legal_moves)
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

    def draw_circle(self, color, x, y, radius, king = False):
        gfxdraw.aacircle(self.screen, x+SQUARE_W//2, y+SQUARE_H//2, radius, color)
        gfxdraw.filled_circle(self.screen, x+SQUARE_W//2, y+SQUARE_H//2, radius, color)
        if(king):
            c = CROWN_IMG.get_rect(center=(x+SQUARE_W//2, y+SQUARE_H//2)) # centers the image
            self.screen.blit(CROWN_IMG, c)

    def draw_board(self):
        _, pieces = self.get_board()
        self.screen.fill(WHITE)
        # self.game.get_positions(CheckersSquare.WHITE)
        white_pieces, black_pieces = self.game.get_advanced_positions(CheckersSquare.WHITE)
        for id in range(self.game.num_horizontal*self.game.num_vertical):
            x, y = self.game.convert_id_to_xy(id)
            screen_x = x * SQUARE_W
            screen_y = y * SQUARE_H
            color = LIGHT_BROWN if (id) % 2 == 0 else DARK_BROWN
            pygame.draw.rect(self.screen, color, (screen_x, screen_y, SQUARE_W, SQUARE_H))
            if(str(id) in black_pieces):
                # pygame.draw.circle(self.screen, RED, (screen_x+SQUARE_W//2, screen_y+SQUARE_H//2), int(SQUARE_W-0.15*SQUARE_W)//2)
                self.draw_circle(RED, screen_x, screen_y, int(SQUARE_W-0.15*SQUARE_W)//2, black_pieces[str(id)].king)
            elif(str(id) in white_pieces):
                self.draw_circle(WHITE, screen_x, screen_y, int(SQUARE_W-0.15*SQUARE_W)//2, white_pieces[str(id)].king)
            if(id in self.highlighted_squares):
                pygame.gfxdraw.rectangle(self.screen, (screen_x, screen_y, SQUARE_W, SQUARE_H), BLUE)
            # pygame.display.flip()
            # pygame.display.update()

            # color = LIGHT_BROWN if (id) % 2 == 0 else DARK_BROWN
            # pygame.draw.rect(self.screen, color, (col * 75, row * 75, 75, 75))

    def get_id_from_mouse_pos(self, x, y):
        x = x // SQUARE_W
        y = y // SQUARE_H
        return self.game.convert_xy_to_id(x, y)

    # def highlight_piece(self, x, y)

    def handle_click(self, first_pos, second_pos):
        # self.highlighted_squares = []
        mouse_x, mouse_y = first_pos[0], first_pos[1]
        first_id = self.get_id_from_mouse_pos(mouse_x, mouse_y)
        mouse_x, mouse_y = second_pos[0], second_pos[1]
        second_id = self.get_id_from_mouse_pos(mouse_x, mouse_y)
        if(first_id == second_id):
            self.highlighted_squares.append(id)
            return  
        legal_moves = self.get_legal_moves()
        # self.print_legal_moves()
        # print(legal_moves)
       

    def print_board(self) -> str:
        str_board, _ = self.game.get_board()
        print(str_board)
       
        return str_board
    
    def get_legal_moves(self) -> list:
        return self.game.calculate_possible_moves(self.player)

    def print_legal_moves(self, legal_moves = None) -> list:
        """
        Prints all legal moves the current player can do
        """
        index = 1 # Start counter at 1
        if(legal_moves == None):
            legal_moves = self.get_legal_moves()
        for i in legal_moves:
            i.print_move(index)
            index += 1
        return legal_moves
