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
        icon.style.height = `${180 * scale}px`;
        icon.style.width = 'auto';
        icon.style.objectFit = 'contain';
        icon.style.filter = 'drop-shadow(0 0 12px rgba(199, 167, 110, 0.5))';
        inner.appendChild(icon);
    }

    // Tekst
    const text = document.createElement('div');
    text.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
    text.style.fontSize = `${72 * scale}px`;
    text.style.color = '#c7a76e';
    text.style.letterSpacing = `${4 * scale}px`;
    text.style.textTransform = 'uppercase';
    text.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.8)';
    text.style.whiteSpace = 'nowrap';
    text.textContent = item.opcje.customOpis || item.opis;
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
    const czas = item.opcje.customCzas || item.czas;
    currentTimeout = setTimeout(() => {
        currentTimeout = null;
        hideBanner(() => {
            if (item.opcje.onFinish) item.opcje.onFinish();
            processQueue();
        });
    }, czas);
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

function hideBanner(callback) {
    if (!currentBanner) {
        isShowing = false;
        if (callback) callback();
        return;
    }

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

function processQueue() {
    if (bannerQueue.length > 0) {
        const next = bannerQueue.shift();
        displayBanner(next);
    }
}

/**
 * Natychmiast ukrywa baner (np. przy zmianie ekranu).
 */
export function hidePrzejscie() {
    if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }
    bannerQueue = [];
    if (currentBanner && currentBanner.parentNode) {
        currentBanner.parentNode.removeChild(currentBanner);
    }
    currentBanner = null;
    currentOnFinish = null;
    isShowing = false;
}

// Spacją pomijamy aktualny baner
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && isShowing) {
        e.preventDefault();
        skipCurrentBanner();
    }
});
