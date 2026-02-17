# WebScape - Project Instructions

## Always Reference These Files

Before making any changes or answering questions about this project, always reference:
- **SPEC.md** - Game specifications and features
- **SYSTEM_DESIGN.md** - Architecture blueprint and technical decisions

These files define what we're building and how. Keep them updated as the project evolves.

## Project Structure

```
C:\Work\Projects\Project\
├── src/
│   ├── data/                    # Shared game config
│   │   ├── items.ts            # Item definitions
│   │   ├── skills.ts           # Skill definitions + XP calculations
│   │   └── objects.ts          # World object definitions (rocks, trees)
│   │
│   ├── shared/types/          # Shared TypeScript interfaces
│   │   └── index.ts
│   │
│   └── client/                 # Client-side code (Next.js)
│       ├── components/          # React components
│       │   ├── GameScene.tsx   # Three.js canvas + camera controller
│       │   ├── World.tsx       # 3D world rendering
│       │   ├── GameLoop.tsx    # Client-side tick
│       │   └── ui/              # UI components
│       │       ├── HUD.tsx      # Main HUD wrapper
│       │       ├── ChatBox.tsx  # Chat interface
│       │       ├── Sidebar.tsx # Right sidebar + icon grid
│       │       └── Minimap.tsx  # Canvas minimap
│       ├── stores/             # Zustand state
│       │   ├── gameStore.ts     # Main game state
│       │   └── uiStore.ts       # UI state (tabs, etc)
│       └── lib/
│           └── clientDb.ts      # IndexedDB for settings
│
├── server/                     # Server-side (standalone, runs on port 3001)
│   ├── index.ts                # Entry point, Socket.IO setup
│   ├── types.ts                # Server interfaces (Player, WorldObject, etc)
│   ├── config.ts               # Server config (WORLD_SIZE, OBJECTS_CONFIG)
│   ├── database.ts             # Prisma SQLite client
│   ├── world.ts                # World state management
│   ├── collision.ts            # CollisionManager (grid-based blocking)
│   ├── pathfinder.ts           # A* pathfinding algorithm
│   ├── players.ts              # Player session management
│   ├── tick.ts                 # 600ms tick loop
│   └── actions/
│       ├── movement.ts          # Movement logic (path-based)
│       └── harvest.ts           # Harvesting logic
│
├── prisma/
│   └── server.schema.prisma    # Server database schema (Player, Inventory, Skills, etc)
│
├── app/                        # Next.js app (runs on port 3000)
│   ├── page.tsx               # Main game page with login + UI
│   ├── layout.tsx
│   └── globals.css
│
├── SPEC.md                     # Game specifications
├── SYSTEM_DESIGN.md            # Architecture blueprint
└── AGENTS.md                   # This file
```

## Key Architecture Decisions

1. **Server-authoritative**: Server handles all game logic; client is "dumb visualizer"
2. **600ms tick-based**: Server tick runs every 600ms
3. **Socket.IO multiplayer**: Real-time communication
4. **Three.js 3D rendering**: 3D browser game
5. **Client/Server separation**: Can run independently

## Databases

- **Server** (`server/database.ts`): SQLite via Prisma (`prisma/server.db`)
  - Persists: Player position, inventory, skills, equipment
  - Load on join, save on disconnect
  
- **Client** (`src/client/lib/clientDb.ts`): IndexedDB
  - Per-account settings: Camera angle, zoom level, UI preferences

## Game Config

All game configuration is in `src/data/`:
- `game.ts` - Game name and settings
- `items.ts` - Item definitions
- `skills.ts` - Skill definitions
- `objects.ts` - World object definitions

## Running the Project

```bash
# Terminal 1: Start server (port 3001)
npx tsx server/index.ts

# Terminal 2: Start client (port 3000)
npm run dev
```

## Current Features

- ✅ 3D world with rocks and trees
- ✅ Player movement (click to move with A* pathfinding)
- ✅ Diagonal movement support
- ✅ Collision detection (world objects block tiles)
- ✅ Resource harvesting (click adjacent resources)
- ✅ Multiplayer (Socket.IO)
- ✅ Position persistence (SQLite)
- ✅ Camera settings persistence (IndexedDB)
- ✅ Inventory system
- ✅ Skills with XP
- ✅ Basic UI (sidebar with tabs)

## Known Issues / TODO

- ❌ Player-to-player collision exists (should be removed)

## Pathfinding System

### CollisionManager (`server/collision.ts`)
- Grid-based blocking system where each tile (x, y) has a `isBlocked` boolean
- Dynamic updates: Active world objects block tiles, depleted objects don't
- `getNeighbors()` returns adjacent tiles with diagonal support

### Pathfinder (`server/pathfinder.ts`)
- A* algorithm with Manhattan distance heuristic
- `findPath(start, end)` - Returns array of {x, y} steps
- `findNearestAccessibleTile()` - Finds closest walkable tile to blocked target
- Diagonal movement: Valid if both corner tiles are unblocked

### Movement Flow
1. Player clicks target tile → Server calculates A* path
2. Each 600ms tick → Player moves to next path tile
3. If target is a resource → Pathfinding finds nearest adjacent tile
4. Diagonal moves are valid if the diagonal path is clear

## Camera Controls

- Middle mouse = orbit
- Arrow keys = orbit
- Scroll = zoom

## UI Layout (app/page.tsx)

The current UI uses a flexbox layout:
- Left: Game canvas (flex-1)
- Right: Sidebar (w-72) with:
  - Top: Tab buttons (Inventory, Stats, Equip)
  - Middle: Tab content
  - Bottom: Chat + input

## Socket Events

**Client → Server:**
- `join` - Player joins
- `move-to` - Player clicks to move
- `harvest` - Player clicks resource
- `chat` - Player sends message

**Server → Client:**
- `init` - Initial game state
- `world-update` - Resource states changed
- `players-update` - All players (for rendering others)
- `position-update` - Own position updated
- `inventory-update` - Inventory changed
- `chat` - Messages
