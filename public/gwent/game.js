import cards from './cards.js';
import { krole } from './krole.js';
import { showPowiek } from './powiek.js';

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
    let deck = [];
    let selectedLeader = null;

    const factions = [
        { id: "1", name: "Królestwa Północy", shield: "assets/asety/tpolnoc.webp", ability: "Za każdym razem, kiedy wygrywasz bitwę, weź o jedną kartę więcej." },
        { id: "2", name: "Cesarstwo Nilfgaardu", shield: "assets/asety/tnilfgaard.webp", ability: "Jeśli rozgrywka zakończy się remisem, to ty odnosisz zwycięstwo." },
        { id: "3", name: "Scoia'tael", shield: "assets/asety/tscoiatael.webp", ability: "Zdecyduj, kto rozpoczyna rozgrywkę." },
        { id: "4", name: "Potwory", shield: "assets/asety/tpotwory.webp", ability: "Zatrzymaj losowo wybraną jednostkę na polu bitwy po każdej rundzie." },
        { id: "5", name: "Skellige", shield: "assets/asety/tskellige.webp", ability: "W trzeciej rundzie dwie przypadkowe karty ze stosu kart odrzuconych wracają na stół." },
    ];

    function getPowerImage(card) {
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

    function updatePositionsAndScaling() {
        const overlay = document.querySelector('.overlay');
        if (!overlay) return;
        // Dodaję aktualną frakcję
        const faction = factions[currentPage - 1];

        const overlayRect = overlay.getBoundingClientRect();
        const overlayWidth = overlayRect.width;
        const overlayHeight = overlayRect.height;
        const overlayLeft = overlayRect.left;
        const overlayTop = overlayRect.top;

        const windowAspectRatio = window.innerWidth / window.innerHeight;
        const guiAspectRatio = GUI_WIDTH / GUI_HEIGHT;

        let scale, backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop;

        if (windowAspectRatio > guiAspectRatio) {
            scale = overlayHeight / GUI_HEIGHT;
            backgroundWidth = GUI_WIDTH * scale;
            backgroundHeight = overlayHeight;
            backgroundLeft = overlayLeft + (overlayWidth - backgroundWidth) / 2;
            backgroundTop = overlayTop;
        } else {
            scale = overlayWidth / GUI_WIDTH;
            backgroundWidth = overlayWidth;
            backgroundHeight = GUI_HEIGHT * scale;
            backgroundLeft = overlayLeft;
            backgroundTop = overlayTop + (overlayHeight - backgroundHeight) / 2;
        }

        const buttons = [
            { selector: '.button.collection.all', left: 9.713542, top: 16.388889, image: 'assets/wybor/all.webp' },
            { selector: '.button.collection.mecz', left: 14.322917, top: 16.481481, image: 'assets/wybor/mecz.webp' },
            { selector: '.button.collection.lok', left: 19.140625, top: 16.435185, image: 'assets/wybor/lok.webp' },
            { selector: '.button.collection.obl', left: 23.854167, top: 16.435185, image: 'assets/wybor/kapatulta.webp' },
            { selector: '.button.collection.hero', left: 28.593750, top: 16.481481, image: 'assets/wybor/boharer.webp' },
            { selector: '.button.collection.pogoda', left: 33.281250, top: 16.250000, image: 'assets/wybor/pogoda.webp' },
            { selector: '.button.collection.specjalne', left: 38.020833, top: 16.712963, image: 'assets/wybor/inne.webp' },
            { selector: '.button.deck.all', left: 59.869792, top: 16.388889, image: 'assets/wybor/all.webp' },
            { selector: '.button.deck.mecz', left: 64.401042, top: 16.481481, image: 'assets/wybor/mecz.webp' },
            { selector: '.button.deck.lok', left: 69.218750, top: 16.435185, image: 'assets/wybor/lok.webp' },
            { selector: '.button.deck.obl', left: 73.958333, top: 16.435185, image: 'assets/wybor/kapatulta.webp' },
            { selector: '.button.deck.hero', left: 78.697917, top: 16.481481, image: 'assets/wybor/boharer.webp' },
            { selector: '.button.deck.pogoda', left: 83.390625, top: 16.250000, image: 'assets/wybor/pogoda.webp' },
            { selector: '.button.deck.specjalne', left: 88.020833, top: 16.712963, image: 'assets/wybor/inne.webp' },
        ];

        buttons.forEach(({ selector, left, top, image }) => {
            const button = document.querySelector(selector);
            if (button) {
                button.style.width = `${(97 / GUI_WIDTH) * 100}%`;
                button.style.height = `${(80 / GUI_HEIGHT) * 100}%`;
                button.style.left = `${backgroundLeft + (left * backgroundWidth) / 100}px`;
                button.style.top = `${backgroundTop + (top * backgroundHeight) / 100}px`;
                button.style.backgroundImage = `url('${image}')`;
            }
        });

        if (collectionArea) {
            // Współrzędne z infoo.txt dla kolekcji: 366, 491 - 1561, 1940
            // UPDATE: Rozszerzamy do środka (do 1750), żeby zmieścić 3 duże karty
            const cLeft = 366, cTop = 491, cRight = 1750, cBottom = 1940;
            const cWidth = cRight - cLeft;
            const cHeight = cBottom - cTop;

            const areaLeft = backgroundLeft + (cLeft / GUI_WIDTH) * backgroundWidth;
            const areaTop = backgroundTop + (cTop / GUI_HEIGHT) * backgroundHeight;
            const areaWidth = (cWidth / GUI_WIDTH) * backgroundWidth;
            const areaHeight = (cHeight / GUI_HEIGHT) * backgroundHeight;

            collectionArea.style.left = `${areaLeft}px`;
            collectionArea.style.top = `${areaTop}px`;
            collectionArea.style.width = `${areaWidth}px`;
            collectionArea.style.height = `${areaHeight}px`; // Wymuszamy wysokość
            collectionArea.style.maxHeight = `${areaHeight}px`;

            updateCardArea(collectionArea, areaWidth, areaHeight);
        }
        if (deckArea) {
            // Współrzędne z infoo.txt dla talii: 2290, 491 - 3484, 1940
            // UPDATE: Rozszerzamy od środka (od 2100), żeby zmieścić 3 duże karty
            const dLeft = 2100, dTop = 491, dRight = 3484, dBottom = 1940;
            const dWidth = dRight - dLeft;
            const dHeight = dBottom - dTop;

            const areaLeft = backgroundLeft + (dLeft / GUI_WIDTH) * backgroundWidth;
            const areaTop = backgroundTop + (dTop / GUI_HEIGHT) * backgroundHeight;
            const areaWidth = (dWidth / GUI_WIDTH) * backgroundWidth;
            const areaHeight = (dHeight / GUI_HEIGHT) * backgroundHeight;

            deckArea.style.left = `${areaLeft}px`;
            deckArea.style.top = `${areaTop}px`;
            deckArea.style.width = `${areaWidth}px`;
            deckArea.style.height = `${areaHeight}px`; // Wymuszamy wysokość
            deckArea.style.maxHeight = `${areaHeight}px`;

            updateCardArea(deckArea, areaWidth, areaHeight);
        }

        function updateCardArea(area, areaWidth, areaHeight) {
            const COLS = 3;
            // Gap z infoo.txt p.119 (35px, 30px)
            const GAP_X = (35 / GUI_WIDTH) * backgroundWidth;
            const GAP_Y = (30 / GUI_HEIGHT) * backgroundHeight;
            const SCROLLBAR_WIDTH = 25;
            const PADDING_LEFT = 5;

            // Ścisły layout: karty muszą wejść w areaWidth
            // Obliczamy efektywną szerokość, odejmując WSZYSTKIE marginesy
            const effectiveWidth = areaWidth - SCROLLBAR_WIDTH - PADDING_LEFT;

            // Szerokość karty
            let cardWidth = (effectiveWidth - ((COLS - 1) * GAP_X)) / COLS;

            // Floor i SAFETY MARGIN (-1px) żeby na 100% nie przeskoczyło przez zaokrąglenia
            cardWidth = Math.floor(cardWidth) - 1;

            // Stylizacja obszaru
            area.style.width = `${areaWidth}px`;
            area.style.overflowY = 'auto';
            area.style.overflowX = 'hidden';
            area.style.display = 'flex';
            area.style.flexWrap = 'wrap';
            area.style.alignContent = 'flex-start';
            area.style.justifyContent = 'flex-start';

            // Paddingi
            area.style.paddingLeft = `${PADDING_LEFT}px`;
            area.style.paddingRight = `${SCROLLBAR_WIDTH}px`;
            area.style.paddingTop = `${(10 / GUI_HEIGHT) * backgroundHeight}px`;
            area.style.paddingBottom = `${(20 / GUI_HEIGHT) * backgroundHeight}px`;

            area.style.gap = `${GAP_Y}px ${GAP_X}px`;

            area.querySelectorAll('.card').forEach(card => {
                card.style.width = `${cardWidth}px`;
                const aspectRatio = 523 / 992;
                const cardHeight = cardWidth / aspectRatio;
                card.style.height = `${cardHeight}px`;

                card.style.margin = '0';
                card.style.padding = '0';
                card.style.boxSizing = 'border-box';
                card.style.flex = `0 0 ${cardWidth}px`;
                card.style.maxWidth = `${cardWidth}px`;
                card.style.fontSize = `${cardWidth / 12}px`;
            });
        }

        if (stats) {
            stats.style.left = `${backgroundLeft + (1935 / GUI_WIDTH) * backgroundWidth}px`;
            stats.style.top = `${backgroundTop + (1152 / GUI_HEIGHT) * backgroundHeight}px`;
            stats.style.fontSize = `${(16 / GUI_WIDTH) * backgroundWidth}px`;
        }

        const pageLeft = document.querySelector('.page-left');
        if (pageLeft) {
            pageLeft.style.width = `${(49 / GUI_WIDTH) * 100}%`;
            pageLeft.style.height = `${(43 / GUI_HEIGHT) * 100}%`;
            pageLeft.style.left = `${backgroundLeft + (1452 / GUI_WIDTH) * backgroundWidth}px`;
            pageLeft.style.top = `${backgroundTop + (155 / GUI_HEIGHT) * backgroundHeight}px`;
            pageLeft.style.backgroundImage = `url('assets/wybor/wlewo.webp')`;
        }

        const pageRight = document.querySelector('.page-right');
        if (pageRight) {
            pageRight.style.width = `${(49 / GUI_WIDTH) * 100}%`;
            pageRight.style.height = `${(43 / GUI_HEIGHT) * 100}%`;
            pageRight.style.left = `${backgroundLeft + (2338 / GUI_WIDTH) * backgroundWidth}px`;
            pageRight.style.top = `${backgroundTop + (154 / GUI_HEIGHT) * backgroundHeight}px`;
            pageRight.style.backgroundImage = `url('assets/wybor/wprawo.webp')`;
        }

        pageDots.forEach((dot, index) => {
            if (dot) {
                dot.style.width = `${(25 / GUI_WIDTH) * 100}%`;
                dot.style.height = `${(22 / GUI_HEIGHT) * 100}%`;
                dot.style.left = `${index * (4 / GUI_WIDTH) * backgroundWidth}px`;
            }
        });

        const factionInfo = document.querySelector('.faction-info');
        if (factionInfo) {
            factionInfo.style.left = `${backgroundLeft}px`;
            factionInfo.style.top = `${backgroundTop + ((174 - 60) / GUI_HEIGHT) * backgroundHeight}px`;
        }

        const factionHeader = document.querySelector('.faction-header');
        if (factionHeader) {
            factionHeader.style.left = `${(GUI_WIDTH / 2) * scale}px`;
            factionHeader.style.top = `0px`;
            factionHeader.style.transform = `translateX(-50%)`;
        }

        const factionShield = document.querySelector('.faction-shield');
        if (factionShield) {
            factionShield.style.width = `${106 * scale}px`;
            factionShield.style.height = `${110 * scale}px`;
        }

        const factionName = document.querySelector('.faction-name');
        if (factionName) {
            factionName.style.fontSize = `${Math.min((48 / GUI_WIDTH) * backgroundWidth, (72 / GUI_WIDTH) * backgroundWidth)}px`;
            factionName.style.lineHeight = `${(110 / GUI_HEIGHT) * backgroundHeight}px`;
        }

        const factionAbility = document.querySelector('.faction-ability');
        if (factionAbility) {
            factionAbility.style.fontSize = `${Math.min((29 / GUI_WIDTH) * backgroundWidth, (43 / GUI_WIDTH) * backgroundWidth)}px`;
            factionAbility.style.left = `${(GUI_WIDTH / 2) * scale}px`;
            factionAbility.style.top = `${((276 - (174 - 60)) / GUI_HEIGHT) * backgroundHeight}px`;
            factionAbility.style.transform = `translateX(-50%)`;
        }

        const leaderCard = document.querySelector('.leader-card');
        if (leaderCard) {
            leaderCard.innerHTML = '';
            const leaders = krole.filter(krol => krol.frakcja === faction.id);
            const selected = selectedLeader && selectedLeader.frakcja === faction.id ? selectedLeader : leaders[0];
            if (selected) {
                // Skalowanie względem GUI (gui.webp)
                const guiLeft = 1792, guiTop = 538, guiW = 2051 - 1792, guiH = 1029 - 538;
                const scaleW = backgroundWidth / GUI_WIDTH;
                const scaleH = backgroundHeight / GUI_HEIGHT;
                leaderCard.style.position = 'absolute';
                leaderCard.style.left = (backgroundLeft + guiLeft * scaleW) + 'px';
                leaderCard.style.top = (backgroundTop + guiTop * scaleH) + 'px';
                leaderCard.style.width = (guiW * scaleW) + 'px';
                leaderCard.style.height = (guiH * scaleH) + 'px';
                leaderCard.style.background = 'none';
                // Tło
                const tlo = document.createElement('div');
                tlo.className = 'leader-bg';
                tlo.style.position = 'absolute';
                tlo.style.left = '0';
                tlo.style.top = '0';
                tlo.style.width = '100%';
                tlo.style.height = '100%';
                tlo.style.background = '#000';
                tlo.style.opacity = '0.1';
                tlo.style.zIndex = '0';
                leaderCard.appendChild(tlo);
                // Beton
                const beton = document.createElement('div');
                beton.className = 'beton';
                beton.style.position = 'absolute';
                beton.style.left = '0';
                beton.style.top = '0';
                beton.style.width = '100%';
                beton.style.height = '100%';
                beton.style.backgroundImage = "url('assets/dkarty/beton.webp')";
                beton.style.backgroundSize = 'cover';
                beton.style.backgroundRepeat = 'no-repeat';
                beton.style.zIndex = '1';
                leaderCard.appendChild(beton);
                // Obraz karty
                const img = document.createElement('img');
                img.src = selected.dkarta;
                img.style.position = 'absolute';
                img.style.left = '0';
                img.style.top = '0';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.borderRadius = '12px';
                img.style.boxShadow = '0 0 16px #000';
                img.style.zIndex = '2';
                leaderCard.appendChild(img);
                // Nazwa dowódcy
                const nameDiv = document.createElement('div');
                nameDiv.innerText = selected.nazwa;
                nameDiv.style.position = 'absolute';
                nameDiv.style.left = '50%';
                nameDiv.style.top = ((guiH - 60) * scaleH) + 'px'; // wysokość jak na zwykłych kartach
                nameDiv.style.transform = 'translateX(-50%)';
                nameDiv.style.fontFamily = 'PFDinTextCondPro-Bold, Cinzel, serif';
                nameDiv.style.fontWeight = 'bold';
                nameDiv.style.color = '#474747';
                nameDiv.style.fontSize = (32 * scaleW) + 'px';
                nameDiv.style.textAlign = 'center';
                nameDiv.style.zIndex = '3';
                leaderCard.appendChild(nameDiv);
            }
        }

        const goToGameButton = document.getElementById('goToGameButton');
        if (goToGameButton) {
            goToGameButton.style.left = `${backgroundLeft + (GUI_WIDTH / 2) * scale}px`;
            goToGameButton.style.bottom = `${(43 / GUI_HEIGHT) * backgroundHeight}px`;
            goToGameButton.style.padding = `${(10 / GUI_HEIGHT) * backgroundHeight}px ${(20 / GUI_WIDTH) * backgroundWidth}px`;
            goToGameButton.style.fontSize = `${(30 / GUI_WIDTH) * backgroundWidth}px`;
            goToGameButton.style.transform = `translateX(-50%)`;
        }
    }

    window.addEventListener('resize', updatePositionsAndScaling);
    window.addEventListener('load', updatePositionsAndScaling);

    function displayDeck() {
        const grouped = groupDeck(deck);
        displayCards('all', deckArea, factions[currentPage - 1].id, grouped, false, deck);
    }

    function displayCollection(filter) {
        displayCards(filter, collectionArea, factions[currentPage - 1].id, cards, false, deck);
    }

    function displayCards(filter = 'all', area = collectionArea, playerFaction = "nie", cardList = cards, isLargeView = false, deckArg = deck) {
        if (!area) return;

        // Zachowaj pozycję scrolla
        const scrollTop = area.scrollTop;

        while (area.firstChild) {
            area.removeChild(area.firstChild);
        }

        let filteredCards = cardList.filter(card => {
            if (card.frakcja !== playerFaction && card.frakcja !== "nie") return false;
            if (filter === 'all') return true;
            if (filter === 'miecz') return card.pozycja === 1;
            if (filter === 'luk') return card.pozycja === 2;
            if (filter === 'oblezenie') return card.pozycja === 3;
            if (filter === 'bohater') return card.bohater === true;
            if (filter === 'pogoda') return ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(card.moc);
            if (filter === 'specjalne') return ['rog', 'porz', 'iporz', 'medyk', 'morale', 'szpieg', 'manek', 'wezwanie', 'wezwarniezza', 'wiez', 'grzybki'].includes(card.moc);
            return false;
        });

        if (area === collectionArea) {
            filteredCards = filteredCards.filter(card => {
                let countInDeck = 0;
                if (Array.isArray(deckArg)) {
                    countInDeck = deckArg.filter(c => c.numer === card.numer).length;
                }
                const available = (typeof card.ilosc === 'number' ? card.ilosc : 1) - countInDeck;
                return available > 0;
            });
        }

        filteredCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.setAttribute('data-numer', card.numer);

            let bannerFaction = card.frakcja === "nie" ? playerFaction : card.frakcja;
            if (card.nazwa === "Bies" && playerFaction !== "4") {
                bannerFaction = playerFaction;
            }

            // --- BRAK LOKALNEGO GLOW (jest globalny) ---

            // 2. Kontener na treść karty (beton i reszta)
            const contentContainer = document.createElement('div');
            contentContainer.className = 'card-content';

            let html = `
                <div class="card-image" style="background-image: url('${card.dkarta}');"></div>
                <div class="beton" style="background-image: url('assets/dkarty/${card.bohater ? 'bbeton.webp' : 'beton.webp'}');"></div>
                <div class="faction-banner" style="background-image: url('assets/dkarty/${bannerFaction === '1' ? 'polnoc.webp' : bannerFaction === '2' ? 'nilfgaard.webp' : bannerFaction === '3' ? 'scoiatael.webp' : bannerFaction === '4' ? 'potwory.webp' : 'skellige.webp'}');"></div>
            `;

            html += `<div class="name">${card.nazwa}</div>`;

            // Licznik ilości kart
            if (area === deckArea && typeof card.iloscWTalii === 'number') {
                html += `<div class="ilosc-text">x${card.iloscWTalii}</div>`;
            } else if (area === collectionArea && typeof card.ilosc === 'number') {
                let countInDeck = 0;
                if (Array.isArray(deckArg)) {
                    countInDeck = deckArg.filter(c => c.numer === card.numer).length;
                }
                const available = card.ilosc - countInDeck;
                html += `<div class="ilosc-text">x${available > 0 ? available : 0}</div>`;
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

            contentContainer.innerHTML = html;
            cardElement.appendChild(contentContainer);
            area.appendChild(cardElement);

            const iloscLayer = document.createElement('img');
            iloscLayer.className = 'ilosc-layer';
            iloscLayer.src = 'assets/dkarty/ilosc.webp';
            contentContainer.appendChild(iloscLayer); // Dodajemy do contentContainer
        });


        updatePositionsAndScaling();

        // Przywróć pozycję scrolla
        if (scrollTop > 0) {
            area.scrollTop = scrollTop;
        }
    }

    function displayDeck() {
        const grouped = groupDeck(deck);
        displayCards('all', deckArea, factions[currentPage - 1].id, grouped, false, deck);
    }

    function displayCollection(filter) {
        displayCards(filter, collectionArea, factions[currentPage - 1].id, cards, false, deck);
    }

    function updateStats() {
        if (!stats) return;
        stats.innerHTML = ''; // Clear previous stats

        const faction = factions[currentPage - 1];

        // Obliczenia
        const totalCards = deck.length;
        // Karty jednostek (punkty number) ale NIE specjalne/pogodowe? 
        // User: "suma kart bochaterów i zwykłyc (nie liczysz kart dowódców i specjalnych)"
        const unitCards = deck.filter(c => typeof c.punkty === 'number').length;

        // Specjalne: 001-008, 000
        const specialLimitNumbers = ['001', '002', '003', '004', '005', '006', '007', '008', '000'];
        const specialCardsCount = deck.filter(c => specialLimitNumbers.includes(c.numer)).length;

        // Wszystkie w talii (specjalne + bohaterów + zwykłych) - czyli deck.length
        // User: "suma wszystkich kart w talii specjalnych bochaterów zwykłych (nie liczy dowódców)" -> deck.length (dowódca jest osobno)

        // Siła: suma "punkty"
        const totalStrength = deck.reduce((sum, card) => sum + (typeof card.punkty === 'number' ? card.punkty : 0), 0);

        // Bohaterowie
        const heroCardsCount = deck.filter(card => card.bohater).length;

        // Skalowanie dla stats
        // Używamy backgroundWidth/Height z updatePositionsAndScaling? 
        // Musimy je pobrać z DOM elementu overlay lub przeliczyć ponownie.
        // Najlepiej pobrać aktualne wymiary obszaru kolekcji i przeliczyć proporcje, 
        // albo po prostu użyć tych samych zmiennych co w updatePositionsAndScaling (musimy je mieć globalne lub przeliczyć).

        const overlay = document.querySelector('.overlay');
        if (!overlay) return;
        const overlayRect = overlay.getBoundingClientRect();

        // Skalowanie (uproszczone, to samo co w updatePositionsAndScaling)
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        const guiAspectRatio = GUI_WIDTH / GUI_HEIGHT;
        let scale, bgWidth, bgHeight, bgLeft, bgTop;

        if (windowAspectRatio > guiAspectRatio) {
            scale = overlayRect.height / GUI_HEIGHT;
            bgWidth = GUI_WIDTH * scale;
            bgHeight = overlayRect.height;
            bgLeft = overlayRect.left + (overlayRect.width - bgWidth) / 2;
            bgTop = overlayRect.top;
        } else {
            scale = overlayRect.width / GUI_WIDTH;
            bgWidth = overlayRect.width;
            bgHeight = GUI_HEIGHT * scale;
            bgLeft = overlayRect.left;
            bgTop = overlayRect.top + (overlayRect.height - bgHeight) / 2;
        }

        const createStat = (text, type, y1, y2, color, alignCenter = true, isValue = false) => {
            const el = document.createElement('div');
            el.className = `stat-item ${type}`;
            el.textContent = text;

            // Pozycje scaling
            const top = bgTop + (y1 / GUI_HEIGHT) * bgHeight;
            const height = ((y2 - y1) / GUI_HEIGHT) * bgHeight;
            const left = bgLeft + (1935 / GUI_WIDTH) * bgWidth; // Oś X=1935

            el.style.position = 'absolute';
            el.style.top = `${top}px`;
            el.style.height = `${height}px`;
            el.style.left = `${left}px`;
            el.style.color = color;
            el.style.display = 'flex';
            el.style.alignItems = 'center'; // Pionowe centrowanie
            el.style.whiteSpace = 'nowrap';
            el.style.fontFamily = 'PFDinTextCondPro, sans-serif';
            el.style.fontSize = `${height * 0.8}px`; // Dopasuj font do wysokości

            // Centrowanie poziome względem osi 1935
            if (alignCenter) {
                el.style.transform = 'translate(-50%, 0)';
                el.style.justifyContent = 'center';
            } else {
                // Jeśli nie centrowane, to zaczyna się od osi? User pisał "od*"
                // "od* - nazwa/cyfra nie może przekroczyć tej granicy w lewo (zaczynaj pisać od tej pozycji)"
                // Czyli text-align left, start at left.
                el.style.justifyContent = 'flex-start';
                // Bez translate
            }

            // Override dla font size jeśli za duży
            // el.style.fontSize = ...
            stats.appendChild(el);
        };

        // Kolory
        const C_BERZ = '#a69377';
        const C_BERZNM = '#a27e3d';
        const C_SILA = '#35a842';

        // 1. DOWÓDCA
        createStat("Dowódca", "label", 457, 496, C_BERZNM, true);
        if (selectedLeader) {
            // Wyświetlamy nazwę dowódcy? Czy obrazek?
            // User: 'napis "Dowódca" środek ...' - to label.
            // Nie podano gdzie wyświetlić WARTOŚĆ dowódcy. 
            // Zakładam że karta dowódcy jest wyświetlana osobno (leader-card w CSS)
            // więc tu tylko label.
        }

        // 2. Wszystkie karty w talii
        createStat("Wszystkie karty w talii", "label", 1119, 1158, C_BERZ, true);
        // Wartość: od* 1180 a 1212
        createStat(totalCards, "value", 1180, 1212, C_BERZNM, false);

        // 3. Liczba kart jednostek
        createStat("Liczba kart jednostek", "label", 1238, 1277, C_BERZ, true);
        // Wartość: od* 1300 a 1332
        createStat(unitCards, "value", 1300, 1332, C_BERZNM, false); // unitCards to hero + unit ("zwykłe" == unit)

        // 4. Karty specjalne
        createStat("Karty specjalne", "label", 1360, 1399, C_BERZ, true);
        // Wartość: od* 1420 a 1455, format {suma}/10, kolor SIŁA
        createStat(`${specialCardsCount}/10`, "value", 1420, 1455, C_SILA, false);

        // 5. Całkowita Siła Jednostek
        createStat("Całkowita Siła Jednostek", "label", 1480, 1519, C_BERZ, true);
        // Wartość: od* 1539 a 1572
        createStat(totalStrength, "value", 1539, 1572, C_BERZNM, false);

        // 6. Karty bohaterów
        createStat("Karty bohaterów", "label", 1598, 1637, C_BERZ, true);
        // Wartość: od* 1660 a 1692
        createStat(heroCardsCount, "value", 1660, 1692, C_BERZNM, false);
    }

    const goToGameButton = document.getElementById('goToGameButton');
    if (goToGameButton) {
        goToGameButton.textContent = 'Gotowość';
        goToGameButton.addEventListener('click', () => {
            // Licz tylko karty walki (z punktami, ale nie pogodowe)
            const unitCards = deck.filter(card => {
                const isUnit = typeof card.punkty === 'number';
                const isWeather = ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(card.moc);
                return isUnit && !isWeather;
            }).length;
            if (unitCards < 22) {
                alert('Talia musi mieć co najmniej 22 karty walki (nie licząc pogodowych)!');
                return;
            }
            localStorage.setItem('deck', JSON.stringify(deck));
            const fade = document.getElementById('fadeScreen');
            if (fade) {
                fade.style.opacity = '1';
                setTimeout(() => {
                    window.location.href = 'gra.html';
                }, 600);
            } else {
                window.location.href = 'gra.html';
            }
        });
    }

    if (collectionArea) {
        collectionArea.addEventListener('click', (event) => {
            const cardElement = event.target.closest('.card');
            if (cardElement) {
                const cardNumer = cardElement.getAttribute('data-numer');
                const card = cards.find(c => c.numer === cardNumer);
                if (card) {
                    // SUMUJ wszystkie karty specjalne z limitem 10 (po numerach)
                    const specialLimitNumbers = ['001', '002', '003', '004', '005', '006', '007', '008', '000'];
                    const isSpecialLimited = specialLimitNumbers.includes(card.numer);
                    const specialCount = deck.filter(c => specialLimitNumbers.includes(c.numer)).length;
                    if (isSpecialLimited && specialCount >= 10) {
                        alert('Możesz mieć maksymalnie 10 kart specjalnych (pogodowe, manekin, róg, pożoga, grzybki) w talii!');
                        return;
                    }
                    // Licz kopie po numerze
                    const countInDeck = deck.filter(c => c.numer === card.numer).length;
                    if (countInDeck >= card.ilosc) {
                        alert('Nie ma więcej kopii tej karty do dodania.');
                        return;
                    }
                    deck.push({ ...card });
                    if (addCardSound) {
                        addCardSound.currentTime = 0;
                        addCardSound.play().catch(() => { });
                    }
                    displayDeck();
                    displayCollection('all');
                    updateStats();
                    autoSaveDeck();
                }
            }
        });
    }

    if (deckArea) {
        deckArea.addEventListener('click', (event) => {
            const cardElement = event.target.closest('.card');
            if (cardElement) {
                const cardName = cardElement.querySelector('.name').textContent;
                const cardInDeck = deck.find(c => c.nazwa === cardName && cardElement.querySelector('.card-image').style.backgroundImage.includes(c.dkarta));
                if (cardInDeck) {
                    const index = deck.findIndex(c => c.numer === cardInDeck.numer);
                    if (index !== -1) {
                        deck.splice(index, 1);
                        if (removeCardSound) {
                            removeCardSound.currentTime = 0;
                            removeCardSound.play().catch(() => { });
                        }
                        displayDeck();
                        displayCollection('all');
                        updateStats();
                        autoSaveDeck();
                    }
                }
            }
        });
    }

    const pageLeft = document.querySelector('.page-left');
    if (pageLeft) {
        pageLeft.addEventListener('click', () => {
            currentPage = (currentPage - 2 + factions.length) % factions.length + 1;
            updatePage();
            updateStats();
        });
    }

    const pageRight = document.querySelector('.page-right');
    if (pageRight) {
        pageRight.addEventListener('click', () => {
            currentPage = currentPage % factions.length + 1;
            updatePage();
            updateStats();
        });
    }

    function updatePage() {
        const faction = factions[currentPage - 1];
        const factionName = document.querySelector('.faction-name');
        const factionShield = document.querySelector('.faction-shield');
        const factionAbility = document.querySelector('.faction-ability');
        const leaderCard = document.querySelector('.leader-card');
        // Pobierz backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop
        const overlay = document.querySelector('.overlay');
        if (!overlay) return;
        const overlayRect = overlay.getBoundingClientRect();
        const overlayWidth = overlayRect.width;
        const overlayHeight = overlayRect.height;
        const overlayLeft = overlayRect.left;
        const overlayTop = overlayRect.top;
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        const guiAspectRatio = GUI_WIDTH / GUI_HEIGHT;
        let scale, backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop;
        if (windowAspectRatio > guiAspectRatio) {
            scale = overlayHeight / GUI_HEIGHT;
            backgroundWidth = GUI_WIDTH * scale;
            backgroundHeight = overlayHeight;
            backgroundLeft = overlayLeft + (overlayWidth - backgroundWidth) / 2;
            backgroundTop = overlayTop;
        } else {
            scale = overlayWidth / GUI_WIDTH;
            backgroundWidth = overlayWidth;
            backgroundHeight = GUI_HEIGHT * scale;
            backgroundLeft = overlayLeft;
            backgroundTop = overlayTop + (overlayHeight - backgroundHeight) / 2;
        }

        if (factionName) factionName.textContent = faction.name;
        if (factionShield) factionShield.src = faction.shield;
        if (factionAbility) factionAbility.textContent = faction.ability;

        pageDots.forEach(dot => dot.classList.toggle('active', parseInt(dot.dataset.page) === currentPage));

        displayCollection('all');
        displayDeck();
        updateStats();
        setTimeout(updatePositionsAndScaling, 0); // wymusza przerysowanie GUI

        // Wyświetl tylko jednego dowódcę w slocie lidera
        if (leaderCard) {
            leaderCard.innerHTML = '';
            const leaders = krole.filter(krol => krol.frakcja === faction.id);
            // Domyślnie wybierz pierwszego dowódcę jeśli nie ma wybranego lub nie pasuje do frakcji
            if (!selectedLeader || selectedLeader.frakcja !== faction.id) {
                selectedLeader = leaders[0];
                autoSaveDeck();
            }
            const selected = selectedLeader;
            if (selected) {
                // Skalowanie względem GUI (gui.webp)
                const guiLeft = 1792, guiTop = 538, guiW = 2051 - 1792, guiH = 1029 - 538;
                const scaleW = backgroundWidth / GUI_WIDTH;
                const scaleH = backgroundHeight / GUI_HEIGHT;
                leaderCard.style.position = 'absolute';
                leaderCard.style.left = (backgroundLeft + guiLeft * scaleW) + 'px';
                leaderCard.style.top = (backgroundTop + guiTop * scaleH) + 'px';
                leaderCard.style.width = (guiW * scaleW) + 'px';
                leaderCard.style.height = (guiH * scaleH) + 'px';
                leaderCard.style.background = 'none';
                // Tło
                const tlo = document.createElement('div');
                tlo.className = 'leader-bg';
                tlo.style.position = 'absolute';
                tlo.style.left = '0';
                tlo.style.top = '0';
                tlo.style.width = '100%';
                tlo.style.height = '100%';
                tlo.style.background = '#000';
                tlo.style.opacity = '0.1';
                tlo.style.zIndex = '0';
                leaderCard.appendChild(tlo);
                // Beton
                const beton = document.createElement('div');
                beton.className = 'beton';
                beton.style.position = 'absolute';
                beton.style.left = '0';
                beton.style.top = '0';
                beton.style.width = '100%';
                beton.style.height = '100%';
                beton.style.backgroundImage = "url('assets/dkarty/beton.webp')";
                beton.style.backgroundSize = 'cover';
                beton.style.backgroundRepeat = 'no-repeat';
                beton.style.zIndex = '1';
                leaderCard.appendChild(beton);
                // Obraz karty
                const img = document.createElement('img');
                img.src = selected.dkarta;
                img.style.position = 'absolute';
                img.style.left = '0';
                img.style.top = '0';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.borderRadius = '12px';
                img.style.boxShadow = '0 0 16px #000';
                img.style.zIndex = '2';
                leaderCard.appendChild(img);
                // Nazwa dowódcy
                const nameDiv = document.createElement('div');
                nameDiv.innerText = selected.nazwa;
                nameDiv.style.position = 'absolute';
                nameDiv.style.left = '50%';
                nameDiv.style.top = ((guiH - 60) * scaleH) + 'px'; // wysokość jak na zwykłych kartach
                nameDiv.style.transform = 'translateX(-50%)';
                nameDiv.style.fontFamily = 'PFDinTextCondPro-Bold, Cinzel, serif';
                nameDiv.style.fontWeight = 'bold';
                nameDiv.style.color = '#474747';
                nameDiv.style.fontSize = (32 * scaleW) + 'px';
                nameDiv.style.textAlign = 'center';
                nameDiv.style.zIndex = '3';
                leaderCard.appendChild(nameDiv);
            }
        }

        const baseLeft = 1850;
        const spacing = 26;
        const topPosition = 208;
        // Dodaj pobieranie backgroundWidth, backgroundHeight, backgroundLeft, backgroundTop
        const marginCompensation = (currentPage - 1) * (10 * scale);
        const leftPosition = baseLeft + (currentPage - 1) * spacing - marginCompensation;
        const pageIndicators = document.querySelector('.page-indicators');
        if (pageIndicators) {
            pageIndicators.style.left = `${backgroundLeft + leftPosition * scale}px`;
            pageIndicators.style.top = `${backgroundTop + topPosition * scale}px`;
        }

        document.querySelectorAll('.button.collection').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.button.deck').forEach(btn => btn.classList.remove('active'));
        const btnCollectionAll = document.querySelector('.button.collection.all');
        const btnDeckAll = document.querySelector('.button.deck.all');
        if (btnCollectionAll) btnCollectionAll.classList.add('active');
        if (btnDeckAll) btnDeckAll.classList.add('active');
        displayCollection('all');
        displayDeck();
    }

    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', () => {
            const area = button.classList.contains('collection') ? collectionArea : deckArea;
            const section = button.classList.contains('collection') ? 'collection' : 'deck';
            document.querySelectorAll(`.button.${section}`).forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            if (area === collectionArea) {
                displayCollection(button.dataset.filter);
            } else {
                displayCards(button.dataset.filter, deckArea, factions[currentPage - 1].id, deck);
            }
        });
    });

    // Pobierz audio
    // const hoverSound = document.getElementById('hoverSound');

    // Funkcja do odtwarzania dźwięku klikania, pozwala na nakładanie się dźwięków
    function playHoverSound() {
        const sound = new Audio('assets/klik.mp3');
        sound.play().catch(() => { });
    }

    // Najechanie na kartę
    document.addEventListener('mouseover', function (e) {
        // Dodajemy poświatę tylko jeśli nie istnieje
        if (e.target.classList.contains('card')) {
            if (!e.target.querySelector('.card-hover-bg')) {
                const hoverBg = document.createElement('img');
                hoverBg.className = 'card-hover-bg';
                hoverBg.src = 'assets/podsw.webp';
                hoverBg.style.zIndex = 200; // NAJWYŻSZA warstwa
                hoverBg.style.position = 'absolute';
                hoverBg.style.left = '-20%';
                hoverBg.style.top = '-1.1%';
                hoverBg.style.width = '140%';
                hoverBg.style.height = '102.2%';
                hoverBg.style.pointerEvents = 'none';
                e.target.appendChild(hoverBg);
            }
            playHoverSound();
        }
    });

    // Usuwanie poświaty po zjechaniu myszką
    document.addEventListener('mouseout', function (e) {
        if (e.target.classList.contains('card')) {
            const hoverBg = e.target.querySelector('.card-hover-bg');
            if (hoverBg) hoverBg.remove();
        }
    });

    displayCollection('all');
    displayDeck();
    updatePage();
    updateStats();

    // Automatyczny zapis talii po każdej zmianie
    function autoSaveDeck() {
        const factionId = factions[currentPage - 1].id;
        const deckNumbers = deck.map(card => card.numer);
        const leaderNumber = selectedLeader ? selectedLeader.numer : null;
        if (leaderNumber && window.saveDeck) {
            window.saveDeck(factionId, leaderNumber, deckNumbers);
        }
    }

    // Przy starcie strony: odczytaj deck i dowódcę z localStorage
    document.addEventListener('DOMContentLoaded', () => {
        const talie = window.loadDecks ? window.loadDecks() : {};
        const faction = factions[currentPage - 1];
        if (talie && talie[faction.id]) {
            deck = talie[faction.id].karty
                .map(numer => cards.find(c => c.numer === numer))
                .filter(Boolean);
            selectedLeader = krole.find(krol => krol.numer === talie[faction.id].dowodca);
            displayDeck();
            displayCollection('all');
            updateStats();
        }
    });

    function groupDeck(deck) {
        const grouped = [];
        const map = new Map();
        deck.forEach(card => {
            if (!map.has(card.numer)) {
                const count = deck.filter(c => c.numer === card.numer).length;
                if (count > 0) { // tylko jeśli są w talii
                    map.set(card.numer, { ...card, iloscWTalii: count });
                }
            }
        });
        return Array.from(map.values());
    }

    function renderLeaders(leaders, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        leaders.forEach((krol, i) => {
            const div = document.createElement('div');
            div.className = 'leader-card';
            div.style.display = 'inline-block';
            div.style.margin = '12px';
            div.style.textAlign = 'center';
            div.style.cursor = 'pointer';
            div.onclick = () => {
                window.selectedLeader = krol;
                // Możesz dodać podgląd powiększenia lub callback
            };
            const img = document.createElement('img');
            img.src = krol.dkarta;
            img.style.width = '180px';
            img.style.height = '240px';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '12px';
            img.style.boxShadow = '0 0 16px #000';
            div.appendChild(img);
            const nameDiv = document.createElement('div');
            nameDiv.innerText = krol.nazwa;
            nameDiv.style.fontFamily = 'PFDinTextCondPro-Bold, Cinzel, serif';
            nameDiv.style.fontWeight = 'bold';
            nameDiv.style.color = '#c7a76e';
            nameDiv.style.fontSize = '1.2em';
            nameDiv.style.marginTop = '8px';
            div.appendChild(nameDiv);
            container.appendChild(div);
        });
    }

    window.renderLeaders = renderLeaders;

    // Obsługa klawisza 'x' do wyboru dowódcy
    window.addEventListener('keydown', function (e) {
        if (e.key === 'x' || e.key === 'X') {
            const faction = factions[currentPage - 1];
            const leaders = krole.filter(krol => krol.frakcja === faction.id);
            showPowiek(leaders, 0, 'leaders');
            window.selectedLeaderCallback = function (krol) {
                selectedLeader = krol;
                updatePage();
            };
        }
    });

    // Obsługa prawego kliknięcia na kartę w kolekcji
    if (collectionArea) {
        collectionArea.addEventListener('contextmenu', function (e) {
            const cardEl = e.target.closest('.card');
            if (cardEl) {
                e.preventDefault();
                const numer = cardEl.getAttribute('data-numer');
                const idx = cards.findIndex(c => c.numer === numer);
                if (idx !== -1) showPowiek(cards, idx, 'cards');
            }
        });
    }
    // Obsługa prawego kliknięcia na kartę w talii
    if (deckArea) {
        deckArea.addEventListener('contextmenu', function (e) {
            const cardEl = e.target.closest('.card');
            if (cardEl) {
                e.preventDefault();
                const numer = cardEl.getAttribute('data-numer');
                const idx = deck.findIndex(c => c.numer === numer);
                if (idx !== -1) showPowiek(deck, idx, 'cards');
            }
        });
    }

    // Obsługa wyboru dowódcy przez kliknięcie (np. w powiek.js)
    window.selectLeader = function (numer) {
        const factionId = factions[currentPage - 1].id;
        const leader = krole.find(krol => krol.numer === numer && krol.frakcja === factionId);
        if (leader) {
            selectedLeader = leader;
            autoSaveDeck();
            updatePage();
        }
    };

    // --- GLOBAL GLOW LOGIC (Re-implemented) ---
    function initGlobalGlow() {
        let glowOverlay = document.getElementById('global-glow');
        if (!glowOverlay) {
            glowOverlay = document.createElement('div');
            glowOverlay.id = 'global-glow';

            const podsw = document.createElement('img');
            podsw.className = 'global-glow-img podsw';
            podsw.src = 'assets/dkarty/podsw.webp';
            glowOverlay.appendChild(podsw);

            const podsw2 = document.createElement('img');
            podsw2.className = 'global-glow-img podsw2';
            podsw2.src = 'assets/dkarty/podsw2.webp';
            glowOverlay.appendChild(podsw2);

            document.body.appendChild(glowOverlay);
        }

        const handleMouseOver = (e) => {
            const card = e.target.closest('.card');
            if (card) {
                const rect = card.getBoundingClientRect();

                // Dane z infoo.txt: podsw ma wymiar 628x1003 przy karcie 523x992
                // width ratio: 628/523 = ~1.20 (120%)
                // height ratio: 1003/992 = ~1.011 (101.1%)
                // Pozycja: -104, -10 (względem 0,0 karty). 
                // offsetX ratio: -104/523 = -0.1988 (~ -20%)
                // offsetY ratio: -10/992 = -0.01 (~ -1%)

                const width = rect.width * 1.2007; // 120.07%
                const height = rect.height * 1.011; // 101.1%
                const left = rect.left - (rect.width * 0.1988); // -19.9%
                const top = rect.top - (rect.height * 0.01); // -1%

                glowOverlay.style.width = `${width}px`;
                glowOverlay.style.height = `${height}px`;
                glowOverlay.style.left = `${left}px`;
                glowOverlay.style.top = `${top}px`;
                glowOverlay.style.display = 'block';
            }
        };

        const handleMouseOut = (e) => {
            const card = e.target.closest('.card');
            if (card) {
                // Sprawdzamy, czy nie przeszliśmy na element dziecięcy tej samej karty
                if (!e.relatedTarget || !e.relatedTarget.closest('.card') || e.relatedTarget.closest('.card') !== card) {
                    glowOverlay.style.display = 'none';
                }
            }
        };

        document.body.addEventListener('mouseover', handleMouseOver);
        document.body.addEventListener('mouseout', handleMouseOut);

        // Ukryj glow podczas scrollowania
        if (collectionArea) collectionArea.addEventListener('scroll', () => glowOverlay.style.display = 'none');
        if (deckArea) deckArea.addEventListener('scroll', () => glowOverlay.style.display = 'none');
    }

    // initGlobalGlow();
});

// KONIEC PLIKU, nie dodawaj już window.addEventListener('DOMContentLoaded', ...) na końcu!