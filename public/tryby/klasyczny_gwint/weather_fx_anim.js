/**
 * Weather FX – deszcz kafelkowy + dymki
 * Domyślne wartości z Twojego JSON + powiększanie dymka + natychmiastowy fade
 */

const fxRoot = () => document.getElementById('fx-root');

const RAIN_SRC = 'assets/asety/effekty/deszcz.webp';
const BUBBLE_SRC = 'assets/asety/effekty/dymek.webp';

let mode = null;
let settings = null;
let pairRain = null;
let raf = 0;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function tileSize(S) {
  const w = Math.max(40, Number(S.rainSizeX) || 960);
  const h = Math.max(30, Number(S.rainSizeY) || 420);
  return { w, h };
}

function randomCenterX(rowW) {
  return Math.random() * rowW;
}

function createRainTile(S, centerX, y, tileW, tileH) {
  const imgs = [];
  const left = centerX - tileW / 2;
  const offsets = [0];

  if (left < 0) offsets.push(tileW);
  if (left + tileW > S.rowW) offsets.push(-tileW);
  if (tileW > S.rowW) {
    offsets.push(tileW * 2, -tileW * 2);
  }

  const unique = [...new Set(offsets)];
  unique.forEach(off => {
    const img = document.createElement('img');
    img.className = 'rain-tile';
    img.src = RAIN_SRC;
    img.draggable = false;
    img.style.width = tileW + 'px';
    img.style.height = tileH + 'px';
    img.style.left = (left + off) + 'px';
    img.style.top = '0';
    img.style.opacity = String(S.rainOp ?? 0.85);
    img.style.transform = `translateY(${y}px)`;
    imgs.push(img);
  });

  return { imgs, centerX, y, w: tileW, h: tileH };
}

function createRainArea(S, isOpp) {
  const areaY = isOpp ? S.rainOppY : S.rainSelfY;

  const el = document.createElement('div');
  el.className = 'fx-side ' + (isOpp ? 'fx-opp' : 'fx-self');
  el.style.cssText = `left:${S.rowX}px;top:${areaY}px;width:${S.rowW}px;height:${S.rowH}px;`;

  const inner = document.createElement('div');
  inner.className = 'fx-layer';
  el.appendChild(inner);

  const spill = document.createElement('div');
  spill.className = 'fx-bubble-spill';
  spill.style.cssText = `
    left:${S.rowX}px;
    top:${areaY + S.rowH}px;
    width:${S.rowW}px;
    height:0;
  `;

  const tiles = [];
  const bubbles = [];
  let lastBubble = 0;

  function ensureTiles() {
    const { w: tw, h: th } = tileSize(S);
    const overlap = clamp((S.rainOverlap ?? 50) / 100, 0.1, 0.92);
    const step = Math.max(4, th * (1 - overlap));
    const marginTop = S.rainMarginTop ?? 20;
    const marginBot = S.rainMarginBot ?? 20;

    const needSpan = S.rowH + marginTop + marginBot + th;
    const minCount = Math.ceil(needSpan / step) + 2;

    tiles.sort((a, b) => a.y - b.y);

    for (let i = tiles.length - 1; i >= 0; i--) {
      const t = tiles[i];
      if (t.y > S.rowH + marginBot) {
        t.imgs.forEach(im => im.remove());
        tiles.splice(i, 1);
      }
    }

    while (
      tiles.length < minCount ||
      (tiles.length > 0 && tiles[0].y > -marginTop - th * 0.12)
    ) {
      const topY = tiles.length ? tiles[0].y - step : -marginTop - th;
      const cx = randomCenterX(S.rowW);
      const tile = createRainTile(S, cx, topY, tw, th);
      tile.imgs.forEach(im => inner.appendChild(im));
      tiles.unshift(tile);
    }
  }

  function applyLook() {
    const op = S.rainOp ?? 0.85;
    tiles.forEach(t => {
      t.imgs.forEach(im => {
        im.style.opacity = String(op);
      });
    });
  }

  function tickBubbles(dt, now) {
    // dymki na self i opp
    const countTarget = Math.round(S.rainBubbleCount ?? 18);
    const life = Math.max(0.05, Number(S.rbLife) || 0.35);
    const rise = Number(S.rbRise) || 9;
    const sizeX = Number(S.rbSX) || 52;
    const sizeY = Number(S.rbSY) || 29;
    const yOff = Number(S.rbYOff) || -9;
    const opMax = Number(S.rbOp) || 0.35;
    const scaleStart = Number(S.rbScaleStart) || 0.55;
    const scaleEnd = Number(S.rbScaleEnd) || 1.35;
    const fadeSpeed = Math.max(0.2, Number(S.rbFadeSpeed) || 1.4);

    const interval = countTarget <= 0 ? 99999 : (1.0 / Math.max(1, countTarget / 14));

    if (now - lastBubble > interval * 1000 && bubbles.length < countTarget + 8) {
      lastBubble = now + Math.random() * 90;
      const x = Math.random() * S.rowW;
      const elB = document.createElement('div');
      elB.className = 'rain-bubble';
      elB.style.width = sizeX + 'px';
      elB.style.height = sizeY + 'px';
      elB.style.left = (x - sizeX / 2) + 'px';
      elB.style.top = (yOff - sizeY / 2) + 'px';
      elB.style.opacity = '0';
      elB.style.transform = `translateY(0px) scale(${scaleStart})`;
      spill.appendChild(elB);
      bubbles.push({
        el: elB,
        baseY: yOff,
        t0: now,
        life: life * 1000,
        rise,
        opMax,
        scaleStart,
        scaleEnd,
        fadeSpeed,
        sizeX,
        sizeY
      });
    }

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      const rawT = (now - b.t0) / b.life;
      if (rawT >= 1) {
        b.el.remove();
        bubbles.splice(i, 1);
        continue;
      }

      // natychmiastowe zanikanie (krzywa przyspieszona przez fadeSpeed)
      const fadeT = Math.min(1, Math.pow(rawT, 1 / b.fadeSpeed));
      const op = b.opMax * (1 - fadeT);

      // powiększanie liniowe start → end
      const sc = b.scaleStart + (b.scaleEnd - b.scaleStart) * rawT;

      const yy = b.baseY - b.rise * rawT;

      b.el.style.opacity = String(clamp(op, 0, 1));
      b.el.style.transform = `translateY(${yy - b.baseY}px) scale(${sc})`;
      b.el.style.width = (S.rbSX ?? b.sizeX) + 'px';
      b.el.style.height = (S.rbSY ?? b.sizeY) + 'px';
    }
  }

  function tick(dt, now) {
    const speed = Math.max(5, Number(S.rainSpeed) || 280);
    const dy = speed * (dt / 1000);

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      t.y += dy;
      for (let j = 0; j < t.imgs.length; j++) {
        t.imgs[j].style.transform = `translateY(${t.y}px)`;
      }
    }

    ensureTiles();
    tickBubbles(dt, now);
  }

  function clear() {
    tiles.forEach(t => t.imgs.forEach(im => im.remove()));
    tiles.length = 0;
    bubbles.forEach(b => b.el.remove());
    bubbles.length = 0;
  }

  ensureTiles();

  return { el, inner, spill, tick, applyLook, clear, isOpp };
}

export function applySettingsLive(S) {
  settings = S;
  if (pairRain) {
    pairRain.self.applyLook();
    pairRain.opp.applyLook();
  }
}

function clearFx() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  if (pairRain) {
    pairRain.self.clear();
    pairRain.opp.clear();
    pairRain.self.el.remove();
    pairRain.opp.el.remove();
    pairRain.self.spill.remove();
    pairRain.opp.spill.remove();
  }
  pairRain = null;
  const root = fxRoot();
  if (root) root.innerHTML = '';
}

function mountRain(S) {
  const self = createRainArea(S, false);
  const opp = createRainArea(S, true);
  const root = fxRoot();
  root.appendChild(self.el);
  root.appendChild(opp.el);
  root.appendChild(self.spill);
  root.appendChild(opp.spill);
  pairRain = { self, opp };
}

function loop(now) {
  if (!mode || !settings) return;
  const dt = Math.min(40, now - (loop._last || now));
  loop._last = now;

  if (pairRain) {
    pairRain.self.tick(dt, now);
    pairRain.opp.tick(dt, now);
  }
  raf = requestAnimationFrame(loop);
}

export function stopAll() {
  mode = null;
  clearFx();
}

export function startRain(S) {
  stopAll();
  settings = S;
  mode = 'rain';
  mountRain(S);
  loop._last = performance.now();
  raf = requestAnimationFrame(loop);
}

export function restart(S) {
  startRain(S);
}

export function startFog() { stopAll(); }
export function startStorm(S) { startRain(S); }
export function forceLightning() {}
export function setLightningPoints() {}
export function getLightningPoints() { return { g1: [], g2: [] }; }