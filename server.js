const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const { registerClassicGwentEvents } = require('./server_gwent_classic');
const games = {};

const SLOT_RELEASE_MS = 5 * 60 * 1000; // 5 min – zwolnij TYLKO slot (nie całą grę)
const EMPTY_LOBBY_MS = 30 * 1000;      // 30 s przy 0/2 – wtedy dopiero delete lobby
const TEST_EMPTY_MS = 5 * 1000;
const TOKEN_LOCK_MS = 20 * 1000;       // 20 s – po rozłączeniu token przestaje blokować slot

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// ========== HELPERY ==========

function generateToken() {
    return crypto.randomBytes(24).toString('hex');
}

function isSocketAlive(socketId) {
    if (!socketId) return false;
    const s = io.sockets.sockets.get(socketId);
    return !!(s && s.connected);
}

function syncLegacy(game) {
    // server_gwent_classic.js nadal używa player1 / player2
    game.player1 = game.p1 ? game.p1.socketId : null;
    game.player2 = game.p2 ? game.p2.socketId : null;
    game.player1Nickname = game.p1 ? game.p1.nickname : null;
    game.player2Nickname = game.p2 ? game.p2.nickname : null;
    game.player1Ready = !!(game.p1 && game.p1.ready);
    game.player2Ready = !!(game.p2 && game.p2.ready);
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

function clearTokenTimer(slot) {
    if (slot && slot.tokenTimer) {
        clearTimeout(slot.tokenTimer);
        slot.tokenTimer = null;
    }
}

/** Po 5 min offline – zwolnij slot, NIE kasuj całej gry jeśli ktoś jeszcze jest */
function scheduleSlotRelease(gameCode, which) {
    const game = games[gameCode];
    if (!game || !game[which]) return;
    clearSlotTimer(game[which]);

    game[which].leaveTimer = setTimeout(() => {
        const g = games[gameCode];
        if (!g || !g[which] || g[which].connected) return;

        console.log(`[LOBBY] ${gameCode} slot ${which} zwolniony po 5 min offline`);
        clearTokenTimer(g[which]);
        g[which] = null;
        syncLegacy(g);

        if (occupiedSlots(g) === 0) {
            scheduleEmptyDelete(gameCode);
        } else {
            g.isClosed = false;
            if (g.status === 'frozen') g.status = g.gameState ? 'playing' : 'open';
        }
        broadcastStatus(gameCode);
    }, SLOT_RELEASE_MS);
}

/** Po 20 s offline – token przestaje być wymagany (slot można zająć bez tokena) */
function scheduleTokenExpiry(gameCode, which) {
    const game = games[gameCode];
    if (!game || !game[which]) return;
    clearTokenTimer(game[which]);

    game[which].tokenTimer = setTimeout(() => {
        const g = games[gameCode];
        if (!g || !g[which] || g[which].connected) return;

        console.log(`[TOKEN] ${gameCode} ${which} – token wygasł po 20s offline`);
        g[which].token = null;
        g[which].tokenLocked = false;
    }, TOKEN_LOCK_MS);
}

function refreshConnectionFlags(game) {
    if (!game) return;
    if (game.p1 && game.p1.socketId && !isSocketAlive(game.p1.socketId)) {
        game.p1.connected = false;
    }
    if (game.p2 && game.p2.socketId && !isSocketAlive(game.p2.socketId)) {
        game.p2.connected = false;
    }
}

function buildStatus(game) {
    return {
        player1Id: game.p1 ? game.p1.socketId : null,
        player2Id: game.p2 ? game.p2.socketId : null,
        player1Connected: !!(game.p1 && game.p1.connected && isSocketAlive(game.p1.socketId)),
        player2Connected: !!(game.p2 && game.p2.connected && isSocketAlive(game.p2.socketId)),
        player1Nickname: game.p1 ? game.p1.nickname : null,
        player2Nickname: game.p2 ? game.p2.nickname : null,
        status: game.status
    };
}

function broadcastStatus(gameCode, specificSocket = null) {
    const game = games[gameCode];
    if (!game) return;

    if (gameCode === 'TEST') {
        const statusData = {
            player1Id: game.host || null,
            player2Id: (game.players && game.players[0]) || null,
            player1Connected: !!(game.host && isSocketAlive(game.host)),
            player2Connected: !!(game.players && game.players[0] && isSocketAlive(game.players[0])),
            player1Nickname: game.hostNickname || null,
            player2Nickname: game.opponentNickname || null,
            status: game.status
        };
        if (specificSocket) specificSocket.emit('opponent-status', statusData);
        else io.to(gameCode).emit('opponent-status', statusData);
        return;
    }

    refreshConnectionFlags(game);
    syncLegacy(game);
    const statusData = buildStatus(game);
    console.log(`[STATUS] ${gameCode} P1:${statusData.player1Connected} P2:${statusData.player2Connected} status=${game.status}`);

    if (specificSocket) specificSocket.emit('opponent-status', statusData);
    else io.to(gameCode).emit('opponent-status', statusData);
}

function tryUnfreeze(game) {
    if (game.status === 'frozen' && game.p1 && game.p1.connected && game.p2 && game.p2.connected) {
        game.status = game.gameState ? 'playing' : 'open';
        console.log(`[LOBBY] ${game.code || '?'} odmrożone`);
    }
}

function isTokenLocked(slot) {
    return !!(slot && slot.token && slot.tokenLocked !== false);
}

/**
 * preferredIsP1: true/false/null
 * forceReclaim: true przy rejoin (menu→gra / F5)
 * clientToken: token z localStorage klienta
 * Zwraca: { isPlayer1, role, token } albo null
 */
function assignToGame(game, socket, nickname, preferredIsP1, forceReclaim, clientToken) {
    refreshConnectionFlags(game);

    // 1) Ten sam socket – już jesteś w slocie
    if (game.p1 && game.p1.socketId === socket.id) {
        game.p1.connected = true;
        clearSlotTimer(game.p1);
        clearTokenTimer(game.p1);
        if (nickname) game.p1.nickname = nickname;
        if (!game.p1.token) game.p1.token = generateToken();
        game.p1.tokenLocked = true;
        syncLegacy(game);
        return { isPlayer1: true, role: 'p1', token: game.p1.token };
    }
    if (game.p2 && game.p2.socketId === socket.id) {
        game.p2.connected = true;
        clearSlotTimer(game.p2);
        clearTokenTimer(game.p2);
        if (nickname) game.p2.nickname = nickname;
        if (!game.p2.token) game.p2.token = generateToken();
        game.p2.tokenLocked = true;
        syncLegacy(game);
        return { isPlayer1: false, role: 'p2', token: game.p2.token };
    }

    function takeSlot(which, existing) {
        clearSlotTimer(existing || null);
        clearTokenTimer(existing || null);

        // Stary socket – wyrzuć (jedno aktywne połączenie)
        if (existing && existing.socketId && existing.socketId !== socket.id) {
            const old = io.sockets.sockets.get(existing.socketId);
            if (old && old.connected) {
                old.emit('session-taken', 'Twoje miejsce zajęło inne połączenie.');
                old.disconnect(true);
            }
        }

        // Ten sam token = ten sam gracz wraca → zostaw token
        // Inaczej (nowy gracz / wygasły) → nowy token
        const keepToken = existing && existing.token && clientToken && clientToken === existing.token;
        const token = keepToken ? existing.token : generateToken();

        game[which] = {
            socketId: socket.id,
            nickname: nickname || (existing && existing.nickname) || null,
            ready: false,
            connected: true,
            leaveTimer: null,
            tokenTimer: null,
            token: token,
            tokenLocked: true
        };
        clearEmptyTimer(game);
        syncLegacy(game);
        return { isPlayer1: which === 'p1', role: which, token };
    }

    // 2) REJOIN z preferowaną rolą (z URL host=)
    if (forceReclaim && preferredIsP1 === true) {
        const slot = game.p1;
        if (slot) {
            if (isTokenLocked(slot)) {
                if (!clientToken || clientToken !== slot.token) return null;
            }
            return takeSlot('p1', slot);
        }
        return takeSlot('p1', null);
    }
    if (forceReclaim && preferredIsP1 === false) {
        const slot = game.p2;
        if (slot) {
            if (isTokenLocked(slot)) {
                if (!clientToken || clientToken !== slot.token) return null;
            }
            return takeSlot('p2', slot);
        }
        return takeSlot('p2', null);
    }

    // 3) Martwy slot (offline) – zwykłe join
    if (game.p1 && !game.p1.connected) {
        if (isTokenLocked(game.p1)) {
            if (clientToken && clientToken === game.p1.token) {
                return takeSlot('p1', game.p1);
            }
            // token ważny, a klient go nie ma → nie oddajemy
        } else {
            return takeSlot('p1', game.p1);
        }
    }
    if (game.p2 && !game.p2.connected) {
        if (isTokenLocked(game.p2)) {
            if (clientToken && clientToken === game.p2.token) {
                return takeSlot('p2', game.p2);
            }
        } else {
            return takeSlot('p2', game.p2);
        }
    }

    // 4) Wolny slot (pierwsze dołączenie)
    if (!game.p1) {
        return takeSlot('p1', null);
    }
    if (!game.p2) {
        return takeSlot('p2', null);
    }

    return null;
}

function markDisconnected(gameCode, socketId) {
    const game = games[gameCode];
    if (!game || gameCode === 'TEST') return;

    let which = null;
    if (game.p1 && game.p1.socketId === socketId) which = 'p1';
    else if (game.p2 && game.p2.socketId === socketId) which = 'p2';
    if (!which) return;

    if (game[which].socketId !== socketId) return;

    game[which].connected = false;
    game[which].ready = false;
    game[which].tokenLocked = true;
    syncLegacy(game);

    console.log(`[LOBBY] ${which} offline w ${gameCode} (status=${game.status}) – token ważny 20s`);
    scheduleTokenExpiry(gameCode, which);
    scheduleSlotRelease(gameCode, which);
    broadcastStatus(gameCode);
}

function scheduleTestCleanup() {
    setTimeout(() => {
        const g = games['TEST'];
        if (!g) return;

        const hostOk = g.host && isSocketAlive(g.host);
        const p2Id = g.players && g.players[0];
        const p2Ok = p2Id && isSocketAlive(p2Id);

        if (g.gameState || g.status === 'playing' || g.status === 'frozen') {
            return;
        }

        if (!hostOk && !p2Ok) {
            console.log('[TEST] Lobby wyczyszczone – nikt online przez 60s (lobby)');
            delete games['TEST'];
        }
    }, 60 * 1000);
}

// ========== SOCKET.IO ==========

io.on('connection', (socket) => {
    console.log(`[CONN] Nowy użytkownik połączony: ${socket.id}`);

    socket.on('create-game', () => {
        let gameCode;
        do {
            gameCode = Math.floor(100000 + Math.random() * 900000).toString();
        } while (games[gameCode]);

        games[gameCode] = {
            code: gameCode,
            status: 'open',
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

        const assigned = assignToGame(games[gameCode], socket, null, true, true, null);
        socket.join(gameCode);
        socket.emit('game-created', {
            gameCode,
            isPlayer1: true,
            role: 'p1',
            token: assigned ? assigned.token : null
        });
        console.log(`[LOBBY] Utworzono ${gameCode} przez ${socket.id}`);
        broadcastStatus(gameCode);
    });

    socket.on('join-game', (data) => {
        const gameCode = String((data && data.gameCode) || '').trim();
        const nickname = (data && data.nickname) || null;
        const clientToken = (data && data.token) || null;
        const game = games[gameCode];

        if (!game) {
            socket.emit('join-error', 'Gra o tym kodzie nie istnieje!');
            return;
        }
        if (gameCode === 'TEST' || game.isPublic) {
            socket.emit('join-error', 'Użyj innego trybu dla tej gry.');
            return;
        }

        refreshConnectionFlags(game);
        if (game.p1 && game.p1.connected && isSocketAlive(game.p1.socketId)
            && game.p2 && game.p2.connected && isSocketAlive(game.p2.socketId)) {
            socket.emit('join-error', 'Gra jest już pełna!');
            return;
        }

        const assigned = assignToGame(game, socket, nickname, null, false, clientToken);
        if (!assigned) {
            socket.emit('join-error', 'Gra jest już pełna lub slot zablokowany!');
            return;
        }

        socket.join(gameCode);
        tryUnfreeze(game);

        socket.emit('join-success', {
            gameCode,
            isPlayer1: assigned.isPlayer1,
            role: assigned.role,
            player1Id: game.player1,
            player2Id: game.player2,
            token: assigned.token
        });

        if (assigned.role === 'p2' && game.p1) {
            io.to(game.p1.socketId).emit('opponent-joined', { opponentId: socket.id });
        }
        if (assigned.role === 'p1' && game.p2) {
            io.to(game.p2.socketId).emit('opponent-joined', { opponentId: socket.id });
        }

        console.log(`[LOBBY] ${socket.id} dołączył do ${gameCode} jako ${assigned.role}`);
        broadcastStatus(gameCode);
    });

    socket.on('rejoin-game', (data) => {
        const gameCode = String((data && data.gameCode) || '').trim();
        const nickname = (data && data.nickname) || null;
        const clientToken = (data && data.token) || null;
        let preferredIsP1 = null;
        if (typeof (data && data.isPlayer1) === 'boolean') {
            preferredIsP1 = data.isPlayer1;
        }

        const game = games[gameCode];
        if (!game) {
            socket.emit('join-error', 'Lobby nie istnieje lub wygasło.');
            return;
        }

        if (gameCode === 'TEST') {
            let g = games['TEST'];
            if (!g) {
                g = games['TEST'] = {
                    host: null,
                    players: [],
                    isClosed: false,
                    hostNickname: 'test1',
                    opponentNickname: null,
                    status: 'waiting',
                    player1Ready: true,
                    player2Ready: true,
                    player1: null,
                    player2: null
                };
            }

            const pref = typeof (data && data.isPlayer1) === 'boolean' ? data.isPlayer1 : null;

            if (pref === true || (pref === null && !g.host)) {
                g.host = socket.id;
                g.player1 = socket.id;
                if (nickname) g.hostNickname = nickname || 'test1';
                socket.join('TEST');
                socket.emit('join-success', { gameCode: 'TEST', isPlayer1: true, role: 'p1' });
                socket.emit('test-game-joined', { gameCode: 'TEST', isHost: true, nickname: g.hostNickname || 'test1' });
                console.log(`[TEST] Rejoin jako test1: ${socket.id}`);
            } else {
                if (!g.players) g.players = [];
                if (!g.players.includes(socket.id)) {
                    g.players = [socket.id];
                }
                g.player2 = socket.id;
                g.isClosed = true;
                if (nickname) g.opponentNickname = nickname || 'test2';
                socket.join('TEST');
                socket.emit('join-success', { gameCode: 'TEST', isPlayer1: false, role: 'p2' });
                socket.emit('test-game-joined', { gameCode: 'TEST', isHost: false, nickname: g.opponentNickname || 'test2' });
                console.log(`[TEST] Rejoin jako test2: ${socket.id}`);
            }

            if (g.host) g.player1 = g.host;
            if (g.players && g.players[0]) g.player2 = g.players[0];
            broadcastStatus('TEST');
            return;
        }

        const assigned = assignToGame(game, socket, nickname, preferredIsP1, true, clientToken);
        if (!assigned) {
            socket.emit('join-error', 'Nie można dołączyć – brak prawidłowego tokena lub gra pełna.');
            return;
        }

        socket.join(gameCode);
        tryUnfreeze(game);

        socket.emit('join-success', {
            gameCode,
            isPlayer1: assigned.isPlayer1,
            role: assigned.role,
            player1Id: game.player1,
            player2Id: game.player2,
            token: assigned.token
        });

        console.log(`[LOBBY] Rejoin ${socket.id} → ${gameCode} jako ${assigned.role} (host/P1 prefer=${preferredIsP1})`);
        broadcastStatus(gameCode);

        if (game.gameState && (game.status === 'playing' || game.status === 'scoia-decision')) {
            console.log(`[LOBBY] ${gameCode} – rejoin w trakcie gry → resume`);
            socket.emit('resume-in-game', {
                gameCode: gameCode,
                status: game.status
            });
        }
    });

    socket.on('find-public-game', () => {
        let targetCode = Object.keys(games).find(code => {
            const g = games[code];
            return g && g.isPublic && !g.isClosed && Array.isArray(g.players) && g.players.length === 0;
        });

        if (targetCode) {
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
        }
    });

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
        } else if (games[testCode].host === socket.id || (games[testCode].players || []).includes(socket.id)) {
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

    socket.on('set-nickname', (data) => {
        const gameCode = data && data.gameCode;
        const nickname = data && data.nickname;
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

    socket.on('player-ready', (data) => {
        const gameCode = data && data.gameCode;
        const isReady = !!(data && data.isReady);
        const game = games[gameCode];
        if (!game) return;

        let isP1 = false;
        let isP2 = false;

        if (game.p1 || game.p2) {
            isP1 = !!(game.p1 && game.p1.socketId === socket.id);
            isP2 = !!(game.p2 && game.p2.socketId === socket.id);
            if (!isP1 && !isP2 && typeof data.isPlayer1 === 'boolean') {
                isP1 = data.isPlayer1;
                isP2 = !data.isPlayer1;
            }
            if (!isP1 && !isP2) return;

            if (isP1 && game.p1) game.p1.ready = isReady;
            if (isP2 && game.p2) game.p2.ready = isReady;
            if (typeof syncLegacy === 'function') syncLegacy(game);
            else {
                game.player1Ready = isP1 ? isReady : !!game.player1Ready;
                game.player2Ready = isP2 ? isReady : !!game.player2Ready;
                if (isP1) game.player1Ready = isReady;
                if (isP2) game.player2Ready = isReady;
            }
        } else if (gameCode === 'TEST' || game.host !== undefined) {
            isP1 = game.host === socket.id || game.player1 === socket.id;
            isP2 = (game.players && game.players.includes(socket.id)) || game.player2 === socket.id;
            if (!isP1 && !isP2 && typeof data.isPlayer1 === 'boolean') {
                isP1 = data.isPlayer1;
                isP2 = !data.isPlayer1;
            }
            if (!isP1 && !isP2) return;

            if (isP1) {
                game.player1Ready = isReady;
                game.player1 = socket.id;
                game.host = socket.id;
                if (!game.player1Nickname) game.player1Nickname = game.hostNickname || 'test1';
            } else {
                game.player2Ready = isReady;
                game.player2 = socket.id;
                if (!game.players) game.players = [];
                if (!game.players.includes(socket.id)) game.players = [socket.id];
                if (!game.player2Nickname) game.player2Nickname = game.opponentNickname || 'test2';
            }
        } else {
            if (typeof data.isPlayer1 !== 'boolean') return;
            isP1 = data.isPlayer1;
            isP2 = !data.isPlayer1;
            if (isP1) game.player1Ready = isReady;
            else game.player2Ready = isReady;
        }

        console.log(`[GAME] ${isP1 ? 'P1' : 'P2'} ready=${isReady} w ${gameCode}`);

        if (game.selectionTimer) {
            clearInterval(game.selectionTimer);
            game.selectionTimer = null;
        }

        const r1 = !!game.player1Ready;
        const r2 = !!game.player2Ready;

        if (r1 && r2) {
            if (game.p1 || game.p2) game.status = 'frozen';
            console.log(`[GAME] Both ready in ${gameCode}, starting.`);
            io.to(gameCode).emit('force-finish-selection');
        } else if (r1 || r2) {
            let count = 60;
            game.selectionTimer = setInterval(() => {
                io.to(gameCode).emit('start-game-countdown', { seconds: count });
                count--;
                if (count < 0) {
                    clearInterval(game.selectionTimer);
                    game.selectionTimer = null;
                    if (game.p1 || game.p2) game.status = 'frozen';
                    io.to(gameCode).emit('force-finish-selection');
                }
            }, 1000);
        } else {
            io.to(gameCode).emit('start-game-countdown', { seconds: null });
        }

        const targetId = isP1
            ? (game.player2 || (game.players && game.players[0]) || (game.p2 && game.p2.socketId))
            : (game.player1 || game.host || (game.p1 && game.p1.socketId));
        if (targetId) io.to(targetId).emit('opponent-ready-status', { isReady });
    });

    registerClassicGwentEvents(socket, io, games);

    socket.on('send-to-p1', (data) => {
        const game = games[data && data.gameCode];
        if (game && game.player1) {
            io.to(game.player1).emit('message-from-p2', { player2Id: socket.id, message: data.message });
        }
    });

    socket.on('send-to-p2', (data) => {
        if (data && data.player2Id) {
            io.to(data.player2Id).emit('message-from-p1', data.message);
        }
    });

    socket.on('p1Left', () => {
        console.log(`[LOBBY] p1Left od ${socket.id}`);
        for (const gameCode of Object.keys(games)) {
            if (gameCode === 'TEST') continue;
            const game = games[gameCode];
            if (!game || !game.p1 || game.p1.socketId !== socket.id) continue;

            if (game.p2 && game.p2.socketId) {
                io.to(game.p2.socketId).emit('opponent-left', 'Host zamknął lobby.');
            }
            clearEmptyTimer(game);
            if (game.p1) {
                clearSlotTimer(game.p1);
                clearTokenTimer(game.p1);
            }
            if (game.p2) {
                clearSlotTimer(game.p2);
                clearTokenTimer(game.p2);
            }
            delete games[gameCode];
            console.log(`[LOBBY] Usunięto ${gameCode} (host z menu)`);
        }
    });

    socket.on('p2Left', (message) => {
        console.log(`[LOBBY] p2Left od ${socket.id}`);
        for (const gameCode of Object.keys(games)) {
            if (gameCode === 'TEST') continue;
            const game = games[gameCode];
            if (!game || !game.p2 || game.p2.socketId !== socket.id) continue;

            clearSlotTimer(game.p2);
            clearTokenTimer(game.p2);
            game.p2 = null;
            if (game.status === 'frozen') game.status = game.gameState ? 'playing' : 'open';
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
                if (g && (g.host === socket.id || (g.players || []).includes(socket.id))) {
                    scheduleTestCleanup();
                }
                continue;
            }
            markDisconnected(gameCode, socket.id);
        }
    });
});

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