// Nowy plik gra.js - logika wyboru kart i startu gry
import cards from './cards.js';
import { showPowiek } from './powiek.js';
import { krole } from './krole.js';

let deck = [];
let timer = null;
let timeLeft = 60;

// --- SOCKET.IO RECONNECTION ---
const socket = typeof io !== 'undefined' ? io() : null;
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get('code');
const isHost = urlParams.get('host') === 'true';

if (socket && gameCode) {
    const nick = localStorage.getItem('nickname') || (isHost ? 'Host' : 'Przeciwnik');
    socket.emit('rejoin-game', { gameCode, isHost, nickname: nick });
    console.log(`Reconnected to board ${gameCode} as ${isHost ? 'host' : 'opponent'}`);

    if (window.ConnectionUI) {
        window.ConnectionUI.init(socket, gameCode, isHost, nick);
    }
}

function renderUI() {
    document.body.innerHTML = `
        <div class="game-setup">
            <h2>Wybierz karty do talii (min. 22)</h2>
            <div id="deck-status">Wybrano: ${deck.length} / 22</div>
            <button id="playButton">Graj</button>
            <div id="timer">Pozostały czas: ${timeLeft}s</div>
        </div>
    `;
    document.getElementById('playButton').onclick = onPlay;
}

function onPlay() {
    if (deck.length < 22) {
        alert('Musisz mieć co najmniej 22 karty w talii!');
        return;
    }
    clearInterval(timer);
    startGame(deck);
}

function startGame(finalDeck) {
    // Tutaj możesz przekierować do właściwej rozgrywki lub przekazać deck dalej
    document.body.innerHTML = `<h2>Twoja talia:</h2><pre>${JSON.stringify(finalDeck, null, 2)}</pre>`;
}

function autoFillDeck() {
    if (deck.length < 22) {
        // Dobierz brakujące karty z końca kolekcji
        const allCards = [...cards];
        for (let i = allCards.length - 1; i >= 0 && deck.length < 22; i--) {
            const card = allCards[i];
            // Sprawdź ile już masz tej karty
            const count = deck.filter(c => c.numer === card.numer).length;
            if (count < (card.ilosc || 1)) {
                deck.push({ ...card });
            }
        }
    }
    startGame(deck);
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        const timerDiv = document.getElementById('timer');
        if (timerDiv) timerDiv.textContent = `Pozostały czas: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (deck.length < 22) {
                autoFillDeck();
            } else {
                startGame(deck);
            }
        }
    }, 1000);
}

function renderCards() {
    const old = document.getElementById('cardsArea');
    if (old) old.remove();
    const GUI_WIDTH = 3839;
    const GUI_HEIGHT = 2159;
    const areaLeft = 1163;
    const areaTop = 1691;
    const areaRight = 3018;
    const areaBottom = 1932;
    const areaWidth = areaRight - areaLeft;
    const areaHeight = areaBottom - areaTop;
    const cardWidth = 180;
    const cardHeight = 240;
    const cardGap = 6;
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;
    const overlayRect = overlay.getBoundingClientRect();
    const overlayW = overlayRect.width;
    const overlayH = overlayRect.height;
    const scale = Math.min(overlayW / GUI_WIDTH, overlayH / GUI_HEIGHT);
    const boardW = GUI_WIDTH * scale;
    const boardH = GUI_HEIGHT * scale;
    const boardLeft = (overlayW - boardW) / 2;
    const boardTop = (overlayH - boardH) / 2;
    const areaL = areaLeft * scale + boardLeft;
    const areaT = areaTop * scale + boardTop;
    const areaW = areaWidth * scale;
    const areaH = areaHeight * scale;
    const cardsArea = document.createElement('div');
    cardsArea.id = 'cardsArea';
    cardsArea.style.position = 'absolute';
    cardsArea.style.left = `${areaL}px`;
    cardsArea.style.top = `${areaT}px`;
    cardsArea.style.width = `${areaW}px`;
    cardsArea.style.height = `${areaH}px`;
    cardsArea.style.pointerEvents = 'none';
    cardsArea.style.zIndex = 20;
    cardsArea.style.display = 'block';
    let cardW = cardWidth * scale;
    let cardH = cardHeight * scale;
    let gap = cardGap * scale;
    let n = deck.length;
    let realGap = gap;
    let startX = 0;
    if (n > 1) {
        let totalWidth = n * cardW + (n - 1) * gap;
        if (totalWidth > areaW) {
            // gap tak, by ostatnia karta kończyła się na prawej krawędzi
            realGap = (areaW - n * cardW) / (n - 1);
            startX = 0;
        } else {
            // wyśrodkuj
            realGap = gap;
            totalWidth = n * cardW + (n - 1) * realGap;
            startX = (areaW - totalWidth) / 2;
        }
    } else {
        // jedna karta - wyśrodkuj
        startX = (areaW - cardW) / 2;
    }
    deck.forEach((card, i) => {
        const cardDiv = document.createElement('img');
        cardDiv.src = card.karta;
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = `${startX + i * (cardW + realGap)}px`;
        cardDiv.style.top = `${(areaH - cardH) / 2}px`;
        cardDiv.style.width = `${cardW}px`;
        cardDiv.style.height = `${cardH}px`;
        cardDiv.style.objectFit = 'contain';
        cardDiv.style.aspectRatio = '3/4';
        cardDiv.style.zIndex = 10 + i;
        cardDiv.className = 'card';
        cardDiv.dataset.index = i;
        cardDiv.oncontextmenu = (e) => {
            e.preventDefault();
            showPowiek(deck, i, 'cards');
        };
        cardsArea.appendChild(cardDiv);
    });
    overlay.appendChild(cardsArea);
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

function renderRow(cards, rowKey) {
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;
    const row = ROWS[rowKey];
    const scaleW = window.innerWidth / 3837;
    const scaleH = window.innerHeight / 2158;
    const areaL = row.left * scaleW;
    const areaT = row.top * scaleH;
    const areaW = (row.right - row.left) * scaleW;
    const areaH = (row.bottom - row.top) * scaleH;
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
    let n = cards.length;
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
    cards.forEach((card, i) => {
        const cardDiv = document.createElement('img');
        cardDiv.src = card.karta;
        cardDiv.className = 'row-card card';
        cardDiv.dataset.index = i;
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = (startX + i * (cardW + realGap)) + 'px';
        cardDiv.style.top = ((areaH - cardH) / 2) + 'px';
        cardDiv.style.width = cardW + 'px';
        cardDiv.style.height = cardH + 'px';
        cardDiv.style.objectFit = 'contain';
        cardDiv.style.aspectRatio = '3/4';
        cardDiv.style.zIndex = 10 + i;
        cardDiv.oncontextmenu = (e) => {
            e.preventDefault();
            showPowiek(cards, i, 'cards');
        };
        rowDiv.appendChild(cardDiv);
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

// Funkcja do wyświetlania nicków na planszy
function showNicknames(playerNick, opponentNick) {
    const board = document.getElementById('gameBoard');
    if (!board) {
        console.warn('Nie znaleziono elementu #gameBoard!');
        return;
    }
    // Usuń stare nicki jeśli są
    board.querySelectorAll('.nick-player, .nick-opponent').forEach(e => e.remove());
    // Nick gracza
    const playerDiv = document.createElement('div');
    playerDiv.className = 'nick-player';
    playerDiv.textContent = playerNick;
    board.appendChild(playerDiv);
    // Nick przeciwnika
    const oppDiv = document.createElement('div');
    oppDiv.className = 'nick-opponent';
    oppDiv.textContent = opponentNick;
    board.appendChild(oppDiv);
}

// Przykład użycia po naciśnięciu "Graj":
showNicknames('TwójNick', 'PrzeciwnikNick');
// Właściwe nicki pobierz z logiki gry/sesji

document.addEventListener('DOMContentLoaded', () => {
    deck = JSON.parse(localStorage.getItem('deck') || '[]');
    renderCards();
    window.addEventListener('resize', renderCards);
});

// --- START: Losowanie ręki i wymiana kart na początku gry ---
function startHandDraw(deck) {
    let deckCopy = [...deck];
    let hand = [];
    for (let i = 0; i < 10 && deckCopy.length > 0; i++) {
        const idx = Math.floor(Math.random() * deckCopy.length);
        hand.push(deckCopy.splice(idx, 1)[0]);
    }
    let swaps = 0;
    let selectedIdx = 0;
    function showHandPowieka() {
        showPowiek(hand, selectedIdx, 'hand', {
            onCardClick: (cardIdx) => {
                selectedIdx = cardIdx;
                if (swaps < 2 && deckCopy.length > 0) {
                    const newIdx = Math.floor(Math.random() * deckCopy.length);
                    const newCard = deckCopy.splice(newIdx, 1)[0];
                    deckCopy.push(hand[cardIdx]);
                    hand[cardIdx] = newCard;
                    swaps++;
                    showHandPowieka();
                }
            },
            onEsc: () => {
                window.closePowiek && window.closePowiek();
                window.playerHand = hand;
            },
            onOk: () => {
                window.closePowiek && window.closePowiek();
                window.playerHand = hand;
            },
            swapsLeft: 2 - swaps,
            fontFamily: 'PFDinTextCondPro-Bold, Cinzel, serif',
            context: 'game'
        });
        document.onkeydown = function (e) {
            if (e.key === 'Enter' && swaps < 2 && deckCopy.length > 0) {
                const newIdx = Math.floor(Math.random() * deckCopy.length);
                const newCard = deckCopy.splice(newIdx, 1)[0];
                deckCopy.push(hand[selectedIdx]);
                hand[selectedIdx] = newCard;
                swaps++;
                showHandPowieka();
            }
            if (e.key === 'Escape') {
                window.closePowiek && window.closePowiek();
                window.playerHand = hand;
            }
        };
    }
    showHandPowieka();
}

document.addEventListener('DOMContentLoaded', () => {
    // Wczytaj talię gracza z localStorage
    const deck = JSON.parse(localStorage.getItem('deck') || '[]');
    if (deck && deck.length >= 10) {
        startHandDraw(deck);
    } else {
        // Możesz dodać komunikat o błędzie jeśli nie ma talii
        alert('Brak talii lub za mało kart!');
    }
});
// --- KONIEC: Losowanie ręki i wymiana kart na początku gry ---

export { renderRow, renderRog, renderExtraPile, renderLeaders };