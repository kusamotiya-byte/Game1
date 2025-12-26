
import React from 'react';
import { Upgrade } from '../types';
import { formatValue } from '../App';

interface UpgradeItemProps {
  upgrade: Upgrade;
  owned: number;
  canAfford: boolean;
  onBuy: () => void;
  isAutoBuy: boolean;
  onToggleAutoBuy: (e: React.MouseEvent) => void;
}

const UpgradeItem: React.FC<UpgradeItemProps> = ({ upgrade, owned, canAfford, onBuy, isAutoBuy, onToggleAutoBuy }) => {
  const currentPrice = Math.floor(upgrade.basePrice * Math.pow(1.15, owned));
  const isClickUpgrade = upgrade.clickIncrease && upgrade.clickIncrease > 0;
  const isChanceUpgrade = upgrade.coinChanceIncrease && upgrade.coinChanceIncrease > 0;

  return (
    <div className="relative mb-3">
      {/* 自動購入チェック */}
      <div 
        onClick={onToggleAutoBuy}
        className={`absolute -left-2 -top-1 z-20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-2 transition-all shadow-sm
          ${isAutoBuy ? 'bg-emerald-500 border-white text-white scale-110' : 'bg-white border-emerald-100 text-emerald-200 hover:border-emerald-300'}
        `}
        title="自動購入"
      >
        <i className={`fa-solid ${isAutoBuy ? 'fa-check' : 'fa-robot'} text-xs`}></i>
      </div>

      <button
        onClick={onBuy}
        disabled={!canAfford}
        className={`
          w-full flex items-center p-3 rounded-xl transition-all border-2 relative
          ${canAfford 
            ? 'bg-white border-emerald-200 shadow-sm active:scale-95 hover:border-emerald-400' 
            : 'bg-gray-100 border-gray-200 opacity-60 grayscale cursor-not-allowed'}
          ${isAutoBuy ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}
        `}
      >
        {/* アイコン部分 */}
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center mr-4 shrink-0
          ${canAfford ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}
        `}>
          <i className={`fa-solid ${upgrade.icon} text-xl`}></i>
        </div>
        
        {/* 説明・ステータス部分 */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm md:text-base truncate">{upgrade.name}</h3>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap border border-emerald-100">
              {isClickUpgrade ? `+$${formatValue(upgrade.clickIncrease!)}/C` : 
               isChanceUpgrade ? `+${(upgrade.coinChanceIncrease! * 100).toFixed(1)}%/R` :
               `+$${formatValue(upgrade.cpsIncrease)}/S`}
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-gray-400 leading-tight my-1">
            {upgrade.description}
          </p>
          <div className="flex items-center text-xs font-semibold">
            <span className={`${canAfford ? 'text-emerald-600' : 'text-gray-500'} flex items-center break-all`}>
              <i className="fa-solid fa-sack-dollar mr-1"></i>
              ${formatValue(currentPrice)}
            </span>
          </div>
        </div>
        
        {/* 所持数部分 */}
        <div className="text-right ml-3 shrink-0">
          <span className="text-xl font-black text-emerald-600 leading-none block">{owned}</span>
          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Level</p>
        </div>
      </button>
    </div>
  );
};

export default UpgradeItem;
