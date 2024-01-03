import argparse
from interface import GameInterface
from quantum_checkers import Checkers

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--num_rows', help='The number of rows of the checkboard. INT', default=5)
    parser.add_argument('--num_columns', help='The number of columns of the checkboard. INT', default=5)
    parser.add_argument('--num_vertical_pieces', help='The number of rows that are filled with checkerpieces. INT', default=2)
    parser.add_argument('--GUI', help='If GUI is enabled. True or False', default="True")
    args = parser.parse_args()
    game = GameInterface(Checkers(num_vertical=args.num_rows, num_horizontal=args.num_columns, num_vertical_pieces=args.num_vertical_pieces), GUI=args.GUI)
    game.play()

if __name__ == "__main__":
    main()