import { useState, useEffect } from 'react';

export function useTheme() {
  const [themeColor, setThemeColor] = useState<string | null>(null);

  useEffect(() => {
    const savedColor = localStorage.getItem('lw-theme-color');
    if (savedColor) {
      setThemeColor(savedColor);
    } else {
      setThemeColor('#1DB954'); // Default Spotify Green
    }
  }, []);

  useEffect(() => {
    if (themeColor) {
      document.documentElement.style.setProperty('--accent-green', themeColor);
      localStorage.setItem('lw-theme-color', themeColor);
    }
  }, [themeColor]);

  return { themeColor, setThemeColor };
}
