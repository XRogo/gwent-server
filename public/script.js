const socket = io();

const mainMenu = document.getElementById('mainMenu');
const sidePanel = document.getElementById('sidePanel');
const centerMenuImg = document.querySelector('.center-menu');
const menuWrapper = document.querySelector('.menu-wrapper');
const infoScreen = document.getElementById('infoScreen');
const gameScreen = document.getElementById('gameScreen');

let selectedModeIndex = 0; // Default to first mode in tryby.js
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
const addHoverSound = (selector) => {
    document.querySelectorAll(selector).forEach(el => {
        el.addEventListener('mouseenter', () => {
            new Audio('assets/hover-sound.mp3').play().catch(() => {});
        });
    });
};

function showSidePanel() {
    sidePanel.classList.add('active');
    triggerCanvasResize();
    setTimeout(fitMenuToScreen, 100); // Pozwala animacji CSS zaktualizować szerokość
}

function showHostScreen() {
    isPlayer1 = true;
    socket.emit('create-game');
    showSidePanel();
    updateSetupUI();
}

/* ========================================================
   DYNAMIC MODE SYSTEM & PIXEL SCALING (wybor.webp)
======================================================== */
const canvas = document.getElementById('wyborPixelCanvas');
const bgImg = document.getElementById('wyborBgImg');

bgImg.onload = () => {
    triggerCanvasResize();
    fitMenuToScreen();
};
window.addEventListener('resize', () => {
    triggerCanvasResize();
    fitMenuToScreen();
});

function fitMenuToScreen() {
    const container = document.querySelector('.content-container');
    if (!container) return;
    
    // Resetuj skale do 1 przed pomiarem, zeby uniknac nieskończonych wyjatkow
    container.style.transform = `translateX(-50%) scale(1)`;
    container.offsetHeight; // force reflow
    
    const w = container.scrollWidth;
    if (w > window.innerWidth) {
        const scale = window.innerWidth / w;
        container.style.transform = `translateX(-50%) scale(${scale})`;
    }
}

function triggerCanvasResize() {
    if (!bgImg.complete || bgImg.naturalWidth === 0) return;
    
    const natW = bgImg.naturalWidth;
    const natH = bgImg.naturalHeight;
    const curW = bgImg.clientWidth;
    
    // Pixel canvas matches natural dimensions of the image
    canvas.style.width = natW + 'px';
    canvas.style.height = natH + 'px';
    
    // Scale it down to match the rendered width
    const scale = curW / natW;
    canvas.style.transform = `scale(${scale})`;
}

function initModeCarousel() {
    const carousel = document.getElementById('modeCarousel');
    carousel.innerHTML = '';
    
    tryby.forEach((mode, index) => {
        const item = document.createElement('div');
        item.className = 'carousel-kafelek';
        item.style.backgroundImage = `url('assets/${mode.ikona}')`;
        item.onclick = () => selectGameMode(index);
        
        const text = document.createElement('div');
        text.className = 'carousel-kafelek-hover-text';
        text.textContent = mode.nazwa;
        
        item.appendChild(text);
        carousel.appendChild(item);
        
        // Add separator if not last
        if (index < tryby.length - 1) {
            const separator = document.createElement('img');
            separator.src = 'assets/dzielnik.webp';
            separator.className = 'dzielnik-img';
            separator.alt = 'dzielnik';
            carousel.appendChild(separator);
        }
    });

    selectGameMode(0); // Select first mode
}

function selectGameMode(index) {
    selectedModeIndex = index;
    const mode = tryby[index];
    
    // Update active class
    const items = document.querySelectorAll('.carousel-kafelek');
    items.forEach((item, i) => {
        item.classList.remove('active');
        if (i === index) item.classList.add('active');
    });

    // Update texts and images
    document.getElementById('modePreviewText').textContent = mode.opis;
    
    const imgElement = document.getElementById('modePreviewImg');
    if (mode.nazwa === 'Klasyczny') {
        imgElement.src = 'assets/wybory.webp'; // Fallback / current
    } else {
        imgElement.src = 'assets/work in prognres.png'; // Fallback
    }

    if (isPlayer1 && player2Id) {
        // Send index to P2
        socket.emit('send-to-p2', { player2Id, message: { type: 'mode-changed', index } });
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initModeCarousel();
    addHoverSound('.menu-button, .carousel-kafelek, .side-back-button, .game-btn');
    document.getElementById('nicknameInput').value = localStorage.getItem('nickname') || nicknames[Math.floor(Math.random() * nicknames.length)];
    setTimeout(fitMenuToScreen, 100);
});

/* ========================================================
   LOBBY LOGIC
======================================================== */

function updateSetupUI() {
    const codeDisplay = document.getElementById('displayCode');
    const p2Status = document.getElementById('p2Status');
    const startBtn = document.getElementById('startGameBtn');
    
    if (currentGameCode) {
        codeDisplay.textContent = `TWÓJ KOD ${currentGameCode}`;
    }

    if (isPlayer1) {
        startBtn.textContent = 'START';
        p2Status.textContent = isP2Ready ? 'Przeciwnik: GOTOWY' : (player2Id ? 'Przeciwnik: Czeka' : 'Brak przeciwnika');
        startBtn.disabled = !(isP1Ready && isP2Ready);
    } else {
        startBtn.textContent = 'GOTOWY / CZEKAJ'; 
        // If joined, startbtn becomes just a visual indicator or used for something else.
        // Actually toggleReady handles the readiness. So startBtn can be hidden for P2 or disabled.
        startBtn.style.display = 'none'; 
        p2Status.textContent = isP2Ready ? 'Ty: GOTOWY' : 'Ty: Niegotowy';
    }
    
    const readyBtn = document.getElementById('readyBtn');
    if (isPlayer1) {
        readyBtn.textContent = isP1Ready ? 'ANULUJ GOT.' : 'GOTOWY';
    } else {
        readyBtn.textContent = isP2Ready ? 'ANULUJ GOT.' : 'GOTOWY';
    }
}

function toggleReady() {
    const nick = document.getElementById('nicknameInput').value || nicknames[0];
    localStorage.setItem('nickname', nick);

    if (isPlayer1) {
        isP1Ready = !isP1Ready;
        if (player2Id) {
            socket.emit('send-to-p2', { player2Id, message: { type: 'readiness-changed', ready: isP1Ready } });
        }
    } else {
        isP2Ready = !isP2Ready;
        socket.emit('send-to-p1', { gameCode: currentGameCode, message: { type: 'readiness-changed', ready: isP2Ready } });
    }
    
    socket.emit('set-nickname', { gameCode: currentGameCode, isPlayer1, nickname: nick });
    updateSetupUI();
}

function joinOrStartGame() {
    const codeInput = document.getElementById('sideCodeInput').value.trim();
    if (codeInput) {
        // Player wants to join
        currentGameCode = codeInput;
        socket.emit('join-game', { gameCode: codeInput });
    } else {
        // Player 1 wants to start
        requestStartGame();
    }
}

function requestStartGame() {
    if (isPlayer1 && isP1Ready && isP2Ready) {
        socket.emit('send-to-p2', { player2Id, message: { type: 'start-game' } });
        startRealGame();
    }
}

function startRealGame() {
    const nick = document.getElementById('nicknameInput').value || nicknames[Math.floor(Math.random() * nicknames.length)];
    localStorage.setItem('nickname', nick);
    const mode = tryby[selectedModeIndex];
    const gamePath = mode ? mode.gra : 'tryby/klasyczny_gwint';
    
    window.location.href = `/${gamePath}/game.html?code=${currentGameCode}&host=${isPlayer1}&nick=${encodeURIComponent(nick)}`;
}

function goBackToMain() {
    menuWrapper.classList.remove('side-view');
    sidePanel.classList.remove('active');
    setTimeout(fitMenuToScreen, 100);
    if (isPlayer1) socket.emit('p1Left');
    else socket.emit('p2Left');
    socket.disconnect();
    location.reload(); 
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
    player2Nickname = "Przeciwnik"; 
    updateSetupUI();
    // Notify P2 of current status
    socket.emit('send-to-p2', { player2Id, message: { type: 'sync-setup', modeIndex: selectedModeIndex, ready: isP1Ready } });
});

socket.on('message-from-p1', (msg) => {
    if (msg.type === 'sync-setup' || msg.type === 'mode-changed') {
        if (msg.modeIndex !== undefined) selectGameMode(msg.modeIndex);
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



// Reset Lobby
window.resetLobby = function () {
    if (isPlayer1) {
        socket.emit('p1Left');
        setTimeout(() => {
            isJoined = false;
            player2Id = null;
            player2Nickname = null;
            isP1Ready = false;
            isP2Ready = false;
            currentGameCode = null;
            socket.emit('create-game');
        }, 150);
    }
};

// Test Game
window.startTestGame = function () {
    socket.emit('find-test-game');
};

socket.on('test-game-joined', (data) => {
    currentGameCode = data.gameCode;
    isPlayer1 = data.isHost;
    
    // In test game, we immediately assume the first mode
    selectedModeIndex = 0;
    startRealGame();
});