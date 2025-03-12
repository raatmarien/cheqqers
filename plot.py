import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from random_vs_random_results import results

def splitSerToArr(ser):
    return [ser.index, ser.values]


import matplotlib as mpl
fig_size_dim    = 5
golden_ratio    = (1+np.sqrt(5))/2
# Increase height for three subplots
fig_size        = (fig_size_dim, fig_size_dim/golden_ratio * 2)

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
fake = [0.0]*10

fake_series = pd.Series(fake, index=sizes)

plot_type = 'draw-moves'

# Create figure with three subplots: 
# 1. top for average moves with draws
# 2. middle for draw percentage
# 3. bottom for average moves without draws
fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=fig_size, 
                               sharex=True, gridspec_kw={'height_ratios': [2, 1, 2]})

# Set the current axis to the top subplot for the average moves plot
plt.sca(ax1)

data_plot_1 = []
lines = []
game_types = [
    ('CLASSIC', 'blue', 'Classic'),
    ('SUPERPOSITION', 'green', 'Level 1'),
    ('ENTANGLEMENT', 'orange', 'Level 2'),
    ('INTERFERENCE', 'purple', 'Level 3')]
for game_type, color, label in game_types:
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

ax1.set_ylabel('Average moves')
ax1.set_title('Average game length (with draws)')
ax1.grid(True)

# Switch to middle subplot for draw percentage
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

# Settings for middle subplot
ax2.set_ylabel('Draws (\%)')
ax2.set_title('Draw rate')
ax2.grid(True)

# Now setup the third subplot for average moves without draws
plt.sca(ax3)

# Generate data for the third subplot
data_plot_3 = []
for game_type, color, label in game_types:
    no_draw_moves = list_item('average_moves', [results.get(f'False-GameType.{game_type}-{s}') for s in size_nums])
    no_draw_moves_std = list_item('stdev_moves', [results.get(f'False-GameType.{game_type}-{s}') for s in size_nums])
    if game_type == 'SUPERPOSITION':
        no_draw_moves = no_draw_moves[:6] + [np.nan, 334.856, np.nan, 601.97]
        no_draw_moves_std = no_draw_moves_std[:6] + [np.nan, 212.52734679832884, np.nan, 357.605983086328]
    if game_type == 'ENTANGLEMENT':
        no_draw_moves = no_draw_moves[:4] + [np.nan, 164.482, np.nan, 300.817, np.nan, 499.214]
        no_draw_moves_std = no_draw_moves_std[:4] + [np.nan, 105.11665513698192, np.nan, 190.7897750123136, np.nan, 289.2269981527666]
    no_draw_series = pd.Series(no_draw_moves, index=sizes)
    no_draw_sd_series = pd.Series(no_draw_moves_std, index=sizes)
    data_plot_3.append({
        'color': color,
        'label': label,
        'series': no_draw_series,
        'yerr': no_draw_sd_series.dropna().values
    })

# To make sure all the points, even those without data, are given
ax3.plot(*splitSerToArr(fake_series.dropna()), linestyle='-',
         marker='o', alpha=0)

for data in data_plot_3:
    series = data['series'].dropna()
    x = series.index
    y = series.values
    d = data.copy()
    del d['series']
    ax3.errorbar(x=x, y=y,
                 fmt='none',
                 yerr=d['yerr'],
                 alpha=.5,
                 capsize=3,
                 color=d['color'])
    data_2 = {
        'x': x,
        'y1': [y - e for y, e in zip(y, d['yerr'])],
        'y2': [y + e for y, e in zip(y, d['yerr'])]}
    ax3.fill_between(**data_2, alpha=.2, color=d['color'])

for data in data_plot_3:
    series = data['series'].dropna()
    x = series.index
    y = series.values
    del data['series']
    ax3.plot(series,
            color=data['color'],
            linestyle='-',
            marker='o')

# Settings for bottom subplot
ax3.set_xlabel('Board size')
ax3.set_ylabel('Average moves')
ax3.set_title('Average game length (without draws)')
ax3.grid(True)

# Create a legend outside all subplots - placed to the left for better space utilization
leg = fig.legend(lines, [d['label'] for d in data_plot_1], 
                 loc='lower left', 
                 bbox_to_anchor=(0.17, 0.18, 0.1, 0.5),
                 ncol=1,
                 fontsize='medium',
                 frameon=True,
                 fancybox=True,
                 shadow=True)

# Handle x-tick labels 
frame1 = ax3
count = 0
for xlabel_i in frame1.axes.get_xticklabels():
    # set visible for 9x9, 11x11, 13x13 to false
    if sizes[count] == '9x9' or\
       sizes[count] == '11x11' or\
       sizes[count] == '13x13':
        xlabel_i.set_visible(False)
        xlabel_i.set_fontsize(0.0)
    count += 1

# Apply tight layout and save
plt.tight_layout()
fig.tight_layout()

# Update filename to reflect three subplots
filename = 'game_analysis_three_plots.pdf'

plt.savefig(filename)
plt.show()
