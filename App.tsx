
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Particle, GoldenCoin as GoldenCoinType } from './types';
import { INITIAL_UPGRADES, TICK_RATE, SKILL_TREE_UNLOCK_THRESHOLD, COIN_SKILLS, ROULETTE_BASE_COST } from './constants';
import { generateCookieNews, FALLBACK_NEWS, getCooldownRemaining } from './services/geminiService';
import CookieButton from './components/CookieButton';
import UpgradeItem from './components/UpgradeItem';
import GoldenCoin from './components/GoldenCoin';
import SkillTreeModal from './components/SkillTreeModal';

const SAVE_KEY = 'money_empire_save_v1';

export const formatValue = (val: number): string => {
  return Math.floor(val).toLocaleString();
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    cookies: 0,
    totalCookies: 0,
    cps: 0,
    ownedUpgrades: INITIAL_UPGRADES.reduce((acc, u) => ({ ...acc, [u.id]: 0 }), {}),
    lastMilestone: 0,
    news: FALLBACK_NEWS[0],
    autoBuyId: null,
    totalGoldenCoinsClicked: 0,
    spendableGoldenCoins: 0,
    unlockedSkills: [],
    rouletteSpins: 0,
    lastRouletteMultiplier: undefined,
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [goldenCoins, setGoldenCoins] = useState<GoldenCoinType[]>([]);
  const [newsCooldown, setNewsCooldown] = useState(0);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const [showRouletteResult, setShowRouletteResult] = useState<number | null>(null);
  
  const particleIdRef = useRef(0);
  const coinIdRef = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGameState(prev => ({
          ...prev,
          ...parsed,
          ownedUpgrades: { ...prev.ownedUpgrades, ...parsed.ownedUpgrades },
          unlockedSkills: parsed.unlockedSkills || [],
          rouletteSpins: parsed.rouletteSpins || 0,
          lastRouletteMultiplier: parsed.lastRouletteMultiplier,
        }));
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    }, 5000);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const hasAutoCollect = gameState.unlockedSkills.includes('auto_collect');

      setGoldenCoins(prev => {
        const next = prev.filter(c => c.expiresAt > now);
        if (hasAutoCollect) {
          prev.forEach(coin => {
            if (coin.expiresAt <= now && Math.random() < 0.5) {
              handleGoldenCoinClick(coin.id, true);
            }
          });
        }
        return next;
      });

      setNewsCooldown(getCooldownRemaining());

      setGameState(prev => {
        const skillMultiplier = prev.unlockedSkills.includes('skill_master') ? 1.1 : 1.0;
        const cookiesToAdd = (prev.cps * skillMultiplier * (TICK_RATE / 1000));
        
        let nextCookies = prev.cookies + cookiesToAdd;
        let nextTotalCookies = prev.totalCookies + cookiesToAdd;
        let nextOwnedUpgrades = { ...prev.ownedUpgrades };
        let nextCps = prev.cps;

        if (prev.autoBuyId) {
          const upgrade = INITIAL_UPGRADES.find(u => u.id === prev.autoBuyId);
          if (upgrade) {
            const owned = nextOwnedUpgrades[upgrade.id] || 0;
            const price = Math.floor(upgrade.basePrice * Math.pow(1.15, owned));
            if (nextCookies >= price) {
              nextCookies -= price;
              nextOwnedUpgrades[upgrade.id] = owned + 1;
              nextCps = INITIAL_UPGRADES.reduce((total, u) => {
                const uOwned = nextOwnedUpgrades[u.id] || 0;
                return total + (u.cpsIncrease * uOwned);
              }, 0);
            }
          }
        }

        const luckMultiplier = prev.unlockedSkills.includes('luck_boost') ? 1.25 : 1.0;
        const magnetCount = prev.ownedUpgrades['magnet'] || 0;
        const spawnChance = (0.002 + (magnetCount * 0.001)) * luckMultiplier;

        if (Math.random() < spawnChance && mainRef.current) {
          const rect = mainRef.current.getBoundingClientRect();
          const baseDuration = 5000;
          const durationMultiplier = prev.unlockedSkills.includes('time_stretch') ? 2.0 : 1.0;
          
          setGoldenCoins(current => [...current, {
            id: coinIdRef.current++,
            x: Math.max(40, Math.min(rect.width - 40, rect.width / 2 + (Math.random() - 0.5) * rect.width * 0.8)),
            y: Math.max(40, Math.min(rect.height - 40, 240 + (Math.random() - 0.5) * 300)),
            expiresAt: Date.now() + (baseDuration * durationMultiplier)
          }]);
        }

        if (cookiesToAdd === 0 && prev.cookies === nextCookies) return prev;
        return { 
          ...prev, 
          cookies: nextCookies, 
          totalCookies: nextTotalCookies, 
          ownedUpgrades: nextOwnedUpgrades, 
          cps: nextCps 
        };
      });
    }, TICK_RATE);
    return () => clearInterval(interval);
  }, [gameState.unlockedSkills]);

  const handleFetchNews = async () => {
    if (newsCooldown > 0 || isNewsLoading) return;
    setIsNewsLoading(true);
    try {
      const news = await generateCookieNews(gameState.cookies, gameState.cps);
      setGameState(prev => ({ ...prev, news }));
    } catch (error: any) {
      let gameErrorMsg = "市場が閉場しています...";
      if (error.message === "QUOTA_EXCEEDED") gameErrorMsg = "取引制限がかかりました（15分休憩）";
      else if (error.message.startsWith("API_BLOCKED")) gameErrorMsg = `アナリストが分析中...（あと${error.message.split(':')[1]}分）`;
      setGameState(prev => ({ ...prev, news: gameErrorMsg }));
      setNewsCooldown(getCooldownRemaining());
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isNewsLoading) {
        setGameState(prev => ({
          ...prev,
          news: FALLBACK_NEWS[Math.floor(Math.random() * FALLBACK_NEWS.length)]
        }));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isNewsLoading]);

  const handleCookieClick = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const clickValue = 1 + (gameState.ownedUpgrades['clicker'] || 0); 
    
    setGameState(prev => ({ ...prev, cookies: prev.cookies + clickValue, totalCookies: prev.totalCookies + clickValue }));
    const newParticle: Particle = { id: particleIdRef.current++, x: clientX, y: clientY, value: `+$${formatValue(clickValue)}` };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== newParticle.id)), 800);
  };

  const handleGoldenCoinClick = (coinId: number, isAuto: boolean = false) => {
    setGoldenCoins(prev => prev.filter(c => c.id !== coinId));
    setGameState(prev => {
      const ownedIds = Object.keys(prev.ownedUpgrades).filter(id => prev.ownedUpgrades[id] > 0);
      let bonusCookies = 0;
      if (prev.unlockedSkills.includes('dividend_frenzy')) {
        bonusCookies = prev.cookies * 0.05;
      }
      const baseUpdate = {
        totalGoldenCoinsClicked: prev.totalGoldenCoinsClicked + 1,
        spendableGoldenCoins: prev.spendableGoldenCoins + 1,
        cookies: prev.cookies + bonusCookies,
      };
      
      // 投資ボーナスの決定
      const luckyId = ownedIds.length > 0 ? ownedIds[Math.floor(Math.random() * ownedIds.length)] : null;
      
      if (!luckyId) {
        return { 
          ...prev, 
          ...baseUpdate, 
          cookies: prev.cookies + bonusCookies + 1000, 
          news: `特別配当！臨時ボーナス $1,000 を獲得！` 
        };
      }
      
      const upgradeInfo = INITIAL_UPGRADES.find(u => u.id === luckyId);
      const newOwned = { ...prev.ownedUpgrades, [luckyId]: prev.ownedUpgrades[luckyId] + 1 };
      const newCps = INITIAL_UPGRADES.reduce((total, u) => {
        const uOwned = newOwned[u.id] || 0;
        return total + (u.cpsIncrease * uOwned);
      }, 0);
      return { 
        ...prev, 
        ...baseUpdate, 
        ownedUpgrades: newOwned, 
        cps: newCps, 
        news: isAuto ? `自動回収！「${upgradeInfo?.name}」事業拡大！` : `投資成功！「${upgradeInfo?.name}」事業拡大！` 
      };
    });
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = INITIAL_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;
    const owned = gameState.ownedUpgrades[upgradeId] || 0;
    const price = Math.floor(upgrade.basePrice * Math.pow(1.15, owned));
    if (gameState.cookies >= price) {
      setGameState(prev => {
        const newOwned = { ...prev.ownedUpgrades, [upgradeId]: owned + 1 };
        const newCps = INITIAL_UPGRADES.reduce((total, u) => {
          const uOwned = newOwned[u.id] || 0;
          return total + (u.cpsIncrease * uOwned);
        }, 0);
        return { ...prev, cookies: prev.cookies - price, ownedUpgrades: newOwned, cps: newCps };
      });
    }
  };

  const handleUnlockSkill = (skillId: string) => {
    const skill = COIN_SKILLS.find(s => s.id === skillId);
    if (!skill || gameState.unlockedSkills.includes(skillId) || gameState.spendableGoldenCoins < skill.cost) return;

    setGameState(prev => ({
      ...prev,
      spendableGoldenCoins: prev.spendableGoldenCoins - skill.cost,
      unlockedSkills: [...prev.unlockedSkills, skillId],
      news: `習得！「${skill.name}」スキルが有効になりました！`
    }));
  };

  const handleRouletteSpin = () => {
    const cost = ROULETTE_BASE_COST + (gameState.rouletteSpins * 10);
    if (gameState.spendableGoldenCoins < cost) return;

    const multiplier = Math.floor(Math.random() * 5) + 1;
    const newCookies = gameState.cookies * multiplier;
    
    setGameState(prev => ({
      ...prev,
      cookies: newCookies,
      totalCookies: prev.totalCookies + (newCookies - prev.cookies),
      spendableGoldenCoins: prev.spendableGoldenCoins - cost,
      rouletteSpins: prev.rouletteSpins + 1,
      lastRouletteMultiplier: multiplier,
    }));

    setShowRouletteResult(multiplier);
    setTimeout(() => setShowRouletteResult(null), 3000);
  };

  const isSkillTreeUnlocked = gameState.totalGoldenCoinsClicked >= SKILL_TREE_UNLOCK_THRESHOLD;

  // Fix: Added displayCps calculation to resolve the reference error on line 341.
  const displayCps = gameState.cps * (gameState.unlockedSkills.includes('skill_master') ? 1.1 : 1.0);

  // 桁数に応じたフォントサイズ調整
  const getCookieFontSize = (val: number) => {
    const length = Math.floor(val).toLocaleString().length;
    if (length > 25) return 'text-xl sm:text-2xl md:text-3xl';
    if (length > 20) return 'text-2xl sm:text-3xl md:text-4xl';
    if (length > 15) return 'text-3xl sm:text-4xl md:text-5xl';
    return 'text-5xl sm:text-6xl md:text-7xl';
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-emerald-900">
      <header className="bg-white/80 backdrop-blur-md p-3 border-b border-emerald-200 z-10 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-xl font-black text-emerald-700 italic tracking-tighter">
          MONEY CLICKER
        </h1>
        
        {isSkillTreeUnlocked && (
          <button 
            onClick={() => setIsSkillTreeOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2 rounded-full text-xs font-black shadow-lg shadow-emerald-500/30 animate-pulse active:scale-95 transition-all"
          >
            <i className="fa-solid fa-graduation-cap text-sm"></i>
            <span>SKILLS</span>
            <span className="bg-white/30 px-1.5 rounded-md text-[10px] tabular-nums">{gameState.spendableGoldenCoins}</span>
          </button>
        )}
      </header>

      <main ref={mainRef} className="flex-1 flex flex-col items-center justify-start relative overflow-hidden p-4">
        {/* ルーレット結果オーバーレイ */}
        {showRouletteResult && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none select-none bg-emerald-400/5 backdrop-blur-[1px] animate-in fade-in zoom-in duration-300">
            <div className="text-[140px] md:text-[200px] font-black text-emerald-600 drop-shadow-[0_0_30px_rgba(5,150,105,0.6)] italic animate-bounce leading-none">
              x{showRouletteResult}
            </div>
            <div className="text-2xl md:text-4xl font-black text-white bg-emerald-600 px-8 py-2 rounded-full shadow-2xl uppercase tracking-tighter -mt-8 border-4 border-white">
              Portfolio Surged!
            </div>
          </div>
        )}

        {/* ニュース表示 */}
        <div className="w-full max-md flex items-center space-x-2 mb-2 z-20 shrink-0">
          <div className="flex-1 bg-emerald-100/50 rounded-full px-4 py-2 flex items-center text-[10px] md:text-xs font-medium text-emerald-800 border border-emerald-200 overflow-hidden shadow-inner backdrop-blur-sm">
            <i className={`fa-solid fa-tower-broadcast mr-2 ${isNewsLoading ? 'animate-spin' : 'animate-bounce'}`}></i>
            <span className="truncate flex-1">{gameState.news}</span>
          </div>
          <button
            onClick={handleFetchNews}
            disabled={newsCooldown > 0 || isNewsLoading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 shrink-0
              ${newsCooldown > 0 || isNewsLoading ? 'bg-gray-200 text-gray-400 grayscale cursor-not-allowed' : 'bg-emerald-600 text-white'}
            `}
          >
            {isNewsLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : newsCooldown > 0 ? <span className="text-[8px] font-bold">{Math.ceil(newsCooldown)}s</span> : <i className="fa-solid fa-magnifying-glass-chart"></i>}
          </button>
        </div>

        {/* ポイント表示エリア */}
        <div className="w-full flex flex-col items-center justify-center mb-2 z-20 pointer-events-none select-none">
          {/* CPS表示 */}
          <div className="mb-2">
            <span className="text-xs sm:text-sm font-black text-emerald-700 whitespace-nowrap bg-emerald-200/80 px-4 py-1 rounded-full border border-emerald-300 shadow-sm flex items-center backdrop-blur-sm">
              <i className="fa-solid fa-arrow-up-right-dots mr-1.5 text-[10px]"></i>
              ${formatValue(displayCps)} / sec
            </span>
          </div>

          {/* 資産表示 */}
          <div className="text-center px-4 w-full">
            <div className="flex flex-col items-center animate-[bounce-subtle_2s_infinite]">
              <div className={`text-emerald-800 font-black italic tracking-tighter leading-none flex items-center justify-center drop-shadow-md transition-all duration-300 w-full
                ${getCookieFontSize(gameState.cookies)}
              `}>
                <span className="text-3xl sm:text-4xl md:text-5xl mr-2 text-emerald-600">$</span>
                <span className="tabular-nums break-all text-center">{formatValue(gameState.cookies)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* メインボタン */}
        <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-sm">
          <CookieButton onClick={handleCookieClick} />
        </div>

        {goldenCoins.map(coin => <GoldenCoin key={coin.id} x={coin.x} y={coin.y} onClick={() => handleGoldenCoinClick(coin.id)} />)}
        {particles.map(p => <div key={p.id} className="click-particle font-black drop-shadow-lg z-50 text-4xl text-emerald-600" style={{ left: p.x - 20, top: p.y - 20, WebkitTextStroke: '2px #fff' }}>{p.value}</div>)}
      </main>

      {/* ストアエリア */}
      <div className="bg-white rounded-t-3xl shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)] border-t border-emerald-100 h-[40%] md:h-1/3 flex flex-col overflow-hidden shrink-0">
        <div className="p-4 flex items-center justify-between border-b border-emerald-50 shrink-0">
          <h2 className="text-lg font-black text-emerald-800 uppercase tracking-widest">ASSETS & BUSINESS</h2>
          {!isSkillTreeUnlocked && (
            <div className="text-[10px] font-bold text-emerald-500 flex items-center bg-emerald-50 px-2 py-1 rounded-full">
              <i className="fa-solid fa-lock mr-1"></i>
              Skills: {gameState.totalGoldenCoinsClicked}/{SKILL_TREE_UNLOCK_THRESHOLD} events
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {INITIAL_UPGRADES.map(upgrade => (
            <UpgradeItem
              key={upgrade.id}
              upgrade={upgrade}
              owned={gameState.ownedUpgrades[upgrade.id] || 0}
              canAfford={gameState.cookies >= Math.floor(upgrade.basePrice * Math.pow(1.15, gameState.ownedUpgrades[upgrade.id] || 0))}
              onBuy={() => buyUpgrade(upgrade.id)}
              isAutoBuy={gameState.autoBuyId === upgrade.id}
              onToggleAutoBuy={(e) => { e.stopPropagation(); setGameState(prev => ({ ...prev, autoBuyId: prev.autoBuyId === upgrade.id ? null : upgrade.id })); }}
            />
          ))}
        </div>
      </div>

      <SkillTreeModal 
        isOpen={isSkillTreeOpen}
        onClose={() => setIsSkillTreeOpen(false)}
        spendableCoins={gameState.spendableGoldenCoins}
        unlockedSkills={gameState.unlockedSkills}
        onUnlockSkill={handleUnlockSkill}
        totalCoinsClicked={gameState.totalGoldenCoinsClicked}
        rouletteSpins={gameState.rouletteSpins}
        lastRouletteMultiplier={gameState.lastRouletteMultiplier}
        onRouletteSpin={handleRouletteSpin}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #6ee7b7; border-radius: 10px; }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default App;
