/**
 * Weather FX – Sztorm
 * pioruny + błyski (z „buzra zapis starego”)
 * kropelki
 * nowy gradient: 2 elipsy zaciemniające od ZEWNĄTRZ
 */

const fxRoot = () => document.getElementById('fx-root');

const PATH = {
  p1: 'assets/asety/effekty/pierun1.webp',
  p2: 'assets/asety/effekty/pierun2.webp',
  kd: 'assets/asety/effekty/kropelka.webp',
};

/** [startFrame, endFrame, key, x1, y1, x2, y2, mirror] – współrzędne 4K absolutne */
const LIGHTNINGS = [
  [9, 10, 'p2', 1118, 1319, 1829, 1713, false],
  [11, 12, 'p1', 1327, 1274, 1842, 1725, false],
  [46, 48, 'p1', 2366, 1272, 2927, 1763, true],
  [51, 53, 'p1', 2576, 1221, 3137, 1712, true],
  [54, 56, 'p2', 2057, 1291, 2923, 1772, false],
];

/** [frame, x, y] – absolutne 4K */
const FLASHES = [
  [11, 1505, 1471],
  [15, 1910, 1422],
  [46, 2799, 1442],
  [52, 2680, 1440],
];

const MS60 = 1000 / 60;
const CYCLE_FRAMES = 120;

let mode = null;
let settings = null;
let sides = [];
let raf = 0;
let t0 = 0;
let kdPool = [];
let kdAcc = 0;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function hexRgba(hex, a) {
  const n = parseInt(String(hex || '#a0b0c8').replace('#', ''), 16);
  if (!Number.isFinite(n)) return `rgba(160,176,200,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * Gradient eliptyczny od ZEWNĄTRZ:
 * - warstwa 2: lekkie dociemnienie krawędzi
 * - warstwa 1: mocniejsze dociemnienie ~połowy obszaru
 * Wyśrodkowany w X względem rzędu, Y / RX / RY / X offset do ustawienia.
 */
function applyStormEllipses(el, S) {
  if (!el) return;
  const col = S.stormCol || '#a0b0c8';
  const rx = Math.max(20, Number(S.stormEllRX) || 110); // %
  const ry = Math.max(20, Number(S.stormEllRY) || 95);
  // centrum elipsy w obszarze (50% + offset X w %)
  const cx = 50 + (Number(S.stormEllX) || 0);
  const cy = clamp(Number(S.stormEllY) ?? 55, 0, 100);
  const opEdge = clamp(Number(S.stormEllOpEdge) ?? 0.28, 0, 1); // lekkie krawędzie
  const opHalf = clamp(Number(S.stormEllOpHalf) ?? 0.5, 0, 1);  // mocniejsze ~połowa

  // transparent w środku → kolor na zewnątrz
  const half = `radial-gradient(ellipse ${rx * 0.72}% ${ry * 0.72}% at ${cx}% ${cy}%,
    transparent 0%,
    transparent 28%,
    ${hexRgba(col, opHalf * 0.35)} 48%,
    ${hexRgba(col, opHalf)} 72%,
    ${hexRgba(col, opHalf * 0.9)} 100%)`;

  const edge = `radial-gradient(ellipse ${rx}% ${ry}% at ${cx}% ${cy}%,
    transparent 0%,
    transparent 42%,
    ${hexRgba(col, opEdge * 0.4)} 58%,
    ${hexRgba(col, opEdge)} 78%,
    ${hexRgba(col, opEdge * 0.85)} 100%)`;

  el.style.background = `${half}, ${edge}`;
  el.style.opacity = '1';
}

function makeSide(S, y, isOpp) {
  const root = document.createElement('div');
  root.className = 'fx-side ' + (isOpp ? 'fx-opp' : 'fx-self');
  root.style.cssText =
    `left:${S.rowX}px;top:${y}px;width:${S.rowW}px;height:${S.rowH}px;overflow:hidden;pointer-events:none;`;

  const grad = document.createElement('div');
  grad.className = 'fx-layer storm-grad';
  grad.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;';
  applyStormEllipses(grad, S);

  const flLayer = document.createElement('div');
  flLayer.className = 'fx-layer';
  flLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:12;';

  const ltLayer = document.createElement('div');
  ltLayer.className = 'fx-layer';
  ltLayer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:15;';

  const kdLayer = document.createElement('div');
  kdLayer.className = 'fx-layer';
  kdLayer.style.cssText = 'position:absolute;inset:0;overflow:visible;pointer-events:none;z-index:8;';

  root.append(grad, flLayer, ltLayer, kdLayer);
  fxRoot().appendChild(root);

  return {
    root, isOpp, y,
    grad, flLayer, ltLayer, kdLayer,
    ltEls: [], flEls: [],
  };
}

/* ===== pioruny – 1:1 ze starego ===== */
function buildLightnings(side, S) {
  side.ltLayer.innerHTML = '';
  side.ltEls = [];
  const glow =
    `drop-shadow(0 0 ${S.ltGlowBlur ?? 14}px ${hexRgba(S.ltGlowCol || '#64b4ff', S.ltGlowOp ?? 0.95)})`;

  LIGHTNINGS.forEach(L => {
    const [sf, ef, img, x1, y1, x2, y2, mirror] = L;
    const el = document.createElement('div');
    el.className = 'lightning' + (mirror ? ' mirror' : '');
    const ww = Math.abs(x2 - x1);
    const hh = Math.abs(y2 - y1);
    const lx = Math.min(x1, x2) - S.rowX;
    const ly = Math.min(y1, y2) - side.y;
    el.style.cssText =
      `position:absolute;left:${lx}px;top:${ly}px;width:${ww}px;height:${hh}px;` +
      `background-image:url('${PATH[img]}');background-size:contain;background-repeat:no-repeat;` +
      `filter:${glow};opacity:0;pointer-events:none;`;
    if (mirror) el.style.transform = 'scaleX(-1)';
    side.ltLayer.appendChild(el);
    side.ltEls.push({ el, sf, ef });
  });
}

/* ===== błyski – 1:1 ze starego ===== */
function buildFlashes(side, S) {
  side.flLayer.innerHTML = '';
  side.flEls = [];
  FLASHES.forEach(([frame, x, y]) => {
    const outer = document.createElement('div');
    outer.className = 'flash-outer';
    const inner = document.createElement('div');
    inner.className = 'flash-inner';
    const lx = x - S.rowX;
    const ly = y - side.y;
    const flRX = S.flRX ?? 800;
    const flRY = S.flRY ?? 300;
    const flIRX = S.flIRX ?? 200;
    const flIRY = S.flIRY ?? 150;
    outer.style.cssText =
      `position:absolute;border-radius:50%;pointer-events:none;opacity:0;` +
      `left:${lx - flRX}px;top:${ly - flRY}px;width:${flRX * 2}px;height:${flRY * 2}px;` +
      `background:radial-gradient(ellipse at center, ${hexRgba(S.flC0 || '#4aa0ff', S.flOp0 ?? 0.71)} 0%, ${hexRgba(S.flC0 || '#4aa0ff', 0)} 70%)`;
    inner.style.cssText =
      `position:absolute;border-radius:50%;pointer-events:none;opacity:0;` +
      `left:${lx - flIRX}px;top:${ly - flIRY}px;width:${flIRX * 2}px;height:${flIRY * 2}px;` +
      `background:radial-gradient(ellipse at center, ${hexRgba(S.flC1 || '#ffffff', S.flOp1 ?? 0.5)} 0%, ${hexRgba(S.flC1 || '#ffffff', 0)} 70%)`;
    side.flLayer.appendChild(outer);
    side.flLayer.appendChild(inner);
    side.flEls.push({ outer, inner, frame });
  });
}

/* ===== kropelki – ze starego ===== */
function spawnKd(side, S, now) {
  if (kdPool.length >= (S.kdMax ?? 12)) return;
  const el = document.createElement('div');
  el.className = 'storm-drop';
  const base = S.kdBase ?? 41;
  const sT = rand(S.kdSmin ?? 0.7, S.kdSmax ?? 2.5);
  const drip = Math.random() < (S.kdDripChance ?? 0.55);
  const x = rand(0, S.rowW);
  const y = rand(0, S.rowH * 0.65);
  el.style.cssText =
    `position:absolute;width:${base}px;height:${base}px;left:${x - base / 2}px;top:${y}px;opacity:0;` +
    `background:url('${PATH.kd}') center / contain no-repeat;transform-origin:center top;pointer-events:none;`;
  side.kdLayer.appendChild(el);
  kdPool.push({
    el, x, y, base, sT, drip,
    t0: now,
    life: (S.kdLife ?? 0.7) * 1000,
    dy: drip ? (S.kdDy ?? 55) : (S.kdDy ?? 55) * 0.15,
    stretch: drip ? (S.kdStretch ?? 2.2) : 1.05,
  });
}

function tickKd(now) {
  for (let i = kdPool.length - 1; i >= 0; i--) {
    const d = kdPool[i];
    const t = (now - d.t0) / d.life;
    if (t >= 1) {
      d.el.remove();
      kdPool.splice(i, 1);
      continue;
    }
    let sc, sy;
    if (t < 0.15) {
      sc = 0.2 + (d.sT - 0.2) * (t / 0.15);
      sy = sc;
    } else {
      const u = (t - 0.15) / 0.85;
      sc = d.sT * (1 - u * 0.85);
      sy = sc * (1 + (d.stretch - 1) * u);
    }
    d.el.style.transform = `scale(${Math.max(0.05, sc)}, ${Math.max(0.05, sy)})`;
    d.el.style.top = (d.y + d.dy * t) + 'px';
    d.el.style.opacity = String(t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9);
  }
}

function clearFx() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  kdPool.forEach(k => k.el.remove());
  kdPool = [];
  kdAcc = 0;
  sides = [];
  const root = fxRoot();
  if (root) root.innerHTML = '';
}

function mountStorm(S) {
  [false, true].forEach(isOpp => {
    const y = isOpp ? S.rainOppY : S.rainSelfY;
    const side = makeSide(S, y, isOpp);
    buildLightnings(side, S);
    buildFlashes(side, S);
    sides.push(side);
  });
}

function loop(now) {
  if (!mode || !settings) return;
  const S = settings;
  const t = now - t0;
  const frame = (t / MS60) % CYCLE_FRAMES;
  const dt = Math.min(40, now - (loop._last || now));
  loop._last = now;

  sides.forEach(side => {
    side.ltEls.forEach(({ el, sf, ef }) => {
      el.style.opacity = (frame >= sf && frame <= ef + 0.5) ? '1' : '0';
    });
    side.flEls.forEach(({ outer, inner, frame: ff }) => {
      const local = frame - ff;
      let op = 0;
      if (local >= 0 && local <= 4) op = 1;
      else if (local > 4 && local <= 14) op = 1 - (local - 4) / 10;
      outer.style.opacity = String(op);
      inner.style.opacity = String(op);
    });
  });

  kdAcc += dt / 1000 * (S.kdRate ?? 4);
  const rainSide = sides.find(s => !s.isOpp);
  while (kdAcc >= 1 && rainSide) {
    spawnKd(rainSide, S, now);
    kdAcc--;
  }
  tickKd(now);

  raf = requestAnimationFrame(loop);
}

export function applySettingsLive(S) {
  settings = S;
  sides.forEach(side => applyStormEllipses(side.grad, S));
}

export function stopAll() {
  mode = null;
  clearFx();
}

export function startStorm(S) {
  stopAll();
  settings = S;
  mode = 'storm';
  t0 = performance.now();
  loop._last = t0;
  mountStorm(S);
  raf = requestAnimationFrame(loop);
}

export function restart(S) {
  startStorm(S);
}

export function forceLightning() {
  // restart cyklu od klatki 0 ≈ natychmiastowy piorun
  t0 = performance.now();
}

export function startRain() { stopAll(); }
export function startFog() { stopAll(); }
export function setLightningPoints() {}
export function getLightningPoints() {
  return { g1: [], g2: [] };
}