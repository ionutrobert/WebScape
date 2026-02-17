'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/client/stores/gameStore';

const TICK_MS = 600;

export function GameLoop() {
  const { 
    currentAction,
    tickAction,
    isLoaded 
  } = useGameStore();
  
  const tickCountRef = useRef(0);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      tickCountRef.current += 1;

      if (currentAction) {
        tickAction();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [isLoaded, currentAction, tickAction]);

  return null;
}

export function useGameLoop() {
  return { tickMs: TICK_MS };
}
