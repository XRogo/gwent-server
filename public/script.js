// ========== SYSTEM JĘZYKÓW (i18n) ==========

let currentLang = localStorage.getItem('lang') || 'pl';
let translations = {};

async function loadLanguage(lang) {
    try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) throw new Error('Nie znaleziono pliku języka');

        translations = await response.json();
        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;

        refreshAllTranslations();   // ← zamiast samego applyTranslations()

    } catch (error) {
        console.error('Błąd ładowania języka:', error);
        if (lang !== 'pl') loadLanguage('pl');
    }
}

function t(key) {
    return translations[key] || key;
}

function applyTranslations() {

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });

    document.querySelectorAll('[data-i18n-img]').forEach(el => {
        const template = el.getAttribute('data-i18n-img');
        el.src = template.replace('{lang}', currentLang);
    });
}

function refreshAllTranslations() {
    applyTranslations();          // data-i18n, data-i18n-title, placeholder itd.

    // Odśwież dynamiczne teksty trybów
    if (typeof initModeCarousel === 'function') {
        initModeCarousel();
    }

    // Odśwież aktualny opis trybu
    if (typeof selectedModeIndex !== 'undefined' && tryby[selectedModeIndex]) {
        const mode = tryby[selectedModeIndex];
        const descEl = document.getElementById('modePreviewText');
        if (descEl) descEl.textContent = t(mode.opis);
    }
}

// ========== KONIEC SYSTEMU JĘZYKÓW ==========

const socket = io();

const mainMenu = document.getElementById('mainMenu');
const sidePanel = document.getElementById('sidePanel');
const centerMenuImg = document.querySelector('.center-menu');
const menuWrapper = document.querySelector('.menu-wrapper');
const infoScreen = document.getElementById('infoScreen');
const gameScreen = document.getElementById('gameScreen');

let selectedModeIndex = 0; // Default to first mode in tryby.js
let isPlayer1 = false;
let isJoined = false;
let currentGameCode = null;
let player1Nickname = null;
let player2Nickname = null;
let isP1Ready = false;
let isP2Ready = false;
let player2Id = null;

function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    // Force reflow
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

window.copyCodeToClipboard = function () {
    if (!currentGameCode) return;
    navigator.clipboard.writeText(currentGameCode).then(() => {
        showToast("SKOPIOWANO KOD: " + currentGameCode);
    });
}

window.pasteCodeFromClipboard = function () {
    navigator.clipboard.readText().then(text => {
        const clean = text.trim();
        if (clean.length === 6 && /^\d+$/.test(clean)) {
            document.getElementById('sideCodeInput').value = clean;
            showToast(t("toast.pasted"));
        } else {
            showToast(t("toast.null.data"));
        }
    }).catch(() => {
        showToast(t("toast.no_clipboard"));
    });
}

const nicknames = [
    "Geralt", "Yennefer", "Ciri", "Triss", "Jaskier", "Zoltan", "Vesemir", "Lambert", "Eskel", "Foltest",
    "Emhyr", "Fringilla", "Meve", "Eredin", "Regis", "Yarpen", "Keira", "Letho", "Roche", "Ves", "Iorveth",
    "Radovid", "Dettlaff", "Barnabo", "Baron", "Milva"
];

// Cookie Helpers
function setCookie(name, value, days = 30) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

// Transient session nickname confirmation
window.confirmNickname = function () {
    const nick = document.getElementById('nicknameInput').value.trim();
    if (!nick) {
        showToast(t("toast.enter_nick"));
        return;
    }

    // Notify server/opponent
    if (currentGameCode) {
        socket.emit('set-nickname', { gameCode: currentGameCode, isPlayer1, nickname: nick });
        showToast(t("toast.nick_confirmed") + nick);
    } else {
        showToast(t("toast.nick_confirmed") + nick);
    }
    updateNicknameFading();
};

// Persistent cookie save
window.saveNicknamePersistent = function () {
    const nick = document.getElementById('nicknameInput').value.trim();
    if (!nick) {
        showToast(t("toast.enter_nick"));
        return;
    }
    setCookie('gwent_nickname', nick);
    showToast(t("toast.nick_saved"));

    // Also confirm session change
    confirmNickname();
};

// Cookie Consent Handlers
window.acceptCookies = function () {
    localStorage.setItem('gwent_cookies_accepted', 'true');
    document.getElementById('cookieBanner').style.display = 'none';
    showToast(t("toast.cookies_accepted"));
};

window.rejectCookies = function () {
    document.getElementById('cookieBanner').style.display = 'none';
    showToast(t("toast.cookies_rejected"));
};

function checkCookieConsent() {
    if (!localStorage.getItem('gwent_cookies_accepted')) {
        document.getElementById('cookieBanner').style.display = 'block';
    }
}

// Hover sounds
const addHoverSound = (selector) => {
    document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('mouseenter', () => {
            new Audio('assets/hover-sound.mp3').play().catch(() => { });
        });
    });
};

function showSidePanel() {
    sidePanel.classList.add('active');
    triggerCanvasResize();
    setTimeout(fitMenuToScreen, 100); // Pozwala animacji CSS zaktualizować szerokość  
    setTimeout(() => {
    refreshAllTranslations();
    }, 50); 
}

function showHostScreen() {
    isPlayer1 = true;
    // Nie tworzymy gry od razu - czekamy na kliknięcie Generuj w UI
    showSidePanel();
    updateSetupUI();
    initModeCarousel();
    setTimeout(() => {
    refreshAllTranslations();
    }, 50); 
}

/* ========================================================
   DYNAMIC MODE SYSTEM & PIXEL SCALING (wybor.webp)
======================================================== */
const canvas = document.getElementById('wyborPixelCanvas');
const bgImg = document.getElementById('wyborBgImg');

bgImg.onload = () => {
    triggerCanvasResize();
    fitMenuToScreen();
};
window.addEventListener('resize', () => {
    triggerCanvasResize();
    fitMenuToScreen();
});

function fitMenuToScreen() {
    const container = document.querySelector('.content-container');
    if (!container) return;

    // Resetuj skale do 1 przed pomiarem, zeby uniknac nieskończonych wyjatkow
    container.style.transform = `translateX(-50%) scale(1)`;
    container.offsetHeight; // force reflow

    const w = container.scrollWidth;
    if (w > window.innerWidth) {
        const scale = window.innerWidth / w;
        container.style.transform = `translateX(-50%) scale(${scale})`;
    }
}

function triggerCanvasResize() {
    if (!bgImg.complete || bgImg.naturalWidth === 0) return;

    const natW = bgImg.naturalWidth;
    const natH = bgImg.naturalHeight;
    const curW = bgImg.clientWidth;

    // Pixel canvas matches natural dimensions of the image
    canvas.style.width = natW + 'px';
    canvas.style.height = natH + 'px';

    // Scale it down to match the rendered width
    const scale = curW / natW;
    canvas.style.transform = `scale(${scale})`;
}

function initModeCarousel() {
    const carousel = document.getElementById('modeCarousel');
    carousel.innerHTML = '';

    tryby.forEach((mode, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'kafelek-wrapper';

        const item = document.createElement('div');
        item.className = 'carousel-kafelek';
        item.style.backgroundImage = `url('assets/${mode.ikona}')`;
        item.style.zIndex = index + 1;
        item.onclick = () => selectGameMode(index);

        const text = document.createElement('div');
        text.className = 'carousel-kafelek-hover-text';
        text.textContent = t(mode.nazwa);

        item.appendChild(text);
        wrapper.appendChild(item);
        carousel.appendChild(wrapper);

        // Add separator if not last
        if (index < tryby.length - 1) {
            const separator = document.createElement('img');
            separator.src = 'assets/dzielnik.webp';
            separator.className = 'dzielnik-img';
            separator.alt = 'dzielnik';
            carousel.appendChild(separator);
        }
    });

    selectGameMode(0); // Select first mode
}

function selectGameMode(index) {
    selectedModeIndex = index;
    const mode = tryby[index];

    // Update active class
    const items = document.querySelectorAll('.carousel-kafelek');
    items.forEach((item, i) => {
        item.classList.remove('active');
        if (i === index) item.classList.add('active');
    });

    // Update texts and images
    document.getElementById('modePreviewText').textContent = t(mode.opis);

    const imgElement = document.getElementById('modePreviewImg');
    if (mode.obraz) {
        imgElement.src = `assets/${mode.obraz}`;
    } else {
        imgElement.src = 'assets/work in prognres.png'; // Fallback
    }

    // Status logic (Stan 1, 2, 3)
    const conceptOverlay = document.getElementById('conceptOverlay');
    const betaStatusLabel = document.getElementById('betaStatusLabel');

    if (mode.stan === 3) {
        conceptOverlay.style.display = 'flex';
        betaStatusLabel.style.display = 'none';
    } else if (mode.stan === 2) {
        conceptOverlay.style.display = 'none';
        betaStatusLabel.style.display = 'block';
    } else {
        conceptOverlay.style.display = 'none';
        betaStatusLabel.style.display = 'none';
    }

    if (isPlayer1 && player2Id) {
        // Send index to P2
        socket.emit('send-to-p2', { player2Id, message: { type: 'mode-changed', index } });
    }
}

function updateNicknameFading() {
    const input = document.getElementById('nicknameInput');
    const val = input.value.trim();
    if (nicknames.includes(val)) {
        input.classList.add('nickname-faded');
    } else {
        input.classList.remove('nickname-faded');
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    addHoverSound('.menu-button, .carousel-kafelek, .side-back-button, .game-btn');

    const nickInput = document.getElementById('nicknameInput');

    // Load from cookie or random (filter "test")
    let savedNick = getCookie('gwent_nickname');
    if (!savedNick) {
        const filtered = nicknames.filter(n => !n.toLowerCase().includes('test'));
        savedNick = filtered[Math.floor(Math.random() * filtered.length)];
    }
    nickInput.value = savedNick;
    updateNicknameFading();

    nickInput.onfocus = () => {
        if (nicknames.includes(nickInput.value.trim())) {
            nickInput.value = '';
            updateNicknameFading();
        }
    };
    nickInput.onblur = () => {
        if (!nickInput.value.trim()) {
            const filtered = nicknames.filter(n => !n.toLowerCase().includes('test'));
            nickInput.value = filtered[Math.floor(Math.random() * filtered.length)];
        }
        updateNicknameFading();
    };
    nickInput.oninput = updateNicknameFading;
    nickInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
            confirmNickname();
        }
    };

    checkCookieConsent();
    setTimeout(fitMenuToScreen, 100);
    checkMobileOrientation();
    loadLanguage(currentLang);

    // ===== PRZEŁĄCZNIK JĘZYKÓW =====
    // Nasłuchiwanie kliknięć w flagi
    document.querySelectorAll('.lang-flag').forEach(flag => {
        flag.addEventListener('click', () => {
            const selectedLang = flag.dataset.lang;
            if (selectedLang !== currentLang) {
                loadLanguage(selectedLang);
        }
    });
});
});

function checkMobileOrientation() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.getElementById('mobileWarning').style.display = 'flex';
    }
}

window.closeWarning = function () {
    document.getElementById('mobileWarning').style.display = 'none';
}

window.setupMobileGame = function () {
    // 1. Wejdz w fullscreen (wymagane dla Screen Orientation API)
    const docEl = document.documentElement;
    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;

    if (requestFullScreen) {
        requestFullScreen.call(docEl).then(() => {
            // 2. Proba wymuszenia orientacji poziomej
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(err => {
                    console.log(t("toast.orjent"), err);
                    showToast(t("toast.obr_ren"));
                });
            }
            updateFsIcon();
            closeWarning();
        }).catch(() => {
            showToast(t("toast.error.fullscreen"));
        });
    }
}

window.toggleFullScreen = function () {
    const doc = window.document;
    const docEl = doc.documentElement;
    const fsIcon = document.getElementById('fsIcon');

    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
        fsIcon.src = 'assets/pomiek.webp';
    } else {
        cancelFullScreen.call(doc);
        fsIcon.src = 'assets/powiek.webp';
    }
}

// Track FS changes to update icon if Esc pressed
document.addEventListener('fullscreenchange', updateFsIcon);
document.addEventListener('webkitfullscreenchange', updateFsIcon);
document.addEventListener('mozfullscreenchange', updateFsIcon);
document.addEventListener('MSFullscreenChange', updateFsIcon);

function updateFsIcon() {
    const fsIcon = document.getElementById('fsIcon');
    if (!document.fullscreenElement) {
        fsIcon.src = 'assets/powiek.webp';
    } else {
        fsIcon.src = 'assets/pomiek.webp';
    }
}

let countdownInterval = null;
function handleCountdown() {
    const display = document.getElementById('countdownDisplay');
    if (isP1Ready && isP2Ready) {
        if (!countdownInterval) {
            let seconds = 5;
            display.textContent = (t("toast.start").replace("{seconds}", seconds));
            countdownInterval = setInterval(() => {
                seconds--;
                if (seconds > 0) {
                    display.textContent = (t("toast.start").replace("{seconds}", seconds));
                } else {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                    startRealGame();
                }
            }, 1000);
        }
    } else {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        display.textContent = '';
    }
}

function leaveRoom() {
    if (isPlayer1) socket.emit('p1Left');
    else socket.emit('p2Left');
    setTimeout(() => location.reload(), 100);
}

/* ========================================================
   LOBBY LOGIC
======================================================== */

function updateSetupUI() {
    const codeDisplay = document.getElementById('displayCode');
    const p2Status = document.getElementById('p2Status');
    const joinArea = document.getElementById('joinArea');
    const acceptBtn = document.getElementById('acceptBtn');
    const reloadBtn = document.getElementById('reloadBtn');

    if (currentGameCode) {
        codeDisplay.textContent = (t("toast.your_code").replace("{code}", currentGameCode));
    } else if (isPlayer1) {
        codeDisplay.textContent = (t("lobby.generate"));
    }

    // Host Action Button Logic
    if (isPlayer1) {
        if (!currentGameCode) {
            reloadBtn.src = 'assets/reload.webp';
            reloadBtn.title = 'Generuj kod';
            reloadBtn.onclick = () => socket.emit('create-game');
            reloadBtn.classList.remove('disabled');
        } else {
            // Jeśli jest kod, to reloadBtn resetuje lobby
            reloadBtn.src = 'assets/reload.webp';
            reloadBtn.title = 'Zmień kod / Reset';
            reloadBtn.onclick = resetLobby;

            // BLOKADA: Jeśli przeciwnik dołączył, nie można generować/resetować
            if (player2Id) {
                reloadBtn.classList.add('disabled');
                reloadBtn.title = (t("toast.lobby.full"));
            } else {
                reloadBtn.classList.remove('disabled');
            }
        }
    }

    // Lock join area logic
    if (player2Id || (!isPlayer1 && isJoined)) {
        joinArea.classList.add('locked');
    } else {
        joinArea.classList.remove('locked');
    }

    if (isPlayer1) {
        p2Status.textContent = isP2Ready ? (t("enemy.redy")) : (player2Id ? (t("enemy.waiting")) : (t("lobby.waiting")));
        document.getElementById('opponentNameDisplay').textContent = player2Nickname || (t("waiting.on.enemy"));
    } else {
        p2Status.textContent = isP2Ready ? (t("status.ready")) : (t("status.not.ready"));
        document.getElementById('opponentNameDisplay').textContent = player1Nickname || (t("connected.host"));
    }

    const readyBtn = document.getElementById('readyBtn');
    readyBtn.textContent = (isPlayer1 ? isP1Ready : isP2Ready) ? (t("cancel.redy")) : (t("lobby.ready"));

    // BLOKADA: Nie można dać gotowości bez przeciwnika
    if (isPlayer1 && !player2Id) {
        readyBtn.classList.add('disabled');
        readyBtn.title = (t("dy.waiting.on.enemy"));
    } else {
        readyBtn.classList.remove('disabled');
        readyBtn.title = '';
    }

    handleCountdown();
}

function toggleReady() {
    if (isPlayer1 && !player2Id) {
        showToast(t("dy.waiting.on.enemy2"));
        return;
    }
    const nick = document.getElementById('nicknameInput').value.trim() || (t("Player"));
    // NIE zapisujemy automatycznie do ciasteczek, jedynie rozsyłamy stan

    if (isPlayer1) {
        isP1Ready = !isP1Ready;
        if (player2Id) {
            socket.emit('send-to-p2', { player2Id, message: { type: 'readiness-changed', ready: isP1Ready } });
        }
    } else {
        isP2Ready = !isP2Ready;
        socket.emit('send-to-p1', { gameCode: currentGameCode, message: { type: 'readiness-changed', ready: isP2Ready } });
    }

    socket.emit('set-nickname', { gameCode: currentGameCode, isPlayer1, nickname: nick });
    updateSetupUI();
}

function joinOrStartGame() {
    const codeInput = document.getElementById('sideCodeInput').value.trim();
    if (codeInput) {
        if (codeInput === currentGameCode) {
            showToast(t("dy.your.lobby"));
            return;
        }
        // Player wants to join
        currentGameCode = codeInput;
        socket.emit('join-game', { gameCode: codeInput });
    } else {
        // Player 1 wants to start
        requestStartGame();
    }
}

function requestStartGame() {
    if (isPlayer1 && isP1Ready && isP2Ready) {
        socket.emit('send-to-p2', { player2Id, message: { type: 'start-game' } });
        startRealGame();
    }
}

function startRealGame() {
    const nick = document.getElementById('nicknameInput').value || nicknames[Math.floor(Math.random() * nicknames.length)];
    localStorage.setItem('nickname', nick);

    // Zapamiętaj czy użytkownik jest w trybie pełnoekranowym
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    localStorage.setItem('gwent_fullscreen_pref', isFS ? 'true' : 'false');

    const mode = tryby[selectedModeIndex];
    const gamePath = mode ? mode.gra : 'tryby/klasyczny_gwint';

    window.location.href = `/${gamePath}/game.html?code=${currentGameCode}&host=${isPlayer1}&nick=${encodeURIComponent(nick)}`;
}

function goBackToMain() {
    menuWrapper.classList.remove('side-view');
    sidePanel.classList.remove('active');
    setTimeout(fitMenuToScreen, 100);
    if (isPlayer1) socket.emit('p1Left');
    else socket.emit('p2Left');
    socket.disconnect();
    location.reload();
}

// Socket events
socket.on('game-created', (data) => {
    currentGameCode = data.gameCode;
    console.log('Game created:', currentGameCode);
    updateSetupUI();
});

socket.on('join-success', (data) => {
    isJoined = true;
    currentGameCode = data.gameCode;
    if (!data.isPlayer1) {
        isPlayer1 = false;
        showSidePanel();
    }
    updateSetupUI();

    // Wyślij nick jeśli już jest ustawiony
    const myNick = document.getElementById('nicknameInput').value.trim();
    if (myNick) {
        socket.emit('set-nickname', { gameCode: currentGameCode, isPlayer1, nickname: myNick });
    }
});

socket.on('opponent-joined', (data) => {
    player2Id = data.opponentId;
    player2Nickname = "Przeciwnik";
    updateSetupUI();
    // Notify P2 of current status
    socket.emit('send-to-p2', { player2Id, message: { type: 'sync-setup', modeIndex: selectedModeIndex, ready: isP1Ready } });

    // Send nickname if already set
    const myNick = document.getElementById('nicknameInput').value.trim();
    if (myNick) {
        socket.emit('set-nickname', { gameCode: currentGameCode, isPlayer1, nickname: myNick });
    }
});

socket.on('message-from-p1', (msg) => {
    if (msg.type === 'sync-setup' || msg.type === 'mode-changed') {
        if (msg.modeIndex !== undefined) selectGameMode(msg.modeIndex);
        if (msg.ready !== undefined) {
            isP1Ready = msg.ready;
            updateSetupUI();
        }
    } else if (msg.type === 'readiness-changed') {
        isP1Ready = msg.ready;
        updateSetupUI();
    } else if (msg.type === 'start-game') {
        startRealGame();
    }
});

socket.on('message-from-p2', (data) => {
    const msg = data.message;
    if (msg.type === 'readiness-changed') {
        isP2Ready = msg.ready;
        updateSetupUI();
    }
});

// Update nicknames and status from server
socket.on('opponent-status', (data) => {
    if (data.player1Nickname) player1Nickname = data.player1Nickname;
    if (data.player2Nickname) player2Nickname = data.player2Nickname;

    // Also update player2Id if it's missing (for P1)
    if (isPlayer1 && data.player2Id) {
        player2Id = data.player2Id;
    }

    updateSetupUI();
});



let isResetting = false;
// Reset Lobby
window.resetLobby = function () {
    if (isResetting) return;

    if (isPlayer1) {
        isResetting = true;
        const reloadBtn = document.querySelector('.reload-btn');
        if (reloadBtn) reloadBtn.style.opacity = '0.5';

        socket.emit('p1Left');
        isJoined = false;
        player2Id = null;
        isP1Ready = false;
        isP2Ready = false;
        currentGameCode = null;
        updateSetupUI();

        setTimeout(() => {
            socket.emit('create-game');
        }, 150);

        let secondsLeft = 30;
        const interval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(interval);
                isResetting = false;
                if (reloadBtn) reloadBtn.style.opacity = '1';
            }
        }, 1000);

        showToast(t("reload.lobby"));
    }
};

// Test Game
window.startTestGame = function () {
    socket.emit('find-test-game');
};

socket.on('test-game-joined', (data) => {
    currentGameCode = data.gameCode;
    isPlayer1 = data.isHost;

    // In test game, we immediately assume the first mode
    selectedModeIndex = 0;
    startRealGame();
});