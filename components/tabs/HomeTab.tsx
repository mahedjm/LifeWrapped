import React from 'react';
import { Activity, Clock, Calendar, BarChart3, RefreshCw, Music, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import InfoTooltip from '@/components/InfoTooltip';
import { formatTime, formatDiffTime } from '@/lib/utils';
import { Stats } from '@/lib/types';

const DashboardChart = dynamic(() => import('@/components/DashboardChart'), { ssr: false });
const DashboardLineChart = dynamic(() => import('@/components/DashboardLineChart'), { ssr: false });

interface HomeTabProps {
  stats: Stats | null;
  period: 'week' | 'month' | 'year';
  setPeriod: (v: 'week' | 'month' | 'year') => void;
  trackPeriod: 'week' | 'month' | 'year';
  setTrackPeriod: (v: 'week' | 'month' | 'year') => void;
  chartPeriod: 'week' | 'month' | 'year';
  setChartPeriod: (v: 'week' | 'month' | 'year') => void;
  artistLimit: number;
  setArtistLimit: (v: number) => void;
  trackLimit: number;
  setTrackLimit: (v: number) => void;
  showArtistLimit: boolean;
  setShowArtistLimit: (v: boolean) => void;
  showTrackLimit: boolean;
  setShowTrackLimit: (v: boolean) => void;
  themeColor: string;
  loadingChart: boolean;
  syncing: boolean;
}

export default function HomeTab({
  stats, period, setPeriod, trackPeriod, setTrackPeriod, chartPeriod, setChartPeriod,
  artistLimit, setArtistLimit, trackLimit, setTrackLimit, showArtistLimit, setShowArtistLimit,
  showTrackLimit, setShowTrackLimit, themeColor, loadingChart, syncing
}: HomeTabProps) {
  
  const weeklyTotalMs = stats?.weekly?.reduce((acc, curr) => acc + curr.ms, 0) || 0;
  const hasData = stats?.chartData?.some(d => d.ms > 0);

  return (
    <>
      {/* KPI Cards (Aujourd'hui, Semaine, Record) */}
      <div className="kpi-grid">
        <div className="card animated" style={{ animationDelay: '0.1s' }}>
          <div className="card-title">Aujourd'hui</div>
          <div className="card-value">{formatTime(stats?.today || 0)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            {stats?.yesterday !== undefined && stats.yesterday > 0 && (() => {
              const diffMs = (stats.today || 0) - stats.yesterday;
              const isPos = diffMs >= 0;
              return (
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  color: isPos ? '#1ed760' : '#ff4444',
                  background: isPos ? 'rgba(30, 215, 96, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {isPos ? '+' : '-'} {formatDiffTime(Math.abs(diffMs))}
                </span>
              );
            })()}
            <span className="card-sub">vs hier</span>
          </div>
        </div>

        <div className="card animated" style={{ animationDelay: '0.2s' }}>
          <div className="card-title">Cette Semaine</div>
          <div className="card-value">{formatTime(weeklyTotalMs)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            {stats?.prevWeekTotal !== undefined && stats.prevWeekTotal > 0 && (() => {
              const diffMs = weeklyTotalMs - stats.prevWeekTotal;
              const isPos = diffMs >= 0;
              return (
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 700, 
                  color: isPos ? '#1ed760' : '#ff4444',
                  background: isPos ? 'rgba(30, 215, 96, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {isPos ? '+' : '-'} {formatDiffTime(Math.abs(diffMs))}
                </span>
              );
            })()}
            <span className="card-sub">vs semaine dernière</span>
          </div>
        </div>

        <div className="card animated" style={{ animationDelay: '0.3s' }}>
          <div className="card-title">Top Intensité</div>
          <div className="card-value">
            {stats?.weekly?.length ? formatTime(Math.max(...stats.weekly.map(d => d.ms))) : '0 min'}
          </div>
          <div className="card-sub">Record quotidien des 7 derniers jours</div>
        </div>
      </div>

      {/* Section Obsession */}
      {stats?.obsession && (
        <div className="card animated obsession-card" style={{ 
          animationDelay: '0.35s', 
          marginBottom: '30px', 
          background: `linear-gradient(135deg, color-mix(in srgb, var(--accent-green), transparent 90%) 0%, rgba(0,0,0,0) 100%)`, 
          border: '1px solid color-mix(in srgb, var(--accent-green), transparent 70%)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px', 
          padding: '24px' 
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', position: 'relative' }}>
              <img src={stats.obsession.image_url} alt={stats.obsession.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800 }}>🔥 CHAUD</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Obsession du moment
              <InfoTooltip text="Le morceau que vous avez le plus écouté au cours des dernières 48 heures." />
            </div>
            <h3 style={{ fontSize: '1.5rem', margin: '0 0 5px 0', fontWeight: 800 }}>{stats.obsession.title}</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>{stats.obsession.artist}</p>
            <div style={{ marginTop: '12px', display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--accent-green)' }}>{stats.obsession.play_count} {stats.obsession.play_count > 1 ? 'écoutes' : 'écoute'}</span> sur les dernières 48h
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      {stats && (
        <div className="dashboard-grid animated">
          <div className="main-column">
            <div className="stats-header" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="section-badge-container">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
                  padding: '8px 24px',
                  borderRadius: '50px',
                  border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}>
                  <Activity size={18} color="var(--accent-green)" />
                  <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Résumé d'écoute
                    <InfoTooltip text="Statistiques globales basées sur l'intégralité de votre historique local." />
                  </h2>
                </div>
              </div>
            </div>

            {/* CHART CONTAINER */}
            <div className="chart-container animated" style={{ animationDelay: '0.4s', position: 'relative' }}>
              {loadingChart && (
                <div style={{ 
                  position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.4)', backdropFilter: 'blur(4px)', 
                  zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px'
                }}>
                  <RefreshCw className="animate-spin" style={{ color: 'var(--accent-green)' }} />
                </div>
              )}
              <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <BarChart3 color="var(--accent-green)" />
                  <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    Activité {chartPeriod === 'week' ? 'Hebdomadaire' : chartPeriod === 'month' ? 'Mensuelle' : 'Annuelle'}
                    <InfoTooltip text="Volume total d'écoute (en heures) cumulé sur la période sélectionnée." />
                  </h3>
                </div>
                <div className="filter-row-mobile" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1, width: '100%' }}>
                  <div className="filter-bar-wrapper-mobile" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                    <div style={{ 
                      display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px', 
                      borderRadius: '24px', border: '1px solid var(--glass-border)', width: '100%', justifyContent: 'space-between'
                    }}>
                      {[ { id: 'week', label: 'Semaine' }, { id: 'month', label: 'Mois' }, { id: 'year', label: 'Année' } ].map(p => (
                        <button
                          key={p.id}
                          onClick={() => setChartPeriod(p.id as any)}
                          style={{
                            flex: 1, padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                            background: chartPeriod === p.id ? `color-mix(in srgb, ${themeColor || '#1DB954'}, transparent 90%)` : 'transparent',
                            color: chartPeriod === p.id ? 'var(--accent-green)' : 'var(--text-secondary)', transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {hasData && stats?.chartData ? (
                  <DashboardChart data={stats.chartData} color={themeColor || '#1DB954'} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Music size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
                    <p>Écoutez des morceaux pour générer le graphique.</p>
                  </div>
                )}
              </div>
            </div>

            {/* HABITUDES D'ECOUTE */}
            <div className="section-badge-container" style={{ marginBottom: '25px', color: 'var(--text-primary)', marginTop: '50px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px', background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
                padding: '8px 24px', borderRadius: '50px', border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                <Calendar size={18} color="var(--accent-green)" />
                <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Habitudes d'Écoute</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px', marginBottom: '40px' }}>
              <div className="chart-container animated" style={{ margin: 0, animationDelay: '0.5s' }}>
                <div className="chart-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Clock size={18} color="var(--accent-green)" />
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Heures de Pointe <InfoTooltip text="Moyenne hebdomadaire de votre temps d'écoute par heure. Montre votre routine type." /></h3>
                  </div>
                </div>
                <div style={{ height: '220px' }}>
                  {stats?.hourlyActivity ? (
                    <DashboardLineChart data={stats.hourlyActivity} color={themeColor || '#1DB954'} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Chargement...</div>
                  )}
                </div>
              </div>

              <div className="chart-container animated" style={{ margin: 0, animationDelay: '0.6s' }}>
                <div className="chart-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart3 size={18} color="var(--accent-green)" />
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Jours préférés <InfoTooltip text="Répartition moyenne de votre temps d'écoute sur les 7 jours de la semaine." /></h3>
                  </div>
                </div>
                <div style={{ height: '220px' }}>
                  {stats?.dailyActivity ? (
                    <DashboardChart data={stats.dailyActivity} color={themeColor || '#1DB954'} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Chargement...</div>
                  )}
                </div>
              </div>
            </div>

            {/* TOP ARTISTS */}
            {stats?.topArtists && stats.topArtists.length > 0 && (
              <div className="chart-container animated" style={{ animationDelay: '0.5s' }}>
                <div className="chart-header">
                  <div className="section-badge-container" style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setShowArtistLimit(!showArtistLimit)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
                        padding: '6px 20px', borderRadius: '50px', border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)',
                        cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', transition: 'all 0.2s ease'
                      }}
                    >
                      <Music size={16} color="var(--accent-green)" />
                      <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Top {artistLimit} Artistes
                        <ChevronDown size={14} style={{ transform: showArtistLimit ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        <InfoTooltip text="Vos artistes les plus écoutés sur la période sélectionnée." />
                      </h3>
                    </button>
                    {showArtistLimit && (
                      <div className="custom-select-menu" style={{ top: '110%', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
                        {[5, 10, 25, 50].map(l => (
                          <div key={l} className={`custom-select-item ${artistLimit === l ? 'active' : ''}`} onClick={() => { setArtistLimit(l); setShowArtistLimit(false); }}>Top {l}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="filter-row-mobile" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '24px', border: '1px solid var(--glass-border)', minWidth: '200px', justifyContent: 'space-between' }}>
                      {['week', 'month', 'year'].map(p => (
                        <button key={p} onClick={() => setPeriod(p as any)} style={{
                            flex: 1, padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                            background: period === p ? `color-mix(in srgb, ${themeColor}, transparent 90%)` : 'transparent', color: period === p ? 'var(--accent-green)' : 'var(--text-secondary)', transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                          }}>{p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="scrollable-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: stats.topArtists.length > 5 ? '400px' : 'none', overflowY: stats.topArtists.length > 5 ? 'auto' : 'visible', paddingRight: stats.topArtists.length > 5 ? '12px' : '0', opacity: syncing ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
                  {stats.topArtists.slice(0, artistLimit).map((a, index) => {
                    const percentage = (a.total_ms / stats.topArtists[0].total_ms) * 100;
                    return (
                      <div key={a.artist} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '2px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {a.image_url ? <img src={a.image_url} alt={a.artist} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music size={20} color="var(--text-secondary)" />}
                          </div>
                          <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--accent-green)', color: '#000', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-dark)' }}>{index + 1}</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', gap: '15px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{a.artist}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatTime(a.total_ms)}</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--accent-green)', borderRadius: '3px', transition: 'width 1s ease-out' }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TOP TRACKS */}
            {stats?.topTracks && stats.topTracks.length > 0 && (
              <div className="chart-container animated" style={{ animationDelay: '0.6s' }}>
                <div className="chart-header">
                  <div className="section-badge-container" style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setShowTrackLimit(!showTrackLimit)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px', background: 'color-mix(in srgb, var(--accent-green), transparent 90%)',
                        padding: '6px 20px', borderRadius: '50px', border: '1px solid color-mix(in srgb, var(--accent-green), transparent 80%)',
                        cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', transition: 'all 0.2s ease'
                      }}
                    >
                      <Clock size={16} color="var(--accent-green)" />
                      <h3 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Top {trackLimit} Titres
                        <ChevronDown size={14} style={{ transform: showTrackLimit ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        <InfoTooltip text="Vos morceaux les plus écoutés sur la période sélectionnée." />
                      </h3>
                    </button>
                    {showTrackLimit && (
                      <div className="custom-select-menu" style={{ top: '110%', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
                        {[5, 10, 25, 50].map(l => (
                          <div key={l} className={`custom-select-item ${trackLimit === l ? 'active' : ''}`} onClick={() => { setTrackLimit(l); setShowTrackLimit(false); }}>Top {l}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="filter-row-mobile" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '24px', border: '1px solid var(--glass-border)', minWidth: '200px', justifyContent: 'space-between' }}>
                      {['week', 'month', 'year'].map(p => (
                        <button key={p} onClick={() => setTrackPeriod(p as any)} style={{
                            flex: 1, padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                            background: trackPeriod === p ? `color-mix(in srgb, ${themeColor}, transparent 90%)` : 'transparent', color: trackPeriod === p ? 'var(--accent-green)' : 'var(--text-secondary)', transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                          }}>{p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="scrollable-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: stats.topTracks.length > 5 ? '400px' : 'none', overflowY: stats.topTracks.length > 5 ? 'auto' : 'visible', paddingRight: stats.topTracks.length > 5 ? '12px' : '0', opacity: syncing ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
                  {stats.topTracks.slice(0, trackLimit).map((t, index) => {
                    const percentage = (t.play_count / stats.topTracks[0].play_count) * 100;
                    return (
                      <div key={`${t.title}-${t.artist}`} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '2px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {t.image_url ? <img src={t.image_url} alt={t.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music size={20} color="var(--text-secondary)" />}
                          </div>
                          <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--accent-green)', color: '#000', width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-dark)' }}>{index + 1}</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.95rem', gap: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.artist}</span>
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{t.play_count} {t.play_count > 1 ? 'écoutes' : 'écoute'}</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--accent-green)', borderRadius: '3px', transition: 'width 1s ease-out' }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
