
import { GoogleGenAI } from "@google/genai";

// 前回の呼び出し時間を記録
let lastCallTime = 0;
const MIN_INTERVAL = 300000; // 5分間
let apiBlockedUntil = 0; 
let isRequesting = false;

export const FALLBACK_NEWS = [
  "中央銀行が金利据え置きを発表しました。",
  "あなたの総資産が地方都市の国家予算を超えました。",
  "株式市場であなたの企業がトップシェアを維持しています。",
  "黄金のコインが金融街に降り注ぐという噂があります。",
  "全宇宙の通貨価値があなたの資産に連動し始めました。",
  "経済学者が「あなたの投資術は魔法だ」と絶賛しています。",
  "不動産市場が空前のバブルを迎えています。",
  "世界長者番付の1位から100位までがあなたで埋まりました。",
  "AIが「お金はあなたの友だち」と分析しました。",
  "月面での土地販売が完売、あなたの独占状態です。",
  "新しいデジタル通貨「Money-C」が誕生しました。",
  "全宇宙の税率が0%になり、あなたの純利益が増加中。",
  "あなたのクリック一つで市場の株価が変動します。",
  "宇宙銀行があなたに特別功労賞を授与しました。",
  "造幣局があなたの顔を新紙幣に採用することを検討中。"
];

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error.status === 429 || error.message?.toLowerCase().includes('quota')) {
      apiBlockedUntil = Date.now() + (15 * 60 * 1000);
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
}

export async function generateCookieNews(cookies: number, cps: number): Promise<string> {
  const now = Date.now();
  
  if (now < apiBlockedUntil) {
    throw new Error(`API_BLOCKED:${Math.ceil((apiBlockedUntil - now) / 60000)}`);
  }
  
  if (isRequesting) return "市場分析中...";

  isRequesting = true;
  lastCallTime = now;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `現在の資産: ${Math.floor(cookies)}$、毎秒収益: ${cps.toFixed(1)}$。
        この状況に基づいた、経済や資産形成に関する短くて面白い「ニュース速報」を1つ日本語で作成してください。
        「です・ます」調で20文字以内、絵文字禁止。`,
        config: {
          temperature: 0.8,
        },
      });
    });

    return response.text?.trim() || FALLBACK_NEWS[Math.floor(Math.random() * FALLBACK_NEWS.length)];
  } catch (error: any) {
    console.warn("Gemini Service:", error.message);
    throw error;
  } finally {
    isRequesting = false;
  }
}

export function getCooldownRemaining(): number {
  const now = Date.now();
  const nextAvailable = lastCallTime + MIN_INTERVAL;
  const blocked = apiBlockedUntil > now ? apiBlockedUntil : 0;
  return Math.max(0, (Math.max(nextAvailable, blocked) - now) / 1000);
}
