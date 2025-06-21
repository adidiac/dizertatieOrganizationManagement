// src/components/ClusteringPage.js
import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
  Paper
} from '@mui/material';
import ClusteringChart from './ClusteringChart';
import ClusterCircles from './ClusterCircles';
import { getClustering } from '../services/apiService';

const attributeOptions = [
  "awareness",
  "conscientiousness",
  "stress",
  "neuroticism",
  "risk_tolerance"
];

const ClusteringPage = () => {
  const [selectedAttrs, setSelectedAttrs] = useState(attributeOptions);
  const [nClusters, setNClusters] = useState(3);
  const [clusters, setClusters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCluster = async () => {
    setLoading(true);
    setError(null);
    try {
      const clustersResult = await getClustering(nClusters, selectedAttrs);
      setClusters(clustersResult);
    } catch (err) {
      setError(err.message || "Error clustering data");
    }
    setLoading(false);
  };

  const handleAttrChange = (e) => {
    const { name, checked } = e.target;
    if (checked) {
      setSelectedAttrs(prev => prev.includes(name) ? prev : [...prev, name]);
    } else {
      setSelectedAttrs(prev => prev.filter(attr => attr !== name));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Cluster Persons</Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Number of Clusters"
          type="number"
          value={nClusters}
          onChange={(e) => setNClusters(parseInt(e.target.value, 10))}
          InputProps={{ inputProps: { min: 1 } }}
        />
      </Box>
      <FormGroup row>
        {attributeOptions.map(attr => (
          <FormControlLabel
            key={attr}
            control={
              <Checkbox
                name={attr}
                checked={selectedAttrs.includes(attr)}
                onChange={handleAttrChange}
              />
            }
            label={attr}
          />
        ))}
      </FormGroup>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleCluster}>
          Cluster
        </Button>
      </Box>
      {loading && <Typography variant="body1">Clustering...</Typography>}
      {error && <Typography variant="body1" color="error">{error}</Typography>}
        {clusters && (
          <Paper sx={{ mt: 3, p: 2 }}>
            <ClusterCircles clusters={clusters} />
          </Paper>
        )}
    </Box>
  );
};

export default ClusteringPage;
