// audio.js — a pocket WebAudio synth: no sound files, every effect is a few
// oscillators. Footstep ticks pan and fade with the nearest guard so your ears
// tell you where a guard is; the detection sting rises with the meter.

let ctx = null;
let master = null;
let muted = false;
let stingOsc = null;
let stingGain = null;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

function blip(freq, dur, vol, type = 'sine', when = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function coinSound() {
  blip(1560, 0.09, 0.16, 'square');
  blip(2090, 0.14, 0.12, 'square', 0.05);
}

export function keySound() {
  blip(880, 0.08, 0.14, 'triangle');
  blip(1320, 0.12, 0.14, 'triangle', 0.07);
}

export function caughtSound() {
  blip(196, 0.34, 0.3, 'sawtooth');
  blip(147, 0.4, 0.3, 'sawtooth', 0.08);
}

export function clearSound() {
  blip(660, 0.1, 0.14, 'triangle');
  blip(880, 0.1, 0.14, 'triangle', 0.09);
  blip(1100, 0.16, 0.14, 'triangle', 0.18);
}

// footstepTick: vol 0..1 and pan -1..1 place a guard's step in the room.
export function footstepTick(vol, pan) {
  if (!ctx || muted || vol <= 0.02) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  osc.type = 'sine';
  osc.frequency.value = 118;
  gain.gain.setValueAtTime(0.12 * vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  if (panner) {
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    osc.connect(gain).connect(panner).connect(master);
  } else {
    osc.connect(gain).connect(master);
  }
  osc.start(t);
  osc.stop(t + 0.09);
}

// setSting keeps a soft alarm tone under the game whose pitch follows the
// detection meter; level 0 turns it off.
export function setSting(level) {
  if (!ctx) return;
  if (level <= 0.01) {
    if (stingGain) stingGain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    return;
  }
  if (!stingOsc) {
    stingOsc = ctx.createOscillator();
    stingGain = ctx.createGain();
    stingOsc.type = 'triangle';
    stingGain.gain.value = 0;
    stingOsc.connect(stingGain).connect(master);
    stingOsc.start();
  }
  stingOsc.frequency.setTargetAtTime(220 + 340 * level, ctx.currentTime, 0.05);
  stingGain.gain.setTargetAtTime(muted ? 0 : 0.028 + 0.05 * level, ctx.currentTime, 0.08);
}
