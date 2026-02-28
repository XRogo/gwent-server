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
let playerLeaderObj = null;
let opponentLeaderObj = null;

function sortHand() {
    playerHand.sort((a, b) => {
        const idxA = cards.findIndex(c => c.numer === a.numer);
        const idxB = cards.findIndex(c => c.numer === b.numer);
        return idxA - idxB;
    });
}

export function initGameBoard(socket, gameCode, isPlayer1, nick) {
    socket.emit('get-game-state', { gameCode, isPlayer1 });

    socket.on('init-game-state', (data) => {
        if (data.hand) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === num)).filter(Boolean);

            playerHand = mapToObjects(data.hand);
            drawPile = mapToObjects(data.deck);
            playerGraveyard = mapToObjects(data.graveyard);

            opponentHandCount = data.opponentHandCount;
            opponentDeckCount = data.opponentDeckCount;
            opponentGraveyardCount = data.opponentGraveyardCount || 0;
            window.playerFaction = data.faction || localStorage.getItem('faction') || '1';
            window.opponentFaction = data.opponentFaction;
            swapsCount = data.swapsPerformed || 0;
            if (data.opponentNickname) window.opponentNickname = data.opponentNickname;
            if (data.nickname) nick = data.nickname;

            if (data.leader) playerLeaderObj = krole.find(k => k.numer === data.leader);
            if (data.opponentLeader) opponentLeaderObj = krole.find(k => k.numer === data.opponentLeader);

            sortHand();
            console.log(`[BOARD] Game state initialized. Local: ${nick}, Opponent: ${window.opponentNickname}`);

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
        const cardObj = cards.find(c => c.numer === newCard);
        if (cardObj) {
            playerHand[cardIndex] = cardObj;
        }
        swapsCount = 2 - swapsLeft;

        if (swapsLeft <= 0) {
            sortHand();
            socket.emit('end-mulligan', { gameCode, isPlayer1 });
            setTimeout(() => {
                if (window.hidePowiek) window.hidePowiek();
                renderAll(nick);
            }, 500);
        } else {
            startMulligan(socket, gameCode, isPlayer1, cardIndex);
        }
    });

    socket.on('opponent-game-update', (data) => {
        if (data.handCount !== undefined) opponentHandCount = data.handCount;
        if (data.deckCount !== undefined) opponentDeckCount = data.deckCount;
        if (data.graveyardCount !== undefined) opponentGraveyardCount = data.graveyardCount;
        if (data.faction !== undefined) window.opponentFaction = data.faction;
        renderAll(nick);
    });

    socket.on('update-deck', (data) => {
        if (data.deck) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === num)).filter(Boolean);
            drawPile = mapToObjects(data.deck);
            renderAll(nick);
        }
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

// ─── Helpers ────────────────────────────────────────────────

const GUI_W = 3840, GUI_H = 2160;

function getScale() {
    return Math.min(window.innerWidth / GUI_W, window.innerHeight / GUI_H);
}
function getBoardOffset() {
    const s = getScale();
    return {
        left: (window.innerWidth - GUI_W * s) / 2,
        top: (window.innerHeight - GUI_H * s) / 2
    };
}

/** Place an element at 4K coordinates */
function place(el, x, y, w, h) {
    const s = getScale();
    const o = getBoardOffset();
    el.style.position = 'absolute';
    el.style.left = `${x * s + o.left}px`;
    el.style.top = `${y * s + o.top}px`;
    if (w !== undefined) el.style.width = `${w * s}px`;
    if (h !== undefined) el.style.height = `${h * s}px`;
}

// ─── Faction assets helpers ─────────────────────────────────

const FACTION_NAMES = { '1': 'Północ', '2': 'Nilfgaard', '3': "Scoia'tael", '4': 'Potwory', '5': 'Skellige' };

function getFactionEmblem(factionId) {
    const map = { '1': 'tpolnoc', '2': 'tnilfgaard', '3': 'tscoiatael', '4': 'tpotwory', '5': 'tskellige' };
    return `assets/asety/${map[factionId] || 'tpolnoc'}.webp`;
}

function getFactionReverse(factionId) {
    const map = { '1': 'polnoc_rewers', '2': 'nilftgard_rewers', '3': "scoia'tel_rewers", '4': 'potwory_rewers', '5': 'skelige_rewers' };
    return `assets/asety/${map[factionId] || 'polnoc_rewers'}.webp`;
}

// ─── Render All ─────────────────────────────────────────────

export function renderAll(nick) {
    const overlay = document.querySelector('#gameScreen .overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    renderHand(overlay);
    renderPlayerPanels(overlay, nick);
    renderLives(overlay);
    renderGraveyards(overlay);
    renderPiles(overlay);
    renderLeaders(overlay);
}

// ─── Player Panels (nick, faction emblem, faction name, card count) ──

function renderPlayerPanels(overlay, nick) {
    const s = getScale();

    // --- Opponent panel ---
    // Faction emblem
    const oEmblem = document.createElement('img');
    oEmblem.src = getFactionEmblem(window.opponentFaction || '1');
    place(oEmblem, 441, 544, 100, 100);
    overlay.appendChild(oEmblem);

    // Opponent nickname
    const oNick = document.createElement('div');
    oNick.className = 'game-nick';
    place(oNick, 549, 550, 300, 40);
    oNick.style.fontSize = `${36 * s}px`;
    oNick.textContent = window.opponentNickname || 'PRZECIWNIK';
    overlay.appendChild(oNick);

    // Opponent faction name
    const oFaction = document.createElement('div');
    oFaction.className = 'game-nick';
    place(oFaction, 549, 590, 300, 30);
    oFaction.style.fontSize = `${26 * s}px`;
    oFaction.style.opacity = '0.7';
    oFaction.textContent = FACTION_NAMES[window.opponentFaction] || '';
    overlay.appendChild(oFaction);

    // Opponent card count icon + number
    const oCount = createCardCount(opponentHandCount);
    place(oCount, 560, 620, undefined, undefined);
    oCount.style.fontSize = `${40 * s}px`;
    overlay.appendChild(oCount);

    // --- Player panel ---
    const pEmblem = document.createElement('img');
    pEmblem.src = getFactionEmblem(window.playerFaction || '1');
    place(pEmblem, 441, 1402, 100, 100);
    overlay.appendChild(pEmblem);

    // Player nickname
    const pNick = document.createElement('div');
    pNick.className = 'game-nick';
    place(pNick, 549, 1408, 300, 40);
    pNick.style.fontSize = `${36 * s}px`;
    pNick.textContent = nick || '';
    overlay.appendChild(pNick);

    // Player faction name
    const pFaction = document.createElement('div');
    pFaction.className = 'game-nick';
    place(pFaction, 549, 1448, 300, 30);
    pFaction.style.fontSize = `${26 * s}px`;
    pFaction.style.opacity = '0.7';
    pFaction.textContent = FACTION_NAMES[window.playerFaction] || '';
    overlay.appendChild(pFaction);

    // Player card count
    const pCount = createCardCount(playerHand.length);
    place(pCount, 560, 1478, undefined, undefined);
    pCount.style.fontSize = `${40 * s}px`;
    overlay.appendChild(pCount);
}

function createCardCount(num) {
    const span = document.createElement('span');
    span.className = 'game-stat-number';
    span.style.color = '#b18941';
    span.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
    span.textContent = `🃏 ${num}`;
    return span;
}

// ─── Lives (Round Gems) ──────────────────────────────────────

function renderLives(overlay) {
    const s = getScale();

    const createLive = (x, y) => {
        const img = document.createElement('img');
        img.src = 'assets/asety/live.webp';
        // live.webp is designed for 4K – render at its native size relative to the board
        place(img, x, y, 62, 62);
        return img;
    };

    // Opponent lives
    overlay.appendChild(createLive(636, 695));
    overlay.appendChild(createLive(721, 695));

    // Player lives
    overlay.appendChild(createLive(636, 1369));
    overlay.appendChild(createLive(721, 1369));
}

// ─── Hand ────────────────────────────────────────────────────

function renderHand(overlay) {
    const s = getScale();
    const o = getBoardOffset();
    const areaLeft = 1163, areaTop = 1691, areaRight = 3018, areaBottom = 1932;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = `${areaLeft * s + o.left}px`;
    container.style.top = `${areaTop * s + o.top}px`;
    container.style.width = `${(areaRight - areaLeft) * s}px`;
    container.style.height = `${(areaBottom - areaTop) * s}px`;
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    playerHand.forEach((card, i) => {
        const img = document.createElement('img');
        img.src = card.karta;
        img.style.width = `${180 * s}px`;
        img.style.height = `${240 * s}px`;
        img.style.cursor = 'pointer';
        img.oncontextmenu = (e) => { e.preventDefault(); showPowiek(playerHand, i, 'hand'); };
        container.appendChild(img);
    });
    overlay.appendChild(container);
}

// ─── Graveyards ──────────────────────────────────────────────

function renderGraveyards(overlay) {
    const s = getScale();

    const gy = document.createElement('div');
    gy.className = 'graveyard-container';
    place(gy, 3142, 1691, 184, 241);

    if (playerGraveyard.length > 0) {
        const topCard = playerGraveyard[playerGraveyard.length - 1];
        gy.style.backgroundImage = `url('${topCard.karta}')`;
        gy.style.backgroundSize = 'contain';
        gy.style.cursor = 'pointer';
        gy.onclick = () => showPowiek(playerGraveyard, playerGraveyard.length - 1, 'game');
    }
    overlay.appendChild(gy);

    const ogy = document.createElement('div');
    ogy.className = 'graveyard-container o-graveyard';
    place(ogy, 3142, 222, 184, 241);
    ogy.style.transform = 'rotate(180deg)';
    overlay.appendChild(ogy);
}

// ─── Deck Piles (stacked reverses + count box) ──────────────

function renderPiles(overlay) {
    const s = getScale();
    const o = getBoardOffset();

    const renderStackedPile = (baseX, baseY, count, factionId, isOpponent) => {
        const reverseUrl = getFactionReverse(factionId || '1');
        const cardW = 184, cardH = 241;

        // Container to hold stacked cards
        const pileContainer = document.createElement('div');
        pileContainer.style.position = 'absolute';
        // Reserve space for the 1px offsets
        const offsetTotal = Math.max(0, count - 1);
        pileContainer.style.left = `${(baseX - offsetTotal) * s + o.left}px`;
        pileContainer.style.top = `${(baseY - offsetTotal) * s + o.top}px`;
        pileContainer.style.width = `${(cardW + offsetTotal) * s}px`;
        pileContainer.style.height = `${(cardH + offsetTotal) * s}px`;
        pileContainer.style.pointerEvents = 'none';

        // Render each card in the stack (bottom to top)
        for (let i = 0; i < count; i++) {
            const card = document.createElement('div');
            card.style.position = 'absolute';
            // Each card offset 1px from previous (bottom-right to top-left)
            const off = (count - 1 - i);
            card.style.left = `${off * s}px`;
            card.style.top = `${off * s}px`;
            card.style.width = `${cardW * s}px`;
            card.style.height = `${cardH * s}px`;
            card.style.backgroundImage = `url('${reverseUrl}')`;
            card.style.backgroundSize = 'cover';
            card.style.backgroundRepeat = 'no-repeat';
            if (i === count - 1) {
                // Top card is interactive (for player only)
                card.style.pointerEvents = 'auto';
            }
            pileContainer.appendChild(card);
        }

        // Right-click on player's pile to zoom
        if (!isOpponent && count > 0) {
            pileContainer.style.cursor = 'pointer';
            pileContainer.style.pointerEvents = 'auto';
            pileContainer.oncontextmenu = (e) => {
                e.preventDefault();
                if (window.showPowiek) window.showPowiek(drawPile, 0, 'game');
            };
        }

        overlay.appendChild(pileContainer);

        // Count box below/above the pile
        const boxX = isOpponent ? 3484 : 3493;
        const boxY = isOpponent ? 358 : 1901;
        const boxW = isOpponent ? (3583 - 3484) : (3591 - 3493);
        const boxH = isOpponent ? (432 - 358) : (1974 - 1901);

        const box = document.createElement('div');
        place(box, boxX, boxY, boxW, boxH);
        box.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        box.style.display = 'flex';
        box.style.justifyContent = 'center';
        box.style.alignItems = 'center';

        const countText = document.createElement('div');
        countText.style.color = '#c7a76e';
        countText.style.fontSize = `${boxH * 0.5 * s}px`;
        countText.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        countText.textContent = count;
        box.appendChild(countText);
        overlay.appendChild(box);
    };

    // Player pile
    renderStackedPile(3459, 1656, drawPile.length, window.playerFaction, false);
    // Opponent pile
    renderStackedPile(3459, 132, opponentDeckCount, window.opponentFaction, true);
}

// ─── Leaders ─────────────────────────────────────────────────

function renderLeaders(overlay) {
    const s = getScale();

    const createLeader = (leaderObj, x, y) => {
        if (!leaderObj) return;
        const img = document.createElement('img');
        img.src = leaderObj.karta;
        place(img, x, y, 184, 241);
        img.style.cursor = 'pointer';
        img.onclick = () => {
            if (window.showPowiek) window.showPowiek([leaderObj], 0, 'leaders');
        };
        overlay.appendChild(img);
    };

    createLeader(playerLeaderObj, 286, 1679);
    createLeader(opponentLeaderObj, 286, 174);
}
