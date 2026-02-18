import { WorldObject, ServerConfig, GatheringMultipliers } from './types';

export const WORLD_SIZE = 100;

/**
 * Gathering Multipliers (for future use)
 * These can be applied to XP and resource gains
 */
export const GATHERING_MULTIPLIERS: GatheringMultipliers = {
  mining: {
    prospectorHelmet: 1.0,
    prospectorJacket: 1.0,
    prospectorLegs: 1.0,
    prospectorBoots: 1.0,
    varrockArmor: 1.0,
    celestialRing: 1.0,
    crystalPickaxe: 1.0,
    infernalPickaxe: 1.0,
  },
  woodcutting: {
    lumberjackHat: 1.0,
    lumberjackTop: 1.0,
    lumberjackLegs: 1.0,
    lumberjackBoots: 1.0,
    forestersRations: 1.0,
    crystalAxe: 1.0,
    infernalAxe: 1.0,
    dragonAxe: 1.0,
  },
};

/**
 * Get total XP multiplier for a gathering skill
 */
export function getGatheringXpMultiplier(skill: 'mining' | 'woodcutting'): number {
  const mult = GATHERING_MULTIPLIERS[skill];
  let total = 1.0;
  for (const key of Object.keys(mult) as (keyof typeof mult)[]) {
    total += mult[key] - 1.0;
  }
  return total;
}

export const OBJECTS_CONFIG: Record<string, ServerConfig> = {
  // ============ MINING ROCKS ============
  copper_rock: { 
    respawnTicks: 8, 
    depletionTicks: 4, 
    miningTicks: 8,
    toolRequired: 'pickaxe', 
    xp: 17.5, 
    resource: 'copper_ore', 
    levelReq: 1,
    skillType: 'mining',
  },
  tin_rock: { 
    respawnTicks: 8, 
    depletionTicks: 4, 
    miningTicks: 8,
    toolRequired: 'pickaxe', 
    xp: 17.5, 
    resource: 'tin_ore', 
    levelReq: 1,
    skillType: 'mining',
  },
  iron_rock: { 
    respawnTicks: 12, 
    depletionTicks: 5, 
    miningTicks: 7,
    toolRequired: 'pickaxe', 
    xp: 35, 
    resource: 'iron_ore', 
    levelReq: 15,
    skillType: 'mining',
  },
  silver_rock: { 
    respawnTicks: 15, 
    depletionTicks: 5, 
    miningTicks: 6,
    toolRequired: 'pickaxe', 
    xp: 40, 
    resource: 'silver_ore', 
    levelReq: 20,
    skillType: 'mining',
  },
  coal_rock: { 
    respawnTicks: 18, 
    depletionTicks: 6, 
    miningTicks: 5,
    toolRequired: 'pickaxe', 
    xp: 50, 
    resource: 'coal', 
    levelReq: 30,
    skillType: 'mining',
  },
  gold_rock: { 
    respawnTicks: 22, 
    depletionTicks: 7, 
    miningTicks: 5,
    toolRequired: 'pickaxe', 
    xp: 65, 
    resource: 'gold_ore', 
    levelReq: 40,
    skillType: 'mining',
  },
  mithril_rock: { 
    respawnTicks: 25, 
    depletionTicks: 8, 
    miningTicks: 4,
    toolRequired: 'pickaxe', 
    xp: 80, 
    resource: 'mithril_ore', 
    levelReq: 55,
    skillType: 'mining',
  },
  adamant_rock: { 
    respawnTicks: 30, 
    depletionTicks: 10, 
    miningTicks: 3,
    toolRequired: 'pickaxe', 
    xp: 95, 
    resource: 'adamant_ore', 
    levelReq: 70,
    skillType: 'mining',
  },
  rune_rock: { 
    respawnTicks: 40, 
    depletionTicks: 12, 
    miningTicks: 3,
    toolRequired: 'pickaxe', 
    xp: 125, 
    resource: 'rune_ore', 
    levelReq: 85,
    skillType: 'mining',
  },

  // ============ TREES ============
  tree: { 
    respawnTicks: 6, 
    depletionTicks: 1, 
    choppingTicks: 4,
    toolRequired: 'axe', 
    xp: 25, 
    resource: 'logs', 
    levelReq: 1,
    skillType: 'woodcutting',
  },
  oak_tree: { 
    respawnTicks: 10, 
    depletionTicks: 1, 
    choppingTicks: 4,
    toolRequired: 'axe', 
    xp: 37.5, 
    resource: 'oak_log', 
    levelReq: 15,
    skillType: 'woodcutting',
  },
  willow_tree: { 
    respawnTicks: 14, 
    depletionTicks: 1, 
    choppingTicks: 4,
    toolRequired: 'axe', 
    xp: 67.5, 
    resource: 'willow_log', 
    levelReq: 30,
    skillType: 'woodcutting',
  },
  maple_tree: { 
    respawnTicks: 18, 
    depletionTicks: 1, 
    choppingTicks: 4,
    toolRequired: 'axe', 
    xp: 100, 
    resource: 'maple_log', 
    levelReq: 45,
    skillType: 'woodcutting',
  },
  yew_tree: { 
    respawnTicks: 22, 
    depletionTicks: 1, 
    choppingTicks: 5,
    toolRequired: 'axe', 
    xp: 175, 
    resource: 'yew_log', 
    levelReq: 60,
    skillType: 'woodcutting',
  },
  magic_tree: { 
    respawnTicks: 28, 
    depletionTicks: 1, 
    choppingTicks: 5,
    toolRequired: 'axe', 
    xp: 250, 
    resource: 'magic_log', 
    levelReq: 75,
    skillType: 'woodcutting',
  },
  redwood_tree: { 
    respawnTicks: 35, 
    depletionTicks: 1, 
    choppingTicks: 6,
    toolRequired: 'axe', 
    xp: 380, 
    resource: 'redwood_log', 
    levelReq: 90,
    skillType: 'woodcutting',
  },
};

export const PICKAXE_TIERS: Record<number, number> = {
  1: 8,
  2: 7,
  3: 6,
  4: 5,
  5: 4,
  6: 3,
  7: 3,
  8: 2,
};

export const AXE_TIERS: Record<number, number> = {
  1: 4,
  2: 4,
  3: 4,
  4: 3,
  5: 3,
  6: 3,
  7: 2,
  8: 2,
};

export const INITIAL_WORLD_OBJECTS: WorldObject[] = [
  { position: { x: 5, y: 5 }, definitionId: 'copper_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 6, y: 5 }, definitionId: 'tin_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 7, y: 8 }, definitionId: 'iron_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 8, y: 8 }, definitionId: 'coal_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 12, y: 3 }, definitionId: 'gold_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 3, y: 12 }, definitionId: 'tree', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 4, y: 12 }, definitionId: 'tree', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 15, y: 15 }, definitionId: 'oak_tree', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 16, y: 15 }, definitionId: 'willow_tree', status: 'active', ticksUntilRespawn: 0 },
];
