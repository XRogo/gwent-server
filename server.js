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

    socket.on('create-game', (data) => {
        const { gameCode } = data;
        if (!games[gameCode]) {
            games[gameCode] = {
                host: socket.id,
                players: [],
                isClosed: false,
                hostNickname: null,
                opponentNickname: null,
                status: 'waiting',
                hostReady: false,
                opponentReady: false
            };
            socket.join(gameCode);
            socket.emit('join-success', { gameCode, isHost: true });
            console.log(`[LOBBY] Host utworzył grę ${gameCode}: ${socket.id}`);
        } else {
            socket.emit('join-error', 'Kod gry już istnieje!');
        }
    });

    socket.on('join-game', (data) => {
        const { gameCode } = data;

        if (!games[gameCode]) {
            socket.emit('join-error', 'Gra o tym kodzie nie istnieje!');
            return;
        }

        if (games[gameCode].isClosed && games[gameCode].host !== socket.id && !games[gameCode].players.includes(socket.id)) {
            socket.emit('join-error', 'Gra jest już zamknieta i pełna!');
            return;
        }

        if (games[gameCode].host !== socket.id && !games[gameCode].players.includes(socket.id)) {
            if (games[gameCode].players.length >= 1) {
                socket.emit('join-error', 'Gra jest pełna!');
                return;
            }
            games[gameCode].players.push(socket.id);
            games[gameCode].isClosed = true;
            console.log(`[LOBBY] Gracz ${socket.id} dołączył do gry ${gameCode}`);
        }

        socket.join(gameCode);
        socket.emit('join-success', { gameCode, isHost: games[gameCode].host === socket.id, hostId: games[gameCode].host });

        if (games[gameCode].host !== socket.id) {
            io.to(games[gameCode].host).emit('opponent-joined', { opponentId: socket.id });
            broadcastStatus(gameCode);
        }
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

        const hostSocket = io.sockets.sockets.get(game.host);
        const opponentId = game.players[0];
        const opponentSocket = opponentId ? io.sockets.sockets.get(opponentId) : null;

        const statusData = {
            hostId: game.host,
            hostConnected: !!(hostSocket && hostSocket.connected),
            opponentConnected: !!(opponentSocket && opponentSocket.connected),
            hostNickname: game.hostNickname,
            opponentNickname: game.opponentNickname
        };

        console.log(`[STATUS] Rozsyłam status dla ${gameCode}. Host: ${statusData.hostConnected}, Opp: ${statusData.opponentConnected}`);

        if (specificSocket) {
            specificSocket.emit('opponent-status', statusData);
        } else {
            io.to(gameCode).emit('opponent-status', statusData);
        }
    };

    socket.on('rejoin-game', (data) => {
        let { gameCode, isHost, nickname } = data;
        if (games[gameCode]) {
            const game = games[gameCode];

            // Server-side authority check:
            // If the requester claims to be a host, but there's already a different host
            // who is currently connected, force the requester to be an opponent.
            if (isHost && game.host && game.host !== socket.id) {
                const hostSocket = io.sockets.sockets.get(game.host);
                if (hostSocket && hostSocket.connected) {
                    console.log(`[LOBBY] Forcing ${socket.id} to OPPONENT role during rejoin.`);
                    isHost = false;
                }
            }

            socket.join(gameCode);
            if (isHost) {
                game.host = socket.id;
                game.hostReady = false;
                if (nickname) game.hostNickname = nickname;
            } else {
                game.players = [socket.id];
                game.opponentReady = false;
                if (nickname) game.opponentNickname = nickname;
            }
            console.log(`[LOBBY] Użytkownik ${socket.id} powrócił do gry ${gameCode} jako ${isHost ? 'host' : 'opponent'} (nick: ${nickname || 'brak'})`);
            broadcastStatus(gameCode, socket);

            const oppId = isHost ? (game.players[0]) : game.host;
            if (oppId) io.to(oppId).emit('opponent-ready-status', { isReady: false });
        }
    });

    socket.on('set-nickname', (data) => {
        const { gameCode, isHost, nickname } = data;
        if (games[gameCode]) {
            if (isHost) games[gameCode].hostNickname = nickname;
            else games[gameCode].opponentNickname = nickname;
            console.log(`[LOBBY] Ustawiono nick dla ${isHost ? 'hosta' : 'przeciwnika'} w ${gameCode}: ${nickname}`);
            broadcastStatus(gameCode);
        }
    });

    socket.on('player-ready', (data) => {
        const { gameCode, isHost, isReady } = data;
        if (games[gameCode]) {
            const game = games[gameCode];
            if (isHost) game.hostReady = isReady;
            else game.opponentReady = isReady;

            console.log(`[GAME] ${isHost ? 'Host' : 'Opponent'} is ${isReady ? 'READY' : 'NOT READY'} in ${gameCode}`);

            // Start timer if one is ready and other is not
            if ((game.hostReady && !game.opponentReady) || (!game.hostReady && game.opponentReady)) {
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
            } else if (!game.hostReady && !game.opponentReady) {
                // Both not ready, stop timer
                if (game.selectionTimer) {
                    clearInterval(game.selectionTimer);
                    game.selectionTimer = null;
                    console.log(`[GAME] Stopped selection timer for ${gameCode} (both not ready)`);
                    io.to(gameCode).emit('selection-timer-stopped');
                }
            } else if (game.hostReady && game.opponentReady) {
                // Both ready, stop timer and start immediately if needed (usually client triggers this)
                if (game.selectionTimer) {
                    clearInterval(game.selectionTimer);
                    game.selectionTimer = null;
                    console.log(`[GAME] Stopped selection timer for ${gameCode} (both ready)`);
                }
            }

            const targetId = isHost ? (games[gameCode].players[0]) : games[gameCode].host;
            if (targetId) {
                io.to(targetId).emit('opponent-ready-status', { isReady });
            }
        }
    });

    socket.on('save-full-deck', (data) => {
        const { gameCode, isHost, deck } = data;
        if (games[gameCode]) {
            if (isHost) games[gameCode].hostFullDeck = deck;
            else games[gameCode].oppFullDeck = deck;
            console.log(`[GAME] Full deck saved for ${isHost ? 'Host' : 'Opponent'} in ${gameCode}`);
        }
    });

    socket.on('force-start-game', (data) => {
        const { gameCode } = data;
        console.log(`[GAME] Forcing game start for ${gameCode}`);
        if (games[gameCode]) {
            const game = games[gameCode];
            game.status = 'playing';

            // Initialize empty state if not exists
            if (!game.gameState) {
                game.gameState = {
                    hostHand: null,
                    hostDeck: null,
                    hostGraveyard: [],
                    oppHand: null,
                    oppDeck: null,
                    oppGraveyard: [],
                    board: {}
                };
            }

            // Server-side card dealing if decks are available
            if (game.hostFullDeck && game.oppFullDeck) {
                const dealCards = (fullDeck) => {
                    let deckCopy = [...fullDeck];
                    let hand = [];
                    for (let i = 0; i < 10 && deckCopy.length > 0; i++) {
                        const randIdx = Math.floor(Math.random() * deckCopy.length);
                        hand.push(deckCopy.splice(randIdx, 1)[0]);
                    }
                    return { hand, remainingDeck: deckCopy };
                };

                const hostResult = dealCards(game.hostFullDeck);
                game.gameState.hostHand = hostResult.hand;
                game.gameState.hostDeck = hostResult.remainingDeck;

                const oppResult = dealCards(game.oppFullDeck);
                game.gameState.oppHand = oppResult.hand;
                game.gameState.oppDeck = oppResult.remainingDeck;

                console.log(`[GAME] Cards dealt server-side for ${gameCode}`);
            }
        }
        io.to(gameCode).emit('start-game-now');
    });

    socket.on('save-game-state', (data) => {
        const { gameCode, isHost, gameState } = data;
        if (games[gameCode]) {
            if (!games[gameCode].gameState) games[gameCode].gameState = {};

            if (isHost) {
                if (gameState.hand) games[gameCode].gameState.hostHand = gameState.hand;
                if (gameState.deck) games[gameCode].gameState.hostDeck = gameState.deck;
                if (gameState.graveyard) games[gameCode].gameState.hostGraveyard = gameState.graveyard;
                if (gameState.faction) games[gameCode].gameState.hostFaction = gameState.faction;
            } else {
                if (gameState.hand) games[gameCode].gameState.oppHand = gameState.hand;
                if (gameState.deck) games[gameCode].gameState.oppDeck = gameState.deck;
                if (gameState.graveyard) games[gameCode].gameState.oppGraveyard = gameState.graveyard;
                if (gameState.faction) games[gameCode].gameState.oppFaction = gameState.faction;
            }
            console.log(`[GAME] State saved for ${isHost ? 'Host' : 'Opponent'} in ${gameCode}`);

            // Broadcast update to the other player for counts/reversos
            const targetId = isHost ? (games[gameCode].players ? games[gameCode].players[0] : null) : games[gameCode].host;
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
        const { gameCode, isHost } = data;
        if (games[gameCode] && games[gameCode].gameState) {
            const state = games[gameCode].gameState;
            socket.emit('init-game-state', {
                hand: isHost ? state.hostHand : state.oppHand,
                deck: isHost ? state.hostDeck : state.oppDeck,
                graveyard: isHost ? state.hostGraveyard : state.oppGraveyard,
                faction: isHost ? state.hostFaction : state.oppFaction,
                opponentHandCount: isHost ? (state.oppHand ? state.oppHand.length : 0) : (state.hostHand ? state.hostHand.length : 0),
                opponentDeckCount: isHost ? (state.oppDeck ? state.oppDeck.length : 0) : (state.hostDeck ? state.hostDeck.length : 0),
                opponentGraveyardCount: isHost ? (state.oppGraveyard ? state.oppGraveyard.length : 0) : (state.hostGraveyard ? state.hostGraveyard.length : 0),
                opponentFaction: isHost ? state.oppFaction : state.hostFaction
            });
        }
    });

    socket.on('play-card', (data) => {
        const { gameCode, isHost, card, rowIndex } = data;
        if (games[gameCode]) {
            // Broadcast the move to the opponent
            const targetId = isHost ? (games[gameCode].players ? games[gameCode].players[0] : null) : games[gameCode].host;
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

    socket.on('send-to-host', (data) => {
        const { gameCode, message } = data;
        if (games[gameCode] && games[gameCode].host) {
            io.to(games[gameCode].host).emit('message-from-opponent', { opponentId: socket.id, message });
        }
    });

    socket.on('send-to-opponent', (data) => {
        const { opponentId, message } = data;
        io.to(opponentId).emit('message-from-host', message);
    });

    socket.on('hostLeft', () => {
        console.log(`[LOBBY] Host ${socket.id} zamknął lobby.`);
        for (const gameCode in games) {
            if (games[gameCode].host === socket.id) {
                const players = games[gameCode].players;
                players.forEach(player => {
                    io.to(player).emit('hostLeft');
                });
                delete games[gameCode];
            }
        }
    });

    socket.on('opponentLeft', (message) => {
        console.log(`[LOBBY] Przeciwnik ${socket.id} opuścił grę. Wiadomość: ${message}`);
        for (const gameCode in games) {
            const playerIndex = games[gameCode].players.findIndex(player => player === socket.id);
            if (playerIndex !== -1) {
                games[gameCode].players.splice(playerIndex, 1);
                games[gameCode].isClosed = false;
                io.to(games[gameCode].host).emit('opponentLeft', message);
                broadcastStatus(gameCode);
            }
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`[CONN] Użytkownik rozłączony: ${socket.id}, powód: ${reason}`);
        for (const gameCode in games) {
            if (games[gameCode].host === socket.id) {
                console.log(`[LOBBY] Host rozłączony w grze ${gameCode}. Czekam na powrót.`);
                broadcastStatus(gameCode);

                setTimeout(() => {
                    if (games[gameCode] && games[gameCode].host === socket.id && !io.sockets.sockets.get(socket.id)) {
                        console.log(`[LOBBY] Gra ${gameCode} usunięta z powodu długiego rozłączenia hosta.`);
                        const players = games[gameCode].players;
                        players.forEach(player => {
                            io.to(player).emit('opponent-left', 'Host opuścił grę na stałe.');
                        });
                        delete games[gameCode];
                    }
                }, 30000);
            } else {
                const playerIndex = games[gameCode].players.findIndex(player => player === socket.id);
                if (playerIndex !== -1) {
                    console.log(`[LOBBY] Przeciwnik rozłączony w grze ${gameCode}.`);
                    broadcastStatus(gameCode);
                }
            }
        }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Serwer działa na http://0.0.0.0:3000');
});