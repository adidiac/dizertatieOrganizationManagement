// src/components/AddDepartmentDialog.js
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import { createDepartment } from '../../services/apiService';

const AddDepartmentDialog = ({ open, onClose, parentId, onSave }) => {
  const [departmentName, setDepartmentName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createDepartment({ name: departmentName });
      const newDepartmentId = response.id;
      onSave({ name: departmentName }, newDepartmentId);
    } catch (error) {
      console.error('Error creating department:', error);
    }
    setDepartmentName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Department</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Department Name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
              fullWidth
            />
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

export default AddDepartmentDialog;
