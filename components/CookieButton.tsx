
import React, { useState } from 'react';

interface CookieButtonProps {
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
}

const CookieButton: React.FC<CookieButtonProps> = ({ onClick }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPressed(true);
    onClick(e);
  };

  const handleEnd = () => {
    setIsPressed(false);
  };

  return (
    <div className="relative flex items-center justify-center py-8">
      <div 
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        className={`
          relative w-56 h-56 md:w-72 md:h-72 cursor-pointer transition-transform duration-75 select-none
          ${isPressed ? 'scale-90' : 'scale-100 active:scale-95 hover:scale-105'}
        `}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl transform scale-125"></div>
        
        {/* Main Coin SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full money-shadow">
          {/* Outer Ring */}
          <circle cx="50" cy="50" r="48" fill="#d97706" />
          <circle cx="50" cy="50" r="45" fill="#fbbf24" />
          
          {/* Inner details */}
          <circle cx="50" cy="50" r="38" fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="4 2" />
          
          {/* Dollar Sign */}
          <text 
            x="50" 
            y="68" 
            fontFamily="Lexend, sans-serif" 
            fontSize="45" 
            fontWeight="900" 
            fill="#b45309" 
            textAnchor="middle"
          >$</text>
          
          {/* Shine effect */}
          <path d="M30 20 Q 50 10 70 20" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
};

export default CookieButton;
