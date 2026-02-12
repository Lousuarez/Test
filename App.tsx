
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Activity, MapPin, Clock, Zap, TrendingUp, 
  Heart, Flame, Calendar, ChevronRight, ChevronLeft,
  Navigation2, Maximize2, ExternalLink, Camera, X, Info, Loader2, Image as ImageIcon,
  Bike, Trophy, Mountain
} from 'lucide-react';

interface StravaStats {
  all_ride_totals: { distance: number; count: number; elevation_gain: number };
  all_run_totals: { distance: number; count: number; elevation_gain: number };
  biggest_ride_distance: number;
  biggest_climb_elevation_gain: number;
}

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
        <path d={`M ${padding},${height} ${points} L ${width - padding},${height} Z`} fill="url(#chartGradient)" className="transition-all duration-1000" />
        <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} className="transition-all duration-1000" strokeDasharray="2000" strokeDashoffset="0" style={{ animation: 'drawPath 2s ease-out forwards' }} />
      </svg>
      <div className="absolute top-0 left-0 right-0 flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
        <span>Máx: {max} bpm</span>
        <span>Min: {min} bpm</span>
      </div>
      <style>{`@keyframes drawPath { from { stroke-dashoffset: 2000; } to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [stravaStatus, setStravaStatus] = useState<'pendente' | 'conectando' | 'sucesso' | 'erro'>('pendente');
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [stats, setStats] = useState<StravaStats | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<StravaActivity | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [hrData, setHrData] = useState<number[] | null>(null);

  const CLIENT_ID = '201813';
  const CLIENT_SECRET = '9554fcf77b834261de21765727debe5e89f02062';
  const ATHLETE_ID = '49665406';
  const INITIAL_TOKEN = '18967df43040849a9ceed84168155e57c3a5baaa';

  const getCleanRedirectUri = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    let clean = url.toString().replace(/\/index\.html$/, '');
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    return clean;
  };

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
        const statsData = await response.json();
        setStats(statsData);
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
    setIsLoadingActivities(true);
    try {
      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=12`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (e) { console.error(e); } finally { setIsLoadingActivities(false); }
  };

  const handleStravaExchange = async (code: string) => {
    setStravaStatus('conectando');
    try {
      const redirect_uri = getCleanRedirectUri();
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirect_uri
        }),
      });
      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('strava_access_token', data.access_token);
        setStravaStatus('sucesso');
        verifyAndFetch(data.access_token);
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      } else {
        setStravaStatus('erro');
      }
    } catch (e) { setStravaStatus('erro'); }
  };

  const startStravaAuth = () => {
    const redirectUri = getCleanRedirectUri();
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=read,activity:read_all`;
  };

  const getPhotoUrl = (act: any) => {
    if (!act) return null;
    const extract = (obj: any) => {
      if (!obj) return null;
      if (obj.urls && typeof obj.urls === 'object') {
        const keys = Object.keys(obj.urls).sort((a, b) => parseInt(b) - parseInt(a));
        return keys.length > 0 ? obj.urls[keys[0]] : null;
      }
      return obj.url || obj.uri || (typeof obj === 'string' ? obj : null);
    };
    if (act.photos?.primary) return extract(act.photos.primary);
    if (act.photos?.all?.[0]) return extract(act.photos.all[0]);
    if (act.primary_photo) return extract(act.primary_photo);
    return null;
  };

  const translateType = (type: string) => {
    const types: Record<string, string> = { 'Run': 'CORRIDA', 'Ride': 'CICLISMO', 'VirtualRide': 'PEDAL VIRTUAL', 'Walk': 'CAMINHADA' };
    return types[type] || type.toUpperCase();
  };

  const formatPace = (speedMs: number, type: string) => {
    if (!speedMs || speedMs === 0) return '--';
    if (type.includes('Ride')) return (speedMs * 3.6).toFixed(1);
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
            if (streams.heartrate) setHrData(streams.heartrate.data);
          }
        }
      }
    } catch (e) { console.error(e); } finally { setIsLoadingDetails(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] selection:bg-cyan-100 pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-12 md:pt-16">
        <header className="mb-16 fade-in flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
          <div className="space-y-0 relative">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-[2px] bg-cyan-500 rounded-full"></span>
              <p className="text-slate-800 font-extrabold uppercase tracking-[0.35em] text-[10px]">Atleta & Performance</p>
            </div>
            <div className="relative">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[0.85] z-20 relative">
                Lourenço
              </h1>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-orange-500 leading-[0.85] -mt-1 md:-mt-2 opacity-90 select-none z-10 relative">
                Suarez
              </h1>
            </div>
          </div>

          <div className={`glass-card px-6 py-4 rounded-2xl flex items-center gap-4 border-slate-100/50 ${stravaStatus === 'sucesso' ? 'bg-white shadow-xl' : 'bg-slate-50'}`}>
            <div className={`w-3 h-3 rounded-full ${stravaStatus === 'sucesso' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'bg-slate-300 animate-pulse'}`}></div>
            <div className="text-left">
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 mb-1">Sincronização</p>
              <button onClick={stravaStatus !== 'sucesso' ? startStravaAuth : undefined} className={`text-[12px] font-black tracking-tight ${stravaStatus === 'sucesso' ? 'text-emerald-600' : 'text-slate-600'}`}>
                {stravaStatus === 'sucesso' ? 'Ativo' : stravaStatus === 'conectando' ? 'Processando...' : 'Conectar Strava'}
              </button>
            </div>
          </div>
        </header>

        {stats && (
          <section className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <StatsCard icon={<Bike size={24} />} label="Carreira Pedal" value={(stats.all_ride_totals.distance / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} unit="km" sub={`${stats.all_ride_totals.count} Treinos`} color="cyan" />
            <StatsCard icon={<TrendingUp size={24} />} label="Carreira Corrida" value={(stats.all_run_totals.distance / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} unit="km" sub={`${stats.all_run_totals.count} Treinos`} color="orange" />
            <StatsCard icon={<Mountain size={24} />} label="Elevação Total" value={(stats.all_ride_totals.elevation_gain + stats.all_run_totals.elevation_gain).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} unit="m" sub="Escalados" color="emerald" />
          </section>
        )}

        <section className="fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Atividades</h2>
            {activities.length > 0 && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200/40">{activities.length} Itens</span>}
          </div>

          {isLoadingActivities ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="animate-spin text-cyan-500" size={40} />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscando informações do Strava...</p>
             </div>
          ) : activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((act) => {
                const photoUrl = getPhotoUrl(act);
                return (
                  <div key={act.id} onClick={() => handleOpenActivity(act)} className="glass-card group rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row cursor-pointer">
                    <div className="md:w-[32%] lg:w-[35%] relative min-h-[220px] md:min-h-[300px] bg-[#fdfdfd] overflow-hidden">
                      {photoUrl ? (
                        <img src={photoUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Destaque do Treino" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                          <Activity size={64} className="text-slate-200" strokeWidth={1.5} />
                        </div>
                      )}
                      <span className="absolute top-8 left-8 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full text-[9px] font-black tracking-[0.2em] text-slate-900 shadow-xl border border-white/50">{translateType(act.type)}</span>
                    </div>
                    <div className="flex-1 p-10 md:p-12 bg-white flex flex-col justify-center gap-6">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg"><Calendar size={14} className="text-cyan-500" />{new Date(act.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                        {act.average_heartrate && <span className="flex items-center gap-1 text-rose-500 font-black"><Heart size={12} fill="currentColor" className="animate-pulse" />{act.average_heartrate.toFixed(0)} BPM</span>}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight group-hover:text-cyan-600 transition-colors leading-tight">{act.name}</h3>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-50">
                        <SimpleMetric label="DISTÂNCIA" value={(act.distance / 1000).toFixed(2)} unit="KM" />
                        <SimpleMetric label="TEMPO" value={formatDuration(act.moving_time)} />
                        <SimpleMetric label="RITMO" value={formatPace(act.average_speed, act.type)} unit={act.type.includes('Ride') ? 'KM/H' : '/KM'} />
                        <SimpleMetric label="GANHO" value={act.total_elevation_gain.toFixed(0)} unit="M" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-20 flex flex-col items-center justify-center text-center border border-slate-100 shadow-sm">
               <Info size={48} className="text-slate-200 mb-6" />
               <p className="text-slate-900 font-black text-xl mb-2">Sem atividades recentes</p>
               <p className="text-slate-400 text-sm max-w-xs">Conecte sua conta do Strava para visualizar seu histórico de performance aqui.</p>
               <button onClick={startStravaAuth} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-500 transition-colors">Conectar agora</button>
            </div>
          )}
        </section>
      </div>

      {selectedActivity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl fade-in-pure" onClick={() => setSelectedActivity(null)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[94vh] animate-modal border border-white/20">
            <button onClick={() => setSelectedActivity(null)} className="absolute top-8 right-8 z-50 p-3 bg-white hover:bg-orange-500 hover:text-white text-slate-900 rounded-full transition-all shadow-xl"><X size={24} strokeWidth={3} /></button>
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <div className="w-full bg-slate-100 relative h-[400px] md:h-[550px] flex items-center justify-center overflow-hidden">
                {isLoadingDetails ? <Loader2 className="animate-spin text-cyan-500" size={48} /> : (
                  getPhotoUrl(selectedActivity) ? (
                    <img src={getPhotoUrl(selectedActivity) || ''} className="w-full h-full object-cover" alt="Destaque do Treino" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                      <Activity size={100} className="text-slate-200" strokeWidth={1} />
                    </div>
                  )
                )}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-10 left-10 text-white">
                   <div className="flex items-center gap-2 mb-2">
                     <span className="bg-orange-500 px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase">{translateType(selectedActivity.type)}</span>
                     <span className="text-[10px] font-bold opacity-80">{new Date(selectedActivity.start_date).toLocaleDateString()}</span>
                   </div>
                   <div className="flex items-center gap-4">
                     <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">{selectedActivity.name}</h2>
                   </div>
                </div>
              </div>
              <div className="p-10 md:p-16 space-y-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-12 border-b border-slate-50">
                  <Metric icon={<MapPin size={28} strokeWidth={2.5} />} label="DISTÂNCIA" value={(selectedActivity.distance / 1000).toFixed(2)} unit="KM" />
                  <Metric icon={<Clock size={28} strokeWidth={2.5} />} label="TEMPO" value={formatDuration(selectedActivity.moving_time)} />
                  <Metric icon={<Flame size={28} strokeWidth={2.5} />} label="CALORIAS" value={selectedActivity.calories?.toFixed(0) || '--'} unit="KCAL" />
                  <Metric icon={<Zap size={28} strokeWidth={2.5} />} label="VEL. MÁXIMA" value={(selectedActivity.max_speed * 3.6).toFixed(1)} unit="KM/H" />
                </div>
                {(selectedActivity.average_heartrate || selectedActivity.max_heartrate) && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4"><Heart size={24} className="text-rose-500" fill="currentColor" /><h3 className="text-xs font-black uppercase tracking-[0.5em] text-slate-900">Análise Cardiovascular</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <StatBox label="FREQUÊNCIA MÉDIA" value={selectedActivity.average_heartrate?.toFixed(0) || '--'} unit="BPM" />
                      <StatBox label="PICO CARDÍACO" value={selectedActivity.max_heartrate?.toFixed(0) || '--'} unit="BPM" />
                    </div>
                    {hrData && (
                      <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <SimpleLineChart data={hrData} color="#f43f5e" />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-center pt-8">
                   <a href={`https://www.strava.com/activities/${selectedActivity.id}`} target="_blank" rel="noreferrer" className="bg-orange-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center gap-4">
                     Ver detalhes no Strava
                     <ExternalLink size={18} />
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

const StatsCard = ({ icon, label, value, unit, sub, color }: any) => {
  const colors: any = { cyan: 'bg-cyan-50 text-cyan-600', orange: 'bg-orange-50 text-orange-600', emerald: 'bg-emerald-50 text-emerald-600' };
  return (
    <div className="glass-card p-10 rounded-[3rem] flex flex-col gap-6">
      <div className="flex items-center justify-between"><div className={`p-4 rounded-2xl ${colors[color]}`}>{icon}</div><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{label}</span></div>
      <div className="space-y-1">
        <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}<span className="text-sm font-bold text-slate-400 ml-1">{unit}</span></p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{sub}</p>
      </div>
    </div>
  );
};

const Metric = ({ label, value, unit, icon }: any) => (
  <div className="flex items-center gap-6 group">
    <div className="p-3 bg-slate-50 text-cyan-500 rounded-2xl group-hover:bg-cyan-500 group-hover:text-white transition-all duration-500">{icon}</div>
    <div className="space-y-1.5">
      <div className="text-slate-300 uppercase tracking-[0.3em] text-[10px] font-black">{label}</div>
      <div className="flex items-baseline gap-1.5"><span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{value}</span>{unit && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>}</div>
    </div>
  </div>
);

const SimpleMetric = ({ label, value, unit }: any) => (
  <div className="space-y-2">
    <div className="text-slate-300 uppercase tracking-widest text-[9px] font-black">{label}</div>
    <div className="flex items-baseline gap-1"><span className="text-xl font-black text-slate-800 tracking-tight">{value}</span>{unit && <span className="text-[10px] font-black text-slate-400 uppercase">{unit}</span>}</div>
  </div>
);

const StatBox = ({ label, value, unit }: any) => (
  <div className="p-10 bg-gradient-to-br from-rose-50/50 to-white rounded-[2.5rem] border border-rose-100/50 flex flex-col gap-2 shadow-sm">
    <span className="text-[10px] font-black text-rose-300 uppercase tracking-[0.25em]">{label}</span>
    <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-rose-600 tracking-tighter leading-none">{value}</span><span className="text-xs font-black text-rose-400 uppercase">{unit}</span></div>
  </div>
);

export default App;
