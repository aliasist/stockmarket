// Determines bull/bear/neutral from sentiment + price data
export type MarketState = 'bull' | 'bear' | 'neutral';

export function getMarketState(vectors: Array<{signal: string}>, spyChange?: number): MarketState {
  if (!vectors.length) return 'neutral';
  const bullish = vectors.filter(v => v.signal === 'bullish').length;
  const bearish = vectors.filter(v => v.signal === 'bearish').length;
  const ratio = bullish / (bullish + bearish + 0.001);
  if (ratio > 0.6) return 'bull';
  if (ratio < 0.4) return 'bear';
  return 'neutral';
}

export function getMarketBg(state: MarketState): string {
  return {
    bull: '/market-bull.png',
    bear: '/market-bear.png',
    neutral: '/market-neutral.png',
  }[state];
}
