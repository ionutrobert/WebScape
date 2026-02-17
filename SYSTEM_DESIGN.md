# WebScape - System Design Document

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Three.js    │  │ React UI    │  │ Zustand Store       │  │
│  │ 3D Render  │  │ Sidebar     │  │ Local State         │  │
│  └──────┬──────┘  └──────┬─────┘  └─────────┬─────────┘  │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           │ Socket.IO                         │
└───────────────────────────┼───────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────┐
│                      SERVER (Node.js)                           │
│                           │                                     │
│  ┌─────────────┐  ┌───────┴───────┐  ┌──────────────────┐    │
│  │ Tick Loop  │  │ Actions       │  │ World Manager    │    │
│  │ 600ms     │  │ Movement/Harv │  │ Objects/Players │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Socket.IO Server                        │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────┐
│                     DATABASE (SQLite)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ Players  │  │ Inventory│  │ Skills   │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
WebScape/
├── src/
│   ├── data/                    # Game configuration
│   │   ├── game.ts             # Game settings
│   │   ├── items.ts            # Item definitions
│   │   ├── skills.ts           # Skill definitions + XP
│   │   └── objects.ts          # World object definitions
│   │
│   ├── shared/
│   │   └── types/
│   │       └── index.ts        # Shared interfaces
│   │
│   └── client/
│       ├── components/         # React components
│       │   ├── GameScene.tsx  # Three.js canvas
│       │   ├── World.tsx       # 3D world
│       │   ├── GameLoop.tsx   # Client tick
│       │   ├── players/       # Player rendering
│       │   └── ui/            # UI components
│       ├── stores/            # Zustand stores
│       │   ├── gameStore.ts  # Main game state
│       │   └── uiStore.ts   # UI state
│       └── lib/              # Utilities
│           ├── clientDb.ts   # IndexedDB
│           └── facing.ts     # Facing utilities
│
├── server/                     # Game server
│   ├── index.ts              # Entry point
│   ├── tick.ts              # 600ms tick loop
│   ├── config.ts            # Server config
│   ├── types.ts             # Server types
│   ├── database.ts          # Prisma client
│   ├── world.ts            # World management
│   ├── collision.ts        # Collision system
│   ├── pathfinder.ts       # A* pathfinding
│   ├── facing.ts          # Facing utilities
│   ├── players.ts         # Player management
│   └── actions/
│       ├── movement.ts    # Movement logic
│       └── harvest.ts     # Harvesting logic
│
├── prisma/
│   └── server.schema.prisma  # Database schema
│
└── app/                      # Next.js
    ├── page.tsx            # Main page
    ├── layout.tsx
    └── globals.css
```

---

## 3. Core Systems

### 3.1 Tick System (600ms)

```typescript
function tick() {
  // 1. Process harvests
  processHarvests();
  
  // 2. Process player movements
  for (const player of playerManager.getAll()) {
    const result = processMovement(player.id);
    if (result?.moved) {
      io.to(player.id).emit('position-update', { 
        x: result.newX, 
        y: result.newY,
        facing: player.facing 
      });
    }
  }
  
  // 3. Broadcast players
  broadcastPlayers();
  
  // 4. Broadcast world if changed
  if (worldChanged) {
    broadcastWorld();
  }
}
```

### 3.2 Pathfinding

**CollisionManager** - Grid-based blocking
- Each tile has `isBlocked` boolean
- Active world objects block tiles
- Depleted objects don't block

**Pathfinder** - A* algorithm
- Manhattan distance heuristic
- Supports diagonal movement
- Returns array of {x, y} steps

### 3.3 Facing System

**Server** (`server/facing.ts`)
- Calculates facing from previous position to current position
- 8 directions: north, south, east, west, NE, NW, SE, SW

**Client** (`src/client/lib/facing.ts`)
- Converts facing direction to Three.js rotation angles

---

## 4. Database Schema (Prisma)

```prisma
model Player {
  id           String   @id
  username     String   @unique
  x            Int      @default(10)
  y            Int      @default(10)
  facing       String   @default("south")
  inventory    String   @default("{}")
  skills       String   @default("{}")
  equipment    String   @default("{}")
}
```

---

## 5. Network Protocol

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ username }` | Player joins |
| `move-to` | `{ x, y }` | Movement request |
| `harvest` | `{ x, y, objectId }` | Harvest resource |
| `chat` | `{ message }` | Send message |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{ playerId, worldObjects, players }` | Initial state |
| `world-update` | `WorldObject[]` | Resource states |
| `players-update` | `Player[]` | All players |
| `position-update` | `{ x, y, facing }` | Own position |
| `inventory-update` | `Record<string, number>` | Inventory |
| `chat` | `{ username, message, type }` | Chat message |

---

## 6. Camera System

```typescript
interface CameraState {
  theta: number;    // Horizontal rotation
  phi: number;      // Vertical rotation
  distance: number; // Zoom level
}

// Controls
// - Middle mouse: orbit
// - Arrow keys: orbit  
// - Scroll: zoom
```

---

## 7. Client State (Zustand)

```typescript
interface GameState {
  // Connection
  playerId: string | null;
  username: string | null;
  
  // Player
  position: { x: number; y: number };
  facing: FacingDirection;
  isMoving: boolean;
  
  // Inventory
  inventory: (InventorySlot | null)[];
  equipment: Record<string, string | null>;
  
  // Skills
  xp: Record<SkillKey, number>;
  
  // World
  worldObjects: WorldObjectState[];
  players: Record<string, Player>;
  
  // UI
  uiTab: 'inventory' | 'skills' | 'equipment';
  chatLog: string[];
  camera: CameraState;
}
```

---

## 8. Future Features

- Combat System (melee/ranged)
- Quest System
- Banking
- Player Trading
- Clans/Groups

---

*Document Version: 2.0*
*Architecture: Server-Authoritative MMORPG*
*Tick Rate: 600ms*
