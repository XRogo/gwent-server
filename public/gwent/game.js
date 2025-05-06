import cards from './cards.js';

document.addEventListener('DOMContentLoaded', () => {
    const collectionArea = document.querySelector('.card-area.collection');
    const deckArea = document.querySelector('.card-area.deck');
    const stats = document.querySelector('.stats');
    const pageDots = document.querySelectorAll('.page-dot');
    let currentPage = 1;
    const factions = [
        { name: "Królestwa Północy", shield: "assets/asety/tpolnoc.webp", ability: "Po wygranej rundzie dobierasz 1 kartę z talii." },
        { name: "Nilfgaard", shield: "assets/asety/tnilfgaard.webp", ability: "Wygrywasz remisy." },
        { name: "Scoia'tael", shield: "assets/asety/tscoiatael.webp", ability: "Decydujesz, kto zaczyna rundę." },
        { name: "Potwory", shield: "assets/asety/tpotwory.webp", ability: "Zachowujesz losową kartę po każdej rundzie." },
        { name: "Skellige", shield: "assets/asety/tskellige.webp", ability: "Wskrzesza 2 losowe karty w trzeciej rundzie." },
    ];

    // Wyświetlanie kart
    function displayCards(filter = 'all', area = collectionArea) {
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
            cardElement.innerHTML = `<img src="${card.karta}" alt="${card.nazwa}">`;
            if (card.bohater) {
                cardElement.innerHTML += `<div class="hero-icon"></div>`;
            }
            area.appendChild(cardElement);
        });
    }

    // Inicjalne wyświetlenie kart
    displayCards();

    // Filtry
    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', () => {
            const area = button.classList.contains('collection') ? collectionArea : deckArea;
            displayCards(button.dataset.filter, area);
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
    }

    // Placeholder dla statystyk
    function updateStats() {
        stats.querySelector('.total-cards').textContent = 'Wszystkie karty w talii: 0';
        stats.querySelector('.unit-cards').textContent = 'Liczba kart jednostek: 0/22';
        stats.querySelector('.special-cards').textContent = 'Karty specjalne: 0/10';
        stats.querySelector('.total-strength').textContent = 'Całkowita siła jednostek: 0';
        stats.querySelector('.hero-cards').textContent = 'Karty bohaterów: 0';
    }

    // Interakcje klawiszowe (placeholder)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'x') console.log('Zmiana dowódcy');
        if (e.key === 'e') console.log('Dodanie karty do talii');
    });

    updatePage();
    updateStats();
});