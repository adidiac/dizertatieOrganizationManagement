import xml.etree.ElementTree as ET
from typing import List, Dict

# --- Register namespaces so prefixes appear ---
ET.register_namespace('bpmn',   'http://www.omg.org/spec/BPMN/20100524/MODEL')
ET.register_namespace('bpmndi', 'http://www.omg.org/spec/BPMN/20100524/DI')
ET.register_namespace('dc',     'http://www.omg.org/spec/DD/20100524/DC')
ET.register_namespace('di',     'http://www.omg.org/spec/DD/20100524/DI')

NS = {
    'bpmn':   'http://www.omg.org/spec/BPMN/20100524/MODEL',
    'bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI',
    'dc':     'http://www.omg.org/spec/DD/20100524/DC',
    'di':     'http://www.omg.org/spec/DD/20100524/DI',
}

def build_bpmn_xml(nodes: List[Dict], links: List[Dict]) -> str:
    """
    Build BPMN XML (with DI) containing exactly one <sequenceFlow>
    per provided link. Persons on top row, entities on bottom.
    """
    defs = ET.Element('bpmn:definitions', {
        'id': 'Definitions_1',
        'targetNamespace': 'http://bpmn.io/schema/bpmn'
    })
    proc = ET.SubElement(defs, 'bpmn:process', {
        'id': 'Process_1',
        'isExecutable': 'false'
    })

    # split nodes
    persons  = [n for n in nodes if n['type']=='person']
    entities = [n for n in nodes if n['type']=='entity']

    # map orig → BPMN id
    mapped = []

    # userTask for persons
    for p in persons:
        bpmn_id = f"Person_{p['id']}"
        ET.SubElement(proc, 'bpmn:userTask', {
            'id': bpmn_id,
            'name': p['full_name']
        })
        mapped.append({'orig': str(p['id']), 'bpmn': bpmn_id})

    # serviceTask for entities
    for e in entities:
        raw = str(e['id'])
        # if upstream gave you "entity_3", strip that prefix:
        if raw.startswith('entity_'):
            raw = raw.split('entity_')[-1]
        bpmn_id = f"Entity_{raw}"
        ET.SubElement(proc, 'bpmn:serviceTask', {
            'id':   bpmn_id,
            'name': e.get('full_name', e.get('name',''))
        })
        mapped.append({'orig': e['id'], 'bpmn': bpmn_id})

    # build sequenceFlows
    flows = []
    for i, link in enumerate(links, start=1):
        src = next((m['bpmn'] for m in mapped if m['orig']==link['source']), None)
        tgt = next((m['bpmn'] for m in mapped if m['orig']==link['target']), None)
        if not src or not tgt:
            continue
        flow_id = f"Flow_{i}"
        flows.append({'id':flow_id,'sourceRef':src,'targetRef':tgt})
        ET.SubElement(proc, 'bpmn:sequenceFlow', {
            'id':        flow_id,
            'sourceRef': src,
            'targetRef': tgt
        })

    # DI
    diagram = ET.SubElement(defs, 'bpmndi:BPMNDiagram', {'id':'BPMNDiagram_1'})
    plane   = ET.SubElement(diagram, 'bpmndi:BPMNPlane', {
        'id':'BPMNPlane_1','bpmnElement':'Process_1'
    })

    x0, y0      = 150, 100
    dx, dy      = 200, 150
    task_w, h   = 100, 80
    coords = {}

    def add_shape(el_id, x, y):
        shp = ET.SubElement(plane, 'bpmndi:BPMNShape', {
            'id': f"{el_id}_di", 'bpmnElement': el_id
        })
        ET.SubElement(shp, 'dc:Bounds', {
            'x':str(x),'y':str(y),'width':str(task_w),'height':str(h)
        })
        coords[el_id] = (x,y)

    def add_edge(flow_id, sx, sy, tx, ty):
        edge = ET.SubElement(plane, 'bpmndi:BPMNEdge', {
            'id':f"{flow_id}_di",'bpmnElement':flow_id
        })
        ET.SubElement(edge, 'di:waypoint', {'x':str(sx),'y':str(sy)})
        ET.SubElement(edge, 'di:waypoint', {'x':str(tx),'y':str(ty)})

    # draw shapes
    for idx, m in enumerate(mapped):
        row = 0 if idx < len(persons) else 1
        col = idx if row==0 else (idx-len(persons))
        add_shape(m['bpmn'], x0+col*dx, y0+row*dy)

    # draw edges
    for f in flows:
        sx, sy = coords[f['sourceRef']]
        tx, ty = coords[f['targetRef']]
        add_edge(f['id'],
                 sx+task_w/2, sy+h/2,
                 tx+task_w/2, ty+h/2)

    return ET.tostring(defs, encoding='utf-8', xml_declaration=True).decode('utf-8')
