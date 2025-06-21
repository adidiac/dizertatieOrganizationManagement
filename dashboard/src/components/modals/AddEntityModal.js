// src/components/AddEntityDialog.js
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import { createEntity } from '../../services/apiService';

const AddEntityDialog = ({ open, onClose, parentId, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    entity_type: '',
    description: '',
    vulnerability_score: '',
    connectivity: '',
    risk_score: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createEntity(formData);
      const newEntityId = response.id;
      onSave(formData, newEntityId);
    } catch (error) {
      console.error('Error creating entity:', error);
    }
    setFormData({
      name: '',
      entity_type: '',
      description: '',
      vulnerability_score: '',
      connectivity: '',
      risk_score: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Entity</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" name="name" value={formData.name} onChange={handleChange} required />
            <TextField label="Entity Type" name="entity_type" value={formData.entity_type} onChange={handleChange} />
            <TextField label="Description" name="description" value={formData.description} onChange={handleChange} multiline rows={3} />
            <TextField label="Vulnerability Score" name="vulnerability_score" type="number" value={formData.vulnerability_score} onChange={handleChange} />
            <TextField label="Connectivity" name="connectivity" type="number" value={formData.connectivity} onChange={handleChange} />
            <TextField label="Risk Score" name="risk_score" type="number" value={formData.risk_score} onChange={handleChange} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddEntityDialog;
