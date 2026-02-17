'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { getRotationForFacing, getRotationDifference } from './facing';

const TICK_DURATION_MS = 600;

export function useFacingInterpolation(
  targetFacing: string,
  enabled: boolean = true
): number {
  const [rotation, setRotation] = useState(getRotationForFacing(targetFacing));
  const startRotation = useRef(getRotationForFacing(targetFacing));
  const targetRotation = useRef(getRotationForFacing(targetFacing));
  const startTime = useRef(0);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (targetFacing !== getFacingFromRotation(targetRotation.current)) {
      startRotation.current = rotation;
      targetRotation.current = getRotationForFacing(targetFacing);
      startTime.current = performance.now();
      isAnimating.current = true;
    }
  }, [targetFacing, rotation]);

  useFrame(() => {
    if (!enabled || !isAnimating.current) {
      setRotation(getRotationForFacing(targetFacing));
      return;
    }

    const now = performance.now();
    const elapsed = now - startTime.current;
    let t = elapsed / TICK_DURATION_MS;
    
    if (t >= 1) {
      t = 1;
      isAnimating.current = false;
      setRotation(targetRotation.current);
    } else {
      const smoothT = smoothstep(t);
      const newRotation = startRotation.current + (targetRotation.current - startRotation.current) * smoothT;
      setRotation(newRotation);
    }
  });

  return rotation;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function getFacingFromRotation(rot: number): string {
  const directions = [
    { facing: 'south', rot: 0 },
    { facing: 'southeast', rot: Math.PI / 4 },
    { facing: 'east', rot: Math.PI / 2 },
    { facing: 'northeast', rot: Math.PI * 3/4 },
    { facing: 'north', rot: Math.PI },
    { facing: 'northwest', rot: -Math.PI * 3/4 },
    { facing: 'west', rot: -Math.PI / 2 },
    { facing: 'southwest', rot: -Math.PI / 4 },
  ];
  
  let closest = directions[0];
  let minDiff = Infinity;
  
  for (const dir of directions) {
    const diff = getRotationDifference(rot, dir.rot);
    if (Math.abs(diff) < minDiff) {
      minDiff = Math.abs(diff);
      closest = dir;
    }
  }
  
  return closest.facing;
}
