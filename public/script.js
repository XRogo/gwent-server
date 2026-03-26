const socket = io();

const mainMenu = document.getElementById('mainMenu');
const sidePanel = document.getElementById('sidePanel');
const centerMenuImg = document.querySelector('.center-menu');
const menuWrapper = document.querySelector('.menu-wrapper');
const infoScreen = document.getElementById('infoScreen');
const gameScreen = document.getElementById('gameScreen');

let selectedMode = 'classic';
let isPlayer1 = false;
let isJoined = false;
let currentGameCode = null;
let player1Nickname = null;
let player2Nickname = null;
let isP1Ready = false;
let isP2Ready = false;
let player2Id = null;

const nicknames = [
    "Geralt", "Yennefer", "Ciri", "Triss", "Jaskier", "Zoltan", "Vesemir", "Lambert", "Eskel", "Foltest",
    "Emhyr", "Fringilla", "Meve", "Eredin", "Regis", "Yarpen", "Keira", "Letho", "Roche", "Ves", "Iorveth",
    "Radovid", "Dettlaff", "Barnabo", "Baron", "Milva"
];

// Hover sounds
const addHoverSound = (elements) => {
    elements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            new Audio('assets/hover-sound.mp3').play().catch(() => {});
        });
    });
};

addHoverSound(document.querySelectorAll('.menu-button, .discord-button, .mode-item, .back-button, .setup-actions button'));

function showSidePanel() {
    menuWrapper.classList.add('side-view');
    // centerMenuImg.src = 'assets/srodekmenuw.png'; // Handled by HTML already based on new requirement
    sidePanel.classList.add('active');
}

function showHostScreen() {
    isPlayer1 = true;
    socket.emit('create-game');
    showSidePanel();
    updateSetupUI();
}

function selectGameMode(mode) {
    selectedMode = mode;
    
    // Update active class
    document.querySelectorAll('.mode-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.mode === mode) item.classList.add('active');
    });

    // Update preview image
    const preview = document.getElementById('modePreview');
    if (mode === 'classic') {
        preview.innerHTML = '<span>Tryb Klasyczny</span>';
    } else if (mode === 'mix') {
        preview.innerHTML = '<img src="assets/work in prognres.png" alt="Work in progress">';
    } else {
        preview.innerHTML = '<img src="assets/inconcept.png" alt="In concept">';
    }

    if (isPlayer1 && player2Id) {
        socket.emit('send-to-p2', { player2Id, message: { type: 'mode-changed', mode } });
    }
}

function updateSetupUI() {
    const p1Box = document.querySelector('.player-box.host');
    const p2Box = document.querySelector('.player-box.opponent');
    const codeDisplay = document.getElementById('displayCode');
    
    p1Box.querySelector('.nick').textContent = player1Nickname || 'Ty (Host)';
    p1Box.classList.toggle('ready', isP1Ready);
    p1Box.querySelector('.status-indicator').textContent = isP1Ready ? 'GOTOWY' : 'Czekanie...';

    p2Box.querySelector('.nick').textContent = player2Nickname || (isPlayer1 ? 'Czekanie na gracza...' : 'Łączenie...');
    p2Box.classList.toggle('ready', isP2Ready);
    p2Box.querySelector('.status-indicator').textContent = isP2Ready ? 'GOTOWY' : 'Niegotowy';

    if (currentGameCode) {
        codeDisplay.textContent = `KOD: ${currentGameCode}`;
    }

    const startBtn = document.getElementById('startGameBtn');
    startBtn.disabled = !(isP1Ready && isP2Ready);
}

function toggleReady() {
    if (isPlayer1) {
        isP1Ready = !isP1Ready;
        if (player2Id) {
            socket.emit('send-to-p2', { player2Id, message: { type: 'readiness-changed', ready: isP1Ready } });
        }
    } else {
        isP2Ready = !isP2Ready;
        socket.emit('send-to-p1', { gameCode: currentGameCode, message: { type: 'readiness-changed', ready: isP2Ready } });
    }
    updateSetupUI();
}

function joinGame() {
    const codeInput = document.getElementById('sideCodeInput');
    const code = codeInput.value.trim();
    if (!code) return;
    
    currentGameCode = code;
    socket.emit('join-game', { gameCode: code });
}

function copyCode() {
    if (!currentGameCode) return;
    navigator.clipboard.writeText(currentGameCode);
    const btn = document.querySelector('.code-box button');
    const oldText = btn.textContent;
    btn.textContent = 'OK!';
    setTimeout(() => btn.textContent = oldText, 2000);
}

function goBackToMain() {
    menuWrapper.classList.remove('side-view');
    sidePanel.classList.remove('active');
    // centerMenuImg.src = 'assets/srodekmenu.png'; // If we want to revert, but user said start with srodekmenuw.png
    if (isPlayer1) socket.emit('p1Left');
    else socket.emit('p2Left');
    socket.disconnect();
    location.reload(); // Simple reset
}

// Socket events
socket.on('game-created', (data) => {
    currentGameCode = data.gameCode;
    console.log('Game created:', currentGameCode);
    updateSetupUI();
});

socket.on('join-success', (data) => {
    isJoined = true;
    currentGameCode = data.gameCode;
    if (!data.isPlayer1) {
        isPlayer1 = false;
        showSidePanel();
    }
    updateSetupUI();
});

socket.on('opponent-joined', (data) => {
    player2Id = data.opponentId;
    player2Nickname = "Przeciwnik"; // For now
    updateSetupUI();
    // Notify P2 of current status
    socket.emit('send-to-p2', { player2Id, message: { type: 'sync-setup', mode: selectedMode, ready: isP1Ready } });
});

socket.on('message-from-p1', (msg) => {
    if (msg.type === 'sync-setup' || msg.type === 'mode-changed') {
        selectGameMode(msg.mode);
        if (msg.ready !== undefined) {
            isP1Ready = msg.ready;
            updateSetupUI();
        }
    } else if (msg.type === 'readiness-changed') {
        isP1Ready = msg.ready;
        updateSetupUI();
    } else if (msg.type === 'start-game') {
        startRealGame();
    }
});

socket.on('message-from-p2', (data) => {
    const msg = data.message;
    if (msg.type === 'readiness-changed') {
        isP2Ready = msg.ready;
        updateSetupUI();
    }
});

function requestStartGame() {
    if (isPlayer1 && isP1Ready && isP2Ready) {
        socket.emit('send-to-p2', { player2Id, message: { type: 'start-game' } });
        startRealGame();
    }
}

function startRealGame() {
    const nick = localStorage.getItem('nickname') || nicknames[Math.floor(Math.random() * nicknames.length)];
    window.location.href = `/gwent/game.html?code=${currentGameCode}&host=${isPlayer1}&nick=${encodeURIComponent(nick)}`;
}

// Info Screen
function showInfoScreen() {
    mainMenu.style.display = 'none';
    infoScreen.style.display = 'flex';
}

function showMainMenu() {
    infoScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
}

// Test Game
window.startTestGame = function () {
    socket.emit('find-test-game');
};
socket.on('test-game-joined', (data) => {
    currentGameCode = data.gameCode;
    isPlayer1 = data.isHost;
    startRealGame();
});