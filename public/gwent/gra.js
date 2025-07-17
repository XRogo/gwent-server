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
        cardsArea.appendChild(cardDiv);
    });
    overlay.appendChild(cardsArea);
}

document.addEventListener('DOMContentLoaded', () => {
    deck = JSON.parse(localStorage.getItem('deck') || '[]');
    renderCards();
    window.addEventListener('resize', renderCards);
});