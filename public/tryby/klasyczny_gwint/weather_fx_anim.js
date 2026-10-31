/**
 * Weather FX – optymalizacja:
 * - deszcz: N pregenerowanych kropel × L warstw, CSS animation, offset 50%
 * - strona przeciwnika: ten sam DOM sklonowany + translateY (zero drugiego layoutu grafiki)
 * - mgła: stała pula dymków, płynny drift + rotacja (bez bounce DVD)
 * - kropelki: scaleY stretch w dół, mały pool
 */

const fxRoot = () => document.getElementById('fx-root');

let mode = null; // 'rain' | 'fog' | 'storm' | null
let settings = null;
let pairRain = null;
let pairFog = null;
let raf = 0;
let t0 = 0;
let lastLt = 0;
let kdAcc = 0;
let lightningPts = { g1: [], g2: [] };
const fogPuffs = []; // tylko self – opp jest klonem wizualnym przez CSS? 
// Opp clone nie animuje niezależnie – dla dymków robimy self + mirror CSS nie wystarczy dla niezależnego driftu.
// Kompromis: dymki tylko na self, opp = CSS filter/opacity clone warstwy jako całość nie zadziała dla driftu.
// Dlatego: dymki na self, na opp osobna PULA ale TE SAME parametry seed – LŻEJSZE niż deszcz.
// Deszcz: jeden self z warstwami, opp = cloneNode + translateY (identyczna animacja CSS).

function dyOpp(selfY, oppY) {
  return oppY - selfY;
}

function hexA(hex, a) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  if (!Number.isFinite(n)) return `rgba(100,150,200,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function setLightningPoints(pts) {
  lightningPts = pts || { g1: [], g2: [] };
}
export function getLightningPoints() {
  return lightningPts;
}

export function applySettingsLive(S) {
  settings = S;
  // odśwież CSS vars na istniejących warstwach deszczu
  if (pairRain) {
    applyRainLook(pairRain.self, S);
    if (pairRain.opp) applyRainLook(pairRain.opp, S);
  }
  if (pairFog) {
    applyFogGrad(pairFog.self, S);
    if (pairFog.opp) applyFogGrad(pairFog.opp, S);
  }
}

function applyRainLook(area, S) {
  const drops = area.querySelectorAll('.rain-drop');
  drops.forEach(d => {
    d.style.width = S.dropW + 'px';
    d.style.height = S.dropH + 'px';
    d.style.opacity = S.dropOp;
    d.style.filter = `brightness(${S.dropBri})`;
  });
  const grad = area.querySelector('.rain-grad');
  if (grad) {
    const peak = S.rgPeak;
    grad.style.background = `linear-gradient(to right,
      ${hexA(S.rgCE, S.rgEdge)} 0%,
      ${hexA(S.rgC0, S.rgSide)} ${peak}%,
      ${hexA(S.rgC1, S.rgMid)} 50%,
      ${hexA(S.rgC0, S.rgSide)} ${100 - peak}%,
      ${hexA(S.rgCE, S.rgEdge)} 100%)`;
    const mask = `linear-gradient(to top, black 0%, black ${100 - S.rgH}%, transparent 100%)`;
    grad.style.webkitMaskImage = mask;
    grad.style.maskImage = mask;
  }
}

function applyFogGrad(area, S) {
  const g = area.querySelector('.fog-grad');
  if (!g) return;
  g.style.background = `radial-gradient(ellipse ${S.fgEW / 2}% ${S.fgEH / 2}% at 50% 100%,
    ${hexA(S.fgC, S.fgBot)} 0%,
    ${hexA(S.fgC, S.fgBot * 0.4)} 50%,
    transparent 75%)`;
}

function makeAreaShell(x, y, w, h, cls) {
  const el = document.createElement('div');
  el.className = cls;
  el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
  const inner = document.createElement('div');
  inner.className = 'fx-inner';
  el.appendChild(inner);
  const spill = document.createElement('div');
  spill.className = 'fx-spill';
  el.appendChild(spill);
  return { el, inner, spill };
}

/** Pregeneruj L warstw × count kropel, animacja CSS, offset i/L cyklu */
function buildRainSelf(S) {
  const { el, inner, spill } = makeAreaShell(S.rowX, S.rainSelfY, S.rowW, S.rowH, 'fx-self');
  const grad = document.createElement('div');
  grad.className = 'rain-grad';
  inner.appendChild(grad);

  const glow = document.createElement('div');
  glow.className = 'storm-glow';
  inner.appendChild(glow);

  const flash = document.createElement('div');
  flash.className = 'flash';
  flash.style.zIndex = '20';
  inner.appendChild(flash);

  const ltLayer = document.createElement('div');
  ltLayer.style.cssText = 'position:absolute;inset:0;overflow:hidden;z-index:15;';
  inner.appendChild(ltLayer);

  const kdLayer = document.createElement('div');
  kdLayer.style.cssText = 'position:absolute;inset:0;overflow:visible;z-index:8;';
  inner.appendChild(kdLayer);

  const layers = Math.max(2, Math.min(6, S.rainLayers | 0));
  const count = Math.max(10, S.rainCount | 0);
  const cycle = Math.max(0.15, S.rainCycle);
  const y0 = -S.dropH;
  const y1 = S.rowH + S.dropYEnd;

  for (let L = 0; L < layers; L++) {
    const layer = document.createElement('div');
    layer.className = 'rain-layer';
    const delay = -(L / layers) * cycle; // 50% overlap przy 2, równomiernie przy 4
    for (let i = 0; i < count; i++) {
      const d = document.createElement('div');
      d.className = 'rain-drop';
      const x = Math.random() * S.rowW;
      const phase = Math.random() * cycle; // desync w warstwie
      d.style.left = x + 'px';
      d.style.top = '0';
      d.style.width = S.dropW + 'px';
      d.style.height = S.dropH + 'px';
      d.style.setProperty('--y0', y0 + 'px');
      d.style.setProperty('--y1', y1 + 'px');
      d.style.animation = `rain-fall ${cycle}s linear ${delay - phase}s infinite`;
      d.style.filter = `brightness(${S.dropBri})`;
      d.style.opacity = S.dropOp;
      layer.appendChild(d);
    }
    inner.appendChild(layer);
  }

  // dymki deszczu – stała mała pula
  const fogLayer = document.createElement('div');
  fogLayer.style.cssText = 'position:absolute;inset:0;overflow:visible;z-index:6;';
  el.appendChild(fogLayer);

  applyRainLook({ querySelector: s => el.querySelector(s), querySelectorAll: s => el.querySelectorAll(s) }, S);
  // re-apply via element
  applyRainLookDirect(el, S);

  return { el, inner, spill, fogLayer, glow, flash, ltLayer, kdLayer, kind: 'rain' };
}

function applyRainLookDirect(el, S) {
  el.querySelectorAll('.rain-drop').forEach(d => {
    d.style.width = S.dropW + 'px';
    d.style.height = S.dropH + 'px';
    d.style.filter = `brightness(${S.dropBri})`;
  });
  const grad = el.querySelector('.rain-grad');
  if (grad) {
    const peak = S.rgPeak;
    grad.style.background = `linear-gradient(to right,
      ${hexA(S.rgCE, S.rgEdge)} 0%,
      ${hexA(S.rgC0, S.rgSide)} ${peak}%,
      ${hexA(S.rgC1, S.rgMid)} 50%,
      ${hexA(S.rgC0, S.rgSide)} ${100 - peak}%,
      ${hexA(S.rgCE, S.rgEdge)} 100%)`;
    const mask = `linear-gradient(to top, black 0%, black ${100 - S.rgH}%, transparent 100%)`;
    grad.style.webkitMaskImage = mask;
    grad.style.maskImage = mask;
  }
}

/** Klon self → opp: ten sam DOM/animacje CSS, tylko przesunięcie Y */
function cloneToOpp(selfEl, selfY, oppY) {
  const clone = selfEl.cloneNode(true);
  clone.className = 'fx-opp';
  // zachowaj left/width/height, zmień top
  clone.style.top = oppY + 'px';
  // usuń z klona warstwy które mają być tylko na self (lt, kd, flash) – opcjonalnie zostaw
  return clone;
}

function buildFogSelf(S) {
  const { el, inner } = makeAreaShell(S.rowX, S.fogSelfY, S.rowW, S.rowH, 'fx-self');
  const grad = document.createElement('div');
  grad.className = 'fog-grad';
  inner.appendChild(grad);
  const fogLayer = document.createElement('div');
  fogLayer.style.cssText = 'position:absolute;inset:0;overflow:visible;z-index:6;';
  el.appendChild(fogLayer);
  applyFogGrad({ querySelector: s => el.querySelector(s) }, S);
  applyFogGradDirect(el, S);
  return { el, inner, fogLayer, kind: 'fog' };
}

function applyFogGradDirect(el, S) {
  const g = el.querySelector('.fog-grad');
  if (!g) return;
  g.style.background = `radial-gradient(ellipse ${S.fgEW / 2}% ${S.fgEH / 2}% at 50% 100%,
    ${hexA(S.fgC, S.fgBot)} 0%,
    ${hexA(S.fgC, S.fgBot * 0.4)} 50%,
    transparent 75%)`;
}

function seedFogPuffs(area, S, isRain) {
  const n = isRain ? S.rainFogCount : S.fogCount;
  const smin = isRain ? S.rainFogSmin : S.fogSmin;
  const smax = isRain ? S.rainFogSmax : S.fogSmax;
  const layer = area.fogLayer;
  for (let i = 0; i < n; i++) {
    const size = smin + Math.random() * Math.max(0, smax - smin);
    const op = isRain
      ? 0.15 + Math.random() * 0.3
      : S.fogOpMin + Math.random() * Math.max(0, S.fogOpMax - S.fogOpMin);
    const el = document.createElement('div');
    el.className = 'fog-puff';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    const x = Math.random() * S.rowW;
    const y = Math.random() * S.rowH;
    el.style.left = '0';
    el.style.top = '0';
    el.style.opacity = String(op);
    layer.appendChild(el);
    // płynny ruch: wolna zmiana kierunku (noise-like)
    fogPuffs.push({
      el, area, size, op,
      x, y,
      vx: (Math.random() - 0.5) * S.fogSpd,
      vy: (Math.random() - 0.5) * S.fogSpd * 0.5,
      ax: 0, ay: 0,
      rot: Math.random() * 360,
      spin: (Math.random() - 0.5) * 2 * S.fogSpin,
      tw: Math.random() * Math.PI * 2,
      isRain
    });
  }
}

function clearFx() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  fogPuffs.splice(0).forEach(p => p.el.remove());
  const root = fxRoot();
  if (root) root.innerHTML = '';
  pairRain = pairFog = null;
  kdAcc = 0;
}

function mountRain(S) {
  const self = buildRainSelf(S);
  const opp = cloneToOpp(self.el, S.rainSelfY, S.rainOppY);
  // na opp nie potrzeba osobnych piorunów z self – klon ma te same warstwy; OK
  fxRoot().appendChild(self.el);
  fxRoot().appendChild(opp);
  seedFogPuffs(self, S, true);
  // lekkie dymki też na opp – osobna mała pula (nie klon animacji drift)
  const oppFog = {
    el: opp,
    fogLayer: opp.querySelector('.fx-spill')?.parentElement?.querySelector('[style*="z-index:6"]') || (() => {
      const fl = document.createElement('div');
      fl.style.cssText = 'position:absolute;inset:0;overflow:visible;z-index:6;';
      opp.appendChild(fl);
      return fl;
    })(),
    kind: 'rain'
  };
  // znajdź fogLayer na klonie
  const clonedFog = opp.querySelectorAll('div');
  let flOpp = null;
  opp.querySelectorAll('div').forEach(d => {
    if (d.style.zIndex === '6') flOpp = d;
  });
  if (!flOpp) {
    flOpp = document.createElement('div');
    flOpp.style.cssText = 'position:absolute;inset:0;overflow:visible;z-index:6;';
    opp.appendChild(flOpp);
  }
  // wyczyść sklonowane puste fog z self seed (self seed jest tylko na self)
  flOpp.innerHTML = '';
  seedFogPuffs({ fogLayer: flOpp, kind: 'rain' }, S, true);

  pairRain = {
    self,
    opp,
    glow: self.glow,
    flash: self.flash,
    ltLayer: self.ltLayer,
    kdLayer: self.kdLayer
  };
  applyRainLookDirect(self.el, S);
  applyRainLookDirect(opp, S);
}

function mountFog(S) {
  const self = buildFogSelf(S);
  const opp = cloneToOpp(self.el, S.fogSelfY, S.fogOppY);
  fxRoot().appendChild(self.el);
  fxRoot().appendChild(opp);
  seedFogPuffs(self, S, false);
  let flOpp = null;
  opp.querySelectorAll('div').forEach(d => { if (d.style.zIndex === '6') flOpp = d; });
  if (!flOpp) {
    flOpp = document.createElement('div');
    flOpp.style.cssText = 'position:absolute;inset:0;overflow:visible;z-index:6;';
    opp.appendChild(flOpp);
  }
  flOpp.innerHTML = '';
  seedFogPuffs({ fogLayer: flOpp, kind: 'fog' }, S, false);
  pairFog = { self, opp };
  applyFogGradDirect(self.el, S);
  applyFogGradDirect(opp, S);
}

/* ===== pioruny ===== */
function showLightningPair(S, groupKey) {
  if (!pairRain) return;
  const pts = (lightningPts[groupKey] || []).slice(0, 2);
  if (!pts.length) {
    // fallback defaults
    const fb = groupKey === 'g1'
      ? [{ x: 0.2, y: 0.12 }, { x: 0.3, y: 0.18 }]
      : [{ x: 0.7, y: 0.14 }, { x: 0.8, y: 0.2 }];
    pts.push(...fb);
  }
  const aw = S.rowW, ah = S.rowH;
  const w = aw * (S.ltW / 100);
  const layer = pairRain.ltLayer;
  const flash = pairRain.flash;
  const d1 = S.ltD1 * 1000, d2 = S.ltD2 * 1000;

  const place = (src, mirror, originX, originY) => {
    const el = document.createElement('div');
    el.className = 'lightning' + (mirror ? ' mirror' : '');
    el.style.backgroundImage = `url('${src}')`;
    el.style.width = w + 'px';
    el.style.height = ah + 'px';
    // origin assetu = prawy górny (normal) / lewy górny (mirror)
    if (!mirror) {
      el.style.left = (originX - w) + 'px';
      el.style.top = originY + 'px';
      el.style.transformOrigin = 'top right';
    } else {
      el.style.left = originX + 'px';
      el.style.top = originY + 'px';
      el.style.transform = 'scaleX(-1)';
      el.style.transformOrigin = 'top left';
    }
    el.style.opacity = '0';
    layer.appendChild(el);
    return el;
  };

  const o1 = pts[0];
  const o2 = pts[1] || { x: o1.x + 0.08, y: o1.y + 0.05 };
  const x1 = o1.x * aw, y1 = o1.y * ah;
  const x2 = o2.x * aw, y2 = o2.y * ah;

  const p1 = place('assets/asety/effekty/pierun1.webp', false, x1, y1);
  const p2 = place('assets/asety/effekty/pierun2.webp', true, x2, y2);

  // flash eliptyczny przy środku pary
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + ah * 0.2;
  const fw = w * 1.5, fh = ah * 0.85;
  flash.style.width = fw + 'px';
  flash.style.height = fh + 'px';
  flash.style.left = (mx - fw / 2) + 'px';
  flash.style.top = (my - fh / 2) + 'px';
  flash.style.transition = 'none';
  flash.style.background = `radial-gradient(ellipse at 50% 40%,
    rgba(255,255,255,${S.ltFop}) 0%,
    rgba(255,255,255,${S.ltFop * 0.5}) 28%,
    rgba(100,170,255,${S.ltFop * 0.4}) 55%,
    transparent 78%)`;
  flash.style.opacity = '1';

  p1.style.opacity = '1';
  setTimeout(() => {
    p1.style.transition = `opacity ${d1 * 0.35}ms linear`;
    p1.style.opacity = '0';
    p2.style.opacity = '1';
    setTimeout(() => {
      flash.style.transition = `opacity ${S.ltFlash * 1000}ms ease-out`;
      flash.style.opacity = '0';
    }, 30);
    setTimeout(() => {
      p2.style.transition = `opacity ${d2 * 0.35}ms linear`;
      p2.style.opacity = '0';
      setTimeout(() => { p1.remove(); p2.remove(); }, 200);
    }, d2);
  }, d1);
}

export function forceLightning(S) {
  settings = S;
  if (!pairRain) {
    startStorm(S);
  }
  showLightningPair(S, 'g1');
  setTimeout(() => showLightningPair(S, 'g2'), (S.ltGap || 1.3) * 1000);
}

/* ===== kropelki (pool) ===== */
const kdPool = [];

function spawnKd(S, now) {
  if (!pairRain) return;
  if (kdPool.length >= S.kdMax) return;
  const el = document.createElement('div');
  el.className = 'storm-drop';
  const base = S.kdBase;
  const sT = S.kdSmin + Math.random() * Math.max(0, S.kdSmax - S.kdSmin);
  const x = Math.random() * S.rowW;
  const y = Math.random() * S.rowH * 0.7;
  el.style.width = base + 'px';
  el.style.height = base + 'px';
  el.style.left = (x - base / 2) + 'px';
  el.style.top = y + 'px';
  el.style.opacity = '0';
  pairRain.kdLayer.appendChild(el);
  kdPool.push({ el, x, y, base, sT, t0: now, life: S.kdLife * 1000, dy: S.kdDy, stretch: S.kdStretch });
}

function tickKd(now, S) {
  for (let i = kdPool.length - 1; i >= 0; i--) {
    const d = kdPool[i];
    const t = (now - d.t0) / d.life;
    if (t >= 1) {
      d.el.remove();
      kdPool.splice(i, 1);
      continue;
    }
    // pojawienie: scale 0.2 → sT, potem shrink + stretch Y w dół
    let sc, sy;
    if (t < 0.15) {
      sc = 0.2 + (d.sT - 0.2) * (t / 0.15);
      sy = sc;
    } else {
      const u = (t - 0.15) / 0.85;
      sc = d.sT * (1 - u * 0.85);
      sy = sc * (1 + (d.stretch - 1) * u); // rozciąganie w dół
    }
    d.el.style.transform = `scale(${Math.max(0.05, sc)}, ${Math.max(0.05, sy)})`;
    d.el.style.top = (d.y + d.dy * t) + 'px';
    d.el.style.opacity = String(t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9);
  }
}

/* ===== tick mgły ===== */
function tickFog(dt, S) {
  const spd = S.fogSpd;
  fogPuffs.forEach(p => {
    // powolna zmiana przyspieszenia (płynny „organiczny” ruch)
    p.tw += dt * 0.001;
    p.ax = Math.sin(p.tw * 0.7 + p.x * 0.01) * spd * 0.4;
    p.ay = Math.cos(p.tw * 0.5 + p.y * 0.01) * spd * 0.25;
    p.vx += p.ax * dt * 0.001;
    p.vy += p.ay * dt * 0.001;
    // tłumienie
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.x += p.vx * dt * 0.001;
    p.y += p.vy * dt * 0.001;
    // soft wrap zamiast DVD bounce
    const W = S.rowW, H = S.rowH;
    if (p.x < -p.size) p.x = W + p.size;
    if (p.x > W + p.size) p.x = -p.size;
    if (p.y < -p.size) p.y = H + p.size;
    if (p.y > H + p.size) p.y = -p.size;
    p.rot += p.spin * dt * 0.001 * 60;
    p.el.style.transform = `translate(${p.x - p.size / 2}px, ${p.y - p.size / 2}px) rotate(${p.rot}deg)`;
  });
}

function loop(now) {
  if (!mode || !settings) return;
  const S = settings;
  const dt = Math.min(40, now - (loop._last || now));
  loop._last = now;

  tickFog(dt, S);

  if (mode === 'storm' && pairRain) {
    const age = now - t0;
    const gt = S.glowT * 1000;
    const g = pairRain.glow;
    if (g) {
      if (age < gt) {
        const p = age / gt;
        g.style.opacity = String(Math.sin(Math.min(1, p) * Math.PI) * 0.65 + 0.2);
        g.style.background = `radial-gradient(ellipse 90% 80% at 50% 50%,
          ${hexA(S.glowCol, S.glowM)} 0%,
          ${hexA(S.glowCol, S.glowC * 0.4)} 55%,
          ${hexA(S.glowCol, S.glowC)} 100%)`;
      } else g.style.opacity = '0.18';
    }
    kdAcc += dt / 1000 * S.kdRate;
    while (kdAcc >= 1) { spawnKd(S, now); kdAcc--; }
    tickKd(now, S);

    if (now - lastLt > S.ltCycle * 1000) {
      lastLt = now;
      showLightningPair(S, 'g1');
      setTimeout(() => showLightningPair(S, 'g2'), S.ltGap * 1000);
    }
  }

  raf = requestAnimationFrame(loop);
}

export function stopAll() {
  mode = null;
  clearFx();
  kdPool.splice(0).forEach(k => k.el.remove());
}

export function startRain(S) {
  stopAll();
  settings = S;
  mode = 'rain';
  t0 = performance.now();
  mountRain(S);
  loop._last = performance.now();
  raf = requestAnimationFrame(loop);
}

export function startFog(S) {
  stopAll();
  settings = S;
  mode = 'fog';
  t0 = performance.now();
  mountFog(S);
  loop._last = performance.now();
  raf = requestAnimationFrame(loop);
}

export function startStorm(S) {
  stopAll();
  settings = S;
  mode = 'storm';
  t0 = performance.now();
  lastLt = performance.now() - S.ltCycle * 1000 + 500;
  mountRain(S);
  mountFog(S);
  loop._last = performance.now();
  raf = requestAnimationFrame(loop);
}

export function restart(S) {
  if (mode === 'rain') startRain(S);
  else if (mode === 'fog') startFog(S);
  else if (mode === 'storm') startStorm(S);
  else startRain(S);
}