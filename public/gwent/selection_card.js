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
    const container = document.getElementById('cardSelectionScreen');
    if (!overlay || !container || container.style.display === 'none') return;

    const overlayRect = overlay.getBoundingClientRect();
    const scale = overlayRect.height / GUI_HEIGHT;
    const backgroundWidth = GUI_WIDTH * scale;
    const backgroundHeight = overlayRect.height;
    const backgroundLeft = overlayRect.left + (overlayRect.width - backgroundWidth) / 2;
    const backgroundTop = overlayRect.top;

    const buttons = [
        { selector: '.button.collection.all', left: 9.71, top: 16.38, img: 'all' },
        { selector: '.button.collection.mecz', left: 14.32, top: 16.48, img: 'mecz' },
        { selector: '.button.collection.lok', left: 19.14, top: 16.43, img: 'lok' },
        { selector: '.button.collection.obl', left: 23.85, top: 16.43, img: 'kapatulta' },
        { selector: '.button.collection.hero', left: 28.59, top: 16.48, img: 'boharer' },
        { selector: '.button.collection.pogoda', left: 33.28, top: 16.25, img: 'pogoda' },
        { selector: '.button.collection.specjalne', left: 38.02, top: 16.71, img: 'inne' }
    ];
    // ... similarly for deck buttons (index 59.86+)

    const faction = factions[currentPage - 1];
    const shield = document.querySelector('.faction-shield');
    if (shield) shield.src = faction.shield;
    const name = document.querySelector('.faction-name');
    if (name) {
        name.innerText = faction.name;
        name.style.fontSize = `${48 * scale}px`;
    }
    const ability = document.querySelector('.faction-ability');
    if (ability) {
        ability.innerText = faction.ability;
        ability.style.fontSize = `${29 * scale}px`;
    }

    const leaderCard = document.querySelector('.leader-card');
    if (leaderCard && selectedLeader) {
        leaderCard.innerHTML = `<img src="${selectedLeader.dkarta}" style="width:100%;height:100%;object-fit:contain;border-radius:12px;">`;
        const guiLeft = 1792, guiTop = 538, guiW = 2051 - 1792, guiH = 1029 - 538;
        leaderCard.style.left = (backgroundLeft + guiLeft * scale) + 'px';
        leaderCard.style.top = (backgroundTop + guiTop * scale) + 'px';
        leaderCard.style.width = (guiW * scale) + 'px';
        leaderCard.style.height = (guiH * scale) + 'px';
    }
}

export function getSelectedDeck() { return deck; }
export function getSelectedLeader() { return selectedLeader; }
