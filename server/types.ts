export interface Player {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
  inventory: Record<string, number>;
  skills: Record<string, number>;
  skillXp: Record<string, number>;
  combatStats: {
    attack: number;
    strength: number;
    defense: number;
    ranged: number;
    magic: number;
  };
  equipment?: {
    mainHand?: string;
    chest?: string;
    legs?: string;
    helm?: string;
    cape?: string;
    offHand?: string;
    ammo?: string;
  };
  equipmentBonuses?: {
    attackStab: number;
    attackSlash: number;
    attackCrush: number;
    attackRanged: number;
    attackMagic: number;
    defenseStab: number;
    defenseSlash: number;
    defenseCrush: number;
    defenseRanged: number;
    defenseMagic: number;
    strength: number;
    rangedStrength: number;
    magicDamage: number;
    prayer: number;
  };
  targetX?: number;
  targetY?: number;
  prevX?: number;
  prevY?: number;
  hp?: number;
  maxHp?: number;
  godMode?: boolean;
  runEnergy: number;
  isRunning: boolean;
  combat?: {
    attackCooldown: number;
    autoRetaliate: boolean;
    inCombat: boolean;
    combatTarget?: string;
    combatTicksRemaining: number;
  };
}

export interface CombatState {
  attackerId: string;
  defenderId: string;
  weaponId: string;
  attackStyle: "accurate" | "aggressive" | "defensive";
  ticksRemaining: number;
  combatType: "melee" | "ranged" | "magic";
}

export interface WorldObject {
  position: { x: number; y: number };
  definitionId: string;
  status: 'active' | 'depleted';
  ticksUntilRespawn: number;
}

export interface ActiveHarvest {
  playerId: string;
  ticksRemaining: number;
  objectId: string;
  x: number;
  y: number;
  toolTier?: number;
  attempts?: number;
  successfulHits?: number;
}

export interface ServerConfig {
  respawnTicks: number;
  depletionTicks: number;
  miningTicks?: number;
  choppingTicks?: number;
  fishingTicks?: number;
  toolRequired: string;
  xp: number;
  resource: string;
  resourceQty?: number;
  levelReq: number;
  skillType?: 'mining' | 'woodcutting' | 'fishing';
}

export interface GatheringMultipliers {
  mining: {
    prospectorHelmet: number;
    prospectorJacket: number;
    prospectorLegs: number;
    prospectorBoots: number;
    varrockArmor: number;
    celestialRing: number;
    crystalPickaxe: number;
    infernalPickaxe: number;
  };
  woodcutting: {
    lumberjackHat: number;
    lumberjackTop: number;
    lumberjackLegs: number;
    lumberjackBoots: number;
    forestersRations: number;
    crystalAxe: number;
    infernalAxe: number;
    dragonAxe: number;
  };
}
