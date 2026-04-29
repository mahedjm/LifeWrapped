import { useState, useCallback, useRef } from 'react';
import { Stats } from '@/lib/types';

// Cache TTL : 3 minutes (les données changent rarement entre deux clics)
const CACHE_TTL_MS = 3 * 60 * 1000;

interface CacheEntry {
  data: Stats;
  timestamp: number;
}

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

  // Cache en mémoire — survit aux re-renders, réinitialisé à chaque rechargement de page
  const statsCache = useRef<Map<string, CacheEntry>>(new Map());
  const badgesCache = useRef<{ data: any; timestamp: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prefetchedRef = useRef(false);

  // ─── Fonction utilitaire : construit la clé de cache ───
  const buildCacheKey = (
    artistPeriod: string,
    trackPeriod: string,
    chartPeriod: string,
    artistLimit: number,
    trackLimit: number
  ) => `${artistPeriod}|${trackPeriod}|${chartPeriod}|${artistLimit}|${trackLimit}`;

  // ─── Fonction utilitaire : construit l'URL de stats ───
  const buildUrl = (
    artistPeriod: string,
    trackPeriod: string,
    chartPeriod: string,
    artistLimit: number,
    trackLimit: number,
    sync: boolean
  ) => {
    const url = new URL('/api/stats', window.location.origin);
    if (sync) url.searchParams.set('sync', 'true');
    url.searchParams.set('artistPeriod', artistPeriod);
    url.searchParams.set('trackPeriod', trackPeriod);
    url.searchParams.set('chartPeriod', chartPeriod);
    url.searchParams.set('artistLimit', artistLimit.toString());
    url.searchParams.set('trackLimit', trackLimit.toString());
    return url.toString();
  };

  // ─── Fonction utilitaire : récupère les badges (avec cache) ───
  const fetchBadges = async (signal?: AbortSignal): Promise<any[]> => {
    const now = Date.now();
    if (badgesCache.current && now - badgesCache.current.timestamp < CACHE_TTL_MS) {
      return badgesCache.current.data;
    }
    try {
      const res = await fetch('/api/badges', signal ? { signal } : {});
      if (res.ok) {
        const data = await res.json();
        badgesCache.current = { data: data.badges || [], timestamp: now };
        return data.badges || [];
      }
    } catch (e) {}
    return badgesCache.current?.data || [];
  };

  // ─── Pré-charge silencieusement les autres combinaisons de périodes ───
  const prefetchOtherPeriods = useCallback(async (
    currentArtistPeriod: string,
    currentTrackPeriod: string,
    artistLimit: number,
    trackLimit: number
  ) => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;

    const periods = ['week', 'month', 'year'];
    const toPrefetch: Array<[string, string, string]> = [];

    for (const ap of periods) {
      for (const tp of periods) {
        if (ap === currentArtistPeriod && tp === currentTrackPeriod) continue;
        // On pré-charge seulement les combinaisons les plus courantes
        if (ap === tp) {
          toPrefetch.push([ap, tp, ap]);
        }
      }
    }

    // Pré-charge avec un délai pour ne pas concurrencer le premier chargement
    setTimeout(async () => {
      for (const [ap, tp, cp] of toPrefetch) {
        const key = buildCacheKey(ap, tp, cp, artistLimit, trackLimit);
        if (statsCache.current.has(key)) continue;
        try {
          const url = buildUrl(ap, tp, cp, artistLimit, trackLimit, false);
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const badges = await fetchBadges();
            const entry: CacheEntry = {
              data: { ...data, badges },
              timestamp: Date.now(),
            };
            statsCache.current.set(key, entry);
            console.log(`[Cache] Pré-chargé: ${ap}/${tp}`);
          }
        } catch (e) {
          // Silencieux — c'est du prefetch optionnel
        }
        // Petit délai entre chaque prefetch pour ne pas surcharger
        await new Promise(r => setTimeout(r, 500));
      }
    }, 2000);
  }, []);

  // ─── Fonction principale ───
  const fetchStats = useCallback(async (
    sync = false,
    currentArtistPeriod = initialPeriod,
    currentTrackPeriod = initialTrackPeriod,
    currentChartPeriod = initialChartPeriod,
    currentArtistLimit = initialArtistLimit,
    currentTrackLimit = initialTrackLimit,
    isManual = false,
    _unusedA = '',
    _unusedB = '',
    forceLoading = false
  ) => {
    const cacheKey = buildCacheKey(
      currentArtistPeriod, currentTrackPeriod, currentChartPeriod,
      currentArtistLimit, currentTrackLimit
    );

    // ── 1. CACHE HIT : affichage instantané ──────────────────────────────
    const cached = statsCache.current.get(cacheKey);
    const now = Date.now();
    const isCacheValid = cached && (now - cached.timestamp < CACHE_TTL_MS);

    if (isCacheValid && !sync) {
      // Affiche instantanément les données du cache
      setStats(cached.data);
      setLoading(false);

      // Rafraîchissement silencieux en arrière-plan (pas de spinner)
      // pour maintenir les données à jour
      try {
        const url = buildUrl(
          currentArtistPeriod, currentTrackPeriod, currentChartPeriod,
          currentArtistLimit, currentTrackLimit, false
        );
        const [statsRes, badges] = await Promise.all([
          fetch(url),
          fetchBadges(),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          const freshEntry: CacheEntry = { data: { ...data, badges }, timestamp: Date.now() };
          statsCache.current.set(cacheKey, freshEntry);
          setStats(freshEntry.data); // Mise à jour silencieuse
        }
      } catch (e) {}
      return;
    }

    // ── 2. CACHE MISS : chargement normal avec spinner ───────────────────
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (sync) setSyncing(true);
    if (isManual) setManualSyncing(true);
    if (forceLoading || !isCacheValid) setLoading(true);

    try {
      const url = buildUrl(
        currentArtistPeriod, currentTrackPeriod, currentChartPeriod,
        currentArtistLimit, currentTrackLimit, sync
      );

      const [statsRes, badges] = await Promise.all([
        fetch(url, { signal: controller.signal }),
        fetchBadges(controller.signal),
      ]);

      if (!statsRes.ok) throw new Error(`Erreur serveur stats: ${statsRes.status}`);
      const data = await statsRes.json();

      const entry: CacheEntry = {
        data: { ...data, badges },
        timestamp: Date.now(),
      };

      // Stocke en cache
      if (!sync) {
        statsCache.current.set(cacheKey, entry);
      }

      setStats(entry.data);
      setError(null);

      // Lance le pré-chargement des autres périodes après le premier succès
      prefetchOtherPeriods(
        currentArtistPeriod, currentTrackPeriod,
        currentArtistLimit, currentTrackLimit
      );

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[Cache] Requête annulée (AbortController)');
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
  }, [prefetchOtherPeriods]);

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
    setSyncing,
  };
}
