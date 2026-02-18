export interface Position {
  x: number;
  y: number;
}

export class CollisionManager {
  private width: number;
  private height: number;
  private blocked: boolean[][];
  private staticObstacles: boolean[][];

  constructor(width: number, height: number, staticObstacles?: { x: number; y: number }[]) {
    this.width = width;
    this.height = height;
    this.blocked = Array.from({ length: height }, () => Array(width).fill(false));
    this.staticObstacles = Array.from({ length: height }, () => Array(width).fill(false));

    if (staticObstacles) {
      for (const obs of staticObstacles) {
        if (this.isInBounds(obs.x, obs.y)) {
          this.staticObstacles[obs.y][obs.x] = true;
          this.blocked[obs.y][obs.x] = true;
        }
      }
    }
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isBlocked(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return true;
    return this.blocked[y][x];
  }

  setBlocked(x: number, y: number, blocked: boolean): void {
    if (this.isInBounds(x, y)) {
      this.blocked[y][x] = blocked;
    }
  }

  getNeighbors(x: number, y: number, allowDiagonals: boolean = true): Position[] {
    const neighbors: Position[] = [];
    const directions = allowDiagonals
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

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (allowDiagonals && Math.abs(dir.dx) + Math.abs(dir.dy) === 2) {
        if (!this.isBlocked(x + dir.dx, y) && !this.isBlocked(x, y + dir.dy)) {
          if (!this.isBlocked(nx, ny)) {
            neighbors.push({ x: nx, y: ny });
          }
        }
      } else {
        if (!this.isBlocked(nx, ny)) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }

    return neighbors;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getBlockedMap(): boolean[][] {
    return this.blocked.map(row => [...row]);
  }
}
