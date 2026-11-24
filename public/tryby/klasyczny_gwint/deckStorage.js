// Funkcje do zapisu i odczytu talii w localStorage
// frakcja: string np. "1", dowodca: string np. "0004", karty: tablica np. ["001", "123", "123", "234"]
function saveDeck(frakcja, dowodca, karty) {
    let talie = {};
    try {
        talie = JSON.parse(localStorage.getItem('gwint_talie')) || {};
    } catch(e) {}
    talie[frakcja] = { dowodca, karty };
    localStorage.setItem('gwint_talie', JSON.stringify(talie));

    let updatedAt = {};
    try {
        updatedAt = JSON.parse(localStorage.getItem('gwent_deck_updated_at_v1')) || {};
    } catch (e) {}
    updatedAt[frakcja] = new Date().toISOString();
    localStorage.setItem('gwent_deck_updated_at_v1', JSON.stringify(updatedAt));

    if (typeof window.gwentSyncSavedDeck === 'function') {
        window.gwentSyncSavedDeck(String(frakcja), talie[frakcja]);
    }
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
