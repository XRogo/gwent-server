import * as moce from './moce.js';
import { krole } from './krole.js';
import { getPowerImage, renderCardHTML } from './bcard_render.js';

let powiekIndex = 0;
let powiekDeck = [];
let powiekActive = false;
let powiekMode = 'cards';
let powiekOptions = {};

// Carousel
let currentAnimPos = 0;
let targetAnimIndex = 0;
let animStartTime = 0;
let animStartPos = 0;
let animTargetPos = 0;
let animDuration = 200;
let isAnimating = false;
let animFrameId = null;

// Pointer / drag
let isDragging = false;
let pointerPending = false;
let dragStartX = 0;
let dragStartPos = 0;
let lastPointerX = 0;
let lastPointerTime = 0;
let dragVelocityX = 0;
let activePointerId = null;
let pointerDownClientX = 0;
let pointerDownClientY = 0;
const DRAG_THRESHOLD_PX = 10;

// Double-click (mulligan / medic)
let lastCentralClickTime = 0;
let lastCentralClickIndex = -1;

// Blokada zamknięcia po long-press
let powiekCloseLocked = false;
let powiekCloseUnlockHandler = null;

// Info box cache
let lastRenderedInfoIndex = null;

const powiekBlockScroll = (e) => {
    if (e.cancelable) e.preventDefault();
    return false;
};

function linearEase(t) {
    return t;
}

function isForcedSelectMode() {
    return !!(powiekOptions && powiekOptions.isMedic);
}

function isSelectionMode() {
    return !powiekOptions?.isMulligan
        && !isForcedSelectMode()
        && (powiekMode === 'cards' || powiekMode === 'leaders'
            || window.powiekSourceArea === 'collection'
            || window.powiekSourceArea === 'deck'
            || window.powiekSourceArea === 'leaders');
}

function isFreeGamePreview() {
    return powiekMode === 'game' && !isForcedSelectMode() && !powiekOptions?.isMulligan;
}

function isTouchLikeEvent(e) {
    if (!e) return false;
    if (e.pointerType === 'touch' || e.pointerType === 'pen') return true;
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents === true) return true;
    return false;
}

function isCoarsePointer() {
    try {
        return window.matchMedia && window.matchMedia('(hover: none)').matches;
    } catch (_) {
        return false;
    }
}

function lockCloseUntilPointerUp() {
    powiekCloseLocked = true;
    if (powiekCloseUnlockHandler) {
        const old = powiekCloseUnlockHandler;
        window.removeEventListener('pointerup', old, true);
        window.removeEventListener('pointercancel', old, true);
        window.removeEventListener('touchend', old, true);
        window.removeEventListener('touchcancel', old, true);
    }
    powiekCloseUnlockHandler = () => {
        powiekCloseLocked = false;
        const h = powiekCloseUnlockHandler;
        powiekCloseUnlockHandler = null;
        if (h) {
            window.removeEventListener('pointerup', h, true);
            window.removeEventListener('pointercancel', h, true);
            window.removeEventListener('touchend', h, true);
            window.removeEventListener('touchcancel', h, true);
        }
    };
    window.addEventListener('pointerup', powiekCloseUnlockHandler, true);
    window.addEventListener('pointercancel', powiekCloseUnlockHandler, true);
    window.addEventListener('touchend', powiekCloseUnlockHandler, true);
    window.addEventListener('touchcancel', powiekCloseUnlockHandler, true);
}

function clearCloseLock() {
    powiekCloseLocked = false;
    if (powiekCloseUnlockHandler) {
        const h = powiekCloseUnlockHandler;
        powiekCloseUnlockHandler = null;
        window.removeEventListener('pointerup', h, true);
        window.removeEventListener('pointercancel', h, true);
        window.removeEventListener('touchend', h, true);
        window.removeEventListener('touchcancel', h, true);
    }
}

function tryHidePowiek() {
    if (!powiekActive) return;
    if (powiekCloseLocked) return;
    if (isForcedSelectMode()) return;
    hidePowiek();
}

/** Obsługa kliknięcia w kartę (skrajna / środkowa) — wspólna dla pointer i fallback onclick */
function handlePowiekCardTap(idx) {
    if (!powiekActive || powiekCloseLocked) return;
    if (idx < 0 || idx >= powiekDeck.length) return;

    const card = powiekDeck[idx];
    if (!card) return;

    // Skrajne → zawsze wycentruj
    if (idx !== targetAnimIndex) {
        startAnimationTo(idx);
        return;
    }

    // ——— Środkowa ———
    if (powiekMode === 'leaders') {
        if (window.selectLeader) window.selectLeader(card.numer);
        tryHidePowiek();
        return;
    }

    if (powiekOptions && powiekOptions.isMulligan) {
        const now = performance.now();
        if (lastCentralClickIndex === idx && (now - lastCentralClickTime) <= 750) {
            lastCentralClickTime = 0;
            lastCentralClickIndex = -1;
            if (powiekOptions.onSwap) powiekOptions.onSwap(idx);
        } else {
            lastCentralClickTime = now;
            lastCentralClickIndex = idx;
        }
        return;
    }

    if (isForcedSelectMode() || (powiekOptions && powiekOptions.onSelect && powiekMode === 'game')) {
        const now = performance.now();
        if (lastCentralClickIndex === idx && (now - lastCentralClickTime) <= 750) {
            lastCentralClickTime = 0;
            lastCentralClickIndex = -1;
            if (powiekOptions.onSelect) powiekOptions.onSelect(card);
        } else {
            lastCentralClickTime = now;
            lastCentralClickIndex = idx;
        }
        return;
    }
}

export function showPowiek(deck, index, mode = 'cards', options = {}) {
    powiekOptions = options;
    if (mode === 'hand' || mode === 'game') {
        powiekDeck = deck;
    } else {
        const uniqueDeck = [];
        const seenNumbers = new Set();
        for (const card of deck) {
            if (!seenNumbers.has(card.numer)) {
                uniqueDeck.push(card);
                seenNumbers.add(card.numer);
            }
        }
        powiekDeck = uniqueDeck;
    }

    powiekIndex = Math.max(0, Math.min(powiekDeck.length - 1, index));
    currentAnimPos = powiekIndex;
    targetAnimIndex = powiekIndex;
    isAnimating = false;
    isDragging = false;
    pointerPending = false;
    lastCentralClickTime = 0;
    lastCentralClickIndex = -1;
    lastRenderedInfoIndex = null;
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    powiekActive = true;
    powiekMode = mode;
    window.currentPowiekIndex = powiekIndex;
    window.isPowiekOpen = true;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('wheel', powiekBlockScroll, { passive: false });
    window.addEventListener('touchmove', powiekBlockScroll, { passive: false });
    window.addEventListener('keydown', powiekBlockScroll, { passive: false });
    window.showPowiek = showPowiek;
    window.hidePowiek = hidePowiek;

    lockCloseUntilPointerUp();

    buildPowiekDOM();
    updatePowiekFrame();
}

export function hidePowiek() {
    powiekActive = false;
    window.isPowiekOpen = false;
    isAnimating = false;
    isDragging = false;
    pointerPending = false;
    clearCloseLock();
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }

    const el = document.getElementById('powiekOverlay');
    if (el) el.remove();
    const powiekBg = document.getElementById('powiekBg');
    if (powiekBg) powiekBg.remove();

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.removeEventListener('wheel', powiekBlockScroll, { passive: false });
    window.removeEventListener('touchmove', powiekBlockScroll, { passive: false });
    window.removeEventListener('keydown', powiekBlockScroll, { passive: false });

    if (powiekOptions && powiekOptions.onClose) powiekOptions.onClose();
}

export function renderPowiek() {
    if (!powiekActive || powiekDeck.length === 0) return;
    buildPowiekDOM();
    updatePowiekFrame();
}

function getLayoutGeometry() {
    const TLO_W = 3837;
    const TLO_H = 2158;
    const windowAspectRatio = window.innerWidth / window.innerHeight;
    const tloAspectRatio = TLO_W / TLO_H;
    let scale, backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop;

    if (windowAspectRatio > tloAspectRatio) {
        scale = window.innerHeight / TLO_H;
        backgroundWidth = TLO_W * scale;
        backgroundHeight = window.innerHeight;
        backgroundLeft = (window.innerWidth - backgroundWidth) / 2;
        backgroundTop = 0;
    } else {
        scale = window.innerWidth / TLO_W;
        backgroundWidth = window.innerWidth;
        backgroundHeight = TLO_H * scale;
        backgroundLeft = 0;
        backgroundTop = (window.innerHeight - backgroundHeight) / 2;
    }

    const relW = (px) => (px / TLO_W) * backgroundWidth;
    const relH = (px) => (px / TLO_H) * backgroundHeight;

    const slotConfigs = {
        "-3": { left: relW(-500), top: relH(444), width: relW(360), height: relH(683), zIndex: 20 },
        "-2": { left: relW(468), top: relH(444), width: relW(431), height: relH(817), zIndex: 40 },
        "-1": { left: relW(1040), top: relH(444), width: relW(523), height: relH(992), zIndex: 50 },
        "0": { left: relW(1617), top: relH(456), width: relW(605), height: relH(1153), zIndex: 100 },
        "1": { left: relW(2274), top: relH(444), width: relW(525), height: relH(992), zIndex: 50 },
        "2": { left: relW(2938), top: relH(444), width: relW(433), height: relH(817), zIndex: 40 },
        "3": { left: relW(3900), top: relH(444), width: relW(360), height: relH(683), zIndex: 20 }
    };

    return {
        TLO_W, TLO_H,
        scale, backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop,
        relW, relH,
        slotConfigs
    };
}

function interpolateSlotGeometry(offset, slotConfigs) {
    const clampedOffset = Math.max(-3, Math.min(3, offset));
    const lowerSlot = Math.floor(clampedOffset);
    const upperSlot = Math.ceil(clampedOffset);

    if (lowerSlot === upperSlot) {
        const cfg = slotConfigs[String(lowerSlot)] || slotConfigs["0"];
        return { ...cfg };
    }

    const t = clampedOffset - lowerSlot;
    const cfgA = slotConfigs[String(lowerSlot)] || slotConfigs["-3"];
    const cfgB = slotConfigs[String(upperSlot)] || slotConfigs["3"];

    return {
        left: cfgA.left + (cfgB.left - cfgA.left) * t,
        top: cfgA.top + (cfgB.top - cfgA.top) * t,
        width: cfgA.width + (cfgB.width - cfgA.width) * t,
        height: cfgA.height + (cfgB.height - cfgA.height) * t,
        zIndex: Math.abs(clampedOffset) < 0.5 ? 100 : (Math.abs(clampedOffset) < 1.5 ? 60 : 40)
    };
}

function buildPowiekDOM() {
    const oldOverlay = document.getElementById('powiekOverlay');
    if (oldOverlay) oldOverlay.remove();
    const oldBg = document.getElementById('powiekBg');
    if (oldBg) oldBg.remove();
    if (!powiekActive || powiekDeck.length === 0) return;

    const geo = getLayoutGeometry();

    const powiekBg = document.createElement('div');
    powiekBg.id = 'powiekBg';
    powiekBg.style.position = 'absolute';
    powiekBg.style.left = geo.backgroundLeft + 'px';
    powiekBg.style.top = geo.backgroundTop + 'px';
    powiekBg.style.width = geo.backgroundWidth + 'px';
    powiekBg.style.height = geo.backgroundHeight + 'px';
    powiekBg.style.zIndex = '99998';
    powiekBg.style.pointerEvents = 'none';
    powiekBg.style.backgroundImage = "url('assets/asety/tłopowiek.webp')";
    powiekBg.style.backgroundSize = 'cover';
    powiekBg.style.backgroundPosition = 'center';
    powiekBg.style.backgroundRepeat = 'no-repeat';
    powiekBg.style.opacity = '1';
    powiekBg.style.overflow = 'hidden';
    document.body.appendChild(powiekBg);

    const overlay = document.createElement('div');
    overlay.id = 'powiekOverlay';
    overlay.className = 'powiek-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = geo.backgroundLeft + 'px';
    overlay.style.top = geo.backgroundTop + 'px';
    overlay.style.width = geo.backgroundWidth + 'px';
    overlay.style.height = geo.backgroundHeight + 'px';
    overlay.style.zIndex = '99999';
    overlay.style.pointerEvents = 'auto';
    overlay.style.overflow = 'hidden';
    overlay.style.touchAction = 'none';
    overlay.style.userSelect = 'none';

    overlay.onclick = (e) => {
        // Klik w kartę obsługuje pointerup / handlePowiekCardTap — tu tylko tło
        if (e.target.closest('.powiek-card')) return;
        if (powiekCloseLocked) return;
        if (isForcedSelectMode()) {
            e.stopPropagation();
            return;
        }

        if (isTouchLikeEvent(e) || isCoarsePointer()) {
            tryHidePowiek();
            return;
        }

        if (powiekOptions && powiekOptions.isMulligan) {
            e.stopPropagation();
            return;
        }
        if (powiekMode === 'cards' || powiekMode === 'leaders' || isSelectionMode() || isFreeGamePreview()) {
            e.stopPropagation();
            return;
        }

        tryHidePowiek();
    };

    const cardsContainer = document.createElement('div');
    cardsContainer.id = 'powiekCardsContainer';
    cardsContainer.style.position = 'absolute';
    cardsContainer.style.left = '0';
    cardsContainer.style.top = '0';
    cardsContainer.style.width = '100%';
    cardsContainer.style.height = '100%';
    cardsContainer.style.overflow = 'hidden';
    cardsContainer.style.pointerEvents = 'auto';
    overlay.appendChild(cardsContainer);

    const infoContainer = document.createElement('div');
    infoContainer.id = 'powiekInfoContainer';
    infoContainer.style.position = 'absolute';
    infoContainer.style.left = '0';
    infoContainer.style.top = '0';
    infoContainer.style.width = '100%';
    infoContainer.style.height = '100%';
    infoContainer.style.pointerEvents = 'none';
    overlay.appendChild(infoContainer);

    if (powiekOptions && powiekOptions.isMulligan) {
        const swapInfo = document.createElement('div');
        swapInfo.id = 'powiek-swap-info';
        swapInfo.style.position = 'absolute';
        swapInfo.style.bottom = '5%';
        swapInfo.style.left = '50%';
        swapInfo.style.transform = 'translateX(-50%)';
        swapInfo.style.color = '#c7a76e';
        swapInfo.style.fontFamily = 'PFDinTextCondPro-Bold';
        swapInfo.style.fontSize = geo.relW(48) + 'px';
        swapInfo.style.textShadow = '2px 2px 4px #000';
        swapInfo.style.zIndex = '300';
        swapInfo.textContent = `Pozostałe wymiany: ${powiekOptions.swapsLeft}`;
        overlay.appendChild(swapInfo);

        const helpInfo = document.createElement('div');
        helpInfo.style.position = 'absolute';
        helpInfo.style.bottom = '2%';
        helpInfo.style.left = '50%';
        helpInfo.style.transform = 'translateX(-50%)';
        helpInfo.style.color = '#fff';
        helpInfo.style.fontFamily = 'PFDinTextCondPro';
        helpInfo.style.fontSize = geo.relW(28) + 'px';
        helpInfo.style.zIndex = '300';
        helpInfo.textContent = 'Podwójny klik / Enter - wymień | Prawy / Esc - zakończ';
        overlay.appendChild(helpInfo);

        const timerUI = document.createElement('div');
        timerUI.id = 'powiek-timer';
        timerUI.style.position = 'absolute';
        timerUI.style.top = '5%';
        timerUI.style.left = '50%';
        timerUI.style.transform = 'translateX(-50%)';
        timerUI.style.color = '#ff4d4d';
        timerUI.style.fontFamily = 'PFDinTextCondPro-Bold';
        timerUI.style.fontSize = geo.relW(48) + 'px';
        timerUI.style.textShadow = '2px 2px 4px #000';
        timerUI.style.zIndex = '300';
        overlay.appendChild(timerUI);
    }

    attachPointerHandlers(overlay);
    document.body.appendChild(overlay);
}

function cardIndexFromPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return -1;
    const cardEl = el.closest('.powiek-card');
    if (!cardEl || cardEl.dataset.deckIndex === undefined) return -1;
    return parseInt(cardEl.dataset.deckIndex, 10);
}

function attachPointerHandlers(overlay) {
    overlay.onpointerdown = (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        // NIE capture od razu — inaczej ginie klik w karty
        pointerPending = true;
        isDragging = false;
        activePointerId = e.pointerId;
        dragStartX = e.clientX;
        dragStartPos = currentAnimPos;
        lastPointerX = e.clientX;
        lastPointerTime = performance.now();
        dragVelocityX = 0;
        pointerDownClientX = e.clientX;
        pointerDownClientY = e.clientY;
    };

    overlay.onpointermove = (e) => {
        if (e.pointerId !== activePointerId) return;
        if (!pointerPending && !isDragging) return;

        const absDx = Math.abs(e.clientX - dragStartX);

        if (pointerPending && !isDragging) {
            if (absDx < DRAG_THRESHOLD_PX) return;

            isDragging = true;
            pointerPending = false;

            if (isAnimating) {
                isAnimating = false;
                if (animFrameId) {
                    cancelAnimationFrame(animFrameId);
                    animFrameId = null;
                }
            }

            // Capture dopiero przy prawdziwym przeciąganiu
            try {
                overlay.setPointerCapture(e.pointerId);
            } catch (err) {}
        }

        if (!isDragging) return;

        const now = performance.now();
        const dt = now - lastPointerTime;
        const dx = e.clientX - lastPointerX;
        if (dt > 0) dragVelocityX = dx / dt;
        lastPointerX = e.clientX;
        lastPointerTime = now;

        const geo = getLayoutGeometry();
        const slotDistancePx = Math.max(100, geo.relW(605));
        const totalDx = e.clientX - dragStartX;
        let newPos = dragStartPos - (totalDx / slotDistancePx);
        newPos = Math.max(-0.5, Math.min(powiekDeck.length - 0.5, newPos));

        currentAnimPos = newPos;
        targetAnimIndex = Math.max(0, Math.min(powiekDeck.length - 1, Math.round(newPos)));
        powiekIndex = targetAnimIndex;
        window.currentPowiekIndex = powiekIndex;
        updatePowiekFrame();
    };

    const handlePointerEnd = (e) => {
        if (e.pointerId !== activePointerId) return;

        const wasDragging = isDragging;
        const totalDx = e.clientX - dragStartX;

        pointerPending = false;
        isDragging = false;
        activePointerId = null;

        try {
            if (overlay.hasPointerCapture && overlay.hasPointerCapture(e.pointerId)) {
                overlay.releasePointerCapture(e.pointerId);
            }
        } catch (err) {}

        // TAP (bez drag) → obsłuż klik w kartę
        if (!wasDragging && Math.abs(totalDx) < DRAG_THRESHOLD_PX) {
            const idx = cardIndexFromPoint(
                e.clientX || pointerDownClientX,
                e.clientY || pointerDownClientY
            );
            if (idx >= 0) {
                handlePowiekCardTap(idx);
            }
            return;
        }

        // Koniec drag → snap / fling
        const geo = getLayoutGeometry();
        const slotDistancePx = Math.max(100, geo.relW(605));
        let targetIndex = Math.round(currentAnimPos);

        if (Math.abs(dragVelocityX) > 0.3) {
            const cardsJump = Math.round((dragVelocityX * 220) / slotDistancePx);
            targetIndex = Math.round(currentAnimPos - cardsJump);
        }

        targetIndex = Math.max(0, Math.min(powiekDeck.length - 1, targetIndex));

        if (Math.abs(currentAnimPos - targetIndex) > 0.001 || targetIndex !== targetAnimIndex) {
            startAnimationTo(targetIndex);
        } else {
            currentAnimPos = targetIndex;
            targetAnimIndex = targetIndex;
            powiekIndex = targetIndex;
            window.currentPowiekIndex = targetIndex;
            updatePowiekFrame();
        }
    };

    overlay.onpointerup = handlePointerEnd;
    overlay.onpointercancel = handlePointerEnd;
}

const klikAudio = new Audio('assets/sound/klik.mp3');
function playPowiekClickSound() {
    try {
        klikAudio.currentTime = 0;
        klikAudio.play().catch(() => {});
    } catch (_) {}
}

function startAnimationTo(targetIdx) {
    targetIdx = Math.max(0, Math.min(powiekDeck.length - 1, targetIdx));
    if (targetIdx !== targetAnimIndex) {
        playPowiekClickSound();
    }
    targetAnimIndex = targetIdx;
    powiekIndex = targetIdx;
    window.currentPowiekIndex = targetIdx;

    animStartPos = currentAnimPos;
    animTargetPos = targetIdx;
    animStartTime = performance.now();
    animDuration = 200;
    isAnimating = true;

    if (animFrameId) cancelAnimationFrame(animFrameId);

    updateInfoBox(targetIdx);
    animFrameId = requestAnimationFrame(animationStep);
}

function queueDelta(delta) {
    const newTarget = Math.max(0, Math.min(powiekDeck.length - 1, targetAnimIndex + delta));
    if (newTarget === targetAnimIndex && Math.abs(currentAnimPos - targetAnimIndex) < 0.001) return;

    if (newTarget !== targetAnimIndex) {
        playPowiekClickSound();
    }
    targetAnimIndex = newTarget;
    powiekIndex = newTarget;
    window.currentPowiekIndex = newTarget;

    animStartPos = currentAnimPos;
    animTargetPos = newTarget;
    animStartTime = performance.now();
    animDuration = 200;
    isAnimating = true;

    if (animFrameId) cancelAnimationFrame(animFrameId);

    updateInfoBox(newTarget);
    animFrameId = requestAnimationFrame(animationStep);
}

function animationStep(now) {
    if (!powiekActive) {
        isAnimating = false;
        return;
    }

    const elapsed = now - animStartTime;
    const progress = Math.min(1, elapsed / animDuration);
    const eased = linearEase(progress);

    currentAnimPos = animStartPos + (animTargetPos - animStartPos) * eased;
    updatePowiekFrame();

    if (progress < 1) {
        animFrameId = requestAnimationFrame(animationStep);
    } else {
        currentAnimPos = animTargetPos;
        isAnimating = false;
        animFrameId = null;
        updatePowiekFrame();
    }
}

function updatePowiekFrame() {
    const container = document.getElementById('powiekCardsContainer');
    if (!container || !powiekActive || powiekDeck.length === 0) return;

    const geo = getLayoutGeometry();

    const currentElements = new Map();
    Array.from(container.children).forEach(el => {
        if (el.dataset && el.dataset.deckIndex !== undefined) {
            currentElements.set(parseInt(el.dataset.deckIndex, 10), el);
        }
    });

    const neededIndices = new Set();
    const minPos = Math.min(currentAnimPos, targetAnimIndex);
    const maxPos = Math.max(currentAnimPos, targetAnimIndex);
    const startIdx = Math.max(0, Math.floor(minPos) - 3);
    const endIdx = Math.min(powiekDeck.length - 1, Math.ceil(maxPos) + 3);

    for (let idx = startIdx; idx <= endIdx; idx++) neededIndices.add(idx);

    if (isAnimating || isDragging) {
        currentElements.forEach((_, idx) => neededIndices.add(idx));
    }

    currentElements.forEach((el, idx) => {
        if (!neededIndices.has(idx)) el.remove();
    });

    neededIndices.forEach(idx => {
        let cardDiv = currentElements.get(idx);
        const card = powiekDeck[idx];
        if (!card) return;
        const isCardLeader = powiekMode === 'leaders'
            || Boolean(card.umiejetnosc)
            || (card.numer && parseInt(card.numer) >= 1000 && parseInt(card.numer) <= 6000);

        if (!cardDiv) {
            cardDiv = document.createElement('div');
            cardDiv.className = 'powiek-card';
            cardDiv.dataset.deckIndex = String(idx);
            cardDiv.style.position = 'absolute';
            cardDiv.style.overflow = 'visible';
            cardDiv.style.willChange = 'left, top, width, height';

            const inner = document.createElement('div');
            inner.className = 'inner-card-wrapper';
            inner.style.position = 'absolute';
            inner.style.left = '0';
            inner.style.top = '0';
            inner.style.width = '100%';
            inner.style.height = '100%';
            // Klik idzie przez pointer na overlay — dzieci nie muszą łapać pointerów do drag,
            // ale elementFromPoint musi widzieć kartę
            inner.style.pointerEvents = 'none';

            const factionId = localStorage.getItem('faction') || window.selectedFaction || '1';
            inner.innerHTML = renderCardHTML(card, {
                playerFaction: factionId,
                isLargeView: true,
                isKing: isCardLeader
            });

            cardDiv.appendChild(inner);
            // Fallback gdyby pointer nie obsłużył (np. starsze przeglądarki)
            cardDiv.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            container.appendChild(cardDiv);
        }

        const continuousOffset = idx - currentAnimPos;
        const geom = interpolateSlotGeometry(continuousOffset, geo.slotConfigs);

        const isNearCenter = Math.abs(continuousOffset) < 0.05;
        const isStaticAtCenter = isNearCenter && !isAnimating && !isDragging;

        cardDiv.style.left = geom.left + 'px';
        cardDiv.style.top = geom.top + 'px';
        cardDiv.style.width = geom.width + 'px';
        cardDiv.style.height = geom.height + 'px';
        cardDiv.style.zIndex = geom.zIndex;

        let glow1 = cardDiv.querySelector('.powiek-podsw');
        let glow2 = cardDiv.querySelector('.powiek-podsw2');

        if (isStaticAtCenter && !isCardLeader) {
            cardDiv.classList.add('powiek-central');
            const actionable = powiekMode === 'leaders'
                || (powiekOptions && (powiekOptions.isMulligan || powiekOptions.isMedic || powiekOptions.onSelect))
                || window.powiekSourceArea === 'collection'
                || window.powiekSourceArea === 'deck';
            cardDiv.style.cursor = actionable ? 'pointer' : 'default';

            if (!glow1) {
                glow1 = document.createElement('img');
                glow1.src = 'assets/dkarty/podsw.webp';
                glow1.className = 'poswiata powiek-podsw';
                glow1.style.position = 'absolute';
                glow1.style.left = '-19.885277%';
                glow1.style.top = '-1.108871%';
                glow1.style.width = '139.344168%';
                glow1.style.height = '102.318548%';
                glow1.style.maxWidth = 'none';
                glow1.style.objectFit = 'fill';
                glow1.style.zIndex = '0';
                glow1.style.pointerEvents = 'none';
                cardDiv.insertBefore(glow1, cardDiv.firstChild);

                glow2 = document.createElement('img');
                glow2.src = 'assets/dkarty/podsw2.webp';
                glow2.className = 'poswiata powiek-podsw2';
                glow2.style.position = 'absolute';
                glow2.style.left = '-19.885277%';
                glow2.style.top = '-1.108871%';
                glow2.style.width = '139.344168%';
                glow2.style.height = '102.318548%';
                glow2.style.maxWidth = 'none';
                glow2.style.objectFit = 'fill';
                glow2.style.zIndex = '1';
                glow2.style.animation = 'powiek-pulse-start-transparent 1.5s infinite';
                glow2.style.pointerEvents = 'none';
                cardDiv.insertBefore(glow2, glow1.nextSibling);
            }
        } else {
            cardDiv.classList.remove('powiek-central');
            cardDiv.style.cursor = 'pointer';
            if (glow1) glow1.remove();
            if (glow2) glow2.remove();
        }

        const inner = cardDiv.querySelector('.inner-card-wrapper');
        if (inner) {
            const h = geom.height;
            const w = geom.width;
            const pointsDiv = inner.querySelector('.points');
            if (pointsDiv) pointsDiv.style.fontSize = (h * 0.10) + 'px';
            const nameDiv = inner.querySelector('.name');
            if (nameDiv) {
                nameDiv.style.fontSize = (h * (36 / 992)) + 'px';
                nameDiv.style.letterSpacing = (w * (0.6 / 523)) + 'px';
            }
            const descriptionDiv = inner.querySelector('.description');
            if (descriptionDiv) {
                descriptionDiv.style.display = 'block';
                descriptionDiv.style.fontSize = (h * (33 / 992)) + 'px';
                descriptionDiv.style.letterSpacing = (w * (0.4 / 523)) + 'px';
            }
        }
    });

    updateInfoBox(targetAnimIndex);
}

function updateInfoBox(targetIdx) {
    const infoContainer = document.getElementById('powiekInfoContainer');
    if (!infoContainer) return;

    if (lastRenderedInfoIndex === targetIdx && infoContainer.children.length > 0) return;
    lastRenderedInfoIndex = targetIdx;
    infoContainer.innerHTML = '';

    const card0 = powiekDeck[targetIdx];
    if (!card0) return;

    const geo = getLayoutGeometry();
    const isLeader = powiekMode === 'leaders'
        || Boolean(card0.umiejetnosc)
        || (card0.numer && parseInt(card0.numer) >= 1000 && parseInt(card0.numer) <= 6000);
    const hasZrecznoscOnly = !isLeader && Number(card0.pozycja) === 4 && !card0.moc;

    if (!(card0.moc || (isLeader && card0.umiejetnosc) || hasZrecznoscOnly)) return;

    const infoBox = document.createElement('img');
    infoBox.src = 'assets/asety/infor.webp';
    infoBox.style.position = 'absolute';
    infoBox.style.left = geo.relW(1356) + 'px';
    infoBox.style.top = geo.relH(1661) + 'px';
    infoBox.style.width = geo.relW(1123) + 'px';
    infoBox.style.height = geo.relH(305) + 'px';
    infoBox.style.zIndex = '200';
    infoContainer.appendChild(infoBox);

    const specialMocs = ['deszcz', 'grzybki', 'manek', 'mgla', 'mroz', 'niebo', 'porz', 'rog', 'sztorm'];
    const isSpecialCard = !isLeader
        && specialMocs.includes(card0.moc)
        && typeof card0.punkty !== 'number';
    let powerImage = !isLeader ? getPowerImage(card0) : null;
    if (!powerImage && hasZrecznoscOnly) powerImage = 'zrecznosci.webp';

    if (isSpecialCard) {
        const emptyIcon = document.createElement('img');
        emptyIcon.src = 'assets/dkarty/mocempty.webp';
        emptyIcon.style.position = 'absolute';
        emptyIcon.style.left = geo.relW(1385) + 'px';
        emptyIcon.style.top = geo.relH(1440) + 'px';
        emptyIcon.style.height = geo.relH(594) + 'px';
        emptyIcon.style.width = 'auto';
        emptyIcon.style.objectFit = 'contain';
        emptyIcon.style.zIndex = '201';
        infoContainer.appendChild(emptyIcon);

        if (powerImage) {
            const mocIcon = document.createElement('img');
            mocIcon.src = `assets/dkarty/${powerImage}`;
            mocIcon.style.position = 'absolute';
            mocIcon.style.left = geo.relW(1386) + 'px';
            mocIcon.style.top = geo.relH(1694) + 'px';
            mocIcon.style.height = geo.relH(564) + 'px';
            mocIcon.style.width = 'auto';
            mocIcon.style.objectFit = 'contain';
            mocIcon.style.zIndex = '202';
            infoContainer.appendChild(mocIcon);
        }
    } else if (powerImage) {
        const mocIcon = document.createElement('img');
        mocIcon.src = `assets/dkarty/${powerImage}`;
        mocIcon.style.position = 'absolute';
        mocIcon.style.left = geo.relW(1385) + 'px';
        mocIcon.style.top = geo.relH(1440) + 'px';
        mocIcon.style.height = geo.relH(594) + 'px';
        mocIcon.style.width = 'auto';
        mocIcon.style.objectFit = 'contain';
        mocIcon.style.zIndex = '201';
        infoContainer.appendChild(mocIcon);
    }

    let titleText = '';
    let descText = '';

    if (isLeader) {
        titleText = 'Zdolność Dowódcy';
        descText = card0.umiejetnosc || '';
    } else if (card0.moc) {
        const mocData = moce[card0.moc];
        let variant = null;
        if (card0.moc === 'wezwanie') {
            const n = String(card0.numer);
            if (n === '009' || n === '010') variant = mocData.plotka;
            else if (n === '503') variant = mocData.cerys;
            else variant = mocData.default;
        } else if (card0.moc === 'iporz') {
            variant = mocData[card0.pozycja] || mocData[1];
        } else {
            variant = mocData;
        }
        titleText = variant?.nazwa || '';
        descText = variant?.opis || '';
    } else if (Number(card0.pozycja) === 4) {
        titleText = moce.zrecznosc?.nazwa || 'Zręczność';
        descText = moce.zrecznosc?.opis || '';
    }

    const mocName = document.createElement('div');
    mocName.textContent = titleText;
    mocName.style.position = 'absolute';
    mocName.style.left = geo.relW(1356) + 'px';
    mocName.style.top = geo.relH(1715) + 'px';
    mocName.style.width = geo.relW(1123) + 'px';
    mocName.style.height = geo.relH(45) + 'px';
    mocName.style.lineHeight = geo.relH(45) + 'px';
    mocName.style.textAlign = 'center';
    mocName.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
    mocName.style.fontSize = geo.relH(45) + 'px';
    mocName.style.letterSpacing = geo.relW(-1.1) + 'px';
    mocName.style.color = '#be9c58';
    mocName.style.zIndex = '202';
    infoContainer.appendChild(mocName);

    const mocDesc = document.createElement('div');
    mocDesc.textContent = descText;
    mocDesc.style.position = 'absolute';
    mocDesc.style.left = geo.relW(1356) + 'px';
    mocDesc.style.top = geo.relH(1812) + 'px';
    mocDesc.style.width = geo.relW(1123) + 'px';
    mocDesc.style.textAlign = 'center';
    mocDesc.style.fontFamily = 'PFDinTextCondPro, sans-serif';
    mocDesc.style.fontSize = geo.relH(43) + 'px';
    mocDesc.style.letterSpacing = geo.relW(-1.5) + 'px';
    mocDesc.style.color = '#c29f5a';
    mocDesc.style.whiteSpace = 'pre-line';
    mocDesc.style.zIndex = '203';
    infoContainer.appendChild(mocDesc);
}

window.addEventListener('resize', () => {
    if (powiekActive) {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        isAnimating = false;
        currentAnimPos = targetAnimIndex;
        lastRenderedInfoIndex = null;
        renderPowiek();
    }
});

function handleCardActionInsideZoom() {
    if (!powiekDeck || !powiekDeck[targetAnimIndex]) return;
    const card = powiekDeck[targetAnimIndex];
    let success = false;

    if (window.powiekSourceArea === 'collection') {
        if (window.addCardToDeck) success = window.addCardToDeck(card.numer);
    } else if (window.powiekSourceArea === 'deck') {
        if (window.removeCardFromDeck) success = window.removeCardFromDeck(card.numer);
    }

    if (success) {
        powiekDeck.splice(targetAnimIndex, 1);
        if (powiekDeck.length === 0) {
            hidePowiek();
        } else {
            if (targetAnimIndex >= powiekDeck.length) targetAnimIndex = powiekDeck.length - 1;
            powiekIndex = targetAnimIndex;
            currentAnimPos = targetAnimIndex;
            window.currentPowiekIndex = targetAnimIndex;
            lastRenderedInfoIndex = null;
            renderPowiek();
        }
    }
}

export function openCardZoomFromElement(targetEl) {
    const cardEl = targetEl.closest('.card');
    if (cardEl && cardEl.dataset && cardEl.dataset.numer) {
        let source = [];
        if (cardEl.classList.contains('kolekcja-card')) {
            source = window.currentCollectionCards || [];
            window.powiekSourceArea = 'collection';
        } else if (cardEl.classList.contains('talia-card')) {
            source = window.currentDeckCards || [];
            window.powiekSourceArea = 'deck';
        }

        const cardNumer = cardEl.dataset.numer;
        const uniqueCards = [];
        const seen = new Set();
        for (const c of source) {
            if (!seen.has(c.numer)) {
                uniqueCards.push(c);
                seen.add(c.numer);
            }
        }
        const idx = uniqueCards.findIndex(c => c.numer === cardNumer);
        showPowiek(uniqueCards, idx >= 0 ? idx : 0);
        return true;
    } else if (targetEl.classList.contains('leader-card') || targetEl.closest('.leader-card')) {
        const factionId = localStorage.getItem('faction') || window.selectedFaction || '1';
        const filteredLeaders = krole.filter(k => k.frakcja === factionId);
        showPowiek(filteredLeaders, 0, 'leaders');
        window.powiekSourceArea = 'leaders';
        return true;
    }
    return false;
}

window.addEventListener('contextmenu', (e) => {
    if (!powiekActive) {
        if (openCardZoomFromElement(e.target)) {
            e.preventDefault();
        }
        return;
    }

    e.preventDefault();
    if (isForcedSelectMode()) return;

    const cardEl = e.target.closest('.powiek-card');
    if (cardEl && cardEl.dataset.deckIndex !== undefined) {
        const idx = parseInt(cardEl.dataset.deckIndex, 10);
        if (idx !== targetAnimIndex) {
            startAnimationTo(idx);
            return;
        }
        tryHidePowiek();
        return;
    }

    tryHidePowiek();
});

// Long-press telefon
let touchCardTimer = null;
let touchStartX = 0;
let touchStartY = 0;
let touchTargetEl = null;

window.addEventListener('touchstart', (e) => {
    if (powiekActive) return;
    const target = e.target.closest('.card, .leader-card, .hand-card-wrapper');
    if (!target) return;

    touchTargetEl = target;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;

    if (touchCardTimer) clearTimeout(touchCardTimer);
    touchCardTimer = setTimeout(() => {
        if (touchTargetEl) {
            if (touchTargetEl.classList.contains('hand-card-wrapper')) {
                if (typeof touchTargetEl.oncontextmenu === 'function') {
                    touchTargetEl.oncontextmenu(new MouseEvent('contextmenu'));
                }
            } else {
                openCardZoomFromElement(touchTargetEl);
            }
            touchTargetEl = null;
        }
        touchCardTimer = null;
    }, 450);
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (!touchCardTimer) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > 10 || dy > 10) {
        clearTimeout(touchCardTimer);
        touchCardTimer = null;
        touchTargetEl = null;
    }
}, { passive: true });

window.addEventListener('touchend', () => {
    if (touchCardTimer) {
        clearTimeout(touchCardTimer);
        touchCardTimer = null;
    }
    touchTargetEl = null;
}, { passive: true });

window.addEventListener('touchcancel', () => {
    if (touchCardTimer) {
        clearTimeout(touchCardTimer);
        touchCardTimer = null;
    }
    touchTargetEl = null;
}, { passive: true });

window.addEventListener('keydown', (event) => {
    if (!powiekActive) {
        if (event.key === 'x' || event.key === 'X') {
            let factionId = window.selectedFaction || localStorage.getItem('faction') || '1';
            let leaders = krole.filter(krol => krol.frakcja === factionId);
            if (leaders.length === 0) return;
            showPowiek(leaders, 0, 'leaders');
        }
        return;
    }

    if (event.key === 'Escape') {
        if (isForcedSelectMode()) return;
        tryHidePowiek();
        return;
    }

    if (event.key === 'ArrowRight') {
        queueDelta(1);
        return;
    }
    if (event.key === 'ArrowLeft') {
        queueDelta(-1);
        return;
    }

    if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        if (powiekMode === 'leaders') {
            if (window.selectLeader && powiekDeck[targetAnimIndex]) {
                window.selectLeader(powiekDeck[targetAnimIndex].numer);
                tryHidePowiek();
            }
        } else if (powiekOptions && powiekOptions.isMulligan) {
            if (powiekOptions.onSwap) powiekOptions.onSwap(targetAnimIndex);
        } else if (isForcedSelectMode() || (powiekOptions && powiekOptions.onSelect && powiekMode === 'game')) {
            if (powiekOptions.onSelect && powiekDeck[targetAnimIndex]) {
                powiekOptions.onSelect(powiekDeck[targetAnimIndex]);
            }
        } else if (window.powiekSourceArea === 'collection' || window.powiekSourceArea === 'deck') {
            handleCardActionInsideZoom();
        }
    }
});

window.addEventListener('wheel', (event) => {
    if (!powiekActive) return;
    if (event.deltaY < 0) queueDelta(-1);
    else if (event.deltaY > 0) queueDelta(1);
}, { passive: true });