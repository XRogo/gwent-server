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
const isPlayer1 = urlParams.get('host') === 'true';
const nick = urlParams.get('nick') || (isPlayer1 ? 'Gospodarz' : 'Gość');

// State tracking for mulligan
let swapsCount = 0;

// Board State
let board = {
    my: { row1: [], row2: [], row3: [], horn1: null, horn2: null, horn3: null },
    opp: { row1: [], row2: [], row3: [], horn1: null, horn2: null, horn3: null }
};

if (socket && gameCode) {
    if (window.ConnectionUI) {
        window.ConnectionUI.init(socket, gameCode, isPlayer1, nick);
    }

    socket.emit('rejoin-game', { gameCode, isPlayer1, nickname: nick });
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

            // Check if we need to start mulligan
            if (!window.gameStarted && data.status === 'playing') {
                window.gameStarted = true;
                startMulligan();
            } else {
                renderAll();
            }
        } else {
            console.error("No hand data from server!");
        }
    });

    socket.on('opponent-status', (data) => {
        const oppNick = isPlayer1 ? data.player2Nickname : data.player1Nickname;
        if (oppNick) {
            window.opponentNickname = oppNick;
            renderNicknames();
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

        if (swapsLeft <= 0) {
            setTimeout(() => {
                closeMulligan();
            }, 500);
        } else {
            startMulligan(playerHand.indexOf(newCard));
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
        console.log('Opponent played card:', data.card, 'to row:', data.rowIndex);
    });

    socket.on('message-from-p1', (msg) => {
        console.log("P1 says:", msg);
    });

    socket.on('message-from-p2', (data) => {
        console.log("P2 says:", data.message);
    });
}

function startNewGame() {
    console.log("Waiting for server state...");
}

function saveState() {
    socket.emit('save-game-state', {
        gameCode,
        isPlayer1,
        gameState: {
            hand: playerHand,
            faction: localStorage.getItem('faction') || "1"
        }
    });
}

function startMulligan(selectedIndex = 0) {
    showPowiek(playerHand, selectedIndex, 'hand', {
        isMulligan: true,
        swapsLeft: 2 - swapsCount,
        onSwap: (idx) => {
            if (swapsCount < 2) {
                socket.emit('mulligan-swap', { gameCode, isPlayer1, cardIndex: idx });
            } else {
                closeMulligan();
            }
        },
        onClose: () => {
            closeMulligan();
        }
    });
}

function closeMulligan() {
    if (window.hidePowiek) window.hidePowiek();
    else if (window.closePowiek) window.closePowiek();
    renderAll();
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

    // Licznik kart w ręce przeciwnika
    const oppHandCountDiv = document.createElement('div');
    oppHandCountDiv.style.position = 'absolute';
    oppHandCountDiv.style.left = `${oppX}px`;
    oppHandCountDiv.style.top = `${oppY + 45 * scale}px`;
    oppHandCountDiv.style.width = `${oppW}px`;
    oppHandCountDiv.style.height = `${oppH}px`;
    oppHandCountDiv.style.display = 'flex';
    oppHandCountDiv.style.alignItems = 'center';
    oppHandCountDiv.style.justifyContent = 'center';
    oppHandCountDiv.style.color = '#fff';
    oppHandCountDiv.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
    oppHandCountDiv.style.fontSize = `${24 * scale}px`;
    oppHandCountDiv.style.textShadow = '1px 1px 2px #000';
    oppHandCountDiv.textContent = `Karty: ${opponentHandCount}`;
    overlay.appendChild(oppHandCountDiv);
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

    // Pozycje 4K: 3458, 1655 (Ty) i 3458, 132 (Przeciwnik)
    const selfArea = { left: 3458, top: 1655, right: 3632, bottom: 1954 };
    const oppArea = { left: 3458, top: 132, right: 3632, bottom: 431 };

    const scaleW = window.innerWidth / 3837;
    const scaleH = window.innerHeight / 2158;

    const cardW = (selfArea.right - selfArea.left) * scaleW;
    const cardH = (selfArea.bottom - selfArea.top) * scaleH;

    const renderPile = (area, count, isOpponent) => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = `${area.left * scaleW}px`;
        container.style.top = `${area.top * scaleH}px`;
        container.style.width = `${cardW}px`;
        container.style.height = `${cardH}px`;

        const factionId = isOpponent ? (window.opponentFaction || "0") : myFaction;
        const asset = getFactionReverse(factionId);

        // Renderowanie kart w stosie (przesunięcie 0.5px na kartę)
        // Maksymalnie np. 10 kart wizualnie, żeby nie obciążać DOM
        const visualCount = Math.min(count, 15);
        for (let i = 0; i < visualCount; i++) {
            const img = document.createElement('img');
            img.src = asset;
            img.style.position = 'absolute';
            img.style.left = `-${i * 0.5 * scaleW}px`;
            img.style.top = `-${i * 0.5 * scaleH}px`;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = `${8 * scaleW}px`;
            img.style.zIndex = i;
            container.appendChild(img);
        }

        // Czarny obszar na licznik (90% krycia) - pozycje z infoo.txt skalowane do kontenera
        // Gracz: 3487, 1889 x 3587, 1963 wewnątrz 3458, 1655 x 3632, 1954
        // Przeciwnik: 3483, 358 x 3583, 433 wewnątrz 3458, 132 x 3632, 431
        let badgeX, badgeY, badgeW, badgeH;
        if (isOpponent) {
            badgeX = (3483 - 3458) * scaleW;
            badgeY = (358 - 132) * scaleH;
            badgeW = (3583 - 3483) * scaleW;
            badgeH = (433 - 358) * scaleH;
        } else {
            badgeX = (3487 - 3458) * scaleW;
            badgeY = (1889 - 1655) * scaleH;
            badgeW = (3587 - 3487) * scaleW;
            badgeH = (1963 - 1889) * scaleH;
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
        badge.style.fontSize = `${38 * scaleW}px`;
        badge.style.fontWeight = 'bold';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.zIndex = 1000;
        badge.textContent = count;
        container.appendChild(badge);

        return container;
    };

    overlay.appendChild(renderPile(selfArea, drawPile.length, false));
    overlay.appendChild(renderPile(oppArea, opponentDeckCount, true));
}

function getFactionReverse(factionId) {
    switch (String(factionId)) {
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