// render.js — every pixel of Silent Floor. Draw order matters: floor and
// props first, then a sheet of darkness, then the guards' vision cones as
// pools of warm light on top of it (so shadow reads as safety), then the
// bodies, then the HUD. All vector shapes on canvas; no image assets.

import {
  TILE, COLS, ROWS, HUD_H, VIEW_W, VIEW_H, CANVAS_W, CANVAS_H,
  VISION_RANGE, VISION_HALF_ANGLE, COLORS,
} from './config.js';
import { tileAt } from './levels.js';
import { conePolygon } from './vision.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawFloor(ctx, level) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * TILE;
      const y = HUD_H + row * TILE;
      ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(x, y, TILE, TILE);
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 0; col <= COLS; col++) {
    ctx.moveTo(col * TILE + 0.5, HUD_H);
    ctx.lineTo(col * TILE + 0.5, HUD_H + VIEW_H);
  }
  for (let row = 0; row <= ROWS; row++) {
    ctx.moveTo(0, HUD_H + row * TILE + 0.5);
    ctx.lineTo(VIEW_W, HUD_H + row * TILE + 0.5);
  }
  ctx.stroke();
}

function drawProps(ctx, level, view) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const ch = tileAt(level, col, row);
      const x = col * TILE;
      const y = HUD_H + row * TILE;
      if (ch === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 7);
        ctx.strokeStyle = COLORS.wallEdge;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      } else if (ch === '=') {
        ctx.fillStyle = COLORS.crate;
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = COLORS.crateTop;
        ctx.fillRect(x + 2, y + 2, TILE - 4, 6);
        ctx.strokeStyle = COLORS.crateEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 3);
        ctx.lineTo(x + TILE - 3, y + TILE - 3);
        ctx.moveTo(x + TILE - 3, y + 3);
        ctx.lineTo(x + 3, y + TILE - 3);
        ctx.stroke();
      } else if (ch === 'D') {
        ctx.fillStyle = COLORS.desk;
        ctx.fillRect(x + 1, y + 5, TILE - 2, TILE - 10);
        ctx.fillStyle = COLORS.deskTop;
        ctx.fillRect(x + 1, y + 5, TILE - 2, 5);
        ctx.fillStyle = 'rgba(120, 220, 255, 0.5)';
        ctx.fillRect(x + 8, y + 16, 9, 6);
        ctx.fillRect(x + 23, y + 16, 9, 6);
      } else if (ch === 'E') {
        drawExit(ctx, x, y, view);
      } else if (ch === 'K' && !view.hasKey) {
        drawKey(ctx, x, y, view.time);
      }
    }
  }
}

function drawExit(ctx, x, y, view) {
  const open = !view.levelDef.locked || view.hasKey;
  const pulse = 0.72 + 0.28 * Math.sin(view.time * 3.2);
  const color = open ? COLORS.exit : COLORS.exitLocked;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 5, y + 5, TILE - 10, TILE - 10);
  ctx.globalAlpha = 0.16 * pulse;
  ctx.fillStyle = color;
  ctx.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
  ctx.restore();
  ctx.fillStyle = color;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', x + TILE / 2, y + TILE / 2 + 3);
  if (!open) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + TILE / 2 - 8, 4, Math.PI, 0);
    ctx.stroke();
  }
}

function drawKey(ctx, x, y, time) {
  const bob = Math.sin(time * 2.6) * 2;
  ctx.save();
  ctx.translate(x + TILE / 2, y + TILE / 2 + bob);
  ctx.rotate(-0.35);
  ctx.fillStyle = COLORS.key;
  rr(ctx, -9, -6, 18, 12, 2);
  ctx.fill();
  ctx.fillStyle = '#8a6d1f';
  ctx.fillRect(-9, -1, 18, 3);
  ctx.restore();
}

function drawCone(ctx, level, guard, heat) {
  const pts = conePolygon(level, guard.x, guard.y, guard.facing, VISION_HALF_ANGLE, VISION_RANGE);
  const grad = ctx.createRadialGradient(guard.x, HUD_H + guard.y, 8, guard.x, HUD_H + guard.y, VISION_RANGE);
  const warm = heat > 0.45 ? COLORS.coneAlert : COLORS.coneCalm;
  grad.addColorStop(0, warm + '0.50)');
  grad.addColorStop(0.7, warm + '0.26)');
  grad.addColorStop(1, warm + '0.04)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], HUD_H + pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], HUD_H + pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawGuard(ctx, guard, heat, time) {
  const x = guard.x;
  const y = HUD_H + guard.y;
  // footstep ripples are drawn by drawRipples; here: body, cap and state mark
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 9, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guardDark;
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, Math.PI * 2);
  ctx.fill();
  const fx = x + Math.cos(guard.facing) * 13;
  const fy = y + Math.sin(guard.facing) * 13;
  ctx.strokeStyle = '#f5d67a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(fx, fy);
  ctx.stroke();
  if (heat > 0.03) {
    const mark = heat > 0.62 ? '!' : '?';
    ctx.fillStyle = heat > 0.62 ? COLORS.alarm : '#ffd94d';
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const bob = Math.sin(time * 6) * 1.5;
    ctx.fillText(mark, x, y - 17 + bob);
  }
}

function drawPlayer(ctx, player, seen) {
  const x = player.x;
  const y = HUD_H + player.y;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (seen) {
    ctx.strokeStyle = COLORS.alarm;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerDark;
  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#dff3ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(player.facing) * 11, y + Math.sin(player.facing) * 11);
  ctx.stroke();
  if (player.sneak) {
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCoinFx(ctx, fx, time) {
  for (const c of fx) {
    const age = time - c.at;
    if (c.kind === 'landed') {
      const pings = (age % 0.9) / 0.9;
      ctx.strokeStyle = `rgba(255, 217, 77, ${0.5 * (1 - pings)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, HUD_H + c.y, 4 + pings * 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = COLORS.key;
      ctx.beginPath();
      ctx.arc(c.x, HUD_H + c.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRipples(ctx, ripples) {
  for (const r of ripples) {
    ctx.strokeStyle = `rgba(200, 215, 235, ${0.30 * (1 - r.age)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r.x, HUD_H + r.y, 3 + r.age * 15, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, view) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, HUD_H - 1, CANVAS_W, 1);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText(view.levelDef.name, 14, 24);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '400 11.5px system-ui, sans-serif';
  ctx.fillText(view.levelDef.sub, 14, 43);

  // detection meter
  const mx = 560;
  const my = 14;
  const mw = 210;
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillText('DETECTION', mx, my + 2);
  ctx.fillStyle = '#1a2331';
  rr(ctx, mx, my + 7, mw, 11, 5);
  ctx.fill();
  if (view.detection > 0.005) {
    const d = view.detection;
    ctx.fillStyle = d > 0.62 ? COLORS.alarm : d > 0.3 ? '#ffb02e' : '#ffd94d';
    rr(ctx, mx, my + 7, mw * d, 11, 5);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1;
  rr(ctx, mx, my + 7, mw, 11, 5);
  ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '600 12.5px system-ui, sans-serif';
  ctx.fillText(`Guards ${view.guards.length}`, CANVAS_W - 14, 22);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '400 11.5px system-ui, sans-serif';
  const keyNote = view.levelDef.locked ? (view.hasKey ? ' · keycard held' : ' · keycard needed') : '';
  ctx.fillText(`Coins ${view.player.coins} · Caught ${view.caught}${keyNote}`, CANVAS_W - 14, 40);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '400 11px system-ui, sans-serif';
  ctx.fillText('WASD move · Shift sneak · Click throw coin · R restart · M mute', 350, 43);
}

export function drawGame(ctx, view) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawFloor(ctx, view.level);
  drawProps(ctx, view.level, view);
  // darkness sheet: shadow is safety, cones are light
  ctx.fillStyle = 'rgba(5, 8, 14, 0.22)';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H);
  view.guards.forEach((g, i) => drawCone(ctx, view.level, g, view.heats[i] || 0));
  drawCoinFx(ctx, view.coinFx, view.time);
  drawRipples(ctx, view.ripples);
  view.guards.forEach((g, i) => drawGuard(ctx, g, view.heats[i] || 0, view.time));
  drawPlayer(ctx, view.player, view.anySeen);
  drawHud(ctx, view);
  if (view.state === 'caught') {
    ctx.fillStyle = 'rgba(160, 20, 10, 0.28)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H);
    ctx.fillStyle = '#fff';
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED', CANVAS_W / 2, HUD_H + VIEW_H / 2);
    ctx.font = '400 16px system-ui, sans-serif';
    ctx.fillText('The floor resets. Learn the loop and try again.', CANVAS_W / 2, HUD_H + VIEW_H / 2 + 30);
  }
  if (view.state === 'clear') {
    ctx.fillStyle = 'rgba(6, 30, 22, 0.45)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H);
    ctx.fillStyle = '#dffcf0';
    ctx.font = '800 40px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FLOOR CLEAR', CANVAS_W / 2, HUD_H + VIEW_H / 2);
    ctx.font = '400 16px system-ui, sans-serif';
    ctx.fillText('Unseen, out the door. Moving on…', CANVAS_W / 2, HUD_H + VIEW_H / 2 + 30);
  }
}

export function drawTitle(ctx, view) {
  drawGame(ctx, { ...view, state: 'title' });
  ctx.fillStyle = 'rgba(4, 6, 10, 0.62)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#eaf3ff';
  ctx.font = '800 64px system-ui, sans-serif';
  ctx.fillText('SILENT FLOOR', CANVAS_W / 2, 218);
  ctx.fillStyle = '#9fc6e8';
  ctx.font = '400 19px system-ui, sans-serif';
  ctx.fillText('A tiny stealth game. Cross three guarded floors and reach the exit unseen.', CANVAS_W / 2, 254);
  ctx.fillStyle = '#c9d6e8';
  ctx.font = '400 16px system-ui, sans-serif';
  ctx.fillText('WASD or arrows to move · hold Shift to sneak past a sweeping cone', CANVAS_W / 2, 316);
  ctx.fillText('Click to throw a coin — guards leave their loop to look at it', CANVAS_W / 2, 342);
  ctx.fillText('Stay out of the light: the meter fills faster the closer you stand', CANVAS_W / 2, 368);
  ctx.fillStyle = COLORS.exit;
  ctx.font = '700 21px system-ui, sans-serif';
  ctx.fillText('Click or press Enter to slip in', CANVAS_W / 2, 428);
}

export function drawWin(ctx, view) {
  drawGame(ctx, { ...view, state: 'win' });
  ctx.fillStyle = 'rgba(4, 10, 8, 0.66)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#dffcf0';
  ctx.font = '800 52px system-ui, sans-serif';
  ctx.fillText('GHOST', CANVAS_W / 2, 240);
  ctx.fillStyle = '#9fe8c8';
  ctx.font = '400 19px system-ui, sans-serif';
  ctx.fillText('All three floors crossed. The vault never knew you were there.', CANVAS_W / 2, 276);
  ctx.fillStyle = '#c9d6e8';
  ctx.font = '400 17px system-ui, sans-serif';
  ctx.fillText(`Time ${view.elapsed.toFixed(1)}s · Caught ${view.caught} time${view.caught === 1 ? '' : 's'}`, CANVAS_W / 2, 322);
  ctx.fillStyle = COLORS.exit;
  ctx.font = '700 19px system-ui, sans-serif';
  ctx.fillText('Click or press Enter to run it again', CANVAS_W / 2, 372);
}
