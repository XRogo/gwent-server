const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Wczytywanie kart używanych przez backend do zliczania punktów
let cards = [];
try {
    let cardsSource = fs.readFileSync(__dirname + '/public/gwent/cards.js', 'utf8');
    cardsSource = cardsSource.replace('export default cards;', 'return cards;');
    const getCards = new Function(cardsSource);
    cards = getCards();
    console.log(`[SERVER] Loaded ${cards.length} cards from cards.js`);
} catch (e) {
    console.error('[SERVER] Failed to load cards.js', e);
}

const games = {};

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    console.log(`[CONN] Nowy użytkownik połączony: ${socket.id}`);

    socket.on('create-game', () => {
        const gameCode = Math.floor(100000 + Math.random() * 900000).toString();
        games[gameCode] = {
            player1: socket.id,
            player2: null,
            isClosed: false,
            player1Nickname: null,
            player2Nickname: null,
            status: 'lobby', // lobby, naming, selecting, game, gra
            player1Ready: false,
            player2Ready: false,
            gameMode: null,
            gameState: null
        };
        socket.join(gameCode);
        socket.emit('game-created', { gameCode, isPlayer1: true });
        console.log(`[LOBBY] Player 1 utworzył grę ${gameCode}: ${socket.id}`);
    });

    socket.on('join-game', (data) => {
        const { gameCode } = data;

        if (!games[gameCode]) {
            socket.emit('join-error', 'Gra o tym kodzie nie istnieje!');
            return;
        }

        if (games[gameCode].player2 && games[gameCode].player2 !== socket.id && games[gameCode].player1 !== socket.id) {
            socket.emit('join-error', 'Gra jest już pełna!');
            return;
        }

        if (games[gameCode].player1 !== socket.id && games[gameCode].player2 !== socket.id) {
            games[gameCode].player2 = socket.id;
            games[gameCode].isClosed = true;
            console.log(`[LOBBY] Player 2 ${socket.id} dołączył do gry ${gameCode}`);
            io.to(games[gameCode].player1).emit('opponent-joined', { opponentId: socket.id });
        }

        socket.join(gameCode);
        const isPlayer1 = games[gameCode].player1 === socket.id;
        socket.emit('join-success', {
            gameCode,
            isPlayer1,
            player1Id: games[gameCode].player1,
            player2Id: games[gameCode].player2
        });

        broadcastStatus(gameCode);
    });

    socket.on('find-public-game', () => {
        let targetCode = Object.keys(games).find(code => !games[code].isClosed && games[code].players.length === 0);

        if (targetCode) {
            console.log(`[LOBBY] Znaleziono publiczną grę ${targetCode} dla ${socket.id}`);
            socket.emit('public-game-found', { gameCode: targetCode });
        } else {
            const newCode = "PUB" + Math.floor(1000 + Math.random() * 9000);
            games[newCode] = {
                host: socket.id,
                players: [],
                isClosed: false,
                isPublic: true,
                hostNickname: null,
                opponentNickname: null,
                status: 'waiting',
                hostReady: false,
                opponentReady: false
            };
            socket.join(newCode);
            socket.emit('join-success', { gameCode: newCode, isHost: true });
            console.log(`[LOBBY] Utworzono nową publiczną grę ${newCode} przez ${socket.id}`);
        }
    });

    socket.on('find-test-game', () => {
        const testCode = "TEST";
        if (!games[testCode]) {
            // Pierwszy gracz - host (test1)
            games[testCode] = {
                host: socket.id,
                players: [],
                isClosed: false,
                hostNickname: "test1",
                opponentNickname: null,
                status: 'waiting',
                hostReady: true, // Automatycznie gotowi dla testu
                opponentReady: false
            };
            socket.join(testCode);
            socket.emit('test-game-joined', { gameCode: testCode, isHost: true, nickname: "test1" });
            console.log(`[TEST] Gracz ${socket.id} dołączył jako test1`);
        } else if (games[testCode].players.length === 0 && games[testCode].host !== socket.id) {
            // Drugi gracz - opponent (test2)
            games[testCode].players.push(socket.id);
            games[testCode].isClosed = true;
            games[testCode].opponentNickname = "test2";
            games[testCode].opponentReady = true;
            socket.join(testCode);
            socket.emit('test-game-joined', { gameCode: testCode, isHost: false, nickname: "test2" });
            io.to(games[testCode].host).emit('opponent-joined', { opponentId: socket.id });
            console.log(`[TEST] Gracz ${socket.id} dołączył jako test2`);
            broadcastStatus(testCode);
        } else if (games[testCode].host === socket.id || games[testCode].players.includes(socket.id)) {
            // Gracz już jest w tej grze (np. odświeżenie strony głównej)
            const isHost = games[testCode].host === socket.id;
            socket.emit('test-game-joined', {
                gameCode: testCode,
                isHost: isHost,
                nickname: isHost ? "test1" : "test2"
            });
        } else {
            // Pełne
            socket.emit('test-game-error', 'Zajęte - trwa już gra testowa.');
        }
    });

    const broadcastStatus = (gameCode, specificSocket = null) => {
        const game = games[gameCode];
        if (!game) return;

        const p1Socket = io.sockets.sockets.get(game.player1);
        const p2Socket = game.player2 ? io.sockets.sockets.get(game.player2) : null;

        const statusData = {
            player1Id: game.player1,
            player2Id: game.player2,
            player1Connected: !!(p1Socket && p1Socket.connected),
            player2Connected: !!(p2Socket && p2Socket.connected),
            player1Nickname: game.player1Nickname,
            player2Nickname: game.player2Nickname,
            status: game.status
        };

        console.log(`[STATUS] Rozsyłam status dla ${gameCode}. P1: ${statusData.player1Connected}, P2: ${statusData.player2Connected}`);

        if (specificSocket) {
            specificSocket.emit('opponent-status', statusData);
        } else {
            io.to(gameCode).emit('opponent-status', statusData);
        }
    };

    socket.on('rejoin-game', (data) => {
        let { gameCode, isPlayer1, nickname } = data;
        if (games[gameCode]) {
            const game = games[gameCode];

            // Host check
            if (isPlayer1 && game.player1 && game.player1 !== socket.id) {
                const p1Socket = io.sockets.sockets.get(game.player1);
                if (p1Socket && p1Socket.connected) {
                    console.log(`[LOBBY] Forcing ${socket.id} to PLAYER 2 role during rejoin.`);
                    isPlayer1 = false;
                }
            }

            socket.join(gameCode);
            if (isPlayer1) {
                game.player1 = socket.id;
                game.player1Ready = false;
                if (nickname) game.player1Nickname = nickname;
            } else {
                game.player2 = socket.id;
                game.player2Ready = false;
                if (nickname) game.player2Nickname = nickname;
            }
            console.log(`[LOBBY] Użytkownik ${socket.id} powrócił do gry ${gameCode} jako ${isPlayer1 ? 'P1' : 'P2'} (nick: ${nickname || 'brak'})`);
            broadcastStatus(gameCode, socket);

            const oppId = isPlayer1 ? game.player2 : game.player1;
            if (oppId) io.to(oppId).emit('opponent-ready-status', { isReady: false });
        }
    });

    socket.on('set-nickname', (data) => {
        const { gameCode, isPlayer1, nickname } = data;
        if (games[gameCode]) {
            if (isPlayer1) games[gameCode].player1Nickname = nickname;
            else games[gameCode].player2Nickname = nickname;
            console.log(`[LOBBY] Ustawiono nick dla ${isPlayer1 ? 'P1' : 'P2'} w ${gameCode}: ${nickname}`);
            broadcastStatus(gameCode);
        }
    });

    socket.on('player-ready', (data) => {
        const { gameCode, isPlayer1, isReady } = data;
        if (games[gameCode]) {
            const game = games[gameCode];
            if (isPlayer1) game.player1Ready = isReady;
            else game.player2Ready = isReady;

            console.log(`[GAME] ${isPlayer1 ? 'P1' : 'P2'} is ${isReady ? 'READY' : 'NOT READY'} in ${gameCode}`);

            // Clear any existing timer
            if (game.selectionTimer) {
                clearInterval(game.selectionTimer);
                game.selectionTimer = null;
            }

            if (game.player1Ready && game.player2Ready) {
                // Both ready - start immediately
                io.to(gameCode).emit('force-finish-selection');
                console.log(`[GAME] Both ready in ${gameCode}, starting immediately.`);
            } else if (game.player1Ready || game.player2Ready) {
                // One player ready - start 15s timer
                let count = 15;
                game.selectionTimer = setInterval(() => {
                    io.to(gameCode).emit('start-game-countdown', { seconds: count });
                    count--;
                    if (count < 0) {
                        clearInterval(game.selectionTimer);
                        game.selectionTimer = null;
                        io.to(gameCode).emit('force-finish-selection');
                    }
                }, 1000);
                console.log(`[GAME] One player ready in ${gameCode}, started 15s timer.`);
            } else {
                // Neither ready - ensure client timer stops
                io.to(gameCode).emit('start-game-countdown', { seconds: null });
            }

            const targetId = isPlayer1 ? game.player2 : game.player1;
            if (targetId) {
                io.to(targetId).emit('opponent-ready-status', { isReady });
            }
        }
    });

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
            console.log(`[GAME] Full deck (${deck.length} cards), faction (${factionId}), and leader (${leader}) saved for ${isPlayer1 ? game.player1Nickname : game.player2Nickname} in ${gameCode}`);
        }
    });

    socket.on('force-start-game', (data) => {
        const { gameCode } = data;
        console.log(`[GAME] Forcing game start for ${gameCode}`);
        if (games[gameCode]) {
            const game = games[gameCode];

            // Guard: jeśli gra już została zainicjalizowana, nie rób tego ponownie
            if (game.gameState && (game.status === 'playing' || game.status === 'scoia-decision')) {
                console.log(`[GAME] Game ${gameCode} already initialized (status: ${game.status}), skipping.`);
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
                        p2S1: null, p2S2: null, p2S3: null
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
                console.log(`[GAME] State initialized with full decks for ${gameCode}. Waiting for draw request.`);
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

            if (isPlayer1) state.p1Hand = drawn;
            else state.p2Hand = drawn;

            console.log(`[GAME] Initial cards drawn for ${isPlayer1 ? 'P1' : 'P2'} in ${gameCode}: ${drawn.length} cards.`);
            socket.emit('initial-cards-dealt', { hand: drawn });

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
            console.log(`[GAME] State saved for ${isPlayer1 ? 'P1' : 'P2'} in ${gameCode}`);
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

            console.log(`[GAME] [${gameCode}] ID Sync: ${isPlayer1 ? 'P1' : 'P2'} reconn as ${socket.id}. Turn: ${state.currentTurn}`);
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
                    console.log(`[GAME] ${playerNick} swapped ${oldCard} for ${newCard} in ${gameCode}. Swaps: ${game[playerSwapsKey]}/2`);

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
                console.log(`[GAME] Returning ${state[rejectsKey].length} rejects to ${isPlayer1 ? 'P1' : 'P2'} deck and shuffling.`);
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
            if (state.currentTurn !== socket.id) {
                console.log(`[GAME] Blocked play: Not ${socket.id}'s turn.`);
                return;
            }

            const hand = isPlayer1 ? state.p1Hand : state.p2Hand;
            // Use loose comparison (==) or common type to avoid string/number mismatch
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

                if (isSpecial) {
                    targetRow = `${side}S${finalPos}`;
                    state.board[targetRow] = cardNumer;
                } else {
                    targetRow = `${side}R${finalPos}`;
                    if (state.board[targetRow]) {
                        state.board[targetRow].push(cardNumer);
                    } else {
                        console.error(`[GAME] Target row ${targetRow} does not exist in board state!`);
                        // Fallback to row 1
                        state.board[`${side}R1`].push(cardNumer);
                    }
                }

                hand.splice(cardIdx, 1);
                
                // Sprawdź czy przeciwnik spasował. Jeśli tak, tura wraca do zagrywającego
                const oppSide = isPlayer1 ? 'p2' : 'p1';
                if (state[oppSide + 'Passed']) {
                    // Tura zostaje u obecnego gracza
                    console.log(`[GAME] [${gameCode}] ${oppSide} has passed, so turn stays with ${isPlayer1 ? 'P1' : 'P2'}`);
                } else {
                    // Normalna zmiana tury
                    const nextPlayer = isPlayer1 ? game.player2 : game.player1;
                    state.currentTurn = nextPlayer;
                }
                
                console.log(`[GAME] [${gameCode}] ${isPlayer1 ? 'P1' : 'P2'} played ${cardNumer} at ${targetRow}. Next turn: ${state.currentTurn}`);

                // Synchronize all clients
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
                    p2Graveyard: state.p2Graveyard
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
                console.warn(`[GAME] Card ${cardNumer} not found in hand for ${playerSide}. Hand has: ${JSON.stringify(hand)}`);
                // Optional: Notify client to resync
                socket.emit('play-error', { error: 'Card not in hand' });
            }
        }
    });

    socket.on('pass-turn', (data) => {
        const { gameCode, isPlayer1 } = data;
        const game = games[gameCode];
        if (game && game.gameState) {
            const state = game.gameState;
            if (state.currentTurn !== socket.id) return;

            const mySide = isPlayer1 ? 'p1' : 'p2';
            state[mySide + 'Passed'] = true;

            if (state.p1Passed && state.p2Passed) {
                // If both passed, skip the "player-passed" banner and go straight to evaluation
                evaluateRound(gameCode);
            } else {
                console.log(`[GAME] [${gameCode}] ${mySide} PASSED.`);
                io.to(gameCode).emit('player-passed', { isPlayer1 });
                
                state.currentTurn = isPlayer1 ? game.player2 : game.player1;
                io.to(gameCode).emit('board-updated', {
                    board: state.board,
                    currentTurn: state.currentTurn,
                    p1HandCount: state.p1Hand.length,
                    p2HandCount: state.p2Hand.length,
                    p1Lives: state.p1Lives,
                    p2Lives: state.p2Lives,
                    p1Passed: state.p1Passed,
                    p2Passed: state.p2Passed
                });
            }
        }
    });

    function evaluateRound(gameCode) {
        const game = games[gameCode];
        const state = game.gameState;
        
        const sumRow = (rowArray) => {
            let sum = 0;
            if (!rowArray) return sum;
            rowArray.forEach(cardNum => {
                const cardObj = cards.find(c => c.numer === cardNum);
                if (cardObj && typeof cardObj.punkty === 'number') sum += cardObj.punkty;
            });
            return sum;
        };
        
        const p1Score = sumRow(state.board.p1R1) + sumRow(state.board.p1R2) + sumRow(state.board.p1R3);
        const p2Score = sumRow(state.board.p2R1) + sumRow(state.board.p2R2) + sumRow(state.board.p2R3);
        
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
        
        console.log(`[GAME] [${gameCode}] Round ended. P1: ${p1Score}, P2: ${p2Score}. Result: ${roundResult}`);
        io.to(gameCode).emit('round-ended', {
            p1Score, p2Score, roundResult, p1Lives: state.p1Lives, p2Lives: state.p2Lives
        });
        
        // Timeout to start next round assuming game is not over
        setTimeout(() => {
            if (state.p1Lives <= 0 || state.p2Lives <= 0) {
                let gameResult = 'draw';
                if (state.p1Lives > 0) gameResult = 'p1';
                if (state.p2Lives > 0) gameResult = 'p2';
                io.to(gameCode).emit('game-over', { gameResult });
            } else {
                // Before clearing, move board cards to graveyard
                if (state.board) {
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
                    p1R1: [], p1R2: [], p1R3: [],
                    p2R1: [], p2R2: [], p2R3: [],
                    p1S1: null, p1S2: null, p1S3: null,
                    p2S1: null, p2S2: null, p2S3: null
                };
                state.p1Passed = false;
                state.p2Passed = false;
                
                // Loser goes first or random if draw
                if (roundResult === 'p1') state.currentTurn = game.player2; // P1 won, P2 starts
                else if (roundResult === 'p2') state.currentTurn = game.player1; // P2 won, P1 starts
                else state.currentTurn = Math.random() < 0.5 ? game.player1 : game.player2;

                io.to(gameCode).emit('next-round-started', {
                    board: state.board,
                    currentTurn: state.currentTurn,
                    p1Graveyard: state.p1Graveyard,
                    p2Graveyard: state.p2Graveyard
                });
            }
        }, 5000);
    }

    socket.on('send-to-p1', (data) => {
        const { gameCode, message } = data;
        if (games[gameCode] && games[gameCode].player1) {
            io.to(games[gameCode].player1).emit('message-from-p2', { player2Id: socket.id, message });
        }
    });

    socket.on('send-to-p2', (data) => {
        const { player2Id, message } = data;
        io.to(player2Id).emit('message-from-p1', message);
    });

    socket.on('p1Left', () => {
        console.log(`[LOBBY] Player 1 ${socket.id} zamknął lobby.`);
        for (const gameCode in games) {
            if (games[gameCode].player1 === socket.id) {
                if (games[gameCode].player2) {
                    io.to(games[gameCode].player2).emit('opponent-left', 'Host zamknął lobby.');
                }
                delete games[gameCode];
            }
        }
    });

    socket.on('p2Left', (message) => {
        console.log(`[LOBBY] Player 2 ${socket.id} opuścił grę. Wiadomość: ${message}`);
        for (const gameCode in games) {
            if (games[gameCode].player2 === socket.id) {
                games[gameCode].player2 = null;
                games[gameCode].isClosed = false;
                io.to(games[gameCode].player1).emit('opponentLeft', message);
                broadcastStatus(gameCode);
            }
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`[CONN] Użytkownik rozłączony: ${socket.id}, powód: ${reason}`);
        for (const gameCode in games) {
            const game = games[gameCode];
            if (game.player1 === socket.id) {
                console.log(`[LOBBY] P1 rozłączony w grze ${gameCode}. Czekam na powrót.`);
                broadcastStatus(gameCode);

                setTimeout(() => {
                    if (games[gameCode] && games[gameCode].player1 === socket.id && !io.sockets.sockets.get(socket.id)) {
                        console.log(`[LOBBY] Gra ${gameCode} usunięta z powodu długiego rozłączenia P1.`);
                        if (game.player2) {
                            io.to(game.player2).emit('opponent-left', 'Host opuścił grę na stałe.');
                        }
                        delete games[gameCode];
                    }
                }, 30000);
            } else if (game.player2 === socket.id) {
                console.log(`[LOBBY] P2 rozłączony w grze ${gameCode}.`);
                broadcastStatus(gameCode);
            }
        }
    });
});

// --- SERVER CONSOLE COMMANDS ---
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    const input = data.trim().toLowerCase();
    if (input === 'rt') {
        console.log('[SYSTEM] Restarting TEST game because of console command.');
        if (games['TEST']) {
            io.to('TEST').emit('opponent-left', 'Lobby zostało zrestartowane przez system.');
            delete games['TEST'];
        }
    }
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Serwer działa na http://0.0.0.0:3000');
});