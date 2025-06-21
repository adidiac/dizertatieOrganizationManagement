// src/components/modals/CreateRelationshipModal.js
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';

const CreateRelationshipModal = ({ onClose }) => {
  const [relData, setRelData] = useState({
    parentNodeId: 'P1',
    childNodeId: '',
    relationshipType: 'ReportsTo'
  });

  const handleChange = (e) => {
    setRelData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = () => {
    // In a real app, you'd store the relationship or create a node if needed.
    console.log('Creating relationship with data:', relData);
    onClose();
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Create Relationship</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            name="parentNodeId"
            label="Parent Node ID"
            value={relData.parentNodeId}
            onChange={handleChange}
          />
          <TextField
            name="childNodeId"
            label="Child Node ID (empty = generate new node later)"
            value={relData.childNodeId}
            onChange={handleChange}
          />
          <TextField
            name="relationshipType"
            label="Relationship Type"
            value={relData.relationshipType}
            onChange={handleChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate}>Create</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRelationshipModal;
