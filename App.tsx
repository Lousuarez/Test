import React, { useEffect, useState } from 'react';
import { 
  Activity, MapPin, Clock, Zap, TrendingUp, 
  Heart, Flame, Calendar, ChevronRight, 
  Navigation2, Maximize2, ExternalLink, Camera
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
  primary_photo?: {
    urls: {
      '100': string;
      '600': string;
    };
  };
  photos?: {
    primary?: {
      urls: {
        '100': string;
        '600': string;
      };
    };
  };
}

const App: React.FC = () => {
  const [stravaStatus, setStravaStatus] = useState<'pendente' | 'conectando' | 'sucesso' | 'erro'>('pendente');
  const [activities, setActivities] = useState<StravaActivity[]>([]);

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
        setActivities(await response.json());
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

  const translateType = (type: string) => {
    const types: Record<string, string> = {
      'Run': 'CORRIDA',
      'Ride': 'CICLISMO',
      'VirtualRide': 'PEDAL VIRTUAL',
      'Walk': 'CAMINHADA',
      'Swim': 'NATAÇÃO',
      'WeightTraining': 'MUSCULAÇÃO',
      'Workout': 'TREINO GERAL',
      'Yoga': 'YOGA',
      'Hike': 'TRILHA'
    };
    return types[type] || type.toUpperCase();
  };

  const formatPace = (speedMs: number, type: string) => {
    if (!speedMs || speedMs === 0) return '--';
    if (type === 'Ride' || type === 'VirtualRide') {
      return (speedMs * 3.6).toFixed(1) + ' km/h';
    }
    const paceMinPerKm = 1000 / (speedMs * 60);
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  };

  const formatMaxSpeed = (speedMs: number) => {
    if (!speedMs) return '--';
    return (speedMs * 3.6).toFixed(1) + ' km/h';
  };

  return (
    <div className="min-h-screen selection:bg-cyan-100 pb-20 bg-[#f8fafc]">
      <div className="h-1 bg-gradient-to-r from-cyan-400 to-blue-500 w-full fixed top-0 z-[60]"></div>

      <div className="max-w-5xl mx-auto px-6 pt-16 md:pt-28 relative z-10">
        <header className="mb-24 fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-6 h-[1.5px] bg-cyan-500 rounded-full"></span>
                <p className="text-cyan-600 font-bold uppercase tracking-[0.4em] text-[9px]">Atleta & Performance</p>
              </div>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[#1e293b] leading-none">
                Lourenço<br/>
                <span className="text-slate-300">Suarez</span>
              </h1>
            </div>

            <div className="flex flex-col items-start md:items-end gap-5">
              <button 
                onClick={stravaStatus !== 'sucesso' ? startStravaAuth : undefined}
                className={`group flex items-center gap-5 px-6 py-4 rounded-3xl border transition-all duration-700 ${
                  stravaStatus === 'sucesso' 
                    ? 'border-slate-100 bg-white shadow-sm text-emerald-600' 
                    : 'border-slate-200 bg-white text-slate-400 hover:border-cyan-200 hover:text-cyan-500 shadow-sm'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${stravaStatus === 'sucesso' ? 'bg-emerald-400' : 'bg-slate-300 group-hover:bg-cyan-400'} transition-colors shadow-sm`}></div>
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-60">Sincronização</p>
                  <p className="text-xs font-bold">{stravaStatus === 'sucesso' ? 'Conectado ao Strava' : 'Vincular Treinos'}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <section className="fade-in space-y-12" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-8">
            <div className="space-y-1">
              <h2 className="text-slate-900 font-black text-2xl flex items-center gap-3">
                Registros de Atividade
              </h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Análise técnica detalhada</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {activities.length > 0 ? activities.map((act, index) => {
              // Caminho da foto pode variar na API do Strava
              const photoUrl = act.photos?.primary?.urls['600'] || act.primary_photo?.urls['600'];

              return (
                <div 
                  key={act.id} 
                  className="glass-card rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row fade-in border border-slate-200/60 bg-white shadow-xl shadow-slate-200/20"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  {/* Bloco Esquerdo: Foto ou Placeholder */}
                  <div className="md:w-1/3 bg-[#f1f5f9] relative overflow-hidden flex items-center justify-center min-h-[300px]">
                    {photoUrl ? (
                      <img 
                        src={photoUrl} 
                        alt={act.name}
                        className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                      />
                    ) : (
                      <div className="text-slate-200">
                        <Navigation2 size={64} className="rotate-45" />
                      </div>
                    )}
                    
                    {/* Badge Modalidade */}
                    <div className="absolute top-6 left-6">
                      <span className="bg-white px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest text-[#1e293b] shadow-sm">
                        {translateType(act.type)}
                      </span>
                    </div>

                    {/* Badge Fotos */}
                    {(act.total_photo_count > 0 || photoUrl) && (
                      <div className="absolute bottom-6 right-6">
                        <div className="bg-[#1e293b]/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 border border-white/10 uppercase tracking-widest">
                          <Camera size={12} />
                          {act.total_photo_count || 1} Fotos
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bloco Direito: Dados */}
                  <div className="flex-1 p-8 md:p-12 bg-white flex flex-col justify-center">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                          <Calendar size={13} className="text-cyan-500" />
                          {new Date(act.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                        </div>
                        <a 
                          href={`https://www.strava.com/activities/${act.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-300 hover:text-cyan-500 transition-colors"
                        >
                          <ExternalLink size={18} />
                        </a>
                      </div>

                      <h3 className="text-3xl md:text-4xl font-black text-[#1e293b] tracking-tight leading-tight">
                        {act.name}
                      </h3>

                      {/* Grid de Performance - 4 Colunas como na Imagem */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-8 pt-6">
                        <MetricItem label="DISTÂNCIA" value={(act.distance / 1000).toFixed(2)} unit="KM" icon={<MapPin size={14} className="text-slate-300" />} />
                        <MetricItem label="TEMPO" value={formatDuration(act.moving_time)} icon={<Clock size={14} className="text-slate-300" />} />
                        <MetricItem label="RITMO MÉD." value={formatPace(act.average_speed, act.type)} icon={<Zap size={14} className="text-amber-400" />} />
                        <MetricItem label="GANH. ALT." value={act.total_elevation_gain.toFixed(0)} unit="M" icon={<TrendingUp size={14} className="text-emerald-400" />} />
                        
                        <MetricItem label="VELO. MÁX" value={formatMaxSpeed(act.max_speed)} icon={<Maximize2 size={14} className="text-blue-400" />} />
                        <MetricItem label="FREQ. CARD." value={act.average_heartrate?.toFixed(0) || '--'} unit="BPM" icon={<Heart size={14} className="text-rose-400" />} />
                        <MetricItem label="CALORIAS" value={act.calories?.toFixed(0) || '--'} unit="KCAL" icon={<Flame size={14} className="text-orange-400" />} />
                        <MetricItem label="ID TREINO" value={act.id.toString().slice(-6)} unit="#" icon={<Activity size={14} className="text-slate-200" />} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="bg-white rounded-[3rem] border border-slate-200 border-dashed p-32 text-center">
                <Activity size={48} className="text-slate-200 mx-auto mb-6 animate-pulse" />
                <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px]">Sincronizando dados de performance...</p>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-48 pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-5">
             <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-[12px] shadow-xl shadow-slate-300">LS</div>
             <div>
                <p className="text-[11px] text-slate-900 font-black uppercase tracking-[0.4em]">Lourenço Suarez</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Performance Dashboard © 2024</p>
             </div>
          </div>
          <div className="flex gap-10">
            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Strava API v3</span>
            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Acesso Autorizado</span>
          </div>
        </footer>
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-[0.01] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

const MetricItem = ({ label, value, unit = "", icon }: { label: string, value: string | number, unit?: string, icon: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-slate-400 uppercase tracking-widest text-[9px] font-black">
      <span className="opacity-70">{icon}</span>
      {label}
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-black text-[#1e293b] tracking-tight">{value}</span>
      {unit && <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>}
    </div>
  </div>
);

export default App;