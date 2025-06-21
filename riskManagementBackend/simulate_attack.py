import networkx as nx
from proxyHR import HRDataProxy
from risk_analysis import compute_all_person_risks

def build_risk_graph(proxy:HRDataProxy,attack_type="phishing"):
    risks = compute_all_person_risks(proxy,attack_type)
    G=nx.DiGraph(); lookup={}
    for r in risks:
      nid=str(r["person_id"]); lookup[nid]=r["composite_risk"]
      G.add_node(nid,**r, type="person")
    for e in proxy.get_entities():
      nid=f"entity_{e['id']}"; lookup[nid]=e.get("risk_score",0)
      G.add_node(nid,**e, type="entity")
    for r in proxy.get_relationships():
      src = str(r["parent_id"]) if r["parent_type"]=="person" else f"entity_{r['parent_id']}"
      tgt = str(r["child_id"])  if r["child_type"]=="person"  else f"entity_{r['child_id']}"
      w=float(r.get("relationship_weight",1))
      G.add_edge(src,tgt,weight=w)
    return G,lookup

def simulate_attack(initial_node,G,risk_lookup,threshold=0.5):
    compromised=set(); log=[]
    queue=[(initial_node,None)]
    compromised.add(initial_node)
    while queue:
      cur,parent=queue.pop(0)
      if parent:
        e_w = G.edges[parent,cur]["weight"]
        log.append({"from":parent,"to":cur,"edge_weight":e_w,"target_risk":risk_lookup[cur]})
      for nxt in G.successors(cur):
        if nxt not in compromised and risk_lookup.get(nxt,0)>=threshold:
          compromised.add(nxt)
          queue.append((nxt,cur))
    return compromised,log
