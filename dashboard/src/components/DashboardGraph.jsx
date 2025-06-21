// Dashboard.jsx
import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

// Define the three attack types available.
const attackTypes = ['phishing', 'social_engineering', 'ransomware'];

const DashboardGraph = () => {
  // Graph state: full organization (persons and entities).
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  // Selected node (person or entity).
  const [selectedNode, setSelectedNode] = useState(null);
  // Detailed info fetched from the backend for the selected node.
  const [nodeDetails, setNodeDetails] = useState(null);
  
  // Simulation settings and results.
  const [selectedAttackIndex, setSelectedAttackIndex] = useState(0);
  const [threshold, setThreshold] = useState(0.5);
  const [simulationResult, setSimulationResult] = useState([]);
  const [simulationLog, setSimulationLog] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Control for the details modal.
  const [openDetails, setOpenDetails] = useState(false);
  
  // The currently selected attack type.
  const attackType = attackTypes[selectedAttackIndex];
  
  // Fetch graph data on mount.
  useEffect(() => {
    fetchGraphData();
  }, []);
  
  const fetchGraphData = async () => {
    try {
      const response = await fetch('http://localhost:5007/api/graph');
      const data = await response.json();
      setGraphData(data);
    } catch (err) {
      console.error('Error fetching graph data:', err);
    }
  };
  
  // When a node is clicked, fetch its detailed info.
  const handleNodeClick = async (node) => {
    setSelectedNode(node);
    try {
      // For persons we use the person details endpoint.
      // (For entities you may want a similar endpoint.)
      const response = await fetch(`http://localhost:5007/api/person_details/${node.id}`);
      const details = await response.json();
      setNodeDetails(details);
      setOpenDetails(true);
    } catch (err) {
      console.error('Error fetching node details:', err);
    }
  };
  
  // Handle attack type change via tabs.
  const handleTabChange = (event, newValue) => {
    setSelectedAttackIndex(newValue);
  };
  
  // Trigger a simulation (starting from the selected node).
  const simulateAttack = async () => {
    if (!selectedNode) return;
    setLoading(true);
    const payload = {
      initial_node: selectedNode.id,
      attack_type: attackType,
      threshold: threshold
    };
    try {
      const response = await fetch('http://localhost:5007/api/simulate_attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      setSimulationResult(result.compromised || []);
      setSimulationLog(result.simulation_log || []);
    } catch (err) {
      console.error('Simulation error:', err);
    }
    setLoading(false);
  };
  
  // Get node color based on type and department or entity type.
  const getNodeColor = (node) => {
    if (node.type === 'person') {
      const dept = node.department;
      switch(dept) {
        case 'Engineering': return '#4CAF50';
        case 'Sales': return '#FF5722';
        case 'HR': return '#9C27B0';
        case 'Finance': return '#3F51B5';
        default: return '#03A9F4';
      }
    } else if (node.type === 'entity') {
      const etype = node.entity_type;
      switch(etype) {
        case 'server': return '#FFC107';
        case 'workstation': return '#795548';
        case 'network': return '#009688';
        default: return '#607D8B';
      }
    } else {
      return '#FFFFFF';
    }
  };
  
  // Custom node renderer.
  const drawNode = (node, ctx, globalScale) => {
    const label = node.full_name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  
    const r = 8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    const fillColor = getNodeColor(node);
    ctx.fillStyle = fillColor;
    ctx.shadowColor = fillColor;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  
    ctx.fillStyle = 'white';
    ctx.fillText(label, node.x, node.y - r - 8);
  };
  
  // Custom link renderer to draw weight labels.
  const drawLink = (link, ctx) => {
    const start = link.source;
    const end = link.target;
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const weightText = link.weight ? link.weight.toFixed(2) : '1.00';
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(weightText, midX, midY);
  };
  
  return (
    <div>
  
      <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
        {/* Attack Type Tabs */}
        <Tabs value={selectedAttackIndex} onChange={handleTabChange} centered>
          {attackTypes.map((type) => (
            <Tab key={type} label={type.replace('_', ' ').toUpperCase()} />
          ))}
        </Tabs>
  
        <Grid container spacing={2} style={{ marginTop: '1rem' }}>
          {/* Left: Organization Graph */}
          <Grid item xs={12} md={8}>
            <Card style={{ height: '600px', background: '#121212', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Organization Graph (Attack Type: {attackType.replace('_', ' ').toUpperCase()})
                </Typography>
                <div style={{ height: '500px' }}>
                  <ForceGraph2D
                    graphData={graphData}
                    nodeLabel="full_name"
                    onNodeClick={handleNodeClick}
                    // Render links with directional arrows.
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    nodeCanvasObject={drawNode}
                    linkCanvasObject={drawLink}
                    // Use link.weight for thickness.
                    linkWidth={link => link.weight ? link.weight : 1}
                    backgroundColor="#1e1e1e"
                  />
                </div>
              </CardContent>
            </Card>
          </Grid>
  
          {/* Right: Simulation Controls, Results, and Log */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Simulation Controls
                </Typography>
                {selectedNode ? (
                  <Box mb={2}>
                    <Typography variant="subtitle1">
                      Selected: {selectedNode.full_name} (ID: {selectedNode.id})
                    </Typography>
                    {selectedNode.department && (
                      <Typography variant="body2">
                        Department: {selectedNode.department}
                      </Typography>
                    )}
                    {selectedNode.entity_type && (
                      <Typography variant="body2">
                        Type: {selectedNode.entity_type}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Click on a node to select a person or entity.
                  </Typography>
                )}
                <TextField
                  label="Threshold"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  fullWidth
                  margin="normal"
                  inputProps={{ step: 0.1, min: 0, max: 1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={simulateAttack}
                  disabled={!selectedNode || loading}
                >
                  {loading ? 'Simulating...' : 'Simulate Attack'}
                </Button>
                <Box mt={2}>
                  <Typography variant="subtitle1">Simulation Results:</Typography>
                  {simulationResult.length > 0 ? (
                    <List dense>
                      {simulationResult.map((node) => (
                        <ListItem key={node.person_id || node.id}>
                          <ListItemText
                            primary={`${node.full_name} (ID: ${node.person_id || node.id})`}
                            secondary={`Risk: ${node.risk.toFixed(2)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No compromised nodes yet.
                    </Typography>
                  )}
                </Box>
                <Box mt={2}>
                  <Typography variant="subtitle1">Simulation Log:</Typography>
                  {simulationLog.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>From</TableCell>
                            <TableCell>To</TableCell>
                            <TableCell>Edge Weight</TableCell>
                            <TableCell>Target Risk</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {simulationLog.map((entry, index) => (
                            <TableRow key={index}>
                              <TableCell>{entry.from}</TableCell>
                              <TableCell>{entry.to}</TableCell>
                              <TableCell>{entry.edge_weight}</TableCell>
                              <TableCell>{(entry.target_risk * 100).toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No simulation log available.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
  
      {/* Node Details Modal */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{nodeDetails ? nodeDetails.full_name : 'Loading...'}</DialogTitle>
        <DialogContent dividers>
          {nodeDetails ? (
            <Box>
              {nodeDetails.type === 'person' ? (
                <>
                  <Typography variant="body1"><strong>ID:</strong> {nodeDetails.person_id}</Typography>
                  {nodeDetails.email && (
                    <Typography variant="body1"><strong>Email:</strong> {nodeDetails.email}</Typography>
                  )}
                  {nodeDetails.department && (
                    <Typography variant="body1"><strong>Department:</strong> {nodeDetails.department}</Typography>
                  )}
                  <Divider style={{ margin: '1rem 0' }} />
                  <Typography variant="subtitle1">Risk Breakdown:</Typography>
                  <Typography variant="body2">
                    <strong>Composite Risk:</strong> {(nodeDetails.composite_risk * 100).toFixed(1)}%<br />
                    <strong>Psychometric Risk:</strong> {(nodeDetails.psychometric_risk * 100).toFixed(1)}%<br />
                    <strong>Entity Risk:</strong> {(nodeDetails.entity_risk * 100).toFixed(1)}%
                  </Typography>
                  <Divider style={{ margin: '1rem 0' }} />
                  {nodeDetails.assessment && (
                    <Box mb={1}>
                      <Typography variant="subtitle1">Assessment:</Typography>
                      <Typography variant="body2">
                        Awareness: {nodeDetails.assessment.awareness}<br />
                        Conscientiousness: {nodeDetails.assessment.conscientiousness}<br />
                        Stress: {nodeDetails.assessment.stress}<br />
                        Neuroticism: {nodeDetails.assessment.neuroticism}<br />
                        Risk Tolerance: {nodeDetails.assessment.risk_tolerance}<br />
                        Connectivity: {nodeDetails.assessment.connectivity || 0.5}
                      </Typography>
                    </Box>
                  )}
                  {nodeDetails.related_entities && nodeDetails.related_entities.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1">Related Entities:</Typography>
                      <List dense>
                        {nodeDetails.related_entities.map((ent) => (
                          <ListItem key={ent.id}>
                            <ListItemText
                              primary={ent.name}
                              secondary={`Vulnerability: ${ent.vulnerability_score}, Connectivity: ${ent.connectivity}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {nodeDetails.entity_details && nodeDetails.entity_details.length > 0 && (
                    <Box mt={1}>
                      <Typography variant="subtitle1">Entity Contributions:</Typography>
                      <List dense>
                        {nodeDetails.entity_details.map((detail, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={`${detail.name} (ID: ${detail.entity_id})`}
                              secondary={`Vulnerability: ${detail.vulnerability}, Connectivity: ${detail.connectivity}, Weighted Risk: ${detail.weighted_risk.toFixed(2)}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </>
              ) : nodeDetails.type === 'entity' ? (
                <>
                  <Typography variant="body1"><strong>ID:</strong> {nodeDetails.id}</Typography>
                  <Typography variant="body1"><strong>Type:</strong> {nodeDetails.entity_type}</Typography>
                  <Typography variant="body1">
                    <strong>Risk Score:</strong> {(nodeDetails.risk * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body1">
                    <strong>Vulnerability:</strong> {nodeDetails.vulnerability}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2">No details available.</Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2">Loading details...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DashboardGraph;
