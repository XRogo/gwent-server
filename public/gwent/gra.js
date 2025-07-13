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
    // Stały rozmiar karty względem planszy
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
    const scaleX = overlay.offsetWidth / 3839;
    const scaleY = overlay.offsetHeight / 2159;
    // Kontener na karty
    const cardsArea = document.createElement('div');
    cardsArea.style.position = 'absolute';
    cardsArea.style.left = `${areaLeft * scaleX + overlay.offsetLeft}px`;
    cardsArea.style.top = `${areaTop * scaleY + overlay.offsetTop}px`;
    cardsArea.style.width = `${areaWidth * scaleX}px`;
    cardsArea.style.height = `${areaHeight * scaleY}px`;
    cardsArea.style.pointerEvents = 'none';
    cardsArea.style.zIndex = 20;
    // Wylicz przesunięcie kart
    let gap = cardGap;
    const maxCards = Math.floor((areaWidth + gap) / (cardWidth + gap));
    if (deck.length > maxCards) {
        gap = ((areaWidth - cardWidth) / (deck.length - 1));
        if (gap < 0) gap = 0;
    }
    // Wyśrodkuj karty względem obszaru
    const totalWidth = deck.length * cardWidth + (deck.length - 1) * gap;
    let startX = (areaWidth - totalWidth) / 2;
    deck.forEach((card, i) => {
        const cardDiv = document.createElement('img');
        cardDiv.src = card.dkarta;
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = `${(startX + i * (cardWidth + gap)) * scaleX}px`;
        cardDiv.style.top = `0px`;
        cardDiv.style.width = `${cardWidth * scaleX}px`;
        cardDiv.style.height = `${cardHeight * scaleY}px`;
        cardDiv.style.zIndex = 10 + i;
        cardsArea.appendChild(cardDiv);
    });
    overlay.appendChild(cardsArea);
});
