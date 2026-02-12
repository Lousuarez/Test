import React, { useEffect, useState } from 'react';
import { Activity, MapPin, Clock, Calendar, ChevronRight } from 'lucide-react';

const Snowflake = ({ style }: { style: React.CSSProperties }) => (
  <div className="snowflake" style={style}>
    ❅
  </div>
);

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  type: string;
  start_date: string;
}

const App: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: string; delay: string; size: string; duration: string }>>([]);
  const [stravaStatus, setStravaStatus] = useState<'pendente' | 'conectando' | 'sucesso' | 'erro' | 'erro_uri'>('pendente');
  const [activities, setActivities] = useState<StravaActivity[]>([]);

  const CLIENT_ID = '201813';
  const CLIENT_SECRET = '9554fcf77b834261de21765727debe5e89f02062';
  const ATHLETE_ID = '49665406';
  const INITIAL_TOKEN = '8f5b66d76aea84281be471fccf4f89ac7d97d110';

  useEffect(() => {
    const flakes = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      size: `${0.5 + Math.random() * 1.5}rem`,
      duration: `${10 + Math.random() * 10}s`,
    }));
    setSnowflakes(flakes);

    const checkConnection = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const storedToken = localStorage.getItem('strava_access_token') || INITIAL_TOKEN;

      if (error === 'access_denied') {
        setStravaStatus('erro');
        return;
      }

      if (code) {
        handleStravaExchange(code);
      } else if (storedToken) {
        verifyAndFetch(storedToken);
      }
    };

    checkConnection();
  }, []);

  const fetchActivities = async (token: string) => {
    try {
      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=3`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (e) {
      console.error("Erro ao buscar atividades", e);
    }
  };

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

  const handleStravaExchange = async (code: string) => {
    setStravaStatus('conectando');
    try {
      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('strava_access_token', data.access_token);
        setStravaStatus('sucesso');
        fetchActivities(data.access_token);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setStravaStatus('erro');
      }
    } catch (error) {
      setStravaStatus('erro');
    }
  };

  const startStravaAuth = () => {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=read,activity:read_all`;
    window.location.href = authUrl;
  };

  const formatDistance = (meters: number) => (meters / 1000).toFixed(2) + ' km';
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh overflow-hidden relative py-20">
      {/* Neve */}
      {snowflakes.map((flake) => (
        <Snowflake
          key={flake.id}
          style={{
            left: flake.left,
            animationDelay: `${flake.delay}, ${flake.delay}`,
            fontSize: flake.size,
            animationDuration: `${flake.duration}, 3s`,
          }}
        />
      ))}

      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
      
      <main className="relative z-10 text-center space-y-12 fade-in px-6 w-full max-w-5xl">
        <div className="relative inline-block">
          <div className="lights-wire">
            <span className="light light-red"></span>
            <span className="light light-green"></span>
            <span className="light light-blue"></span>
            <span className="light light-gold"></span>
            <span className="light light-red"></span>
            <span className="light light-green"></span>
            <span className="light light-blue"></span>
            <span className="light light-gold"></span>
          </div>

          <header>
            <h1 className="text-6xl md:text-[9rem] font-black tracking-tighter text-blue-950 leading-none drop-shadow-sm">
              Lourenço <span className="text-blue-600 block md:inline">Suarez</span>
            </h1>
          </header>
        </div>
        
        <div className="flex flex-col items-center gap-8">
          <div className="w-24 h-[2px] bg-blue-300/50 rounded-full"></div>
          
          <div className="space-y-4">
            <p 
              onClick={stravaStatus !== 'sucesso' ? startStravaAuth : undefined}
              className={`text-base md:text-xl font-semibold tracking-[0.5em] uppercase transition-colors ${stravaStatus !== 'sucesso' ? 'text-blue-900/40 hover:text-blue-500 cursor-pointer' : 'text-blue-900/40 cursor-default'}`}
            >
              Boas Festas
            </p>
            
            {/* Cards de Atividades */}
            {stravaStatus === 'sucesso' && activities.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full animate-fade-in-up">
                {activities.map((act) => (
                  <div key={act.id} className="bg-white/40 backdrop-blur-md border border-white/40 rounded-3xl p-6 text-left hover:bg-white/60 transition-all duration-300 group shadow-lg shadow-blue-900/5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
                        <Activity size={20} />
                      </div>
                      <span className="text-[10px] font-black text-blue-900/30 uppercase tracking-widest">{formatDate(act.start_date)}</span>
                    </div>
                    <h3 className="text-blue-950 font-bold text-lg mb-4 line-clamp-1 group-hover:text-blue-600 transition-colors">{act.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-blue-900/60">
                        <MapPin size={14} className="opacity-50" />
                        <span className="text-xs font-bold">{formatDistance(act.distance)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-900/60">
                        <Clock size={14} className="opacity-50" />
                        <span className="text-xs font-bold">{formatTime(act.moving_time)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status Indicator */}
            <div className="flex flex-col items-center gap-2 pt-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  stravaStatus === 'sucesso' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 
                  stravaStatus === 'conectando' ? 'bg-blue-400 animate-pulse' : 
                  stravaStatus === 'erro' || stravaStatus === 'erro_uri' ? 'bg-red-500' : 'bg-slate-300'
                }`}></span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-900/40">
                  {stravaStatus === 'sucesso' ? 'Conexão Strava Ativa' : 
                   stravaStatus === 'conectando' ? 'Sincronizando...' : 
                   stravaStatus === 'erro_uri' ? 'Configuração de URI inválida' :
                   stravaStatus === 'erro' ? 'Erro ao conectar' : 'Integração Pendente'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-6 md:inset-12 border border-blue-200/30 pointer-events-none rounded-[2rem] md:rounded-[3rem] z-50"></div>
      
      <footer className="absolute bottom-10 left-0 w-full text-center">
        <p className="text-[10px] text-blue-900/20 font-bold uppercase tracking-[1em] select-none">
          {new Date().getFullYear()} — Lourenço Suarez
        </p>
      </footer>

      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

export default App;