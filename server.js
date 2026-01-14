const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

            // Selection timer logic
            if ((game.player1Ready && !game.player2Ready) || (!game.player1Ready && game.player2Ready)) {
                if (!game.selectionTimer) {
                    game.selectionTimerValue = 60;
                    game.selectionTimer = setInterval(() => {
                        game.selectionTimerValue--;
                        io.to(gameCode).emit('selection-timer-update', { timeLeft: game.selectionTimerValue });

                        if (game.selectionTimerValue <= 0) {
                            clearInterval(game.selectionTimer);
                            game.selectionTimer = null;
                            console.log(`[GAME] Selection timer expired for ${gameCode}. Forcing start.`);
                            io.to(gameCode).emit('force-finish-selection');
                        }
                    }, 1000);
                    console.log(`[GAME] Started selection timer for ${gameCode}`);
                }
            } else if (!game.player1Ready && !game.player2Ready) {
                if (game.selectionTimer) {
                    clearInterval(game.selectionTimer);
                    game.selectionTimer = null;
                    console.log(`[GAME] Stopped selection timer for ${gameCode} (both not ready)`);
                    io.to(gameCode).emit('selection-timer-stopped');
                }
            } else if (game.player1Ready && game.player2Ready) {
                if (game.selectionTimer) {
                    clearInterval(game.selectionTimer);
                    game.selectionTimer = null;
                    console.log(`[GAME] Stopped selection timer for ${gameCode} (both ready)`);
                }
            }

            const targetId = isPlayer1 ? game.player2 : game.player1;
            if (targetId) {
                io.to(targetId).emit('opponent-ready-status', { isReady });
            }
        }
    });

    socket.on('save-full-deck', (data) => {
        const { gameCode, isPlayer1, deck } = data;
        if (games[gameCode]) {
            if (isPlayer1) games[gameCode].player1FullDeck = deck;
            else games[gameCode].player2FullDeck = deck;
            console.log(`[GAME] Full deck saved for ${isPlayer1 ? 'P1' : 'P2'} in ${gameCode}`);
        }
    });

    socket.on('force-start-game', (data) => {
        const { gameCode } = data;
        console.log(`[GAME] Forcing game start for ${gameCode}`);
        if (games[gameCode]) {
            const game = games[gameCode];
            game.status = 'playing';

            if (!game.gameState) {
                game.gameState = {
                    p1Hand: null,
                    p1Deck: null,
                    p1Graveyard: [],
                    p2Hand: null,
                    p2Deck: null,
                    p2Graveyard: [],
                    board: {}
                };
            }

            if (game.player1FullDeck && game.player2FullDeck) {
                const dealCards = (fullDeck) => {
                    let deckCopy = [...fullDeck];
                    let hand = [];
                    for (let i = 0; i < 10 && deckCopy.length > 0; i++) {
                        const randIdx = Math.floor(Math.random() * deckCopy.length);
                        hand.push(deckCopy.splice(randIdx, 1)[0]);
                    }
                    return { hand, remainingDeck: deckCopy };
                };

                const p1Result = dealCards(game.player1FullDeck);
                game.gameState.p1Hand = p1Result.hand;
                game.gameState.p1Deck = p1Result.remainingDeck;

                const p2Result = dealCards(game.player2FullDeck);
                game.gameState.p2Hand = p2Result.hand;
                game.gameState.p2Deck = p2Result.remainingDeck;

                console.log(`[GAME] Cards dealt server-side for ${gameCode}`);
            }
        }
        io.to(gameCode).emit('start-game-now');
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
                    graveyardCount: gameState.graveyard ? gameState.graveyard.length : undefined,
                    faction: gameState.faction
                });
            }
        }
    });

    socket.on('get-game-state', (data) => {
        const { gameCode, isPlayer1 } = data;
        if (games[gameCode] && games[gameCode].gameState) {
            const state = games[gameCode].gameState;
            socket.emit('init-game-state', {
                hand: isPlayer1 ? state.p1Hand : state.p2Hand,
                deck: isPlayer1 ? state.p1Deck : state.p2Deck,
                graveyard: isPlayer1 ? state.p1Graveyard : state.p2Graveyard,
                faction: isPlayer1 ? state.p1Faction : state.p2Faction,
                swapsPerformed: isPlayer1 ? (game.p1Swaps || 0) : (game.p2Swaps || 0),
                opponentHandCount: isPlayer1 ? (state.p2Hand ? state.p2Hand.length : 0) : (state.p1Hand ? state.p1Hand.length : 0),
                opponentDeckCount: isPlayer1 ? (state.p2Deck ? state.p2Deck.length : 0) : (state.p1Deck ? state.p1Deck.length : 0),
                opponentGraveyardCount: isPlayer1 ? (state.p2Graveyard ? state.p2Graveyard.length : 0) : (state.p1Graveyard ? state.p1Graveyard.length : 0),
                opponentFaction: isPlayer1 ? state.p2Faction : state.p1Faction,
                status: game.status
            });
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
                    deck.push(oldCard);

                    game[playerSwapsKey]++;
                    console.log(`[GAME] ${isPlayer1 ? 'P1' : 'P2'} swapped card in ${gameCode}. Swaps: ${game[playerSwapsKey]}/2`);

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

    socket.on('play-card', (data) => {
        const { gameCode, isPlayer1, card, rowIndex } = data;
        if (games[gameCode]) {
            const targetId = isPlayer1 ? games[gameCode].player2 : games[gameCode].player1;
            if (targetId) {
                io.to(targetId).emit('opponent-played-card', { card, rowIndex });
            }
        }
    });

    socket.on('get-game-state', (data) => {
        const { gameCode, isHost } = data;
        if (games[gameCode] && games[gameCode].gameState) {
            const state = games[gameCode].gameState;
            socket.emit('init-game-state', {
                hand: isHost ? state.hostHand : state.oppHand,
                deck: isHost ? state.hostDeck : state.oppDeck,
                graveyard: isHost ? state.hostGraveyard : state.oppGraveyard,
                opponentHandCount: isHost ? (state.oppHand ? state.oppHand.length : 0) : (state.hostHand ? state.hostHand.length : 0),
                opponentDeckCount: isHost ? (state.oppDeck ? state.oppDeck.length : 0) : (state.hostDeck ? state.hostDeck.length : 0)
            });
        }
    });

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

server.listen(3000, '0.0.0.0', () => {
    console.log('Serwer działa na http://0.0.0.0:3000');
});