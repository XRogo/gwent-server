import { initSelection, getSelectedDeck, getSelectedLeader, updatePositionsAndScaling } from './selection_card.js';
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

        socket.on('opponent-ready-status', (data) => {
            window.opponentReady = data.isReady;
            if (data.isReady) playSound('joinSound');
            if (window.updateSelectionUI) window.updateSelectionUI();
        });

        socket.on('start-game-now', () => {
            switchToGame();
        });

        let countdownInterval = null;
        socket.on('start-game-countdown', (data) => {
            const btn = document.getElementById('goToGameButton');
            if (data.seconds === null) {
                btn.innerText = 'Przejdź do gry';
                return;
            }
            btn.innerText = `Start za ${data.seconds}...`;
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
    document.getElementById('goToGameButton').onclick = () => {
        isReadyStatus = !isReadyStatus;
        const btn = document.getElementById('goToGameButton');

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
            btn.innerText = "Oczekiwanie...";
        } else {
            // Cancel ready
            socket.emit('player-ready', { gameCode, isPlayer1: isP1, isReady: false });
            btn.innerText = "Przejdź do gry";
        }
    };

    document.getElementById('saveDeckButton').onclick = () => {
        const currentDeckCards = getSelectedDeck();
        const currentLeader = getSelectedLeader();
        const factionId = window.selectedFaction || localStorage.getItem('faction') || '1';

        if (window.saveDeck) {
            window.saveDeck(factionId, currentLeader ? currentLeader.numer : null, currentDeckCards.map(c => c.numer));
            alert('Talia zapisana!');
        }
    };

    window.addEventListener('resize', () => {
        updatePositionsAndScaling();
        if (gameScreen.style.display === 'block') renderAll(nick);
    });
});