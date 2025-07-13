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
    // Parametry obszaru na planszy 4K
    const areaLeft = 1163;
    const areaTop = 1691;
    const areaRight = 3018;
    const areaBottom = 1932;
    const areaWidth = areaRight - areaLeft;
    const areaHeight = areaBottom - areaTop;
    const cardGap = 6; // px względem planszy 4K
    // Przykładowy rozmiar karty (1:1 względem planszy, np. 200x300px)
    const cardWidth = 200;
    const cardHeight = 300;
    // Skala względem aktualnego rozmiaru overlay
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;
    const overlayRect = overlay.getBoundingClientRect();
    const scaleX = overlayRect.width / 3840;
    const scaleY = overlayRect.height / 2160;
    // Wylicz pozycje kart
    const cardsArea = document.createElement('div');
    cardsArea.style.position = 'absolute';
    cardsArea.style.left = `${areaLeft * scaleX + overlayRect.left}px`;
    cardsArea.style.top = `${areaTop * scaleY + overlayRect.top}px`;
    cardsArea.style.width = `${areaWidth * scaleX}px`;
    cardsArea.style.height = `${areaHeight * scaleY}px`;
    cardsArea.style.display = 'flex';
    cardsArea.style.alignItems = 'center';
    cardsArea.style.justifyContent = 'center';
    cardsArea.style.pointerEvents = 'none';
    // Oblicz przesunięcie kart (nachodzenie jeśli za dużo)
    let gap = cardGap * scaleX;
    let cardScaledWidth = cardWidth * scaleX;
    let cardScaledHeight = cardHeight * scaleY;
    let maxCards = Math.floor((areaWidth * scaleX + gap) / (cardScaledWidth + gap));
    let overlap = 0;
    if (deck.length > maxCards) {
        // Nachodzenie kart
        gap = ((areaWidth * scaleX) - cardScaledWidth) / (deck.length - 1);
        if (gap < 0) gap = 0;
        overlap = cardScaledWidth - gap;
    }
    // Wyśrodkuj karty
    const totalWidth = deck.length * cardScaledWidth + (deck.length - 1) * gap;
    let startX = (areaWidth * scaleX - totalWidth) / 2;
    deck.forEach((card, i) => {
        const cardDiv = document.createElement('img');
        cardDiv.src = card.karta;
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = `${startX + i * (cardScaledWidth + gap)}px`;
        cardDiv.style.top = `0px`;
        cardDiv.style.width = `${cardScaledWidth}px`;
        cardDiv.style.height = `${cardScaledHeight}px`;
        cardDiv.style.zIndex = 10 + i;
        cardDiv.style.boxShadow = '0 2px 8px #000a';
        cardsArea.appendChild(cardDiv);
    });
    document.body.appendChild(cardsArea);
});
