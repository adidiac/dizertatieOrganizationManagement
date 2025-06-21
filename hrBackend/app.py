import os
import json
import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from azure_service import AzureBlobService
from database.dao import HRDatabase
from ai_client import extract_psychometrics  # your extraction function
from clustering_client import call_clustering_service, fetch_assessments

from flask_cors import CORS  # Import CORS
# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

CORS(app)  # Enable CORS for all routes
# Instantiate services
azure_service = AzureBlobService()
# Use the Railway MySQL URL from environment
CONNECTION_URL = os.getenv("AZURE_SQL_URL")

RISK_API_URL = os.getenv("RISK_API_URL", "http://localhost:5007")

hr_db = HRDatabase(CONNECTION_URL, db_name="hr")

def clear_risk_cache():
    """
    Clear the cache of the Risk Rest API by calling the endpoint.
    """
    try:
        response = requests.post(f"{RISK_API_URL}/api/clear_cache")
        if response.status_code == 200:
            return {"message": "Cache cleared successfully."}
        else:
            return {"error": "Failed to clear cache."}, response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Azure SAS Route (as before)
# ---------------------------
@app.route("/api/azure/sas", methods=["GET"])
def get_sas_url():
    try:
        sas_url = azure_service.get_container_sas_url(expiry_minutes=60)
        return jsonify({"sas_url": sas_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# AI Extraction from File Route (as before)
# ---------------------------
@app.route("/api/extract_from_file", methods=["POST"])
def extract_from_file():
    """
    Expects JSON payload with:
      - person_id: integer
      - file_url: URL string pointing to the file in Azure Blob Storage
      - method: extraction method ('model', 'prompt', or 'azure'); optional, defaults to 'model'
    """
    data = request.get_json()
    person_id = data.get("person_id")
    file_url = data.get("file_url")
    method = data.get("method", "model").lower()

    if not person_id or not file_url:
        return jsonify({"error": "Missing person_id or file_url"}), 400

    try:
        response = requests.get(file_url)
        response.raise_for_status()
        file_content = response.text  # assuming the file is plain text
    except Exception as e:
        return jsonify({"error": f"Failed to download file: {e}"}), 500

    try:
        extraction_result = extract_psychometrics(file_content, method)
    except Exception as e:
        return jsonify({"error": f"AI extraction failed: {e}"}), 500

    try:
        new_id = hr_db.insert_psychometric_assessment(
            person_id,
            extraction_result.get("awareness", 0),
            extraction_result.get("conscientiousness", 0),
            extraction_result.get("stress", 0),
            extraction_result.get("neuroticism", 0),
            extraction_result.get("risk_tolerance", 0)
        )
    except Exception as e:
        return jsonify({"error": f"Failed to insert assessment: {e}"}), 500

    return jsonify({
        "message": "Extraction and insertion successful",
        "assessment_id": new_id,
        "extraction_result": extraction_result
    })

@app.route("/api/persons/<int:person_id>", methods=["DELETE"])
def delete_person(person_id):
    try:
        print(f"Deleting person with ID: {person_id}")
        hr_db.delete_person(person_id)
        clear_risk_cache()  # Clear cache after deletion
        return jsonify({"message": "Person deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/entities/<int:entity_id>", methods=["DELETE"])
def delete_entity(entity_id):
    try:
        print(f"Deleting entity with ID: {entity_id}")
        hr_db.delete_entity(entity_id)
        clear_risk_cache()  # Clear cache after deletion
        return jsonify({"message": "Entity deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/psychometric_assessments", methods=["GET"])
def get_psychometric_assessments():
    # Get the person_id query parameter (as a string)
    person_id = request.args.get("person_id")
    try:
        # Retrieve all assessments using your DAO method.
        assessments = hr_db.get_all_psychometric_assessments()
        # If a person_id was provided, filter the assessments.
        if person_id:
            assessments = [a for a in assessments if str(a.person_id) == person_id]
        # Convert each assessment to a dictionary.
        result = []
        for a in assessments:
            result.append({
                "id": a.id,
                "person_id": a.person_id,
                "awareness": a.awareness,
                "conscientiousness": a.conscientiousness,
                "stress": a.stress,
                "neuroticism": a.neuroticism,
                "risk_tolerance": a.risk_tolerance,
                "created_at": str(a.created_at),
                "updated_at": str(a.updated_at)
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------
# Person Routes
# ---------------------------
@app.route("/api/persons", methods=["GET"])
def get_persons():
    try:
        persons = hr_db.get_all_persons()
        # Convert Person objects to dicts
        result = []
        for p in persons:
            result.append({
                "id": p.id,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "email": p.email,
                "role": p.role,
                "department": p.department,
                "created_at": str(p.created_at),
                "updated_at": str(p.updated_at)
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/persons", methods=["POST"])
def create_person():
    data = request.get_json()
    required_fields = ["first_name", "last_name", "email", "role", "department"]
    
    try:
        new_id = hr_db.insert_person(
            data["first_name"],
            data["last_name"],
            data["email"],
            data["role"],
            data["department"]
        )
        clear_risk_cache()  # Clear cache after insertion
        return jsonify({"message": "Person created", "id": new_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Entity Routes (Assuming DAO has insert_entity and get_all_entities)
# ---------------------------
@app.route("/api/entities", methods=["GET"])
def get_entities():
    try:
        entities = hr_db.get_all_entities()  # Implement this method in your DAO
        result = []
        for e in entities:
            result.append({
                "id": e.id,
                "name": e.name,
                "entity_type": e.entity_type,
                "description": e.description,
                "vulnerability_score": e.vulnerability_score,
                "connectivity": e.connectivity,
                "risk_score": e.risk_score,
                "created_at": str(e.created_at),
                "updated_at": str(e.updated_at)
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/entities", methods=["POST"])
def create_entity():
    data = request.get_json()
    required_fields = ["name", "entity_type", "description"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing required fields. Required: {required_fields}"}), 400
    try:
        new_id = hr_db.insert_entity(   # Implement this method in your DAO
            data["name"],
            data["entity_type"],
            data["description"],
            data.get("vulnerability_score", 0),
            data.get("connectivity", 0),
            data.get("risk_score", 0)
        )
        clear_risk_cache()  # Clear cache after insertion
        return jsonify({"message": "Entity created", "id": new_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Relationship Routes (Assuming DAO has insert_relationship and get_all_relationships)
# ---------------------------
@app.route("/api/relationships", methods=["GET"])
def get_relationships():
    try:
        relationships = hr_db.get_all_relationships()  # Implement in your DAO
        result = []
        for r in relationships:
            result.append({
                "id": r.id,
                "parent_id": r.parent_id,
                "parent_type": r.parent_type,
                "child_id": r.child_id,
                "child_type": r.child_type,
                "relationship_type": r.relationship_type,
                "created_at": str(r.created_at),
                "updated_at": str(r.updated_at)
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/relationships", methods=["POST"])
def create_relationship():
    data = request.get_json()
    required_fields = ["parent_id", "parent_type", "child_id", "child_type", "relationship_type"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing required fields. Required: {required_fields}"}), 400
    try:
        new_id = hr_db.insert_relationship(  # Implement in your DAO
            data["parent_id"],
            data["parent_type"],
            data["child_id"],
            data["child_type"],
            data["relationship_type"]
        )
        clear_risk_cache()  # Clear cache after insertion
        return jsonify({"message": "Relationship created", "id": new_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------------------
# Clustering Route
# ---------------------------
@app.route("/api/clustering", methods=["GET"])
def run_clustering():
    try:
        assessments = fetch_assessments()
        n_clusters = int(request.args.get("n_clusters", 3))
        attributes = request.args.getlist("attributes")
        if not attributes:
            attributes = None
        clusters = call_clustering_service(assessments, n_clusters, attributes)
        return jsonify(clusters)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5004))
    app.run(debug=True, port=port)
