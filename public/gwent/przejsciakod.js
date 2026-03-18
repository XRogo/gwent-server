import przejscia from './przejsca.js';

const GUI_WIDTH = 3840;
const GUI_HEIGHT = 2160;
const BANNER_Y1 = 930;
const BANNER_Y2 = 1225;

let currentBanner = null;
let bannerQueue = [];
let isShowing = false;
let currentTimeout = null;
let currentOnFinish = null;

export function getIsShowing() { return isShowing; }

/**
 * Wyświetla baner przejściowy na środku ekranu.
 * @param {string} numer - numer przejścia z przejsca.js
 * @param {object} opcje - opcjonalne: { frakcja: "1"-"5", customOpis: "...", onFinish: () => {} }
 */
export function showPrzejscie(numer, opcje = {}) {
    const przejscie = przejscia.find(p => p.numer === numer);
    if (!przejscie) {
        console.warn(`[PRZEJSCIE] Nie znaleziono przejścia: ${numer}`);
        return;
    }

    const item = {
        ...przejscie,
        opcje
    };

    // Jeśli aktualnie wyświetlany jest baner, dodaj do kolejki
    if (isShowing) {
        bannerQueue.push(item);
        return;
    }

    displayBanner(item);
}

function displayBanner(item) {
    isShowing = true;

    const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
    const boardLeft = (window.innerWidth - GUI_WIDTH * scale) / 2;
    const boardTop = (window.innerHeight - GUI_HEIGHT * scale) / 2;

    const bannerHeight = (BANNER_Y2 - BANNER_Y1) * scale;
    const bannerTop = BANNER_Y1 * scale + boardTop;

    // Główny kontener banera
    const banner = document.createElement('div');
    banner.className = 'przejscie-banner';
    banner.style.position = 'fixed';
    banner.style.left = '0';
    banner.style.top = `${bannerTop}px`;
    banner.style.width = '100vw';
    banner.style.height = `${bannerHeight}px`;
    banner.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.justifyContent = 'center';
    banner.style.zIndex = '9999';
    banner.style.opacity = '0';
    banner.style.transition = 'opacity 0.4s ease-in-out';
    banner.style.pointerEvents = 'none';

    // Wewnętrzny kontener (ikona + tekst)
    const inner = document.createElement('div');
    inner.style.display = 'flex';
    inner.style.alignItems = 'center';
    inner.style.justifyContent = 'center';
    inner.style.gap = `${60 * scale}px`;
    inner.style.transform = 'translateX(-30px)';
    inner.style.transition = 'transform 0.4s ease-out';

    // Ikona
    let obrazSrc = item.obraz;
    if (item.numer === "t07" && item.obrazFrakcji && item.opcje.frakcja) {
        obrazSrc = item.obrazFrakcji[item.opcje.frakcja] || item.obraz;
    }

    if (obrazSrc) {
        const icon = document.createElement('img');
        icon.src = obrazSrc;
        // Zgodnie z wytycznymi, wielkość grafik powiększona do wielkości 4K
        // Jeśli grafika ma np. 100px na obrazku, to na planszy też ma mieć 100px (przeskalowane proporcjonalnie)
        icon.onload = () => {
            icon.style.height = `${icon.naturalHeight * scale}px`;
            icon.style.width = `${icon.naturalWidth * scale}px`;
        };
        // Fallback zanim się załaduje
        icon.style.height = `${200 * scale}px`;
        icon.style.objectFit = 'contain';
        icon.style.filter = 'drop-shadow(0 0 12px rgba(199, 167, 110, 0.5))';
        inner.appendChild(icon);
    }

    // Tekst
    const text = document.createElement('div');
    text.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
    text.style.color = '#c7a76e';
    text.style.letterSpacing = `${4 * scale}px`;
    text.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.8)';
    
    // Jeśli podano opis z \n, zamieniamy go na <br> i wyśrodkowujemy
    let contentText = item.opcje.customOpis || item.opis;
    
    // Obsługa placeholderu {czas}
    if (contentText.includes('{czas}')) {
        const remaining = item.opcje.countDown || 60;
        contentText = contentText.replace('{czas}', `${remaining}s`);
        
        // Jeśli to banner z odliczaniem, zróbmy go dynamicznym
        if (item.opcje.countDown !== undefined) {
             const timerId = setInterval(() => {
                 const current = parseInt(text.dataset.seconds || remaining) - 1;
                 if (current < 0) {
                     clearInterval(timerId);
                     return;
                 }
                 text.dataset.seconds = current;
                 text.innerHTML = (item.opcje.customOpis || item.opis).replace('{czas}', `${current}s`).replace(/\n/g, '<br>');
             }, 1000);
             text.dataset.seconds = remaining;
             banner.dataset.timerId = timerId;
        }
    }

    text.innerHTML = contentText.replace(/\n/g, '<br>');
    if (contentText.includes('\n')) {
        text.style.textAlign = 'center';
        text.style.whiteSpace = 'normal'; // Zezwala na łamanie wierszy
        text.style.lineHeight = '1.2';
    } else {
        text.style.whiteSpace = 'nowrap';
    }

    // Specjalne obsłużenie t13 (nie powiększaj, mniejsza czcionka dla długiego tekstu)
    if (item.numer === 't13' || contentText.includes('\n')) {
        text.style.textTransform = 'none';
        text.style.fontSize = `${48 * scale}px`; // mniejsza czcionka dla długich opisów
    } else {
        text.style.textTransform = 'none'; // Zmiana zgodnie z prośbą (zachowanie oryginalnej wielkości liter)
        text.style.fontSize = `${72 * scale}px`;
    }

    inner.appendChild(text);

    banner.appendChild(inner);
    document.body.appendChild(banner);
    currentBanner = banner;
    currentOnFinish = item.opcje.onFinish || null;

    // Animacja wejścia
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            banner.style.opacity = '1';
            inner.style.transform = 'translateX(0)';
        });
    });

    // Automatyczne zniknięcie
    const displayTime = item.opcje.customCzas || item.czas || 2000;
    currentTimeout = setTimeout(() => {
        // Fade Out
        banner.style.opacity = '0';
        inner.style.transform = 'translateX(30px)';
        
        setTimeout(() => {
            if (banner.dataset.timerId) clearInterval(parseInt(banner.dataset.timerId));
            banner.remove();
            currentBanner = null;
            currentOnFinish = null;
            isShowing = false;
            
            if (item.opcje.onFinish) item.opcje.onFinish();

            // Pokaż następny z kolejki
            if (bannerQueue.length > 0) {
                const next = bannerQueue.shift();
                displayBanner(next);
            }
        }, 400);
    }, displayTime);
}

function skipCurrentBanner() {
    if (!isShowing || !currentBanner) return;

    // Anuluj aktualny timeout
    if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }

    // Szybki fade-out (przyspieszony)
    currentBanner.style.transition = 'opacity 0.15s ease-out';
    currentBanner.style.opacity = '0';

    setTimeout(() => {
        if (currentBanner && currentBanner.parentNode) {
            currentBanner.parentNode.removeChild(currentBanner);
        }
        const onFinish = currentOnFinish;
        currentBanner = null;
        currentOnFinish = null;
        isShowing = false;
        if (onFinish) onFinish();
        processQueue();
    }, 150);
}

function hideBanner(callback, instant = false) {
    if (!currentBanner) {
        isShowing = false;
        if (callback) callback();
        return;
    }

    if (instant) {
        if (currentBanner && currentBanner.parentNode) {
            currentBanner.parentNode.removeChild(currentBanner);
        }
        currentBanner = null;
        currentOnFinish = null;
        isShowing = false;
        if (callback) callback();
    } else {
        currentBanner.style.opacity = '0';
        setTimeout(() => {
            if (currentBanner && currentBanner.parentNode) {
                currentBanner.parentNode.removeChild(currentBanner);
            }
            currentBanner = null;
            currentOnFinish = null;
            isShowing = false;
            if (callback) callback();
        }, 400); // Czas animacji fade-out
    }
}

function processQueue() {
    if (bannerQueue.length > 0) {
        const next = bannerQueue.shift();
        displayBanner(next);
    }
}

/**
 * Natychmiast ukrywa baner (np. przy zmianie ekranu).
 */
export function hidePrzejscie(instant = false) {
    if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }
    bannerQueue = [];
    currentOnFinish = null;
    hideBanner(null, instant);
}

// Spacją pomijamy aktualny baner
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isShowing) {
        e.preventDefault();
        skipCurrentBanner();
    }
});
