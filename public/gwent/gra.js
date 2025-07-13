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
    const overlayRect = overlay.getBoundingClientRect();
    const scaleX = overlayRect.width / GUI_WIDTH;
    const scaleY = overlayRect.height / GUI_HEIGHT;
    // Kontener na karty
    const cardsArea = document.createElement('div');
    cardsArea.style.position = 'absolute';
    cardsArea.style.left = `${areaLeft * scaleX + overlayRect.left}px`;
    cardsArea.style.top = `${areaTop * scaleY + overlayRect.top}px`;
    cardsArea.style.width = `${areaWidth * scaleX}px`;
    cardsArea.style.height = `${areaHeight * scaleY}px`;
    cardsArea.style.pointerEvents = 'none';
    cardsArea.style.zIndex = 20;
    // Wylicz przesunięcie kart
    let gap = cardGap * scaleX;
    let cardScaledWidth = cardWidth * scaleX;
    let cardScaledHeight = cardHeight * scaleY;
    let totalWidth;
    if (deck.length <= 10) {
        totalWidth = deck.length * cardScaledWidth + (deck.length - 1) * gap;
    } else {
        gap = ((areaWidth * scaleX) - cardScaledWidth) / (deck.length - 1);
        if (gap < 0) gap = 0;
        totalWidth = deck.length * cardScaledWidth + (deck.length - 1) * gap;
    }
    // Wyśrodkuj karty względem obszaru
    let startX = ((areaWidth * scaleX) - totalWidth) / 2;
    deck.forEach((card, i) => {
        const cardDiv = document.createElement('img');
        cardDiv.src = card.dkarta;
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = `${startX + i * (cardScaledWidth + gap)}px`;
        cardDiv.style.top = `${((areaHeight * scaleY) - cardScaledHeight) / 2}px`;
        cardDiv.style.width = `${cardScaledWidth}px`;
        cardDiv.style.height = `${cardScaledHeight}px`;
        cardDiv.style.zIndex = 10 + i;
        cardDiv.style.objectFit = 'contain';
        cardsArea.appendChild(cardDiv);
    });
    document.body.appendChild(cardsArea);
});