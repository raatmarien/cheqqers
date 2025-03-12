import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from random_vs_random_results import results

def splitSerToArr(ser):
    return [ser.index, ser.values]


import matplotlib as mpl
fig_size_dim    = 5
golden_ratio    = (1+np.sqrt(5))/2
fig_size        = (fig_size_dim, fig_size_dim/golden_ratio * 1.5)

def plot_style():
    font_size       = 12
    dpi             = 200

    params = {'figure.figsize': fig_size,
              'figure.dpi': dpi,
              'savefig.dpi': dpi,
              'font.size': font_size,
              'font.family': "sans-serif",
              'font.sans-serif': ["Helvetica"],
              'figure.titlesize': font_size,
              'legend.fontsize': font_size,
              'axes.labelsize': font_size,
              'axes.titlesize': font_size,
              'xtick.labelsize': font_size,
              'ytick.labelsize': font_size,
              'text.usetex': True,
             }

    plt.rcParams.update(params)
plot_style()

def list_item(key, dicts):
    for i in range(len(dicts)):
        if dicts[i] is None:
            dicts[i] = np.nan
        else:
            dicts[i] = dicts[i][key]
    return dicts

# Data
sizes = ['5x5', '6x6', '7x7', '8x8', '9x9', '10x10', '11x11', '12x12', '13x13', '14x14']
size_nums = range(5, 15)
# fake = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
fake = [0.0]*10

fake_series = pd.Series(fake, index=sizes)

plot_type = 'draw-moves'

# Create figure with subplots: top for average moves, bottom for draw percentage
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(fig_size_dim, (fig_size_dim/golden_ratio)*1.5), 
                               sharex=True, gridspec_kw={'height_ratios': [2, 1]})

# Set the current axis to the top subplot for the average moves plot
plt.sca(ax1)


data_plot_1 = []
lines = []
game_types = [
    ('CLASSIC', 'blue', 'Classic'),
    ('SUPERPOSITION', 'green', 'Level 1'),
    ('ENTANGLEMENT', 'orange', 'Level 2'),
    ('INTERFERENCE', 'purple', 'Level 3')]
for game_type, color, label in  game_types:
    draw_moves = list_item('average_moves', [results.get(f'True-GameType.{game_type}-{s}') for s in size_nums])
    draw_moves_std = list_item('stdev_moves', [results.get(f'True-GameType.{game_type}-{s}') for s in size_nums])
    draw_series = pd.Series(draw_moves, index=sizes)
    draw_sd_series = pd.Series(draw_moves_std, index=sizes)
    data_plot_1.append({
        'color': color,
        'label': label,
        'series': draw_series,
        'yerr': draw_sd_series.dropna().values
    })

# To make sure all the points, even those without data, are given
ax1.plot(*splitSerToArr(fake_series.dropna()), linestyle='-',
         marker='o', alpha=0)

for data in data_plot_1:
    series = data['series'].dropna()
    x = series.index
    y = series.values
    d = data.copy()
    del d['series']
    ax1.errorbar(x=x, y=y,
                 fmt='none',
                 yerr=d['yerr'],
                 alpha=.5,
                 capsize=3,
                 color=d['color'])
    data_2 = {
        'x': x,
        'y1': [y - e for y, e in zip(y, d['yerr'])],
        'y2': [y + e for y, e in zip(y, d['yerr'])]}
    ax1.fill_between(**data_2, alpha=.2, color=d['color'])

for data in data_plot_1:
    series = data['series'].dropna()
    x = series.index
    y = series.values
    del data['series']
    line1, = ax1.plot(series,
                      color=data['color'],
                      label=data['label'],
                      linestyle='-',
                      marker='o')
    lines.append(line1)


ax1.set_ylabel('Average number of moves')
ax1.set_title('Average game length')
ax1.grid(True)


# Switch to bottom subplot for draw percentage
plt.sca(ax2)

# Generate data for draw percentage subplot
data_plot_2 = []
for game_type, color, label in game_types:
    draw_pct = np.array(list_item('draw', [results.get(f'True-GameType.{game_type}-{s}') for s in size_nums])) * 100
    draw_pct_series = pd.Series(draw_pct, index=sizes)
    data_plot_2.append({
        'color': color,
        'label': label,
        'series': draw_pct_series
    })

# To make sure all the points, even those without data, are given
ax2.plot(*splitSerToArr(fake_series.dropna()), linestyle='-',
         marker='o', alpha=0)

for data in data_plot_2:
    series = data['series'].dropna()
    ax2.plot(series,
             color=data['color'],
             linestyle='-',
             marker='o')

# Settings for bottom subplot
ax2.set_xlabel('Board Size')
ax2.set_ylabel('Draws (\%)')
ax2.set_title('Draw rate')
ax2.grid(True)

# Handle x-tick labels for both subplots
# count = 0
# for i, size in enumerate(sizes):
#     if size == '9x9' or size == '11x11' or size == '13x13':
#         ax2.get_xticklabels()[i].set_visible(False)
#         ax2.get_xticklabels()[i].set_fontsize(0.0)

# Create a legend outside both subplots
leg = fig.legend(lines, [d['label'] for d in data_plot_1], 
                 loc='upper left', 
                 bbox_to_anchor=(0.15, 0.43, 0.1, 0.5),
                 ncol=1,
                 fontsize='small',
                 frameon=True,
                 fancybox=True,
                 shadow=True)

plt.tight_layout()
# Adjust layout to make room for the legend at bottom
plt.subplots_adjust(bottom=0.15)


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
