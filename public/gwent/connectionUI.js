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

        // Jeśli mamy nick od razu, poinformujmy serwer
        if (this.nickname) {
            this.socket.emit('set-nickname', { gameCode: this.gameCode, isHost: this.isHost, nickname: this.nickname });
        }
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
            align-items: center;
            gap: 12px;
            z-index: 10000;
            font-family: 'PFDinTextCondPro-Bold', 'Cinzel', serif;
            color: #fff;
            background: rgba(0, 0, 0, 0.4);
            padding: 8px 16px;
            border-radius: 8px;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;

        const dot = document.createElement('div');
        dot.id = 'connection-status-dot';
        dot.style.cssText = `
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #ffde00; /* Yellow default */
            box-shadow: 0 0 8px currentColor;
        `;

        const text = document.createElement('div');
        text.id = 'connection-status-text';
        text.textContent = 'Łączenie...';
        text.style.fontSize = '24px';
        text.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';

        container.appendChild(dot);
        container.appendChild(text);
        document.body.appendChild(container);

        this.dot = dot;
        this.text = text;
    },

    setupListeners() {
        this.socket.on('connect', () => {
            console.log('Połączono z serwerem');
            // Przy ekreacji/rejoin wysyłamy nick jeśli go mamy
            if (this.nickname) {
                this.socket.emit('set-nickname', { gameCode: this.gameCode, isHost: this.isHost, nickname: this.nickname });
            }
        });

        this.socket.on('opponent-status', (data) => {
            console.log('Status przeciwnika:', data);
            const opponentConnected = this.isHost ? data.opponentConnected : data.hostConnected;
            const oppNick = this.isHost ? data.opponentNickname : data.hostNickname;

            this.opponentNickname = oppNick || 'Przeciwnik';

            if (opponentConnected) {
                this.updateStatus('connected');
            } else {
                this.updateStatus('disconnected');
            }
        });

        this.socket.on('disconnect', () => {
            this.updateStatus('reconnecting');
        });
    },

    updateStatus(status) {
        this.status = status;
        if (!this.dot || !this.text) return;

        switch (status) {
            case 'connected':
                this.dot.style.backgroundColor = '#2ecc71'; // Green
                this.dot.style.color = '#2ecc71';
                this.text.textContent = `${this.opponentNickname}: Połączono`;
                break;
            case 'disconnected':
                this.dot.style.backgroundColor = '#e74c3c'; // Red
                this.dot.style.color = '#e74c3c';
                this.text.textContent = `${this.opponentNickname}: Utracono połączenie`;
                break;
            case 'reconnecting':
                this.dot.style.backgroundColor = '#ffde00'; // Yellow
                this.dot.style.color = '#ffde00';
                this.text.textContent = `Łączenie...`;
                break;
        }
    }
};

window.ConnectionUI = ConnectionUI;
