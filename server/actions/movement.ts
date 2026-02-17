import { playerManager } from '../players';
import { world } from '../world';
import { WORLD_SIZE } from '../config';
import { Pathfinder } from '../pathfinder';

const pathfinder = new Pathfinder(world.getCollisionManager());

export interface PathStep {
  x: number;
  y: number;
}

const playerPaths: Map<string, PathStep[]> = new Map();

export function isValidPosition(x: number, y: number): boolean {
  return x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE;
}

export function calculatePath(playerId: string, startX: number, startY: number, targetX: number, targetY: number): PathStep[] {
  const path = pathfinder.findPath(
    { x: startX, y: startY },
    { x: targetX, y: targetY },
    true,
    50
  );
  
  playerPaths.set(playerId, path);
  return path;
}

export function getPath(playerId: string): PathStep[] {
  return playerPaths.get(playerId) || [];
}

export function clearPath(playerId: string): void {
  playerPaths.delete(playerId);
}

export function processMovement(playerId: string, isRunning: boolean = false): { moved: boolean; newX: number; newY: number } | null {
  const player = playerManager.get(playerId);
  if (!player) return null;
  
  if (!playerManager.hasTarget(playerId) || playerManager.reachedTarget(playerId)) {
    playerManager.clearTarget(playerId);
    clearPath(playerId);
    return null;
  }
  
  const target = playerManager.getTarget(playerId)!;
  
  let path = playerPaths.get(playerId);
  if (!path || path.length === 0) {
    path = calculatePath(playerId, player.x, player.y, target.x, target.y);
  }
  
  if (!path || path.length === 0) {
    playerManager.clearTarget(playerId);
    return null;
  }
  
  const stepsToMove = isRunning ? 2 : 1;
  let moved = false;
  let currentX = player.x;
  let currentY = player.y;
  
  for (let i = 0; i < stepsToMove && path.length > 0; i++) {
    const nextStep = path[0];
    
    if (nextStep.x === currentX && nextStep.y === currentY) {
      path.shift();
      if (path.length === 0) break;
      continue;
    }
    
    currentX = nextStep.x;
    currentY = nextStep.y;
    path.shift();
    moved = true;
  }
  
  playerPaths.set(playerId, path);
  
  if (moved) {
    playerManager.movePlayer(playerId, currentX, currentY);
    return { moved: true, newX: currentX, newY: currentY };
  }
  
  return { moved: false, newX: player.x, newY: player.y };
}

export function setMovementTarget(playerId: string, targetX: number, targetY: number): { valid: boolean; reason?: string } {
  if (!isValidPosition(targetX, targetY)) {
    return { valid: false, reason: 'Cannot move outside the world.' };
  }
  
  const player = playerManager.get(playerId);
  if (!player) {
    return { valid: false, reason: 'Player not found.' };
  }
  
  if (world.isBlocked(targetX, targetY)) {
    const targetTile = { x: targetX, y: targetY };
    const nearest = pathfinder.findNearestAccessibleTile(
      { x: player.x, y: player.y },
      [targetTile],
      true
    );
    
    if (!nearest) {
      return { valid: false, reason: 'Cannot reach that location.' };
    }
    
    playerManager.setTarget(playerId, nearest.x, nearest.y);
  } else {
    playerManager.setTarget(playerId, targetX, targetY);
  }
  
  calculatePath(playerId, player.x, player.y, playerManager.getTarget(playerId)!.x, playerManager.getTarget(playerId)!.y);
  
  return { valid: true };
}
