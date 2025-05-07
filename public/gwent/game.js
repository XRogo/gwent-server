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

        // Oblicz skalę na podstawie proporcji okna i tła
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        const guiAspectRatio = GUI_WIDTH / GUI_HEIGHT;

        let scale, backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop;

        if (windowAspectRatio > guiAspectRatio) {
            // Okno szersze niż tło – skalujemy do wysokości okna
            scale = overlayHeight / GUI_HEIGHT;
            backgroundWidth = GUI_WIDTH * scale;
            backgroundHeight = overlayHeight;
            backgroundLeft = overlayLeft + (overlayWidth - backgroundWidth) / 2;
            backgroundTop = overlayTop;
        } else {
            // Okno wyższe niż tło – skalujemy do szerokości okna
            scale = overlayWidth / GUI_WIDTH;
            backgroundWidth = overlayWidth;
            backgroundHeight = GUI_HEIGHT * scale;
            backgroundLeft = overlayLeft;
            backgroundTop = overlayTop + (overlayHeight - backgroundHeight) / 2;
        }

        // Przyciski kolekcji
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

        // Przyciski talii
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

        // Obszary kart
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

        // Karty
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

        // Statystyki
        stats.style.left = `${backgroundLeft + 1935 * scale}px`;
        stats.style.top = `${backgroundTop + 1152 * scale}px`;
        stats.style.fontSize = `${16 * scale}px`;

        // Przyciski przewijania
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

        // Kropki – tylko skalowanie, pozycja ustawiana w updatePage()
        pageDots.forEach(dot => {
            dot.style.width = `${25 * scale}px`;
            dot.style.height = `${22 * scale}px`;
            dot.style.marginRight = `${10 * scale}px`;
        });

        // Informacje o frakcji
        const factionInfo = document.querySelector('.faction-info');
        factionInfo.style.left = `${backgroundLeft}px`;
        factionInfo.style.top = `${backgroundTop + (174 - 60) * scale}px`; // 114 px w 4K

        // Wyśrodkowanie .faction-header (tarcza + nazwa)
        const factionHeader = document.querySelector('.faction-header');
        factionHeader.style.left = `${(GUI_WIDTH / 2) * scale}px`;
        factionHeader.style.top = `0px`;
        factionHeader.style.transform = `translateX(-50%)`;

        document.querySelector('.faction-shield').style.width = `${106 * scale}px`;
        document.querySelector('.faction-shield').style.height = `${110 * scale}px`;

        document.querySelector('.faction-name').style.fontSize = `${Math.min(48 * scale, 72 * scale)}px`;
        document.querySelector('.faction-name').style.lineHeight = `${110 * scale}px`;

        // Wyśrodkowanie .faction-ability (opis)
        const factionAbility = document.querySelector('.faction-ability');
        factionAbility.style.fontSize = `${Math.min(29 * scale, 43 * scale)}px`;
        factionAbility.style.left = `${(GUI_WIDTH / 2) * scale}px`;
        factionAbility.style.top = `${(276 - (174 - 60)) * scale}px`; // 276 px w 4K
        factionAbility.style.transform = `translateX(-50%)`;

        // Karta lidera
        document.querySelector('.leader-card').style.width = `${259 * scale}px`;
        document.querySelector('.leader-card').style.height = `${490 * scale}px`;
        document.querySelector('.leader-card').style.left = `${backgroundLeft + 1792 * scale}px`;
        document.querySelector('.leader-card').style.top = `${backgroundTop + 539 * scale}px`;

        // Przycisk "Przejdź do gry"
        const goToGameButton = document.getElementById('goToGameButton');
        goToGameButton.style.left = `${backgroundLeft + (GUI_WIDTH / 2) * scale}px`;
        goToGameButton.style.bottom = `${43 * scale}px`;
        goToGameButton.style.padding = `${10 * scale}px ${20 * scale}px`;
        goToGameButton.style.fontSize = `${30 * scale}px`;
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

        // Pozycje kropek dla każdej strony
        const baseLeft = 1850; // Pozycja pierwszej strony
        const spacing = 26; // Różnica między stronami (1876 - 1850 = 26)
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
        const leftPosition = baseLeft + (currentPage - 1) * spacing;
        document.querySelector('.page-indicators').style.left = `${backgroundLeft + leftPosition * scale}px`;
        document.querySelector('.page-indicators').style.top = `${backgroundTop + topPosition * scale}px`;

        // Po zmianie frakcji, ustaw domyślny filtr na "all" i podświetl odpowiedni przycisk
        document.querySelectorAll('.button.collection').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.button.deck').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.button.collection.all').classList.add('active');
        document.querySelector('.button.deck.all').classList.add('active');
        displayCards('all', collectionArea, faction.id);
        displayCards('all', deckArea, faction.id);
    }

    function updateStats() {
        stats.querySelector('.total-cards').textContent = '0';
        stats.querySelector('.unit-cards').textContent = '0/22';
        stats.querySelector('.special-cards').textContent = '0/10';
        stats.querySelector('.total-strength').textContent = '0';
        stats.querySelector('.hero-cards').textContent = '0';
    }

    // Ustaw domyślnie aktywny tryb "all" dla obu sekcji
    document.querySelector('.button.collection.all').classList.add('active');
    document.querySelector('.button.deck.all').classList.add('active');

    // Dodaj obsługę kliknięcia dla przycisków sortowania
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', () => {
            const area = button.classList.contains('collection') ? collectionArea : deckArea;
            const section = button.classList.contains('collection') ? 'collection' : 'deck';

            // Usuń klasę .active z obecnie aktywnego przycisku w tej sekcji
            document.querySelectorAll(`.button.${section}`).forEach(btn => {
                btn.classList.remove('active');
            });

            // Dodaj klasę .active do klikniętego przycisku
            button.classList.add('active');

            // Wyświetl karty z nowym filtrem
            displayCards(button.dataset.filter, area, factions[currentPage - 1].id);
        });
    });

    // Początkowe wyświetlenie kart z domyślnym filtrem "all"
    displayCards('all', collectionArea, factions[0].id);
    displayCards('all', deckArea, factions[0].id);

    updatePage();
    updateStats();
});