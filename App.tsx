import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh overflow-hidden relative">
      {/* Decorative elements for a premium feel */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-sky-100 rounded-full blur-[150px] opacity-30"></div>
      
      <main className="relative z-10 text-center space-y-8 fade-in px-6">
        <header>
          <h1 className="text-7xl md:text-[10rem] font-black tracking-tight text-blue-950 leading-none drop-shadow-sm">
            Lourenço <span className="text-blue-600 block md:inline">Suarez</span>
          </h1>
        </header>
        
        <div className="flex flex-col items-center gap-8">
          <div className="w-24 h-[2px] bg-blue-200 rounded-full"></div>
          <p className="text-lg md:text-xl text-blue-800/60 font-medium tracking-[0.4em] uppercase">
            Em breve
          </p>
        </div>
      </main>

      {/* Modern minimalist frame */}
      <div className="fixed inset-6 md:inset-12 border border-blue-200/50 pointer-events-none rounded-[3rem] z-50"></div>
      
      {/* Bottom Year Indicator */}
      <footer className="absolute bottom-10 left-0 w-full text-center">
        <p className="text-[11px] text-blue-900/30 font-bold uppercase tracking-[0.8em] select-none">
          {new Date().getFullYear()} — Premium Identity
        </p>
      </footer>

      {/* Subtle grain overlay for texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

export default App;