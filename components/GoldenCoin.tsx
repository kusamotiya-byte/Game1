
import React, { useEffect, useState } from 'react';

interface GoldenCoinProps {
  x: number;
  y: number;
  onClick: () => void;
}

const GoldenCoin: React.FC<GoldenCoinProps> = ({ x, y, onClick }) => {
  const [scale, setScale] = useState(0);

  useEffect(() => {
    // 登場アニメーション
    const timer = setTimeout(() => setScale(1), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="absolute z-40 cursor-pointer pointer-events-auto"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      <div className="relative w-16 h-16 flex items-center justify-center animate-bounce">
        {/* 外枠の光 */}
        <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-50"></div>
        {/* コイン本体 */}
        <div className="relative w-12 h-12 bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-200 rounded-full border-4 border-yellow-100 shadow-lg flex items-center justify-center">
          <i className="fa-solid fa-star text-white text-xl drop-shadow-sm"></i>
          {/* 残り時間インジケーター（簡易版） */}
          <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none">
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeDasharray="138"
              className="coin-timer-path"
            />
          </svg>
        </div>
      </div>
      <style>{`
        @keyframes timerShrink {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 138; }
        }
        .coin-timer-path {
          animation: timerShrink 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default GoldenCoin;
