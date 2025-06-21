// src/components/modals/UploadFileModal.js
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Input } from '@mui/material';
import apiService from '../../services/apiService';

const UploadFileModal = ({ onClose, node }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) {
      setMessage('No file selected.');
      return;
    }
    try {
      const sas = await apiService.getAzureSasUrl();
      const sasUrl = sas.sas_url;
      const response = await fetch(sasUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type
        },
        body: file
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
      setMessage('File uploaded successfully.');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Upload File for {node?.name || 'Selected Node'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Input type="file" onChange={handleFileChange} />
        </Box>
        {message && <Typography sx={{ mt: 1, color:'red' }}>{message}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handleUpload}>Upload</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadFileModal;
