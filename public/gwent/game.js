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
            initSelection(socket, gameCode, isP1); // Refresh UI to show opponent status
        });

        socket.on('start-game-now', () => {
            switchToGame();
        });

        let countdownInterval = null;
        socket.on('start-game-countdown', (data) => {
            let count = data.seconds || 3;
            const btn = document.getElementById('goToGameButton');
            if (countdownInterval) clearInterval(countdownInterval);

            countdownInterval = setInterval(() => {
                btn.innerText = `GOTOWOŚĆ (${count}s)`;
                count--;
                if (count < 0) {
                    clearInterval(countdownInterval);
                    btn.innerText = 'GOTOWOŚĆ';
                }
            }, 1000);
        });

        socket.on('force-finish-selection', () => {
            const deck = getSelectedDeck();
            const leader = getSelectedLeader();
            socket.emit('save-full-deck', {
                gameCode,
                isPlayer1: isP1,
                deck: deck.map(c => c.numer),
                leader: leader ? leader.numer : null
            });
            socket.emit('force-start-game', { gameCode });
        });
    }

    function playSound(id) {
        const el = document.getElementById(id);
        if (el) {
            el.currentTime = 0;
            el.play().catch(() => { });
        }
    }
    window.playSound = playSound;

    document.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('.button') || e.target.closest('.page-left') || e.target.closest('.page-right')) {
            playSound('hoverSound');
        }
    });

    initSelection(socket, gameCode, isP1);

    function switchToGame() {
        cardSelectionScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        initGameBoard(socket, gameCode, isP1, nick);
        renderAll(nick);
    }

    document.getElementById('goToGameButton').onclick = () => {
        const btn = document.getElementById('goToGameButton');
        if (btn.classList.contains('ready')) {
            // Already ready, maybe toggle off? Original request says "GOTOWOŚĆ" button.
            // Let's stick to the flow.
        }
        btn.classList.add('ready');
        btn.innerText = 'OCZEKIWANIE';

        const currentDeckCards = getSelectedDeck();
        const currentLeader = getSelectedLeader();
        const factionId = window.selectedFaction || '1';

        // Save to server
        socket.emit('save-full-deck', {
            gameCode,
            isPlayer1: isP1,
            deck: currentDeckCards.map(c => c.numer),
            leader: currentLeader ? currentLeader.numer : null,
            faction: factionId
        });

        socket.emit('player-ready', { gameCode, isPlayer1: isP1, isReady: true });
    };

    document.getElementById('saveDeckButton').onclick = () => {
        const currentDeckCards = getSelectedDeck();
        const currentLeader = getSelectedLeader();
        const factionId = localStorage.getItem('faction') || '1';

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