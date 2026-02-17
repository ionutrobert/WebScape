import { create } from 'zustand';
import { 
  SkillKey, 
  InventorySlot, 
  PlayerAction, 
  WorldObjectState,
  Position,
  FacingDirection,
  ToolType
} from '@/shared/types';
import { SKILLS_CONFIG, xpToLevel } from '@/data/skills';
import { getToolTier, getToolType, ITEMS } from '@/data/items';
import { OBJECTS, INITIAL_WORLD_OBJECTS } from '@/data/objects';
import { GAME_NAME } from '@/data/game';
import { loadSettings, saveSettings, ClientSettings } from '@/client/lib/clientDb';

export interface CameraState {
  theta: number;
  phi: number;
  distance: number;
}

interface GameState {
  username: string | null;
  playerId: string | null;
  xp: Record<SkillKey, number>;
  inventory: (InventorySlot | null)[];
  equipment: Record<string, string | null>;
  position: Position;
  targetDestination: Position | null;
  facing: FacingDirection;
  isMoving: boolean;
  currentAction: PlayerAction | null;
  worldObjects: WorldObjectState[];
  chatLog: string[];
  isLoaded: boolean;
  players: Record<string, { id: string; username: string; x: number; y: number; facing: string }>;
  camera: CameraState;
  cameraRestored: boolean;
  uiTab: 'inventory' | 'skills' | 'equipment';

  setUsername: (name: string) => void;
  setPlayerId: (id: string) => void;
  setXp: (xp: Record<SkillKey, number>) => void;
  setInventory: (inv: (InventorySlot | null)[]) => void;
  setEquipment: (eq: Record<string, string | null>) => void;
  setPosition: (pos: Position) => void;
  setTargetDestination: (target: Position | null) => void;
  setFacing: (facing: FacingDirection) => void;
  setWorldObjects: (objects: WorldObjectState[]) => void;
  setPlayers: (players: Record<string, { id: string; username: string; x: number; y: number; facing: string }>) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  setUiTab: (tab: 'inventory' | 'skills' | 'equipment') => void;
  loadClientSettings: () => Promise<void>;

  addXp: (skill: SkillKey, amount: number) => number;
  addToInventory: (itemId: string, qty: number) => boolean;
  removeFromInventory: (itemId: string, qty: number) => boolean;
  getLevel: (skill: SkillKey) => number;
  hasTool: (toolType: ToolType, minTier: number) => boolean;

  canInteractWith: (objectId: string) => { valid: boolean; reason?: string };
  startHarvest: (objectId: string) => boolean;
  setAction: (action: PlayerAction | null) => void;
  tickAction: () => void;

  addChatMessage: (msg: string) => void;
  clearChatLog: () => void;
  loadFromDb: (data: { xp: Record<SkillKey, number>; inventory: (InventorySlot | null)[]; equipment: Record<string, string | null>; position: Position }) => void;
  setLoaded: (loaded: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  username: null,
  playerId: null,
  xp: {
    attack: 0,
    strength: 0,
    defense: 0,
    mining: 0,
    woodcutting: 0,
  },
  inventory: Array(28).fill(null),
  equipment: {
    mainHand: null,
    chest: null,
    legs: null,
    cape: null,
    helm: null,
  },
  position: { x: 10, y: 10 },
  targetDestination: null,
  facing: 'south',
  isMoving: false,
  currentAction: null,
  worldObjects: INITIAL_WORLD_OBJECTS,
  chatLog: [`Welcome to ${GAME_NAME}! Click a resource to harvest.`],
  isLoaded: false,
  players: {},
  camera: { theta: Math.PI / 4, phi: Math.PI / 4, distance: 15 },
  cameraRestored: false,
  uiTab: 'inventory',

  setUsername: (name) => set({ username: name }),
  setPlayerId: (id) => set({ playerId: id }),
  setXp: (xp) => set({ xp }),
  setInventory: (inv) => set({ inventory: inv }),
  setEquipment: (eq) => set({ equipment: eq }),
  setPosition: (pos: Position) => set((state) => {
    const hasReachedTarget = state.targetDestination 
      ? (pos.x === state.targetDestination.x && pos.y === state.targetDestination.y)
      : true;
    return { 
      position: pos, 
      isMoving: !hasReachedTarget
    };
  }),
  setTargetDestination: (target) => set((state) => {
    return { 
      targetDestination: target,
      isMoving: target !== null
    };
  }),
  setFacing: (facing) => set({ facing }),
  setIsMoving: (moving: boolean) => set({ isMoving: moving }),
  setWorldObjects: (objects) => set({ worldObjects: objects }),
  setPlayers: (players: Record<string, { id: string; username: string; x: number; y: number; facing: string }>) => set({ players }),
  
  setCamera: (camera: Partial<CameraState>) => {
    const current = get().camera;
    const updated = { ...current, ...camera };
    set({ camera: updated });
    
    const username = get().username;
    if (username) {
      saveSettings(username, {
        cameraTheta: updated.theta,
        cameraPhi: updated.phi,
        cameraDistance: updated.distance,
      });
    }
  },
  
  setUiTab: (tab: 'inventory' | 'skills' | 'equipment') => {
    set({ uiTab: tab });
    const username = get().username;
    if (username) {
      saveSettings(username, { uiTab: tab });
    }
  },
  
  loadClientSettings: async () => {
    const username = get().username;
    if (!username) return;
    
    const settings = await loadSettings(username);
    set({
      camera: {
        theta: settings.cameraTheta,
        phi: settings.cameraPhi,
        distance: settings.cameraDistance,
      },
      uiTab: settings.uiTab,
      cameraRestored: true,
    });
  },

  addXp: (skill, amount) => {
    const currentXp = get().xp[skill];
    const currentLevel = xpToLevel(currentXp);
    const newXp = currentXp + amount;
    const newLevel = xpToLevel(newXp);
    
    set((state) => ({
      xp: { ...state.xp, [skill]: newXp },
    }));
    
    if (newLevel > currentLevel) {
      get().addChatMessage(`Congratulations! Your ${SKILLS_CONFIG[skill].name} level is now ${newLevel}.`);
      return newLevel;
    }
    return 0;
  },

  addToInventory: (itemId, qty) => {
    const inv = [...get().inventory];
    const item = ITEMS[itemId];
    
    if (!item) return false;
    
    if (item.stackable) {
      const existingSlot = inv.find((slot) => slot?.id === itemId);
      if (existingSlot) {
        existingSlot.qty += qty;
        set({ inventory: inv });
        return true;
      }
    }
    
    const emptySlot = inv.findIndex((slot) => slot === null);
    if (emptySlot === -1) {
      get().addChatMessage('Your inventory is full!');
      return false;
    }
    
    inv[emptySlot] = { id: itemId, qty };
    set({ inventory: inv });
    return true;
  },

  removeFromInventory: (itemId, qty) => {
    const inv = [...get().inventory];
    const slotIndex = inv.findIndex((slot) => slot?.id === itemId);
    
    if (slotIndex === -1) return false;
    
    const slot = inv[slotIndex]!;
    if (slot.qty < qty) return false;
    
    slot.qty -= qty;
    if (slot.qty <= 0) {
      inv[slotIndex] = null;
    }
    
    set({ inventory: inv });
    return true;
  },

  getLevel: (skill) => xpToLevel(get().xp[skill]),

  hasTool: (toolType, minTier) => {
    const { inventory, equipment } = get();
    
    const mainHand = equipment.mainHand;
    if (mainHand && getToolType(mainHand) === toolType && getToolTier(mainHand) >= minTier) {
      return true;
    }
    
    for (const slot of inventory) {
      if (slot && getToolType(slot.id) === toolType && getToolTier(slot.id) >= minTier) {
        return true;
      }
    }
    
    return false;
  },

  canInteractWith: (objectId) => {
    const { position } = get();
    const objectDef = OBJECTS[objectId];
    
    if (!objectDef) {
      return { valid: false, reason: 'Unknown object' };
    }
    
    const worldObj = get().worldObjects.find(
      (o) => o.definitionId === objectId && o.position.x === position.x && o.position.y === position.y
    );
    
    if (worldObj && worldObj.status === 'depleted') {
      return { valid: false, reason: 'This resource is depleted' };
    }
    
    const level = get().getLevel(objectDef.toolRequired === 'pickaxe' ? 'mining' : 'woodcutting');
    if (level < objectDef.levelReq) {
      return { valid: false, reason: `You need ${objectDef.toolRequired} level ${objectDef.levelReq}` };
    }
    
    if (!get().hasTool(objectDef.toolRequired, 1)) {
      return { valid: false, reason: `You need a ${objectDef.toolRequired} to harvest this` };
    }
    
    return { valid: true };
  },

  startHarvest: (objectId) => {
    const { position, worldObjects, currentAction } = get();
    const objectDef = OBJECTS[objectId];
    
    if (!objectDef) return false;
    
    const targetObj = worldObjects.find(
      (o) => o.definitionId === objectId && 
             Math.abs(o.position.x - position.x) + Math.abs(o.position.y - position.y) === 1
    );
    
    if (!targetObj) {
      get().addChatMessage('You need to get closer to harvest this.');
      return false;
    }
    
    if (targetObj.status === 'depleted') {
      get().addChatMessage('This resource is depleted and waiting to respawn.');
      return false;
    }
    
    if (currentAction) {
      get().addChatMessage('You are already doing something!');
      return false;
    }
    
    const skill = objectDef.toolRequired === 'pickaxe' ? 'mining' : 'woodcutting';
    
    const action: PlayerAction = {
      type: 'harvest',
      targetPosition: targetObj.position,
      targetObjectId: objectId,
      ticksRemaining: objectDef.depletionTicks,
      skill,
      xpReward: objectDef.xpGranted,
      itemReward: { id: objectDef.resourceGiven, qty: objectDef.resourceQty },
    };
    
    set({ currentAction: action });
    get().addChatMessage(`You swing your ${objectDef.toolRequired} at the ${objectDef.name}...`);
    return true;
  },

  setAction: (action) => set({ currentAction: action }),
  
  tickAction: () => {
    const { currentAction, worldObjects } = get();
    if (!currentAction) return;
    
    if (currentAction.type === 'harvest' && currentAction.targetObjectId) {
      const objIndex = worldObjects.findIndex(
        (o) => o.definitionId === currentAction.targetObjectId &&
               o.position.x === currentAction.targetPosition?.x &&
               o.position.y === currentAction.targetPosition?.y
      );
      
      if (objIndex !== -1) {
        const obj = worldObjects[objIndex];
        const objDef = OBJECTS[currentAction.targetObjectId];
        
        if (obj.status === 'depleted') {
          const newObjects = [...worldObjects];
          newObjects[objIndex] = {
            ...obj,
            ticksUntilRespawn: obj.ticksUntilRespawn - 1,
          };
          
          if (newObjects[objIndex].ticksUntilRespawn <= 0) {
            newObjects[objIndex] = {
              ...newObjects[objIndex],
              status: 'active',
              ticksUntilRespawn: 0,
            };
            get().addChatMessage(`The ${objDef.name} has respawned.`);
          }
          
          set({ worldObjects: newObjects, currentAction: null });
          return;
        }
        
        const progress = ((objDef.depletionTicks - currentAction.ticksRemaining + 1) / objDef.depletionTicks) * 100;
        
        if (currentAction.ticksRemaining <= 1) {
          if (currentAction.xpReward) {
            get().addXp(currentAction.skill!, currentAction.xpReward);
          }
          if (currentAction.itemReward) {
            get().addToInventory(currentAction.itemReward.id, currentAction.itemReward.qty);
            get().addChatMessage(`You get ${currentAction.itemReward.qty} ${ITEMS[currentAction.itemReward.id].name}.`);
          }
          
          const newObjects = [...worldObjects];
          newObjects[objIndex] = {
            ...obj,
            status: 'depleted',
            ticksUntilRespawn: objDef.respawnTicks,
            harvestProgress: 0,
          };
          
          set({ currentAction: null, worldObjects: newObjects });
        } else {
          const newObjects = [...worldObjects];
          newObjects[objIndex] = {
            ...obj,
            harvestProgress: progress,
          };
          set({ 
            currentAction: { ...currentAction, ticksRemaining: currentAction.ticksRemaining - 1 },
            worldObjects: newObjects 
          });
        }
      }
    }
  },

  addChatMessage: (msg) => {
    set((state) => ({
      chatLog: [...state.chatLog.slice(-49), msg],
    }));
  },
  
  clearChatLog: () => set({ chatLog: [] }),
  
  loadFromDb: (data) => {
    set({
      xp: data.xp,
      inventory: data.inventory,
      equipment: data.equipment,
      position: data.position,
      worldObjects: INITIAL_WORLD_OBJECTS,
      isLoaded: true,
    });
  },
  
  setLoaded: (loaded) => set({ isLoaded: loaded }),
}));
