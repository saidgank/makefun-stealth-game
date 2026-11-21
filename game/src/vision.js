// vision.js — how guards see: exact grid raycasts (Amanatides & Woo DDA) so a
// vision cone stops dead at the first wall, crate or desk, and a sight line to
// the player is blocked by the same cover. No sampling, no leaks at corners.

import { TILE } from './config.js';
import { blocksSight } from './levels.js';

// rayDistance marches a ray through the tile grid and returns the distance to
// the first sight-blocking tile, or maxDist when nothing blocks it that far.
export function rayDistance(level, ox, oy, dx, dy, maxDist) {
  let col = Math.floor(ox / TILE);
  let row = Math.floor(oy / TILE);
  const stepCol = dx > 0 ? 1 : -1;
  const stepRow = dy > 0 ? 1 : -1;
  const tDeltaCol = dx !== 0 ? Math.abs(TILE / dx) : Infinity;
  const tDeltaRow = dy !== 0 ? Math.abs(TILE / dy) : Infinity;
  let tMaxCol = dx !== 0
    ? ((dx > 0 ? (col + 1) * TILE - ox : ox - col * TILE) / Math.abs(dx))
    : Infinity;
  let tMaxRow = dy !== 0
    ? ((dy > 0 ? (row + 1) * TILE - oy : oy - row * TILE) / Math.abs(dy))
    : Infinity;
  let t = 0;
  for (let i = 0; i < 64; i++) {
    if (tMaxCol < tMaxRow) {
      t = tMaxCol;
      tMaxCol += tDeltaCol;
      col += stepCol;
    } else {
      t = tMaxRow;
      tMaxRow += tDeltaRow;
      row += stepRow;
    }
    if (t > maxDist) return maxDist;
    if (blocksSight(level, col, row)) return t;
  }
  return maxDist;
}

// conePolygon returns the visible fan of a guard's cone as canvas points:
// the guard's position followed by one point per ray along the cone's arc.
export function conePolygon(level, ox, oy, facing, halfAngle, range, steps = 40) {
  const pts = [[ox, oy]];
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / steps;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = rayDistance(level, ox, oy, dx, dy, range);
    pts.push([ox + dx * d, oy + dy * d]);
  }
  return pts;
}

// canSee is the gameplay test: is the target inside the cone's range and
// angle, with no cover between the guard and the target?
export function canSee(level, gx, gy, facing, tx, ty, range, halfAngle) {
  const dx = tx - gx;
  const dy = ty - gy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, dist };
  let diff = Math.atan2(dy, dx) - facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > halfAngle) return { seen: false, dist };
  const wallDist = rayDistance(level, gx, gy, dx / dist, dy / dist, range);
  return { seen: wallDist >= dist - 6, dist };
}

// pointInConeShape is a cheap geometric test (no raycast) used for soft
// effects such as the player's "watched" rim light.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}
