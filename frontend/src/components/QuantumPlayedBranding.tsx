import React from 'react';

const QuantumPlayedBranding: React.FC = () => {
  return (
    <a 
      href="https://quantumplayed.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[1000] flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-white/10 hover:border-amber-400/50 hover:bg-white/5 transition-all duration-300 group shadow-[0_0_20px_rgba(0,0,0,0.3)] no-underline"
    >
      <span className="text-[10px] md:text-xs font-medium text-indigo-200/50 uppercase tracking-[0.2em] group-hover:text-amber-200/70 transition-colors">
        A game by
      </span>
      
      <div className="flex items-center gap-1.5 translate-y-[-1px]">
        {/* QuantumPlayed Logo SVG */}
        <svg width="20" height="16" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_5px_rgba(255,192,46,0.5)]">
          {/* Brackets < > */}
          <path d="M10 8L2 16L10 24" stroke="#ffc02e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 8L38 16L30 24" stroke="#ffc02e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {/* Vertical Bars | | */}
          <rect x="15" y="6" width="3" height="20" rx="1.5" fill="white" />
          <rect x="22" y="6" width="3" height="20" rx="1.5" fill="white" />
        </svg>
        
        <span className="text-sm md:text-base font-bold tracking-tight flex items-center">
          <span className="text-white">Quantum</span>
          <span className="text-[#ffc02e]">Play</span>
          <span className="text-white">ed</span>
        </span>
      </div>
    </a>
  );
};

export default QuantumPlayedBranding;
