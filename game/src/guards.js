// guards.js — the patrol AI. A guard walks its waypoint loop, pauses at each
// post to scan the room (its cone sweeping side to side), and can be lured off
// its loop by a thrown coin: it hurries to the coin, studies it, then returns
// to the nearest post and resumes. Facing always turns at a fixed rate, so a
// cone never snaps — you can read where it will look next.

import {
  GUARD_RADIUS, GUARD_SPEED, GUARD_CHASE_SPEED, SCAN_SWING, SCAN_SPEED,
  COIN_STARE_SECONDS,
} from './config.js';
import { moveBody, tileCenter } from './bodies.js';
import { angleDiff } from './vision.js';

const TURN_RATE = 3.4; // radians per second

export class Guard {
  constructor(spec, index) {
    this.posts = spec.path.map(([c, r]) => tileCenter(c, r));
    this.wait = spec.wait ?? 0.8;
    this.index = index;
    const [x, y] = this.posts[0];
    this.x = x;
    this.y = y;
    this.r = GUARD_RADIUS;
    this.target = this.posts.length > 1 ? 1 : 0;
    const [tx, ty] = this.posts[this.target];
    this.facing = Math.atan2(ty - y, tx - x);
    this.baseFacing = this.facing;
    this.state = 'patrol';       // patrol | pause | lured | stare | return
    this.timer = 0;
    this.scanPhase = Math.random() * Math.PI * 2;
    this.stepTimer = 0;
    this.justStepped = false;
    this.lureX = 0;
    this.lureY = 0;
    this.seesPlayer = false;     // set by main each frame, read by the renderer
  }

  turnToward(angle, dt) {
    const d = angleDiff(angle, this.facing);
    const step = TURN_RATE * dt;
    if (Math.abs(d) <= step) this.facing = angle;
    else this.facing += Math.sign(d) * step;
  }

  walkTo(level, tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    this.turnToward(Math.atan2(dy, dx), dt);
    const step = Math.min(dist, speed * dt);
    moveBody(level, this, (dx / dist) * step, (dy / dist) * step);
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.justStepped = true;
      this.stepTimer = speed > GUARD_SPEED ? 0.26 : 0.36;
    }
    return dist <= step + 1;
  }

  // lure sends the guard to study a thrown coin at (x, y).
  lure(x, y) {
    if (this.state === 'stare') return;
    this.lureX = x;
    this.lureY = y;
    this.state = 'lured';
  }

  update(level, dt) {
    this.justStepped = false;
    if (this.state === 'patrol') {
      const [tx, ty] = this.posts[this.target];
      if (this.walkTo(level, tx, ty, GUARD_SPEED, dt)) {
        this.state = 'pause';
        this.timer = this.wait;
        this.baseFacing = this.facing;
      }
    } else if (this.state === 'pause') {
      this.timer -= dt;
      this.scanPhase += dt * SCAN_SPEED;
      this.facing = this.baseFacing + Math.sin(this.scanPhase) * SCAN_SWING;
      if (this.timer <= 0) {
        this.target = (this.target + 1) % this.posts.length;
        this.state = 'patrol';
      }
    } else if (this.state === 'lured') {
      if (this.walkTo(level, this.lureX, this.lureY, GUARD_CHASE_SPEED, dt)) {
        this.state = 'stare';
        this.timer = COIN_STARE_SECONDS;
        this.baseFacing = this.facing;
      }
    } else if (this.state === 'stare') {
      this.timer -= dt;
      this.scanPhase += dt * SCAN_SPEED * 0.6;
      this.facing = this.baseFacing + Math.sin(this.scanPhase) * 0.5;
      if (this.timer <= 0) this.state = 'return';
    } else if (this.state === 'return') {
      // resume at whichever post is nearest, then carry on around the loop
      let best = 0;
      let bestD = Infinity;
      this.posts.forEach(([px, py], i) => {
        const d = (px - this.x) ** 2 + (py - this.y) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      const [tx, ty] = this.posts[best];
      if (this.walkTo(level, tx, ty, GUARD_SPEED, dt)) {
        this.target = (best + 1) % this.posts.length;
        this.state = 'patrol';
      }
    }
  }
}
