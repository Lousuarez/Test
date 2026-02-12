import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white overflow-hidden selection:bg-blue-100">
      {/* Subtle Background Elements for depth */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 -skew-x-12 transform translate-x-1/4"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-60"></div>
      
      <div className="relative z-10 text-center space-y-6 fade-in px-6">
        <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-slate-900 leading-none">
          Lourenço <span className="text-blue-600">Suarez</span>
        </h1>
        
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-px bg-slate-200"></div>
          <p className="text-xl md:text-2xl text-slate-400 font-light tracking-[0.3em] uppercase">
            Em breve
          </p>
        </div>
      </div>

      {/* Aesthetic border frame */}
      <div className="fixed inset-8 border border-slate-100 pointer-events-none rounded-[2rem]"></div>
      
      {/* Bottom info */}
      <div className="absolute bottom-12 left-0 w-full text-center">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.5em]">
          {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default App;