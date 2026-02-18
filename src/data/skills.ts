import { SkillKey, SkillDefinition } from '@/shared/types';

export const SKILLS_CONFIG: Record<SkillKey, SkillDefinition> = {
  attack: { key: 'attack', name: 'Attack', xpPerLevel: 1.0 },
  strength: { key: 'strength', name: 'Strength', xpPerLevel: 1.0 },
  defense: { key: 'defense', name: 'Defense', xpPerLevel: 1.0 },
  mining: { key: 'mining', name: 'Mining', xpPerLevel: 1.0 },
  woodcutting: { key: 'woodcutting', name: 'Woodcutting', xpPerLevel: 1.0 },
  fishing: { key: 'fishing', name: 'Fishing', xpPerLevel: 1.0 },
  cooking: { key: 'cooking', name: 'Cooking', xpPerLevel: 1.0 },
};

export function xpToLevel(xp: number): number {
  let level = 1;
  let xpRequired = 0;
  while (xpRequired <= xp && level < 99) {
    xpRequired += Math.floor((level + 300) * Math.pow(2, level / 7) / 4);
    if (xpRequired <= xp) level++;
  }
  return level;
}

export function levelToXp(level: number): number {
  let xp = 0;
  for (let l = 1; l < level; l++) {
    xp += Math.floor((l + 300) * Math.pow(2, l / 7) / 4);
  }
  return xp;
}

export function levelProgress(xp: number): number {
  let level = 1;
  let xpRequired = 0;
  while (xpRequired <= xp && level < 99) {
    xpRequired += Math.floor((level + 300) * Math.pow(2, level / 7) / 4);
    if (xpRequired <= xp) level++;
  }
  if (level >= 99) return 100;
  const currentLevelXp = xpRequired - Math.floor((level + 300) * Math.pow(2, level / 7) / 4);
  const nextLevelXp = xpRequired;
  return ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
}

export function getXpForNextLevel(currentXp: number): number {
  const currentLevel = xpToLevel(currentXp);
  return levelToXp(currentLevel + 1) - levelToXp(currentLevel);
}
