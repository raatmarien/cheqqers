# Copyright 2025 Marien Raat <mail@marienraat.nl>
#
# This file is part of Cheqqers.
#
# Cheqqers is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Cheqqers is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with Cheqqers. If not, see
# <https://www.gnu.org/licenses/>.

from game_runner import GameRunner
from players import CliPlayer, RandomPlayer, MctsPlayer


if __name__ == '__main__':
    game_runner = GameRunner(CliPlayer(), CliPlayer())
    game_runner.run_game()
