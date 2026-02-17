'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';

export interface InterpolatedPosition {
  x: number;
  y: number;
}

const TICK_DURATION_MS = 600;

export function usePositionInterpolation(
  targetX: number,
  targetY: number,
  enabled: boolean = true
): InterpolatedPosition {
  const [visualPos, setVisualPos] = useState<InterpolatedPosition>({ x: targetX, y: targetY });
  const startPos = useRef<InterpolatedPosition>({ x: targetX, y: targetY });
  const endPos = useRef<InterpolatedPosition>({ x: targetX, y: targetY });
  const startTime = useRef<number>(0);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (targetX !== endPos.current.x || targetY !== endPos.current.y) {
      startPos.current = visualPos;
      endPos.current = { x: targetX, y: targetY };
      startTime.current = performance.now();
      isAnimating.current = true;
    }
  }, [targetX, targetY, visualPos]);

  useFrame(() => {
    if (!enabled || !isAnimating.current) {
      setVisualPos({ x: targetX, y: targetY });
      return;
    }

    const now = performance.now();
    const elapsed = now - startTime.current;
    let t = elapsed / TICK_DURATION_MS;
    
    if (t >= 1) {
      t = 1;
      isAnimating.current = false;
      setVisualPos({ x: endPos.current.x, y: endPos.current.y });
    } else {
      const smoothT = smoothstep(t);
      const newX = startPos.current.x + (endPos.current.x - startPos.current.x) * smoothT;
      const newY = startPos.current.y + (endPos.current.y - startPos.current.y) * smoothT;
      setVisualPos({ x: newX, y: newY });
    }
  });

  return visualPos;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
