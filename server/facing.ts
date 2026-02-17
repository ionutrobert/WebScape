export function calculateFacing(fromX: number, fromY: number, toX: number, toY: number): string {
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (dx === 0 && dy === 0) {
    return 'south';
  }

  if (dx > 0 && dy < 0) return 'northeast';
  if (dx > 0 && dy === 0) return 'east';
  if (dx > 0 && dy > 0) return 'southeast';
  if (dx === 0 && dy > 0) return 'south';
  if (dx < 0 && dy > 0) return 'southwest';
  if (dx < 0 && dy === 0) return 'west';
  if (dx < 0 && dy < 0) return 'northwest';
  if (dx === 0 && dy < 0) return 'north';
  
  return 'south';
}
