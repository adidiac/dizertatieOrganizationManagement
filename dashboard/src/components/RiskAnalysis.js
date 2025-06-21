// src/components/RiskAnalysis.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Typography, Box } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const RiskAnalysis = () => {
  // 1) Stocăm datele combinate pentru cele trei tipuri de atacuri
  //    În structura: [{ person_id, full_name, phishing, ransomware, social_engineering }, ...]
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2) O funcție async care preia datele din API pentru fiecare tip de atac
  //    și le combină într‐un singur array de obiecte
  const fetchAllRisks = async () => {
    try {
      setLoading(true);
      setError(null);

      // API‐urile asumate:
      // GET /api/person_risks?attack_type=phishing
      // GET /api/person_risks?attack_type=ransomware
      // GET /api/person_risks?attack_type=social_engineering

      // 2.1) Cerem riscul phishing:
      const [resPhishing, resRansomware, resSocial] = await Promise.all([
        axios.get("http://localhost:5007/api/person_risks?attack_type=phishing"),
        axios.get("http://localhost:5007/api/person_risks?attack_type=ransomware"),
        axios.get("http://localhost:5007/api/person_risks?attack_type=social_engineering"),
      ]);

      const dataPhishing = resPhishing.data;       // array de la server [{ person_id, full_name, composite_risk }, ...]
      const dataRansomware = resRansomware.data;
      const dataSocial = resSocial.data;

      // 2.2) Construim un „map” temporar de forma: { person_id: { person_id, full_name, phishing, ransomware, social_engineering } }
      const tmpMap = {};

      const ensureEntry = (entry, attackKey) => {
        const pid = entry.person_id;
        if (!(pid in tmpMap)) {
          tmpMap[pid] = {
            person_id: entry.person_id,
            full_name: entry.full_name,
            phishing: 0,
            ransomware: 0,
            social_engineering: 0,
          };
        }
        // transformăm composite_risk (0 … 1) în procent 0 … 100
        tmpMap[pid][attackKey] = parseFloat((entry.composite_risk * 100).toFixed(2));
      };

      dataPhishing.forEach((entry) => ensureEntry(entry, "phishing"));
      dataRansomware.forEach((entry) => ensureEntry(entry, "ransomware"));
      dataSocial.forEach((entry) => ensureEntry(entry, "social_engineering"));

      // 2.3) Transformăm map-ul într-un array
      const combined = Object.values(tmpMap);

      // 2.4) Opțional: Sortăm după full_name pentru consistență
      combined.sort((a, b) => a.full_name.localeCompare(b.full_name, "ro"));

      setChartData(combined);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching risk data:", err);
      setError("A apărut o eroare la preluarea datelor de risc.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRisks();
  }, []);

  // 3) Dacă încă se încarcă, afișăm un text de loading
  if (loading) {
    return (
      <Container sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h5">Se încarcă datele de risc...</Typography>
      </Container>
    );
  }

  // 4) Dacă e eroare, o afișăm
  if (error) {
    return (
      <Container sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h5" color="error">
          {error}
        </Typography>
      </Container>
    );
  }

  // 5) Dacă nu avem deloc date, afișăm un mesaj
  if (!chartData.length) {
    return (
      <Container sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h5">Nu există date de risc pentru niciun utilizator.</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Risk Analysis
      </Typography>

      {/* 6) ResponsiveContainer va face ca graficul să umple lățimea containerului */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          {/* 7) Axa OX afișează numele persoanei, rotit la 45° ca să încapă */}
          <XAxis
            dataKey="full_name"
            angle={-45}
            textAnchor="end"
            interval={0}
            height={60}
            tick={{ fontSize: 14 }}
          />

          {/* 8) Axa OY: procent (0 … 100) */}
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />

          <Tooltip
            formatter={(value) => `${value}%`}
            labelFormatter={(label) => `Persoană: ${label}`}
          />

          <Legend
            verticalAlign="top"
            wrapperStyle={{ top: 0, left: 25, fontSize: 14 }}
          />

          {/* 9) Cele trei <Bar> din grouped bar chart */}
          <Bar
            dataKey="phishing"
            name="Phishing"
            stackId="a"
            fill="#f44336"    // roșu
            barSize={30}
          >
            <LabelList dataKey="phishing" position="top" formatter={(v) => `${v}%`} />
          </Bar>

          <Bar
            dataKey="ransomware"
            name="Ransomware"
            stackId="a"
            fill="#ff9800"    // portocaliu
            barSize={30}
          >
            <LabelList dataKey="ransomware" position="top" formatter={(v) => `${v}%`} />
          </Bar>

          <Bar
            dataKey="social_engineering"
            name="Social Engineering"
            stackId="a"
            fill="#4caf50"    // verde
            barSize={30}
          >
            <LabelList dataKey="social_engineering" position="top" formatter={(v) => `${v}%`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Container>
  );
};

export default RiskAnalysis;
