// connectionUI.js - Status połączenia z przeciwnikiem
const ConnectionUI = {
    init(socket, gameCode, isHost, currentNickname) {
        this.socket = socket;
        this.gameCode = gameCode;
        this.isHost = isHost;
        this.nickname = currentNickname;
        this.opponentNickname = null;
        this.status = 'connecting'; // connecting, connected, disconnected

        this.injectUI();
        this.setupListeners();

        // Nie wysyłamy set-nickname tutaj, bo i tak zostanie wysłane 
        // przy rejoin-game zaraz po init() w game.js/gra.js
        // lub przy zdarzeniu 'connect' w setupListeners.
        console.log('ConnectionUI zainicjalizowane dla:', this.nickname);
    },

    injectUI() {
        if (document.getElementById('connection-status-container')) return;

        const container = document.createElement('div');
        container.id = 'connection-status-container';
        container.style.cssText = `
            position: fixed;
            bottom: 32px;
            left: 32px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            z-index: 10000;
            font-family: 'PFDinTextCondPro-Bold', 'Cinzel', serif;
            color: #fff;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;

        const oppLabel = document.createElement('div');
        oppLabel.id = 'opponent-name-label';
        oppLabel.style.cssText = `
            font-size: 20px;
            color: #a69377;
            text-shadow: 1px 1px 2px #000;
            margin-left: 28px;
        `;
        oppLabel.textContent = '';

        const statusRow = document.createElement('div');
        statusRow.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(0, 0, 0, 0.4);
            padding: 8px 16px;
            border-radius: 8px;
        `;

        const dot = document.createElement('div');
        dot.id = 'connection-status-dot';
        dot.style.cssText = `
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #ffde00;
            box-shadow: 0 0 8px currentColor;
        `;

        const text = document.createElement('div');
        text.id = 'connection-status-text';
        text.textContent = 'Łączenie... 05:00';
        text.style.fontSize = '24px';
        text.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';

        statusRow.appendChild(dot);
        statusRow.appendChild(text);
        container.appendChild(oppLabel);
        container.appendChild(statusRow);
        document.body.appendChild(container);

        this.dot = dot;
        this.text = text;
        this.oppLabel = oppLabel;

        this.startConnectionTimer();
    },

    startConnectionTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timeRemaining = 300; // 5 minut

        this.timerInterval = setInterval(() => {
            if (this.status === 'connected') {
                return;
            }

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
        console.log('Uruchamiam listenery ConnectionUI');

        this.socket.on('connect', () => {
            console.log('ConnectionUI: Połączono z serwerem');
            if (this.nickname) {
                this.socket.emit('set-nickname', { gameCode: this.gameCode, isHost: this.isHost, nickname: this.nickname });
            }
        });

        this.socket.on('opponent-status', (data) => {
            // Re-verify isHost based on authoritative server data
            if (data.hostId) {
                this.isHost = (this.socket.id === data.hostId);
            }

            // If I am Host, I want to see the Opponent's name.
            // If I am Opponent, I want to see the Host's name.
            const oppNick = this.isHost ? data.opponentNickname : data.hostNickname;
            const opponentConnected = this.isHost ? data.opponentConnected : data.hostConnected;

            if (oppNick) {
                this.opponentNickname = oppNick;
                if (this.oppLabel) this.oppLabel.textContent = oppNick;
            } else if (!this.opponentNickname) {
                this.opponentNickname = this.isHost ? "Gość" : "Gospodarz";
                if (this.oppLabel) this.oppLabel.textContent = this.opponentNickname;
            }

            if (opponentConnected) {
                this.updateStatus('connected');
            } else {
                this.updateStatus('disconnected');
            }
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
                this.dot.style.color = '#2ecc71';
                this.text.textContent = `Połączono`;
                break;
            case 'disconnected':
                this.dot.style.backgroundColor = '#e74c3c';
                this.dot.style.color = '#e74c3c';
                this.text.textContent = `Utracono połączenie`;
                break;
            case 'reconnecting':
                this.dot.style.backgroundColor = '#ffde00';
                this.dot.style.color = '#ffde00';
                break;
            case 'timeout':
                this.dot.style.backgroundColor = '#e74c3c';
                this.dot.style.color = '#e74c3c';
                this.text.textContent = `Rozłączono`;
                // Redirect after 15s
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 15000);
                break;
        }
    }
};

window.ConnectionUI = ConnectionUI;
