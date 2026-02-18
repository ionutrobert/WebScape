import { create } from "zustand";
import {
  SkillKey,
  InventorySlot,
  PlayerAction,
  WorldObjectState,
  Position,
  FacingDirection,
  ToolType,
} from "@/shared/types";
import { SKILLS_CONFIG, xpToLevel } from "@/data/skills";
import { getToolTier, getToolType, ITEMS } from "@/data/items";
import { OBJECTS, INITIAL_WORLD_OBJECTS } from "@/data/objects";
import { GAME_NAME } from "@/data/game";
import {
  loadSettings,
  saveSettings,
  ClientSettings,
} from "@/client/lib/clientDb";

export interface CameraState {
  theta: number;
  phi: number;
  distance: number;
}

export interface XpDrop {
  id: string;
  skill: SkillKey;
  amount: number;
  x: number;
  y: number;
  startTime: number;
}

export interface ClickFeedback {
  id: string;
  type: "move" | "action";
  screenX: number;
  screenY: number;
  startTime: number;
}

export interface HoverInfo {
  type: "ground" | "rock" | "tree" | "player" | null;
  name?: string;
  x: number;
  y: number;
}

interface GameState {
  username: string | null;
  playerId: string | null;
  isAdmin: boolean;
  debugSettings: {
    showTrueTile: boolean;
    showTickInfo: boolean;
    showCollisionMap: boolean;
  };
  performanceSettings: {
    viewDistance: number;
    shadowsEnabled: boolean;
    smoothCamera: boolean;
    showFps: boolean;
  };
  xp: Record<SkillKey, number>;
  inventory: (InventorySlot | null)[];
  equipment: Record<string, string | null>;
  position: Position;
  startPosition: Position;
  targetDestination: Position | null;
  facing: FacingDirection;
  isMoving: boolean;
  currentAction: PlayerAction | null;
  worldObjects: WorldObjectState[];
  worldTiles: { x: number; y: number; tileType: string; height: number }[];
  collisionMap: boolean[][];
  chatLog: string[];
  isLoaded: boolean;
  players: Record<
    string,
    {
      id: string;
      username: string;
      x: number;
      y: number;
      facing: string;
      isRunning?: boolean;
      isHarvesting?: boolean;
    }
  >;
  camera: CameraState;
  cameraRestored: boolean;
  uiTab: "inventory" | "skills" | "equipment";
  tickStartTime: number;
  tickDuration: number;
  worldWidth: number;
  worldHeight: number;
  runEnergy: number;
  isRunning: boolean;
  xpDrops: XpDrop[];
  clickFeedbacks: ClickFeedback[];
  hoverInfo: HoverInfo;
  setHoverInfo: (info: HoverInfo) => void;

  addXpDrop: (skill: SkillKey, amount: number, x: number, y: number) => void;
  removeXpDrop: (id: string) => void;
  cleanupXpDrops: () => void;

  addClickFeedback: (type: "move" | "action", screenX: number, screenY: number) => void;
  removeClickFeedback: (id: string) => void;
  cleanupClickFeedbacks: () => void;

  setUsername: (name: string) => void;
  setPlayerId: (id: string) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setXp: (xp: Record<SkillKey, number>) => void;
  setInventory: (inv: (InventorySlot | null)[]) => void;
  setEquipment: (eq: Record<string, string | null>) => void;
  setPosition: (
    pos: Position,
    startPos?: Position,
    tickStartTime?: number,
  ) => void;
  setTargetDestination: (target: Position | null) => void;
  setFacing: (facing: FacingDirection) => void;
  setWorldObjects: (objects: WorldObjectState[]) => void;
  setWorldSize: (width: number, height: number) => void;
  setWorldTiles: (
    tiles: { x: number; y: number; tileType: string; height: number }[],
  ) => void;
  setCollisionMap: (map: boolean[][]) => void;
  setPlayers: (
    players: Record<
      string,
      {
        id: string;
        username: string;
        x: number;
        y: number;
        facing: string;
        isRunning?: boolean;
        isHarvesting?: boolean;
      }
    >,
    tickStartTime?: number,
  ) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  setDebugSettings: (settings: Partial<GameState["debugSettings"]>) => void;
  setPerformanceSettings: (
    settings: Partial<GameState["performanceSettings"]>,
  ) => void;
  setUiTab: (tab: "inventory" | "skills" | "equipment") => void;
  loadClientSettings: () => Promise<void>;
  setRunState: (isRunning: boolean, runEnergy: number) => void;
  toggleRun: () => void;

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
  loadFromDb: (data: {
    xp: Record<SkillKey, number>;
    inventory: (InventorySlot | null)[];
    equipment: Record<string, string | null>;
    position: Position;
  }) => void;
  setLoaded: (loaded: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  username: null,
  playerId: null,
  isAdmin: false,
  debugSettings: {
    showTrueTile: false,
    showTickInfo: false,
    showCollisionMap: false,
  },
  performanceSettings: {
    viewDistance: 14,
    shadowsEnabled: true,
    smoothCamera: true,
    showFps: false,
  },
  xp: {
    attack: 0,
    strength: 0,
    defense: 0,
    mining: 0,
    woodcutting: 0,
    fishing: 0,
    cooking: 0,
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
  startPosition: { x: 10, y: 10 },
  targetDestination: null,
  facing: "south",
  isMoving: false,
  currentAction: null,
  worldObjects: INITIAL_WORLD_OBJECTS,
  worldTiles: [],
  collisionMap: [],
  chatLog: [`Welcome to ${GAME_NAME}! Click a resource to harvest.`],
  isLoaded: false,
  players: {},
  camera: { theta: 0.7853981633974483, phi: 0.7853981633974483, distance: 15 },
  cameraRestored: false,
  uiTab: "inventory",
  tickStartTime: 0,
  tickDuration: 600,
  worldWidth: 100,
  worldHeight: 100,
  runEnergy: 100,
  isRunning: false,
  xpDrops: [],
  clickFeedbacks: [],
  hoverInfo: { type: null, x: 0, y: 0 },

  addXpDrop: (skill: SkillKey, amount: number, x: number, y: number) => {
    const newDrop: XpDrop = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      skill,
      amount,
      x,
      y,
      startTime: performance.now(),
    };
    set((state) => ({
      xpDrops: [...state.xpDrops, newDrop],
    }));
  },

  removeXpDrop: (id: string) => {
    set((state) => ({
      xpDrops: state.xpDrops.filter((drop) => drop.id !== id),
    }));
  },

  cleanupXpDrops: () => {
    const now = performance.now();
    set((state) => ({
      xpDrops: state.xpDrops.filter((drop) => now - drop.startTime < 2000),
    }));
  },

  addClickFeedback: (type: "move" | "action", screenX: number, screenY: number) => {
    const newFeedback: ClickFeedback = {
      id: `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      screenX,
      screenY,
      startTime: performance.now(),
    };
    set((state) => ({
      clickFeedbacks: [...state.clickFeedbacks, newFeedback],
    }));
  },

  removeClickFeedback: (id: string) => {
    set((state) => ({
      clickFeedbacks: state.clickFeedbacks.filter((fb) => fb.id !== id),
    }));
  },

  cleanupClickFeedbacks: () => {
    const now = performance.now();
    set((state) => ({
      clickFeedbacks: state.clickFeedbacks.filter((fb) => now - fb.startTime < 200),
    }));
  },

  setHoverInfo: (info: HoverInfo) => set({ hoverInfo: info }),

  setUsername: (name) => set({ username: name }),
  setPlayerId: (id) => set({ playerId: id }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setXp: (xp) => set({ xp }),
  setInventory: (inv) => set({ inventory: inv }),
  setEquipment: (eq) => set({ equipment: eq }),
  setWorldSize: (width, height) =>
    set({ worldWidth: width, worldHeight: height }),
  setWorldTiles: (tiles) => set({ worldTiles: tiles }),
  setCollisionMap: (map) => set({ collisionMap: map }),
  setPosition: (pos: Position, startPos?: Position, tickStartTime?: number) =>
    set((state) => {
      const hasReachedTarget = state.targetDestination
        ? pos.x === state.targetDestination.x &&
          pos.y === state.targetDestination.y
        : true;
      return {
        position: pos,
        startPosition: startPos || pos,
        isMoving: !hasReachedTarget,
        tickStartTime: tickStartTime ?? state.tickStartTime,
      };
    }),
  setTargetDestination: (target) =>
    set((state) => {
      return {
        targetDestination: target,
        isMoving: target !== null,
        currentAction: target !== null ? null : state.currentAction,
      };
    }),
  setFacing: (facing) => set({ facing }),
  setIsMoving: (moving: boolean) => set({ isMoving: moving }),
  setWorldObjects: (objects) => set({ worldObjects: objects }),
  setPlayers: (
    players: Record<
      string,
      {
        id: string;
        username: string;
        x: number;
        y: number;
        facing: string;
        isRunning?: boolean;
        isHarvesting?: boolean;
      }
    >,
    tickStartTime?: number,
  ) =>
    set(() => ({
      players,
    })),

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

  setDebugSettings: (settings: Partial<GameState["debugSettings"]>) => {
    const current = get().debugSettings;
    const updated = { ...current, ...settings };
    set({ debugSettings: updated });
    const username = get().username;
    if (username) {
      saveSettings(username, { debugSettings: updated });
    }
  },

  setPerformanceSettings: (
    settings: Partial<GameState["performanceSettings"]>,
  ) => {
    const current = get().performanceSettings;
    const updated = { ...current, ...settings };
    set({ performanceSettings: updated });
    const username = get().username;
    if (username) {
      saveSettings(username, { performanceSettings: updated });
    }
  },

  setUiTab: (tab: "inventory" | "skills" | "equipment") => {
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
      debugSettings: settings.debugSettings,
      performanceSettings: settings.performanceSettings,
      cameraRestored: true,
    });
  },

  setRunState: (isRunning, runEnergy) => set({ isRunning, runEnergy }),

  toggleRun: () =>
    set((state) => {
      if (state.runEnergy <= 0) {
        return { isRunning: false };
      }
      return { isRunning: !state.isRunning };
    }),

  addXp: (skill, amount) => {
    const currentXp = get().xp[skill];
    const currentLevel = xpToLevel(currentXp);
    const newXp = currentXp + amount;
    const newLevel = xpToLevel(newXp);

    set((state) => ({
      xp: { ...state.xp, [skill]: newXp },
    }));

    if (newLevel > currentLevel) {
      get().addChatMessage(
        `Congratulations! Your ${SKILLS_CONFIG[skill].name} level is now ${newLevel}.`,
      );
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
      get().addChatMessage("Your inventory is full!");
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
    if (
      mainHand &&
      getToolType(mainHand) === toolType &&
      getToolTier(mainHand) >= minTier
    ) {
      return true;
    }

    for (const slot of inventory) {
      if (
        slot &&
        getToolType(slot.id) === toolType &&
        getToolTier(slot.id) >= minTier
      ) {
        return true;
      }
    }

    return false;
  },

  canInteractWith: (objectId) => {
    const { position } = get();
    const objectDef = OBJECTS[objectId];

    if (!objectDef) {
      return { valid: false, reason: "Unknown object" };
    }

    const worldObj = get().worldObjects.find(
      (o) =>
        o.definitionId === objectId &&
        o.position.x === position.x &&
        o.position.y === position.y,
    );

    if (worldObj && worldObj.status === "depleted") {
      return { valid: false, reason: "This resource is depleted" };
    }

    const level = get().getLevel(
      objectDef.toolRequired === "pickaxe" ? "mining" : "woodcutting",
    );
    if (objectDef.levelReq !== undefined && level < objectDef.levelReq) {
      return {
        valid: false,
        reason: `You need ${objectDef.toolRequired} level ${objectDef.levelReq}`,
      };
    }

    if (!get().hasTool(objectDef.toolRequired ?? "axe", 1)) {
      return {
        valid: false,
        reason: `You need a ${objectDef.toolRequired} to harvest this`,
      };
    }

    return { valid: true };
  },

  startHarvest: (objectId) => {
    const { position, worldObjects, currentAction } = get();
    const objectDef = OBJECTS[objectId];

    if (!objectDef) return false;

    const targetObj = worldObjects.find(
      (o) =>
        o.definitionId === objectId &&
        Math.abs(o.position.x - position.x) +
          Math.abs(o.position.y - position.y) ===
          1,
    );

    if (!targetObj) {
      get().addChatMessage("You need to get closer to harvest this.");
      return false;
    }

    if (targetObj.status === "depleted") {
      get().addChatMessage("This resource is depleted and waiting to respawn.");
      return false;
    }

    if (currentAction) {
      get().addChatMessage("You are already doing something!");
      return false;
    }

    const skill =
      objectDef.toolRequired === "pickaxe" ? "mining" : "woodcutting";

    const action: PlayerAction = {
      type: "harvest",
      targetPosition: targetObj.position,
      targetObjectId: objectId,
      progress: 0,
      ticksRemaining: objectDef.depletionTicks ?? 0,
      skill,
      xpReward: objectDef.xpGranted ?? 0,
      itemReward: { id: objectDef.resourceGiven ?? "", qty: objectDef.resourceQty ?? 1 },
    };

    set({ currentAction: action });
    get().addChatMessage(
      `You swing your ${objectDef.toolRequired} at the ${objectDef.name}...`,
    );
    return true;
  },

  setAction: (action) => set({ currentAction: action }),

  tickAction: () => {
    const { currentAction, worldObjects } = get();
    if (!currentAction) return;

    if (currentAction.type === "harvest" && currentAction.targetObjectId) {
      const objIndex = worldObjects.findIndex(
        (o) =>
          o.definitionId === currentAction.targetObjectId &&
          o.position.x === currentAction.targetPosition?.x &&
          o.position.y === currentAction.targetPosition?.y,
      );

      if (objIndex !== -1) {
        const obj = worldObjects[objIndex];
        const objDef = OBJECTS[currentAction.targetObjectId];

        if (obj.status === "depleted") {
          const newObjects = [...worldObjects];
          newObjects[objIndex] = {
            ...obj,
            ticksUntilRespawn: obj.ticksUntilRespawn - 1,
          };

          if (newObjects[objIndex].ticksUntilRespawn <= 0) {
            newObjects[objIndex] = {
              ...newObjects[objIndex],
              status: "active",
              ticksUntilRespawn: 0,
            };
            get().addChatMessage(`The ${objDef.name} has respawned.`);
          }

          set({ worldObjects: newObjects, currentAction: null });
          return;
        }

        const depletionTicks = objDef.depletionTicks ?? 1;
        const progress =
          ((depletionTicks - currentAction.ticksRemaining + 1) /
            depletionTicks) *
          100;

        if (currentAction.ticksRemaining <= 1) {
          // Client-side prediction ends.
          // We rely on server for rewards (xp, inventory) and world state updates.
          // Just clear the action.
          set({ currentAction: null });
        } else {
          const newObjects = [...worldObjects];
          newObjects[objIndex] = {
            ...obj,
            harvestProgress: progress,
          };
          set({
            currentAction: {
              ...currentAction,
              ticksRemaining: currentAction.ticksRemaining - 1,
            },
            worldObjects: newObjects,
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
      isLoaded: true,
    });
  },

  setLoaded: (loaded) => set({ isLoaded: loaded }),
}));
