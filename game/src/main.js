// main.js — Silent Floor's conductor: loads floors, runs the loop, owns the
// detection meter, the coin throws, the caught/clear/win flow, and the staged
// scenes the screenshots are taken from (?shot=title|hide|alert|vault — real
// renders of this same code, frozen at a photogenic frame).

import { HUD_H, TILE, DETECT_FULL_SECONDS, DETECT_DECAY, SNEAK_EXPOSURE, VISION_RANGE, VISION_HALF_ANGLE, COIN_THROW_RANGE, COIN_LURE_RADIUS } from './config.js';
import { LEVELS, findTile, tileAt } from './levels.js';
import { canSee } from './vision.js';
import { tileOf, tileCenter } from './bodies.js';
import { Player } from './player.js';
import { Guard } from './guards.js';
import { attachInput, moveVector, sneaking, drain, events, clicks } from './input.js';
import { initAudio, toggleMute, coinSound, keySound, caughtSound, clearSound, footstepTick, setSting } from './audio.js';
import { drawGame, drawTitle, drawWin } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
attachInput(canvas);

const shot = new URLSearchParams(location.search).get('shot');

const view = {
  level: null, levelDef: null, player: null, guards: [],
  heats: [], detection: 0, anySeen: false,
  hasKey: false, caught: 0, elapsed: 0,
  coinFx: [], ripples: [], time: 0,
  state: 'title', stateTimer: 0, levelIndex: 0,
};

function loadLevel(index) {
  const def = LEVELS[index];
  view.levelDef = def;
  view.level = def;
  view.levelIndex = index;
  view.player = new Player(def);
  view.guards = def.patrols.map((p, i) => new Guard(p, i));
  view.heats = view.guards.map(() => 0);
  view.detection = 0;
  view.hasKey = false;
  view.coinFx = [];
  view.ripples = [];
  view.exitTimer = 0;
}

function startRun() {
  view.caught = 0;
  view.elapsed = 0;
  loadLevel(0);
  view.state = 'playing';
}

function updateDetection(dt) {
  let seen = false;
  view.guards.forEach((g, i) => {
    const { seen: s, dist } = canSee(view.level, g.x, g.y, g.facing, view.player.x, view.player.y, VISION_RANGE, VISION_HALF_ANGLE);
    g.seesPlayer = s;
    const target = s ? 0.45 + 0.55 * (1 - dist / VISION_RANGE) : 0;
    view.heats[i] += (target - view.heats[i]) * Math.min(1, dt * 7);
    if (s) {
      seen = true;
      const closeness = 1.3 - 0.8 * (dist / VISION_RANGE);
      const sneakFactor = view.player.sneak ? SNEAK_EXPOSURE : 1;
      view.detection += (dt / DETECT_FULL_SECONDS) * closeness * sneakFactor;
    }
  });
  view.anySeen = seen;
  if (!seen) view.detection -= DETECT_DECAY * dt;
  view.detection = Math.max(0, Math.min(1, view.detection));
}

function updatePlay(dt) {
  view.elapsed += dt;
  const vec = moveVector();
  view.player.update(view.level, dt, vec, sneaking());

  for (const g of view.guards) {
    g.update(view.level, dt);
    if (g.justStepped) {
      view.ripples.push({ x: g.x, y: g.y, age: 0 });
      const d = Math.hypot(g.x - view.player.x, g.y - view.player.y);
      footstepTick(Math.max(0, 1 - d / 420), (g.x - view.player.x) / 300);
    }
  }
  view.ripples = view.ripples.filter((r) => (r.age += dt) < 0.6);
  view.coinFx = view.coinFx.filter((c) => view.time - c.at < 3.2);

  updateDetection(dt);
  setSting(view.detection);
  if (view.detection >= 1) {
    view.state = 'caught';
    view.stateTimer = 1.5;
    view.caught += 1;
    setSting(0);
    caughtSound();
    return;
  }

  const [pc, pr] = tileOf(view.player.x, view.player.y);
  const cell = tileAt(view.level, pc, pr);
  if (cell === 'K' && !view.hasKey) {
    view.hasKey = true;
    keySound();
  }
  if (cell === 'E' && (!view.levelDef.locked || view.hasKey)) {
    view.exitTimer += dt;
    if (view.exitTimer > 0.5) {
      clearSound();
      if (view.levelIndex + 1 < LEVELS.length) {
        view.state = 'clear';
        view.stateTimer = 1.6;
      } else {
        view.state = 'win';
        setSting(0);
      }
    }
  } else {
    view.exitTimer = 0;
  }
}

function throwCoin(x, y) {
  const px = x;
  const py = y - HUD_H;
  if (py < 0 || view.player.coins <= 0) return;
  const d = Math.hypot(px - view.player.x, py - view.player.y);
  if (d > COIN_THROW_RANGE) return;
  const [c, r] = tileOf(px, py);
  const cell = tileAt(view.level, c, r);
  if (cell === '#' || cell === '=' || cell === 'D') return;
  const [cx, cy] = tileCenter(c, r);
  view.player.coins -= 1;
  view.coinFx.push({ kind: 'landed', x: cx, y: cy, at: view.time });
  coinSound();
  for (const g of view.guards) {
    if (Math.hypot(g.x - cx, g.y - cy) < COIN_LURE_RADIUS) g.lure(cx, cy);
  }
}

function handleEvents() {
  for (const ev of drain(events)) {
    if (ev === 'mute') toggleMute();
    if (ev === 'restart' && view.state === 'playing') loadLevel(view.levelIndex);
    if (ev === 'start') {
      initAudio();
      if (view.state === 'title' || view.state === 'win') startRun();
    }
  }
  for (const click of drain(clicks)) {
    initAudio();
    if (view.state === 'playing') throwCoin(click.x, click.y);
  }
}

// --- staged scenes for the screenshots -------------------------------------

function stage(name) {
  if (name === 'title') {
    loadLevel(0);
    view.state = 'title';
    // let the patrols run a few seconds so the cones sit mid-sweep
    for (let t = 0; t < 3.7; t += 0.05) for (const g of view.guards) g.update(view.level, 0.05);
    view.time = 2.0;
    return;
  }
  if (name === 'hide') {
    loadLevel(0);
    view.state = 'playing';
    const [gx, gy] = tileCenter(4, 6);
    const g = view.guards[0];
    g.x = gx; g.y = gy; g.facing = -Math.PI / 2; g.state = 'pause'; g.baseFacing = -Math.PI / 2;
    const [bx, by] = tileCenter(16, 13);
    view.guards[1].x = bx; view.guards[1].y = by; view.guards[1].facing = Math.PI;
    const [px, py] = tileCenter(4, 1);
    view.player.x = px; view.player.y = py; view.player.facing = Math.PI / 2;
    view.detection = 0.1;
    view.time = 2.0;
    return;
  }
  if (name === 'alert') {
    loadLevel(1);
    view.state = 'playing';
    const [gx, gy] = tileCenter(12, 2);
    const g = view.guards[0];
    g.x = gx; g.y = gy; g.facing = Math.PI / 2; g.state = 'pause'; g.baseFacing = Math.PI / 2;
    const [px, py] = tileCenter(12, 4);
    view.player.x = px; view.player.y = py; view.player.facing = -Math.PI / 2;
    const [ax, ay] = tileCenter(6, 5);
    view.guards[1].x = ax; view.guards[1].y = ay; view.guards[1].facing = 0;
    const [bx, by] = tileCenter(17, 13);
    view.guards[2].x = bx; view.guards[2].y = by; view.guards[2].facing = Math.PI;
    view.detection = 0.72;
    view.heats[0] = 0.95;
    view.anySeen = true;
    view.time = 2.0;
    return;
  }
  if (name === 'vault') {
    loadLevel(2);
    view.state = 'playing';
    const [px, py] = tileCenter(5, 1);
    view.player.x = px; view.player.y = py; view.player.facing = Math.PI;
    const [bx, by] = tileCenter(21, 5);
    const g = view.guards[1];
    g.x = bx; g.y = by; g.facing = Math.PI; g.state = 'pause'; g.baseFacing = Math.PI;
    const [ax, ay] = tileCenter(5, 5);
    view.guards[0].x = ax; view.guards[0].y = ay; view.guards[0].facing = 0;
    const [cx, cy] = tileCenter(5, 11);
    view.guards[2].x = cx; view.guards[2].y = cy; view.guards[2].facing = 0;
    const [dx, dy] = tileCenter(17, 13);
    view.guards[3].x = dx; view.guards[3].y = dy; view.guards[3].facing = Math.PI;
    view.time = 2.0;
  }
}

// --- the loop ---------------------------------------------------------------

// A small debug handle so the game can be driven and inspected headlessly.
window.__silentFloor = { view, loadLevel, startRun };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shot) {
    view.time += dt;
    handleEvents();
    if (view.state === 'title') {
      for (const g of view.guards) g.update(view.level, dt);
    } else if (view.state === 'playing') {
      updatePlay(dt);
    } else if (view.state === 'caught') {
      view.stateTimer -= dt;
      if (view.stateTimer <= 0) { loadLevel(view.levelIndex); view.state = 'playing'; }
    } else if (view.state === 'clear') {
      view.stateTimer -= dt;
      if (view.stateTimer <= 0) { loadLevel(view.levelIndex + 1); view.state = 'playing'; }
    }
  }
  if (view.state === 'title') drawTitle(ctx, view);
  else if (view.state === 'win') drawWin(ctx, view);
  else drawGame(ctx, view);
  requestAnimationFrame(frame);
}

if (shot) stage(shot);
else { loadLevel(0); view.state = 'title'; }
requestAnimationFrame(frame);
