import { WorldObject } from './types';
import { OBJECTS_CONFIG } from './config';
import { CollisionManager } from './collision';
import { getWorldConfig, getWorldObjects, serverDb } from './database';

let collisionManager: CollisionManager;
let worldObjects: WorldObject[] = [];
let worldWidth = 20;
let worldHeight = 20;

export async function initializeWorld(): Promise<void> {
  const config = await getWorldConfig();
  if (config) {
    worldWidth = config.width;
    worldHeight = config.height;
  }
  
  collisionManager = new CollisionManager(worldWidth, worldHeight);
  
  const objects = await getWorldObjects();
  worldObjects = objects;
  
  for (const obj of worldObjects) {
    if (obj.status === 'active') {
      collisionManager.setBlocked(obj.position.x, obj.position.y, true);
    }
  }
  
  console.log(`World initialized: ${worldWidth}x${worldHeight}, ${worldObjects.length} objects`);
}

export async function getTileHeight(x: number, y: number): Promise<number> {
  const tile = await serverDb.worldTile.findUnique({
    where: { x_y: { x, y } }
  });
  return tile?.height ?? 0;
}

export const world = {
  getWidth: () => worldWidth,
  getHeight: () => worldHeight,
  
  getAll: (): WorldObject[] => worldObjects,
  
  getCollisionManager: (): CollisionManager => collisionManager,
  
  getAt: (x: number, y: number): WorldObject | undefined => {
    return worldObjects.find(o => o.position.x === x && o.position.y === y);
  },
  
  isBlocked: (x: number, y: number): boolean => {
    if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) return true;
    return collisionManager.isBlocked(x, y);
  },
  
  deplete: (x: number, y: number): WorldObject | null => {
    const objIndex = worldObjects.findIndex(o => o.position.x === x && o.position.y === y);
    if (objIndex === -1) return null;
    
    const obj = worldObjects[objIndex];
    const config = OBJECTS_CONFIG[obj.definitionId];
    
    worldObjects[objIndex] = {
      ...obj,
      status: 'depleted',
      ticksUntilRespawn: config?.respawnTicks ?? 10,
    };
    
    collisionManager.setBlocked(x, y, false);
    
    return worldObjects[objIndex];
  },
  
  tick: () => {
    let changed = false;
    for (let i = 0; i < worldObjects.length; i++) {
      const obj = worldObjects[i];
      if (obj.status === 'depleted') {
        obj.ticksUntilRespawn--;
        
        if (obj.ticksUntilRespawn <= 0) {
          worldObjects[i] = { ...obj, status: 'active', ticksUntilRespawn: 0 };
          collisionManager.setBlocked(obj.position.x, obj.position.y, true);
          changed = true;
        }
      }
    }
    return changed;
  },
  
  reload: async () => {
    await initializeWorld();
  },
};
