// fog_fx.js – mgła na rzędzie 2 (strzelcy) obu graczy. Parametry z weather_fx_test.
const W = 3840, H = 2160;

const CFG = {
  rowX: 1140, rowW: 1906, rowH: 252,
  ys: [1120, 285],          // self2 i opp2

  fogCol: '#c8c8c8',
  fogMid: 0.57, fogEdge: 0.1,
  fogEH: 105, fogEW: 88, fogGradH: 148,

  fogCount: 15,
  fogInstant: 3,            // dymki widoczne od razu
  fogS0: 330, fogS1: 579,
  fogLife: 20, fogFade: 1.2, fogSpin: 0.3,
  fogOp: 0.50,              // było 0.19

  fadeInMs: 1000,
  fadeOutMs: 600
};

let root = null;
let sides = [];
let raf = 0;
let running = false;
let stopTimer = null;

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hexRgba(hex, a) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function bezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function ensureStyles() {
  if (document.getElementById('fog-fx-styles')) return;
  const st = document.createElement('style');
  st.id = 'fog-fx-styles';
  st.textContent = `
    #fog-fx-root { position:fixed; left:0; top:0; width:${W}px; height:${H}px;
      transform-origin:0 0; pointer-events:none; z-index:100; opacity:0; }
    .fog-side { position:absolute; overflow:hidden; pointer-events:none; }
    .fog-layer { position:absolute; inset:0; pointer-events:none; }
    .fog-puff { position:absolute; left:0; top:0; pointer-events:none; will-change:transform,opacity;
      background:url('assets/asety/effekty/dymek.webp') center / contain no-repeat; }
  `;
  document.head.appendChild(st);
}

function layout() {
  if (!root) return;
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  root.style.left = `${(window.innerWidth - W * s) / 2}px`;
  root.style.top = `${(window.innerHeight - H * s) / 2}px`;
  root.style.transform = `scale(${s})`;
}

function makeSide(y) {
  const el = document.createElement('div');
  el.className = 'fog-side';
  el.style.cssText = `left:${CFG.rowX}px;top:${y}px;width:${CFG.rowW}px;height:${CFG.rowH}px`;

  const grad = document.createElement('div');
  grad.className = 'fog-layer';
  const h = clamp(CFG.fogGradH, 5, 100);
  const fade = Math.min(18, h * 0.35);
  grad.style.background =
    `radial-gradient(ellipse ${CFG.fogEW}% ${CFG.fogEH}% at 50% 120%,
      ${hexRgba(CFG.fogCol, CFG.fogMid)} 0%,
      ${hexRgba(CFG.fogCol, CFG.fogMid * 0.45)} 40%,
      ${hexRgba(CFG.fogCol, CFG.fogEdge)} 65%,
      transparent 100%)`;
  const mask = `linear-gradient(to top, #000 0%, #000 ${h - fade}%, transparent ${h}%)`;
  grad.style.maskImage = mask;
  grad.style.webkitMaskImage = mask;

  const puffs = document.createElement('div');
  puffs.className = 'fog-layer';

  el.append(grad, puffs);
  root.appendChild(el);
  return { el, puffs, parts: [], spawned: 0 };
}

function spawnPuff(side, now) {
  const immediate = side.spawned < CFG.fogInstant;
  side.spawned++;

  const size = rand(CFG.fogS0, CFG.fogS1);
  const el = document.createElement('div');
  el.className = 'fog-puff';
  const x0 = rand(size * 0.15, CFG.rowW - size * 0.15);
  const y0 = rand(size * 0.15, CFG.rowH - size * 0.15);
  el.style.cssText = `width:${size}px;height:${size}px;opacity:0`;
  side.puffs.appendChild(el);

  side.parts.push({
    el, size,
    t0: immediate ? now : now + rand(0, CFG.fogLife * 700),
    life: CFG.fogLife * 1000 * rand(0.85, 1.15),
    fade: CFG.fogFade * 1000,
    x0, y0,
    cx1: x0 + rand(-120, 120), cy1: y0 + rand(-80, 80),
    cx2: x0 + rand(-120, 120), cy2: y0 + rand(-80, 80),
    x1: x0 + rand(-180, 180), y1: y0 + rand(-100, 100),
    rot0: rand(0, Math.PI * 2),
    spin: rand(-CFG.fogSpin, CFG.fogSpin),
    op: CFG.fogOp * rand(0.6, 1)
  });
}

function tick(now) {
  if (!running && !root) return;

  sides.forEach(side => {
    while (side.parts.length < CFG.fogCount && running) spawnPuff(side, now);

    side.parts = side.parts.filter(p => {
      const age = now - p.t0;
      if (age < 0) return true;
      if (age > p.life) { p.el.remove(); return false; }
      const u = age / p.life;
      let op = p.op;
      if (age < p.fade) op *= age / p.fade;
      else if (age > p.life - p.fade) op *= (p.life - age) / p.fade;
      const x = bezier(u, p.x0, p.cx1, p.cx2, p.x1);
      const y = bezier(u, p.y0, p.cy1, p.cy2, p.y1);
      const rot = p.rot0 + p.spin * (age / 1000);
      p.el.style.opacity = String(clamp(op, 0, 1));
      p.el.style.transform =
        `translate(${x - p.size / 2}px, ${y - p.size / 2}px) rotate(${rot}rad)`;
      return true;
    });
  });

  raf = requestAnimationFrame(tick);
}

function destroy() {
  cancelAnimationFrame(raf);
  raf = 0;
  clearTimeout(stopTimer);
  stopTimer = null;
  if (root) root.remove();
  root = null;
  sides = [];
  window.removeEventListener('resize', layout);
}

export function playFogFx() {
  if (running) return;
  clearTimeout(stopTimer);
  stopTimer = null;
  if (root) destroy();          // był w trakcie wygaszania – zaczynamy od nowa

  ensureStyles();
  running = true;

  root = document.createElement('div');
  root.id = 'fog-fx-root';
  document.body.appendChild(root);
  CFG.ys.forEach(y => sides.push(makeSide(y)));
  layout();
  window.addEventListener('resize', layout);

  // wyłonienie całości w 1 s
  root.style.transition = 'none';
  root.style.opacity = '0';
  root.offsetHeight;
  root.style.transition = `opacity ${CFG.fadeInMs}ms linear`;
  root.style.opacity = '1';

  raf = requestAnimationFrame(tick);
}

export function stopFogFx() {
  if (!running) return;
  running = false;
  if (root) {
    root.style.transition = `opacity ${CFG.fadeOutMs}ms linear`;
    root.style.opacity = '0';
  }
  stopTimer = setTimeout(destroy, CFG.fadeOutMs + 50);
}

/** Wołane z renderWeather – utrzymuje stan zgodny z planszą (F5, Czyste Niebo, nowa runda). */
export function syncFogFx(active) {
  if (active) playFogFx();
  else stopFogFx();
}