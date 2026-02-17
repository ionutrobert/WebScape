# WebScape - System Design Document

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Three.js    │  │ React UI    │  │ Zustand Store      │  │
│  │ 3D Render  │  │ Sidebar     │  │ Local State       │  │
│  └──────┬──────┘  └──────┬─────┘  └─────────┬─────────┘  │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           │ Socket.IO                       │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                      SERVER (Node.js)                         │
│                           │                                   │
│  ┌─────────────┐  ┌───────┴───────┐  ┌──────────────────┐  │
│  │ Tick Loop  │  │ Action       │  │ World Manager    │  │
│  │ 600ms     │  │ Resolver     │  │ Objects/Players │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Socket.IO Server                       │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                     DATABASE (SQLite)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Players  │  │ Inventory│  │ Skills   │  │ Bank       │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
openscape/
├── prisma/
│   └── schema.prisma          # Database schema
│
├── src/
│   ├── shared/
│   │   ├── types.ts          # All interfaces
│   │   ├── config/            # Item/Skill registries
│   │   │   ├── items.ts
│   │   │   ├── skills.ts
│   │   │   └── objects.ts
│   │   └── utils/
│   │       └── xp.ts
│   │
│   ├── server/
│   │   ├── index.ts          # Socket.IO server entry
│   │   ├── tick.ts          # 600ms tick loop
│   │   ├── world.ts         # World state management
│   │   └── actions/        # Action handlers
│   │       ├── movement.ts
│   │       ├── harvest.ts
│   │       └── combat.ts
│   │
│   └── client/
│       ├── app/
│       │   └── page.tsx
│       ├── components/
│       │   ├── 3d/
│       │   │   ├── GameScene.tsx
│       │   │   ├── World.tsx
│       │   │   ├── Player.tsx
│       │   │   ├── OtherPlayer.tsx
│       │   │   ├── Resource.tsx
│       │   │   └── CameraController.tsx
│       │   └── ui/
│       │       ├── Sidebar.tsx
│       │       ├── Inventory.tsx
│       │       ├── Skills.tsx
│       │       └── Chat.tsx
│       ├── hooks/
│       │   ├── useSocket.ts
│       │   ├── useMovement.ts
│       │   ├── useCamera.ts
│       │   └── useInventory.ts
│       └── state/
│           └── gameStore.ts
│
└── server/
    └── index.ts              # Game server entry
```

---

## 3. Data Schema

### A. Item Properties

```typescript
// Item Definition (Static Data)
interface ItemDefinition {
  id: string;                    // Unique identifier (e.g., "bronze_pickaxe")
  name: string;                  // Display name
  description?: string;         // Item description
  
  // Stack & Trade
  stackable: boolean;            // Can stack in inventory
  tradable: boolean;             // Can trade with players
  value: number;                 // GE value (if tradable)
  maxStack?: number;             // Max stack size (default: infinity)
  
  // Requirements
  requirements?: {              // Level/quest requirements
    skill?: SkillKey;
    level?: number;
    quest?: string;
  }[];
  
  // Actions available on item
  actions?: ItemAction[];       // ['Equip', 'Use', 'Drop', 'Eat']
  
  // Equipment (if equippable)
  equipmentSlot?: EquipmentSlot; // 'head' | 'cape' | 'neck' | 'weapon' | 'body' | 'legs' | 'hands' | 'feet' | 'ring'
  
  // Tool properties (if tool)
  toolCategory?: ToolCategory;   // 'pickaxe' | 'axe' | 'chisel' | 'none'
  toolTier?: number;             // 1-10 tier for efficiency
  
  // Combat (if weapon)
  weaponType?: WeaponType;     // 'unarmed' | 'sword' | 'axe' | 'mace' | 'magic'
  weaponSpeed?: number;         // Attack speed (ticks)
  weaponAccuracy?: number;      // Attack bonus
  weaponDamage?: number;        // Damage range
  
  // Food/Potion (if consumable)
  effects?: ConsumableEffect[]; // Health restore, etc.
  
  // Model/Visual
  modelId?: string;             // 3D model identifier
  iconId?: string;              // UI icon identifier
}

type ItemAction = 'Equip' | 'Unequip' | 'Use' | 'Drop' | 'Eat' | 'Drink' | 'Open';
type EquipmentSlot = 'head' | 'cape' | 'neck' | 'weapon' | 'body' | 'legs' | 'hands' | 'feet' | 'ring' | 'ammo';
type ToolCategory = 'pickaxe' | 'axe' | 'chisel' | 'none';
type WeaponType = 'unarmed' | 'sword' | 'axe' | 'mace' | 'magic' | 'range';
```

### B. Skill System Rules

```typescript
// Skill Definition
interface SkillDefinition {
  key: SkillKey;
  name: string;
  description: string;
  
  // XP Configuration
  xpCurve: 'osrs' | 'linear' | 'custom';
  
  // Training methods
  actions: SkillAction[];
}

// XP Curve (OSRS Standard)
function xpToLevel(xp: number): number {
  let level = 1;
  let xpRequired = 0;
  while (xpRequired <= xp && level < 99) {
    xpRequired += Math.floor((level + 300) * Math.pow(2, level / 7) / 4);
    if (xpRequired <= xp) level++;
  }
  return level;
}

// Skill Action Template
interface SkillAction {
  id: string;
  name: string;                // e.g., "Mine Copper Ore"
  
  // Time to complete (in ticks, 600ms each)
  timeToComplete: number;        // e.g., 3 ticks = 1.8 seconds
  
  // Animation
  animationId?: string;
  
  // Tool requirements
  requiredToolCategory?: ToolCategory;
  minToolTier?: number;
  
  // Success rate
  successRateFormula?: string;  // e.g., "Math.min(1, level / 100)"
  
  // Rewards
  xpReward: number;
  itemRewards?: {
    itemId: string;
    quantityMin: number;
    quantityMax: number;
    chance: number;            // 0-1
  }[];
}

type SkillKey = 'attack' | 'strength' | 'defense' | 'ranged' | 'prayer' | 
                'magic' | 'runecraft' | 'construction' | 'hitpoints' |
                'agility' | 'herblore' | 'thieving' | 'crafting' | 
                'fletching' | 'slayer' | 'hunter' | 'mining' | 'woodcutting' | 
                'fishing' | 'cooking' | 'firemaking' | 'smithing';
```

### C. World Object Properties

```typescript
// World Object Definition (Static Data)
interface ObjectDefinition {
  id: string;
  name: string;                // e.g., "Copper Rock"
  type: 'resource' | 'static' | 'npc' | 'door';
  
  // Collision & Interaction
  collision: boolean;           // Blocks movement
  interactDistance: number;    // 1 = adjacent (NSEW), 1.5 = diagonal allowed
  
  // Requirements
  levelReq?: number;          // Level needed to interact
  skillReq?: SkillKey;         // Skill needed
  itemReq?: string;           // Specific item needed
  
  // Depletion (for resources)
  isDepletable: boolean;
  depletionTicks: number;       // Ticks until depleted
  respawnTicks: number;       // Ticks until respawn
  
  // Rewards
  xpGranted?: number;
  skillUsed?: SkillKey;
  resourceGiven?: string;      // Item ID given
  resourceQtyMin?: number;
  resourceQtyMax?: number;
  
  // Visual
  activeModel?: string;
  depletedModel?: string;      // Model when depleted (e.g., "stump")
}

// World Object State (Dynamic)
interface WorldObjectState {
  position: { x: number; y: number };
  definitionId: string;
  status: 'active' | 'depleted' | 'hidden';
  ticksUntilRespawn: number;
  
  // For complex objects
  state?: Record<string, any>; // Door open/closed, etc.
}
```

---

## 4. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./openscape.db"
}

// ==================== PLAYER ====================
model Player {
  id           String   @id @default(uuid())
  username     String   @unique
  createdAt    DateTime @default(now())
  lastLogin    DateTime @updatedAt
  
  // Position
  x            Int      @default(10)
  y            Int      @default(10)
  facing       String   @default("south")
  
  // Hitpoints
  hp           Int      @default(100)
  maxHp        Int      @default(100)
  
  // Energy/Run
  energy       Int      @default(100)
  
  // Bank Pin
  bankPin     String?
  
  // Relations
  skills      PlayerSkill[]
  inventory   InventorySlot[]
  bank        BankSlot[]
  equipment   Equipment?
}

model PlayerSkill {
  id        String  @id @default(uuid())
  playerId  String
  skill     String  // 'mining', 'woodcutting', etc.
  xp        Int     @default(0)
  
  player    Player  @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  @@unique([playerId, skill])
}

// ==================== INVENTORY ====================
model InventorySlot {
  id        String  @id @default(uuid())
  playerId  String
  slotIndex Int      // 0-27
  
  itemId    String
  quantity  Int      @default(1)
  
  player    Player  @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  @@unique([playerId, slotIndex])
}

// ==================== EQUIPMENT ====================
model Equipment {
  id        String  @id @default(uuid())
  playerId  String  @unique
  
  head      String?  // Item ID
  cape     String?
  neck     String?
  weapon   String?
  body     String?
  legs     String?
  hands    String?
  feet     String?
  ring     String?
  ammo     String?
  
  player    Player  @relation(fields: [playerId], references: [id], onDelete: Cascade)
}

// ==================== BANK ====================
model BankSlot {
  id        String  @id @default(uuid())
  playerId  String
  slotIndex Int      // 0-816 (max bank size)
  
  itemId   String
  quantity Int      @default(1)
  
  player   Player  @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  @@unique([playerId, slotIndex])
}

// ==================== WORLD OBJECTS ====================
// World objects are server-side only, not persisted
// They reset on server restart
```

---

## 5. Client State Structure

```typescript
// Zustand Store
interface GameState {
  // Connection
  socket: Socket | null;
  connected: boolean;
  playerId: string | null;
  
  // Player
  username: string;
  position: { x: number; y: number };
  facing: 'north' | 'south' | 'east' | 'west';
  
  // World
  worldObjects: WorldObjectState[];
  otherPlayers: OtherPlayer[];
  
  // Inventory (synced from server)
  inventory: (InventorySlot | null)[];
  
  // Equipment (synced from server)
  equipment: Equipment;
  
  // Skills (synced from server)
  skills: Record<SkillKey, number>;
  
  // UI State (local only)
  activeTab: 'inventory' | 'skills' | 'equipment' | 'bank';
  chatLog: string[];
  
  // Actions
  actions: {
    connect: () => void;
    disconnect: () => void;
    sendChat: (msg: string) => void;
    moveTo: (x: number, y: number) => void;
    harvest: (x: number, y: number, objectId: string) => void;
  };
}
```

---

## 6. Network Protocol

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ username }` | Player joins game |
| `move-to` | `{ x, y }` | Request movement to tile |
| `harvest` | `{ x, y, objectId }` | Harvest resource |
| `equip` | `{ itemId, slot }` | Equip item |
| `unequip` | `{ slot }` | Unequip item |
| `drop` | `{ slotIndex, qty }` | Drop item |
| `use` | `{ slotIndex }` | Use item (food/potion) |
| `chat` | `{ message }` | Send chat message |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{ playerId, worldObjects, skills }` | Initial game state |
| `world-update` | `{ worldObjects }` | Resource states |
| `players-update` | `{ players }` | Other player positions |
| `inventory-update` | `{ inventory }` | Your inventory |
| `equipment-update` | `{ equipment }` | Your equipment |
| `skill-update` | `{ skill, xp }` | XP gain |
| `chat` | `{ username, message, type }` | Chat message |
| `notification` | `{ type, message }` | Game notification |

---

## 7. Tick System (600ms)

```typescript
// Server Tick Loop
const TICK_MS = 600;

function tick() {
  // 1. Process pending movements
  for (const player of movingPlayers) {
    const nextStep = getNextStep(player);
    if (!isBlocked(nextStep)) {
      player.x = nextStep.x;
      player.y = nextStep.y;
    }
  }
  
  // 2. Process action progress
  for (const action of activeActions) {
    action.ticksRemaining--;
    if (action.ticksRemaining <= 0) {
      completeAction(action);
    }
  }
  
  // 3. Process world objects
  for (const obj of worldObjects) {
    if (obj.status === 'depleted') {
      obj.ticksUntilRespawn--;
      if (obj.ticksUntilRespawn <= 0) {
        obj.status = 'active';
      }
    }
  }
  
  // 4. Broadcast state
  broadcast({
    players: getAllPlayers(),
    worldObjects: getAllWorldObjects(),
  });
}

setInterval(tick, TICK_MS);
```

---

## 8. Camera System

```typescript
// Camera follows player but operates independently
interface CameraState {
  // Fixed offset from target (set when player logs in)
  offset: Vector3;        // e.g., (10, 18, 10)
  
  // Current orbit angles
  theta: number;           // Horizontal rotation
  phi: number;            // Vertical rotation
  
  // Distance from target
  distance: number;        // Zoom level
  
  // Controls
  controls: {
    middleMouse: 'orbit',   // Orbit around target
    arrowKeys: 'orbit',     // Orbit with arrows
    scrollWheel: 'zoom',   // Zoom in/out
  };
}
```

---

*Document Version: 2.0*
*Architecture: Server-Authoritative MMORPG*
*Tick Rate: 600ms*
