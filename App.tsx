import React, { useEffect, useState } from 'react';

const Snowflake = ({ style }: { style: React.CSSProperties }) => (
  <div className="snowflake" style={style}>
    ❅
  </div>
);

const App: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: string; delay: string; size: string; duration: string }>>([]);
  const [stravaStatus, setStravaStatus] = useState<'pendente' | 'conectando' | 'sucesso' | 'erro' | 'erro_uri'>('pendente');

  const CLIENT_ID = '201813';
  const CLIENT_SECRET = '9554fcf77b834261de21765727debe5e89f02062';
  const ATHLETE_ID = '49665406';
  // O token fornecido (pode expirar, mas tentaremos usá-lo como teste inicial)
  const INITIAL_TOKEN = '8f5b66d76aea84281be471fccf4f89ac7d97d110';

  useEffect(() => {
    // Efeito visual de neve
    const flakes = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      size: `${0.5 + Math.random() * 1.5}rem`,
      duration: `${10 + Math.random() * 10}s`,
    }));
    setSnowflakes(flakes);

    // Lógica de verificação de conexão
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
        verifyToken(storedToken);
      }
    };

    checkConnection();
  }, []);

  const verifyToken = async (token: string) => {
    setStravaStatus('conectando');
    try {
      // Testando a conexão com o endpoint de estatísticas fornecido
      const response = await fetch(`https://www.strava.com/api/v3/athletes/${ATHLETE_ID}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        localStorage.setItem('strava_access_token', token);
        setStravaStatus('sucesso');
      } else {
        // Se o token inicial falhou, voltamos ao estado pendente para nova autorização
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
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setStravaStatus('erro');
      }
    } catch (error) {
      setStravaStatus('erro');
    }
  };

  const startStravaAuth = () => {
    // O redirect_uri deve ser EXATAMENTE o que está no painel do Strava
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=read,activity:read_all`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh overflow-hidden relative">
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
      
      <main className="relative z-10 text-center space-y-8 fade-in px-6">
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
        
        <div className="flex flex-col items-center gap-6">
          <div className="w-24 h-[2px] bg-blue-300/50 rounded-full"></div>
          
          <div className="space-y-4">
            <p 
              onClick={stravaStatus !== 'sucesso' ? startStravaAuth : undefined}
              className={`text-base md:text-xl font-semibold tracking-[0.5em] uppercase transition-colors cursor-default ${stravaStatus !== 'sucesso' ? 'text-blue-900/40 hover:text-blue-500 cursor-pointer' : 'text-blue-900/40'}`}
            >
              Boas Festas
            </p>
            
            {/* Status do Strava */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  stravaStatus === 'sucesso' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 
                  stravaStatus === 'conectando' ? 'bg-blue-400 animate-pulse' : 
                  stravaStatus === 'erro' || stravaStatus === 'erro_uri' ? 'bg-red-500' : 'bg-slate-300'
                }`}></span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-900/40">
                  {stravaStatus === 'sucesso' ? 'Conexão realizada com sucesso' : 
                   stravaStatus === 'conectando' ? 'Verificando conexão...' : 
                   stravaStatus === 'erro_uri' ? 'Erro: Redirect URI inválida no painel Strava' :
                   stravaStatus === 'erro' ? 'Erro ao conectar' : 'Aguardando integração'}
                </p>
              </div>
              {stravaStatus === 'erro_uri' && (
                <p className="text-[8px] text-red-400 max-w-xs leading-relaxed uppercase tracking-wider">
                  Certifique-se que o domínio no Strava My App é: {window.location.hostname}
                </p>
              )}
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