import cards from './cards.js';
import { showPowiek } from './rcard.js';
import { krole } from './krole.js';

let playerHand = [];
let drawPile = [];
let playerGraveyard = [];
let opponentHandCount = 10;
let opponentDeckCount = 12;
let opponentGraveyardCount = 0;
let swapsCount = 0;

export function initGameBoard(socket, gameCode, isPlayer1, nick) {
    socket.emit('get-game-state', { gameCode, isPlayer1 });

    socket.on('init-game-state', (data) => {
        if (data.hand) {
            playerHand = data.hand;
            drawPile = data.deck;
            playerGraveyard = data.graveyard || [];
            opponentHandCount = data.opponentHandCount;
            opponentDeckCount = data.opponentDeckCount;
            opponentGraveyardCount = data.opponentGraveyardCount || 0;
            window.opponentFaction = data.opponentFaction;
            swapsCount = data.swapsPerformed || 0;

            if (!window.gameStarted && data.status === 'playing') {
                window.gameStarted = true;
                startMulligan(socket, gameCode, isPlayer1);
            } else {
                renderAll(nick);
            }
        }
    });

    socket.on('mulligan-swap-success', (data) => {
        const { newCard, swapsLeft, cardIndex } = data;
        playerHand[cardIndex] = newCard;
        swapsCount = 2 - swapsLeft;
        playerHand.sort((a, b) => {
            const idxA = cards.findIndex(c => c.numer === a.numer);
            const idxB = cards.findIndex(c => c.numer === b.numer);
            return idxA - idxB;
        });
        if (swapsLeft <= 0) setTimeout(() => { if (window.hidePowiek) window.hidePowiek(); renderAll(nick); }, 500);
        else startMulligan(socket, gameCode, isPlayer1, playerHand.indexOf(newCard));
    });

    socket.on('opponent-game-update', (data) => {
        if (data.handCount !== undefined) opponentHandCount = data.handCount;
        if (data.deckCount !== undefined) opponentDeckCount = data.deckCount;
        if (data.graveyardCount !== undefined) opponentGraveyardCount = data.graveyardCount;
        if (data.faction !== undefined) window.opponentFaction = data.faction;
        renderAll(nick);
    });
}

function startMulligan(socket, gameCode, isPlayer1, selectedIndex = 0) {
    showPowiek(playerHand, selectedIndex, 'hand', {
        isMulligan: true,
        swapsLeft: 2 - swapsCount,
        onSwap: (idx) => socket.emit('mulligan-swap', { gameCode, isPlayer1, cardIndex: idx }),
        onClose: () => renderAll()
    });
}

export function renderAll(nick) {
    const overlay = document.querySelector('#gameScreen .overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    renderHand(overlay);
    renderNicknames(overlay, nick);
    renderGraveyards(overlay);
    renderPiles(overlay);
}

function renderHand(overlay) {
    const GUI_WIDTH = 3840, GUI_HEIGHT = 2160;
    const areaLeft = 1163, areaTop = 1691, areaRight = 3018, areaBottom = 1932;
    const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
    const boardLeft = (window.innerWidth - GUI_WIDTH * scale) / 2;
    const boardTop = (window.innerHeight - GUI_HEIGHT * scale) / 2;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = `${areaLeft * scale + boardLeft}px`;
    container.style.top = `${areaTop * scale + boardTop}px`;
    container.style.width = `${(areaRight - areaLeft) * scale}px`;
    container.style.height = `${(areaBottom - areaTop) * scale}px`;
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    playerHand.forEach((card, i) => {
        const img = document.createElement('img');
        img.src = card.karta;
        img.style.width = `${180 * scale}px`;
        img.style.height = `${240 * scale}px`;
        img.style.cursor = 'pointer';
        img.oncontextmenu = (e) => { e.preventDefault(); showPowiek(playerHand, i, 'hand'); };
        container.appendChild(img);
    });
    overlay.appendChild(container);
}

function renderNicknames(overlay, nick) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const createNick = (name, x, y, w, h) => {
        const div = document.createElement('div');
        div.className = 'game-nick';
        div.style.left = `${x * scale + boardLeft}px`;
        div.style.top = `${y * scale + boardTop}px`;
        div.style.width = `${w * scale}px`;
        div.style.height = `${h * scale}px`;
        div.style.fontSize = `${32 * scale}px`;
        div.textContent = name;
        return div;
    };

    overlay.appendChild(createNick(window.opponentNickname || 'PRZECIWNIK', 483, 569, 367, 33));
    overlay.appendChild(createNick(nick, 483, 1498, 367, 34));
}

function renderGraveyards(overlay) {
    // Logic from gra.js renderGraveyards
}

function renderPiles(overlay) {
    // Logic from gra.js renderPiles
}

function getFactionReverse(factionId) {
    const map = { "1": "polnoc", "2": "nilftgard", "3": "scoia'tel", "4": "potwory", "5": "skelige" };
    return `/gwent/assets/asety/${map[factionId] || 'polnoc'}_rewers.webp`;
}
