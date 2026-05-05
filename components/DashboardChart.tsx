'use client';

import { useEffect, useRef } from 'react';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface DashboardChartProps {
  data: { date?: string; label?: string; ms: number }[];
  color?: string;
  isCount?: boolean;
}

export default function DashboardChart({ data, color = '#1db954', isCount = false }: DashboardChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const prevDataRef = useRef<string>('');

  useEffect(() => {
    const maxVal = Math.max(...data.map(d => isCount ? d.ms : d.ms / (1000 * 60)));
    const useHours = !isCount && maxVal >= 60;

    const formattedData = data.map(d => ({
      label: d.label || (d.date ? new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }) : ''),
      value: isCount ? d.ms : d.ms / (1000 * 60)
    }));

    if (chartInstance.current) {
      // Mise à jour simplifiée
      chartInstance.current.data.labels = formattedData.map(d => d.label);
      chartInstance.current.data.datasets[0].data = formattedData.map(d => d.value);
      chartInstance.current.data.datasets[0].backgroundColor = color;
      chartInstance.current.data.datasets[0].hoverBackgroundColor = color;
      
      // Mise à jour des axes
      const yTicks = chartInstance.current.options.scales?.y?.ticks as any;
      if (yTicks) {
        yTicks.stepSize = useHours ? 60 : undefined;
        yTicks.callback = function(value: any) {
          if (useHours) return Math.round(value / 60) + ' h';
          return value + ' min';
        };
      }
      
      chartInstance.current.update();
    } else if (chartRef.current) {
      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: formattedData.map(d => d.label),
          datasets: [{
            label: 'Temps d\'écoute',
            data: formattedData.map(d => d.value),
            backgroundColor: color,
            borderRadius: 8,
            hoverBackgroundColor: color,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const val = context.parsed.y;
                  if (val === null || val === undefined) return '0';
                  if (isCount) return `${val.toFixed(1)} écoutes (moy.)`;
                  if (val < 60) return `${val.toFixed(0)} min`;
                  const hours = Math.floor(val / 60);
                  const remainingMinutes = Math.round(val % 60);
                  return `${hours}h ${remainingMinutes}min`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { 
                color: '#b3b3b3',
                stepSize: isCount ? undefined : (useHours ? 60 : undefined),
                callback: function(value: any) {
                  if (isCount) return value.toFixed(1) + ' écoutes';
                  if (useHours) return Math.round(value / 60) + ' h';
                  return value + ' min';
                }
              }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#b3b3b3' }
            }
          }
        }
      });
    }

    // On ne détruit le graphique que lors du démontage réel du composant
    return () => {
      // On ne fait rien ici pour garder le graphique en vie entre les re-renders
    };
  }, [data, color, isCount]);

  // Nettoyage final lors de la fermeture de la page
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
