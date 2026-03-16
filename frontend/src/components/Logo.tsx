import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  // Colors matching GameBoard.tsx
  const whiteColor = "#e8e0f0";
  const blackQueenColor = "#818cf8"; // Bright indigo for black queens

  const QIcon = ({ color }: { color: string }) => (
    <svg viewBox="0 0 100 100" className="inline-block w-[1.1em] h-[1.1em] align-middle mt-[-0.2em]">
      {/* Outer Ring */}
      <circle 
        cx="50" cy="50" r="38" 
        fill="none" 
        stroke={color} 
        strokeWidth="7" 
      />
      
      {/* Inner Ring */}
      <circle 
        cx="50" cy="50" r="28" 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
        strokeOpacity="0.7" 
      />

      {/* Tail */}
      <line 
        x1="76" y1="76" 
        x2="86" y2="86" 
        stroke={color} 
        strokeWidth="7" 
        strokeLinecap="round" 
      />

      {/* Crown */}
      <path 
        d="M30 65 L70 65 L70 35 L58 45 L50 35 L42 45 L30 35 Z" 
        fill={color} 
      />
    </svg>
  );

  return (
    <div className={`flex items-center justify-center font-black tracking-tighter ${className}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
      <span className="text-white">CHE</span>
      <QIcon color={blackQueenColor} />
      <QIcon color={whiteColor} />
      <span className="text-white">ERS</span>
    </div>
  );
};

export default Logo;
