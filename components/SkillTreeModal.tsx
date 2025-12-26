
import React, { useState } from 'react';
import { CoinSkill } from '../types';
import { COIN_SKILLS, ROULETTE_UNLOCK_THRESHOLD, ROULETTE_BASE_COST } from '../constants';

interface SkillTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  spendableCoins: number;
  unlockedSkills: string[];
  onUnlockSkill: (skillId: string) => void;
  totalCoinsClicked: number;
  rouletteSpins: number;
  lastRouletteMultiplier?: number;
  onRouletteSpin: () => void;
}

const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ 
  isOpen, 
  onClose, 
  spendableCoins, 
  unlockedSkills, 
  onUnlockSkill,
  totalCoinsClicked,
  rouletteSpins,
  onRouletteSpin
}) => {
  const [isSpinning, setIsSpinning] = useState(false);

  if (!isOpen) return null;

  const rouletteCost = ROULETTE_BASE_COST + (rouletteSpins * 10);
  const canAffordRoulette = spendableCoins >= rouletteCost;
  const isRouletteUnlocked = totalCoinsClicked >= ROULETTE_UNLOCK_THRESHOLD;

  const handleSpin = () => {
    if (isSpinning || !canAffordRoulette) return;
    setIsSpinning(true);
    
    // スピン演出ディレイ
    setTimeout(() => {
      onRouletteSpin();
      setIsSpinning(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-md bg-gradient-to-b from-emerald-950 to-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-emerald-500/30 flex flex-col max-h-[85vh]">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-emerald-500/10 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-emerald-400 flex items-center italic">
              <i className="fa-solid fa-graduation-cap mr-3"></i>
              WEALTH SKILLS
            </h2>
            <p className="text-emerald-200/60 text-[10px] font-bold uppercase tracking-widest">Master the Market</p>
          </div>
          <div className="bg-emerald-400 text-slate-900 px-3 py-1 rounded-full flex items-center font-black shadow-lg shadow-emerald-400/20">
            <i className="fa-solid fa-gem mr-2"></i>
            {spendableCoins}
          </div>
        </div>

        {isRouletteUnlocked && (
          <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <i className={`fa-solid fa-dharmachakra text-2xl text-emerald-400 ${isSpinning ? 'animate-spin' : ''}`}></i>
                <h3 className="text-lg font-black text-white italic">資産倍増ルーレット</h3>
              </div>
              <div className="text-[10px] font-bold text-emerald-200/50 bg-white/5 px-2 py-0.5 rounded uppercase">
                Trades: {rouletteSpins}
              </div>
            </div>
            
            <div className="bg-black/20 rounded-2xl p-4 border border-emerald-500/20 relative">
               <div className="text-center mb-3">
                  <p className="text-xs text-emerald-100/70 font-medium">現在の総資産を <span className="text-emerald-400 font-black">1〜5倍</span> にレバレッジ</p>
               </div>
               
               <button
                  onClick={handleSpin}
                  disabled={!canAffordRoulette || isSpinning}
                  className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-xl
                    ${canAffordRoulette && !isSpinning 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 hover:scale-[1.02] active:scale-95' 
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'}
                  `}
               >
                 {isSpinning ? (
                    <i className="fa-solid fa-spinner animate-spin"></i>
                 ) : (
                   <>
                    <i className="fa-solid fa-bolt"></i>
                    <span>EXECUTE TRADE ({rouletteCost} <i className="fa-solid fa-gem text-[10px]"></i>)</span>
                   </>
                 )}
               </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {COIN_SKILLS.map((skill) => {
            const isUnlocked = unlockedSkills.includes(skill.id);
            const canAfford = spendableCoins >= skill.cost;

            return (
              <div 
                key={skill.id}
                className={`relative p-4 rounded-2xl border-2 transition-all flex items-center space-x-4
                  ${isUnlocked 
                    ? 'bg-emerald-400/10 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]' 
                    : 'bg-white/5 border-white/10 opacity-80'}
                `}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg
                  ${isUnlocked ? 'bg-emerald-400 text-slate-900' : 'bg-slate-700 text-slate-400'}
                `}>
                  <i className={`fa-solid ${skill.icon} text-2xl`}></i>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-black text-sm md:text-base truncate ${isUnlocked ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {skill.name}
                    </h3>
                    {!isUnlocked && (
                      <div className="flex items-center text-xs font-black text-emerald-400 shrink-0">
                        <i className="fa-solid fa-gem mr-1"></i>
                        {skill.cost}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-400 leading-tight">
                    {skill.description}
                  </p>
                </div>

                {isUnlocked ? (
                  <div className="text-emerald-400 bg-emerald-400/20 px-2 py-1 rounded-lg text-[9px] font-black border border-emerald-400/30 whitespace-nowrap">
                    ACTIVE
                  </div>
                ) : (
                  <button
                    onClick={() => onUnlockSkill(skill.id)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all shrink-0
                      ${canAfford 
                        ? 'bg-emerald-400 text-slate-900 hover:scale-105 active:scale-95' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                    `}
                  >
                    ACQUIRE
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={onClose}
          className="m-6 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10 shrink-0"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default SkillTreeModal;
