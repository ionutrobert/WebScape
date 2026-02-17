import { FacingDirection } from '@/shared/types';

export function calculateFacing(fromX: number, fromY: number, toX: number, toY: number): FacingDirection {
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (dx === 0 && dy === 0) {
    return 'south';
  }

  if (dx > 0 && dy < 0) return 'northeast';
  if (dx > 0 && dy === 0) return 'east';
  if (dx > 0 && dy > 0) return 'southeast';
  if (dx === 0 && dy > 0) return 'south';
  if (dx < 0 && dy > 0) return 'southwest';
  if (dx < 0 && dy === 0) return 'west';
  if (dx < 0 && dy < 0) return 'northwest';
  if (dx === 0 && dy < 0) return 'north';
  
  return 'south';
}

export function getRotationForFacing(facing: string | FacingDirection): number {
  const rotations: Record<FacingDirection, number> = {
    north: Math.PI,
    northeast: Math.PI * 3/4,
    east: Math.PI / 2,
    southeast: Math.PI / 4,
    south: 0,
    southwest: -Math.PI / 4,
    west: -Math.PI / 2,
    northwest: -Math.PI * 3/4,
  };
  
  return rotations[facing as FacingDirection] ?? 0;
}

export function getRotationDifference(from: number, to: number): number {
  let diff = to - from;
  
  while (diff > Math.PI) {
    diff -= Math.PI * 2;
  }
  while (diff < -Math.PI) {
    diff += Math.PI * 2;
  }
  
  return diff;
}
