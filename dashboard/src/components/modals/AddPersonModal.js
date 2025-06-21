// src/components/AddPersonDialog.js
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import { getSasUrlForUpload, uploadFileToAzure, createPerson, extractFromFile } from '../../services/apiService';

const AddPersonDialog = ({ open, onClose, parentId, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    department: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let fileUrl = '';
    
    if (file) {
      try {
        // Generate a unique blob name
        const blobName = `${Date.now()}-${file.name}`;
        
        // Get a SAS URL from the backend (container-level SAS URL)
        const { sas_url } = await getSasUrlForUpload();
        console.log('Received SAS URL:', sas_url);
        
        // Split the SAS URL into base URL and query string.
        const questionMarkIndex = sas_url.indexOf('?');
        if (questionMarkIndex === -1) {
          throw new Error('Invalid SAS URL: no query string found.');
        }
        const baseUrl = sas_url.substring(0, questionMarkIndex);
        const queryString = sas_url.substring(questionMarkIndex);
        
        // Construct the full upload URL by inserting the blob name before the query string.
        const uploadUrl = `${baseUrl}/${blobName}${queryString}`;
        console.log('Constructed upload URL:', uploadUrl);
        
        // Upload the file to Azure Blob Storage using the PUT method
        const response = await uploadFileToAzure(uploadUrl, file);
        if (response.status !== 201 && response.status !== 200) {
          alert('File upload failed. Please try again.');
          throw new Error(`File upload failed with status: ${response.status}`);
        }
        
        console.log('File uploaded successfully.');
        
        // Derive the final file URL (without the SAS token)
        fileUrl = `${baseUrl}/${blobName}`;
        console.log('Final file URL:', fileUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    
    // Include fileUrl in the payload if available
    const payload = { ...formData };
   
    
    try {
       if (fileUrl) {
          payload.file_url = fileUrl;
        }
        else {
          throw new Error('File URL is required for extraction.');
        }
      // Create the person record in your backend
      const response = await createPerson(payload);
      const newPersonId = response.id; // assuming the backend returns the new person ID
      console.log('Person created with id:', newPersonId);
      
      // If a file was uploaded, call the extraction endpoint
      if (fileUrl && newPersonId) {
        const extractionResult = await extractFromFile(newPersonId, fileUrl);
        console.log('Extraction result:', extractionResult);
      }
      
      // Call the onSave callback to update the UI and relationships
      onSave(payload, newPersonId);
    } catch (error) {
      console.error('Error creating person:', error);
    }
    
    setUploading(false);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      role: '',
      department: ''
    });
    setFile(null);
    onClose();
  };
  
  

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Person</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
            <TextField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
            <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <TextField label="Role" name="role" value={formData.role} onChange={handleChange} />
            <TextField label="Department" name="department" value={formData.department} onChange={handleChange} />
            <Button variant="outlined" component="label">
              Upload File
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            {file && <Box>Selected file: {file.name}</Box>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={uploading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddPersonDialog;
