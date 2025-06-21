import os
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS

# Import your existing modules.
from bpmn_generator import build_bpmn_xml
from RiskManager import RiskManager
from proxyHR import HRDataProxy
from risk_analysis import compute_all_person_risks


import xml.etree.ElementTree as ET
from collections import deque
import networkx as nx

from proxyHR import HRDataProxy
from risk_analysis import compute_all_person_risks
from anomaly_detection import detect_anomalies
from llm_helper import call_llm_for_recommendation
from bpmn_generator import build_bpmn_xml

# ---------------------------
# Create the Flask App and Endpoints
# ---------------------------
app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize RiskManager with HR_API_URL from environment variables.
hr_api_url = os.getenv("HR_API_URL", "http://localhost:5004/api")
risk_manager = RiskManager(hr_api_url)
proxy = HRDataProxy(hr_api_url)

@app.route("/api/clear_cache", methods=["POST"])
def clear_cache():
    """
    Clear the cache of the HRDataProxy.
    """
    try:
        proxy.clear_cache()
        return jsonify({"message": "Cache cleared successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/person_risks", methods=["GET"])
def person_risks():
    attack_type = request.args.get("attack_type", "phishing")
    try:
        risks = risk_manager.get_all_person_risks(attack_type)
        return jsonify(risks)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/simulate_attack", methods=["POST"])
def simulate_attack_endpoint():
    data = request.get_json()
    initial_node = data.get("initial_node")
    threshold = data.get("threshold", 0.5)
    attack_type = data.get("attack_type", "phishing")
    if initial_node is None:
        return jsonify({"error": "Missing initial_node parameter."}), 400
    try:
        simulation_data = risk_manager.simulate_attack(initial_node, attack_type, threshold)
        return jsonify(simulation_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/predict_risk", methods=["POST"])
def predict_risk_endpoint():
    data = request.get_json()
    attributes = data.get("attributes")
    attack_type = data.get("attack_type", "phishing")
    if not attributes or len(attributes) != 6:
        return jsonify({"error": "Invalid input. 'attributes' must be a list of 6 numbers."}), 400
    try:
        risk_probability = risk_manager.predict_risk(attributes, attack_type)
        return jsonify({"predicted_risk": risk_probability})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/person_details/<int:person_id>", methods=["GET"])
def person_details_endpoint(person_id):
    try:
        details = risk_manager.get_person_details(person_id, attack_type="phishing")
        if not details:
            return jsonify({"error": "Person not found"}), 404
        return jsonify(details)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/relationships", methods=["GET"])
def relationships_endpoint():
    try:
        rels = risk_manager.proxy.get_relationships()
        return jsonify(rels)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/api/entities", methods=["GET"])
def entities_endpoint():
    try:
        entities = risk_manager.proxy.get_entities()
        return jsonify(entities)
    except Exception as e:
        print(f"Error fetching entities: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/persons", methods=["GET"])
def persons_endpoint():
    try:
        persons = risk_manager.proxy.get_persons()
        return jsonify(persons)
    except Exception as e:
        print(f"Error fetching persons: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/graph', methods=['GET'])
def graph_endpoint():
    attack_type = request.args.get("attack_type", "phishing")
    data = risk_manager.get_graph(attack_type)
    return jsonify(data)

@app.route('/api/diagram', methods=['GET'])
def diagram_endpoint():
    """
    Returns an XML-annotated BPMN diagram built from get_graph().
    Frontend can fetch this at GET /api/diagram and import directly.
    """
    graph = risk_manager.get_graph()
    xml   = build_bpmn_xml(graph['nodes'], graph['links'])
    return app.response_class(xml, mimetype='application/xml')

def parse_bpmn_to_graph(bpmn_xml: str) -> nx.DiGraph:
    """
    Parse BPMN XML into a directed NetworkX graph whose edges are sequenceFlows.
    """
    if isinstance(bpmn_xml, dict):
        # unwrap if someone POSTed the full payload by mistake
        bpmn_xml = bpmn_xml.get("bpmn_xml", "") or bpmn_xml.get("xml", "")
    xml_bytes = bpmn_xml.encode("utf-8") if isinstance(bpmn_xml, str) else bpmn_xml

    ns   = { "bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL" }
    root = ET.fromstring(xml_bytes)
    G    = nx.DiGraph()

    for seq in root.findall(".//bpmn:sequenceFlow", ns):
        s = seq.get("sourceRef")
        t = seq.get("targetRef")
        if s and t:
            # default weight = 1.0
            G.add_edge(s, t, weight=1.0)

    return G
# … (import-uri și alte rute)

@app.route("/api/simulate_flow", methods=["POST"])
def simulate_flow():
    """
    Payload așteptat:
    {
      "bpmn_xml": "<xml>…</xml>",
      "start_id": "Person_18",
      "end_id":   "Entity_5",
      "attack": {
         "type":      "phishing",
         "target_id": "Person_20",
         "threshold": 0.5
      }
    }
    Trimitem înapoi fiecare pas ca websocket 'simulation_step', iar la final
    un 'simulation_complete' cu lista de compromised/anomalies/recommendation.
    """
    data = request.get_json()

    # 1) Extragem xml și cele patru informații noi
    bpmn_xml = data.get("bpmn_xml", "")
    start_id = data.get("start_id", None)     # ex. "Person_18"
    end_id   = data.get("end_id",   None)     # ex. "Entity_5"
    attack   = data.get("attack", {})

    # 2) Din attack luăm target + threshold + type
    target_id   = attack.get("target_id")
    threshold   = attack.get("threshold", 0.5)
    attack_type = attack.get("type", "phishing")

    # 3) Construim graful BPMN (exact ca înainte)
    G = parse_bpmn_to_graph(bpmn_xml)

    # 4) Construim lookup‐uri de risc (persoane și entități)
    prs = compute_all_person_risks(proxy, attack_type=attack_type)
    risk_lookup = {}
    breakdown   = {}
    name_map    = {}

    # 4.1) Persoane
    for r in prs:
        pid = f"Person_{r['person_id']}"
        risk_lookup[pid] = r["composite_risk"]
        breakdown[pid]   = r
        name_map[pid]    = r["full_name"]

    # 4.2) Entități
    for e in proxy.get_entities():
        eid = f"Entity_{e['id']}"
        risk_lookup[eid] = e.get("risk_score", 0.0)
        breakdown[eid]   = e
        name_map[eid]    = e.get("name", "Entity")

    # 5) Detectăm anomalii (după cum făceai deja)
    anomalies_idx = detect_anomalies([r["composite_risk"] for r in prs])
    anomalies = [
        {
          "person_id": prs[i]["person_id"],
          "full_name": prs[i]["full_name"],
          "composite_risk": prs[i]["composite_risk"]
        }
        for i in anomalies_idx
    ]

    # 6) BFS-ul specific între start_id și end_id
    #    vom trimite un mesaj websocket pentru fiecare nod găsit pe cărarea minimă
    def bfs_path(s, t):
        """
        Returnează lista de noduri de la s la t (inclusiv), folosind BFS.
        Dacă nu există cale, returnează [].
        """
        if not s or not t:
            return []
        # Construcția listei de adiacență
        adj = {}
        # Inițial punem toate nodurile cunoscute (în shapeMap, dar aici avem tot G.nodes)
        for node in G.nodes():
            adj[node] = []
        # Adăugăm vecinii
        for (u, v, data_edge) in G.edges(data=True):
            if u in adj:
                adj[u].append(v)

        # BFS clasic
        prev = {s: None}
        queue = [s]
        while queue:
            u = queue.pop(0)
            if u == t:
                break
            for v in adj.get(u, []):
                if v not in prev:
                    prev[v] = u
                    queue.append(v)

        if t not in prev:
            return []
        # Reconstruim calea de la s la t
        path_nodes = []
        cur = t
        while cur is not None:
            path_nodes.insert(0, cur)
            cur = prev[cur]
        return path_nodes

    # 6.1) Găsim _acea_ succesiune de noduri dintre start și end
    path_sequence = bfs_path(start_id, end_id)

    # 6.2) Trimitem fiecare pas prin WebSocket
    step_no = 0
    for idx in range(len(path_sequence) - 1):
        src = path_sequence[idx]
        dst = path_sequence[idx + 1]

        step_no += 1
        w = G.edges[src, dst].get("weight", 1.0)
        rsk = risk_lookup.get(dst, 0.0)
        status = "compromised" if rsk >= threshold else "safe"
        # dacă nodul dst este compromis, îl adăugăm într‐o listă (dacă mai vreți să listați)
        
        socketio.emit("simulation_step", {
            "step":        step_no,
            "from":        src,
            "to":          dst,
            "from_name":   name_map.get(src, src),
            "to_name":     name_map.get(dst, dst),
            "edge_weight": w,
            "target_risk": rsk,
            "status":      status,
            "breakdown":   breakdown.get(dst, {})
        })

        # Pauză pentru animație
        socketio.sleep(1)

    # 7) După ce am parcurs toată calea (start → end), marcăm finalizarea
    compromised = [node for node in path_sequence 
                   if risk_lookup.get(node, 0.0) >= threshold]

    # 8) Pregătim prompt‐ul pentru LLM (exact ca înainte)
    prompt = (
        f"Compromised: {compromised}\n"
        f"Anomalies:    {anomalies}\n"
        f"Log:          (streamed above)\n"
        "Suggest actionable mitigation strategies:"
    )
    recommendation = call_llm_for_recommendation(prompt)

    # 9) Trimitem evenimentul 'simulation_complete'
    socketio.emit("simulation_complete", {
        "compromised":    compromised,
        "anomalies":      anomalies,
        "recommendation": recommendation
    })

    # 10) Returnăm și un răspuns HTTP normal (nu este chiar relevant, 
    #     ci mai important sunt mesajele WebSocket)
    return jsonify({
        "compromised":    compromised,
        "anomalies":      anomalies,
        "recommendation": recommendation
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5007))
    socketio.run(app, debug=True, port=5007)
 