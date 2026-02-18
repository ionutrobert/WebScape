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
    toolRequired: 'pickaxe', 
    xp: 17.5, 
    resource: 'copper_ore', 
    levelReq: 1,
    skillType: 'mining',
  },
  tin_rock: { 
    respawnTicks: 8, 
    depletionTicks: 4, 
    toolRequired: 'pickaxe', 
    xp: 17.5, 
    resource: 'tin_ore', 
    levelReq: 1,
    skillType: 'mining',
  },
  iron_rock: { 
    respawnTicks: 12, 
    depletionTicks: 5, 
    toolRequired: 'pickaxe', 
    xp: 35, 
    resource: 'iron_ore', 
    levelReq: 15,
    skillType: 'mining',
  },
  silver_rock: { 
    respawnTicks: 15, 
    depletionTicks: 5, 
    toolRequired: 'pickaxe', 
    xp: 40, 
    resource: 'silver_ore', 
    levelReq: 20,
    skillType: 'mining',
  },
  coal_rock: { 
    respawnTicks: 18, 
    depletionTicks: 6, 
    toolRequired: 'pickaxe', 
    xp: 50, 
    resource: 'coal', 
    levelReq: 30,
    skillType: 'mining',
  },
  gold_rock: { 
    respawnTicks: 22, 
    depletionTicks: 7, 
    toolRequired: 'pickaxe', 
    xp: 65, 
    resource: 'gold_ore', 
    levelReq: 40,
    skillType: 'mining',
  },
  mithril_rock: { 
    respawnTicks: 25, 
    depletionTicks: 8, 
    toolRequired: 'pickaxe', 
    xp: 80, 
    resource: 'mithril_ore', 
    levelReq: 55,
    skillType: 'mining',
  },
  adamant_rock: { 
    respawnTicks: 30, 
    depletionTicks: 10, 
    toolRequired: 'pickaxe', 
    xp: 95, 
    resource: 'adamant_ore', 
    levelReq: 70,
    skillType: 'mining',
  },
  rune_rock: { 
    respawnTicks: 40, 
    depletionTicks: 12, 
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
    toolRequired: 'axe', 
    xp: 25, 
    resource: 'logs', 
    levelReq: 1,
    skillType: 'woodcutting',
  },
  oak_tree: { 
    respawnTicks: 10, 
    depletionTicks: 1, 
    toolRequired: 'axe', 
    xp: 37.5, 
    resource: 'oak_log', 
    levelReq: 15,
    skillType: 'woodcutting',
  },
  willow_tree: { 
    respawnTicks: 14, 
    depletionTicks: 1, 
    toolRequired: 'axe', 
    xp: 67.5, 
    resource: 'willow_log', 
    levelReq: 30,
    skillType: 'woodcutting',
  },
  maple_tree: { 
    respawnTicks: 18, 
    depletionTicks: 1, 
    toolRequired: 'axe', 
    xp: 100, 
    resource: 'maple_log', 
    levelReq: 45,
    skillType: 'woodcutting',
  },
  yew_tree: { 
    respawnTicks: 22, 
    depletionTicks: 1, 
    toolRequired: 'axe', 
    xp: 175, 
    resource: 'yew_log', 
    levelReq: 60,
    skillType: 'woodcutting',
  },
  magic_tree: { 
    respawnTicks: 28, 
    depletionTicks: 1, 
    toolRequired: 'axe', 
    xp: 250, 
    resource: 'magic_log', 
    levelReq: 75,
    skillType: 'woodcutting',
  },
  redwood_tree: { 
    respawnTicks: 35, 
    depletionTicks: 1, 
    toolRequired: 'axe', 
    xp: 380, 
    resource: 'redwood_log', 
    levelReq: 90,
    skillType: 'woodcutting',
  },

  // ============ FISHING SPOTS ============
  fishing_spot_small_net: {
    respawnTicks: 5,
    depletionTicks: 3,
    toolRequired: 'net',
    xp: 10,
    resource: 'raw_shrimp',
    levelReq: 1,
    skillType: 'fishing',
    fishingTicks: 4,
  },
  fishing_spot_rod: {
    respawnTicks: 5,
    depletionTicks: 3,
    toolRequired: 'rod',
    xp: 20,
    resource: 'raw_anchovy',
    levelReq: 15,
    skillType: 'fishing',
    fishingTicks: 4,
  },
  fishing_spot_fly_rod: {
    respawnTicks: 6,
    depletionTicks: 3,
    toolRequired: 'rod',
    xp: 30,
    resource: 'raw_trout',
    levelReq: 20,
    skillType: 'fishing',
    fishingTicks: 4,
  },
  fishing_spot_salmon: {
    respawnTicks: 6,
    depletionTicks: 3,
    toolRequired: 'rod',
    xp: 40,
    resource: 'raw_salmon',
    levelReq: 30,
    skillType: 'fishing',
    fishingTicks: 4,
  },
  fishing_spot_harpoon: {
    respawnTicks: 8,
    depletionTicks: 3,
    toolRequired: 'harpoon',
    xp: 50,
    resource: 'raw_tuna',
    levelReq: 35,
    skillType: 'fishing',
    fishingTicks: 4,
  },
  fishing_spot_big_net: {
    respawnTicks: 8,
    depletionTicks: 3,
    toolRequired: 'net',
    xp: 55,
    resource: 'raw_lobster',
    levelReq: 40,
    skillType: 'fishing',
    fishingTicks: 4,
  },
  fishing_spot_swordfish: {
    respawnTicks: 10,
    depletionTicks: 3,
    toolRequired: 'harpoon',
    xp: 70,
    resource: 'raw_swordfish',
    levelReq: 50,
    skillType: 'fishing',
    fishingTicks: 4,
  },
  fishing_spot_shark: {
    respawnTicks: 12,
    depletionTicks: 3,
    toolRequired: 'harpoon',
    xp: 100,
    resource: 'raw_shark',
    levelReq: 76,
    skillType: 'fishing',
    fishingTicks: 4,
  },

  // ============ COOKING OBJECTS ============
  fire: {
    respawnTicks: 0,
    depletionTicks: 0,
    toolRequired: 'none',
    xp: 0,
    resource: '',
    levelReq: 0,
  },
  cooking_range: {
    respawnTicks: 0,
    depletionTicks: 0,
    toolRequired: 'none',
    xp: 0,
    resource: '',
    levelReq: 0,
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

export interface WeaponConfig {
  attackSpeed: number;
  weaponType: "stab" | "slash" | "crush" | "ranged" | "magic";
  attackStab?: number;
  attackSlash?: number;
  attackCrush?: number;
  attackRanged?: number;
  attackMagic?: number;
}

export interface ArmorConfig {
  defenseStab: number;
  defenseSlash: number;
  defenseCrush: number;
  defenseRanged: number;
  defenseMagic: number;
}

export const WEAPON_CONFIG: Record<string, WeaponConfig> = {
  bronze_dagger: { attackSpeed: 4, weaponType: "stab", attackStab: 8 },
  iron_dagger: { attackSpeed: 4, weaponType: "stab", attackStab: 15 },
  steel_dagger: { attackSpeed: 4, weaponType: "stab", attackStab: 24 },
  mithril_dagger: { attackSpeed: 4, weaponType: "stab", attackStab: 39 },
  rune_dagger: { attackSpeed: 4, weaponType: "stab", attackStab: 60 },
  dragon_dagger: { attackSpeed: 4, weaponType: "stab", attackStab: 75 },

  bronze_sword: { attackSpeed: 5, weaponType: "slash", attackSlash: 10 },
  iron_sword: { attackSpeed: 5, weaponType: "slash", attackSlash: 18 },
  steel_sword: { attackSpeed: 5, weaponType: "slash", attackSlash: 28 },
  black_sword: { attackSpeed: 5, weaponType: "slash", attackSlash: 35 },
  mithril_sword: { attackSpeed: 5, weaponType: "slash", attackSlash: 45 },
  adamant_sword: { attackSpeed: 5, weaponType: "slash", attackSlash: 60 },
  rune_sword: { attackSpeed: 5, weaponType: "slash", attackSlash: 75 },
  dragon_sword: { attackSpeed: 5, weaponType: "slash", attackSlash: 90 },

  bronze_two_handed: { attackSpeed: 6, weaponType: "slash", attackSlash: 12 },
  iron_two_handed: { attackSpeed: 6, weaponType: "slash", attackSlash: 22 },
  steel_two_handed: { attackSpeed: 6, weaponType: "slash", attackSlash: 35 },
  rune_two_handed: { attackSpeed: 6, weaponType: "slash", attackSlash: 90 },

  shortbow: { attackSpeed: 5, weaponType: "ranged", attackRanged: 10 },
  longbow: { attackSpeed: 6, weaponType: "ranged", attackRanged: 12 },
  oak_shortbow: { attackSpeed: 5, weaponType: "ranged", attackRanged: 24 },
  willow_shortbow: { attackSpeed: 5, weaponType: "ranged", attackRanged: 32 },
  yew_longbow: { attackSpeed: 7, weaponType: "ranged", attackRanged: 65 },
};

export const ARMOR_CONFIG: Record<string, ArmorConfig> = {
  bronze_helm: { defenseStab: 4, defenseSlash: 3, defenseCrush: 3, defenseRanged: 2, defenseMagic: 2 },
  iron_helm: { defenseStab: 7, defenseSlash: 6, defenseCrush: 6, defenseRanged: 4, defenseMagic: 4 },
  steel_helm: { defenseStab: 11, defenseSlash: 10, defenseCrush: 10, defenseRanged: 7, defenseMagic: 7 },
  rune_helm: { defenseStab: 30, defenseSlash: 28, defenseCrush: 28, defenseRanged: 20, defenseMagic: 20 },

  bronze_platebody: { defenseStab: 8, defenseSlash: 7, defenseCrush: 7, defenseRanged: 4, defenseMagic: 4 },
  iron_platebody: { defenseStab: 14, defenseSlash: 13, defenseCrush: 13, defenseRanged: 8, defenseMagic: 8 },
  steel_platebody: { defenseStab: 22, defenseSlash: 21, defenseCrush: 21, defenseRanged: 14, defenseMagic: 14 },
  rune_platebody: { defenseStab: 55, defenseSlash: 52, defenseCrush: 52, defenseRanged: 40, defenseMagic: 40 },

  bronze_platelegs: { defenseStab: 6, defenseSlash: 5, defenseCrush: 5, defenseRanged: 3, defenseMagic: 3 },
  iron_platelegs: { defenseStab: 10, defenseSlash: 9, defenseCrush: 9, defenseRanged: 6, defenseMagic: 6 },
  steel_platelegs: { defenseStab: 16, defenseSlash: 15, defenseCrush: 15, defenseRanged: 10, defenseMagic: 10 },
  rune_platelegs: { defenseStab: 42, defenseSlash: 40, defenseCrush: 40, defenseRanged: 30, defenseMagic: 30 },
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
  // Fishing spots
  { position: { x: 10, y: 20 }, definitionId: 'fishing_spot_small_net', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 11, y: 20 }, definitionId: 'fishing_spot_rod', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 12, y: 20 }, definitionId: 'fishing_spot_fly_rod', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 13, y: 20 }, definitionId: 'fishing_spot_harpoon', status: 'active', ticksUntilRespawn: 0 },
  // Cooking spots
  { position: { x: 8, y: 10 }, definitionId: 'fire', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 9, y: 10 }, definitionId: 'cooking_range', status: 'active', ticksUntilRespawn: 0 },
];
