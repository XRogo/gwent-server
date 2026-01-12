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
                status: 'waiting'
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
            // Notify both about status
            io.to(gameCode).emit('opponent-status', {
                hostConnected: true,
                opponentConnected: true,
                hostNickname: games[gameCode].hostNickname,
                opponentNickname: games[gameCode].opponentNickname
            });
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
                status: 'waiting'
            };
            socket.join(newCode);
            socket.emit('join-success', { gameCode: newCode, isHost: true });
            console.log(`[LOBBY] Utworzono nową publiczną grę ${newCode} przez ${socket.id}`);
        }
    });

    socket.on('rejoin-game', (data) => {
        const { gameCode, isHost, nickname } = data;
        if (games[gameCode]) {
            socket.join(gameCode);
            if (isHost) {
                games[gameCode].host = socket.id;
                if (nickname) games[gameCode].hostNickname = nickname;
            } else {
                games[gameCode].players = [socket.id];
                if (nickname) games[gameCode].opponentNickname = nickname;
            }
            console.log(`[LOBBY] Użytkownik ${socket.id} powrócił do gry ${gameCode} jako ${isHost ? 'host' : 'opponent'} (nick: ${nickname || 'brak'})`);

            // Notify other player
            io.to(gameCode).emit('opponent-status', {
                hostConnected: !!io.sockets.sockets.get(games[gameCode].host),
                opponentConnected: games[gameCode].players.some(id => io.sockets.sockets.get(id)),
                hostNickname: games[gameCode].hostNickname,
                opponentNickname: games[gameCode].opponentNickname
            });
        }
    });

    socket.on('set-nickname', (data) => {
        const { gameCode, isHost, nickname } = data;
        if (games[gameCode]) {
            if (isHost) games[gameCode].hostNickname = nickname;
            else games[gameCode].opponentNickname = nickname;
            console.log(`[LOBBY] Ustawiono nick dla ${isHost ? 'hosta' : 'przeciwnika'} w ${gameCode}: ${nickname}`);

            io.to(gameCode).emit('opponent-status', {
                hostConnected: !!io.sockets.sockets.get(games[gameCode].host),
                opponentConnected: games[gameCode].players.some(id => io.sockets.sockets.get(id)),
                hostNickname: games[gameCode].hostNickname,
                opponentNickname: games[gameCode].opponentNickname
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

                io.to(games[gameCode].host).emit('opponent-status', {
                    hostConnected: true,
                    opponentConnected: false,
                    hostNickname: games[gameCode].hostNickname,
                    opponentNickname: null
                });
            }
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`[CONN] Użytkownik rozłączony: ${socket.id}, powód: ${reason}`);
        for (const gameCode in games) {
            if (games[gameCode].host === socket.id) {
                // Host się rozłączył - nie usuwamy od razu, dajemy szansę na powrót
                console.log(`[LOBBY] Host rozłączony w grze ${gameCode}. Czekam na powrót.`);
                io.to(gameCode).emit('opponent-status', {
                    hostConnected: false,
                    opponentConnected: games[gameCode].players.some(id => io.sockets.sockets.get(id)),
                    hostNickname: games[gameCode].hostNickname,
                    opponentNickname: games[gameCode].opponentNickname
                });

                // Opcjonalnie: ustaw timeout na usunięcie gry
                setTimeout(() => {
                    if (games[gameCode] && games[gameCode].host === socket.id && !io.sockets.sockets.get(socket.id)) {
                        console.log(`[LOBBY] Gra ${gameCode} usunięta z powodu długiego rozłączenia hosta.`);
                        const players = games[gameCode].players;
                        players.forEach(player => {
                            io.to(player).emit('opponent-left', 'Host opuścił grę na stałe.');
                        });
                        delete games[gameCode];
                    }
                }, 30000); // 30 sekund na powrót
            } else {
                const playerIndex = games[gameCode].players.findIndex(player => player === socket.id);
                if (playerIndex !== -1) {
                    console.log(`[LOBBY] Przeciwnik rozłączony w grze ${gameCode}.`);
                    io.to(games[gameCode].host).emit('opponent-status', {
                        hostConnected: true,
                        opponentConnected: false,
                        hostNickname: games[gameCode].hostNickname,
                        opponentNickname: games[gameCode].opponentNickname
                    });
                }
            }
        }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Serwer działa na http://0.0.0.0:3000');
});