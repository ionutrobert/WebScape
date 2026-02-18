export type ToolType = 'pickaxe' | 'axe' | 'none';

export interface ItemDefinition {
  id: string;
  name: string;
  description?: string;
  stackable: boolean;
  tradable: boolean;
  droppable: boolean;
  equipmentSlot?: 'mainHand' | 'chest' | 'legs' | 'cape' | 'helm';
  toolType?: ToolType;
  toolTier?: number;
  icon?: string;
  requirements?: {
    mining?: number;
    woodcutting?: number;
    attack?: number;
    strength?: number;
    defense?: number;
  };
}

export type TileType = 'grass' | 'dirt' | 'water' | 'sand' | 'stone' | 'snow' | 'cave' | 'dungeon';

export const TILE_COLORS: Record<TileType, number> = {
  grass: 0x4a7c23,
  dirt: 0x8b6914,
  water: 0x2d5aa0,
  sand: 0xd4b896,
  stone: 0x6b6b6b,
  snow: 0xe8e8e8,
  cave: 0x3d2817,
  dungeon: 0x2a2a2a,
};

export type WorldObjectType = 'resource' | 'static' | 'decoration';

export interface ObjectDefinition {
  id: string;
  name: string;
  type: WorldObjectType;
  skillType?: 'mining' | 'woodcutting';
  interactionDistance?: number;
  levelReq?: number;
  xpGranted?: number;
  toolRequired?: ToolType;
  resourceGiven?: string;
  resourceQty?: number;
  depletionTicks?: number;
  respawnTicks?: number;
  miningTicks?: number;
  choppingTicks?: number;
  activeModel: string;
  depletedModel?: string;
}

export type ObjectStatus = 'active' | 'depleted';

export interface WorldObjectState {
  position: { x: number; y: number };
  definitionId: string;
  status: ObjectStatus;
  ticksUntilRespawn: number;
  harvestProgress: number;
}

export interface TileData {
  x: number;
  y: number;
  tileType: TileType;
  height: number;
}

export interface WorldConfig {
  width: number;
  height: number;
}

export type SkillKey = 'attack' | 'strength' | 'defense' | 'mining' | 'woodcutting';

export interface SkillDefinition {
  key: SkillKey;
  name: string;
  xpPerLevel: number;
}

export type ActionType = 'harvest' | 'move' | 'combat';

export interface PlayerAction {
  type: ActionType;
  targetPosition?: { x: number; y: number };
  targetObjectId?: string;
  targetX?: number;
  targetY?: number;
  objectId?: string;
  progress: number;
  ticksRemaining: number;
  skill?: SkillKey;
  xpReward?: number;
  itemReward?: { id: string; qty: number };
}

export interface InventorySlot {
  id: string;
  qty: number;
}

export interface Position {
  x: number;
  y: number;
}

export type FacingDirection = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'southeast' | 'southwest' | 'northwest';

export interface ServerPlayer {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
}

export interface PositionUpdate {
  x: number;
  y: number;
  startX: number;
  startY: number;
  facing: string;
  tickStartTime: number;
}

export interface PlayersUpdate {
  players: ServerPlayer[];
  tickStartTime: number;
}

export interface InitData {
  playerId: string;
  players: ServerPlayer[];
  worldObjects: WorldObjectState[];
  worldTiles: TileData[];
  tickStartTime: number;
  tickDuration: number;
  worldWidth: number;
  worldHeight: number;
  isAdmin: boolean;
}
