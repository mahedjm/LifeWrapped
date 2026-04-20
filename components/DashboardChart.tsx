'use client';

import { useEffect, useRef } from 'react';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface DashboardChartProps {
  data: { date?: string; label?: string; ms: number }[];
  color?: string;
}

export default function DashboardChart({ data, color = '#1db954' }: DashboardChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const prevDataRef = useRef<string>('');

  useEffect(() => {
    const maxMinutes = Math.max(...data.map(d => d.ms / (1000 * 60)));
    const useHours = maxMinutes >= 60;

    const formattedData = data.map(d => ({
      label: d.label || (d.date ? new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }) : ''),
      value: d.ms / (1000 * 60) // Garder toujours en minutes pour la stabilité des calculs
    }));

    if (chartInstance.current) {
      // Mise à jour simplifiée
      chartInstance.current.data.labels = formattedData.map(d => d.label);
      chartInstance.current.data.datasets[0].data = formattedData.map(d => d.value);
      chartInstance.current.data.datasets[0].backgroundColor = color;
      chartInstance.current.data.datasets[0].hoverBackgroundColor = color;
      
      // Mise à jour des axes
      chartInstance.current.options.scales!.y!.ticks!.stepSize = useHours ? 60 : undefined;
      chartInstance.current.options.scales!.y!.ticks!.callback = function(value: any) {
        if (useHours) return Math.round(value / 60) + ' h';
        return value + ' min';
      };
      
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
                  const minutes = context.parsed.y;
                  if (minutes === null || minutes === undefined) return '0 min';
                  if (minutes < 60) return `${minutes.toFixed(0)} min`;
                  const hours = Math.floor(minutes / 60);
                  const remainingMinutes = Math.round(minutes % 60);
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
                stepSize: useHours ? 60 : undefined,
                callback: function(value: any) {
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
  }, [data, color]);

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
