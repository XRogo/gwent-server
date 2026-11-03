// storm_fx.js – jednorazowy efekt Sztormu na rzędzie 3 gracza i przeciwnika:
// gradient + pioruny + błyski (przycięte do rzędu) + kropelki.
// Fade-in 0.2s -> 1 cykl -> fade-out 0.2s. Mgłę i deszcz odpala game_board.js osobno.
const W = 3840, H = 2160;

const S = {
  rowX: 1140, rowW: 1906, rowH: 252,
  rainSelfY: 1400, rainOppY: 22,

  stormCol: '#136396',
  stormEllRX: 122, stormEllRY: 200, stormEllX: 1, stormEllY: 0,
  stormEllOpEdge: 0.28, stormEllOpHalf: 0.5,

  flRX: 800, flRY: 300, flIRX: 200, flIRY: 150,
  flC0: '#4aa0ff', flC1: '#ffffff', flOp0: 0.71, flOp1: 0.5,

  ltGlowCol: '#64b4ff', ltGlowBlur: 14, ltGlowOp: 0.95,

  kdMax: 150, kdRate: 44, kdBase: 26, kdSmin: 0.85, kdSmax: 1.6,
  kdStretch: 4, kdLife: 1.05, kdDy: 98, kdDripChance: 0.7
};

const FADE_IN_MS = 200;
const FADE_OUT_MS = 200;
const MS60 = 1000 / 60;
const CYCLE_FRAMES = 70;

const PATH = {
  p1: 'assets/asety/effekty/pierun1.webp',
  p2: 'assets/asety/effekty/pierun2.webp',
  kd: 'assets/asety/effekty/kropelka.webp'
};

/** [startFrame, endFrame, key, x1, y1, x2, y2, mirror] – absolutne 4K strony gracza */
const LIGHTNINGS = [
  [9, 10, 'p2', 1118, 1319, 1829, 1713, false],
  [11, 12, 'p1', 1327, 1274, 1842, 1725, false],
  [46, 48, 'p1', 2366, 1272, 2927, 1763, true],
  [51, 53, 'p1', 2576, 1221, 3137, 1712, true],
  [54, 56, 'p2', 2057, 1291, 2923, 1772, false]
];
/** [frame, x, y] */
const FLASHES = [
  [11, 1505, 1471],
  [15, 1910, 1422],
  [46, 2799, 1442],
  [52, 2680, 1440]
];

let root = null;
let sides = [];
let raf = 0;
let running = false;
let fadingOut = false;
let t0 = 0;
let lastT = 0;
let killTimer = null;

const rand = (a, b) => a + Math.random() * (b - a);
function hexRgba(hex, a) {
  const n = parseInt(String(hex || '#a0b0c8').replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function layout() {
  if (!root) return;
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  root.style.left = `${(window.innerWidth - W * s) / 2}px`;
  root.style.top = `${(window.innerHeight - H * s) / 2}px`;
  root.style.transform = `scale(${s})`;
}

function gradientCss() {
  const col = S.stormCol;
  const rx = S.stormEllRX, ry = S.stormEllRY;
  const cx = 50 + S.stormEllX, cy = S.stormEllY;
  const oe = S.stormEllOpEdge, oh = S.stormEllOpHalf;
  const half = `radial-gradient(ellipse ${rx * 0.72}% ${ry * 0.72}% at ${cx}% ${cy}%,
    transparent 0%, transparent 28%,
    ${hexRgba(col, oh * 0.35)} 48%, ${hexRgba(col, oh)} 72%, ${hexRgba(col, oh * 0.9)} 100%)`;
  const edge = `radial-gradient(ellipse ${rx}% ${ry}% at ${cx}% ${cy}%,
    transparent 0%, transparent 42%,
    ${hexRgba(col, oe * 0.4)} 58%, ${hexRgba(col, oe)} 78%, ${hexRgba(col, oe * 0.85)} 100%)`;
  return `${half}, ${edge}`;
}

function makeSide(areaY) {
  // obszar przycinany: gradient + błyski + pioruny
  const clip = document.createElement('div');
  clip.style.cssText =
    `position:absolute;left:${S.rowX}px;top:${areaY}px;width:${S.rowW}px;height:${S.rowH}px;` +
    `overflow:hidden;pointer-events:none;`;
  root.appendChild(clip);

  const grad = document.createElement('div');
  grad.style.cssText = `position:absolute;inset:0;pointer-events:none;background:${gradientCss()};`;
  const flLayer = document.createElement('div');
  flLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  const ltLayer = document.createElement('div');
  ltLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  clip.append(grad, flLayer, ltLayer);

  // pozycje liczone względem rzędu gracza (ten sam układ u przeciwnika)
  const glow = `drop-shadow(0 0 ${S.ltGlowBlur}px ${hexRgba(S.ltGlowCol, S.ltGlowOp)})`;
  const ltEls = LIGHTNINGS.map(([sf, ef, img, x1, y1, x2, y2, mirror]) => {
    const el = document.createElement('div');
    el.style.cssText =
      `position:absolute;left:${Math.min(x1, x2) - S.rowX}px;top:${Math.min(y1, y2) - S.rainSelfY}px;` +
      `width:${Math.abs(x2 - x1)}px;height:${Math.abs(y2 - y1)}px;` +
      `background:url('${PATH[img]}') center / contain no-repeat;filter:${glow};opacity:0;` +
      `pointer-events:none;${mirror ? 'transform:scaleX(-1);' : ''}`;
    ltLayer.appendChild(el);
    return { el, sf, ef };
  });

  const flEls = FLASHES.map(([frame, x, y]) => {
    const lx = x - S.rowX, ly = y - S.rainSelfY;
    const outer = document.createElement('div');
    const inner = document.createElement('div');
    outer.style.cssText =
      `position:absolute;border-radius:50%;pointer-events:none;opacity:0;` +
      `left:${lx - S.flRX}px;top:${ly - S.flRY}px;width:${S.flRX * 2}px;height:${S.flRY * 2}px;` +
      `background:radial-gradient(ellipse at center, ${hexRgba(S.flC0, S.flOp0)} 0%, ${hexRgba(S.flC0, 0)} 70%)`;
    inner.style.cssText =
      `position:absolute;border-radius:50%;pointer-events:none;opacity:0;` +
      `left:${lx - S.flIRX}px;top:${ly - S.flIRY}px;width:${S.flIRX * 2}px;height:${S.flIRY * 2}px;` +
      `background:radial-gradient(ellipse at center, ${hexRgba(S.flC1, S.flOp1)} 0%, ${hexRgba(S.flC1, 0)} 70%)`;
    flLayer.append(outer, inner);
    return { outer, inner, frame };
  });

  // kropelki – bez przycinania (mogą ściekać poza rząd)
  const kdLayer = document.createElement('div');
  kdLayer.style.cssText =
    `position:absolute;left:${S.rowX}px;top:${areaY}px;width:${S.rowW}px;height:${S.rowH}px;` +
    `overflow:visible;pointer-events:none;`;
  root.appendChild(kdLayer);

  return { ltEls, flEls, kdLayer, kdPool: [], kdAcc: 0 };
}

function spawnDrop(side, now) {
  if (side.kdPool.length >= S.kdMax) return;
  const el = document.createElement('div');
  const base = S.kdBase;
  const sT = rand(S.kdSmin, S.kdSmax);
  const drip = Math.random() < S.kdDripChance;
  const x = rand(0, S.rowW);
  const y = rand(0, S.rowH * 0.65);
  el.style.cssText =
    `position:absolute;width:${base}px;height:${base}px;left:${x - base / 2}px;top:${y}px;opacity:0;` +
    `background:url('${PATH.kd}') center / contain no-repeat;transform-origin:center top;pointer-events:none;`;
  side.kdLayer.appendChild(el);
  side.kdPool.push({
    el, y, sT, t0: now,
    life: S.kdLife * 1000,
    dy: drip ? S.kdDy : S.kdDy * 0.15,
    stretch: drip ? S.kdStretch : 1.05
  });
}

function tickDrops(side, now) {
  for (let i = side.kdPool.length - 1; i >= 0; i--) {
    const d = side.kdPool[i];
    const t = (now - d.t0) / d.life;
    if (t >= 1) { d.el.remove(); side.kdPool.splice(i, 1); continue; }
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

function startFadeOut() {
  if (fadingOut) return;
  fadingOut = true;
  if (root) {
    root.style.transition = `opacity ${FADE_OUT_MS}ms linear`;
    root.style.opacity = '0';
  }
  killTimer = setTimeout(destroy, FADE_OUT_MS + 50);
}

function tick(now) {
  if (!root) return;
  const dt = Math.min(40, now - (lastT || now));
  lastT = now;
  const frame = Math.max(0, (now - t0) / MS60);

  if (frame < CYCLE_FRAMES) {
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
      if (frame > 0 && !fadingOut) {
        side.kdAcc += dt / 1000 * S.kdRate;
        while (side.kdAcc >= 1) { spawnDrop(side, now); side.kdAcc--; }
      }
    });
  } else {
    startFadeOut();
  }

  sides.forEach(side => tickDrops(side, now));
  raf = requestAnimationFrame(tick);
}

function destroy() {
  cancelAnimationFrame(raf);
  raf = 0;
  clearTimeout(killTimer);
  killTimer = null;
  if (root) root.remove();
  root = null;
  sides = [];
  lastT = 0;
  running = false;
  fadingOut = false;
  window.removeEventListener('resize', layout);
}

/** Wołane po wylądowaniu karty Sztorm. Mgłę i deszcz odpala game_board.js. */
export function playStormFx() {
  if (running) return;
  running = true;
  fadingOut = false;

  root = document.createElement('div');
  root.id = 'storm-fx-root';
  root.style.cssText =
    `position:fixed;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;` +
    `pointer-events:none;z-index:110;opacity:0;`;
  document.body.appendChild(root);

  sides = [makeSide(S.rainSelfY), makeSide(S.rainOppY)];
  layout();
  window.addEventListener('resize', layout);

  root.style.transition = 'none';
  root.offsetHeight;
  root.style.transition = `opacity ${FADE_IN_MS}ms linear`;
  root.style.opacity = '1';

  t0 = performance.now() + FADE_IN_MS;
  lastT = 0;
  raf = requestAnimationFrame(tick);
}