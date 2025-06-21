// src/components/ClusteringChart.js
import React from 'react';
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  PointElement,
  LinearScale,
  Title,
  Filler
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Înregistrează plugin-urile necesare
ChartJS.register(
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  Filler,
  ChartDataLabels   // pluginul pentru etichete statice
);

const ClusteringChart = ({ clusters }) => {
  /**
   * clusters: obiect de forma
   * {
   *   "0": [ { awareness, conscientiousness, stress, neuroticism, risk_tolerance, person_id, first_name, last_name, email, ... }, ... ],
   *   "1": [ {...}, ... ],
   *   "2": [ {...}, ... ],
   *   …
   * }
   *
   * Ce vom face: pentru fiecare cluster, vom extrage un dataset în care:
   *   - x = awareness
   *   - y = stress
   *   - label-ul este "FirstName LastName"
   *   - colorarea punctelor se face per cluster
   */

  const datasets = Object.keys(clusters).map((clusterLabel, index) => {
    const arrayOfPersons = clusters[clusterLabel];

    // Generăm o culoare diferită pentru fiecare cluster
    const r = Math.floor(50 + Math.random() * 205);
    const g = Math.floor(50 + Math.random() * 205);
    const b = Math.floor(50 + Math.random() * 205);
    const fillColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
    const borderColor = `rgba(${r}, ${g}, ${b}, 0.9)`;

    // Construim lista de puncte pentru acest cluster
    const dataPoints = arrayOfPersons.map(person => ({
      x: person.awareness,   // dimensiunea X: awareness (în [0,1])
      y: person.stress,      // dimensiunea Y: stress (în [0,1])
      label: `${person.first_name} ${person.last_name}`, // eticheta
      email: person.email,
      person_id: person.person_id,
      conscientiousness: person.conscientiousness,
      neuroticism: person.neuroticism,
      risk_tolerance: person.risk_tolerance,
    }));

    return {
      label: `Cluster ${clusterLabel}`,
      data: dataPoints,
      backgroundColor: fillColor,
      borderColor: borderColor,
      borderWidth: 1.5,
      pointRadius: 6,
      pointHoverRadius: 8,
      // Umple punctul cu o nuanță mai transparentă, iar conturul este mai saturat
      showLine: false, // nu legăm punctele
    };
  });

  const chartData = {
    datasets: datasets
  };

  const options = {
    // Activează plugin-ul de datalabels
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
        text: 'Psychometric Clustering'
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            const p = context.raw;
            return [
              `Name: ${p.label}`,
              `Email: ${p.email}`,
              `Awareness: ${p.x.toFixed(2)}`,
              `Stress: ${p.y.toFixed(2)}`,
              `Conscientiousness: ${p.conscientiousness.toFixed(2)}`,
              `Neuroticism: ${p.neuroticism.toFixed(2)}`,
              `Risk Tolerance: ${p.risk_tolerance.toFixed(2)}`
            ];
          }
        }
      },
      // Setări pentru afișarea etichetelor care stau lângă puncte
      datalabels: {
        color: '#000',
        anchor: 'end',
        align: 'top',
        font: {
          size: 10,
          weight: 'bold'
        },
        formatter: (value) => {
          return value.label; // afișăm "FirstName LastName"
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Awareness'
        },
        min: 0,
        max: 1,
        ticks: {
          stepSize: 0.2
        }
      },
      y: {
        title: {
          display: true,
          text: 'Stress'
        },
        min: 0,
        max: 1,
        ticks: {
          stepSize: 0.2
        }
      }
    },
    maintainAspectRatio: false,
    responsive: true
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Scatter data={chartData} options={options} />
    </div>
  );
};

export default ClusteringChart;
