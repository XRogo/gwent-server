// Funkcje do zapisu i odczytu talii w localStorage
// frakcja: string np. "1", dowodca: string np. "0004", karty: tablica np. ["001", "123", "123", "234"]
function saveDeck(frakcja, dowodca, karty) {
    let talie = {};
    try {
        talie = JSON.parse(localStorage.getItem('gwint_talie')) || {};
    } catch(e) {}
    talie[frakcja] = { dowodca, karty };
    localStorage.setItem('gwint_talie', JSON.stringify(talie));
}

// Zwraca obiekt: { frakcja: { dowodca, karty } }
function loadDecks() {
    try {
        return JSON.parse(localStorage.getItem('gwint_talie')) || {};
    } catch(e) { return {}; }
}

// Eksport funkcji do użycia w innych plikach
window.saveDeck = saveDeck;
window.loadDecks = loadDecks;
