// music.js – muzyka w tle + kontrolka głośności (ikona dzwiek1/2/3.webp)
(function () {
    const MUSIC_DIR = 'assets/music/';
    const ICON_DIR = 'assets/';            // <- jeśli dzwiek*.webp leżą gdzie indziej, zmień tutaj
    const TRACKS = [
        "A_Story_You_Won't_Believe.mp3",
        "Another_Round_For_Everyone.mp3",
        "Back_On_The_Path.mp3",
        "Belleteyn_Night.mp3",
        "Drink_Up,_There's_More!.mp3",
        "The_Musty_Scent_Of_Fresh_Pâté.mp3",
        "The_Nightingale.mp3"
    ];
    const LS_VOL = 'gwent_music_volume';
    const LS_MUTE = 'gwent_music_muted';

    function load(key, def) {
        try { const v = localStorage.getItem(key); return v === null ? def : v; } catch (e) { return def; }
    }
    function save(key, val) {
        try { localStorage.setItem(key, String(val)); } catch (e) {}
    }

    let volume = parseFloat(load(LS_VOL, '0.3'));
    if (!Number.isFinite(volume)) volume = 0.3;
    let muted = load(LS_MUTE, 'false') === 'true';

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = muted ? 0 : volume;

    // losowa kolejność, bez powtórzeń aż do końca listy
    let queue = [];
    let failCount = 0;
    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    function nextTrack() {
        if (queue.length === 0) queue = shuffle([...TRACKS]);
        const name = queue.pop();
        audio.src = MUSIC_DIR + encodeURIComponent(name);
        return audio.play();
    }

    let started = false;
    function unlockOnInteraction() {
        const handler = () => {
            ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
                window.removeEventListener(ev, handler, true));
            if (audio.paused) audio.play().catch(() => {});
        };
        ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
            window.addEventListener(ev, handler, true));
    }
    function start() {
        if (started) return;
        started = true;
        nextTrack().catch(() => unlockOnInteraction()); // autoplay zablokowany → start po 1. kliknięciu
    }

    audio.addEventListener('ended', () => { failCount = 0; nextTrack().catch(() => {}); });
    audio.addEventListener('error', () => {
        // zepsuty / brakujący plik → następny (z bezpiecznikiem przed pętlą)
        if (++failCount <= TRACKS.length) nextTrack().catch(() => {});
    });

    function iconLevel() {
        if (muted || volume <= 0.001) return 1;
        return volume < 0.5 ? 2 : 3;
    }

    function setVolume(v) {
        volume = Math.max(0, Math.min(1, v));
        if (volume > 0) muted = false;
        save(LS_VOL, volume);
        save(LS_MUTE, muted);
        audio.volume = muted ? 0 : volume;
        refreshUI();
    }
    function toggleMute() {
        muted = !muted;
        if (!muted && volume <= 0.001) volume = 0.3;
        save(LS_MUTE, muted);
        audio.volume = muted ? 0 : volume;
        refreshUI();
    }

    const controls = [];
    function refreshUI() {
        controls.forEach(c => {
            c.img.src = `${ICON_DIR}dzwiek${iconLevel()}.webp`;
            c.slider.value = muted ? 0 : volume;
        });
    }

    function ensureStyles() {
        if (document.getElementById('music-ui-styles')) return;
        const st = document.createElement('style');
        st.id = 'music-ui-styles';
        st.textContent = `
            .music-ctl { display:flex; align-items:center; margin-left:10px; cursor:pointer; }
            .music-ctl img { display:block; object-fit:contain; }
            .music-ctl .music-slider-wrap { overflow:hidden; width:0; opacity:0;
                transition: width .2s ease, opacity .2s ease, margin .2s ease; margin-left:0; }
            .music-ctl.open .music-slider-wrap,
            .music-ctl.hoverable:hover .music-slider-wrap { width:90px; opacity:1; margin-left:8px; }
            .music-ctl input[type=range] { width:90px; height:4px; accent-color:#c7a76e; cursor:pointer; display:block; }
        `;
        document.head.appendChild(st);
    }

    function createControl(isMobile) {
        ensureStyles();
        const isTouch = isMobile || (window.matchMedia && window.matchMedia('(hover: none)').matches);

        const wrap = document.createElement('div');
        wrap.className = 'music-ctl' + (isTouch ? '' : ' hoverable');

        const img = document.createElement('img');
        const size = isMobile ? 20 : 28;
        img.style.width = size + 'px';
        img.style.height = size + 'px';
        img.draggable = false;

        const sliderWrap = document.createElement('div');
        sliderWrap.className = 'music-slider-wrap';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0; slider.max = 1; slider.step = 0.01;
        slider.addEventListener('input', () => setVolume(parseFloat(slider.value)));
        sliderWrap.appendChild(slider);

        wrap.appendChild(img);
        wrap.appendChild(sliderWrap);

        img.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isTouch) wrap.classList.toggle('open');   // telefon: klik otwiera suwak
            else toggleMute();                            // desktop: klik = wycisz / włącz
            if (audio.paused) audio.play().catch(() => {});
        });
        // klik poza kontrolką zamyka suwak (telefon)
        document.addEventListener('pointerdown', (e) => {
            if (!wrap.contains(e.target)) wrap.classList.remove('open');
        }, true);

        controls.push({ img, slider });
        refreshUI();
        return wrap;
    }

    window.GameMusic = { start, createControl, setVolume, toggleMute };

    // start zaraz po wejściu do gry (ekran wyboru kart)
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();