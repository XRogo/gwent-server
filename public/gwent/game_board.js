import cards from './cards.js';
import { renderCardHTML } from './bcard_render.js';
import { showPowiek, renderPowiek } from './rcard.js';
import { krole } from './krole.js';
import { showPrzejscie, hidePrzejscie, getIsShowing } from './przejsciakod.js';
import { animateLeaderFromDeck, animateOpponentLeaderFromDeck, animateDeckToHand, animateBoardToGraveyard, animateCardToDeck } from './animacje.js';

// Preload card images to avoid flickering when they appear in hand/board
function preloadCardImages() {
    console.log("[BOARD] Preloading card assets...");
    cards.forEach(card => {
        if (card.karta) {
            const img = new Image();
            img.src = card.karta;
        }
    });

    // Also preload card backs for animations
    const backs = [
        'polnoc_rewers.webp', 'nilftgard_rewers.webp', 
        "scoia'tel_rewers.webp", 'potwory_rewers.webp', 
        'skelige_rewers.webp'
    ];
    backs.forEach(b => {
        const img = new Image();
        img.src = `/gwent/assets/asety/${b}`;
    });
}
preloadCardImages();

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
window.opponentLeaderAnimated = false;
window.cardsAnimated = false;
window.arrivedCards = new Set();
window.proposedCard = null; // Karta wybrana do potwierdzenia propozycji zagrania
window.proposedTargetRow = null; 

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
            const mapToObjects = (numerArray) => (numerArray || []).map(num => {
                const c = cards.find(card => card.numer === String(num));
                return c ? { ...c, _id: Math.random() } : null;
            }).filter(Boolean);

            playerHand = mapToObjects(data.hand);
            drawPile = mapToObjects(data.deck);
            playerGraveyard = mapToObjects(data.graveyard);
            opponentGraveyard = mapToObjects(data.opponentGraveyard || []);

            // Since it's init, all cards in hand are "arrived"
            playerHand.forEach(c => window.arrivedCards.add(c));
            window.cardsAnimated = true;

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
                        
                        // Animacja dowódcy gracza
                        if (playerLeaderObj) {
                            animateLeaderFromDeck(playerLeaderObj, () => {
                                window.leaderAnimated = true;
                                renderAll(currentNick);
                            });
                        }

                        // Animacja dowódcy przeciwnika
                        if (opponentLeaderObj) {
                            animateOpponentLeaderFromDeck(opponentLeaderObj, () => {
                                window.opponentLeaderAnimated = true;
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
                        if (opponentLeaderObj) {
                            animateOpponentLeaderFromDeck(opponentLeaderObj, () => {
                                window.opponentLeaderAnimated = true;
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
        const handObjects = hand.map(num => {
            const c = cards.find(card => card.numer === String(num));
            return c ? { ...c, _id: Math.random() } : null;
        }).filter(Boolean);
        
        // Aktualizacja lokalnej talii (drawPile) - usuń tylko te wystąpienia które doleciały do ręki
        if (drawPile.length > 0) {
            handObjects.forEach(hCard => {
                const idx = drawPile.findIndex(dCard => dCard.numer === hCard.numer);
                if (idx !== -1) drawPile.splice(idx, 1);
            });
        }

        // Natychmiast otwórz mulligan (animacje lecą "pod" nim)
        playerHand = handObjects;
        sortHand(); 

        const areaLeft = 1163, areaRight = 3018, areaTop = 1691, cardW = 180;
        const count = playerHand.length;
        const totalAreaWidth = (areaRight - areaLeft);
        
        let cardStep = cardW + 5;
        if (count * cardStep > totalAreaWidth) {
            cardStep = (totalAreaWidth - cardW) / (count - 1);
        }
        const occupiedWidth = (count - 1) * cardStep + cardW;
        const startX = (totalAreaWidth - occupiedWidth) / 2;

        const sortedTargets = playerHand.map((_, i) => ({
            x: areaLeft + startX + i * cardStep,
            y: areaTop
        }));

        window.arrivedCards.clear();

        // Rozpoczynamy animację kart do ręki (w tle)
        animateDeckToHand(playerHand, sortedTargets, () => {
            window.cardsAnimated = true;
            renderAll(currentNick);
        }, (index) => {
            window.arrivedCards.add(playerHand[index]);
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
        const rawCard = cards.find(c => c.numer === String(newCard));
        const cardObj = rawCard ? { ...rawCard, _id: Math.random() } : null;

        if (cardObj) {
            playerHand[cardIndex] = cardObj;
            console.log(`[BOARD] Swap successful: Index ${cardIndex} -> ${cardObj.nazwa}`);
            
            // Sync local drawPile - remove the card that just arrived in hand
            const dIdx = drawPile.findIndex(c => String(c.numer) === String(newCard));
            if (dIdx !== -1) drawPile.splice(dIdx, 1);

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
            // 1. Zakończenie wymiany (zamknięcie okna)
            window.mulliganFinished = true; // Set early to avoid onClose redundancy
            if (window.hidePowiek) window.hidePowiek();
            
            // 2. Posortowanie kart (zmienia indeksy w playerHand)
            sortHand();
            
            // Znajdź nowy indeks podmienionej karty po posortowaniu
            const newIndex = playerHand.findIndex(c => c === cardObj);
            
            // Ukryj tylko tę nową kartę dopóki nie doleci (arrivedCards już ma inne)
            window.arrivedCards.delete(cardObj);
            
            // Renderujemy rąkę z "dziurą" na nową kartę
            renderAll(currentNick);

            // Obliczamy pozycję 4K docelową dla nowej karty w posortowanej ręce
            // Używamy getBoundingClientRect na ukrytym elemencie (który renderAll właśnie wstawił)
            const wrappers = document.querySelectorAll('.hand-card-img');
            const targetEl = Array.from(wrappers).find(el => parseInt(el.dataset.index) === newIndex);
            
            const GUI_WIDTH = 3840, GUI_HEIGHT = 2160;
            const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
            const boardLeft = (window.innerWidth - GUI_WIDTH * scale) / 2;
            const boardTop = (window.innerHeight - GUI_HEIGHT * scale) / 2;
            
            let finalTarget = { x: startXInHand, y: areaTop }; // Fallback
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                finalTarget = {
                    x: (rect.left - boardLeft) / scale,
                    y: (rect.top - boardTop) / scale
                };
            }

            // 3. Animacja wymiany do DOCELOWEJ posortowanej pozycji
            animateDeckToHand([cardObj], [finalTarget], () => {
                window.arrivedCards.add(cardObj);
                window.mulliganFinished = true;
                socket.emit('end-mulligan', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
                renderAll(currentNick);
            });

        } else {
            // Animacja dla pojedynczej wymiany
            window.arrivedCards.delete(cardObj);
            renderAll(currentNick);
            animateDeckToHand([cardObj], [{x: startXInHand, y: areaTop}], () => {
                window.arrivedCards.add(cardObj);
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
        
        const newOppHandCount = isPlayer1Local ? data.p2HandCount : data.p1HandCount;
        
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

        const finishUpdate = () => {
            opponentHandCount = newOppHandCount;
            // Update opponentDeckCount if spy played
            if (data.spyDrawn && data.spyDrawn.length > 0 && data.spyPlayer !== (isPlayer1Local ? 'p1' : 'p2')) {
                opponentDeckCount -= data.spyDrawn.length;
            }

            renderAll(currentNick);

            if (currentTurn && window.gameStarted && window.mulliganFinished) {
                if (prevTurn !== currentTurn && !playerPassed && !opponentPassed) {
                    const isMyTurn = currentTurn === window.socket.id;
                    showPrzejscie(isMyTurn ? 't07' : 't08');
                }
            }
            isProcessingMove = false;
        };

        if (data.spyDrawn && data.spyDrawn.length > 0) {
            const isLocalSpy = data.spyPlayer === (isPlayer1Local ? 'p1' : 'p2');
            
            if (isLocalSpy) {
                const mapToObjects = (arr) => (arr || []).map(num => {
                    const c = cards.find(card => card.numer === String(num));
                    return c ? { ...c, _id: Math.random() } : null;
                }).filter(Boolean);

                const drawnObjs = mapToObjects(data.spyDrawn);

                playerHand.push(...drawnObjs);
                sortHand();
                
                // Hide them in DOM initially
                drawnObjs.forEach(obj => window.arrivedCards.delete(obj));
                
                const drawnNums = data.spyDrawn.map(n => String(n));
                drawPile = drawPile.filter(c => !drawnNums.includes(c.numer));

                renderAll(currentNick); // Show hand with holes

                const wrappers = document.querySelectorAll('.hand-card-img');
                const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
                const boardLeft = (window.innerWidth - 3840 * scale) / 2;
                const boardTop = (window.innerHeight - 2160 * scale) / 2;
                
                const targets = drawnObjs.map(obj => {
                    const idx = playerHand.findIndex(c => c === obj);
                    const el = Array.from(wrappers).find(w => parseInt(w.dataset.index) === idx);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        return { x: (rect.left - boardLeft) / scale, y: (rect.top - boardTop) / scale };
                    }
                    return { x: 2090, y: 1811 };
                });

                animateDeckToHand(drawnObjs, targets, () => {
                    drawnObjs.forEach(obj => window.arrivedCards.add(obj));
                    finishUpdate();
                });
            } else {
                // Opponent drew cards: use card backs for animation
                const oppFaction = window.opponentFaction || '1';
                const fMap = { "1": "polnoc_rewers.webp", "2": "nilftgard_rewers.webp", "3": "scoia'tel_rewers.webp", "4": "potwory_rewers.webp", "5": "skelige_rewers.webp" };
                const reverseImg = `/gwent/assets/asety/${fMap[oppFaction] || "polnoc_rewers.webp"}`;
                
                const fakeCards = data.spyDrawn.map(() => ({ karta: reverseImg, nazwa: 'Rewers', punkty: null }));
                const oppTarget = { x: 2090, y: 350 }; 
                
                animateDeckToHand(fakeCards, fakeCards.map(() => oppTarget), () => {
                    finishUpdate();
                }, null, true);
            }
        } else {
            finishUpdate();
        }
    });

    socket.on('medic-revive-prompt', (data) => {
        console.log("[BOARD] Received medic-revive-prompt", data);
        if (!data.graveyard || data.graveyard.length === 0) return;

        const graveObjs = data.graveyard.map(num => {
            const c = cards.find(card => String(card.numer) === String(num));
            return c ? { ...c, _id: Math.random() } : null;
        }).filter(Boolean);

        if (graveObjs.length > 0 && typeof window.showPowiek === 'function') {
            window.showPowiek(graveObjs, 0, 'graveyard', {
                isMedic: true,
                onSelect: (selectedCard) => {
                    console.log(`[BOARD] Medic revived card ${selectedCard.numer}`);
                    // Dedykowany mechanizm. Karty lądują domyślnie według ich pozycji, agile na froncie
                    let targetRowStr;
                    const rType = selectedCard.pozycja;
                    const side = isPlayer1Local ? 'p1' : 'p2';
                    if (rType === 1) targetRowStr = `${side}R1`;
                    else if (rType === 2) targetRowStr = `${side}R2`;
                    else if (rType === 3) targetRowStr = `${side}R3`;
                    else if (rType === 4) targetRowStr = `${side}R1`; 

                    window.socket.emit('play-medic-resurrection', {
                        gameCode: gameCodeLocal,
                        isPlayer1: isPlayer1Local,
                        cardNumer: selectedCard.numer,
                        targetRow: targetRowStr
                    });
                    if (window.hidePowiek) window.hidePowiek();
                }
            });
        }
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

    window.addEventListener('resize', () => {
        renderAll(currentNick);
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
            if (window.mulliganFinished) return; // Jeśli już skończyliśmy przez 2 wymiany, nie dubluj
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
    
    // Nie usuwamy wszystkiego (overlay.innerHTML = ''), 
    // aby zachować kontenery i umożliwić animacje CSS.
    // Zamiast tego usuwamy tylko nie-persystentne elementy
    const toRemove = Array.from(overlay.children).filter(c => !c.classList.contains('persistent'));
    toRemove.forEach(c => overlay.removeChild(c));


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
    renderProposedCard(overlay); // Nowy krok: wizualizacja potwierdzenia zagrania
    renderNicknames(overlay, nick);
    renderStats(overlay);
    renderScores(overlay);
    renderLives(overlay);
    renderGraveyards(overlay);
    renderPiles(overlay);
    renderLeaders(overlay);
    renderRows(overlay);
}

function renderProposedCard(overlay) {
    if (!window.proposedCard) {
        window._activeProposedId = null;
        return;
    }

    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const card = window.proposedCard;
    const dkartaW = 523 * scale; 
    const dkartaH = 992 * scale;

    let wrapper = overlay.querySelector('#proposed-card-preview');
    const isNew = (!wrapper || window._activeProposedId !== card._id);
    
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'proposed-card-preview';
        wrapper.className = 'persistent';
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = '6000';
        wrapper.style.cursor = 'default';
        wrapper.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
        overlay.appendChild(wrapper);
    }

    window._activeProposedId = card._id;

    // Pozycja docelowa: ZA 3120, środek
    const targetLeft = 3120 * scale + boardLeft;
    const targetTop = 1080 * scale + boardTop; // Środek Y

    if (isNew && window.lastProposedStartRect) {
        // Startujemy z pozycji karty w ręce
        wrapper.style.transition = 'none';
        wrapper.style.left = `${window.lastProposedStartRect.left}px`;
        wrapper.style.top = `${window.lastProposedStartRect.top}px`;
        wrapper.style.width = `${window.lastProposedStartRect.width}px`;
        wrapper.style.height = `${window.lastProposedStartRect.height}px`;
        wrapper.style.transform = 'none';
        wrapper.style.opacity = '0.5';
        
        // Wymuś reflow
        wrapper.offsetHeight;
        
        // Rozpocznij animację do panelu bocznego
        wrapper.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
        wrapper.style.left = `${targetLeft}px`;
        wrapper.style.top = `${targetTop}px`;
        wrapper.style.width = `${dkartaW}px`;
        wrapper.style.height = `${dkartaH}px`;
        wrapper.style.transform = 'translateY(-50%)';
        wrapper.style.opacity = '1';
    } else {
        // Po prostu aktualizuj pozycję (np. przy resize)
        wrapper.style.left = `${targetLeft}px`;
        wrapper.style.top = `${targetTop}px`;
        wrapper.style.width = `${dkartaW}px`;
        wrapper.style.height = `${dkartaH}px`;
        wrapper.style.transform = 'translateY(-50%)';
    }

    wrapper.style.boxShadow = `0 0 ${40 * scale}px rgba(199, 167, 110, 0.8)`;
    
    // Pełny render
    const factionId = window.playerFaction || '1';
    wrapper.innerHTML = renderCardHTML(card, {
        playerFaction: factionId,
        isLargeView: true
    });

    const content = wrapper.querySelector('.card-content');
    if (content) {
        content.style.width = '100%';
        content.style.height = '100%';
        const points = content.querySelector('.points');
        if (points) points.style.fontSize = (dkartaH * 0.1) + 'px';
        const name = content.querySelector('.name');
        if (name) name.style.fontSize = (dkartaH * 0.044) + 'px';
    }

    // Kliknięcie tła anuluje
    overlay.onmousedown = (e) => {
        if (e.target === overlay && window.proposedCard) {
            window.proposedCard = null;
            renderAll(currentNick);
        }
    };
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
    
    if (!boardState) return scores;

    const checkWeather = (type) => {
        return boardState.weather && boardState.weather.some(wNum => {
            const wCard = cards.find(c => String(c.numer) === String(wNum));
            return wCard && (wCard.moc === type || wCard.moc === 'sztorm' && (type === 'mgla' || type === 'deszcz'));
        });
    };

    const calculateRowScore = (rowCards, specialSlotVal, weatherActive) => {
        let rowDict = {};
        let moraleCount = 0;
        let hornActive = false;

        if (specialSlotVal) {
            const sCard = cards.find(c => String(c.numer) === String(specialSlotVal));
            if (sCard && sCard.moc === 'rog') hornActive = true;
        }

        if (!rowCards || rowCards.length === 0) return 0;

        rowCards.forEach(cardNum => {
            const card = cards.find(c => String(c.numer) === String(cardNum));
            if (card && typeof card.punkty === 'number') {
                if (!rowDict[card.numer]) rowDict[card.numer] = { count: 0, card: card };
                rowDict[card.numer].count++;
                if (!card.bohater && card.moc === 'morale') moraleCount++;
            }
        });

        let sum = 0;
        Object.values(rowDict).forEach(group => {
            const c = group.card;
            const count = group.count;
            
            if (c.bohater) {
                sum += c.punkty * count;
            } else {
                let pts = weatherActive ? 1 : c.punkty;
                if (c.moc === 'wiez') pts *= count;
                
                let mBuff = (c.moc === 'morale') ? (moraleCount - 1) : moraleCount;
                if (mBuff > 0) pts += mBuff;
                
                if (hornActive) pts *= 2;
                sum += pts * count;
            }
        });
        return sum;
    };

    const mrozActive = checkWeather('mroz');
    const mglaActive = checkWeather('mgla');
    const deszczActive = checkWeather('deszcz');

    scores.p1.R1 = calculateRowScore(boardState.p1R1, boardState.p1S1, mrozActive);
    scores.p1.R2 = calculateRowScore(boardState.p1R2, boardState.p1S2, mglaActive);
    scores.p1.R3 = calculateRowScore(boardState.p1R3, boardState.p1S3, deszczActive);
    scores.p1.total = scores.p1.R1 + scores.p1.R2 + scores.p1.R3;

    scores.p2.R1 = calculateRowScore(boardState.p2R1, boardState.p2S1, mrozActive);
    scores.p2.R2 = calculateRowScore(boardState.p2R2, boardState.p2S2, mglaActive);
    scores.p2.R3 = calculateRowScore(boardState.p2R3, boardState.p2S3, deszczActive);
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

export function addCardPointsOverlay(wrapper, card, cardW, cardH, effectiveScore = null) {
    if (typeof card.punkty !== 'number') return;
    const cardScale = cardW / 180;

    const pointsDiv = document.createElement('div');
    pointsDiv.className = 'card-points-overlay';
    pointsDiv.style.position = 'absolute';
    pointsDiv.style.left = `${30 * cardScale}px`;
    pointsDiv.style.top = `${30 * cardScale}px`;
    pointsDiv.style.transform = 'translate(-50%, -50%)';
    pointsDiv.style.fontFamily = 'PFDinTextCondPro, sans-serif'; 
    pointsDiv.style.fontSize = `${44 * cardScale}px`;
    pointsDiv.style.fontWeight = 'normal';
    
    // User requested coloring based on score deviation from base points
    const actualScore = effectiveScore !== null ? effectiveScore : card.punkty;
    let baseColor = card.bohater ? '#fcfdfc' : '#000000';
    if (!card.bohater && actualScore > card.punkty) {
        baseColor = '#329420'; // Green buffed
    } else if (!card.bohater && actualScore < card.punkty) {
        baseColor = '#942020'; // Red nerfed
    }
    
    pointsDiv.style.color = baseColor;
    pointsDiv.style.textShadow = card.bohater
        ? '0 1px 3px rgba(0,0,0,0.8)'
        : '0 1px 2px rgba(255,255,255,0.3)';
    pointsDiv.style.pointerEvents = 'none';
    pointsDiv.style.zIndex = '3';
    pointsDiv.style.lineHeight = '1';
    pointsDiv.textContent = actualScore;
    wrapper.appendChild(pointsDiv);
    
    if (card.bohater) {
        const heroIcon = document.createElement('img');
        heroIcon.src = '/gwent/assets/karty/bohater.webp';
        heroIcon.className = 'card-points-overlay';
        heroIcon.style.position = 'absolute';
        heroIcon.style.left = `${-8 * cardScale}px`;
        heroIcon.style.top = `${-8 * cardScale}px`;
        heroIcon.style.width = `${124 * cardScale}px`;
        heroIcon.style.height = `${126 * cardScale}px`;
        heroIcon.style.pointerEvents = 'none';
        heroIcon.style.zIndex = '2';
        wrapper.appendChild(heroIcon);
    }
}

function renderHand(overlay) {
    if (!window.cardsAnimated && window.arrivedCards.size === 0) return;

    const GUI_WIDTH = 3840, GUI_HEIGHT = 2160;
    const areaLeft = 1163, areaTop = 1691, areaRight = 3018, areaBottom = 1932;
    const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
    const boardLeft = (window.innerWidth - GUI_WIDTH * scale) / 2;
    const boardTop = (window.innerHeight - GUI_HEIGHT * scale) / 2;

    let container = overlay.querySelector('.hand-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'hand-container persistent';
        container.style.position = 'absolute';
        overlay.appendChild(container);
    }
    // Update container every time (scale/res might change)
    container.style.left = `${areaLeft * scale + boardLeft}px`;
    container.style.top = `${areaTop * scale + boardTop}px`;
    container.style.width = `${(areaRight - areaLeft) * scale}px`;
    container.style.height = `${(areaBottom - areaTop) * scale}px`;
    
    const count = playerHand.length;
    if (selectedHandIndex >= count) selectedHandIndex = -1;
    const totalAreaWidth = (areaRight - areaLeft) * scale;
    const cardW = 180 * scale;
    const cardH = 240 * scale;

    let cardStep = cardW + (5 * scale);
    if (count * cardStep > totalAreaWidth) {
        cardStep = (totalAreaWidth - cardW) / (count - 1);
    }
    const occupiedWidth = (count > 0 ? (count - 1) * cardStep + cardW : 0);
    const startX = (totalAreaWidth - occupiedWidth) / 2;

    // Uzgadnianie (Reconciliation) DOM
    const currentWrappers = Array.from(container.querySelectorAll('.hand-card-img'));
    const handCardIds = playerHand.map(c => c._id);

    // Usuń te, których już nie ma
    currentWrappers.forEach(w => {
        if (!handCardIds.includes(parseFloat(w.dataset.id))) {
            container.removeChild(w);
        }
    });

    playerHand.forEach((card, i) => {
        const isProposed = window.proposedCard === card;
        let wrapper = container.querySelector(`.hand-card-img[data-id="${card._id}"]`);
        
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'hand-card-img';
            wrapper.dataset.id = card._id;
            wrapper.style.position = 'absolute';
            wrapper.style.cursor = 'pointer';
            wrapper.style.transition = 'transform 0.2s ease-out, top 0.2s ease-out';
            
            const img = document.createElement('img');
            img.src = card.karta;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.display = 'block';
            wrapper.appendChild(img);
        }

        // Usuń stare nakładki przed ponownym dodaniem
        const oldPoints = wrapper.querySelectorAll('.card-points-overlay');
        oldPoints.forEach(p => p.remove());
        addCardPointsOverlay(wrapper, card, cardW, cardH);

        // Aktualizuj parametry
        wrapper.style.width = `${cardW}px`;
        wrapper.style.height = `${cardH}px`;
        wrapper.dataset.index = i;
        wrapper.style.left = `${startX + i * cardStep}px`;
        wrapper.style.zIndex = i + 1;
        
        const isHovered = (i === selectedHandIndex);
        wrapper.style.top = isHovered ? '25%' : '50%';
        wrapper.style.transform = isHovered ? 'translateY(-75%)' : 'translateY(-50%)';
        
        // Ukryj jeśli jeszcze nie doleciała LUB jest właśnie sprawdzana do zagrania
        if (!window.arrivedCards.has(card) || isProposed) {
            wrapper.style.visibility = 'hidden';
            wrapper.style.pointerEvents = 'none';
        } else {
            wrapper.style.visibility = 'visible';
            wrapper.style.pointerEvents = 'auto';
        }

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
            if (isMulliganActive) return;
            
            // Rejestrujemy pozycję startową dla animacji podglądu
            const rect = wrapper.getBoundingClientRect();
            window.lastProposedStartRect = {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            };
            
            window.proposedCard = card;
            renderAll(currentNick);
        };
        // Always append to sync DOM order with playerHand array
        container.appendChild(wrapper);
    });
}

function updateHandVisuals(container, scale) {
    if (!container) return;
    const count = playerHand.length;
    const wrappers = container.querySelectorAll('.hand-card-img');
    wrappers.forEach((wrapper, idx) => {
        if (idx === selectedHandIndex) {
            wrapper.style.transform = 'translateY(-75%)'; // Wysunięcie o ok. 1/4 wysokości
            wrapper.style.zIndex = '5000';
            wrapper.style.boxShadow = `0 0 ${20 * scale}px #c7a76e`;
        } else {
            wrapper.style.transform = 'translateY(-50%)';
            wrapper.style.zIndex = idx + 1;
            wrapper.style.boxShadow = 'none';
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

function confirmPlayProposed(targetData = {}) {
    if (!window.proposedCard) return;
    const card = window.proposedCard;
    
    // Ustalanie pozycji zagrania
    let finalPos = targetData.rowIdx || (card.pozycja === 4 ? 1 : card.pozycja);
    const isSpecial = card.numer === "002" || card.numer === "000" || ["mroz", "mgla", "deszcz", "sztorm", "niebo"].includes(card.moc);
    
    const preview = document.getElementById('proposed-card-preview');
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    if (preview) {
        const smallProxy = document.createElement('div');
        smallProxy.style.position = 'absolute';
        const largeCenter = 3120 + (523 / 2);
        smallProxy.style.left = `${(largeCenter - (180 / 2)) * scale + boardLeft}px`; 
        smallProxy.style.top = `${1080 * scale + boardTop}px`;
        smallProxy.style.transform = 'translateY(-50%)';
        smallProxy.style.width = `${180 * scale}px`;
        smallProxy.style.height = `${240 * scale}px`;
        smallProxy.style.zIndex = '7000';
        smallProxy.style.transition = 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
        
        const img = document.createElement('img');
        img.src = card.karta;
        img.style.width = '100%';
        smallProxy.appendChild(img);
        document.body.appendChild(smallProxy);

        preview.style.transition = 'opacity 0.2s ease-out, transform 0.2s';
        preview.style.opacity = '0';
        preview.style.transform = 'translateY(-50%) scale(0.9)';

        // Animacja do celu
        setTimeout(() => {
            // Obliczamy przybliżoną pozycję docelową rzędu
            let targetX = 1412 + 1609/2;
            let targetY = 1000; // Środek domyślny
            
            const rCoords = {
                1: 863 + 120,
                2: 1129 + 120,
                3: 1407 + 120
            };
            if (rCoords[finalPos]) targetY = rCoords[finalPos];

            smallProxy.style.left = `${(targetX - 90) * scale + boardLeft}px`;
            smallProxy.style.top = `${(targetY - 120) * scale + boardTop}px`;
            smallProxy.style.opacity = '0';
            setTimeout(() => smallProxy.remove(), 500);
        }, 50);
    }

    // Wywołujemy standardowe zagranie na serwerze
    window.socket.emit('play-card', {
        gameCode: gameCodeLocal,
        isPlayer1: isPlayer1Local,
        cardNumer: card.numer,
        pozycja: finalPos,
        isSpecial: isSpecial
    });

    window.proposedCard = null;
    isProcessingMove = true; 
    renderAll(currentNick);
}

function renderWeather(overlay) {
    if (!boardState || !boardState.weather || boardState.weather.length === 0) return;

    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const weatherW = 549 * scale;
    const weatherH = 239 * scale;
    const cardH = weatherH;
    const cardW = cardH * (180 / 240);
    
    let container = overlay.querySelector('#weather-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'weather-container';
        container.style.position = 'absolute';
        overlay.appendChild(container);
    }
    
    container.style.left = `${286 * scale + boardLeft}px`;
    container.style.top = `${917 * scale + boardTop}px`;
    container.style.width = `${weatherW}px`;
    container.style.height = `${weatherH}px`;
    
    // Rozkład max 3 kart.
    const count = Math.min(boardState.weather.length, 3);
    
    // Obliczamy krok.
    let cardStep = cardW + (5 * scale);
    if (count * cardStep > weatherW) {
        cardStep = (weatherW - cardW) / Math.max(1, count - 1);
    }
    const occupiedWidth = (count > 0 ? (count - 1) * cardStep + cardW : 0);
    const startX = (weatherW - occupiedWidth) / 2;

    // Reconciliation
    const currentChildren = Array.from(container.children);
    if (currentChildren.length > count) {
        for (let j = count; j < currentChildren.length; j++) {
            container.removeChild(currentChildren[j]);
        }
    }

    // Wyświetl tylko 3 ostatnie z zagranych pogód
    const visibleWeather = boardState.weather.slice(-3);

    visibleWeather.forEach((wStr, i) => {
        const wNum = wStr.split('-')[1];
        const card = cards.find(c => String(c.numer) === String(wNum));
        if (card) {
            let wrapper = container.children[i];
            if (!wrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'board-card-wrapper pointer-events-none';
                wrapper.style.position = 'absolute';
                wrapper.style.height = '100%';
                wrapper.style.width = `${cardW}px`;
                wrapper.style.transition = 'transform 0.2s ease-out, box-shadow 0.2s ease-out';
                
                const img = document.createElement('img');
                img.style.height = '100%';
                img.style.width = 'auto';
                img.style.display = 'block';
                wrapper.appendChild(img);
                container.appendChild(wrapper);
            }
            
            wrapper.style.width = `${cardW}px`;
            if (wrapper.querySelector('img').src.indexOf(card.karta) === -1) {
                wrapper.querySelector('img').src = card.karta;
            }

            wrapper.style.left = `${startX + i * cardStep}px`;
            wrapper.style.zIndex = i + 1;
        }
    });
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
        const cardsInRowNumers = boardState[rowKey] || [];
        // Map numbers to card objects BUT we need persistent IDs for board cards too
        // In boardState, we only have numbers.
        // I'll create stable IDs for cards in rows based on their index in the array? 
        // No, that fails if someone draws from graveyard.
        
        const count = cardsInRowNumers.length;
        const totalRowWidth = coords.w * scale;
        const cardH = coords.h * scale;
        const cardW = cardH * (180 / 240);

        let cardStep = cardW + (5 * scale);
        if (count * cardStep > totalRowWidth) {
            cardStep = (totalRowWidth - cardW) / (count - 1);
        }
        const occupiedWidth = (count > 0 ? (count - 1) * cardStep + cardW : 0);
        const startX = (totalRowWidth - occupiedWidth) / 2;

        let rowDiv = overlay.querySelector(`.row-container[data-row="${rowKey}"]`);
        if (!rowDiv) {
            rowDiv = document.createElement('div');
            rowDiv.className = 'row-container persistent';
            rowDiv.dataset.row = rowKey;
            rowDiv.style.position = 'absolute';
            overlay.appendChild(rowDiv);
        }

        rowDiv.style.left = `${coords.x * scale + boardLeft}px`;
        rowDiv.style.top = `${coords.y * scale + boardTop}px`;
        rowDiv.style.width = `${totalRowWidth}px`;
        rowDiv.style.height = `${cardH}px`;

        // Highlight valid row
        if (window.proposedCard) {
            const pCard = window.proposedCard;
            const isMelee = rowKey.endsWith('1');
            const isRanged = rowKey.endsWith('2');
            const isSiege = rowKey.endsWith('3');
            const isMySide = rowKey.startsWith(isPlayer1Local ? 'p1' : 'p2');
            
            let isValid = false;
            if (isMySide) {
                if (pCard.pozycja === 1 && isMelee) isValid = true;
                if (pCard.pozycja === 2 && isRanged) isValid = true;
                if (pCard.pozycja === 3 && isSiege) isValid = true;
                if (pCard.pozycja === 4 && (isMelee || isRanged)) isValid = true;
                // Special cards handled separately usually but for now let's allow row clicks
                if (pCard.numer === "002" || pCard.moc === "rog") isValid = true;
            }

            if (isValid) {
                rowDiv.classList.add('valid-row-hl');
                rowDiv.style.backgroundColor = 'rgba(199, 167, 110, 0.2)';
                rowDiv.style.cursor = 'pointer';
                rowDiv.onclick = (e) => {
                    e.stopPropagation();
                    confirmPlayProposed({ rowIdx: isMelee ? 1 : (isRanged ? 2 : 3) });
                };
            } else {
                rowDiv.classList.remove('valid-row-hl');
                rowDiv.style.backgroundColor = 'transparent';
                rowDiv.style.cursor = 'default';
                rowDiv.onclick = null;
            }
        } else {
            rowDiv.classList.remove('valid-row-hl');
            rowDiv.style.backgroundColor = 'transparent';
            rowDiv.style.cursor = 'default';
        }

        // Reconciliation
        const currentChildren = Array.from(rowDiv.children);
        // Remove excess
        if (currentChildren.length > count) {
            for (let j = count; j < currentChildren.length; j++) {
                rowDiv.removeChild(currentChildren[j]);
            }
        }

        cardsInRowNumers.forEach((numer, i) => {
            const card = cards.find(c => c.numer === String(numer));
            if (card) {
                let wrapper = rowDiv.children[i];
                if (!wrapper) {
                    wrapper = document.createElement('div');
                    wrapper.className = 'board-card-wrapper';
                    wrapper.style.position = 'absolute';
                    wrapper.style.height = '100%';
                    wrapper.style.width = `${cardW}px`;
                    wrapper.style.transition = 'transform 0.2s ease-out, box-shadow 0.2s ease-out';
                    
                    const img = document.createElement('img');
                    img.style.height = '100%';
                    img.style.width = 'auto';
                    img.style.display = 'block';
                    wrapper.appendChild(img);
                    rowDiv.appendChild(wrapper);
                }
                
                // Update
                wrapper.style.width = `${cardW}px`;
                if (wrapper.querySelector('img').src.indexOf(card.karta) === -1) {
                    wrapper.querySelector('img').src = card.karta;
                }

                // Usuń stare punkty/ikony przed odświeżeniem
                const oldPoints = wrapper.querySelectorAll('.card-points-overlay');
                oldPoints.forEach(p => p.remove());

                // Modyfikacja koloru punktów na podstawie siły modyfikowanej (zmienność kolorów)
                const checkWeather = (type) => {
                    return boardState.weather && boardState.weather.some(wNum => {
                        const wCard = cards.find(c => String(c.numer) === String(wNum));
                        return wCard && (wCard.moc === type || wCard.moc === 'sztorm' && (type === 'mgla' || type === 'deszcz'));
                    });
                };

                let cardScore = card.punkty;
                if (!card.bohater && typeof card.punkty === 'number') {
                    const rowNum = parseInt(rowKey.slice(-1));
                    let isWeatherActive = false;
                    if (rowNum === 1 && checkWeather('mroz')) isWeatherActive = true;
                    if (rowNum === 2 && checkWeather('mgla')) isWeatherActive = true;
                    if (rowNum === 3 && checkWeather('deszcz')) isWeatherActive = true;
                    
                    if (isWeatherActive) cardScore = 1;

                    // Bond/Wiez logic visually (if multiple cards of same name)
                    // We just count occurrences in this very row to display current effective points.
                    const cardsInSameRow = boardState[rowKey] || [];
                    const bondCount = cardsInSameRow.filter(num => num === card.numer).length;
                    
                    if (card.moc === 'wiez') cardScore *= bondCount;
                    
                    // Morale logic
                    let moraleCount = 0;
                    cardsInSameRow.forEach(cNum => {
                        const cObj = cards.find(c => String(c.numer) === String(cNum));
                        if (cObj && !cObj.bohater && cObj.moc === 'morale') moraleCount++;
                    });
                    
                    let mBuff = (card.moc === 'morale') ? (moraleCount - 1) : moraleCount;
                    if (mBuff > 0) cardScore += mBuff;

                    // Horn logic
                    const specialSlotKey = rowKey.substring(0, 2) + 'S' + rowKey.slice(-1);
                    const specialSlotVal = boardState[specialSlotKey];
                    let hornActive = false;
                    if (specialSlotVal) {
                        const sCard = cards.find(c => String(c.numer) === String(specialSlotVal));
                        if (sCard && sCard.moc === 'rog') hornActive = true;
                    }
                    if (hornActive) cardScore *= 2;
                }

                addCardPointsOverlay(wrapper, card, cardW, cardH, cardScore);

                wrapper.style.left = `${startX + i * cardStep}px`;
                wrapper.style.zIndex = i + 1;
                wrapper.dataset.numer = card.numer;
                const rowRealKey = rowKey.startsWith('p1') ? 'p1' : 'p2';
                wrapper.dataset.side = rowRealKey;

                // Target for Decoy
                if (window.proposedCard && window.proposedCard.moc === 'manek') {
                    const isMyCard = (rowKey.startsWith('p1') === isPlayer1Local);
                    if (isMyCard && !card.bohater) {
                        wrapper.style.cursor = 'pointer';
                        wrapper.classList.add('valid-target');
                        wrapper.onclick = (e) => {
                            e.stopPropagation();
                            confirmPlayProposed({ targetCardNumer: card.numer, targetRow: rowKey });
                        };
                    }
                }

                wrapper.onmouseenter = () => {
                    wrapper.style.zIndex = '5000';
                    wrapper.style.transform = 'translateY(-15%)';
                    wrapper.style.boxShadow = `0 0 ${15 * scale}px #c7a76e`;
                };
                wrapper.onmouseleave = () => {
                    wrapper.style.zIndex = i + 1;
                    wrapper.style.transform = 'none';
                    wrapper.style.boxShadow = 'none';
                };
            }
        });
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
        // Zabezpieczenie przed pokazywaniem dopóki animacja trwa
        if (!isOpponent && !window.leaderAnimated) return;
        if (isOpponent && !window.opponentLeaderAnimated) return;

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
