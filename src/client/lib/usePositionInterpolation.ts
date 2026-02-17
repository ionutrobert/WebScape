'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';

export interface InterpolatedPosition {
  x: number;
  y: number;
}

export interface UsePositionInterpolationResult {
  x: number;
  y: number;
  isMoving: boolean;
}

const DEFAULT_TICK_DURATION_MS = 600;

export function usePositionInterpolation(
  targetX: number,
  targetY: number,
  startX: number,
  startY: number,
  enabled: boolean = true,
  tickStartTime?: number,
  tickDuration: number = DEFAULT_TICK_DURATION_MS
): UsePositionInterpolationResult {
  const [mounted, setMounted] = useState(false);
  const visualPosRef = useRef<InterpolatedPosition>({ x: targetX, y: targetY });
  const targetRef = useRef({ x: targetX, y: targetY, startX, startY });
  const animationStartTimeRef = useRef<number>(0);
  const animationDurationRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (targetX !== targetRef.current.x || targetY !== targetRef.current.y) {
      targetRef.current = { x: targetX, y: targetY, startX, startY };
      visualPosRef.current = { x: startX, y: startY };
      
      if (tickStartTime) {
        const now = performance.now();
        const serverNow = Date.now();
        const elapsedSinceTickStart = serverNow - tickStartTime;
        const remainingTime = Math.max(0, tickDuration - elapsedSinceTickStart);
        
        if (remainingTime > 0) {
          animationStartTimeRef.current = now - elapsedSinceTickStart;
          animationDurationRef.current = tickDuration;
          isAnimatingRef.current = true;
        } else {
          visualPosRef.current = { x: targetX, y: targetY };
          isAnimatingRef.current = false;
        }
      } else {
        animationStartTimeRef.current = performance.now();
        animationDurationRef.current = tickDuration;
        isAnimatingRef.current = true;
      }
    }
  }, [targetX, targetY, startX, startY, tickStartTime, tickDuration, mounted]);

  useFrame(() => {
    if (!enabled || !mounted) {
      visualPosRef.current = { x: targetX, y: targetY };
      return;
    }

    if (!isAnimatingRef.current) {
      visualPosRef.current = { x: targetX, y: targetY };
      return;
    }

    const now = performance.now();
    const elapsed = now - animationStartTimeRef.current;
    let t = elapsed / animationDurationRef.current;
    
    if (t >= 1) {
      t = 1;
      isAnimatingRef.current = false;
      visualPosRef.current = { x: targetX, y: targetY };
    } else {
      const sX = targetRef.current.startX;
      const sY = targetRef.current.startY;
      const eX = targetRef.current.x;
      const eY = targetRef.current.y;
      
      visualPosRef.current = {
        x: sX + (eX - sX) * t,
        y: sY + (eY - sY) * t,
      };
    }
  });

  if (!mounted) {
    return { x: targetX, y: targetY, isMoving: false };
  }

  return { 
    x: visualPosRef.current.x, 
    y: visualPosRef.current.y, 
    isMoving: isAnimatingRef.current 
  };
}
