# WebScape - Project Specification

## 1. Core Architecture Philosophy

### 1.1 Server-Authoritative Model
- **Client is a "dumb" visualizer** - It sends inputs to the server, receives state updates, and renders
- **All game logic runs on the server** - XP calculation, inventory checks, movement validation, combat, actions
- **Client never makes game decisions** - It only displays what the server tells it to

### 1.2 Tick-Synchronized Engine
- **Global heartbeat: 600ms per tick**
- All state changes happen on the tick
- Client prediction is minimal - mostly for smooth visual feedback like camera controls

### 1.3 Separation of Concerns
```
/data/        - Pure Config: Items, Skills, Objects (JSON-like configs)
/shared/      - Types: Interfaces used by both server and client
/client/      - Three.js: Rendering, Input, Camera, UI
/server/      - Game Logic: Tick loop, Actions, Pathfinding
```

---

## 2. Folder Structure

```
WebScape/
├── src/
│   ├── data/                    # Pure configuration data
│   │   ├── game.ts             # Game name and settings
│   │   ├── items.ts            # Item definitions
│   │   ├── skills.ts           # Skill definitions + XP calculations
│   │   └── objects.ts          # World object definitions
│   │
│   ├── shared/
│   │   └── types/
│   │       └── index.ts        # Shared interfaces
│   │
│   └── client/                 # Browser/Three.js
│       ├── components/         # React components
│       │   ├── GameScene.tsx  # Three.js canvas
│       │   ├── World.tsx      # 3D world rendering
│       │   ├── GameLoop.tsx   # Client tick
│       │   ├── players/       # Player rendering
│       │   └── ui/            # UI components
│       ├── stores/            # Zustand state
│       │   ├── gameStore.ts  # Main game state
│       │   └── uiStore.ts   # UI state
│       └── lib/              # Client utilities
│           ├── clientDb.ts   # IndexedDB
│           └── facing.ts    # Facing utilities
│
├── server/                     # Server-side
│   ├── index.ts               # Entry point
│   ├── tick.ts               # 600ms tick loop
│   ├── config.ts              # Server config
│   ├── types.ts               # Server interfaces
│   ├── database.ts            # Prisma client
│   ├── world.ts              # World management
│   ├── collision.ts           # Collision system
│   ├── pathfinder.ts          # A* pathfinding
│   ├── facing.ts             # Facing utilities
│   ├── players.ts            # Player management
│   └── actions/
│       ├── movement.ts       # Movement logic
│       └── harvest.ts        # Harvesting logic
│
├── prisma/
│   └── server.schema.prisma  # Database schema
│
└── app/                      # Next.js
    ├── page.tsx             # Main game page
    ├── layout.tsx
    └── globals.css
```

---

## 3. Data Layer (`src/data/`)

### Principles
- **Pure data** - No logic, just definitions
- **Declarative** - Easy to add new content
- **Type-safe** - Full TypeScript interfaces

### Items (`items.ts`)
```typescript
export const ITEMS = {
  bronze_pickaxe: {
    id: 'bronze_pickaxe',
    name: 'Bronze Pickaxe',
    stackable: false,
    toolType: 'pickaxe' as const,
    toolTier: 1,
  },
  copper_ore: {
    id: 'copper_ore',
    name: 'Copper Ore',
    stackable: true,
  },
} as const;
```

---

## 4. Server Layer (`server/`)

### Principles
- **Server-authoritative** - All game logic lives here
- **Tick-driven** - Everything synchronizes to 600ms
- **Event-based** - Actions trigger events, events trigger state changes

### Core Components

#### Tick Loop (`tick.ts`)
```typescript
// Runs every 600ms
function tick() {
  processHarvests();
  processPlayerMovements();
  broadcastState();
}
```

#### Player Management (`players.ts`)
- Tracks all connected players
- Manages player state (position, facing, inventory)
- Handles movement and targeting

#### World Management (`world.ts`)
- Tracks all world objects (rocks, trees)
- Manages depletion/respawn timers
- Provides collision checking

---

## 5. Shared Layer (`src/shared/`)

### Principles
- **Zero dependencies** - No Node.js or Browser-specific code
- **Type-safe** - Complete TypeScript definitions

### Core Types
```typescript
interface Position {
  x: number;
  y: number;
}

type FacingDirection = 'north' | 'south' | 'east' | 'west' | 
                       'northeast' | 'northwest' | 'southeast' | 'southwest';

interface Player {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
  inventory: Record<string, number>;
}

interface WorldObjectState {
  position: { x: number; y: number };
  definitionId: string;
  status: 'active' | 'depleted';
  ticksUntilRespawn: number;
}
```

---

## 6. Client Layer (`src/client/`)

### Principles
- **Stateless rendering** - Receives state, renders it
- **Minimal prediction** - Only for camera smoothness
- **Input forwarder** - Sends actions to server, doesn't execute them

### State Management
- Use Zustand for client-side state
- State synced from server via WebSocket
- Local state for UI (active tab, camera position)

---

## 7. Communication Protocol

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ username: string }` | Player joins |
| `move-to` | `{ x: number, y: number }` | Request movement |
| `harvest` | `{ x, y, objectId }` | Harvest resource |
| `chat` | `{ message: string }` | Send chat |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{ playerId, worldObjects, players }` | Initial state |
| `world-update` | `WorldObject[]` | World state |
| `players-update` | `Player[]` | Other players |
| `position-update` | `{ x, y, facing }` | Own position |
| `inventory-update` | `Record<string, number>` | Inventory |
| `chat` | `{ username, message, type }` | Chat message |

---

## 8. Tick Synchronization

### Server Tick (600ms)
1. Process pending harvests
2. Process player movements (1 tile per tick)
3. Check resource depletion/respawn
4. Broadcast state to all clients

### Client Rendering
- 60fps for smooth camera/movement
- Updates state on each socket event

---

## 9. Code Style Rules

### Do's
- ✅ Use strict TypeScript
- ✅ Define types in `/shared/`
- ✅ Keep components small and focused
- ✅ Use meaningful variable names

### Don'ts
- ❌ Don't put game logic in client
- ❌ Don't skip type definitions
- ❌ Don't use `any` unless absolutely necessary
- ❌ Don't duplicate code

---

## 10. Future Features

- Combat System
- Quest System
- Banking
- Trading
- Clans

---

*Document Version: 2.0*
*Last Updated: 2026-02-17*
