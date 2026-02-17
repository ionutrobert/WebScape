# WebScape - Project Specification & Standards Document

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
/engine/       - Server Core: Tick loop, Action Resolver, World Manager  
/client/       - Three.js: Rendering, Input, Camera
/shared/       - Types & Utilities: Used by both server and client
```

---

## 2. Folder Structure

```
openscape/
├── src/
│   ├── data/                    # Pure configuration data
│   │   ├── items.ts            # Item definitions
│   │   ├── skills.ts           # Skill definitions  
│   │   └── objects.ts          # World object definitions
│   │
│   ├── engine/                  # Server-side game logic
│   │   ├── index.ts            # Main server entry
│   │   ├── tick.ts            # The 600ms tick loop
│   │   ├── world.ts           # World state management
│   │   ├── actions/           # Action handlers
│   │   │   ├── movement.ts    # Movement logic
│   │   │   ├── harvest.ts    # Mining/Woodcutting
│   │   │   └── combat.ts      # Combat (future)
│   │   └── players.ts         # Player session management
│   │
│   ├── client/                 # Browser/Three.js
│   │   ├── app/               # Next.js pages
│   │   │   └── page.tsx      
│   │   ├── components/        # React components
│   │   │   ├── GameScene.tsx
│   │   │   ├── World.tsx
│   │   │   └── UI/
│   │   └── stores/            # Client state (Zustand)
│   │
│   └── shared/                # Shared types & utils
│       ├── types/
│       │   └── index.ts        # All interfaces
│       └── utils/
│           └── xp.ts           # XP calculations
│
├── server/                     # Server entry point (simplified)
│   └── index.ts
│
└── config/                    # Additional configs
    └── skills.config.ts
```

---

## 3. Data Layer (`/data/`)

### Principles
- **Pure data** - No logic, just definitions
- **Declarative** - Easy to add new content
- **Type-safe** - Full TypeScript interfaces

### Example: items.ts
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

export type ItemId = keyof typeof ITEMS;
```

---

## 4. Engine Layer (`/engine/`)

### Principles
- **Server-authoritative** - All game logic lives here
- **Tick-driven** - Everything synchronizes to 600ms
- **Event-based** - Actions trigger events, events trigger state changes

### Core Components

#### 4.1 Tick Loop (`tick.ts`)
```typescript
// Runs every 600ms
function tick() {
  processPlayerMovements();
  processActions();
  processWorldRespawns();
  broadcastState();
}
```

#### 4.2 Action Resolver
- Validates player actions (distance, requirements)
- Queues actions to execute on tick
- Awards XP and items upon completion

#### 4.3 World Manager
- Tracks all world objects (rocks, trees)
- Manages depletion/respawn timers
- Validates collision

---

## 5. Shared Layer (`/shared/`)

### Principles
- **Zero dependencies** - No Node.js or Browser-specific code
- **Type-safe** - Complete TypeScript definitions
- **Immutable** - Read-only data structures

### Core Types
```typescript
// Player state (server-side)
interface Player {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: 'north' | 'south' | 'east' | 'west';
  inventory: Record<string, number>;
  skills: Record<SkillKey, number>;
}

// World object state
interface WorldObject {
  position: { x: number; y: number };
  definitionId: string;
  status: 'active' | 'depleted';
  ticksUntilRespawn: number;
}

// Network messages
interface ServerToClient {
  type: 'state-update' | 'player-joined' | 'inventory-update';
  payload: any;
}

interface ClientToServer {
  type: 'join' | 'move-to' | 'harvest' | 'chat';
  payload: any;
}
```

---

## 6. Client Layer (`/client/`)

### Principles
- **Stateless rendering** - Receives state, renders it
- **Optimistic UI** - Minor client-side prediction for smoothness
- **Input forwarder** - Sends actions to server, doesn't execute them

### State Management
- Use Zustand for client-side state
- State synced from server via WebSocket
- Local state for UI (active tab, camera position)

---

## 7. Naming Conventions

### Files
- `camelCase.ts` for utilities
- `PascalCase.tsx` for React components
- `kebab-case.ts` for config files

### Variables
- `camelCase` for variables and functions
- `PascalCase` for Types and Interfaces
- `UPPER_SNAKE_CASE` for constants

### Components
- `GameScene.tsx` - Main 3D canvas
- `World.tsx` - Renders game world
- `CameraController.tsx` - Camera logic
- `UI/` - Sidebar components

---

## 8. Communication Protocol

### Client → Server Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ username: string }` | Player joins |
| `move-to` | `{ x: number, y: number }` | Request movement |
| `harvest` | `{ x, y, objectId }` | Harvest resource |
| `chat` | `{ message: string }` | Send chat |

### Server → Client Events
| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{ playerId, worldObjects }` | Initial state |
| `world-update` | `WorldObject[]` | World state |
| `players-update` | `Player[]` | Other players |
| `inventory-update` | `Record<string, number>` | Player inventory |
| `chat` | `{ username, message, type }` | Chat message |

---

## 9. Tick Synchronization

### Server Tick (600ms)
1. Process pending movements (1 tile per tick)
2. Process action progress
3. Check resource depletion
4. Process respawns
5. Broadcast state to all clients

### Client Rendering
- 60fps for smooth camera/movement
- Interpolates player positions between ticks
- Updates world state on each `world-update`

---

## 10. Code Style Rules

### Do's
- ✅ Use strict TypeScript
- ✅ Define types in `/shared/`
- ✅ Keep components small and focused
- ✅ Use meaningful variable names
- ✅ Comment complex logic

### Don'ts
- ❌ Don't put game logic in client
- ❌ Don't skip type definitions
- ❌ Don't use `any` unless absolutely necessary
- ❌ Don't duplicate code - extract to shared utilities
- ❌ Don't make server wait for client

---

## 11. Future Scalability

### Planned Features
- **Combat System** - Melee/ranged combat with damage calculation
- **Quest System** - Quest definitions and tracking
- **Banking** - Bank inventory storage
- **Trading** - Player-to-player trading
- **Clans** - Group social systems

### Adding New Content
1. Add definition to `/data/`
2. Add logic to `/engine/`
3. Add renderer to `/client/`
4. Types automatically shared

---

*Document Version: 1.0*
*Last Updated: 2026-02-17*
