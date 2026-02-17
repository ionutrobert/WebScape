import { playerManager } from '../players';
import { world } from '../world';
import { OBJECTS_CONFIG } from '../config';
import { ActiveHarvest } from '../types';

const activeHarvests = new Map<string, ActiveHarvest>();

export function startHarvest(playerId: string, x: number, y: number, objectId: string): { valid: boolean; reason?: string } {
  const player = playerManager.get(playerId);
  if (!player) return { valid: false, reason: 'Player not found' };
  
  const dist = Math.abs(player.x - x) + Math.abs(player.y - y);
  if (dist > 1) {
    return { valid: false, reason: 'Too far away.' };
  }
  
  const obj = world.getAt(x, y);
  if (!obj || obj.definitionId !== objectId || obj.status !== 'active') {
    return { valid: false, reason: 'Nothing to harvest here.' };
  }
  
  const key = `${playerId}-${x}-${y}`;
  if (activeHarvests.has(key)) {
    return { valid: false, reason: 'Already harvesting.' };
  }
  
  const config = OBJECTS_CONFIG[objectId];
  activeHarvests.set(key, {
    playerId,
    ticksRemaining: config.depletionTicks,
    objectId,
    x,
    y,
  });
  
  return { valid: true };
}

export function processHarvests(): { completed: ActiveHarvest[] } {
  const completed: ActiveHarvest[] = [];
  
  for (const [key, harvest] of activeHarvests) {
    harvest.ticksRemaining--;
    
    if (harvest.ticksRemaining <= 0) {
      const depleted = world.deplete(harvest.x, harvest.y);
      if (depleted) {
        const config = OBJECTS_CONFIG[harvest.objectId];
        playerManager.addToInventory(harvest.playerId, config.resource, 1);
      }
      completed.push(harvest);
      activeHarvests.delete(key);
    }
  }
  
  return { completed };
}

export function getActiveHarvests(): Map<string, ActiveHarvest> {
  return activeHarvests;
}
