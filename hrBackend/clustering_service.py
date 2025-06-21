# clustering_service.py
from abc import ABC, abstractmethod
import numpy as np
from sklearn.cluster import KMeans

class BaseClusteringService(ABC):
    @abstractmethod
    def cluster(self, data, attributes=None, **kwargs):
        """
        Given a list of data items, cluster them and return a mapping from
        cluster label to the corresponding items.
        """
        pass

class KMeansClusteringService(BaseClusteringService):
    def __init__(self, n_clusters=3, random_state=42):
        self.n_clusters = n_clusters
        self.random_state = random_state

    def cluster(self, data, attributes=None, **kwargs):
        """
        Clusters the input data using only the specified attributes.
        Expects each data item (dict or object) to have numeric values for each attribute.
        
        :param data: List of items (either dicts or objects).
        :param attributes: List of attribute names to use. If None, uses all five defaults.
        :return: A dictionary mapping cluster labels (as strings) to lists of items.
        """
        # Default attributes if not provided
        if attributes is None:
            attributes = ["awareness", "conscientiousness", "stress", "neuroticism", "risk_tolerance"]
        
        features = []
        for item in data:
            # Support both dicts and objects with attributes
            if isinstance(item, dict):
                vector = [float(item.get(attr, 0)) for attr in attributes]
            else:
                vector = [float(getattr(item, attr, 0)) for attr in attributes]
            features.append(vector)
        features = np.array(features)
        kmeans = KMeans(n_clusters=self.n_clusters, random_state=self.random_state)
        labels = kmeans.fit_predict(features)
        clusters = {}
        for idx, label in enumerate(labels):
            clusters.setdefault(str(label), []).append(data[idx])
        return clusters
