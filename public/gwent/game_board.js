import cards from './cards.js';
import { showPowiek } from './rcard.js';
import { krole } from './krole.js';
import { showPrzejscie, hidePrzejscie } from './przejsciakod.js';
import { animateLeaderFromDeck, animateDeckToHand } from './animacje.js';

let playerHand = [];
let drawPile = [];
let playerGraveyard = [];
let opponentHandCount = 10;
let opponentDeckCount = 12;
let opponentGraveyardCount = 0;
let swapsCount = 0;
let playerLeaderObj = null;
let opponentLeaderObj = null;
let currentTurn = null;
let selectedHandIndex = -1;
let currentNick = '';
let isPlayer1Local = false;
let gameCodeLocal = '';
let boardState = {
    p1R1: [], p1R2: [], p1R3: [],
    p2R1: [], p2R2: [], p2R3: [],
    p1S1: null, p1S2: null, p1S3: null, // Horn slots
    p2S1: null, p2S2: null, p2S3: null
};

const factionInfo = {
    "1": { name: "Królestwa Północy", logo: "tpolnoc.webp", reverse: "polnoc_rewers.webp" },
    "2": { name: "Cesarstwo Nilfgaardu", logo: "tnilfgaard.webp", reverse: "nilftgard_rewers.webp" },
    "3": { name: "Scoia'tael", logo: "tscoiatael.webp", reverse: "scoia'tel_rewers.webp" },
    "4": { name: "Potwory", logo: "tpotwory.webp", reverse: "potwory_rewers.webp" },
    "5": { name: "Skellige", logo: "tskellige.webp", reverse: "skelige_rewers.webp" }
};

function sortHand() {
    playerHand.sort((a, b) => {
        const idxA = cards.findIndex(c => c.numer === a.numer);
        const idxB = cards.findIndex(c => c.numer === b.numer);
        return idxA - idxB;
    });
}

export function initGameBoard(socket, gameCode, isPlayer1, nick) {
    // Guard: zapobiegaj wielokrotnemu rejestrowaniu listenerów
    if (window._gameBoardInitialized) {
        console.warn('[BOARD] initGameBoard already called, skipping listener setup.');
        socket.emit('get-game-state', { gameCode, isPlayer1 });
        return;
    }
    window._gameBoardInitialized = true;

    window.socket = socket;
    isPlayer1Local = isPlayer1;
    gameCodeLocal = gameCode;
    socket.emit('get-game-state', { gameCode, isPlayer1 });

    socket.on('init-game-state', (data) => {
        if (data.hand) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === num)).filter(Boolean);

            playerHand = mapToObjects(data.hand);
            drawPile = mapToObjects(data.deck);
            playerGraveyard = mapToObjects(data.graveyard);

            opponentHandCount = data.opponentHandCount;
            opponentDeckCount = data.opponentDeckCount;
            opponentGraveyardCount = data.opponentGraveyardCount || 0;
            window.playerFaction = data.faction || localStorage.getItem('faction') || '1';
            window.opponentFaction = data.opponentFaction;
            swapsCount = data.swapsPerformed || 0;
            if (data.opponentNickname) window.opponentNickname = data.opponentNickname;
            if (data.nickname) { nick = data.nickname; currentNick = nick; }

            if (data.leader) playerLeaderObj = krole.find(k => k.numer === data.leader);
            if (data.opponentLeader) opponentLeaderObj = krole.find(k => k.numer === data.opponentLeader);

            if (data.currentTurn) currentTurn = data.currentTurn;
            if (data.board) boardState = data.board;

            sortHand();
            console.log(`[BOARD] Game state initialized. Local: ${nick}, Opponent: ${window.opponentNickname}, Status: ${data.status}`);

            if (!window.gameStarted) {
                if (data.status === 'scoia-decision') {
                    renderAll(nick); // Zawsze wyrenderuj stan (pusta plansza)
                    handleScoiaDecision(socket, gameCode, data.scoiaDecider);
                } else if (data.status === 'playing') {
                    // Mamy ostateczny 'playing' i nie wystartowaliśmy jeszcze gry.
                    hideScoiaUI();
                    renderAll(nick); // Zawsze wyrenderuj stan (pusta plansza)
                    
                    // Decydujemy jaki baner użyć na wejście
                    let startBanner = null;
                    const isMyTurn = data.currentTurn === window.socket.id;
                    
                    if (data.startReason === 'random') {
                        startBanner = isMyTurn ? 't01' : 't02';
                    } else if (data.startReason === 'scoia') {
                        startBanner = isMyTurn ? 't03' : 't04';
                    }

                    if (startBanner) {
                        window.gameStarted = true;
                        hidePrzejscie(true); // Natychmiast ukryj ewentualne komunikaty t13
                        
                        // Animacja dowódcy z kupki na pozycję (jednocześnie z banerem)
                        animateLeaderFromDeck(playerLeaderObj);
                        
                        showPrzejscie(startBanner, {
                            customCzas: 2000,
                            onFinish: () => {
                                // Animacja 10 kart z kupki do ręki (w tle za mulliganem)
                                animateDeckToHand(10, window.playerFaction || '1');
                                startMulligan(socket, gameCode, isPlayer1);
                            }
                        });
                    } else {
                        // Fallback
                        window.gameStarted = true;
                        animateLeaderFromDeck(playerLeaderObj);
                        animateDeckToHand(10, window.playerFaction || '1');
                        startMulligan(socket, gameCode, isPlayer1);
                    }
                }
            } else {
                renderAll(nick);
            }
        }
    });

    socket.on('start-phase-resolved', () => {
        // Serwer zakończył fazę decyzji i rozdał karty, prosimy o nowy stan
        socket.emit('get-game-state', { gameCode, isPlayer1 });
    });

    socket.on('mulligan-swap-success', (data) => {
        const { newCard, swapsLeft, cardIndex } = data;
        const cardObj = cards.find(c => c.numer === newCard);

        if (cardObj) {
            playerHand[cardIndex] = cardObj;
            console.log(`[BOARD] Swap successful: Index ${cardIndex} -> ${cardObj.nazwa}`);
        }
        swapsCount = 2 - swapsLeft;

        if (window.isPowiekOpen) {
            // Update the zoom view immediately with the new card
            showPowiek(playerHand, cardIndex, 'hand', {
                isMulligan: true,
                swapsLeft: swapsLeft,
                onSwap: (idx) => socket.emit('mulligan-swap', { gameCode, isPlayer1, cardIndex: idx }),
                onClose: () => {
                    sortHand(); // Sort ONLY after closing
                    window.mulliganFinished = true; // Zaznacz, że faza jest skończona
                    socket.emit('end-mulligan', { gameCode, isPlayer1 });
                    renderAll(nick);
                }
            });
        }

        if (swapsLeft <= 0) {
            setTimeout(() => {
                if (window.hidePowiek) window.hidePowiek();
            }, 800);
        } else {
            renderAll(nick);
        }
    });

    socket.on('opponent-game-update', (data) => {
        if (data.handCount !== undefined) opponentHandCount = data.handCount;
        if (data.deckCount !== undefined) opponentDeckCount = data.deckCount;
        if (data.graveyardCount !== undefined) opponentGraveyardCount = data.graveyardCount;
        if (data.faction !== undefined) window.opponentFaction = data.faction;
        renderAll(nick);
    });

    socket.on('update-deck', (data) => {
        if (data.deck) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === num)).filter(Boolean);
            drawPile = mapToObjects(data.deck);
            renderAll(nick);
        }
    });

    socket.on('board-updated', (data) => {
        console.log("[BOARD] Received board-updated:", data);
        const prevTurn = currentTurn;
        boardState = data.board;
        currentTurn = data.currentTurn;
        opponentHandCount = isPlayer1Local ? data.p2HandCount : data.p1HandCount;
        renderAll(currentNick);

        // Pokaż baner przejściowy przy zmianie tury (tylko w trakcie gry, nie na starcie)
        if (currentTurn && window.gameStarted && window.mulliganFinished) {
            // Unikaj banerów jeśli to nie jest faktyczna zmiana tury
            if (prevTurn !== currentTurn) {
                const isMyTurn = currentTurn === window.socket.id;
                showPrzejscie(isMyTurn ? 't01' : 't02');
            }
        }
    });
}

let scoiaTimerInterval = null;

function hideScoiaUI() {
    const overlay = document.getElementById('scoia-decision-overlay');
    if (overlay) overlay.remove();
    if (scoiaTimerInterval) clearInterval(scoiaTimerInterval);
    hidePrzejscie(true);
}

function handleScoiaDecision(socket, gameCode, deciderId) {
    // Zapobiegaj wielokrotnemu tworzeniu
    if (document.getElementById('scoia-decision-overlay')) return;

    if (deciderId === window.socket.id) {
        // Ja decyduję
        const overlay = document.createElement('div');
        overlay.id = 'scoia-decision-overlay';

        const box = document.createElement('div');
        box.id = 'scoia-decision-box';

        const title = document.createElement('div');
        title.id = 'scoia-decision-title';
        title.textContent = 'Kto rozpoczyna grę?';

        const btnsBox = document.createElement('div');
        
        const btnFirst = document.createElement('button');
        btnFirst.className = 'scoia-btn';
        btnFirst.textContent = 'Będę zaczynać ja';
        
        const btnSecond = document.createElement('button');
        btnSecond.className = 'scoia-btn';
        btnSecond.textContent = 'Przeciwnik zaczyna';

        let timerText = document.createElement('div');
        timerText.id = 'scoia-decision-timer';
        
        box.appendChild(title);
        btnsBox.appendChild(btnFirst);
        btnsBox.appendChild(btnSecond);
        box.appendChild(btnsBox);
        box.appendChild(timerText);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        let timeLeft = 10;
        timerText.textContent = `Pozostały czas: ${timeLeft}s`;
        
        const makeDecision = (startFirst) => {
            if (scoiaTimerInterval) clearInterval(scoiaTimerInterval);
            socket.emit('scoia-decision-made', { gameCode, startFirst });
            hideScoiaUI();
        };

        btnFirst.onclick = () => makeDecision(true);
        btnSecond.onclick = () => makeDecision(false);

        scoiaTimerInterval = setInterval(() => {
            timeLeft--;
            timerText.textContent = `Pozostały czas: ${timeLeft}s`;
            if (timeLeft <= 0) {
                makeDecision(Math.random() < 0.5); // Przypadkowy wybór po czasie
            }
        }, 1000);
    } else {
        // Przeciwnik decyduje - wymuś pokazanie komunikatu t13 twardo aż do start-phase-resolved
        showPrzejscie('t13', { customCzas: 15000 });
    }
}

function startMulligan(socket, gameCode, isPlayer1, selectedIndex = 0) {
    showPowiek(playerHand, selectedIndex, 'hand', {
        isMulligan: true,
        swapsLeft: 2 - swapsCount,
        onSwap: (idx) => socket.emit('mulligan-swap', { gameCode, isPlayer1, cardIndex: idx }),
        onClose: () => {
            sortHand();
            window.mulliganFinished = true;
            socket.emit('end-mulligan', { gameCode, isPlayer1 });
            renderAll();
        }
    });
}

export function renderAll(nick) {
    if (nick) currentNick = nick;
    const overlay = document.querySelector('#gameScreen .overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    renderHand(overlay);
    renderNicknames(overlay, nick);
    renderStats(overlay);
    renderLives(overlay);
    renderGraveyards(overlay);
    renderPiles(overlay);
    renderLeaders(overlay);
    renderRows(overlay);
    
    // Turn indicator (mały napis u góry - uzupełnienie do banerów)
    if (currentTurn) {
        const turnDiv = document.createElement('div');
        turnDiv.style.position = 'absolute';
        turnDiv.style.top = '10px';
        turnDiv.style.left = '50%';
        turnDiv.style.transform = 'translateX(-50%)';
        turnDiv.style.color = '#c7a76e';
        turnDiv.style.fontSize = `${28 * Math.min(window.innerWidth / 3840, window.innerHeight / 2160)}px`;
        turnDiv.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        turnDiv.style.opacity = '0.6';
        const isMyTurn = currentTurn === window.socket.id;
        turnDiv.textContent = isMyTurn ? 'TWOJA TURA' : 'TURA PRZECIWNIKA';
        overlay.appendChild(turnDiv);
    }
}

function renderStats(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const createStat = (val, x, y) => {
        const div = document.createElement('div');
        div.className = 'game-stat-number';
        div.style.position = 'absolute';
        div.style.left = `${x * scale + boardLeft}px`;
        div.style.top = `${y * scale + boardTop}px`;
        div.style.width = 'auto'; // Auto width for centering logic
        div.style.minWidth = `${100 * scale}px`;
        div.style.textAlign = 'center';
        div.style.fontSize = `${64 * scale}px`;
        div.style.color = '#b18941';
        div.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        div.style.transform = 'translate(-50%, -50%)'; // Center on Y coordinate
        div.textContent = val;
        return div;
    };

    // Card counts in hand - [550, 738] (Opponent), [550, 1418] (Player)
    // 550 is the left boundary "za którą liczby nie mogą wyjść w lewo"
    overlay.appendChild(createStat(opponentHandCount, 550 + 50, 738));
    overlay.appendChild(createStat(playerHand.length, 550 + 50, 1418));
}

function renderLives(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const createLive = (x, y) => {
        const img = document.createElement('img');
        img.src = 'assets/asety/live.webp';
        img.style.position = 'absolute';
        img.style.left = `${x * scale + boardLeft}px`;
        img.style.top = `${y * scale + boardTop}px`;
        img.style.width = `${100 * scale}px`; // Doubled size
        img.style.height = `${100 * scale}px`;
        return img;
    };

    // Opponent lives (2 gems for now)
    overlay.appendChild(createLive(636, 695));
    overlay.appendChild(createLive(721, 695));

    // Player lives (2 gems for now)
    overlay.appendChild(createLive(636, 1369));
    overlay.appendChild(createLive(721, 1369));
}

/**
 * Dodaje overlay z punktami na karcie.
 * @param {HTMLElement} wrapper - kontener karty (div z position: relative)
 * @param {object} card - obiekt karty z cards.js
 * @param {number} cardW - szerokość karty w px (po skalowaniu)
 * @param {number} cardH - wysokość karty w px (po skalowaniu)
 */
function addCardPointsOverlay(wrapper, card, cardW, cardH) {
    // Nie wyświetlaj punktów dla kart specjalnych (pogoda, róg dowódcy itp.)
    if (typeof card.punkty !== 'number') return;

    // Proporcja skalowania: wszystkie pozycje podane przez użytkownika są podane dla karty 180x240
    const cardScale = cardW / 180;

    // Bohater: najpierw obrazek bohater.webp 
    // ma być od -8, -8 do 116, 118 (czyli szerokość: 124, wysokość: 126)
    if (card.bohater) {
        const heroIcon = document.createElement('img');
        heroIcon.src = '/gwent/assets/karty/bohater.webp';
        heroIcon.style.position = 'absolute';
        heroIcon.style.left = `${-8 * cardScale}px`;
        heroIcon.style.top = `${-8 * cardScale}px`;
        heroIcon.style.width = `${124 * cardScale}px`;
        heroIcon.style.height = `${126 * cardScale}px`;
        heroIcon.style.pointerEvents = 'none';
        heroIcon.style.zIndex = '2';
        wrapper.appendChild(heroIcon);
    }

    // Liczba punktów - środek na 30, 30
    const pointsDiv = document.createElement('div');
    pointsDiv.style.position = 'absolute';
    pointsDiv.style.left = `${30 * cardScale}px`;
    pointsDiv.style.top = `${30 * cardScale}px`;
    pointsDiv.style.transform = 'translate(-50%, -50%)'; // Wyśrodkowanie tekstu dokładnie na 30,30
    pointsDiv.style.fontFamily = 'PFDinTextCondPro, sans-serif'; 
    pointsDiv.style.fontSize = `${44 * cardScale}px`; // 44px na bazowym 180px
    pointsDiv.style.fontWeight = 'normal'; // Czcionka niepogrubiona
    pointsDiv.style.color = card.bohater ? '#fcfdfc' : '#000000';
    pointsDiv.style.textShadow = card.bohater
        ? '0 1px 3px rgba(0,0,0,0.8)'
        : '0 1px 2px rgba(255,255,255,0.3)';
    pointsDiv.style.pointerEvents = 'none';
    pointsDiv.style.zIndex = '3';
    pointsDiv.style.lineHeight = '1';
    pointsDiv.textContent = card.punkty;
    wrapper.appendChild(pointsDiv);
}

function renderHand(overlay) {
    const GUI_WIDTH = 3840, GUI_HEIGHT = 2160;
    const areaLeft = 1163, areaTop = 1691, areaRight = 3018, areaBottom = 1932;
    const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
    const boardLeft = (window.innerWidth - GUI_WIDTH * scale) / 2;
    const boardTop = (window.innerHeight - GUI_HEIGHT * scale) / 2;

    const container = document.createElement('div');
    container.className = 'hand-container'; // Needed for keyboard nav lookup
    container.style.position = 'absolute';
    container.style.left = `${areaLeft * scale + boardLeft}px`;
    container.style.top = `${areaTop * scale + boardTop}px`;
    container.style.width = `${(areaRight - areaLeft) * scale}px`;
    container.style.height = `${(areaBottom - areaTop) * scale}px`;
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    playerHand.forEach((card, i) => {
        const cardW = 180 * scale;
        const cardH = 240 * scale;

        const wrapper = document.createElement('div');
        wrapper.className = 'hand-card-img';
        wrapper.dataset.index = i;
        wrapper.style.width = `${cardW}px`;
        wrapper.style.height = `${cardH}px`;
        wrapper.style.cursor = 'pointer';
        wrapper.style.position = 'relative';
        wrapper.style.flexShrink = '0';

        const img = document.createElement('img');
        img.src = card.karta;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        wrapper.appendChild(img);

        // Punkty na karcie
        addCardPointsOverlay(wrapper, card, cardW, cardH);

        wrapper.onmouseenter = () => {
            selectedHandIndex = i;
            updateHandVisuals(container, scale);
        };
        wrapper.onmouseleave = () => {
            selectedHandIndex = -1;
            updateHandVisuals(container, scale);
        };

        wrapper.oncontextmenu = (e) => { e.preventDefault(); showPowiek(playerHand, i, 'hand'); };
        wrapper.onclick = (e) => {
            e.stopPropagation();
            playCardAtIndex(i);
        };
        container.appendChild(wrapper);
    });
    updateHandVisuals(container, scale); // Apply initial selection style if any
    overlay.appendChild(container);
}

function updateHandVisuals(container, scale) {
    if (!container) return;
    const imgs = container.querySelectorAll('.hand-card-img');
    imgs.forEach((img, idx) => {
        if (idx === selectedHandIndex) {
            img.style.transition = 'transform 0.1s cubic-bezier(0.1, 0.7, 0.6, 1), box-shadow 0.1s ease';
            img.style.transform = `translateY(${-60 * scale}px)`;
            img.style.zIndex = '1000';
            img.style.boxShadow = `0 0 ${20 * scale}px #c7a76e`;
        } else {
            img.style.transition = 'transform 0.2s ease-out, box-shadow 0.2s';
            img.style.transform = 'none';
            img.style.zIndex = '';
            img.style.boxShadow = 'none';
        }
    });
}

function playCardAtIndex(index) {
    if (index < 0 || index >= playerHand.length) {
        console.log(`[BOARD] Attempted to play card at invalid index: ${index}`);
        return;
    }
    const isMyTurn = currentTurn === window.socket.id;
    console.log(`[BOARD] playCardAtIndex: turn=${currentTurn}, myID=${window.socket.id}, isMyTurn=${isMyTurn}`);
    if (!isMyTurn) {
        console.log("[BOARD] Blocked move: Not your turn!");
        return;
    }

    const card = playerHand[index];
    const gameCode = gameCodeLocal;
    const isP1 = isPlayer1Local;
    
    const isSpecial = card.numer === "002" || card.numer === "000" || ["mroz", "mgla", "deszcz", "sztorm", "niebo"].includes(card.moc);
    let posToPlay = card.pozycja || 1; 

    // Handle Agile cards (pozycja: 4) - default to 1 for now
    if (!isSpecial && posToPlay === 4) {
        console.log("[BOARD] Agile card detected, defaulting to Melee (1)");
        posToPlay = 1;
    }
    
    console.log(`[BOARD] Emitting play-card: ${card.numer} (${card.nazwa}) at pos ${posToPlay}. isP1: ${isP1}`);
    window.socket.emit('play-card', {
        gameCode,
        isPlayer1: isP1,
        cardNumer: card.numer,
        pozycja: posToPlay,
        isSpecial: isSpecial
    });

    // Local turn block
    currentTurn = null; 

    // Optimistic update
    playerHand.splice(index, 1);
    selectedHandIndex = -1;
    renderAll();
}

window.addEventListener('keydown', (e) => {
    if (!window.gameStarted || window.isPowiekOpen) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (e.key === 'ArrowRight') {
            selectedHandIndex = Math.min(selectedHandIndex + 1, playerHand.length - 1);
            if (selectedHandIndex < 0 && playerHand.length > 0) selectedHandIndex = 0;
        } else {
            selectedHandIndex = Math.max(selectedHandIndex - 1, 0);
        }
        
        const container = document.querySelector('.hand-container');
        if (container) {
            const GUI_WIDTH = 3840, GUI_HEIGHT = 2160;
            const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
            updateHandVisuals(container, scale);
        }
    } else if (e.key === 'Enter') {
        if (selectedHandIndex !== -1) playCardAtIndex(selectedHandIndex);
    }
});

function renderNicknames(overlay, nick) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const createNick = (name, x, y, fact_w, fact_h, factionId) => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = `${483 * scale + boardLeft}px`;
        container.style.top = `${y * scale + boardTop}px`;
        container.style.width = `${(850 - 483) * scale}px`;
        container.style.height = `${(fact_h - y) * scale}px`;
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'center';

        const fInfo = factionInfo[factionId] || factionInfo["1"];

        const headerGroup = document.createElement('div');
        headerGroup.style.display = 'flex';
        headerGroup.style.alignItems = 'center';

        // Faction Logo
        const logo = document.createElement('img');
        logo.src = `assets/asety/${fInfo.logo}`;
        logo.style.width = `${60 * scale}px`;
        logo.style.marginRight = `${15 * scale}px`;
        headerGroup.appendChild(logo);

        // Nickname
        const nickDiv = document.createElement('div');
        nickDiv.className = 'game-nick';
        nickDiv.style.fontSize = `${32 * scale}px`;
        nickDiv.style.color = '#b28a41'; // Requested color
        nickDiv.style.fontWeight = 'bold';
        nickDiv.textContent = name;
        headerGroup.appendChild(nickDiv);

        container.appendChild(headerGroup);

        // Faction Name
        const factDiv = document.createElement('div');
        factDiv.style.fontSize = `${24 * scale}px`;
        factDiv.style.color = '#b08948'; // Requested color
        factDiv.style.marginTop = `${5 * scale}px`;
        factDiv.textContent = fInfo.name;
        container.appendChild(factDiv);

        return container;
    };

    // Opponent: {483, 569 - 850, 602}
    overlay.appendChild(createNick(window.opponentNickname || 'PRZECIWNIK', 483, 569, 850, 602, window.opponentFaction));
    // Player: {483, 1498 x 850, 1532}
    overlay.appendChild(createNick(nick, 483, 1498, 850, 1532, window.playerFaction));
}

function renderGraveyards(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const gy = document.createElement('div');
    gy.className = 'graveyard-container';
    gy.style.left = `${3457 * scale + boardLeft}px`;
    gy.style.top = `${1654 * scale + boardTop}px`;
    gy.style.width = `${180 * scale}px`;
    gy.style.height = `${240 * scale}px`;

    if (playerGraveyard.length > 0) {
        const topCard = playerGraveyard[playerGraveyard.length - 1];
        gy.style.backgroundImage = `url('${topCard.karta}')`;
        gy.style.backgroundSize = 'contain';
        gy.style.cursor = 'pointer';
        gy.onclick = () => showPowiek(playerGraveyard, playerGraveyard.length - 1, 'game');
    }
    overlay.appendChild(gy);

    const ogy = document.createElement('div');
    ogy.className = 'graveyard-container o-graveyard';
    ogy.style.left = `${3457 * scale + boardLeft}px`;
    ogy.style.top = `${131 * scale + boardTop}px`;
    ogy.style.width = `${180 * scale}px`;
    ogy.style.height = `${240 * scale}px`;
    ogy.style.transform = 'rotate(180deg)';
    overlay.appendChild(ogy);
}

function renderRows(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const isP1 = isPlayer1Local;
    console.log(`[BOARD] renderRows: isP1=${isP1}, boardState=`, boardState);

    // Rows: 1=Melee, 2=Ranged, 3=Siege
    const rowCoords = {
        opp3: { x: 1412, y: 29, w: 1609, h: 239 },
        opp2: { x: 1412, y: 294, w: 1609, h: 239 },
        opp1: { x: 1412, y: 565, w: 1609, h: 239 },
        self1: { x: 1412, y: 863, w: 1609, h: 239 },
        self2: { x: 1412, y: 1129, w: 1609, h: 239 },
        self3: { x: 1412, y: 1407, w: 1609, h: 239 }
    };

    const renderRowCards = (rowKey, coords) => {
        const cardsInRow = boardState[rowKey] || [];
        console.log(`[BOARD] renderRowCards: row=${rowKey}, count=${cardsInRow.length}`, cardsInRow);
        const rowDiv = document.createElement('div');
        rowDiv.style.position = 'absolute';
        rowDiv.style.left = `${coords.x * scale + boardLeft}px`;
        rowDiv.style.top = `${coords.y * scale + boardTop}px`;
        rowDiv.style.width = `${coords.w * scale}px`;
        rowDiv.style.height = `${coords.h * scale}px`;
        rowDiv.style.display = 'flex';
        rowDiv.style.justifyContent = 'center';
        rowDiv.style.alignItems = 'center';

        cardsInRow.forEach(numer => {
            const card = cards.find(c => c.numer === numer);
            if (card) {
                const rowCardH = coords.h * scale;
                const rowCardW = rowCardH * (180 / 240);

                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                wrapper.style.height = '100%';
                wrapper.style.width = 'auto';
                wrapper.style.margin = `0 ${5 * scale}px`;
                wrapper.style.flexShrink = '0';

                const img = document.createElement('img');
                img.src = card.karta;
                img.style.height = '100%';
                img.style.width = 'auto';
                img.style.display = 'block';
                wrapper.appendChild(img);

                // Punkty na karcie
                addCardPointsOverlay(wrapper, card, rowCardW, rowCardH);

                rowDiv.appendChild(wrapper);
            }
        });
        overlay.appendChild(rowDiv);
    };

    const renderSpecialSlot = (rowIdx, sidePrefix, yCoord) => {
        const numer = boardState[`${sidePrefix}S${rowIdx}`];
        if (!numer) return;
        const card = cards.find(c => c.numer === numer);
        if (!card) return;

        const img = document.createElement('img');
        img.src = card.karta;
        img.style.position = 'absolute';
        // x: 1182 - 1361 (w: 179)
        img.style.left = `${1182 * scale + boardLeft}px`;
        img.style.top = `${yCoord * scale + boardTop}px`;
        img.style.width = `${179 * scale}px`;
        img.style.height = `${239 * scale}px`;
        overlay.appendChild(img);
    };

    if (isP1) {
        renderRowCards('p2R3', rowCoords.opp3);
        renderRowCards('p2R2', rowCoords.opp2);
        renderRowCards('p2R1', rowCoords.opp1);
        renderRowCards('p1R1', rowCoords.self1);
        renderRowCards('p1R2', rowCoords.self2);
        renderRowCards('p1R3', rowCoords.self3);

        renderSpecialSlot(3, 'p2', 29);
        renderSpecialSlot(2, 'p2', 294);
        renderSpecialSlot(1, 'p2', 565);
        renderSpecialSlot(1, 'p1', 863);
        renderSpecialSlot(2, 'p1', 1129);
        renderSpecialSlot(3, 'p1', 1407);
    } else {
        renderRowCards('p1R3', rowCoords.opp3);
        renderRowCards('p1R2', rowCoords.opp2);
        renderRowCards('p1R1', rowCoords.opp1);
        renderRowCards('p2R1', rowCoords.self1);
        renderRowCards('p2R2', rowCoords.self2);
        renderRowCards('p2R3', rowCoords.self3);

        renderSpecialSlot(3, 'p1', 29);
        renderSpecialSlot(2, 'p1', 294);
        renderSpecialSlot(1, 'p1', 565);
        renderSpecialSlot(1, 'p2', 863);
        renderSpecialSlot(2, 'p2', 1129);
        renderSpecialSlot(3, 'p2', 1407);
    }
}

function renderPiles(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const renderPileGroup = (x, y, count, factionId, isOpponent) => {
        const fInfo = factionInfo[factionId || '1'] || factionInfo["1"];
        const reverseSrc = `assets/asety/${fInfo.reverse}`;

        // Render stack (bottom card i=0 at [X, Y])
        for (let i = 0; i < count; i++) {
            const pile = document.createElement('img');
            pile.src = reverseSrc;
            pile.style.position = 'absolute';
            // Each next card shifts 1px left and top relative to the bottom one
            const offset = i; 
            pile.style.left = `${(x - offset) * scale + boardLeft}px`;
            pile.style.top = `${(y - offset) * scale + boardTop}px`;
            pile.style.width = `${175 * scale}px`;
            pile.style.height = `${300 * scale}px`;
            pile.style.zIndex = 100 + i;
            overlay.appendChild(pile);

            if (i === count - 1) { // Top card interaction
                if (!isOpponent) {
                    pile.style.cursor = 'pointer';
                    pile.oncontextmenu = (e) => {
                        e.preventDefault();
                        if (window.showPowiek) window.showPowiek(drawPile, 0, 'game');
                    };
                }
            }
        }

        // Count box
        const boxX = isOpponent ? 3484 : 3493;
        const boxY = isOpponent ? 358 : 1901;
        const boxW = isOpponent ? (3583 - 3484) : (3591 - 3493);
        const boxH = isOpponent ? (432 - 358) : (1974 - 1901);

        const box = document.createElement('div');
        box.style.position = 'absolute';
        box.style.left = `${boxX * scale + boardLeft}px`;
        box.style.top = `${boxY * scale + boardTop}px`;
        box.style.width = `${boxW * scale}px`;
        box.style.height = `${boxH * scale}px`;
        box.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        box.style.display = 'flex';
        box.style.justifyContent = 'center';
        box.style.alignItems = 'center';
        box.style.zIndex = 200;

        const countText = document.createElement('div');
        countText.style.color = '#c7a76e'; // Deck count color
        countText.style.fontSize = `${boxH * 0.5 * scale}px`;
        countText.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        countText.textContent = count;
        box.appendChild(countText);
        overlay.appendChild(box);
    };

    // Corrected positions for stacking offset base (bottom card)
    renderPileGroup(3459, 1656, drawPile.length, window.playerFaction, false);
    renderPileGroup(3459, 132, opponentDeckCount, window.opponentFaction, true);
}

function renderLeaders(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const createLeader = (leaderObj, x, y) => {
        if (!leaderObj) return;
        const img = document.createElement('img');
        img.src = leaderObj.karta;
        img.style.position = 'absolute';
        img.style.left = `${x * scale + boardLeft}px`;
        img.style.top = `${y * scale + boardTop}px`;
        img.style.width = `${180 * scale}px`;
        img.style.height = `${240 * scale}px`;
        img.style.cursor = 'pointer';
        img.onclick = () => {
            if (window.showPowiek) window.showPowiek([leaderObj], 0, 'leaders');
        };
        overlay.appendChild(img);
    };

    createLeader(playerLeaderObj, 286, 1679);
    createLeader(opponentLeaderObj, 286, 174);
}

