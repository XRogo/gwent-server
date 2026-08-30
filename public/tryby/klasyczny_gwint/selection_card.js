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
    { id: "2", name: "Cesarstwo Nilfgaardu", shield: "assets/asety/tnilfgaard.webp", ability: "Jeśli rozgrywka zakończy się remisem, to ty odnosisz zwycięstwo." },
    { id: "3", name: "Scoia'tael", shield: "assets/asety/tscoiatael.webp", ability: "Zdecyduj, kto rozpoczyna rozgrywkę." },
    { id: "4", name: "Potwory", shield: "assets/asety/tpotwory.webp", ability: "Zatrzymaj losowo wybraną jednostkę na polu bitwy po każdej rundzie." },
    { id: "5", name: "Skellige", shield: "assets/asety/tskellige.webp", ability: "W trzeciej rundzie dwie przypadkowe karty ze stosu kart odrzuconych wracają na stół." },
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
        const SCROLLBAR_BASE_4K = 25;
        const PADDING_BASE_4K = 5;
        const GAP_BASE_4K = 34;
        const GAP_X = (GAP_BASE_4K / GUI_WIDTH) * backgroundWidth;
        const GAP_Y = (30 / GUI_HEIGHT) * backgroundHeight;
        const PADDING_TOP = (10 / GUI_HEIGHT) * backgroundHeight;
        const PADDING_BOTTOM = (20 / GUI_HEIGHT) * backgroundHeight;

        const cLeft = 366, cTop = 491, cRight = 1561;
        const dLeft = 2290, dTop = 491, dRight = 3484;

        const areaWidth = ((cRight - cLeft) / GUI_WIDTH) * backgroundWidth;
        const effectiveWidth = areaWidth - ((SCROLLBAR_BASE_4K / GUI_WIDTH) * backgroundWidth) - ((PADDING_BASE_4K / GUI_WIDTH) * backgroundWidth);
        const cardWidth = (effectiveWidth - (2 * GAP_X)) / 3;
        const cardHeight = cardWidth / (523 / 992);

        const newAreaHeight = PADDING_TOP + (cardHeight * 2) + GAP_Y + PADDING_BOTTOM;

        if (collectionArea) {
            const aLeft = backgroundLeft + (cLeft / GUI_WIDTH) * backgroundWidth;
            const aTop = backgroundTop + (cTop / GUI_HEIGHT) * backgroundHeight;
            collectionArea.style.left = `${aLeft}px`;
            collectionArea.style.top = `${aTop}px`;
            collectionArea.style.width = `${areaWidth}px`;
            collectionArea.style.height = `${newAreaHeight}px`;
            collectionArea.style.maxHeight = `${newAreaHeight}px`;
            updateCardArea(collectionArea, areaWidth, newAreaHeight, backgroundWidth, backgroundHeight);
        }

        if (deckArea) {
            const aLeft = backgroundLeft + (dLeft / GUI_WIDTH) * backgroundWidth;
            const aTop = backgroundTop + (dTop / GUI_HEIGHT) * backgroundHeight;
            deckArea.style.left = `${aLeft}px`;
            deckArea.style.top = `${aTop}px`;
            deckArea.style.width = `${areaWidth}px`;
            deckArea.style.height = `${newAreaHeight}px`;
            deckArea.style.maxHeight = `${newAreaHeight}px`;
            updateCardArea(deckArea, areaWidth, newAreaHeight, backgroundWidth, backgroundHeight);
        }
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

function updateCardArea(area, areaWidth, areaHeight, backgroundWidth, backgroundHeight) {
    const COLS = 3;
    const GAP_BASE_4K = 34;
    const GAP_X = (GAP_BASE_4K / GUI_WIDTH) * backgroundWidth;
    const GAP_Y = (30 / GUI_HEIGHT) * backgroundHeight;
    const SCROLLBAR_BASE_4K = 25;
    const SCROLLBAR_WIDTH = (SCROLLBAR_BASE_4K / GUI_WIDTH) * backgroundWidth;
    const PADDING_BASE_4K = 5;
    const PADDING_LEFT = (PADDING_BASE_4K / GUI_WIDTH) * backgroundWidth;

    const effectiveWidth = areaWidth - SCROLLBAR_WIDTH - PADDING_LEFT;
    let cardWidth = (effectiveWidth - (2 * GAP_X)) / COLS;

    area.style.overflowY = 'auto';
    area.style.overflowX = 'hidden';
    area.style.display = 'flex';
    area.style.flexWrap = 'wrap';
    area.style.alignContent = 'flex-start';
    area.style.justifyContent = 'flex-start';
    area.style.paddingLeft = `${PADDING_LEFT}px`;
    area.style.paddingRight = `${SCROLLBAR_WIDTH}px`;
    area.style.paddingTop = `${(10 / GUI_HEIGHT) * backgroundHeight}px`;
    area.style.paddingBottom = `${(20 / GUI_HEIGHT) * backgroundHeight}px`;
    area.style.gap = `${GAP_Y}px ${GAP_X}px`;

    area.querySelectorAll('.card').forEach(card => {
        card.style.width = `${cardWidth}px`;
        const aspectRatio = 523 / 992;
        const cardHeight = cardWidth / aspectRatio;
        card.style.height = `${cardHeight}px`;
        card.style.margin = '0';
        card.style.padding = '0';
        card.style.boxSizing = 'border-box';
        card.style.flex = `0 0 ${cardWidth}px`;
        card.style.maxWidth = `${cardWidth}px`;
        card.style.fontSize = `${cardWidth / 12}px`;
    });

    if (area.dataset.savedScrollTop) {
        area.scrollTop = parseFloat(area.dataset.savedScrollTop);
        delete area.dataset.savedScrollTop;
    }
}

export function getSelectedDeck() { return deck; }
export function getSelectedLeader() { return selectedLeader; }
export function getUnitCardCount() {
    return deck.filter(c => typeof c.punkty === 'number').length;
}

