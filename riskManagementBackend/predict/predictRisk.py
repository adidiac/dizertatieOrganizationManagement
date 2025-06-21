# predict_attack_risk.py
import numpy as np
import pickle
import os

relative_path = os.path.dirname(__file__)
model_filename =  os.path.join(relative_path, "attack_model.pkl")

def load_model():
    if not os.path.exists(model_filename):
        raise FileNotFoundError(f"Model file {model_filename} does not exist. Train the model first.")
    with open(model_filename, "rb") as f:
        model = pickle.load(f)
    return model

def predict_attack_risk(attributes, attack_type):
    """
    Given a list or array of 6 attributes in the following order:
      [awareness, conscientiousness, stress, neuroticism, risk_tolerance, connectivity]
    and a target attack type (e.g., "phishing", "social_engineering", "ransomware", or "none"),
    this function returns the predicted probability that the person is susceptible to that attack.
    """
    model = load_model()
    X_new = np.array(attributes).reshape(1, -1)
    # Get the predicted probabilities for all classes.
    prob_array = model.predict_proba(X_new)[0]
    # Get the list of class labels (order is given by model.classes_)
    class_labels = model.classes_
    # Find the probability corresponding to the specified attack_type.
    try:
        index = list(class_labels).index(attack_type)
    except ValueError:
        raise ValueError(f"Attack type '{attack_type}' not found. Available types: {class_labels}")
    risk_probability = prob_array[index]
    return risk_probability

if __name__ == "__main__":
    # Example usage:
    # Suppose we have a sample assessment with these attribute values:
    # (awareness, conscientiousness, stress, neuroticism, risk_tolerance, connectivity)
    sample_attributes = [0.25, 0.7, 0.8, 0.65, 0.35, 0.9]
    # Let's predict risk for phishing:
    target_attack = "ransomware"
    risk_prob = predict_attack_risk(sample_attributes, target_attack)
    print(f"Predicted susceptibility probability for {target_attack}: {risk_prob:.2f}")
