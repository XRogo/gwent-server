const fs = require('fs');

// Wczytywanie kart używanych przez backend do zliczania punktów
let cards = [];
try {
    let cardsSource = fs.readFileSync(__dirname + '/public/tryby/klasyczny_gwint/cards.js', 'utf8');
    cardsSource = cardsSource.replace('export default cards;', 'return cards;');
    const getCards = new Function(cardsSource);
    cards = getCards();
    console.log(`[CLASSIC SERVER] Loaded ${cards.length} cards from cards.js`);
} catch (e) {
    console.error('[CLASSIC SERVER] Failed to load cards.js', e);
}

function sortHandForPlayer(hand) {
    hand.sort((aNum, bNum) => {
        const cardA = cards.find(c => String(c.numer) === String(aNum));
        const cardB = cards.find(c => String(c.numer) === String(bNum));
        if (!cardA || !cardB) return 0;

        const isSpecialA = (typeof cardA.punkty !== 'number' || cardA.typ === 'specjalna');
        const isSpecialB = (typeof cardB.punkty !== 'number' || cardB.typ === 'specjalna');

        if (isSpecialA && !isSpecialB) return -1;
        if (!isSpecialA && isSpecialB) return 1;

        if (isSpecialA && isSpecialB) {
            const idxA = cards.findIndex(c => c.numer === cardA.numer);
            const idxB = cards.findIndex(c => c.numer === cardB.numer);
            return idxA - idxB;
        }

        if (cardA.punkty !== cardB.punkty) {
            return cardA.punkty - cardB.punkty;
        }

        const idxA = cards.findIndex(c => c.numer === cardA.numer);
        const idxB = cards.findIndex(c => c.numer === cardB.numer);
        return idxA - idxB;
    });
}

/**
 * Oblicza efektywną siłę karty uwzględniając buffy (róg, więź, morale, pogoda).
 * @param {string} cardNum - numer karty
 * @param {string} rowKey - klucz rzędu np. 'p1R1'
 * @param {object} board - stan planszy
 * @param {object} state - pełny stan gry
 * @returns {number} efektywna siła lub -1 jeśli bohater/specjalna
 */
function calculateEffectivePower(cardNum, rowKey, board, state) {
    const card = cards.find(c => String(c.numer) === String(cardNum));
    if (!card || typeof card.punkty !== 'number') return -1;
    if (card.bohater) return -1; // Bohaterów nie można niszczyć

    const rowCards = board[rowKey] || [];
    const rowNum = parseInt(rowKey.slice(-1)); // 1, 2 lub 3
    const rowSide = rowKey.startsWith('p1') ? 'p1' : 'p2';
    const specialSlot = `${rowSide}S${rowNum}`;
    const specialCardNum = board[specialSlot];

    // Pogoda
    const weatherMap = { 1: 'mroz', 2: 'mgla', 3: 'deszcz' };
    const weatherType = weatherMap[rowNum];
    const weatherActive = (state.board.weather || []).some(wStr => {
        const wNum = wStr.split('-')[1];
        const wCard = cards.find(c => String(c.numer) === String(wNum));
        return wCard && (wCard.moc === weatherType || (wCard.moc === 'sztorm' && (weatherType === 'mgla' || weatherType === 'deszcz')));
    });

    // Róg aktywny?
    let hornActive = false;
    if (specialCardNum) {
        const sCard = cards.find(c => String(c.numer) === String(specialCardNum));
        if (sCard && sCard.moc === 'rog') hornActive = true;
    }
    if (rowCards.some(n => { const c = cards.find(x => String(x.numer) === String(n)); return c && !c.bohater && c.moc === 'rog'; })) {
        hornActive = true;
    }

    // Morale Count
    const moraleCount = rowCards.reduce((acc, n) => {
        const c = cards.find(x => String(x.numer) === String(n));
        return (c && !c.bohater && c.moc === 'morale') ? acc + 1 : acc;
    }, 0);

    // Więź Count (ile kart o tym samym numerze)
    const wiezCount = rowCards.filter(n => String(n) === String(cardNum)).length;

    let pts = weatherActive ? 1 : card.punkty;

    // Więź: mnożnik bazowy razy ilość
    if (card.moc === 'wiez') pts *= wiezCount;

    // Morale
    const mBuff = (card.moc === 'morale') ? (moraleCount - 1) : moraleCount;
    if (mBuff > 0) pts += mBuff;

    // Róg
    if (hornActive) pts *= 2;

    return pts;
}

function registerClassicGwentEvents(socket, io, games) {
    socket.on('save-full-deck', (data) => {
        const { gameCode, isPlayer1, deck, factionId, leader } = data;
        if (games[gameCode]) {
            const game = games[gameCode];
            if (isPlayer1) {
                game.player1FullDeck = deck;
                game.player1Faction = factionId;
                game.player1Leader = leader;
            } else {
                game.player2FullDeck = deck;
                game.player2Faction = factionId;
                game.player2Leader = leader;
            }
            console.log(`[GAME CLASSIC] Full deck (${deck.length} cards), faction (${factionId}), and leader (${leader}) saved for ${isPlayer1 ? game.player1Nickname : game.player2Nickname} in ${gameCode}`);
        }
    });

    socket.on('force-start-game', (data) => {
        const { gameCode } = data;
        console.log(`[GAME CLASSIC] Forcing game start for ${gameCode}`);
        if (games[gameCode]) {
            const game = games[gameCode];

            // Guard: jeśli gra już została zainicjalizowana, nie rób tego ponownie
            if (game.gameState && (game.status === 'playing' || game.status === 'scoia-decision')) {
                console.log(`[GAME CLASSIC] Game ${gameCode} already initialized (status: ${game.status}), skipping.`);
                return;
            }

            // 1. Inicjalizacja pustego stanu gry (jeśli nie istnieje)
            if (!game.gameState) {
                game.gameState = {
                    p1Hand: [], p1Deck: [], p1Graveyard: [], p1MulliganRejects: [], 
                    p1Faction: game.player1Faction,
                    p2Hand: [], p2Deck: [], p2Graveyard: [], p2MulliganRejects: [], 
                    p2Faction: game.player2Faction,
                    p1Lives: 2, p2Lives: 2,
                    p1Passed: false, p2Passed: false,
                    currentTurn: null,
                    scoiaDecider: null,
                    startReason: null,
                    board: {
                        p1R1: [], p1R2: [], p1R3: [],
                        p2R1: [], p2R2: [], p2R3: [],
                        p1S1: null, p1S2: null, p1S3: null,
                        p2S1: null, p2S2: null, p2S3: null,
                        weather: []
                    }
                };
            }

            // 2. Kto zaczyna? (Losowanie vs Scoia'tael)
            const p1Scoia = game.player1Faction === "3";
            const p2Scoia = game.player2Faction === "3";

            if (p1Scoia && !p2Scoia) {
                game.status = 'scoia-decision';
                game.gameState.scoiaDecider = game.player1;
            } else if (!p1Scoia && p2Scoia) {
                game.status = 'scoia-decision';
                game.gameState.scoiaDecider = game.player2;
            } else {
                // Losowo
                game.status = 'playing';
                game.gameState.startReason = 'random';
                game.gameState.currentTurn = Math.random() < 0.5 ? game.player1 : game.player2;
            }

            // 3. Zainicjuj talie (pełne) - losowanie nastąpi później na żądanie klienta
            if (game.player1FullDeck && game.player2FullDeck) {
                game.gameState.p1Hand = [];
                game.gameState.p1Deck = [...game.player1FullDeck];
                game.gameState.p2Hand = [];
                game.gameState.p2Deck = [...game.player2FullDeck];
                console.log(`[GAME CLASSIC] State initialized with full decks for ${gameCode}. Waiting for draw request.`);
            }

            io.to(gameCode).emit('start-game-now');
        }
    });

    socket.on('request-initial-draw', (data) => {
        const { gameCode, isPlayer1 } = data;
        const game = games[gameCode];
        if (game && game.gameState) {
            const state = game.gameState;
            const hand = isPlayer1 ? state.p1Hand : state.p2Hand;
            const deck = isPlayer1 ? state.p1Deck : state.p2Deck;

            // Jeśli już rozdano karty, wyślij te co są
            if (hand.length > 0) {
                socket.emit('initial-cards-dealt', { hand });
                return;
            }

            // Losujemy 10 kart
            const drawCount = 10;
            let drawn = [];
            for (let i = 0; i < drawCount && deck.length > 0; i++) {
                const randIdx = Math.floor(Math.random() * deck.length);
                drawn.push(deck.splice(randIdx, 1)[0]);
            }

            if (isPlayer1) {
                state.p1Hand = drawn;
                sortHandForPlayer(state.p1Hand);
            } else {
                state.p2Hand = drawn;
                sortHandForPlayer(state.p2Hand);
            }

            const handToReturn = isPlayer1 ? state.p1Hand : state.p2Hand;
            console.log(`[GAME CLASSIC] Initial cards drawn and sorted for ${isPlayer1 ? 'P1' : 'P2'} in ${gameCode}: ${handToReturn.length} cards.`);
            socket.emit('initial-cards-dealt', { hand: handToReturn });

            // Notify opponent about updated deck count
            const opponentId = isPlayer1 ? game.player2 : game.player1;
            if (opponentId) {
                io.to(opponentId).emit('opponent-game-update', {
                    deckCount: deck.length
                });
            }
        }
    });

    socket.on('scoia-decision-made', (data) => {
        const { gameCode, startFirst } = data;
        const game = games[gameCode];
        if (game && game.status === 'scoia-decision') {
            game.status = 'playing';
            game.gameState.startReason = 'scoia';
            
            // socket.id to gracz który decyduje
            if (startFirst) {
                game.gameState.currentTurn = socket.id;
            } else {
                game.gameState.currentTurn = (socket.id === game.player1) ? game.player2 : game.player1;
            }
            
            io.to(gameCode).emit('start-phase-resolved');
        }
    });

    socket.on('save-game-state', (data) => {
        const { gameCode, isPlayer1, gameState } = data;
        if (games[gameCode]) {
            if (!games[gameCode].gameState) games[gameCode].gameState = {};
            const state = games[gameCode].gameState;

            if (isPlayer1) {
                if (gameState.hand) state.p1Hand = gameState.hand;
                if (gameState.deck) state.p1Deck = gameState.deck;
                if (gameState.graveyard) state.p1Graveyard = gameState.graveyard;
                if (gameState.faction) state.p1Faction = gameState.faction;
            } else {
                if (gameState.hand) state.p2Hand = gameState.hand;
                if (gameState.deck) state.p2Deck = gameState.deck;
                if (gameState.graveyard) state.p2Graveyard = gameState.graveyard;
                if (gameState.faction) state.p2Faction = gameState.faction;
            }
            console.log(`[GAME CLASSIC] State saved for ${isPlayer1 ? 'P1' : 'P2'} in ${gameCode}`);
            const targetId = isPlayer1 ? games[gameCode].player2 : games[gameCode].player1;
            if (targetId) {
                io.to(targetId).emit('opponent-game-update', {
                    handCount: gameState.hand ? gameState.hand.length : undefined,
                    deckCount: gameState.deck ? gameState.deck.length : undefined,
                    graveyard: isPlayer1 ? state.p1Graveyard : state.p2Graveyard,
                    faction: gameState.faction
                });
            }
        }
    });

    socket.on('get-game-state', (data) => {
        const { gameCode, isPlayer1 } = data;
        if (games[gameCode] && games[gameCode].gameState) {
            const game = games[gameCode];
            const state = game.gameState;

            // Sync socket IDs on reconnect
            const oldId = isPlayer1 ? game.player1 : game.player2;
            if (isPlayer1) game.player1 = socket.id;
            else game.player2 = socket.id;

            if (state.currentTurn === oldId) {
                state.currentTurn = socket.id;
            }

            socket.join(gameCode);

            socket.emit('init-game-state', {
                hand: isPlayer1 ? state.p1Hand : state.p2Hand,
                deck: isPlayer1 ? state.p1Deck : state.p2Deck,
                graveyard: isPlayer1 ? state.p1Graveyard : state.p2Graveyard,
                faction: isPlayer1 ? state.p1Faction : state.p2Faction,
                nickname: isPlayer1 ? game.player1Nickname : game.player2Nickname,
                opponentNickname: isPlayer1 ? game.player2Nickname : game.player1Nickname,
                leader: isPlayer1 ? game.player1Leader : game.player2Leader,
                opponentLeader: isPlayer1 ? game.player2Leader : game.player1Leader,
                swapsPerformed: isPlayer1 ? (game.p1Swaps || 0) : (game.p2Swaps || 0),
                opponentHandCount: isPlayer1 ? (state.p2Hand ? state.p2Hand.length : 0) : (state.p1Hand ? state.p1Hand.length : 0),
                opponentDeckCount: isPlayer1 ? (state.p2Deck ? state.p2Deck.length : 0) : (state.p1Deck ? state.p1Deck.length : 0),
                opponentGraveyard: isPlayer1 ? state.p2Graveyard : state.p1Graveyard,
                opponentFaction: isPlayer1 ? state.p2Faction : state.p1Faction,
                status: game.status,
                currentTurn: state.currentTurn,
                scoiaDecider: state.scoiaDecider,
                startReason: state.startReason,
                board: state.board
            });

            console.log(`[GAME CLASSIC] [${gameCode}] ID Sync: ${isPlayer1 ? 'P1' : 'P2'} reconn as ${socket.id}. Turn: ${state.currentTurn}`);
        }
    });

    socket.on('mulligan-swap', (data) => {
        const { gameCode, isPlayer1, cardIndex } = data;
        if (games[gameCode]) {
            const game = games[gameCode];
            const state = game.gameState;
            if (!state) return;

            const playerSwapsKey = isPlayer1 ? 'p1Swaps' : 'p2Swaps';
            if (!game[playerSwapsKey]) game[playerSwapsKey] = 0;

            if (game[playerSwapsKey] < 2) {
                const hand = isPlayer1 ? state.p1Hand : state.p2Hand;
                const deck = isPlayer1 ? state.p1Deck : state.p2Deck;

                if (hand && deck && deck.length > 0) {
                    const oldCard = hand[cardIndex];
                    const randIdx = Math.floor(Math.random() * deck.length);
                    const newCard = deck.splice(randIdx, 1)[0];

                    hand[cardIndex] = newCard;

                    // Buffer rejected cards instead of immediate reshuffle
                    const rejectsKey = isPlayer1 ? 'p1MulliganRejects' : 'p2MulliganRejects';
                    game.gameState[rejectsKey].push(oldCard);

                    game[playerSwapsKey]++;
                    const playerNick = isPlayer1 ? game.player1Nickname : game.player2Nickname;
                    console.log(`[GAME CLASSIC] ${playerNick} swapped ${oldCard} for ${newCard} in ${gameCode}. Swaps: ${game[playerSwapsKey]}/2`);

                    socket.emit('mulligan-swap-success', {
                        newCard,
                        swapsLeft: 2 - game[playerSwapsKey],
                        cardIndex
                    });

                    // Update opponent on counts
                    const targetId = isPlayer1 ? game.player2 : game.player1;
                    if (targetId) {
                        io.to(targetId).emit('opponent-game-update', {
                            handCount: hand.length,
                            deckCount: deck.length
                        });
                    }
                }
            }
        }
    });

    socket.on('end-mulligan', (data) => {
        const { gameCode, isPlayer1 } = data;
        if (games[gameCode] && games[gameCode].gameState) {
            const game = games[gameCode];
            const state = game.gameState;
            
            // Mark player as finished
            if (isPlayer1) game.p1MulliganDone = true;
            else game.p2MulliganDone = true;

            const rejectsKey = isPlayer1 ? 'p1MulliganRejects' : 'p2MulliganRejects';
            const deckKey = isPlayer1 ? 'p1Deck' : 'p2Deck';

            if (state[rejectsKey].length > 0) {
                console.log(`[GAME CLASSIC] Returning ${state[rejectsKey].length} rejects to ${isPlayer1 ? 'P1' : 'P2'} deck and shuffling.`);
                state[deckKey] = [...state[deckKey], ...state[rejectsKey]];
                state[rejectsKey] = [];
                for (let i = state[deckKey].length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [state[deckKey][i], state[deckKey][j]] = [state[deckKey][j], state[deckKey][i]];
                }
            }

            socket.emit('update-deck', { deck: state[deckKey] });

            const opponentId = isPlayer1 ? game.player2 : game.player1;
            const oppMulliganDone = isPlayer1 ? game.p2MulliganDone : game.p1MulliganDone;

            if (!oppMulliganDone && opponentId) {
                // Opponent is still mulliganing. Start 60s timer if not started.
                if (!game.mulliganTimer) {
                    game.mulliganTimeLeft = 60;
                    game.mulliganTimer = setInterval(() => {
                        game.mulliganTimeLeft--;
                        if (game.mulliganTimeLeft <= 0) {
                            clearInterval(game.mulliganTimer);
                            // Force end
                            io.to(gameCode).emit('mulligan-timer-expired');
                        }
                    }, 1000);
                    // Notify opponent they have 60s
                    io.to(opponentId).emit('start-mulligan-timer', { timeLeft: 60 });
                    // Notify finisher to wait
                    socket.emit('wait-for-mulligan', { timeLeft: 60 });
                }
            } else if (oppMulliganDone) {
                // Both done! Clear timer and start game
                if (game.mulliganTimer) {
                    clearInterval(game.mulliganTimer);
                    game.mulliganTimer = null;
                }
                io.to(gameCode).emit('mulligan-finished-all');
            }

            if (opponentId) {
                io.to(opponentId).emit('opponent-game-update', {
                    deckCount: state[deckKey].length
                });
            }
        }
    });

    socket.on('get-turn-info', (data) => {
        const { gameCode } = data;
        const game = games[gameCode];
        if (game && game.gameState) {
            const myTurn = game.gameState.currentTurn === socket.id;
            socket.emit('turn-info', { myTurn });
        }
    });

    socket.on('play-card', (data) => {
        const { gameCode, isPlayer1, cardNumer, pozycja, isSpecial } = data;
        const game = games[gameCode];
        if (game && game.gameState) {
            const state = game.gameState;
            let musteredCount = 0;
            let scorchDestroyed = [];
            let spyDrawn = [];
            let grzybkiApplied = null; // null = nie dotyczy, true = aktywowany, false = pusty
            let musteredDetails = []; // [{numer, source}]

            if (state.currentTurn !== socket.id) {
                console.log(`[GAME CLASSIC] Blocked play: Not ${socket.id}'s turn.`);
                return;
            }
            if (state.medicPending) {
                console.log(`[GAME CLASSIC] Blocked play: Medic resurrection pending.`);
                return;
            }

            const hand = isPlayer1 ? state.p1Hand : state.p2Hand;
            const cardIdx = hand.findIndex(c => {
                const itemNumer = (typeof c === 'object' ? c.numer : c);
                return String(itemNumer) === String(cardNumer);
            });
            
            if (cardIdx !== -1) {
                const side = isPlayer1 ? 'p1' : 'p2';
                let targetRow;

                // Handle position carefully, especially for Agile (4)
                let finalPos = pozycja;
                if (!isSpecial && finalPos === 4) {
                    finalPos = 1; // Default to Melee if not specified otherwise
                }

                const cardObj = cards.find(c => String(c.numer) === String(cardNumer));
                if (!cardObj) return;

                const isSpy = cardObj.moc === 'szpieg';
                const targetSide = isSpy ? (isPlayer1 ? 'p2' : 'p1') : side;
                const isWeather = ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(cardObj.moc);

                if (isWeather) {
                    if (!state.board.weather) state.board.weather = [];
                    // Trzymamy z side, aby wiedzieć czyj cmentarz
                    state.board.weather.push(`${side}-${cardNumer}`);
                    hand.splice(cardIdx, 1);

                    targetRow = 'weather';

                    if (cardObj.moc === 'niebo') {
                        setTimeout(() => {
                            const gInfo = games[gameCode];
                            if (gInfo && gInfo.gameState && gInfo.gameState.board.weather) {
                                const gs = gInfo.gameState;
                                gs.board.weather.forEach(wStr => {
                                    const parts = wStr.split('-');
                                    const wOwner = parts[0];
                                    const wNum = parts[1];
                                    if (wOwner === 'p1') gs.p1Graveyard.push(wNum);
                                    else gs.p2Graveyard.push(wNum);
                                });
                                gs.board.weather = [];
                                
                                io.to(gameCode).emit('board-updated', { // Re-sync po wyczyszczeniu
                                    board: gs.board,
                                    currentTurn: gs.currentTurn,
                                    p1HandCount: gs.p1Hand.length,
                                    p2HandCount: gs.p2Hand.length,
                                    p1Lives: gs.p1Lives,
                                    p2Lives: gs.p2Lives,
                                    p1Passed: gs.p1Passed,
                                    p2Passed: gs.p2Passed,
                                    p1Graveyard: gs.p1Graveyard,
                                    p2Graveyard: gs.p2Graveyard,
                                });
                            }
                        }, 1500);
                    }
                } else if (cardObj.moc === 'porz') {
                    // Porzoga ogólna: specjalna karta która NIE zostaje na planszy
                    // Trafia od razu do cmentarza po zagraniu (animacja z player preview -> cmentarz)
                    targetRow = 'graveyard_direct'; // nie trafia do żadnego rzędu planszy
                    if (isPlayer1) state.p1Graveyard.push(cardNumer);
                    else state.p2Graveyard.push(cardNumer);
                    hand.splice(cardIdx, 1);
                    console.log(`[GAME CLASSIC] Porzoga (${cardNumer}) played and sent directly to graveyard.`);
                } else if (isSpecial) {
                    targetRow = `${targetSide}S${finalPos}`;
                    
                    // Manekin (Decoy) logic - Swapping card from board back to hand
                    if (cardObj.moc === 'manek' && data.targetCardNumer && data.targetRow) {
                        const tRow = data.targetRow;
                        const tNum = data.targetCardNumer;
                        const rowArray = state.board[tRow];
                        if (rowArray) {
                            const idx = rowArray.indexOf(tNum);
                            if (idx !== -1) {
                                // Podmień kartę na planszy na 001 (Manekin)
                                rowArray.splice(idx, 1, "001");
                                // Dodaj zabraną jednostkę do ręki
                                hand.push(tNum);
                                console.log(`[GAME CLASSIC] Decoy swapped ${tNum} from ${tRow} for 001. ${tNum} back to hand.`);
                            }
                        }
                    } else {
                        // Inne karty specjalne (róg, iporz) zostają w slocie S
                        state.board[targetRow] = cardNumer;

                        // Grzybki (Mardroeme) logic
                        if (cardObj.moc === 'grzybki') {
                            const rowToCheck = `${targetSide}R${finalPos}`;
                            const rArray = state.board[rowToCheck] || [];
                            const hasBerserk = rArray.some(cNum => {
                                const c = cards.find(x => String(x.numer) === String(cNum));
                                return c && c.moc === 'berserk';
                            });
                            grzybkiApplied = hasBerserk;
                        }
                    }
                    hand.splice(cardIdx, 1);
                } else {
                    targetRow = `${targetSide}R${finalPos}`;
                    if (state.board[targetRow]) {
                        state.board[targetRow].push(cardNumer);
                    } else {
                        console.error(`[GAME CLASSIC] Target row ${targetRow} does not exist in board state!`);
                        state.board[`${targetSide}R1`].push(cardNumer);
                    }
                    hand.splice(cardIdx, 1);
                    
                    // Wezwanie (Muster) logic
                    if (cardObj.moc === 'wezwanie' && cardObj.summon) {
                        const summonIds = cardObj.summon.split(',').map(s => s.trim());
                        const deck = isPlayer1 ? state.p1Deck : state.p2Deck;
                        
                        // Z ręki
                        for (let i = hand.length - 1; i >= 0; i--) {
                            const cNum = typeof hand[i] === 'object' ? hand[i].numer : hand[i];
                            if (summonIds.includes(String(cNum))) {
                                state.board[targetRow].push(cNum);
                                hand.splice(i, 1);
                                musteredCount++;
                                musteredDetails.push({ numer: String(cNum), source: 'hand' });
                            }
                        }
                        // Z talii
                        for (let i = deck.length - 1; i >= 0; i--) {
                            const cNum = typeof deck[i] === 'object' ? deck[i].numer : deck[i];
                            if (summonIds.includes(String(cNum))) {
                                state.board[targetRow].push(cNum);
                                deck.splice(i, 1);
                                musteredCount++;
                                musteredDetails.push({ numer: String(cNum), source: 'deck' });
                            }
                        }
                    }
                    // Berserk played into Grzybki check
                    if (cardObj.moc === 'berserk') {
                        const sSlot = `${targetSide}S${finalPos}`;
                        const sCardNum = state.board[sSlot];
                        const sCard = sCardNum ? cards.find(x => String(x.numer) === String(sCardNum)) : null;
                        if (sCard && sCard.moc === 'grzybki') {
                            grzybkiApplied = true;
                        }
                    }
                    // Medic logic (Medyk)
                    if (cardObj.moc === 'medyk') {
                        const grave = isPlayer1 ? state.p1Graveyard : state.p2Graveyard;
                        const reviveable = grave.filter(gNum => {
                            const c = cards.find(x => String(x.numer) === String(gNum));
                            return c && !c.bohater && !['mroz','mgla','deszcz','sztorm','niebo'].includes(c.moc) && c.typ !== 'specjalna' && c.moc !== 'rog';
                        });
                        
                        if (reviveable.length > 0) {
                            state.medicPending = true;
                            socket.emit('medic-revive-prompt', { graveyard: reviveable });
                            console.log(`[GAME CLASSIC] Medic played, waiting for ${socket.id} to pick from ${reviveable.length} cards.`);
                        }
                    }
                }

                // Scorch logic (Pożoga ogólna i rzędowa) - Oblicza EFEKTYWNE punkty (z bufami)
                if (cardObj.moc === 'porz' || cardObj.moc === 'iporz') {
                    let rowsToCheck = [];
                    if (cardObj.moc === 'porz') {
                        // Porzoga ogólna: wszystkie rzędy obu graczy
                        rowsToCheck = ['p1R1', 'p1R2', 'p1R3', 'p2R1', 'p2R2', 'p2R3'];
                    } else if (cardObj.moc === 'iporz') {
                        // iporz: rząd przeciwnika na tej samej pozycji co zagrana karta
                        // targetSide to własna strona gracza, więc opp to odwrotność
                        const mySide = isPlayer1 ? 'p1' : 'p2';
                        const oppSideKey = isPlayer1 ? 'p2' : 'p1';
                        const oppRow = `${oppSideKey}R${finalPos}`;
                        if (state.board[oppRow]) {
                            rowsToCheck = [oppRow];
                        }
                    }

                    // Oblicz efektywną siłę dla każdej karty (uwzględniając buffy)
                    let maxVal = -1;
                    let targets = []; // Array of { row, index, num, effectivePts }

                    rowsToCheck.forEach(rKey => {
                        const rArray = state.board[rKey] || [];
                        rArray.forEach((cNum, idx) => {
                            const c = cards.find(x => String(x.numer) === String(cNum));
                            if (!c || c.bohater || typeof c.punkty !== 'number') return; // Pomijamy bohaterów
                            const effPts = calculateEffectivePower(cNum, rKey, state.board, state);
                            if (effPts < 0) return; // bohater lub specjalna -> skip
                            if (effPts > maxVal) {
                                maxVal = effPts;
                                targets = [{ row: rKey, index: idx, num: cNum, effectivePts: effPts }];
                            } else if (effPts === maxVal) {
                                targets.push({ row: rKey, index: idx, num: cNum, effectivePts: effPts });
                            }
                        });
                    });

                    // Jeśli iporz: sumę rzdędu efektywną musi lić >= 10
                    let proceedScorch = true;
                    if (cardObj.moc === 'iporz' && rowsToCheck.length === 1) {
                        let rowSum = 0;
                        (state.board[rowsToCheck[0]] || []).forEach(n => {
                            const effPts = calculateEffectivePower(n, rowsToCheck[0], state.board, state);
                            if (effPts >= 0) rowSum += effPts;
                        });
                        if (rowSum < 10) {
                            proceedScorch = false;
                            console.log(`[GAME CLASSIC] iporz: opp row sum ${rowSum} < 10, no scorch.`);
                        }
                    }

                    if (proceedScorch && maxVal >= 0) {
                        // Unikalne i od tyłu by indeksy się nie psuły podczas usuwania
                        targets.sort((a,b) => b.index - a.index).forEach(t => {
                            state.board[t.row].splice(t.index, 1);
                            if (t.row.startsWith('p1')) state.p1Graveyard.push(t.num);
                            else state.p2Graveyard.push(t.num);
                            scorchDestroyed.push(t.num);
                        });
                        console.log(`[GAME CLASSIC] Scorch destroyed ${targets.length} cards with effective power ${maxVal}`);
                    }
                }

                
                if (isSpy) {
                    const deck = isPlayer1 ? state.p1Deck : state.p2Deck;
                    for (let i = 0; i < 2 && deck.length > 0; i++) {
                        const randIdx = Math.floor(Math.random() * deck.length);
                        spyDrawn.push(deck.splice(randIdx, 1)[0]);
                    }
                    hand.push(...spyDrawn);
                    console.log(`[GAME CLASSIC] Spy played! ${isPlayer1 ? 'P1' : 'P2'} draws ${spyDrawn.length} cards.`);
                }
                
                // Sprawdź czy przeciwnik spasował. Jeśli tak, tura wraca do zagrywającego
                const oppSide = isPlayer1 ? 'p2' : 'p1';
                
                if (!state.medicPending) {
                    if (state[oppSide + 'Passed']) {
                        // Tura zostaje u obecnego gracza
                        console.log(`[GAME CLASSIC] [${gameCode}] ${oppSide} has passed, so turn stays with ${isPlayer1 ? 'P1' : 'P2'}`);
                    } else {
                        // Normalna zmiana tury
                        const nextPlayer = isPlayer1 ? game.player2 : game.player1;
                        state.currentTurn = nextPlayer;
                    }
                }
                
                console.log(`[GAME CLASSIC] [${gameCode}] ${isPlayer1 ? 'P1' : 'P2'} played ${cardNumer} at ${targetRow}. Next turn: ${state.currentTurn}`);

                // Synchronize all clients
                io.to(gameCode).emit('board-updated', {
                    board: state.board,
                    currentTurn: state.currentTurn,
                    p1HandCount: state.p1Hand.length,
                    p2HandCount: state.p2Hand.length,
                    // Zawsze wysyłaj pełną rękę dla synchronizacji
                    p1Hand: state.p1Hand,
                    p2Hand: state.p2Hand,
                    p1Lives: state.p1Lives,
                    p2Lives: state.p2Lives,
                    p2Passed: state.p2Passed,
                    p1Graveyard: state.p1Graveyard,
                    p2Graveyard: state.p2Graveyard,
                    musteredCount: musteredCount || 0,
                    musteredDetails: musteredDetails,
                    spyDrawn: spyDrawn,
                    spyPlayer: isPlayer1 ? 'p1' : 'p2',
                    grzybkiApplied: grzybkiApplied,
                    scorchDestroyed: scorchDestroyed || [],
                    lastPlayedCard: cardNumer,
                    lastPlayedBy: isPlayer1 ? 'p1' : 'p2',
                    porzogaDestroyed: scorchDestroyed || []
                });

                // Also emit to opponent explicitly if needed (though io.to(gameCode) covers it)
                const targetId = isPlayer1 ? game.player2 : game.player1;
                if (targetId) {
                    io.to(targetId).emit('opponent-game-update', {
                        handCount: hand.length,
                        board: state.board,
                        graveyard: isPlayer1 ? state.p1Graveyard : state.p2Graveyard
                    });
                }
            } else {
                const playerSide = isPlayer1 ? 'P1' : 'P2';
                console.warn(`[GAME CLASSIC] Card ${cardNumer} not found in hand for ${playerSide}. Hand has: ${JSON.stringify(hand)}`);
                socket.emit('play-error', { error: 'Card not in hand' });
            }
        }
    });

    socket.on('play-medic-resurrection', (data) => {
        const { gameCode, isPlayer1, cardNumer, targetRow } = data;
        const game = games[gameCode];
        if (game && game.gameState && game.gameState.medicPending) {
            const state = game.gameState;
            const myTurn = state.currentTurn === socket.id;
            if (!myTurn) return;

            const grave = isPlayer1 ? state.p1Graveyard : state.p2Graveyard;
            const cardIdx = grave.indexOf(cardNumer);
            if (cardIdx !== -1) {
                // Remove from grave
                grave.splice(cardIdx, 1);
                let finalRow = targetRow || `${isPlayer1 ? 'p1' : 'p2'}R1`; 
                
                const revivedCardObj = cards.find(c => String(c.numer) === String(cardNumer));
                let spyDrawn = [];
                let spyPlayer = null;

                if (revivedCardObj && revivedCardObj.moc === 'szpieg') {
                    // Zmiana strony z p1 na p2 (lub na odwrót)
                    finalRow = finalRow.startsWith('p1') ? finalRow.replace('p1', 'p2') : finalRow.replace('p2', 'p1');
                    
                    const deck = isPlayer1 ? state.p1Deck : state.p2Deck;
                    const hand = isPlayer1 ? state.p1Hand : state.p2Hand;
                    
                    for (let i = 0; i < 2 && deck.length > 0; i++) {
                        const randIdx = Math.floor(Math.random() * deck.length);
                        spyDrawn.push(deck.splice(randIdx, 1)[0]);
                    }
                    hand.push(...spyDrawn);
                    spyPlayer = isPlayer1 ? 'p1' : 'p2';
                    console.log(`[GAME CLASSIC] Medic revived Spy! ${spyPlayer} draws ${spyDrawn.length} cards.`);
                }

                if (state.board[finalRow]) {
                    state.board[finalRow].push(cardNumer);
                }

                state.medicPending = false;

                // Sprawdź spasowanie przeciwnika i zmień turę
                const oppSide = isPlayer1 ? 'p2' : 'p1';
                if (!state[oppSide + 'Passed']) {
                    const nextPlayer = isPlayer1 ? game.player2 : game.player1;
                    state.currentTurn = nextPlayer;
                }

                io.to(gameCode).emit('board-updated', {
                    board: state.board,
                    currentTurn: state.currentTurn,
                    p1HandCount: state.p1Hand.length,
                    p2HandCount: state.p2Hand.length,
                    p1Lives: state.p1Lives,
                    p2Lives: state.p2Lives,
                    p1Passed: state.p1Passed,
                    p2Passed: state.p2Passed,
                    p1Graveyard: state.p1Graveyard,
                    p2Graveyard: state.p2Graveyard,
                    spyDrawn: spyDrawn,
                    spyPlayer: spyPlayer,
                    p1Hand: state.p1Hand,
                    p2Hand: state.p2Hand
                });
            }
        }
    });

    socket.on('medic-cancel', (data) => {
        const { gameCode, isPlayer1 } = data;
        const game = games[gameCode];
        if (game && game.gameState && game.gameState.medicPending) {
            const state = game.gameState;
            if (state.currentTurn !== socket.id) return;

            state.medicPending = false;
            console.log(`[GAME CLASSIC] Medic cancelled by ${socket.id}. Switching turn.`);

            // Zmień turę jeśli przeciwnik nie spasował
            const oppSide = isPlayer1 ? 'p2' : 'p1';
            if (!state[oppSide + 'Passed']) {
                const nextPlayer = isPlayer1 ? game.player2 : game.player1;
                state.currentTurn = nextPlayer;
            }

            io.to(gameCode).emit('board-updated', {
                board: state.board,
                currentTurn: state.currentTurn,
                p1HandCount: state.p1Hand.length,
                p2HandCount: state.p2Hand.length,
                p1Lives: state.p1Lives,
                p2Lives: state.p2Lives,
                p1Passed: state.p1Passed,
                p2Passed: state.p2Passed,
                p1Graveyard: state.p1Graveyard,
                p2Graveyard: state.p2Graveyard,
                p1Hand: state.p1Hand,
                p2Hand: state.p2Hand
            });
        }
    });

    socket.on('pass-turn', (data) => {
        const { gameCode, isPlayer1 } = data;
        const game = games[gameCode];
        if (game && game.gameState) {
            const state = game.gameState;
            const mySide = isPlayer1 ? 'p1' : 'p2';
            if (state[mySide + 'Passed']) return; // Debounce server-side
            
            state[mySide + 'Passed'] = true;

            if (state.p1Passed && state.p2Passed) {
                evaluateRound(gameCode, game, state, io);
            } else {
                console.log(`[GAME CLASSIC] [${gameCode}] ${mySide} PASSED.`);
                io.to(gameCode).emit('player-passed', { isPlayer1 });
                
                state.currentTurn = isPlayer1 ? game.player2 : game.player1;
                io.to(gameCode).emit('board-updated', {
                    board: state.board,
                    currentTurn: state.currentTurn,
                    p1HandCount: state.p1Hand.length,
                    p2HandCount: state.p2Hand.length,
                    p1Hand: state.p1Hand, // Sync hand even on pass
                    p2Hand: state.p2Hand,
                    p1Lives: state.p1Lives,
                    p2Lives: state.p2Lives,
                    p1Passed: state.p1Passed,
                    p2Passed: state.p2Passed,
                    grzybkiApplied: null // Reset for turn
                });
            }
        }
    });

    function evaluateRound(gameCode, game, state, io) {
        const checkWeather = (type) => {
            return state.board.weather && state.board.weather.some(wStr => {
                const wNum = wStr.split('-')[1]; // rozbicie np. "p1-021"
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
                    if (!card.bohater && card.moc === 'rog') hornActive = true;
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

        const p1Score = calculateRowScore(state.board.p1R1, state.board.p1S1, mrozActive) + 
                        calculateRowScore(state.board.p1R2, state.board.p1S2, mglaActive) + 
                        calculateRowScore(state.board.p1R3, state.board.p1S3, deszczActive);
                        
        const p2Score = calculateRowScore(state.board.p2R1, state.board.p2S1, mrozActive) + 
                        calculateRowScore(state.board.p2R2, state.board.p2S2, mglaActive) + 
                        calculateRowScore(state.board.p2R3, state.board.p2S3, deszczActive);
        
        let roundResult = 'draw';
        if (p1Score > p2Score) {
            roundResult = 'p1';
            state.p2Lives -= 1;
        } else if (p2Score > p1Score) {
            roundResult = 'p2';
            state.p1Lives -= 1;
        } else {
            state.p1Lives -= 1;
            state.p2Lives -= 1;
        }
        
        console.log(`[GAME CLASSIC] [${gameCode}] Round ended. P1: ${p1Score}, P2: ${p2Score}. Result: ${roundResult}`);
        io.to(gameCode).emit('round-ended', {
            p1Score, p2Score, roundResult, p1Lives: state.p1Lives, p2Lives: state.p2Lives,
            p1Hand: state.p1Hand, p2Hand: state.p2Hand
        });

        // Let client know cards are about to be cleared (for klikZabranieSound)
        setTimeout(() => {
            io.to(gameCode).emit('board-clearing', { klikZabranie: true });
        }, 3000);
        
        // Timeout to start next round assuming game is not over
        setTimeout(() => {
            if (state.p1Lives <= 0 || state.p2Lives <= 0) {
                let gameResult = 'draw';
                if (state.p1Lives > 0) gameResult = 'p1';
                if (state.p2Lives > 0) gameResult = 'p2';
                io.to(gameCode).emit('game-over', { gameResult });
            } else {
                // Before clearing, scan for wezwarniezza effects (Cow/Kambi)
                let cowTransformed = false;
                const pendingSummons = []; 
                if (state.board) {
                    Object.keys(state.board).forEach(rKey => {
                        const rArray = state.board[rKey];
                        if (Array.isArray(rArray)) {
                            rArray.forEach(cNum => {
                                const c = cards.find(x => String(x.numer) === String(cNum));
                                if (c && c.moc === 'wezwarniezza' && c.summon) {
                                    pendingSummons.push({ side: rKey.startsWith('p1') ? 'p1' : 'p2', num: c.summon, row: rKey });
                                    if (c.numer === '023') cowTransformed = true;
                                }
                            });
                        }
                    });

                    // Before clearing, move board cards to graveyard
                    ['p1R1', 'p1R2', 'p1R3'].forEach(r => state.p1Graveyard.push(...(state.board[r] || [])));
                    if (state.board.p1S1) state.p1Graveyard.push(state.board.p1S1);
                    if (state.board.p1S2) state.p1Graveyard.push(state.board.p1S2);
                    if (state.board.p1S3) state.p1Graveyard.push(state.board.p1S3);

                    ['p2R1', 'p2R2', 'p2R3'].forEach(r => state.p2Graveyard.push(...(state.board[r] || [])));
                    if (state.board.p2S1) state.p2Graveyard.push(state.board.p2S1);
                    if (state.board.p2S2) state.p2Graveyard.push(state.board.p2S2);
                    if (state.board.p2S3) state.p2Graveyard.push(state.board.p2S3);
                }

                state.board = {
                    p1R1:[], p1R2:[], p1R3:[], p2R1:[], p2R2:[], p2R3:[],
                    p1S1:null, p1S2:null, p1S3:null, p2S1:null, p2S2:null, p2S3:null,
                    weather:[]
                };

                // Apply wezwarniezza summons to the fresh board
                pendingSummons.forEach(s => {
                    if (state.board[s.row]) state.board[s.row].push(s.num);
                });
                state.p1Passed = false;
                state.p2Passed = false;
                
                // Loser goes first or random if draw
                if (roundResult === 'p1') state.currentTurn = game.player2;
                else if (roundResult === 'p2') state.currentTurn = game.player1;
                else state.currentTurn = Math.random() < 0.5 ? game.player1 : game.player2;

                // Northern Realms Ability: Draw card on win
                let p1NrDraw = false;
                let p2NrDraw = false;
                if (roundResult === 'p1' && state.p1Faction === '1') {
                    if (state.p1Deck.length > 0) {
                        const card = state.p1Deck.splice(Math.floor(Math.random() * state.p1Deck.length), 1)[0];
                        state.p1Hand.push(card);
                        p1NrDraw = true;
                        console.log(`[GAME CLASSIC] Northern Realms ability: P1 draws a card.`);
                    }
                } else if (roundResult === 'p2' && state.p2Faction === '1') {
                    if (state.p2Deck.length > 0) {
                        const card = state.p2Deck.splice(Math.floor(Math.random() * state.p2Deck.length), 1)[0];
                        state.p2Hand.push(card);
                        p2NrDraw = true;
                        console.log(`[GAME CLASSIC] Northern Realms ability: P2 draws a card.`);
                    }
                }

                io.to(gameCode).emit('next-round-started', {
                    board: state.board,
                    currentTurn: state.currentTurn,
                    p1Graveyard: state.p1Graveyard,
                    p2Graveyard: state.p2Graveyard,
                    p1HandCount: state.p1Hand.length,
                    p2HandCount: state.p2Hand.length,
                    p1Hand: state.p1Hand,
                    p2Hand: state.p2Hand,
                    northernRealmsDraw: { p1: p1NrDraw, p2: p2NrDraw },
                    cowTransformed: cowTransformed
                });
            }
        }, 5000);
    }

    // --- Konsolowe narzędzia deweloperskie (Inicjalizacja raz na serwer) ---
    if (!global.classicTerminalSetup) {
        global.classicTerminalSetup = true;
        process.stdin.on('data', (data) => {
            const input = data.toString().trim();
            const match = input.match(/^addcard\s+\{?(\d+)\}?\s+(\d+)\s+(P1|P2|p1|p2)$/i);
            
            if (match) {
                const cardNum = match[1];
                const count = parseInt(match[2]);
                const playerStr = match[3].toUpperCase();
                
                const cardExists = cards.find(c => String(c.numer) === String(cardNum));
                if (!cardExists) {
                    console.log(`[CLASSIC ADMIN] Error: Card ${cardNum} not found in cards.js`);
                    return;
                }

                // Szukamy wszystkich trwających gier
                let gamesAffected = 0;
                Object.keys(games).forEach(gameCode => {
                    const game = games[gameCode];
                    if (game && game.gameState) {
                        const state = game.gameState;
                        const targetHand = (playerStr === 'P1') ? state.p1Hand : state.p2Hand;
                        
                        if (targetHand) {
                            for(let i=0; i<count; i++) {
                                targetHand.push(cardNum);
                            }
                            sortHandForPlayer(targetHand);
                            gamesAffected++;

                            // Emitujemy aktualizację do graczy w tej grze
                            io.to(gameCode).emit('board-updated', {
                                board: state.board,
                                currentTurn: state.currentTurn,
                                p1HandCount: state.p1Hand.length,
                                p2HandCount: state.p2Hand.length,
                                p1Hand: state.p1Hand,
                                p2Hand: state.p2Hand,
                                p1Lives: state.p1Lives,
                                p2Lives: state.p2Lives,
                                p1Passed: state.p1Passed,
                                p2Passed: state.p2Passed
                            });
                        }
                    }
                });
                console.log(`[CLASSIC ADMIN] Added ${count}x card ${cardNum} to ${playerStr} in ${gamesAffected} game(s).`);
            }
        });
        console.log("[CLASSIC ADMIN] Console command 'addcard {numer} ilosc P1/P2' is ready.");
    }
}

module.exports = { registerClassicGwentEvents };
