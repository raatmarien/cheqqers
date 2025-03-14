# import numpy as np
# import matplotlib.pyplot as plt

# # Data
# variants = ['Classic', 'Superpositions', 'Entanglement']
# agents = ['Random', 'Heuristic', 'Low MCTS', 'High MCTS']
# colors = ['blue', 'green', 'orange', 'red']
# # Ratings for 10 games of normal checkers board
# ratings = {
#     'Classic': [(11.345, 2.197), (23.211, 1.272), (28.161, 1.199), (32.577, 1.329)],
#     'Superpositions': [(14.036, 1.631), (21.474, 1.179), (26.870, 1.166), (29.933, 1.309)],
#     'Entanglement': [(18.045, 1.416), (22.708, 1.121), (28.886, 1.182), (30.575, 1.226)]
# }
# # Ratings for 25 games of 5x5 checkers board
# # ratings = {
# #     'Classic': [(17.828, 1.173), (24.517, 0.847), (29.183, 0.869), (30.482, 0.899)],
# #     'Superpositions': [(21.021, 0.853), (23.974, 0.815), (27.167, 0.821), (27.423, 0.818)],
# #     'Entanglement': [(21.941, 0.832), (25.367, 0.798), (27.022, 0.809), (26.026, 0.808)]
# # }
# # Plot
# plt.figure(figsize=(12, 6))

# # Plotting background horizontal lines
# for i in range(10, 36, 5):
#     plt.axhline(y=i, color='lightgrey', linestyle='--', linewidth=0.5)

# for i, variant in enumerate(variants):
#     x = np.arange(len(agents)) + i * 0.25
#     means = [rating[0] for rating in ratings[variant]]
#     stds = [rating[1] for rating in ratings[variant]]
#     plt.errorbar(x, means, yerr=stds, fmt='o', capsize=5, label=variant, color=colors[i])

#     #  # Linear regression
#     # poly = np.polyfit(x, means, 1)
#     # plt.plot(x, np.polyval(poly, x), color=colors[i], linestyle='--')

# # Adding vertical lines between agents
# for i in range(len(agents) - 1):
#     plt.axvline(x=i + 0.75, color='grey', linestyle='--', linewidth=0.5)

# plt.xticks(np.arange(len(agents)) + 0.25, agents)
# plt.xlabel('Agents')
# plt.ylabel('TrueSkill rating')
# plt.title('TrueSkill ratings for different agents in various checkers variants on a normal 8x8 checkerboard')
# plt.legend()
# plt.tight_layout()
# plt.savefig('trueskill_ratings8x8.png')
# plt.show()


import numpy as np
import matplotlib.pyplot as plt


import matplotlib as mpl
fig_size_dim    = 5
golden_ratio    = (1+np.sqrt(5))/2
# Increase height for three subplots
fig_size        = (fig_size_dim, fig_size_dim/golden_ratio * 1)

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


# Data
variants = ['Classic', 'Level 1', 'Level 2', 'Level 3']
agents = ['Random', 'Low MCTS', 'Medium MCTS', 'High MCTS']
colors = ['blue', 'green', 'orange', 'red']
# # Ratings for 10 games of normal checkers board
# ratings = {
#     'Classic': [(11.345, 2.197), (23.211, 1.272), (28.161, 1.199), (32.577, 1.329)],
#     'Superpositions': [(14.036, 1.631), (21.474, 1.179), (26.870, 1.166), (29.933, 1.309)],
#     'Entanglement': [(18.045, 1.416), (22.708, 1.121), (28.886, 1.182), (30.575, 1.226)]
# }
# Ratings for 25 games of 5x5 checkers board
ratings = {
    'Classic': [(18.990, 0.980), (24.988, 0.851), (26.514, 0.856), (28.716, 0.878)],
    'Level 1': [(21.553, 0.880), (27.364, 0.833), (26.097, 0.829), (28.267, 0.832)],
    'Level 2': [(22.712, 0.888), (26.725, 0.832), (28.829, 0.833), (28.646, 0.842)],
    'Level 3': [(23.171, 0.930), (27.541, 0.839), (28.918, 0.839), (30.506, 0.864)]
}
# Plot

# Plotting background horizontal lines
for i in range(10, 35, 5):
    plt.axhline(y=i, color='lightgrey', linestyle='--', linewidth=0.5)

for i, agent in enumerate(agents):
    x = np.arange(len(variants)) + i * 0.2 + 0.1
    means = [ratings[variant][i][0] for variant in variants]
    stds = [ratings[variant][i][1] for variant in variants]
    plt.errorbar(x, means, yerr=stds, fmt='o', capsize=5, label=agent, color=colors[i])

    # Linear regression
    # poly = np.polyfit(x, means, 1)
    # plt.plot(x, np.polyval(poly, x), color=colors[i], linestyle='--')

# Adding vertical lines between game types
for i in range(len(variants) - 1):
    plt.axvline(x=i + 0.9, color='grey', linestyle='-', linewidth=0.5)

plt.xticks(np.arange(len(variants)) + 0.25, variants)
plt.ylabel('TrueSkill rating')
plt.title('Agent ratings compared on 8x8 board')
plt.legend()
plt.tight_layout()
plt.savefig('trueskill_ratings_8x8.pdf')
plt.show()
