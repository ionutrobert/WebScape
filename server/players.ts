import { Player } from './types';
import { calculateFacing } from './facing';
import { world } from './world';
import { Server } from 'socket.io';
import { WEAPON_CONFIG, ARMOR_CONFIG } from './config';

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
      prevX: x,
      prevY: y,
      facing: 'south',
      inventory: {
        bronze_pickaxe: 1,
        bronze_axe: 1,
      },
      skills: {
        attack: 1,
        strength: 1,
        defense: 1,
        mining: 1,
        woodcutting: 1,
      },
      skillXp: {
        attack: 0,
        strength: 0,
        defense: 0,
        mining: 0,
        woodcutting: 0,
      },
      combatStats: {
        attack: 1,
        strength: 1,
        defense: 1,
        ranged: 1,
        magic: 1,
      },
      runEnergy: 100,
      isRunning: false,
      hp: 100,
      maxHp: 100,
      combat: {
        attackCooldown: 0,
        autoRetaliate: true,
        inCombat: false,
        combatTicksRemaining: 0,
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
  
  removeFromInventory: (id: string, itemId: string, qty: number): boolean => {
    const player = players.get(id);
    if (player) {
      const current = player.inventory[itemId] || 0;
      if (current >= qty) {
        player.inventory[itemId] = current - qty;
        if (player.inventory[itemId] <= 0) {
          delete player.inventory[itemId];
        }
        return true;
      }
    }
    return false;
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
      if (!player.skillXp) player.skillXp = {};
      player.skillXp[skill] = (player.skillXp[skill] || 0) + xp;
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

  getSkillXp: (id: string): Record<string, number> => {
    const player = players.get(id);
    return player?.skillXp || {};
  },

  toggleRun: (id: string): boolean => {
    const player = players.get(id);
    if (!player) return false;
    player.isRunning = !player.isRunning;
    return player.isRunning;
  },

  setRunning: (id: string, running: boolean): void => {
    const player = players.get(id);
    if (player) {
      player.isRunning = running;
    }
  },

  depleteRunEnergy: (id: string, amount: number): void => {
    const player = players.get(id);
    if (player) {
      player.runEnergy = Math.max(0, player.runEnergy - amount);
      if (player.runEnergy <= 0) {
        player.isRunning = false;
      }
    }
  },

  restoreRunEnergy: (id: string, amount: number): void => {
    const player = players.get(id);
    if (player) {
      player.runEnergy = Math.min(100, player.runEnergy + amount);
    }
  },

  getRunEnergy: (id: string): number => {
    const player = players.get(id);
    return player?.runEnergy ?? 100;
  },

  isRunning: (id: string): boolean => {
    const player = players.get(id);
    return player?.isRunning ?? false;
  },

  // Combat methods
  getCombatStats: (id: string): Player['combatStats'] | undefined => {
    const player = players.get(id);
    return player?.combatStats;
  },

  getHp: (id: string): number => {
    const player = players.get(id);
    return player?.hp ?? 100;
  },

  setHp: (id: string, hp: number): void => {
    const player = players.get(id);
    if (player) {
      player.hp = Math.max(0, Math.min(hp, player.maxHp ?? 100));
    }
  },

  damagePlayer: (id: string, amount: number): void => {
    const player = players.get(id);
    if (player) {
      if (player.godMode) return;
      player.hp = Math.max(0, (player.hp ?? 100) - amount);
    }
  },

  isInCombat: (id: string): boolean => {
    const player = players.get(id);
    return player?.combat?.inCombat ?? false;
  },

  setInCombat: (id: string, inCombat: boolean, targetId?: string): void => {
    const player = players.get(id);
    if (player?.combat) {
      player.combat.inCombat = inCombat;
      player.combat.combatTarget = targetId;
    }
  },

  getAttackCooldown: (id: string): number => {
    const player = players.get(id);
    return player?.combat?.attackCooldown ?? 0;
  },

  setAttackCooldown: (id: string, ticks: number): void => {
    const player = players.get(id);
    if (player?.combat) {
      player.combat.attackCooldown = ticks;
    }
  },

  decrementAttackCooldown: (id: string): void => {
    const player = players.get(id);
    if (player?.combat && player.combat.attackCooldown > 0) {
      player.combat.attackCooldown--;
    }
  },

  getEquipment: (id: string): Player['equipment'] | undefined => {
    const player = players.get(id);
    return player?.equipment;
  },

  setEquipment: (id: string, slot: keyof Player['equipment'], itemId: string | undefined): void => {
    const player = players.get(id);
    if (player) {
      if (!player.equipment) player.equipment = {};
      if (itemId === undefined) {
        delete (player.equipment as any)[slot];
      } else {
        (player.equipment as any)[slot] = itemId;
      }
    }
  },

  getEquipmentBonuses: (id: string): Player['equipmentBonuses'] => {
    const player = players.get(id);
    if (!player) {
      return {
        attackStab: 0,
        attackSlash: 0,
        attackCrush: 0,
        attackRanged: 0,
        attackMagic: 0,
        defenseStab: 0,
        defenseSlash: 0,
        defenseCrush: 0,
        defenseRanged: 0,
        defenseMagic: 0,
        strength: 0,
        rangedStrength: 0,
        magicDamage: 0,
        prayer: 0,
      };
    }

    const bonuses: Player['equipmentBonuses'] = {
      attackStab: 0,
      attackSlash: 0,
      attackCrush: 0,
      attackRanged: 0,
      attackMagic: 0,
      defenseStab: 0,
      defenseSlash: 0,
      defenseCrush: 0,
      defenseRanged: 0,
      defenseMagic: 0,
      strength: 0,
      rangedStrength: 0,
      magicDamage: 0,
      prayer: 0,
    };

    const equipment = player.equipment;
    if (!equipment) return bonuses;

    const weaponConfig = equipment.mainHand ? WEAPON_CONFIG[equipment.mainHand] : null;
    if (weaponConfig) {
      if (weaponConfig.attackStab) bonuses.attackStab += weaponConfig.attackStab;
      if (weaponConfig.attackSlash) bonuses.attackSlash += weaponConfig.attackSlash;
      if (weaponConfig.attackCrush) bonuses.attackCrush += weaponConfig.attackCrush;
      if (weaponConfig.attackRanged) bonuses.attackRanged += weaponConfig.attackRanged;
      if (weaponConfig.attackMagic) bonuses.attackMagic += weaponConfig.attackMagic;
    }

    const armorSlots: (keyof typeof equipment)[] = ['helm', 'chest', 'legs', 'cape', 'offHand'];
    for (const slot of armorSlots) {
      const itemId = equipment[slot];
      if (itemId) {
        const armorConfig = ARMOR_CONFIG[itemId];
        if (armorConfig) {
          bonuses.defenseStab += armorConfig.defenseStab;
          bonuses.defenseSlash += armorConfig.defenseSlash;
          bonuses.defenseCrush += armorConfig.defenseCrush;
          bonuses.defenseRanged += armorConfig.defenseRanged;
          bonuses.defenseMagic += armorConfig.defenseMagic;
        }
      }
    }

    return bonuses;
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
