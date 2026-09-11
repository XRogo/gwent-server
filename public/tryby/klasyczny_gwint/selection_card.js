import cards from './cards.js';
import { krole } from './krole.js';
import { showPowiek } from './rcard.js';
import { renderCardHTML } from './bcard_render.js';

let currentPage = 1;
let deck = [];
let selectedLeader = null;
let currentCollectionFilter = 'all';
let currentDeckFilter = 'all';
const GUI_WIDTH = 3840;
const GUI_HEIGHT = 2160;

const factions = [
    { id: "1", name: "Królestwa Północy", shield: "assets/asety/tpolnoc.webp", ability: "Za każdym razem, kiedy wygrywasz bitwę, weź o jedną kartę więcej." },
    { id: "3", name: "Scoia'tael", shield: "assets/asety/tscoiatael.webp", ability: "Zdecyduj, kto rozpoczyna rozgrywkę." },
    { id: "5", name: "Skellige", shield: "assets/asety/tskellige.webp", ability: "W trzeciej rundzie dwie przypadkowe karty ze stosu kart odrzuconych wracają na stół." },
    { id: "4", name: "Potwory", shield: "assets/asety/tpotwory.webp", ability: "Zatrzymaj losowo wybraną jednostkę na polu bitwy po każdej rundzie." },
    { id: "2", name: "Cesarstwo Nilfgaardu", shield: "assets/asety/tnilfgaard.webp", ability: "Jeśli rozgrywka zakończy się remisem, to ty odnosisz zwycięstwo." },
];

export function initSelection(socket, gameCode, isPlayer1) {
    const collectionArea = document.querySelector('.card-area.collection');
    const deckArea = document.querySelector('.card-area.deck');
    const stats = document.querySelector('.stats');

    window.addCardToDeck = (numer) => {
        const card = cards.find(c => c.numer === numer);
        if (!card) return false;
        const countInDeck = deck.filter(c => c.numer === numer).length;
        if (countInDeck < (card.ilosc || 1)) {
            deck.push({ ...card });
            if (window.playSound) window.playSound('addCardSound');
            updateSelectionUI();
            return true;
        }
        return false;
    };

    window.removeCardFromDeck = (numer) => {
        const idx = deck.findIndex(c => c.numer === numer);
        if (idx >= 0) {
            deck.splice(idx, 1);
            if (window.playSound) window.playSound('removeCardSound');
            updateSelectionUI();
            return true;
        }
        return false;
    };

    window.scaleStats = scaleStats;

    window.selectLeader = (numer) => {
        const leader = krole.find(k => k.numer === numer);
        if (leader) {
            selectedLeader = leader;
            if (window.playSound) window.playSound('hoverSound');
            updateSelectionUI();
        }
    };

    window.updateSelectionUI = () => {
        deck.sort((a, b) => {
            const indexA = cards.findIndex(c => c.numer === a.numer);
            const indexB = cards.findIndex(c => c.numer === b.numer);
            return indexA - indexB;
        });
        displayCards(currentCollectionFilter, collectionArea, factions[currentPage - 1].id, cards, false, deck);
        const grouped = groupDeck(deck);
        window.currentDeckCards = grouped;
        displayCards(currentDeckFilter, deckArea, factions[currentPage - 1].id, grouped, false, deck);
        updateStats(stats);
        updatePositionsAndScaling();
        if (typeof window.updateGoToGameButton === 'function') {
            window.updateGoToGameButton();
        }
    };

    function updateSelectionUI() {
        window.updateSelectionUI();
    }

    document.querySelector('.page-left').onclick = () => {
        currentPage = currentPage > 1 ? currentPage - 1 : factions.length;
        loadDeckForFaction(factions[currentPage - 1].id);
        updateSelectionUI();
    };

    document.querySelector('.page-right').onclick = () => {
        currentPage = currentPage < factions.length ? currentPage + 1 : 1;
        loadDeckForFaction(factions[currentPage - 1].id);
        updateSelectionUI();
    };

    document.querySelectorAll('.button.collection, .button.deck').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            const isCollection = btn.classList.contains('collection');
            const area = isCollection ? collectionArea : deckArea;

            if (isCollection) {
                currentCollectionFilter = filter;
                document.querySelectorAll('.button.collection').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
            } else {
                currentDeckFilter = filter;
                document.querySelectorAll('.button.deck').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
            }

            const cardList = isCollection ? cards : groupDeck(deck);
            displayCards(filter, area, factions[currentPage - 1].id, cardList, false, deck);
            updatePositionsAndScaling();

            if (window.playSound) window.playSound('hoverSound');
        });
    });

    // Initial active states
    document.querySelectorAll('.button.collection.all, .button.deck.all').forEach(btn => btn.classList.add('active'));

    document.querySelectorAll('.page-left, .page-right').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.playSound) window.playSound('hoverSound');
        });
    });

    loadDeckForFaction(factions[currentPage - 1].id);
    updateSelectionUI();
}

function loadDeckForFaction(factionId) {
    const talie = window.loadDecks ? window.loadDecks() : {};
    if (talie && talie[factionId]) {
        deck = (talie[factionId].karty || [])
            .map(numer => cards.find(c => c.numer === numer))
            .filter(Boolean);

        // Sort deck based on index in cards.js
        deck.sort((a, b) => {
            const indexA = cards.findIndex(c => c.numer === a.numer);
            const indexB = cards.findIndex(c => c.numer === b.numer);
            return indexA - indexB;
        });

        selectedLeader = krole.find(krol => krol.numer === talie[factionId].dowodca) || null;
    } else {
        deck = [];
        selectedLeader = krole.filter(k => k.frakcja === factionId)[0] || null;
    }
    window.taliaPowiek = deck;
    window.selectedFaction = factionId;
}

function groupDeck(deck) {
    const grouped = [];
    deck.forEach(card => {
        const existing = grouped.find(c => c.numer === card.numer);
        if (existing) {
            existing.iloscWTalii++;
        } else {
            grouped.push({ ...card, iloscWTalii: 1 });
        }
    });
    return grouped;
}

function displayCards(filter = 'all', area, playerFaction, cardList, isLargeView, currentDeck) {
    if (!area) return;
    area.dataset.savedScrollTop = area.scrollTop;
    area.innerHTML = '';

    let filteredCards = cardList.filter(card => {
        if (card.frakcja !== playerFaction && card.frakcja !== "nie") return false;
        if (filter === 'all') return true;
        if (filter === 'miecz') return card.pozycja === 1;
        if (filter === 'luk') return card.pozycja === 2;
        if (filter === 'oblezenie') return card.pozycja === 3;
        if (filter === 'bohater') return card.bohater === true;
        const isWeather = ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(card.moc);
        if (filter === 'pogoda') return isWeather;
        const isSpec = ['rog', 'porz', 'iporz', 'medyk', 'morale', 'szpieg', 'manek', 'wezwanie', 'wezwarniezza', 'wiez', 'grzybki'].includes(card.moc);
        if (filter === 'specjalne') return isSpec;
        return false;
    });

    if (area.classList.contains('collection')) {
        filteredCards = filteredCards.filter(card => {
            const countInDeck = currentDeck.filter(c => c.numer === card.numer).length;
            const available = (card.ilosc || 1) - countInDeck;
            return available > 0;
        });
        window.currentCollectionCards = filteredCards;
    }

    filteredCards.forEach((card, idx) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        if (area.classList.contains('collection')) cardElement.classList.add('kolekcja-card');
        else cardElement.classList.add('talia-card');
        cardElement.dataset.numer = card.numer;
        cardElement.dataset.index = idx;

        let availableCount = 0;
        if (area.classList.contains('collection')) {
            availableCount = (card.ilosc || 1) - currentDeck.filter(c => c.numer === card.numer).length;
        }

        cardElement.innerHTML = renderCardHTML(card, {
            playerFaction,
            isLargeView,
            isDeckView: area.classList.contains('deck'),
            isCollectionView: area.classList.contains('collection'),
            availableCount
        });

        // Poświata POD warstwami karty (pkt 6) – nie zmienia rozmiaru karty
        const podsw = document.createElement('img');
        podsw.src = 'assets/dkarty/podsw.webp';
        podsw.className = 'selection-podsw';
        podsw.alt = '';
        cardElement.insertBefore(podsw, cardElement.firstChild);

        const podsw2 = document.createElement('img');
        podsw2.src = 'assets/dkarty/podsw2.webp';
        podsw2.className = 'selection-podsw2';
        podsw2.alt = '';
        cardElement.insertBefore(podsw2, cardElement.firstChild);

        cardElement.onclick = () => {
            if (area.classList.contains('collection')) window.addCardToDeck(card.numer);
            else window.removeCardFromDeck(card.numer);
        };

        area.appendChild(cardElement);
    });
}

function updateStats(statsContainer) {
    if (!statsContainer) return;
    statsContainer.innerHTML = '';

    // Data calculation
    const totalCards = deck.length;
    const unitCards = deck.filter(c => typeof c.punkty === 'number').length;
    const specNums = ['001', '002', '003', '004', '005', '006', '007', '008', '000'];
    const specialCardsCount = deck.filter(c => specNums.includes(c.numer)).length;
    const totalStrength = deck.reduce((sum, c) => sum + (typeof c.punkty === 'number' ? c.punkty : 0), 0);
    const heroCardsCount = deck.filter(c => c.bohater).length;

    const C_BERZ = '#a69377', C_GOLD = '#a27e3d', C_SILA = '#35a842', C_RED = '#ff1a1a';

    const statsData = [
        // Napis "Dowódca" na środku nad kartą dowódcy
        { text: "Dowódca", y: 456, color: C_GOLD, isLabel: true, size: 44, letterSpacing: 0.2, center: true },
        // Etykiety
        { text: "Wszystkie karty w talii", y: 1116, color: C_BERZ, isLabel: true, size: 43, letterSpacing: -0.2, center: true },
        { text: "Liczba kart jednostek", y: 1236, color: C_BERZ, isLabel: true, size: 43, letterSpacing: -0.2, center: true },
        { text: "Karty specjalne", y: 1357, color: C_BERZ, isLabel: true, size: 43, letterSpacing: -0.2, center: true },
        { text: "Całkowita Siła Jednostek", y: 1475, color: C_BERZ, isLabel: true, size: 43, letterSpacing: -0.2, center: true },
        { text: "Karty bohaterów", y: 1596, color: C_BERZ, isLabel: true, size: 43, letterSpacing: -0.2, center: true },
        // Wartości liczbowe
        { text: totalCards, y: 1177, color: C_GOLD, isLabel: false, size: 46, letterSpacing: -0.2, center: false },
        { text: unitCards < 22 ? `${unitCards}/22` : unitCards, y: 1297, color: unitCards < 22 ? C_RED : C_GOLD, isLabel: false, size: 46, letterSpacing: -0.2, center: false },
        { text: `${specialCardsCount}/10`, y: 1419, color: C_SILA, isLabel: false, size: 46, letterSpacing: -0.2, center: false },
        { text: totalStrength, y: 1537, color: C_GOLD, isLabel: false, size: 46, letterSpacing: -0.2, center: false },
        { text: heroCardsCount, y: 1657, color: C_GOLD, isLabel: false, size: 46, letterSpacing: -0.2, center: false }
    ];

    statsData.forEach(d => {
        const el = document.createElement('div');
        el.className = 'stat-item';
        el.dataset.y = d.y;
        el.dataset.size = d.size;
        el.dataset.letterSpacing = d.letterSpacing;
        el.dataset.center = d.center;
        el.innerHTML = d.text;
        el.style.position = 'absolute';
        el.style.color = d.color;
        el.style.display = 'block';
        el.style.whiteSpace = 'nowrap';
        el.style.fontFamily = "'PFDinTextCondPro', sans-serif";
        el.style.lineHeight = '1';
        el.style.margin = '0';
        el.style.padding = '0';

        if (d.center) {
            el.style.left = '50%';
            el.style.transform = 'translateX(-50%)';
            el.style.textAlign = 'center';
        } else {
            // Wyrównanie do lewej do 1934 w 4K
            el.style.left = `${(1934 / GUI_WIDTH) * 100}%`;
            el.style.transform = 'none';
            el.style.textAlign = 'left';
        }
        statsContainer.appendChild(el);
    });

    scaleStats(statsContainer);
}

function scaleStats(statsContainer) {
    if (!statsContainer) return;
    const bgH = statsContainer.offsetHeight;
    const bgW = statsContainer.offsetWidth;
    if (bgH <= 0 || bgW <= 0) return;

    const scaleW = bgW / GUI_WIDTH;
    const scaleH = bgH / GUI_HEIGHT;

    statsContainer.querySelectorAll('.stat-item').forEach(el => {
        const y = parseFloat(el.dataset.y);
        const size = parseFloat(el.dataset.size);
        const letterSpacing = parseFloat(el.dataset.letterSpacing || 0);

        el.style.top = `${y * scaleH}px`;
        el.style.fontSize = `${size * scaleW}px`;
        el.style.letterSpacing = `${letterSpacing * scaleW}px`;
    });
}

export function updatePositionsAndScaling() {
    const overlay = document.querySelector('.overlay');
    if (!overlay) return;

    const overlayRect = overlay.getBoundingClientRect();
    const overlayWidth = overlayRect.width;
    const overlayHeight = overlayRect.height;
    const overlayLeft = overlayRect.left;
    const overlayTop = overlayRect.top;

    const windowAspectRatio = window.innerWidth / window.innerHeight;
    const guiAspectRatio = GUI_WIDTH / GUI_HEIGHT;

    let scale, backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop;

    if (windowAspectRatio > guiAspectRatio) {
        scale = overlayHeight / GUI_HEIGHT;
        backgroundWidth = GUI_WIDTH * scale;
        backgroundHeight = overlayHeight;
        backgroundLeft = overlayLeft + (overlayWidth - backgroundWidth) / 2;
        backgroundTop = overlayTop;
    } else {
        scale = overlayWidth / GUI_WIDTH;
        backgroundWidth = overlayWidth;
        backgroundHeight = GUI_HEIGHT * scale;
        backgroundLeft = overlayLeft;
        backgroundTop = overlayTop + (overlayHeight - backgroundHeight) / 2;
    }

    const buttons = [
        { selector: '.button.collection.all', left: 9.713542, top: 16.388889, image: 'assets/wybor/all.webp' },
        { selector: '.button.collection.mecz', left: 14.322917, top: 16.481481, image: 'assets/wybor/mecz.webp' },
        { selector: '.button.collection.lok', left: 19.140625, top: 16.435185, image: 'assets/wybor/lok.webp' },
        { selector: '.button.collection.obl', left: 23.854167, top: 16.435185, image: 'assets/wybor/kapatulta.webp' },
        { selector: '.button.collection.hero', left: 28.593750, top: 16.481481, image: 'assets/wybor/boharer.webp' },
        { selector: '.button.collection.pogoda', left: 33.281250, top: 16.250000, image: 'assets/wybor/pogoda.webp' },
        { selector: '.button.collection.specjalne', left: 38.020833, top: 16.712963, image: 'assets/wybor/inne.webp' },
        { selector: '.button.deck.all', left: 59.869792, top: 16.388889, image: 'assets/wybor/all.webp' },
        { selector: '.button.deck.mecz', left: 64.401042, top: 16.481481, image: 'assets/wybor/mecz.webp' },
        { selector: '.button.deck.lok', left: 69.218750, top: 16.435185, image: 'assets/wybor/lok.webp' },
        { selector: '.button.deck.obl', left: 73.958333, top: 16.435185, image: 'assets/wybor/kapatulta.webp' },
        { selector: '.button.deck.hero', left: 78.697917, top: 16.481481, image: 'assets/wybor/boharer.webp' },
        { selector: '.button.deck.pogoda', left: 83.390625, top: 16.250000, image: 'assets/wybor/pogoda.webp' },
        { selector: '.button.deck.specjalne', left: 88.020833, top: 16.712963, image: 'assets/wybor/inne.webp' },
    ];

    buttons.forEach(({ selector, left, top, image }) => {
        const button = document.querySelector(selector);
        if (button) {
            button.style.width = `${(97 / GUI_WIDTH) * 100}%`;
            button.style.height = `${(80 / GUI_HEIGHT) * 100}%`;
            button.style.left = `${backgroundLeft + (left * backgroundWidth) / 100}px`;
            button.style.top = `${backgroundTop + (top * backgroundHeight) / 100}px`;
            button.style.backgroundImage = `url('${image}')`;
        }
    });

    const stats = document.querySelector('.stats');
    if (stats) {
        stats.style.width = `${backgroundWidth}px`;
        stats.style.height = `${backgroundHeight}px`;
        stats.style.left = `${backgroundLeft}px`;
        stats.style.top = `${backgroundTop}px`;
        if (window.scaleStats) window.scaleStats(stats);
    }

    const collectionArea = document.querySelector('.card-area.collection');
    const deckArea = document.querySelector('.card-area.deck');

    if (collectionArea || deckArea) {
        // --- pkt 5: obszary + karta 377x710 (4K), 2 rzędy widoczne ---
        const CARD_W_4K = 377;
        const CARD_H_4K = 710;
        const GAP_4K = 30;
        const PAD_TOP_4K = 15;
        const PAD_BOTTOM_4K = 20; // ~20 px reszty

        // 15 + 710 + 30 + 710 + 20 = 1485 → dokładnie 2 rzędy
        const AREA_H_4K = PAD_TOP_4K + CARD_H_4K + GAP_4K + CARD_H_4K + PAD_BOTTOM_4K;

        const cLeft = 365, cTop = 475, cRight = 1561;
        const dLeft = 2288, dTop = 475, dRight = 3484;

        const scaleW = backgroundWidth / GUI_WIDTH;
        const scaleH = backgroundHeight / GUI_HEIGHT;

        const cardW = CARD_W_4K * scaleW;
        const cardH = CARD_H_4K * scaleH;
        const gapX = GAP_4K * scaleW;
        const gapY = GAP_4K * scaleH;
        const padTop = PAD_TOP_4K * scaleH;
        const padBottom = PAD_BOTTOM_4K * scaleH;
        const areaH = AREA_H_4K * scaleH;

                const setupArea = (area, left4k, top4k, right4k) => {
            if (!area) return;

            const aLeft = backgroundLeft + left4k * scaleW;
            const aTop = backgroundTop + top4k * scaleH;
            const aW = (right4k - left4k) * scaleW;

            // Zapas na poświatę względem designu karty 523×992:
            // lewo 119/523, prawo (734 - 523 - 119)/523 = 92/523
            const padSideL = cardW * (119 / 523);
            const padSideR = cardW * (92 / 523);

            // Kontener szerszy o padding – poświata / bohater nieucięte z boków
            area.style.left = `${aLeft - padSideL}px`;
            area.style.top = `${aTop}px`;
            area.style.width = `${aW + padSideL + padSideR}px`;
            area.style.height = `${areaH}px`;
            area.style.maxHeight = `${areaH}px`;

            area.style.overflowY = 'auto';
            area.style.overflowX = 'hidden';
            area.style.display = 'flex';
            area.style.flexWrap = 'wrap';
            area.style.alignContent = 'flex-start';
            area.style.justifyContent = 'flex-start';
            area.style.paddingTop = `${padTop}px`;
            area.style.paddingBottom = `${padBottom}px`;
            area.style.paddingLeft = `${padSideL}px`;
            area.style.paddingRight = `${padSideR}px`;
            area.style.gap = `${gapY}px ${gapX}px`;
            area.style.boxSizing = 'border-box';

            area.querySelectorAll('.card').forEach(card => {
                card.style.width = `${cardW}px`;
                card.style.height = `${cardH}px`;
                card.style.margin = '0';
                card.style.padding = '0';
                card.style.boxSizing = 'border-box';
                card.style.flex = `0 0 ${cardW}px`;
                card.style.maxWidth = `${cardW}px`;
                card.style.position = 'relative';
                card.style.overflow = 'visible';
                card.style.fontSize = `${cardW / 12}px`;
            });

            // 1 tick kółka = 1 rząd
            if (!area._rowWheelBound) {
                area._rowWheelBound = true;
                area.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const rowStep = cardH + gapY;
                    area.scrollTop += (e.deltaY > 0 ? rowStep : -rowStep);
                }, { passive: false });
            }

            if (area.dataset.savedScrollTop) {
                area.scrollTop = parseFloat(area.dataset.savedScrollTop);
                delete area.dataset.savedScrollTop;
            }
        };

        setupArea(collectionArea, cLeft, cTop, cRight);
        setupArea(deckArea, dLeft, dTop, dRight);

        // --- pkt 3: suwaki ---
        setupSelectionScrollbar(
            collectionArea, 'scrollbar-collection',
            1592, 482, 1641, 1954,
            backgroundLeft, backgroundTop, scaleW, scaleH
        );
        setupSelectionScrollbar(
            deckArea, 'scrollbar-deck',
            3522, 482, 3570, 1953,
            backgroundLeft, backgroundTop, scaleW, scaleH
        );
    }

    const faction = factions[currentPage - 1];
    const scaleW = backgroundWidth / GUI_WIDTH;
    const scaleH = backgroundHeight / GUI_HEIGHT;

    const factionInfo = document.querySelector('.faction-info');
    if (factionInfo) {
        factionInfo.style.position = 'absolute';
        factionInfo.style.left = '0';
        factionInfo.style.top = '0';
        factionInfo.style.width = '100%';
        factionInfo.style.height = '100%';
        factionInfo.style.pointerEvents = 'none';
        factionInfo.style.zIndex = '10';
    }

    const factionHeader = document.querySelector('.faction-header');
    if (factionHeader) {
        factionHeader.style.position = 'absolute';
        factionHeader.style.left = '50%';
        factionHeader.style.top = `${backgroundTop + (150 / GUI_HEIGHT) * backgroundHeight}px`;
        factionHeader.style.transform = 'translateX(-50%)';
        factionHeader.style.display = 'inline-flex';
        factionHeader.style.width = 'auto';
        factionHeader.style.alignItems = 'center';
        factionHeader.style.justifyContent = 'center';
        factionHeader.style.margin = '0';
        factionHeader.style.padding = '0';
        factionHeader.style.lineHeight = '1';
        factionHeader.style.zIndex = '20';
    }

    const shield = document.querySelector('.faction-shield');
    if (shield) {
        shield.src = faction.shield;
        shield.style.display = 'block';
        shield.style.width = `${106 * scaleW}px`;
        shield.style.height = `${110 * scaleH}px`;
        shield.style.position = 'absolute';
        shield.style.right = '100%';
        shield.style.top = '50%';
        shield.style.transform = `translateY(-50%)`;
        shield.style.marginRight = `${15 * scaleW}px`;
        shield.style.zIndex = '21';
    }

    const name = document.querySelector('.faction-name');
    if (name) {
        name.innerText = faction.name;
        name.style.fontSize = `${60 * scaleW}px`;
        name.style.letterSpacing = `${-0.1 * scaleW}px`;
        name.style.lineHeight = '1';
        name.style.margin = '0';
        name.style.padding = '0';
        name.style.whiteSpace = 'nowrap';
        name.style.fontFamily = "'PFDinTextCondPro', sans-serif";
    }

    const ability = document.querySelector('.faction-ability');
    if (ability) {
        ability.innerText = faction.ability;
        ability.style.position = 'absolute';
        ability.style.left = `${backgroundLeft + (GUI_WIDTH / 2) * scaleW}px`;
        ability.style.top = `${backgroundTop + (253 / GUI_HEIGHT) * backgroundHeight}px`;
        ability.style.transform = `translateX(-50%)`;
        ability.style.fontSize = `${46 * scaleW}px`;
        ability.style.letterSpacing = `${-0.5 * scaleW}px`;
        ability.style.lineHeight = '1';
        ability.style.margin = '0';
        ability.style.padding = '0';
        ability.style.fontFamily = "'PFDinTextCondPro', sans-serif";
        ability.style.textAlign = 'center';
        ability.style.whiteSpace = 'nowrap';
    }

    const pageLeft = document.querySelector('.page-left');
    if (pageLeft) {
        pageLeft.style.width = `${(49 / GUI_WIDTH) * 100}%`;
        pageLeft.style.height = `${(43 / GUI_HEIGHT) * 100}%`;
        pageLeft.style.left = `${backgroundLeft + (1452 / GUI_WIDTH) * backgroundWidth}px`;
        pageLeft.style.top = `${backgroundTop + (155 / GUI_HEIGHT) * backgroundHeight}px`;
        pageLeft.style.backgroundImage = `url('assets/wybor/wlewo.webp')`;
    }

    const pageRight = document.querySelector('.page-right');
    if (pageRight) {
        pageRight.style.width = `${(49 / GUI_WIDTH) * 100}%`;
        pageRight.style.height = `${(43 / GUI_HEIGHT) * 100}%`;
        pageRight.style.left = `${backgroundLeft + (2338 / GUI_WIDTH) * backgroundWidth}px`;
        pageRight.style.top = `${backgroundTop + (154 / GUI_HEIGHT) * backgroundHeight}px`;
        pageRight.style.backgroundImage = `url('assets/wybor/wprawo.webp')`;
    }

    // 2. Znaczek informujący o stronie (strona.webp 25x22 w 4K)
    const dot = document.querySelector('.page-indicator-dot');
    if (dot) {
        // Pozycje X dla poszczególnych frakcji w 4K
        const dotPositions = {
            "4": 1862, // Potwory
            "2": 1888, // Nilfgaard
            "1": 1915, // Królestwa Północy
            "3": 1941, // Scoia'tael
            "5": 1967  // Skellige
        };
        const dotX = dotPositions[faction.id] || 1915;
        const dotY = 208;
        dot.style.width = `${25 * scaleW}px`;
        dot.style.height = `${22 * scaleH}px`;
        dot.style.left = `${backgroundLeft + dotX * scaleW}px`;
        dot.style.top = `${backgroundTop + dotY * scaleH}px`;
    }

    // 3. Nazwy następnych frakcji (w lewo i w prawo)
    const prevFaction = factions[(currentPage - 2 + factions.length) % factions.length];
    const nextFaction = factions[currentPage % factions.length];

    const prevNameEl = document.querySelector('.faction-prev-name');
    if (prevNameEl) {
        prevNameEl.innerText = prevFaction.name;
        prevNameEl.style.left = `${backgroundLeft + 1411 * scaleW}px`;
        prevNameEl.style.top = `${backgroundTop + 165 * scaleH}px`;
        prevNameEl.style.color = '#846b57';
        prevNameEl.style.fontSize = `${46 * scaleW}px`;
        prevNameEl.style.letterSpacing = `${-0.2 * scaleW}px`;
        prevNameEl.style.textAlign = 'right';
        prevNameEl.style.transform = 'translateX(-100%)';
    }

    const nextNameEl = document.querySelector('.faction-next-name');
    if (nextNameEl) {
        nextNameEl.innerText = nextFaction.name;
        nextNameEl.style.left = `${backgroundLeft + 2426 * scaleW}px`;
        nextNameEl.style.top = `${backgroundTop + 165 * scaleH}px`;
        nextNameEl.style.color = '#846b57';
        nextNameEl.style.fontSize = `${46 * scaleW}px`;
        nextNameEl.style.letterSpacing = `${-0.2 * scaleW}px`;
        nextNameEl.style.textAlign = 'left';
        nextNameEl.style.transform = 'none';
    }

    // 4. Nazwa kontenera kart (Kolekcja kart i Karty w talii)
    const colTitle = document.querySelector('.collection-title');
    if (colTitle) {
        colTitle.style.left = `${backgroundLeft + 329 * scaleW}px`;
        colTitle.style.top = `${backgroundTop + 208 * scaleH}px`;
        colTitle.style.color = '#c5c5c5';
        colTitle.style.fontSize = `${57 * scaleW}px`;
        colTitle.style.letterSpacing = `${-0.2 * scaleW}px`;
        colTitle.style.textAlign = 'left';
        colTitle.style.transform = 'none';
    }

    const deckTitle = document.querySelector('.deck-title');
    if (deckTitle) {
        deckTitle.style.left = `${backgroundLeft + 3518 * scaleW}px`;
        deckTitle.style.top = `${backgroundTop + 215 * scaleH}px`;
        deckTitle.style.color = '#c5c5c5';
        deckTitle.style.fontSize = `${57 * scaleW}px`;
        deckTitle.style.letterSpacing = `${-0.2 * scaleW}px`;
        deckTitle.style.textAlign = 'right';
        deckTitle.style.transform = 'translateX(-100%)';
    }

    // 5. Nazwa obecnego filtra w danym kontenerze
    const filterNamesMap = {
        'all': 'WSZYSTKIE KARTY',
        'miecz': 'KARTY PIECHOTY',
        'luk': 'KARTY JEDNOSTEK DALEKIEGO ZASIĘGU',
        'oblezenie': 'KARTY JEDNOSTEK OBLĘŻNICZYCH',
        'bohater': 'KARTY BOHATERÓW',
        'pogoda': 'KARTY POGODY',
        'specjalne': 'KARTY SPECJALNE'
    };

    const colFilterName = document.querySelector('.collection-filter-name');
    if (colFilterName) {
        colFilterName.innerText = filterNamesMap[currentCollectionFilter] || 'WSZYSTKIE KARTY';
        colFilterName.style.left = `${backgroundLeft + 332 * scaleW}px`;
        colFilterName.style.top = `${backgroundTop + 280 * scaleH}px`;
        colFilterName.style.color = '#c5c5c5';
        colFilterName.style.fontSize = `${45 * scaleW}px`;
        colFilterName.style.letterSpacing = `${-0.2 * scaleW}px`;
        colFilterName.style.textAlign = 'left';
        colFilterName.style.transform = 'none';
        colFilterName.style.textShadow = `0 0 ${40 * scaleW}px rgba(195, 154, 55, 0.45)`;
    }

    const deckFilterName = document.querySelector('.deck-filter-name');
    if (deckFilterName) {
        deckFilterName.innerText = filterNamesMap[currentDeckFilter] || 'WSZYSTKIE KARTY';
        deckFilterName.style.left = `${backgroundLeft + 3514 * scaleW}px`;
        deckFilterName.style.top = `${backgroundTop + 282 * scaleH}px`;
        deckFilterName.style.color = '#c5c5c5';
        deckFilterName.style.fontSize = `${45 * scaleW}px`;
        deckFilterName.style.letterSpacing = `${-0.2 * scaleW}px`;
        deckFilterName.style.textAlign = 'right';
        deckFilterName.style.transform = 'translateX(-100%)';
        deckFilterName.style.textShadow = `0 0 ${40 * scaleW}px rgba(195, 154, 55, 0.45)`;
    }

    const leaderCard = document.querySelector('.leader-card');
    if (leaderCard && selectedLeader) {
        leaderCard.innerHTML = '';
        const guiLeft = 1792, guiTop = 538, guiW = 2051 - 1792, guiH = 1029 - 538;
        const scaleW = backgroundWidth / GUI_WIDTH;
        const scaleH = backgroundHeight / GUI_HEIGHT;
        leaderCard.style.position = 'absolute';
        leaderCard.style.left = (backgroundLeft + guiLeft * scaleW) + 'px';
        leaderCard.style.top = (backgroundTop + guiTop * scaleH) + 'px';
        leaderCard.style.width = (guiW * scaleW) + 'px';
        leaderCard.style.height = (guiH * scaleH) + 'px';

        const beton = document.createElement('div');
        beton.className = 'beton';
        beton.style.position = 'absolute';
        beton.style.left = '0';
        beton.style.top = '0';
        beton.style.width = '100%';
        beton.style.height = '100%';
        beton.style.backgroundImage = "url('assets/dkarty/beton.webp')";
        beton.style.backgroundSize = 'cover';
        beton.style.backgroundRepeat = 'no-repeat';
        beton.style.zIndex = '1';
        leaderCard.appendChild(beton);

        const img = document.createElement('img');
        img.src = selectedLeader.dkarta;
        img.style.position = 'absolute';
        img.style.left = '0';
        img.style.top = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '12px';
        img.style.boxShadow = '0 0 16px #000';
        img.style.zIndex = '2';
        leaderCard.appendChild(img);

        const nameDiv = document.createElement('div');
        nameDiv.innerText = (selectedLeader.nazwa || '').replace(/\\n/g, ' ').replace(/\n/g, ' ');
        nameDiv.style.position = 'absolute';
        nameDiv.style.left = '50%';
        nameDiv.style.top = ((920 - guiTop) * scaleH) + 'px';
        nameDiv.style.width = '100%';
        nameDiv.style.transform = 'translateX(-50%)';
        nameDiv.style.fontFamily = 'PFDinTextCondPro-Bold, Cinzel, serif';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = '#484848';
        nameDiv.style.fontSize = (29 * scaleW) + 'px';
        nameDiv.style.letterSpacing = (0.2 * scaleW) + 'px';
        nameDiv.style.lineHeight = ((29 + 5.4) * scaleH) + 'px';
        nameDiv.style.textAlign = 'center';
        nameDiv.style.zIndex = '3';
        leaderCard.appendChild(nameDiv);
    }

    const goToGameButton = document.getElementById('goToGameButton');
    if (goToGameButton) {
        const btnX = 1768, btnY = 1852, btnW = 274, btnH = 70;
        const scaleW = backgroundWidth / GUI_WIDTH;
        const scaleH = backgroundHeight / GUI_HEIGHT;
        goToGameButton.style.left = `${backgroundLeft + btnX * scaleW}px`;
        goToGameButton.style.top = `${backgroundTop + btnY * scaleH}px`;
        goToGameButton.style.width = `${btnW * scaleW}px`;
        goToGameButton.style.height = `${btnH * scaleH}px`;
        goToGameButton.style.fontSize = `${47 * scaleW}px`;
        goToGameButton.style.letterSpacing = `${0 * scaleW}px`;
        goToGameButton.style.transform = 'none';
    }

    const saveDeckButton = document.getElementById('saveDeckButton');
    if (saveDeckButton) {
        const btnX = 1768, btnY = 1852 - 95, btnW = 274, btnH = 70;
        const scaleW = backgroundWidth / GUI_WIDTH;
        const scaleH = backgroundHeight / GUI_HEIGHT;
        saveDeckButton.style.left = `${backgroundLeft + btnX * scaleW}px`;
        saveDeckButton.style.top = `${backgroundTop + btnY * scaleH}px`;
        saveDeckButton.style.width = `${btnW * scaleW}px`;
        saveDeckButton.style.height = `${btnH * scaleH}px`;
        saveDeckButton.style.fontSize = `${47 * scaleW}px`;
        saveDeckButton.style.letterSpacing = `${0 * scaleW}px`;
        saveDeckButton.style.transform = 'none';
    }

    const notificationArea = document.getElementById('selectionNotificationArea');
    if (notificationArea) {
        const notifX1 = 966, notifY1 = 1982, notifX2 = 2873, notifY2 = 2158;
        const notifW = notifX2 - notifX1;
        const notifH = notifY2 - notifY1;
        const scaleW = backgroundWidth / GUI_WIDTH;
        const scaleH = backgroundHeight / GUI_HEIGHT;
        notificationArea.style.left = `${backgroundLeft + notifX1 * scaleW}px`;
        notificationArea.style.top = `${backgroundTop + notifY1 * scaleH}px`;
        notificationArea.style.width = `${notifW * scaleW}px`;
        notificationArea.style.height = `${notifH * scaleH}px`;
        notificationArea.style.fontSize = `${55 * scaleW}px`;
        notificationArea.style.letterSpacing = `${-0.5 * scaleW}px`;
    }
}

/** Suwak przewijania (pkt 3) – zawsze widoczny, płynne przeciąganie */
function setupSelectionScrollbar(area, id, trackL, trackT, trackR, trackB, bgLeft, bgTop, scaleW, scaleH) {
    if (!area) return;

    let bar = document.getElementById(id);
    if (!bar) {
        bar = document.createElement('div');
        bar.id = id;
        bar.className = 'selection-scrollbar';
        document.body.appendChild(bar);
    }

    const barW = 49 * scaleW;
    const barH = 114 * scaleH;
    const trackX = bgLeft + trackL * scaleW;
    const trackY = bgTop + trackT * scaleH;
    const trackH = (trackB - trackT) * scaleH;
    const maxTravel = Math.max(0, trackH - barH);

    bar.style.width = `${barW}px`;
    bar.style.height = `${barH}px`;
    bar.style.left = `${trackX}px`;
    bar.style.display = 'block';

    const syncBar = () => {
        const maxScroll = area.scrollHeight - area.clientHeight;
        const ratio = maxScroll > 0 ? (area.scrollTop / maxScroll) : 0;
        bar.style.top = `${trackY + ratio * maxTravel}px`;
    };

    area.removeEventListener('scroll', area._sbScroll);
    area._sbScroll = syncBar;
    area.addEventListener('scroll', syncBar);
    syncBar();

    let dragging = false;
    let startY = 0;
    let startScroll = 0;

    bar.onpointerdown = (e) => {
        e.preventDefault();
        dragging = true;
        startY = e.clientY;
        startScroll = area.scrollTop;
        try { bar.setPointerCapture(e.pointerId); } catch (_) {}
    };

    if (!bar._sbMoveBound) {
        bar._sbMoveBound = true;
        window.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const maxScroll = area.scrollHeight - area.clientHeight;
            if (maxScroll <= 0 || maxTravel <= 0) return;
            const dy = e.clientY - startY;
            area.scrollTop = Math.max(0, Math.min(maxScroll, startScroll + (dy / maxTravel) * maxScroll));
        });
        window.addEventListener('pointerup', () => { dragging = false; });
    }
}

export function getSelectedDeck() { return deck; }
export function getSelectedLeader() { return selectedLeader; }
export function getUnitCardCount() {
    return deck.filter(c => typeof c.punkty === 'number').length;
}