import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

def splitSerToArr(ser):
    return [ser.index, ser.values]


def add_nans(arr):
    return arr[:4] + [np.nan, arr[4], np.nan, arr[5], np.nan, arr[6]]


# Data
sizes = ['5x5', '6x6', '7x7', '8x8', '9x9', '10x10', '11x11', '12x12', '13x13', '14x14']
# fake = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
fake = [0.0]*10

plot_type = 'no-draw-moves'

if plot_type == 'draw-moves':
    classic_checkers = add_nans([14.357, 25.092, 33.92, 49.154, 75.075, 89.171, 54.653])
    classic_checkers_sd = add_nans([7.3241514316809555, 12.95412464604789, 17.427429968739375, 22.65222742706349, 25.183597610122916, 32.85506375300791, 33.78227098394708])

    superpositions = add_nans([17.95, 29.654, 40.077, 55.413, 84.641, 72.984, 45.425])
    superpositions_sd = add_nans([10.168918669500062, 16.43929848060843, 20.65496789391595, 25.623055476893693, 28.49733701975006, 42.65422754109054, 23.892618781377486])

    entanglement = add_nans([19.28, 30.457, 42.274, 57.669, 84.599, 71.64, 46.975])
    entanglement_sd = add_nans([10.860918909537975, 16.61566222668333, 20.978346336520783, 25.216409464995333, 29.349064151460887, 41.76856489051321, 26.789663324891954])
elif plot_type == 'draw-times':
    classic_checkers = add_nans([0.0006178343296051026, 0.0013408238887786866, 0.0022601535320281984, 0.004056111335754394, 0.009039983749389649, 0.014247995138168336, 0.011765658855438232])
    classic_checkers_sd = add_nans([0.00029111881628889145, 0.000636946538448609, 0.001101727599906939, 0.00180132057043077, 0.002942844183420461, 0.005121331765066966, 0.006989170263047937])

    superpositions = add_nans([0.0009600751399993897, 0.0019862160682678222, 0.003289463520050049, 0.00538588809967041, 0.011859311819076538, 0.014266619205474854, 0.011591273069381713])
    superpositions_sd = add_nans([0.0005649835531086878, 0.0011059827914970638, 0.0017253411631075121, 0.0025667910343942515, 0.004146225748706533, 0.008214098272835126, 0.007274499026706325])

    entanglement = add_nans([0.0009567785263061523, 0.0019979445934295652, 0.0033137247562408448, 0.005471489191055298, 0.011595349788665771, 0.013175289392471314, 0.011174434661865235])
    entanglement_sd = add_nans([0.0005297331865478094, 0.001100147020915267, 0.0016867171018092905, 0.002472735628507048, 0.004158409903529284, 0.007580366139194792, 0.0062358512781999515])
elif plot_type == 'no-draw-moves':
    classic_checkers = add_nans([14.423, 25.068, 36.537, 56.984, 115.598, 194.34, 329.024])
    classic_checkers_sd = add_nans([6.977876594047917, 14.116112802065611, 22.72049409347983, 34.300470350510736, 69.46279202188374, 114.32823511865013, 191.96429280914123])

    superpositions = add_nans([18.048, 31.275, 47.995, 73.767, 172.333, 334.856, 601.97])
    superpositions_sd = add_nans([11.085512373570497, 19.845987963269508, 33.57371247224783, 49.70403607557642, 118.42090872233088, 212.52734679832884, 357.605983086328])

    entanglement = add_nans([19.785, 31.864, 47.627, 76.38, 164.482, 300.817, 499.214])
    entanglement_sd = add_nans([11.012177034675888, 18.962201060770056, 30.08526207288203, 51.797186685654545, 105.11665513698192, 190.7897750123136, 289.2269981527666])
elif plot_type == 'no-draw-times':
    classic_checkers = add_nans([0.0006304497718811035, 0.0013582642078399658, 0.002378401517868042, 0.004628655910491944, 0.013882984399795533, 0.031196022510528564, 0.06740591192245483])
    classic_checkers_sd = add_nans([0.0002800181338188237, 0.0007007513075656215, 0.0013859946979418115, 0.0026643327230273985, 0.008057236984303452, 0.01799731976029842, 0.03893700718036809])

    superpositions = add_nans([0.0008720424175262451, 0.0019171054363250732, 0.0037376513481140136, 0.007106372833251953, 0.025520331859588623, 0.07806557345390319, 0.18942372846603395])
    superpositions_sd = add_nans([0.0005318801826450361, 0.0012336652989708942, 0.0026607269430416313, 0.0049939599695415, 0.01848044377748349, 0.05349518575006284, 0.12168185490347344])

    entanglement = add_nans([0.0010290758609771728, 0.0022201855182647705, 0.004288601398468018, 0.009248939990997315, 0.029344993352890016, 0.07005107235908509, 0.15228004097938538])
    entanglement_sd = add_nans([0.0005840097299704804, 0.0013444734237917668, 0.002826938203292016, 0.0069120073223498165, 0.02048914858227869, 0.05049416942553472, 0.0927268619486995])

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

classic_sd_series = pd.Series(classic_checkers_sd, index=sizes)
superpositions_sd_series = pd.Series(superpositions_sd, index=sizes)
entanglement_sd_series = pd.Series(entanglement_sd, index=sizes)

# To make sure all the points, even those without data, are given
plt.plot(*splitSerToArr(fake_series.dropna()), linestyle='-',
         marker='o', alpha=0)

classic_data = {
    'color': 'blue',
    'label': 'Classic checkers',
    'series': classic_series,
    'yerr': classic_sd_series.dropna().values,
}
superpositions_data = {
    'color': 'green',
    'label': 'Checkers with superpositions',
    'series': superpositions_series,
    'yerr': superpositions_sd_series.dropna().values,
}
entanglement_data = {
    'color': 'orange',
    'label': 'Checkers with entanglement',
    'series': entanglement_series,
    'yerr': entanglement_sd_series.dropna().values,
}

for data in [classic_data, superpositions_data, entanglement_data]:
    series = data['series'].dropna()
    x = series.index
    y = series.values
    d = data.copy()
    del d['series']
    plt.errorbar(x=x, y=y,
                 fmt='none',
                 yerr=d['yerr'],
                 alpha=.5,
                 capsize=3,
                 color=d['color'])
    data_2 = {
        'x': x,
        'y1': [y - e for y, e in zip(y, d['yerr'])],
        'y2': [y + e for y, e in zip(y, d['yerr'])]}
    plt.fill_between(**data_2, alpha=.2, color=d['color'])

for data in [classic_data, superpositions_data, entanglement_data]:
    series = data['series'].dropna()
    x = series.index
    y = series.values
    del data['series']
    plt.plot(series,
             color=data['color'],
             label=data['label'],
             linestyle='-',
             marker='o')


plt.xlabel('Board Size')
# plt.ylabel('Average time (s)')
# plt.title('Average time per game different board sizes')
if plot_type == 'draw-moves':
    plt.ylabel('Average number of moves')
    plt.title('Average number of moves for different board sizes')
elif plot_type == 'draw-times':
    plt.ylabel('Average time (s)')
    plt.title('Average time per game for different board sizes')
elif plot_type == 'no-draw-moves':
    plt.ylabel('Average number of moves')
    plt.title('Average number of moves for different board sizes')
elif plot_type == 'no-draw-times':
    plt.ylabel('Average time (s)')
    plt.title('Average time per game for different board sizes')
plt.legend(loc='upper left')
plt.grid(True)
# plt.xticks(sizes)  # Set xticks to display all sizes
frame1 = plt.gca()
count = 0
for xlabel_i in frame1.axes.get_xticklabels():
    # set visible for 9x9, 11x11, 13x13 to false
    if sizes[count] == '9x9' or\
       sizes[count] == '11x11' or\
       sizes[count] == '13x13':
        xlabel_i.set_visible(False)
        xlabel_i.set_fontsize(0.0)
    count += 1
plt.tight_layout()
if plot_type == 'draw-moves':
    plt.savefig('draw_average_moves.pdf')
elif plot_type == 'draw-times':
    plt.savefig('draw_average_times.pdf')
elif plot_type == 'no-draw-moves':
    plt.savefig('no_draw_average_moves.pdf')
elif plot_type == 'no-draw-times':
    plt.savefig('no_draw_average_times.pdf')

plt.show()
