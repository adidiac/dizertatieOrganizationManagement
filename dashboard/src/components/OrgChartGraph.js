// src/components/OrgChartGraph.js
import React, { useEffect, useState } from 'react';
import { Graph } from 'react-d3-graph';
import axios from 'axios';
import { Container, Typography, Alert, CircularProgress, Box } from '@mui/material';

const OrgChartGraph = () => {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching persons from /api/person_risks...");
        const personsResponse = await axios.get("http://localhost:5007/api/person_risks?attack_type=phishing");
        const persons = personsResponse.data;
        console.log("Fetched persons count:", persons.length);
        
        console.log("Fetching relationships from /api/relationships...");
        const relationshipsResponse = await axios.get("http://localhost:5007/api/relationships");
        const relationships = relationshipsResponse.data;
        console.log("Fetched relationships count:", relationships.length);
        
        if (!persons || persons.length === 0) {
          setErrorMsg("No persons data found.");
          return;
        }
        
        // Build nodes from persons data.
        // Make sure each person_id is converted to a string.
        const nodes = persons.map(person => ({
          id: String(person.person_id),
          label: `${person.full_name}\nRisk: ${(person.composite_risk * 100).toFixed(1)}%`
        }));
        
        // Build links from relationships data.
        const links = relationships
          .filter(rel => rel.parent_type === "person" && rel.child_type === "person")
          .map(rel => ({
            source: String(rel.parent_id),
            target: String(rel.child_id),
            label: rel.relationship_type
          }));
        
        const data = { nodes, links };
        console.log("Graph data constructed:", data);
        setGraphData(data);
      } catch (error) {
        console.error("Error fetching graph data:", error);
        setErrorMsg("Error fetching graph data. Please check your backend endpoints and configuration.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Revised configuration: disable panAndZoom to avoid undefined transform issues.
  const myConfig = {
    nodeHighlightBehavior: true,
    node: {
      color: "lightblue",
      size: 800, // Larger node size
      highlightStrokeColor: "blue",
      labelProperty: "label",
      fontSize: 16, // Larger font for readability
      fontColor: "black",
      fontWeight: "bold",
      strokeWidth: 2,
    },
    link: {
      highlightColor: "lightblue",
      renderLabel: true,
      fontSize: 14,
      labelProperty: "label",
      strokeWidth: 2,
    },
    directed: true,
    height: 800,  // Increase overall height
    width: 1200,  // Increase overall width
    panAndZoom: false, // Disable pan and zoom
    d3: {
      gravity: -1000,
      linkLength: 200,
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Organizational Risk Graph</Typography>
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {graphData && !loading ? (
        // Wrap the Graph in a div with explicit dimensions
        <div style={{ width: "1200px", height: "800px", border: "1px solid #ccc" }}>
          <Graph
            id="org-risk-graph"
            data={graphData}
            config={myConfig}
          />
        </div>
      ) : (
        !errorMsg && !loading && <Typography>No graph data available.</Typography>
      )}
    </Container>
  );
};

export default OrgChartGraph;
