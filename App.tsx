import React, { useEffect, useState } from 'react';

const Snowflake = ({ style }: { style: React.CSSProperties }) => (
  <div className="snowflake" style={style}>
    ❅
  </div>
);

const App: React.FC = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: string; delay: string; size: string; duration: string }>>([]);

  useEffect(() => {
    // Gerar flocos de neve aleatórios
    const flakes = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      size: `${0.5 + Math.random() * 1.5}rem`,
      duration: `${10 + Math.random() * 10}s`,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh overflow-hidden relative">
      {/* Neve caindo */}
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

      {/* Elementos decorativos de profundidade */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-sky-100 rounded-full blur-[150px] opacity-30"></div>
      
      <main className="relative z-10 text-center space-y-8 fade-in px-6">
        <div className="relative inline-block">
          {/* Luzes de Natal em cima do nome */}
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
          <p className="text-base md:text-xl text-blue-900/40 font-semibold tracking-[0.5em] uppercase">
            Boas Festas
          </p>
        </div>
      </main>

      {/* Moldura minimalista fixa */}
      <div className="fixed inset-6 md:inset-12 border border-blue-200/30 pointer-events-none rounded-[2rem] md:rounded-[3rem] z-50"></div>
      
      {/* Rodapé */}
      <footer className="absolute bottom-10 left-0 w-full text-center">
        <p className="text-[10px] text-blue-900/20 font-bold uppercase tracking-[1em] select-none">
          {new Date().getFullYear()} — Lourenço Suarez — Special Edition
        </p>
      </footer>

      {/* Textura de ruído sutil */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

export default App;