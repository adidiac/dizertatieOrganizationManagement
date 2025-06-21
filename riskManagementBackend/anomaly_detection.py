# anomaly_detection.py
import numpy as np
from sklearn.ensemble import IsolationForest

def detect_anomalies(risk_scores, contamination=0.1):
    """
    Detect anomalies in a list of risk scores using IsolationForest.
    
    Parameters:
      - risk_scores: List[float] of composite risk scores.
      - contamination: Expected fraction of outliers.
    
    Returns:
      A list of indices corresponding to risk_scores flagged as anomalous.
    """
    risk_array = np.array(risk_scores).reshape(-1, 1)
    model = IsolationForest(contamination=contamination, random_state=42)
    preds = model.fit_predict(risk_array)
    # IsolationForest returns -1 for anomalies.
    anomaly_indices = [i for i, pred in enumerate(preds) if pred == -1]
    return anomaly_indices
