import cards from './cards.js';

document.addEventListener('DOMContentLoaded', () => {
    const cardSelectionScreen = document.getElementById('cardSelectionScreen');
    const gameScreen = document.getElementById('gameScreen');
    const collectionArea = document.querySelector('.card-area.collection');
    const deckArea = document.querySelector('.card-area.deck');
    const stats = document.querySelector('.stats');
    const pageDots = document.querySelectorAll('.page-dot');
    const hoverSound = document.getElementById('hoverSound');
    let currentPage = 1;
    const GUI_WIDTH = 3840;
    const GUI_HEIGHT = 2160;
    let deck = [];

    const factions = [
        { id: "1", name: "Królestwa Północy", shield: "assets/asety/tpolnoc.webp", ability: "Za każdym razem, kiedy wygrywasz bitwę, weź o jedną kartę więcej." },
        { id: "2", name: "Cesarstwo Nilfgaardu", shield: "assets/asety/tnilfgaard.webp", ability: "Jeśli rozgrywka zakończy się remisem, to ty odnosisz zwycięstwo." },
        { id: "3", name: "Scoia'tael", shield: "assets/asety/tscoiatael.webp", ability: "Zdecyduj, kto rozpoczyna rozgrywkę." },
        { id: "4", name: "Potwory", shield: "assets/asety/tpotwory.webp", ability: "Zatrzymaj losowo wybraną jednostkę na polu bitwy po każdej rundzie." },
        { id: "5", name: "Skellige", shield: "assets/asety/tskellige.webp", ability: "W trzeciej rundzie dwie przypadkowe karty ze stosu kart odrzuconych wracają na stół." },
    ];

function updatePositionsAndScaling() {
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

    const buttonWidth = 97 * scale;
    const buttonHeight = 80 * scale;

    const buttons = [
        { selector: '.button.collection.all', left: 373, top: 354, image: 'assets/wybor/all.webp' },
        { selector: '.button.collection.mecz', left: 549, top: 356, image: 'assets/wybor/mecz.webp' },
        { selector: '.button.collection.lok', left: 735, top: 355, image: 'assets/wybor/lok.webp' },
        { selector: '.button.collection.obl', left: 916, top: 355, image: 'assets/wybor/kapatulta.webp' },
        { selector: '.button.collection.hero', left: 1098, top: 356, image: 'assets/wybor/boharer.webp' },
        { selector: '.button.collection.pogoda', left: 1277, top: 351, image: 'assets/wybor/pogoda.webp' },
        { selector: '.button.collection.specjalne', left: 1459, top: 361, image: 'assets/wybor/inne.webp' },
        { selector: '.button.deck.all', left: 2297, top: 354, image: 'assets/wybor/all.webp' },
        { selector: '.button.deck.mecz', left: 2473, top: 356, image: 'assets/wybor/mecz.webp' },
        { selector: '.button.deck.lok', left: 2659, top: 355, image: 'assets/wybor/lok.webp' },
        { selector: '.button.deck.obl', left: 2840, top: 355, image: 'assets/wybor/kapatulta.webp' },
        { selector: '.button.deck.hero', left: 3022, top: 356, image: 'assets/wybor/boharer.webp' },
        { selector: '.button.deck.pogoda', left: 3201, top: 351, image: 'assets/wybor/pogoda.webp' },
        { selector: '.button.deck.specjalne', left: 3380, top: 361, image: 'assets/wybor/inne.webp' },
    ];

    buttons.forEach(({ selector, left, top, image }) => {
        const button = document.querySelector(selector);
        if (button) {
            button.style.width = `${buttonWidth}px`;
            button.style.height = `${buttonHeight}px`;
            button.style.left = `${backgroundLeft + left * scale}px`;
            button.style.top = `${backgroundTop + top * scale}px`;
            button.style.backgroundImage = `url('${image}')`;
        }
    });

    if (collectionArea) {
        collectionArea.style.width = `${1195 * scale}px`;
        collectionArea.style.height = `${1449 * scale}px`;
        collectionArea.style.left = `${backgroundLeft + 366 * scale}px`;
        collectionArea.style.top = `${backgroundTop + 491 * scale}px`;
        collectionArea.style.padding = `${10 * scale}px`;
    }

    if (deckArea) {
        deckArea.style.width = `${1193 * scale}px`;
        deckArea.style.height = `${1449 * scale}px`;
        deckArea.style.left = `${backgroundLeft + 2291 * scale}px`;
        deckArea.style.top = `${backgroundTop + 491 * scale}px`;
        deckArea.style.padding = `${10 * scale}px`;
    }

    const cards = document.querySelectorAll('.card-area .card');
    cards.forEach(card => {
        card.style.width = `${350 * scale}px`;
        card.style.height = `${723 * scale}px`;
        card.style.margin = `${10 * scale}px`;

        const points = card.querySelector('.points');
        if (points) {
            points.style.fontSize = `${30 * scale}px`;
        }

        const name = card.querySelector('.name');
        if (name) {
            name.style.fontSize = `${16 * scale}px`;
        }

        const powerIcon = card.querySelector('.power-icon');
        if (powerIcon) {
            powerIcon.style.width = `${350 * scale}px`;
            powerIcon.style.height = `${723 * scale}px`;
            powerIcon.style.top = '0px';
            powerIcon.style.left = '0px';
        }

        // Skalowanie hero-icon
        const heroIcon = card.querySelector('.hero-icon');
        if (heroIcon) {
            heroIcon.style.width = `${310 * scale}px`; // Oryginalne 310px skalowane proporcjonalnie
            heroIcon.style.height = `${808 * scale}px`; // Oryginalne 808px skalowane proporcjonalnie
            heroIcon.style.top = `${-19 * scale}px`; // Przesunięcie skalowane proporcjonalnie
            heroIcon.style.left = `${-23 * scale}px`; // Przesunięcie skalowane proporcjonalnie
        }
    });

    if (stats) {
        stats.style.left = `${backgroundLeft + 1935 * scale}px`;
        stats.style.top = `${backgroundTop + 1152 * scale}px`;
        stats.style.fontSize = `${16 * scale}px`;
    }

    const pageLeft = document.querySelector('.page-left');
    if (pageLeft) {
        pageLeft.style.width = `${49 * scale}px`;
        pageLeft.style.height = `${43 * scale}px`;
        pageLeft.style.left = `${backgroundLeft + 1452 * scale}px`;
        pageLeft.style.top = `${backgroundTop + 155 * scale}px`;
        pageLeft.style.backgroundImage = `url('assets/wybor/wlewo.webp')`;
    }

    const pageRight = document.querySelector('.page-right');
    if (pageRight) {
        pageRight.style.width = `${49 * scale}px`;
        pageRight.style.height = `${43 * scale}px`;
        pageRight.style.left = `${backgroundLeft + 2338 * scale}px`;
        pageRight.style.top = `${backgroundTop + 154 * scale}px`;
        pageRight.style.backgroundImage = `url('assets/wybor/wprawo.webp')`;
    }

    pageDots.forEach((dot, index) => {
        if (dot) {
            dot.style.width = `${25 * scale}px`;
            dot.style.height = `${22 * scale}px`;
            dot.style.left = `${index * 4 * scale}px`;
        }
    });

    const factionInfo = document.querySelector('.faction-info');
    if (factionInfo) {
        factionInfo.style.left = `${backgroundLeft}px`;
        factionInfo.style.top = `${backgroundTop + (174 - 60) * scale}px`;
    }

    const factionHeader = document.querySelector('.faction-header');
    if (factionHeader) {
        factionHeader.style.left = `${(GUI_WIDTH / 2) * scale}px`;
        factionHeader.style.top = `0px`;
        factionHeader.style.transform = `translateX(-50%)`;
    }

    const factionShield = document.querySelector('.faction-shield');
    if (factionShield) {
        factionShield.style.width = `${106 * scale}px`;
        factionShield.style.height = `${110 * scale}px`;
    }

    const factionName = document.querySelector('.faction-name');
    if (factionName) {
        factionName.style.fontSize = `${Math.min(48 * scale, 72 * scale)}px`;
        factionName.style.lineHeight = `${110 * scale}px`;
    }

    const factionAbility = document.querySelector('.faction-ability');
    if (factionAbility) {
        factionAbility.style.fontSize = `${Math.min(29 * scale, 43 * scale)}px`;
        factionAbility.style.left = `${(GUI_WIDTH / 2) * scale}px`;
        factionAbility.style.top = `${(276 - (174 - 60)) * scale}px`;
        factionAbility.style.transform = `translateX(-50%)`;
    }

    const leaderCard = document.querySelector('.leader-card');
    if (leaderCard) {
        leaderCard.style.width = `${259 * scale}px`;
        leaderCard.style.height = `${490 * scale}px`;
        leaderCard.style.left = `${backgroundLeft + 1792 * scale}px`;
        leaderCard.style.top = `${backgroundTop + 539 * scale}px`;
    }

    const goToGameButton = document.getElementById('goToGameButton');
    if (goToGameButton) {
        goToGameButton.style.left = `${backgroundLeft + (GUI_WIDTH / 2) * scale}px`;
        goToGameButton.style.bottom = `${43 * scale}px`;
        goToGameButton.style.padding = `${10 * scale}px ${20 * scale}px`;
        goToGameButton.style.fontSize = `${30 * scale}px`;
        goToGameButton.style.transform = `translateX(-50%)`;
    }
}

    window.addEventListener('resize', updatePositionsAndScaling);
    window.addEventListener('load', updatePositionsAndScaling);

    function displayCards(filter = 'all', area = collectionArea, playerFaction = "nie", cardList = cards, isLargeView = false) {
    if (!area) return;

    while (area.firstChild) {
        area.removeChild(area.firstChild);
    }

    const filteredCards = cardList.filter(card => {
        if (card.frakcja !== playerFaction && card.frakcja !== "nie") return false;
        if (filter === 'all') return true;
        if (filter === 'miecz') return card.pozycja === 1;
        if (filter === 'luk') return card.pozycja === 2;
        if (filter === 'oblezenie') return card.pozycja === 3;
        if (filter === 'bohater') return card.bohater === true;
        if (filter === 'pogoda') return ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(card.moc);
        if (filter === 'specjalne') return ['rog', 'porz', 'iporz', 'medyk', 'morale', 'spieg'].includes(card.moc);
        return false;
    });

    filteredCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';

        let bannerFaction = card.frakcja === "nie" ? playerFaction : card.frakcja;
        if (card.nazwa === "Bies" && playerFaction !== "4") {
            bannerFaction = playerFaction;
        }

        let html = `
            <div class="card-image" style="background-image: url('${card.dkarta}');"></div>
            <div class="beton" style="background-image: url('assets/dkarty/${card.bohater ? 'bbeton.webp' : 'beton.webp'}');"></div>
            <div class="faction-banner" style="background-image: url('assets/dkarty/${bannerFaction === '1' ? 'polnoc.webp' : bannerFaction === '2' ? 'nilfgaard.webp' : bannerFaction === '3' ? 'scoiatael.webp' : bannerFaction === '4' ? 'potwory.webp' : 'skellige.webp'}');"></div>
        `;

        html += `<div class="name">${card.nazwa}</div>`;

        if (isLargeView) {
            html += `<div class="description">${card.opis || ''}</div>`;
        }

        if (!card.isKing) {
            const isWeatherCard = ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(card.moc);
            const isSpecialCard = ['rog', 'porz', 'iporz', 'medyk', 'morale', 'spieg'].includes(card.moc);

            if (card.punkty || isWeatherCard || isSpecialCard) {
                html += `<div class="points-bg" style="background-image: url('assets/dkarty/punkty.webp');"></div>`;
            }

            if (card.punkty) {
                html += `<div class="points" style="color: ${card.bohater ? '#fff' : '#000'};">${card.punkty}</div>`;
            }

            if (card.pozycja && !isWeatherCard && !isSpecialCard) {
                html += `<div class="position-icon" style="background-image: url('assets/dkarty/pozycja${card.pozycja}.webp');"></div>`;
            }

            if (card.bohater) {
                html += `<img src="assets/dkarty/bohater.webp" class="hero-icon">`;
            }

            if (card.moc) {
                html += `<img src="assets/dkarty/${card.moc}.webp" class="power-icon">`;
            }
        }

        cardElement.innerHTML = html;
        area.appendChild(cardElement);

        cardElement.addEventListener('mouseover', () => {
            if (hoverSound) {
                hoverSound.currentTime = 0;
                hoverSound.play();
            }
        });
    });

    updatePositionsAndScaling();
}
    function displayDeck() {
        displayCards('all', deckArea, factions[currentPage - 1].id, deck);
    }

    function displayCollection(filter) {
        displayCards(filter, collectionArea, factions[currentPage - 1].id);
    }

    function updateStats() {
        if (!stats) return;

        const totalCards = deck.length;
        const unitCards = deck.filter(card => typeof card.punkty === 'number').length;
        const specialCards = totalCards - unitCards;
        const totalStrength = deck.reduce((sum, card) => sum + (typeof card.punkty === 'number' ? card.punkty : 0), 0);
        const heroCards = deck.filter(card => card.bohater).length;

        const totalCardsEl = stats.querySelector('.total-cards');
        const unitCardsEl = stats.querySelector('.unit-cards');
        const specialCardsEl = stats.querySelector('.special-cards');
        const totalStrengthEl = stats.querySelector('.total-strength');
        const heroCardsEl = stats.querySelector('.hero-cards');

        if (totalCardsEl) totalCardsEl.textContent = totalCards;
        if (unitCardsEl) unitCardsEl.textContent = `${unitCards}/22`;
        if (specialCardsEl) specialCardsEl.textContent = `${specialCards}/10`;
        if (totalStrengthEl) totalStrengthEl.textContent = totalStrength;
        if (heroCardsEl) heroCardsEl.textContent = heroCards;
    }

    const goToGameButton = document.getElementById('goToGameButton');
    if (goToGameButton) {
        goToGameButton.addEventListener('click', () => {
            if (deck.length < 10) {
                alert('Talia musi mieć co najmniej 10 kart!');
                return;
            }
            if (cardSelectionScreen) cardSelectionScreen.style.display = 'none';
            if (gameScreen) gameScreen.style.display = 'block';
        });
    }

    if (collectionArea) {
        collectionArea.addEventListener('click', (event) => {
            const cardElement = event.target.closest('.card');
            if (cardElement) {
                const cardName = cardElement.querySelector('.name').textContent;
                const card = cards.find(c => c.nazwa === cardName);
                if (card) {
                    const countInDeck = deck.filter(c => c.nazwa === card.nazwa).length;
                    if (countInDeck < card.ilosc) {
                        const isUnitCard = typeof card.punkty === 'number';
                        const unitCount = deck.filter(c => typeof c.punkty === 'number').length;
                        const specialCount = deck.filter(c => typeof c.punkty !== 'number').length;
                        if ((isUnitCard && unitCount < 22) || (!isUnitCard && specialCount < 10)) {
                            deck.push({ ...card });
                            displayDeck();
                            updateStats();
                        } else {
                            alert('Osiągnięto limit kart w talii.');
                        }
                    } else {
                        alert('Nie ma więcej kopii tej karty do dodania.');
                    }
                }
            }
        });
    }

    if (deckArea) {
        deckArea.addEventListener('click', (event) => {
            const cardElement = event.target.closest('.card');
            if (cardElement) {
                const cardName = cardElement.querySelector('.name').textContent;
                const index = deck.findIndex(c => c.nazwa === cardName);
                if (index !== -1) {
                    deck.splice(index, 1);
                    displayDeck();
                    updateStats();
                }
            }
        });
    }

    const pageLeft = document.querySelector('.page-left');
    if (pageLeft) {
        pageLeft.addEventListener('click', () => {
            currentPage = (currentPage - 2 + factions.length) % factions.length + 1;
            updatePage();
        });
    }

    const pageRight = document.querySelector('.page-right');
    if (pageRight) {
        pageRight.addEventListener('click', () => {
            currentPage = currentPage % factions.length + 1;
            updatePage();
        });
    }

    function updatePage() {
        const faction = factions[currentPage - 1];
        const factionName = document.querySelector('.faction-name');
        const factionShield = document.querySelector('.faction-shield');
        const factionAbility = document.querySelector('.faction-ability');
        const leaderCard = document.querySelector('.leader-card');

        if (factionName) factionName.textContent = faction.name;
        if (factionShield) factionShield.src = faction.shield;
        if (factionAbility) factionAbility.textContent = faction.ability;

        pageDots.forEach(dot => dot.classList.toggle('active', parseInt(dot.dataset.page) === currentPage));

        if (leaderCard) {
            leaderCard.innerHTML = `<img src="assets/dkarty/lider_${faction.id}.webp" style="width: 100%; height: 100%;">`;
        }

        const baseLeft = 1850;
        const spacing = 26;
        const topPosition = 208;
        const overlay = document.querySelector('.overlay');
        if (!overlay) return;

        const overlayRect = overlay.getBoundingClientRect();
        const overlayWidth = overlayRect.width;
        const overlayHeight = overlayRect.height;
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        const guiAspectRatio = GUI_WIDTH / GUI_HEIGHT;
        let scale, backgroundLeft, backgroundTop;
        if (windowAspectRatio > guiAspectRatio) {
            scale = overlayHeight / GUI_HEIGHT;
            backgroundLeft = overlayRect.left + (overlayWidth - (GUI_WIDTH * scale)) / 2;
            backgroundTop = overlayRect.top;
        } else {
            scale = overlayWidth / GUI_WIDTH;
            backgroundLeft = overlayRect.left;
            backgroundTop = overlayRect.top + (overlayHeight - (GUI_HEIGHT * scale)) / 2;
        }
        const marginCompensation = (currentPage - 1) * (10 * scale);
        const leftPosition = baseLeft + (currentPage - 1) * spacing - marginCompensation;
        const pageIndicators = document.querySelector('.page-indicators');
        if (pageIndicators) {
            pageIndicators.style.left = `${backgroundLeft + leftPosition * scale}px`;
            pageIndicators.style.top = `${backgroundTop + topPosition * scale}px`;
        }

        document.querySelectorAll('.button.collection').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.button.deck').forEach(btn => btn.classList.remove('active'));
        const btnCollectionAll = document.querySelector('.button.collection.all');
        const btnDeckAll = document.querySelector('.button.deck.all');
        if (btnCollectionAll) btnCollectionAll.classList.add('active');
        if (btnDeckAll) btnDeckAll.classList.add('active');
        displayCollection('all');
        displayDeck();
    }

    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', () => {
            const area = button.classList.contains('collection') ? collectionArea : deckArea;
            const section = button.classList.contains('collection') ? 'collection' : 'deck';
            document.querySelectorAll(`.button.${section}`).forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            if (area === collectionArea) {
                displayCollection(button.dataset.filter);
            } else {
                displayCards(button.dataset.filter, deckArea, factions[currentPage - 1].id, deck);
            }
        });
    });

    updatePage();
    updateStats();
});