import {
  startRain, startFog, startStorm, stopAll, restart,
  forceLightning, setLightningPoints, getLightningPoints,
  applySettingsLive
} from './weather_fx_anim.js';

const GUI_W = 3840, GUI_H = 2160;

/** Pozycje rzędów z game_board.js rowCoords */
export const DEFAULTS = {
  rowX: 1412,
  rowW: 1609,
  rowH: 239,
  // deszcz = oblężenie (R3)
  rainSelfY: 1407,
  rainOppY: 29,
  // mgła = dystans (R2)
  fogSelfY: 1129,
  fogOppY: 294,

  rainCount: 90,
  rainLayers: 4,
  rainCycle: 0.45,
  dropH: 23,
  dropW: 3.3,
  dropOp: 0.61,
  dropBri: 0.61,
  dropYEnd: 41,

  splashChance: 0.35,
  splashSize: 28,
  splashSX: 1.4,
  splashSY: 0.6,

  rainFogCount: 8,
  rainFogSmin: 120,
  rainFogSmax: 280,

  rgC0: '#4a7ab0',
  rgC1: '#2a4a70',
  rgCE: '#a8d0ff',
  rgSide: 0.35,
  rgMid: 0.08,
  rgPeak: 12,
  rgH: 55,
  rgEdge: 0.2,

  fgC: '#c8c8d0',
  fgBot: 0.48,
  fgEH: 150,
  fgEW: 160,
  fogCount: 14,
  fogSmin: 200,
  fogSmax: 500,
  fogOpMin: 0.2,
  fogOpMax: 0.65,
  fogSpd: 35,
  fogSpin: 18,

  glowT: 4.6,
  glowC: 0.51,
  glowM: 0.44,
  glowCol: '#3a6aaa',

  kdMax: 12,
  kdRate: 4,
  kdBase: 41,
  kdSmin: 0.7,
  kdSmax: 2.5,
  kdStretch: 2.2,
  kdLife: 0.7,
  kdDy: 55,

  ltD1: 0.15,
  ltD2: 0.16,
  ltGap: 1.3,
  ltCycle: 2.8,
  ltFlash: 0.3,
  ltFop: 0.6,
  ltW: 37,

  // względne 0–1 w obszarze deszczu self: {x, y}
  lightning: {
    g1: [{ x: 0.18, y: 0.12 }, { x: 0.28, y: 0.18 }],
    g2: [{ x: 0.68, y: 0.14 }, { x: 0.78, y: 0.20 }]
  }
};

const S = { ...DEFAULTS, lightning: {
  g1: DEFAULTS.lightning.g1.map(p => ({ ...p })),
  g2: DEFAULTS.lightning.g2.map(p => ({ ...p }))
}};

const $ = id => document.getElementById(id);
const stage = $('stage');
const stageOuter = $('stage-outer');

function hexOr(v, fb) { return typeof v === 'string' && v.startsWith('#') ? v : fb; }

function bindControls() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (!(k in S)) return;
    if (el.type === 'color') {
      el.value = hexOr(S[k], '#888888');
      el.addEventListener('input', () => {
        S[k] = el.value;
        applySettingsLive(S);
      });
      return;
    }
    el.value = S[k];
    const sync = () => {
      const v = parseFloat(el.value);
      if (!Number.isFinite(v)) return;
      S[k] = v;
      document.querySelectorAll(`[data-k="${k}"]`).forEach(o => { if (o !== el) o.value = v; });
      const row = el.closest('.row');
      const val = row && row.querySelector('.val');
      if (val) val.textContent = (Math.abs(v) < 10 && v % 1) ? v.toFixed(2) : String(v);
      applySettingsLive(S);
      layoutGuides();
      renderLtMarkers();
    };
    el.addEventListener('input', sync);
    sync();
  });
}

function setZoom(z) {
  z = Math.max(0.08, +z || 0.42);
  $('zoom').value = z;
  $('zoom-v').textContent = z.toFixed(2);
  stage.style.transform = `scale(${z})`;
  stageOuter.style.width = `${GUI_W * z}px`;
  stageOuter.style.height = `${GUI_H * z}px`;
}

function layoutGuides() {
  const g = $('guides');
  g.innerHTML = '';
  if (!$('show-guide').checked) return;
  const mk = (y, color) => {
    const d = document.createElement('div');
    d.className = 'area-guide';
    d.style.cssText = `left:${S.rowX}px;top:${y}px;width:${S.rowW}px;height:${S.rowH}px;border-color:${color}`;
    g.appendChild(d);
  };
  mk(S.rainSelfY, 'rgba(80,160,255,.55)');
  mk(S.rainOppY, 'rgba(80,160,255,.35)');
  mk(S.fogSelfY, 'rgba(200,200,220,.5)');
  mk(S.fogOppY, 'rgba(200,200,220,.3)');
}

function renderLtMarkers() {
  const box = $('lt-markers');
  box.innerHTML = '';
  const ax = S.rowX, ay = S.rainSelfY, aw = S.rowW, ah = S.rowH;
  const list = $('lt-list');
  let txt = '';
  ['g1', 'g2'].forEach(g => {
    (S.lightning[g] || []).forEach((p, i) => {
      const m = document.createElement('div');
      m.className = 'lt-marker' + (g === 'g2' ? ' g2' : '');
      m.style.left = (ax + p.x * aw) + 'px';
      m.style.top = (ay + p.y * ah) + 'px';
      m.textContent = g === 'g1' ? `1.${i + 1}` : `2.${i + 1}`;
      box.appendChild(m);
      txt += `${g}[${i}] x=${p.x.toFixed(3)} y=${p.y.toFixed(3)}\n`;
    });
  });
  list.textContent = txt || '(brak punktów – kliknij obszar deszczu self)';
  setLightningPoints(S.lightning);
}

function setupLightningEdit() {
  stage.addEventListener('click', e => {
    if (!stage.classList.contains('lt-edit')) return;
    const z = parseFloat($('zoom').value) || 0.42;
    const rect = stage.getBoundingClientRect();
    // coords in 4K space
    const x = (e.clientX - rect.left) / z;
    const y = (e.clientY - rect.top) / z;
    const ax = S.rowX, ay = S.rainSelfY, aw = S.rowW, ah = S.rowH;
    if (x < ax || x > ax + aw || y < ay || y > ay + ah) return;
    const nx = (x - ax) / aw;
    const ny = (y - ay) / ah;
    const g = $('lt-group').value === '2' ? 'g2' : 'g1';
    if (!S.lightning[g]) S.lightning[g] = [];
    if (S.lightning[g].length >= 2) S.lightning[g].shift();
    S.lightning[g].push({ x: nx, y: ny });
    renderLtMarkers();
  });

  // włącz tryb edycji gdy sekcja piorunów / zawsze crosshair na stage przy Alt
  stage.classList.add('lt-edit');
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
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
      const data = JSON.parse(reader.result);
      Object.assign(S, data);
      if (data.lightning) S.lightning = data.lightning;
      bindControls();
      layoutGuides();
      renderLtMarkers();
      applySettingsLive(S);
    } catch (err) {
      alert('Błąd JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function setLabel(t) { $('mode-label').textContent = t; }

function init() {
  bindControls();
  setZoom(0.42);
  layoutGuides();
  renderLtMarkers();
  setupLightningEdit();
  applySettingsLive(S);

  $('zoom').addEventListener('input', () => setZoom(parseFloat($('zoom').value)));
  $('btn-fit').onclick = () => {
    const w = $('stage-wrap');
    setZoom(Math.min(w.clientWidth / GUI_W, w.clientHeight / GUI_H) * 0.95);
  };
  $('show-guide').onchange = layoutGuides;

  $('btn-rain').onclick = () => { startRain(S); setLabel('deszcz'); };
  $('btn-fog').onclick = () => { startFog(S); setLabel('mgła'); };
  $('btn-storm').onclick = () => { startStorm(S); setLabel('sztorm'); };
  $('btn-restart').onclick = () => { restart(S); setLabel('restart'); };
  $('btn-stop').onclick = () => { stopAll(); setLabel('— stop —'); };
  $('btn-lightning').onclick = () => forceLightning(S);

  $('btn-lt-clear').onclick = () => {
    const g = $('lt-group').value === '2' ? 'g2' : 'g1';
    S.lightning[g] = [];
    renderLtMarkers();
  };
  $('btn-lt-clear-all').onclick = () => {
    S.lightning = { g1: [], g2: [] };
    renderLtMarkers();
  };

  $('btn-export').onclick = exportJSON;
  $('btn-import').onclick = () => $('file-import').click();
  $('file-import').onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (f) importJSON(f);
  };
}

init();