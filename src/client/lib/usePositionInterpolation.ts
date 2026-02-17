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
const ROTATION_DELAY_MS = 50;

export function usePositionInterpolation(
  targetX: number,
  targetY: number,
  enabled: boolean = true
): UsePositionInterpolationResult {
  const visualPosRef = useRef<InterpolatedPosition>({ x: targetX, y: targetY });
  const startPosRef = useRef<InterpolatedPosition>({ x: targetX, y: targetY });
  const endPosRef = useRef<InterpolatedPosition>({ x: targetX, y: targetY });
  const startTimeRef = useRef<number>(0);
  const hasStartedMovingRef = useRef(false);
  const targetRef = useRef({ x: targetX, y: targetY });

  useEffect(() => {
    if (targetX !== targetRef.current.x || targetY !== targetRef.current.y) {
      startPosRef.current = { ...visualPosRef.current };
      endPosRef.current = { x: targetX, y: targetY };
      targetRef.current = { x: targetX, y: targetY };
      startTimeRef.current = performance.now();
      hasStartedMovingRef.current = false;
    }
  }, [targetX, targetY]);

  useFrame(() => {
    if (!enabled) {
      visualPosRef.current = { x: targetX, y: targetY };
      return;
    }

    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    
    if (elapsed < ROTATION_DELAY_MS) {
      return;
    }

    if (!hasStartedMovingRef.current) {
      hasStartedMovingRef.current = true;
    }

    const movementElapsed = elapsed - ROTATION_DELAY_MS;
    const movementDuration = TICK_DURATION_MS - ROTATION_DELAY_MS;
    let t = movementElapsed / movementDuration;
    
    if (t >= 1) {
      t = 1;
      visualPosRef.current = { ...endPosRef.current };
    } else {
      const smoothT = easeInOutQuad(t);
      visualPosRef.current = {
        x: startPosRef.current.x + (endPosRef.current.x - startPosRef.current.x) * smoothT,
        y: startPosRef.current.y + (endPosRef.current.y - startPosRef.current.y) * smoothT,
      };
    }
  });

  const isMoving = hasStartedMovingRef.current && 
    (Math.abs(visualPosRef.current.x - targetX) > 0.001 || 
     Math.abs(visualPosRef.current.y - targetY) > 0.001);

  return { x: visualPosRef.current.x, y: visualPosRef.current.y, isMoving };
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
