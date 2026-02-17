import { WorldObject } from './types';
import { INITIAL_WORLD_OBJECTS, OBJECTS_CONFIG, WORLD_SIZE } from './config';
import { CollisionManager } from './collision';

const collisionManager = new CollisionManager(WORLD_SIZE, WORLD_SIZE);

let worldObjects: WorldObject[] = JSON.parse(JSON.stringify(INITIAL_WORLD_OBJECTS));

for (const obj of worldObjects) {
  if (obj.status === 'active') {
    collisionManager.setBlocked(obj.position.x, obj.position.y, true);
  }
}

export const world = {
  getAll: (): WorldObject[] => worldObjects,
  
  getCollisionManager: (): CollisionManager => collisionManager,
  
  getAt: (x: number, y: number): WorldObject | undefined => {
    return worldObjects.find(o => o.position.x === x && o.position.y === y);
  },
  
  isBlocked: (x: number, y: number): boolean => {
    if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) return true;
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
      ticksUntilRespawn: config.respawnTicks,
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
  
  reset: () => {
    worldObjects = JSON.parse(JSON.stringify(INITIAL_WORLD_OBJECTS));
    for (let y = 0; y < WORLD_SIZE; y++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        collisionManager.setBlocked(x, y, false);
      }
    }
    for (const obj of worldObjects) {
      if (obj.status === 'active') {
        collisionManager.setBlocked(obj.position.x, obj.position.y, true);
      }
    }
  },
};
