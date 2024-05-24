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
size = ["5x5", "6x6", "7x7", "8x8"]

classic_moves= [14.5, 27.62, 35.01, 61.92]
superpos_moves = [18.93, 30.59, 51.68, 85.21]
entangle_moves = [20.64, 37.68, 59.68, 86.17]

classic_sec = [0.0314, 0.0712, 0.0908, 0.1921]
superpos_sec = [0.1469, 0.2403, 0.5934, 1.2016]
entangle_sec = [0.2211, 0.3667, 0.7127, 1.2654]
# # plt.plot(size, classic_moves, superpos_moves, entangle_moves)
# plt.plot(size, classic_moves, label="Classic")
# plt.plot(size, superpos_moves, label="Superposition")
# plt.plot(size, entangle_moves, label="Entanglement")
# plt.xlabel("Board size")
# plt.ylabel("Average number of moves")
# plt.legend(loc="upper left")
# plt.show()

############################################################
# ONE PLOT FOR TIME AND MOVES
# x = size
# # y-axis values
# # plotting figures by creating axes object
# # using subplots() function
# fig, ax = plt.subplots(figsize = (10, 5))
# plt.title('No draw')
# # using the twinx() for creating another
# # axes object for secondary y-Axis
# ax2 = ax.twinx()
# # ax2.set_yscale('log')
# ax.plot(x, classic_moves, color = 'red', linestyle = 'solid', label="Classic moves")
# ax.plot(x, superpos_moves, color = 'orange', linestyle = 'solid', label="Superposition moves")
# ax.plot(x, entangle_moves, color = 'yellow', linestyle = 'solid', label="Entanglement moves")
# ax2.plot(x, classic_sec, color = 'purple', linestyle = 'dashed', label="Classic time")
# ax2.plot(x, superpos_sec, color = 'blue', linestyle = 'dashed', label="Superposition time")
# ax2.plot(x, entangle_sec, color = 'green', linestyle = 'dashed', label="Entanglement time")
# ax.legend(loc="upper left")
# ax2.legend(loc="upper center")
# # giving labels to the axises
# ax.set_xlabel('Board size', color = 'black')
# ax.set_ylabel('Number of moves', color = 'r')
# # secondary y-axis label
# ax2.set_ylabel('Time (s)', color = 'b')
# # defining display layout 
# plt.tight_layout()
# # show plot
# plt.show()


############################################################
# PLOT FOR TIME
x = size
# y-axis values
# plotting figures by creating axes object
# using subplots() function
# fig, ax = plt.subplots(figsize = (10, 5))
fig, ax = plt.subplots()
plt.title('Average time per game for different board sizes without draw')
# ax2.set_yscale('log')
ax.plot(x, classic_sec, color = 'yellow', label="Classic time")
ax.plot(x, superpos_sec, color = 'blue', label="Superposition time")
ax.plot(x, entangle_sec, color = 'green', label="Entanglement time")
ax.legend(loc="upper left")
# giving labels to the axises
ax.set_xlabel('Board size')
ax.set_ylabel('Average time (s)')
# defining display layout 
plt.tight_layout()
# show plot
# plt.show()
plt.savefig('avgtimes.png')


############################################################
# PLOT FOR MOVES
x = size
# y-axis values
# plotting figures by creating axes object
# using subplots() function
# fig, ax = plt.subplots(figsize = (10, 5))
fig, ax = plt.subplots()
plt.title('Average number of moves per game for different board sizes without draw')
# ax2.set_yscale('log')
ax.plot(x, classic_moves, color = 'yellow', label="Classic time")
ax.plot(x, superpos_moves, color = 'blue', label="Superposition time")
ax.plot(x, entangle_moves, color = 'green', label="Entanglement time")
ax.legend(loc="upper left")
# giving labels to the axises
ax.set_xlabel('Board size')
ax.set_ylabel('Average number of moves')
# defining display layout 
plt.tight_layout()
# show plot
# plt.show()
plt.savefig('avgmoves.png')
