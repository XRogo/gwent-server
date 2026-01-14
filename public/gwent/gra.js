// Nowy plik gra.js - logika wyboru kart i startu gry
import cards from './cards.js';
import { showPowiek } from './powiek.js';
import { krole } from './krole.js';

let playerHand = [];
let drawPile = [];
let playerGraveyard = [];
let opponentHandCount = 10;
let opponentDeckCount = 12;
let opponentGraveyard = [];

// --- SOCKET.IO RECONNECTION ---
const socket = typeof io !== 'undefined' ? io() : null;
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get('code');
const isHost = urlParams.get('host') === 'true';
const nick = urlParams.get('nick') || (isHost ? 'Gospodarz' : 'Gość');

// Board State
let board = {
    my: { row1: [], row2: [], row3: [], horn1: null, horn2: null, horn3: null },
    opp: { row1: [], row2: [], row3: [], horn1: null, horn2: null, horn3: null }
};

if (socket && gameCode) {
    if (window.ConnectionUI) {
        window.ConnectionUI.init(socket, gameCode, isHost, nick);
    }

    socket.emit('rejoin-game', { gameCode, isHost, nickname: nick });
    socket.emit('get-game-state', { gameCode, isHost });

    socket.on('init-game-state', (data) => {
        if (data.hand) {
            playerHand = data.hand;
            drawPile = data.deck;
            playerGraveyard = data.graveyard || [];
            opponentHandCount = data.opponentHandCount;
            opponentDeckCount = data.opponentDeckCount;
            opponentGraveyard = data.opponentGraveyard || [];
            window.opponentFaction = data.opponentFaction;
            renderAll();
        } else {
            // First time entering the board
            startNewGame();
        }
    });

    socket.on('opponent-status', (data) => {
        // Refresh nicknames if changed
        const oppNick = isHost ? data.opponentNickname : data.hostNickname;
        if (oppNick) {
            window.opponentNickname = oppNick;
            renderNicknames();
        }
    });

    socket.on('opponent-game-update', (data) => {
        if (data.handCount !== undefined) opponentHandCount = data.handCount;
        if (data.deckCount !== undefined) opponentDeckCount = data.deckCount;
        if (data.graveyardCount !== undefined) opponentGraveyardCount = data.graveyardCount;
        if (data.faction !== undefined) window.opponentFaction = data.faction;
        renderAll();
    });

    socket.on('opponent-played-card', (data) => {
        // Basic sync for opponent playing a card (logical stub)
        console.log('Opponent played card:', data.card, 'to row:', data.rowIndex);
        // In a real implementation, we'd add it to a board state and render
    });
}

function startNewGame() {
    // If the server already provided a hand via init-game-state, we don't need to generate it
    if (playerHand && playerHand.length > 0) {
        console.log("Using server-provided hand");
        startMulligan();
        return;
    }

    const fullDeck = JSON.parse(localStorage.getItem('deck') || '[]');
    if (fullDeck.length < 22) {
        alert('Talia jest niekompletna!');
        window.location.href = `game.html?code=${gameCode}&host=${isHost}&nick=${encodeURIComponent(nick)}`;
        return;
    }

    // Sort deck by cards.js index to maintain order
    const sortedDeck = [...fullDeck].sort((a, b) => {
        const idxA = cards.findIndex(c => c.numer === a.numer);
        const idxB = cards.findIndex(c => c.numer === b.numer);
        return idxA - idxB;
    });

    // Draw 10 cards (Fallback)
    let deckCopy = [...sortedDeck];
    playerHand = [];
    for (let i = 0; i < 10 && deckCopy.length > 0; i++) {
        const randIdx = Math.floor(Math.random() * deckCopy.length);
        playerHand.push(deckCopy.splice(randIdx, 1)[0]);
    }

    // Sort hand by cards.js index
    playerHand.sort((a, b) => {
        const idxA = cards.findIndex(c => c.numer === a.numer);
        const idxB = cards.findIndex(c => c.numer === b.numer);
        return idxA - idxB;
    });

    drawPile = deckCopy;

    // Save to server
    saveState();

    // Start Mulligan
    startMulligan();
}

function saveState() {
    socket.emit('save-game-state', {
        gameCode,
        isHost,
        gameState: {
            hand: playerHand,
            deck: drawPile,
            graveyard: playerGraveyard,
            faction: localStorage.getItem('faction') || "1"
        }
    });
}

function startMulligan() {
    let swaps = 0;
    let selectedIdx = 0;

    function refreshMulligan() {
        showPowiek(playerHand, selectedIdx, 'hand', {
            isMulligan: true,
            swapsLeft: 2 - swaps,
            onSwap: (idx) => {
                if (swaps < 2 && drawPile.length > 0) {
                    const newCardIdx = Math.floor(Math.random() * drawPile.length);
                    const newCard = drawPile.splice(newCardIdx, 1)[0];
                    const oldCard = playerHand[idx];

                    playerHand[idx] = newCard;
                    drawPile.push(oldCard);

                    // Re-sort hand only if you want, but user might prefer to see the new card in the same spot
                    // Let's re-sort to keep it consistent with game rules
                    playerHand.sort((a, b) => {
                        const idxA = cards.findIndex(c => c.numer === a.numer);
                        const idxB = cards.findIndex(c => c.numer === b.numer);
                        return idxA - idxB;
                    });

                    swaps++;
                    selectedIdx = playerHand.indexOf(newCard);

                    // Save state "nabierząco" after each swap
                    saveState();

                    if (swaps >= 2) {
                        setTimeout(() => {
                            closeMulligan();
                        }, 500); // Small delay to show the last card
                    } else {
                        refreshMulligan();
                    }
                } else {
                    closeMulligan();
                }
            },
            onClose: () => {
                // If it's closed via ESC, we accept the current hand
                closeMulligan();
            }
        });
    }

    function closeMulligan() {
        if (window.closePowiek) window.closePowiek();
        saveState();
        renderAll();
    }

    refreshMulligan();
}

function renderAll() {
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;
    overlay.innerHTML = '';

    renderHand();
    renderNicknames();
    renderGraveyards();
    renderPiles();
}

function renderHand() {
    const overlay = document.querySelector('.overlay');
    const GUI_WIDTH = 3840;
    const GUI_HEIGHT = 2160;
    const areaLeft = 1163;
    const areaTop = 1691;
    const areaRight = 3018;
    const areaBottom = 1932;

    const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
    const boardW = GUI_WIDTH * scale;
    const boardH = GUI_HEIGHT * scale;
    const boardLeft = (window.innerWidth - boardW) / 2;
    const boardTop = (window.innerHeight - boardH) / 2;

    const areaW = (areaRight - areaLeft) * scale;
    const areaH = (areaBottom - areaTop) * scale;

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = `${areaLeft * scale + boardLeft}px`;
    container.style.top = `${areaTop * scale + boardTop}px`;
    container.style.width = `${areaW}px`;
    container.style.height = `${areaH}px`;
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    const cardW = 180 * scale;
    const cardH = 240 * scale;
    const n = playerHand.length;
    const gap = (n > 1) ? Math.min(10 * scale, (areaW - n * cardW) / (n - 1)) : 0;

    playerHand.forEach((card, i) => {
        const img = document.createElement('img');
        img.src = card.karta;
        img.style.width = `${cardW}px`;
        img.style.height = `${cardH}px`;
        img.style.marginRight = i === n - 1 ? '0' : `${gap}px`;
        img.style.cursor = 'pointer';
        img.oncontextmenu = (e) => {
            e.preventDefault();
            showPowiek(playerHand, i, 'hand');
        };
        container.appendChild(img);
    });

    overlay.appendChild(container);
}

function renderNicknames() {
    const overlay = document.querySelector('.overlay');
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardW = 3840 * scale;
    const boardH = 2160 * scale;
    const boardLeft = (window.innerWidth - boardW) / 2;
    const boardTop = (window.innerHeight - boardH) / 2;

    // Przeciwnik: {483, 569} do {850, 602}
    const oppX = 483 * scale + boardLeft;
    const oppY = 569 * scale + boardTop;
    const oppW = (850 - 483) * scale;
    const oppH = (602 - 569) * scale;

    // Ty: {483, 1498} do {850, 1532}
    const selfX = 483 * scale + boardLeft;
    const selfY = 1498 * scale + boardTop;
    const selfW = (850 - 483) * scale;
    const selfH = (1532 - 1498) * scale;

    const createNick = (name, x, y, w, h) => {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.style.width = `${w}px`;
        div.style.height = `${h}px`;
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.color = '#c7a76e';
        div.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        div.style.fontSize = `${32 * scale}px`;
        div.style.fontWeight = 'bold';
        div.style.textShadow = '2px 2px 2px #000';
        div.textContent = name;
        return div;
    };

    const oppNickDisplay = window.opponentNickname || 'PRZECIWNIK';
    overlay.appendChild(createNick(oppNickDisplay, oppX, oppY, oppW, oppH));
    overlay.appendChild(createNick(nick, selfX, selfY, selfW, selfH));
}

function renderGraveyards() {
    const overlay = document.querySelector('.overlay');
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardW = 3840 * scale;
    const boardH = 2160 * scale;
    const boardLeft = (window.innerWidth - boardW) / 2;
    const boardTop = (window.innerHeight - boardH) / 2;

    const gX = 3111 * scale + boardLeft;
    const gY = 1680 * scale + boardTop;
    const cardW = 180 * scale;
    const cardH = 240 * scale;

    // Stacking offset: 2px up and 2px left for each card
    playerGraveyard.forEach((card, i) => {
        const img = document.createElement('img');
        img.src = card.karta;
        img.style.position = 'absolute';
        img.style.left = `${gX - (i * 2 * scale)}px`;
        img.style.top = `${gY - (i * 2 * scale)}px`;
        img.style.width = `${cardW}px`;
        img.style.height = `${cardH}px`;
        img.style.zIndex = 50 + i;
        img.style.borderRadius = `${8 * scale}px`;
        overlay.appendChild(img);
    });
}

function renderPiles() {
    const overlay = document.querySelector('.overlay');
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardW = 3840 * scale;
    const boardH = 2160 * scale;
    const boardLeft = (window.innerWidth - boardW) / 2;
    const boardTop = (window.innerHeight - boardH) / 2;

    const myFaction = localStorage.getItem('faction') || "1";
    const pileAsset = getFactionReverse(myFaction);

    // Twoja talia: 3457, 1654
    const selfX = 3457 * scale + boardLeft;
    const selfY = 1654 * scale + boardTop;

    // Talia przeciwnika: 3457, 131
    const oppX = 3457 * scale + boardLeft;
    const oppY = 131 * scale + boardTop;

    const cardW = 180 * scale;
    const cardH = 240 * scale;

    const renderPile = (x, y, count, isOpponent) => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
        container.style.width = `${cardW}px`;
        container.style.height = `${cardH}px`;

        const img = document.createElement('img');
        img.src = isOpponent ? getFactionReverse(window.opponentFaction || "0") : pileAsset;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.objectPosition = 'top';
        img.style.borderRadius = `${8 * scale}px`;
        container.appendChild(img);

        // Count overlay coordinates based on faction reverso layout
        // ty: 3487, 1889 x 3587, 1963
        // przeciwnik: 3483, 358 x 3583, 433
        let badgeX, badgeY, badgeW, badgeH;
        if (isOpponent) {
            badgeX = (3483 - 3457) * scale;
            badgeY = (358 - 131) * scale;
            badgeW = (3583 - 3483) * scale;
            badgeH = (433 - 358) * scale;
        } else {
            badgeX = (3487 - 3457) * scale;
            badgeY = (1889 - 1654) * scale;
            badgeW = (3587 - 3487) * scale;
            badgeH = (1963 - 1889) * scale;
        }

        const badge = document.createElement('div');
        badge.style.position = 'absolute';
        badge.style.left = `${badgeX}px`;
        badge.style.top = `${badgeY}px`;
        badge.style.width = `${badgeW}px`;
        badge.style.height = `${badgeH}px`;
        badge.style.background = 'rgba(0,0,0,0.9)';
        badge.style.color = '#c7a76e';
        badge.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        badge.style.fontSize = `${38 * scale}px`;
        badge.style.fontWeight = 'bold';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.textContent = count;
        container.appendChild(badge);

        return container;
    };

    overlay.appendChild(renderPile(selfX, selfY, drawPile.length, false));
    overlay.appendChild(renderPile(oppX, oppY, opponentDeckCount, true));
}

function getFactionReverse(factionId) {
    switch (factionId) {
        case "1": return "/gwent/assets/asety/polnoc.webp";
        case "2": return "/gwent/assets/asety/nilftgard_rewers.webp";
        case "3": return "/gwent/assets/asety/scoia'tel_rewers.webp";
        case "4": return "/gwent/assets/asety/potwory_rewers.webp";
        case "5": return "/gwent/assets/asety/skelige_rewers.webp";
        default: return "/gwent/assets/asety/polnoc.webp";
    }
}

// Pozycje rzędów kart na planszy 4K
const ROWS = {
    enemy_obl: { left: 1412, top: 29, right: 3021, bottom: 268 },
    enemy_luk: { left: 1412, top: 294, right: 3021, bottom: 533 },
    enemy_piech: { left: 1412, top: 565, right: 3021, bottom: 804 },
    player_piech: { left: 1412, top: 863, right: 3021, bottom: 1102 },
    player_luk: { left: 1412, top: 1129, right: 3021, bottom: 1368 },
    player_obl: { left: 1412, top: 1407, right: 3021, bottom: 1646 }
};

function renderRow(cardsInRow, rowKey) {
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;
    const row = ROWS[rowKey];
    const scaleW = window.innerWidth / 3837;
    const scaleH = window.innerHeight / 2158;
    const areaL = row.left * scaleW;
    const areaT = row.top * scaleH;
    const areaW = (row.right - row.left) * scaleW;
    const areaH = (row.bottom - row.top) * scaleH;

    // Sorting: Special cards first, then units by punkty ascending
    const sortedCards = [...cardsInRow].sort((a, b) => {
        if (a.punkty === undefined && b.punkty !== undefined) return -1;
        if (a.punkty !== undefined && b.punkty === undefined) return 1;
        if (a.punkty === undefined && b.punkty === undefined) return (a.numer || '').localeCompare(b.numer || '');
        return a.punkty - b.punkty;
    });

    const rowDiv = document.createElement('div');
    rowDiv.className = 'row-area';
    rowDiv.style.position = 'absolute';
    rowDiv.style.left = areaL + 'px';
    rowDiv.style.top = areaT + 'px';
    rowDiv.style.width = areaW + 'px';
    rowDiv.style.height = areaH + 'px';
    rowDiv.style.zIndex = 30;
    rowDiv.style.pointerEvents = 'none';

    let cardW = 180 * scaleW;
    let cardH = 240 * scaleH;
    let gap = 6 * scaleW;
    let n = sortedCards.length;
    let realGap = gap;
    let startX = 0;

    if (n > 1) {
        let totalWidth = n * cardW + (n - 1) * gap;
        if (totalWidth > areaW) {
            realGap = (areaW - n * cardW) / (n - 1);
            startX = 0;
        } else {
            realGap = gap;
            totalWidth = n * cardW + (n - 1) * realGap;
            startX = (areaW - totalWidth) / 2;
        }
    } else {
        startX = (areaW - cardW) / 2;
    }

    sortedCards.forEach((card, i) => {
        const div = document.createElement('div');
        div.className = 'row-card card small-card';
        div.dataset.index = i;
        div.style.position = 'absolute';
        div.style.left = (startX + i * (cardW + realGap)) + 'px';
        div.style.top = ((areaH - cardH) / 2) + 'px';
        div.style.width = cardW + 'px';
        div.style.height = cardH + 'px';
        div.style.backgroundImage = `url(${card.karta})`;
        div.style.backgroundSize = 'cover';
        div.style.borderRadius = `${8 * scaleW}px`;
        div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
        div.style.zIndex = 10 + i;

        // Points badge (coord: 19,12-45,52) - only for non-heroes with points
        if (card.punkty !== undefined && !card.bohater) {
            const pointsData = document.createElement('div');
            pointsData.style.position = 'absolute';
            pointsData.style.left = '3.6%';   // 19/523
            pointsData.style.top = '1.2%';    // 12/992
            pointsData.style.width = '4.97%'; // (45-19)/523
            pointsData.style.height = '4.03%'; // (52-12)/992
            pointsData.style.color = '#000';
            pointsData.style.fontSize = `${24 * scaleW}px`;
            pointsData.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
            pointsData.style.display = 'flex';
            pointsData.style.alignItems = 'center';
            pointsData.style.justifyContent = 'center';
            pointsData.style.fontWeight = 'bold';
            pointsData.textContent = card.punkty;
            div.appendChild(pointsData);
        }

        div.oncontextmenu = (e) => {
            e.preventDefault();
            showPowiek(sortedCards, i, 'cards');
        };
        rowDiv.appendChild(div);
    });
    overlay.appendChild(rowDiv);
}

function renderRog(rowKey, isPlayer) {
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;
    const row = ROWS[rowKey];
    const scaleW = window.innerWidth / 3837;
    const scaleH = window.innerHeight / 2158;
    const left = 1182 * scaleW;
    const right = 1361 * scaleW;
    const top = row.top * scaleH;
    const areaH = (row.bottom - row.top) * scaleH;
    const rogDiv = document.createElement('img');
    rogDiv.src = '/gwent/assets/asety/rog.webp';
    rogDiv.className = 'rog-dowodcy';
    rogDiv.style.position = 'absolute';
    rogDiv.style.left = left + 'px';
    rogDiv.style.top = (top + areaH / 2 - 40 * scaleH) + 'px';
    rogDiv.style.width = (right - left) + 'px';
    rogDiv.style.height = (80 * scaleH) + 'px';
    rogDiv.style.zIndex = 50;
    overlay.appendChild(rogDiv);
}

function renderExtraPile(cards, isPlayer) {
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;
    const pos = isPlayer ? { left: 3457, top: 1654 } : { left: 3457, top: 131 };
    const scaleW = window.innerWidth / 3837;
    const scaleH = window.innerHeight / 2158;
    const pileDiv = document.createElement('div');
    pileDiv.className = 'extra-pile';
    pileDiv.style.position = 'absolute';
    pileDiv.style.left = (pos.left * scaleW) + 'px';
    pileDiv.style.top = (pos.top * scaleH) + 'px';
    pileDiv.style.width = (100 * scaleW) + 'px';
    pileDiv.style.height = (80 * scaleH) + 'px';
    pileDiv.style.background = 'rgba(0,0,0,0.9)';
    pileDiv.style.borderRadius = '12px';
    pileDiv.style.zIndex = 100;
    pileDiv.style.display = 'flex';
    pileDiv.style.flexDirection = 'column';
    pileDiv.style.alignItems = 'center';
    pileDiv.style.justifyContent = 'center';
    cards.forEach((card, i) => {
        const img = document.createElement('img');
        img.src = card.karta;
        img.style.position = 'absolute';
        img.style.left = (2 * i) + 'px';
        img.style.top = (2 * i) + 'px';
        img.style.width = (60 * scaleW) + 'px';
        img.style.height = (80 * scaleH) + 'px';
        img.style.zIndex = 10 + i;
        pileDiv.appendChild(img);
    });
    const liczbaDiv = document.createElement('div');
    liczbaDiv.className = 'extra-pile-count';
    liczbaDiv.innerText = cards.length;
    liczbaDiv.style.position = 'absolute';
    liczbaDiv.style.left = '0';
    liczbaDiv.style.top = '0';
    liczbaDiv.style.width = '100%';
    liczbaDiv.style.height = '100%';
    liczbaDiv.style.display = 'flex';
    liczbaDiv.style.alignItems = 'center';
    liczbaDiv.style.justifyContent = 'center';
    liczbaDiv.style.fontFamily = 'PFDinTextCondPro-Bold, Cinzel, serif';
    liczbaDiv.style.fontWeight = 'bold';
    liczbaDiv.style.fontSize = (38 * scaleW) + 'px';
    liczbaDiv.style.color = '#c7a76e';
    liczbaDiv.style.zIndex = 1000;
    pileDiv.appendChild(liczbaDiv);
    overlay.appendChild(pileDiv);
}

function renderLeaders() {
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;
    const leadersArea = document.createElement('div');
    leadersArea.className = 'leaders-area';
    leadersArea.style.position = 'absolute';
    leadersArea.style.left = '50%';
    leadersArea.style.top = '10%';
    leadersArea.style.transform = 'translateX(-50%)';
    leadersArea.style.zIndex = 100;
    leadersArea.style.display = 'flex';
    leadersArea.style.gap = '32px';
    krole.forEach((krol, i) => {
        const div = document.createElement('div');
        div.className = 'leader-card';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.cursor = 'pointer';
        div.oncontextmenu = (e) => {
            e.preventDefault();
            showPowiek(krole, i, 'leaders');
        };
        const img = document.createElement('img');
        img.src = krol.dkarta;
        img.style.width = '180px';
        img.style.height = '240px';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '12px';
        img.style.boxShadow = '0 0 16px #000';
        div.appendChild(img);
        const nameDiv = document.createElement('div');
        nameDiv.innerText = krol.nazwa;
        nameDiv.style.fontFamily = 'PFDinTextCondPro-Bold, Cinzel, serif';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = '#c7a76e';
        nameDiv.style.fontSize = '1.2em';
        nameDiv.style.marginTop = '8px';
        div.appendChild(nameDiv);
        leadersArea.appendChild(div);
    });
    overlay.appendChild(leadersArea);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initial render will happen after socket init
    window.addEventListener('resize', renderAll);
});

export { renderRow, renderRog, renderExtraPile, renderLeaders, renderAll };