import { Player } from './types';
import { calculateFacingFromPath } from './facing';

const players = new Map<string, Player>();

export const playerManager = {
  getAll: (): Player[] => Array.from(players.values()),
  
  get: (id: string): Player | undefined => players.get(id),

  create: (id: string, username: string, x: number = 10, y: number = 10): Player => {
    const player: Player = {
      id,
      username,
      x,
      y,
      facing: 'south',
      inventory: {},
    };
    players.set(id, player);
    return player;
  },
  
  remove: (id: string): void => {
    players.delete(id);
  },
  
  setTarget: (id: string, x: number, y: number): void => {
    const player = players.get(id);
    if (player) {
      player.targetX = x;
      player.targetY = y;
      player.pathStartX = player.x;
      player.pathStartY = player.y;
    }
  },
  
  clearTarget: (id: string): void => {
    const player = players.get(id);
    if (player) {
      player.targetX = undefined;
      player.targetY = undefined;
    }
  },
  
  movePlayer: (id: string, x: number, y: number): void => {
    const player = players.get(id);
    if (player) {
      const prevX = player.x;
      const prevY = player.y;
      player.x = x;
      player.y = y;
      player.facing = calculateFacingFromPath(
        player.pathStartX ?? prevX,
        player.pathStartY ?? prevY,
        x,
        y
      );
    }
  },
  
  addToInventory: (id: string, itemId: string, qty: number): void => {
    const player = players.get(id);
    if (player) {
      player.inventory[itemId] = (player.inventory[itemId] || 0) + qty;
    }
  },
  
  getInventory: (id: string): Record<string, number> => {
    const player = players.get(id);
    return player?.inventory || {};
  },
  
  hasTarget: (id: string): boolean => {
    const player = players.get(id);
    return player?.targetX !== undefined && player?.targetY !== undefined;
  },
  
  reachedTarget: (id: string): boolean => {
    const player = players.get(id);
    if (!player) return true;
    return player.x === player.targetX && player.y === player.targetY;
  },
  
  getTarget: (id: string): { x: number; y: number } | null => {
    const player = players.get(id);
    if (!player || player.targetX === undefined || player.targetY === undefined) return null;
    return { x: player.targetX, y: player.targetY };
  },
};
