'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';

export interface UsePositionInterpolationResult {
  x: number;
  y: number;
  isMoving: boolean;
  movementProgress: number;
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
  const [result, setResult] = useState({ x: startX, y: startY, isMoving: false, movementProgress: 0 });
  
  const animRef = useRef({
    fromX: startX,
    fromY: startY,
    toX: targetX,
    toY: targetY,
    startTime: 0,
  });
  
  const visualRef = useRef({ x: startX, y: startY });
  const lastPositionsRef = useRef({ startX, startY, targetX, targetY });

  useEffect(() => {
    const posChanged = 
      startX !== lastPositionsRef.current.startX ||
      startY !== lastPositionsRef.current.startY ||
      targetX !== lastPositionsRef.current.targetX ||
      targetY !== lastPositionsRef.current.targetY;
    
    if (posChanged) {
      // Continue from current visual position for smooth transitions
      if (animRef.current.startTime > 0) {
        animRef.current.fromX = visualRef.current.x;
        animRef.current.fromY = visualRef.current.y;
      } else {
        animRef.current.fromX = startX;
        animRef.current.fromY = startY;
      }
      
      animRef.current.toX = targetX;
      animRef.current.toY = targetY;
      animRef.current.startTime = 0;
      
      lastPositionsRef.current = { startX, startY, targetX, targetY };
    }
  }, [startX, startY, targetX, targetY]);

  useFrame((state) => {
    const anim = animRef.current;
    
    // Not moving - stay at target
    if (!enabled || (anim.fromX === anim.toX && anim.fromY === anim.toY)) {
      visualRef.current = { x: anim.toX, y: anim.toY };
      setResult({ x: anim.toX, y: anim.toY, isMoving: false, movementProgress: 0 });
      return;
    }

    // Start animation timer on first frame of movement
    if (anim.startTime === 0) {
      anim.startTime = state.clock.elapsedTime * 1000;
    }

    const now = state.clock.elapsedTime * 1000;
    const elapsed = now - anim.startTime;
    const t = Math.min(elapsed / tickDuration, 1);
    
    // Linear interpolation
    const newX = anim.fromX + (anim.toX - anim.fromX) * t;
    const newY = anim.fromY + (anim.toY - anim.fromY) * t;
    
    visualRef.current = { x: newX, y: newY };
    setResult({ x: newX, y: newY, isMoving: t < 1, movementProgress: t });
  });

  return result;
}
