import matplotlib.pyplot as plt
import numpy as np

resolutions = ["200x150", "400x300", "800x600", "1600x1200", "3200x2400", "6400x4800"]
nodes_list = [1, 2, 4, 8]

data = {
    "200x150": {
        "seq1": [0.005, 0.003, 0.003, 0.003],
        "parallel": [3.015, 2.215, 2.028, 2.050],
        "seq2": [0.007, 0.022, 0.026, 0.030],
        "std": [0.71, 0.45, 0.01, 0.01],
        "speedup": [1.00, 1.35, 1.47, 1.45]
    },
    "400x300": {
        "seq1": [0.003, 0.003, 0.003, 0.003],
        "parallel": [2.209, 2.816, 2.228, 2.045],
        "seq2": [0.004, 0.051, 0.053, 0.055],
        "std": [0.45, 0.45, 0.46, 0.01],
        "speedup": [1.00, 0.77, 0.97, 1.05]
    },
    "800x600": {
        "seq1": [0.003, 0.003, 0.003, 0.003],
        "parallel": [4.014, 3.618, 3.028, 3.056],
        "seq2": [0.005, 0.135, 0.137, 0.146],
        "std": [0.00, 0.54, 0.01, 0.02],
        "speedup": [1.00, 1.07, 1.27, 1.26]
    },
    "1600x1200": {
        "seq1": [0.003, 0.003, 0.003, 0.003],
        "parallel": [10.030, 8.433, 6.036, 5.057],
        "seq2": [0.005, 0.375, 0.465, 0.472],
        "std": [0.71, 0.91, 0.02, 0.02],
        "speedup": [1.00, 1.14, 1.54, 1.81]
    },
    "3200x2400": {
        "seq1": [0.003, 0.003, 0.003, 0.003],
        "parallel": [51.141, 28.483, 18.466, 13.478],
        "seq2": [0.008, 1.224, 1.303, 1.654],
        "std": [3.55, 1.66, 0.89, 0.50],
        "speedup": [1.00, 1.72, 2.59, 3.38]
    },
    "6400x4800": {
        "seq1": [0.000, 0.000, 0.003, 0.004],
        "parallel": [0.000, 0.000, 172.707, 130.054],
        "seq2": [0.000, 0.000, 5.473, 7.071],
        "std": [0.00, 0.00, 37.45, 42.19],
        "speedup": [0.00, 0.00, 0.00, 0.00]  # N/A values
    }
}

C_SEQ1 = "#e53935" 
C_SEQ2 = "#ffb300" 
C_PAR  = "#76ff03" 
x_indices = np.arange(len(nodes_list))

# FIGURE 1: MULTI-PANEL STACKED RUNTIME CHARTS
fig, axes = plt.subplots(1, 6, figsize=(18, 5.5))
for i, res in enumerate(resolutions):
    ax = axes[i]
    s1, par, s2 = np.array(data[res]["seq1"]), np.array(data[res]["parallel"]), np.array(data[res]["seq2"])
    b1 = ax.bar(x_indices, s1, color=C_SEQ1, edgecolor='black', linewidth=0.7, width=0.6)
    b2 = ax.bar(x_indices, s2, bottom=s1, color=C_SEQ2, edgecolor='black', linewidth=0.7, width=0.6)
    b3 = ax.bar(x_indices, par, bottom=s1+s2, color=C_PAR, edgecolor='black', linewidth=0.7, width=0.6)
    ax.set_title(res, fontsize=11, pad=10)
    ax.set_xticks(x_indices)
    ax.set_xticklabels(nodes_list)
    ax.set_xlabel("Nodes [#]", fontsize=10)
    ax.set_ylabel("Runtime [s]", fontsize=10)
    ax.tick_params(direction='in', top=True, right=True)
    if i == 4:
        ax.legend([b1, b2, b3], ["1st seq. part", "2nd seq. part", "Par. part"], frameon=False, loc="upper right", fontsize=9)
plt.tight_layout()
plt.savefig("amdahl_stacked_runtimes.png", dpi=300)

# FIGURE 2: STANDARD DEVIATION ANALYSIS
plt.figure(figsize=(10, 5))
plotted_resolutions, markers = ["1600x1200", "3200x2400", "6400x4800"], ['o', 's', '^']
for res, marker in zip(plotted_resolutions, markers):
    stds = data[res]["std"]
    valid_nodes = [nodes_list[j] for j in range(4) if (res != "6400x4800" or nodes_list[j] >= 4)]
    valid_stds = [stds[j] for j in range(4) if (res != "6400x4800" or nodes_list[j] >= 4)]
    plt.plot(valid_nodes, valid_stds, marker=marker, linewidth=2, markersize=8, label=f"{res} ($\pm\sigma$)")
plt.title("Run-to-Run Performance Variability (Standard Deviation)", fontsize=12, pad=12)
plt.xlabel("Number of Distributed Nodes", fontsize=11)
plt.ylabel("Standard Deviation [seconds]", fontsize=11)
plt.xticks(nodes_list)
plt.grid(True, linestyle="--", alpha=0.5)
plt.legend(fontsize=10)
plt.tight_layout()
plt.savefig("benchmark_std_deviation.png", dpi=300)

# FIGURE 3: MULTI-PANEL SPEEDUP CHARTS (Matching user image layout)
fig, axes = plt.subplots(1, 6, figsize=(18, 5.5))
for i, res in enumerate(resolutions):
    ax = axes[i]
    speedups = data[res]["speedup"]
    bars = ax.bar(x_indices, speedups, color="#bdbdbd", edgecolor='black', linewidth=0.7, width=0.6)
    ax.set_title(res, fontsize=11, pad=10)
    ax.set_xticks(x_indices)
    ax.set_xticklabels(nodes_list)
    ax.set_xlabel("Nodes [#]", fontsize=10)
    ax.set_ylabel("Speedup", fontsize=10)
    ax.set_ylim(0, 5)
    ax.tick_params(direction='in', top=True, right=True)
    
    for j, bar in enumerate(bars):
        val = speedups[j]
        if val > 0:
            val_str = f"{val:.2f}" if val == 1.0 or val >= 1.0 else f".{int(val*100)}"
            ax.text(bar.get_x() + bar.get_width()/2., val + 0.08, val_str, ha='center', va='bottom', fontsize=10)
        else:
            ax.text(bar.get_x() + bar.get_width()/2., 0.1, "N/A", ha='center', va='bottom', fontsize=10)
plt.tight_layout()
plt.savefig("amdahl_speedups.png", dpi=300)