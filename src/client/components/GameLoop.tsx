'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/client/stores/gameStore';

const TICK_MS = 600;

export function GameLoop() {
  const { 
    currentAction,
    isLoaded 
  } = useGameStore();
  
  const tickCountRef = useRef(0);
  const tickActionRef = useRef<() => void>(() => {});
  const currentActionRef = useRef(currentAction);

  useEffect(() => {
    currentActionRef.current = currentAction;
  }, [currentAction]);

  useEffect(() => {
    tickActionRef.current = () => {
      if (currentActionRef.current) {
        useGameStore.getState().tickAction();
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      tickCountRef.current += 1;
      tickActionRef.current();
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [isLoaded]);

  return null;
}

export function useGameLoop() {
  return { tickMs: TICK_MS };
}
