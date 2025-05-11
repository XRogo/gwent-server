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

        document.querySelector('.button.collection.all').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.all').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.all').style.left = `${backgroundLeft + 373 * scale}px`;
        document.querySelector('.button.collection.all').style.top = `${backgroundTop + 354 * scale}px`;
        document.querySelector('.button.collection.all').style.backgroundImage = `url('assets/wybor/all.webp')`;

        document.querySelector('.button.collection.mecz').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.mecz').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.mecz').style.left = `${backgroundLeft + 549 * scale}px`;
        document.querySelector('.button.collection.mecz').style.top = `${backgroundTop + 356 * scale}px`;
        document.querySelector('.button.collection.mecz').style.backgroundImage = `url('assets/wybor/mecz.webp')`;

        document.querySelector('.button.collection.lok').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.lok').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.lok').style.left = `${backgroundLeft + 735 * scale}px`;
        document.querySelector('.button.collection.lok').style.top = `${backgroundTop + 355 * scale}px`;
        document.querySelector('.button.collection.lok').style.backgroundImage = `url('assets/wybor/lok.webp')`;

        document.querySelector('.button.collection.obl').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.obl').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.obl').style.left = `${backgroundLeft + 916 * scale}px`;
        document.querySelector('.button.collection.obl').style.top = `${backgroundTop + 355 * scale}px`;
        document.querySelector('.button.collection.obl').style.backgroundImage = `url('assets/wybor/kapatulta.webp')`;

        document.querySelector('.button.collection.hero').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.hero').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.hero').style.left = `${backgroundLeft + 1098 * scale}px`;
        document.querySelector('.button.collection.hero').style.top = `${backgroundTop + 356 * scale}px`;
        document.querySelector('.button.collection.hero').style.backgroundImage = `url('assets/wybor/boharer.webp')`;

        document.querySelector('.button.collection.pogoda').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.pogoda').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.pogoda').style.left = `${backgroundLeft + 1277 * scale}px`;
        document.querySelector('.button.collection.pogoda').style.top = `${backgroundTop + 351 * scale}px`;
        document.querySelector('.button.collection.pogoda').style.backgroundImage = `url('assets/wybor/pogoda.webp')`;

        document.querySelector('.button.collection.specjalne').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.specjalne').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.specjalne').style.left = `${backgroundLeft + 1459 * scale}px`;
        document.querySelector('.button.collection.specjalne').style.top = `${backgroundTop + 361 * scale}px`;
        document.querySelector('.button.collection.specjalne').style.backgroundImage = `url('assets/wybor/inne.webp')`;

        document.querySelector('.button.deck.all').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.all').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.all').style.left = `${backgroundLeft + 2297 * scale}px`;
        document.querySelector('.button.deck.all').style.top = `${backgroundTop + 354 * scale}px`;
        document.querySelector('.button.deck.all').style.backgroundImage = `url('assets/wybor/all.webp')`;

        document.querySelector('.button.deck.mecz').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.mecz').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.mecz').style.left = `${backgroundLeft + 2473 * scale}px`;
        document.querySelector('.button.deck.mecz').style.top = `${backgroundTop + 356 * scale}px`;
        document.querySelector('.button.deck.mecz').style.backgroundImage = `url('assets/wybor/mecz.webp')`;

        document.querySelector('.button.deck.lok').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.lok').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.lok').style.left = `${backgroundLeft + 2659 * scale}px`;
        document.querySelector('.button.deck.lok').style.top = `${backgroundTop + 355 * scale}px`;
        document.querySelector('.button.deck.lok').style.backgroundImage = `url('assets/wybor/lok.webp')`;

        document.querySelector('.button.deck.obl').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.obl').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.obl').style.left = `${backgroundLeft + 2840 * scale}px`;
        document.querySelector('.button.deck.obl').style.top = `${backgroundTop + 355 * scale}px`;
        document.querySelector('.button.deck.obl').style.backgroundImage = `url('assets/wybor/kapatulta.webp')`;

        document.querySelector('.button.deck.hero').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.hero').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.hero').style.left = `${backgroundLeft + 3022 * scale}px`;
        document.querySelector('.button.deck.hero').style.top = `${backgroundTop + 356 * scale}px`;
        document.querySelector('.button.deck.hero').style.backgroundImage = `url('assets/wybor/boharer.webp')`;

        document.querySelector('.button.deck.pogoda').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.pogoda').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.pogoda').style.left = `${backgroundLeft + 3201 * scale}px`;
        document.querySelector('.button.deck.pogoda').style.top = `${backgroundTop + 351 * scale}px`;
        document.querySelector('.button.deck.pogoda').style.backgroundImage = `url('assets/wybor/pogoda.webp')`;

        document.querySelector('.button.deck.specjalne').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.specjalne').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.specjalne').style.left = `${backgroundLeft + 3380 * scale}px`;
        document.querySelector('.button.deck.specjalne').style.top = `${backgroundTop + 361 * scale}px`;
        document.querySelector('.button.deck.specjalne').style.backgroundImage = `url('assets/wybor/inne.webp')`;

        collectionArea.style.width = `${1195 * scale}px`;
        collectionArea.style.height = `${1449 * scale}px`;
        collectionArea.style.left = `${backgroundLeft + 366 * scale}px`;
        collectionArea.style.top = `${backgroundTop + 491 * scale}px`;
        collectionArea.style.padding = `${10 * scale}px`;

        deckArea.style.width = `${1193 * scale}px`;
        deckArea.style.height = `${1449 * scale}px`;
        deckArea.style.left = `${backgroundLeft + 2291 * scale}px`;
        deckArea.style.top = `${backgroundTop + 491 * scale}px`;
        deckArea.style.padding = `${10 * scale}px`;

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
        });

        stats.style.left = `${backgroundLeft + 1935 * scale}px`;
        stats.style.top = `${backgroundTop + 1152 * scale}px`;
        stats.style.fontSize = `${16 * scale}px`;

        document.querySelector('.page-left').style.width = `${49 * scale}px`;
        document.querySelector('.page-left').style.height = `${43 * scale}px`;
        document.querySelector('.page-left').style.left = `${backgroundLeft + 1452 * scale}px`;
        document.querySelector('.page-left').style.top = `${backgroundTop + 155 * scale}px`;
        document.querySelector('.page-left').style.backgroundImage = `url('assets/wybor/wlewo.webp')`;

        document.querySelector('.page-right').style.width = `${49 * scale}px`;
        document.querySelector('.page-right').style.height = `${43 * scale}px`;
        document.querySelector('.page-right').style.left = `${backgroundLeft + 2338 * scale}px`;
        document.querySelector('.page-right').style.top = `${backgroundTop + 154 * scale}px`;
        document.querySelector('.page-right').style.backgroundImage = `url('assets/wybor/wprawo.webp')`;

        pageDots.forEach((dot, index) => {
            dot.style.width = `${25 * scale}px`;
            dot.style.height = `${22 * scale}px`;
            dot.style.left = `${index * 4 * scale}px`;
        });

        const factionInfo = document.querySelector('.faction-info');
        factionInfo.style.left = `${backgroundLeft}px`;
        factionInfo.style.top = `${backgroundTop + (174 - 60) * scale}px`;

        const factionHeader = document.querySelector('.faction-header');
        factionHeader.style.left = `${(GUI_WIDTH / 2) * scale}px`;
        factionHeader.style.top = `0px`;
        factionHeader.style.transform = `translateX(-50%)`;

        document.querySelector('.faction-shield').style.width = `${106 * scale}px`;
        document.querySelector('.faction-shield').style.height = `${110 * scale}px`;

        document.querySelector('.faction-name').style.fontSize = `${Math.min(48 * scale, 72 * scale)}px`;
        document.querySelector('.faction-name').style.lineHeight = `${110 * scale}px`;

        const factionAbility = document.querySelector('.faction-ability');
        factionAbility.style.fontSize = `${Math.min(29 * scale, 43 * scale)}px`;
        factionAbility.style.left = `${(GUI_WIDTH / 2) * scale}px`;
        factionAbility.style.top = `${(276 - (174 - 60)) * scale}px`;
        factionAbility.style.transform = `translateX(-50%)`;

        document.querySelector('.leader-card').style.width = `${259 * scale}px`;
        document.querySelector('.leader-card').style.height = `${490 * scale}px`;
        document.querySelector('.leader-card').style.left = `${backgroundLeft + 1792 * scale}px`;
        document.querySelector('.leader-card').style.top = `${backgroundTop + 539 * scale}px`;

        const goToGameButton = document.getElementById('goToGameButton');
        goToGameButton.style.left = `${backgroundLeft + (GUI_WIDTH / 2) * scale}px`;
        goToGameButton.style.bottom = `${43 * scale}px`;
        goToGameButton.style.padding = `${10 * scale}px ${20 * scale}px`;
        goToGameButton.style.fontSize = `${30 * scale}px`;
        goToGameButton.style.transform = `translateX(-50%)`;
    }

    window.addEventListener('resize', updatePositionsAndScaling);
    window.addEventListener('load', updatePositionsAndScaling);

function displayCards(filter = 'all', area = collectionArea, playerFaction = "nie", cardList = cards) {
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

        // Przenosimy points-bg przed power-icon, ale po faction-banner
        const isWeatherCard = ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(card.moc);
        const isSpecialCard = ['rog', 'porz', 'iporz', 'medyk', 'morale', 'spieg'].includes(card.moc);
        if (card.punkty || isWeatherCard || isSpecialCard) {
            html += `<div class="points-bg" style="background-image: url('assets/dkarty/punkty.webp');"></div>`;
            if (card.punkty) {
                html += `<div class="points" style="color: ${card.bohater ? '#fff' : '#000'};">${card.punkty}</div>`;
            }
        }

        if (card.pozycja) {
            html += `<div class="position-icon" style="background-image: url('assets/dkarty/pozycja${card.pozycja}.webp');"></div>`;
        }

        if (card.moc) {
            html += `<div class="power-icon" style="background-image: url('assets/dkarty/${card.moc}.webp');"></div>`;
        }

        if (card.bohater) {
            html += `<div class="hero-icon" style="background-image: url('assets/dkarty/bohater.webp');"></div>`;
        }

        html += `<div class="name">${card.nazwa}</div>`;

        cardElement.innerHTML = html;
        area.appendChild(cardElement);

        cardElement.addEventListener('mouseover', () => {
            hoverSound.currentTime = 0;
            hoverSound.play();
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
        const totalCards = deck.length;
        const unitCards = deck.filter(card => typeof card.punkty === 'number').length;
        const specialCards = totalCards - unitCards;
        const totalStrength = deck.reduce((sum, card) => sum + (typeof card.punkty === 'number' ? card.punkty : 0), 0);
        const heroCards = deck.filter(card => card.bohater).length;

        stats.querySelector('.total-cards').textContent = totalCards;
        stats.querySelector('.unit-cards').textContent = `${unitCards}/22`;
        stats.querySelector('.special-cards').textContent = `${specialCards}/10`;
        stats.querySelector('.total-strength').textContent = totalStrength;
        stats.querySelector('.hero-cards').textContent = heroCards;
    }

    document.getElementById('goToGameButton').addEventListener('click', () => {
        if (deck.length < 10) {
            alert('Talia musi mieć co najmniej 10 kart!');
            return;
        }
        cardSelectionScreen.style.display = 'none';
        gameScreen.style.display = 'block';
    });

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

    document.querySelector('.page-left').addEventListener('click', () => {
        currentPage = (currentPage - 2 + factions.length) % factions.length + 1;
        updatePage();
    });

    document.querySelector('.page-right').addEventListener('click', () => {
        currentPage = currentPage % factions.length + 1;
        updatePage();
    });

    function updatePage() {
        const faction = factions[currentPage - 1];
        document.querySelector('.faction-name').textContent = faction.name;
        document.querySelector('.faction-shield').src = faction.shield;
        document.querySelector('.faction-ability').textContent = faction.ability;
        pageDots.forEach(dot => dot.classList.toggle('active', parseInt(dot.dataset.page) === currentPage));
        
        const leaderCard = document.querySelector('.leader-card');
        leaderCard.innerHTML = `<img src="assets/dkarty/lider_${faction.id}.webp" style="width: 100%; height: 100%;">`;

        const baseLeft = 1850;
        const spacing = 26;
        const topPosition = 208;
        const overlay = document.querySelector('.overlay');
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
        document.querySelector('.page-indicators').style.left = `${backgroundLeft + leftPosition * scale}px`;
        document.querySelector('.page-indicators').style.top = `${backgroundTop + topPosition * scale}px`;

        document.querySelectorAll('.button.collection').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.button.deck').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.button.collection.all').classList.add('active');
        document.querySelector('.button.deck.all').classList.add('active');
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