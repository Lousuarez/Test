
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Activity, MapPin, Clock, Zap, TrendingUp, 
  Heart, Flame, Calendar, ChevronRight, ChevronLeft,
  Navigation2, Maximize2, ExternalLink, Camera, X, Info, Loader2
} from 'lucide-react';

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  total_photo_count: number;
  photos?: {
    primary?: { urls: Record<string, string> };
    all?: Array<{ urls: Record<string, string> }>;
  };
  [key: string]: any;
}

const SimpleLineChart: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  const width = 1000;
  const height = 150;
  const padding = 10;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-[150px] relative mt-4 group">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M ${padding},${height} ${points} L ${width - padding},${height} Z`}
          fill="url(#chartGradient)"
          className="transition-all duration-1000"
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-1000"
          strokeDasharray="2000"
          strokeDashoffset="0"
          style={{ animation: 'drawPath 2s ease-out forwards' }}
        />
      </svg>
      <div className="absolute top-0 left-0 right-0 flex justify-between text-[8px] font-bold text-slate-300 uppercase tracking-widest px-1">
        <span>Máx: {max} bpm</span>
        <span>Min: {min} bpm</span>
      </div>
      <style>{`
        @keyframes drawPath {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [stravaStatus, setStravaStatus] = useState<'pendente' | 'conectando' | 'sucesso' | 'erro'>('pendente');
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [hrData, setHrData] = useState<number[] | null>(null);

  const CLIENT_ID = '201813';
  const CLIENT_SECRET = '9554fcf77b834261de21765727debe5e89f02062';
  const ATHLETE_ID = '49665406';
  const INITIAL_TOKEN = '8f5b66d76aea84281be471fccf4f89ac7d97d110';

  useEffect(() => {
    const checkConnection = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const storedToken = localStorage.getItem('strava_access_token') || INITIAL_TOKEN;

      if (code) {
        handleStravaExchange(code);
      } else if (storedToken) {
        verifyAndFetch(storedToken);
      }
    };
    checkConnection();
  }, []);

  const verifyAndFetch = async (token: string) => {
    setStravaStatus('conectando');
    try {
      const response = await fetch(`https://www.strava.com/api/v3/athletes/${ATHLETE_ID}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        localStorage.setItem('strava_access_token', token);
        setStravaStatus('sucesso');
        fetchActivities(token);
      } else {
        setStravaStatus('pendente');
      }
    } catch (e) {
      setStravaStatus('erro');
    }
  };

  const fetchActivities = async (token: string) => {
    try {
      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (e) { console.error(e); }
  };

  const handleStravaExchange = async (code: string) => {
    setStravaStatus('conectando');
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
        }),
      });
      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('strava_access_token', data.access_token);
        setStravaStatus('sucesso');
        fetchActivities(data.access_token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) { setStravaStatus('erro'); }
  };

  const startStravaAuth = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=read,activity:read_all`;
  };

  const extractUrlFromObject = (obj: any) => {
    if (!obj) return null;
    if (obj.urls && typeof obj.urls === 'object') {
      const keys = Object.keys(obj.urls).sort((a, b) => parseInt(b) - parseInt(a));
      if (keys.length > 0) return obj.urls[keys[0]];
    }
    return obj.url || obj.uri || (typeof obj === 'string' ? obj : null);
  };

  const getPhotoUrl = (act: any) => {
    if (!act) return null;
    
    // Tenta encontrar em photos.primary
    if (act.photos?.primary) {
      const url = extractUrlFromObject(act.photos.primary);
      if (url) return url;
    }

    // Tenta o primeiro item da galeria se disponível
    if (act.photos?.all && Array.isArray(act.photos.all) && act.photos.all.length > 0) {
      const url = extractUrlFromObject(act.photos.all[0]);
      if (url) return url;
    }

    // Fallback legado
    if (act.primary_photo) {
      return extractUrlFromObject(act.primary_photo);
    }

    return null;
  };

  const getAllPhotosForActivity = (act: StravaActivity | null) => {
    if (!act) return [];
    const urls: string[] = [];
    
    // Inclui a foto primária se existir
    const main = getPhotoUrl(act);
    if (main) urls.push(main);
    
    // Inclui todas as outras da galeria detalhada
    if (act.photos?.all && Array.isArray(act.photos.all)) {
      act.photos.all.forEach((p: any) => {
        const u = extractUrlFromObject(p);
        if (u && !urls.includes(u)) urls.push(u);
      });
    }
    return Array.from(new Set(urls.filter(Boolean)));
  };

  const selectedActivityPhotos = useMemo(() => {
    return getAllPhotosForActivity(selectedActivity);
  }, [selectedActivity]);

  const translateType = (type: string) => {
    const types: Record<string, string> = {
      'Run': 'CORRIDA',
      'Ride': 'CICLISMO',
      'VirtualRide': 'PEDAL VIRTUAL',
      'Walk': 'CAMINHADA',
      'Swim': 'NATAÇÃO',
      'WeightTraining': 'MUSCULAÇÃO',
      'Workout': 'TREINO',
      'Yoga': 'YOGA',
      'Hike': 'TRILHA'
    };
    return types[type] || type.toUpperCase();
  };

  const formatPace = (speedMs: number, type: string) => {
    if (!speedMs || speedMs === 0) return '--';
    if (type === 'Ride' || type === 'VirtualRide') {
      return (speedMs * 3.6).toFixed(1);
    }
    const paceMinPerKm = 1000 / (speedMs * 60);
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  };

  const handleOpenActivity = async (act: StravaActivity) => {
    setCurrentPhotoIndex(0);
    setSelectedActivity(act);
    setHrData(null);
    const token = localStorage.getItem('strava_access_token');
    if (!token) return;

    setIsLoadingDetails(true);
    try {
      const response = await fetch(`https://www.strava.com/api/v3/activities/${act.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const fullAct = await response.json();
        setSelectedActivity(fullAct);

        if (fullAct.has_heartrate) {
          const streamRes = await fetch(`https://www.strava.com/api/v3/activities/${act.id}/streams?keys=heartrate&key_by_type=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (streamRes.ok) {
            const streams = await streamRes.json();
            if (streams.heartrate) {
              setHrData(streams.heartrate.data);
            }
          }
        }
      }
    } catch (e) { console.error(e); } finally {
      setIsLoadingDetails(false);
    }
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedActivityPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % selectedActivityPhotos.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedActivityPhotos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + selectedActivityPhotos.length) % selectedActivityPhotos.length);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] selection:bg-cyan-100">
      <div className="max-w-5xl mx-auto px-6 pt-12 md:pt-16 pb-20 relative z-10">
        <header className="mb-12 fade-in flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-[2px] bg-cyan-500 rounded-full"></span>
              <p className="text-cyan-600 font-bold uppercase tracking-[0.3em] text-[8px]">Atleta & Performance</p>
            </div>
            <div className="relative">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight z-10 relative">
                Lourenço
              </h1>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-200 leading-tight -mt-1 md:-mt-2 opacity-40 select-none">
                Suarez
              </h1>
            </div>
          </div>

          <div className={`glass-card px-5 py-3 rounded-xl flex items-center gap-3 border-slate-100/50 ${stravaStatus === 'sucesso' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <div className={`w-2 h-2 rounded-full ${stravaStatus === 'sucesso' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-slate-300'}`}></div>
            <div className="text-left">
              <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Sincronização</p>
              <button 
                onClick={stravaStatus !== 'sucesso' ? startStravaAuth : undefined}
                className="text-[11px] font-bold tracking-tight"
              >
                {stravaStatus === 'sucesso' ? 'Ativo' : 'Conectar Strava'}
              </button>
            </div>
          </div>
        </header>

        <section className="fade-in">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Atividades</h2>
            <div className="w-8 h-1 bg-cyan-500/20 mt-1 rounded-full"></div>
          </div>

          <div className="space-y-6">
            {activities.map((act) => {
              const photoUrl = getPhotoUrl(act);
              return (
                <div 
                  key={act.id} 
                  onClick={() => handleOpenActivity(act)}
                  className="glass-card group rounded-[2rem] overflow-hidden flex flex-col md:flex-row cursor-pointer transition-all duration-300 hover:shadow-lg"
                >
                  <div className="md:w-[32%] lg:w-[35%] relative overflow-hidden flex items-center justify-center min-h-[220px] md:min-h-[300px] bg-slate-50">
                    {photoUrl ? (
                      <img 
                        src={photoUrl} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={act.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full relative bg-gradient-to-br from-slate-50 to-slate-100/30">
                         <div className="absolute inset-0 opacity-[0.5] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08)_0%,transparent_75%)]"></div>
                         <div className="relative">
                            <div className="absolute inset-0 bg-cyan-400/10 blur-2xl rounded-full scale-150"></div>
                            <Activity 
                              size={44} 
                              className="text-slate-200 relative z-10 transition-colors duration-500 group-hover:text-cyan-200/50" 
                            />
                         </div>
                         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-4 h-[1px] bg-slate-200"></div>
                      </div>
                    )}
                    <div className="absolute top-6 left-6 z-20">
                      <span className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[8px] font-bold tracking-widest text-slate-900 shadow-sm border border-white/50">
                        {translateType(act.type)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-8 md:p-10 bg-white flex flex-col justify-center">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-cyan-500" />
                          {new Date(act.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-3">
                          {act.average_heartrate && (
                            <div className="flex items-center gap-1 text-rose-400">
                              <Heart size={10} fill="currentColor" />
                              <span className="font-black">{act.average_heartrate.toFixed(0)}</span>
                            </div>
                          )}
                          <ExternalLink size={16} className="text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-snug group-hover:text-cyan-600 transition-colors">
                        {act.name}
                      </h3>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-50">
                        <Metric label="DISTÂNCIA" value={(act.distance / 1000).toFixed(2)} unit="KM" />
                        <Metric label="TEMPO" value={formatDuration(act.moving_time)} />
                        <Metric label="RITMO" value={formatPace(act.average_speed, act.type)} unit={act.type === 'Ride' ? 'KM/H' : '/KM'} />
                        <Metric label="GANHO" value={act.total_elevation_gain.toFixed(0)} unit="M" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {selectedActivity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md fade-in-pure" onClick={() => setSelectedActivity(null)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[94vh] animate-modal">
            <button onClick={() => setSelectedActivity(null)} className="absolute top-6 right-6 z-50 p-2.5 bg-white/90 hover:bg-white text-slate-900 rounded-full transition-all backdrop-blur-xl shadow-lg border border-white/50">
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="overflow-y-auto custom-scrollbar flex-1">
              <div className="w-full bg-slate-100 relative h-[350px] md:h-[500px] flex items-center justify-center overflow-hidden">
                {isLoadingDetails && selectedActivityPhotos.length === 0 ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-cyan-500" size={32} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Carregando Mídia</p>
                  </div>
                ) : selectedActivityPhotos.length > 0 ? (
                  <div className="relative w-full h-full group/carousel">
                    <img 
                      key={currentPhotoIndex}
                      src={selectedActivityPhotos[currentPhotoIndex]} 
                      className="w-full h-full object-cover fade-in-pure" 
                      alt="" 
                    />
                    
                    {/* Controles de Navegação */}
                    {selectedActivityPhotos.length > 1 && (
                      <>
                        <button 
                          onClick={prevPhoto}
                          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/90 hover:text-slate-900 text-white rounded-full transition-all backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 shadow-xl"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button 
                          onClick={nextPhoto}
                          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/90 hover:text-slate-900 text-white rounded-full transition-all backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 shadow-xl"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30 bg-black/30 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                      {selectedActivityPhotos.map((_, i) => (
                        <button 
                          key={i} 
                          onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(i); }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${i === currentPhotoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`} 
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 relative">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.2)_0%,transparent_70%)]"></div>
                    <Activity size={64} className="text-slate-200" strokeWidth={1.5} />
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-4">Sem fotos disponíveis</p>
                  </div>
                )}
              </div>

              <div className="p-8 md:p-14 space-y-12 bg-white">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-[2px] bg-cyan-500 rounded-full"></span>
                    <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.4em]">{translateType(selectedActivity.type)}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">{selectedActivity.name}</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-10 border-y border-slate-50">
                  <Metric label="DISTÂNCIA" value={(selectedActivity.distance / 1000).toFixed(2)} unit="KM" large />
                  <Metric label="TEMPO" value={formatDuration(selectedActivity.moving_time)} large />
                  <Metric label="CALORIAS" value={selectedActivity.calories?.toFixed(0) || '--'} unit="KCAL" large />
                  <Metric label="MÁXIMA" value={(selectedActivity.max_speed * 3.6).toFixed(1)} unit="KM/H" large />
                </div>

                {(selectedActivity.average_heartrate || selectedActivity.max_heartrate) && (
                  <div className="space-y-8 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 rounded-lg">
                        <Heart size={18} className="text-rose-500" fill="currentColor" />
                      </div>
                      <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">Análise Cardiovascular</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-gradient-to-br from-rose-50/50 to-white rounded-3xl border border-rose-100/50 flex flex-col gap-1 shadow-sm">
                        <span className="text-[9px] font-black text-rose-300 uppercase tracking-[0.2em]">FREQUÊNCIA MÉDIA</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-rose-600 tracking-tighter">{selectedActivity.average_heartrate?.toFixed(0) || '--'}</span>
                          <span className="text-[10px] font-bold text-rose-400 uppercase">BPM</span>
                        </div>
                      </div>
                      <div className="p-8 bg-gradient-to-br from-rose-50/50 to-white rounded-3xl border border-rose-100/50 flex flex-col gap-1 shadow-sm">
                        <span className="text-[9px] font-black text-rose-300 uppercase tracking-[0.2em]">PICO CARDÍACO</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-rose-600 tracking-tighter">{selectedActivity.max_heartrate?.toFixed(0) || '--'}</span>
                          <span className="text-[10px] font-bold text-rose-400 uppercase">BPM</span>
                        </div>
                      </div>
                    </div>

                    {hrData && hrData.length > 0 && (
                      <div className="pt-4 p-8 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Esforço ao longo do tempo</span>
                        </div>
                        <SimpleLineChart data={hrData} color="#f43f5e" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <Calendar size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-900 font-bold uppercase tracking-tight">Data da Atividade</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(selectedActivity.start_date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  
                  <a 
                    href={`https://www.strava.com/activities/${selectedActivity.id}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="group bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-cyan-600 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-cyan-500/20 active:scale-95"
                  >
                    Abrir no Strava
                    <ExternalLink size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value, unit = "", large = false }: { label: string, value: string | number, unit?: string, large?: boolean }) => (
  <div className="space-y-2">
    <div className="text-slate-300 uppercase tracking-[0.3em] text-[8px] md:text-[9px] font-black">
      {label}
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className={`${large ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'} font-black text-slate-800 tracking-tighter leading-none`}>
        {value}
      </span>
      {unit && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>}
    </div>
  </div>
);

export default App;
