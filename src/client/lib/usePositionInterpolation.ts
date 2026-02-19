"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

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
  tickDuration: number = DEFAULT_TICK_DURATION_MS,
): UsePositionInterpolationResult {
  const resultRef = useRef({
    x: startX,
    y: startY,
    isMoving: false,
    movementProgress: 0,
  });

  const animRef = useRef({
    fromX: startX,
    fromY: startY,
    toX: targetX,
    toY: targetY,
    lastTickStartTime: 0,
  });

  const visualRef = useRef({ x: startX, y: startY });
  const lastTargetRef = useRef({ x: targetX, y: targetY });

  useEffect(() => {
    const targetChanged =
      targetX !== lastTargetRef.current.x ||
      targetY !== lastTargetRef.current.y;

    if (targetChanged) {
      animRef.current.fromX = visualRef.current.x;
      animRef.current.fromY = visualRef.current.y;
      animRef.current.toX = targetX;
      animRef.current.toY = targetY;

      if (tickStartTime) {
        animRef.current.lastTickStartTime = tickStartTime;
      }

      lastTargetRef.current = { x: targetX, y: targetY };
    }
  }, [targetX, targetY, tickStartTime]);

  useFrame(() => {
    const anim = animRef.current;

    const atDestination = anim.fromX === anim.toX && anim.fromY === anim.toY;
    if (!enabled || atDestination) {
      visualRef.current = { x: anim.toX, y: anim.toY };
      resultRef.current = {
        x: anim.toX,
        y: anim.toY,
        isMoving: false,
        movementProgress: 0,
      };
      return;
    }

    const baseTick = anim.lastTickStartTime || Date.now();
    const now = Date.now();
    const elapsed = now - baseTick;
    let progress = elapsed / tickDuration;

    if (progress > 1) {
      progress = 1;
    }

    const t = Math.min(Math.max(progress, 0), 1);

    const newX = anim.fromX + (anim.toX - anim.fromX) * t;
    const newY = anim.fromY + (anim.toY - anim.fromY) * t;

    visualRef.current = { x: newX, y: newY };
    resultRef.current = {
      x: newX,
      y: newY,
      isMoving: t < 1,
      movementProgress: t,
    };
  });

  return resultRef.current;
}
