
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  cpsIncrease: number;
  clickIncrease?: number; // クリック時の加算量
  coinChanceIncrease?: number; // 黄金のコイン出現率アップ
  icon: string;
}

export interface CoinSkill {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  effect?: any;
}

export interface GameState {
  cookies: number;
  totalCookies: number;
  cps: number;
  ownedUpgrades: Record<string, number>;
  lastMilestone: number;
  news: string;
  autoBuyId: string | null;
  // 黄金コイン関連
  totalGoldenCoinsClicked: number;
  spendableGoldenCoins: number;
  unlockedSkills: string[];
  // ルーレット関連
  rouletteSpins: number;
  lastRouletteMultiplier?: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  value: number | string;
}

export interface GoldenCoin {
  id: number;
  x: number;
  y: number;
  expiresAt: number;
}
