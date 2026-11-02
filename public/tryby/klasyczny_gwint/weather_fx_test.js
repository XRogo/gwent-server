import {
  startRain, stopAll, restart,
  applySettingsLive
} from './weather_fx_anim.js';

const GUI_W = 3840, GUI_H = 2160;

export const DEFAULTS = {
  rowX: 1138,
  rowW: 1906,
  rowH: 239,
  rainSelfY: 1407,
  rainOppY: 29,

  rainSpeed: 280,
  rainSizeX: 2536,
  rainSizeY: 1200,
  rainOverlap: 63,
  rainOp: 0.85,
  rainMarginTop: 20,
  rainMarginBot: 20,

  rainBubbleCount: 100,
  rbSX: 52,
  rbSY: 29,
  rbYOff: -9,
  rbOp: 0.35,
  rbLife: 0.35,
  rbRise: 9,

  // nowe – powiększanie + zanikanie
  rbScaleStart: 0.55,
  rbScaleEnd: 1.35,
  rbFadeSpeed: 1.4
};

const S = { ...DEFAULTS };

const $ = id => document.getElementById(id);
const stage = $('stage');
const stageOuter = $('stage-outer');

function bindControls() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (!(k in S)) return;

    el.value = S[k];

    const sync = () => {
      const v = parseFloat(el.value);
      if (!Number.isFinite(v)) return;
      S[k] = v;
      document.querySelectorAll(`[data-k="${k}"]`).forEach(o => {
        if (o !== el) o.value = v;
      });
      const row = el.closest('.row');
      const val = row && row.querySelector('.val');
      if (val) {
        val.textContent = (Math.abs(v) < 10 && v % 1 !== 0)
          ? v.toFixed(2)
          : String(Math.round(v * 100) / 100);
      }
      applySettingsLive(S);
      layoutGuides();
    };

    el.addEventListener('input', sync);
    sync();
  });
}

function setZoom(z) {
  z = Math.max(0.08, +z || 0.40);
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
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'weather_fx_rain_settings.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      Object.assign(S, data);
      bindControls();
      layoutGuides();
      applySettingsLive(S);
    } catch (err) {
      alert('Błąd JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function setLabel(t) {
  $('mode-label').textContent = t;
}

function init() {
  bindControls();
  setZoom(0.40);
  layoutGuides();
  applySettingsLive(S);

  $('zoom').addEventListener('input', () => setZoom(parseFloat($('zoom').value)));
  $('btn-fit').onclick = () => {
    const w = $('stage-wrap');
    setZoom(Math.min(w.clientWidth / GUI_W, w.clientHeight / GUI_H) * 0.95);
  };
  $('show-guide').onchange = layoutGuides;

  $('btn-rain').onclick = () => {
    startRain(S);
    setLabel('deszcz');
  };
  $('btn-restart').onclick = () => {
    restart(S);
    setLabel('deszcz (restart)');
  };
  $('btn-stop').onclick = () => {
    stopAll();
    setLabel('— stop —');
  };

  $('btn-export').onclick = exportJSON;
  $('btn-import').onclick = () => $('file-import').click();
  $('file-import').onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (f) importJSON(f);
  };
}

init();