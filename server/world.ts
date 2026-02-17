import { WorldObject } from './types';
import { INITIAL_WORLD_OBJECTS, OBJECTS_CONFIG, WORLD_SIZE } from './config';

let worldObjects: WorldObject[] = JSON.parse(JSON.stringify(INITIAL_WORLD_OBJECTS));

export const world = {
  getAll: (): WorldObject[] => worldObjects,
  
  getAt: (x: number, y: number): WorldObject | undefined => {
    return worldObjects.find(o => o.position.x === x && o.position.y === y);
  },
  
  isBlocked: (x: number, y: number): boolean => {
    if (x < 0 || x >= WORLD_SIZE || y < 0 || y >= WORLD_SIZE) return true;
    return worldObjects.some(o => o.position.x === x && o.position.y === y && o.status === 'active');
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
    
    return worldObjects[objIndex];
  },
  
  tick: () => {
    for (let i = 0; i < worldObjects.length; i++) {
      const obj = worldObjects[i];
      if (obj.status === 'depleted') {
        obj.ticksUntilRespawn--;
        
        if (obj.ticksUntilRespawn <= 0) {
          worldObjects[i] = { ...obj, status: 'active', ticksUntilRespawn: 0 };
          return true;
        }
      }
    }
    return false;
  },
  
  reset: () => {
    worldObjects = JSON.parse(JSON.stringify(INITIAL_WORLD_OBJECTS));
  },
};
