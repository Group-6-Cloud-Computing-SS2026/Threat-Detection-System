import numpy as np
import matplotlib.pyplot as plt

# -------------------------------------------------------
# YOLOv8n Performance Results
# -------------------------------------------------------

classes = [
    "Background",
    "Blunt\nWeapon",
    "Edged\nWeapon",
    "Fire",
    "Firearm",
    "Person"
]

metrics = ["Precision", "Recall", "mAP@50", "mAP@50-95"]

precision = np.array([0.753,0.910,0.848,0.891,0.902,0.843])
recall    = np.array([1.000,0.856,0.788,0.776,0.820,0.607])
map50     = np.array([0.980,0.916,0.860,0.849,0.889,0.723])
map95     = np.array([0.980,0.735,0.548,0.502,0.649,0.458])

data = np.vstack([precision, recall, map50, map95]).T

plt.rcParams.update({
    "font.family":"DejaVu Sans",
    "font.size":14,
    "axes.titlesize":22,
    "axes.labelsize":16,
    "legend.fontsize":13
})

###########################################################################
# 1. GROUPED BAR CHART
###########################################################################

fig, ax = plt.subplots(figsize=(14,8))

y = np.arange(len(classes))
h = 0.18

colors = [
    "#4472C4",
    "#70AD47",
    "#ED7D31",
    "#A64D79"
]

ax.barh(y+1.5*h, precision, height=h, color=colors[0], label="Precision")
ax.barh(y+0.5*h, recall,    height=h, color=colors[1], label="Recall")
ax.barh(y-0.5*h, map50,     height=h, color=colors[2], label="mAP@50")
ax.barh(y-1.5*h, map95,     height=h, color=colors[3], label="mAP@50-95")

ax.set_xlim(0,1.05)
ax.set_yticks(y)
ax.set_yticklabels(classes)
ax.set_xlabel("Metric Value")

ax.grid(axis='x', alpha=0.3)

for metric,offset in zip([precision,recall,map50,map95],[1.5*h,0.5*h,-0.5*h,-1.5*h]):
    for i,v in enumerate(metric):
        ax.text(v+0.01,i+offset,f"{v:.2f}",va='center',fontsize=11)

ax.legend()

plt.tight_layout()

plt.savefig("Figure1_BarChart.png",dpi=600)
plt.savefig("Figure1_BarChart.pdf")
plt.savefig("Figure1_BarChart.svg")

###########################################################################
# 2. RADAR CHART
###########################################################################

N = len(metrics)

angles = np.linspace(0,2*np.pi,N,endpoint=False)
angles = np.concatenate((angles,[angles[0]]))

fig = plt.figure(figsize=(9,9))
ax = plt.subplot(111,polar=True)

palette = plt.cm.tab10(np.linspace(0,1,len(classes)))

for i,c in enumerate(classes):

    values = np.concatenate((data[i],[data[i,0]]))

    ax.plot(angles,values,
            linewidth=2,
            label=c.replace("\n"," "),
            color=palette[i])

    ax.fill(angles,values,
            alpha=0.10,
            color=palette[i])

ax.set_xticks(angles[:-1])
ax.set_xticklabels(metrics)

ax.set_ylim(0,1.0)

ax.legend(loc="upper right",bbox_to_anchor=(1.30,1.15))

plt.tight_layout()

plt.savefig("Figure2_Radar.png",dpi=600)
plt.savefig("Figure2_Radar.pdf")
plt.savefig("Figure2_Radar.svg")

###########################################################################
# 3. HEATMAP
###########################################################################

fig, ax = plt.subplots(figsize=(8,6))

im = ax.imshow(data,
               cmap="viridis",
               aspect="auto",
               vmin=0.4,
               vmax=1.0)

ax.set_xticks(np.arange(len(metrics)))
ax.set_xticklabels(metrics)

ax.set_yticks(np.arange(len(classes)))
ax.set_yticklabels(classes)

plt.setp(ax.get_xticklabels(), rotation=20, ha="right")

for i in range(data.shape[0]):
    for j in range(data.shape[1]):
        ax.text(j,i,
                f"{data[i,j]:.2f}",
                ha="center",
                va="center",
                color="white",
                fontsize=12,
                fontweight='bold')

cbar = plt.colorbar(im)
cbar.set_label("Performance Score")


plt.tight_layout()

plt.savefig("Figure3_Heatmap.png",dpi=600)
plt.savefig("Figure3_Heatmap.pdf")
plt.savefig("Figure3_Heatmap.svg")

###########################################################################

plt.show()