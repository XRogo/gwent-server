(function () {
    const DESIGN_W = 640;
    const DESIGN_H = 1080;
    const CYRILLIC = new Set(['ru', 'uk', 'be', 'bg', 'sr']);

    function detectLang() {
        const stored = localStorage.getItem('lang');
        if (stored) return stored;
        const nav = (navigator.language || 'en').toLowerCase().slice(0, 2);
        if (nav === 'pl') return 'pl';
        if (CYRILLIC.has(nav)) return 'ru';
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

    /** Skala panelu: mieści się w 30vw i w 100vh */
    function updatePanelScale() {
        const panel = document.getElementById('sidePanel');
        if (!panel) return;
        const stageW = window.innerWidth * 0.30; // 100% − 35% − 35%
        const stageH = window.innerHeight;
        const scale = Math.min(stageW / DESIGN_W, stageH / DESIGN_H);
        panel.style.transform = 'scale(' + scale + ')';
    }

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

    /** scope: czego dotyczy update (version0 / version1 / version) */
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

            // Obraz NIE w src – dopiero po kliknięciu
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

        // Lazy-load obrazów po kliknięciu
        body.querySelectorAll('.changelog-img-trigger').forEach(btn => {
            btn.addEventListener('click', function () {
                const url = this.getAttribute('data-img');
                const slotId = this.getAttribute('data-slot');
                const slot = document.getElementById(slotId);
                if (!slot || !url) return;
                if (slot.querySelector('img')) {
                    // już załadowany – przełącz widoczność
                    const img = slot.querySelector('img');
                    const hidden = img.style.display === 'none';
                    img.style.display = hidden ? 'block' : 'none';
                    this.textContent = hidden ? 'Ukryj obraz' : 'Pokaż obraz';
                    return;
                }
                const img = document.createElement('img');
                img.className = 'changelog-img';
                img.alt = '';
                img.src = url; // dopiero teraz request HTTP
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

    document.addEventListener('DOMContentLoaded', () => {
        setLogo(detectLang());
        updatePanelScale();
        window.addEventListener('resize', updatePanelScale);

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

        document.getElementById('btnPlay')?.addEventListener('click', () => {
            console.log('[wejsciowa] Graj');
        });
        document.getElementById('btnSettings')?.addEventListener('click', () => {
            console.log('[wejsciowa] Ustawienia');
        });
        document.getElementById('btnInfo')?.addEventListener('click', () => {
            window.location.href = 'info.html';
        });
    });
})();