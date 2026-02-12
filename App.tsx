import React, { useEffect, useState } from 'react';
import { 
  Activity, MapPin, Clock, Zap, TrendingUp, 
  Heart, Flame, ArrowUpRight, Calendar, 
  ChevronRight, Timer, Navigation2
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
      // Buscando as últimas 10 atividades
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

  // Funções de Tradução e Formatação
  const translateType = (type: string) => {
    const types: Record<string, string> = {
      'Run': 'Corrida',
      'Ride': 'Ciclismo',
      'VirtualRide': 'Pedal Virtual',
      'Walk': 'Caminhada',
      'Swim': 'Natação',
      'WeightTraining': 'Musculação',
      'Workout': 'Treino',
      'Yoga': 'Yoga'
    };
    return types[type] || type;
  };

  const formatPace = (speedMs: number, type: string) => {
    if (!speedMs || speedMs === 0) return '--';
    if (type === 'Ride' || type === 'VirtualRide') {
      return (speedMs * 3.6).toFixed(1) + ' km/h';
    }
    const paceMinPerKm = 1000 / (speedMs * 60);
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen selection:bg-cyan-100 pb-20">
      {/* Top Progress Bar */}
      <div className="h-1 bg-gradient-to-r from-cyan-400 to-blue-500 w-full fixed top-0 z-[60]"></div>

      <div className="max-w-5xl mx-auto px-6 pt-16 md:pt-32 relative z-10">
        {/* Profile Header */}
        <header className="mb-20 fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-[2px] bg-cyan-500 rounded-full"></span>
                <p className="text-cyan-600 font-extrabold uppercase tracking-[0.3em] text-[10px]">Atleta Profissional</p>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.9]">
                Lourenço<br/>
                <span className="text-slate-400">Suarez</span>
              </h1>
            </div>

            <div className="flex flex-col items-start md:items-end gap-4">
              <button 
                onClick={stravaStatus !== 'sucesso' ? startStravaAuth : undefined}
                className={`group flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all duration-500 ${
                  stravaStatus === 'sucesso' 
                    ? 'border-emerald-100 bg-emerald-50/30 text-emerald-600' 
                    : 'border-slate-200 bg-white text-slate-500 hover:border-cyan-200 hover:text-cyan-600 shadow-sm'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${stravaStatus === 'sucesso' ? 'bg-emerald-500' : 'bg-slate-300 group-hover:bg-cyan-500'} transition-colors`}></div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Status de Conexão</p>
                  <p className="text-xs font-bold">{stravaStatus === 'sucesso' ? 'Sincronizado via Strava' : 'Conectar Aplicativo'}</p>
                </div>
                <ChevronRight size={16} className={`opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${stravaStatus === 'sucesso' && 'hidden'}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="fade-in space-y-10" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <h2 className="text-slate-900 font-black text-xl flex items-center gap-3">
              Últimas Atividades
              <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">10</span>
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">Dados em tempo real</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {activities.length > 0 ? activities.map((act, index) => (
              <div 
                key={act.id} 
                className="glass-card rounded-[2rem] overflow-hidden flex flex-col lg:flex-row fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                {/* Visual Estilizado do Treino (Imagem Placeholder Técnica) */}
                <div className="lg:w-48 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-100 flex items-center justify-center p-8 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  <Navigation2 size={40} className="text-slate-200 group-hover:text-cyan-200 transition-colors duration-500 rotate-45" />
                  <div className="absolute bottom-4 left-0 w-full text-center">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Map View</span>
                  </div>
                </div>

                {/* Dados Principais */}
                <div className="flex-1 p-8 md:p-10 space-y-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-cyan-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                        {translateType(act.type)}
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={12} className="opacity-50" />
                        {new Date(act.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Distância Total</p>
                         <p className="text-xl font-black text-slate-900 leading-none">{(act.distance / 1000).toFixed(2)} <span className="text-[10px] text-slate-400">km</span></p>
                       </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-cyan-600 transition-colors">{act.name}</h3>

                  {/* Grid de Detalhes Técnicos */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-t border-slate-50 pt-8">
                    <DetailItem label="Ritmo/Vel." value={formatPace(act.average_speed, act.type)} icon={<Zap size={14} className="text-amber-400"/>} />
                    <DetailItem label="Tempo Mov." value={formatDuration(act.moving_time)} icon={<Clock size={14} className="text-cyan-400"/>} />
                    <DetailItem label="Elevação" value={act.total_elevation_gain.toFixed(0)} unit="m" icon={<TrendingUp size={14} className="text-emerald-400"/>} />
                    <DetailItem label="Frequência" value={act.average_heartrate?.toFixed(0) || '--'} unit="bpm" icon={<Heart size={14} className="text-rose-400"/>} />
                    <DetailItem label="Calorias" value={act.calories?.toFixed(0) || '--'} unit="kcal" icon={<Flame size={14} className="text-orange-400"/>} />
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-white rounded-[2rem] border border-slate-100 border-dashed p-24 text-center">
                <div className="mb-4 flex justify-center">
                  <Activity size={40} className="text-slate-200 animate-pulse" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aguardando sincronização de dados</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-40 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-[10px]">LS</div>
             <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.5em]">Lourenço Suarez — Dashboard v2.5</p>
          </div>
          <div className="flex gap-10">
            <FooterLink label="Strava" />
            <FooterLink label="Performance" />
            <FooterLink label="2024" />
          </div>
        </footer>
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

const DetailItem = ({ label, value, unit = "", icon }: { label: string, value: string | number, unit?: string, icon: React.ReactNode }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-widest text-[8px] font-black">
      {icon}
      {label}
    </div>
    <div className="flex items-baseline gap-0.5">
      <span className="text-base font-black text-slate-800 tracking-tighter">{value}</span>
      <span className="text-[9px] font-bold text-slate-400 uppercase">{unit}</span>
    </div>
  </div>
);

const FooterLink = ({ label }: { label: string }) => (
  <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest hover:text-cyan-500 cursor-default transition-colors">{label}</span>
);

export default App;