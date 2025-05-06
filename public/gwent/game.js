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
    const GUI_WIDTH = 3840; // Rozmiar tła gui.webp
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

        // Oblicz przesunięcie tła gui.webp (wyśrodkowane przez background-position: center)
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        const guiAspectRatio = GUI_WIDTH / GUI_HEIGHT;

        let backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop;

        if (windowAspectRatio > guiAspectRatio) {
            // Okno jest szersze niż tło – tło jest skalowane do wysokości okna
            backgroundHeight = overlayHeight;
            backgroundWidth = backgroundHeight * (GUI_WIDTH / GUI_HEIGHT);
            backgroundLeft = overlayLeft + (overlayWidth - backgroundWidth) / 2;
            backgroundTop = overlayTop;
        } else {
            // Okno jest wyższe niż tło – tło jest skalowane do szerokości okna
            backgroundWidth = overlayWidth;
            backgroundHeight = backgroundWidth * (GUI_HEIGHT / GUI_WIDTH);
            backgroundLeft = overlayLeft;
            backgroundTop = overlayTop + (overlayHeight - backgroundHeight) / 2;
        }

        // Przyciski kolekcji
        const buttonWidth = 97 * scaleX;
        const buttonHeight = 80 * scaleY;

        document.querySelector('.button.collection.all').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.all').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.all').style.left = `${backgroundLeft + 373 * scaleX}px`;
        document.querySelector('.button.collection.all').style.top = `${backgroundTop + 354 * scaleY}px`;
        document.querySelector('.button.collection.all').style.backgroundImage = `url('assets/wybor/all.webp')`;

        document.querySelector('.button.collection.mecz').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.mecz').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.mecz').style.left = `${backgroundLeft + 549 * scaleX}px`;
        document.querySelector('.button.collection.mecz').style.top = `${backgroundTop + 356 * scaleY}px`;
        document.querySelector('.button.collection.mecz').style.backgroundImage = `url('assets/wybor/mecz.webp')`;

        document.querySelector('.button.collection.lok').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.lok').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.lok').style.left = `${backgroundLeft + 765 * scaleX}px`;
        document.querySelector('.button.collection.lok').style.top = `${backgroundTop + 355 * scaleY}px`;
        document.querySelector('.button.collection.lok').style.backgroundImage = `url('assets/wybor/lok.webp')`;

        document.querySelector('.button.collection.obl').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.obl').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.obl').style.left = `${backgroundLeft + 916 * scaleX}px`;
        document.querySelector('.button.collection.obl').style.top = `${backgroundTop + 355 * scaleY}px`;
        document.querySelector('.button.collection.obl').style.backgroundImage = `url('assets/wybor/kapatulta.webp')`;

        document.querySelector('.button.collection.hero').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.hero').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.hero').style.left = `${backgroundLeft + 1098 * scaleX}px`;
        document.querySelector('.button.collection.hero').style.top = `${backgroundTop + 356 * scaleY}px`;
        document.querySelector('.button.collection.hero').style.backgroundImage = `url('assets/wybor/boharer.webp')`;

        document.querySelector('.button.collection.pogoda').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.pogoda').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.pogoda').style.left = `${backgroundLeft + 1277 * scaleX}px`;
        document.querySelector('.button.collection.pogoda').style.top = `${backgroundTop + 351 * scaleY}px`;
        document.querySelector('.button.collection.pogoda').style.backgroundImage = `url('assets/wybor/pogoda.webp')`;

        document.querySelector('.button.collection.specjalne').style.width = `${buttonWidth}px`;
        document.querySelector('.button.collection.specjalne').style.height = `${buttonHeight}px`;
        document.querySelector('.button.collection.specjalne').style.left = `${backgroundLeft + 1459 * scaleX}px`;
        document.querySelector('.button.collection.specjalne').style.top = `${backgroundTop + 361 * scaleY}px`;
        document.querySelector('.button.collection.specjalne').style.backgroundImage = `url('assets/wybor/inne.webp')`;

        // Przyciski talii
        document.querySelector('.button.deck.all').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.all').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.all').style.left = `${backgroundLeft + 2297 * scaleX}px`;
        document.querySelector('.button.deck.all').style.top = `${backgroundTop + 354 * scaleY}px`;
        document.querySelector('.button.deck.all').style.backgroundImage = `url('assets/wybor/all.webp')`;

        document.querySelector('.button.deck.mecz').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.mecz').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.mecz').style.left = `${backgroundLeft + 2473 * scaleX}px`;
        document.querySelector('.button.deck.mecz').style.top = `${backgroundTop + 356 * scaleY}px`;
        document.querySelector('.button.deck.mecz').style.backgroundImage = `url('assets/wybor/mecz.webp')`;

        document.querySelector('.button.deck.lok').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.lok').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.lok').style.left = `${backgroundLeft + 2679 * scaleX}px`;
        document.querySelector('.button.deck.lok').style.top = `${backgroundTop + 355 * scaleY}px`; // Poprawione z 415 na 355
        document.querySelector('.button.deck.lok').style.backgroundImage = `url('assets/wybor/lok.webp')`;

        document.querySelector('.button.deck.obl').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.obl').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.obl').style.left = `${backgroundLeft + 2840 * scaleX}px`;
        document.querySelector('.button.deck.obl').style.top = `${backgroundTop + 355 * scaleY}px`;
        document.querySelector('.button.deck.obl').style.backgroundImage = `url('assets/wybor/kapatulta.webp')`;

        document.querySelector('.button.deck.hero').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.hero').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.hero').style.left = `${backgroundLeft + 3022 * scaleX}px`;
        document.querySelector('.button.deck.hero').style.top = `${backgroundTop + 356 * scaleY}px`;
        document.querySelector('.button.deck.hero').style.backgroundImage = `url('assets/wybor/boharer.webp')`;

        document.querySelector('.button.deck.pogoda').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.pogoda').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.pogoda').style.left = `${backgroundLeft + 3201 * scaleX}px`;
        document.querySelector('.button.deck.pogoda').style.top = `${backgroundTop + 351 * scaleY}px`;
        document.querySelector('.button.deck.pogoda').style.backgroundImage = `url('assets/wybor/pogoda.webp')`;

        document.querySelector('.button.deck.specjalne').style.width = `${buttonWidth}px`;
        document.querySelector('.button.deck.specjalne').style.height = `${buttonHeight}px`;
        document.querySelector('.button.deck.specjalne').style.left = `${backgroundLeft + 3380 * scaleX}px`;
        document.querySelector('.button.deck.specjalne').style.top = `${backgroundTop + 361 * scaleY}px`;
        document.querySelector('.button.deck.specjalne').style.backgroundImage = `url('assets/wybor/inne.webp')`;

        // Obszary kart
        collectionArea.style.width = `${1195 * scaleX}px`;
        collectionArea.style.height = `${1449 * scaleY}px`;
        collectionArea.style.left = `${backgroundLeft + 366 * scaleX}px`;
        collectionArea.style.top = `${backgroundTop + 491 * scaleY}px`;
        collectionArea.style.padding = `${10 * scaleX}px`;

        deckArea.style.width = `${1193 * scaleX}px`;
        deckArea.style.height = `${1449 * scaleY}px`;
        deckArea.style.left = `${backgroundLeft + 2291 * scaleX}px`;
        deckArea.style.top = `${backgroundTop + 491 * scaleY}px`;
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
        stats.style.left = `${backgroundLeft + 1935 * scaleX}px`;
        stats.style.top = `${backgroundTop + 1152 * scaleY}px`;
        stats.style.fontSize = `${16 * scaleX}px`;

        // Przyciski przewijania
        document.querySelector('.page-left').style.width = `${49 * scaleX}px`;
        document.querySelector('.page-left').style.height = `${43 * scaleY}px`;
        document.querySelector('.page-left').style.left = `${backgroundLeft + 1452 * scaleX}px`;
        document.querySelector('.page-left').style.top = `${backgroundTop + 155 * scaleY}px`;
        document.querySelector('.page-left').style.backgroundImage = `url('assets/wybor/wlewo.webp')`;

        document.querySelector('.page-right').style.width = `${49 * scaleX}px`;
        document.querySelector('.page-right').style.height = `${43 * scaleY}px`;
        document.querySelector('.page-right').style.left = `${backgroundLeft + 2338 * scaleX}px`;
        document.querySelector('.page-right').style.top = `${backgroundTop + 154 * scaleY}px`;
        document.querySelector('.page-right').style.backgroundImage = `url('assets/wybor/wprawo.webp')`;

        // Kropki
        document.querySelector('.page-indicators').style.left = `${backgroundLeft + 1850 * scaleX}px`;
        document.querySelector('.page-indicators').style.top = `${backgroundTop + 208 * scaleY}px`;
        pageDots.forEach(dot => {
            dot.style.width = `${25 * scaleX}px`;
            dot.style.height = `${22 * scaleY}px`;
            dot.style.marginRight = `${10 * scaleX}px`;
        });

        // Informacje o frakcji
        document.querySelector('.faction-info').style.left = `${backgroundLeft + (GUI_WIDTH / 2) * scaleX}px`;
        document.querySelector('.faction-info').style.top = `${backgroundTop + 173 * scaleY}px`;
        document.querySelector('.faction-info').style.transform = `translateX(-50%)`;

        document.querySelector('.faction-shield').style.width = `${106 * scaleX}px`;
        document.querySelector('.faction-shield').style.height = `${110 * scaleY}px`;

        document.querySelector('.faction-name').style.fontSize = `${Math.min(20 * scaleX, 40 * scaleX)}px`;
        document.querySelector('.faction-ability').style.fontSize = `${Math.min(16 * scaleX, 24 * scaleX)}px`;

        // Karta lidera
        document.querySelector('.leader-card').style.width = `${259 * scaleX}px`;
        document.querySelector('.leader-card').style.height = `${490 * scaleY}px`;
        document.querySelector('.leader-card').style.left = `${backgroundLeft + 1792 * scaleX}px`;
        document.querySelector('.leader-card').style.top = `${backgroundTop + 539 * scaleY}px`;

        // Przycisk "Przejdź do gry"
        const goToGameButton = document.getElementById('goToGameButton');
        goToGameButton.style.left = `${backgroundLeft + (GUI_WIDTH / 2) * scaleX}px`;
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