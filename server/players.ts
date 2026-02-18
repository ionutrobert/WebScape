import { Player } from './types';
import { calculateFacing } from './facing';
import { world } from './world';
import { Server } from 'socket.io';

export type AdminLevel = 'mod' | 'admin' | 'owner';

const ADMIN_USERS: Record<string, AdminLevel> = {
  'admin': 'owner',
  'mod': 'mod',
  'dev': 'admin',
};

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
      skills: {
        attack: 1,
        strength: 1,
        defense: 1,
        mining: 1,
        woodcutting: 1,
      },
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
      player.prevX = player.x;
      player.prevY = player.y;
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
      const prevX = player.prevX ?? player.x;
      const prevY = player.prevY ?? player.y;
      player.prevX = player.x;
      player.prevY = player.y;
      player.x = x;
      player.y = y;
      player.facing = calculateFacing(prevX, prevY, x, y);
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

  addXp: (id: string, skill: string, xp: number): void => {
    const player = players.get(id);
    if (player) {
      player.skills[skill] = (player.skills[skill] || 1);
    }
  },

  getSkillLevel: (id: string, skill: string): number => {
    const player = players.get(id);
    return player?.skills[skill] || 1;
  },

  getSkills: (id: string): Record<string, number> => {
    const player = players.get(id);
    return player?.skills || {};
  },

  isAdmin: (username: string): boolean => {
    return username.toLowerCase() in ADMIN_USERS;
  },

  getAdminLevel: (username: string): AdminLevel | null => {
    return ADMIN_USERS[username.toLowerCase()] || null;
  },

  handleAdminCommand: async (playerId: string, command: string, args: any, io: Server): Promise<{ valid: boolean; reason?: string }> => {
    const player = players.get(playerId);
    if (!player) return { valid: false, reason: 'Player not found' };

    switch (command) {
      case 'teleport':
      case 'tp': {
        if (!args?.x || !args?.y) {
          return { valid: false, reason: 'Usage: /tp <x> <y>' };
        }
        const tx = parseInt(args.x);
        const ty = parseInt(args.y);
        if (isNaN(tx) || isNaN(ty)) {
          return { valid: false, reason: 'Invalid coordinates' };
        }
        if (tx < 0 || tx >= world.getWidth() || ty < 0 || ty >= world.getHeight()) {
          return { valid: false, reason: 'Coordinates out of bounds' };
        }
        player.x = tx;
        player.y = ty;
        player.prevX = tx;
        player.prevY = ty;
        io.emit('players-update', { players: playerManager.getAll(), tickStartTime: Date.now() });
        return { valid: true };
      }

      case 'spawn': {
        if (!args?.objectId || !args?.x || !args?.y) {
          return { valid: false, reason: 'Usage: /spawn <objectId> <x> <y>' };
        }
        return { valid: true, reason: 'Spawn not implemented yet' };
      }

      case 'give': {
        if (!args?.itemId || !args?.qty) {
          return { valid: false, reason: 'Usage: /give <itemId> <quantity>' };
        }
        const qty = parseInt(args.qty) || 1;
        playerManager.addToInventory(playerId, args.itemId, qty);
        return { valid: true };
      }

      case 'xp': {
        if (!args?.skill || !args?.amount) {
          return { valid: false, reason: 'Usage: /xp <skill> <amount>' };
        }
        const amount = parseInt(args.amount) || 0;
        player.skills[args.skill] = (player.skills[args.skill] || 0) + amount;
        return { valid: true };
      }

      case 'heal': {
        player.hp = player.maxHp || 100;
        return { valid: true };
      }

      case 'godmode': {
        player.godMode = !player.godMode;
        return { valid: true, reason: `God mode: ${player.godMode ? 'ON' : 'OFF'}` };
      }

      default:
        return { valid: false, reason: `Unknown command: ${command}` };
    }
  },
};
