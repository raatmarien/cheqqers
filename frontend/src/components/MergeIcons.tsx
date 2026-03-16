import React from 'react';

interface MergeIconProps {
  isDiagonal?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const MergeIcon: React.FC<MergeIconProps> = ({ isDiagonal = false, className = "", style = {}, onClick }) => {
  const color = "#a78bfa"; // Indigo-400 matching the glow in GameBoard.tsx

  return (
    <div 
      className={`flex items-center justify-center transition-transform hover:scale-125 ${className}`}
      style={style}
      onClick={onClick}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]"
      >
        {isDiagonal ? (
          // Diagonal Merge Icon (V-shape arrow point)
          <path 
            d="M20 20 L50 50 L80 20 M50 50 L50 80" 
            fill="none" 
            stroke={color} 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        ) : (
          // Straight Merge Icon (T-shape/Y-shape arrow point)
          <path 
            d="M20 30 L50 60 L80 30 M50 60 L50 90" 
            fill="none" 
            stroke={color} 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}
        
        {/* Glow effect paths */}
        <path 
          d={isDiagonal ? "M20 20 L50 50 L80 20 M50 50 L50 80" : "M20 30 L50 60 L80 30 M50 60 L50 90"} 
          fill="none" 
          stroke={color} 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          opacity="0.5"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
};

export default MergeIcon;
