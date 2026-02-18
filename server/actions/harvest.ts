import { playerManager } from "../players";
import { world } from "../world";
import { OBJECTS_CONFIG } from "../config";
import { ActiveHarvest } from "../types";

const activeHarvests = new Map<string, ActiveHarvest>();

const HARVEST_TICK_INTERVAL = 4;

function getBaseSuccessChance(
  skillLevel: number,
  objectLevelReq: number,
): number {
  const levelDiff = skillLevel - objectLevelReq;
  if (levelDiff >= 20) return 0.8;
  if (levelDiff >= 10) return 0.6;
  if (levelDiff >= 0) return 0.4;
  if (levelDiff >= -5) return 0.25;
  return 0.15;
}

function calculateMiningChance(
  skillLevel: number,
  pickaxeTier: number,
  objectLevelReq: number,
): number {
  const baseChance = getBaseSuccessChance(skillLevel, objectLevelReq);
  const tierBonus = pickaxeTier * 0.03;
  return Math.min(0.95, baseChance + tierBonus);
}

function calculateWoodcuttingChance(
  skillLevel: number,
  axeTier: number,
  objectLevelReq: number,
): number {
  const baseChance = getBaseSuccessChance(skillLevel, objectLevelReq);
  const tierBonus = axeTier * 0.03;
  return Math.min(0.95, baseChance + tierBonus);
}

function calculateFishingChance(
  skillLevel: number,
  toolTier: number,
  objectLevelReq: number,
): number {
  const baseChance = getBaseSuccessChance(skillLevel, objectLevelReq);
  const tierBonus = toolTier * 0.03;
  return Math.min(0.95, baseChance + tierBonus);
}

export function startHarvest(
  playerId: string,
  x: number,
  y: number,
  objectId: string,
): { valid: boolean; reason?: string } {
  const player = playerManager.get(playerId);
  if (!player) return { valid: false, reason: "Player not found" };

  const dx = Math.abs(player.x - x);
  const dy = Math.abs(player.y - y);
  const isAdjacent = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

  if (!isAdjacent) {
    return { valid: false, reason: "You must be standing next to it." };
  }

  const obj = world.getAt(x, y);
  if (!obj || obj.definitionId !== objectId || obj.status !== "active") {
    return { valid: false, reason: "Nothing to harvest here." };
  }

  const config = OBJECTS_CONFIG[objectId];
  if (!config) {
    return { valid: false, reason: "Unknown object." };
  }

  const skillType = config.skillType || "mining";
  const skillLevel = player.skills[skillType] || 1;

  if (skillLevel < config.levelReq) {
    return {
      valid: false,
      reason: `You need ${config.levelReq} ${skillType} to harvest this.`,
    };
  }

  const key = `${playerId}-${x}-${y}`;
  if (activeHarvests.has(key)) {
    return { valid: false, reason: "Already harvesting." };
  }

  const toolTier = player.equipment?.mainHand
    ? getEquippedToolTier(player.equipment.mainHand, config.toolRequired)
    : 0;

  activeHarvests.set(key, {
    playerId,
    ticksRemaining: HARVEST_TICK_INTERVAL,
    objectId,
    x,
    y,
    toolTier,
    successfulHits: 0,
  });

  return { valid: true };
}

function getEquippedToolTier(itemId: string, toolRequired: string): number {
  const tierMatch = itemId.match(
    /(bronze|iron|steel|black|mithril|adamant|rune|dragon)/i,
  );
  const tierMap: Record<string, number> = {
    bronze: 1,
    iron: 2,
    steel: 3,
    black: 4,
    mithril: 5,
    adamant: 6,
    rune: 7,
    dragon: 8,
  };
  return tierMatch ? tierMap[tierMatch[1].toLowerCase()] || 0 : 0;
}

export function processHarvests(): {
  completed: ActiveHarvest[];
  successes: ActiveHarvest[];
} {
  const completed: ActiveHarvest[] = [];
  const successes: ActiveHarvest[] = [];

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

    harvest.ticksRemaining--;

    if (harvest.ticksRemaining <= 0) {
      harvest.ticksRemaining = HARVEST_TICK_INTERVAL;

      const skillType = config.skillType || "mining";
      const skillLevel = player.skills[skillType] || 1;

      let successChance: number;
      if (skillType === "mining") {
        successChance = calculateMiningChance(
          skillLevel,
          harvest.toolTier || 0,
          config.levelReq,
        );
      } else if (skillType === "woodcutting") {
        successChance = calculateWoodcuttingChance(
          skillLevel,
          harvest.toolTier || 0,
          config.levelReq,
        );
      } else if (skillType === "fishing") {
        successChance = calculateFishingChance(
          skillLevel,
          harvest.toolTier || 0,
          config.levelReq,
        );
      } else {
        successChance = 0.5;
      }

      const roll = Math.random();
      if (roll < successChance) {
        harvest.successfulHits = (harvest.successfulHits || 0) + 1;

        // Give rewards immediately on success
        playerManager.addToInventory(
          harvest.playerId,
          config.resource,
          config.resourceQty || 1,
        );
        playerManager.addXp(harvest.playerId, skillType, config.xp);

        successes.push(harvest);

        if ((harvest.successfulHits || 0) >= config.depletionTicks) {
          const depleted = world.deplete(harvest.x, harvest.y);
          if (depleted) {
            completed.push(harvest);
          }
          activeHarvests.delete(key);
        }
      }
    }
  }

  return { completed, successes };
}

export function getActiveHarvests(): Map<string, ActiveHarvest> {
  return activeHarvests;
}

export function clearPlayerHarvest(playerId: string): void {
  const key = `harvest-${playerId}`;
  activeHarvests.delete(key);
}
