(function () {
    const DESIGN_W = 730;
    const DESIGN_H = 1080;

    function detectLang() {
        const stored = localStorage.getItem('lang');
        if (stored) return stored;
        const nav = (navigator.language || 'en').toLowerCase().slice(0, 2);
        if (nav === 'pl') return 'pl';
        if (['ru', 'uk', 'be', 'bg', 'sr'].includes(nav)) return 'ru';
        return 'en';
    }

    function setLogo(lang) {
        const img = document.getElementById('gwentLogo');
        if (!img) return;
        const map = {
            pl: 'asset/gwint_pl.webp',
            ru: 'asset/gwint_ru.webp',
            en: 'asset/gwint_en.webp'
        };
        img.src = map[lang] || map.en;
    }

    async function loadLocale(lang) {
        const urls = lang === 'pl'
            ? ['locales/pl2.json']
            : [`locales/${lang}2.json`, 'locales/pl2.json'];
        for (const url of urls) {
            try {
                const res = await fetch(url);
                if (res.ok) return await res.json();
            } catch (_) {}
        }
        return null;
    }

    function applyLocale(dict) {
        if (!dict) return;
        const play = document.getElementById('btnPlay');
        const settings = document.getElementById('btnSettings');
        const info = document.getElementById('btnInfo');
        if (play && dict.bplay) play.textContent = dict.bplay;
        if (settings && dict.bsetings) settings.textContent = dict.bsetings;
        if (info && dict.binfo) info.textContent = dict.binfo;
    }

/**
 * 1) Skala jak dotąd: mieści się w oknie (min szerokość / wysokość).
 * 2) Jeśli po skali kontener nie sięga dołu okna →
 *    zwiększamy wysokość kontenera (w px designu), żeby po scale
 *    dolna krawędź = dół viewportu. Szerokość zostaje 768.
 */
function fitContainerToScreen() {
    const el = document.getElementById('mainContainer');
    if (!el) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // skala proporcjonalna – nic nie „ściskamy” osobno w osi Y
    const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);

    // po skali: czy dolna krawędź sięga dołu okna?
    const scaledH = DESIGN_H * scale;

    let designH = DESIGN_H;
    if (scaledH < vh - 0.5) {
        // brakuje (vh - scaledH) px na ekranie → w designie to / scale
        designH = vh / scale;
    }

    el.style.width = DESIGN_W + 'px';
    el.style.height = designH + 'px';
    el.style.transform = 'scale(' + scale + ')';
}

    /* ----- changelog (schemat jak wcześniej) ----- */
    function getLatestLobbyEntry(list) {
        if (!Array.isArray(list)) return null;
        for (const e of list) {
            if (e && e.version0 != null && String(e.version0) !== '') return e;
        }
        return null;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatScope(entry) {
        const parts = [];
        if (entry.version0 != null && entry.version0 !== '') {
            parts.push('Lobby v' + entry.version0);
        }
        if (entry.version1 != null && entry.version1 !== '') {
            parts.push('Gwint klasyczny v' + entry.version1);
        }
        if (entry.version != null && entry.version !== '' && !entry.version0 && !entry.version1) {
            parts.push('v' + entry.version);
        }
        return parts.length ? parts.join(' · ') : 'Aktualizacja';
    }

    function formatChangeLine(value) {
        if (value == null) return '';
        if (typeof value === 'string') {
            return '<li>' + escapeHtml(value) + '</li>';
        }
        if (typeof value === 'object') {
            let html = '';
            if (value.title) {
                html += '<li><span class="changelog-line-title">' + escapeHtml(value.title) + '</span>';
            }
            const subs = Object.keys(value)
                .filter(k => k.startsWith('subtitle'))
                .sort((a, b) => {
                    const na = parseInt(a.replace('subtitle', ''), 10) || 0;
                    const nb = parseInt(b.replace('subtitle', ''), 10) || 0;
                    return na - nb;
                });
            if (subs.length) {
                html += '<ul class="sub-list">';
                subs.forEach(k => {
                    html += '<li class="sub">' + escapeHtml(value[k]) + '</li>';
                });
                html += '</ul>';
            }
            if (value.title) html += '</li>';
            return html;
        }
        return '';
    }

    function renderChangelog(list) {
        const body = document.getElementById('changelogBody');
        if (!body) return;
        if (!Array.isArray(list) || !list.length) {
            body.innerHTML = '<p>Brak wpisów.</p>';
            return;
        }

        body.innerHTML = list.map((entry, index) => {
            const date = entry.data || '—';
            const scope = formatScope(entry);

            let linesHtml = '';
            if (entry.zmiany && typeof entry.zmiany === 'object') {
                const keys = Object.keys(entry.zmiany).sort((a, b) => {
                    const na = parseInt(a.replace('line', ''), 10) || 0;
                    const nb = parseInt(b.replace('line', ''), 10) || 0;
                    return na - nb;
                });
                linesHtml =
                    '<ul class="changelog-list">' +
                    keys.map(k => formatChangeLine(entry.zmiany[k])).join('') +
                    '</ul>';
            }

            let imgBlock = '';
            if (entry.image) {
                imgBlock =
                    '<button type="button" class="changelog-img-trigger" data-img="' +
                    escapeHtml(entry.image) +
                    '" data-slot="img-slot-' + index + '">Pokaż obraz</button>' +
                    '<div class="changelog-img-slot" id="img-slot-' + index + '"></div>';
            }

            return (
                '<article class="changelog-entry">' +
                '<div class="changelog-date">' + escapeHtml(date) + '</div>' +
                '<div class="changelog-scope">' + escapeHtml(scope) + '</div>' +
                linesHtml +
                imgBlock +
                '</article>'
            );
        }).join('');

        body.querySelectorAll('.changelog-img-trigger').forEach(btn => {
            btn.addEventListener('click', function () {
                const url = this.getAttribute('data-img');
                const slotId = this.getAttribute('data-slot');
                const slot = document.getElementById(slotId);
                if (!slot || !url) return;
                if (slot.querySelector('img')) {
                    const img = slot.querySelector('img');
                    const hidden = img.style.display === 'none';
                    img.style.display = hidden ? 'block' : 'none';
                    this.textContent = hidden ? 'Ukryj obraz' : 'Pokaż obraz';
                    return;
                }
                const img = document.createElement('img');
                img.className = 'changelog-img';
                img.alt = '';
                img.src = url;
                slot.appendChild(img);
                this.textContent = 'Ukryj obraz';
            });
        });
    }

    function openChangelog() {
        const modal = document.getElementById('changelogModal');
        if (modal) modal.hidden = false;
    }

    function closeChangelog() {
        const modal = document.getElementById('changelogModal');
        if (modal) modal.hidden = true;
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const lang = detectLang();
        setLogo(lang);
        applyLocale(await loadLocale(lang));

        fitContainerToScreen();
        window.addEventListener('resize', fitContainerToScreen);

        const logo = document.getElementById('gwentLogo');
        if (logo) {
            if (logo.complete) fitContainerToScreen();
            else logo.addEventListener('load', fitContainerToScreen);
        }

        /* wersja + changelog z window.wersja (changelog.js) */
        const list = window.wersja;
        const latest = getLatestLobbyEntry(list);
        const dateEl = document.getElementById('versionDate');
        const numEl = document.getElementById('versionNum');
        if (latest) {
            dateEl.textContent = latest.data || '—';
            numEl.textContent = 'v' + latest.version0;
        } else {
            dateEl.textContent = '—';
            numEl.textContent = '';
        }
        renderChangelog(list);

        document.getElementById('versionBadge')?.addEventListener('click', openChangelog);
        document.getElementById('changelogClose')?.addEventListener('click', closeChangelog);
        document.getElementById('changelogModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'changelogModal') closeChangelog();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeChangelog();
        });

        /* przyciski / ikony – na razie puste */
        ['btnPlay', 'btnSettings', 'btnInfo',
         'iconDiscord', 'iconFix', 'iconBug', 'iconLang'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => {});
        });
    });
})();