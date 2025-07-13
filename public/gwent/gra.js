// Nowy plik gra.js - logika wyboru kart i startu gry
import cards from './cards.js';

let deck = [];
let timer = null;
let timeLeft = 60;

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

document.addEventListener('DOMContentLoaded', () => {
    deck = JSON.parse(localStorage.getItem('deck') || '[]');
    // Obszar na planszy 4K
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
    // Procentowe pozycjonowanie względem overlay
    const leftPercent = areaLeft / GUI_WIDTH * 100;
    const topPercent = areaTop / GUI_HEIGHT * 100;
    const widthPercent = areaWidth / GUI_WIDTH * 100;
    const heightPercent = areaHeight / GUI_HEIGHT * 100;
    // Kontener na karty
    const cardsArea = document.createElement('div');
    cardsArea.style.position = 'absolute';
    cardsArea.style.left = `${leftPercent}%`;
    cardsArea.style.top = `${topPercent}%`;
    cardsArea.style.width = `${widthPercent}%`;
    cardsArea.style.height = `${heightPercent}%`;
    cardsArea.style.pointerEvents = 'none';
    cardsArea.style.zIndex = 20;
    cardsArea.style.display = 'flex';
    cardsArea.style.alignItems = 'center';
    cardsArea.style.justifyContent = 'center';
    // Wylicz przesunięcie kart
    let gapPx = cardGap;
    let cardScaledWidth = cardWidth;
    let cardScaledHeight = cardHeight;
    if (deck.length <= 10) {
        gapPx = cardGap;
    } else {
        gapPx = ((areaWidth - cardWidth) / (deck.length - 1));
        if (gapPx < 0) gapPx = 0;
    }
    // Przelicz na procent szerokości overlay
    const gapPercent = gapPx / areaWidth * 100;
    const cardWidthPercent = cardScaledWidth / areaWidth * 100;
    const cardHeightPercent = cardScaledHeight / areaHeight * 100;
    // Wyśrodkuj karty względem obszaru
    let totalWidthPercent = deck.length * cardWidthPercent + (deck.length - 1) * gapPercent;
    let startPercent = (100 - totalWidthPercent) / 2;
    deck.forEach((card, i) => {
        const cardDiv = document.createElement('img');
        cardDiv.src = card.dkarta;
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = `${startPercent + i * (cardWidthPercent + gapPercent)}%`;
        cardDiv.style.top = `${(100 - cardHeightPercent) / 2}%`;
        cardDiv.style.width = `${cardWidthPercent}%`;
        cardDiv.style.height = `${cardHeightPercent}%`;
        cardDiv.style.zIndex = 10 + i;
        cardDiv.style.objectFit = 'contain';
        cardsArea.appendChild(cardDiv);
    });
    overlay.appendChild(cardsArea);
});