export type ToolType = 'pickaxe' | 'axe' | 'none';

export interface ItemDefinition {
  id: string;
  name: string;
  stackable: boolean;
  tradable: boolean;
  droppable: boolean;
  equipmentSlot?: 'mainHand' | 'chest' | 'legs' | 'cape' | 'helm';
  toolType?: ToolType;
  toolTier?: number;
  icon?: string;
}

export type WorldObjectType = 'resource' | 'static';

export interface ObjectDefinition {
  id: string;
  name: string;
  type: WorldObjectType;
  interactionDistance: number;
  levelReq: number;
  xpGranted: number;
  toolRequired: ToolType;
  resourceGiven: string;
  resourceQty: number;
  depletionTicks: number;
  respawnTicks: number;
  activeModel: string;
  depletedModel: string;
}

export type ObjectStatus = 'active' | 'depleted';

export interface WorldObjectState {
  position: { x: number; y: number };
  definitionId: string;
  status: ObjectStatus;
  ticksUntilRespawn: number;
  harvestProgress: number;
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
