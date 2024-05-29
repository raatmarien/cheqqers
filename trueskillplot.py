import numpy as np
import matplotlib.pyplot as plt

# Data
variants = ['Classic', 'Superpositions', 'Entanglement']
agents = ['Random', 'Heuristic', 'Low MCTS', 'High MCTS']
colors = ['blue', 'green', 'orange', 'red']
# Ratings for 10 games of normal checkers board
ratings = {
    'Classic': [(12.638, 2.593), (22.257, 1.694), (28.690, 1.586), (32.362, 1.694)],
    'Superpositions': [(14.560, 2.197), (21.832, 1.595), (25.634, 1.608), (30.847, 1.828)],
    'Entanglement': [(16.947, 2.045), (22.949, 1.638), (29.595, 1.681), (30.348, 1.654)]
}
# Ratings for 25 games of 5x5 checkers board
# ratings = {
#     'Classic': [(17.828, 1.173), (24.517, 0.847), (29.183, 0.869), (30.482, 0.899)],
#     'Superpositions': [(21.021, 0.853), (23.974, 0.815), (27.167, 0.821), (27.423, 0.818)],
#     'Entanglement': [(21.941, 0.832), (25.367, 0.798), (27.022, 0.809), (26.026, 0.808)]
# }
# Plot
plt.figure(figsize=(12, 6))

# Plotting background horizontal lines
for i in range(10, 36, 5):
    plt.axhline(y=i, color='lightgrey', linestyle='--', linewidth=0.5)

for i, variant in enumerate(variants):
    x = np.arange(len(agents)) + i * 0.25
    means = [rating[0] for rating in ratings[variant]]
    stds = [rating[1] for rating in ratings[variant]]
    plt.errorbar(x, means, yerr=stds, fmt='o', capsize=5, label=variant, color=colors[i])

# Adding vertical lines between agents
for i in range(len(agents) - 1):
    plt.axvline(x=i + 0.75, color='grey', linestyle='--', linewidth=0.5)

plt.xticks(np.arange(len(agents)) + 0.25, agents)
plt.xlabel('Agents')
plt.ylabel('TrueSkill rating')
plt.title('TrueSkill ratings for different agents in various checkers variants on a normal 8x8 checkerboard')
plt.legend()
plt.tight_layout()
plt.savefig('trueskill_ratings.png')
# plt.show()