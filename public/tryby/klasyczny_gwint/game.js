import { initSelection, getSelectedDeck, getSelectedLeader, updatePositionsAndScaling, getUnitCount } from './selection_card.js';
import { initGameBoard, renderAll } from './game_board.js';

document.addEventListener('DOMContentLoaded', () => {
    const cardSelectionScreen = document.getElementById('cardSelectionScreen');
    const gameScreen = document.getElementById('gameScreen');
    const socket = typeof io !== 'undefined' ? io() : null;
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('code');
    const isP1 = urlParams.get('host') === 'true';
    const nick = urlParams.get('nick') || localStorage.getItem('nickname') || (isP1 ? 'Gospodarz' : 'Gość');

    if (socket && gameCode) {
        if (window.ConnectionUI) {
            window.ConnectionUI.init(socket, gameCode, isP1, nick);
        }
        socket.emit('rejoin-game', { gameCode, isPlayer1: isP1, nickname: nick });
        socket.on('join-success', (data) => {
    // nadpisz rolę tym, co powiedział serwer
    if (typeof data.isPlayer1 === 'boolean') {
        // jeśli masz zmienną isP1 w tym pliku – zaktualizuj
        // isP1 = data.isPlayer1;
        console.log('[REJOIN] Serwer ustawił rolę:', data.isPlayer1 ? 'P1' : 'P2');
    }
});

socket.on('join-error', (msg) => {
    alert(msg || 'Nie można dołączyć do lobby');
    window.location.href = '/';
});

        socket.on('opponent-ready-status', (data) => {
            window.opponentReady = data.isReady;
            if (data.isReady) playSound('joinSound');
            if (window.updateSelectionUI) window.updateSelectionUI();
        });

        socket.on('start-game-now', () => {
        switchToGame();
        });

        // NOWE: powrót do trwającej partii (F5 / ponowne wejście)
        socket.on('resume-in-game', (data) => {
            console.log('[GAME] Wznawiam trwającą grę', data);
            switchToGame();
        });

        socket.on('start-game-countdown', (data) => {
    if (data.seconds === null) {
        countdownActive = false;
        if (countdownLineId) {
            removeStatusLine(countdownLineId);
            countdownLineId = null;
        }
        return;
    }

    countdownActive = true;
    const sec = data.seconds;

    // isReadyStatus = TY kliknąłeś gotowość
    const html = isReadyStatus
        ? `Jesteś gotowy, czekanie na przeciwnika ${secHtml(sec)}`
        : `Przeciwnik jest gotowy, za ${secHtml(sec)} rozpoczęcie gry`;

    if (!countdownLineId) {
        countdownLineId = addStatusLine(html, { sticky: true, id: 'countdown' });
    } else {
        updateStatusLine(countdownLineId, html);
    }
});

        socket.on('force-finish-selection', () => {
            const deck = getSelectedDeck();
            const leader = getSelectedLeader();
            socket.emit('save-full-deck', {
                gameCode,
                isPlayer1: isP1,
                deck: deck.map(c => c.numer),
                leader: leader ? leader.numer : null,
                factionId: window.selectedFaction || localStorage.getItem('faction') || '1'
            });
            socket.emit('force-start-game', { gameCode });
        });

        socket.on('rematch-starting', () => {
            const endScreen = document.getElementById('end-game-screen');
            if (endScreen) endScreen.remove();
            initGameBoard(socket, gameCode, isP1, nick);
        });
    }

    // Śledzi czas zakończenia ostatniego dźwięku (do opóźnienia banera)
    window._lastSoundEndTime = 0;

    function playSound(id, onEnded) {
        const el = document.getElementById(id);
        if (!el) { if (onEnded) onEnded(); return null; }
        const clone = el.cloneNode();
        clone.volume = el.volume;
        clone.play().catch(() => { if (onEnded) onEnded(); });
        clone.addEventListener('ended', () => {
            clone.remove();
            if (onEnded) onEnded();
        }, { once: true });
        document.body.appendChild(clone);
        // Śledź kiedy dźwięk się skończy (dla opóźnienia banera)
        if (el.duration && isFinite(el.duration)) {
            window._lastSoundEndTime = Math.max(window._lastSoundEndTime, Date.now() + el.duration * 1000);
        } else {
            // Fallback jeśli duration nieznany (plik nie załadowany jeszcze) – zakładamy 2s
            window._lastSoundEndTime = Math.max(window._lastSoundEndTime, Date.now() + 2000);
        }
        return clone;
    }
    window.playSound = playSound;

    // Hover dźwięk — tylko na SAMYM elemencie karty/przycisku, nie na jego dzieciach
    // + debounce 150ms per element żeby szybkie przejazdy nie spamowały
    const _hoverCooldowns = new WeakMap();
    const HOVER_SELECTORS = ['button', '.button', '.page-left', '.page-right',
        '.kolekcja-card', '.talia-card', '.hand-card-img',
        '.board-card-wrapper', '.game-pass-btn', '.scoia-btn'];

    document.addEventListener('mouseenter', (e) => {
        const t = e.target;
        // Sprawdź czy TEN element (nie rodzic) pasuje do któregoś selektora
        const matches = HOVER_SELECTORS.some(sel => t.matches && t.matches(sel));
        if (!matches) return;

        // Debounce per element
        const now = Date.now();
        const last = _hoverCooldowns.get(t) || 0;
        if (now - last < 150) return;
        _hoverCooldowns.set(t, now);

        playSound('hoverSound');
    }, true);

    initSelection(socket, gameCode, isP1);

    function switchToGame() {
        playSound('joinSound');
        cardSelectionScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        initGameBoard(socket, gameCode, isP1, nick);
        renderAll(nick);
    }

    let isReadyStatus = false;
const readyBtn = document.getElementById('goToGameButton');
const readyLabel = readyBtn.querySelector('.deck-action-label');

function refreshReadyButtonState() {
    if (isReadyStatus) {
        readyBtn.disabled = false;
        readyLabel.textContent = 'Cofnij gotowość';
        return;
    }
    const units = getUnitCount();
    readyBtn.disabled = units < 22;
    readyLabel.textContent = 'Rozpocznij grę';
}

// odświeżaj przy każdej zmianie talii
const _oldUpdate = window.updateSelectionUI;
window.updateSelectionUI = function () {
    if (_oldUpdate) _oldUpdate();
    refreshReadyButtonState();
};
isReadyStatus = true;
readyLabel.textContent = 'Cofnij gotowość';
// od razu info u Ciebie (timer dopisze serwer)
addStatusLine('Jesteś gotowy, czekanie na przeciwnika…', { ttl: 2500 });
isReadyStatus = false;
if (countdownLineId) {
    removeStatusLine(countdownLineId);
    countdownLineId = null;
}
countdownActive = false;

readyBtn.onclick = () => {
    if (!isReadyStatus) {
        if (getUnitCount() < 22) {
            setSelectionStatus('Potrzebujesz minimum 22 kart jednostek w talii');
            return;
        }
        isReadyStatus = true;
        const currentDeckCards = getSelectedDeck();
        const currentLeader = getSelectedLeader();
        const factionId = window.selectedFaction || localStorage.getItem('faction') || '1';

        socket.emit('save-full-deck', {
            gameCode,
            isPlayer1: isP1,
            deck: currentDeckCards.map(c => c.numer),
            leader: currentLeader ? currentLeader.numer : null,
            factionId
        });
        socket.emit('player-ready', { gameCode, isPlayer1: isP1, isReady: true });
        readyLabel.textContent = 'Cofnij gotowość';
    } else {
        isReadyStatus = false;
        socket.emit('player-ready', { gameCode, isPlayer1: isP1, isReady: false });
        readyLabel.textContent = 'Rozpocznij grę';
        refreshReadyButtonState();
    }
};

let statusHideTimer = null;
let countdownActive = false;
let countdownLineId = null;
let statusLineId = 0;

function getStatusBar() {
    return document.getElementById('selectionStatusBar');
}

function addStatusLine(html, { sticky = false, id = null, ttl = 3000 } = {}) {
    const bar = getStatusBar();
    if (!bar) return null;

    const line = document.createElement('div');
    line.className = 'status-line';
    const lineId = id || `s${++statusLineId}`;
    line.dataset.id = lineId;
    line.innerHTML = html;
    bar.appendChild(line);

    if (!sticky && ttl > 0) {
        setTimeout(() => {
            line.classList.add('fade-out');
            setTimeout(() => line.remove(), 650);
        }, ttl);
    }
    return lineId;
}

function updateStatusLine(id, html) {
    const bar = getStatusBar();
    if (!bar) return;
    const line = bar.querySelector(`.status-line[data-id="${id}"]`);
    if (line) line.innerHTML = html;
}

function removeStatusLine(id) {
    const bar = getStatusBar();
    if (!bar) return;
    const line = bar.querySelector(`.status-line[data-id="${id}"]`);
    if (!line) return;
    line.classList.add('fade-out');
    setTimeout(() => line.remove(), 650);
}

function secHtml(seconds) {
    let color = '#35a842';
    if (seconds <= 5) color = '#ff1a1a';
    else if (seconds <= 20) color = '#e6c200';
    return `<span class="status-sec" style="color:${color}">${seconds}s</span>`;
}

function setSelectionStatus(text, opts = {}) {
    // prosta wiadomość (np. Zapisano talię)
    addStatusLine(text, { ttl: opts.sticky ? 0 : 3000, sticky: !!opts.sticky });
}

    document.getElementById('saveDeckButton').onclick = () => {
    const currentDeckCards = getSelectedDeck();
    const currentLeader = getSelectedLeader();
    const factionId = window.selectedFaction || localStorage.getItem('faction') || '1';
    if (window.saveDeck) {
        window.saveDeck(factionId, currentLeader ? currentLeader.numer : null, currentDeckCards.map(c => c.numer));
        setSelectionStatus('Zapisano talię');
    }
};

    window.addEventListener('resize', () => {
        updatePositionsAndScaling();
        if (gameScreen.style.display === 'block') renderAll(nick);
    });
});