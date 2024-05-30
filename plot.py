import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

def splitSerToArr(ser):
    return [ser.index, ser.values]


# Data
sizes = ['5x5', '6x6', '7x7', '8x8', '9x9', '10x10', '11x11', '12x12', '13x13', '14x14']
fake = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
classic_checkers = [14.446, 25.647, 34.162, 48.338, np.nan, 104.48, np.nan, 242.91, np.nan, 333.04]
# classic_mask = np.isfinite(classic_checkers)
superpositions = [18.22, 32.63, 54.2, 89.38, np.nan, 238.53, np.nan, 384.66, np.nan, 977.69]
# superpositions_mask = np.isfinite(superpositions)
entanglement = [21.79, 32.51, 51.88, 74.28, np.nan, 170.17, np.nan, 322.11, np.nan, 610.4]
# entanglement_mask = np.isfinite(entanglement)
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
plt.ylabel('Average number of moves')
plt.title('Average number of moves for different board sizes')
plt.legend()
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
plt.savefig('no_draw_average_moves.png')
# plt.show()