'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { getRotationForFacing } from './facing';

const ROTATION_DURATION_MS = 50;

export function useFacingInterpolation(
  targetFacing: string,
  enabled: boolean = true
): number {
  const rotationRef = useRef(getRotationForFacing(targetFacing));
  const startRotationRef = useRef(getRotationForFacing(targetFacing));
  const targetRotationRef = useRef(getRotationForFacing(targetFacing));
  const startTimeRef = useRef(0);
  const isRotatingRef = useRef(false);
  const targetFacingRef = useRef(targetFacing);

  useEffect(() => {
    if (targetFacing !== targetFacingRef.current) {
      startRotationRef.current = rotationRef.current;
      targetRotationRef.current = getRotationForFacing(targetFacing);
      targetFacingRef.current = targetFacing;
      startTimeRef.current = performance.now();
      isRotatingRef.current = true;
    }
  }, [targetFacing]);

  useFrame(() => {
    if (!enabled) {
      return;
    }

    if (!isRotatingRef.current) {
      return;
    }

    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    let t = elapsed / ROTATION_DURATION_MS;
    
    if (t >= 1) {
      t = 1;
      isRotatingRef.current = false;
      rotationRef.current = targetRotationRef.current;
    } else {
      const smoothT = easeInOutQuad(t);
      rotationRef.current = startRotationRef.current + 
        (targetRotationRef.current - startRotationRef.current) * smoothT;
    }
  });

  return rotationRef.current;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
