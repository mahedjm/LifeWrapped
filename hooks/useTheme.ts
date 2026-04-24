import { useState, useEffect } from 'react';

export function useTheme() {
  const [themeColor, setThemeColor] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lw-theme-color') || '#1DB954';
    }
    return '#1DB954';
  });

  useEffect(() => {
    if (themeColor) {
      document.documentElement.style.setProperty('--accent-green', themeColor);
      localStorage.setItem('lw-theme-color', themeColor);
    }
  }, [themeColor]);

  return { themeColor, setThemeColor };
}
