// src/components/OrgChartPage.js
import React, { useState, useEffect } from 'react';
import OrgChartComponent from './OrgChartComponent';
import AddPersonDialog from './modals/AddPersonModal';
import AddEntityDialog from './modals/AddEntityModal';
import AddDepartmentDialog from './modals/AddDepartmentModal';
import PsychometricDialog from './modals/PsychometricDialog';
import { Container, Typography } from '@mui/material';

import { getPersons, getEntities, createRelationship, getRelationships, deletePerson, deleteEntity } from '../services/apiService';


/**
 * processOrgData builds the hierarchical tree.
 */
const processOrgData = (persons, entities, relationships, localDepartments = []) => {
  let deptSet = new Set();
  persons.forEach(p => { if (p.department) deptSet.add(p.department); });
  localDepartments.forEach(dept => { deptSet.add(dept.name); });
  entities.forEach(e => { if (e.entity_type === 'suborganization') deptSet.add(e.name); });

  const departmentNodes = Array.from(deptSet).map(deptName => ({
    id: 'dept-' + deptName,
    name: deptName,
    type: 'department',
    parentId: 'root'
  }));

  const processedPersons = persons.map(p => ({
    ...p,
    id: String(p.id), // ensure IDs are strings
    type: 'person',
    parentId: p.department ? 'dept-' + p.department : 'root'
  }));

  const processedEntities = entities.map(e => {
    if (e.entity_type === 'suborganization') {
      return null;
    } else {
      let entityDept = null;
      relationships.forEach(r => {
        if (
          r.child_id == e.id &&
          r.child_type === 'entity' &&
          (r.relationship_type === 'belongs_to' || r.relationship_type === 'owns')
        ) {
          const parent = persons.find(p => p.id == r.parent_id);
          if (parent && parent.department) {
            entityDept = parent.department;
          }
        }
      });
      return {
        ...e,
        id: String(e.id),
        type: 'entity',
        parentId: entityDept ? 'dept-' + entityDept : 'root'
      };
    }
  }).filter(e => e !== null);

  const dummyRoot = { id: 'root', name: 'Organization', type: 'root', parentId: null };

  return [dummyRoot, ...departmentNodes, ...processedPersons, ...processedEntities];
};

const OrgChartPage = () => {
  const [orgData, setOrgData] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedParentType, setSelectedParentType] = useState(null);
  const [openPersonDialog, setOpenPersonDialog] = useState(false);
  const [openEntityDialog, setOpenEntityDialog] = useState(false);
  const [openDepartmentDialog, setOpenDepartmentDialog] = useState(false);
  const [localDepartments, setLocalDepartments] = useState([]);
  const [openAssessmentDialog, setOpenAssessmentDialog] = useState(false);
  const [assessmentPersonId, setAssessmentPersonId] = useState(null);

  // De data aceasta apelăm loadOrgData ±la montare fără niciun dependency
  useEffect(() => {
    loadOrgData();
  }, []);

  const loadOrgData = async () => {
    try {
      const [persons, entities, relationships] = await Promise.all([
        getPersons(),
        getEntities(),
        getRelationships()
      ]);
      const processedData = processOrgData(persons, entities, relationships, localDepartments);
      setOrgData(processedData);
    } catch (err) {
      console.error('Error loading org data:', err);
    }
  };

  const handleAddPerson = (parentId) => {
    setSelectedParentId(parentId);
    const parent = orgData.find(n => n.id === parentId);
    setSelectedParentType(parent ? parent.type : null);
    setOpenPersonDialog(true);
  };

  const handleAddEntity = (parentId) => {
    setSelectedParentId(parentId);
    const parent = orgData.find(n => n.id === parentId);
    setSelectedParentType(parent ? parent.type : null);
    setOpenEntityDialog(true);
  };

  const handleAddDepartment = (parentId) => {
    setSelectedParentId(parentId);
    const parent = orgData.find(n => n.id === parentId);
    setSelectedParentType(parent ? parent.type : null);
    setOpenDepartmentDialog(true);
  };

  const handleViewAssessment = (nodeId) => {
    const node = orgData.find(n => String(n.id) === nodeId);
    if (node && node.type === 'person') {
      setAssessmentPersonId(node.id);
      setOpenAssessmentDialog(true);
    }
  };

  const handleDelete = async (nodeId) => {
    const node = orgData.find(n => String(n.id) === nodeId);
    if (!node) return;
    if (!window.confirm(`Are you sure you want to delete this ${node.type}?`)) {
      return;
    }

    try {
      if (node.type === 'person') {
        await deletePerson(node.id);
      } else if (node.type === 'entity') {
        await deleteEntity(node.id);
      } else if (node.type === 'department') {
        // Ştergem departamentul local din starea front-end
        setLocalDepartments(prev => prev.filter(d => d.id !== node.id));
      }
      // Abia acum reîncărcăm lista completă
      await loadOrgData();
    } catch (err) {
      console.error('Error deleting node:', err);
    }
  };

  const handleCreateRelationship = async (childId, childType) => {
    // Dacă e departament local nu facem apel la API
    if (selectedParentType === 'department') return;
    if (!selectedParentId) return;

    const relationshipData = {
      parent_id: selectedParentId,
      parent_type: selectedParentType,
      child_id: childId,
      child_type: childType,
      relationship_type: 'parent-child'
    };

    try {
      await createRelationship(relationshipData);
    } catch (err) {
      console.error('Error creating relationship:', err);
    }
  };

  /**
   * După ce dialogul de adăugare persoană ne dă ID-ul noii persoane,
   * creăm relația și apoi forțăm reîncărcarea organigramei:
   */
  const handleSavePerson = async (personData, newPersonId) => {
    try {
      await handleCreateRelationship(newPersonId, 'person');
      // await loadOrgData();
    } catch (err) {
      console.error('Error saving person + relationship:', err);
    } finally {
      setOpenPersonDialog(false);
    }
  };

  const handleSaveEntity = async (entityData, newEntityId) => {
    try {
      await handleCreateRelationship(newEntityId, 'entity');
      // await loadOrgData();
    } catch (err) {
      console.error('Error saving entity + relationship:', err);
    } finally {
      setOpenEntityDialog(false);
    }
  };

  /**
   * Pentru departament → adaugăm doar în starea locală și reîncărcăm:
   */
  const handleSaveDepartment = async (departmentData, newDepartmentId) => {
    const newDept = {
      id: 'dept-' + departmentData.name,
      name: departmentData.name,
      type: 'department',
      parentId: 'root'
    };
    setLocalDepartments(prev => [...prev, newDept]);
    // Dacă ai nevoie de relație pe backend, ai putea trimite ceva de genul:
    // await createRelationship({...});
    // await loadOrgData();
    setOpenDepartmentDialog(false);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Organizational Chart</Typography>
      <OrgChartComponent
        data={orgData}
        onAddPerson={handleAddPerson}
        onAddEntity={handleAddEntity}
        onAddDepartment={handleAddDepartment}
        onViewAssessment={handleViewAssessment}
        onDelete={handleDelete}
      />

      <AddPersonDialog
        open={openPersonDialog}
        onClose={() => setOpenPersonDialog(false)}
        parentId={selectedParentId}
        onSave={handleSavePerson}
      />
      <AddEntityDialog
        open={openEntityDialog}
        onClose={() => setOpenEntityDialog(false)}
        parentId={selectedParentId}
        onSave={handleSaveEntity}
      />
      <AddDepartmentDialog
        open={openDepartmentDialog}
        onClose={() => setOpenDepartmentDialog(false)}
        parentId={selectedParentId}
        onSave={handleSaveDepartment}
      />
      <PsychometricDialog
        open={openAssessmentDialog}
        onClose={() => setOpenAssessmentDialog(false)}
        personId={assessmentPersonId}
      />
    </Container>
  );
};

export default OrgChartPage;