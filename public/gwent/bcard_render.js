/**
 * getPowerImage - returns the filename of the power icon for a given card.
 */
export function getPowerImage(card) {
    const specialCases = {
        "000": { "grzybki": "grzybki.webp" },
        "003": { "porz": "porz.webp" },
        "002": { "rog": "rog.webp" }
    };

    if (specialCases[card.numer] && specialCases[card.numer][card.moc]) {
        return specialCases[card.numer][card.moc];
    }

    const defaultImages = {
        "berserk": "berserk.webp",
        "deszcz": "deszcz.webp",
        "grzybki": "igrzybki.webp",
        "iporz": "iporz.webp",
        "manek": "manek.webp",
        "medyk": "medyk.webp",
        "mgla": "mgla.webp",
        "morale": "morale.webp",
        "mroz": "mroz.webp",
        "niebo": "niebo.webp",
        "porz": "2porz.webp",
        "rog": "irog.webp",
        "szpieg": "szpieg.webp",
        "sztorm": "sztorm.webp",
        "wezwanie": "wezwanie.webp",
        "wezwarniezza": "wezwarniezza.webp",
        "wiez": "wiz.webp"
    };

    return defaultImages[card.moc] || "";
}

/**
 * renderCardHTML - generates a standardized HTML for a big card.
 */
export function renderCardHTML(card, options = {}) {
    const {
        playerFaction = "1",
        isLargeView = false,
        isDeckView = false,
        isCollectionView = false,
        deckCount = 0,
        availableCount = 0
    } = options;

    let bannerFaction = card.frakcja === "nie" ? playerFaction : card.frakcja;
    // Special case for Bies card
    if (card.nazwa === "Bies" && playerFaction !== "4") {
        bannerFaction = playerFaction;
    }

    const bannerMap = {
        '1': 'polnoc.webp',
        '2': 'nilfgaard.webp',
        '3': 'scoiatael.webp',
        '4': 'potwory.webp',
        '5': 'skellige.webp'
    };
    const bannerImg = bannerMap[bannerFaction] || bannerMap[playerFaction] || 'polnoc.webp';

    let html = `
        <div class="card-content">
            <div class="card-image" style="background-image: url('${card.dkarta}');"></div>
            <div class="beton" style="background-image: url('assets/dkarty/${card.bohater ? 'bbeton.webp' : 'beton.webp'}');"></div>
            <div class="faction-banner" style="background-image: url('assets/dkarty/${bannerImg}');"></div>
            <div class="name">${card.nazwa}</div>
    `;

    if (isDeckView && typeof card.iloscWTalii === 'number') {
        html += `<div class="ilosc-text">x${card.iloscWTalii}</div>`;
    } else if (isCollectionView) {
        html += `<div class="ilosc-text">x${availableCount > 0 ? availableCount : 0}</div>`;
    }

    if (isLargeView) {
        html += `<div class="description">${card.opis || ''}</div>`;
    }

    if (!card.isKing) {
        const isWeatherCard = ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(card.moc);

        if (card.punkty !== undefined || isWeatherCard || ['rog', 'porz', 'iporz', 'medyk', 'morale', 'szpieg', 'manek', 'wezwanie', 'wezwarniezza', 'wiez', 'grzybki'].includes(card.moc)) {
            html += `<div class="points-bg" style="background-image: url('assets/dkarty/punkty.webp');"></div>`;
        }

        if (card.punkty !== undefined) {
            html += `<div class="points" style="color: ${card.bohater ? '#fff !important' : '#000 !important'};">${card.punkty}</div>`;
        }

        if (card.moc) {
            const powerImage = getPowerImage(card);
            if (powerImage) {
                html += `<img src="assets/dkarty/${powerImage}" class="power-icon">`;
            }
        }

        if (card.pozycja && !isWeatherCard) {
            if (card.pozycja === 4 && !card.moc) {
                html += `<div class="position-icon" style="background-image: url('assets/dkarty/zrecznoac.webp');"></div>`;
            } else {
                html += `<div class="position-icon" style="background-image: url('assets/dkarty/pozycja${card.pozycja}.webp');"></div>`;
            }
        }

        if (card.bohater) {
            html += `<img src="assets/dkarty/bohater.webp" class="hero-icon">`;
        }
    }

    html += `
            <img class="ilosc-layer" src="assets/dkarty/ilosc.webp">
        </div>
    `;

    return html;
}
