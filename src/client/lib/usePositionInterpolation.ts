'use client';

import { useRef, useEffect } from 'react';
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

const TICK_DURATION_MS = 600;

export function usePositionInterpolation(
  targetX: number,
  targetY: number,
  startX: number,
  startY: number,
  enabled: boolean = true
): UsePositionInterpolationResult {
  const visualPosRef = useRef<InterpolatedPosition>({ x: targetX, y: targetY });
  const targetRef = useRef({ x: targetX, y: targetY, startX, startY });
  const startTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (targetX !== targetRef.current.x || targetY !== targetRef.current.y) {
      targetRef.current = { x: targetX, y: targetY, startX, startY };
      visualPosRef.current = { x: startX, y: startY };
      startTimeRef.current = performance.now();
      isAnimatingRef.current = true;
    }
  }, [targetX, targetY, startX, startY]);

  useFrame(() => {
    if (!enabled) {
      visualPosRef.current = { x: targetX, y: targetY };
      return;
    }

    if (!isAnimatingRef.current) {
      visualPosRef.current = { x: targetX, y: targetY };
      return;
    }

    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    let t = elapsed / TICK_DURATION_MS;
    
    if (t >= 1) {
      t = 1;
      isAnimatingRef.current = false;
      visualPosRef.current = { x: targetX, y: targetY };
    } else {
      const startX = targetRef.current.startX;
      const startY = targetRef.current.startY;
      const endX = targetRef.current.x;
      const endY = targetRef.current.y;
      
      visualPosRef.current = {
        x: startX + (endX - startX) * t,
        y: startY + (endY - startY) * t,
      };
    }
  });

  return { 
    x: visualPosRef.current.x, 
    y: visualPosRef.current.y, 
    isMoving: isAnimatingRef.current 
  };
}
