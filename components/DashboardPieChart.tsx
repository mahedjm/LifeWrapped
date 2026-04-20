'use client';

import { useEffect, useRef } from 'react';
import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(PieController, ArcElement, Tooltip, Legend);

interface DashboardPieChartProps {
  data: { genre: string; total_ms: number }[];
}

export default function DashboardPieChart({ data }: DashboardPieChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Harmonious colors adapted to the dark glassmorphism theme
    const backgroundColors = [
      'rgba(29, 185, 12, 0.9)', // Accent green (LifeWrapped)
      'rgba(255, 185, 29, 0.9)', // Yellow/warm
      'rgba(29, 116, 255, 0.9)', // Blue
      'rgba(255, 68, 68, 0.9)', // Red
      'rgba(185, 29, 255, 0.9)', // Purple
      'rgba(0, 212, 255, 0.9)', // Cyan
      'rgba(255, 100, 29, 0.9)', // Orange
      'rgba(215, 215, 215, 0.9)', // Silver
    ];
    
    // Sort and limit to top 8 maximum (to avoid clutter)
    const limitedData = [...data].sort((a,b) => b.total_ms - a.total_ms).slice(0, 8);

    const chartData = {
      labels: limitedData.map(d => {
        // Formatter le texte (majuscule en début)
        const g = d.genre.replace(/['"]+/g, ''); // enlever les guillemets résiduels du json_each s'il y en a
        return g.charAt(0).toUpperCase() + g.slice(1);
      }),
      datasets: [{
        data: limitedData.map(d => Math.round(d.total_ms / (1000 * 60))), // On affiche la légende en min/heures grâce au tooltip
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: 'rgba(24, 24, 24, 1)', // Dark border identical to app background for distinct spacing
        hoverOffset: 10
      }]
    };

    if (chartInstance.current) {
      chartInstance.current.data = chartData;
      chartInstance.current.update();
    } else {
      chartInstance.current = new Chart(chartRef.current, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#b3b3b3',
                font: { size: 11, family: 'Inter, sans-serif', weight: 600 },
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              titleFont: { size: 13 },
              bodyFont: { size: 14, weight: 'bold' },
              callbacks: {
                label: (context) => {
                  const minutes = context.parsed;
                  if (minutes < 60) return ` ${minutes.toFixed(0)} min`;
                  const hours = Math.floor(minutes / 60);
                  const remainingMins = Math.round(minutes % 60);
                  return ` ${hours}h ${remainingMins}min`;
                }
              }
            }
          }
        }
      });
    }

    return () => {};
  }, [data]);

  // Nettoyage final
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  return <canvas ref={chartRef} />;
}
