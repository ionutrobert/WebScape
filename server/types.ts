export interface Player {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
  inventory: Record<string, number>;
  targetX?: number;
  targetY?: number;
  pathStartX?: number;
  pathStartY?: number;
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
}

export interface ServerConfig {
  respawnTicks: number;
  depletionTicks: number;
  toolRequired: string;
  xp: number;
  resource: string;
  levelReq: number;
}
