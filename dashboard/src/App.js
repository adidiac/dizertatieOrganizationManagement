// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import OrgChartPage from './components/OrgChartPage';
import ClusteringPage from './components/ClusteringPage';
import { Container, AppBar, Toolbar, Button, Typography } from '@mui/material';
import RiskAnalysis from './components/RiskAnalysis';
import DashboardGraph from './components/DashboardGraph'
import FlowDesigner from './components/FlowDesigner';

function App() {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Dashboard</Typography>
          <Button color="inherit" component={Link} to="/orgchart">Org Chart</Button>
          <Button color="inherit" component={Link} to="/clustering">Clustering</Button>
          <Button color="inherit" component={Link} to="/analysis">Risk Analysis</Button>
          {/* <Button color="inherit" component={Link} to="/dashboard">Dashboard Graph</Button> */}
          <Button color="inherit" component={Link} to="/bmpn">BPMN Dashboard</Button>
        </Toolbar>
      </AppBar>
      
      <Routes>
        <Route path="/orgchart" element={<OrgChartPage />} />
        <Route path="/clustering" element={<ClusteringPage />} />
        <Route path="/analysis" element={<RiskAnalysis />} />
        {/* <Route path="/dashboard" element={<DashboardGraph />} /> */}
        <Route path="/bmpn" element={
              <FlowDesigner />
        } />
        <Route path="/" element={<Typography variant="h4">Welcome to the Dashboard</Typography>} />
      </Routes>
    </Router>
  );
}

export default App;
