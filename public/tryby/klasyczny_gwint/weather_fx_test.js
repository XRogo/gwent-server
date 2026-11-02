import {
  startStorm,
  stopAll,
  restart,
  applySettingsLive,
  forceLightning
} from './weather_fx_anim.js';

const GUI_W = 3840;
const GUI_H = 2160;

export const DEFAULTS = {
  rowX: 1140,
  rowW: 1906,
  rowH: 252,
  rainSelfY: 1400,
  rainOppY: 280,

  // gradient – 2 elipsy od zewnątrz
  stormCol: '#a0b0c8',
  stormEllRX: 110,
  stormEllRY: 95,
  stormEllX: 0,
  stormEllY: 55,
  stormEllOpEdge: 0.28,
  stormEllOpHalf: 0.50,

  // błyski
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

  // kropelki
  kdMax: 12,
  kdRate: 4,
  kdBase: 41,
  kdSmin: 0.7,
  kdSmax: 2.5,
  kdStretch: 2.2,
  kdLife: 0.7,
  kdDy: 55,
  kdDripChance: 0.55
};

const S = { ...DEFAULTS };

const $ = id => document.getElementById(id);
const stage = $('stage');
const stageOuter = $('stage-outer');

function bindControls() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (!(k in S)) return;

    if (el.type === 'color') {
      el.value = S[k];
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
  if (!$('show-guide') || !$('show-guide').checked) return;

  const mk = (y, color) => {
    const d = document.createElement('div');
    d.className = 'area-guide';
    d.style.cssText =
      `left:${S.rowX}px;top:${y}px;width:${S.rowW}px;height:${S.rowH}px;border-color:${color}`;
    g.appendChild(d);
  };

  mk(S.rainSelfY, 'rgba(80,160,255,.55)');
  mk(S.rainOppY, 'rgba(80,160,255,.35)');
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'weather_fx_storm_settings.json';
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

  $('zoom').addEventListener('input', () => {
    setZoom(parseFloat($('zoom').value));
  });

  $('btn-fit').onclick = () => {
    const w = $('stage-wrap');
    setZoom(Math.min(w.clientWidth / GUI_W, w.clientHeight / GUI_H) * 0.95);
  };

  if ($('show-guide')) {
    $('show-guide').onchange = layoutGuides;
  }

  $('btn-storm').onclick = () => {
    startStorm(S);
    setLabel('sztorm');
  };

  $('btn-restart').onclick = () => {
    restart(S);
    setLabel('sztorm (restart)');
  };

  $('btn-stop').onclick = () => {
    stopAll();
    setLabel('— stop —');
  };

  if ($('btn-lightning')) {
    $('btn-lightning').onclick = () => forceLightning();
  }

  $('btn-export').onclick = exportJSON;
  $('btn-import').onclick = () => $('file-import').click();
  $('file-import').onchange = e => {
    const f = e.target.files && e.target.files[0];
    if (f) importJSON(f);
  };
}

init();