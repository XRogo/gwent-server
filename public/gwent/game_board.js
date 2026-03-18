import cards from './cards.js';
import { showPowiek, renderPowiek } from './rcard.js';
import { krole } from './krole.js';
import { showPrzejscie, hidePrzejscie, getIsShowing } from './przejsciakod.js';
import { animateLeaderFromDeck, animateDeckToHand, animateBoardToGraveyard, animateCardToDeck } from './animacje.js';

let playerHand = [];
let drawPile = [];
let playerGraveyard = [];
let opponentGraveyard = []; // Now full array
let opponentHandCount = 10;
let opponentDeckCount = 12;
let isMulliganActive = false;
let isProcessingMove = false; // Flag to prevent rapid clicks / double playing
let swapsCount = 0;
let playerLives = 2;
let opponentLives = 2;
let playerPassed = false;
let opponentPassed = false;
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

window.leaderAnimated = false;
window.cardsAnimated = false;
window.arrivedHandIndices = new Set();

function sortHand() {
    playerHand.sort((a, b) => {
        const isSpecialA = (typeof a.punkty !== 'number' || a.typ === 'specjalna');
        const isSpecialB = (typeof b.punkty !== 'number' || b.typ === 'specjalna');

        if (isSpecialA && !isSpecialB) return -1;
        if (!isSpecialA && isSpecialB) return 1;

        if (isSpecialA && isSpecialB) {
            // Obie specjalne - kolejność z cards.js
            const idxA = cards.findIndex(c => c.numer === a.numer);
            const idxB = cards.findIndex(c => c.numer === b.numer);
            return idxA - idxB;
        }

        // Obie jednostki - sortuj po punktach rosnąco
        if (a.punkty !== b.punkty) {
            return a.punkty - b.punkty;
        }

        // Tyle samo punktów - fallback do cards.js
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
            opponentGraveyard = mapToObjects(data.opponentGraveyard || []);

            opponentHandCount = data.opponentHandCount;
            opponentDeckCount = data.opponentDeckCount;
            window.playerFaction = data.faction || localStorage.getItem('faction') || '1';
            window.opponentFaction = data.opponentFaction;
            swapsCount = data.swapsPerformed || 0;
            if (data.opponentNickname) window.opponentNickname = data.opponentNickname;
            if (data.nickname) { nick = data.nickname; currentNick = nick; }

            if (data.leader) playerLeaderObj = krole.find(k => k.numer === data.leader);
            if (data.opponentLeader) opponentLeaderObj = krole.find(k => k.numer === data.opponentLeader);

            playerLives = isPlayer1Local ? (data.p1Lives !== undefined ? data.p1Lives : 2) : (data.p2Lives !== undefined ? data.p2Lives : 2);
            opponentLives = isPlayer1Local ? (data.p2Lives !== undefined ? data.p2Lives : 2) : (data.p1Lives !== undefined ? data.p1Lives : 2);
            playerPassed = isPlayer1Local ? data.p1Passed : data.p2Passed;
            opponentPassed = isPlayer1Local ? data.p2Passed : data.p1Passed;

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
                        if (playerLeaderObj) {
                            animateLeaderFromDeck(playerLeaderObj, () => {
                                window.leaderAnimated = true;
                                renderAll(currentNick);
                            });
                        }
                        
                        showPrzejscie(startBanner, {
                            customCzas: 2000,
                            onFinish: () => {
                                // Dopiero po banerze prosimy o karty
                                socket.emit('request-initial-draw', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
                            }
                        });
                    } else {
                        // Fallback
                        window.gameStarted = true;
                        if (playerLeaderObj) {
                            animateLeaderFromDeck(playerLeaderObj, () => {
                                window.leaderAnimated = true;
                                renderAll(currentNick);
                            });
                        }
                        socket.emit('request-initial-draw', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
                    }
                }
            } else {
                renderAll(nick);
            }
        }
    });

    socket.on('card-moved-to-graveyard', (data) => {
        const { card, side } = data;
        const cardObj = cards.find(c => c.numer === card.numer);
        if (cardObj) {
            if (side === 'p1') {
                playerGraveyard.push(cardObj);
            } else {
                opponentGraveyard.push(cardObj);
            }
        }
    });

    socket.on('initial-cards-dealt', (data) => {
        const { hand } = data;
        const handObjects = hand.map(num => cards.find(c => c.numer === num)).filter(Boolean);
        
        // Obliczamy pozycje docelowe w ręce (4K)
        // Logika flex-center:
        const areaLeft = 1163, areaRight = 3018, areaTop = 1691;
        const areaWidth = areaRight - areaLeft;
        const cardW = 180;
        const count = handObjects.length;
        const totalCardsWidth = count * cardW;
        
        // Centrowanie
        const startX = areaLeft + (areaWidth - totalCardsWidth) / 2;
        const targets = handObjects.map((_, i) => ({
            x: startX + i * cardW,
            y: areaTop
        }));

        // Natychmiast otwórz mulligan (animacje lecą "pod" nim)
        playerHand = handObjects;
        sortHand(); // Sortujemy zanim wyliczymy pozycje docelowe i zaczniemy animację
        
        // Ponowne wyliczenie pozycji po posortowaniu
        const sortedTargets = playerHand.map((_, i) => ({
            x: startX + i * cardW,
            y: areaTop
        }));

        window.arrivedHandIndices.clear();

        // Rozpoczynamy animację kart do ręki (w tle)
        animateDeckToHand(playerHand, sortedTargets, () => {
            console.log("[BOARD] All cards have arrived.");
            window.cardsAnimated = true;
            renderAll(currentNick);
        }, (index) => {
            // Ta konkretna karta doleciała
            window.arrivedHandIndices.add(index);
            renderAll(currentNick);
        });

        startMulligan(socket, gameCodeLocal, isPlayer1Local);
    });

    socket.on('start-phase-resolved', () => {
        // Serwer zakończył fazę decyzji i rozdał karty, prosimy o nowy stan
        socket.emit('get-game-state', { gameCode, isPlayer1 });
    });

    socket.on('mulligan-swap-success', (data) => {
        const { newCard, swapsLeft, cardIndex } = data;
        const oldCardObj = playerHand[cardIndex]; // Save old card for animation
        const cardObj = cards.find(c => c.numer === newCard);

        if (cardObj) {
            playerHand[cardIndex] = cardObj;
            console.log(`[BOARD] Swap successful: Index ${cardIndex} -> ${cardObj.nazwa}`);
            renderPowiek();
        }
        swapsCount = 2 - swapsLeft;

        // Visual background animation
        const areaLeft = 1163, areaRight = 3018, areaTop = 1691, cardW = 180;
        const totalCardsWidth = playerHand.length * cardW;
        const startXInHand = areaLeft + (areaRight - areaLeft - totalCardsWidth) / 2 + cardIndex * cardW;

        // Old card back to deck
        if (oldCardObj) {
            animateCardToDeck(oldCardObj, { x: startXInHand, y: areaTop });
        }

        if (swapsLeft <= 0) {
            // Immediate close after 2nd swap (don't wait for animation to end)
            if (window.hidePowiek) window.hidePowiek();
            
            window.arrivedHandIndices.delete(cardIndex);
            renderAll(currentNick);
            
            animateDeckToHand([cardObj], [{x: startXInHand, y: areaTop}], () => {
                window.arrivedHandIndices.add(cardIndex);
                sortHand(); // Sort ONLY after closing
                window.arrivedHandIndices = new Set(playerHand.map((_, i) => i)); // Reveal all after sort
                window.mulliganFinished = true; // Zaznacz, że faza jest skończona
                socket.emit('end-mulligan', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
                renderAll(currentNick);
            });

        } else {
            // Animacja dla pojedynczej wymiany
            window.arrivedHandIndices.delete(cardIndex);
            renderAll(currentNick);
            animateDeckToHand([cardObj], [{x: startXInHand, y: areaTop}], () => {
                window.arrivedHandIndices.add(cardIndex);
                renderAll(currentNick);
            });
        }
    });

    socket.on('start-mulligan-timer', (data) => {
        // Przeciwnik skończył, masz 60s
        // Update timer safely without overriding the mulligan screen
        const timerUI = document.getElementById('powiek-timer');
        if (timerUI) timerUI.textContent = `Pozostały czas: ${data.timeLeft}s`;
    });

    socket.on('wait-for-mulligan', (data) => {
        // Ty skończyłeś, czekasz na przeciwnika
        if (window.mulliganFinished) {
            showPrzejscie('t06', { customOpis: "Czekasz na przeciwnika... {czas}", countDown: data.timeLeft });
        }
    });

    socket.on('mulligan-timer-expired', () => {
        if (window.hidePowiek) window.hidePowiek();
        sortHand();
        window.mulliganFinished = true;
        socket.emit('end-mulligan', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
        renderAll(currentNick);
    });

    socket.on('mulligan-finished-all', () => {
        hidePrzejscie(true); // Close t06 instantly
        showPrzejscie('t05', { onFinish: () => {
            const isMyTurn = currentTurn === window.socket.id;
            showPrzejscie(isMyTurn ? 't07' : 't08');
        }});
    });

    socket.on('turn-info', (data) => {
        const { myTurn } = data;
        showPrzejscie(myTurn ? 't07' : 't08');
    });

    socket.on('opponent-game-update', (data) => {
        if (data.handCount !== undefined) opponentHandCount = data.handCount;
        if (data.deckCount !== undefined) opponentDeckCount = data.deckCount;
        if (data.graveyard) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === String(num))).filter(Boolean);
            opponentGraveyard = mapToObjects(data.graveyard);
        }
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
        
        if (data.p1Graveyard) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === String(num))).filter(Boolean);
            playerGraveyard = mapToObjects(isPlayer1Local ? data.p1Graveyard : data.p2Graveyard);
            opponentGraveyard = mapToObjects(isPlayer1Local ? data.p2Graveyard : data.p1Graveyard);
        }

        if (prevTurn !== currentTurn && !playerPassed && !opponentPassed) {
            playerLives = isPlayer1Local ? data.p1Lives : data.p2Lives;
            opponentLives = isPlayer1Local ? data.p2Lives : data.p1Lives;
            playerPassed = isPlayer1Local ? data.p1Passed : data.p2Passed;
            opponentPassed = isPlayer1Local ? data.p2Passed : data.p1Passed;
        }
        
        renderAll(currentNick);

        // Pokaż baner przejściowy przy zmianie tury (tylko w trakcie gry, nie na starcie)
        if (currentTurn && window.gameStarted && window.mulliganFinished) {
            // Unikaj banerów jeśli to nie jest faktyczna zmiana tury
            if (prevTurn !== currentTurn && !playerPassed && !opponentPassed) {
                const isMyTurn = currentTurn === window.socket.id;
                showPrzejscie(isMyTurn ? 't07' : 't08');
            }
        }
        isProcessingMove = false; // Reset flag after turn sync
    });

    socket.on('play-error', (data) => {
        console.error("[BOARD] Play error:", data.error);
        isProcessingMove = false; // Unlock if server failed
        // Re-initialize might be needed here to re-sync
        socket.emit('get-game-state', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
    });

    socket.on('player-passed', (data) => {
        const { isPlayer1 } = data;
        const passedPlayerIsLocal = isPlayer1 === isPlayer1Local;

        if (passedPlayerIsLocal) {
            playerPassed = true;
            // Only show pass banner if opponent hasn't passed yet
            if (!opponentPassed) {
                showPrzejscie('t21', { onFinish: () => {
                    showPrzejscie('t08');
                }});
            }
        } else {
            opponentPassed = true;
            // Only show pass banner if player hasn't passed yet
            if (!playerPassed) {
                showPrzejscie('t20', { onFinish: () => {
                    showPrzejscie('t07');
                }});
            }
        }
        renderAll(currentNick);
    });

    socket.on('round-ended', (data) => {
        handleRoundEnd(data);
    });

    socket.on('next-round-started', (data) => {
        console.log("[BOARD] Przejście do nowej rundy...");
        const { board, currentTurn: newTurn, p1Graveyard, p2Graveyard } = data;
        const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === String(num))).filter(Boolean);

        boardState = board;
        currentTurn = newTurn;
        if (p1Graveyard) {
            const gy = isPlayer1Local ? p1Graveyard : p2Graveyard;
            const ogy = isPlayer1Local ? p2Graveyard : p1Graveyard;
            playerGraveyard = mapToObjects(gy);
            opponentGraveyard = mapToObjects(ogy);
        }
        playerPassed = false;
        opponentPassed = false;
        renderAll(currentNick);
        
        // Faza startowa rundy - t05, potem t07/08
        showPrzejscie('t05', { onFinish: () => {
            const isMyTurn = currentTurn === window.socket.id;
            showPrzejscie(isMyTurn ? 't07' : 't08');
        }});
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
        onSwap: (idx) => {
            swapsCount++;
            if (swapsCount >= 2) {
                if (window.hidePowiek) window.hidePowiek();
            }
            socket.emit('mulligan-swap', { gameCode, isPlayer1, cardIndex: idx });
        },
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

    // Turn indicator using images
    if (currentTurn) {
        const turnDiv = document.createElement('div');
        turnDiv.style.position = 'absolute';
        turnDiv.style.inset = '0';
        const isMyTurn = currentTurn === window.socket.id;
        turnDiv.style.background = `url('assets/asety/${isMyTurn ? 'ytruch.webp' : 'przeciwnikruch.webp'}') no-repeat center`;
        turnDiv.style.backgroundSize = 'contain';
        turnDiv.style.pointerEvents = 'none';
        turnDiv.style.zIndex = '1000'; // High z-index to stay above piled cards
        overlay.appendChild(turnDiv);
    }

    renderHand(overlay);
    renderNicknames(overlay, nick);
    renderStats(overlay);
    renderScores(overlay);
    renderLives(overlay);
    renderGraveyards(overlay);
    renderPiles(overlay);
    renderLeaders(overlay);
    renderRows(overlay);
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

function calculateScores() {
    const scores = { p1: { R1: 0, R2: 0, R3: 0, total: 0 }, p2: { R1: 0, R2: 0, R3: 0, total: 0 } };
    
    // Helper do zliczania punktów w danym rzędzie
    const sumRow = (rowArray) => {
        let sum = 0;
        if (!rowArray) return sum;
        rowArray.forEach(cardNum => {
            const cardObj = cards.find(c => c.numer === cardNum);
            if (cardObj && typeof cardObj.punkty === 'number') {
                sum += cardObj.punkty;
            }
        });
        return sum;
    };

    scores.p1.R1 = sumRow(boardState.p1R1);
    scores.p1.R2 = sumRow(boardState.p1R2);
    scores.p1.R3 = sumRow(boardState.p1R3);
    scores.p1.total = scores.p1.R1 + scores.p1.R2 + scores.p1.R3;

    scores.p2.R1 = sumRow(boardState.p2R1);
    scores.p2.R2 = sumRow(boardState.p2R2);
    scores.p2.R3 = sumRow(boardState.p2R3);
    scores.p2.total = scores.p2.R1 + scores.p2.R2 + scores.p2.R3;

    return scores;
}

function renderScores(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;
    
    const scores = calculateScores();
    const isP1 = isPlayer1Local;

    // Przypisanie wyników do gracza lokalnego i przeciwnika
    const myScores = isP1 ? scores.p1 : scores.p2;
    const oppScores = isP1 ? scores.p2 : scores.p1;

    const createScoreValue = (val, x, y, isTotal) => {
        const div = document.createElement('div');
        div.className = 'game-score-number';
        div.style.position = 'absolute';
        div.style.left = `${x * scale + boardLeft}px`;
        div.style.top = `${y * scale + boardTop}px`;
        div.style.textAlign = 'center';
        // Powiększone o 25% (bazowe 56 i 44)
        div.style.fontSize = isTotal ? `${56 * 1.25 * scale}px` : `${44 * 1.25 * scale}px`;
        div.style.color = '#000000'; // Kolor czarny
        div.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif'; // Fix: Poproszona czcionka Bold
        div.style.transform = 'translate(-50%, -50%)';
        div.style.fontWeight = isTotal ? 'bold' : 'normal';
        div.style.pointerEvents = 'none';
        // Biała poświata (glow)
        div.style.textShadow = `
            0 0 ${10 * scale}px #ffffff,
            0 0 ${20 * scale}px #ffffff
        `;
        div.textContent = val;
        return div;
    };

    // Przeciwnik (Góra planszy) - R3 (Siege), R2 (Ranged), R1 (Melee)
    overlay.appendChild(createScoreValue(oppScores.R3, 1071, 146, false));
    overlay.appendChild(createScoreValue(oppScores.R2, 1071, 410, false));
    overlay.appendChild(createScoreValue(oppScores.R1, 1071, 686, false));
    overlay.appendChild(createScoreValue(oppScores.total, 907, 663, true));

    // Gracz (Dół planszy) - R3 (Siege), R2 (Ranged), R1 (Melee)
    overlay.appendChild(createScoreValue(myScores.R3, 1071, 982, false));
    overlay.appendChild(createScoreValue(myScores.R2, 1071, 1247, false));
    overlay.appendChild(createScoreValue(myScores.R1, 1071, 1524, false));
    overlay.appendChild(createScoreValue(myScores.total, 907, 1467, true));
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

    // Opponent lives
    const oppYs = 695;
    if (opponentLives >= 1) overlay.appendChild(createLive(721, oppYs));
    if (opponentLives >= 2) overlay.appendChild(createLive(636, oppYs));

    // Player lives
    const playerYs = 1369;
    if (playerLives >= 1) overlay.appendChild(createLive(721, playerYs));
    if (playerLives >= 2) overlay.appendChild(createLive(636, playerYs));
}

/**
 * Dodaje overlay z punktami na karcie.
 * @param {HTMLElement} wrapper - kontener karty (div z position: relative)
 * @param {object} card - obiekt karty z cards.js
 * @param {number} cardW - szerokość karty w px (po skalowaniu)
 * @param {number} cardH - wysokość karty w px (po skalowaniu)
 */
export function addCardPointsOverlay(wrapper, card, cardW, cardH) {
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
    if (!window.cardsAnimated && window.arrivedHandIndices.size === 0) return; // Ukryj rękę dopóki nic nie doleci

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

        // Ukryj kartę jeśli jeszcze nie doleciała
        if (!window.arrivedHandIndices.has(i)) {
            wrapper.style.visibility = 'hidden';
        }

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
    if (isProcessingMove) return; // Prevent spamming
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
    if (getIsShowing()) {
        console.log("[BOARD] Próba zagrania karty podczas wyświetlania baneru - zablokowano.");
        return;
    }
    if (playerPassed) {
        console.log("[BOARD] Cannot play card, player has passed.");
        return;
    }

    const card = playerHand[index];
    if (!card) return;

    isProcessingMove = true; // Lock the UI until turn changes

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

    const renderGraveyardGroup = (x, y, cardList, isOpponent) => {
        const count = cardList.length;
        if (count === 0) return;

        // Render stack (bottom card i=0 at [X, Y])
        for (let i = 0; i < count; i++) {
            const cardObj = cardList[i];
            const cardW = 179 * scale;
            const cardH = 239 * scale;
            
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            const offset = i; 
            wrapper.style.left = `${(x - offset) * scale + boardLeft}px`;
            wrapper.style.top = `${(y - offset) * scale + boardTop}px`;
            wrapper.style.width = `${cardW}px`;
            wrapper.style.height = `${cardH}px`;
            wrapper.style.zIndex = 5 + i;
            
            const img = document.createElement('img');
            img.src = cardObj.karta;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.display = 'block';
            wrapper.appendChild(img);

            if (i === count - 1) { // Top card
                wrapper.style.cursor = 'pointer';
                wrapper.onclick = () => {
                    if (window.showPowiek) window.showPowiek(cardList, cardList.length - 1, 'game');
                };
                // Dodaj punkty tylko dla górnej karty
                addCardPointsOverlay(wrapper, cardObj, cardW, cardH);
            }
            overlay.appendChild(wrapper);
        }
    };

    // Corrected positions for graveyard stacking
    // Player GY: 3110, 1682
    renderGraveyardGroup(3110, 1682, playerGraveyard, false);
    // Opponent GY: 3110, 168 (No rotate, show faces)
    renderGraveyardGroup(3110, 168, opponentGraveyard, true);
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

                // Atrybuty do animacji cmentarza
                wrapper.className = 'board-card-wrapper';
                wrapper.dataset.numer = card.numer;
                const rowRealKey = rowKey.startsWith('p1') ? 'p1' : 'p2';
                wrapper.dataset.side = rowRealKey;

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
        img.className = 'board-card-wrapper'; // Specjalny slot też jest kartą na planszy
        img.dataset.numer = card.numer;
        img.dataset.side = sidePrefix;
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

    const createLeader = (leaderObj, x, y, isOpponent) => {
        if (!leaderObj) return;
        // Jeśli to dowódca gracza, nie renderuj go dopóki animacja się nie skończy
        if (!isOpponent && !window.leaderAnimated) return;

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

    createLeader(playerLeaderObj, 286, 1679, false);
    createLeader(opponentLeaderObj, 286, 174, true);

    // Przycisk PASS obok dowódcy gracza
    if (window.gameStarted && !playerPassed) {
        const passBtn = document.createElement('button');
        passBtn.className = 'game-pass-btn';
        passBtn.style.position = 'absolute';
        passBtn.style.left = `${490 * scale + boardLeft}px`; 
        passBtn.style.top = `${1779 * scale + boardTop}px`; // Wyrównanie do dolnej połowy karty dowódcy
        passBtn.style.width = `${120 * scale}px`;
        passBtn.style.height = `${50 * scale}px`;
        passBtn.style.backgroundColor = '#1a1a1a';
        passBtn.style.border = `${2 * scale}px solid #b28a41`;
        passBtn.style.borderRadius = `${4 * scale}px`;
        passBtn.style.color = '#b28a41';
        passBtn.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        passBtn.style.fontSize = `${28 * scale}px`;
        passBtn.style.boxShadow = '0 0 10px rgba(0,0,0,0.8)';
        passBtn.style.cursor = 'pointer';
        passBtn.textContent = 'PASS';
        
        const isMyTurn = currentTurn === window.socket.id;
        if (!isMyTurn) {
            passBtn.style.opacity = '0.5';
            passBtn.style.cursor = 'not-allowed';
            passBtn.onmouseenter = () => passBtn.style.backgroundColor = '#2a2a2a';
            passBtn.onmouseleave = () => passBtn.style.backgroundColor = '#1a1a1a';
        }

        passBtn.onclick = () => {
            if (currentTurn === window.socket.id) {
                window.socket.emit('pass-turn', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
            } else {
                console.log("[BOARD] Cannot pass, not your turn.");
            }
        };

        overlay.appendChild(passBtn);
    }
}

function collectCardsOnBoardDOM(isTargetOpponent) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const boardCards = [];
    const wrappers = document.querySelectorAll('.board-card-wrapper');
    
    wrappers.forEach(w => {
        const side = w.dataset.side; // 'p1' or 'p2'
        const isActuallyOpponent = (isPlayer1Local && side === 'p2') || (!isPlayer1Local && side === 'p1');
        
        if (isActuallyOpponent === isTargetOpponent) {
            const rect = w.getBoundingClientRect();
            const cardNum = w.dataset.numer;
            const cardObj = cards.find(c => c.numer === cardNum);
            if (cardObj) {
                boardCards.push({
                    card: cardObj,
                    currentPos4K: {
                        x: (rect.left - boardLeft) / scale,
                        y: (rect.top - boardTop) / scale
                    }
                });
            }
        }
    });
    return boardCards;
}

function handleRoundEnd(data) {
    const { winner, p1Score, p2Score, p1Lives, p2Lives } = data;
    
    // 1. Zidentyfikuj karty na planszy ZANIM je wyczyścisz
    const myBoardCards = collectCardsOnBoardDOM(false);
    const oppBoardCards = collectCardsOnBoardDOM(true);

    // 2. Wybierz kod banera
    let bannerCode = 't24'; // Remis
    if (winner === (isPlayer1Local ? 'p1' : 'p2')) bannerCode = 't23'; // Wygrana
    else if (winner) bannerCode = 't22'; // Przegrana

    // 3. Pokaz baner i RÓWNOLEGLE zacznij animację czyszczenia
    showPrzejscie(bannerCode);
    
    // Lokalne czyszczenie stanu, żeby karta zniknęła z "tła" a została tylko animacja
    boardState = {
        p1R1:[], p1R2:[], p1R3:[], p2R1:[], p2R2:[], p2R3:[],
        p1S1:null, p1S2:null, p1S3:null, p2S1:null, p2S2:null, p2S3:null
    };
    renderAll(currentNick);

    // Animacja trupów
    animateBoardToGraveyard(myBoardCards, false, playerGraveyard.length, () => {
        myBoardCards.forEach(item => playerGraveyard.push(item.card));
        renderAll(currentNick);
    });
    animateBoardToGraveyard(oppBoardCards, true, opponentGraveyard.length, () => {
        oppBoardCards.forEach(item => opponentGraveyard.push(item.card));
        renderAll(currentNick);
    });

    // Aktualizacja żyć po animacji (lub w jej trakcie)
    playerLives = isPlayer1Local ? p1Lives : p2Lives;
    opponentLives = isPlayer1Local ? p2Lives : p1Lives;
}
