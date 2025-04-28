const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Poprawna inicjalizacja io

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

        if (games[gameCode].isClosed) {
            socket.emit('join-error', 'Gra jest już zamknięta!');
            return;
        }

        if (games[gameCode].host === socket.id || games[gameCode].players.some(player => player === socket.id)) {
            socket.emit('join-error', 'Już jesteś w tej grze!');
            return;
        }

        if (games[gameCode].players.length >= 1) {
            socket.emit('join-error', 'Gra jest pełna!');
            return;
        }

        games[gameCode].players.push(socket.id);
        games[gameCode].isClosed = true;
        socket.join(gameCode);
        socket.emit('join-success', { gameCode, isHost: false, hostId: games[gameCode].host });
        console.log(`Wysyłam opponent-joined do hosta: ${games[gameCode].host}, opponentId: ${socket.id}`);
        io.to(games[gameCode].host).emit('opponent-joined', { opponentId: socket.id });
        console.log(`Gracz dołączył do gry ${gameCode}: ${socket.id}`);
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
                    io.to(player).emit('hostLeft'); // Powiadom przeciwnika
                });
            }
        }
    });

    socket.on('opponentLeft', (message) => {
        for (const gameCode in games) {
            const playerIndex = games[gameCode].players.findIndex(player => player === socket.id);
            if (playerIndex !== -1) {
                io.to(games[gameCode].host).emit('opponentLeft', message); // Powiadom hosta
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