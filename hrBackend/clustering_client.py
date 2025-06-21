from dotenv import load_dotenv

import os
import json
from database.dao import HRDatabase
from clustering_service import KMeansClusteringService
from flask import Flask, jsonify

load_dotenv()

# Replace with your actual Railway MySQL URL.
CONNECTION_URL = os.getenv("AZURE_SQL_URL")

def fetch_assessments():
    db = HRDatabase(CONNECTION_URL, db_name="hr")
    assessments = db.get_all_psychometric_assessments()  # List of PsychometricAssessment objects
    data = []
    for a in assessments:
        # Get the person details using the DAO method.
        person = db.get_person_by_id(a.person_id)
        # Build the assessment dictionary including extra details if available.
        data_item = {
            "person_id": a.person_id,
            "awareness": a.awareness,
            "conscientiousness": a.conscientiousness,
            "stress": a.stress,
            "neuroticism": a.neuroticism,
            "risk_tolerance": a.risk_tolerance
        }
        if person:
            data_item["first_name"] = person.first_name
            data_item["last_name"] = person.last_name
            data_item["email"] = person.email
            data_item["role"] = person.role
            data_item["department"] = person.department
        data.append(data_item)
    return data


def call_clustering_service(data, n_clusters=3, attributes=None):
    try:
        clustering_service = KMeansClusteringService(n_clusters=n_clusters)
        clusters = clustering_service.cluster(data, attributes=attributes)
        return clusters
    # Call the clustering 
    except Exception as e:
        print(f"Error in clustering service: {e}")
        return None

def main():
    assessments = fetch_assessments()
    # Example: cluster by only 'awareness' and 'stress'
    clusters = call_clustering_service(assessments, n_clusters=3, attributes=["awareness", "stress"])
    print("Clusters based on awareness and stress:")
    print(json.dumps(clusters, indent=2))
    
    # Default clustering (using all five attributes)
    clusters_all = call_clustering_service(assessments, n_clusters=3)
    print("Clusters based on all attributes:")
    print(json.dumps(clusters_all, indent=2))

if __name__ == '__main__':
    main()
