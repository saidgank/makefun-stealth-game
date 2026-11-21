// player.js — the intruder: WASD/arrows to walk, Shift to sneak (slower, but
// the detection meter fills at half rate), and a pocketful of coins to throw.

import {
  PLAYER_RADIUS, PLAYER_SPEED, PLAYER_SNEAK_SPEED, COIN_COUNT,
} from './config.js';
import { moveBody, tileCenter } from './bodies.js';
import { findTile } from './levels.js';

export class Player {
  constructor(level) {
    const [c, r] = findTile(level, 'P');
    const [x, y] = tileCenter(c, r);
    this.x = x;
    this.y = y;
    this.r = PLAYER_RADIUS;
    this.facing = -Math.PI / 2;
    this.coins = COIN_COUNT;
    this.sneak = false;
    this.moving = false;
    this.stepPhase = 0;
  }

  update(level, dt, vec, sneak) {
    this.sneak = sneak;
    this.moving = vec.x !== 0 || vec.y !== 0;
    if (!this.moving) return;
    this.facing = Math.atan2(vec.y, vec.x);
    const speed = sneak ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
    moveBody(level, this, vec.x * speed * dt, vec.y * speed * dt);
    this.stepPhase += dt * (sneak ? 5 : 8);
  }
}
