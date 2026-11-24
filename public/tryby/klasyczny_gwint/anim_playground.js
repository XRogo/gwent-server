/**
 * anim_playground.js – mini-plansza + UI testów.
 * Wszystkie FX wyłącznie z anim_effects.js (jak w game_board.js).
 */
import cards from './cards.js';
import { getCardImage } from './cardImages.js';
import { getElement4KPos } from './animacje.js';
import {
  runPorzogaOnCardElement,
  animateHeroPlayFromHand,
  playHeroCardEffect,
  playWezwanieOnCards,
  playCardLandWithPower,
  playCardSmokeEffect,
  resolveCardSmokeConfig
} from './anim_effects.js';

const GUI_W = 3840;
const GUI_H = 2160;

const rowCoords = {
  opp3: { x: 1412, y: 29, w: 1609, h: 239 },
  opp2: { x: 1412, y: 294, w: 1609, h: 239 },
  opp1: { x: 1412, y: 565, w: 1609, h: 239 },
  self1: { x: 1412, y: 863, w: 1609, h: 239 },
  self2: { x: 1412, y: 1129, w: 1609, h: 239 },
  self3: { x: 1412, y: 1407, w: 1609, h: 239 }
};

const SPECIAL_X = 1182;
const SPECIAL_Y = {
  p2: [null, 565, 294, 29],
  p1: [null, 863, 1129, 1407]
};
const WEATHER_POS = { x: 286, y: 917, w: 549, h: 239 };
const HAND_CENTER_4K = { x: 2090, y: 1811 };

const WEATHER_CARD_NUM = {
  mroz: '003',
  mgla: '004',
  deszcz: '005',
  sztorm: '007'
};

let boardState = {
  p1R1: [], p1R2: [], p1R3: [],
  p2R1: [], p2R2: [], p2R3: [],
  p1S1: null, p1S2: null, p1S3: null,
  p2S1: null, p2S2: null, p2S3: null,
  weather: []
};
let selectedKey = null;

window.arrivedBoardCards = new Set();
window.arrivedWeatherCards = new Set();

function log(msg) {
  const el = document.getElementById('anim-log');
  if (!el) return;
  const d = document.createElement('div');
  d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.prepend(d);
}

function playSound(id) {
  const a = document.getElementById(id);
  if (a) {
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}

function getScale() {
  return Math.min(window.innerWidth / GUI_W, window.innerHeight / GUI_H);
}

function getBoardOffset() {
  const s = getScale();
  return {
    left: (window.innerWidth - GUI_W * s) / 2,
    top: (window.innerHeight - GUI_H * s) / 2
  };
}

function pickUnits(n = 10) {
  const units = cards.filter(c => typeof c.punkty === 'number' && !c.bohater);
  return [...units].sort(() => Math.random() - 0.5).slice(0, n);
}

function findCardByNumer(numer) {
  return cards.find(c => String(c.numer) === String(numer));
}

function rowKeyFromPozycja(pos, side = 'p1') {
  const p = Number(pos) || 1;
  const prefix = side === 'p1' ? 'p1' : 'p2';
  if (p === 2) return `${prefix}R2`;
  if (p === 3) return `${prefix}R3`;
  if (p === 4) return Math.random() < 0.5 ? `${prefix}R1` : `${prefix}R2`;
  return `${prefix}R1`;
}

function parseSummonList(summonField) {
  if (!summonField) return [];
  return String(summonField)
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function rebuildArrived() {
  window.arrivedBoardCards = new Set();
  Object.keys(boardState).forEach(rk => {
    if (Array.isArray(boardState[rk])) {
      boardState[rk].forEach((_, i) =>
        window.arrivedBoardCards.add(`${rk}_${i}`)
      );
    }
  });
  window.arrivedWeatherCards = new Set(boardState.weather || []);
}

function resetBoard() {
  const s = pickUnits(10);
  boardState = {
    p1R1: s.slice(0, 2).map(c => c.numer),
    p1R2: s.slice(2, 4).map(c => c.numer),
    p1R3: s.slice(4, 5).map(c => c.numer),
    p2R1: s.slice(5, 7).map(c => c.numer),
    p2R2: s.slice(7, 9).map(c => c.numer),
    p2R3: s.slice(9, 10).map(c => c.numer),
    p1S1: null, p1S2: null, p1S3: null,
    p2S1: null, p2S2: null, p2S3: null,
    weather: []
  };
  selectedKey = null;
  rebuildArrived();
  renderAll();
  log('Reset planszy');
}

function clearBoard() {
  Object.keys(boardState).forEach(k => {
    if (Array.isArray(boardState[k])) boardState[k] = [];
    else if (k.startsWith('p1S') || k.startsWith('p2S')) boardState[k] = null;
  });
  boardState.weather = [];
  selectedKey = null;
  rebuildArrived();
  renderAll();
  log('Plansza wyczyszczona');
}

function renderAll() {
  const overlay = document.querySelector('#gameScreen .overlay');
  if (!overlay) return;

  Array.from(overlay.children)
    .filter(c => !c.classList.contains('persistent'))
    .forEach(c => c.remove());

  const scale = getScale();
  const { left: boardLeft, top: boardTop } = getBoardOffset();

  const map = {
    p2R3: rowCoords.opp3,
    p2R2: rowCoords.opp2,
    p2R1: rowCoords.opp1,
    p1R1: rowCoords.self1,
    p1R2: rowCoords.self2,
    p1R3: rowCoords.self3
  };

  Object.entries(map).forEach(([rowKey, coords]) => {
    renderRow(overlay, rowKey, coords, scale, boardLeft, boardTop);
  });

  [1, 2, 3].forEach(r => {
    renderSpecial(overlay, 'p1', r, scale, boardLeft, boardTop);
    renderSpecial(overlay, 'p2', r, scale, boardLeft, boardTop);
  });

  renderWeather(overlay, scale, boardLeft, boardTop);
  applyWeatherFilters();
}

function renderRow(overlay, rowKey, coords, scale, boardLeft, boardTop) {
  const numers = boardState[rowKey] || [];
  const count = numers.length;
  const totalW = coords.w * scale;
  const cardH = coords.h * scale;
  const cardW = cardH * (180 / 240);

  let step = cardW + 5 * scale;
  if (count > 1 && count * step > totalW) {
    step = (totalW - cardW) / (count - 1);
  }
  const occupied = count > 0 ? (count - 1) * step + cardW : 0;
  const startX = (totalW - occupied) / 2;

  let rowDiv = overlay.querySelector(`.row-container[data-row="${rowKey}"]`);
  if (!rowDiv) {
    rowDiv = document.createElement('div');
    rowDiv.className = 'row-container persistent';
    rowDiv.dataset.row = rowKey;
    rowDiv.style.position = 'absolute';
    overlay.appendChild(rowDiv);
  }
  rowDiv.style.left = `${coords.x * scale + boardLeft}px`;
  rowDiv.style.top = `${coords.y * scale + boardTop}px`;
  rowDiv.style.width = `${totalW}px`;
  rowDiv.style.height = `${cardH}px`;
  rowDiv.innerHTML = '';

  numers.forEach((numer, i) => {
    const cardKey = `${rowKey}_${i}`;
    const card = cards.find(c => String(c.numer) === String(numer));
    if (!card) return;

    const isArrived = window.arrivedBoardCards.has(cardKey);
    const wrapper = document.createElement('div');
    wrapper.className = 'board-card-wrapper';
    wrapper.id = `slot-placeholder-${cardKey}`;
    wrapper.dataset.key = cardKey;
    wrapper.dataset.numer = card.numer;
    wrapper.dataset.row = rowKey;
    wrapper.style.position = 'absolute';
    wrapper.style.height = '100%';
    wrapper.style.width = `${cardW}px`;
    wrapper.style.left = `${startX + i * step}px`;
    wrapper.style.zIndex = i + 1;
    wrapper.style.cursor = 'pointer';
    wrapper.style.overflow = 'visible';
    if (!isArrived) wrapper.style.visibility = 'hidden';
    if (selectedKey === cardKey) wrapper.classList.add('ap-selected');

    const img = document.createElement('img');
    img.src = getCardImage(card);
    img.style.width = '100%';
    img.style.height = '100%';
    wrapper.appendChild(img);

    if (typeof card.punkty === 'number') {
      const pts = document.createElement('div');
      pts.style.cssText = `
        position:absolute; top:4%; left:8%;
        background:rgba(0,0,0,0.7); color:#fff;
        font-weight:bold; font-size:${Math.max(10, cardH * 0.14)}px;
        padding:1px 4px; border-radius:3px; pointer-events:none; z-index:5;
      `;
      pts.textContent = card.punkty;
      wrapper.appendChild(pts);
    }

    wrapper.onclick = e => {
      e.stopPropagation();
      selectedKey = cardKey;
      renderAll();
      log(
        `Zaznaczono: ${card.nazwa || card.numer} (${card.punkty ?? '–'})${
          card.bohater ? ' [BOHATER]' : ''
        }${card.moc ? ` moc=${card.moc}` : ''}`
      );
    };

    rowDiv.appendChild(wrapper);
  });
}

function renderSpecial(overlay, side, rowIdx, scale, boardLeft, boardTop) {
  const id = `special-slot-${side}-${rowIdx}`;
  let slot = overlay.querySelector(`#${id}`);
  if (!slot) {
    slot = document.createElement('div');
    slot.id = id;
    slot.className = 'persistent';
    slot.style.position = 'absolute';
    overlay.appendChild(slot);
  }
  const y = SPECIAL_Y[side][rowIdx];
  slot.style.left = `${SPECIAL_X * scale + boardLeft}px`;
  slot.style.top = `${y * scale + boardTop}px`;
  slot.style.width = `${179 * scale}px`;
  slot.style.height = `${239 * scale}px`;
  slot.innerHTML = '';

  const num = boardState[`${side}S${rowIdx}`];
  if (num) {
    const card = cards.find(c => String(c.numer) === String(num));
    if (card) {
      const img = document.createElement('img');
      img.src = getCardImage(card);
      img.style.width = '100%';
      img.style.height = '100%';
      slot.appendChild(img);
    }
  }
}

function renderWeather(overlay, scale, boardLeft, boardTop) {
  let container = overlay.querySelector('#weather-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'weather-container';
    container.className = 'persistent';
    container.style.position = 'absolute';
    container.style.zIndex = 40;
    overlay.appendChild(container);
  }
  container.style.left = `${WEATHER_POS.x * scale + boardLeft}px`;
  container.style.top = `${WEATHER_POS.y * scale + boardTop}px`;
  container.style.width = `${WEATHER_POS.w * scale}px`;
  container.style.height = `${WEATHER_POS.h * scale}px`;

  const list = boardState.weather || [];
  const count = Math.min(list.length, 3);
  const cardW = WEATHER_POS.h * scale * (180 / 240);
  let step = cardW + 5 * scale;
  if (count > 1 && count * step > WEATHER_POS.w * scale) {
    step = (WEATHER_POS.w * scale - cardW) / (count - 1);
  }
  const startX =
    (WEATHER_POS.w * scale -
      (count > 0 ? (count - 1) * step + cardW : 0)) /
    2;

  container.innerHTML = '';
  list.slice(-3).forEach((wStr, i) => {
    const wNum = wStr.split('-')[1];
    const card = cards.find(c => String(c.numer) === String(wNum));
    if (!card) return;
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.height = '100%';
    wrapper.style.width = `${cardW}px`;
    wrapper.style.left = `${startX + i * step}px`;
    const img = document.createElement('img');
    img.src = getCardImage(card);
    img.style.width = '100%';
    img.style.height = '100%';
    wrapper.appendChild(img);
    container.appendChild(wrapper);
  });
}

function applyWeatherFilters() {
  document.querySelectorAll('.row-container').forEach(r => {
    r.classList.remove(
      'ap-weather-mroz',
      'ap-weather-mgla',
      'ap-weather-deszcz',
      'ap-weather-sztorm'
    );
  });
  const has = moc =>
    (boardState.weather || []).some(w => {
      const c = cards.find(x => String(x.numer) === String(w.split('-')[1]));
      return (
        c &&
        (c.moc === moc ||
          (c.moc === 'sztorm' && (moc === 'mgla' || moc === 'deszcz')))
      );
    });
  if (has('mroz')) {
    document
      .querySelectorAll('[data-row$="R1"]')
      .forEach(r => r.classList.add('ap-weather-mroz'));
  }
  if (has('mgla') || has('sztorm')) {
    document
      .querySelectorAll('[data-row$="R2"]')
      .forEach(r => r.classList.add('ap-weather-mgla'));
  }
  if (has('deszcz') || has('sztorm')) {
    document
      .querySelectorAll('[data-row$="R3"]')
      .forEach(r => r.classList.add('ap-weather-deszcz'));
  }
  if (has('sztorm')) {
    document
      .querySelectorAll('.row-container')
      .forEach(r => r.classList.add('ap-weather-sztorm'));
  }
}

// ---------- efekty (tylko orkiestracja + wywołania anim_effects) ----------

async function effectPorzoga() {
  playSound('porzogaSound');

  let max = 0;
  ['p1R1', 'p1R2', 'p1R3', 'p2R1', 'p2R2', 'p2R3'].forEach(rk => {
    (boardState[rk] || []).forEach(num => {
      const c = cards.find(x => String(x.numer) === String(num));
      if (c && typeof c.punkty === 'number' && !c.bohater && c.punkty > max) {
        max = c.punkty;
      }
    });
  });

  if (max === 0) {
    log('Brak celów pożogi');
    return;
  }

  const targets = [];
  ['p1R1', 'p1R2', 'p1R3', 'p2R1', 'p2R2', 'p2R3'].forEach(rk => {
    (boardState[rk] || []).forEach((num, i) => {
      const c = cards.find(x => String(x.numer) === String(num));
      if (c && c.punkty === max && !c.bohater) {
        targets.push({ rowKey: rk, index: i, card: c });
      }
    });
  });

  log(`Pożoga → siła ${max}, kart: ${targets.length}`);

  await Promise.all(
    targets.map(async t => {
      const el = document.getElementById(
        `slot-placeholder-${t.rowKey}_${t.index}`
      );
      await runPorzogaOnCardElement(el, t.card, t.rowKey.startsWith('p1'));
    })
  );

  const byRow = {};
  targets.forEach(t => {
    if (!byRow[t.rowKey]) byRow[t.rowKey] = [];
    byRow[t.rowKey].push(t.index);
  });
  Object.entries(byRow).forEach(([rk, idxs]) => {
    idxs.sort((a, b) => b - a).forEach(i => boardState[rk].splice(i, 1));
  });

  selectedKey = null;
  rebuildArrived();
  renderAll();
  log('Pożoga zakończona');
}

async function effectBurnSelected() {
  if (!selectedKey) {
    log('Zaznacz kartę');
    return;
  }
  playSound('porzogaSound');

  const [rk, idxStr] = selectedKey.split('_');
  const idx = Number(idxStr);
  const numer = boardState[rk]?.[idx];
  const card = cards.find(c => String(c.numer) === String(numer));
  if (!card) {
    log('Nie znaleziono karty');
    return;
  }

  const el = document.getElementById(`slot-placeholder-${selectedKey}`);
  log(`Spalanie: ${card.nazwa || card.numer}`);
  await runPorzogaOnCardElement(el, card, rk.startsWith('p1'));

  boardState[rk].splice(idx, 1);
  selectedKey = null;
  rebuildArrived();
  renderAll();
  log('Karta spalona');
}

async function effectWezwanieSelected() {
  if (!selectedKey) {
    log('Zaznacz kartę');
    return;
  }
  const el = document.getElementById(`slot-placeholder-${selectedKey}`);
  if (!el) return;
  log(`Wezwanie FX: ${selectedKey}`);
  await playWezwanieOnCards([el]);
  log('Wezwanie FX OK');
}

async function effectWezwanieRow() {
  if (!selectedKey) {
    log('Zaznacz kartę');
    return;
  }
  const rowKey = selectedKey.split('_')[0];
  const els = [...document.querySelectorAll(
    `.board-card-wrapper[data-row="${rowKey}"]`
  )];
  if (!els.length) {
    log('Pusty rząd');
    return;
  }
  log(`Wezwanie FX rząd ${rowKey} × ${els.length}`);
  await playWezwanieOnCards(els);
  log('Wezwanie FX rząd OK');
}

/** Pełna sekwencja: lot + FX z anim_effects (jak w grze) */
async function runWezwanieSequence(leaderCard) {
  if (!leaderCard) {
    log('Brak karty wezwania');
    return;
  }

  const summonNums = parseSummonList(leaderCard.summon);
  if (!summonNums.length) {
    log(`${leaderCard.nazwa || leaderCard.numer}: brak pola summon`);
    return;
  }

  const rowKey = rowKeyFromPozycja(leaderCard.pozycja, 'p1');
  log(
    `Wezwanie: ${leaderCard.nazwa || leaderCard.numer} → ${rowKey} + [${summonNums.join(', ')}]`
  );

  boardState[rowKey].push(leaderCard.numer);
  const leaderIndex = boardState[rowKey].length - 1;
  const leaderKey = `${rowKey}_${leaderIndex}`;
  renderAll();

  let placeholder = document.getElementById(`slot-placeholder-${leaderKey}`);
  let to4K = {
    x: rowCoords.self1.x + rowCoords.self1.w / 2 - 90,
    y: rowCoords.self1.y
  };
  if (placeholder) to4K = getElement4KPos(placeholder);

  playSound(
    leaderCard.bohater ? 'zagranieBohateraSound' : 'zagranieKartySound'
  );

  await animateHeroPlayFromHand({
    card: leaderCard,
    from4K: HAND_CENTER_4K,
    to4K,
    onLanded: () => {
      window.arrivedBoardCards.add(leaderKey);
      renderAll();
    }
  });

  const leaderEl = document.getElementById(`slot-placeholder-${leaderKey}`);
  if (leaderEl && leaderCard.bohater) {
    await playHeroCardEffect(leaderEl);
  } else if (leaderEl) {
    await playCardLandWithPower(leaderEl, leaderCard.moc);
  }

  const pending = [];
  for (const num of summonNums) {
    const sc = findCardByNumer(num);
    if (!sc) {
      log(`Brak karty summon ${num}`);
      continue;
    }
    const sRow = rowKeyFromPozycja(sc.pozycja, 'p1');
    boardState[sRow].push(sc.numer);
    const idx = boardState[sRow].length - 1;
    const key = `${sRow}_${idx}`;
    pending.push({ key, card: sc });
  }

  renderAll();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  for (const item of pending) {
    const ph = document.getElementById(`slot-placeholder-${item.key}`);
    let dest = {
      x: rowCoords.self1.x + rowCoords.self1.w / 2 - 90,
      y: rowCoords.self1.y
    };
    if (ph) dest = getElement4KPos(ph);

    playSound(
      item.card.bohater ? 'zagranieBohateraSound' : 'zagranieKartySound'
    );

    await animateHeroPlayFromHand({
      card: item.card,
      from4K: HAND_CENTER_4K,
      to4K: dest,
      onLanded: () => {
        window.arrivedBoardCards.add(item.key);
        renderAll();
      }
    });
  }

  const fxEls = pending
    .map(p => document.getElementById(`slot-placeholder-${p.key}`))
    .filter(Boolean);

  if (fxEls.length) {
    log(`Wezwanie FX × ${fxEls.length}`);
    await playWezwanieOnCards(fxEls);
  }

  log('Sekwencja wezwania zakończona');
}

function pickCerys() {
  return (
    findCardByNumer('503') ||
    cards.find(c => c.nazwa && c.nazwa.toLowerCase() === 'cerys')
  );
}

function pickVampireLeader() {
  const katakan = findCardByNumer('420');
  if (katakan) return katakan;
  const vamps = cards.filter(
    c =>
      c.moc === 'wezwanie' &&
      c.nazwa &&
      /wampir/i.test(c.nazwa) &&
      c.summon
  );
  return vamps.length
    ? vamps[Math.floor(Math.random() * vamps.length)]
    : null;
}

function pickRandomWezwanie() {
  const list = cards.filter(
    c => (c.moc === 'wezwanie' || c.moc === 'wezwarniezza') && c.summon
  );
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

function effectWeather(type) {
  const soundMap = {
    mroz: 'mrozSound',
    mgla: 'mglaSound',
    deszcz: 'deszczSound',
    sztorm: 'sztormSound',
    niebo: 'czystenieboSound'
  };
  playSound(soundMap[type]);

  if (type === 'niebo') {
    boardState.weather = [];
    window.arrivedWeatherCards = new Set();
    log('Czyste Niebo');
  } else {
    const num = WEATHER_CARD_NUM[type] || '003';
    const wStr = `w-${num}`;
    if (!boardState.weather.includes(wStr)) {
      boardState.weather.push(wStr);
      window.arrivedWeatherCards.add(wStr);
    }
    log(`Pogoda: ${type}`);
  }
  renderAll();
}

function effectPower(power) {
  log(`Moc (CSS glow): ${power}`);
  if (power === 'rog' && selectedKey) {
    const rowKey = selectedKey.split('_')[0];
    const rowEl = document.querySelector(`.row-container[data-row="${rowKey}"]`);
    if (rowEl) {
      rowEl.classList.add('ap-horn-glow');
      setTimeout(() => rowEl.classList.remove('ap-horn-glow'), 1600);
    }
  }
  if (power === 'wiez' && selectedKey) {
    const el = document.getElementById(`slot-placeholder-${selectedKey}`);
    if (el) {
      el.classList.add('ap-bond-glow');
      setTimeout(() => el.classList.remove('ap-bond-glow'), 1200);
    }
  }
}

// ---------- Konfiguracja i obsługa dymu kart (Szpieg, Berserk, Manekin...) ----------

const SMOKE_PRESETS = {
  szpieg: {
    color: '#333333',
    brightness: 0.42,
    size: 1.0,
    speed: 1.0,
    rotation: 50,
    count: 6,
    frames: 24,
    hold: 60,
    fade: 60
  },
  berserk: {
    color: '#dc143c', // karmazynowy
    brightness: 0.85,
    size: 1.15,
    speed: 1.15,
    rotation: 65,
    count: 6,
    frames: 24,
    hold: 60,
    fade: 60
  },
  manekin: {
    color: '#c8a268', // drewno/pył
    brightness: 0.9,
    size: 0.95,
    speed: 0.85,
    rotation: 40,
    count: 6,
    frames: 24,
    hold: 60,
    fade: 60
  },
  przetasowanie: {
    color: '#3ba2e8', // mistyczny błękit
    brightness: 0.95,
    size: 1.1,
    speed: 1.25,
    rotation: 75,
    count: 6,
    frames: 24,
    hold: 60,
    fade: 60
  },
  default: {
    color: '#e0e0e0',
    brightness: 0.95,
    size: 1.0,
    speed: 1.0,
    rotation: 50,
    count: 6,
    frames: 24,
    hold: 60,
    fade: 60
  }
};

let currentSmokePreset = 'szpieg';

function getSmokeConfigFromUI() {
  const color = document.getElementById('smoke-color')?.value || '#333333';
  const brightness = parseFloat(document.getElementById('smoke-brightness')?.value || '0.42');
  const size = parseFloat(document.getElementById('smoke-size')?.value || '1.0');
  const speed = parseFloat(document.getElementById('smoke-speed')?.value || '1.0');
  const rotationSpeed = parseFloat(document.getElementById('smoke-rotation')?.value || '50');
  const count = parseInt(document.getElementById('smoke-count')?.value || '6', 10);
  const smokeFrames = parseInt(document.getElementById('smoke-frames')?.value || '24', 10);
  const holdFrames = parseInt(document.getElementById('smoke-hold-frames')?.value || '60', 10);
  const fadeFrames = parseInt(document.getElementById('smoke-fade-frames')?.value || '60', 10);

  return {
    preset: currentSmokePreset,
    color,
    brightness,
    size,
    speed,
    rotationSpeed,
    count,
    smokeFrames,
    holdFrames,
    fadeFrames
  };
}

function updateSmokeUIBadges() {
  const cfg = getSmokeConfigFromUI();
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('smoke-color-val', cfg.color.toUpperCase());
  setEl('smoke-brightness-val', cfg.brightness.toFixed(2));
  setEl('smoke-size-val', `${cfg.size.toFixed(2)}x`);
  setEl('smoke-speed-val', `${cfg.speed.toFixed(2)}x`);
  setEl('smoke-rotation-val', `${cfg.rotationSpeed}°`);
  setEl('smoke-count-val', `${cfg.count}`);
  setEl('smoke-frames-val', `${cfg.smokeFrames} kl`);
  setEl('smoke-hold-val', `${cfg.holdFrames} kl`);
  setEl('smoke-fade-val', `${cfg.fadeFrames} kl`);
}

function applySmokePreset(presetName) {
  const p = SMOKE_PRESETS[presetName] || SMOKE_PRESETS.default;
  currentSmokePreset = presetName;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setVal('smoke-color', p.color);
  setVal('smoke-brightness', p.brightness);
  setVal('smoke-size', p.size);
  setVal('smoke-speed', p.speed);
  setVal('smoke-rotation', p.rotation);
  setVal('smoke-count', p.count);
  setVal('smoke-frames', p.frames);
  setVal('smoke-hold-frames', p.hold);
  setVal('smoke-fade-frames', p.fade);

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === presetName);
  });

  updateSmokeUIBadges();
  log(`Wybrano preset dymu: ${presetName}`);
}

async function playSmokeOnSelectedCard() {
  if (!selectedKey) {
    const firstWrapper = document.querySelector('.board-card-wrapper');
    if (firstWrapper && firstWrapper.dataset.key) {
      selectedKey = firstWrapper.dataset.key;
      renderAll();
    } else {
      log('Brak kart na planszy do odtworzenia dymu');
      return;
    }
  }

  const el = document.getElementById(`slot-placeholder-${selectedKey}`);
  if (!el) {
    log(`Nie znaleziono elementu dla ${selectedKey}`);
    return;
  }

  const cfg = getSmokeConfigFromUI();
  log(`Dym karty (${cfg.preset}, ${cfg.color}): ${selectedKey}`);
  playSound('zagranieKartySound');
  await playCardSmokeEffect(el, cfg);
  log(`Dym karty zakończony`);
}

async function playCardWithSmokeSequence(card, targetRowKey, presetName) {
  if (!card) return;
  if (presetName) {
    applySmokePreset(presetName);
  }
  const cfg = getSmokeConfigFromUI();

  const rowKey = targetRowKey || rowKeyFromPozycja(card.pozycja, 'p1');
  boardState[rowKey].push(card.numer);
  const cardIdx = boardState[rowKey].length - 1;
  const cardKey = `${rowKey}_${cardIdx}`;
  renderAll();

  let placeholder = document.getElementById(`slot-placeholder-${cardKey}`);
  let to4K = {
    x: rowCoords.self1.x + rowCoords.self1.w / 2 - 90,
    y: rowCoords.self1.y
  };
  if (placeholder) to4K = getElement4KPos(placeholder);

  playSound('zagranieKartySound');
  log(`Zagrana karta z ręki: ${card.nazwa || card.numer} (${presetName || 'dym'})`);

  await animateHeroPlayFromHand({
    card,
    from4K: HAND_CENTER_4K,
    to4K,
    onLanded: () => {
      window.arrivedBoardCards.add(cardKey);
      renderAll();
    }
  });

  const cardEl = document.getElementById(`slot-placeholder-${cardKey}`);
  if (cardEl) {
    selectedKey = cardKey;
    renderAll();
    await playCardSmokeEffect(cardEl, cfg);
  }
}

function bindUI() {
  document.getElementById('btn-reset')?.addEventListener('click', resetBoard);
  document.getElementById('btn-clear')?.addEventListener('click', clearBoard);

  document.getElementById('btn-add-random')?.addEventListener('click', () => {
    const u = pickUnits(1)[0];
    if (!u) return;
    boardState.p1R1.push(u.numer);
    rebuildArrived();
    renderAll();
    log(`Dodano ${u.nazwa || u.numer}`);
  });

  document.getElementById('btn-porzoga')?.addEventListener('click', () =>
    effectPorzoga()
  );
  document.getElementById('btn-burn-selected')?.addEventListener('click', () =>
    effectBurnSelected()
  );

  document.getElementById('btn-wezwanie')?.addEventListener('click', () =>
    effectWezwanieSelected()
  );
  document.getElementById('btn-wezwanie-row')?.addEventListener('click', () =>
    effectWezwanieRow()
  );

  document.getElementById('btn-wezwanie-cerys')?.addEventListener('click', () => {
    const c = pickCerys();
    if (!c) {
      log('Brak Cerys w cards.js');
      return;
    }
    runWezwanieSequence(c);
  });
  document.getElementById('btn-wezwanie-wampir')?.addEventListener('click', () => {
    const c = pickVampireLeader();
    if (!c) {
      log('Brak wampira z wezwaniem');
      return;
    }
    runWezwanieSequence(c);
  });
  document.getElementById('btn-wezwanie-random')?.addEventListener('click', () => {
    const c = pickRandomWezwanie();
    if (!c) {
      log('Brak kart z moc=wezwanie');
      return;
    }
    runWezwanieSequence(c);
  });

  document.querySelectorAll('[data-w]').forEach(btn => {
    btn.addEventListener('click', () => effectWeather(btn.dataset.w));
  });
  document.querySelectorAll('[data-power]').forEach(btn => {
    btn.addEventListener('click', () => effectPower(btn.dataset.power));
  });

  // Obsługa dymu kart (Szpieg, Berserk, Manekin, Przetasowanie...)
  const smokeInputIds = [
    'smoke-color', 'smoke-brightness', 'smoke-size', 'smoke-speed',
    'smoke-rotation', 'smoke-count', 'smoke-frames', 'smoke-hold-frames', 'smoke-fade-frames'
  ];
  smokeInputIds.forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      updateSmokeUIBadges();
    });
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applySmokePreset(btn.dataset.preset);
    });
  });

  document.getElementById('btn-play-custom-smoke')?.addEventListener('click', () => {
    playSmokeOnSelectedCard();
  });

  document.getElementById('btn-play-spy-card')?.addEventListener('click', () => {
    const dijkstra = findCardByNumer('119') || cards.find(c => c.moc === 'szpieg');
    if (dijkstra) {
      playCardWithSmokeSequence(dijkstra, 'p2R1', 'szpieg');
    }
  });

  document.getElementById('btn-play-berserk-card')?.addEventListener('click', () => {
    const berserk = findCardByNumer('515') || cards.find(c => c.moc === 'berserk');
    if (berserk) {
      playCardWithSmokeSequence(berserk, 'p1R1', 'berserk');
    }
  });

  document.getElementById('btn-play-dummy-card')?.addEventListener('click', () => {
    const dummy = findCardByNumer('001') || cards.find(c => /manekin/i.test(c.nazwa));
    if (dummy) {
      playCardWithSmokeSequence(dummy, 'p1R1', 'manekin');
    }
  });

  document.getElementById('btn-play-shuffle-card')?.addEventListener('click', () => {
    const shuffleCard = findCardByNumer('118') || cards.find(c => c.moc === 'medyk');
    if (shuffleCard) {
      playCardWithSmokeSequence(shuffleCard, 'p1R2', 'przetasowanie');
    }
  });

  window.addEventListener('resize', () => renderAll());
}

bindUI();
resetBoard();
applySmokePreset('szpieg');
log('Poligon gotowy – FX tylko z anim_effects.js');