import { playerManager } from '../players';
import { world } from '../world';
import { WORLD_SIZE } from '../config';

export function isValidPosition(x: number, y: number): boolean {
  return x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE;
}

export function processMovement(playerId: string): { moved: boolean; newX: number; newY: number } | null {
  const player = playerManager.get(playerId);
  if (!player) return null;
  
  if (!playerManager.hasTarget(playerId) || playerManager.reachedTarget(playerId)) {
    playerManager.clearTarget(playerId);
    return null;
  }
  
  const target = playerManager.getTarget(playerId)!;
  
  let nextX = player.x;
  let nextY = player.y;
  
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    nextX += Math.sign(dx);
  } else {
    nextY += Math.sign(dy);
  }
  
  if (!world.isBlocked(nextX, nextY)) {
    playerManager.movePlayer(playerId, nextX, nextY);
    return { moved: true, newX: nextX, newY: nextY };
  } else {
    playerManager.clearTarget(playerId);
    return { moved: false, newX: player.x, newY: player.y };
  }
}

export function setMovementTarget(playerId: string, targetX: number, targetY: number): { valid: boolean; reason?: string } {
  if (!isValidPosition(targetX, targetY)) {
    return { valid: false, reason: 'Cannot move outside the world.' };
  }
  
  playerManager.setTarget(playerId, targetX, targetY);
  return { valid: true };
}
