import { playerManager } from '../players';
import { world } from '../world';
import { OBJECTS_CONFIG, PICKAXE_TIERS, AXE_TIERS } from '../config';
import { ActiveHarvest } from '../types';

const activeHarvests = new Map<string, ActiveHarvest>();

function calculateMiningChance(miningLevel: number, pickaxeTier: number): number {
  const baseChance = 0.5;
  const levelBonus = (miningLevel - 1) / 100;
  const pickaxeBonus = pickaxeTier * 0.05;
  return Math.min(0.95, baseChance + levelBonus + pickaxeBonus);
}

function calculateWoodcuttingChance(woodcuttingLevel: number, axeTier: number): number {
  const baseChance = 0.5;
  const levelBonus = (woodcuttingLevel - 1) / 100;
  const axeBonus = axeTier * 0.05;
  return Math.min(0.95, baseChance + levelBonus + axeBonus);
}

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
  
  const config = OBJECTS_CONFIG[objectId];
  if (!config) {
    return { valid: false, reason: 'Unknown object.' };
  }
  
  if (config.levelReq && player.skills[config.skillType || 'mining'] < config.levelReq) {
    return { valid: false, reason: `You need ${config.levelReq} ${config.skillType} to harvest this.` };
  }
  
  const key = `${playerId}-${x}-${y}`;
  if (activeHarvests.has(key)) {
    return { valid: false, reason: 'Already harvesting.' };
  }
  
  const toolTier = player.equipment?.mainHand ? getEquippedToolTier(player.equipment.mainHand, config.toolRequired) : 0;
  
  activeHarvests.set(key, {
    playerId,
    ticksRemaining: config.skillType === 'mining' 
      ? (config.miningTicks || 8) - (toolTier > 0 ? Math.floor(toolTier / 2) : 0)
      : (config.choppingTicks || 4),
    objectId,
    x,
    y,
    toolTier,
    attempts: 0,
    successfulHits: 0,
  });
  
  return { valid: true };
}

function getEquippedToolTier(itemId: string, toolRequired: string): number {
  if (toolRequired === 'pickaxe') {
    for (const [tier, ticks] of Object.entries(PICKAXE_TIERS)) {
      if (itemId.includes(tier + '_pickaxe') || itemId.includes('_pickaxe') && parseInt(tier) === getTierFromItem(itemId)) {
        return parseInt(tier);
      }
    }
  } else if (toolRequired === 'axe') {
    for (const [tier, ticks] of Object.entries(AXE_TIERS)) {
      if (itemId.includes(tier + '_axe') || itemId.includes('_axe') && parseInt(tier) === getTierFromItem(itemId)) {
        return parseInt(tier);
      }
    }
  }
  return 0;
}

function getTierFromItem(itemId: string): number {
  const tierMatch = itemId.match(/(bronze|iron|steel|black|mithril|adamant|rune|dragon)/i);
  const tierMap: Record<string, number> = {
    bronze: 1, iron: 2, steel: 3, black: 4, mithril: 5, adamant: 6, rune: 7, dragon: 8
  };
  return tierMatch ? tierMap[tierMatch[1].toLowerCase()] || 0 : 0;
}

export function processHarvests(): { completed: ActiveHarvest[] } {
  const completed: ActiveHarvest[] = [];
  
  for (const [key, harvest] of activeHarvests) {
    const player = playerManager.get(harvest.playerId);
    if (!player) {
      activeHarvests.delete(key);
      continue;
    }
    
    const config = OBJECTS_CONFIG[harvest.objectId];
    if (!config) {
      activeHarvests.delete(key);
      continue;
    }
    
    harvest.attempts = (harvest.attempts || 0) + 1;
    
    const skillType = config.skillType || 'mining';
    const skillLevel = player.skills[skillType] || 1;
    
    let successChance: number;
    if (skillType === 'mining') {
      successChance = calculateMiningChance(skillLevel, harvest.toolTier || 0);
    } else {
      successChance = calculateWoodcuttingChance(skillLevel, harvest.toolTier || 0);
    }
    
    const roll = Math.random();
    if (roll < successChance) {
      harvest.successfulHits = (harvest.successfulHits || 0) + 1;
    }
    
    if ((harvest.successfulHits || 0) >= config.depletionTicks) {
      playerManager.addToInventory(harvest.playerId, config.resource, config.resourceQty || 1);
      playerManager.addXp(harvest.playerId, skillType, config.xp);
      
      const depleted = world.deplete(harvest.x, harvest.y);
      if (depleted) {
        completed.push(harvest);
      }
      activeHarvests.delete(key);
    }
  }
  
  return { completed };
}

export function getActiveHarvests(): Map<string, ActiveHarvest> {
  return activeHarvests;
}
