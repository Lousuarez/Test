import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh overflow-hidden relative">
      {/* Elementos decorativos de profundidade */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-sky-100 rounded-full blur-[150px] opacity-30"></div>
      
      <main className="relative z-10 text-center space-y-8 fade-in px-6">
        <header>
          <h1 className="text-6xl md:text-[9rem] font-black tracking-tighter text-blue-950 leading-none drop-shadow-sm">
            Lourenço <span className="text-blue-600 block md:inline">Suarez</span>
          </h1>
        </header>
        
        <div className="flex flex-col items-center gap-8">
          <div className="w-24 h-[2px] bg-blue-300/50 rounded-full"></div>
          <p className="text-base md:text-xl text-blue-900/40 font-semibold tracking-[0.5em] uppercase">
            Em breve
          </p>
        </div>
      </main>

      {/* Moldura minimalista fixa */}
      <div className="fixed inset-6 md:inset-12 border border-blue-200/30 pointer-events-none rounded-[2rem] md:rounded-[3rem] z-50"></div>
      
      {/* Rodapé com indicação de ano */}
      <footer className="absolute bottom-10 left-0 w-full text-center">
        <p className="text-[10px] text-blue-900/20 font-bold uppercase tracking-[1em] select-none">
          {new Date().getFullYear()} — Lourenço Suarez — Todos os Direitos Reservados
        </p>
      </footer>

      {/* Textura de ruído sutil para acabamento premium */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

export default App;