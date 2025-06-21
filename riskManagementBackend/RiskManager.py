from proxyHR import HRDataProxy
from risk_analysis import compute_all_person_risks
from simulate_attack import build_risk_graph, simulate_attack
from predict.predictRisk import predict_attack_risk
from anomaly_detection import detect_anomalies


class RiskManager:
    """
    Encapsulates risk operations using HR data.
    Uses HRDataProxy to fetch data, computes composite risk scores,
    simulates attack propagation, and predicts risk.
    """
    def __init__(self, hr_api_url: str):
        self.proxy = HRDataProxy(hr_api_url)
    
    def get_all_person_risks(self, attack_type="phishing"):
        return compute_all_person_risks(self.proxy, attack_type)
    
    def get_person_details(self, person_id, attack_type="phishing"):
        """Return the risk details for a single person (by ID)."""
        risks = compute_all_person_risks(self.proxy, attack_type=attack_type)
        # Ensure comparison using string IDs
        for r in risks:
            if str(r["person_id"]) == str(person_id):
                return r
        return None
    
    def simulate_attack(self, initial_node, attack_type="phishing", threshold=0.5):
        # Ensure the initial_node is a string.
        initial_node = str(initial_node)
        G, risk_lookup = build_risk_graph(self.proxy, attack_type)
        compromised, sim_log = simulate_attack(initial_node, G, risk_lookup, threshold)
        compromised_details = []
        for node in compromised:
            node_data = G.nodes[node]
            compromised_details.append({
                "id": node,
                "full_name": node_data.get("full_name"),
                "risk": node_data.get("risk")
            })
        return {"compromised": compromised_details, "simulation_log": sim_log}
    
    def predict_risk(self, attributes, attack_type="phishing"):
        return predict_attack_risk(attributes, attack_type)
    
    def get_graph(self, attack_type="phishing"):
        """Return graph data (nodes and links) for the dashboard."""
        # We use our own logic here (similar to the /api/graph route)
        persons = self.proxy.get_persons()
        entities = self.proxy.get_entities()
        relationships = self.proxy.get_relationships()
        
        # Compute risk breakdown for persons.
        person_risks = compute_all_person_risks(self.proxy, attack_type=attack_type)
        person_risk_map = { str(pr["person_id"]): pr for pr in person_risks }
        nodes = []
        links = []
        
        # Add person nodes.
        for person in persons:
            pid = str(person["id"])
            risk_data = person_risk_map.get(pid, {})
            nodes.append({
                "id": pid,
                "full_name": f"{person.get('first_name','')} {person.get('last_name','')}".strip(),
                "type": "person",
                "department": person.get("department", "Unknown"),
                "risk": risk_data.get("composite_risk", 0),
                "assessment": risk_data.get("assessment", {}),
                "related_entities": risk_data.get("related_entities", []),
                "email": person.get("email", "")
            })
        
        # Add entity nodes (prefix IDs with "entity_").
        for entity in entities:
            nodes.append({
                "id": f"entity_{entity['id']}",
                "full_name": entity.get("name", "Entity"),
                "type": "entity",
                "entity_type": entity.get("entity_type", "unknown"),
                "risk": entity.get("risk_score", 0),
                "vulnerability": entity.get("vulnerability_score", 0)
            })
        
        # Process relationships for all combinations.
        for rel in relationships:
            parent_type = rel["parent_type"]
            child_type = rel["child_type"]
            if parent_type == "person":
                source = str(rel["parent_id"])
            else:
                source = f"entity_{rel['parent_id']}"
            if child_type == "person":
                target = str(rel["child_id"])
            else:
                target = f"entity_{rel['child_id']}"
            weight = float(rel.get("relationship_weight", 1))
            links.append({
                "source": source,
                "target": target,
                "weight": weight
            })
        return {"nodes": nodes, "links": links}
    
    def get_anomaly_alerts(self, attack_type="phishing", contamination=0.1):
        risks = self.get_all_person_risks(attack_type)
        risk_scores = [r["composite_risk"] for r in risks]
        anomaly_indices = detect_anomalies(risk_scores, contamination)
        anomalies = [risks[i] for i in anomaly_indices]
        return anomalies