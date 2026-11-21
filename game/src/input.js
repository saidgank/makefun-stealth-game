// input.js — keyboard and mouse state for the game loop. The loop polls
// `keys` each frame; one-shot actions (start, restart, coin throw) are queued
// as events so a press between frames is never lost.

export const keys = new Set();
export const events = [];        // 'start' | 'restart' | 'mute'
export const clicks = [];        // {x, y} in canvas pixels, oldest first

let canvas = null;

export function attachInput(el) {
  canvas = el;
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.key.toLowerCase());
    if (e.key === 'Enter') events.push('start');
    if (e.key.toLowerCase() === 'r') events.push('restart');
    if (e.key.toLowerCase() === 'm') events.push('mute');
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    clicks.push({ x, y });
    events.push('start');
  });
}

export function moveVector() {
  let x = 0;
  let y = 0;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (keys.has('w') || keys.has('arrowup')) y -= 1;
  if (keys.has('s') || keys.has('arrowdown')) y += 1;
  if (x !== 0 && y !== 0) {
    const inv = Math.SQRT1_2;
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

export function sneaking() {
  return keys.has('shift');
}

// drain returns and clears a queue (events or clicks).
export function drain(queue) {
  return queue.splice(0, queue.length);
}
