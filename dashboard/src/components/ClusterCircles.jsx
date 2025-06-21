// src/components/ClusterCircles.jsx
import React, { useMemo, useEffect, useRef } from "react";
import { Typography } from "@mui/material";

/**
 * ClusterCircles
 *
 * Renderizează o serie de cercuri supradimensionate care reprezintă fiecare cluster,
 * iar sub fiecare cerc afișează un mini‐plot 150×150 cu punctul (centroidAw, centroidSt).
 *
 * Proprietăți:
 *   clusters: {
 *     "0": [ { first_name, last_name, awareness, stress, ... }, ... ],
 *     "1": [ ... ],
 *     ...
 *   }
 *
 * Pentru fiecare cluster calculăm:
 *  - size = numărul de membri
 *  - centroidAw = media membrilor pe awareness
 *  - centroidSt = media membrilor pe stress
 *
 * Desenăm un <svg> cu:
 *  - Un <circle> al cluster-ului, cu rază între [minR, maxR] proporțional cu sqrt(size)
 *  - Sub fiecare cerc, un <g> conținând un mini‐plot 150×150 px, vârf (0..1 × 0..1)
 *  - Eticheta “Cluster X (n)” deasupra cercului
 */

const ClusterCircles = ({ clusters }) => {
  const containerRef = useRef(null);

  // 1) Pregătim datele preprocesate: transformăm obiectul în array sortat crescător după label numeric
  const clusterArray = useMemo(() => {
    if (!clusters) return [];
    return Object.keys(clusters)
      .map((label) => ({
        label,
        members: clusters[label].map((m) => ({
          ...m,
          awareness: parseFloat(m.awareness),
          stress: parseFloat(m.stress),
        })),
      }))
      .sort((a, b) => Number(a.label) - Number(b.label));
  }, [clusters]);

  // 2) Determinăm dimensiunile dinamice când redimensionăm fereastra:
  //    - VB_WIDTH, VB_HEIGHT: “viewBox” pentru <svg>
  //    - colWidth: lățimea “coloanei” fiecărui cluster
  //    - circleCenterY și plotRowY (romper de sus) pentru mini‐ploturi
  const { VB_WIDTH, VB_HEIGHT, colWidth, circleCenterY, plotRowY } = useMemo(() => {
    // Dacă nu există niciun cluster, returnăm valori de fallback
    if (!clusterArray.length) {
      return {
        VB_WIDTH: 600,
        VB_HEIGHT: 300,
        colWidth: 0,
        circleCenterY: 0,
        plotRowY: 0,
      };
    }

    // Vrem să umplem orizontal ~100% din container (paper) cu margină minimă
    // Vom seta un viewBox fix pe 1000 × 400 (proporțional), dar SVG-ul se va scala
    const VB_WIDTH = 1000;
    const VB_HEIGHT = 400;
    const N = clusterArray.length;
    const MARGIN = VB_WIDTH * 0.04; // 4% margină stânga/dreapta
    const usableWidth = VB_WIDTH - 2 * MARGIN;
    const colWidth = usableWidth / N;

    // Vom poziționa cercurile aproximativ la 40% din înălțime
    const circleCenterY = VB_HEIGHT * 0.35;
    // Mini‐plotul va fi desenat sub cerc, la ~70% din înălțime
    const plotRowY = VB_HEIGHT * 0.70;

    return { VB_WIDTH, VB_HEIGHT, colWidth, circleCenterY, plotRowY };
  }, [clusterArray]);

  // 3) Calculăm mărimea cercului (rază) maximă și minimă:
  //    - MIN_RADIUS (în pixeli din viewBox) pentru cluster = 1 membru
  //    - MAX_RADIUS pentru cluster cu cei mai mulți membri
  const { MIN_RADIUS, MAX_RADIUS } = useMemo(() => {
    const MIN_RADIUS = 40; // pixeli în viewBox
    // MAX_RADIUS va fi fie colWidth * 0.4, fie 120, oricare e mai mic
    const maxByWidth = colWidth * 0.4;
    const MAX_RADIUS = Math.min(maxByWidth, 120);
    return { MIN_RADIUS, MAX_RADIUS };
  }, [colWidth]);

  // 4) Verificăm, la redimensionare fereastră, să refacem SVG-ul (opțional)
  //    Momentan nu avem nevoie să refacem nimic, căci viewBox-ul se reatribuează automat.

  // 5) Dacă nu există date, afișăm un simplu mesaj:
  if (!clusterArray.length) {
    return (
      <Typography variant="body1" sx={{ textAlign: "center", p: 2 }}>
        Nu există clustere de afișat în acest moment.
      </Typography>
    );
  }

  // 6) Calculăm “mărimea” (numărul de membri) maximă, pentru scala razelor:
  const maxSize = Math.max(...clusterArray.map((c) => c.members.length));

  // 7) Pentru fiecare cluster construim un <g> care conține:
  //    (a) cercul, (b) eticheta deasupra, (c) mini‐plot sub cerc,
  //    (d) text‐urile cu numele membrilor plasate centralizat în cerc.
  const elements = clusterArray.map((cluster, idx) => {
    const { label, members } = cluster;
    const size = members.length;

    // 7.1) Calculăm raza proporțional cu sqrt(size), între MIN_RADIUS și MAX_RADIUS:
    const rawScale = Math.sqrt(size) / Math.sqrt(maxSize || 1);
    const r = MIN_RADIUS + rawScale * (MAX_RADIUS - MIN_RADIUS);

    // 7.2) Centru X al cercului = margină + idx*colWidth + colWidth/2
    const marginLeft = VB_WIDTH * 0.04;
    const centerX = marginLeft + colWidth * idx + colWidth / 2;

    // 7.3) Centroid Aw & St (media membrilor):
    const sumAw = members.reduce((s, m) => s + m.awareness, 0);
    const sumSt = members.reduce((s, m) => s + m.stress, 0);
    const centroidAw = size ? sumAw / size : 0;
    const centroidSt = size ? sumSt / size : 0;

    // 7.4) Cleanup nume: punem fie “Prenume Nume”, pe rânduri,
    //       iar dacă sunt mai mulți, separăm cu spațiu (dar nu ieșim în margini)
    //    Vom genera un singur text pe un rând, cu toți membrii, dar putem rupe manual
    const namesCombined = members
      .map((m) => `${m.first_name} ${m.last_name}`)
      .join("   "); // spațiu mai larg între doi membri
    // Dacă textul e prea lung, vom seta font‐size mai mic în SVG

    // 7.5) Generăm două culori diferite (pline și contur):
    //       Pentru a nu repeta aceeași nuanță, vom folosi HSL pe baza indexului:
    const hue = (idx * 70) % 360; // ciclăm la fiecare cluster
    const fillColor = `hsla(${hue}, 60%, 80%, 0.5)`;
    const strokeColor = `hsl(${hue}, 70%, 40%)`;

    return (
      <g key={label} opacity={0} className="cluster-group">
        {/* 7.6) Cercul */}
        <circle
          cx={centerX}
          cy={circleCenterY}
          r={r}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={3}
        />

        {/* 7.7) Eticheta deasupra: “Cluster X (n)” */}
        <text
          x={centerX}
          y={circleCenterY - r - 12}
          textAnchor="middle"
          fontSize="20"
          fontWeight="600"
          fill={strokeColor}
        >
          Cluster {label} ({size})
        </text>

        {/* 7.8) Textul cu nume (centrat în cerc) */}
        <text
          x={centerX}
          y={circleCenterY + 4} // puțin sub centrul vertical
          textAnchor="middle"
          fontSize={size > 2 ? 14 : 16} // ajustează dacă sunt foarte mulți
          fill="#222"
          style={{ pointerEvents: "none" }}
        >
          {namesCombined}
        </text>

        {/* 7.9) Mini‐plot: un grup <g> translatat astfel încât să nu mai apară în colțul stâng */}
        <g
          transform={`translate(${centerX - 75}, ${plotRowY})`} // plotSize = 150 → centrare
        >
          {/* 7.9.1) Fundalul pătrat */}
          <rect
            x={0}
            y={0}
            width={150}
            height={150}
            fill="#fff"
            stroke="#ccc"
            strokeWidth={1}
            rx={6}
            ry={6}
          />
          {/* 7.9.2) Liniile de grid (opțional) */}
          <g stroke="#eee" strokeWidth={1}>
            {/* 5 linii orizontale și 5 verticale */}
            {[1, 2, 3, 4].map((i) => (
              <line
                key={`h${i}`}
                x1={0}
                y1={(150 / 5) * i}
                x2={150}
                y2={(150 / 5) * i}
              />
            ))}
            {[1, 2, 3, 4].map((i) => (
              <line
                key={`v${i}`}
                x1={(150 / 5) * i}
                y1={0}
                x2={(150 / 5) * i}
                y2={150}
              />
            ))}
          </g>
          {/* 7.9.3) Punctul centroid */}
          <circle
            cx={centroidAw * 150}
            cy={(1 - centroidSt) * 150}
            r={6}
            fill={strokeColor}
            stroke="#333"
            strokeWidth={1}
          />
          {/* 7.9.4) Eticheta coordonate sub forma “0.xx, 0.yy” */}
          <text
            x={centroidAw * 150 + 8}
            y={(1 - centroidSt) * 150 - 8}
            fontSize="12"
            fill="#333"
          >
            {centroidAw.toFixed(2)}, {centroidSt.toFixed(2)}
          </text>
          {/* 7.9.5) Axe și etichete “Awareness →” / “↑ Stress” */}
          <text
            x={150 / 2}
            y={150 + 20}
            textAnchor="middle"
            fontSize="12"
            fill="#555"
          >
            Awareness →
          </text>
          <text
            x={-20}
            y={150 / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#555"
            transform={`rotate(-90 ${-20},${150 / 2})`}
          >
            ↑ Stress
          </text>
        </g>
      </g>
    );
  });

  // 8) După ce definim toate <g>‐urile, în momentul când componenta apare pe ecran,
  //    animăm gradual opacitatea cercurilor (fade‐in). Putem folosi un useEffect:
  useEffect(() => {
    // Selectăm toate elementele cu clasa .cluster-group și setăm o tranziție
    const node = containerRef.current;
    if (node) {
      const groups = node.querySelectorAll(".cluster-group");
      groups.forEach((g, i) => {
        // Delay incremental pentru fiecare cluster
        setTimeout(() => {
          g.setAttribute("opacity", "1");
          g.style.transition = "opacity 0.6s ease-in-out";
        }, i * 200);
      });
    }
  }, [clusterArray]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflowY: "auto",
        height: "100vh",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Clusters Overview
      </Typography>
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
        style={{
          backgroundColor: "#fafafa",
          border: "1px solid #ddd",
          borderRadius: "6px",
        }}
      >
        {elements}
      </svg>
    </div>
  );
};

export default ClusterCircles;
