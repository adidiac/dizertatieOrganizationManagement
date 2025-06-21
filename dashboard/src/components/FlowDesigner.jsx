import React, { useEffect, useRef, useState } from 'react';
import Modeler    from 'bpmn-js/lib/Modeler';
import axios      from 'axios';
import io         from 'socket.io-client';

import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import './styles.css';

const BACKEND = 'http://localhost:5007';
const socket  = io(BACKEND);

export default function FlowDesigner() {
  const canvasRef   = useRef(null);
  const modelerRef  = useRef(null);
  const shapeMap    = useRef({});
  const overlays    = useRef([]);

  const [loading, setLoading]       = useState(true);
  const [simulating, setSimulating] = useState(false);

  const [persons, setPersons]   = useState([]);
  const [entities, setEntities] = useState([]);

  const [path, setPath]   = useState({ start:'', end:'' });
  const [attack, setAttack] = useState({
    type:      'phishing',
    target:    '',
    threshold: 0.5
  });

  const [steps, setSteps]         = useState([]);
  const [anomalies, setAnoms]     = useState([]);
  const [recommendation, setReco] = useState('');

  // Init: load BPMN + graph
  useEffect(() => {
    (async () => {
      const { data: xml } = await axios.get(`${BACKEND}/api/diagram`, { responseType:'text' });
      canvasRef.current.innerHTML = '';
      const modeler = new Modeler({ container: canvasRef.current });
      modelerRef.current = modeler;
      await modeler.importXML(xml);

      // build shape map
      const registry = modeler.get('elementRegistry');
      registry.getAll().forEach(el => {
        if (el.type==='bpmn:UserTask' || el.type==='bpmn:ServiceTask') {
          shapeMap.current[el.id] = el;
        }
      });

      // fetch graph for form
      const { data:{ nodes } } = await axios.get(`${BACKEND}/api/graph`);
      setPersons(  nodes.filter(n=>n.type==='person') );
      setEntities(nodes.filter(n=>n.type==='entity'));
      setLoading(false);
    })();

    // listen to simulation steps
    socket.on('simulation_step', step => {
      const m   = modelerRef.current.get('modeling');
      const shp = shapeMap.current[step.to];
      if (shp) {
        // color shape
        m.setColor(shp, {
          fill: step.status==='compromised' ? '#faa' : '#afa',
          stroke: '#000', strokeWidth:2
        });
        // overlay token
        const ov = modelerRef.current.get('overlays');
        overlays.current.forEach(id=>ov.remove(id));
        overlays.current = [ ov.add(
          shp.id,
          { position:{ top:0,left:0 },
            html: (()=>{ const d=document.createElement('div'); d.className='token'; d.textContent='📄'; return d; })()
          }
        )];
      }
      // append to table
      setSteps(s=>[...s,{
        step:   step.step,
        from:   step.from_name,
        to:     step.to_name,
        weight: step.edge_weight,
        risk:   step.target_risk,
        status: step.status
      }]);
    });

    socket.on('simulation_complete', data => {
      setAnoms(data.anomalies);
      setReco(data.recommendation);
      setSimulating(false);
    });

    return () => {
      socket.off('simulation_step');
      socket.off('simulation_complete');
    };
  }, []);

  // reload diagram
  const onReload = async () => {
    setLoading(true);
    const { data: xml } = await axios.get(`${BACKEND}/api/diagram`, { responseType:'text' });
    await modelerRef.current.importXML(xml);
    // rebuild map
    shapeMap.current = {};
    const reg = modelerRef.current.get('elementRegistry');
    reg.getAll().forEach(el=>{
      if(el.type==='bpmn:UserTask'||el.type==='bpmn:ServiceTask') shapeMap.current[el.id]=el;
    });
    const { data:{ nodes } } = await axios.get(`${BACKEND}/api/graph`);
    setPersons(nodes.filter(n=>n.type==='person'));
    setEntities(nodes.filter(n=>n.type==='entity'));
    setLoading(false);
  };

  // build adjacency & BFS
  function buildAdj() {
    const reg   = modelerRef.current.get('elementRegistry');
    const flows = reg.filter(el=>el.type==='bpmn:SequenceFlow');
    const adj = {}; Object.keys(shapeMap.current).forEach(id=>adj[id]=[]);
    flows.forEach(f=>{
      const bo = f.businessObject;
      adj[bo.sourceRef.id]?.push(bo.targetRef.id);
    });
    return adj;
  }
  function bfs(start,end){
    if(!start||!end) return [];
    const adj = buildAdj();
    const prev={ [start]:null }, q=[start];
    while(q.length){ const u=q.shift(); if(u===end) break;
      (adj[u]||[]).forEach(v=>{ if(!(v in prev)){ prev[v]=u; q.push(v); } });
    }
    if(!(end in prev)) return [];
    const seq=[]; let cur=end;
    while(cur){ seq.unshift(cur); cur=prev[cur]; }
    return seq;
  }

  // highlight helper
  function highlight(ids, opts){
    const m = modelerRef.current.get('modeling');
    ids.forEach(id=>{
      const s=shapeMap.current[id]; if(s) m.setColor(s,opts);
    });
  }

  // immediate start/end/target color
  useEffect(()=>{
    if(!modelerRef.current) return;
    const m = modelerRef.current.get('modeling');
    // reset all
    Object.values(shapeMap.current).forEach(s=>{
      m.setColor(s,{ stroke:'#000', fill:'#fff', strokeWidth:1 });
    });
    if(path.start)   highlight([path.start],   { fill:'#cce5ff', stroke:'#004085', strokeWidth:2 });
    if(path.end)     highlight([path.end],     { fill:'#fff3cd', stroke:'#856404', strokeWidth:2 });
    if(attack.target)highlight([attack.target],{ fill:'#f8d7da', stroke:'#721c24', strokeWidth:2 });
  }, [path.start, path.end, attack.target]);

  // show path
  const onShowPath = () => {
    highlight(Object.keys(shapeMap.current),{ stroke:'#000', fill:'#fff', strokeWidth:1 });
    if(path.start)   highlight([path.start],   { fill:'#cce5ff', stroke:'#004085', strokeWidth:2 });
    if(path.end)     highlight([path.end],     { fill:'#fff3cd', stroke:'#856404', strokeWidth:2 });
    if(attack.target)highlight([attack.target],{ fill:'#f8d7da', stroke:'#721c24', strokeWidth:2 });
    const seq = bfs(path.start, path.end);
    highlight(seq, { stroke:'#28a745', strokeWidth:4 });
  };

  // simulate
  const onSimulate = async () => {
    setSimulating(true);
    setSteps([]);
    setAnoms([]);
    setReco('');
    overlays.current.forEach(id=>modelerRef.current.get('overlays').remove(id));
    overlays.current=[];

    onShowPath();
    const xml =  await modelerRef.current.saveXML({ format:true });
    axios.post(`${BACKEND}/api/simulate_flow`,{
      bpmn_xml: xml,
      start_id: path.start,
      end_id:   path.end,
      attack: {
        type:      attack.type,
        target_id: attack.target,
        threshold: attack.threshold
      }
    }).catch(console.error);
  };

  return (
    <div className="designer-container">
      {loading && (
        <div className="loader-overlay"><div className="loader"/></div>
      )}

      <div ref={canvasRef} className="canvas" />

      <div className="controls-card">
        <button className="btn btn-secondary full-width" onClick={onReload}>
          Reload Diagram
        </button>

        <hr/>

        <h2>Document Path</h2>
        <div className="form-group">
          <label>Start</label>
          <select
            value={path.start}
            onChange={e=>setPath({...path,start:e.target.value})}
          >
            <option value="">—</option>
            {persons.map(p=>(
              <option key={p.id} value={`Person_${p.id}`}>{p.full_name}</option>
            ))}
            {entities.map(e=>(
              <option key={e.id} value={`Entity_${e.id}`}>{e.full_name||e.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>End</label>
          <select
            value={path.end}
            onChange={e=>setPath({...path,end:e.target.value})}
          >
            <option value="">—</option>
            {persons.map(p=>(
              <option key={p.id} value={`Person_${p.id}`}>{p.full_name}</option>
            ))}
            {entities.map(e=>(
              <option key={e.id} value={`Entity_${e.id}`}>{e.full_name||e.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary full-width" onClick={onShowPath}>
          Show Path
        </button>

        <hr/>

        <h2>Attack Simulation</h2>
        <div className="form-group">
          <label>Type</label>
          <select
            value={attack.type}
            onChange={e=>setAttack({...attack,type:e.target.value})}
          >
            <option value="phishing">Phishing</option>
            <option value="ransomware">Ransomware</option>
          </select>
        </div>
        <div className="form-group">
          <label>Target</label>
          <select
            value={attack.target}
            onChange={e=>setAttack({...attack,target:e.target.value})}
          >
            <option value="">—</option>
            {persons.map(p=>(
              <option key={p.id} value={`Person_${p.id}`}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Threshold</label>
          <input
            type="number" step="0.01"
            value={attack.threshold}
            onChange={e=>setAttack({...attack,threshold:parseFloat(e.target.value)})}
          />
        </div>
        <button className="btn btn-danger full-width" onClick={onSimulate}>
          Simulate Attack
        </button>

        <hr/>

        <h3>Simulation Log</h3>
        <table className="sim-log-table">
          <thead>
            <tr><th>#</th><th>From</th><th>To</th><th>Wt</th><th>Risk</th><th>Status</th></tr>
          </thead>
          <tbody>
            {steps.map((s,i)=>(
              <tr key={i}>
                <td>{s.step}</td>
                <td>{s.from}</td>
                <td>{s.to}</td>
                <td>{s.weight.toFixed(2)}</td>
                <td>{s.risk.toFixed(3)}</td>
                <td style={{color:s.status==='compromised'?'red':'green'}}>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Anomalies</h3>
        <ul>
          {anomalies.map((a,i)=>(
            <li key={i}>{a.full_name}: {(a.composite_risk*100).toFixed(1)}%</li>
          ))}
        </ul>

        <h3>Recommendations</h3>
        <p>{recommendation}</p>
      </div>
    </div>
  );
}
