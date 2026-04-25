import { useState, useCallback, useRef } from 'react';
import { Stats } from '@/lib/types';

export function useStats(
  initialPeriod: string, 
  initialTrackPeriod: string, 
  initialChartPeriod: string,
  initialArtistLimit: number,
  initialTrackLimit: number
) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback(async (
    sync = false, 
    currentArtistPeriod = initialPeriod, 
    currentTrackPeriod = initialTrackPeriod, 
    currentChartPeriod = initialChartPeriod,
    currentArtistLimit = initialArtistLimit,
    currentTrackLimit = initialTrackLimit,
    isManual = false,
    activePeriod = initialPeriod,
    activeTrackPeriod = initialTrackPeriod,
    forceLoading = false
  ) => {
    // Annulation de la requête précédente si elle existe encore
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (sync) setSyncing(true);
    if (isManual) setManualSyncing(true);
    if (forceLoading) setLoading(true);
    
    try {
      const url = new URL('/api/stats', window.location.origin);
      if (sync) url.searchParams.set('sync', 'true');
      url.searchParams.set('artistPeriod', currentArtistPeriod);
      url.searchParams.set('trackPeriod', currentTrackPeriod);
      url.searchParams.set('chartPeriod', currentChartPeriod);
      url.searchParams.set('artistLimit', currentArtistLimit.toString());
      url.searchParams.set('trackLimit', currentTrackLimit.toString());

      // Partial loading logic
      const isChartOnly = currentChartPeriod !== initialChartPeriod && currentArtistPeriod === activePeriod && currentTrackPeriod === activeTrackPeriod && !sync;
      if (isChartOnly) {
        url.searchParams.set('partial', 'chart');
        setLoadingChart(true);
      }

      const [statsRes, badgesRes] = await Promise.all([
        fetch(url.toString(), { signal: controller.signal }),
        fetch('/api/badges', { signal: controller.signal })
      ]);

      if (!statsRes.ok) throw new Error(`Erreur serveur stats: ${statsRes.status}`);
      
      const data = await statsRes.json();
      let badgesData = { badges: [] };

      if (badgesRes.ok) {
        try {
          badgesData = await badgesRes.json();
        } catch(e) {}
      }
      
      if (data.chartData && !data.topArtists) {
        // Partial update: only update chartData
        setStats(prev => prev ? { ...prev, chartData: data.chartData } : data);
      } else {
        setStats({ ...data, badges: badgesData.badges });
      }
      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Requête stats annulée (Race Condition évitée)');
      } else {
        console.error('Fetch error:', err);
        setError(err.message);
      }
    } finally {
      if (controller === abortControllerRef.current) {
        setLoading(false);
        setSyncing(false);
        setLoadingChart(false);
        setManualSyncing(false);
      }
    }
  }, [initialPeriod, initialTrackPeriod, initialChartPeriod, initialArtistLimit, initialTrackLimit]);

  return {
    stats,
    setStats,
    loading,
    syncing,
    manualSyncing,
    loadingChart,
    setLoadingChart,
    error,
    fetchStats,
    setSyncing
  };
}
