// src/components/OrgChartComponent.js
import React, { useEffect, useRef } from 'react';
import { OrgChart } from 'd3-org-chart';


const OrgChartComponent = ({
  data,
  onAddPerson,
  onAddEntity,
  onAddDepartment,
  onViewAssessment,
  onDelete, // New prop for deletion
}) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    chartRef.current = new OrgChart()
      .container(containerRef.current)
      .nodeId(d => d.id)
      .parentNodeId(d => d.parentId)
      .data(data)
      .nodeWidth(() => 300)
      .nodeHeight(() => 180)
      .childrenMargin(() => 40)
      .compactMarginBetween(() => 15)
      .compactMarginPair(() => 80)
      .nodeContent(d => {
        const node = d.data;
        let header = '';
        let details = '';

        if (node.type === 'person') {
          header = `<strong>Person: ${node.first_name} ${node.last_name}</strong>`;
          details += `<p>Email: ${node.email || 'N/A'}</p>`;
          details += `<p>Role: ${node.role || 'N/A'}</p>`;
          details += `<p>Dept: ${node.department || 'N/A'}</p>`;
        } else if (node.type === 'entity') {
          header = `<strong>Entity: ${node.name}</strong>`;
          details += `<p>Type: ${node.entity_type || 'N/A'}</p>`;
        } else if (node.type === 'department') {
          header = `<strong>Department: ${node.name}</strong>`;
        } else if (node.type === 'root') {
          header = `<strong>${node.name}</strong>`;
        }

        // Build buttons HTML.
        let buttonsHTML = `
          <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
            <button data-node-id="${node.id}" class="mui-add-person-btn" style="background-color: #1976d2; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Add Person</button>
            <button data-node-id="${node.id}" class="mui-add-entity-btn" style="background-color: #388e3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Add Entity</button>
            <button data-node-id="${node.id}" class="mui-add-department-btn" style="background-color: #f57c00; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Add Dept</button>
        `;
        if (node.type === 'person') {
          buttonsHTML += `<button data-node-id="${node.id}" class="mui-view-assessment-btn" style="background-color: #6a1b9a; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">View Assessment</button>`;
        }
        buttonsHTML += `<button data-node-id="${node.id}" class="mui-delete-btn" style="background-color: #d32f2f; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete</button>`;
        buttonsHTML += `</div>`;

        return `
          <div style="border: 1px solid #ddd; border-radius: 4px; padding: 12px; background-color: #fff; box-shadow: 0px 1px 3px rgba(0,0,0,0.2);">
            <div style="font-size: 16px; margin-bottom: 8px;">${header}</div>
            <div style="font-size: 14px; color: #555;">${details}</div>
            ${buttonsHTML}
          </div>
        `;
      })
      .render();

    const container = containerRef.current;
    const handleButtonClick = (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const nodeId = button.getAttribute('data-node-id');
      if (button.classList.contains('mui-add-person-btn')) {
        onAddPerson(nodeId);
      } else if (button.classList.contains('mui-add-entity-btn')) {
        onAddEntity(nodeId);
      } else if (button.classList.contains('mui-add-department-btn')) {
        onAddDepartment(nodeId);
      } else if (button.classList.contains('mui-view-assessment-btn')) {
        onViewAssessment(nodeId);
      } else if (button.classList.contains('mui-delete-btn')) {
        onDelete(nodeId);
      }
    };

    container.addEventListener('click', handleButtonClick);
    return () => {
      container.removeEventListener('click', handleButtonClick);
      if (chartRef.current && typeof chartRef.current.destroy === 'function') {
        chartRef.current.destroy();
      }
    };
  }, [data, onAddPerson, onAddEntity, onAddDepartment, onViewAssessment, onDelete]);

  return <div ref={containerRef} />;
};

export default OrgChartComponent;
