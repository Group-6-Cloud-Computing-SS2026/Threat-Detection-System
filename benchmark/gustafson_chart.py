import matplotlib.pyplot as plt
import numpy as np

sizes = ["1600x600\n(1 Node)", "1600x1200\n(2 Nodes)", "3200x1200\n(4 Nodes)", "3200x2400\n(8 Nodes)"]
nodes = [1, 2, 4, 8]

seq1 = np.array([0.004, 0.003, 0.003, 0.004])
parallel = np.array([5.620, 8.233, 9.449, 14.889])
seq2 = np.array([0.006, 0.387, 0.772, 1.648])
stds = [0.90, 1.11, 0.87, 1.31]
scaled_speedup = [1.00, 1.95, 3.77, 7.30]

C_SEQ1 = "#e53935" 
C_SEQ2 = "#ffb300" 
C_PAR  = "#76ff03" 

# FIGURE 1: GUSTAFSON'S STACKED RUNTIME CHART
fig, ax = plt.subplots(figsize=(8, 5))
x = np.arange(len(sizes))
b1 = ax.bar(x, seq1, color=C_SEQ1, edgecolor='black', linewidth=0.7, width=0.5)
b2 = ax.bar(x, seq2, bottom=seq1, color=C_SEQ2, edgecolor='black', linewidth=0.7, width=0.5)
b3 = ax.bar(x, parallel, bottom=seq1+seq2, color=C_PAR, edgecolor='black', linewidth=0.7, width=0.5)
ax.set_title("Gustafson's Law — Stacked Runtimes", fontsize=12, pad=12)
ax.set_xticks(x)
ax.set_xticklabels(sizes)
ax.set_ylabel("Runtime [s]", fontsize=11)
ax.tick_params(direction='in', top=True, right=True)
ax.legend([b1, b2, b3], ["1st seq. part", "2nd seq. part", "Par. part"], frameon=False, loc="upper left")
plt.tight_layout()
plt.savefig("gustafson_stacked_runtimes.png", dpi=300)

# FIGURE 2: PERFORMANCE VARIABILITY CHART
plt.figure(figsize=(8, 5))
plt.plot(nodes, stds, marker='o', color='purple', linewidth=2, markersize=8, label=r"$\pm\sigma$ (Std Dev)")
plt.title("Gustafson's Law — Performance Variability", fontsize=12, pad=12)
plt.xlabel("Number of Distributed Nodes", fontsize=11)
plt.ylabel("Standard Deviation [seconds]", fontsize=11)
plt.xticks(nodes)
plt.grid(True, linestyle="--", alpha=0.5)
plt.legend(fontsize=10)
plt.tight_layout()
plt.savefig("gustafson_std_deviation.png", dpi=300)

# FIGURE 3: GUSTAFSON'S SPEEDUP CHART (Matching gray-bar style)
plt.figure(figsize=(8, 5))
bars = plt.bar(sizes, scaled_speedup, color="#bdbdbd", edgecolor='black', linewidth=0.7, width=0.5)
plt.title("Gustafson's Law — Scaled Speedup", fontsize=12, pad=12)
plt.ylabel("Speedup", fontsize=11)
plt.ylim(0, 8.5)
plt.gca().tick_params(direction='in', top=True, right=True)

for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height + 0.15, f"{height:.2f}", ha='center', va='bottom', fontsize=10)
plt.tight_layout()
plt.savefig("gustafson_speedups.png", dpi=300)