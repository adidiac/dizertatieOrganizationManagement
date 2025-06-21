// src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = process.env.HR_API_URL || 'http://localhost:5004/api';

// Get a SAS URL for the container (returns e.g. { sas_url: "https://<account>.blob.core.windows.net/<container>?..." })
export const getSasUrlForUpload = async () => {
  const response = await axios.get(`${API_BASE_URL}/azure/sas`);
  return response.data;
};

// Upload the file to Azure Blob Storage using PUT
export const uploadFileToAzure = async (uploadUrl, file) => {
  // Azure requires the header 'x-ms-blob-type' to be set.
  const response = await axios.put(uploadUrl, file, {
    headers: { 'x-ms-blob-type': 'BlockBlob' },
  });
  return response;
};

// Create a person record in your backend.
export const createPerson = async (personData) => {
  const response = await axios.post(`${API_BASE_URL}/persons`, personData);
  return response.data; // Expected to return { message: "...", id: <newPersonId> }
};

// After creating the person and uploading the file, call this endpoint to extract attributes.
export const extractFromFile = async (personId, fileUrl, method = 'model') => {
  const response = await axios.post(`${API_BASE_URL}/extract_from_file`, {
    person_id: personId,
    file_url: fileUrl,
    method,
  });
  return response.data;
};
// --- Persons ---
export const getPersons = async () => {
  const response = await axios.get(`${API_BASE_URL}/persons`);
  return response.data;
};

// --- Entities ---
export const getEntities = async () => {
  const response = await axios.get(`${API_BASE_URL}/entities`);
  return response.data;
};

export const createEntity = async (entityData) => {
  const response = await axios.post(`${API_BASE_URL}/entities`, entityData);
  return response.data;
};

// --- Departments ---  
// (Assuming your backend now supports a POST /api/departments endpoint)
export const createDepartment = async (departmentData) => {
  const response = await axios.post(`${API_BASE_URL}/departments`, departmentData);
  return response.data;
};

// --- Relationships ---
export const createRelationship = async (relationshipData) => {
  const response = await axios.post(`${API_BASE_URL}/relationships`, relationshipData);
  return response.data;
};

// --- Clustering ---
export const getClustering = async (nClusters, attributes) => {
  const params = {
    n_clusters: nClusters,
    attributes: attributes,
  };
  const response = await axios.get(`${API_BASE_URL}/clustering`, { params });
  return response.data;
};

export const getRelationships = async () => {
  const response = await axios.get(`${API_BASE_URL}/relationships`);
  return response.data;
};

export const getPsychometricAssessment = async (personId) => {
  const response = await axios.get(`${API_BASE_URL}/psychometric_assessments`, {
    params: { person_id: personId }
  });
  return response.data;
};

export const deletePerson = async (personId) => {
  const response = await axios.delete(`${API_BASE_URL}/persons/${personId}`);
  return response.data;
};

export const deleteEntity = async (entityId) => {
  const response = await axios.delete(`${API_BASE_URL}/entities/${entityId}`);
  return response.data;
};

