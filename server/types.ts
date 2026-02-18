export interface Player {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
  inventory: Record<string, number>;
  skills: Record<string, number>;
  equipment?: {
    mainHand?: string;
    chest?: string;
    legs?: string;
    helm?: string;
    cape?: string;
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
  toolRequired: string;
  xp: number;
  resource: string;
  resourceQty?: number;
  levelReq: number;
  skillType?: 'mining' | 'woodcutting';
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
