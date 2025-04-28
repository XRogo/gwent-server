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
let isHost = false;
let isJoined = false;
let hasJoined = false;
let opponentJoined = false;
let opponentId = null;
let hostId = null;
let hostNickname = null;
let opponentNickname = null;

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
        isHost = true;
        generateGameCode();
        const gameCode = gameCodeElement.textContent;
        socket.emit('create-game', { gameCode });
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
    if (isHost) {
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
    const code = Math.floor(100000 + Math.random() * 900000);
    gameCodeElement.textContent = code;
    gameLinkElement.textContent = `https://gwent-1vs1.onrender.com/?game=${code}`;
}

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
    if (hasJoined) {
        alert('Już dołączyłeś do gry!');
        return;
    }
    if (gameCode) {
        socket.emit('join-game', { gameCode });
    } else {
        alert('Wprowadź kod gry!');
    }
}

function selectMode(mode) {
    if (!isHost) return;
    if (!opponentJoined || !opponentId) {
        alert('Przeciwnik opuścił grę. Czekaj na nowego gracza.');
        return;
    }
    selectedMode = mode;
    socket.emit('send-to-opponent', { opponentId, message: { type: 'mode-selected', mode } });
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
    fadeOut(nicknameScreen, () => {
        fadeIn(gameScreen);
        hostNicknameElement.textContent = hostNickname || 'Brak';
        opponentNicknameElement.textContent = opponentNickname || 'Brak';
    });
}

function resetGameState() {
    selectedMode = null;
    isHost = false;
    isJoined = false;
    hasJoined = false;
    opponentJoined = false;
    opponentId = null;
    hostId = null;
    hostNickname = null;
    opponentNickname = null;
    resetHostUI();
}

socket.on('join-success', (data) => {
    console.log('Dołączono do gry:', data.gameCode);
    isJoined = true;
    hasJoined = true;
    if (data.isHost) {
        console.log('Jesteś hostem.');
        isHost = true;
    } else {
        console.log('Przeciwnik dołączył, przechodzę na stronę C.5');
        hostId = data.hostId;
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
    opponentId = data.opponentId;
    opponentJoined = true;
    setTimeout(updateHostUI, 100);
});

socket.on('opponent-left', (message) => {
    alert(message);
    if (isHost) {
        selectedMode = null;
        isJoined = false;
        hasJoined = false;
        opponentJoined = false;
        opponentId = null;
        hostNickname = null;
        opponentNickname = null;
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

socket.on('message-from-opponent', (data) => {
    const { opponentId: senderId, message } = data;
    if (message.type === 'submit-nickname') {
        opponentNickname = message.nickname;
        console.log(`Przeciwnik wybrał nick: ${opponentNickname}`);
        const opponentIcon = document.querySelector('.opponent-player-icon img');
        if (opponentIcon) {
            opponentIcon.src = 'assets/ludeka.png?cache=' + Date.now();
        }
        if (hostNickname && opponentNickname) {
            socket.emit('send-to-opponent', { opponentId: senderId, message: { type: 'nicknames-confirmed', hostNickname, opponentNickname } });
            startGame();
        }
    }
});

socket.on('message-from-host', (message) => {
    if (message.type === 'mode-selected') {
        selectedMode = message.mode;
        console.log(`Host wybrał tryb: ${selectedMode}`);
        showNicknameScreen();
    } else if (message.type === 'nicknames-confirmed') {
        hostNickname = message.hostNickname;
        opponentNickname = message.opponentNickname;
        console.log(`Nicki potwierdzone: Host - ${hostNickname}, Przeciwnik - ${opponentNickname}`);
        startGame();
    } else if (message.type === 'host-nickname-confirmed') {
        hostNickname = message.nickname;
        console.log(`Host potwierdził nick: ${hostNickname}`);
        const hostIcon = document.querySelector('.host-player-icon img');
        if (hostIcon) {
            hostIcon.src = 'assets/ludeka.png?cache=' + Date.now();
        }
    }
});

function submitNickname() {
    let nickname = nicknameInput.value.trim();
    if (!nickname) {
        nickname = nicknameInput.placeholder;
    }
    nicknameInput.disabled = true;

    if (isHost) {
        hostNickname = nickname;
        console.log(`Host wybrał nick: ${hostNickname}`);
        const hostIcon = document.querySelector('.host-player-icon img');
        if (hostIcon) {
            hostIcon.src = 'assets/ludeka.png?cache=' + Date.now();
        }
        if (opponentId) {
            socket.emit('send-to-opponent', { opponentId, message: { type: 'host-nickname-confirmed', nickname: hostNickname } });
        }
        if (opponentNickname) {
            socket.emit('send-to-opponent', { opponentId, message: { type: 'nicknames-confirmed', hostNickname, opponentNickname } });
            startGame();
        }
    } else {
        const gameCode = document.querySelector('.code-input').value.trim();
        socket.emit('send-to-host', { gameCode, message: { type: 'submit-nickname', nickname } });
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

function goBackFromHostScreen() {
    fadeOut(hostScreen, () => {
        fadeIn(mainMenu);
        resetGameState();
    });
}

function goBackFromJoinScreen() {
    fadeOut(joinScreen, () => {
        fadeIn(mainMenu);
        resetGameState();
    });
}

function goBackFromLoadingScreen() {
    fadeOut(loadingScreen, () => {
        fadeIn(joinScreen);
    });
}

function goBackFromNicknameScreen() {
    if (isHost) {
        fadeOut(nicknameScreen, () => {
            fadeIn(hostScreen);
            socket.emit('hostLeft');
        });
    } else {
        fadeOut(nicknameScreen, () => {
            fadeIn(mainMenu);
            socket.emit('opponentLeft', 'Przeciwnik opuścił grę.');
        });
    }
}

socket.on('hostLeft', () => {
    fadeOut(nicknameScreen, () => {
        fadeIn(loadingScreen);
    });
});

// Nowa funkcja do odtwarzania dźwięku dla przycisku Back
const backButtons = document.querySelectorAll('.back-button');
backButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
        const backHoverSound = new Audio('assets/hover-sound.mp3');
        backHoverSound.play();
    });
});