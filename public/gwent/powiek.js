// Podgląd powiększenia kart
import * as moce from './moce.js';
import { krole } from './krole.js';

let powiekIndex = 0;
let powiekDeck = [];
let powiekActive = false;
let powiekMode = 'cards'; // 'cards' lub 'leaders'

function showPowiek(deck, index, mode = 'cards') {
    // Filtruj duplikaty po numerze
    const uniqueDeck = [];
    const seenNumbers = new Set();
    for (const card of deck) {
        if (!seenNumbers.has(card.numer)) {
            uniqueDeck.push(card);
            seenNumbers.add(card.numer);
        }
    }
    powiekDeck = uniqueDeck;
    powiekIndex = index;
    powiekActive = true;
    powiekMode = mode;
    renderPowiek();
}

function hidePowiek() {
    powiekActive = false;
    const overlay = document.getElementById('powiekOverlay');
    const bg = document.getElementById('powiekBg');
    if (overlay) overlay.remove();
    if (bg) bg.remove();
}

function renderPowiek() {
    // Usuwam poprzedni overlay i tło powiek, jeśli istnieje
    const oldOverlay = document.getElementById('powiekOverlay');
    if (oldOverlay) oldOverlay.remove();
    const oldBg = document.getElementById('powiekBg');
    if (oldBg) oldBg.remove();
    if (!powiekActive || powiekDeck.length === 0) return;

    // Pobierz gui/plansza jako bazę skalowania
    const gui = document.getElementById('gui') || document.getElementById('plansza');
    let guiRect;
    if (gui && gui.offsetWidth > 0 && gui.offsetHeight > 0) {
        guiRect = gui.getBoundingClientRect();
    } else {
        guiRect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    }

    // Skalowanie i pozycjonowanie jak w wyborach (game.js)
    const TLO_W = 3837;
    const TLO_H = 2158;
    const windowAspectRatio = window.innerWidth / window.innerHeight;
    const tloAspectRatio = TLO_W / TLO_H;
    let scale, backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop;
    if (windowAspectRatio > tloAspectRatio) {
        scale = guiRect.height / TLO_H;
        backgroundWidth = TLO_W * scale;
        backgroundHeight = guiRect.height;
        backgroundLeft = guiRect.left + (guiRect.width - backgroundWidth) / 2;
        backgroundTop = guiRect.top;
    } else {
        scale = guiRect.width / TLO_W;
        backgroundWidth = guiRect.width;
        backgroundHeight = TLO_H * scale;
        backgroundLeft = guiRect.left;
        backgroundTop = guiRect.top + (guiRect.height - backgroundHeight) / 2;
    }

    // Warstwa tła powiek
    const powiekBg = document.createElement('img');
    powiekBg.id = 'powiekBg';
    powiekBg.src = 'assets/asety/tłopowiek.webp';
    powiekBg.style.position = 'absolute';
    powiekBg.style.left = backgroundLeft + 'px';
    powiekBg.style.top = backgroundTop + 'px';
    powiekBg.style.width = backgroundWidth + 'px';
    powiekBg.style.height = backgroundHeight + 'px';
    powiekBg.style.zIndex = 9998;
    powiekBg.style.pointerEvents = 'none';
    powiekBg.style.objectFit = 'cover';
    powiekBg.style.opacity = '1';
    powiekBg.style.filter = 'none';
    document.body.appendChild(powiekBg);

    // Overlay na karty
    const overlay = document.createElement('div');
    overlay.id = 'powiekOverlay';
    overlay.className = 'powiek-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = 9999;
    overlay.style.pointerEvents = 'auto';
    overlay.style.background = 'rgba(0,0,0,0.0)'; // Zmniejszona opacity dla lepszej widoczności tła
    overlay.style.overflow = 'visible';
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
    overlay.onclick = hidePowiek;
    document.body.appendChild(overlay);

    // Funkcja pomocnicza: px w 4K -> px względem backgroundWidth/backgroundHeight
    function relW(px) { return (px / TLO_W) * backgroundWidth; }
    function relH(px) { return (px / TLO_H) * backgroundHeight; }

    // Pozycje kart w px względem tłopowiek.webp
    const positions = [
        { left: relW(468), top: relH(444), width: relW(899 - 468), height: relH(1261 - 444) },
        { left: relW(1040), top: relH(444), width: relW(1563 - 1040), height: relH(1436 - 444) },
        { left: relW(1617), top: relH(456), width: relW(2222 - 1617), height: relH(1609 - 456) },
        { left: relW(2274), top: relH(444), width: relW(2799 - 2274), height: relH(1436 - 444) },
        { left: relW(2938), top: relH(444), width: relW(3371 - 2938), height: relH(1261 - 444) }
    ];

    // Karty
    for (let i = -2; i <= 2; i++) {
        const idx = powiekIndex + i;
        if (idx < 0 || idx >= powiekDeck.length) continue;
        const card = powiekDeck[idx];
        const pos = positions[i + 2];
        const cardDiv = document.createElement('div');
        cardDiv.className = 'powiek-card';
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = pos.left + 'px';
        cardDiv.style.top = pos.top + 'px';
        cardDiv.style.width = pos.width + 'px';
        cardDiv.style.height = pos.height + 'px';
        cardDiv.style.zIndex = i === 0 ? 100 : 50;
        cardDiv.style.transition = 'all 0.4s cubic-bezier(.77,0,.18,1)';
        cardDiv.style.overflow = 'visible';
        cardDiv.style.boxShadow = '0 0 32px #000';
        cardDiv.style.borderRadius = '12px';

        // Warstwy karty (bez podsw.webp i podsw2.webp)
        // 1: obraz karty
        const img = document.createElement('img');
        img.src = card.dkarta;
        img.style.position = 'absolute';
        img.style.left = '0';
        img.style.top = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.zIndex = 3;
        cardDiv.appendChild(img);

        // 2: beton/bbeton
        const beton = document.createElement('img');
        beton.src = card.bohater ? 'assets/dkarty/bbeton.webp' : 'assets/dkarty/beton.webp';
        beton.style.position = 'absolute';
        beton.style.left = '0';
        beton.style.top = '0';
        beton.style.width = '100%';
        beton.style.height = '100%';
        beton.style.zIndex = 4;
        cardDiv.appendChild(beton);

        // 3: pasek frakcji
        const isKing = card.isKing || card.typ === 'krol' || false;
        if (typeof card.frakcja === 'string' && ['1', '2', '3', '4', '5'].includes(card.frakcja) && !isKing) {
            let frakcjaMap = {
                '1': 'polnoc.webp',
                '2': 'nilfgaard.webp',
                '3': 'scoiatael.webp',
                '4': 'potwory.webp',
                '5': 'skellige.webp'
            };
            const bannerDiv = document.createElement('img');
            bannerDiv.src = `assets/dkarty/${frakcjaMap[card.frakcja]}`;
            bannerDiv.style.position = 'absolute';
            bannerDiv.style.left = '0';
            bannerDiv.style.top = '0';
            bannerDiv.style.width = '100%';
            bannerDiv.style.height = '100%';
            bannerDiv.style.zIndex = 5;
            cardDiv.appendChild(bannerDiv);
        }

        // 4: pozycja
        if (card.pozycja) {
            const posIcon = document.createElement('img');
            posIcon.src = `assets/dkarty/pozycja${card.pozycja}.webp`;
            posIcon.style.position = 'absolute';
            posIcon.style.left = '0';
            posIcon.style.top = '0';
            posIcon.style.width = '100%';
            posIcon.style.height = '100%';
            posIcon.style.zIndex = 6;
            cardDiv.appendChild(posIcon);
        }

        // 5: punkty okienko
        const isWeather = ['mroz', 'mgla', 'deszcz', 'niebo', 'sztorm'].includes(card.moc);
        const isSpecial = ['porz', 'rog', 'maneki'].includes(card.moc);
        const isManekOrGrzybki = card.moc === 'manek' || card.numer === '000';
        if (card.punkty !== undefined || isWeather || isSpecial || isManekOrGrzybki) {
            const pointsBg = document.createElement('img');
            if (card.bohater) {
                pointsBg.src = 'assets/dkarty/bohater.webp';
                pointsBg.style.position = 'absolute';
                pointsBg.style.left = ((-23 / 523) * 100) + '%';
                pointsBg.style.top = ((-21 / 992) * 100) + '%';
                pointsBg.style.width = ((285 / 523) * 100) + '%';
                pointsBg.style.height = ((287 / 992) * 100) + '%';
            } else {
                pointsBg.src = 'assets/dkarty/punkty.webp';
                pointsBg.style.position = 'absolute';
                pointsBg.style.left = '0';
                pointsBg.style.top = '0';
                pointsBg.style.width = '100%';
                pointsBg.style.height = '100%';
            }
            pointsBg.style.zIndex = 7;
            cardDiv.appendChild(pointsBg);

            if (card.punkty !== undefined) {
                const pointsDiv = document.createElement('div');
                pointsDiv.innerText = card.punkty;
                pointsDiv.style.position = 'absolute';
                pointsDiv.style.top = '7.8%';
                pointsDiv.style.left = '14.5%';
                pointsDiv.style.width = '23.61%';
                pointsDiv.style.height = '8.84%';
                pointsDiv.style.fontSize = '220%';
                pointsDiv.style.color = card.bohater ? '#fcfdfc' : '#000000';
                pointsDiv.style.zIndex = 8;
                pointsDiv.style.display = 'flex';
                pointsDiv.style.justifyContent = 'center';
                pointsDiv.style.alignItems = 'center';
                pointsDiv.style.transform = 'translate(-50%, -50%)';
                cardDiv.appendChild(pointsDiv);
            }
        }

        // 6: okienko mocy
        if (card.moc) {
            const mocIcon = document.createElement('img');
            let mocSrc = `assets/dkarty/${card.moc}.webp`;
            if (card.moc === 'porz' && card.numer === '510') mocSrc = 'assets/dkarty/2porz.webp';
            if (card.moc === 'grzybki' && card.numer === '504') mocSrc = 'assets/dkarty/igrzybki.webp';
            if (card.moc === 'grzybki' && card.numer === '000') mocSrc = 'assets/dkarty/grzybki.webp';
            mocIcon.src = mocSrc;
            mocIcon.style.position = 'absolute';
            mocIcon.style.left = '0';
            mocIcon.style.top = '0';
            mocIcon.style.width = '100%';
            mocIcon.style.height = '100%';
            mocIcon.style.zIndex = 9;
            cardDiv.appendChild(mocIcon);
        }

        // 7: nazwa karty
        const nameDiv = document.createElement('div');
        nameDiv.innerText = card.nazwa;
        nameDiv.style.position = 'absolute';
        nameDiv.style.left = '22%';
        nameDiv.style.top = '77%';
        nameDiv.style.width = '76%';
        nameDiv.style.height = '11%';
        nameDiv.style.textAlign = 'center';
        nameDiv.style.fontSize = (pos.height * 0.044) + 'px';
        nameDiv.style.color = '#474747';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.zIndex = 12;
        nameDiv.style.whiteSpace = 'normal';
        nameDiv.style.wordBreak = 'break-word';
        nameDiv.style.lineHeight = '1.1';
        nameDiv.style.padding = '0 4px';
        nameDiv.style.transform = 'none';
        nameDiv.style.fontFamily = '"Gwent", serif';
        cardDiv.appendChild(nameDiv);

        // 8: opis pod dużą kartą
        if (i === 0) {
            const opisDiv = document.createElement('div');
            opisDiv.className = 'powiek-opis';
            opisDiv.innerText = card.opis || '';
            opisDiv.style.position = 'absolute';
            opisDiv.style.left = '2%';
            opisDiv.style.top = '89%';
            opisDiv.style.width = '96%';
            opisDiv.style.height = '8%';
            opisDiv.style.textAlign = 'center';
            opisDiv.style.fontSize = (pos.height * 0.044) + 'px';
            opisDiv.style.zIndex = 20;
            cardDiv.appendChild(opisDiv);
        }

        overlay.appendChild(cardDiv);

        // Niezależne warstwy podsw.webp i podsw2.webp dla środkowej karty
        if (i === 0) {
            const podsw = document.createElement('img');
            podsw.src = 'assets/dkarty/podsw.webp';
            podsw.className = 'powiek-podsw';
            podsw.style.position = 'absolute';
            podsw.style.left = (pos.left + pos.width * (-104 / 523)) + 'px';
            podsw.style.top = (pos.top + pos.height * (-10 / 992)) + 'px';
            podsw.style.width = (pos.width * (628 / 523)) + 'px';
            podsw.style.height = (pos.height * (1003 / 992)) + 'px';
            podsw.style.zIndex = 99;
            overlay.appendChild(podsw);

            const podsw2 = document.createElement('img');
            podsw2.src = 'assets/dkarty/podsw2.webp';
            podsw2.className = 'powiek-podsw2';
            podsw2.style.position = 'absolute';
            podsw2.style.left = (pos.left + pos.width * (-104 / 523)) + 'px';
            podsw2.style.top = (pos.top + pos.height * (-10 / 992)) + 'px';
            podsw2.style.width = (pos.width * (628 / 523)) + 'px';
            podsw2.style.height = (pos.height * (1003 / 992)) + 'px';
            podsw2.style.zIndex = 99;
            overlay.appendChild(podsw2);
        }
    }

    // Okienko infor.webp dla środkowej karty, jeśli wymaga
    const card0 = powiekDeck[powiekIndex];
    if (card0 && card0.moc) {
        const infoBox = document.createElement('div');
        infoBox.className = 'powiek-info';
        infoBox.style.position = 'absolute';
        infoBox.style.left = relW(1356) + 'px';
        infoBox.style.top = relH(1661) + 'px';
        infoBox.style.width = relW(695) + 'px';
        infoBox.style.height = relH(202) + 'px';
        infoBox.style.zIndex = 200;
        overlay.appendChild(infoBox);

        // Ikona mocy
        const mocIcon = document.createElement('img');
        mocIcon.src = `assets/dkarty/${card0.moc}.webp`;
        mocIcon.className = 'powiek-ikona';
        mocIcon.style.position = 'absolute';
        mocIcon.style.left = relW(1356 + 10) + 'px';
        mocIcon.style.top = relH(1661 + 10) + 'px';
        mocIcon.style.width = relW(64) + 'px';
        mocIcon.style.height = relH(64) + 'px';
        mocIcon.style.zIndex = 201;
        overlay.appendChild(mocIcon);

        // Nazwa mocy
        const mocName = document.createElement('div');
        mocName.className = 'powiek-nazwa';
        mocName.textContent = window.moce?.[card0.moc]?.nazwa || '';
        mocName.style.position = 'absolute';
        mocName.style.left = relW(1356) + 'px';
        mocName.style.top = relH(1735) + 'px';
        mocName.style.width = relW(695) + 'px';
        mocName.style.textAlign = 'center';
        mocName.style.fontSize = relW(44) + 'px';
        mocName.style.zIndex = 202;
        overlay.appendChild(mocName);

        // Opis mocy
        const mocDesc = document.createElement('div');
        mocDesc.className = 'powiek-moc-opis';
        mocDesc.textContent = window.moce?.[card0.moc]?.opis || '';
        mocDesc.style.position = 'absolute';
        mocDesc.style.left = relW(1356) + 'px';
        mocDesc.style.top = relH(1814) + 'px';
        mocDesc.style.width = relW(695) + 'px';
        mocDesc.style.textAlign = 'center';
        mocDesc.style.fontSize = relW(32) + 'px';
        mocDesc.style.zIndex = 203;
        overlay.appendChild(mocDesc);
    }

    // Strzałki nawigacyjne
    if (powiekDeck.length > 1) {
        if (powiekIndex > 0) {
            const leftArrow = document.createElement('div');
            leftArrow.className = 'powiek-arrow';
            leftArrow.innerText = '<';
            leftArrow.style.position = 'absolute';
            leftArrow.style.left = relW(1000) + 'px';
            leftArrow.style.top = relH(456) + 'px';
            leftArrow.style.zIndex = 1000;
            leftArrow.onclick = (e) => {
                e.stopPropagation();
                if (powiekIndex > 0) {
                    powiekIndex--;
                    renderPowiek();
                }
            };
            overlay.appendChild(leftArrow);
        }
        if (powiekIndex < powiekDeck.length - 1) {
            const rightArrow = document.createElement('div');
            rightArrow.className = 'powiek-arrow';
            rightArrow.innerText = '>';
            rightArrow.style.position = 'absolute';
            rightArrow.style.left = relW(2800) + 'px';
            rightArrow.style.top = relH(456) + 'px';
            rightArrow.style.zIndex = 1000;
            rightArrow.onclick = (e) => {
                e.stopPropagation();
                if (powiekIndex < powiekDeck.length - 1) {
                    powiekIndex++;
                    renderPowiek();
                }
            };
            overlay.appendChild(rightArrow);
        }
    }
}

// Dodaj dynamiczne skalowanie powiększenia kart względem planszy/gui
window.addEventListener('resize', () => {
    if (powiekActive) {
        renderPowiek();
    }
});

// Obsługa prawego kliknięcia na kartę lub dowódcę
window.addEventListener('contextmenu', function (e) {
    const cardEl = e.target.closest('.card, .powiek-card');
    if (cardEl && cardEl.dataset && cardEl.dataset.index) {
        e.preventDefault();
        let source = null;
        if (cardEl.classList.contains('kolekcja-card')) {
            const selectedFaction = window.selectedFaction || localStorage.getItem('faction');
            const taliaNumery = new Set((window.taliaPowiek || []).map(card => card.numer));
            const filteredKolekcja = (window.kolekcjaPowiek || []).filter(card => (card.frakcja === selectedFaction || card.frakcja === 'nie') && !taliaNumery.has(card.numer));
            const uniqueCards = [];
            const seenNumbers = new Set();
            for (const card of filteredKolekcja) {
                if (!seenNumbers.has(card.numer)) {
                    uniqueCards.push(card);
                    seenNumbers.add(card.numer);
                }
            }
            let origIndex = parseInt(cardEl.dataset.index);
            let cardNumer = null;
            if (window.kolekcjaPowiek && window.kolekcjaPowiek[origIndex]) cardNumer = window.kolekcjaPowiek[origIndex].numer;
            let newIndex = 0;
            if (cardNumer) {
                newIndex = uniqueCards.findIndex(card => card.numer === cardNumer);
                if (newIndex === -1) newIndex = 0;
            }
            showPowiek(uniqueCards, newIndex, 'cards');
            return;
        }
        else if (cardEl.classList.contains('talia-card')) source = window.taliaPowiek || [];
        else if (cardEl.closest('.talia-gry')) source = window.deckForPowiek || [];
        else if (cardEl.classList.contains('powiek-card')) source = powiekDeck || [];
        if (!source || source.length === 0) source = window.deckForPowiek || [];
        const uniqueCards = [];
        const seenNumbers = new Set();
        for (const card of source) {
            if (!seenNumbers.has(card.numer)) {
                uniqueCards.push(card);
                seenNumbers.add(card.numer);
            }
        }
        let origIndex = parseInt(cardEl.dataset.index);
        let cardNumer = null;
        if (source[origIndex]) cardNumer = source[origIndex].numer;
        if (!cardNumer && powiekDeck && powiekDeck[origIndex]) cardNumer = powiekDeck[origIndex].numer;
        let newIndex = 0;
        if (cardNumer) {
            newIndex = uniqueCards.findIndex(card => card.numer === cardNumer);
            if (newIndex === -1) newIndex = 0;
        }
        showPowiek(uniqueCards, newIndex, 'cards');
        return;
    }
    if (e.target.classList.contains('leader-card-x')) {
        e.preventDefault();
        showPowiek(krole, 0, 'leaders');
    }
});

// Obsługa przesuwania kart strzałkami i scrollem
window.addEventListener('keydown', function (event) {
    if (!powiekActive) return;
    if (event.key === 'ArrowRight') {
        if (powiekIndex < powiekDeck.length - 1) {
            powiekIndex++;
            renderPowiek();
        }
    }
    if (event.key === 'ArrowLeft') {
        if (powiekIndex > 0) {
            powiekIndex--;
            renderPowiek();
        }
    }
});

window.addEventListener('wheel', function (event) {
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

document.addEventListener('keydown', function (event) {
    if (event.key === 'x' || event.key === 'X') {
        console.log('Naciśnięto klawisz X');
        let factionId = localStorage.getItem('faction');
        let leaders;
        if (factionId) {
            leaders = krole.filter(krol => krol.frakcja === factionId);
            if (factionId === '5') leaders = leaders.slice(0, 2);
        } else {
            leaders = krole.slice(0, 5);
        }
        if (leaders.length === 0) return;
        showPowiek(leaders, 0, 'leaders');
        console.log('Podgląd dowódców aktywowany');
    }
});

export { showPowiek, hidePowiek };