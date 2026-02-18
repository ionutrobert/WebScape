import { playerManager } from "../players";
import { Server } from "socket.io";
import { WEAPON_CONFIG, ARMOR_CONFIG } from "../config";

interface CombatResult {
  hit: boolean;
  damage: number;
  xp: number;
}

const WEAPON_ATTACK_SPEEDS: Record<string, number> = {
  dagger: 4,
  sword: 5,
  axe: 5,
  mace: 5,
  spear: 6,
  two_handed: 6,
  halberd: 6,
  bow: 5,
  crossbow: 7,
  staff: 5,
  wand: 4,
};

const WEAPON_TYPES: Record<string, "stab" | "slash" | "crush" | "ranged" | "magic"> = {
  dagger: "stab",
  sword: "slash",
  axe: "crush",
  mace: "crush",
  spear: "stab",
  two_handed: "slash",
  halberd: "slash",
  bow: "ranged",
  crossbow: "ranged",
  staff: "crush",
  wand: "magic",
};

function getWeaponAttackSpeed(itemId: string): number {
  const config = WEAPON_CONFIG[itemId];
  if (config) {
    return config.attackSpeed;
  }
  for (const [keyword, speed] of Object.entries(WEAPON_ATTACK_SPEEDS)) {
    if (itemId.toLowerCase().includes(keyword)) {
      return speed;
    }
  }
  return 5;
}

function getWeaponType(itemId: string): "stab" | "slash" | "crush" | "ranged" | "magic" {
  const config = WEAPON_CONFIG[itemId];
  if (config) {
    return config.weaponType;
  }
  for (const [keyword, type] of Object.entries(WEAPON_TYPES)) {
    if (itemId.toLowerCase().includes(keyword)) {
      return type;
    }
  }
  return "crush";
}

function calculateAttackRoll(
  attackLevel: number,
  attackBonus: number,
  prayerMultiplier: number = 1.0,
  styleBonus: number = 0
): number {
  const effectiveLevel = (attackLevel * prayerMultiplier) + styleBonus + 8;
  return Math.floor(effectiveLevel * (64 + attackBonus));
}

function calculateDefenseRoll(
  defenseLevel: number,
  defenseBonus: number
): number {
  return Math.floor((defenseLevel + 8) * (64 + defenseBonus));
}

function calculateMaxHit(
  strengthLevel: number,
  strengthBonus: number,
  prayerMultiplier: number = 1.0,
  styleBonus: number = 0
): number {
  const effectiveLevel = Math.floor((strengthLevel * prayerMultiplier) + styleBonus);
  const baseDamage = Math.floor((effectiveLevel * (strengthBonus + 64)) / 640);
  return Math.floor(baseDamage) + 1;
}

export function canAttack(
  attackerId: string,
  targetId: string
): { valid: boolean; reason?: string } {
  const attacker = playerManager.get(attackerId);
  const target = playerManager.get(targetId);

  if (!attacker) return { valid: false, reason: "Attacker not found" };
  if (!target) return { valid: false, reason: "Target not found" };
  if (attackerId === targetId) return { valid: false, reason: "Cannot attack yourself" };

  const dx = Math.abs(attacker.x - target.x);
  const dy = Math.abs(attacker.y - target.y);

  const weapon = attacker.equipment?.mainHand;
  const isRanged = weapon ? getWeaponType(weapon) === "ranged" : false;
  const isMagic = weapon ? getWeaponType(weapon) === "magic" : false;

  if (isRanged || isMagic) {
    if (dx > 7 || dy > 7) {
      return { valid: false, reason: "Target is too far away." };
    }
  } else {
    if (dx > 1 || dy > 1) {
      return { valid: false, reason: "Target is too far away." };
    }
    if (dx === 1 && dy === 1) {
      return { valid: false, reason: "Cannot attack diagonally." };
    }
  }

  const cooldown = playerManager.getAttackCooldown(attackerId);
  if (cooldown > 0) {
    return { valid: false, reason: `Attack on cooldown (${cooldown} ticks).` };
  }

  return { valid: true };
}

export function processAttack(
  attackerId: string,
  targetId: string,
  style: "accurate" | "aggressive" | "defensive" = "accurate",
  io?: Server
): CombatResult {
  const attacker = playerManager.get(attackerId);
  const target = playerManager.get(targetId);

  if (!attacker || !target) {
    return { hit: false, damage: 0, xp: 0 };
  }

  const weapon = attacker.equipment?.mainHand;
  const attackSpeed = weapon ? getWeaponAttackSpeed(weapon) : 5;
  const weaponType = weapon ? getWeaponType(weapon) : "crush";

  const styleBonus = style === "accurate" ? 3 : style === "aggressive" ? 3 : 0;
  const styleXPSkill = style === "accurate" ? "attack" : style === "aggressive" ? "strength" : "defense";

  const attackerAttack = attacker.combatStats?.attack ?? attacker.skills?.attack ?? 1;
  const attackerStrength = attacker.combatStats?.strength ?? attacker.skills?.strength ?? 1;
  const attackerDefense = attacker.combatStats?.defense ?? attacker.skills?.defense ?? 1;
  const targetDefense = target.combatStats?.defense ?? target.skills?.defense ?? 1;

  const bonuses = playerManager.getEquipmentBonuses(attackerId);
  const targetBonuses = playerManager.getEquipmentBonuses(targetId);

  let attackBonus = 0;
  if (weaponType === "stab") attackBonus = bonuses?.attackStab ?? 0;
  else if (weaponType === "slash") attackBonus = bonuses?.attackSlash ?? 0;
  else if (weaponType === "crush") attackBonus = bonuses?.attackCrush ?? 0;
  else if (weaponType === "ranged") attackBonus = bonuses?.attackRanged ?? 0;
  else if (weaponType === "magic") attackBonus = bonuses?.attackMagic ?? 0;

  let defenseBonus = 0;
  if (weaponType === "stab") defenseBonus = targetBonuses?.defenseStab ?? 0;
  else if (weaponType === "slash") defenseBonus = targetBonuses?.defenseSlash ?? 0;
  else if (weaponType === "crush") defenseBonus = targetBonuses?.defenseCrush ?? 0;
  else if (weaponType === "ranged") defenseBonus = targetBonuses?.defenseRanged ?? 0;
  else if (weaponType === "magic") defenseBonus = targetBonuses?.defenseMagic ?? 0;

  const attackRoll = calculateAttackRoll(attackerAttack, attackBonus, 1.0, styleBonus);
  const defenseRoll = calculateDefenseRoll(targetDefense, defenseBonus);

  const hit = attackRoll > defenseRoll || (attackRoll === defenseRoll && Math.random() < 0.5);

  let damage = 0;
  if (hit) {
    const strengthBonus = bonuses?.strength ?? 0;
    const maxHit = calculateMaxHit(attackerStrength, strengthBonus, 1.0, styleBonus);
    damage = Math.floor(Math.random() * (maxHit + 1));
  }

  if (!target.godMode) {
    playerManager.damagePlayer(targetId, damage);
  }

  playerManager.setAttackCooldown(attackerId, attackSpeed);

  const xp = hit ? damage + 4 : 4;

  if (io) {
    io.to(attackerId).emit("combat-hit", {
      targetId,
      hit,
      damage,
      yourHp: target.hp,
      targetHp: attacker.hp,
    });
    io.to(targetId).emit("combat-hit", {
      targetId: attackerId,
      hit,
      damage,
      yourHp: attacker.hp,
      targetHp: target.hp,
    });
  }

  if ((target.hp ?? 100) <= 0) {
    const killXp = attackerAttack * 5 + attackerStrength * 5 + attackerDefense * 5;
    if (attacker.skills) {
      attacker.skills.attack = (attacker.skills.attack ?? 1) + Math.floor(killXp * 0.25);
      attacker.skills.strength = (attacker.skills.strength ?? 1) + Math.floor(killXp * 0.25);
      attacker.skills.defense = (attacker.skills.defense ?? 1) + Math.floor(killXp * 0.25);
    }
    playerManager.setHp(targetId, target.maxHp ?? 100);
    
    if (io) {
      io.emit("chat", {
        username: "System",
        message: `${attacker.username} defeated ${target.username}!`,
        type: "system"
      });
    }
  }

  return { hit, damage, xp };
}

export function startAttack(
  attackerId: string,
  targetId: string,
  style: "accurate" | "aggressive" | "defensive" = "accurate"
): { valid: boolean; reason?: string } {
  const canCheck = canAttack(attackerId, targetId);
  if (!canCheck.valid) {
    return canCheck;
  }

  const attacker = playerManager.get(attackerId);
  if (attacker?.combat) {
    attacker.combat.inCombat = true;
    attacker.combat.combatTarget = targetId;
  }

  return { valid: true };
}

export function processCombatTicks(): void {
  const allPlayers = playerManager.getAll();
  
  for (const player of allPlayers) {
    playerManager.decrementAttackCooldown(player.id);

    if (player.combat?.inCombat && player.combat.combatTarget) {
      const target = playerManager.get(player.combat.combatTarget);
      if (!target) {
        player.combat.inCombat = false;
        player.combat.combatTarget = undefined;
        continue;
      }

      const canAtk = canAttack(player.id, player.combat.combatTarget);
      if (!canAtk.valid) {
        player.combat.inCombat = false;
        player.combat.combatTarget = undefined;
        continue;
      }

      const cooldown = playerManager.getAttackCooldown(player.id);
      if (cooldown <= 0) {
        processAttack(player.id, player.combat.combatTarget, "accurate");
      }
    }
  }
}
