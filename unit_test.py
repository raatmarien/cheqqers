import unittest
from quantum_checkers import Checkers

class TestIsAdjacent(unittest.TestCase):        
    def test_is_adjacent_true(self):
        game = Checkers(num_vertical=3, num_horizontal=3, num_vertical_pieces=1)
        for i in range(9):
            self.assertEqual(game.is_adjacent(4, i), True, "Should be True")
    
    def test_is_adjacent_false(self):
        game = Checkers(num_vertical=5, num_horizontal=5, num_vertical_pieces=1)
        for i in range(9):
            self.assertEqual(game.is_adjacent(100, i), False, "Should be False")

if __name__ == '__main__':
    unittest.main()
    