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
    const el = document.getElementById('powiekOverlay');
    if (el) el.remove();
    const powiekBg = document.getElementById('powiekBg');
    if (powiekBg) powiekBg.remove();
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
    powiekBg.style.left = backgroundLeft+'px';
    powiekBg.style.top = backgroundTop+'px';
    powiekBg.style.width = backgroundWidth+'px';
    powiekBg.style.height = backgroundHeight+'px';
    powiekBg.style.zIndex = 99998;
    powiekBg.style.pointerEvents = 'none';
    powiekBg.style.objectFit = 'cover';
    powiekBg.style.background = 'none';
    powiekBg.style.opacity = '1';
    powiekBg.style.filter = 'none';
    document.body.appendChild(powiekBg);
    // Overlay na karty
    const overlay = document.createElement('div');
    overlay.id = 'powiekOverlay';
    overlay.className = 'powiek-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = backgroundLeft+'px';
    overlay.style.top = backgroundTop+'px';
    overlay.style.width = backgroundWidth+'px';
    overlay.style.height = backgroundHeight+'px';
    overlay.style.zIndex = 99999;
    overlay.style.pointerEvents = 'auto';
    overlay.style.background = 'none';
    overlay.style.opacity = '1';
    overlay.style.filter = 'none';
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
        {left:relW(468),top:relH(444),width:relW(899-468),height:relH(1261-444)},
        {left:relW(1040),top:relH(444),width:relW(1563-1040),height:relH(1436-444)},
        {left:relW(1617),top:relH(456),width:relW(2222-1617),height:relH(1609-456)},
        {left:relW(2274),top:relH(444),width:relW(2799-2274),height:relH(1436-444)},
        {left:relW(2938),top:relH(444),width:relW(3371-2938),height:relH(1261-444)}
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
        if (i === 0) {
            cardDiv.style.left = (pos.left - pos.width * 0.2) + 'px';
            cardDiv.style.top = (pos.top - pos.height * 0.02) + 'px';
            cardDiv.style.width = (pos.width * 1.4) + 'px';
            cardDiv.style.height = (pos.height * 1.14) + 'px';
        } else {
            cardDiv.style.left = pos.left+'px';
            cardDiv.style.top = pos.top+'px';
            cardDiv.style.width = pos.width+'px';
            cardDiv.style.height = pos.height+'px';
        }
        cardDiv.style.zIndex = i === 0 ? 100 : 50;
        cardDiv.style.transition = 'all 0.4s cubic-bezier(.77,0,.18,1)';
        cardDiv.style.overflow = 'visible';

        // Warstwy karty wg infoo.txt
        // 1: podsw.webp (jeśli wybrana, tylko środkowa)
        if (i === 0) {
            const podsw = document.createElement('img');
            podsw.src = '/gwent/assets/dkarty/podsw.webp';
            podsw.className = 'poswiata powiek-podsw';
            podsw.style.position = 'absolute';
            podsw.style.left = ((-105/523)*100) + '%';
            podsw.style.top = ((-11.5/992)*100) + '%';
            podsw.style.width = ((734/523)*100) + '%';
            podsw.style.height = ((1015/992)*100) + '%';
            podsw.style.zIndex = 1;
            cardDiv.appendChild(podsw);
            const podsw2 = document.createElement('img');
            podsw2.src = '/gwent/assets/dkarty/podsw2.webp';
            podsw2.className = 'poswiata powiek-podsw2';
            podsw2.style.position = 'absolute';
            podsw2.style.left = ((-50/523)*100) + '%';
            podsw2.style.top = ((-11.5/992)*100) + '%';
            podsw2.style.width = ((650/523)*100) + '%';
            podsw2.style.height = ((1015/992)*100) + '%';
            podsw2.style.zIndex = 2;
            podsw2.style.animation = 'powiek-pulse 1.5s infinite';
            cardDiv.appendChild(podsw2);
        }
        // Wrapper na resztę warstw (obraz karty, beton, frakcja, punkty, itd.)
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
        // 3: obraz karty
        const img = document.createElement('img');
        img.src = card.dkarta;
        img.style.position = 'absolute';
        img.style.left = '0';
        img.style.top = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.zIndex = 3;
        inner.appendChild(img);
        // 4: beton/bbeton
        const beton = document.createElement('img');
        beton.src = card.bohater ? 'assets/dkarty/bbeton.webp' : 'assets/dkarty/beton.webp';
        beton.style.position = 'absolute';
        beton.style.left = '0';
        beton.style.top = '0';
        beton.style.width = '100%';
        beton.style.height = '100%';
        beton.style.zIndex = 4;
        inner.appendChild(beton);
        // 5: pasek frakcji (dodawany dla każdej karty z frakcją 1-5, nie dla dowódców)
        const isKing = card.isKing || card.typ === 'krol' || false;
        if (typeof card.frakcja === 'string' && ['1','2','3','4','5'].includes(card.frakcja) && !isKing) {
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
            inner.appendChild(bannerDiv);
        }
        // 6: pozycja
        if (card.pozycja) {
            const posIcon = document.createElement('img');
            posIcon.src = `assets/dkarty/pozycja${card.pozycja}.webp`;
            posIcon.style.position = 'absolute';
            posIcon.style.left = '0';
            posIcon.style.top = '0';
            posIcon.style.width = '100%';
            posIcon.style.height = '100%';
            posIcon.style.zIndex = 6;
            inner.appendChild(posIcon);
        }
        // 7: punkty okienko (zawsze dla kart z punktami, także pogodowych i specjalnych)
        const isWeather = ['mroz','mgla','deszcz','niebo','sztorm'].includes(card.moc);
        const isSpecial = ['porz','rog','maneki'].includes(card.moc);
        const isManekOrGrzybki = card.moc === 'manek' || card.numer === '000';
        if (card.punkty !== undefined || isWeather || isSpecial || isManekOrGrzybki) {
            const pointsBg = document.createElement('img');
            if(card.bohater) {
                pointsBg.src = 'assets/dkarty/bohater.webp';
                pointsBg.style.position = 'absolute';
                pointsBg.style.left = (pos.width * (-23/523)) + 'px';
                pointsBg.style.top = (pos.height * (-21/992)) + 'px';
                pointsBg.style.width = (pos.width * (285/523)) + 'px';
                pointsBg.style.height = (pos.height * (287/992)) + 'px';
            } else {
                pointsBg.src = 'assets/dkarty/punkty.webp';
                pointsBg.style.position = 'absolute';
                pointsBg.style.left = '0';
                pointsBg.style.top = '0';
                pointsBg.style.width = '100%';
                pointsBg.style.height = '100%';
            }
            pointsBg.style.zIndex = 7;
            inner.appendChild(pointsBg);
            if(card.punkty !== undefined) {
                const pointsDiv = document.createElement('div');
                pointsDiv.innerText = card.punkty;
                pointsDiv.style.position = 'absolute';
                pointsDiv.style.top = '8%';
                pointsDiv.style.left = '15%';
                pointsDiv.style.width = '24%';
                pointsDiv.style.height = '9%';
                pointsDiv.style.fontSize = (pos.height * 0.13) + 'px';
                pointsDiv.style.color = card.bohater ? '#fcfdfc' : '#000000';
                pointsDiv.style.zIndex = 8;
                pointsDiv.style.display = 'flex';
                pointsDiv.style.justifyContent = 'center';
                pointsDiv.style.alignItems = 'center';
                inner.appendChild(pointsDiv);
            }
        }
        // 8: okienko mocy
        if (card.moc) {
            const mocIcon = document.createElement('img');
            let mocSrc = `assets/dkarty/${card.moc}.webp`;
            if(card.moc==='porz' && card.numer==='510') mocSrc = 'assets/dkarty/2porz.webp';
            if(card.moc==='grzybki' && card.numer==='504') mocSrc = 'assets/dkarty/igrzybki.webp';
            if(card.moc==='grzybki' && card.numer==='000') mocSrc = 'assets/dkarty/grzybki.webp';
            mocIcon.src = mocSrc;
            mocIcon.style.position = 'absolute';
            mocIcon.style.left = '0';
            mocIcon.style.top = '0';
            mocIcon.style.width = '100%';
            mocIcon.style.height = '100%';
            mocIcon.style.zIndex = 9;
            inner.appendChild(mocIcon);
        }
        // 10: nazwa karty
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
        inner.appendChild(nameDiv);
        // 11: opis pod dużą kartą
        if (i === 0) {
            const opisDiv = document.createElement('div');
            opisDiv.innerText = card.opis || '';
            opisDiv.style.position = 'absolute';
            opisDiv.style.left = '2%';
            opisDiv.style.top = '89%';
            opisDiv.style.width = '96%';
            opisDiv.style.height = '8%';
            opisDiv.style.textAlign = 'center';
            opisDiv.style.color = '#030303ff';
            opisDiv.style.fontSize = (pos.height * 0.044) + 'px';
            opisDiv.style.zIndex = 20;
            inner.appendChild(opisDiv);
        }
        cardDiv.appendChild(inner);
        overlay.appendChild(cardDiv);
    }

    // Okienko infor.webp dla środkowej karty, jeśli wymaga
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
        // Ikona mocy
        const mocIcon = document.createElement('img');
        mocIcon.src = `assets/dkarty/${card0.moc}.webp`;
        mocIcon.style.position = 'absolute';
        mocIcon.style.left = relW(1356 + 10) + 'px';
        mocIcon.style.top = relH(1661 + 10) + 'px';
        mocIcon.style.width = relW(64) + 'px';
        mocIcon.style.height = relH(64) + 'px';
        mocIcon.style.zIndex = 201;
        overlay.appendChild(mocIcon);
        // Nazwa mocy
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
        // Opis mocy
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
        // Pobierz źródło kart
        let source = null;
        if (cardEl.classList.contains('kolekcja-card')) {
            const selectedFaction = window.selectedFaction || localStorage.getItem('faction');
            // Pobierz numery kart z talii gracza
            const taliaNumery = new Set((window.taliaPowiek || []).map(card => card.numer));
            // Filtruj kolekcję: tylko wybrana frakcja + neutralne, których nie ma w talii
            const filteredKolekcja = (window.kolekcjaPowiek || []).filter(card => (card.frakcja === selectedFaction || card.frakcja === 'nie') && !taliaNumery.has(card.numer));
            // Filtruj po numerze
            const uniqueCards = [];
            const seenNumbers = new Set();
            for (const card of filteredKolekcja) {
                if (!seenNumbers.has(card.numer)) {
                    uniqueCards.push(card);
                    seenNumbers.add(card.numer);
                }
            }
            // Przelicz indeks na unikalną tablicę
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
        // Filtruj po numerze
        const uniqueCards = [];
        const seenNumbers = new Set();
        for (const card of source) {
            if (!seenNumbers.has(card.numer)) {
                uniqueCards.push(card);
                seenNumbers.add(card.numer);
            }
        }
        // Przelicz indeks na unikalną tablicę
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
        // Scroll do góry = poprzednia karta
        if (powiekIndex > 0) {
            powiekIndex--;
            renderPowiek();
        }
    } else if (event.deltaY > 0) {
        // Scroll w dół = następna karta
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
            leaders = krole.slice(0, 5); // fallback: 5 pierwszych
        }
        if (leaders.length === 0) return;
        showPowiek(leaders, 0, 'leaders');
        console.log('Podgląd dowódców aktywowany');
    }
});

export { showPowiek, hidePowiek };