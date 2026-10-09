export const TONES = [
  { id: 'bell', name: 'Soft Bell' },
  { id: 'beep', name: 'Digital Beep' },
  { id: 'chime', name: 'Wind Chime' },
  { id: 'custom', name: 'My own sound' },
];

let ctx;
function note(freq, start, dur, type, gain) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur + 0.05);
}

export function playTone(id, volume = 70) {
  const v = volume / 100;
  if (id === 'custom') {
    const url = localStorage.getItem('dottime-custom');
    if (url) { const a = new Audio(url); a.volume = v; a.play().catch(() => {}); return; }
    id = 'bell';
  }
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  if (id === 'bell') { note(880, 0, 2, 'sine', 0.5 * v); note(1760, 0, 1.2, 'sine', 0.2 * v); }
  if (id === 'beep') [0, 0.3, 0.6].forEach((t) => note(1000, t, 0.15, 'square', 0.15 * v));
  if (id === 'chime') [784, 988, 1175, 1568].forEach((f, i) => note(f, i * 0.25, 1.4, 'sine', 0.35 * v));
}
