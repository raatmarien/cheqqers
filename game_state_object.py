from pydantic import BaseModel
from typing import Optional, Union, Dict, Tuple
from uuid import UUID

from game import Game
from enums import GameType, ClassicalSquareState, PieceColor, GameState
from piece import Piece
from moves import ClassicalMove, SplitMove, MergeMove
from quantum_state import PieceSuperposition, PieceEntanglement


class GameStateObject(BaseModel):
    # Board properties
    board_size: int
    piece_map: list[Optional[Piece]]
    classic_occupancy: list[ClassicalSquareState]

    # Game properies
    game_type: GameType
    moves: list[Union[ClassicalMove, SplitMove, MergeMove]]
    turn: PieceColor
    moves_since_take: int
    superpositions: list[PieceSuperposition]
    entanglements: list[Tuple[UUID, UUID]]

    # Extra's
    possible_moves: list[Union[ClassicalMove, SplitMove, MergeMove]]
    chances: Dict[int, float]
    game_state: GameState

    @staticmethod
    def from_game(game: Game):
        entanglements = [
            (e.superposition_taken.uuid, e.superposition_from.uuid)
            for e in game.entanglements]
        return GameStateObject(
            board_size=game.board.size,
            piece_map=game.board.piece_map,
            classic_occupancy=game.board.classic_occupancy,
            game_type=game.game_type,
            moves=game.moves,
            turn=game.turn,
            moves_since_take=game.moves_since_take,
            superpositions=game.superpositions,
            entanglements=entanglements,
            possible_moves=game.board.get_possible_moves(
                game.turn, game.superpositions),
            chances=game.get_all_chances(),
            game_state=game.get_game_state())

    def to_game(self):
        game = Game(
            self.board_size,
            start_rows=0,  # Overriden by piece maps
            game_type=self.game_type)
        game.board.piece_map = self.piece_map
        game.board.classic_occupancy = self.classic_occupancy
        game.moves = self.moves
        game.turn = self.turn
        game.moves_since_take = self.moves_since_take
        game.superpositions = self.superpositions
        real_entanglements = []
        for t, f in self.entanglements:
            real_entanglements.append(PieceEntanglement(
                superposition_from=next((s for s in self.superpositions
                                         if s.uuid == f), None),
                superposition_taken=next((s for s in self.superpositions
                                          if s.uuid == t), None)))
        game.entanglements = real_entanglements
        return game
