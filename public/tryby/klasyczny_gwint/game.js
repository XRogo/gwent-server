import { initSelection, getSelectedDeck, getSelectedLeader, getUnitCardCount, updatePositionsAndScaling } from './selection_card.js';
import { initGameBoard, renderAll } from './game_board.js';

document.addEventListener('DOMContentLoaded', () => {
    const cardSelectionScreen = document.getElementById('cardSelectionScreen');
    const gameScreen = document.getElementById('gameScreen');
    const socket = typeof io !== 'undefined' ? io() : null;
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('code');
const isP1 = urlParams.get('host') === 'true';
const nick = urlParams.get('nick') || localStorage.getItem('nickname') || (isP1 ? 'Gospodarz' : 'Gość');

function getGameToken(code) {
    try {
        return localStorage.getItem('gwent_token_' + code);
    } catch (e) {
        return null;
    }
}
function saveGameToken(code, token) {
    if (!code || !token) return;
    try {
        localStorage.setItem('gwent_token_' + code, token);
    } catch (e) {}
}

if (socket && gameCode) {
    if (window.ConnectionUI) {
        window.ConnectionUI.init(socket, gameCode, isP1, nick);
    }

    const token = getGameToken(gameCode);
    socket.emit('rejoin-game', {
        gameCode,
        isPlayer1: isP1,
        nickname: nick,
        token: token || undefined
    });

    socket.on('join-success', (data) => {
        if (typeof data.isPlayer1 === 'boolean') {
            console.log('[REJOIN] Serwer ustawił rolę:', data.isPlayer1 ? 'P1' : 'P2');
        }
        // Odśwież token (ten sam albo nowy) – tylko u nas
        if (data.token) saveGameToken(gameCode, data.token);
    });

    socket.on('join-error', (msg) => {
        alert(msg || 'Nie można dołączyć do lobby');
        window.location.href = '/';
    });

    socket.on('session-taken', (msg) => {
        alert(msg || 'Sesja przejęta przez inne połączenie.');
        window.location.href = '/';
    });

    let currentCountdownSeconds = null;

        function getSecondsHtml(seconds) {
            let colorClass = 'time-green';
            if (seconds <= 5) {
                colorClass = 'time-red';
            } else if (seconds <= 20) {
                colorClass = 'time-yellow';
            }
            return `<span class="${colorClass}">${seconds}s</span>`;
        }

        function updateCountdownNotification() {
            const notifArea = document.getElementById('selectionNotificationArea');
            if (!notifArea) return;

            let countdownItem = notifArea.querySelector('.countdown-notification');
            if (currentCountdownSeconds === null) {
                if (countdownItem) {
                    countdownItem.classList.add('fade-out');
                    setTimeout(() => countdownItem.remove(), 500);
                }
                return;
            }

            let textHtml = '';
            if (isReadyStatus) {
                textHtml = `Czekanie na gotowość przeciwnika ${getSecondsHtml(currentCountdownSeconds)}`;
            } else {
                textHtml = `Przeciwnik jest gotowy, za ${getSecondsHtml(currentCountdownSeconds)} rozpoczęcie gry`;
            }

            if (!countdownItem) {
                countdownItem = document.createElement('div');
                countdownItem.className = 'selection-notification-item countdown-notification';
                notifArea.appendChild(countdownItem); // przy column-reverse wstawi się na dole
            }
            countdownItem.innerHTML = textHtml;
        }

        function showSelectionNotification(text, duration = 3000) {
            const notifArea = document.getElementById('selectionNotificationArea');
            if (!notifArea) return;

            const item = document.createElement('div');
            item.className = 'selection-notification-item';
            item.innerText = text;
            notifArea.appendChild(item);

            setTimeout(() => {
                item.classList.add('fade-out');
                setTimeout(() => {
                    item.remove();
                }, 500);
            }, duration);
        }
        window.showSelectionNotification = showSelectionNotification;

        socket.on('opponent-ready-status', (data) => {
            window.opponentReady = data.isReady;
            if (data.isReady) playSound('joinSound');
            if (window.updateSelectionUI) window.updateSelectionUI();
            updateCountdownNotification();
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
            currentCountdownSeconds = data && typeof data.seconds === 'number' ? data.seconds : null;
            updateCountdownNotification();
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

    let gameSwitched = false;
    function switchToGame() {
        if (gameSwitched && gameScreen && gameScreen.style.display === 'block') return;
        gameSwitched = true;
        playSound('joinSound');
        cardSelectionScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        initGameBoard(socket, gameCode, isP1, nick);
        renderAll(nick);
    }

    let isReadyStatus = false;
    const goToGameButton = document.getElementById('goToGameButton');

    function updateGoToGameButton() {
        if (!goToGameButton) return;
        if (isReadyStatus) return; // Jeśli gracz jest już w stanie "Anuluj", nie nadpisuj tekstu i stanu
        const unitCount = getUnitCardCount();
        if (unitCount < 22) {
            goToGameButton.disabled = true;
            goToGameButton.classList.add('disabled');
        } else {
            goToGameButton.disabled = false;
            goToGameButton.classList.remove('disabled');
        }
        goToGameButton.innerText = "Rozpocznij grę";
    }
    window.updateGoToGameButton = updateGoToGameButton;
    updateGoToGameButton();

    goToGameButton.onclick = () => {
        if (!isReadyStatus && getUnitCardCount() < 22) {
            return;
        }

        isReadyStatus = !isReadyStatus;
        const btn = goToGameButton;

        if (isReadyStatus) {
            const currentDeckCards = getSelectedDeck();
            const currentLeader = getSelectedLeader();
            const factionId = window.selectedFaction || localStorage.getItem('faction') || '1';

            // Save to server
            socket.emit('save-full-deck', {
                gameCode,
                isPlayer1: isP1,
                deck: currentDeckCards.map(c => c.numer),
                leader: currentLeader ? currentLeader.numer : null,
                factionId: factionId
            });

            // Mark as ready
            socket.emit('player-ready', { gameCode, isPlayer1: isP1, isReady: true });
            btn.innerText = "Anuluj";
        } else {
            // Cancel ready
            socket.emit('player-ready', { gameCode, isPlayer1: isP1, isReady: false });
            btn.innerText = "Rozpocznij grę";
            updateGoToGameButton();
        }
        updateCountdownNotification();
    };

    document.getElementById('saveDeckButton').onclick = () => {
        const currentDeckCards = getSelectedDeck();
        const currentLeader = getSelectedLeader();
        const factionId = window.selectedFaction || localStorage.getItem('faction') || '1';

        if (window.saveDeck) {
            window.saveDeck(factionId, currentLeader ? currentLeader.numer : null, currentDeckCards.map(c => c.numer));
            showSelectionNotification('Zapisano talię w pamięci lokalnej', 3000);
        }
    };

    window.addEventListener('resize', () => {
        updatePositionsAndScaling();
        if (gameScreen.style.display === 'block') renderAll(nick);
    });
});