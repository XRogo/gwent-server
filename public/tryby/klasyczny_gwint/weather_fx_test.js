// weather_fx_test.js
const W = 3840, H = 2160;
const MS60 = 1000 / 60;

const PATH = {
  rain: 'assets/asety/effekty/deszcz.webp',
  dymek: 'assets/asety/effekty/dymek.webp',
  p1: 'assets/asety/effekty/pierun1.webp',
  p2: 'assets/asety/effekty/pierun2.webp',
  kd: 'assets/asety/effekty/kropelka.webp',
};

const LIGHTNINGS = [
  [9, 10, 'p2', 1118, 1319, 1829, 1713, false],
  [11, 12, 'p1', 1327, 1274, 1842, 1725, false],
  [46, 48, 'p1', 2366, 1272, 2927, 1763, true],
  [51, 53, 'p1', 2576, 1221, 3137, 1712, true],
  [54, 56, 'p2', 2057, 1291, 2923, 1772, false],
];
const FLASHES = [
  [11, 1505, 1471],
  [15, 1910, 1422],
  [46, 2799, 1442],
  [52, 2680, 1440],
];

const DEFAULTS = {
  rowX: 1140, rowW: 1906, rowH: 252,
  rainSelfY: 1400, rainOppY: 280,
  fogSelfY: 1120, fogOppY: 560,

  // deszcz
  rainSpeed: 450,
  rainTileH: 160,
  rainScale: 1.0,
  rainOverlap: 50,
  rainOp: 1,
  rainXJitter: 40,
  rainMargin: 20,

  // dymki pod deszczem
  rainBubbleCount: 40,
  rbSX: 60,
  rbSY: 40,
  rbYOff: 27,
  rbOp: 0.73,
  rbFade: 0.25,
  rbLife: 0.45,

  // mgła (z SS)
  fogCol: '#c8c8c8',
  fogMid: 0.54,
  fogEdge: 0.15,
  fogEH: 64,
  fogEW: 87,
  fogGradH: 45,
  fogCount: 15,
  fogS0: 330,
  fogS1: 579,
  fogLife: 20,
  fogFade: 1.2,
  fogSpd: 32,
  fogSpin: 0.3,
  fogOp: 0.19,
  rainFogOp: 0.07,

  // gradient sztormu
  stormCol: '#a0b0c8',
  stormMid: 0.22,
  stormEdge: 0.55,
  stormMidH: 38,
  stormSideH: 70,
  stormSideW: 48,
  stormAngle: 28,
  stormInset: 8,

  // błyski (z SS)
  flRX: 800,
  flRY: 300,
  flIRX: 200,
  flIRY: 150,
  flC0: '#4aa0ff',
  flC1: '#ffffff',
  flOp0: 0.71,
  flOp1: 0.5,

  // poświata piorunów
  ltGlowCol: '#64b4ff',
  ltGlowBlur: 14,
  ltGlowOp: 0.95,

  // kropelki (jak na gicie)
  kdMax: 12,
  kdRate: 4,
  kdBase: 41,
  kdSmin: 0.7,
  kdSmax: 2.5,
  kdStretch: 2.2,
  kdLife: 0.7,
  kdDy: 55,
  kdDripChance: 0.55,
};

let cfg = { ...DEFAULTS };
let mode = null;
let raf = 0;
let t0 = 0;
let sides = [];
let kdPool = [];
let kdAcc = 0;

const stage = () => document.getElementById('stage');
const fxRoot = () => document.getElementById('fx-root');
const guides = () => document.getElementById('guides');

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function hexRgba(hex, a) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  if (!Number.isFinite(n)) return `rgba(160,176,200,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ---------- UI ---------- */
function bindUI() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (!(k in cfg)) return;
    if (el.type === 'color') {
      el.value = cfg[k];
      el.addEventListener('input', () => {
        cfg[k] = el.value;
        rebuildIfRunning();
      });
    } else {
      el.value = cfg[k];
      const sync = () => {
        cfg[k] = +el.value;
        document.querySelectorAll(`[data-k="${k}"]`).forEach(o => {
          if (o !== el) o.value = cfg[k];
        });
        const span = el.parentElement?.querySelector('.val');
        if (span) span.textContent = cfg[k];
        rebuildIfRunning();
      };
      el.addEventListener('input', sync);
      const span = el.parentElement?.querySelector('.val');
      if (span) span.textContent = cfg[k];
    }
  });

  document.getElementById('btn-rain').onclick = () => start('rain');
  document.getElementById('btn-fog').onclick = () => start('fog');
  document.getElementById('btn-storm').onclick = () => start('storm');
  document.getElementById('btn-stop').onclick = stop;
  document.getElementById('btn-restart').onclick = () => { if (mode) start(mode); };
  document.getElementById('show-guide').onchange = drawGuides;
  document.getElementById('zoom').oninput = e => {
    document.getElementById('zoom-v').textContent = (+e.target.value).toFixed(2);
    layoutZoom();
  };
  document.getElementById('btn-fit').onclick = fitZoom;
  document.getElementById('btn-export').onclick = exportJSON;
  document.getElementById('btn-import').onclick = () => document.getElementById('file-import').click();
  document.getElementById('file-import').onchange = e => {
    const f = e.target.files?.[0];
    if (f) importJSON(f);
  };
  window.addEventListener('resize', layoutZoom);
  fitZoom();
  drawGuides();
}

function layoutZoom() {
  const z = +document.getElementById('zoom').value;
  const outer = document.getElementById('stage-outer');
  outer.style.width = W * z + 'px';
  outer.style.height = H * z + 'px';
  stage().style.transform = `scale(${z})`;
}

function fitZoom() {
  const wrap = document.getElementById('stage-wrap');
  const z = Math.min(wrap.clientWidth / W, wrap.clientHeight / H) * 0.95;
  document.getElementById('zoom').value = z;
  document.getElementById('zoom-v').textContent = z.toFixed(2);
  layoutZoom();
}

function drawGuides() {
  const g = guides();
  g.innerHTML = '';
  if (!document.getElementById('show-guide').checked) return;
  const mk = (y, label) => {
    const d = document.createElement('div');
    d.className = 'area-guide';
    d.style.cssText = `left:${cfg.rowX}px;top:${y}px;width:${cfg.rowW}px;height:${cfg.rowH}px`;
    d.title = label;
    g.appendChild(d);
  };
  mk(cfg.rainSelfY, 'rain self');
  mk(cfg.rainOppY, 'rain opp');
  mk(cfg.fogSelfY, 'fog self');
  mk(cfg.fogOppY, 'fog opp');
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'weather_fx_settings.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      Object.assign(cfg, JSON.parse(reader.result));
      document.querySelectorAll('[data-k]').forEach(el => {
        const k = el.dataset.k;
        if (!(k in cfg)) return;
        el.value = cfg[k];
        const span = el.parentElement?.querySelector('.val');
        if (span) span.textContent = cfg[k];
      });
      drawGuides();
      if (mode) start(mode);
    } catch (err) {
      alert('Błąd JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

/* ---------- BUILD ---------- */
function clearFX() {
  cancelAnimationFrame(raf);
  raf = 0;
  fxRoot().innerHTML = '';
  sides = [];
  kdPool.forEach(k => k.el.remove());
  kdPool = [];
  kdAcc = 0;
}

function makeSide(y, isOpp, kind) {
  const root = document.createElement('div');
  root.className = 'fx-side';
  root.style.cssText = `left:${cfg.rowX}px;top:${y}px;width:${cfg.rowW}px;height:${cfg.rowH}px`;

  const fogGrad = document.createElement('div');
  fogGrad.className = 'fx-layer fog-grad';

  const stormMid = document.createElement('div');
  stormMid.className = 'fx-layer storm-grad-mid';
  const stormL = document.createElement('div');
  stormL.className = 'fx-layer storm-grad-l';
  const stormR = document.createElement('div');
  stormR.className = 'fx-layer storm-grad-r';

  const fogPuffs = document.createElement('div');
  fogPuffs.className = 'fx-layer';

  const flLayer = document.createElement('div');
  flLayer.className = 'fx-layer';
  const ltLayer = document.createElement('div');
  ltLayer.className = 'fx-layer';

  const rainWrap = document.createElement('div');
  rainWrap.className = 'fx-layer';
  rainWrap.style.overflow = 'hidden';
  const rainScroll = document.createElement('div');
  rainScroll.className = 'rain-scroll';
  rainWrap.appendChild(rainScroll);

  const kdLayer = document.createElement('div');
  kdLayer.className = 'fx-layer';
  kdLayer.style.overflow = 'visible';
  kdLayer.style.zIndex = '8';

  root.append(fogGrad, stormMid, stormL, stormR, fogPuffs, flLayer, ltLayer, rainWrap, kdLayer);
  fxRoot().appendChild(root);

  // TYLKO dymki pod deszczem – poza .fx-side → zero clippingu
  let bubbleSpill = null;
  if (kind === 'rain') {
    bubbleSpill = document.createElement('div');
    bubbleSpill.className = 'fx-bubble-spill';
    bubbleSpill.style.cssText =
      `left:${cfg.rowX}px;top:${y}px;width:${cfg.rowW}px;height:${cfg.rowH}px`;
    fxRoot().appendChild(bubbleSpill);
  }

  return {
    root, isOpp, y, kind,
    fogGrad, stormMid, stormL, stormR, fogPuffs,
    flLayer, ltLayer, rainWrap, rainScroll, kdLayer, bubbleSpill,
    rainBubbles: [], fogParts: [], ltEls: [], flEls: [],
  };
}

function buildRainTiles(side) {
  const sc = side.rainScroll;
  sc.innerHTML = '';

  const baseH = cfg.rainTileH;
  const scale = Math.max(0.3, cfg.rainScale || 1);
  const tileH = baseH * scale;
  const step = tileH * (1 - cfg.rainOverlap / 100);
  const margin = cfg.rainMargin || 20;
  const need = Math.ceil((cfg.rowH + margin * 2) / step) + 5;
  const jitter = cfg.rainXJitter || 0;

  sc.style.top = (-margin) + 'px';
  sc.style.height = (need * step + tileH + margin) + 'px';
  sc.style.width = '100%';
  sc.style.left = '0';

  for (let i = 0; i < need; i++) {
    const ox = (Math.random() * 2 - 1) * jitter;
    const top = i * step;

    const mkImg = (leftPct) => {
      const img = document.createElement('img');
      img.src = PATH.rain;
      img.draggable = false;
      const wPct = 100 * scale;
      const left = leftPct + (100 - wPct) / 2;
      img.style.cssText =
        `position:absolute;left:${left}%;width:${wPct}%;height:${tileH}px;top:${top}px;` +
        `opacity:${cfg.rainOp};object-fit:cover;object-position:center top;`;
      sc.appendChild(img);
    };

    const baseLeft = (ox / cfg.rowW) * 100;
    mkImg(baseLeft);
    if (jitter > 4) {
      mkImg(baseLeft - 100);
      mkImg(baseLeft + 100);
    }
  }

  side.tileStep = step;
  side.tileTotal = need * step;
  side.rainMargin = margin;
}

function buildRainBubbles(side) {
  if (!side.bubbleSpill) return;
  side.bubbleSpill.innerHTML = '';
  side.rainBubbles = [];
  const now = performance.now();
  const lifeMs = Math.max(100, (cfg.rbLife || 0.45) * 1000);
  const fadeMs = Math.max(40, (cfg.rbFade || 0.25) * 1000);

  for (let i = 0; i < cfg.rainBubbleCount; i++) {
    const el = document.createElement('div');
    el.className = 'rain-bubble';
    const sx = cfg.rbSX, sy = cfg.rbSY;
    const y = cfg.rowH + cfg.rbYOff;
    const x = rand(0, cfg.rowW);
    el.style.cssText =
      `left:${x - sx / 2}px;top:${y - sy / 2}px;width:${sx}px;height:${sy}px;opacity:0`;
    side.bubbleSpill.appendChild(el);
    side.rainBubbles.push({
      el,
      t0: now + rand(0, lifeMs * 1.8),
      life: lifeMs * rand(0.85, 1.15),
      fade: fadeMs,
      baseOp: cfg.rbOp,
    });
  }
}

function buildFogGrad(side) {
  const c = cfg.fogCol;
  const mid = cfg.fogMid, edge = cfg.fogEdge;
  const h = clamp(cfg.fogGradH || 45, 5, 100);

  side.fogGrad.style.background =
    `radial-gradient(ellipse ${cfg.fogEW}% ${cfg.fogEH}% at 50% 100%,
      ${hexRgba(c, mid)} 0%,
      ${hexRgba(c, mid * 0.45)} 40%,
      ${hexRgba(c, edge)} 65%,
      transparent 100%)`;

  const fade = Math.min(18, h * 0.35);
  side.fogGrad.style.maskImage =
    `linear-gradient(to top, #000 0%, #000 ${h - fade}%, transparent ${h}%)`;
  side.fogGrad.style.webkitMaskImage = side.fogGrad.style.maskImage;
  side.fogGrad.style.maskSize = '100% 100%';
  side.fogGrad.style.webkitMaskSize = '100% 100%';
}

function buildStormGrad(side) {
  const c = cfg.stormCol;
  const mid = cfg.stormMid;
  const edge = cfg.stormEdge;
  const midH = cfg.stormMidH;
  const sideH = cfg.stormSideH;
  const sideW = cfg.stormSideW;
  const ang = cfg.stormAngle;
  const inset = cfg.stormInset;

  // 1. środkowy – poziomy pas od dołu
  side.stormMid.style.background =
    `linear-gradient(to top,
      ${hexRgba(c, mid)} 0%,
      ${hexRgba(c, mid * 0.4)} 55%,
      transparent 100%)`;
  side.stormMid.style.maskImage =
    `linear-gradient(to top, #000 0%, #000 ${midH}%, transparent ${midH + 12}%)`;
  side.stormMid.style.webkitMaskImage = side.stormMid.style.maskImage;

  // 2. lewy – od dolnego-lewego rogu, pochylony
  const aL = 90 + ang;
  side.stormL.style.background =
    `linear-gradient(${aL}deg,
      ${hexRgba(c, edge)} 0%,
      ${hexRgba(c, edge * 0.55)} 40%,
      transparent 72%)`;
  side.stormL.style.maskImage = [
    `linear-gradient(to right, #000 0%, #000 ${sideW}%, transparent ${sideW + 22}%)`,
    `linear-gradient(to top, #000 0%, #000 ${sideH}%, transparent ${sideH + 18}%)`,
    `linear-gradient(to right, transparent 0%, transparent ${inset}%, #000 ${inset + 1}%)`
  ].join(',');
  side.stormL.style.webkitMaskImage = side.stormL.style.maskImage;
  side.stormL.style.maskComposite = 'intersect';
  side.stormL.style.webkitMaskComposite = 'source-in';

  // 3. prawy – lustrzany
  const aR = 90 - ang;
  side.stormR.style.background =
    `linear-gradient(${aR}deg,
      ${hexRgba(c, edge)} 0%,
      ${hexRgba(c, edge * 0.55)} 40%,
      transparent 72%)`;
  side.stormR.style.maskImage = [
    `linear-gradient(to left, #000 0%, #000 ${sideW}%, transparent ${sideW + 22}%)`,
    `linear-gradient(to top, #000 0%, #000 ${sideH}%, transparent ${sideH + 18}%)`,
    `linear-gradient(to left, transparent 0%, transparent ${inset}%, #000 ${inset + 1}%)`
  ].join(',');
  side.stormR.style.webkitMaskImage = side.stormR.style.maskImage;
  side.stormR.style.maskComposite = 'intersect';
  side.stormR.style.webkitMaskComposite = 'source-in';
}

function spawnFogPuff(side, now, isRainMode) {
  const size = rand(cfg.fogS0, cfg.fogS1);
  const el = document.createElement('div');
  el.className = 'fog-puff';
  const x0 = rand(size * 0.15, cfg.rowW - size * 0.15);
  const y0 = rand(size * 0.15, cfg.rowH - size * 0.15);
  el.style.cssText = `width:${size}px;height:${size}px;opacity:0`;
  side.fogPuffs.appendChild(el);
  const maxOp = isRainMode ? cfg.rainFogOp : cfg.fogOp;
  side.fogParts.push({
    el, size,
    t0: now + rand(0, cfg.fogLife * 700),
    life: cfg.fogLife * 1000 * rand(0.85, 1.15),
    fade: cfg.fogFade * 1000,
    x0, y0,
    cx1: x0 + rand(-120, 120), cy1: y0 + rand(-80, 80),
    cx2: x0 + rand(-120, 120), cy2: y0 + rand(-80, 80),
    x1: x0 + rand(-180, 180), y1: y0 + rand(-100, 100),
    rot0: rand(0, Math.PI * 2),
    spin: rand(-cfg.fogSpin, cfg.fogSpin),
    op: maxOp * rand(0.6, 1),
  });
}

function bezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function buildLightnings(side) {
  side.ltLayer.innerHTML = '';
  side.ltEls = [];
  const glow = `drop-shadow(0 0 ${cfg.ltGlowBlur}px ${hexRgba(cfg.ltGlowCol, cfg.ltGlowOp)})`;
  LIGHTNINGS.forEach(L => {
    const [sf, ef, img, x1, y1, x2, y2, mirror] = L;
    const el = document.createElement('div');
    el.className = 'lightning' + (mirror ? ' mirror' : '');
    const ww = Math.abs(x2 - x1);
    const hh = Math.abs(y2 - y1);
    const lx = Math.min(x1, x2) - cfg.rowX;
    const ly = Math.min(y1, y2) - side.y;
    el.style.cssText =
      `left:${lx}px;top:${ly}px;width:${ww}px;height:${hh}px;` +
      `background-image:url('${PATH[img]}');filter:${glow}`;
    side.ltLayer.appendChild(el);
    side.ltEls.push({ el, sf, ef });
  });
}

function buildFlashes(side) {
  side.flLayer.innerHTML = '';
  side.flEls = [];
  FLASHES.forEach(([frame, x, y]) => {
    const outer = document.createElement('div');
    outer.className = 'flash-outer';
    const inner = document.createElement('div');
    inner.className = 'flash-inner';
    const lx = x - cfg.rowX;
    const ly = y - side.y;
    outer.style.cssText =
      `left:${lx - cfg.flRX}px;top:${ly - cfg.flRY}px;width:${cfg.flRX * 2}px;height:${cfg.flRY * 2}px;` +
      `background:radial-gradient(ellipse at center, ${hexRgba(cfg.flC0, cfg.flOp0)} 0%, ${hexRgba(cfg.flC0, 0)} 70%)`;
    inner.style.cssText =
      `left:${lx - cfg.flIRX}px;top:${ly - cfg.flIRY}px;width:${cfg.flIRX * 2}px;height:${cfg.flIRY * 2}px;` +
      `background:radial-gradient(ellipse at center, ${hexRgba(cfg.flC1, cfg.flOp1)} 0%, ${hexRgba(cfg.flC1, 0)} 70%)`;
    side.flLayer.appendChild(outer);
    side.flLayer.appendChild(inner);
    side.flEls.push({ outer, inner, frame });
  });
}

function spawnKd(side, now) {
  if (kdPool.length >= cfg.kdMax) return;
  const el = document.createElement('div');
  el.className = 'storm-drop';
  const base = cfg.kdBase;
  const sT = rand(cfg.kdSmin, cfg.kdSmax);
  const drip = Math.random() < cfg.kdDripChance;
  const x = rand(0, cfg.rowW);
  const y = rand(0, cfg.rowH * 0.65);
  el.style.cssText =
    `width:${base}px;height:${base}px;left:${x - base / 2}px;top:${y}px;opacity:0`;
  side.kdLayer.appendChild(el);
  kdPool.push({
    el, x, y, base, sT, drip,
    t0: now,
    life: cfg.kdLife * 1000,
    dy: drip ? cfg.kdDy : cfg.kdDy * 0.15,
    stretch: drip ? cfg.kdStretch : 1.05,
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

function rebuildIfRunning() {
  drawGuides();
  if (mode) start(mode);
}

/* ---------- START / LOOP ---------- */
function start(m) {
  clearFX();
  mode = m;
  document.getElementById('mode-label').textContent = m.toUpperCase();
  t0 = performance.now();

  const needRain = m === 'rain' || m === 'storm';
  const needFog = m === 'fog' || m === 'storm';
  const needStorm = m === 'storm';

  if (needRain) {
    [false, true].forEach(isOpp => {
      const y = isOpp ? cfg.rainOppY : cfg.rainSelfY;
      const s = makeSide(y, isOpp, 'rain');
      buildRainTiles(s);
      buildRainBubbles(s);
      if (needStorm) {
        buildStormGrad(s);
        buildLightnings(s);
        buildFlashes(s);
      }
      sides.push(s);
    });
  }
  if (needFog) {
    [false, true].forEach(isOpp => {
      const y = isOpp ? cfg.fogOppY : cfg.fogSelfY;
      const s = makeSide(y, isOpp, 'fog');
      buildFogGrad(s);
      sides.push(s);
    });
  }

  const tick = now => {
    if (!mode) return;
    const t = now - t0;
    const frame = t / MS60;
    const dt = Math.min(40, now - (tick._last || now));
    tick._last = now;

    sides.forEach(side => {
      // deszcz – scroll w dół
      if (side.rainScroll && side.tileStep) {
        const y = (t / 1000 * cfg.rainSpeed) % side.tileStep;
        side.rainScroll.style.transform = `translate3d(0, ${y}px, 0)`;
      }

      // dymki pod deszczem (poza kontenerem)
      side.rainBubbles?.forEach(b => {
        const age = now - b.t0;
        if (age < 0) { b.el.style.opacity = '0'; return; }
        const cycleLen = b.life + b.fade * 2;
        const cycle = age % cycleLen;
        let op = 0;
        if (cycle < b.fade) op = (cycle / b.fade) * b.baseOp;
        else if (cycle < b.life + b.fade) op = b.baseOp;
        else op = (1 - (cycle - b.life - b.fade) / b.fade) * b.baseOp;
        b.el.style.opacity = String(clamp(op, 0, 1));
      });

      // dymki mgły
      if (side.fogPuffs) {
        const target = (mode === 'fog' || mode === 'storm')
          ? cfg.fogCount
          : (mode === 'rain' ? Math.floor(cfg.fogCount * 0.55) : 0);
        while (side.fogParts.length < target) {
          spawnFogPuff(side, now, mode === 'rain');
        }
        side.fogParts = side.fogParts.filter(p => {
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
      }

      // pioruny
      side.ltEls?.forEach(({ el, sf, ef }) => {
        el.style.opacity = (frame >= sf && frame <= ef + 0.5) ? '1' : '0';
      });

      // błyski
      side.flEls?.forEach(({ outer, inner, frame: ff }) => {
        const local = frame - ff;
        let op = 0;
        if (local >= 0 && local <= 4) op = 1;
        else if (local > 4 && local <= 14) op = 1 - (local - 4) / 10;
        outer.style.opacity = String(op);
        inner.style.opacity = String(op);
      });
    });

    // kropelki tylko w sztormie
    if (mode === 'storm') {
      kdAcc += dt / 1000 * cfg.kdRate;
      const rainSide = sides.find(s => s.kind === 'rain' && !s.isOpp);
      while (kdAcc >= 1 && rainSide) {
        spawnKd(rainSide, now);
        kdAcc--;
      }
      tickKd(now);
    }

    if (mode === 'storm' && frame > 120) t0 = now;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function stop() {
  mode = null;
  clearFX();
  document.getElementById('mode-label').textContent = '— stop —';
}

bindUI();