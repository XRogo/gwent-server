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
    console.log('Nowy użytkownik połączony:', socket.id);

    socket.on('create-game', (data) => {
        const { gameCode } = data;
        if (!games[gameCode]) {
            games[gameCode] = {
                host: socket.id,
                players: [],
                isClosed: false
            };
            socket.join(gameCode);
            socket.emit('join-success', { gameCode, isHost: true });
            console.log(`Host utworzył grę ${gameCode}: ${socket.id}`);
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
        }

        socket.join(gameCode);
        socket.emit('join-success', { gameCode, isHost: games[gameCode].host === socket.id, hostId: games[gameCode].host });

        if (games[gameCode].host !== socket.id) {
            io.to(games[gameCode].host).emit('opponent-joined', { opponentId: socket.id });
        }
    });

    socket.on('find-public-game', () => {
        // Znajdź grę, która nie jest zamknięta i ma miejsce
        let targetCode = Object.keys(games).find(code => !games[code].isClosed && games[code].players.length === 0);

        if (targetCode) {
            // Dołącz do istniejącej
            socket.emit('public-game-found', { gameCode: targetCode });
        } else {
            // Stwórz nową publiczną
            const newCode = "PUB" + Math.floor(1000 + Math.random() * 9000);
            games[newCode] = {
                host: socket.id,
                players: [],
                isClosed: false,
                isPublic: true
            };
            socket.join(newCode);
            socket.emit('join-success', { gameCode: newCode, isHost: true });
        }
    });

    socket.on('rejoin-game', (data) => {
        const { gameCode, isHost } = data;
        if (games[gameCode]) {
            socket.join(gameCode);
            if (isHost) {
                games[gameCode].host = socket.id;
            } else {
                // Jeśli to gracz, aktualizujemy go w tablicy (zakładamy 1v1)
                games[gameCode].players = [socket.id];
            }
            console.log(`Użytkownik ${socket.id} powrócił do gry ${gameCode} jako ${isHost ? 'host' : 'opponent'}`);
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
        for (const gameCode in games) {
            if (games[gameCode].host === socket.id) {
                const players = games[gameCode].players;
                players.forEach(player => {
                    io.to(player).emit('hostLeft');
                });
            }
        }
    });

    socket.on('opponentLeft', (message) => {
        console.log(`Przeciwnik opuścił grę: ${socket.id}, wiadomość: ${message}`);
        for (const gameCode in games) {
            const playerIndex = games[gameCode].players.findIndex(player => player === socket.id);
            if (playerIndex !== -1) {
                games[gameCode].players.splice(playerIndex, 1);
                games[gameCode].isClosed = false;
                io.to(games[gameCode].host).emit('opponentLeft', message);
                console.log(`Wysłano opponentLeft do hosta: ${games[gameCode].host}`);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Użytkownik rozłączony:', socket.id);
        for (const gameCode in games) {
            if (games[gameCode].host === socket.id) {
                const players = games[gameCode].players;
                players.forEach(player => {
                    io.to(player).emit('opponent-left', 'Host opuścił grę.');
                });
                delete games[gameCode];
                socket.leave(gameCode);
            } else {
                const playerIndex = games[gameCode].players.findIndex(player => player === socket.id);
                if (playerIndex !== -1) {
                    games[gameCode].players.splice(playerIndex, 1);
                    socket.leave(gameCode);
                    if (games[gameCode].players.length === 0) {
                        games[gameCode].isClosed = false;
                        io.to(games[gameCode].host).emit('opponent-left', 'Przeciwnik opuścił grę. Czekaj na nowego gracza.');
                    }
                }
            }
        }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Serwer działa na http://0.0.0.0:3000');
});