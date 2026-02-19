// Utility to get OSRS item icon URLs from the OSRS Wiki
// Icons are hosted at: https://oldschool.runescape.wiki/images/

export function getItemIconUrl(itemName: string, size: number = 36): string {
  // Convert item name to wiki format
  const formattedName = itemName
    .toLowerCase()
    .replace(/ /g, '_')
    .replace(/\(/g, '(')
    .replace(/\)/g, ')')
    .replace(/'/g, '%27')
    .replace(/,/g, '%2C');
  
  return `https://oldschool.runescape.wiki/images/thumb/${formattedName}.png/${size}px-${formattedName}.png`;
}

export function getItemIconUrlById(itemId: number): string | null {
  // This would need to be fetched from the API or stored locally
  // For now, we use the item name from our items.ts
  return null;
}

// Cache for item icon URLs to avoid repeated lookups
const itemIconCache: Record<string, string> = {};

// Pre-populate with common items
export const COMMON_ITEMS: Record<string, string> = {
  // Ores
  'copper_ore': 'Copper_ore',
  'tin_ore': 'Tin_ore',
  'iron_ore': 'Iron_ore',
  'coal': 'Coal',
  'gold_ore': 'Gold_ore',
  'mithril_ore': 'Mithril_ore',
  'adamantite_ore': 'Adamantite_ore',
  'rune_ore': 'Rune_ore',
  
  // Bars
  'bronze_bar': 'Bronze_bar',
  'iron_bar': 'Iron_bar',
  'steel_bar': 'Steel_bar',
  'mithril_bar': 'Mithril_bar',
  'adamant_bar': 'Adamant_bar',
  'rune_bar': 'Rune_bar',
  
  // Logs
  'logs': 'Logs',
  'oak_logs': 'Oak_logs',
  'willow_logs': 'Willow_logs',
  'maple_logs': 'Maple_logs',
  'yew_logs': 'Yew_logs',
  'magic_logs': 'Magic_logs',
  
  // Tools
  'bronze_pickaxe': 'Bronze_pickaxe',
  'iron_pickaxe': 'Iron_pickaxe',
  'steel_pickaxe': 'Steel_pickaxe',
  'mithril_pickaxe': 'Mithril_pickaxe',
  'adamant_pickaxe': 'Adamant_pickaxe',
  'rune_pickaxe': 'Rune_pickaxe',
  'bronze_axe': 'Bronze_axe',
  'iron_axe': 'Iron_axe',
  'steel_axe': 'Steel_axe',
  'mithril_axe': 'Mithril_axe',
  'adamant_axe': 'Adamant_axe',
  'rune_axe': 'Rune_axe',
  
  // Weapons
  'bronze_sword': 'Bronze_sword',
  'iron_sword': 'Iron_sword',
  'steel_sword': 'Steel_sword',
  'mithril_sword': 'Mithril_sword',
  'adamant_sword': 'Adamant_sword',
  'rune_sword': 'Rune_sword',
  'dragon_sword': 'Dragon_sword',
  
  // Armor
  'bronze_helm': 'Bronze_helm',
  'iron_helm': 'Iron_helm',
  'steel_helm': 'Steel_helm',
  'bronze_chest': 'Bronze_chestplate',
  'iron_chest': 'Iron_chestplate',
  'steel_chest': 'Steel_chestplate',
  'bronze_legs': 'Bronze_platelegs',
  'iron_legs': 'Iron_platelegs',
  'steel_legs': 'Steel_platelegs',
  
  // Food
  'shrimp': 'Shrimp',
  'trout': 'Trout',
  'salmon': 'Salmon',
  'tuna': 'Tuna',
  'lobster': 'Lobster',
  'swordfish': 'Swordfish',
  'shark': 'Shark',
  
  // Other
  'coins': 'Coins',
  'tinderbox': 'Tinderbox',
  'fishing_rod': 'Fishing_rod',
  'fishing_net': 'Fishing_net',
  'harpoon': 'Harpoon',
};

export function getCachedItemIcon(itemId: string): string | null {
  if (itemIconCache[itemId]) {
    return itemIconCache[itemId];
  }
  
  const wikiName = COMMON_ITEMS[itemId];
  if (wikiName) {
    const url = `https://oldschool.runescape.wiki/images/${wikiName}.png`;
    itemIconCache[itemId] = url;
    return url;
  }
  
  return null;
}
