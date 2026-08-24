const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const { registerClassicGwentEvents } = require('./server_gwent_classic');
const games = {};

const SLOT_RELEASE_MS = 5 * 60 * 1000; // 5 min – zwolnienie slotu po disconnect
const EMPTY_LOBBY_MS = 30 * 1000;      // 30 s przy 0/2 – kasuj lobby
const TEST_EMPTY_MS = 5 * 1000;        // 5 s – kasuj TEST gdy pusty

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ========== POMOCNICZE FUNKCJE LOBBY ==========

function syncLegacy(game) {
    // Żeby server_gwent_classic.js i stary klient działały bez zmian
    game.player1 = game.p1 ? game.p1.socketId : null;
    game.player2 = game.p2 ? game.p2.socketId : null;
    game.player1Nickname = game.p1 ? game.p1.nickname : null;
    game.player2Nickname = game.p2 ? game.p2.nickname : null;
    game.player1Ready = game.p1 ? !!game.p1.ready : false;
    game.player2Ready = game.p2 ? !!game.p2.ready : false;
    game.isClosed = !!(game.p1 && game.p1.connected && game.p2 && game.p2.connected);
}

function occupiedSlots(game) {
    let n = 0;
    if (game.p1) n++;
    if (game.p2) n++;
    return n;
}

function clearEmptyTimer(game) {
    if (game.emptyTimer) {
        clearTimeout(game.emptyTimer);
        game.emptyTimer = null;
    }
}

function scheduleEmptyDelete(gameCode) {
    const game = games[gameCode];
    if (!game || gameCode === 'TEST') return;
    clearEmptyTimer(game);
    if (occupiedSlots(game) > 0) return;

    game.emptyTimer = setTimeout(() => {
        if (games[gameCode] && occupiedSlots(games[gameCode]) === 0) {
            console.log(`[LOBBY] ${gameCode} usunięte – 0/2 przez 30s`);
            delete games[gameCode];
        }
    }, EMPTY_LOBBY_MS);
}

function clearSlotTimer(slot) {
    if (slot && slot.leaveTimer) {
        clearTimeout(slot.leaveTimer);
        slot.leaveTimer = null;
    }
}

function scheduleSlotRelease(gameCode, which) {
    const game = games[gameCode];
    if (!game || !game[which]) return;
    clearSlotTimer(game[which]);

    game[which].leaveTimer = setTimeout(() => {
        const g = games[gameCode];
        if (!g || !g[which] || g[which].connected) return;

        console.log(`[LOBBY] ${gameCode} slot ${which} zwolniony po 5 min`);
        g[which] = null;
        syncLegacy(g);

        if (occupiedSlots(g) === 0) {
            scheduleEmptyDelete(gameCode);
        } else {
            // 1/2 – lobby otwarte na kogoś z kodem
            g.isClosed = false;
            if (g.status === 'frozen') g.status = 'open';
        }

        broadcastStatus(gameCode);
    }, SLOT_RELEASE_MS);
}

function buildStatus(game) {
    return {
        player1Id: game.p1 ? game.p1.socketId : null,
        player2Id: game.p2 ? game.p2.socketId : null,
        player1Connected: !!(game.p1 && game.p1.connected),
        player2Connected: !!(game.p2 && game.p2.connected),
        player1Nickname: game.p1 ? game.p1.nickname : null,
        player2Nickname: game.p2 ? game.p2.nickname : null,
        status: game.status
    };
}

function broadcastStatus(gameCode, specificSocket = null) {
    const game = games[gameCode];
    if (!game || gameCode === 'TEST') {
        // TEST ma inną strukturę – prosty status jeśli trzeba
        if (game && gameCode === 'TEST') {
            const statusData = {
                player1Id: game.host || game.player1 || null,
                player2Id: (game.players && game.players[0]) || game.player2 || null,
                player1Connected: !!(game.host && io.sockets.sockets.get(game.host)?.connected),
                player2Connected: !!(game.players && game.players[0] && io.sockets.sockets.get(game.players[0])?.connected),
                player1Nickname: game.hostNickname || null,
                player2Nickname: game.opponentNickname || null,
                status: game.status
            };
            if (specificSocket) specificSocket.emit('opponent-status', statusData);
            else io.to(gameCode).emit('opponent-status', statusData);
        }
        return;
    }

    syncLegacy(game);
    const statusData = buildStatus(game);
    console.log(`[STATUS] ${gameCode} P1:${statusData.player1Connected} P2:${statusData.player2Connected} status=${game.status}`);

    if (specificSocket) specificSocket.emit('opponent-status', statusData);
    else io.to(gameCode).emit('opponent-status', statusData);
}

function tryUnfreeze(game) {
    if (game.status === 'frozen' && game.p1 && game.p1.connected && game.p2 && game.p2.connected) {
        game.status = game.gameState ? 'playing' : 'open';
        console.log(`[LOBBY] Odmrożono lobby (oba connected)`);
    }
}

/**
 * Przypisz socket do slotu:
 * - ten sam socket → odśwież connected
 * - slot disconnected → przejmij (F5 / inna przeglądarka / nowy gracz z kodem)
 * - wolny slot → zajmij
 * - obaj online → null (pełne)
 */
/**
 * @param preferredIsP1 - przy rejoin z game.html: true/false/null
 * @param forceReclaim  - true przy rejoin (wolno nadpisać stary socket na slocie)
 */
function assignToGame(game, socket, nickname, preferredIsP1 = null, forceReclaim = false) {
    refreshConnectionFlags(game);

    // Ten sam socket – OK
    if (game.p1 && game.p1.socketId === socket.id) {
        game.p1.connected = true;
        clearSlotTimer(game.p1);
        if (nickname) game.p1.nickname = nickname;
        syncLegacy(game);
        return { isPlayer1: true, role: 'p1' };
    }
    if (game.p2 && game.p2.socketId === socket.id) {
        game.p2.connected = true;
        clearSlotTimer(game.p2);
        if (nickname) game.p2.nickname = nickname;
        syncLegacy(game);
        return { isPlayer1: false, role: 'p2' };
    }

    // REJOIN: twardo weź slot P1 albo P2 (nawet gdy stary socket jeszcze „żyje”)
    if (forceReclaim && preferredIsP1 === true) {
        if (!game.p1) {
            game.p1 = { socketId: socket.id, nickname: nickname || null, ready: false, connected: true, leaveTimer: null };
        } else {
            clearSlotTimer(game.p1);
            game.p1.socketId = socket.id;
            game.p1.connected = true;
            if (nickname) game.p1.nickname = nickname;
        }
        clearEmptyTimer(game);
        syncLegacy(game);
        return { isPlayer1: true, role: 'p1' };
    }
    if (forceReclaim && preferredIsP1 === false) {
        if (!game.p2) {
            game.p2 = { socketId: socket.id, nickname: nickname || null, ready: false, connected: true, leaveTimer: null };
        } else {
            clearSlotTimer(game.p2);
            game.p2.socketId = socket.id;
            game.p2.connected = true;
            if (nickname) game.p2.nickname = nickname;
        }
        syncLegacy(game);
        return { isPlayer1: false, role: 'p2' };
    }

    // Martwy slot
    if (game.p1 && !game.p1.connected) {
        clearSlotTimer(game.p1);
        game.p1.socketId = socket.id;
        game.p1.connected = true;
        if (nickname) game.p1.nickname = nickname;
        clearEmptyTimer(game);
        syncLegacy(game);
        return { isPlayer1: true, role: 'p1' };
    }
    if (game.p2 && !game.p2.connected) {
        clearSlotTimer(game.p2);
        game.p2.socketId = socket.id;
        game.p2.connected = true;
        if (nickname) game.p2.nickname = nickname;
        syncLegacy(game);
        return { isPlayer1: false, role: 'p2' };
    }

    // Wolny slot
    if (!game.p1) {
        game.p1 = { socketId: socket.id, nickname: nickname || null, ready: false, connected: true, leaveTimer: null };
        clearEmptyTimer(game);
        syncLegacy(game);
        return { isPlayer1: true, role: 'p1' };
    }
    if (!game.p2) {
        game.p2 = { socketId: socket.id, nickname: nickname || null, ready: false, connected: true, leaveTimer: null };
        syncLegacy(game);
        return { isPlayer1: false, role: 'p2' };
    }

    return null; // pełne i obaj naprawdę online
}

function markDisconnected(gameCode, socketId) {
    const game = games[gameCode];
    if (!game || gameCode === 'TEST') return false;

    let which = null;
    if (game.p1 && game.p1.socketId === socketId) which = 'p1';
    if (game.p2 && game.p2.socketId === socketId) which = 'p2';
    if (!which) return false;

    game[which].connected = false;
    game[which].ready = false;
    syncLegacy(game);

    console.log(`[LOBBY] ${which} disconnect w ${gameCode} (status=${game.status})`);
    scheduleSlotRelease(gameCode, which);
    broadcastStatus(gameCode);
    return true;
}

function scheduleTestCleanup() {
    setTimeout(() => {
        const g = games['TEST'];
        if (!g) return;

        const hostOk = g.host && io.sockets.sockets.get(g.host)?.connected;
        const p2Id = g.players && g.players[0];
        const p2Ok = p2Id && io.sockets.sockets.get(p2Id)?.connected;

        if (!hostOk && !p2Ok) {
            console.log('[TEST] Lobby wyczyszczone – nikt niepołączony przez 5s');
            delete games['TEST'];
        }
    }, TEST_EMPTY_MS);
}

function isSocketAlive(socketId) {
    if (!socketId) return false;
    const s = io.sockets.sockets.get(socketId);
    return !!(s && s.connected);
}

/** Ustaw connected=false, jeśli socket już nie istnieje w Socket.IO */
function refreshConnectionFlags(game) {
    if (!game || !game.p1 && !game.p2) return;
    if (game.p1 && game.p1.socketId && !isSocketAlive(game.p1.socketId)) {
        game.p1.connected = false;
    }
    if (game.p2 && game.p2.socketId && !isSocketAlive(game.p2.socketId)) {
        game.p2.connected = false;
    }
}

// ========== SOCKET.IO ==========

io.on('connection', (socket) => {
    console.log(`[CONN] Nowy użytkownik połączony: ${socket.id}`);

    // --- CREATE ---
    socket.on('create-game', () => {
        let gameCode;
        do {
            gameCode = Math.floor(100000 + Math.random() * 900000).toString();
        } while (games[gameCode]);

        games[gameCode] = {
            code: gameCode,
            status: 'open', // open | frozen | playing
            p1: null,
            p2: null,
            emptyTimer: null,
            isClosed: false,
            player1: null,
            player2: null,
            player1Nickname: null,
            player2Nickname: null,
            player1Ready: false,
            player2Ready: false,
            gameMode: null,
            gameState: null,
            selectionTimer: null
        };

        assignToGame(games[gameCode], socket, null);
        socket.join(gameCode);
        socket.emit('game-created', { gameCode, isPlayer1: true, role: 'p1' });
        console.log(`[LOBBY] Utworzono ${gameCode} przez ${socket.id}`);
        broadcastStatus(gameCode);
    });

    // --- JOIN (menu: wpisanie kodu) ---
    socket.on('join-game', (data) => {
        const gameCode = String((data && data.gameCode) || '').trim();
        const nickname = (data && data.nickname) || null;
        const game = games[gameCode];

        if (!game) {
            socket.emit('join-error', 'Gra o tym kodzie nie istnieje!');
            return;
        }

        // TEST / public – nie tym handlerem
        if (gameCode === 'TEST' || game.isPublic) {
            socket.emit('join-error', 'Użyj odpowiedniego trybu do tej gry.');
            return;
        }

        // Obaj online → pełne
        if (game.p1 && game.p1.connected && game.p2 && game.p2.connected) {
            socket.emit('join-error', 'Gra jest już pełna!');
            return;
        }

        const assigned = assignToGame(game, socket, nickname, null, false);
        if (!assigned) {
            socket.emit('join-error', 'Gra jest już pełna!');
            return;
        }

        socket.join(gameCode);
        tryUnfreeze(game);

        socket.emit('join-success', {
            gameCode,
            isPlayer1: assigned.isPlayer1,
            role: assigned.role,
            player1Id: game.player1,
            player2Id: game.player2
        });

        if (assigned.role === 'p2' && game.p1 && game.p1.socketId) {
            io.to(game.p1.socketId).emit('opponent-joined', { opponentId: socket.id });
        }
        if (assigned.role === 'p1' && game.p2 && game.p2.socketId) {
            io.to(game.p2.socketId).emit('opponent-joined', { opponentId: socket.id });
        }

        console.log(`[LOBBY] ${socket.id} dołączył do ${gameCode} jako ${assigned.role}`);
        broadcastStatus(gameCode);
    });

    socket.on('rejoin-game', (data) => {
    const gameCode = String((data && data.gameCode) || '').trim();
    const nickname = (data && data.nickname) || null;
    // z URL host=true/false – KLUCZOWE przy przejściu menu→gra
    let preferredIsP1 = null;
    if (typeof data.isPlayer1 === 'boolean') {
        preferredIsP1 = data.isPlayer1;
    }

    const game = games[gameCode];

    if (!game) {
        socket.emit('join-error', 'Lobby nie istnieje lub wygasło.');
        return;
    }

    if (gameCode === 'TEST') {
        socket.join('TEST');
        socket.emit('join-success', { gameCode: 'TEST', isPlayer1: true });
        return;
    }

    refreshConnectionFlags(game);

    // Pełne TYLKO gdy obaj sockety naprawdę żyją I to nie nasz rejoin z preferencją slotu
    const bothAlive =
        game.p1 && isSocketAlive(game.p1.socketId) &&
        game.p2 && isSocketAlive(game.p2.socketId);

    // Przy rejoin ZAWSZE forceReclaim + preferredIsP1 z klienta
    const assigned = assignToGame(game, socket, nickname, preferredIsP1, true);

    if (!assigned) {
        // Ostateczność: obaj żywi i bez preferencji
        socket.emit('join-error', 'Gra jest już pełna!');
        return;
    }

    socket.join(gameCode);
    tryUnfreeze(game);

    socket.emit('join-success', {
        gameCode,
        isPlayer1: assigned.isPlayer1,
        role: assigned.role,
        player1Id: game.player1,
        player2Id: game.player2
    });

    console.log(`[LOBBY] Rejoin ${socket.id} → ${gameCode} jako ${assigned.role} (prefer P1=${preferredIsP1})`);
    broadcastStatus(gameCode);
});

    // --- PUBLIC (zostawione jak było, lekko) ---
    socket.on('find-public-game', () => {
        let targetCode = Object.keys(games).find(code => {
            const g = games[code];
            return g && g.isPublic && !g.isClosed && Array.isArray(g.players) && g.players.length === 0;
        });

        if (targetCode) {
            console.log(`[LOBBY] Znaleziono publiczną grę ${targetCode} dla ${socket.id}`);
            socket.emit('public-game-found', { gameCode: targetCode });
        } else {
            const newCode = 'PUB' + Math.floor(1000 + Math.random() * 9000);
            games[newCode] = {
                host: socket.id,
                players: [],
                isClosed: false,
                isPublic: true,
                hostNickname: null,
                opponentNickname: null,
                status: 'waiting',
                player1Ready: false,
                player2Ready: false
            };
            socket.join(newCode);
            socket.emit('join-success', { gameCode: newCode, isHost: true });
            console.log(`[LOBBY] Utworzono publiczną grę ${newCode}`);
        }
    });

    // --- TEST (zostawione + cleanup 5s) ---
    socket.on('find-test-game', () => {
        const testCode = 'TEST';
        if (!games[testCode]) {
            games[testCode] = {
                host: socket.id,
                players: [],
                isClosed: false,
                hostNickname: 'test1',
                opponentNickname: null,
                status: 'waiting',
                player1Ready: true,
                player2Ready: false,
                player1: socket.id,
                player2: null
            };
            socket.join(testCode);
            socket.emit('test-game-joined', { gameCode: testCode, isHost: true, nickname: 'test1' });
            console.log(`[TEST] ${socket.id} jako test1`);
        } else if (games[testCode].players.length === 0 && games[testCode].host !== socket.id) {
            games[testCode].players.push(socket.id);
            games[testCode].isClosed = true;
            games[testCode].opponentNickname = 'test2';
            games[testCode].player2Ready = true;
            games[testCode].player2 = socket.id;
            socket.join(testCode);
            socket.emit('test-game-joined', { gameCode: testCode, isHost: false, nickname: 'test2' });
            io.to(games[testCode].host).emit('opponent-joined', { opponentId: socket.id });
            console.log(`[TEST] ${socket.id} jako test2`);
            broadcastStatus(testCode);
        } else if (games[testCode].host === socket.id || games[testCode].players.includes(socket.id)) {
            const isHost = games[testCode].host === socket.id;
            socket.emit('test-game-joined', {
                gameCode: testCode,
                isHost,
                nickname: isHost ? 'test1' : 'test2'
            });
        } else {
            socket.emit('test-game-error', 'Zajęte - trwa już gra testowa.');
        }
    });

    // --- NICK ---
    socket.on('set-nickname', (data) => {
        const { gameCode, nickname } = data || {};
        const game = games[gameCode];
        if (!game || gameCode === 'TEST') return;

        if (game.p1 && game.p1.socketId === socket.id) {
            game.p1.nickname = nickname;
        } else if (game.p2 && game.p2.socketId === socket.id) {
            game.p2.nickname = nickname;
        } else if (data.isPlayer1 && game.p1) {
            game.p1.nickname = nickname;
        } else if (game.p2) {
            game.p2.nickname = nickname;
        }

        syncLegacy(game);
        console.log(`[LOBBY] Nick w ${gameCode}: ${nickname}`);
        broadcastStatus(gameCode);
    });

    // --- READY ---
    socket.on('player-ready', (data) => {
        const { gameCode, isReady } = data || {};
        const game = games[gameCode];
        if (!game || !game.p1) return;

        let isP1 = game.p1.socketId === socket.id;
        let isP2 = game.p2 && game.p2.socketId === socket.id;

        // Kompatybilność: klient może jeszcze wysyłać isPlayer1
        if (!isP1 && !isP2 && typeof data.isPlayer1 === 'boolean') {
            isP1 = data.isPlayer1;
            isP2 = !data.isPlayer1;
        }
        if (!isP1 && !isP2) return;

        if (isP1 && game.p1) {
            game.p1.ready = !!isReady;
        } else if (isP2 && game.p2) {
            game.p2.ready = !!isReady;
        }
        syncLegacy(game);

        console.log(`[GAME] ${isP1 ? 'P1' : 'P2'} ready=${!!isReady} w ${gameCode}`);

        if (game.selectionTimer) {
            clearInterval(game.selectionTimer);
            game.selectionTimer = null;
        }

        const r1 = game.p1 && game.p1.ready;
        const r2 = game.p2 && game.p2.ready;

        if (r1 && r2) {
            game.status = 'frozen';
            console.log(`[LOBBY] ${gameCode} ZAMROŻONE – obaj ready`);
            io.to(gameCode).emit('force-finish-selection');
        } else if (r1 || r2) {
            let count = 15;
            game.selectionTimer = setInterval(() => {
                io.to(gameCode).emit('start-game-countdown', { seconds: count });
                count--;
                if (count < 0) {
                    clearInterval(game.selectionTimer);
                    game.selectionTimer = null;
                    game.status = 'frozen';
                    io.to(gameCode).emit('force-finish-selection');
                }
            }, 1000);
        } else {
            io.to(gameCode).emit('start-game-countdown', { seconds: null });
        }

        const targetId = isP1 ? (game.p2 && game.p2.socketId) : (game.p1 && game.p1.socketId);
        if (targetId) {
            io.to(targetId).emit('opponent-ready-status', { isReady: !!isReady });
        }
    });

    // Classic Gwent (bez zmian w tym pliku)
    registerClassicGwentEvents(socket, io, games);

    socket.on('send-to-p1', (data) => {
        const { gameCode, message } = data || {};
        if (games[gameCode] && games[gameCode].player1) {
            io.to(games[gameCode].player1).emit('message-from-p2', { player2Id: socket.id, message });
        }
    });

    socket.on('send-to-p2', (data) => {
        const { player2Id, message } = data || {};
        if (player2Id) io.to(player2Id).emit('message-from-p1', message);
    });

    // Wyjście z lobby z menu
    socket.on('p1Left', () => {
        console.log(`[LOBBY] p1Left od ${socket.id}`);
        for (const gameCode of Object.keys(games)) {
            if (gameCode === 'TEST') continue;
            const game = games[gameCode];
            if (!game || !game.p1) continue;
            if (game.p1.socketId !== socket.id) continue;

            if (game.p2 && game.p2.socketId) {
                io.to(game.p2.socketId).emit('opponent-left', 'Host zamknął lobby.');
            }
            clearEmptyTimer(game);
            if (game.p1) clearSlotTimer(game.p1);
            if (game.p2) clearSlotTimer(game.p2);
            delete games[gameCode];
            console.log(`[LOBBY] Usunięto ${gameCode} (host wyszedł z menu)`);
        }
    });

    socket.on('p2Left', (message) => {
        console.log(`[LOBBY] p2Left od ${socket.id}`);
        for (const gameCode of Object.keys(games)) {
            if (gameCode === 'TEST') continue;
            const game = games[gameCode];
            if (!game || !game.p2) continue;
            if (game.p2.socketId !== socket.id) continue;

            clearSlotTimer(game.p2);
            game.p2 = null;
            if (game.status === 'frozen') game.status = 'open';
            syncLegacy(game);

            if (game.p1 && game.p1.socketId) {
                io.to(game.p1.socketId).emit('opponentLeft', message || 'Przeciwnik opuścił lobby.');
            }
            broadcastStatus(gameCode);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`[CONN] Rozłączony: ${socket.id}, powód: ${reason}`);

        for (const gameCode of Object.keys(games)) {
            if (gameCode === 'TEST') {
                const g = games['TEST'];
                if (!g) continue;
                if (g.host === socket.id || (g.players && g.players.includes(socket.id))) {
                    scheduleTestCleanup();
                }
                continue;
            }

            markDisconnected(gameCode, socket.id);
        }
    });
});

// --- KONSOLA: rt = restart TEST ---
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    const input = data.trim().toLowerCase();
    if (input === 'rt') {
        console.log('[SYSTEM] Restart TEST');
        if (games['TEST']) {
            io.to('TEST').emit('opponent-left', 'Lobby zostało zrestartowane przez system.');
            delete games['TEST'];
        }
    }
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Serwer działa na http://0.0.0.0:3000');
});