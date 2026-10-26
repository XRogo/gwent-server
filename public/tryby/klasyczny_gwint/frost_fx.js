// Trzaskający Mróz – FX. Czas w klatkach @60fps liczonych od chwili, gdy karta doleci.
const MS = 1000 / 60;
const OPP_DY = 565 - 863; // przesunięcie rzędu 1 przeciwnika względem rzędu 1 gracza

// [od klatki, do klatki] – krycie rośnie liniowo 0 → max
const T = {
  white: [0, 5],    // biały gradient
  snow:  [0, 5],    // snow4 / snow5
  ice:   [0, 30],   // icespike
  frost: [5, 120],  // snow1 / snow2
  blue:  [10, 75]   // niebieski gradient
};
const MAXOP = { frost: 0.5 }; // mróz domyślnie -50% krycia
// kolejność warstw od dołu (jak w oryginalnym JSON). Zamień miejscami 'ice' i 'white'/'blue', jeśli chcesz sople nad gradientem
const ORDER = ['frost', 'ice', 'white', 'blue', 'snow'];
const END_FRAME = 120;

const SRC = n => n === 'icespike'
  ? 'assets/asety/effekty/icespike.webp'
  : `assets/asety/effekty/snow/${n}.webp`;

let data = null;
let frost = null; // { root, inner, groups }

const dataReady = fetch('assets/asety/effekty/pozycja_mroz.json')
  .then(r => r.json()).then(d => (data = d)).catch(e => console.error('[FROST]', e));

const div = css => { const d = document.createElement('div'); d.style.cssText = css; return d; };
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function addImgs(parent, name, list, ox = 0, oy = 0) {
  const [w, h] = data.assets[name === 'ice' ? 'icespike' : name];
  const src = SRC(name === 'ice' ? 'icespike' : name);
  list.forEach(([x, y, s = 1, r = 0, f = 0]) => {
    const im = new Image();
    im.src = src;
    im.draggable = false;
    im.style.cssText = `position:absolute;left:${x - w / 2 - ox}px;top:${y - h / 2 - oy}px;` +
      `width:${w}px;height:${h}px;transform:scale(${f ? -s : s},${s}) rotate(${r}deg)`;
    parent.appendChild(im);
  });
}

function buildSide(dy, groups) {
  const c = data.clip;
  const bx = c.x - c.w / 2, by = c.y - c.h / 2;
  const side = div(`position:absolute;left:0;top:0;width:3840px;height:2160px;transform:translateY(${dy}px)`);
  const box = () => div(`position:absolute;left:${bx}px;top:${by}px;width:${c.w}px;height:${c.h}px`);
  const full = () => div('position:absolute;inset:0');

  ORDER.forEach(key => {
    let g;
    if (key === 'frost') {            // mróz ucięty do obszaru gradientu
      g = box(); g.style.overflow = 'hidden';
      Object.entries(data.frost).forEach(([n, l]) => addImgs(g, n, l, bx, by));
    } else if (key === 'ice') {
      g = full(); addImgs(g, 'ice', data.ice);
    } else if (key === 'snow') {
      g = full(); Object.entries(data.snow).forEach(([n, l]) => addImgs(g, n, l));
    } else {                          // white / blue
      const q = data.gradients[key];
      g = box();
      g.style.background = `linear-gradient(to top, ${rgba(q.c, q.a)} ${q.from}%, ${rgba(q.c, q.b)} ${q.to}%)`;
    }
    g.style.opacity = 0;
    side.appendChild(g);
    groups.push({ el: g, key });
  });
  return side;
}

function layout() {
  if (!frost || !frost.root) return;
  const s = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
  const r = frost.root.style;
  r.left = `${(window.innerWidth - 3840 * s) / 2}px`;
  r.top = `${(window.innerHeight - 2160 * s) / 2}px`;
  r.width = `${3840 * s}px`;
  r.height = `${2160 * s}px`;
  frost.inner.style.transform = `scale(${s})`;
}

function applyFrame(f) {
  frost.groups.forEach(({ el, key }) => {
    const [a, b] = T[key];
    const p = Math.max(0, Math.min(1, (f - a) / (b - a)));
    el.style.opacity = String(p * (MAXOP[key] ?? 1));
  });
}

async function start(instant) {
  const mine = (frost = { root: null, inner: null, groups: [] }); // blokada przed podwójnym startem
  await dataReady;
  const overlay = document.querySelector('#gameScreen .overlay');
  if (!data || !overlay || frost !== mine) return;

  const groups = [];
  const root = div('position:absolute;pointer-events:none;z-index:30');
  root.className = 'persistent';
  root.id = 'frost-fx';
  const inner = div('position:absolute;left:0;top:0;width:3840px;height:2160px;transform-origin:0 0');
  inner.appendChild(buildSide(0, groups));       // strona gracza
  inner.appendChild(buildSide(OPP_DY, groups));  // strona przeciwnika (ten sam układ)
  root.appendChild(inner);
  overlay.appendChild(root);
  Object.assign(mine, { root, inner, groups });
  layout();

  if (instant) { applyFrame(END_FRAME); return; }
  applyFrame(0);
  const t0 = performance.now();
  const tick = now => {
    if (frost !== mine) return;
    const f = (now - t0) / MS;
    applyFrame(f);
    if (f < END_FRAME) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Animacja po doleceniu karty Mrozu (wołaj po dźwięku). */
export function playFrostFx() {
  if (frost) return Promise.resolve();
  return start(false);
}

/** Wołane z renderWeather: active = czy mróz jest na planszy (i dotarł). */
export function syncFrostFx(active) {
  if (active) {
    if (!frost) start(true); // np. F5 / wznowienie – od razu pełny efekt
    else layout();
  } else if (frost) {
    const f = frost;
    frost = null;
    if (f.root) {
      f.root.style.transition = 'opacity .4s';
      f.root.style.opacity = '0';
      setTimeout(() => f.root.remove(), 450);
    }
  }
}