// levels.js — the three floors of Silent Floor, drawn as tile maps.
//
// Legend:  #  wall (blocks movement and sight)
//          =  crate (low cover: blocks movement and sight, good to hide behind)
//          D  server desk (blocks movement and sight, drawn as a worktop)
//          .  open floor        P  player start
//          E  exit              K  keycard (the vault exit stays locked without it)
//
// Guards patrol the waypoint loops listed under each map; every waypoint and
// every straight run between two of them stays on open floor by construction.

export const LEVELS = [
  {
    name: 'Floor 1 · Lobby Sweep',
    sub: 'Two guards, wide halls. Cross behind the crates.',
    locked: false,
    grid: [
      '########################',
      '#..........##..........#',
      '#..====....##....==....#',
      '#..====....##..........#',
      '#..........##......E...#',
      '#....P.................#',
      '#..........##..====....#',
      '#..==......##..====....#',
      '#..==..................#',
      '#......####....==......#',
      '#......####............#',
      '#..........##....==....#',
      '#....==....##..........#',
      '#..........##..........#',
      '########################',
    ],
    patrols: [
      { path: [[2, 1], [9, 1]], wait: 0.9 },
      { path: [[20, 13], [13, 13]], wait: 0.7 },
    ],
  },
  {
    name: 'Floor 2 · Server Rows',
    sub: 'Three guards. Their patrols cross — time the gaps.',
    locked: false,
    grid: [
      '########################',
      '#..P...................#',
      '#......................#',
      '#..DDDDDDDDD..DDDDDDD..#',
      '#......................#',
      '#......................#',
      '#..DDDDDD..DDDDDDDDD...#',
      '#......................#',
      '#......####............#',
      '#......####....==......#',
      '#......................#',
      '#..DDDDDDDDD..DDDDDDD..#',
      '#......................#',
      '#.....................E#',
      '########################',
    ],
    patrols: [
      { path: [[12, 1], [12, 5]], wait: 0.6 },
      { path: [[21, 5], [2, 5]], wait: 0.5 },
      { path: [[20, 13], [3, 13]], wait: 0.8 },
    ],
  },
  {
    name: 'Floor 3 · The Vault',
    sub: 'Four guards, one locked door. Lift the keycard first.',
    locked: true,
    grid: [
      '########################',
      '#..K.......##..........#',
      '#..........##....==....#',
      '#..==......##..........#',
      '#..==......##......E...#',
      '#..........##..........#',
      '#....P.....##..====....#',
      '#..........##..====....#',
      '#..====................#',
      '#..====....####........#',
      '#..........####....==..#',
      '#..................==..#',
      '#....==....##..........#',
      '#..........##..........#',
      '########################',
    ],
    patrols: [
      { path: [[2, 5], [9, 5]], wait: 0.7 },
      { path: [[21, 2], [21, 7]], wait: 0.6 },
      { path: [[9, 11], [2, 11]], wait: 0.9 },
      { path: [[13, 13], [21, 13]], wait: 0.5 },
    ],
  },
];

// tileAt reads one map cell; anything off the map is wall.
export function tileAt(level, col, row) {
  if (col < 0 || row < 0 || row >= level.grid.length || col >= level.grid[0].length) return '#';
  return level.grid[row][col];
}

// solid tiles stop both bodies and sight lines.
export function isSolid(ch) {
  return ch === '#' || ch === '=' || ch === 'D';
}

export function blocksSight(level, col, row) {
  return isSolid(tileAt(level, col, row));
}

export function blocksMove(level, col, row) {
  return isSolid(tileAt(level, col, row));
}

// findTile returns the [col,row] of the first cell holding ch, or null.
export function findTile(level, ch) {
  for (let r = 0; r < level.grid.length; r++) {
    const c = level.grid[r].indexOf(ch);
    if (c !== -1) return [c, r];
  }
  return null;
}
