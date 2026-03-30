/**
 * Moduł animacji kart.
 * Prędkość: 3480px/s w 4K (3840x2160).
 */

const GUI_WIDTH = 3840;
const GUI_HEIGHT = 2160;
const SPEED_4K = 3480; // px/s w skali 4K

// Pozycje w skali 4K
const PILE_PLAYER = { x: 3459, y: 1656 };
const PILE_OPPONENT = { x: 3459, y: 132 };
const HAND_CENTER = { x: 2090, y: 1811 };
const LEADER_PLAYER = { x: 286, y: 1679 };
const LEADER_OPPONENT = { x: 286, y: 174 };
const GRAVEYARD_PLAYER = { x: 3110, y: 1682 };
const GRAVEYARD_OPPONENT = { x: 3110, y: 168 };

function getScale() {
    return Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
}

function getBoardOffset() {
    const scale = getScale();
    return {
        left: (window.innerWidth - GUI_WIDTH * scale) / 2,
        top: (window.innerHeight - GUI_HEIGHT * scale) / 2
    };
}

function toScreenPos(guiX, guiY) {
    const scale = getScale();
    const offset = getBoardOffset();
    return {
        x: guiX * scale + offset.left,
        y: guiY * scale + offset.top
    };
}

function calcDuration(fromX, fromY, toX, toY) {
    const scale = getScale();
    const dx = (toX - fromX) * scale;
    const dy = (toY - fromY) * scale;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = SPEED_4K * scale;
    return dist / speed; // sekundy
}

// Pre-load common assets
const heroIconImg = new Image();
heroIconImg.src = 'assets/karty/bohater.webp';

/**
 * Animuje element (kratę) z pozycji A do B.
 * @param {HTMLElement} el - element do animowania
 * @param {{x:number,y:number}} from4K - pozycja źródłowa w skali 4K
 * @param {{x:number,y:number}} to4K - pozycja docelowa w skali 4K
 * @param {number} w4K - szerokość karty w skali 4K
 * @param {number} h4K - wysokość karty w skali 4K
 * @param {function} [onDone] - callback po zakończeniu
 */
export function animateElement(el, from4K, to4K, w4K, h4K, onDone) {
    const scale = getScale();
    const fromScreen = toScreenPos(from4K.x, from4K.y);
    const toScreen = toScreenPos(to4K.x, to4K.y);
    const duration = calcDuration(from4K.x, from4K.y, to4K.x, to4K.y);

    el.style.position = 'fixed';
    el.style.left = `${fromScreen.x}px`;
    el.style.top = `${fromScreen.y}px`;
    el.style.width = `${w4K * scale}px`;
    el.style.height = `${h4K * scale}px`;
    el.style.zIndex = '5000'; // Pod UI (które ma ~100k)
    el.style.pointerEvents = 'none';
    el.style.transition = `left ${duration}s ease-in-out, top ${duration}s ease-in-out`;
    document.body.appendChild(el);

    el._targetPos = toScreen;
    el._onDone = onDone;
    el._duration = duration;

    // Cleanup po zakończeniu
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        if (onDone) onDone();
    }, duration * 1000 + 50);
}

import { addCardPointsOverlay } from './game_board.js';

/**
 * Animuje kartę (obraz) z pozycji A do B. (Legacy support)
 */
export function animateCard(imgSrc, from4K, to4K, w4K, h4K, onDone) {
    const img = document.createElement('img');
    img.src = imgSrc;
    animateElement(img, from4K, to4K, w4K, h4K, onDone);
    
    // Start manually since this is a single call
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            img.style.left = `${img._targetPos.x}px`;
            img.style.top = `${img._targetPos.y}px`;
        });
    });
}

/**
 * Animuje kartę dowódcy z kupki na pozycję dowódcy.
 * @param {object} leaderObj - obiekt dowódcy (z polem .karta)
 * @param {function} [onDone] - callback
 */
export function animateLeaderFromDeck(leaderObj, onDone) {
    if (!leaderObj) { if (onDone) onDone(); return; }
    animateCard(
        leaderObj.karta,
        PILE_PLAYER,
        LEADER_PLAYER,
        180, 240,
        onDone
    );
}

export function animateOpponentLeaderFromDeck(leaderObj, onDone) {
    if (!leaderObj) { if (onDone) onDone(); return; }
    animateCard(
        leaderObj.karta,
        PILE_OPPONENT,
        LEADER_OPPONENT,
        180, 240,
        onDone
    );
}

/**
 * Tworzy element karty identyczny jak ten w ręce.
 */
function createCardElement(card, w4K, h4K) {
    const scale = getScale();
    const wrapper = document.createElement('div');
    wrapper.style.width = `${w4K * scale}px`;
    wrapper.style.height = `${h4K * scale}px`;
    wrapper.style.position = 'relative';

    const img = document.createElement('img');
    img.src = card.karta;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';
    wrapper.appendChild(img);

    addCardPointsOverlay(wrapper, card, w4K * scale, h4K * scale);
    
    return wrapper;
}

/**
 * Animuje karty z kupki do rąk (wszystkie naraz).
 * @param {Array} handCards - tablica obiektów kart
 * @param {Array} targets4K - tablica pozycji docelowych {x, y}
 * @param {function} [onAllDone] - callback po wszystkich
 * @param {function} [onCardDone] - callback po każdej karcie (przekazuje indeks)
 */
export function animateDeckToHand(handCards, targets4K, onAllDone, onCardDone, isOpponent = false) {
    if (!handCards || handCards.length === 0) {
        if (onAllDone) onAllDone();
        return;
    }
    
    const source = isOpponent ? PILE_OPPONENT : PILE_PLAYER;
    let done = 0;
    const count = handCards.length;
    const elements = [];

    handCards.forEach((card, i) => {
        const target = targets4K[i] || HAND_CENTER;
        const el = createCardElement(card, 180, 240);
        animateElement(el, source, target, 180, 240, () => {
            if (onCardDone) onCardDone(i);
            done++;
            if (done >= count && onAllDone) onAllDone();
        });
        elements.push(el);
    });

    // Jedno wywołanie dla wszystkich, aby ruszyły w tym samym momencie
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            elements.forEach(el => {
                el.style.left = `${el._targetPos.x}px`;
                el.style.top = `${el._targetPos.y}px`;
            });
        });
    });
}

/**
 * Animuje karty z pola walki do cmentarza.
 * @param {Array} cardsOnBoard - tablica {card, currentPos4K}
 * @param {boolean} isOpponent - czy to karty przeciwnika
 * @param {number} currentGraveyardCount - ile kart już jest w trupach
 * @param {function} [onAllDone] - callback
 */
export function animateBoardToGraveyard(cardsOnBoard, isOpponent, currentGraveyardCount, onAllDone) {
    if (!cardsOnBoard || cardsOnBoard.length === 0) {
        if (onAllDone) onAllDone();
        return;
    }

    const targetBase = isOpponent ? GRAVEYARD_OPPONENT : GRAVEYARD_PLAYER;
    let done = 0;
    const count = cardsOnBoard.length;
    const elements = [];

    cardsOnBoard.forEach((item, i) => {
        const card = item.card;
        const fromPos = item.currentPos4K;
        const offset = currentGraveyardCount + i;
        const target = {
            x: targetBase.x - offset,
            y: targetBase.y - offset
        };

        const el = createCardElement(card, 180, 240);
        animateElement(el, fromPos, target, 180, 240, () => {
            done++;
            if (done >= count && onAllDone) onAllDone();
        });
        elements.push(el);
    });

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            elements.forEach(el => {
                el.style.left = `${el._targetPos.x}px`;
                el.style.top = `${el._targetPos.y}px`;
            });
        });
    });
}

/**
 * Animuje kartę (obraz) z ręki z powrotem do talii.
 * @param {object} card - obiekt karty
 * @param {{x:number, y:number}} from4K - pozycja startowa w 4K
 * @param {function} [onDone] - callback
 */
export function animateCardToDeck(card, from4K, onDone) {
    const el = createCardElement(card, 180, 240);
    animateElement(el, from4K, PILE_PLAYER, 180, 240, onDone);
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.style.left = `${el._targetPos.x}px`;
            el.style.top = `${el._targetPos.y}px`;
        });
    });
}

