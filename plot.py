import matplotlib.pyplot as plt
import numpy as np


# WITH DRAW
# size = ["5x5", "6x6", "7x7", "8x8"]
# classic_moves= [14.446, 25.647, 34.162, 48.338]
# superpos_moves = [18.229, 29.979, 41.514, 57.387]
# entangle_moves = [19.961, 30.339, 41.216, 56.415]

# # plt.plot(size, classic_moves, superpos_moves, entangle_moves)
# plt.plot(size, classic_moves, label="Classic")
# plt.plot(size, superpos_moves, label="Superposition")
# plt.plot(size, entangle_moves, label="Entanglement")
# plt.xlabel("Board size")
# plt.ylabel("Average number of moves")
# plt.legend(loc="upper left")
# plt.show()



# WITHOUT DRAW
size = ["5x5", "6x6", "7x7", "8x8", "10x10", "12x12", "14x14"]
classic_moves= [14.446, 25.647, 34.162, 48.338, 104.48, 242.91, 333.04]
superpos_moves = [18.22, 32.63, 54.2, 89.38, 238.53, 384.66, 977.69]
entangle_moves = [21.79, 32.51, 51.88, 74.28, 170.17, 322.11, 610.4]

# plt.plot(size, classic_moves, superpos_moves, entangle_moves)
plt.plot(size, classic_moves, label="Classic")
plt.plot(size, superpos_moves, label="Superposition")
plt.plot(size, entangle_moves, label="Entanglement")
plt.xlabel("Board size")
plt.ylabel("Average number of moves")
plt.legend(loc="upper left")
plt.show()