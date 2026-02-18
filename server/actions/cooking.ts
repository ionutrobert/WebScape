import { playerManager } from "../players";
import { world } from "../world";
import { OBJECTS_CONFIG } from "../config";

export interface ActiveCooking {
  playerId: string;
  ticksRemaining: number;
  itemId: string;
  x: number;
  y: number;
}

const COOKING_TICK_INTERVAL = 3;

const activeCookings = new Map<string, ActiveCooking>();

export const COOKING_CONFIG: Record<string, { cookedId: string; burnChance: number; xp: number }> = {
  raw_shrimp: { cookedId: 'cooked_shrimp', burnChance: 0.25, xp: 30 },
  raw_anchovy: { cookedId: 'cooked_anchovy', burnChance: 0.25, xp: 40 },
  raw_trout: { cookedId: 'cooked_trout', burnChance: 0.30, xp: 50 },
  raw_salmon: { cookedId: 'cooked_salmon', burnChance: 0.35, xp: 60 },
  raw_tuna: { cookedId: 'cooked_tuna', burnChance: 0.40, xp: 80 },
  raw_lobster: { cookedId: 'cooked_lobster', burnChance: 0.45, xp: 100 },
  raw_swordfish: { cookedId: 'cooked_swordfish', burnChance: 0.50, xp: 120 },
  raw_shark: { cookedId: 'cooked_shark', burnChance: 0.55, xp: 150 },
};

export function startCooking(
  playerId: string,
  itemId: string,
  x: number,
  y: number,
): { valid: boolean; reason?: string } {
  const player = playerManager.get(playerId);
  if (!player) return { valid: false, reason: "Player not found" };

  const config = COOKING_CONFIG[itemId];
  if (!config) {
    return { valid: false, reason: "This item cannot be cooked." };
  }

  const inventory = playerManager.getInventory(playerId);
  const qty = inventory[itemId] || 0;
  if (qty < 1) {
    return { valid: false, reason: "You don't have any of this item." };
  }

  const obj = world.getAt(x, y);
  if (!obj || (obj.definitionId !== 'fire' && obj.definitionId !== 'cooking_range')) {
    return { valid: false, reason: "You need to be near a fire or cooking range." };
  }

  const cookingLevel = player.skills.cooking || 1;
  const adjustedBurnChance = Math.max(0.01, config.burnChance - (cookingLevel * 0.005));

  const key = `${playerId}-${x}-${y}`;
  if (activeCookings.has(key)) {
    return { valid: false, reason: "Already cooking." };
  }

  playerManager.removeFromInventory(playerId, itemId, 1);

  activeCookings.set(key, {
    playerId,
    ticksRemaining: COOKING_TICK_INTERVAL,
    itemId,
    x,
    y,
  });

  return { valid: true };
}

export function processCooking(): { cooked: ActiveCooking[]; burnt: ActiveCooking[] } {
  const cooked: ActiveCooking[] = [];
  const burnt: ActiveCooking[] = [];

  for (const [key, cooking] of activeCookings) {
    const player = playerManager.get(cooking.playerId);
    if (!player) {
      activeCookings.delete(key);
      continue;
    }

    const config = COOKING_CONFIG[cooking.itemId];
    if (!config) {
      activeCookings.delete(key);
      continue;
    }

    cooking.ticksRemaining--;

    if (cooking.ticksRemaining <= 0) {
      const cookingLevel = player.skills.cooking || 1;
      const adjustedBurnChance = Math.max(0.01, config.burnChance - (cookingLevel * 0.005));
      const roll = Math.random();

      if (roll < adjustedBurnChance) {
        playerManager.addToInventory(cooking.playerId, 'burnt_fish', 1);
        burnt.push(cooking);
      } else {
        playerManager.addToInventory(cooking.playerId, config.cookedId, 1);
        playerManager.addXp(cooking.playerId, 'cooking', config.xp);
        cooked.push(cooking);
      }

      activeCookings.delete(key);
    }
  }

  return { cooked, burnt };
}

export function getActiveCookings(): Map<string, ActiveCooking> {
  return activeCookings;
}
