import cards from './cards.js';

document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('startScreen');
    const cardSelectionScreen = document.getElementById('cardSelectionScreen');
    const gameScreen = document.getElementById('gameScreen');
    const collectionArea = document.querySelector('.card-area.collection');
    const deckArea = document.querySelector('.card-area.deck');
    const stats = document.querySelector('.stats');
    const pageDots = document.querySelectorAll('.page-dot');
    let currentPage = 1;
    const factions = [
        { id: "1", name: "Królestwa Północy", shield: "assets/asety/tpolnoc.webp", ability: "Po wygranej rundzie dobierasz 1 kartę z talii." },
        { id: "2", name: "Cesarstwo Nilfgaardu", shield: "assets/asety/tnilfgaard.webp", ability: "Wygrywasz remisy." },
        { id: "3", name: "Scoia'tael", shield: "assets/asety/tscoiatael.webp", ability: "Decydujesz, kto zaczyna rundę." },
        { id: "4", name: "Potwory", shield: "assets/asety/tpotwory.webp", ability: "Zachowujesz losową kartę po każdej rundzie." },
        { id: "5", name: "Skellige", shield: "assets/asety/tskellige.webp", ability: "Wskrzesza 2 losowe karty w trzeciej rundzie." },
    ];

    // Przejście z ekranu startowego
    document.getElementById('startButton').addEventListener('click', () => {
        startScreen.style.display = 'none';
        cardSelectionScreen.style.display = 'block';
    });

    // Przejście do ekranu gry
    document.getElementById('goToGameButton').addEventListener('click', () => {
        cardSelectionScreen.style.display = 'none';
        gameScreen.style.display = 'block';
    });

    // Wyświetlanie kart
    function displayCards(filter = 'all', area = collectionArea, playerFaction = "nie") {
        area.innerHTML = '';
        const filteredCards = cards.filter(card => {
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
            let bannerFaction = card.frakcja;
            if (card.nazwa === "Bies" && playerFaction !== "4") {
                bannerFaction = playerFaction;
            }
            cardElement.innerHTML = `<img src="${card.dkarta}" alt="${card.nazwa}" data-faction="${bannerFaction}">`;
            area.appendChild(cardElement);
        });
    }

    // Inicjalne wyświetlenie kart
    displayCards('all', collectionArea, factions[0].id);

    // Filtry
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', () => {
            const area = button.classList.contains('collection') ? collectionArea : deckArea;
            displayCards(button.dataset.filter, area, factions[currentPage - 1].id);
        });
    });

    // Przewijanie stron
    document.querySelector('.page-left').addEventListener('click', () => {
        currentPage = (currentPage - 2 + factions.length) % factions.length + 1;
        updatePage();
    });
    document.querySelector('.page-right').addEventListener('click', () => {
        currentPage = currentPage % factions.length + 1;
        updatePage();
    });

    // Aktualizacja strony
    function updatePage() {
        const faction = factions[currentPage - 1];
        document.querySelector('.faction-name').textContent = faction.name;
        document.querySelector('.faction-shield').src = faction.shield;
        document.querySelector('.faction-ability').textContent = faction.ability;
        pageDots.forEach(dot => dot.classList.toggle('active', parseInt(dot.dataset.page) === currentPage));
        displayCards('all', collectionArea, faction.id);
    }

    // Statystyki (placeholder)
    function updateStats() {
        stats.querySelector('.total-cards').textContent = 'Wszystkie karty w talii: 0';
        stats.querySelector('.unit-cards').textContent = 'Liczba kart jednostek: 0/22';
        stats.querySelector('.special-cards').textContent = 'Karty specjalne: 0/10';
        stats.querySelector('.total-strength').textContent = 'Całkowita siła jednostek: 0';
        stats.querySelector('.hero-cards').textContent = 'Karty bohaterów: 0';
    }

    updatePage();
    updateStats();
});