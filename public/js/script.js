const socket = io();

const buttons = document.querySelectorAll('.menu-button');
const okButtons = document.querySelectorAll('.ok-button');
const copyIcons = document.querySelectorAll('.copy-icon');
const mainMenu = document.getElementById('mainMenu');
const hostScreen = document.getElementById('hostScreen');
const joinScreen = document.getElementById('joinScreen');
const loadingScreen = document.getElementById('loadingScreen');
const nicknameScreen = document.getElementById('nicknameScreen');
const gameScreen = document.getElementById('gameScreen');
const hostNicknameElement = document.getElementById('hostNickname');
const opponentNicknameElement = document.getElementById('opponentNickname');
const gameCodeElement = document.querySelector('.game-code .code-text');
const gameLinkElement = document.querySelector('.game-link .link-text');
const playerIcon = document.querySelector('.player-icon img');
const wszystkieKartyText = document.querySelector('.wszystkie_karty-text');
const wybraneKartyText = document.querySelector('.wybrane_karty-text');
const nicknameInput = document.querySelector('.nickname-input');

let selectedMode = null;
let isPlayer1 = false;
let isJoined = false;
let hasJoined = false;
let opponentJoined = false;
let player2Id = null;
let player1Id = null;
let player1Nickname = null;
let player2Nickname = null;
let currentGameCode = null;

const nicknames = [
    "Geralt", "Yennefer", "Ciri", "Triss", "Jaskier", "Zoltan", "Vesemir", "Lambert", "Eskel", "Foltest",
    "Emhyr", "Fringilla", "Meve", "Eredin", "Regis", "Yarpen", "Keira", "Letho", "Roche", "Ves", "Iorveth",
    "Radovid", "Dettlaff", "Barnabo", "Baron", "Milva"
];

// Odczyt parametru game z URL
const urlParams = new URLSearchParams(window.location.search);
const gameCodeFromUrl = urlParams.get('game');
if (gameCodeFromUrl) {
    fadeOut(mainMenu, () => {
        fadeIn(joinScreen);
        document.querySelector('.code-input').value = gameCodeFromUrl;
    });
}

// Dźwięk przy najechaniu
buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        const hoverSound = new Audio('assets/hover-sound.mp3');
        hoverSound.play();
    });
});

okButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        const hoverSound = new Audio('assets/hover-sound.mp3');
        hoverSound.play();
    });
    const img = button.querySelector('img');
    if (img) {
        img.addEventListener('mouseenter', () => {
            const hoverSound = new Audio('assets/hover-sound.mp3');
            hoverSound.play();
        });
    }
});

copyIcons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
        const hoverSound = new Audio('assets/hover-sound.mp3');
        hoverSound.play();
    });
});

const modeButtons = document.querySelectorAll('.mode-button');
modeButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        if (opponentJoined) {
            const hoverSound = new Audio('assets/hover-sound.mp3');
            hoverSound.play();
        }
    });
});

// Pokazywanie ekranów z animacją
function fadeOut(element, callback) {
    element.style.opacity = '0';
    setTimeout(() => {
        element.style.display = 'none';
        if (callback) callback();
    }, 500);
}

function fadeIn(element) {
    element.style.display = 'flex';
    element.style.opacity = '0';
    setTimeout(() => {
        element.style.opacity = '1';
    }, 50);
}

function showHostScreen() {
    fadeOut(mainMenu, () => {
        fadeIn(hostScreen);
        isPlayer1 = true;
        socket.emit('create-game');
        if (playerIcon) {
            playerIcon.style.display = 'block';
            playerIcon.src = 'assets/ludekn.png';
        }
        if (wszystkieKartyText) {
            wszystkieKartyText.style.display = 'block';
            wszystkieKartyText.src = 'assets/swszystkiekarty.png';
        }
        if (wybraneKartyText) {
            wybraneKartyText.style.display = 'block';
            wybraneKartyText.src = 'assets/swybranekarty.png';
        }
        document.querySelector('.mode-button.wszystkie_karty').classList.add('disabled');
        document.querySelector('.mode-button.wybrane_karty').classList.add('disabled');
    });
}

function showJoinScreen() {
    fadeOut(mainMenu, () => {
        fadeIn(joinScreen);
        document.querySelector('.code-input').value = '';
    });
}

function showLoadingScreen() {
    fadeOut(joinScreen, () => {
        fadeIn(loadingScreen);
    });
}

function showNicknameScreen() {
    if (isPlayer1) {
        fadeOut(hostScreen, () => {
            fadeIn(nicknameScreen);
            setRandomNickname();
            const submitButton = nicknameScreen.querySelector('.submit-button');
            if (submitButton) {
                submitButton.addEventListener('mouseenter', () => {
                    const hoverSound = new Audio('assets/hover-sound.mp3');
                    hoverSound.play();
                });
            }
            const hostIcon = document.querySelector('.host-player-icon img');
            const opponentIcon = document.querySelector('.opponent-player-icon img');
            if (hostIcon) hostIcon.src = 'assets/ludekn.png';
            if (opponentIcon) opponentIcon.src = 'assets/ludekn.png';
        });
    } else {
        fadeOut(loadingScreen, () => {
            fadeIn(nicknameScreen);
            setRandomNickname();
            const submitButton = nicknameScreen.querySelector('.submit-button');
            if (submitButton) {
                submitButton.addEventListener('mouseenter', () => {
                    const hoverSound = new Audio('assets/hover-sound.mp3');
                    hoverSound.play();
                });
            }
            const hostIcon = document.querySelector('.host-player-icon img');
            const opponentIcon = document.querySelector('.opponent-player-icon img');
            if (hostIcon) hostIcon.src = 'assets/ludekn.png';
            if (opponentIcon) opponentIcon.src = 'assets/ludekn.png';
        });
    }
}

function generateGameCode() {
    // No longer generating code locally for host
}

socket.on('game-created', (data) => {
    currentGameCode = data.gameCode;
    gameCodeElement.textContent = currentGameCode;
    gameLinkElement.textContent = `https://gwent-1vs1.onrender.com/?game=${currentGameCode}`;
});

function copyCode() {
    navigator.clipboard.writeText(gameCodeElement.textContent).then(() => {
        const message = document.querySelector('.game-code .copy-message');
        message.classList.add('show');
        setTimeout(() => {
            message.classList.remove('show');
        }, 2000);
    });
}

function copyLink() {
    navigator.clipboard.writeText(gameLinkElement.textContent).then(() => {
        const message = document.querySelector('.game-link .copy-message');
        message.classList.add('show');
        setTimeout(() => {
            message.classList.remove('show');
        }, 2000);
    });
}

function joinGame() {
    const gameCode = document.querySelector('.code-input').value.trim();
    if (!gameCode) {
        alert('Wprowadź kod gry!');
        return;
    }
    // Jeśli gracz jest rozłączony, resetujemy jego stan przed dołączeniem
    if (hasJoined) {
        socket.disconnect(); // Rozłączamy stare połączenie
        resetGameState(); // Resetujemy stan gry
    }
    socket.connect(); // Nawiązujemy nowe połączenie
    currentGameCode = gameCode;
    socket.emit('join-game', { gameCode });
}

function selectMode(mode) {
    if (!isPlayer1) return;
    if (!opponentJoined || !player2Id) {
        alert('Przeciwnik opuścił grę. Czekaj na nowego gracza.');
        return;
    }
    selectedMode = mode;
    socket.emit('send-to-p2', { player2Id, message: { type: 'mode-selected', mode } });
    showNicknameScreen();
}

function updateHostUI() {
    if (playerIcon) {
        playerIcon.style.display = 'block';
        playerIcon.src = 'assets/ludeka.png?cache=' + Date.now();
    } else {
        console.error('playerIcon nie istnieje!');
    }
    if (wszystkieKartyText) {
        wszystkieKartyText.style.display = 'block';
        wszystkieKartyText.src = 'assets/wszystkiekarty.png';
    } else {
        console.error('wszystkieKartyText nie istnieje!');
    }
    if (wybraneKartyText) {
        wybraneKartyText.style.display = 'block';
        wybraneKartyText.src = 'assets/wybranekarty.png';
    } else {
        console.error('wybraneKartyText nie istnieje!');
    }

    const wszystkieKartyButton = document.querySelector('.mode-button.wszystkie_karty');
    const wybraneKartyButton = document.querySelector('.mode-button.wybrane_karty');
    if (wszystkieKartyButton && wybraneKartyButton) {
        wszystkieKartyButton.classList.remove('disabled');
        wybraneKartyButton.classList.remove('disabled');
    } else {
        console.error('Przyciski wyboru trybu nie istnieją!');
    }
}

function resetHostUI() {
    if (playerIcon) {
        playerIcon.style.display = 'block';
        playerIcon.src = 'assets/ludekn.png';
    }
    if (wszystkieKartyText) {
        wszystkieKartyText.style.display = 'block';
        wszystkieKartyText.src = 'assets/swszystkiekarty.png';
    }
    if (wybraneKartyText) {
        wybraneKartyText.style.display = 'block';
        wybraneKartyText.src = 'assets/swybranekarty.png';
    }
    const wszystkieKartyButton = document.querySelector('.mode-button.wszystkie_karty');
    const wybraneKartyButton = document.querySelector('.mode-button.wybrane_karty');
    if (wszystkieKartyButton && wybraneKartyButton) {
        wszystkieKartyButton.classList.add('disabled');
        wybraneKartyButton.classList.add('disabled');
    }
}

function setRandomNickname() {
    const randomNick = nicknames[Math.floor(Math.random() * nicknames.length)];
    nicknameInput.placeholder = randomNick;
}

nicknameInput.addEventListener('input', () => {
    if (nicknameInput.value === '') {
        setRandomNickname();
    }
});

nicknameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        submitNickname();
    }
});

function startGame() {
    const gameCode = currentGameCode || gameCodeElement.textContent || gameCodeFromUrl;
    if (!gameCode) {
        console.error('Brak kodu gry przy startowaniu!');
        alert('Błąd: utracono kod gry. Spróbuj dołączyć ponownie.');
        return;
    }
    const nick = isPlayer1 ? player1Nickname : player2Nickname;
    window.location.href = `/gwent/game.html?code=${gameCode}&host=${isPlayer1}&nick=${encodeURIComponent(nick || '')}`;
}

function resetGameState() {
    selectedMode = null;
    isPlayer1 = false;
    isJoined = false;
    hasJoined = false;
    opponentJoined = false;
    player2Id = null;
    player1Id = null;
    player1Nickname = null;
    player2Nickname = null;
    // Resetowanie UI hosta
    resetHostUI();
    // Resetowanie inputu kodu, aby można było wpisać nowy kod
    const codeInput = document.querySelector('.code-input');
    if (codeInput) {
        codeInput.value = '';
        codeInput.disabled = false;
    }
}

socket.on('join-success', (data) => {
    console.log('Dołączono do gry:', data.gameCode);
    isJoined = true;
    hasJoined = true;
    if (data.isPlayer1) {
        console.log('Jesteś Player 1.');
        isPlayer1 = true;
    } else {
        console.log('Przeciwnik dołączył.');
        player1Id = data.player1Id;
        if (playerIcon) {
            playerIcon.style.display = 'block';
            playerIcon.src = 'assets/ludeka.png?cache=' + Date.now();
        }
        if (wszystkieKartyText) {
            wszystkieKartyText.style.display = 'block';
            wszystkieKartyText.src = 'assets/wszystkiekarty.png';
        }
        if (wybraneKartyText) {
            wybraneKartyText.style.display = 'block';
            wybraneKartyText.src = 'assets/wybranekarty.png';
        }
        showLoadingScreen();
    }
});

socket.on('join-error', (message) => {
    const errorMessage = document.querySelector('.join-content .error-message');
    errorMessage.textContent = "Nie poprawny kod";
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 2000);
});

socket.on('opponent-joined', (data) => {
    console.log('Odebrano opponent-joined:', data);
    player2Id = data.opponentId;
    opponentJoined = true;
    setTimeout(updateHostUI, 100);
});

socket.on('public-game-found', (data) => {
    fadeOut(mainMenu, () => {
        fadeIn(joinScreen);
        document.querySelector('.code-input').value = data.gameCode;
        joinGame(); // Automatycznie dołącz
    });
});

socket.on('opponent-left', (message) => {
    alert(message);
    if (isPlayer1) {
        selectedMode = null;
        isJoined = false;
        hasJoined = false;
        opponentJoined = false;
        player2Id = null;
        player1Nickname = null;
        player2Nickname = null;
        resetHostUI();
        nicknameScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        loadingScreen.style.display = 'none';
        joinScreen.style.display = 'none';
        fadeIn(hostScreen);
    } else {
        resetGameState();
        nicknameScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        loadingScreen.style.display = 'none';
        joinScreen.style.display = 'none';
        fadeIn(mainMenu);
    }
});

socket.on('message-from-p2', (data) => {
    const { player2Id: senderId, message } = data;
    if (message.type === 'submit-nickname') {
        player2Nickname = message.nickname;
        console.log(`P2 wybrał nick: ${player2Nickname}`);
        const opponentIcon = document.querySelector('.opponent-player-icon img');
        if (opponentIcon) {
            opponentIcon.src = 'assets/ludeka.png?cache=' + Date.now();
        }
        if (player1Nickname && player2Nickname) {
            socket.emit('send-to-p2', { player2Id: senderId, message: { type: 'nicknames-confirmed', player1Nickname, player2Nickname } });
            startGame();
        }
    }
});

socket.on('message-from-p1', (message) => {
    if (message.type === 'mode-selected') {
        selectedMode = message.mode;
        console.log(`P1 wybrał tryb: ${selectedMode}`);
        showNicknameScreen();
    } else if (message.type === 'nicknames-confirmed') {
        player1Nickname = message.player1Nickname;
        player2Nickname = message.player2Nickname;
        console.log(`Nicki potwierdzone: P1 - ${player1Nickname}, P2 - ${player2Nickname}`);
        startGame();
    } else if (message.type === 'p1-nickname-confirmed') {
        player1Nickname = message.nickname;
        console.log(`P1 potwierdził nick: ${player1Nickname}`);
        const hostIcon = document.querySelector('.host-player-icon img');
        if (hostIcon) {
            hostIcon.src = 'assets/ludeka.png?cache=' + Date.now();
        }
    }
});

socket.on('test-game-joined', (data) => {
    isPlayer1 = data.isHost;
    currentGameCode = data.gameCode;
    const nick = data.nickname;
    if (isPlayer1) player1Nickname = nick;
    else player2Nickname = nick;

    localStorage.setItem('nickname', nick);
    window.location.href = `/gwent/game.html?code=${currentGameCode}&host=${isPlayer1}&nick=${encodeURIComponent(nick)}`;
});

socket.on('test-game-error', (msg) => {
    const msgDiv = document.getElementById('testGameMsg');
    if (msgDiv) {
        msgDiv.textContent = msg;
        msgDiv.style.color = '#ff4d4d';
    } else {
        alert(msg);
    }
});

function submitNickname() {
    let nickname = nicknameInput.value.trim();
    if (!nickname) {
        nickname = nicknameInput.placeholder;
    }
    nicknameInput.disabled = true;

    if (isPlayer1) {
        player1Nickname = nickname;
        localStorage.setItem('nickname', nickname);
        console.log(`P1 wybrał nick: ${player1Nickname}`);
        const hostIcon = document.querySelector('.host-player-icon img');
        if (hostIcon) {
            hostIcon.src = 'assets/ludeka.png?cache=' + Date.now();
        }
        if (player2Id) {
            socket.emit('send-to-p2', { player2Id, message: { type: 'p1-nickname-confirmed', nickname: player1Nickname } });
        }
        if (player2Nickname) {
            socket.emit('send-to-p2', { player2Id, message: { type: 'nicknames-confirmed', player1Nickname, player2Nickname } });
            startGame();
        }
    } else {
        localStorage.setItem('nickname', nickname);
        const gameCode = document.querySelector('.code-input').value.trim();
        socket.emit('send-to-p1', { gameCode, message: { type: 'submit-nickname', nickname } });
        const opponentIcon = document.querySelector('.opponent-player-icon img');
        if (opponentIcon) {
            opponentIcon.src = 'assets/ludeka.png?cache=' + Date.now();
        }
    }
}

// Referencje do elementów
const infoScreen = document.getElementById('infoScreen');

// Pokaż stronę I (Informacje)
function showInfoScreen() {
    fadeOut(mainMenu, () => {
        fadeIn(infoScreen);
    });
}

// Pokaż menu główne (strona A)
function showMainMenu() {
    fadeOut(infoScreen, () => {
        fadeIn(mainMenu);
    });
}

// Funkcje powrotu
function goBackFromHostScreen() {
    fadeOut(hostScreen, () => {
        fadeIn(mainMenu);
        if (isPlayer1) {
            socket.emit('p1Left');
            socket.disconnect();
        }
        resetGameState();
    });
}

function goBackFromJoinScreen() {
    fadeOut(joinScreen, () => {
        fadeIn(mainMenu);
        if (!isPlayer1) {
            socket.emit('p2Left', 'Przeciwnik opuścił grę.');
            socket.disconnect();
        }
        resetGameState();
    });
}

function goBackFromLoadingScreen() {
    fadeOut(loadingScreen, () => {
        fadeIn(mainMenu);
        if (!isPlayer1) {
            socket.emit('p2Left', 'Przeciwnik opuścił grę.');
            socket.disconnect();
        }
        resetGameState();
    });
}

function goBackFromNicknameScreen() {
    if (isPlayer1) {
        fadeOut(nicknameScreen, () => {
            fadeIn(hostScreen);
            socket.emit('p1Left');
        });
    } else {
        fadeOut(nicknameScreen, () => {
            fadeIn(mainMenu);
            socket.emit('p2Left', 'Przeciwnik opuścił grę.');
            socket.disconnect();
            resetGameState();
        });
    }
}

socket.on('opponent-left', (message) => {
    fadeOut(nicknameScreen, () => {
        fadeIn(loadingScreen);
    });
});

// Dźwięk dla przycisku Back
const backButtons = document.querySelectorAll('.back-button');
backButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        const backHoverSound = new Audio('assets/hover-sound.mp3');
        backHoverSound.play();
    });
});

// Funkcjonalność Test Game
window.startTestGame = function () {
    socket.emit('find-test-game');
    const msgDiv = document.getElementById('testGameMsg');
    if (msgDiv) msgDiv.textContent = 'Łączenie z grą testową...';
};

// Nadpisz showMainMenu, by czyścić lobby testowe po powrocie do menu
const origShowMainMenu = window.showMainMenu;
window.showMainMenu = function () {
    let lobby = JSON.parse(localStorage.getItem('testGameLobby') || '{}');
    const nick = localStorage.getItem('nickname');
    if (lobby && nick && lobby[nick]) {
        delete lobby[nick];
        localStorage.setItem('testGameLobby', JSON.stringify(lobby));
    }
    if (typeof origShowMainMenu === 'function') origShowMainMenu();
};