import * as moce from './moce.js';
import { krole } from './krole.js';
import { getPowerImage, renderCardHTML } from './bcard_render.js';

let powiekIndex = 0;
let powiekDeck = [];
let powiekActive = false;
let powiekMode = 'cards';
let powiekOptions = {};

const powiekBlockScroll = (e) => {
    e.preventDefault();
    return false;
};

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
    powiekIndex = index;
    powiekActive = true;
    powiekMode = mode;
    window.currentPowiekIndex = index;
    window.isPowiekOpen = true;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('wheel', powiekBlockScroll, { passive: false });
    window.addEventListener('touchmove', powiekBlockScroll, { passive: false });
    window.addEventListener('keydown', powiekBlockScroll, { passive: false });
    renderPowiek();
}

export function hidePowiek() {
    powiekActive = false;
    window.isPowiekOpen = false;
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

function renderPowiek() {
    const oldOverlay = document.getElementById('powiekOverlay');
    if (oldOverlay) oldOverlay.remove();
    const oldBg = document.getElementById('powiekBg');
    if (oldBg) oldBg.remove();
    if (!powiekActive || powiekDeck.length === 0) return;

    const gui = document.getElementById('gui') || document.getElementById('plansza') || document.querySelector('.overlay');
    let guiRect;
    if (gui && gui.offsetWidth > 0 && gui.offsetHeight > 0) {
        guiRect = gui.getBoundingClientRect();
    } else {
        guiRect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    }

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

    const powiekBg = document.createElement('div');
    powiekBg.id = 'powiekBg';
    powiekBg.style.position = 'absolute';
    powiekBg.style.left = backgroundLeft + 'px';
    powiekBg.style.top = backgroundTop + 'px';
    powiekBg.style.width = backgroundWidth + 'px';
    powiekBg.style.height = backgroundHeight + 'px';
    powiekBg.style.zIndex = 99998;
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
    overlay.style.left = backgroundLeft + 'px';
    overlay.style.top = backgroundTop + 'px';
    overlay.style.width = backgroundWidth + 'px';
    overlay.style.height = backgroundHeight + 'px';
    overlay.style.zIndex = 99999;
    overlay.style.pointerEvents = 'auto';
    overlay.style.overflow = 'hidden';
    overlay.onclick = (e) => {
        if (powiekOptions && powiekOptions.isMulligan) {
            e.stopPropagation();
            return;
        }
        hidePowiek();
    };
    document.body.appendChild(overlay);

    const relW = (px) => (px / TLO_W) * backgroundWidth;
    const relH = (px) => (px / TLO_H) * backgroundHeight;

    const positions = [
        { left: relW(468), top: relH(444), width: relW(431), height: relH(817) },
        { left: relW(1040), top: relH(444), width: relW(523), height: relH(992) },
        { left: relW(1617), top: relH(456), width: relW(605), height: relH(1153) },
        { left: relW(2274), top: relH(444), width: relW(525), height: relH(992) },
        { left: relW(2938), top: relH(444), width: relW(433), height: relH(817) }
    ];

    for (let i = -2; i <= 2; i++) {
        const idx = powiekIndex + i;
        if (idx < 0 || idx >= powiekDeck.length) continue;
        const card = powiekDeck[idx];
        const pos = positions[i + 2];
        const cardDiv = document.createElement('div');
        cardDiv.className = 'powiek-card' + (i === 0 ? ' powiek-central' : '');
        cardDiv.style.position = 'absolute';

        if (i === 0) {
            cardDiv.style.left = (pos.left - pos.width * 0.2) + 'px';
            cardDiv.style.top = (pos.top - pos.height * 0.02) + 'px';
            cardDiv.style.width = (pos.width * 1.4) + 'px';
            cardDiv.style.height = (pos.height * 1.14) + 'px';

            if (powiekMode === 'leaders') {
                cardDiv.style.cursor = 'pointer';
                cardDiv.onclick = (e) => {
                    e.stopPropagation();
                    if (window.selectLeader) window.selectLeader(card.numer);
                    hidePowiek();
                };
            } else if (powiekOptions && powiekOptions.isMulligan) {
                cardDiv.style.cursor = 'pointer';
                cardDiv.onclick = (e) => {
                    e.stopPropagation();
                    if (powiekOptions.onSwap) powiekOptions.onSwap(powiekIndex);
                };
            }
        } else {
            cardDiv.style.left = pos.left + 'px';
            cardDiv.style.top = pos.top + 'px';
            cardDiv.style.width = pos.width + 'px';
            cardDiv.style.height = pos.height + 'px';
        }

        cardDiv.style.zIndex = i === 0 ? 100 : 50;
        cardDiv.style.transition = 'all 0.4s cubic-bezier(.77,0,.18,1)';
        cardDiv.style.overflow = 'visible';

        if (i === 0) {
            const podsw = document.createElement('img');
            podsw.src = '/gwent/assets/dkarty/podsw.webp';
            podsw.className = 'poswiata powiek-podsw';
            podsw.style.position = 'absolute';
            podsw.style.left = '0.2%';
            podsw.style.top = '1.2%';
            podsw.style.width = '100.1%';
            podsw.style.height = '89.5%';
            podsw.style.zIndex = 1;
            cardDiv.appendChild(podsw);

            const podsw2 = document.createElement('img');
            podsw2.src = '/gwent/assets/dkarty/podsw2.webp';
            podsw2.className = 'poswiata powiek-podsw2';
            podsw2.style.position = 'absolute';
            podsw2.style.left = '0.2%';
            podsw2.style.top = '1.2%';
            podsw2.style.width = '100.1%';
            podsw2.style.height = '89.5%';
            podsw2.style.zIndex = 2;
            podsw2.style.animation = 'powiek-pulse 1.5s infinite';
            cardDiv.appendChild(podsw2);
        }

        const inner = document.createElement('div');
        inner.style.position = 'absolute';
        if (i === 0) {
            inner.style.left = (pos.width * 0.2) + 'px';
            inner.style.top = (pos.height * 0.02) + 'px';
            inner.style.width = pos.width + 'px';
            inner.style.height = pos.height + 'px';
        } else {
            inner.style.left = '0';
            inner.style.top = '0';
            inner.style.width = '100%';
            inner.style.height = '100%';
        }
        inner.className = 'inner-card-wrapper';

        const factionId = localStorage.getItem('faction') || window.selectedFaction || '1';
        inner.innerHTML = renderCardHTML(card, {
            playerFaction: factionId,
            isLargeView: true,
            isKing: powiekMode === 'leaders'
        });

        // Override some styles for zoom view
        const pointsDiv = inner.querySelector('.points');
        if (pointsDiv) {
            pointsDiv.style.fontSize = (pos.height * 0.10) + 'px';
            pointsDiv.style.fontFamily = 'PFDinTextCondPro, sans-serif';
        }

        const nameDiv = inner.querySelector('.name');
        if (nameDiv) {
            nameDiv.style.fontSize = (pos.height * 0.044) + 'px';
            if (powiekMode === 'leaders') {
                nameDiv.style.left = '0';
                nameDiv.style.width = '100%';
            }
        }

        const descriptionDiv = inner.querySelector('.description');
        if (descriptionDiv) {
            descriptionDiv.style.display = 'block';
            descriptionDiv.style.fontSize = (pos.height * 0.035) + 'px';
            descriptionDiv.style.top = '89%';
            descriptionDiv.style.height = 'auto';
            descriptionDiv.style.color = '#030303ff';
        }

        cardDiv.appendChild(inner);
        overlay.appendChild(cardDiv);
    }

    const card0 = powiekDeck[powiekIndex];
    if (card0 && card0.moc) {
        const infoBox = document.createElement('img');
        infoBox.src = 'assets/asety/infor.webp';
        infoBox.style.position = 'absolute';
        infoBox.style.left = relW(1356) + 'px';
        infoBox.style.top = relH(1661) + 'px';
        infoBox.style.width = relW(695) + 'px';
        infoBox.style.height = relH(202) + 'px';
        infoBox.style.zIndex = 200;
        overlay.appendChild(infoBox);

        const powerImage = getPowerImage(card0);
        if (powerImage) {
            const mocIcon = document.createElement('img');
            mocIcon.src = `assets/dkarty/${powerImage}`;
            mocIcon.style.position = 'absolute';
            mocIcon.style.left = relW(1356 + 10) + 'px';
            mocIcon.style.top = relH(1661 + 10) + 'px';
            mocIcon.style.width = relW(64) + 'px';
            mocIcon.style.height = relH(64) + 'px';
            mocIcon.style.zIndex = 201;
            overlay.appendChild(mocIcon);
        }

        const mocName = document.createElement('div');
        mocName.textContent = window.moce?.[card0.moc]?.nazwa || '';
        mocName.style.position = 'absolute';
        mocName.style.left = relW(1356) + 'px';
        mocName.style.top = relH(1735) + 'px';
        mocName.style.width = relW(695) + 'px';
        mocName.style.textAlign = 'center';
        mocName.style.fontWeight = 'bold';
        mocName.style.fontSize = relW(44) + 'px';
        mocName.style.color = '#c7a76e';
        mocName.style.zIndex = 202;
        overlay.appendChild(mocName);

        const mocDesc = document.createElement('div');
        mocDesc.textContent = window.moce?.[card0.moc]?.opis || '';
        mocDesc.style.position = 'absolute';
        mocDesc.style.left = relW(1356) + 'px';
        mocDesc.style.top = relH(1814) + 'px';
        mocDesc.style.width = relW(695) + 'px';
        mocDesc.style.textAlign = 'center';
        mocDesc.style.fontSize = relW(32) + 'px';
        mocDesc.style.color = '#c7a76e';
        mocDesc.style.zIndex = 203;
        overlay.appendChild(mocDesc);
    }

    if (powiekOptions && powiekOptions.isMulligan) {
        const swapInfo = document.createElement('div');
        swapInfo.style.position = 'absolute';
        swapInfo.style.bottom = '5%';
        swapInfo.style.left = '50%';
        swapInfo.style.transform = 'translateX(-50%)';
        swapInfo.style.color = '#c7a76e';
        swapInfo.style.fontFamily = 'PFDinTextCondPro-Bold';
        swapInfo.style.fontSize = relW(48) + 'px';
        swapInfo.style.textShadow = '2px 2px 4px #000';
        swapInfo.style.zIndex = 300;
        swapInfo.textContent = `Pozostałe wymiany: ${powiekOptions.swapsLeft}`;
        overlay.appendChild(swapInfo);

        const helpInfo = document.createElement('div');
        helpInfo.style.position = 'absolute';
        helpInfo.style.bottom = '2%';
        helpInfo.style.left = '50%';
        helpInfo.style.transform = 'translateX(-50%)';
        helpInfo.style.color = '#fff';
        helpInfo.style.fontFamily = 'PFDinTextCondPro';
        helpInfo.style.fontSize = relW(28) + 'px';
        helpInfo.style.zIndex = 300;
        helpInfo.textContent = 'Kliknij / Enter - wymień | Esc - zakończ';
        overlay.appendChild(helpInfo);
    }
}

window.addEventListener('resize', () => {
    if (powiekActive) renderPowiek();
});

function handleCardActionInsideZoom() {
    if (!powiekDeck || !powiekDeck[powiekIndex]) return;
    const card = powiekDeck[powiekIndex];
    let success = false;

    if (window.powiekSourceArea === 'collection') {
        if (window.addCardToDeck) success = window.addCardToDeck(card.numer);
    } else if (window.powiekSourceArea === 'deck') {
        if (window.removeCardFromDeck) success = window.removeCardFromDeck(card.numer);
    }

    if (success) {
        powiekDeck.splice(powiekIndex, 1);
        if (powiekDeck.length === 0) {
            hidePowiek();
        } else {
            if (powiekIndex >= powiekDeck.length) powiekIndex = powiekDeck.length - 1;
            renderPowiek();
        }
    }
}

window.addEventListener('contextmenu', (e) => {
    if (powiekActive) {
        const insideZoom = e.target.closest('.powiek-card, .powiek-central');
        if (insideZoom) {
            e.preventDefault();
            handleCardActionInsideZoom();
        }
    } else {
        const cardEl = e.target.closest('.card');
        if (cardEl && cardEl.dataset && cardEl.dataset.numer) {
            e.preventDefault();
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
        } else if (e.target.classList.contains('leader-card') || e.target.closest('.leader-card')) {
            e.preventDefault();
            const factionId = localStorage.getItem('faction') || window.selectedFaction || '1';
            const filteredLeaders = krole.filter(k => k.frakcja === factionId);
            showPowiek(filteredLeaders, 0, 'leaders');
            window.powiekSourceArea = 'leaders';
        }
    }
});

window.addEventListener('keydown', (event) => {
    if (!powiekActive) {
        if (event.key === 'x' || event.key === 'X') {
            let factionId = localStorage.getItem('faction') || '1';
            let leaders = krole.filter(krol => krol.frakcja === factionId);
            if (leaders.length === 0) return;
            showPowiek(leaders, 0, 'leaders');
        }
        return;
    }

    if (event.key === 'Escape') {
        hidePowiek();
    } else if (event.key === 'ArrowRight') {
        if (powiekIndex < powiekDeck.length - 1) {
            powiekIndex++;
            renderPowiek();
        }
    } else if (event.key === 'ArrowLeft') {
        if (powiekIndex > 0) {
            powiekIndex--;
            renderPowiek();
        }
    } else if (event.key === 'Enter') {
        if (powiekMode === 'leaders') {
            if (window.selectLeader) {
                window.selectLeader(powiekDeck[powiekIndex].numer);
                hidePowiek();
            }
        } else if (powiekOptions && powiekOptions.isMulligan) {
            if (powiekOptions.onSwap) powiekOptions.onSwap(powiekIndex);
        } else {
            handleCardActionInsideZoom();
        }
    }
});

window.addEventListener('wheel', (event) => {
    if (!powiekActive) return;
    if (event.deltaY < 0) {
        if (powiekIndex > 0) {
            powiekIndex--;
            renderPowiek();
        }
    } else if (event.deltaY > 0) {
        if (powiekIndex < powiekDeck.length - 1) {
            powiekIndex++;
            renderPowiek();
        }
    }
});
