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
export type ToolType = 'pickaxe' | 'axe' | 'none';
export type ObjectStatus = 'active' | 'depleted';

export interface ObjectDefinition {
  id: string;
  name: string;
  type: WorldObjectType;
  interactionDistance?: number;
  levelReq?: number;
  xpGranted?: number;
  toolRequired?: ToolType;
  resourceGiven?: string;
  resourceQty?: number;
  depletionTicks?: number;
  respawnTicks?: number;
  activeModel: string;
  depletedModel?: string;
}

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
