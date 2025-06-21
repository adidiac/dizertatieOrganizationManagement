// src/components/PsychometricDialog.js
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { getPsychometricAssessment } from '../../services/apiService';

const PsychometricDialog = ({ open, onClose, personId }) => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPsychometricAssessment(personId);
      // Assuming the endpoint returns an array of assessments;
      // if there are multiple, you might decide to show the latest one.
      setAssessment(data.length ? data[0] : null);
    } catch (err) {
      setError(err.message || 'Error fetching assessment');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && personId) {
      fetchAssessment();
    }
  }, [open, personId]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Psychometric Assessment</DialogTitle>
      <DialogContent>
        {loading && <Typography>Loading...</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && assessment ? (
          <Box sx={{ mt: 2 }}>
            <Typography>Awareness: {assessment.awareness}</Typography>
            <Typography>Conscientiousness: {assessment.conscientiousness}</Typography>
            <Typography>Stress: {assessment.stress}</Typography>
            <Typography>Neuroticism: {assessment.neuroticism}</Typography>
            <Typography>Risk Tolerance: {assessment.risk_tolerance}</Typography>
          </Box>
        ) : !loading && !error ? (
          <Typography>No assessment available.</Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PsychometricDialog;
