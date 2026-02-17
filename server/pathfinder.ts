import { Position, CollisionManager } from './collision';

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export class Pathfinder {
  private collisionManager: CollisionManager;

  constructor(collisionManager: CollisionManager) {
    this.collisionManager = collisionManager;
  }

  private heuristic(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private getKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  findPath(
    start: Position,
    end: Position,
    allowDiagonals: boolean = true,
    maxSteps: number = 100
  ): Position[] {
    if (!this.collisionManager.isInBounds(end.x, end.y)) {
      return [];
    }

    if (this.collisionManager.isBlocked(start.x, start.y)) {
      return [];
    }

    if (start.x === end.x && start.y === end.y) {
      return [];
    }

    const openSet: Node[] = [];
    const closedSet = new Set<string>();
    const openSetMap = new Map<string, Node>();

    const startNode: Node = {
      x: start.x,
      y: start.y,
      g: 0,
      h: this.heuristic(start, end),
      f: this.heuristic(start, end),
      parent: null,
    };

    openSet.push(startNode);
    openSetMap.set(this.getKey(start.x, start.y), startNode);

    let iterations = 0;
    while (openSet.length > 0 && iterations < maxSteps * 10) {
      iterations++;

      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = this.getKey(current.x, current.y);
      openSetMap.delete(currentKey);

      if (current.x === end.x && current.y === end.y) {
        const path: Position[] = [];
        let node: Node | null = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return path.slice(1, maxSteps + 1);
      }

      closedSet.add(currentKey);

      const neighbors = this.collisionManager.getNeighbors(current.x, current.y, allowDiagonals);

      for (const neighbor of neighbors) {
        const neighborKey = this.getKey(neighbor.x, neighbor.y);

        if (closedSet.has(neighborKey)) {
          continue;
        }

        const isDiagonal =
          Math.abs(neighbor.x - current.x) + Math.abs(neighbor.y - current.y) === 2;
        const moveCost = isDiagonal ? 1.4 : 1;

        const tentativeG = current.g + moveCost;

        let neighborNode = openSetMap.get(neighborKey);

        if (!neighborNode) {
          neighborNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.heuristic(neighbor, end),
            f: 0,
            parent: current,
          };
          neighborNode.f = neighborNode.g + neighborNode.h;
          openSet.push(neighborNode);
          openSetMap.set(neighborKey, neighborNode);
        } else if (tentativeG < neighborNode.g) {
          neighborNode.g = tentativeG;
          neighborNode.f = neighborNode.g + neighborNode.h;
          neighborNode.parent = current;
        }
      }
    }

    return [];
  }

  findNearestAccessibleTile(
    start: Position,
    targetTiles: Position[],
    allowDiagonals: boolean = true
  ): Position | null {
    let nearest: Position | null = null;
    let nearestDist = Infinity;

    const adjacentOffsets = allowDiagonals
      ? [
          { dx: 0, dy: -1 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: -1 },
          { dx: 1, dy: 1 },
          { dx: -1, dy: 1 },
          { dx: -1, dy: -1 },
        ]
      : [
          { dx: 0, dy: -1 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
        ];

    for (const target of targetTiles) {
      for (const offset of adjacentOffsets) {
        const adjX = target.x + offset.dx;
        const adjY = target.y + offset.dy;

        if (
          this.collisionManager.isInBounds(adjX, adjY) &&
          !this.collisionManager.isBlocked(adjX, adjY)
        ) {
          const dist = this.heuristic(start, { x: adjX, y: adjY });
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = { x: adjX, y: adjY };
          }
        }
      }
    }

    return nearest;
  }
}
