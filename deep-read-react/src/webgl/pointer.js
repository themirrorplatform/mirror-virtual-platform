// One shared, passive pointer tracker for the WebGL hero — normalized position
// (-1..1) and a smoothed velocity. A single window listener feeds both the
// crest tilt and the dust drift. Never attached on touch devices.

const state = { x: 0, y: 0, vx: 0, vy: 0 };
let last = { x: 0, y: 0, t: 0 };
let started = false;

function onMove(e) {
  const nx = (e.clientX / window.innerWidth) * 2 - 1;
  const ny = (e.clientY / window.innerHeight) * 2 - 1;
  const now = performance.now();
  const dt = Math.max(16, now - last.t);
  state.vx = ((nx - last.x) / dt) * 16;
  state.vy = ((ny - last.y) / dt) * 16;
  state.x = nx;
  state.y = ny;
  last = { x: nx, y: ny, t: now };
}

export function startPointer() {
  if (started) return;
  started = true;
  window.addEventListener('pointermove', onMove, { passive: true });
}
export function stopPointer() {
  started = false;
  window.removeEventListener('pointermove', onMove);
}
export function pointer() {
  return state;
}
