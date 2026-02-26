import cards from './cards.js';
import { krole } from './krole.js';
import { showPowiek } from './rcard.js';
import { renderCardHTML } from './bcard_render.js';

let currentPage = 1;
let deck = [];
let selectedLeader = null;
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
            updateSelectionUI();
            return true;
        }
        return false;
    };

    window.removeCardFromDeck = (numer) => {
        const idx = deck.findIndex(c => c.numer === numer);
        if (idx >= 0) {
            deck.splice(idx, 1);
            updateSelectionUI();
            return true;
        }
        return false;
    };

    window.selectLeader = (numer) => {
        const leader = krole.find(k => k.numer === numer);
        if (leader) {
            selectedLeader = leader;
            updateSelectionUI();
        }
    };

    function updateSelectionUI() {
        displayCards('all', collectionArea, factions[currentPage - 1].id, cards, false, deck);
        const grouped = groupDeck(deck);
        window.currentDeckCards = grouped;
        displayCards('all', deckArea, factions[currentPage - 1].id, grouped, false, deck);
        updateStats(stats);
        updatePositionsAndScaling();
    }

    document.querySelector('.page-left').onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            loadDeckForFaction(factions[currentPage - 1].id);
            updateSelectionUI();
        }
    };

    document.querySelector('.page-right').onclick = () => {
        if (currentPage < factions.length) {
            currentPage++;
            loadDeckForFaction(factions[currentPage - 1].id);
            updateSelectionUI();
        }
    };

    document.querySelectorAll('.button.collection, .button.deck').forEach(btn => {
        btn.onclick = () => {
            const filter = btn.dataset.filter;
            const area = btn.classList.contains('collection') ? collectionArea : deckArea;
            const cardList = btn.classList.contains('collection') ? cards : groupDeck(deck);
            displayCards(filter, area, factions[currentPage - 1].id, cardList, false, deck);
        };
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
    const scrollTop = area.scrollTop;
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

    area.scrollTop = scrollTop;
}

function updateStats(statsContainer) {
    if (!statsContainer) return;
    statsContainer.innerHTML = '';
    const faction = factions[currentPage - 1];
    const totalCards = deck.length;
    const unitCards = deck.filter(c => typeof c.punkty === 'number').length;
    const specNums = ['001', '002', '003', '004', '005', '006', '007', '008', '000'];
    const specialCardsCount = deck.filter(c => specNums.includes(c.numer)).length;
    const totalStrength = deck.reduce((sum, c) => sum + (typeof c.punkty === 'number' ? c.punkty : 0), 0);
    const heroCardsCount = deck.filter(c => c.bohater).length;

    const createStat = (text, y1, y2, color, alignCenter = true) => {
        const el = document.createElement('div');
        el.className = 'stat-item';
        el.innerHTML = text;
        const topPct = (y1 / GUI_HEIGHT) * 100;
        const heightPct = ((y2 - y1) / GUI_HEIGHT) * 100;
        el.style.position = 'absolute';
        el.style.top = `${topPct}%`;
        el.style.height = `${heightPct}%`;
        el.style.left = '50.39%'; // 1935/3840
        el.style.color = color;
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.whiteSpace = 'nowrap';
        const bgH = statsContainer.offsetHeight || window.innerHeight;
        el.style.fontSize = `${(bgH * heightPct / 100) * 0.8}px`;
        if (alignCenter) {
            el.style.transform = 'translate(-50%, 0)';
            el.style.justifyContent = 'center';
        }
        statsContainer.appendChild(el);
    };

    const C_BERZ = '#a69377', C_GOLD = '#a27e3d', C_SILA = '#35a842', C_RED = '#ff1a1a';
    createStat("Dowódca", 457, 496, C_GOLD);
    createStat("Wszystkie karty w talii", 1119, 1158, C_BERZ);
    createStat(totalCards, 1180, 1212, C_GOLD, false);
    createStat("Liczba kart jednostek", 1238, 1277, C_BERZ);
    createStat(unitCards < 22 ? `${unitCards}/22` : unitCards, 1300, 1332, unitCards < 22 ? C_RED : C_GOLD, false);
    createStat("Karty specjalne", 1360, 1399, C_BERZ);
    createStat(`${specialCardsCount}/10`, 1420, 1455, C_SILA, false);
    createStat("Całkowita Siła Jednostek", 1480, 1519, C_BERZ);
    createStat(totalStrength, 1539, 1572, C_GOLD, false);
    createStat("Karty bohaterów", 1598, 1637, C_BERZ);
    createStat(heroCardsCount, 1660, 1692, C_GOLD, false);

    if (window.opponentReady) {
        createStat("PRZECIWNIK GOTOWY", 1800, 1850, C_SILA);
    }
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
    const shield = document.querySelector('.faction-shield');
    if (shield) {
        shield.src = faction.shield;
        shield.style.width = `${106 * scale}px`;
        shield.style.height = `${110 * scale}px`;
    }

    const factionInfo = document.querySelector('.faction-info');
    if (factionInfo) {
        factionInfo.style.left = `${backgroundLeft}px`;
        factionInfo.style.top = `${backgroundTop + ((174 - 60) / GUI_HEIGHT) * backgroundHeight}px`;
    }

    const name = document.querySelector('.faction-name');
    if (name) {
        name.innerText = faction.name;
        name.style.fontSize = `${Math.min((48 / GUI_WIDTH) * backgroundWidth, (72 / GUI_WIDTH) * backgroundWidth)}px`;
        name.style.lineHeight = `${(110 / GUI_HEIGHT) * backgroundHeight}px`;
    }

    const ability = document.querySelector('.faction-ability');
    if (ability) {
        ability.innerText = faction.ability;
        ability.style.fontSize = `${Math.min((29 / GUI_WIDTH) * backgroundWidth, (43 / GUI_WIDTH) * backgroundWidth)}px`;
        ability.style.left = `${(GUI_WIDTH / 2) * scale}px`;
        ability.style.top = `${((276 - (174 - 60)) / GUI_HEIGHT) * backgroundHeight}px`;
        ability.style.transform = `translateX(-50%)`;
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
        nameDiv.innerText = selectedLeader.nazwa;
        nameDiv.style.position = 'absolute';
        nameDiv.style.left = '50%';
        nameDiv.style.top = ((guiH - 60) * scaleH) + 'px';
        nameDiv.style.transform = 'translateX(-50%)';
        nameDiv.style.fontFamily = 'PFDinTextCondPro-Bold, Cinzel, serif';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = '#474747';
        nameDiv.style.fontSize = (32 * scaleW) + 'px';
        nameDiv.style.textAlign = 'center';
        nameDiv.style.zIndex = '3';
        leaderCard.appendChild(nameDiv);
    }

    const goToGameButton = document.getElementById('goToGameButton');
    if (goToGameButton) {
        goToGameButton.style.left = `${backgroundLeft + (GUI_WIDTH / 2) * scale}px`;
        goToGameButton.style.bottom = `${(43 / GUI_HEIGHT) * backgroundHeight}px`;
        goToGameButton.style.padding = `${(10 / GUI_HEIGHT) * backgroundHeight}px ${(20 / GUI_WIDTH) * backgroundWidth}px`;
        goToGameButton.style.fontSize = `${(30 / GUI_WIDTH) * backgroundWidth}px`;
        goToGameButton.style.transform = `translateX(-50%)`;
    }

    const saveDeckButton = document.getElementById('saveDeckButton');
    if (saveDeckButton) {
        const saveY = 1850;
        saveDeckButton.style.left = `${backgroundLeft + (GUI_WIDTH / 2) * scale}px`;
        saveDeckButton.style.top = `${backgroundTop + (saveY / GUI_HEIGHT) * backgroundHeight}px`;
        saveDeckButton.style.padding = `${(8 / GUI_HEIGHT) * backgroundHeight}px ${(16 / GUI_WIDTH) * backgroundWidth}px`;
        saveDeckButton.style.fontSize = `${(24 / GUI_WIDTH) * backgroundWidth}px`;
        saveDeckButton.style.transform = `translateX(-50%)`;
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
}

export function getSelectedDeck() { return deck; }
export function getSelectedLeader() { return selectedLeader; }
