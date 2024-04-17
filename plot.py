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

classic_sec = [0,0,0,0, 0.28115068435668944, 0.742310152053833, 1.1754703831672668]
superpos_sec = [0.12307815790176392, 0.26103954076766966, 0.5412048768997192, 1.0666403412818908, 4.7787405252456665, 12.199728529453278, 124.16093977212905]
entangle_sec = [0.1587203025817871, 0.2678103756904602, 0.5275508308410645, 0.8896301293373108, 3.0269003748893737, 9.077003552913666, 62.786820361614225]

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
fig, ax = plt.subplots(figsize = (10, 5))
plt.title('No draw')
# ax2.set_yscale('log')
ax.plot(x, classic_sec, color = 'yellow', label="Classic time")
ax.plot(x, superpos_sec, color = 'blue', label="Superposition time")
ax.plot(x, entangle_sec, color = 'green', label="Entanglement time")
ax.legend(loc="upper left")
# giving labels to the axises
ax.set_xlabel('Board size')
ax.set_ylabel('Time (s)')
# defining display layout 
plt.tight_layout()
# show plot
plt.show()

############################################################
# PLOT FOR MOVES
x = size
# y-axis values
# plotting figures by creating axes object
# using subplots() function
fig, ax = plt.subplots(figsize = (10, 5))
plt.title('No draw')
# ax2.set_yscale('log')
ax.plot(x, classic_moves, color = 'yellow', label="Classic time")
ax.plot(x, superpos_moves, color = 'blue', label="Superposition time")
ax.plot(x, entangle_moves, color = 'green', label="Entanglement time")
ax.legend(loc="upper left")
# giving labels to the axises
ax.set_xlabel('Board size')
ax.set_ylabel('Number of moves')
# defining display layout 
plt.tight_layout()
# show plot
plt.show()
