import numpy as np
from proxyHR import HRDataProxy
from predict.predictRisk import predict_attack_risk

def compute_composite_risk_for_person(person, assessment, related_entities,
                                     weights=None, attack_type="phishing"):
    if weights is None:
        weights = {"psychometric":0.7,"entity":0.3}
    connectivity = assessment.get("connectivity",0.5)
    attrs = [
      assessment.get("awareness",0),
      assessment.get("conscientiousness",0),
      assessment.get("stress",0),
      assessment.get("neuroticism",0),
      assessment.get("risk_tolerance",0),
      connectivity
    ]
    psych_risk = predict_attack_risk(attrs,attack_type)
    # aggregate entity risk
    risk_sum=0; tot_w=0; details=[]
    for e in related_entities:
      v=e.get("vulnerability_score",0)
      c=e.get("connectivity",0.5)
      wgt=c; risk_sum+=v*wgt; tot_w+=wgt
      details.append({"entity_id":e["id"],"vulnerability":v,"connectivity":c,"weighted":v*wgt})
    ent_risk = (risk_sum/tot_w/10) if tot_w>0 else 0
    comp = weights["psychometric"]*psych_risk + weights["entity"]*ent_risk
    comp = max(0,min(comp,1))
    return {"psychometric_risk":psych_risk,"entity_risk":ent_risk,
            "entity_details":details,"weights":weights,"composite_risk":comp}

def compute_all_person_risks(proxy:HRDataProxy,attack_type="phishing"):
    persons = proxy.get_persons()
    asses   = proxy.get_psychometric_assessments()
    entities= proxy.get_entities()
    rels    = proxy.get_relationships()
    asm={a["person_id"]:a for a in asses}
    per_ent={}
    for r in rels:
      if r["parent_type"]=="person" and r["child_type"]=="entity":
        per_ent.setdefault(r["parent_id"],[]).append(
           next(e for e in entities if e["id"]==r["child_id"])
        )
    out=[]
    for p in persons:
      pid=p["id"]; a=asm.get(pid,{})
      ents=per_ent.get(pid,[])
      br=compute_composite_risk_for_person(p,a,ents,attack_type=attack_type)
      out.append({
        "person_id":pid,
        "full_name":f"{p['first_name']} {p['last_name']}",
        **br,
        "assessment":a,
        "related_entities":ents
      })
    return out
