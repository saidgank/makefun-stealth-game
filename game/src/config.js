// config.js — every shared constant of Silent Floor in one place: the grid,
// the palette, movement speeds and the detection tuning the game feel hangs on.

export const TILE = 40;              // pixels per map tile
export const COLS = 24;              // playfield width in tiles
export const ROWS = 15;              // playfield height in tiles
export const HUD_H = 58;             // top HUD band height in pixels
export const VIEW_W = COLS * TILE;   // 960
export const VIEW_H = ROWS * TILE;   // 600
export const CANVAS_W = VIEW_W;
export const CANVAS_H = VIEW_H + HUD_H;

export const PLAYER_SPEED = 128;         // px per second, walking
export const PLAYER_SNEAK_SPEED = 68;    // px per second, holding Shift
export const PLAYER_RADIUS = 11;
export const SNEAK_EXPOSURE = 0.5;       // detection fills this fast while sneaking

export const GUARD_SPEED = 56;           // px per second on patrol
export const GUARD_CHASE_SPEED = 92;     // px per second returning to a distraction
export const GUARD_RADIUS = 12;
export const VISION_RANGE = 178;         // px, about 4.5 tiles
export const VISION_HALF_ANGLE = 0.56;   // radians, a 64 degree cone
export const SCAN_SWING = 0.7;           // radians a paused guard sweeps either way
export const SCAN_SPEED = 0.9;           // radians per second while scanning

export const DETECT_FULL_SECONDS = 0.85; // standing in a cone at point blank fills the meter in this long
export const DETECT_DECAY = 0.34;        // meter lost per second while unseen
export const COIN_COUNT = 3;             // distractions per level
export const COIN_THROW_RANGE = 250;     // px the player can toss a coin
export const COIN_LURE_RADIUS = 210;     // px a coin's ring pulls guards from
export const COIN_STARE_SECONDS = 2.4;   // how long a lured guard studies the coin

export const COLORS = {
  floor: '#27334a',
  floorAlt: '#2b3850',
  floorLine: '#1a2231',
  wall: '#4b5a75',
  wallTop: '#63769a',
  wallEdge: '#2c3648',
  crate: '#8a6b42',
  crateTop: '#a8854f',
  crateEdge: '#5d4729',
  desk: '#3d5a66',
  deskTop: '#4d7182',
  exit: '#39e6a3',
  exitLocked: '#e6504d',
  key: '#ffd94d',
  player: '#57c7ff',
  playerDark: '#1d6ea8',
  guard: '#e8b13c',
  guardDark: '#8a6414',
  coneCalm: 'rgba(255, 209, 102, ',
  coneAlert: 'rgba(255, 92, 66, ',
  hudBg: '#0d1219',
  hudText: '#c9d6e8',
  hudDim: '#7186a3',
  alarm: '#ff5c42',
  safe: '#39e6a3',
};
