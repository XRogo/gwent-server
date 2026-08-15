// connectionUI.js - Status połączenia z przeciwnikiem
const ConnectionUI = {
    init(socket, gameCode, isPlayer1, currentNickname) {
        this.socket = socket;
        this.gameCode = gameCode;
        this.isPlayer1 = isPlayer1;
        this.nickname = currentNickname;
        this.opponentNickname = null;
        this.status = 'connecting'; 

        this.injectUI();
        this.setupListeners();
        this.restoreFS();

        console.log('ConnectionUI zainicjalizowane');
    },

    restoreFS() {
        if (localStorage.getItem('gwent_fullscreen_pref') === 'true') {
            setTimeout(() => {
                const b = document.createElement('div');
                b.id = 'fs-restore-prompt';
                b.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:20000;background:#c7a76e;border:2px solid #000;padding:10px 20px;color:#000;font-weight:bold;cursor:pointer;font-family:sans-serif;box-shadow:0 0 10px rgba(0,0,0,0.5);';
                b.textContent = 'KLIKNIJ BY PRZYWRÓCIĆ PEŁNY EKRAN';
                b.onclick = () => { this.toggleFS(); b.remove(); };
                document.body.appendChild(b);
                setTimeout(() => { if(b.parentNode) b.remove(); }, 8000);
            }, 1000);
        }
    },

    toggleFS() {
        const d = document;
        const e = d.documentElement;
        const isFS = !!(d.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement);

        if (!isFS) {
            const req = e.requestFullscreen || e.webkitRequestFullscreen || e.mozRequestFullScreen || e.msRequestFullscreen;
            if (req) {
                req.call(e).then(() => {
                    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
                }).catch(() => {});
            }
        } else {
            const can = d.exitFullscreen || d.webkitExitFullscreen || d.mozCancelFullScreen || d.msExitFullscreen;
            if (can) can.call(d);
        }
    },

    injectUI() {
        if (document.getElementById('connection-status-container')) return;

        const isMobile = window.innerWidth <= 768;

        const container = document.createElement('div');
        container.id = 'connection-status-container';
        container.style.cssText = `
            position: fixed;
            bottom: ${isMobile ? '10px' : '32px'};
            left: ${isMobile ? '10px' : '32px'};
            display: flex;
            flex-direction: column;
            gap: 2px;
            z-index: 10000;
            font-family: 'PFDinTextCondPro-Bold', 'Cinzel', serif;
            color: #fff;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;

        const oppLabel = document.createElement('div');
        oppLabel.id = 'opponent-name-label';
        oppLabel.style.cssText = `
            font-size: ${isMobile ? '14px' : '20px'};
            color: #a69377;
            text-shadow: 1px 1px 2px #000;
            margin-left: ${isMobile ? '12px' : '28px'};
        `;
        oppLabel.textContent = '';

        const statusRow = document.createElement('div');
        statusRow.style.cssText = `
            display: flex;
            align-items: center;
            gap: ${isMobile ? '6px' : '12px'};
            background: rgba(0, 0, 0, 0.4);
            padding: ${isMobile ? '4px 8px' : '8px 16px'};
            border-radius: 8px;
            pointer-events: auto;
        `;

        const dot = document.createElement('div');
        dot.id = 'connection-status-dot';
        dot.style.cssText = `
            width: ${isMobile ? '8px' : '12px'};
            height: ${isMobile ? '8px' : '12px'};
            border-radius: 50%;
            background-color: #ffde00;
            box-shadow: 0 0 6px currentColor;
        `;

        const text = document.createElement('div');
        text.id = 'connection-status-text';
        text.textContent = 'Łączenie...';
        text.style.fontSize = `${isMobile ? '16px' : '24px'}`;
        text.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';

        const fBtn = document.createElement('div');
        fBtn.style.cssText = `width:${isMobile?'20px':'28px'};height:${isMobile?'20px':'28px'};margin-left:10px;cursor:pointer;display:flex;align-items:center;`;
        const fImg = document.createElement('img');
        fImg.src = 'assets/powiek.webp';
        fImg.style.width = '100%';
        fImg.style.height = '100%';
        fBtn.onclick = (e) => { e.stopPropagation(); this.toggleFS(); };
        fBtn.appendChild(fImg);
        this.fImg = fImg;

        statusRow.appendChild(dot);
        statusRow.appendChild(text);
        statusRow.appendChild(fBtn);
        container.appendChild(oppLabel);
        container.appendChild(statusRow);
        document.body.appendChild(container);

        this.dot = dot;
        this.text = text;
        this.oppLabel = oppLabel;

        const updateIcon = () => {
            const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            if (this.fImg) this.fImg.src = isFS ? 'assets/pomiek.webp' : 'assets/powiek.webp';
        };
        document.addEventListener('fullscreenchange', updateIcon);
        document.addEventListener('webkitfullscreenchange', updateIcon);
        document.addEventListener('mozfullscreenchange', updateIcon);

        this.startConnectionTimer();
    },

    startConnectionTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timeRemaining = 300; 

        this.timerInterval = setInterval(() => {
            if (this.status === 'connected') return;

            this.timeRemaining--;
            if (this.timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                this.updateStatus('timeout');
                return;
            }

            const mins = Math.floor(this.timeRemaining / 60);
            const secs = this.timeRemaining % 60;
            const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            if (this.status !== 'connected') {
                this.text.textContent = `Łączenie... ${timeStr}`;
            }
        }, 1000);
    },

    setupListeners() {
        this.socket.on('connect', () => {
            if (this.nickname) {
                this.socket.emit('set-nickname', { gameCode: this.gameCode, isPlayer1: this.isPlayer1, nickname: this.nickname });
            }
        });

        this.socket.on('opponent-status', (data) => {
            if (data.player1Id && this.socket.id) {
                this.isPlayer1 = (this.socket.id === data.player1Id);
            }
            const oppNick = this.isPlayer1 ? data.player2Nickname : data.player1Nickname;
            const opponentConnected = this.isPlayer1 ? data.player2Connected : data.player1Connected;

            window.opponentConnected = opponentConnected;
            const btn = document.getElementById('goToGameButton');
            if (btn) {
                if (opponentConnected) {
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                } else {
                    btn.style.opacity = '0.5';
                    btn.style.pointerEvents = 'none';
                }
            }

            if (oppNick) {
                this.opponentNickname = oppNick;
                if (this.oppLabel) this.oppLabel.textContent = oppNick;
            }

            if (opponentConnected) this.updateStatus('connected');
            else this.updateStatus('reconnecting');
        });

        this.socket.on('disconnect', () => {
            this.updateStatus('reconnecting');
            this.startConnectionTimer();
        });
    },

    updateStatus(status) {
        this.status = status;
        if (!this.dot || !this.text) return;

        switch (status) {
            case 'connected':
                this.dot.style.backgroundColor = '#2ecc71';
                this.text.textContent = 'Połączono';
                break;
            case 'disconnected':
            case 'reconnecting':
                this.dot.style.backgroundColor = '#ffde00';
                this.text.textContent = 'Łączenie...';
                break;
            case 'timeout':
                this.dot.style.backgroundColor = '#e74c3c';
                this.text.textContent = 'Rozłączono';
                setTimeout(() => { window.location.href = '/'; }, 15000);
                break;
        }
    }
};

window.ConnectionUI = ConnectionUI;
