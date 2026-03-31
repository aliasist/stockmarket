import { useCallback } from 'react';

export function useAlertSound() {
  const play = useCallback((type: 'bullish' | 'bearish' | 'neutral') => {
    const map = {
      bullish: '/audio/alert-bullish.mp3',
      bearish: '/audio/alert-bearish.mp3',
      neutral: '/audio/alert-neutral.mp3',
    };
    try {
      const audio = new Audio(map[type]);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }, []);
  return { play };
}
