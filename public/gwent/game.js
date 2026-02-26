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
            if (window.updateSelectionUI) window.updateSelectionUI();
            else updatePositionsAndScaling(); // Fallback to update UI
        });

        socket.on('selection-timer-update', (data) => {
            window.opponentReadyTimer = data.timeLeft;
            if (window.updateSelectionUI) window.updateSelectionUI();
        });

        socket.on('selection-timer-stopped', () => {
            window.opponentReadyTimer = null;
            if (window.updateSelectionUI) window.updateSelectionUI();
        });

        socket.on('start-game-now', () => {
            switchToGame();
        });

        socket.on('force-finish-selection', () => {
            const deck = getSelectedDeck();
            socket.emit('save-full-deck', { gameCode, isPlayer1: isP1, deck });
            socket.emit('force-start-game', { gameCode });
        });
    }

    initSelection(socket, gameCode, isP1);

    function switchToGame() {
        cardSelectionScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        initGameBoard(socket, gameCode, isP1, nick);
        renderAll(nick);
    }

    document.getElementById('goToGameButton').onclick = () => {
        const deck = getSelectedDeck();
        const leader = getSelectedLeader();
        const factionId = window.selectedFaction || '1';

        // Mark self as ready
        window.localReady = !window.localReady;
        const btn = document.getElementById('goToGameButton');
        if (btn) {
            btn.innerText = window.localReady ? 'GOTOWY' : 'Przejdź do gry';
            btn.style.backgroundColor = window.localReady ? 'rgba(53, 168, 66, 0.5)' : 'rgba(0, 0, 0, 0.5)';
        }

        socket.emit('save-full-deck', {
            gameCode,
            isPlayer1: isP1,
            deck: deck.map(c => c.numer),
            leader: leader ? leader.numer : null,
            faction: factionId,
            isReady: window.localReady
        });
    };

    window.addEventListener('resize', () => {
        updatePositionsAndScaling();
        if (gameScreen.style.display === 'block') renderAll(nick);
    });
});