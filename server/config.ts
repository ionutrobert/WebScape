import { WorldObject, ServerConfig } from './types';

export const WORLD_SIZE = 20;

export const OBJECTS_CONFIG: Record<string, ServerConfig> = {
  copper_rock: { respawnTicks: 10, depletionTicks: 3, toolRequired: 'pickaxe', xp: 17.5, resource: 'copper_ore', levelReq: 1 },
  tin_rock: { respawnTicks: 10, depletionTicks: 3, toolRequired: 'pickaxe', xp: 17.5, resource: 'tin_ore', levelReq: 1 },
  iron_rock: { respawnTicks: 15, depletionTicks: 4, toolRequired: 'pickaxe', xp: 35, resource: 'iron_ore', levelReq: 15 },
  coal_rock: { respawnTicks: 20, depletionTicks: 5, toolRequired: 'pickaxe', xp: 50, resource: 'coal', levelReq: 30 },
  gold_rock: { respawnTicks: 25, depletionTicks: 6, toolRequired: 'pickaxe', xp: 65, resource: 'gold_ore', levelReq: 40 },
  oak_tree: { respawnTicks: 12, depletionTicks: 3, toolRequired: 'axe', xp: 25, resource: 'oak_log', levelReq: 15 },
  willow_tree: { respawnTicks: 15, depletionTicks: 4, toolRequired: 'axe', xp: 40, resource: 'willow_log', levelReq: 30 },
};

export const INITIAL_WORLD_OBJECTS: WorldObject[] = [
  { position: { x: 5, y: 5 }, definitionId: 'copper_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 6, y: 5 }, definitionId: 'tin_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 7, y: 8 }, definitionId: 'iron_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 8, y: 8 }, definitionId: 'coal_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 12, y: 3 }, definitionId: 'gold_rock', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 3, y: 12 }, definitionId: 'oak_tree', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 4, y: 12 }, definitionId: 'oak_tree', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 15, y: 15 }, definitionId: 'willow_tree', status: 'active', ticksUntilRespawn: 0 },
  { position: { x: 16, y: 15 }, definitionId: 'willow_tree', status: 'active', ticksUntilRespawn: 0 },
];
