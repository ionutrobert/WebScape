import { ItemDefinition } from '@/shared/types';

export const ITEMS: Record<string, ItemDefinition> = {
  bronze_pickaxe: {
    id: 'bronze_pickaxe',
    name: 'Bronze Pickaxe',
    stackable: false,
    tradable: true,
    droppable: true,
    equipmentSlot: 'mainHand',
    toolType: 'pickaxe',
    toolTier: 1,
  },
  iron_pickaxe: {
    id: 'iron_pickaxe',
    name: 'Iron Pickaxe',
    stackable: false,
    tradable: true,
    droppable: true,
    equipmentSlot: 'mainHand',
    toolType: 'pickaxe',
    toolTier: 2,
  },
  steel_pickaxe: {
    id: 'steel_pickaxe',
    name: 'Steel Pickaxe',
    stackable: false,
    tradable: true,
    droppable: true,
    equipmentSlot: 'mainHand',
    toolType: 'pickaxe',
    toolTier: 3,
  },
  bronze_axe: {
    id: 'bronze_axe',
    name: 'Bronze Axe',
    stackable: false,
    tradable: true,
    droppable: true,
    equipmentSlot: 'mainHand',
    toolType: 'axe',
    toolTier: 1,
  },
  iron_axe: {
    id: 'iron_axe',
    name: 'Iron Axe',
    stackable: false,
    tradable: true,
    droppable: true,
    equipmentSlot: 'mainHand',
    toolType: 'axe',
    toolTier: 2,
  },
  steel_axe: {
    id: 'steel_axe',
    name: 'Steel Axe',
    stackable: false,
    tradable: true,
    droppable: true,
    equipmentSlot: 'mainHand',
    toolType: 'axe',
    toolTier: 3,
  },
  copper_ore: {
    id: 'copper_ore',
    name: 'Copper Ore',
    stackable: true,
    tradable: true,
    droppable: true,
  },
  tin_ore: {
    id: 'tin_ore',
    name: 'Tin Ore',
    stackable: true,
    tradable: true,
    droppable: true,
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    stackable: true,
    tradable: true,
    droppable: true,
  },
  coal: {
    id: 'coal',
    name: 'Coal',
    stackable: true,
    tradable: true,
    droppable: true,
  },
  gold_ore: {
    id: 'gold_ore',
    name: 'Gold Ore',
    stackable: true,
    tradable: true,
    droppable: true,
  },
  oak_log: {
    id: 'oak_log',
    name: 'Oak Log',
    stackable: false,
    tradable: true,
    droppable: true,
  },
  willow_log: {
    id: 'willow_log',
    name: 'Willow Log',
    stackable: false,
    tradable: true,
    droppable: true,
  },
  maple_log: {
    id: 'maple_log',
    name: 'Maple Log',
    stackable: false,
    tradable: true,
    droppable: true,
  },
  coins: {
    id: 'coins',
    name: 'Coins',
    stackable: true,
    tradable: true,
    droppable: true,
  },
  bronze_bar: {
    id: 'bronze_bar',
    name: 'Bronze Bar',
    stackable: true,
    tradable: true,
    droppable: true,
  },
};

export function getItem(id: string): ItemDefinition | undefined {
  return ITEMS[id];
}

export function isStackable(itemId: string): boolean {
  return ITEMS[itemId]?.stackable ?? false;
}

export function getToolTier(itemId: string): number {
  return ITEMS[itemId]?.toolTier ?? 0;
}

export function getToolType(itemId: string): 'pickaxe' | 'axe' | 'none' {
  return ITEMS[itemId]?.toolType ?? 'none';
}
