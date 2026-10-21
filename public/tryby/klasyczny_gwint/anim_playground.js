/**
 * anim_playground.js – plansza testowa + UI.
 * Efekty w anim_effects.js
 */
import cards from './cards.js';
import { getCardImage } from './cardImages.js';
import { getElement4KPos } from './animacje.js';
import {
  runPorzogaOnCardElement,
  playHeroCardEffect,
  animateHeroPlayFromHand,
  playWezwanieOnCards,
  playCardLandDustOnElement,
  playPowerIconOnElement,
  playCardLandWithPower,
  powerHasIconAnim,
  HERO_EMBER_CFG,
  LAND_CFG,
  POWER_ICON_CFG
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
  p1R1: [],
  p1R2: [],
  p1R3: [],
  p2R1: [],
  p2R2: [],
  p2R3: [],
  p1S1: null,
  p1S2: null,
  p1S3: null,
  p2S1: null,
  p2S2: null,
  p2S3: null,
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

function pickHero() {
  const heroes = cards.filter(c => c.bohater);
  if (!heroes.length) return null;
  return heroes[Math.floor(Math.random() * heroes.length)];
}

function findCardByNumer(numer) {
  return cards.find(c => String(c.numer) === String(numer));
}

function rowKeyFromPozycja(pos, side = 'p1') {
  const p = Number(pos) || 1;
  if (side === 'p1') {
    if (p === 2) return 'p1R2';
    if (p === 3) return 'p1R3';
    if (p === 4) return Math.random() < 0.5 ? 'p1R1' : 'p1R2';
    return 'p1R1';
  }
  if (p === 2) return 'p2R2';
  if (p === 3) return 'p2R3';
  if (p === 4) return Math.random() < 0.5 ? 'p2R1' : 'p2R2';
  return 'p2R1';
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
    p1S1: null,
    p1S2: null,
    p1S3: null,
    p2S1: null,
    p2S2: null,
    p2S3: null,
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

// ---------- handlery UI ----------

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
  log('Karta spalona + lot na trupy');
}

async function effectHeroFromHand() {
  const hero = pickHero();
  if (!hero) {
    log('Brak kart bohatera w cards.js');
    return;
  }

  const rowKey = rowKeyFromPozycja(hero.pozycja, 'p1');
  log(`Bohater z ręki → ${rowKey}: ${hero.nazwa || hero.numer}`);

  boardState[rowKey].push(hero.numer);
  const newIndex = boardState[rowKey].length - 1;
  const cardKey = `${rowKey}_${newIndex}`;
  renderAll();

  const placeholder = document.getElementById(`slot-placeholder-${cardKey}`);
  let to4K = {
    x: rowCoords.self1.x + rowCoords.self1.w / 2 - 90,
    y: rowCoords.self1.y
  };
  if (placeholder) to4K = getElement4KPos(placeholder);

  await animateHeroPlayFromHand({
    card: hero,
    from4K: HAND_CENTER_4K,
    to4K,
    onLanded: () => {
      window.arrivedBoardCards.add(cardKey);
      renderAll();
    }
  });

  const el = document.getElementById(`slot-placeholder-${cardKey}`);
  if (el) await playHeroCardEffect(el);

  log('Bohater: lot z ręki + FX OK');
}

/**
 * Pełne wezwanie: lider (lot + FX bohatera) → przyzwane (lot + dźwięk) → FX wezwania
 */
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

  // 1) lider
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

  log(`Zagrano: ${leaderCard.nazwa || leaderCard.numer}`);

  // 2) przyzwane – wlot + dźwięk
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
    pending.push({ key, card: sc, row: sRow });
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
    log(`Wlot przyzwanej: ${item.card.nazwa || item.card.numer}`);

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
  if (!vamps.length) return null;
  return vamps[Math.floor(Math.random() * vamps.length)];
}

function pickRandomWezwanie() {
  const list = cards.filter(
    c => (c.moc === 'wezwanie' || c.moc === 'wezwarniezza') && c.summon
  );
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
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

/** Tylko kurz lądowania na zaznaczonej */
async function effectLandDustSelected() {
  if (!selectedKey) {
    log('Zaznacz kartę na planszy');
    return;
  }
  const el = document.getElementById(`slot-placeholder-${selectedKey}`);
  if (!el) {
    log('Brak elementu karty');
    return;
  }
  log(`Lądowanie FX: ${selectedKey}`);
  await playCardLandDustOnElement(el);
  log('Lądowanie FX OK');
}

/** Lot zwykłej jednostki + kurz (bez mocy / cicha) */
async function effectLandPlayUnit() {
  const quiet = cards.filter(
    c =>
      typeof c.punkty === 'number' &&
      !c.bohater &&
      (!c.moc || !powerHasIconAnim(c.moc))
  );
  const card = quiet.length
    ? quiet[Math.floor(Math.random() * quiet.length)]
    : pickUnits(1)[0];

  if (!card) {
    log('Brak jednostki');
    return;
  }

  const rowKey = rowKeyFromPozycja(card.pozycja, 'p1');
  log(`Zagranie + kurz: ${card.nazwa || card.numer} → ${rowKey}`);

  boardState[rowKey].push(card.numer);
  const newIndex = boardState[rowKey].length - 1;
  const cardKey = `${rowKey}_${newIndex}`;
  renderAll();

  const placeholder = document.getElementById(`slot-placeholder-${cardKey}`);
  let to4K = {
    x: rowCoords.self1.x + rowCoords.self1.w / 2 - 90,
    y: rowCoords.self1.y
  };
  if (placeholder) to4K = getElement4KPos(placeholder);

  playSound('zagranieKartySound');

  await animateHeroPlayFromHand({
    card,
    from4K: HAND_CENTER_4K,
    to4K,
    onLanded: () => {
      window.arrivedBoardCards.add(cardKey);
      renderAll();
    }
  });

  const el = document.getElementById(`slot-placeholder-${cardKey}`);
  if (el) await playCardLandDustOnElement(el);

  log('Zagranie + kurz OK');
}

/** Ikona mocy (opcjonalnie + kurz) na zaznaczonej */
async function effectPowerIcon(moc, withLand = true) {
  if (!selectedKey) {
    log('Zaznacz kartę');
    return;
  }
  const el = document.getElementById(`slot-placeholder-${selectedKey}`);
  if (!el) return;
  log(`Ikona mocy: ${moc}${withLand ? ' + kurz' : ''}`);
  if (withLand) {
    await playCardLandWithPower(el, moc);
  } else {
    await playPowerIconOnElement(el, moc);
  }
  log('Ikona mocy OK');
}

/** Kurz + moc z danych zaznaczonej karty */
async function effectLandPowerFromCard() {
  if (!selectedKey) {
    log('Zaznacz kartę');
    return;
  }
  const el = document.getElementById(`slot-placeholder-${selectedKey}`);
  const numer = el?.dataset?.numer;
  const card = findCardByNumer(numer);
  const moc = card?.moc || null;
  log(`Kurz + moc z karty: ${moc || '(brak / cicha)'}`);
  await playCardLandWithPower(el, moc);
}

/** Zagrać kartę z mocą z listy (lot + kurz + ikona) */
async function effectPlayWithPower(moc) {
  const list = cards.filter(
    c => c.moc === moc && typeof c.punkty === 'number' && !c.bohater
  );
  const card = list.length
    ? list[Math.floor(Math.random() * list.length)]
    : null;
  if (!card) {
    log(`Brak karty z moc=${moc}`);
    return;
  }

  const rowKey = rowKeyFromPozycja(card.pozycja, 'p1');
  log(`Zagranie z mocą ${moc}: ${card.nazwa || card.numer}`);

  boardState[rowKey].push(card.numer);
  const newIndex = boardState[rowKey].length - 1;
  const cardKey = `${rowKey}_${newIndex}`;
  renderAll();

  const placeholder = document.getElementById(`slot-placeholder-${cardKey}`);
  let to4K = {
    x: rowCoords.self1.x + rowCoords.self1.w / 2 - 90,
    y: rowCoords.self1.y
  };
  if (placeholder) to4K = getElement4KPos(placeholder);

  playSound('zagranieKartySound');

  await animateHeroPlayFromHand({
    card,
    from4K: HAND_CENTER_4K,
    to4K,
    onLanded: () => {
      window.arrivedBoardCards.add(cardKey);
      renderAll();
    }
  });

  const el = document.getElementById(`slot-placeholder-${cardKey}`);
  if (el) await playCardLandWithPower(el, moc);

  log(`Zagranie ${moc} OK`);
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

  document.getElementById('btn-hero')?.addEventListener('click', () =>
    effectHeroFromHand()
  );

  // Wezwanie – pełne sekwencje
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

  // Lądowanie
  document.getElementById('btn-land-dust')?.addEventListener('click', () =>
    effectLandDustSelected()
  );
  document.getElementById('btn-land-play')?.addEventListener('click', () =>
    effectLandPlayUnit()
  );
  document.getElementById('btn-land-power')?.addEventListener('click', () =>
    effectLandPowerFromCard()
  );

  // Ikony mocy (na zaznaczonej + kurz)
  document.querySelectorAll('[data-power-icon]').forEach(btn => {
    btn.addEventListener('click', () =>
      effectPowerIcon(btn.dataset.powerIcon, true)
    );
  });

  // Zagranie karty z konkretną mocą
  document.querySelectorAll('[data-play-power]').forEach(btn => {
    btn.addEventListener('click', () =>
      effectPlayWithPower(btn.dataset.playPower)
    );
  });

  document.querySelectorAll('[data-w]').forEach(btn => {
    btn.addEventListener('click', () => effectWeather(btn.dataset.w));
  });
  document.querySelectorAll('[data-power]').forEach(btn => {
    btn.addEventListener('click', () => effectPower(btn.dataset.power));
  });

  document.getElementById('btn-to-grave')?.addEventListener('click', () =>
    effectBurnSelected()
  );

  window.addEventListener('resize', () => renderAll());
}

bindUI();
resetBoard();
log('Poligon gotowy (effects w anim_effects.js)');
log(
  `Tune: ember dens=${HERO_EMBER_CFG?.density ?? '?'} | land size=${LAND_CFG?.dymekSize ?? '?'} | power base=${POWER_ICON_CFG?.baseSize ?? '?'}`
);