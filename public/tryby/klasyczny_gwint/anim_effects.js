/**
 * anim_effects.js – czyste efekty wizualne (bez logiki planszy / socketów).
 * Importuj w poligonie lub w game_board.js.
 */
import { getCardImage } from './cardImages.js';
import {
  getElement4KPos,
  animateBoardToGraveyard,
  animateElement
} from './animacje.js';

// ---------- ścieżki assetów ----------
export const FX = {
  porzFrames: Array.from({ length: 9 }, (_, i) =>
    `assets/asety/effekty/porz/porz${i + 1}.webp`
  ),
  dymek: 'assets/asety/effekty/dymek.webp',
  isk: Array.from({ length: 4 }, (_, i) =>
    `assets/asety/effekty/isk/isk${i + 1}.webp`
  ),
  dymFrames: Array.from({ length: 8 }, (_, i) =>
    `assets/asety/effekty/dym/dym${i + 1}.webp`
  ),
  gwiazdka: 'assets/asety/effekty/gwiazdka.webp'
};

// ---------- pożoga (4K względem karty 180×240) ----------
export const PORZ_4K = { offsetX: -20, offsetY: -20, w: 220, h: 280 };
export const PORZ_FRAMES_TOTAL_MS = 330;
export const PORZ_FRAME_COUNT = 9;
export const PORZ_LAST_FADE_MS = 400;
export const PORZ_FLY_AT_MS = 1800;

// ---------- bohater / timing (60 fps) ----------
const HERO_FPS = 60;
const HERO_FRAME_MS = 1000 / HERO_FPS;

/** sekwencja dym1–8 na 20 klatek, hold ostatniej 40 klatek */
export const HERO_DYM_FRAME_COUNT = 8;
export const HERO_DYM_ANIM_FRAMES = 20;
export const HERO_DYM_HOLD_FRAMES = 40;
/** pociemnienie sprite’ów dym – kręć 0.4–0.9 */
export const HERO_DYM_BRIGHTNESS = 0.62;
export const HERO_DYM_CONTRAST = 1.05;
/** zanik dym1–8: od klatki 15 → niewidoczny na 25 */
export const HERO_DYM_FADE_START = 15;
export const HERO_DYM_FADE_END = 25;

/** zasłona kolorem pod dymem (nad kartą) */
export const HERO_COVER_COLOR = '#333539';
export const HERO_COVER_FULL_FRAME = 5;
export const HERO_COVER_FADE_START = 40;
export const HERO_COVER_FADE_END = 85;

/** dymek.webp – warstwa między dymem a iskrami */
export const HERO_DYMEK_COUNT_MIN = 5;
export const HERO_DYMEK_COUNT_MAX = 10;
export const HERO_DYMEK_BRIGHTNESS = 0.35;
export const HERO_DYMEK_BRIGHTNESS_JITTER = 0.01;
export const HERO_DYMEK_SIZE = 1.2;
export const HERO_DYMEK_OPACITY = 0.85;
export const HERO_DYMEK_TRAVEL = 0.7;
export const HERO_DYMEK_FADE_START = 15;
export const HERO_DYMEK_FADE_END = 60;

// ---------- iskry / ember border (tune jak w demo) ----------
export const HERO_EMBER_CFG = {
  sizeMain: 1.4,
  density: 5,
  cornerMul: 1.0,
  speedMain: 14,
  spreadMain: 18,
  gravMain: -25,
  sparkMain: 0.0,
  dragMain: 0.955,
  lifeMain: 0.8,

  outlierChance: 0.45,
  outlierDist: 12,
  sizeOut: 2.1,
  speedOut: 140,
  spreadOut: 120,
  gravOut: -80,
  sparkOut: 7.0,
  dragOut: 0.995,
  lifeOut: 0.8,

  duration: 1.0
};

export const HERO_EMBER_COLOR_START = { r: 255, g: 210, b: 60 };
export const HERO_EMBER_COLOR_MID = { r: 255, g: 130, b: 20 };
export const HERO_EMBER_COLOR_END = { r: 160, g: 35, b: 5 };

/** padding canvasa wokół karty (px w skali 180×240) */
export const HERO_EMBER_PAD = 80;

// ---------- wezwanie (Cerys → tarczowniczki itd.) ----------
const WEZWANIE_FPS = 60;

/** Tune – demo Fire Corners + Sparks; spreadX = 150 */
export const WEZWANIE_CFG = {
  endFrame: 110,

  glowPeak: 10,
  glowHold: 30,
  glowFadeEnd: 65,
  glowStrength: 1.1,

  sparkStart: 0,
  sparkEnd: 85,
  shrinkStart: 8,
  shrinkEnd: 40,
  fadeStart: 80,

  sizeMin: 14,
  sizeMax: 29,
  stretchY: 1.5,
  alphaMin: 0.4,
  alphaMax: 0.15,
  density: 0.5,
  densityBoost: 1.0,
  lifeFrames: 120,
  spawnOffset: 22,

  upForce: 286,
  spreadX: 150,
  gravity: -35,
  sparkSpin: 10.0,
  drag: 0.981,

  t1x: 20,
  t1y: 50,
  t2x: 100,
  t2y: 0,
  switchFrame: 35,
  switchSmooth: 18,
  curveForce: 2.8,
  targetJitter: 12
};

const WEZWANIE_TINTS = [
  { r: 255, g: 210, b: 80 },
  { r: 255, g: 180, b: 50 },
  { r: 255, g: 150, b: 30 },
  { r: 255, g: 120, b: 20 },
  { r: 255, g: 160, b: 60 },
  { r: 255, g: 195, b: 70 }
];

const HAND_CENTER_4K = { x: 2090, y: 1811 };

// preload
const porzPreloaded = [];
const iskPreloaded = [];
const dymPreloaded = [];

let wezwanieStarImg = null;
let wezwanieTinted = [];
let wezwanieStarReady = false;

function ensureWezwanieStar() {
  if (wezwanieStarImg) return;
  wezwanieStarImg = new Image();
  wezwanieStarImg.src = FX.gwiazdka;
  wezwanieStarImg.onload = () => {
    wezwanieTinted = [];
    if (!wezwanieStarImg.naturalWidth) {
      wezwanieStarReady = false;
      return;
    }
    WEZWANIE_TINTS.forEach(tint => {
      const off = document.createElement('canvas');
      off.width = wezwanieStarImg.naturalWidth;
      off.height = wezwanieStarImg.naturalHeight;
      const octx = off.getContext('2d');
      octx.drawImage(wezwanieStarImg, 0, 0);
      octx.globalCompositeOperation = 'source-atop';
      octx.fillStyle = `rgb(${tint.r},${tint.g},${tint.b})`;
      octx.fillRect(0, 0, off.width, off.height);
      octx.globalCompositeOperation = 'source-over';
      wezwanieTinted.push(off);
    });
    wezwanieStarReady = true;
  };
  wezwanieStarImg.onerror = () => {
    wezwanieStarReady = false;
  };
}

export function preloadAnimEffects() {
  FX.porzFrames.forEach((src, i) => {
    const img = new Image();
    img.src = src;
    porzPreloaded[i] = img;
  });
  FX.isk.forEach((src, i) => {
    const img = new Image();
    img.src = src;
    iskPreloaded[i] = img;
  });
  FX.dymFrames.forEach((src, i) => {
    const img = new Image();
    img.src = src;
    dymPreloaded[i] = img;
  });
  const d = new Image();
  d.src = FX.dymek;
  ensureWezwanieStar();
}
preloadAnimEffects();

function playSound(id) {
  const a = document.getElementById(id);
  if (a) {
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}

// ==================== POŻOGA ====================

export function playPorzFireOnElement(cardEl) {
  return new Promise(resolve => {
    if (!cardEl) {
      resolve();
      return;
    }

    const rect = cardEl.getBoundingClientRect();
    const sx = rect.width / 180;
    const sy = rect.height / 240;

    const fire = document.createElement('div');
    fire.className = 'ap-porz-fire';
    fire.style.left = `${PORZ_4K.offsetX * sx}px`;
    fire.style.top = `${PORZ_4K.offsetY * sy}px`;
    fire.style.width = `${PORZ_4K.w * sx}px`;
    fire.style.height = `${PORZ_4K.h * sy}px`;

    // Użyj preloadowanych obrazków aby uniknąć opóźnienia przy ładowaniu
    const setFrame = index => {
      const preloaded = porzPreloaded[index];
      fire.style.backgroundImage = preloaded && preloaded.complete
        ? `url('${preloaded.src}')`
        : `url('${FX.porzFrames[index]}')`;
    };

    setFrame(0);
    cardEl.appendChild(fire);

    // Animacja oparta na requestAnimationFrame z bezwzględnym pomiarem czasu
    // eliminuje dryft setTimeout przy wielu równoczesnych animacjach spalania
    const stepMs = PORZ_FRAMES_TOTAL_MS / PORZ_FRAME_COUNT;
    let lastFrame = -1;
    const startTime = performance.now();

    const tick = (now) => {
      if (!fire.isConnected) {
        resolve();
        return;
      }
      const elapsed = now - startTime;
      const frame = Math.min(Math.floor(elapsed / stepMs), PORZ_FRAME_COUNT - 1);

      if (frame !== lastFrame) {
        lastFrame = frame;
        setFrame(frame);
      }

      if (elapsed < PORZ_FRAMES_TOTAL_MS) {
        requestAnimationFrame(tick);
      } else {
        fire.offsetHeight;
        fire.classList.add('fading');
        setTimeout(() => {
          fire.remove();
          resolve();
        }, PORZ_LAST_FADE_MS);
      }
    };

    requestAnimationFrame(tick);
  });
}

/**
 * Uniwersalny dym (pożoga / inne).
 */
export function playSmokeOnElement(cardEl, opts = {}) {
  const {
    count = 5,
    anyDirection = false,
    dark = false,
    fullOpacityFirst = false,
    fullOpacityMs = 1000,
    durationMs = PORZ_FLY_AT_MS,
    travelFactor = 0.75
  } = opts;

  return new Promise(resolve => {
    if (!cardEl) {
      resolve();
      return;
    }

    const rect = cardEl.getBoundingClientRect();
    const cardH = rect.height || 120;
    const travel = cardH * travelFactor;

    const layer = document.createElement('div');
    layer.className = 'ap-smoke-layer';
    cardEl.appendChild(layer);

    const base = 183 * 0.5;
    const smokeScale = Math.min(1, cardH / 240);
    const smokeSize = base * smokeScale;

    const smokes = [];
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'ap-smoke' + (dark ? ' ap-smoke-dark' : '');
      s.style.width = `${smokeSize}px`;
      s.style.height = `${smokeSize}px`;
      s.style.marginLeft = `${-smokeSize / 2}px`;
      s.style.marginTop = `${-smokeSize / 2}px`;
      s.style.opacity = fullOpacityFirst ? '1' : '0';
      s.style.transform = 'translate(0px, 0px) rotate(0deg)';
      s.style.transition = 'none';

      const angleDeg = anyDirection
        ? Math.random() * 360
        : 70 + Math.random() * 50;
      const angleRad = (angleDeg * Math.PI) / 180;
      const dx = Math.cos(angleRad) * travel;
      const dy = anyDirection
        ? Math.sin(angleRad) * travel
        : -Math.sin(angleRad) * travel;

      const rotDir = Math.random() < 0.5 ? 1 : -1;
      const rotSpeed = 15 + Math.random() * 40;
      const totalRot = rotDir * rotSpeed * (durationMs / 1000);

      layer.appendChild(s);
      smokes.push({ el: s, dx, dy, totalRot });
    }

    layer.offsetHeight;

    if (fullOpacityFirst) {
      smokes.forEach(({ el, dx, dy, totalRot }) => {
        el.style.transition = `transform ${durationMs}ms linear`;
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${totalRot}deg)`;
      });
      setTimeout(() => {
        const left = Math.max(200, durationMs - fullOpacityMs);
        smokes.forEach(({ el }) => {
          el.style.transition = `
            transform ${left}ms linear,
            opacity ${left}ms ease-in
          `;
          el.style.opacity = '0';
        });
      }, fullOpacityMs);
    } else {
      const appearAt = 180;
      setTimeout(() => {
        smokes.forEach(({ el, dx, dy, totalRot }) => {
          el.style.transition = `
            transform ${durationMs - appearAt}ms linear,
            opacity 0.2s ease-out
          `;
          el.style.opacity = '0.3';
          el.style.transform = `translate(${dx}px, ${dy}px) rotate(${totalRot}deg)`;
        });
      }, appearAt);

      const fadeStart = 1000;
      setTimeout(() => {
        const left = durationMs - fadeStart;
        smokes.forEach(({ el }) => {
          el.style.transition = `
            transform ${left}ms linear,
            opacity ${left}ms ease-in
          `;
          el.style.opacity = '0';
        });
      }, fadeStart);
    }

    setTimeout(() => {
      layer.remove();
      resolve();
    }, durationMs);
  });
}

export function playPorzSmokeOnElement(cardEl) {
  return playSmokeOnElement(cardEl, {
    count: 5,
    anyDirection: false,
    dark: false,
    fullOpacityFirst: false,
    durationMs: PORZ_FLY_AT_MS,
    travelFactor: 0.75
  });
}

/**
 * Pełna pożoga na jednej karcie DOM + lot na cmentarz.
 * @param {HTMLElement} cardEl
 * @param {object} card – obiekt z cards.js
 * @param {boolean} isP1Side – czy karta po stronie gracza (cmentarz)
 */
export async function runPorzogaOnCardElement(cardEl, card, isP1Side = true) {
  if (!cardEl || !card) return;

  const from4K = getElement4KPos(cardEl);

  playPorzFireOnElement(cardEl);
  await playPorzSmokeOnElement(cardEl);

  cardEl.querySelector('.ap-porz-fire')?.remove();
  cardEl.style.visibility = 'hidden';

  await new Promise(resolve => {
    animateBoardToGraveyard(
      [{ card, currentPos4K: from4K }],
      !isP1Side,
      0,
      resolve
    );
  });
}

// ==================== BOHATER ====================

/**
 * Ścieżka ember: lewa pełna → dół → prawa → góra → lewa 25%.
 * Lokalne coords względem karty (0,0 = lewy górny).
 */
function heroEmberPathPoint(t, cardW, cardH) {
  const leftFull = cardH;
  const bottom = cardW;
  const right = cardH;
  const top = cardW;
  const leftPartial = cardH * 0.25;
  const totalLen = leftFull + bottom + right + top + leftPartial;
  let d = t * totalLen;

  if (d < leftFull) return { x: 0, y: d, nx: -1, ny: 0 };
  d -= leftFull;
  if (d < bottom) return { x: d, y: cardH, nx: 0, ny: 1 };
  d -= bottom;
  if (d < right) return { x: cardW, y: cardH - d, nx: 1, ny: 0 };
  d -= right;
  if (d < top) return { x: cardW - d, y: 0, nx: 0, ny: -1 };
  d -= top;
  return { x: 0, y: d, nx: -1, ny: 0 };
}

function heroEmberNearCorner(t) {
  const corners = [0, 0.22, 0.45, 0.68, 0.9];
  return corners.some(c => Math.abs(t - c) < 0.04);
}

/**
 * Iskry ember – canvas nad kartą / cover / dymem / dymkiem.
 */
export function playHeroSparksOnElement(cardEl) {
  return new Promise(resolve => {
    if (!cardEl) {
      resolve();
      return;
    }

    const rect = cardEl.getBoundingClientRect();
    const cardW = rect.width;
    const cardH = rect.height;
    if (cardW < 2 || cardH < 2) {
      resolve();
      return;
    }

    const scale = cardW / 180;
    const pad = HERO_EMBER_PAD * scale;

    const canvas = document.createElement('canvas');
    canvas.className = 'ap-hero-ember-canvas';
    canvas.width = Math.ceil(cardW + pad * 2);
    canvas.height = Math.ceil(cardH + pad * 2);
    canvas.style.cssText = `
      position:fixed;
      left:${rect.left - pad}px;
      top:${rect.top - pad}px;
      width:${canvas.width}px;
      height:${canvas.height}px;
      pointer-events:none;
      z-index:6000;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const CFG = HERO_EMBER_CFG;
    const COLOR_START = HERO_EMBER_COLOR_START;
    const COLOR_MID = HERO_EMBER_COLOR_MID;
    const COLOR_END = HERO_EMBER_COLOR_END;

    const ox = pad;
    const oy = pad;

    class Ember {
      constructor(x, y, vx, vy, isOutlier = false) {
        this.isOutlier = isOutlier;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;

        const lifeBase = isOutlier ? CFG.lifeOut : CFG.lifeMain;
        this.life = lifeBase * (0.7 + Math.random() * 0.6);
        this.maxLife = this.life;

        const sizeBase = (isOutlier ? CFG.sizeOut : CFG.sizeMain) * scale;
        this.size = sizeBase * (0.7 + Math.random() * 0.6);

        this.rot = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 8;
        this.alive = true;

        this.sparkAngle = Math.random() * Math.PI * 2;
        this.sparkRadius = (3 + Math.random() * 9) * scale;
        this.sparkSpeed =
          (0.8 + Math.random()) * (Math.random() > 0.5 ? 1 : -1);
      }

      update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
          this.alive = false;
          return;
        }

        const grav = (this.isOutlier ? CFG.gravOut : CFG.gravMain) * scale;
        this.vy += grav * dt;

        const sparkF = this.isOutlier ? CFG.sparkOut : CFG.sparkMain;
        if (sparkF > 0) {
          this.sparkAngle += this.sparkSpeed * sparkF * dt;
          this.vx +=
            Math.cos(this.sparkAngle) * this.sparkRadius * 0.3 * sparkF * dt;
          this.vy +=
            Math.sin(this.sparkAngle) * this.sparkRadius * 0.3 * sparkF * dt;
          this.sparkRadius *= 0.991;
        }

        const drag = this.isOutlier ? CFG.dragOut : CFG.dragMain;
        this.vx *= Math.pow(drag, dt * 60);
        this.vy *= Math.pow(drag, dt * 60);

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rot += this.rotSpeed * dt;
      }

      draw(c) {
        if (!this.alive) return;
        const p = 1 - this.life / this.maxLife;

        let r, g, b;
        if (p < 0.4) {
          const t = p / 0.4;
          r = COLOR_START.r + (COLOR_MID.r - COLOR_START.r) * t;
          g = COLOR_START.g + (COLOR_MID.g - COLOR_START.g) * t;
          b = COLOR_START.b + (COLOR_MID.b - COLOR_START.b) * t;
        } else {
          const t = (p - 0.4) / 0.6;
          r = COLOR_MID.r + (COLOR_END.r - COLOR_MID.r) * t;
          g = COLOR_MID.g + (COLOR_END.g - COLOR_MID.g) * t;
          b = COLOR_MID.b + (COLOR_END.b - COLOR_MID.b) * t;
        }

        const alpha = Math.pow(1 - p, 1.25);
        const size = this.size * (1 - p * 0.35);

        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rot);
        c.globalCompositeOperation = 'lighter';

        c.globalAlpha = alpha;
        c.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        c.beginPath();
        c.arc(0, 0, size, 0, Math.PI * 2);
        c.fill();

        c.globalAlpha = alpha * 0.28;
        c.beginPath();
        c.arc(0, 0, size * 2.1, 0, Math.PI * 2);
        c.fill();

        c.restore();
      }
    }

    const particles = [];

    const spawnAt = (x, y, nx, ny, boost = false) => {
      const speed = CFG.speedMain * scale;
      const spread = CFG.spreadMain * scale;
      const baseSpeed = speed * (0.55 + Math.random() * 0.7);
      const spr = boost ? spread * 1.5 : spread;

      const vx = nx * baseSpeed * 0.5 + (Math.random() - 0.5) * spr;
      const vy = ny * baseSpeed * 0.5 + (Math.random() - 0.5) * spr;
      particles.push(new Ember(x, y, vx, vy, false));

      if (Math.random() < CFG.outlierChance) {
        const dist = CFG.outlierDist * scale;
        const sx = x + (Math.random() - 0.5) * dist * 2;
        const sy = y + (Math.random() - 0.5) * dist * 2;

        const vx2 =
          (Math.random() - 0.5) * CFG.spreadOut * scale +
          nx * CFG.speedOut * scale * 0.3;
        const vy2 =
          (Math.random() - 0.5) * CFG.spreadOut * scale +
          ny * CFG.speedOut * scale * 0.3;
        particles.push(new Ember(sx, sy, vx2, vy2, true));
      }
    };

    const t0 = performance.now();
    let lastTime = t0;

    const loop = now => {
      const dt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;
      const elapsed = (now - t0) / 1000;
      const t = Math.min(elapsed / CFG.duration, 1.0);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (t < 1.0) {
        for (let i = 0; i < 2; i++) {
          const localT = Math.min(t + i * 0.007, 0.999);
          const p = heroEmberPathPoint(localT, cardW, cardH);
          const near = heroEmberNearCorner(localT);
          const count = Math.round(CFG.density * (near ? CFG.cornerMul : 1));
          for (let k = 0; k < count; k++) {
            spawnAt(ox + p.x, oy + p.y, p.nx, p.ny, near);
          }
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(dt);
        p.draw(ctx);
        if (!p.alive) particles.splice(i, 1);
      }

      if (elapsed < CFG.duration + 1.2 || particles.length > 0) {
        requestAnimationFrame(loop);
      } else {
        canvas.remove();
        resolve();
      }
    };

    requestAnimationFrame(loop);
  });
}

/**
 * Zasłona #333539: k0=0%, k5=100%, hold, fade 40→85.
 */
export function playHeroCoverOnElement(cardEl) {
  return new Promise(resolve => {
    if (!cardEl) {
      resolve();
      return;
    }

    const cover = document.createElement('div');
    cover.className = 'ap-hero-cover';
    cover.style.cssText = `
      position:absolute; inset:0; pointer-events:none; z-index:22;
      background:${HERO_COVER_COLOR}; opacity:0;
    `;
    cardEl.appendChild(cover);

    const t0 = performance.now();
    const fullMs = HERO_COVER_FULL_FRAME * HERO_FRAME_MS;
    const fadeStartMs = HERO_COVER_FADE_START * HERO_FRAME_MS;
    const fadeEndMs = HERO_COVER_FADE_END * HERO_FRAME_MS;

    const tick = now => {
      const elapsed = now - t0;
      let op = 0;
      if (elapsed <= fullMs) {
        op = fullMs <= 0 ? 1 : elapsed / fullMs;
      } else if (elapsed < fadeStartMs) {
        op = 1;
      } else if (elapsed < fadeEndMs) {
        op = 1 - (elapsed - fadeStartMs) / (fadeEndMs - fadeStartMs);
      } else {
        op = 0;
      }
      cover.style.opacity = String(Math.max(0, Math.min(1, op)));

      if (elapsed < fadeEndMs) {
        requestAnimationFrame(tick);
      } else {
        cover.remove();
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

/**
 * dym1…dym8 – jak pożoga; fade 15→25.
 */
export function playHeroDymFramesOnElement(cardEl) {
  return new Promise(resolve => {
    if (!cardEl) {
      resolve();
      return;
    }

    const rect = cardEl.getBoundingClientRect();
    const sx = rect.width / 180;
    const sy = rect.height / 240;

    const dym = document.createElement('div');
    dym.className = 'ap-hero-dym';
    dym.style.cssText = `
      position:absolute; left:0; top:0;
      width:${180 * sx}px; height:${240 * sy}px;
      pointer-events:none; z-index:23;
      background-size:100% 100%; background-repeat:no-repeat; background-position:0 0;
      opacity:1;
      filter:brightness(${HERO_DYM_BRIGHTNESS}) contrast(${HERO_DYM_CONTRAST});
    `;

    const setFrame = index => {
      dym.style.backgroundImage = `url('${FX.dymFrames[index]}')`;
    };

    setFrame(0);
    cardEl.appendChild(dym);

    const stepMs =
      (HERO_DYM_ANIM_FRAMES * HERO_FRAME_MS) / HERO_DYM_FRAME_COUNT;
    const holdMs = HERO_DYM_HOLD_FRAMES * HERO_FRAME_MS;
    const fadeStartMs = HERO_DYM_FADE_START * HERO_FRAME_MS;
    const fadeEndMs = HERO_DYM_FADE_END * HERO_FRAME_MS;
    const totalMs = Math.max(
      HERO_DYM_ANIM_FRAMES * HERO_FRAME_MS + holdMs,
      fadeEndMs
    );

    let frame = 0;
    const t0 = performance.now();

    const tickFrames = () => {
      frame++;
      if (frame < HERO_DYM_FRAME_COUNT) {
        setFrame(frame);
        setTimeout(tickFrames, stepMs);
      }
    };

    const tickOpacity = now => {
      const elapsed = now - t0;
      let op = 1;
      if (elapsed >= fadeStartMs) {
        const u =
          (elapsed - fadeStartMs) / Math.max(1, fadeEndMs - fadeStartMs);
        op = 1 - Math.min(1, u);
      }
      dym.style.opacity = String(Math.max(0, op));

      if (elapsed < totalMs) {
        requestAnimationFrame(tickOpacity);
      } else {
        dym.remove();
        resolve();
      }
    };

    setTimeout(tickFrames, stepMs);
    requestAnimationFrame(tickOpacity);
  });
}

/**
 * dymek.webp nad dymem, pod iskrami; dowolny kierunek.
 */
export function playHeroDymekBurstOnElement(cardEl) {
  return new Promise(resolve => {
    if (!cardEl) {
      resolve();
      return;
    }

    const rect = cardEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const layer = document.createElement('div');
    layer.className = 'ap-hero-dymek-layer';
    layer.style.cssText = `
      position:absolute; inset:0; overflow:visible;
      pointer-events:none; z-index:24;
    `;
    cardEl.appendChild(layer);

    const count =
      HERO_DYMEK_COUNT_MIN +
      Math.floor(
        Math.random() * (HERO_DYMEK_COUNT_MAX - HERO_DYMEK_COUNT_MIN + 1)
      );

    const baseSize = Math.min(w, h) * HERO_DYMEK_SIZE;
    const fadeStartMs = HERO_DYMEK_FADE_START * HERO_FRAME_MS;
    const fadeEndMs = HERO_DYMEK_FADE_END * HERO_FRAME_MS;
    const totalMs = fadeEndMs;
    const travel = Math.min(w, h) * HERO_DYMEK_TRAVEL;

    const items = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'ap-hero-dymek';
      const size = baseSize * (0.85 + Math.random() * 0.3);
      const cx = size * 0.5 + Math.random() * Math.max(1, w - size);
      const cy = size * 0.5 + Math.random() * Math.max(1, h - size);
      const bri =
        HERO_DYMEK_BRIGHTNESS *
        (1 + (Math.random() * 2 - 1) * HERO_DYMEK_BRIGHTNESS_JITTER);
      const rot = (Math.random() - 0.5) * 40;

      el.style.cssText = `
        position:absolute;
        left:${cx}px; top:${cy}px;
        width:${size}px; height:${size}px;
        margin-left:${-size / 2}px; margin-top:${-size / 2}px;
        background:url('${FX.dymek}') center / contain no-repeat;
        filter:brightness(${bri.toFixed(3)});
        opacity:${HERO_DYMEK_OPACITY};
        transform:rotate(${rot}deg) scale(1);
        pointer-events:none;
        will-change:transform,opacity;
      `;
      layer.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist = travel * (0.6 + Math.random() * 0.5);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const drot = (Math.random() - 0.5) * 40;
      items.push({ el, dx, dy, drot, rot });
    }

    const t0 = performance.now();
    const tick = now => {
      const elapsed = now - t0;
      const uMove = Math.min(1, elapsed / totalMs);

      let op = HERO_DYMEK_OPACITY;
      if (elapsed >= fadeStartMs) {
        const u =
          (elapsed - fadeStartMs) / Math.max(1, fadeEndMs - fadeStartMs);
        op = HERO_DYMEK_OPACITY * (1 - Math.min(1, u));
      }

      items.forEach(({ el, dx, dy, drot, rot }) => {
        el.style.opacity = String(Math.max(0, op));
        el.style.transform = `translate(${dx * uMove}px, ${dy * uMove}px) rotate(${
          rot + drot * uMove
        }deg) scale(${1 + 0.08 * uMove})`;
      });

      if (elapsed < totalMs) {
        requestAnimationFrame(tick);
      } else {
        layer.remove();
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

/** Pełny FX bohatera – warstwy równolegle; iskry na wierzchu (canvas). */
export async function playHeroCardEffect(cardEl) {
  if (!cardEl) return;
  playSound('zagranieBohateraSound');
  await Promise.all([
    playHeroCoverOnElement(cardEl),
    playHeroDymFramesOnElement(cardEl),
    playHeroDymekBurstOnElement(cardEl),
    playHeroSparksOnElement(cardEl)
  ]);
}

/**
 * Lot z ręki → plansza (bez FX – FX woła playground po onLanded + render).
 */
export async function animateHeroPlayFromHand({
  card,
  from4K = HAND_CENTER_4K,
  to4K,
  onLanded
}) {
  if (!card || !to4K) return;

  const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
  const fly = document.createElement('div');
  fly.style.position = 'relative';
  fly.style.width = `${180 * scale}px`;
  fly.style.height = `${240 * scale}px`;
  const img = document.createElement('img');
  img.src = getCardImage(card);
  img.style.width = '100%';
  img.style.height = '100%';
  fly.appendChild(img);

  await new Promise(resolve => {
    animateElement(fly, from4K, to4K, 180, 240, resolve);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (fly._targetPos) {
          fly.style.left = `${fly._targetPos.x}px`;
          fly.style.top = `${fly._targetPos.y}px`;
          if (fly._targetSize) {
            fly.style.width = `${fly._targetSize.w}px`;
            fly.style.height = `${fly._targetSize.h}px`;
          }
        }
      });
    });
  });

  if (typeof onLanded === 'function') onLanded();
}

// ==================== WEZWANIE ====================
// Fire Corners + Sparks – tylko w obrębie karty (overflow:hidden).

/**
 * Animacja wezwania na jednej karcie DOM (ucinana poza kartą).
 * @param {HTMLElement} cardEl
 * @returns {Promise<void>}
 */
export function playWezwanieOnCardElement(cardEl) {
  return new Promise(resolve => {
    if (!cardEl) {
      resolve();
      return;
    }

    ensureWezwanieStar();

    const rect = cardEl.getBoundingClientRect();
    const cardW = rect.width;
    const cardH = rect.height;
    if (cardW < 2 || cardH < 2) {
      resolve();
      return;
    }

    const scale = cardW / 180;
    const CFG = WEZWANIE_CFG;

    const clip = document.createElement('div');
    clip.className = 'ap-wezwanie-clip';
    clip.style.cssText = `
      position:absolute; inset:0; overflow:hidden;
      pointer-events:none; z-index:28;
    `;

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(cardW);
    canvas.height = Math.ceil(cardH);
    canvas.style.cssText = `
      position:absolute; left:0; top:0;
      width:100%; height:100%;
      pointer-events:none;
    `;
    clip.appendChild(canvas);
    cardEl.appendChild(clip);

    const ctx = canvas.getContext('2d');
    const CARD_X = 0;
    const CARD_Y = 0;
    const CARD_W = cardW;
    const CARD_H = cardH;

    const particles = [];
    let spawnAccumulator = 0; // ważne!

    // ==================== GLOW ====================
    function drawGlow(frame) {
      const peak = CFG.glowPeak;
      const hold = CFG.glowHold;
      const fadeEnd = CFG.glowFadeEnd;
      const strength = CFG.glowStrength;

      let intensity = 0;
      if (frame <= peak) {
        const t = frame / peak;
        intensity = t * t * (3 - 2 * t);
      } else if (frame <= hold) {
        intensity = 1;
      } else if (frame <= fadeEnd) {
        intensity = 1 - (frame - hold) / (fadeEnd - hold);
      }
      intensity = Math.max(0, intensity) * strength;
      if (intensity <= 0.01) return;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const grd = ctx.createLinearGradient(
        CARD_X + CARD_W / 2,
        CARD_Y + CARD_H,
        CARD_X + CARD_W / 2,
        CARD_Y + CARD_H * 0.45
      );
      grd.addColorStop(0, `rgba(255,200,60,${0.55 * intensity})`);
      grd.addColorStop(0.35, `rgba(255,140,30,${0.28 * intensity})`);
      grd.addColorStop(0.7, `rgba(255,90,15,${0.1 * intensity})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grd;
      ctx.fillRect(
        CARD_X - 10 * scale,
        CARD_Y + CARD_H * 0.4,
        CARD_W + 20 * scale,
        CARD_H * 0.65
      );

      for (const side of [-1, 1]) {
        const cx = CARD_X + CARD_W / 2 + side * CARD_W * 0.42;
        const cy = CARD_Y + CARD_H + 5 * scale;
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, CARD_W * 0.7);
        rg.addColorStop(0, `rgba(255,180,50,${0.35 * intensity})`);
        rg.addColorStop(0.5, `rgba(255,100,20,${0.12 * intensity})`);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, CARD_W * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ==================== SPARK ====================
    class Spark {
      constructor(x, y) {
        this.x = x;
        this.y = y;

        const lifeF = CFG.lifeFrames;
        this.life = (lifeF / WEZWANIE_FPS) * (0.85 + Math.random() * 0.3);
        this.maxLife = this.life;

        const sMin = Math.min(CFG.sizeMin, CFG.sizeMax) * scale;
        const sMax = Math.max(CFG.sizeMin, CFG.sizeMax) * scale;
        this.size = sMin + Math.random() * (sMax - sMin);

        const maxStretch = CFG.stretchY;
        this.scaleY = 1 + (Math.random() * maxStretch - maxStretch * 0.25);
        this.scaleX = 1 + (Math.random() - 0.5) * 0.15;

        const aMin = Math.min(CFG.alphaMin, CFG.alphaMax);
        const aMax = Math.max(CFG.alphaMin, CFG.alphaMax);
        this.baseAlpha = aMin + Math.random() * (aMax - aMin);

        this.tintIndex = Math.floor(
          Math.random() * Math.max(wezwanieTinted.length, 1)
        );

        this.vx = (Math.random() - 0.5) * CFG.spreadX * scale;
        this.vy = -CFG.upForce * scale * (0.7 + Math.random() * 0.5);

        this.sparkAngle = Math.random() * Math.PI * 2;
        this.sparkRadius = (4 + Math.random() * 10) * scale;
        this.sparkSpeed =
          (0.8 + Math.random()) * (Math.random() > 0.5 ? 1 : -1);

        const jit = CFG.targetJitter / 100;
        this.jitterX = (Math.random() - 0.5) * jit;
        this.jitterY = (Math.random() - 0.5) * jit;

        this.alive = true;
      }

      update(dt, frame) {
        this.life -= dt;
        if (this.life <= 0) {
          this.alive = false;
          return;
        }

        this.vy += CFG.gravity * scale * dt;

        const spin = CFG.sparkSpin;
        if (spin > 0) {
          this.sparkAngle += this.sparkSpeed * spin * dt;
          this.vx +=
            Math.cos(this.sparkAngle) * this.sparkRadius * 0.3 * spin * dt;
          this.vy +=
            Math.sin(this.sparkAngle) * this.sparkRadius * 0.3 * spin * dt;
          this.sparkRadius *= 0.99;
        }

        const switchF = CFG.switchFrame;
        const smooth = CFG.switchSmooth;
        let blend = 0;
        if (frame > switchF) {
          blend = Math.min((frame - switchF) / smooth, 1);
          blend = blend * blend * (3 - 2 * blend);
        }

        const tx1 = CARD_X + CARD_W * (CFG.t1x / 100 + this.jitterX);
        const ty1 = CARD_Y + CARD_H * (CFG.t1y / 100 + this.jitterY);
        const tx2 = CARD_X + CARD_W * (CFG.t2x / 100 + this.jitterX * 0.5);
        const ty2 = CARD_Y + CARD_H * (CFG.t2y / 100 + this.jitterY * 0.5);

        const tx = tx1 + (tx2 - tx1) * blend;
        const ty = ty1 + (ty2 - ty1) * blend;

        const force = CFG.curveForce;
        const forceMul = 0.3 + 0.7 * Math.min(frame / 25, 1);
        this.vx += (tx - this.x) * force * forceMul * dt;
        this.vy += (ty - this.y) * force * forceMul * dt;

        const drag = CFG.drag;
        this.vx *= Math.pow(drag, dt * 60);
        this.vy *= Math.pow(drag, dt * 60);

        this.x += this.vx * dt;
        this.y += this.vy * dt;
      }

      draw(globalAlpha) {
        if (!this.alive) return;
        const p = 1 - this.life / this.maxLife;
        const lifeFade = Math.pow(1 - p, 1.1);
        const alpha = this.baseAlpha * lifeFade * globalAlpha;
        if (alpha < 0.02) return;

        const w = this.size * this.scaleX;
        const h = this.size * this.scaleY;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha;

        if (wezwanieStarReady && wezwanieTinted.length > 0) {
          const img = wezwanieTinted[this.tintIndex % wezwanieTinted.length];
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else if (wezwanieStarReady && wezwanieStarImg) {
          ctx.drawImage(wezwanieStarImg, -w / 2, -h / 2, w, h);
        } else {
          ctx.fillStyle = 'rgb(255,170,40)';
          ctx.beginPath();
          ctx.ellipse(0, 0, w * 0.4, h * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // ==================== SPAWN (jedyna, poprawna wersja) ====================
    function spawnSparks(frame) {
      const startF = CFG.sparkStart;
      const endF = CFG.sparkEnd;
      if (frame < startF || frame > endF) return;

      let left = CARD_X;
      let right = CARD_X + CARD_W;
      const shStart = CFG.shrinkStart;
      const shEnd = CFG.shrinkEnd;

      if (frame > shStart) {
        const t = Math.min((frame - shStart) / (shEnd - shStart + 0.01), 1);
        const smooth = t * t * (3 - 2 * t);
        const targetWidth = CARD_W / 3;
        const currentWidth = CARD_W + (targetWidth - CARD_W) * smooth;
        right = left + currentWidth;
      }

      const width = Math.max(right - left, 6);

      const totalSpawnFrames = endF - startF + 0.01;
      const progress = (frame - startF) / totalSpawnFrames;
      const densMult = CFG.densityBoost * (1 - progress) + 1.0 * progress;

      // Akumulator – działa poprawnie z density: 0.5
      const desired = CFG.density * densMult * (0.5 + width / CARD_W);
      spawnAccumulator += desired;
      const count = Math.floor(spawnAccumulator);
      spawnAccumulator -= count;

      const offset = Math.min(CFG.spawnOffset * scale, CARD_H * 0.08);

      for (let i = 0; i < count; i++) {
        const x = left + Math.random() * width;
        const y =
          CARD_Y + CARD_H - offset + (Math.random() - 0.5) * 5 * scale;
        particles.push(new Spark(x, y));
      }
    }

    // ==================== LOOP ====================
    const t0 = performance.now();
    let lastTime = t0;

    const loop = now => {
      const dt = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;
      const elapsed = (now - t0) / 1000;
      const frame = elapsed * WEZWANIE_FPS;
      const endF = CFG.endFrame;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawGlow(frame);
      spawnSparks(frame);

      let globalFade = 1;
      const fs = CFG.fadeStart;
      if (frame > fs) {
        globalFade = Math.max(0, 1 - (frame - fs) / (endF - fs + 0.01));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(dt, frame);
        if (p.alive) p.draw(globalFade);
        else particles.splice(i, 1);
      }

      if (frame < endF) {
        requestAnimationFrame(loop);
      } else {
        clip.remove();
        resolve();
      }
    };

    requestAnimationFrame(loop);
  });
}
/**
 * Wezwanie na wielu kartach naraz (np. tarczowniczki po Cerys).
 * @param {HTMLElement[]} cardEls
 */
export async function playWezwanieOnCards(cardEls) {
  const list = (cardEls || []).filter(Boolean);
  if (!list.length) return;
  await Promise.all(list.map(el => playWezwanieOnCardElement(el)));
}

// ==================== LĄDOWANIE (karty bez mocy / moc „cicha”) ====================

const LAND_FPS = 60;
const LAND_FRAME_MS = 1000 / LAND_FPS;

/** Tune lądowania */
export const LAND_CFG = {
  /** czas animacji (klatki @60fps) */
  durationFrames: 45,
  /** szybki „uderzeniowy” wylot */
  burstFrames: 5,
  /** do tej klatki blur rośnie do blurMax */
  blurFrames: 7,
  /** max blur w px (skala karty 180) – ~50% „rozmazania” wizualnie */
  blurMaxPx: 4,

  /**
   * Wielkość dymka względem szerokości karty.
   * 1.0 = 100% (za duży) → start np. 0.28–0.40
   */
  dymekSize: 0.7,
  /** losowy rozrzut rozmiaru ± */
  dymekSizeJitter: 0.2,

  /** spłaszczenie w kierunku wylotu (0.5 = −50% w tej osi) */
  flatten: 0.5,

  /** ile dymków na bok */
  countVerticalMin: 2, // lewy / prawy
  countVerticalMax: 4,
  countHorizontalMin: 1, // góra / dół
  countHorizontalMax: 2,

  /**
   * start wzdłuż krawędzi: ~1/3 od rogu w stronę środka boku
   * (pozycja na obrzeżu, nie na środku karty)
   */
  edgeInset: 0.95,

  /** dystans szybkiego wylotu ≈ 1/3 szerokości karty (poza kartę) */
  burstDistFactor: 1 / 8,

  /**
   * wolne oddalanie po burstcie: 2% szerokości karty / sekundę
   */
  driftPerSecFactor: 0.02,

  /** krycie start / koniec */
  opacityStart: 0.60,
  opacityEnd: 0,

  /** pociemnienie dymek (jak przy bohaterze) */
  brightness: 0.7
};

/**
 * Kurz spod karty po zadokowaniu – bez mocy / moc jeszcze nie gra.
 * Wołaj PO dolocie (onLanded + render), na elemencie slotu.
 * @param {HTMLElement} cardEl
 * @returns {Promise<void>}
 */
export function playCardLandDustOnElement(cardEl) {
  return new Promise(resolve => {
    if (!cardEl) {
      resolve();
      return;
    }

    const rect = cardEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w < 2 || h < 2) {
      resolve();
      return;
    }

    const CFG = LAND_CFG;
    const durationMs = CFG.durationFrames * LAND_FRAME_MS;
    const burstMs = CFG.burstFrames * LAND_FRAME_MS;
    const blurMs = CFG.blurFrames * LAND_FRAME_MS;

    // warstwa nad kartą, może wystawać poza nią
    const layer = document.createElement('div');
    layer.className = 'ap-land-dust-layer';
    layer.style.cssText = `
      position:absolute; inset:0; overflow:visible;
      pointer-events:none; z-index:27;
    `;
    cardEl.appendChild(layer);

    const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const particles = [];

    /**
     * side: 'left' | 'right' | 'top' | 'bottom'
     * nx,ny – kierunek wylotu
     * flatten: scaleX/scaleY
     */
    const spawnSide = (side, count) => {
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5 + (Math.random() - 0.5) * 0.35) / count;
        // wzdłuż krawędzi, z insetem ~1/3 od końców
        const along = CFG.edgeInset + (1 - 2 * CFG.edgeInset) * Math.min(1, Math.max(0, t));

        let x, y, nx, ny, scaleX, scaleY;
        const size =
          w *
          CFG.dymekSize *
          (1 + (Math.random() * 2 - 1) * CFG.dymekSizeJitter);

                if (side === 'left') {
          x = 0;
          y = along * h;
          nx = -1;
          ny = (Math.random() - 0.5) * 0.25;
          // wylot w lewo → spłaszcz w osi wylotu (poziomo)
          scaleX = CFG.flatten;
          scaleY = 1;
        } else if (side === 'right') {
          x = w;
          y = along * h;
          nx = 1;
          ny = (Math.random() - 0.5) * 0.25;
          scaleX = CFG.flatten;
          scaleY = 1;
        } else if (side === 'top') {
          x = along * w;
          y = 0;
          nx = (Math.random() - 0.5) * 0.25;
          ny = -1;
          // wylot w górę → spłaszcz w osi wylotu (pionowo)
          scaleX = 1;
          scaleY = CFG.flatten;
        } else {
          // bottom
          x = along * w;
          y = h;
          nx = (Math.random() - 0.5) * 0.25;
          ny = 1;
          scaleX = 1;
          scaleY = CFG.flatten;
        }

        // normalizuj kierunek
        const len = Math.hypot(nx, ny) || 1;
        nx /= len;
        ny /= len;

        const el = document.createElement('div');
        el.className = 'ap-land-dust';
        el.style.cssText = `
          position:absolute;
          left:${x}px; top:${y}px;
          width:${size}px; height:${size}px;
          margin-left:${-size / 2}px; margin-top:${-size / 2}px;
          background:url('${FX.dymek}') center / contain no-repeat;
          filter:brightness(${CFG.brightness}) blur(0px);
          opacity:${CFG.opacityStart};
          transform:scale(${scaleX}, ${scaleY});
          pointer-events:none;
          will-change:transform,opacity,filter;
        `;
        layer.appendChild(el);

        const burstDist = w * CFG.burstDistFactor * (0.85 + Math.random() * 0.3);
        particles.push({
          el,
          x,
          y,
          nx,
          ny,
          scaleX,
          scaleY,
          size,
          burstDist,
          // losowy drobny drift kątowy przy wolnej fazie
          driftJitter: (Math.random() - 0.5) * 0.15
        });
      }
    };

    spawnSide('left', randInt(CFG.countVerticalMin, CFG.countVerticalMax));
    spawnSide('right', randInt(CFG.countVerticalMin, CFG.countVerticalMax));
    spawnSide('top', randInt(CFG.countHorizontalMin, CFG.countHorizontalMax));
    spawnSide('bottom', randInt(CFG.countHorizontalMin, CFG.countHorizontalMax));

    // easeOutCubic
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const t0 = performance.now();
    const driftSpeed = w * CFG.driftPerSecFactor; // px / s

    const tick = now => {
      const elapsed = now - t0;
      const u = Math.min(1, elapsed / durationMs);

      // blur: 0 → blurMax do klatki 7
      const blurT = Math.min(1, elapsed / blurMs);
      const blurPx = CFG.blurMaxPx * (w / 180) * blurT;

      // faza 1: szybki wylot 0→burstMs (ease-out)
      // faza 2: wolne oddalanie + zanik
      const burstT = Math.min(1, elapsed / burstMs);
      const burstEase = easeOutCubic(burstT);
      const afterBurstSec = Math.max(0, (elapsed - burstMs) / 1000);

      // opacity: pełne w burstcie, potem linear do 0
      let op = CFG.opacityStart;
      if (elapsed > burstMs) {
        const fadeU =
          (elapsed - burstMs) / Math.max(1, durationMs - burstMs);
        op =
          CFG.opacityStart +
          (CFG.opacityEnd - CFG.opacityStart) * Math.min(1, fadeU);
      }

      particles.forEach(p => {
        const burstX = p.nx * p.burstDist * burstEase;
        const burstY = p.ny * p.burstDist * burstEase;

        // po burstcie: +2% szerokości/s w tym samym kierunku
        const drift = driftSpeed * afterBurstSec;
        const dx =
          burstX + (p.nx + p.driftJitter) * drift;
        const dy =
          burstY + (p.ny + p.driftJitter * 0.5) * drift;

        p.el.style.opacity = String(Math.max(0, op));
        p.el.style.filter = `brightness(${CFG.brightness}) blur(${blurPx.toFixed(2)}px)`;
        p.el.style.transform = `translate(${dx}px, ${dy}px) scale(${p.scaleX}, ${p.scaleY})`;
      });

      if (elapsed < durationMs) {
        requestAnimationFrame(tick);
      } else {
        layer.remove();
        resolve();
      }
    };

    requestAnimationFrame(tick);
  });
}

// ==================== IKONA MOCY (po zagraniu karty z mocą) ====================

const POWER_FPS = 60;
const POWER_FRAME_MS = 1000 / POWER_FPS;

/**
 * Moc → plik w assets/asety/effekty/moce/
 * Klucz = wartość `card.moc` z cards.js
 * Dopisujesz tu kolejne moce + plik .webp o tej samej nazwie.
 */
export const POWER_ICON_FILES = {
  szpieg: 'szpieg.webp',
  wezwanie: 'wezwanie.webp',
  wiez: 'wiez.webp',
  rog: 'rog.webp',
  morale: 'morale.webp'
  // medyk: 'medyk.webp',  // przykład na przyszłość
};

/** Moce, które w ogóle dostają tę animację (łatwe włączanie) */
export const POWER_ICON_ENABLED = new Set([
  'szpieg',
  'wezwanie',
  'wiez',
  'rog',
  'morale'
]);

/** Wspólne tune animacji ikony */
export const POWER_ICON_CFG = {
  durationFrames: 80,

  /**
   * 4 kotwice: frame (0…duration) + scale względem szerokości karty.
   * scale = mnożnik * (cardW * baseSize)
   * Sortowane po frame – interpolacja liniowa między nimi.
   */
  keyframes: [
    { frame: 0, scale: 0.0 },   // 1 – start (blur)
    { frame: 10, scale: 2.3 },    // 2 – pełny rozmiar, ostry
    { frame: 70, scale: 1.95 },   // 3 – trzymanie
    { frame: 80, scale: 0.0 }    // 4 – koniec (blur + mniejszy)
  ],

  /** bazowy rozmiar ikony = baseSize * szerokość karty */
  baseSize: 0.55,

  /** blur: kf1→kf2 znika, kf3→kf4 wraca */
  blurStartPx: 8,   // przy 1. kotwicy
  blurMidPx: 0,     // od 2. do 3.
  blurEndPx: 8,     // przy 4. kotwicy

  /** cień pod ikoną */
  shadow: {
    offsetX: 0,          // px @ skali karty 180
    offsetY: 6,
    blur: 10,
    spread: 0,
    color: 'rgba(0,0,0,0.45)',
    /** skala cienia względem ikony (1 = ten sam „box”) */
    scale: 0.85,
    opacity: 0.7
  },

  zIndex: 30 // nad kurzem lądowania (27)
};

/** Tylko morale – strzałki kierunek.webp */
export const POWER_MORALE_ARROWS = {
  file: 'kierunek.webp',
  /** rozmiar względem szerokości karty */
  size: 0.28,
  /** odległość od środka w osi X (udział szerokości karty) */
  offsetX: 0.42,
  /** przesunięcie w Y (udział wysokości; 0 = środek) */
  offsetY: 0,
  /**
   * pojawianie: te same keyframe’y co ikona, ale własne skale strzałek
   * (mnożnik do size)
   */
  keyframes: [
    { frame: 5, scale: 0.0 },
    { frame: 20, scale: 2.3 },
    { frame: 60, scale: 1.95 },
    { frame: 70, scale: 0.5 }
  ],
  /** startowy blur strzałek (jak ikona) */
  blurStartPx: 6,
  blurMidPx: 0,
  blurEndPx: 6,
  opacity: 0.95
};

function powerIconUrl(moc) {
  const file = POWER_ICON_FILES[moc];
  if (!file) return null;
  return `assets/asety/effekty/moce/${file}`;
}

function powerAssetUrl(filename) {
  return `assets/asety/effekty/moce/${filename}`;
}

/** interpolacja skali / wartości między keyframe’ami */
function lerpKeyframes(keyframes, frame) {
  const kfs = [...keyframes].sort((a, b) => a.frame - b.frame);
  if (frame <= kfs[0].frame) return kfs[0].scale;
  if (frame >= kfs[kfs.length - 1].frame) return kfs[kfs.length - 1].scale;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const t = (frame - a.frame) / Math.max(0.001, b.frame - a.frame);
      return a.scale + (b.scale - a.scale) * t;
    }
  }
  return kfs[kfs.length - 1].scale;
}

/**
 * Blur wg 4 kotwic:
 * kf0→kf1: blurStart → blurMid
 * kf1→kf2: blurMid
 * kf2→kf3: blurMid → blurEnd
 */
function powerBlurAtFrame(frame, kfs, blurStart, blurMid, blurEnd) {
  const sorted = [...kfs].sort((a, b) => a.frame - b.frame);
  const f0 = sorted[0].frame;
  const f1 = sorted[1].frame;
  const f2 = sorted[2].frame;
  const f3 = sorted[3].frame;

  if (frame <= f0) return blurStart;
  if (frame < f1) {
    const t = (frame - f0) / Math.max(0.001, f1 - f0);
    return blurStart + (blurMid - blurStart) * t;
  }
  if (frame < f2) return blurMid;
  if (frame <= f3) {
    const t = (frame - f2) / Math.max(0.001, f3 - f2);
    return blurMid + (blurEnd - blurMid) * t;
  }
  return blurEnd;
}

/**
 * Czy ta moc ma animację ikony.
 */
export function powerHasIconAnim(moc) {
  return !!(moc && POWER_ICON_ENABLED.has(moc) && POWER_ICON_FILES[moc]);
}

/**
 * Animacja ikony mocy nad kartą.
 * @param {HTMLElement} cardEl
 * @param {string} moc – card.moc (np. 'szpieg', 'wiez', 'rog', 'morale')
 */
export function playPowerIconOnElement(cardEl, moc) {
  return new Promise(resolve => {
    if (!cardEl || !powerHasIconAnim(moc)) {
      resolve();
      return;
    }

    const src = powerIconUrl(moc);
    if (!src) {
      resolve();
      return;
    }

    const rect = cardEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w < 2 || h < 2) {
      resolve();
      return;
    }

    const CFG = POWER_ICON_CFG;
    const scalePx = w / 180;
    const durationMs = CFG.durationFrames * POWER_FRAME_MS;
    const kfs = CFG.keyframes;

    const layer = document.createElement('div');
    layer.className = 'ap-power-icon-layer';
    layer.style.cssText = `
      position:absolute; inset:0; overflow:visible;
      pointer-events:none; z-index:${CFG.zIndex};
      display:flex; align-items:center; justify-content:center;
    `;

    // cień
    const sh = CFG.shadow;
    const shadow = document.createElement('div');
    shadow.className = 'ap-power-icon-shadow';
    shadow.style.cssText = `
      position:absolute; left:50%; top:50%;
      border-radius:50%;
      background:${sh.color};
      opacity:${sh.opacity};
      transform:translate(-50%, -50%);
      pointer-events:none;
      filter:blur(${(sh.blur * scalePx).toFixed(1)}px);
    `;

    // ikona mocy
    const icon = document.createElement('div');
    icon.className = 'ap-power-icon';
    icon.style.cssText = `
      position:absolute; left:50%; top:50%;
      background:url('${src}') center / contain no-repeat;
      transform:translate(-50%, -50%) scale(1);
      pointer-events:none;
      will-change:transform,filter,opacity;
    `;

    layer.appendChild(shadow);
    layer.appendChild(icon);

    // morale – strzałki pod ikoną (przed ikoną w DOM = pod spodem wizualnie jeśli z-index)
    let arrowL = null;
    let arrowR = null;
    const isMorale = moc === 'morale';
    if (isMorale) {
      const A = POWER_MORALE_ARROWS;
      const arrowSrc = powerAssetUrl(A.file);

      arrowL = document.createElement('div');
      arrowR = document.createElement('div');
      const baseArrow = `
        position:absolute; left:50%; top:50%;
        background:url('${arrowSrc}') center / contain no-repeat;
        pointer-events:none; will-change:transform,filter,opacity;
        opacity:${A.opacity};
      `;
      arrowL.style.cssText = baseArrow;
      arrowR.style.cssText = baseArrow + 'transform:translate(-50%,-50%) scaleX(-1);'; // lustro

      // strzałki POD ikoną
      layer.insertBefore(arrowR, icon);
      layer.insertBefore(arrowL, icon);
    }

    const baseIconSize = w * CFG.baseSize;
    icon.style.width = `${baseIconSize}px`;
    icon.style.height = `${baseIconSize}px`;
    icon.style.marginLeft = '0';
    icon.style.marginTop = '0';

    const baseShW = baseIconSize * sh.scale;
    const baseShH = baseIconSize * sh.scale * 0.35;
    shadow.style.width = `${baseShW}px`;
    shadow.style.height = `${baseShH}px`;
    shadow.style.left = `calc(50% + ${sh.offsetX * scalePx}px)`;
    shadow.style.top = `calc(50% + ${sh.offsetY * scalePx}px)`;

    let baseASize = 0;
    let ox = 0;
    let oy = 0;
    if (isMorale && arrowL && arrowR) {
      const A = POWER_MORALE_ARROWS;
      baseASize = w * A.size;
      arrowL.style.width = `${baseASize}px`;
      arrowL.style.height = `${baseASize}px`;
      arrowR.style.width = `${baseASize}px`;
      arrowR.style.height = `${baseASize}px`;
      ox = w * A.offsetX;
      oy = h * A.offsetY;
    }

    cardEl.appendChild(layer);

    const t0 = performance.now();

    const tick = now => {
      const elapsed = now - t0;
      const frame = Math.min(
        CFG.durationFrames,
        (elapsed / POWER_FRAME_MS)
      );

      const scaleMul = lerpKeyframes(kfs, frame);

      const blur = powerBlurAtFrame(
        frame,
        kfs,
        CFG.blurStartPx * scalePx,
        CFG.blurMidPx,
        CFG.blurEndPx * scalePx
      );

      icon.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
      icon.style.transform = `translate(-50%, -50%) scale(${scaleMul.toFixed(4)})`;

      shadow.style.transform = `translate(-50%, -50%) scale(${scaleMul.toFixed(4)})`;

      if (isMorale && arrowL && arrowR) {
        const A = POWER_MORALE_ARROWS;
        const aMul = lerpKeyframes(A.keyframes, frame);
        const aBlur = powerBlurAtFrame(
          frame,
          A.keyframes,
          A.blurStartPx * scalePx,
          A.blurMidPx,
          A.blurEndPx * scalePx
        );
        arrowL.style.filter = aBlur > 0.05 ? `blur(${aBlur.toFixed(2)}px)` : 'none';
        arrowL.style.transform = `translate(calc(-50% - ${ox}px), calc(-50% + ${oy}px)) scale(${aMul.toFixed(4)})`;

        arrowR.style.filter = aBlur > 0.05 ? `blur(${aBlur.toFixed(2)}px)` : 'none';
        arrowR.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) scale(${-aMul.toFixed(4)}, ${aMul.toFixed(4)})`;
      }

      if (elapsed < durationMs) {
        requestAnimationFrame(tick);
      } else {
        layer.remove();
        resolve();
      }
    };

    requestAnimationFrame(tick);
  });
}

/**
 * Lądowanie + (opcjonalnie) ikona mocy nad nim.
 * Podstawowy kurz leci zawsze; ikona tylko gdy moc jest na liście.
 * @param {HTMLElement} cardEl
 * @param {string|null} moc
 * @param {{ skipLand?: boolean }} opts
 */
export async function playCardLandWithPower(cardEl, moc = null, opts = {}) {
  if (!cardEl) return;
  const tasks = [];
  if (!opts.skipLand) {
    tasks.push(playCardLandDustOnElement(cardEl));
  }
  if (powerHasIconAnim(moc)) {
    tasks.push(playPowerIconOnElement(cardEl, moc));
  }
  await Promise.all(tasks);
}