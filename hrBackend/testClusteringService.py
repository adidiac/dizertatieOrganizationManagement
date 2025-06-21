import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from clustering_service import KMeansClusteringService

# 1. Generate synthetic psychometric data for testing
np.random.seed(42)
n_samples = 100
data = []
for i in range(n_samples):
    item = {
        "id": i,
        "awareness": np.random.uniform(0, 1),
        "conscientiousness": np.random.uniform(0, 1),
        "stress": np.random.uniform(0, 1),
        "neuroticism": np.random.uniform(0, 1),
        "risk_tolerance": np.random.uniform(0, 1)
    }
    data.append(item)

# 2. Cluster the data into 3 clusters
clustering_service = KMeansClusteringService(n_clusters=3, random_state=42)
clusters = clustering_service.cluster(data)

# 3. Prepare DataFrame with cluster labels
rows = []
for label, items in clusters.items():
    for it in items:
        row = it.copy()
        row["cluster"] = int(label)
        rows.append(row)
df = pd.DataFrame(rows)

# 4. 3D Scatter plot on three dimensions (awareness, stress, risk_tolerance) colored by cluster
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
for cluster_label in sorted(df["cluster"].unique()):
    subset = df[df["cluster"] == cluster_label]
    ax.scatter(
        subset["awareness"], 
        subset["stress"], 
        subset["risk_tolerance"], 
        label=f"Cluster {cluster_label}"
    )
ax.set_title("3D Clustering of Psychometric Profiles")
ax.set_xlabel("Awareness")
ax.set_ylabel("Stress")
ax.set_zlabel("Risk Tolerance")
ax.legend()
plt.tight_layout()
plt.show()
