# hr_proxy.py
import os
import requests
from typing import List, Dict, Optional, TypedDict
from dotenv import load_dotenv
import time
from datetime import datetime

class PersonDict(TypedDict):
    id: int
    first_name: str
    last_name: str
    email: str
    department: str
    role: str
    created_at: str  # YYYY-MM-DD HH:MM:SS
    updated_at: str  # YYYY-MM-DD HH:MM:SS

class EntityDict(TypedDict):
    id: int
    name: str
    description: str
    entity_type: str
    connectivity: float
    vulnerability_score: float
    risk_score: float
    created_at: str
    updated_at: str

class AssessmentDict(TypedDict):
    id: int
    person_id: int
    awareness: float
    conscientiousness: float
    neuroticism: float
    stress: float
    risk_tolerance: float
    created_at: str
    updated_at: str

class RelationshipDict(TypedDict):
    id: int
    parent_id: int
    parent_type: str
    child_id: int
    child_type: str
    relationship_type: str
    created_at: str
    updated_at: str

load_dotenv()

hrApiUrl = os.getenv("HR_API_URL")

class HRDataProxy:
    """
    A proxy class for accessing HR API endpoints.
    
    This class encapsulates all API calls to retrieve data from the HR backend.
    It exposes methods to get persons, entities, psychometric assessments,
    relationships, and clusters based on provided arguments.
    """
    
    def __init__(self, base_url: str = hrApiUrl, cache_ttl: int = 300):
        """
        Initialize the proxy with the base URL of your HR API.
        
        :param base_url: Base URL for the HR API (e.g., "http://your-backend-url/api")
        """
        self.base_url = base_url.rstrip('/')
        self._cache = {}           # va ţine răspunsul și timestamp-ul
        self._cache_ttl = cache_ttl
    
    def _get_cached(self, key, fetch_fn):
        entry = self._cache.get(key)
        now   = time.time()
        if entry and now - entry['ts'] < self._cache_ttl:
            return entry['value']
        # altfel chemi HTTP-ul și salvezi în cache
        value = fetch_fn()
        self._cache[key] = {'value': value, 'ts': now}
        return value

    def clear_cache(self):
        """Șterge tot cache-ul manual (sau când detectezi update în HR)."""
        self._cache.clear()

    def get_persons(self) -> List[PersonDict]:
        """
        Retrieve all persons from the HR API.
        
        :return: A list of dictionaries, each representing a person.
        :raises: requests.HTTPError if the request fails.
        """
        # url = f"{self.base_url}/persons"
        # response = requests.get(url)
        # response.raise_for_status()
        # return response.json()
        return self._get_cached("persons", lambda: requests.get(f"{self.base_url}/persons").json())
    def get_entities(self) -> List[EntityDict]:
        """
        Retrieve all entities from the HR API.
        
        :return: A list of dictionaries, each representing an entity.
        :raises: requests.HTTPError if the request fails.
        """
        # url = f"{self.base_url}/entities"
        # response = requests.get(url)
        # response.raise_for_status()
        # return response.json()
        return self._get_cached("entities", lambda: requests.get(f"{self.base_url}/entities").json())
    
    def get_psychometric_assessments(self, person_id: Optional[int] = None) -> List[AssessmentDict]:
        """
        Retrieve psychometric assessments.
        
        If person_id is provided, only return assessments for that person.
        
        :param person_id: Optional integer person ID to filter the assessments.
        :return: A list of dictionaries with assessment data.
        :raises: requests.HTTPError if the request fails.
        """
        # url = f"{self.base_url}/psychometric_assessments"
        # params = {}
        # if person_id is not None:
        #     params["person_id"] = person_id
        # response = requests.get(url, params=params)
        # response.raise_for_status()
        # return response.json()
        if person_id is not None:
            return self._get_cached(f"assessments_{person_id}", lambda: requests.get(f"{self.base_url}/psychometric_assessments", params={"person_id": person_id}).json())
        return self._get_cached("assessments", lambda: requests.get(f"{self.base_url}/psychometric_assessments").json())
    
    def get_relationships(self) -> List[RelationshipDict]:
        """
        Retrieve all relationships from the HR API.
        
        :return: A list of dictionaries, each representing a relationship.
        :raises: requests.HTTPError if the request fails.
        """
        # url = f"{self.base_url}/relationships"
        # response = requests.get(url)
        # response.raise_for_status()
        # return response.json()
        return self._get_cached("relationships", lambda: requests.get(f"{self.base_url}/relationships").json())
    
    def get_clustering(self, n_clusters: int, attributes: Optional[List[str]] = None) -> Dict:
        """
        Retrieve clusters based on provided parameters.
        
        :param n_clusters: Number of clusters to compute.
        :param attributes: Optional list of attribute names to use for clustering.
        :return: A dictionary mapping cluster labels to arrays of assessment objects.
        :raises: requests.HTTPError if the request fails.
        """
        url = f"{self.base_url}/clustering"
        params = {"n_clusters": n_clusters}
        if attributes:
            # If attributes is provided, include them as repeated query parameters.
            for attr in attributes:
                params.setdefault("attributes", []).append(attr)
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    def delete_person(self, person_id: int) -> Dict:
        """
        Delete a person by their ID.
        
        :param person_id: The ID of the person to delete.
        :return: The JSON response from the API.
        :raises: requests.HTTPError if the request fails.
        """
        url = f"{self.base_url}/persons/{person_id}"
        response = requests.delete(url)
        response.raise_for_status()
        self.clear_cache()  # Clear cache after deletion
        return response.json()
    
    def delete_entity(self, entity_id: int) -> Dict:
        """
        Delete an entity by its ID.
        
        :param entity_id: The ID of the entity to delete.
        :return: The JSON response from the API.
        :raises: requests.HTTPError if the request fails.
        """
        url = f"{self.base_url}/entities/{entity_id}"
        response = requests.delete(url)
        response.raise_for_status()
        self.clear_cache()
        return response.json()
    
    # You can add additional methods for create/update operations or risk simulation here.
    
    def __str__(self):
        return f"HRDataProxy(base_url={self.base_url})"

# Example usage:
if __name__ == "__main__":
    # Replace with your actual HR API base URL.
    proxy = HRDataProxy()
    
    try:
        persons = proxy.get_persons()
        entities = proxy.get_entities()
        assessments = proxy.get_psychometric_assessments()
        relationships = proxy.get_relationships()
        clusters = proxy.get_clustering(n_clusters=3, attributes=["awareness", "stress", "neuroticism"])
        
        print("Persons:", persons[:2])  # print first 2 for brevity
        print("Entities:", entities[:2])
        print("Assessments:", assessments[:2])
        print("Relationships:", relationships[:2])
        print("Clusters:", clusters)
    except requests.HTTPError as e:
        print("HTTP error occurred:", e)
    except Exception as ex:
        print("An error occurred:", ex)
