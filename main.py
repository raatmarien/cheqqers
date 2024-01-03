import argparse
from interface import GameInterface
from quantum_checkers import Checkers

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--num_rows', help='The number of rows of the checkboard', default=5)
    parser.add_argument('--num_columns', help='The number of columns of the checkboard', default=5)
    parser.add_argument('--num_vertical_pieces', help='The number of rows that are filled with checkerpieces', default=1)
    args = parser.parse_args()
    game = GameInterface(Checkers(num_vertical=args.num_rows, num_horizontal=args.num_columns, num_vertical_pieces=args.num_vertical_pieces))
    game.play()

if __name__ == "__main__":
    main()