import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

def splitSerToArr(ser):
    return [ser.index, ser.values]


# Data
sizes = ['5x5', '6x6', '7x7', '8x8', '9x9', '10x10', '11x11', '12x12', '13x13', '14x14']
# fake = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
fake = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

# draw average moves
# classic_checkers = [14.446, 25.647, 34.162, 48.338, np.nan, 75.331, np.nan, 88.895, np.nan, 54.488]
# superpositions = [18.229, 29.979, 41.514, 57.387, np.nan, 85.256, np.nan, 64.086, np.nan, 42.869]
# entanglement = [19.961, 30.339, 41.216, 56.415, np.nan, 75.591, np.nan, 58.445, np.nan, 42.49]

# draw average time v1
# classic_checkers = [0.085, 0.143, 0.203, 0.315, np.nan, 0.252, np.nan, 0.304, np.nan, 0.141]
# superpositions = [0.196, 0.342, 0.263, 0.304, np.nan, 0.755, np.nan, 0.821, np.nan, 0.375]
# entanglement = [0.083, 0.146, 0.472, 0.772, np.nan, 0.923, np.nan, 0.710, np.nan, 0.356]

# draw average time v2
# classic_checkers = [0.03317761182785034, 0.07399027585983277, 0.09972482442855835, 0.13175885438919066, np.nan, 0.2760949230194092, np.nan, 0.4483185696601868, np.nan, 0.3535179734230042]
# superpositions = [0.13645691633224488, 0.2448665714263916, 0.3935587453842163, 0.565906114578247, np.nan, 1.0073673033714294, np.nan, 0.7707014632225037, np.nan, 0.43078853845596315]
# entanglement = [0.14664857864379882, 0.24127572059631347, 0.4191624689102173, 0.6339619660377502, np.nan, 0.9631063532829285, np.nan, 0.6422774720191956, np.nan, 0.3980593204498291]

# draw average time v3
# classic_checkers = [0.03286042761802673, 0.05982771277427673, 0.09083635711669921, 0.135130069732666, np.nan, 0.26139082956314086, np.nan, 0.4310459086894989, np.nan, 0.33128737354278565]
# superpositions = [0.11905886316299438, 0.22072631311416627, 0.35732102489471435, 0.5875248553752899, np.nan, 0.9878685400485993, np.nan, 0.8283736248016358, np.nan, 0.39050336098670957]
# entanglement = [0.14853967022895814, 0.27124722957611086, 0.4050951590538025, 0.6036663694381714, np.nan, 0.9906493396759033, np.nan, 0.7642709438800812, np.nan, 0.3750457744598389]

# draw average moves v2
classic_checkers = [14.483, 26.001, 34.833, 48.556, np.nan, 74.842, np.nan, 90.465, np.nan, 54.32]
superpositions = [18.434, 28.849, 40.493, 58.852, np.nan, 84.139, np.nan, 65.302, np.nan, 43.616]
entanglement = [20.487, 32.52, 42.365, 58.233, np.nan, 79.833, np.nan, 58.598, np.nan, 42.781]

#no draw average moves
# classic_checkers = [14.56, 27.18, 36.0, 57.47, np.nan, 104.48, np.nan, 242.91, np.nan, 333.04]
# superpositions = [18.22, 32.63, 54.2, 89.38, np.nan, 238.53, np.nan, 384.66, np.nan, 977.69]
# entanglement = [21.79, 32.51, 51.88, 74.28, np.nan, 170.17, np.nan, 322.11, np.nan, 610.4]

#no draw average time
# classic_checkers = [0.031, 0.063, 0.095, 0.163, np.nan, 0.281, np.nan, 0.742, np.nan, 1.176]
# superpositions = [0.123, 0.261, 0.541, 1.067, np.nan, 4.779, np.nan, 12.200, np.nan, 124.161]
# entanglement = [0.159, 0.268, 0.528, 0.900, np.nan, 3.027, np.nan, 9.077, np.nan, 62.786]

classic_series = pd.Series(classic_checkers, index=sizes)
superpositions_series = pd.Series(superpositions, index=sizes)
entanglement_series = pd.Series(entanglement, index=sizes)
fake_series = pd.Series(fake, index=sizes)

# Plot
# plt.figure(figsize=(10, 6))
plt.plot( *splitSerToArr(fake_series.dropna()), linestyle='-', marker='o', alpha=0)
plt.plot( *splitSerToArr(classic_series.dropna()), linestyle='-', marker='o', label='Classic checkers', color='blue')
plt.plot( *splitSerToArr(superpositions_series.dropna()), linestyle='-', marker='o', label='Checkers with superpositions', color='green')
plt.plot( *splitSerToArr(entanglement_series.dropna()), linestyle='-', marker='o', label='Checkers with entanglement', color='orange')

plt.xlabel('Board Size')
# plt.ylabel('Average time (s)')
# plt.title('Average time per game different board sizes')
plt.ylabel('Average number of moves')
plt.title('Average number of moves for different board sizes')
plt.legend(loc='upper left')
plt.grid(True)
# plt.xticks(sizes)  # Set xticks to display all sizes
frame1 = plt.gca()
count = 0
for xlabel_i in frame1.axes.get_xticklabels():
    # set visible for 9x9, 11x11, 13x13 to false
    if(sizes[count] == '9x9' or sizes[count] == '11x11' or sizes[count] == '13x13'):    
        xlabel_i.set_visible(False)
        xlabel_i.set_fontsize(0.0)
    count += 1
plt.tight_layout()
plt.savefig('draw_average_moves.png')
plt.show()