from random import randint
import traceback
from mcts import MCTS
from enums import CheckersPlayer

class bot():
    def __init__(self) -> None:
        pass

    def select_move(self, possible_moves):
        pass

class human_player(bot):
    def select_move(self, possible_moves):
        selected = False
        while not selected:
            move = self.get_move()
            try:
                move = int(move)
            except:
                print("Input has to be an integer!")
                continue
            if(move > len(possible_moves) or move < 1):
                print(f"Input has to be an integer between 1 and {len(possible_moves)}!")
                continue
            selected = True
        return possible_moves[move-1]
    
    def get_move(self):
        return input(f'Select move: ')

class random_bot(bot):
    def select_move(self, possible_moves):
        try:
            if(len(possible_moves)-1 == 0):
                return possible_moves[0]
            return possible_moves[randint(0, len(possible_moves)-1)]
        except Exception as error:
            print(traceback.format_exc())
            print(possible_moves)
    
class heurisitc_bot():
    def __init__(self, game, depth=2) -> None:
        self.game = game
        self.depth = depth
        self.player = game.player

    def select_move(self, game, parent_player: CheckersPlayer, curr_depth=0):
        scores = []
        possible_moves = self.game.legal_moves
        if(curr_depth == self.depth): # if we reached the depth we want to go to, evaluate the board
            score =  self.evaluate_board(game)
            if(parent_player != game.player): # Invert the score if the player is not the same as the parent player
                score = -score
            return score
        for i in possible_moves: # For all moves we can do from this position, do the move and recursively call this function
            cp = game.get_copy()
            player = cp.player
            cp.move(i) # player probably changes here
            scores.append(self.select_move(cp, player, curr_depth+1)) # is gonna return a score for this specific move
        if(curr_depth == 0):
            return possible_moves[scores.index(max(scores))]
        return sum(scores)/len(scores) # Return average of scores

    def evaluate_board(self, game):
        score = 0
        modifier = 1
        if(self.player == CheckersPlayer.BLACK):
            modifier = -1
        for key, value in self.classical_squares.items():
            if(value.color == CheckersPlayer.WHITE):
                score += self.chance
            elif(value.color == CheckersPlayer.BLACK):
                score -= self.chance
        score = score * modifier # Multiply by modifier to make sure the score is correct for the player
        return score
        pass
           
    
            
