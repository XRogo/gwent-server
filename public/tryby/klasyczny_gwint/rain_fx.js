// rain_fx.js – deszcz na rzędzie 3 (oblężnicze) obu graczy: kafelki deszcz.webp + dymki
// przy krawędzi + dymki latające w losowych kierunkach (jak w mgle). Parametry z weather_fx_test.
const W = 3840, H = 2160;

const S = {
  rowX: 1138, rowW: 1906, rowH: 239,
  rainSelfY: 1407, rainOppY: 29,

  rainSpeed: 830,
  rainSizeX: 3300, rainSizeY: 2000,
  rainOverlap: 63,
  rainOp: 0.85,
  rainMarginTop: 20, rainMarginBot: 20,

  rainBubbleCount: 900,
  rbSX: 52, rbSY: 29, rbYOff: -9,
  rbOp: 0.35, rbLife: 0.35, rbRise: 5,
  rbScaleStart: 0.55, rbScaleEnd: 1.35, rbFadeSpeed: 1.4
};

// dymki latające w losowych kierunkach (z efektu mgły)
const PUFF = {
  count: 15, instant: 3,
  s0: 330, s1: 579,
  life: 20, fade: 1.2, spin: 0.3,
  op: 0.10
};

const FADE_IN_MS = 1000;
const FADE_OUT_MS = 600;

const RAIN_SRC = 'assets/asety/effekty/deszcz.webp';
const BUBBLE_SRC = 'assets/asety/effekty/dymek.webp';

let root = null;
let sides = [];
let raf = 0;
let running = false;
let stopTimer = null;
let lastT = 0;

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const bezier = (t, p0, p1, p2, p3) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};

function ensureStyles() {
  if (document.getElementById('rain-fx-styles')) return;
  const st = document.createElement('style');
  st.id = 'rain-fx-styles';
  st.textContent = `
    #rain-fx-root { position:fixed; left:0; top:0; width:${W}px; height:${H}px;
      transform-origin:0 0; pointer-events:none; z-index:100; opacity:0; }
    .rain-side { position:absolute; overflow:hidden; pointer-events:none; }
    .rain-layer { position:absolute; inset:0; pointer-events:none; }
    .rain-spill { position:absolute; overflow:visible; pointer-events:none; height:0; }
    .rain-tile { position:absolute; display:block; pointer-events:none; will-change:transform; object-fit:fill; }
    .rain-bubble { position:absolute; pointer-events:none; will-change:transform,opacity;
      transform-origin:center center;
      background:url('${BUBBLE_SRC}') center / 100% 100% no-repeat; }
    .rain-puff { position:absolute; left:0; top:0; pointer-events:none; will-change:transform,opacity;
      background:url('${BUBBLE_SRC}') center / contain no-repeat; }
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

function createTile(centerX, y, tw, th) {
  const imgs = [];
  const left = centerX - tw / 2;
  const offsets = [0];
  if (left < 0) offsets.push(tw);
  if (left + tw > S.rowW) offsets.push(-tw);
  if (tw > S.rowW) offsets.push(tw * 2, -tw * 2);

  [...new Set(offsets)].forEach(off => {
    const img = document.createElement('img');
    img.className = 'rain-tile';
    img.src = RAIN_SRC;
    img.draggable = false;
    img.style.cssText = `width:${tw}px;height:${th}px;left:${left + off}px;top:0;` +
      `opacity:${S.rainOp};transform:translateY(${y}px)`;
    imgs.push(img);
  });
  return { imgs, y };
}

function makeSide(areaY) {
  const el = document.createElement('div');
  el.className = 'rain-side';
  el.style.cssText = `left:${S.rowX}px;top:${areaY}px;width:${S.rowW}px;height:${S.rowH}px`;

  const tilesLayer = document.createElement('div');
  tilesLayer.className = 'rain-layer';
  const puffsLayer = document.createElement('div');
  puffsLayer.className = 'rain-layer';
  el.append(tilesLayer, puffsLayer);

  const spill = document.createElement('div');
  spill.className = 'rain-spill';
  spill.style.cssText = `left:${S.rowX}px;top:${areaY + S.rowH}px;width:${S.rowW}px`;

  root.append(el, spill);
  return {
    el, spill, tilesLayer, puffsLayer,
    tiles: [], bubbles: [], puffs: [],
    lastBubble: 0, puffSpawned: 0
  };
}

function ensureTiles(side) {
  const tw = Math.max(40, S.rainSizeX);
  const th = Math.max(30, S.rainSizeY);
  const overlap = clamp(S.rainOverlap / 100, 0.1, 0.92);
  const step = Math.max(4, th * (1 - overlap));
  const needSpan = S.rowH + S.rainMarginTop + S.rainMarginBot + th;
  const minCount = Math.ceil(needSpan / step) + 2;
  const tiles = side.tiles;

  tiles.sort((a, b) => a.y - b.y);
  for (let i = tiles.length - 1; i >= 0; i--) {
    if (tiles[i].y > S.rowH + S.rainMarginBot) {
      tiles[i].imgs.forEach(im => im.remove());
      tiles.splice(i, 1);
    }
  }
  while (tiles.length < minCount ||
         (tiles.length > 0 && tiles[0].y > -S.rainMarginTop - th * 0.12)) {
    const topY = tiles.length ? tiles[0].y - step : -S.rainMarginTop - th;
    const tile = createTile(Math.random() * S.rowW, topY, tw, th);
    tile.imgs.forEach(im => side.tilesLayer.appendChild(im));
    tiles.unshift(tile);
  }
}

function tickBubbles(side, now) {
  const countTarget = Math.round(S.rainBubbleCount);
  const interval = countTarget <= 0 ? 99999 : 1.0 / Math.max(1, countTarget / 14);

  if (running && now - side.lastBubble > interval * 1000 &&
      side.bubbles.length < countTarget + 8) {
    side.lastBubble = now + Math.random() * 90;
    const x = Math.random() * S.rowW;
    const b = document.createElement('div');
    b.className = 'rain-bubble';
    b.style.cssText = `width:${S.rbSX}px;height:${S.rbSY}px;left:${x - S.rbSX / 2}px;` +
      `top:${S.rbYOff - S.rbSY / 2}px;opacity:0;transform:translateY(0px) scale(${S.rbScaleStart})`;
    side.spill.appendChild(b);
    side.bubbles.push({ el: b, t0: now, life: S.rbLife * 1000 });
  }

  for (let i = side.bubbles.length - 1; i >= 0; i--) {
    const b = side.bubbles[i];
    const t = (now - b.t0) / b.life;
    if (t >= 1) { b.el.remove(); side.bubbles.splice(i, 1); continue; }
    const fadeT = Math.min(1, Math.pow(t, 1 / S.rbFadeSpeed));
    const sc = S.rbScaleStart + (S.rbScaleEnd - S.rbScaleStart) * t;
    b.el.style.opacity = String(clamp(S.rbOp * (1 - fadeT), 0, 1));
    b.el.style.transform = `translateY(${-S.rbRise * t}px) scale(${sc})`;
  }
}

function spawnPuff(side, now) {
  const immediate = side.puffSpawned < PUFF.instant;
  side.puffSpawned++;

  const size = rand(PUFF.s0, PUFF.s1);
  const el = document.createElement('div');
  el.className = 'rain-puff';
  const x0 = rand(size * 0.15, S.rowW - size * 0.15);
  const y0 = rand(size * 0.15, S.rowH - size * 0.15);
  el.style.cssText = `width:${size}px;height:${size}px;opacity:0`;
  side.puffsLayer.appendChild(el);

  side.puffs.push({
    el, size,
    t0: immediate ? now : now + rand(0, PUFF.life * 700),
    life: PUFF.life * 1000 * rand(0.85, 1.15),
    fade: PUFF.fade * 1000,
    x0, y0,
    cx1: x0 + rand(-120, 120), cy1: y0 + rand(-80, 80),
    cx2: x0 + rand(-120, 120), cy2: y0 + rand(-80, 80),
    x1: x0 + rand(-180, 180), y1: y0 + rand(-100, 100),
    rot0: rand(0, Math.PI * 2),
    spin: rand(-PUFF.spin, PUFF.spin),
    op: PUFF.op * rand(0.6, 1)
  });
}

function tickPuffs(side, now) {
  while (side.puffs.length < PUFF.count && running) spawnPuff(side, now);

  side.puffs = side.puffs.filter(p => {
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

function tick(now) {
  if (!root) return;
  const dt = Math.min(40, now - (lastT || now));
  lastT = now;
  const dy = Math.max(5, S.rainSpeed) * (dt / 1000);

  sides.forEach(side => {
    side.tiles.forEach(t => {
      t.y += dy;
      t.imgs.forEach(im => { im.style.transform = `translateY(${t.y}px)`; });
    });
    ensureTiles(side);
    tickBubbles(side, now);
    tickPuffs(side, now);
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
  lastT = 0;
  window.removeEventListener('resize', layout);
}

export function playRainFx() {
  if (running) return;
  clearTimeout(stopTimer);
  stopTimer = null;
  if (root) destroy();

  ensureStyles();
  running = true;

  root = document.createElement('div');
  root.id = 'rain-fx-root';
  document.body.appendChild(root);
  [S.rainSelfY, S.rainOppY].forEach(y => {
    const side = makeSide(y);
    ensureTiles(side);
    sides.push(side);
  });
  layout();
  window.addEventListener('resize', layout);

  root.style.transition = 'none';
  root.style.opacity = '0';
  root.offsetHeight;
  root.style.transition = `opacity ${FADE_IN_MS}ms linear`;
  root.style.opacity = '1';

  raf = requestAnimationFrame(tick);
}

export function stopRainFx() {
  if (!running) return;
  running = false;
  if (root) {
    root.style.transition = `opacity ${FADE_OUT_MS}ms linear`;
    root.style.opacity = '0';
  }
  stopTimer = setTimeout(destroy, FADE_OUT_MS + 50);
}

/** Wołane z renderWeather – utrzymuje stan zgodny z planszą (F5, Czyste Niebo, nowa runda). */
export function syncRainFx(active) {
  if (active) playRainFx();
  else stopRainFx();
}