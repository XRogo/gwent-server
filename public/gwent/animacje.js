/**
 * Moduł animacji kart.
 * Prędkość: 3480px/s w 4K (3840x2160).
 */

const GUI_WIDTH = 3840;
const GUI_HEIGHT = 2160;
const SPEED_4K = 3480; // px/s w skali 4K

// Pozycje w skali 4K
const PILE_PLAYER = { x: 3459, y: 1656 };
const HAND_CENTER = { x: 2090, y: 1811 };
const LEADER_PLAYER = { x: 286, y: 1679 };

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

/**
 * Animuje kartę (obraz) z pozycji A do B.
 * @param {string} imgSrc - ścieżka do obrazka
 * @param {{x:number,y:number}} from4K - pozycja źródłowa w skali 4K
 * @param {{x:number,y:number}} to4K - pozycja docelowa w skali 4K
 * @param {number} w4K - szerokość karty w skali 4K
 * @param {number} h4K - wysokość karty w skali 4K
 * @param {function} [onDone] - callback po zakończeniu
 * @returns {HTMLElement} - element animacji (do ewentualnego usunięcia)
 */
export function animateCard(imgSrc, from4K, to4K, w4K, h4K, onDone) {
    const scale = getScale();
    const fromScreen = toScreenPos(from4K.x, from4K.y);
    const toScreen = toScreenPos(to4K.x, to4K.y);
    const duration = calcDuration(from4K.x, from4K.y, to4K.x, to4K.y);

    const el = document.createElement('img');
    el.src = imgSrc;
    el.style.position = 'fixed';
    el.style.left = `${fromScreen.x}px`;
    el.style.top = `${fromScreen.y}px`;
    el.style.width = `${w4K * scale}px`;
    el.style.height = `${h4K * scale}px`;
    el.style.zIndex = '50000';
    el.style.pointerEvents = 'none';
    el.style.transition = `left ${duration}s ease-in-out, top ${duration}s ease-in-out`;
    document.body.appendChild(el);

    // Uruchom animację w następnej klatce
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.style.left = `${toScreen.x}px`;
            el.style.top = `${toScreen.y}px`;
        });
    });

    // Cleanup po zakończeniu
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        if (onDone) onDone();
    }, duration * 1000 + 50);

    return el;
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

/**
 * Animuje N kart z kupki do ręki (z opóźnieniami).
 * @param {number} count - ile kart
 * @param {string} factionId - frakcja (do wybrania rewersu)
 * @param {function} [onAllDone] - callback po wszystkich
 */
const factionReverseMap = {
    "1": "polnoc_rewers.webp",
    "2": "nilftgard_rewers.webp",
    "3": "scoia'tel_rewers.webp",
    "4": "potwory_rewers.webp",
    "5": "skelige_rewers.webp"
};

export function animateDeckToHand(count, factionId, onAllDone) {
    const reverseSrc = `assets/asety/${factionReverseMap[factionId] || factionReverseMap["1"]}`;
    let done = 0;
    const delay = 100; // ms między kolejnymi kartami

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            animateCard(
                reverseSrc,
                PILE_PLAYER,
                HAND_CENTER,
                175, 300,
                () => {
                    done++;
                    if (done >= count && onAllDone) onAllDone();
                }
            );
        }, i * delay);
    }

    // Fallback jeśli count = 0
    if (count === 0 && onAllDone) onAllDone();
}
