// bodies.js — circle bodies against the tile grid: axis-separated movement so
// a body slides along a wall instead of sticking to it. Shared by the player
// and every guard.

import { TILE } from './config.js';
import { blocksMove } from './levels.js';

function circleHits(level, x, y, r) {
  const c0 = Math.floor((x - r) / TILE);
  const c1 = Math.floor((x + r) / TILE);
  const r0 = Math.floor((y - r) / TILE);
  const r1 = Math.floor((y + r) / TILE);
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      if (!blocksMove(level, col, row)) continue;
      const nx = Math.max(col * TILE, Math.min(x, col * TILE + TILE));
      const ny = Math.max(row * TILE, Math.min(y, row * TILE + TILE));
      const dx = x - nx;
      const dy = y - ny;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

// moveBody tries the x axis, then the y axis, keeping whichever does not
// collide; body is {x, y, r} in pixels and is updated in place.
export function moveBody(level, body, dx, dy) {
  if (dx !== 0 && !circleHits(level, body.x + dx, body.y, body.r)) body.x += dx;
  if (dy !== 0 && !circleHits(level, body.x, body.y + dy, body.r)) body.y += dy;
}

// tileOf returns the [col,row] a pixel point stands on.
export function tileOf(x, y) {
  return [Math.floor(x / TILE), Math.floor(y / TILE)];
}

export function tileCenter(col, row) {
  return [col * TILE + TILE / 2, row * TILE + TILE / 2];
}
