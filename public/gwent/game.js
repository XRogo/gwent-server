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

    const factions = [
        { id: "1", name: "Królestwa Północy", shield: "assets/asety/tpolnoc.webp", ability: "Po wygranej rundzie dobierasz 1 kartę z talii." },
        { id: "2", name: "Cesarstwo Nilfgaardu", shield: "assets/asety/tnilfgaard.webp", ability: "Wygrywasz remisy." },
        { id: "3", name: "Scoia'tael", shield: "assets/asety/tscoiatael.webp", ability: "Decydujesz, kto zaczyna rundę." },
        { id: "4", name: "Potwory", shield: "assets/asety/tpotwory.webp", ability: "Zachowujesz losową kartę po każdej rundzie." },
        { id: "5", name: "Skellige", shield: "assets/asety/tskellige.webp", ability: "Wskrzesza 2 losowe karty w trzeciej rundzie." },
    ];

    function updatePositionsAndScaling() {
        const overlay = document.querySelector('.overlay');
        const overlayRect = overlay.getBoundingClientRect();
        const overlayWidth = overlayRect.width;
        const overlayHeight = overlayRect.height;
        const overlayLeft = overlayRect.left;
        const overlayTop = overlayRect.top;

        const scaleX = overlayWidth / GUI_WIDTH;
        const scaleY = overlayHeight / GUI_HEIGHT;

        // Przyciski kolekcji
        document.querySelector('.button.collection.all').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.collection.all').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.collection.all').style.left = `${overlayLeft + 373 * scaleX}px`;
        document.querySelector('.button.collection.all').style.top = `${overlayTop + 354 * scaleY}px`;
        document.querySelector('.button.collection.all').style.backgroundImage = `url('assets/wybor/all.webp')`;

        document.querySelector('.button.collection.mecz').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.collection.mecz').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.collection.mecz').style.left = `${overlayLeft + 549 * scaleX}px`;
        document.querySelector('.button.collection.mecz').style.top = `${overlayTop + 356 * scaleY}px`;
        document.querySelector('.button.collection.mecz').style.backgroundImage = `url('assets/wybor/mecz.webp')`;

        document.querySelector('.button.collection.lok').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.collection.lok').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.collection.lok').style.left = `${overlayLeft + 765 * scaleX}px`;
        document.querySelector('.button.collection.lok').style.top = `${overlayTop + 415 * scaleY}px`;
        document.querySelector('.button.collection.lok').style.backgroundImage = `url('assets/wybor/lok.webp')`;

        document.querySelector('.button.collection.obl').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.collection.obl').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.collection.obl').style.left = `${overlayLeft + 916 * scaleX}px`;
        document.querySelector('.button.collection.obl').style.top = `${overlayTop + 355 * scaleY}px`;
        document.querySelector('.button.collection.obl').style.backgroundImage = `url('assets/wybor/kapatulta.webp')`;

        document.querySelector('.button.collection.hero').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.collection.hero').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.collection.hero').style.left = `${overlayLeft + 1098 * scaleX}px`;
        document.querySelector('.button.collection.hero').style.top = `${overlayTop + 356 * scaleY}px`;
        document.querySelector('.button.collection.hero').style.backgroundImage = `url('assets/wybor/boharer.webp')`;

        document.querySelector('.button.collection.pogoda').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.collection.pogoda').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.collection.pogoda').style.left = `${overlayLeft + 1278 * scaleX}px`;
        document.querySelector('.button.collection.pogoda').style.top = `${overlayTop + 351 * scaleY}px`;
        document.querySelector('.button.collection.pogoda').style.backgroundImage = `url('assets/wybor/pogoda.webp')`;

        document.querySelector('.button.collection.specjalne').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.collection.specjalne').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.collection.specjalne').style.left = `${overlayLeft + 1459 * scaleX}px`;
        document.querySelector('.button.collection.specjalne').style.top = `${overlayTop + 361 * scaleY}px`;
        document.querySelector('.button.collection.specjalne').style.backgroundImage = `url('assets/wybor/inne.webp')`;

        // Przyciski talii
        document.querySelector('.button.deck.all').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.deck.all').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.deck.all').style.left = `${overlayLeft + 2299 * scaleX}px`;
        document.querySelector('.button.deck.all').style.top = `${overlayTop + 354 * scaleY}px`;
        document.querySelector('.button.deck.all').style.backgroundImage = `url('assets/wybor/all.webp')`;

        document.querySelector('.button.deck.mecz').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.deck.mecz').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.deck.mecz').style.left = `${overlayLeft + 2471 * scaleX}px`;
        document.querySelector('.button.deck.mecz').style.top = `${overlayTop + 356 * scaleY}px`;
        document.querySelector('.button.deck.mecz').style.backgroundImage = `url('assets/wybor/mecz.webp')`;

        document.querySelector('.button.deck.lok').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.deck.lok').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.deck.lok').style.left = `${overlayLeft + 2679 * scaleX}px`;
        document.querySelector('.button.deck.lok').style.top = `${overlayTop + 415 * scaleY}px`;
        document.querySelector('.button.deck.lok').style.backgroundImage = `url('assets/wybor/lok.webp')`;

        document.querySelector('.button.deck.obl').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.deck.obl').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.deck.obl').style.left = `${overlayLeft + 2840 * scaleX}px`;
        document.querySelector('.button.deck.obl').style.top = `${overlayTop + 355 * scaleY}px`;
        document.querySelector('.button.deck.obl').style.backgroundImage = `url('assets/wybor/kapatulta.webp')`;

        document.querySelector('.button.deck.hero').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.deck.hero').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.deck.hero').style.left = `${overlayLeft + 3023 * scaleX}px`;
        document.querySelector('.button.deck.hero').style.top = `${overlayTop + 356 * scaleY}px`;
        document.querySelector('.button.deck.hero').style.backgroundImage = `url('assets/wybor/boharer.webp')`;

        document.querySelector('.button.deck.pogoda').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.deck.pogoda').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.deck.pogoda').style.left = `${overlayLeft + 3202 * scaleX}px`;
        document.querySelector('.button.deck.pogoda').style.top = `${overlayTop + 351 * scaleY}px`;
        document.querySelector('.button.deck.pogoda').style.backgroundImage = `url('assets/wybor/pogoda.webp')`;

        document.querySelector('.button.deck.specjalne').style.width = `${97 * scaleX}px`;
        document.querySelector('.button.deck.specjalne').style.height = `${80 * scaleY}px`;
        document.querySelector('.button.deck.specjalne').style.left = `${overlayLeft + 3380 * scaleX}px`;
        document.querySelector('.button.deck.specjalne').style.top = `${overlayTop + 361 * scaleY}px`;
        document.querySelector('.button.deck.specjalne').style.backgroundImage = `url('assets/wybor/inne.webp')`;

        // Obszary kart
        collectionArea.style.width = `${1195 * scaleX}px`;
        collectionArea.style.height = `${1449 * scaleY}px`;
        collectionArea.style.left = `${overlayLeft + 366 * scaleX}px`;
        collectionArea.style.top = `${overlayTop + 491 * scaleY}px`;
        collectionArea.style.padding = `${10 * scaleX}px`;

        deckArea.style.width = `${1193 * scaleX}px`;
        deckArea.style.height = `${1449 * scaleY}px`;
        deckArea.style.left = `${overlayLeft + 2291 * scaleX}px`;
        deckArea.style.top = `${overlayTop + 491 * scaleY}px`;
        deckArea.style.padding = `${10 * scaleX}px`;

        // Karty
        const cards = document.querySelectorAll('.card-area .card');
        cards.forEach(card => {
            card.style.width = `${350 * scaleX}px`;
            card.style.height = `${723 * scaleY}px`;
            card.style.margin = `${10 * scaleX}px`;

            const points = card.querySelector('.points');
            if (points) {
                points.style.fontSize = `${30 * scaleX}px`;
            }

            const name = card.querySelector('.name');
            if (name) {
                name.style.fontSize = `${16 * scaleX}px`;
            }
        });

        // Statystyki
        stats.style.left = `${overlayLeft + 1935 * scaleX}px`;
        stats.style.top = `${overlayTop + 1152 * scaleY}px`;
        stats.style.fontSize = `${16 * scaleX}px`;

        // Przyciski przewijania
        document.querySelector('.page-left').style.width = `${49 * scaleX}px`;
        document.querySelector('.page-left').style.height = `${43 * scaleY}px`;
        document.querySelector('.page-left').style.left = `${overlayLeft + 1452 * scaleX}px`;
        document.querySelector('.page-left').style.top = `${overlayTop + 155 * scaleY}px`;
        document.querySelector('.page-left').style.backgroundImage = `url('assets/wybor/wlewo.webp')`;

        document.querySelector('.page-right').style.width = `${49 * scaleX}px`;
        document.querySelector('.page-right').style.height = `${43 * scaleY}px`;
        document.querySelector('.page-right').style.left = `${overlayLeft + 2338 * scaleX}px`;
        document.querySelector('.page-right').style.top = `${overlayTop + 154 * scaleY}px`;
        document.querySelector('.page-right').style.backgroundImage = `url('assets/wybor/wprawo.webp')`;

        // Kropki
        document.querySelector('.page-indicators').style.left = `${overlayLeft + 1850 * scaleX}px`;
        document.querySelector('.page-indicators').style.top = `${overlayTop + 208 * scaleY}px`;
        pageDots.forEach(dot => {
            dot.style.width = `${25 * scaleX}px`;
            dot.style.height = `${22 * scaleY}px`;
            dot.style.marginRight = `${10 * scaleX}px`;
        });

        // Informacje o frakcji
        document.querySelector('.faction-info').style.left = `${overlayLeft + (GUI_WIDTH / 2) * scaleX}px`;
        document.querySelector('.faction-info').style.top = `${overlayTop + 173 * scaleY}px`;
        document.querySelector('.faction-info').style.transform = `translateX(-50%)`;

        document.querySelector('.faction-shield').style.width = `${106 * scaleX}px`;
        document.querySelector('.faction-shield').style.height = `${110 * scaleY}px`;

        document.querySelector('.faction-name').style.fontSize = `${Math.min(20 * scaleX, 40 * scaleX)}px`;
        document.querySelector('.faction-ability').style.fontSize = `${Math.min(16 * scaleX, 24 * scaleX)}px`;

        // Karta lidera
        document.querySelector('.leader-card').style.width = `${259 * scaleX}px`;
        document.querySelector('.leader-card').style.height = `${490 * scaleY}px`;
        document.querySelector('.leader-card').style.left = `${overlayLeft + 1792 * scaleX}px`;
        document.querySelector('.leader-card').style.top = `${overlayTop + 539 * scaleY}px`;

        // Przycisk "Przejdź do gry"
        const goToGameButton = document.getElementById('goToGameButton');
        goToGameButton.style.left = `${overlayLeft + (GUI_WIDTH / 2) * scaleX}px`;
        goToGameButton.style.bottom = `${43 * scaleY}px`;
        goToGameButton.style.padding = `${10 * scaleY}px ${20 * scaleX}px`;
        goToGameButton.style.fontSize = `${30 * scaleX}px`;
        goToGameButton.style.transform = `translateX(-50%)`;
    }

    window.addEventListener('resize', updatePositionsAndScaling);
    window.addEventListener('load', updatePositionsAndScaling);

    document.getElementById('goToGameButton').addEventListener('click', () => {
        cardSelectionScreen.style.display = 'none';
        gameScreen.style.display = 'block';
    });

    function displayCards(filter = 'all', area = collectionArea, playerFaction = "nie") {
        // Usuwam wszystkie istniejące karty
        while (area.firstChild) {
            area.removeChild(area.firstChild);
        }

        const filteredCards = cards.filter(card => {
            if (card.frakcja !== playerFaction && card.frakcja !== "nie") return false;
            if (filter === 'all') return true;
            if (filter === 'miecz') return card.pozycja === 1;
            if (filter === 'luk') return card.pozycja === 2;
            if (filter === 'oblezenie') return card.pozycja === 3;
            if (filter === 'bohater') return card.bohater === true;
            if (filter === 'pogoda') return card.moc === 'pogoda';
            if (filter === 'specjalne') return card.moc === 'specjalne';
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

            if (card.pozycja) {
                html += `<div class="position-icon" style="background-image: url('assets/dkarty/pozycja${card.pozycja}.webp');"></div>`;
            }

            if (card.moc) {
                html += `<div class="power-icon" style="background-image: url('assets/dkarty/${card.moc}.webp');"></div>`;
            }

            if (card.punkty || card.moc === 'pogoda') {
                html += `<div class="points-bg" style="background-image: url('assets/dkarty/punkty.webp');"></div>`;
                if (card.punkty) {
                    html += `<div class="points" style="color: ${card.bohater ? '#fff' : '#000'};">${card.punkty}</div>`;
                }
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

    displayCards('all', collectionArea, factions[0].id);

    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', () => {
            const area = button.classList.contains('collection') ? collectionArea : deckArea;
            displayCards(button.dataset.filter, area, factions[currentPage - 1].id);
        });
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
        displayCards('all', collectionArea, faction.id);
    }

    function updateStats() {
        stats.querySelector('.total-cards').textContent = '0';
        stats.querySelector('.unit-cards').textContent = '0/22';
        stats.querySelector('.special-cards').textContent = '0/10';
        stats.querySelector('.total-strength').textContent = '0';
        stats.querySelector('.hero-cards').textContent = '0';
    }

    updatePage();
    updateStats();
});