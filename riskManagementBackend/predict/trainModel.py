# train_attack_model.py
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import pickle
import os

# ----------------------------
# Step 1: Generate Synthetic Data and Save to CSV
# ----------------------------

def generate_synthetic_attack_data(n_samples=500, random_state=42):
    np.random.seed(random_state)
    
    # Generate attribute values in range [0, 1]
    awareness = np.random.uniform(0.2, 1.0, n_samples)           # generally moderate to high
    conscientiousness = np.random.uniform(0.3, 1.0, n_samples)     # moderate to high
    stress = np.random.uniform(0.0, 1.0, n_samples)                # can vary widely
    neuroticism = np.random.uniform(0.0, 1.0, n_samples)           # can vary widely
    risk_tolerance = np.random.uniform(0.0, 1.0, n_samples)        # can vary widely
    connectivity = np.random.uniform(0.0, 1.0, n_samples)          # measure of how “central” the person is

    # For each sample, compute a score for each attack type based on risk factors.
    # (The coefficients below are chosen arbitrarily for demonstration.)
    phishing_score = (
        -1.2 * awareness +
         1.0 * stress +
         1.0 * neuroticism -
         0.8 * risk_tolerance +
         np.random.normal(0, 0.05, n_samples)
    )
    social_engineering_score = (
         -1.0 * conscientiousness +
          1.0 * stress +
          1.0 * neuroticism +
          np.random.normal(0, 0.05, n_samples)
    )
    ransomware_score = (
         -1.2 * awareness +
          1.0 * connectivity +
          1.0 * stress +
          np.random.normal(0, 0.05, n_samples)
    )
    
    # Choose the attack type with the highest score if that score is above a threshold;
    # otherwise label it as "none".
    labels = []
    for ps, ses, rs in zip(phishing_score, social_engineering_score, ransomware_score):
        scores = {"phishing": ps, "social_engineering": ses, "ransomware": rs}
        best_attack = max(scores, key=scores.get)
        # Use a threshold: if the best score is less than 0.0, label as "none"
        if scores[best_attack] < 0.0:
            labels.append("none")
        else:
            labels.append(best_attack)
    
    data = pd.DataFrame({
        'awareness': awareness,
        'conscientiousness': conscientiousness,
        'stress': stress,
        'neuroticism': neuroticism,
        'risk_tolerance': risk_tolerance,
        'connectivity': connectivity,
        'attack_type': labels
    })
    return data

csv_filename = "attack_assessments.csv"
if not os.path.exists(csv_filename):
    print("Generating synthetic CSV data...")
    df = generate_synthetic_attack_data(n_samples=500)
    df.to_csv(csv_filename, index=False)
    print(f"Data saved to {csv_filename}")
else:
    print(f"CSV file {csv_filename} already exists. Loading data...")
    df = pd.read_csv(csv_filename)

# ----------------------------
# Step 2: Train a Multi-class Classification Model
# ----------------------------
# Features: awareness, conscientiousness, stress, neuroticism, risk_tolerance, connectivity
X = df[['awareness', 'conscientiousness', 'stress', 'neuroticism', 'risk_tolerance', 'connectivity']].values
y = df['attack_type'].values

# For multi-class classification, use LogisticRegression with multinomial option
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LogisticRegression(multi_class='multinomial', solver='lbfgs', max_iter=1000)
model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
print("Classification Report:")
print(classification_report(y_test, y_pred))

# Save the model
model_filename = "attack_model.pkl"
with open(model_filename, "wb") as f:
    pickle.dump(model, f)
print(f"Trained model saved to {model_filename}")
