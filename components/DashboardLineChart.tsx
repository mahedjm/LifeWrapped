'use client';

import { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

interface DashboardLineChartProps {
  data: { label: string; ms: number }[];
  color?: string;
}

export default function DashboardLineChart({ data, color = '#1db954' }: DashboardLineChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const maxMinutes = Math.max(...data.map(d => d.ms / (1000 * 60)));
    const useHours = maxMinutes >= 60;

    const formattedData = data.map(d => ({
      label: d.label,
      value: d.ms / (1000 * 60)
    }));

    if (chartInstance.current) {
      const ctx = chartRef.current?.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        const rgbaColor = color.startsWith('#') ? hexToRgba(color, 0.4) : color;
        const transparentColor = color.startsWith('#') ? hexToRgba(color, 0) : color;
        gradient.addColorStop(0, rgbaColor);
        gradient.addColorStop(1, transparentColor);
        chartInstance.current.data.datasets[0].backgroundColor = gradient;
      }
      chartInstance.current.data.datasets[0].borderColor = color;
      chartInstance.current.data.datasets[0].pointBackgroundColor = color;
      
      chartInstance.current.update();
    } else if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      const gradient = ctx?.createLinearGradient(0, 0, 0, 400);
      gradient?.addColorStop(0, 'rgba(29, 185, 84, 0.4)');
      gradient?.addColorStop(1, 'rgba(29, 185, 84, 0)');

      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: formattedData.map(d => d.label),
          datasets: [{
            label: 'Temps d\'écoute',
            data: formattedData.map(d => d.value),
            borderColor: color,
            backgroundColor: gradient || 'rgba(29, 185, 84, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.4, // Courbe lissée
            pointRadius: 2,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index',
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#181818',
              titleColor: '#fff',
              bodyColor: '#b3b3b3',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
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
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
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
              ticks: { 
                color: '#b3b3b3',
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 12
              }
            }
          }
        }
      });
    }
  }, [data, color]);

  // Helper function to convert hex to rgba
  function hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

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
