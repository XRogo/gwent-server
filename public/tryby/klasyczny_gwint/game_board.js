import cards from './cards.js';
import { renderCardHTML } from './bcard_render.js';
import { showPowiek, renderPowiek } from './rcard.js';
import { krole } from './krole.js';
import { showPrzejscie, hidePrzejscie, getIsShowing } from './przejsciakod.js';
import { animateLeaderFromDeck, animateOpponentLeaderFromDeck, animateDeckToHand, animateBoardToGraveyard, animateCardToDeck, animateElement, getElement4KPos } from './animacje.js';

// Preload card images to avoid flickering when they appear in hand/board
function preloadCardImages() {
    console.log("[BOARD] Preloading card assets...");
    cards.forEach(card => {
        if (card.karta) {
            const img = new Image();
            img.src = card.karta;
        }
    });

    // Usunięto preload rewersów powodujący błędy 404 u przeciwnika (np. polnoc_rewers.webp)
}
preloadCardImages();

// --- GLOBALNE FUNKCJE POMOCNICZE (DOSTĘPNE DLA WSZYSTKICH) ---
const getBaseSound = (card, data) => {
    if (card.moc === 'szpieg')      return 'szpiegSound';
    if (card.bohater)          return 'zagranieBohateraSound';
    if (card.moc === 'manek' || card.numer === '001')  return 'manekinSound';
    if (card.moc === 'rog' && (card.numer === '002' || typeof card.punkty !== 'number')) return 'rogDowodcySound';
    if (card.moc === 'rog') return 'rogDowodcySound';
    if (card.moc === 'mroz')   return 'mrozSound';
    if (card.moc === 'mgla')   return 'mglaSound';
    if (card.moc === 'deszcz') return 'deszczSound';
    if (card.moc === 'niebo')  return 'czystenieboSound';
    if (card.moc === 'sztorm') return 'sztormSound';
    if (card.pozycja === 3)    return 'zagranie3Sound';
    if (card.pozycja === 2 && !card.bohater && card.moc !== 'manek') return 'zagranie2Sound';
    return 'zagranie1Sound';
};

const markArrivedInState = (numer, player, board, specificSlotKey = null) => {
    if (specificSlotKey) {
        window.arrivedBoardCards.add(specificSlotKey);
    } else {
        let found = false;
        Object.keys(board).forEach(rk => {
            if (found) return;
            const row = board[rk];
            if (Array.isArray(row)) {
                row.forEach((n, i) => {
                    if (found) return;
                    const key = `${rk}_${i}`;
                    if (String(n) === String(numer) && !window.arrivedBoardCards.has(key)) {
                        window.arrivedBoardCards.add(key);
                        found = true;
                    }
                });
            }
        });
    }
    renderAll(currentNick);
};

const runDecoyFlyBack = async (decoyDetails, from4K) => {
    const replacedCard = cards.find(c => String(c.numer) === String(decoyDetails.replacedNumer));
    if (!replacedCard) return;

    await new Promise(resolve => {
        const el = createAnimationCardElement(replacedCard, 180, 239);
        const isMyDecoy = decoyDetails.row.startsWith(isPlayer1Local ? 'p1' : 'p2');
        const to4K = isMyDecoy ? { x: 2090, y: 1811 } : { x: 2090, y: -300 };
        
        animateElement(el, from4K, to4K, 180, 239, () => {
             if (window.playSound) window.playSound('addCardSpySound');
             resolve();
        }, 50, 66);

        // Trigger manual move and shrink
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
            const bL = (window.innerWidth - 3840 * scale) / 2;
            const bT = (window.innerHeight - 2160 * scale) / 2;
            el.style.left = `${to4K.x * scale + bL}px`;
            el.style.top = `${to4K.y * scale + bT}px`;
            el.style.width = `${50 * scale}px`;
            el.style.height = `${66 * scale}px`;
        }));
    });
};


function reconcileArrivedCards(board, excludeNumerStrings = []) {
    if (!board) return;
    Object.keys(board).forEach(rk => {
        const row = board[rk];
        if (Array.isArray(row)) {
            row.forEach((num, idx) => {
                const key = `${rk}_${idx}`;
                // Dodajemy tylko te, których nie ma w arrived I które nie lądują teraz (exclude)
                if (!window.arrivedBoardCards.has(key) && !excludeNumerStrings.includes(String(num))) {
                    window.arrivedBoardCards.add(key);
                }
            });
        }
    });
}

const handleCardAnimationSequence = async (data) => {
    const isMe = data.lastPlayedBy === (isPlayer1Local ? 'p1' : 'p2');
    const usedSlotsInSequence = new Set();
    
    // Zapamiętujemy stan więzi sprzed tej sekwencji (do utrzymania płynności punktów)
    window.bondPreviousCounts = {};
    Object.keys(data.board).forEach(rk => {
        const row = data.board[rk];
        if (Array.isArray(row)) {
            const countedNumers = new Set(row.map(n => String(n)));
            countedNumers.forEach(sNum => {
                const bKey = `${rk}_${sNum}`;
                let arrivedCount = 0;
                row.forEach((n, i) => {
                    if (String(n) === sNum && window.arrivedBoardCards.has(`${rk}_${i}`)) {
                        arrivedCount++;
                    }
                });
                window.bondPreviousCounts[bKey] = arrivedCount;
            });
        }
    });

    window.bondMultiplierActive = false;

    // Obsługa manekina: Zapamiętanie wizualnego placeholders przed animacją
    if (data.decoyDetails) {
        const d = data.decoyDetails;
        window.activeDecoySequences.set(`${d.row}_${d.index}`, String(d.replacedNumer));
        renderAll(currentNick);
    }


    // 1. ZAGRANA KARTA (lastPlayedCard)
    const lp = data.lastPlayedCard;
    const lpc = cards.find(c => String(c.numer) === String(lp));
    
    if (lpc) {
        let rowKey = "";
        let cardIdx = -1;
        if (data.targetSlot) {
            rowKey = data.targetSlot.row;
            cardIdx = data.targetSlot.index;
            usedSlotsInSequence.add(`${rowKey}_${cardIdx}`);
        } else if (data.decoyDetails) {
            rowKey = data.decoyDetails.row;
            cardIdx = data.decoyDetails.index;
            usedSlotsInSequence.add(`${rowKey}_${cardIdx}`);
        } else {
            Object.keys(data.board).forEach(rk => {
                if (cardIdx !== -1) return;
                const row = data.board[rk];
                if (Array.isArray(row)) {
                    row.forEach((num, i) => {
                        if (cardIdx !== -1) return;
                        if (String(num) === String(lp) && !usedSlotsInSequence.has(`${rk}_${i}`) && !window.arrivedBoardCards.has(`${rk}_${i}`)) {
                            rowKey = rk;
                            cardIdx = i;
                            usedSlotsInSequence.add(`${rk}_${i}`);
                        }
                    });
                }
            });
        }

        // Wyszukaj placeholder
        const placeholder = document.getElementById(`slot-placeholder-${rowKey}_${cardIdx}`);
        let to4K = { x: 1412 + 1609/2, y: 1000 }; // Fallback
        if (placeholder) {
            to4K = getElement4KPos(placeholder);
        }

        if (data.isFromGraveyard) {
            // Animacja wskrzeszenia prosto z cmentarza (medyk)
            // isOpponentGraveyard = true jeśli karta NIE pochodzi z mojego cmentarza
            await new Promise(resolve => {
                const from4K = data.isOpponentGraveyard ? { x: 3110, y: 168 } : { x: 3110, y: 1682 };
                const el = createAnimationCardElement(lpc, 180, 239);
                animateElement(el, from4K, to4K, 180, 239, async () => {
                    const baseSound = getBaseSound(lpc, data);
                    
                    if (data.decoyDetails) {
                        const d = data.decoyDetails;
                        window.activeDecoySequences.delete(`${d.row}_${d.index}`);
                    }
                    
                    markArrivedInState(lp, data.lastPlayedBy, data.board, `${rowKey}_${cardIdx}`);
                    
                    if (data.decoyDetails) {
                        await runDecoyFlyBack(data.decoyDetails, to4K);
                    }

                    if (window.playSound) window.playSound(baseSound, resolve);
                    else resolve();
                }, 180, 239);

                requestAnimationFrame(() => requestAnimationFrame(() => {
                    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
                    const bL = (window.innerWidth - 3840 * scale) / 2;
                    const bT = (window.innerHeight - 2160 * scale) / 2;
                    el.style.left = `${to4K.x * scale + bL}px`;
                    el.style.top = `${to4K.y * scale + bT}px`;
                    el.style.width = `${180 * scale}px`;
                    el.style.height = `${239 * scale}px`;
                }));
            });
        } else if (!isMe) {
            // Animacja przeciwnika: Start (Środek góry) -> Podgląd (Prawa strona HD) -> Cel (Slot)
            await new Promise(resolve => {
                const preview4K = { x: 3120, y: 1080 - 992/2 };
                const start4K = { x: 1920, y: -300 }; // Środek góry (ręka przeciwnika)
                
                // FAZA 1: Dolot i płynny wzrost do podglądu (używamy animateElement)
                const flyEl = createAnimationCardElement(lpc, 180, 240);
                animateElement(flyEl, start4K, preview4K, 180, 240, () => {
                    // FAZA 2: Podmiana na statyczny podgląd HD (dla ostrości) na 2s
                    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
                    const bL = (window.innerWidth - 3840 * scale) / 2;
                    const bT = (window.innerHeight - 2160 * scale) / 2;

                    const hdEl = createAnimationCardElement(lpc, 523, 992, true, true);
                    hdEl.style.position = 'fixed';
                    hdEl.style.zIndex = '5000';
                    hdEl.style.width = `${523 * scale}px`;
                    hdEl.style.height = `${992 * scale}px`;
                    hdEl.style.left = `${3120 * scale + bL}px`;
                    hdEl.style.top = `${(1080 - 992/2) * scale + bT}px`;
                    document.body.appendChild(hdEl);

                    setTimeout(() => {
                        // FAZA 3: Zip do slotu (zmaleje z powrotem do rozmiaru rzędu)
                        if (hdEl.parentNode) hdEl.parentNode.removeChild(hdEl);

                        const zipEl = createAnimationCardElement(lpc, 180, 239);
                        const zipStart4K = { x: 3315, y: 875 };

                        animateElement(zipEl, zipStart4K, to4K, 180, 239, async () => {
                            // Trafienie w slot
                            if (data.decoyDetails) {
                                const d = data.decoyDetails;
                                window.activeDecoySequences.delete(`${d.row}_${d.index}`);
                            }

                            markArrivedInState(lp, data.lastPlayedBy, data.board, `${rowKey}_${cardIdx}`);

                            if (data.decoyDetails) {
                                await runDecoyFlyBack(data.decoyDetails, to4K);
                            }

                            const finalSound = getBaseSound(lpc, data);
                            if (window.playSound) window.playSound(finalSound, resolve);
                            else resolve();
                        }, 180, 239);

                        // TRIGGER ZIP
                        requestAnimationFrame(() => requestAnimationFrame(() => {
                            zipEl.style.left = `${to4K.x * scale + bL}px`;
                            zipEl.style.top = `${to4K.y * scale + bT}px`;
                            zipEl.style.width = `${180 * scale}px`;
                            zipEl.style.height = `${239 * scale}px`;
                        }));

                    }, 2000);
                }, 523, 992); // Docelowa wielkość fazy 1

                // TRIGGER DOLOT I WZROST
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
                    const bL = (window.innerWidth - 3840 * scale) / 2;
                    const bT = (window.innerHeight - 2160 * scale) / 2;
                    flyEl.style.left = `${preview4K.x * scale + bL}px`;
                    flyEl.style.top = `${preview4K.y * scale + bT}px`;
                    flyEl.style.width = `${523 * scale}px`;
                    flyEl.style.height = `${992 * scale}px`;
                }));
            });
        } else {
            // Animacja gracza: Podgląd -> Cel
            await new Promise(resolve => {
                const zipStart4K = { x: 3315, y: 875 };
                const el = createAnimationCardElement(lpc, 180, 239);
                
                const proposedPreview = document.getElementById('proposed-card-preview');
                if (proposedPreview) proposedPreview.style.display = 'none';

                animateElement(el, zipStart4K, to4K, 180, 239, async () => {
                    const baseSound = getBaseSound(lpc, data);

                    if (data.decoyDetails) {
                        const d = data.decoyDetails;
                        window.activeDecoySequences.delete(`${d.row}_${d.index}`);
                    }

                    markArrivedInState(lp, data.lastPlayedBy, data.board, `${rowKey}_${cardIdx}`);

                    if (data.decoyDetails) {
                        await runDecoyFlyBack(data.decoyDetails, to4K);
                    }

                    if (window.playSound) window.playSound(baseSound, resolve);
                    else resolve();
                }, 180, 239);

                requestAnimationFrame(() => requestAnimationFrame(() => {
                    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
                    const bL = (window.innerWidth - 3840 * scale) / 2;
                    const bT = (window.innerHeight - 2160 * scale) / 2;
                    el.style.left = `${to4K.x * scale + bL}px`;
                    el.style.top = `${to4K.y * scale + bT}px`;
                    el.style.width = `${180 * scale}px`;
                    el.style.height = `${239 * scale}px`;
                }));
            });
        }
    }

    // 2. KARTY WEZWANE (musteredDetails - np. Muster / Medyk)
    // Z pominięciem dużego podglądu i SEKWENCYJNIE!
    if (data.musteredDetails && data.musteredDetails.length > 0) {
        // Po zagraniu pierwszej karty (i jej dźwięku), puszczamy dźwięk wezwania
        await new Promise(resolve => {
            if (window.playSound) window.playSound('wezwanieSound', resolve);
            else resolve();
        });

        const musterList = data.musteredDetails || [];
        const musterAnimations = musterList.map((m) => {
            return new Promise(resolveMuster => {
                const cardObj = cards.find(c => String(c.numer) === String(m.numer));
                if (!cardObj) return resolveMuster();
                
                let rowKey = m.row || "";
                let cardIdx = (m.index !== undefined) ? m.index : -1;

                if (cardIdx === -1) {
                    Object.keys(data.board).forEach(rk => {
                        if (cardIdx !== -1) return;
                        const row = data.board[rk];
                        if (Array.isArray(row)) {
                            row.forEach((num, i) => {
                                if (cardIdx !== -1) return;
                                const key = `${rk}_${i}`;
                                if (String(num) === String(m.numer) && !usedSlotsInSequence.has(key) && !window.arrivedBoardCards.has(key)) {
                                    rowKey = rk;
                                    cardIdx = i;
                                    usedSlotsInSequence.add(key);
                                }
                            });
                        }
                    });
                } else {
                    usedSlotsInSequence.add(`${rowKey}_${cardIdx}`);
                }

                const placeholder = document.getElementById(`slot-placeholder-${rowKey}_${cardIdx}`);
                let to4K = { x: 1412 + 1609/2, y: 1000 };
                if (placeholder) {
                    to4K = getElement4KPos(placeholder);
                }

                let from4K = { x: 2090, y: isMe ? 1811 : -240 }; // default hand
                if (m.source === 'deck') {
                    from4K = isMe ? { x: 3459, y: 1656 } : { x: 3459, y: 132 };
                } else if (m.source === 'graveyard') {
                    from4K = isMe ? { x: 3110, y: 1682 } : { x: 3110, y: 168 };
                } else if (m.source === 'hand') {
                    const handSlot = isMe ? document.getElementById(`hand-card-${m.numer}`) : null;
                    if (handSlot) {
                        from4K = getElement4KPos(handSlot);
                    } else {
                        from4K = isMe ? { x: 2090, y: 1811 } : { x: 1920, y: -300 };
                    }
                }

                const el = createAnimationCardElement(cardObj, 180, 239);
                animateElement(el, from4K, to4K, 180, 239, () => {
                    markArrivedInState(m.numer, data.lastPlayedBy, data.board);
                    const surfaceSound = getBaseSound(cardObj, data);
                    if (window.playSound) window.playSound(surfaceSound, resolveMuster);
                    else resolveMuster();
                });
                
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
                    const bL = (window.innerWidth - 3840 * scale) / 2;
                    const bT = (window.innerHeight - 2160 * scale) / 2;
                    el.style.left = `${to4K.x * scale + bL}px`;
                    el.style.top = `${to4K.y * scale + bT}px`;
                }));
            });
        });

        // Aktywujemy wszystkie animacje na raz (równolegle) po dźwięku 'wezwanieSound'
        await Promise.all(musterAnimations);
    }

    // KROK 3: Sprawdzenie Więzi
    const lpNum = lp ? String(lp) : null;
    const freshNumers = new Set();
    if (lpNum) freshNumers.add(lpNum);
    if (data.musteredDetails) {
        data.musteredDetails.forEach(m => freshNumers.add(String(m.numer)));
    }

    let bondCards = [];
    Object.keys(data.board).forEach(rk => {
        const row = data.board[rk];
        if (Array.isArray(row)) {
            row.forEach(num => {
                const sNum = String(num);
                // Interesują nas tylko rzędy, do których trafiła nowa karta z Więzią
                if (!freshNumers.has(sNum)) return;

                const c = cards.find(x => x.numer === sNum);
                if (c && c.moc === 'wiez') {
                    const count = row.filter(n => String(n) === sNum).length;
                    if (count > 1 && !bondCards.includes(sNum)) {
                        bondCards.push(sNum);
                    }
                }
            });
        }
    });

    if (bondCards.length > 0 && window.playSound) {
        // Czekamy na zakończenie dźwięku wejścia ostatniej karty (szacunkowo 1s po dolocie)
        await new Promise(r => setTimeout(r, 800));
        
        // Odtwarzamy dźwięk więzi
        window.playSound('wiezSound');
        
        // W TYM SAMYM MOMENCIE (gdy zaczyna się dźwięk) aktywujemy mnożnik i aktualizujemy punkty na planszy
        window.bondMultiplierActive = true;
        renderAll(currentNick);

        // Czekamy szacunkowo na koniec dźwięku przed zakończeniem całej sekwencji
        await new Promise(r => setTimeout(r, 1500));
    }
};

let playerHand = [];
let drawPile = [];
let playerGraveyard = [];
let opponentGraveyard = []; // Now full array
let opponentHandCount = 10;
let opponentDeckCount = 12;
let isMulliganActive = false;
// Tablica wyników rund: [{myScore, oppScore, result}] (max 3 rundy)
let roundScoresHistory = [];
let isProcessingMove = false; // Flag to prevent rapid clicks / double playing
let swapsCount = 0;
let playerLives = 2;
let opponentLives = 2;
let playerPassed = false;
let opponentPassed = false;
let playerLeaderObj = null;
let opponentLeaderObj = null;
let currentTurn = null;
let selectedHandIndex = -1;
let currentNick = '';
let isPlayer1Local = false;
let gameCodeLocal = '';
let boardState = {
    p1R1: [], p1R2: [], p1R3: [],
    p2R1: [], p2R2: [], p2R3: [],
    p1S1: null, p1S2: null, p1S3: null, // Horn slots
    p2S1: null, p2S2: null, p2S3: null
};
const factionInfo = {
    "1": { name: "Królestwa Północy", logo: "tpolnoc.webp", reverse: "polnoc_rewers.webp" },
    "2": { name: "Cesarstwo Nilfgaardu", logo: "tnilfgaard.webp", reverse: "nilftgard_rewers.webp" },
    "3": { name: "Scoia'tael", logo: "tscoiatael.webp", reverse: "scoia'tel_rewers.webp" },
    "4": { name: "Potwory", logo: "tpotwory.webp", reverse: "potwory_rewers.webp" },
    "5": { name: "Skellige", logo: "tskellige.webp", reverse: "skelige_rewers.webp" }
};
// Konfiguracja fizycznych współrzędnych rzędów na planszy 4K (3840x2160)
const rowCoords = {
    opp3:  { x: 1412, y: 29,   w: 1609, h: 239 },
    opp2:  { x: 1412, y: 294,  w: 1609, h: 239 },
    opp1:  { x: 1412, y: 565,  w: 1609, h: 239 },
    self1: { x: 1412, y: 863,  w: 1609, h: 239 },
    self2: { x: 1412, y: 1129, w: 1609, h: 239 },
    self3: { x: 1412, y: 1407, w: 1609, h: 239 }
};

window.leaderAnimated = false;
window.opponentLeaderAnimated = false;
window.cardsAnimated = false;
window.arrivedCards = new Set();
window.arrivedBoardCards = new Set(); // Klucze w formacie: "p1R1_0", "p1R1_1" etc.
window.proposedCard = null; // Karta wybrana do potwierdzenia propozycji zagrania
window.proposedTargetRow = null; 
window.bondMultiplierActive = false;
window.activeDecoySequences = new Map(); // Klucz: "rowKey_index", Wartość: numer_zabieranej_karty

function sortHand() {
    playerHand.sort((a, b) => {
        const isSpecialA = (typeof a.punkty !== 'number' || a.typ === 'specjalna');
        const isSpecialB = (typeof b.punkty !== 'number' || b.typ === 'specjalna');

        if (isSpecialA && !isSpecialB) return -1;
        if (!isSpecialA && isSpecialB) return 1;

        if (isSpecialA && isSpecialB) {
            // Obie specjalne - kolejność z cards.js
            const idxA = cards.findIndex(c => c.numer === a.numer);
            const idxB = cards.findIndex(c => c.numer === b.numer);
            return idxA - idxB;
        }

        // Obie jednostki - sortuj po punktach rosnąco
        if (a.punkty !== b.punkty) {
            return a.punkty - b.punkty;
        }

        // Tyle samo punktów - fallback do cards.js
        const idxA = cards.findIndex(c => c.numer === a.numer);
        const idxB = cards.findIndex(c => c.numer === b.numer);
        return idxA - idxB;
    });
}

export function initGameBoard(socket, gameCode, isPlayer1, nick) {
    // Guard: zapobiegaj wielokrotnemu rejestrowaniu listenerów
    if (window._gameBoardInitialized) {
        console.warn('[BOARD] initGameBoard already called, skipping listener setup.');
        socket.emit('get-game-state', { gameCode, isPlayer1 });
        return;
    }
    window._gameBoardInitialized = true;

    window.socket = socket;
    isPlayer1Local = isPlayer1;
    gameCodeLocal = gameCode;
    window.gameCodeLocal = gameCode;
    window.isPlayer1Local = isPlayer1;
    socket.emit('get-game-state', { gameCode, isPlayer1 });

    socket.on('init-game-state', (data) => {
        if (data.hand) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => {
                const c = cards.find(card => card.numer === String(num));
                return c ? { ...c, _id: Math.random() } : null;
            }).filter(Boolean);

            playerHand = mapToObjects(data.hand);
            drawPile = mapToObjects(data.deck);
            playerGraveyard = mapToObjects(data.graveyard);
            opponentGraveyard = mapToObjects(data.opponentGraveyard || []);

            // Since it's init, all cards in hand are "arrived"
            playerHand.forEach(c => window.arrivedCards.add(c));
            window.cardsAnimated = true;

            opponentHandCount = data.opponentHandCount;
            opponentDeckCount = data.opponentDeckCount;
            window.playerFaction = data.faction || localStorage.getItem('faction') || '1';
            window.opponentFaction = data.opponentFaction;
            swapsCount = data.swapsPerformed || 0;
            if (data.opponentNickname) window.opponentNickname = data.opponentNickname;
            if (data.nickname) { nick = data.nickname; currentNick = nick; }

            if (data.leader) playerLeaderObj = krole.find(k => k.numer === data.leader);
            if (data.opponentLeader) opponentLeaderObj = krole.find(k => k.numer === data.opponentLeader);

            playerLives = isPlayer1Local ? (data.p1Lives !== undefined ? data.p1Lives : 2) : (data.p2Lives !== undefined ? data.p2Lives : 2);
            opponentLives = isPlayer1Local ? (data.p2Lives !== undefined ? data.p2Lives : 2) : (data.p1Lives !== undefined ? data.p1Lives : 2);
            playerPassed = isPlayer1Local ? data.p1Passed : data.p2Passed;
            opponentPassed = isPlayer1Local ? data.p2Passed : data.p1Passed;

            if (data.currentTurn) currentTurn = data.currentTurn;
            if (data.board) boardState = data.board;

            sortHand();
            console.log(`[BOARD] Game state initialized. Local: ${nick}, Opponent: ${window.opponentNickname}, Status: ${data.status}`);

            if (!window.gameStarted) {
                if (data.status === 'scoia-decision') {
                    renderAll(nick); // Zawsze wyrenderuj stan (pusta plansza)
                    handleScoiaDecision(socket, gameCode, data.scoiaDecider);
                } else if (data.status === 'playing') {
                    // Mamy ostateczny 'playing' i nie wystartowaliśmy jeszcze gry.
                    hideScoiaUI();
                    renderAll(nick); // Zawsze wyrenderuj stan (pusta plansza)
                    
                    // Decydujemy jaki baner użyć na wejście
                    let startBanner = null;
                    const isMyTurn = data.currentTurn === window.socket.id;
                    
                    if (data.startReason === 'random') {
                        startBanner = isMyTurn ? 't01' : 't02';
                    } else if (data.startReason === 'scoia') {
                        startBanner = isMyTurn ? 't03' : 't04';
                    }

                    if (startBanner) {
                        window.gameStarted = true;
                        hidePrzejscie(true); // Natychmiast ukryj ewentualne komunikaty t13
                        
                        // Animacja dowódcy gracza
                        if (playerLeaderObj) {
                            animateLeaderFromDeck(playerLeaderObj, () => {
                                window.leaderAnimated = true;
                                renderAll(currentNick);
                            });
                        }

                        // Animacja dowódcy przeciwnika
                        if (opponentLeaderObj) {
                            animateOpponentLeaderFromDeck(opponentLeaderObj, () => {
                                window.opponentLeaderAnimated = true;
                                renderAll(currentNick);
                            });
                        }
                        
                        showPrzejscie(startBanner, {
                            customCzas: 2000,
                            onFinish: () => {
                                // Dopiero po banerze prosimy o karty
                                socket.emit('request-initial-draw', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
                            }
                        });
                    } else {
                        // Fallback
                        window.gameStarted = true;
                        if (playerLeaderObj) {
                            animateLeaderFromDeck(playerLeaderObj, () => {
                                window.leaderAnimated = true;
                                renderAll(currentNick);
                            });
                        }
                        if (opponentLeaderObj) {
                            animateOpponentLeaderFromDeck(opponentLeaderObj, () => {
                                window.opponentLeaderAnimated = true;
                                renderAll(currentNick);
                            });
                        }
                        socket.emit('request-initial-draw', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
                    }
                }
            } else {
                renderAll(nick);
            }
        }
    });

    socket.on('card-moved-to-graveyard', (data) => {
        const { card, side } = data;
        const cardObj = cards.find(c => c.numer === card.numer);
        if (cardObj) {
            if (side === 'p1') {
                playerGraveyard.push(cardObj);
            } else {
                opponentGraveyard.push(cardObj);
            }
        }
    });

        socket.on('initial-cards-dealt', (data) => {
        const { hand } = data;
        const handObjects = hand.map(num => {
            const c = cards.find(card => card.numer === String(num));
            return c ? { ...c, _id: Math.random() } : null;
        }).filter(Boolean);
        
        // Aktualizacja lokalnej talii (drawPile) - usuń tylko te wystąpienia które doleciały do ręki
        if (drawPile.length > 0) {
            handObjects.forEach(hCard => {
                const idx = drawPile.findIndex(dCard => dCard.numer === hCard.numer);
                if (idx !== -1) drawPile.splice(idx, 1);
            });
        }

        // Natychmiast otwórz mulligan (animacje lecą "pod" nim)
        playerHand = handObjects;
        sortHand(); 

        const areaLeft = 1163, areaRight = 3018, areaTop = 1691, cardW = 180;
        const count = playerHand.length;
        const totalAreaWidth = (areaRight - areaLeft);
        
        let cardStep = cardW + 5;
        if (count * cardStep > totalAreaWidth) {
            cardStep = (totalAreaWidth - cardW) / (count - 1);
        }
        const occupiedWidth = (count - 1) * cardStep + cardW;
        const startX = (totalAreaWidth - occupiedWidth) / 2;

        const sortedTargets = playerHand.map((_, i) => ({
            x: areaLeft + startX + i * cardStep,
            y: areaTop
        }));

        window.arrivedCards.clear();

        // Rozpoczynamy animację kart do ręki (w tle)
        animateDeckToHand(playerHand, sortedTargets, () => {
            window.cardsAnimated = true;
            renderAll(currentNick);
        }, (index) => {
            window.arrivedCards.add(playerHand[index]);
            renderAll(currentNick);
        });

        startMulligan(socket, gameCodeLocal, isPlayer1Local);
    });

    socket.on('start-phase-resolved', () => {
        // Serwer zakończył fazę decyzji i rozdał karty, prosimy o nowy stan
        socket.emit('get-game-state', { gameCode, isPlayer1 });
    });

    socket.on('mulligan-swap-success', (data) => {
        const { newCard, swapsLeft, cardIndex } = data;
        const oldCardObj = playerHand[cardIndex]; // Save old card for animation
        const rawCard = cards.find(c => c.numer === String(newCard));
        const cardObj = rawCard ? { ...rawCard, _id: Math.random() } : null;

        if (cardObj) {
            playerHand[cardIndex] = cardObj;
            console.log(`[BOARD] Swap successful: Index ${cardIndex} -> ${cardObj.nazwa}`);
            
            // Sync local drawPile - remove the card that just arrived in hand
            const dIdx = drawPile.findIndex(c => String(c.numer) === String(newCard));
            if (dIdx !== -1) drawPile.splice(dIdx, 1);

            renderPowiek();
        }
        swapsCount = 2 - swapsLeft;

        // Visual background animation
        const areaLeft = 1163, areaRight = 3018, areaTop = 1691, cardW = 180;
        const totalCardsWidth = playerHand.length * cardW;
        const startXInHand = areaLeft + (areaRight - areaLeft - totalCardsWidth) / 2 + cardIndex * cardW;

        // Old card back to deck
        if (oldCardObj) {
            animateCardToDeck(oldCardObj, { x: startXInHand, y: areaTop });
        }

        if (swapsLeft <= 0) {
            // 1. Zakończenie wymiany (zamknięcie okna)
            window.mulliganFinished = true; // Set early to avoid onClose redundancy
            if (window.hidePowiek) window.hidePowiek();
            
            // 2. Posortowanie kart (zmienia indeksy w playerHand)
            sortHand();
            
            // Znajdź nowy indeks podmienionej karty po posortowaniu
            const newIndex = playerHand.findIndex(c => c === cardObj);
            
            // Ukryj tylko tę nową kartę dopóki nie doleci (arrivedCards już ma inne)
            window.arrivedCards.delete(cardObj);
            
            // Renderujemy rąkę z "dziurą" na nową kartę
            renderAll(currentNick);

            // Obliczamy pozycję 4K docelową dla nowej karty w posortowanej ręce
            // Używamy getBoundingClientRect na ukrytym elemencie (który renderAll właśnie wstawił)
            const wrappers = document.querySelectorAll('.hand-card-img');
            const targetEl = Array.from(wrappers).find(el => parseInt(el.dataset.index) === newIndex);
            
            const GUI_WIDTH = 3840, GUI_HEIGHT = 2160;
            const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
            const boardLeft = (window.innerWidth - GUI_WIDTH * scale) / 2;
            const boardTop = (window.innerHeight - 2160 * scale) / 2;
            
            let finalTarget = { x: startXInHand, y: areaTop }; // Fallback
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                finalTarget = {
                    x: (rect.left - boardLeft) / scale,
                    y: (rect.top - boardTop) / scale
                };
            }

            // 3. Animacja wymiany do DOCELOWEJ posortowanej pozycji
            animateDeckToHand([cardObj], [finalTarget], () => {
                window.arrivedCards.add(cardObj);
                window.mulliganFinished = true;
                socket.emit('end-mulligan', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
                renderAll(currentNick);
            });

        } else {
            // Animacja dla pojedynczej wymiany
            window.arrivedCards.delete(cardObj);
            renderAll(currentNick);
            animateDeckToHand([cardObj], [{x: startXInHand, y: areaTop}], () => {
                window.arrivedCards.add(cardObj);
                renderAll(currentNick);
            });
        }
    });

    socket.on('start-mulligan-timer', (data) => {
        // Przeciwnik skończył, masz 60s
        // Update timer safely without overriding the mulligan screen
        const timerUI = document.getElementById('powiek-timer');
        if (timerUI) timerUI.textContent = `Pozostały czas: ${data.timeLeft}s`;
    });

    socket.on('wait-for-mulligan', (data) => {
        // Ty skończyłeś, czekasz na przeciwnika
        if (window.mulliganFinished) {
            showPrzejscie('t06', { customOpis: "Czekasz na przeciwnika... {czas}", countDown: data.timeLeft });
        }
    });

    socket.on('mulligan-timer-expired', () => {
        if (window.hidePowiek) window.hidePowiek();
        sortHand();
        window.mulliganFinished = true;
        socket.emit('end-mulligan', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
        renderAll(currentNick);
    });

    socket.on('mulligan-finished-all', () => {
        hidePrzejscie(true); // Close t06 instantly
        showPrzejscie('t05', { onFinish: () => {
            const isMyTurn = currentTurn === window.socket.id;
            showPrzejscie(isMyTurn ? 't07' : 't08');
        }});
    });

    socket.on('turn-info', (data) => {
        const { myTurn } = data;
        currentTurn = myTurn ? window.socket.id : 'opponent_id';
        showPrzejscie(myTurn ? 't07' : 't08');
        renderAll(nick);
    });

    socket.on('opponent-game-update', (data) => {
        if (data.handCount !== undefined) opponentHandCount = data.handCount;
        if (data.deckCount !== undefined) opponentDeckCount = data.deckCount;
        if (data.graveyard) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === String(num))).filter(Boolean);
            opponentGraveyard = mapToObjects(data.graveyard);
        }
        if (data.faction !== undefined) window.opponentFaction = data.faction;
        renderAll(nick);
    });

    socket.on('update-deck', (data) => {
        if (data.deck) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === num)).filter(Boolean);
            drawPile = mapToObjects(data.deck);
            renderAll(nick);
        }
    });

    socket.on('board-updated', (data) => {
        console.log("[BOARD] Received board-updated:", data);
        const prevTurn = currentTurn;
        boardState = data.board;
        currentTurn = data.currentTurn;

        // --- SYNCHRONIZACJA WIDOCZNOŚCI ---
        // Wyłączamy z natychmiastowej widoczności tylko te karty, które właśnie "lądują" (animacja).
        const excludeList = [];
        if (data.lastPlayedCard) excludeList.push(String(data.lastPlayedCard));
        if (data.musteredDetails) {
            data.musteredDetails.forEach(m => excludeList.push(String(m.numer)));
        }
        reconcileArrivedCards(data.board, excludeList);
        // ---------------------------------

        const newOppHandCount = isPlayer1Local ? data.p2HandCount : data.p1HandCount;
        
        // Sync local hand if provided by server
        const serverHand = isPlayer1Local ? data.p1Hand : data.p2Hand;
        if (serverHand) {
            syncHand(serverHand);
        }
        
        if (data.lastPlayedCard) {
            if (data.isFromGraveyard) {
                // Serwer jawnie mówi że karta wskrzeszona z cmentarza (medyk)
                const isMe = data.lastPlayedBy === (isPlayer1Local ? 'p1' : 'p2');
                data.isOpponentGraveyard = !isMe; // Karta wskrzeszona ze SWOJEGO cmentarza = nie-opponent
            } else {
                let cameFromGy = false;
                let oppGy = false;
                // Sprawdzamy stan zanim go nadpiszemy z serwera
                if (playerGraveyard.some(c => c.numer === String(data.lastPlayedCard))) {
                    cameFromGy = true; oppGy = false;
                } else if (opponentGraveyard.some(c => c.numer === String(data.lastPlayedCard))) {
                    cameFromGy = true; oppGy = true;
                }
                data.isFromGraveyard = cameFromGy;
                data.isOpponentGraveyard = oppGy;
            }
        }

        if (data.p1Graveyard) {
            const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === String(num))).filter(Boolean);
            playerGraveyard = mapToObjects(isPlayer1Local ? data.p1Graveyard : data.p2Graveyard);
            opponentGraveyard = mapToObjects(isPlayer1Local ? data.p2Graveyard : data.p1Graveyard);
        }

        if (prevTurn !== currentTurn && !playerPassed && !opponentPassed) {
            playerLives = isPlayer1Local ? data.p1Lives : data.p2Lives;
            opponentLives = isPlayer1Local ? data.p2Lives : data.p1Lives;
            playerPassed = isPlayer1Local ? data.p1Passed : data.p2Passed;
            opponentPassed = isPlayer1Local ? data.p2Passed : data.p1Passed;
        }

        const finishUpdate = async () => {
            try {
                opponentHandCount = newOppHandCount;
                if (data.spyDrawn && data.spyDrawn.length > 0 && data.spyPlayer !== (isPlayer1Local ? 'p1' : 'p2')) {
                    opponentDeckCount -= data.spyDrawn.length;
                }

                // NOWA UNIFIKOWANA SEKWENCJA ANIMACJI
                if (data.lastPlayedCard) {
                    await handleCardAnimationSequence(data);
                }

                renderAll(currentNick);

                if (currentTurn && window.gameStarted && window.mulliganFinished && !data.isMedicChain) {
                    if (prevTurn !== currentTurn && !playerPassed && !opponentPassed) {
                        const isMyTurn = currentTurn === window.socket.id;
                        const bannerDelay = Math.max(0, (window._lastSoundEndTime || 0) - Date.now());
                        setTimeout(() => {
                            showPrzejscie(isMyTurn ? 't07' : 't08');
                        }, bannerDelay);
                    }
                }
            } catch (err) {
                console.error("[BOARD] Error in finishUpdate:", err);
            } finally {
                // ZAWSZE odblokuj ruch po zakończeniu całej sekwencji
                isProcessingMove = false;
            }
        };

        if (data.spyDrawn && data.spyDrawn.length > 0) {
            const isLocalSpy = data.spyPlayer === (isPlayer1Local ? 'p1' : 'p2');
            
            if (isLocalSpy) {
                // Jeśli serwer przesłał pełną rękę — użyj jej jako źródła prawdy...
                const serverHandForSync = isPlayer1Local ? data.p1Hand : data.p2Hand;
                const mapToObjects = (arr) => (arr || []).map(num => {
                    const c = cards.find(card => card.numer === String(num));
                    return c ? { ...c, _id: Math.random() } : null;
                }).filter(Boolean);

                const drawnObjs = mapToObjects(data.spyDrawn);
                if (serverHandForSync) syncHand(serverHandForSync);
                else {
                    playerHand.push(...drawnObjs);
                    sortHand();
                }

                // Usuń karty szpiega z lokalnej talii
                const drawnNums = data.spyDrawn.map(n => String(n));
                drawPile = drawPile.filter(c => !drawnNums.includes(c.numer));

                // Dźwięk jeśli wśród dobranych kart jest bohater
                const hasHero = drawnObjs.some(c => c.bohater);
                if (hasHero && window.playSound) window.playSound('ohoooooSound');

                renderAll(currentNick);

                const wrappers = document.querySelectorAll('.hand-card-img');
                const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
                const boardLeft = (window.innerWidth - 3840 * scale) / 2;
                const boardTop = (window.innerHeight - 2160 * scale) / 2;

                const spyNumsLeft = [...data.spyDrawn.map(n => String(n))];
                const drawnInHand = [];
                playerHand.forEach(c => {
                    const idx = spyNumsLeft.indexOf(c.numer);
                    if (idx !== -1) {
                        drawnInHand.push(c);
                        spyNumsLeft.splice(idx, 1);
                    }
                });

                drawnInHand.forEach(obj => window.arrivedCards.delete(obj));
                renderAll(currentNick);

                const targets = drawnInHand.map(obj => {
                    const idx = playerHand.findIndex(c => c === obj);
                    const el = Array.from(wrappers).find(w => parseInt(w.dataset.index) === idx);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        return { x: (rect.left - boardLeft) / scale, y: (rect.top - boardTop) / scale };
                    }
                    return { x: 2090, y: 1811 };
                });

                animateDeckToHand(drawnInHand, targets, () => {
                    drawnInHand.forEach(obj => window.arrivedCards.add(obj));
                    if (window.playSound) window.playSound('addCardSpySound');
                    finishUpdate();
                });
            } else {
                const oppFaction = window.opponentFaction || '1';
                const fMap = { "1": "polnoc_rewers.webp", "2": "nilftgard_rewers.webp", "3": "scoia'tel_rewers.webp", "4": "potwory_rewers.webp", "5": "skelige_rewers.webp" };
                const reverseImg = `/gwent/assets/asety/${fMap[oppFaction] || "polnoc_rewers.webp"}`;
                const fakeCards = data.spyDrawn.map(() => ({ karta: reverseImg, nazwa: 'Rewers', punkty: null }));
                const oppTarget = { x: 2090, y: 350 }; 
                animateDeckToHand(fakeCards, fakeCards.map(() => oppTarget), () => {
                    finishUpdate();
                }, null, true);
            }
        } else {
            finishUpdate();
        }
    });




    socket.on('medic-revive-prompt', (data) => {
        console.log("[BOARD] Received medic-revive-prompt", data);
        if (!data.graveyard || data.graveyard.length === 0) return;

        const graveObjs = data.graveyard.map(num => {
            const c = cards.find(card => String(card.numer) === String(num));
            return c ? { ...c, _id: Math.random() } : null;
        }).filter(Boolean);

        if (graveObjs.length > 0 && typeof window.showPowiek === 'function') {
            window.showPowiek(graveObjs, 0, 'graveyard', {
                isMedic: true,
                onSelect: (selectedCard) => {
                    console.log(`[BOARD] Medic revived card ${selectedCard.numer}`);
                    // Dźwięk wybrania karty przez medyka
                    if (window.playSound) window.playSound('medykSound');

                    // Dedykowany mechanizm. Karty lądują domyślnie według ich pozycji, agile na froncie
                    let targetRowStr;
                    const rType = selectedCard.pozycja;
                    const side = isPlayer1Local ? 'p1' : 'p2';
                    if (rType === 1) targetRowStr = `${side}R1`;
                    else if (rType === 2) targetRowStr = `${side}R2`;
                    else if (rType === 3) targetRowStr = `${side}R3`;
                    else if (rType === 4) targetRowStr = `${side}R1`; 

                    window.socket.emit('play-medic-resurrection', {
                        gameCode: gameCodeLocal,
                        isPlayer1: isPlayer1Local,
                        cardNumer: selectedCard.numer,
                        targetRow: targetRowStr
                    });
                    if (window.hidePowiek) window.hidePowiek();
                }
            });
        }
    });

    socket.on('play-error', (data) => {
        console.error("[BOARD] Play error:", data.error);
        isProcessingMove = false; // Unlock if server failed
        // Re-initialize might be needed here to re-sync
        socket.emit('get-game-state', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
    });

    socket.on('player-passed', (data) => {
        const { isPlayer1 } = data;
        const passedPlayerIsLocal = isPlayer1 === isPlayer1Local;

        if (passedPlayerIsLocal) {
            playerPassed = true;
            // Only show pass banner if opponent hasn't passed yet
            if (!opponentPassed) {
                showPrzejscie('t21', { onFinish: () => {
                    showPrzejscie('t08');
                }});
            }
        } else {
            opponentPassed = true;
            // Only show pass banner if player hasn't passed yet
            if (!playerPassed) {
                showPrzejscie('t20', { onFinish: () => {
                    showPrzejscie('t07');
                }});
            }
        }
        renderAll(currentNick);
    });

    socket.on('round-ended', (data) => {
        // Zapisz wyniki rundy do historii
        const myScore = isPlayer1Local ? data.p1Score : data.p2Score;
        const oppScore = isPlayer1Local ? data.p2Score : data.p1Score;
        roundScoresHistory.push({ myScore, oppScore, result: data.roundResult });
        handleRoundEnd(data);
    });

    socket.on('next-round-started', (data) => {
        console.log("[BOARD] Przejście do nowej rundy...");
        const { board, currentTurn: newTurn, p1Graveyard, p2Graveyard } = data;
        const mapToObjects = (numerArray) => (numerArray || []).map(num => cards.find(c => c.numer === String(num))).filter(Boolean);

        boardState = board;
        currentTurn = newTurn;
        if (p1Graveyard) {
            const gy = isPlayer1Local ? p1Graveyard : p2Graveyard;
            const ogy = isPlayer1Local ? p2Graveyard : p1Graveyard;
            playerGraveyard = mapToObjects(gy);
            opponentGraveyard = mapToObjects(ogy);
        }
        playerPassed = false;
        opponentPassed = false;

        // Sync local hand if provided
        const serverHand = isPlayer1Local ? data.p1Hand : data.p2Hand;
        if (serverHand) {
            syncHand(serverHand);
        }

        renderAll(currentNick);
        
        // Faza startowa rundy - t05, potem t07/08
        showPrzejscie('t05', { onFinish: () => {
            if (data.cowTransformed && window.playSound) {
                window.playSound('krowaSound');
            }
            const myNrDraw = data.northernRealmsDraw && (isPlayer1Local ? data.northernRealmsDraw.p1 : data.northernRealmsDraw.p2);
            if (myNrDraw) {
                showPrzejscie('t11', { onFinish: () => {
                    const isMyTurn = currentTurn === window.socket.id;
                    showPrzejscie(isMyTurn ? 't07' : 't08');
                }});
            } else {
                const isMyTurn = currentTurn === window.socket.id;
                showPrzejscie(isMyTurn ? 't07' : 't08');
            }
        }});
    });

    socket.on('board-clearing', (data) => {
        if (data.klikZabranie && window.playSound) {
            window.playSound('klikZabranieSound');
        }
    });

    socket.on('game-over', (data) => {
        // Poczekaj na zakończenie komunikatu spasowania/banera przed pokazaniem ekranu końcowego
        setTimeout(() => {
            showEndGameScreen(data.gameResult, currentNick, window.opponentNickname || 'PRZECIWNIK');
        }, 3500);
    });

    socket.on('rematch-starting', () => {
        // Usuń ekran końcowy i zresetuj stan gry
        const endScreen = document.getElementById('end-game-screen');
        if (endScreen) endScreen.remove();
        
        // Reset lokalnego stanu
        roundScoresHistory = [];
        playerHand = [];
        drawPile = [];
        playerGraveyard = [];
        opponentGraveyard = [];
        boardState = { p1R1: [], p1R2: [], p1R3: [], p2R1: [], p2R2: [], p2R3: [],
            p1S1: null, p1S2: null, p1S3: null, p2S1: null, p2S2: null, p2S3: null };
        playerLives = 2;
        opponentLives = 2;
        playerPassed = false;
        opponentPassed = false;
        currentTurn = null;
        window.gameStarted = false;
        window._gameBoardInitialized = false;
        window.leaderAnimated = false;
        window.opponentLeaderAnimated = false;
        window.cardsAnimated = false;
        window.arrivedCards = new Set();
        window.arrivedBoardCards = new Set();
        window.proposedCard = null;
        window.mulliganFinished = false;
        
        // Poproś o nowy stan gry
        socket.emit('get-game-state', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
    });

    window.addEventListener('resize', () => {
        renderAll(currentNick);
    });
}

let scoiaTimerInterval = null;

function hideScoiaUI() {
    const overlay = document.getElementById('scoia-decision-overlay');
    if (overlay) overlay.remove();
    if (scoiaTimerInterval) clearInterval(scoiaTimerInterval);
    hidePrzejscie(true);
}

function handleScoiaDecision(socket, gameCode, deciderId) {
    // Zapobiegaj wielokrotnemu tworzeniu
    if (document.getElementById('scoia-decision-overlay')) return;

    if (deciderId === window.socket.id) {
        // Ja decyduję
        const overlay = document.createElement('div');
        overlay.id = 'scoia-decision-overlay';

        const box = document.createElement('div');
        box.id = 'scoia-decision-box';

        const title = document.createElement('div');
        title.id = 'scoia-decision-title';
        title.textContent = 'Kto rozpoczyna grę?';

        const btnsBox = document.createElement('div');
        
        const btnFirst = document.createElement('button');
        btnFirst.className = 'scoia-btn';
        btnFirst.textContent = 'Będę zaczynać ja';
        
        const btnSecond = document.createElement('button');
        btnSecond.className = 'scoia-btn';
        btnSecond.textContent = 'Przeciwnik zaczyna';

        let timerText = document.createElement('div');
        timerText.id = 'scoia-decision-timer';
        
        box.appendChild(title);
        btnsBox.appendChild(btnFirst);
        btnsBox.appendChild(btnSecond);
        box.appendChild(btnsBox);
        box.appendChild(timerText);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        let timeLeft = 10;
        timerText.textContent = `Pozostały czas: ${timeLeft}s`;
        
        const makeDecision = (startFirst) => {
            if (scoiaTimerInterval) clearInterval(scoiaTimerInterval);
            socket.emit('scoia-decision-made', { gameCode, startFirst });
            hideScoiaUI();
        };

        btnFirst.onclick = () => makeDecision(true);
        btnSecond.onclick = () => makeDecision(false);

        scoiaTimerInterval = setInterval(() => {
            timeLeft--;
            timerText.textContent = `Pozostały czas: ${timeLeft}s`;
            if (timeLeft <= 0) {
                makeDecision(Math.random() < 0.5); // Przypadkowy wybór po czasie
            }
        }, 1000);
    } else {
        // Przeciwnik decyduje - wymuś pokazanie komunikatu t13 twardo aż do start-phase-resolved
        showPrzejscie('t13', { customCzas: 15000 });
    }
}

function startMulligan(socket, gameCode, isPlayer1, selectedIndex = 0) {
    // Dźwięk otwierania mulliganu
    if (window.playSound) window.playSound('ohoooooSound');

    showPowiek(playerHand, selectedIndex, 'hand', {
        isMulligan: true,
        swapsLeft: 2 - swapsCount,
        onSwap: (idx) => {
            // Dźwięk wymiany (1. lub 2. wymiana)
            if (window.playSound) {
                window.playSound(swapsCount === 0 ? 'wymiana1Sound' : 'wymiana2Sound');
            }
            swapsCount++;
            if (swapsCount >= 2) {
                if (window.hidePowiek) window.hidePowiek();
            }
            socket.emit('mulligan-swap', { gameCode, isPlayer1, cardIndex: idx });
        },
        onClose: () => {
            if (window.mulliganFinished) return; // Jeśli już skończyliśmy przez 2 wymiany, nie dubluj
            sortHand();
            window.mulliganFinished = true;
            socket.emit('end-mulligan', { gameCode, isPlayer1 });
            renderAll();
        }
    });
}

export function renderAll(nick) {
    if (nick) currentNick = nick;
    const overlay = document.querySelector('#gameScreen .overlay');
    if (!overlay) return;
    
    // Nie usuwamy wszystkiego (overlay.innerHTML = ''), 
    // aby zachować kontenery i umożliwić animacje CSS.
    // Zamiast tego usuwamy tylko nie-persystentne elementy
    const toRemove = Array.from(overlay.children).filter(c => !c.classList.contains('persistent'));
    toRemove.forEach(c => overlay.removeChild(c));


    // Turn indicator using images
    if (currentTurn) {
        const turnDiv = document.createElement('div');
        turnDiv.style.position = 'absolute';
        turnDiv.style.inset = '0';
        const isMyTurn = currentTurn === window.socket.id;
        turnDiv.style.background = `url('assets/asety/${isMyTurn ? 'ytruch.webp' : 'przeciwnikruch.webp'}') no-repeat center`;
        turnDiv.style.backgroundSize = 'contain';
        turnDiv.style.pointerEvents = 'none';
        turnDiv.style.zIndex = '1000'; // High z-index to stay above piled cards
        overlay.appendChild(turnDiv);
    }

    renderHand();
    renderProposedCard(overlay); // Nowy krok: wizualizacja potwierdzenia zagrania
    renderNicknames(overlay, nick);
    renderStats(overlay);
    renderScores(overlay);
    renderLives(overlay);
    renderGraveyards(overlay);
    renderPiles(overlay);
    renderLeaders(overlay);
    renderRows(overlay);
    renderWeather(overlay); // Dodajemy renderowanie pogody
}

function renderProposedCard(overlay) {
    let wrapper = overlay.querySelector('#proposed-card-preview');
    if (!window.proposedCard) {
        window._activeProposedId = null;
        if (wrapper) wrapper.style.display = 'none';
        return;
    }
    if (wrapper) wrapper.style.display = 'block';

    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const card = window.proposedCard;
    const dkartaW = 523 * scale; 
    const dkartaH = 992 * scale;

    const isNew = (!wrapper || window._activeProposedId !== card._id);
    
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'proposed-card-preview';
        wrapper.className = 'persistent';
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = '6000';
        wrapper.style.cursor = 'default';
        wrapper.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
        overlay.appendChild(wrapper);
    }
    window._activeProposedId = card._id;

    // Pozycja docelowa: ZA 3120, środek
    const targetLeft = 3120 * scale + boardLeft;
    const targetTop = 1080 * scale + boardTop; // Środek Y

    if (isNew && window.lastProposedStartRect) {
        // Animacja startująca z miejsca kliknięcia w łapę
        wrapper.style.transition = 'none';
        wrapper.style.left = `${window.lastProposedStartRect.left}px`;
        wrapper.style.top = `${window.lastProposedStartRect.top}px`;
        wrapper.style.width = `${window.lastProposedStartRect.width}px`;
        wrapper.style.height = `${window.lastProposedStartRect.height}px`;
        wrapper.style.transform = 'none';
        wrapper.style.opacity = '0.5';
        
        wrapper.offsetHeight; // force reflow
        
        wrapper.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
        wrapper.style.left = `${targetLeft}px`;
        wrapper.style.top = `${targetTop}px`;
        wrapper.style.width = `${dkartaW}px`;
        wrapper.style.height = `${dkartaH}px`;
        wrapper.style.transform = 'translateY(-50%)';
        wrapper.style.opacity = '1';
    } else {
        wrapper.style.left = `${targetLeft}px`;
        wrapper.style.top = `${targetTop}px`;
        wrapper.style.width = `${dkartaW}px`;
        wrapper.style.height = `${dkartaH}px`;
        wrapper.style.transform = 'translateY(-50%)';
    }

    wrapper.style.boxShadow = `0 0 ${40 * scale}px rgba(199, 167, 110, 0.8)`;
    
    const factionId = window.playerFaction || '1';
    wrapper.innerHTML = renderCardHTML(card, { playerFaction: factionId, isLargeView: true });

    // Ręczne dopasowanie skali czcionek w dużym podglądzie
    const content = wrapper.querySelector('.card-content');
    if (content) {
        content.style.width = '100%';
        content.style.height = '100%';
        const points = content.querySelector('.points');
        if (points) points.style.fontSize = (dkartaH * 0.1) + 'px';
        const name = content.querySelector('.name');
        if (name) name.style.fontSize = (dkartaH * 0.044) + 'px';
    }

    // Pozwala odkliknąć wybór
    overlay.onmousedown = (e) => {
        if (e.target === overlay && window.proposedCard) {
            window.proposedCard = null;
            renderAll(currentNick);
        }
    };
}

function renderStats(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const createStat = (val, x, y) => {
        const div = document.createElement('div');
        div.className = 'game-stat-number';
        div.style.position = 'absolute';
        div.style.left = `${x * scale + boardLeft}px`;
        div.style.top = `${y * scale + boardTop}px`;
        div.style.minWidth = `${100 * scale}px`;
        div.style.textAlign = 'center';
        div.style.fontSize = `${64 * scale}px`;
        div.style.color = '#b18941';
        div.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        div.style.transform = 'translate(-50%, -50%)';
        div.textContent = val;
        return div;
    };

    overlay.appendChild(createStat(opponentHandCount, 550 + 50, 738));
    overlay.appendChild(createStat(playerHand.length, 550 + 50, 1418));
}

function calculateScores() {
    const scores = {
        p1: { R1: 0, R2: 0, R3: 0, total: 0 },
        p2: { R1: 0, R2: 0, R3: 0, total: 0 }
    };

    if (!boardState) return scores;

    // Helper: sprawdza czy pogoda danego typu jest aktywna
    const checkWeather = (type) => {
        return boardState.weather && boardState.weather.some(wNum => {
            const wCard = cards.find(c => String(c.numer) === String(wNum.split('-')[1]));
            return wCard && (wCard.moc === type || (wCard.moc === 'sztorm' && (type === 'mgla' || type === 'deszcz')));
        });
    };

    const calculateRowScore = (rowKey, specialSlotVal, weatherActive) => {
        const rowCards = boardState[rowKey] || [];
        let rowDict = {};
        let moraleCount = 0;
        let hornActive = false;

        // Róg dowódcy w slocie specjalnym
        if (specialSlotVal) {
            const sCard = cards.find(c => String(c.numer) === String(specialSlotVal));
            if (sCard && sCard.moc === 'rog') hornActive = true;
        }

        if (!rowCards || rowCards.length === 0) return 0;

        rowCards.forEach((cardNum, i) => {
            const key = `${rowKey}_${i}`;
            // POMIJAJ KARTY KTÓRE JESZCZE NIE DOLECIAŁY
            if (!window.arrivedBoardCards.has(key)) return;

            const card = cards.find(c => String(c.numer) === String(cardNum));
            if (card && typeof card.punkty === 'number') {
                if (!rowDict[card.numer]) {
                    rowDict[card.numer] = { count: 0, card: card };
                }
                rowDict[card.numer].count++;
                
                // Morale buff (liczymy wszystkie jednostki z morale w rzędzie prócz bohaterów)
                if (!card.bohater && card.moc === 'morale') moraleCount++;
                // Róg jednostki w rzędzie
                if (!card.bohater && card.moc === 'rog') hornActive = true;
            }
        });

        let sum = 0;
        Object.values(rowDict).forEach(group => {
            const c = group.card;
            const count = group.count;

            if (c.bohater) {
                sum += c.punkty * count;
            } else {
                let pts = weatherActive ? 1 : c.punkty;

                // 1. Więź (x2 za każdą kolejną kartę o tej samej nazwie/numerze)
                if (c.moc === 'wiez') {
                    const bKey = `${rowKey}_${c.numer}`;
                    const prevCount = (window.bondPreviousCounts && window.bondPreviousCounts[bKey]) || 0;
                    
                    // Jeśli mnożnik nie jest jeszcze aktywny (trwa animacja), 
                    // używamy poprzedniej liczby kart (aby utrzymać stary stan punktowy)
                    const effectiveCount = (window.bondMultiplierActive || prevCount >= count) 
                        ? count 
                        : Math.max(1, prevCount);
                        
                    if (effectiveCount > 1) pts *= effectiveCount;
                }

                // 2. Morale (+1 do bazowej/pogodowej wartości za KAŻDĄ jednostkę morale w rzędzie EXCLUDING self)
                let mBuff = (c.moc === 'morale') ? (moraleCount - 1) : moraleCount;
                if (mBuff > 0) pts += mBuff;

                // 3. Róg (x2 całości po więzi i morale)
                if (hornActive) pts *= 2;

                sum += pts * count;
            }
        });

        return sum;
    };

    const mrozActive = checkWeather('mroz');
    const mglaActive = checkWeather('mgla');
    const deszczActive = checkWeather('deszcz');

    scores.p1.R1 = calculateRowScore('p1R1', boardState.p1S1, mrozActive);
    scores.p1.R2 = calculateRowScore('p1R2', boardState.p1S2, mglaActive);
    scores.p1.R3 = calculateRowScore('p1R3', boardState.p1S3, deszczActive);
    scores.p1.total = scores.p1.R1 + scores.p1.R2 + scores.p1.R3;

    scores.p2.R1 = calculateRowScore('p2R1', boardState.p2S1, mrozActive);
    scores.p2.R2 = calculateRowScore('p2R2', boardState.p2S2, mglaActive);
    scores.p2.R3 = calculateRowScore('p2R3', boardState.p2S3, deszczActive);
    scores.p2.total = scores.p2.R1 + scores.p2.R2 + scores.p2.R3;

    return scores;
}

function renderScores(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const scores = calculateScores();
    const isP1 = isPlayer1Local;
    const myScores = isP1 ? scores.p1 : scores.p2;
    const oppScores = isP1 ? scores.p2 : scores.p1;

    const createScoreValue = (val, x, y, isTotal) => {
        const div = document.createElement('div');
        div.className = 'game-score-number';
        div.style.position = 'absolute';
        div.style.left = `${x * scale + boardLeft}px`;
        div.style.top = `${y * scale + boardTop}px`;
        div.style.textAlign = 'center';
        div.style.fontSize = isTotal ? `${56 * 1.25 * scale}px` : `${44 * 1.25 * scale}px`;
        div.style.color = '#000000';
        div.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.fontWeight = isTotal ? 'bold' : 'normal';
        div.style.pointerEvents = 'none';
        div.style.textShadow = `0 0 ${10 * scale}px #ffffff, 0 0 ${20 * scale}px #ffffff`;
        div.textContent = val;
        return div;
    };

    // Opponent rows
    overlay.appendChild(createScoreValue(oppScores.R3, 1071, 146, false));
    overlay.appendChild(createScoreValue(oppScores.R2, 1071, 410, false));
    overlay.appendChild(createScoreValue(oppScores.R1, 1071, 686, false));
    overlay.appendChild(createScoreValue(oppScores.total, 907, 663, true));

    // Player rows (Zamienione 1 z 3)
    overlay.appendChild(createScoreValue(myScores.R1, 1071, 982, false));
    overlay.appendChild(createScoreValue(myScores.R2, 1071, 1247, false));
    overlay.appendChild(createScoreValue(myScores.R3, 1071, 1524, false));
    overlay.appendChild(createScoreValue(myScores.total, 907, 1467, true));
}

function renderLives(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const createLive = (x, y) => {
        const img = document.createElement('img');
        img.src = 'assets/asety/live.webp';
        img.style.position = 'absolute';
        img.style.left = `${x * scale + boardLeft}px`;
        img.style.top = `${y * scale + boardTop}px`;
        img.style.width = `${100 * scale}px`;
        img.style.height = `${100 * scale}px`;
        return img;
    };

    if (opponentLives >= 1) overlay.appendChild(createLive(721, 695));
    if (opponentLives >= 2) overlay.appendChild(createLive(636, 695));
    if (playerLives >= 1) overlay.appendChild(createLive(721, 1369));
    if (playerLives >= 2) overlay.appendChild(createLive(636, 1369));
}

/**
 * Dodaje dynamiczną nakładkę punktową na kartach na planszy i w ręce.
 */
export function addCardPointsOverlay(wrapper, card, cardW, cardH, effectiveScore = null) {
    if (typeof card.punkty !== 'number') return;
    
    const cardScale = cardW / 180;
    
    const pointsDiv = document.createElement('div');
    pointsDiv.className = 'card-points-overlay';
    pointsDiv.style.position = 'absolute';
    pointsDiv.style.left = `${30 * cardScale}px`;
    pointsDiv.style.top = `${30 * cardScale}px`;
    pointsDiv.style.transform = 'translate(-50%, -50%)';
    pointsDiv.style.fontFamily = 'PFDinTextCondPro, sans-serif'; 
    pointsDiv.style.fontSize = `${44 * cardScale}px`;
    
    // Logika kolorowania punktów (proponowana przez GURU)
    const actualScore = effectiveScore !== null ? effectiveScore : card.punkty;
    let baseColor = card.bohater ? '#fcfdfc' : '#000000';

    if (!card.bohater) {
        if (actualScore > card.punkty) {
            baseColor = '#329420'; // zielony - wzmocnienie
        } else if (actualScore < card.punkty) {
            baseColor = '#942020'; // czerwony - osłabienie
        }
    }
    
    pointsDiv.style.color = baseColor;
    pointsDiv.style.textShadow = card.bohater ? '0 1px 3px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.3)';
    pointsDiv.style.pointerEvents = 'none';
    pointsDiv.style.zIndex = '3';
    pointsDiv.style.lineHeight = '1';
    pointsDiv.textContent = actualScore;
    
    wrapper.appendChild(pointsDiv);

    // Jeśli bohater, dodajemy ikonkę tarczy po lewo od punktów (lub na pod punkty)
    if (card.bohater) {
        const heroIcon = document.createElement('img');
        heroIcon.src = 'assets/karty/bohater.webp';
        heroIcon.className = 'card-points-overlay';
        heroIcon.style.position = 'absolute';
        heroIcon.style.left = `${-8 * cardScale}px`;
        heroIcon.style.top = `${-8 * cardScale}px`;
        heroIcon.style.width = `${124 * cardScale}px`;
        heroIcon.style.height = `${126 * cardScale}px`;
        heroIcon.style.pointerEvents = 'none';
        heroIcon.style.zIndex = '2';
        wrapper.appendChild(heroIcon);
    }
}

function renderHand() {
    const overlay = document.querySelector('#gameScreen .overlay');
    if (!overlay) return;

    // Blokada podczas animacji ruchów jeśli potrzebna
    if (window.isProcessingMove) return;

    // Jeśli jeszcze nie doleciały karty z animacji na wejście, wstrzymaj render
    if (!window.cardsAnimated && window.arrivedCards.size === 0) return;

    const GUI_WIDTH = 3840;
    const GUI_HEIGHT = 2160;
    const areaLeft = 1163;
    const areaTop = 1691;
    const areaRight = 3018;
    const areaBottom = 1932;

    const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
    const boardLeft = (window.innerWidth - GUI_WIDTH * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    let container = overlay.querySelector('.hand-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'hand-container persistent';
        container.style.position = 'absolute';
        overlay.appendChild(container);
    }

    container.style.left = `${areaLeft * scale + boardLeft}px`;
    container.style.top = `${areaTop * scale + boardTop}px`;
    container.style.width = `${(areaRight - areaLeft) * scale}px`;
    container.style.height = `${(areaBottom - areaTop) * scale}px`;

    const count = playerHand.length;
    if (selectedHandIndex >= count) selectedHandIndex = -1;

    const totalAreaWidth = (areaRight - areaLeft) * scale;
    const cardW = 180 * scale;
    const cardH = 240 * scale;

    let cardStep = cardW + (5 * scale);
    if (count * cardStep > totalAreaWidth) {
        cardStep = (totalAreaWidth - cardW) / (count - 1);
    }
    const occupiedWidth = (count > 0 ? (count - 1) * cardStep + cardW : 0);
    const startX = (totalAreaWidth - occupiedWidth) / 2;

    // Reconciliation: usuwamy tylko te których nie ma w playerHand
    const currentWrappers = Array.from(container.querySelectorAll('.hand-card-img'));
    const handCardIds = playerHand.map(c => c._id);
    currentWrappers.forEach(w => {
        if (!handCardIds.includes(parseFloat(w.dataset.id))) {
            container.removeChild(w);
        }
    });

    playerHand.forEach((card, i) => {
        const isProposed = window.proposedCard === card;
        let wrapper = container.querySelector(`.hand-card-img[data-id="${card._id}"]`);
        
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'hand-card-img';
            wrapper.dataset.id = card._id;
            wrapper.id = `hand-card-${card.numer}`; // ID do namierzania przez getElement4KPos
            wrapper.style.position = 'absolute';
            wrapper.style.cursor = 'pointer';
            wrapper.style.transition = 'transform 0.2s ease-out, top 0.2s ease-out';
            
            const img = document.createElement('img');
            img.src = card.karta;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.display = 'block';
            wrapper.appendChild(img);
        }

        // Punkty nakładka
        const oldPoints = wrapper.querySelectorAll('.card-points-overlay');
        oldPoints.forEach(p => p.remove());
        addCardPointsOverlay(wrapper, card, cardW, cardH);

        wrapper.style.width = `${cardW}px`;
        wrapper.style.height = `${cardH}px`;
        wrapper.dataset.index = i;
        wrapper.style.left = `${startX + i * cardStep}px`;
        wrapper.style.zIndex = i + 1;

        const isHovered = (i === selectedHandIndex);
        wrapper.style.top = isHovered ? '25%' : '50%';
        wrapper.style.transform = isHovered ? 'translateY(-75%)' : 'translateY(-50%)';

        // Ukrywamy kartę w łapie jeśli jest "w locie" lub właśnie ją wybieramy do zagrania (proponujemy)
        if (!window.arrivedCards.has(card) || isProposed) {
            wrapper.style.visibility = 'hidden';
            wrapper.style.pointerEvents = 'none';
        } else {
            wrapper.style.visibility = 'visible';
            wrapper.style.pointerEvents = 'auto';
        }

        wrapper.onmouseenter = () => {
            selectedHandIndex = i;
            updateHandVisuals(container, scale);
        };
        wrapper.onmouseleave = () => {
            selectedHandIndex = -1;
            updateHandVisuals(container, scale);
        };

        wrapper.oncontextmenu = (e) => {
            e.preventDefault();
            showPowiek(playerHand, i, 'hand');
        };

        wrapper.onclick = (e) => {
            e.stopPropagation();
            if (isMulliganActive) return;

            const isMyTurn = (currentTurn === window.socket.id);
            if (!isMyTurn || playerPassed || isProcessingMove) return;

            // Toggle: kliknięcie na wybraną kartę odznacza ją
            if (window.proposedCard === card) {
                window.proposedCard = null;
                window.lastProposedStartRect = null;
                renderAll(currentNick);
                return;
            }

            // Rejestrujemy ostatnie wymiary dla animacji podglądu
            const rect = wrapper.getBoundingClientRect();
            window.lastProposedStartRect = {
                left: rect.left, top: rect.top, width: rect.width, height: rect.height
            };

            window.proposedCard = card;
            renderAll(currentNick);
        };

        container.appendChild(wrapper);
    });
}

function updateHandVisuals(container, scale) {
    if (!container) return;
    const wrappers = container.querySelectorAll('.hand-card-img');
    wrappers.forEach((wrapper, idx) => {
        if (idx === selectedHandIndex) {
            wrapper.style.transform = 'translateY(-75%)';
            wrapper.style.zIndex = '5000';
            wrapper.style.boxShadow = `0 0 ${20 * scale}px #c7a76e`;
        } else {
            wrapper.style.transform = 'translateY(-50%)';
            wrapper.style.zIndex = idx + 1;
            wrapper.style.boxShadow = 'none';
        }
    });
}

/**
 * Logika kliknięcia ENTER lub bezpośredniego zagrania (fallback)
 */
function playCardAtIndex(index) {
    if (isProcessingMove) return;
    if (index < 0 || index >= playerHand.length) return;

    const isMyTurn = currentTurn === window.socket.id;
    if (!isMyTurn) return;
    if (getIsShowing() || playerPassed) return;

    const card = playerHand[index];
    if (!card) return;

    // Proste zagranie bez potwierdzenia (np. z klawiatury)
    isProcessingMove = true;
    const isSpecial = card.numer === "002" || card.numer === "000" || ["mroz", "mgla", "deszcz", "sztorm", "niebo", "manek", "porz"].includes(card.moc);
    let posToPlay = card.pozycja || 1; 
    
    // Fallback dla agile (4) -> na przód (1)
    if (!isSpecial && posToPlay === 4) posToPlay = 1;

    window.socket.emit('play-card', {
        gameCode: gameCodeLocal,
        isPlayer1: isPlayer1Local,
        cardNumer: card.numer,
        pozycja: posToPlay,
        isSpecial: isSpecial
    });

    currentTurn = null; // optimistic lock
    playerHand.splice(index, 1);
    selectedHandIndex = -1;
    renderAll();
}

window.addEventListener('keydown', (e) => {
    if (!window.gameStarted || window.isPowiekOpen) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (e.key === 'ArrowRight') {
            selectedHandIndex = Math.min(selectedHandIndex + 1, playerHand.length - 1);
        } else {
            selectedHandIndex = Math.max(selectedHandIndex - 1, 0);
        }
        if (selectedHandIndex < 0 && playerHand.length > 0) selectedHandIndex = 0;

        const container = document.querySelector('.hand-container');
        if (container) {
            const GUI_WIDTH = 3840;
            const GUI_HEIGHT = 2160;
            const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
            updateHandVisuals(container, scale);
        }
    } else if (e.key === 'Enter') {
        if (selectedHandIndex !== -1) {
            playCardAtIndex(selectedHandIndex);
        }
    }
});

function renderNicknames(overlay, nick) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const createNick = (name, x, y, fact_h, factionId) => {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = `${483 * scale + boardLeft}px`;
        container.style.top = `${y * scale + boardTop}px`;
        container.style.width = `${(850 - 483) * scale}px`;
        container.style.height = `${(fact_h - y) * scale}px`;
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'center';

        const fInfo = factionInfo[factionId] || factionInfo["1"];

        const headerGroup = document.createElement('div');
        headerGroup.style.display = 'flex';
        headerGroup.style.alignItems = 'center';

        const logo = document.createElement('img');
        logo.src = `assets/asety/${fInfo.logo}`;
        logo.style.width = `${60 * scale}px`;
        logo.marginRight = `${15 * scale}px`;
        headerGroup.appendChild(logo);

        const nickDiv = document.createElement('div');
        nickDiv.className = 'game-nick';
        nickDiv.style.fontSize = `${32 * scale}px`;
        nickDiv.style.color = '#b28a41';
        nickDiv.style.fontWeight = 'bold';
        nickDiv.textContent = name;
        headerGroup.appendChild(nickDiv);

        container.appendChild(headerGroup);

        const factDiv = document.createElement('div');
        factDiv.style.fontSize = `${24 * scale}px`;
        factDiv.style.color = '#b08948';
        factDiv.style.marginTop = `${5 * scale}px`;
        factDiv.textContent = fInfo.name;
        container.appendChild(factDiv);

        return container;
    };

    overlay.appendChild(createNick(window.opponentNickname || 'PRZECIWNIK', 483, 569, 602, window.opponentFaction));
    overlay.appendChild(createNick(nick, 483, 1498, 1532, window.playerFaction));
}

function renderGraveyards(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const renderGraveyardGroup = (x, y, cardList) => {
        const count = cardList.length;
        if (count === 0) return;

        // Renderujemy stos (warstwy)
        for (let i = 0; i < count; i++) {
            const cardObj = cardList[i];
            const cardW = 179 * scale;
            const cardH = 239 * scale;
            
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.left = `${(x - i) * scale + boardLeft}px`;
            wrapper.style.top = `${(y - i) * scale + boardTop}px`;
            wrapper.style.width = `${cardW}px`;
            wrapper.style.height = `${cardH}px`;
            wrapper.style.zIndex = 5 + i;

            const img = document.createElement('img');
            img.src = cardObj.karta;
            img.style.width = '100%';
            img.style.height = '100%';
            wrapper.appendChild(img);

            // Wierzch stosu clickable
            if (i === count - 1) {
                wrapper.style.cursor = 'pointer';
                wrapper.onclick = () => {
                    if (window.showPowiek) window.showPowiek(cardList, cardList.length - 1, 'game');
                };
                addCardPointsOverlay(wrapper, cardObj, cardW, cardH);
            }

            overlay.appendChild(wrapper);
        }
    };

    renderGraveyardGroup(3110, 1682, playerGraveyard);
    renderGraveyardGroup(3110, 168, opponentGraveyard);
}

function confirmPlayProposed(targetData = {}) {
    if (!window.proposedCard) return;

    // Zablokuj natychmiast — zapobiega podwójnym wywołaniom przy szybkich kliknięciach
    if (isProcessingMove) {
        console.log("[BOARD] Blocked: isProcessingMove already true.");
        return;
    }
    isProcessingMove = true;

    // Sprawdź turę i stan gry
    const isMyTurn = (currentTurn === window.socket.id);
    if (!isMyTurn || playerPassed) {
        console.log("[BOARD] Blocked play attempt: Not your turn or passed.");
        isProcessingMove = false;
        return;
    }

    const card = window.proposedCard;
    let finalPos = targetData.rowIdx || (card.pozycja === 4 ? 1 : card.pozycja);
    const isSpecial = card.numer === "002" || card.numer === "000" || ["mroz", "mgla", "deszcz", "sztorm", "niebo", "manek", "porz"].includes(card.moc);



    // --- NOWA LOGIKA ANIMACJI ZIP Z SERWERA ---
    // Natychmiast emitujemy zagranie do serwera. Serwer odpowie board-updated,
    // który uruchomi handleCardAnimationSequence i właściwy dolot karty do zarezerwowanego slota.
    
    // Zostawiamy element podglądu nietknięty (zostanie ukryty w handleCardAnimationSequence),
    // żeby animacja gracza miała punkt startowy.
    window.socket.emit('play-card', {
        gameCode: gameCodeLocal,
        isPlayer1: isPlayer1Local,
        cardNumer: card.numer,
        pozycja: finalPos,
        isSpecial: isSpecial,
        targetCardNumer: targetData.targetCardNumer,
        targetRow: targetData.targetRow
    });

    const handIdx = playerHand.findIndex(c => c._id === card._id);
    if (handIdx !== -1) playerHand.splice(handIdx, 1);
    
    window.proposedCard = null;
    renderAll(currentNick);
}

function renderWeather(overlay) {
    if (!boardState) return;

    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const weatherW = 549 * scale;
    const weatherH = 239 * scale;
    const cardW = weatherH * (180 / 240);

    let container = overlay.querySelector('#weather-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'weather-container';
        container.style.position = 'absolute';
        container.style.zIndex = 40; // Ma być pod dużym podglądem karty
        container.style.pointerEvents = 'none'; // Domyślnie klikanie przelatuje pod spód
        overlay.appendChild(container);
    }

    container.style.left = `${286 * scale + boardLeft}px`;
    container.style.top = `${917 * scale + boardTop}px`;
    container.style.width = `${weatherW}px`;
    container.style.height = `${weatherH}px`;

    // Drop area dla kart pogody
    const isMyTurn = (currentTurn === window.socket.id);
    if (isMyTurn && window.proposedCard && ["mroz", "mgla", "deszcz", "sztorm", "niebo"].includes(window.proposedCard.moc)) {
        container.style.backgroundColor = 'rgba(199, 167, 110, 0.2)';
        container.style.pointerEvents = 'auto';
        container.style.cursor = 'pointer';
        container.onclick = (e) => {
            e.stopPropagation();
            confirmPlayProposed({ rowIdx: 1 }); // Weather always targets 1 on server for convention
        };
    } else {
        container.style.backgroundColor = 'transparent';
        container.style.pointerEvents = 'none';
        container.style.cursor = 'default';
        container.onclick = null;
    }

    const weatherList = boardState.weather || [];
    const count = Math.min(weatherList.length, 3);

    let cardStep = cardW + (5 * scale);
    if (count * cardStep > weatherW) {
        cardStep = (weatherW - cardW) / Math.max(1, count - 1);
    }
    const startX = (weatherW - (count > 0 ? (count - 1) * cardStep + cardW : 0)) / 2;

    container.innerHTML = '';
    weatherList.slice(-3).forEach((wStr, i) => {
        const wNum = wStr.split('-')[1];
        const card = cards.find(c => String(c.numer) === String(wNum));
        if (card) {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.height = '100%';
            wrapper.style.width = `${cardW}px`;
            wrapper.style.left = `${startX + i * cardStep}px`;
            wrapper.style.zIndex = i + 1;

            const img = document.createElement('img');
            img.src = card.karta;
            img.style.height = '100%';
            img.style.width = '100%';
            wrapper.appendChild(img);
            container.appendChild(wrapper);
        }
    });
}

function renderRows(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const isP1 = isPlayer1Local;
    
    const renderRowCards = (rowKey, coords) => {
        const cardsInRowNumers = boardState[rowKey] || [];
        const count = cardsInRowNumers.length;

        const totalRowWidth = coords.w * scale;
        const cardH = coords.h * scale;
        const cardW = cardH * (180 / 240);

        let cardStep = cardW + (5 * scale);
        if (count * cardStep > totalRowWidth) {
            cardStep = (totalRowWidth - cardW) / (count - 1);
        }
        const occupiedWidth = (count > 0 ? (count - 1) * cardStep + cardW : 0);
        const startX = (totalRowWidth - occupiedWidth) / 2;

        let rowDiv = overlay.querySelector(`.row-container[data-row="${rowKey}"]`);
        if (!rowDiv) {
            rowDiv = document.createElement('div');
            rowDiv.className = 'row-container persistent';
            rowDiv.dataset.row = rowKey;
            rowDiv.style.position = 'absolute';
            overlay.appendChild(rowDiv);
        }
        rowDiv.style.left = `${coords.x * scale + boardLeft}px`;
        rowDiv.style.top = `${coords.y * scale + boardTop}px`;
        rowDiv.style.width = `${totalRowWidth}px`;
        rowDiv.style.height = `${cardH}px`;

        // Podświetlanie rzędów przy zagrywaniu karty
        if (window.proposedCard) {
            const pCard = window.proposedCard;
            const isMelee = rowKey.endsWith('1');
            const isRanged = rowKey.endsWith('2');
            const isSiege = rowKey.endsWith('3');
            const isMySide = rowKey.startsWith(isP1 ? 'p1' : 'p2');

            // Logika walidacji rzędu
            const isWeather = ["mroz", "mgla", "deszcz", "sztorm", "niebo"].includes(pCard.moc);
            const isHornSpecial = (pCard.typ === 'specjalna' && pCard.moc === 'rog');
            const isPorz = (pCard.moc === 'porz');      // Porzoga ogólna
            const isIporz = (pCard.moc === 'iporz');     // Porzoga rzędowa

            let isValidRow = false;

            if (isPorz) {
                // Porzoga ogólna: aktywuje się na DOWOLNYM własnym rzędzie (jako trigger)
                isValidRow = isMySide;
            } else if (isIporz) {
                // Porzoga rzędowa (iporz): karta jednostki trafia na WŁASNY rząd o tej samej pozycji co karta
                // pozycja karty iporz determinuje dostępny rząd
                isValidRow = isMySide && (parseInt(rowKey.slice(-1)) === pCard.pozycja);
            // WYJĄTEK JASKIER/INNI Z ROGIEM JEDNOSTKI
            } else if (pCard.moc === 'rog_jednostki' || pCard.numer === '021' || pCard.numer === '522') {
                isValidRow = isMySide && (parseInt(rowKey.slice(-1)) === pCard.pozycja);
            }
            // Karty jednostek, szpiedzy, medyk itd.
            else if (!isWeather && !isHornSpecial) {
                const isSpy = (pCard.moc === 'szpieg');
                // Szpieg trafia na stronę przeciwnika, reszta na swoją
                const isTargetSide = isSpy ? !isMySide : isMySide;

                if (isTargetSide) {
                    if (pCard.pozycja === 1 && isMelee) isValidRow = true;
                    if (pCard.pozycja === 2 && isRanged) isValidRow = true;
                    if (pCard.pozycja === 3 && isSiege) isValidRow = true;
                    if (pCard.pozycja === 4 && (isMelee || isRanged)) isValidRow = true;

                    // Dowódca jako róg w rzędzie (specyficzne karty)
                    if (pCard.numer === "002" || pCard.moc === "rog") isValidRow = true;
                }
            }

            const isMyTurn = (currentTurn === window.socket.id);
            if (isMyTurn && isValidRow) {
                rowDiv.style.backgroundColor = (isPorz || isIporz)
                    ? 'rgba(180, 60, 30, 0.25)'
                    : 'rgba(199, 167, 110, 0.2)';
                rowDiv.style.cursor = 'pointer';
                rowDiv.onclick = (e) => {
                    e.stopPropagation();
                    const rowIdx = isMelee ? 1 : (isRanged ? 2 : 3);
                    confirmPlayProposed({ rowIdx });
                };
            } else {
                rowDiv.style.backgroundColor = 'transparent';
                rowDiv.style.cursor = 'default';
                rowDiv.onclick = null;
            }
        } else {
            rowDiv.style.backgroundColor = 'transparent';
            rowDiv.style.cursor = 'default';
            rowDiv.onclick = null;
        }

        // Czyszczenie rzędu (lub reconciliation)
        rowDiv.innerHTML = '';
        cardsInRowNumers.forEach((numer, i) => {
            const cardKey = `${rowKey}_${i}`;
            let effectiveNumer = String(numer);
            let isArrived = window.arrivedBoardCards.has(cardKey);

            // Jeśli trwa animacja manekina, w tym slocie wizualnie wciąż jest stara karta
            if (window.activeDecoySequences.has(cardKey)) {
                effectiveNumer = window.activeDecoySequences.get(cardKey);
                isArrived = true; // Stara karta jest już na planszy
            }

            const card = cards.find(c => c.numer === effectiveNumer);
            if (card) {
                const wrapper = document.createElement('div');
                wrapper.className = 'board-card-wrapper';
                // Jeśli karta jeszcze "leci", rezerwujemy miejsce, ale jest niewidzialna (idziemy na kompromis visibility: hidden)
                // Dodajemy unikalne ID placaholdera dla łatwego namierzania
                wrapper.id = `slot-placeholder-${cardKey}`;
                if (!isArrived) {
                    wrapper.style.visibility = 'hidden';
                }

                wrapper.style.position = 'absolute';
                wrapper.style.height = '100%';
                wrapper.style.width = `${cardW}px`;
                wrapper.style.left = `${startX + i * cardStep}px`;
                wrapper.style.zIndex = i + 1;
                wrapper.dataset.numer = card.numer;
                wrapper.dataset.side = rowKey.startsWith('p1') ? 'p1' : 'p2';

                const img = document.createElement('img');
                img.src = card.karta;
                img.style.height = '100%';
                img.style.width = '100%';
                wrapper.appendChild(img);

                // Liczenie rzeczywistej siły karty (podgląd)
                let cardScore = card.punkty;
                if (!card.bohater && typeof card.punkty === 'number') {
                    const checkW = (t) => boardState.weather && boardState.weather.some(w => {
                        const wc = cards.find(c => c.numer === w.split('-')[1]);
                        return wc && (wc.moc === t || (wc.moc === 'sztorm' && (t === 'mgla' || t === 'deszcz')));
                    });
                    const rowNum = parseInt(rowKey.slice(-1));
                    if ((rowNum === 1 && checkW('mroz')) || (rowNum === 2 && checkW('mgla')) || (rowNum === 3 && checkW('deszcz'))) {
                        cardScore = 1;
                    }
                    // Więź
                    const bondCnt = cardsInRowNumers.filter(n => n === card.numer).length;
                    if (card.moc === 'wiez') {
                        const bKey = `${rowKey}_${card.numer}`;
                        const prevCount = (window.bondPreviousCounts && window.bondPreviousCounts[bKey]) || 0;
                        const effectiveCount = (window.bondMultiplierActive || prevCount >= bondCnt) 
                            ? bondCnt 
                            : Math.max(1, prevCount);
                            
                        if (effectiveCount > 1) cardScore *= effectiveCount;
                    }
                    // Morale i Rogi
                    let moraleCnt = 0;
                    let rowHorn = false;
                    cardsInRowNumers.forEach(cn => {
                        const co = cards.find(c => c.numer === cn);
                        if (co && !co.bohater) {
                            if (co.moc === 'morale') moraleCnt++;
                            if (co.moc === 'rog') rowHorn = true;
                        }
                    });
                    cardScore += (card.moc === 'morale' ? moraleCnt - 1 : moraleCnt);
                    const sSlot = boardState[rowKey.substring(0, 2) + 'S' + rowKey.slice(-1)];
                    if (rowHorn || (sSlot && cards.find(c => c.numer === sSlot).moc === 'rog')) {
                        cardScore *= 2;
                    }
                }

                addCardPointsOverlay(wrapper, card, cardW, cardH, cardScore);
                
                // Obsługa manekina (tylko na swoje karty nie-bohaterów, wyłączając specjalne 000-008)
                const EXCLUDED_DECOY = ['000','001','002','003','004','005','006','007','008'];
                const isManekinTargetValid = window.proposedCard && 
                                            window.proposedCard.moc === 'manek' && 
                                            !card.bohater && 
                                            !EXCLUDED_DECOY.includes(String(card.numer)) &&
                                            rowKey.startsWith(isP1 ? 'p1' : 'p2');

                if (isManekinTargetValid) {
                    wrapper.style.cursor = 'pointer';
                    wrapper.style.filter = 'brightness(1.5) drop-shadow(0 0 10px #c7a76e)';
                    wrapper.onclick = (e) => {
                        e.stopPropagation();
                        if (isProcessingMove) return;
                        confirmPlayProposed({ targetCardNumer: card.numer, targetRow: rowKey });
                    };
                }

                // Hover effect
                wrapper.onmouseenter = () => {
                    wrapper.style.zIndex = '5000';
                    wrapper.style.transform = 'translateY(-15%)';
                    wrapper.style.boxShadow = `0 0 ${15 * scale}px #c7a76e`;
                };
                wrapper.onmouseleave = () => {
                    wrapper.style.zIndex = i + 1;
                    wrapper.style.transform = 'none';
                    wrapper.style.boxShadow = 'none';
                };

                rowDiv.appendChild(wrapper);
            }
        });
    };

    const renderSpecialSlot = (rowIdx, sidePrefix, yCoord) => {
        let slot = overlay.querySelector(`#special-slot-${sidePrefix}-${rowIdx}`);
        if (!slot) {
            slot = document.createElement('div');
            slot.id = `special-slot-${sidePrefix}-${rowIdx}`;
            slot.style.position = 'absolute';
            overlay.appendChild(slot);
        }
        slot.style.left = `${1182 * scale + boardLeft}px`;
        slot.style.top = `${yCoord * scale + boardTop}px`;
        slot.style.width = `${179 * scale}px`;
        slot.style.height = `${239 * scale}px`;

        const isMyTurn = (currentTurn === window.socket.id);
        if (isMyTurn && window.proposedCard && window.proposedCard.typ === 'specjalna' && window.proposedCard.moc === 'rog' && sidePrefix === (isP1 ? 'p1' : 'p2')) {
            slot.style.backgroundColor = 'rgba(199, 167, 110, 0.4)';
            slot.style.cursor = 'pointer';
            slot.onclick = (e) => {
                e.stopPropagation();
                confirmPlayProposed({ rowIdx: rowIdx, isSpecial: true });
            };
        } else {
            slot.style.backgroundColor = 'transparent';
            slot.style.cursor = 'default';
            slot.onclick = null;
        }

        slot.innerHTML = '';
        const num = boardState[`${sidePrefix}S${rowIdx}`];
        if (num) {
            const card = cards.find(c => c.numer === num);
            if (card) {
                const img = document.createElement('img');
                img.src = card.karta;
                img.style.width = '100%';
                img.style.height = '100%';
                slot.appendChild(img);
            }
        }
    };

    if (isP1) {
        renderRowCards('p2R3', rowCoords.opp3);
        renderRowCards('p2R2', rowCoords.opp2);
        renderRowCards('p2R1', rowCoords.opp1);
        renderRowCards('p1R1', rowCoords.self1);
        renderRowCards('p1R2', rowCoords.self2);
        renderRowCards('p1R3', rowCoords.self3);

        renderSpecialSlot(3, 'p2', 29);
        renderSpecialSlot(2, 'p2', 294);
        renderSpecialSlot(1, 'p2', 565);
        renderSpecialSlot(1, 'p1', 863);
        renderSpecialSlot(2, 'p1', 1129);
        renderSpecialSlot(3, 'p1', 1407);
    } else {
        renderRowCards('p1R3', rowCoords.opp3);
        renderRowCards('p1R2', rowCoords.opp2);
        renderRowCards('p1R1', rowCoords.opp1);
        renderRowCards('p2R1', rowCoords.self1);
        renderRowCards('p2R2', rowCoords.self2);
        renderRowCards('p2R3', rowCoords.self3);

        renderSpecialSlot(3, 'p1', 29);
        renderSpecialSlot(2, 'p1', 294);
        renderSpecialSlot(1, 'p1', 565);
        renderSpecialSlot(1, 'p2', 863);
        renderSpecialSlot(2, 'p2', 1129);
        renderSpecialSlot(3, 'p2', 1407);
    }
}

function renderPiles(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const renderPileGroup = (x, y, count, factionId, isOpponent) => {
        const reverseSrc = `assets/asety/${(factionInfo[factionId || '1'] || factionInfo["1"]).reverse}`;
        for (let i = 0; i < count; i++) {
            const pile = document.createElement('img');
            pile.src = reverseSrc;
            pile.style.position = 'absolute';
            pile.style.left = `${(x - i) * scale + boardLeft}px`; 
            pile.style.top = `${(y - i) * scale + boardTop}px`;
            pile.style.width = `${175 * scale}px`;
            pile.style.height = `${300 * scale}px`;
            pile.style.zIndex = 100 + i;
            overlay.appendChild(pile);

            if (i === count - 1 && !isOpponent) {
                pile.style.cursor = 'pointer';
                pile.oncontextmenu = (e) => {
                    e.preventDefault();
                    if (window.showPowiek) window.showPowiek(drawPile, 0, 'game');
                };
            }
        }

        // Overlay licznika
        const boxX = isOpponent ? 3484 : 3493;
        const boxY = isOpponent ? 358 : 1901;
        const boxW = isOpponent ? 99 : 98;
        const boxH = isOpponent ? 74 : 73;

        const box = document.createElement('div');
        box.style.position = 'absolute';
        box.style.left = `${boxX * scale + boardLeft}px`;
        box.style.top = `${boxY * scale + boardTop}px`;
        box.style.width = `${boxW * scale}px`;
        box.style.height = `${boxH * scale}px`;
        box.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        box.style.display = 'flex';
        box.style.justifyContent = 'center';
        box.style.alignItems = 'center';
        box.style.zIndex = 200;

        const countText = document.createElement('div');
        box.appendChild(countText);
        countText.style.color = '#c7a76e';
        countText.style.fontSize = `${boxH * 0.5 * scale}px`;
        countText.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        countText.textContent = count;
        overlay.appendChild(box);
    };

    renderPileGroup(3459, 1656, drawPile.length, window.playerFaction, false);
    renderPileGroup(3459, 132, opponentDeckCount, window.opponentFaction, true);
}

function renderLeaders(overlay) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const createLeader = (leaderObj, x, y, isOpponent) => {
        if (!leaderObj || (!isOpponent && !window.leaderAnimated) || (isOpponent && !window.opponentLeaderAnimated)) return;
        const img = document.createElement('img');
        img.src = leaderObj.karta;
        img.style.position = 'absolute';
        img.style.left = `${x * scale + boardLeft}px`;
        img.style.top = `${y * scale + boardTop}px`;
        img.style.width = `${180 * scale}px`;
        img.style.height = `${240 * scale}px`;
        img.style.cursor = 'pointer';
        img.onclick = () => { if (window.showPowiek) window.showPowiek([leaderObj], 0, 'leaders'); };
        overlay.appendChild(img);
    };
    createLeader(playerLeaderObj, 286, 1679, false);
    createLeader(opponentLeaderObj, 286, 174, true);

    // PASS button
    if (window.gameStarted && !playerPassed) {
        const passBtn = document.createElement('button');
        passBtn.className = 'game-pass-btn';
        passBtn.style.position = 'absolute';
        passBtn.style.left = `${490 * scale + boardLeft}px`;
        passBtn.style.top = `${1779 * scale + boardTop}px`;
        passBtn.style.width = `${120 * scale}px`;
        passBtn.style.height = `${50 * scale}px`;
        passBtn.style.backgroundColor = '#1a1a1a';
        passBtn.style.border = `${2 * scale}px solid #b28a41`;
        passBtn.style.borderRadius = `${4 * scale}px`;
        passBtn.style.color = '#b28a41';
        passBtn.style.fontFamily = 'PFDinTextCondPro-Bold, sans-serif';
        passBtn.style.fontSize = `${28 * scale}px`;
        passBtn.textContent = 'PASS';
        passBtn.style.cursor = 'pointer';

        if (currentTurn !== window.socket.id) {
            passBtn.style.opacity = '0.5';
            passBtn.style.cursor = 'not-allowed';
        }

        passBtn.onclick = () => {
            if (currentTurn !== window.socket.id) return;
            if (passBtn.dataset.sending === '1') return; // debounce double-click
            passBtn.dataset.sending = '1';
            passBtn.disabled = true;
            passBtn.style.opacity = '0.5';
            window.socket.emit('pass-turn', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
        };
        overlay.appendChild(passBtn);
    }
}

function collectCardsOnBoardDOM(isOpponent) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const boardLeft = (window.innerWidth - 3840 * scale) / 2;
    const boardTop = (window.innerHeight - 2160 * scale) / 2;

    const boardCards = [];
    document.querySelectorAll('.board-card-wrapper').forEach(w => {
        const side = w.dataset.side;
        const isActuallyOpponent = (isPlayer1Local && side === 'p2') || (!isPlayer1Local && side === 'p1');
        if (isActuallyOpponent === isOpponent) {
            const rect = w.getBoundingClientRect();
            const cardObj = cards.find(c => c.numer === w.dataset.numer);
            if (cardObj) {
                boardCards.push({
                    card: cardObj,
                    currentPos4K: {
                        x: (rect.left - boardLeft) / scale,
                        y: (rect.top - boardTop) / scale
                    }
                });
            }
        }
    });
    return boardCards;
}

function handleRoundEnd(data) {
    const { roundResult, p1Lives, p2Lives } = data;
    
    // Play win/draw sounds
    if (window.playSound) {
        if (roundResult === 'draw') {
            window.playSound('remisRundaSound');
        } else if (roundResult === (isPlayer1Local ? 'p1' : 'p2')) {
            window.playSound('winRundaSound');
        } else {
            window.playSound('przeciwnikWygralSound');
        }
    }
    const winner = roundResult;

    const myBoardCards = collectCardsOnBoardDOM(false);
    const oppBoardCards = collectCardsOnBoardDOM(true);

    let bannerCode = 't24'; 
    if (winner === (isPlayer1Local ? 'p1' : 'p2')) bannerCode = 't23';
    else if (winner) bannerCode = 't22';

    showPrzejscie(bannerCode, {
        onFinish: () => {
            playerLives = isPlayer1Local ? p1Lives : p2Lives;
            opponentLives = isPlayer1Local ? p2Lives : p1Lives;
            renderAll(currentNick);
        }
    });

    const myGYPos = { x: 3110, y: 1682 };
    const oppGYPos = { x: 3110, y: 168 };

    animateBoardToGraveyard(myBoardCards, myGYPos, () => {
        if (playerGraveyard) playerGraveyard.push(...myBoardCards.map(c => c.card));
        window.arrivedBoardCards.clear(); // Czyścimy po Round End
        renderAll(currentNick);
    });
    animateBoardToGraveyard(oppBoardCards, oppGYPos, () => {
        if (opponentGraveyard) opponentGraveyard.push(...oppBoardCards.map(c => c.card));
        renderAll(currentNick);
    });
}

function syncHand(serverHandNums) {
    const newHand = [];
    serverHandNums.forEach(num => {
        const existingCard = playerHand.find(c => c.numer === String(num));
        if (existingCard) {
            newHand.push(existingCard);
            playerHand = playerHand.filter(c => c !== existingCard);
        } else {
            const cardData = cards.find(c => c.numer === String(num));
            if (cardData) {
                newHand.push({ ...cardData, _id: Math.random() });
            }
        }
    });
    playerHand = newHand;
    playerHand.forEach(c => window.arrivedCards.add(c));
    sortHand();
    renderAll(currentNick);
}

/**
 * Tworzy element karty do animacji (identyczny jak w animacje.js ale bez zliczania).
 */
function createAnimationCardElement(card, w4K, h4K, isLarge = false, isOpponent = false) {
    const scale = Math.min(window.innerWidth / 3840, window.innerHeight / 2160);
    const wrapper = document.createElement('div');
    wrapper.className = 'moving-card-muster';
    wrapper.style.width = `${w4K * scale}px`;
    wrapper.style.height = `${h4K * scale}px`;
    wrapper.style.position = 'relative';

    if (isLarge) {
        const factionId = (isOpponent ? window.opponentFaction : window.playerFaction) || '1';
        wrapper.innerHTML = renderCardHTML(card, { playerFaction: factionId, isLargeView: true });
        // Dopasowanie czcionek
        const content = wrapper.querySelector('.card-content');
        if (content) {
            content.style.width = '100%';
            content.style.height = '100%';
            const points = content.querySelector('.points');
            if (points) points.style.fontSize = (h4K * scale * 0.1) + 'px';
            const name = content.querySelector('.name');
            if (name) name.style.fontSize = (h4K * scale * 0.044) + 'px';
            const desc = content.querySelector('.description');
            if (desc) desc.style.fontSize = (h4K * scale * 0.035) + 'px';
        }
    } else {
        const img = document.createElement('img');
        img.src = card.karta;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        wrapper.appendChild(img);
        addCardPointsOverlay(wrapper, card, w4K * scale, h4K * scale);
    }
    return wrapper;
}

// ========================================
// EKRAN KOŃCOWY GRY
// ========================================
function showEndGameScreen(gameResult, myNick, oppNick) {
    if (document.getElementById('end-game-screen')) return;

    let localResult;
    if (gameResult === 'draw') {
        localResult = 'draw';
    } else if (gameResult === (isPlayer1Local ? 'p1' : 'p2')) {
        localResult = 'win';
    } else {
        localResult = 'loss';
    }

    const soundMap = { win: 'winGraSound', loss: 'lossGraSound', draw: 'remisGraSound' };
    if (window.playSound) window.playSound(soundMap[localResult]);

    const screen = document.createElement('div');
    screen.id = 'end-game-screen';
    screen.style.cssText = `
        position: fixed; inset: 0; z-index: 99000;
        pointer-events: auto; overflow: hidden;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: grayscale(0.5);
        -webkit-backdrop-filter: grayscale(0.5);
        animation: endScreenFadeIn 0.8s ease forwards;
    `;

    // Ustawienie na body, by omijać inne kontenery
    document.body.appendChild(screen);

    const inner = document.createElement('div');
    inner.id = 'end-game-inner';
    inner.style.cssText = `
        position: absolute;
        width: 3840px; height: 2160px;
        transform-origin: left top;
    `;
    screen.appendChild(inner);

    const updateScale = () => {
        const innerEl = document.getElementById('end-game-inner');
        if (!innerEl) {
            window.removeEventListener('resize', updateScale);
            return;
        }
        const GUI_WIDTH = 3840;
        const GUI_HEIGHT = 2160;
        const scale = Math.min(window.innerWidth / GUI_WIDTH, window.innerHeight / GUI_HEIGHT);
        const boardLeft = (window.innerWidth - GUI_WIDTH * scale) / 2;
        const boardTop = (window.innerHeight - GUI_HEIGHT * scale) / 2;
        
        innerEl.style.left = boardLeft + 'px';
        innerEl.style.top = boardTop + 'px';
        innerEl.style.transform = `scale(${scale})`;
    };
    window.addEventListener('resize', updateScale);
    updateScale();

    const resultImgSrc = localResult === 'win' ? 'assets/asety/win.webp'
        : localResult === 'loss' ? 'assets/asety/lost.webp'
        : 'assets/asety/remis.webp';

    const resultImg = document.createElement('img');
    resultImg.src = resultImgSrc;
    resultImg.style.cssText = `
        position: absolute;
        left: 924px; top: 292px;
        animation: endImgPop 0.5s 0.3s ease backwards;
    `;
    inner.appendChild(resultImg);

    const resultTextMap = {
        win:  { text: 'ZWYCIĘSTWO!', color: '#d19c59' },
        loss: { text: 'Porażka',     color: '#9b2424' },
        draw: { text: 'Remis',       color: '#7b7b7b' }
    };
    const rtInfo = resultTextMap[localResult];
    const resultText = document.createElement('div');
    resultText.style.cssText = `
        position: absolute;
        left: 0; width: 3840px; text-align: center;
        top: 835px;
        font-family: 'PFDinTextCondPro-Bold', sans-serif;
        font-size: 96px;
        color: ${rtInfo.color};
        text-shadow: 0 0 40px ${rtInfo.color}88, 0 4px 12px #000;
        letter-spacing: 6px;
        animation: endTextSlide 0.6s 0.5s ease backwards;
    `;
    resultText.textContent = rtInfo.text;
    inner.appendChild(resultText);

    const tableDiv = document.createElement('div');
    tableDiv.style.cssText = `
        position: absolute;
        left: 0; top: 0; width: 3840px; height: 2160px;
        font-family: 'PFDinTextCondPro', sans-serif;
        animation: endTableFade 0.7s 0.7s ease backwards;
    `;
    inner.appendChild(tableDiv);

    const fontNormal = "'PFDinTextCondPro', sans-serif";
    const fontBold = "'PFDinTextCondPro-Bold', sans-serif";
    
    const renderTableText = (text, xCent, yCent, color, size, align='center', customFontFam=fontNormal) => {
        const d = document.createElement('div');
        d.style.cssText = `
            position: absolute;
            left: 0; top: ${yCent}px;
            width: 3840px; text-align: left;
            font-family: ${customFontFam};
            font-size: ${size}px;
            color: ${color};
        `;
        
        const innerSpan = document.createElement('span');
        innerSpan.textContent = text;
        innerSpan.style.position = 'absolute';
        
        if (align === 'center') {
            innerSpan.style.left = `${xCent}px`;
            innerSpan.style.transform = 'translate(-50%, -50%)';
        } else if (align === 'right') {
            innerSpan.style.right = `${3840 - xCent}px`;
            innerSpan.style.transform = 'translate(0, -50%)';
        }
        
        d.appendChild(innerSpan);
        tableDiv.appendChild(d);
    };

    const headerY = 1262;
    renderTableText('Runda 1', 1477, headerY, '#736f6f', 38, 'center');
    renderTableText('Runda 2', 1949, headerY, '#736f6f', 38, 'center');
    renderTableText('Runda 3', 2422, headerY, '#736f6f', 38, 'center');

    const myY = 1417; 
    renderTableText(myNick, 1100, myY, '#c29f5a', 45, 'right', fontBold);
    
    const oppY = 1574;
    renderTableText(oppNick, 1100, oppY, '#c29f5a', 45, 'right', fontBold);

    const getScoreColor = (myScore, oppScore, isMe) => {
        const myR = myScore ?? 0;
        const oppR = oppScore ?? 0;
        if (myR > oppR) return isMe ? '#e6b552' : '#cdcccc';
        if (myR < oppR) return isMe ? '#cdcccc' : '#e6b552';
        return '#cdcccc';
    };

    [1477, 1949, 2422].forEach((xVal, index) => {
        const rd = roundScoresHistory[index];
        let myVal = '—', oppVal = '—';
        let myColor = '#736f6f', oppColor = '#736f6f';

        if (rd !== undefined) {
            myVal = String(rd.myScore);
            oppVal = String(rd.oppScore);
            myColor = getScoreColor(rd.myScore, rd.oppScore, true);
            oppColor = getScoreColor(rd.myScore, rd.oppScore, false);
        }

        renderTableText(myVal, xVal, myY, myColor, 50, 'center');
        renderTableText(oppVal, xVal, oppY, oppColor, 50, 'center');
    });

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
        position: absolute;
        top: 1750px;
        left: 0; width: 3840px;
        display: flex; gap: 60px;
        justify-content: center; align-items: center;
    `;
    inner.appendChild(btnContainer);

    const makeBtn = (label, onClick, isPrimary = false) => {
        const btn = document.createElement('button');
        btn.style.cssText = `
            font-family: 'PFDinTextCondPro-Bold', sans-serif;
            font-size: 40px;
            color: ${isPrimary ? '#1a1108' : '#c7a76e'};
            background: ${isPrimary ? 'linear-gradient(135deg, #d4a74a, #a0782a)' : 'rgba(10, 8, 4, 0.85)'};
            border: 2px solid ${isPrimary ? '#e8c060' : '#7d6a45'};
            border-radius: 8px;
            padding: 20px 60px;
            cursor: pointer;
            letter-spacing: 2px;
            text-transform: uppercase;
            box-shadow: 0 6px 24px rgba(0,0,0,0.6), ${isPrimary ? 'inset 0 1px 0 rgba(255,220,120,0.3)' : ''};
            transition: transform 0.15s ease, filter 0.15s ease;
        `;
        btn.textContent = label;
        btn.onmouseenter = () => { btn.style.transform = 'scale(1.05)'; btn.style.filter = 'brightness(1.2)'; };
        btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; btn.style.filter = 'brightness(1)'; };
        btn.onclick = onClick;
        return btn;
    };

    const rematchBtn = makeBtn('Rewanż', () => {
        rematchBtn.disabled = true;
        rematchBtn.style.opacity = '0.6';
        rematchBtn.textContent = 'Oczekiwanie...';
        window.socket.emit('request-rematch', { gameCode: gameCodeLocal, isPlayer1: isPlayer1Local });
    }, true);

    const lobbyBtn = makeBtn('Powrót do lobby', () => {
        window.location.href = 'https://gwent-1vs1.uk';
    }, false);

    btnContainer.appendChild(lobbyBtn);
    btnContainer.appendChild(rematchBtn);

    if (window.socket) {
        window.socket.once('opponent-wants-rematch', () => {
            const notice = document.createElement('div');
            notice.style.cssText = `
                position: absolute; top: 1880px;
                left: 0; width: 3840px; text-align: center;
                color: #c29f5a; font-family: 'PFDinTextCondPro-Bold', sans-serif;
                font-size: 36px; letter-spacing: 2px;
                text-shadow: 0 2px 4px #000;
                animation: endTextSlide 0.4s ease backwards;
            `;
            notice.textContent = 'Przeciwnik chce rewanżu!';
            inner.appendChild(notice);
        });
    }

    if (!document.getElementById('end-screen-keyframes')) {
        const style = document.createElement('style');
        style.id = 'end-screen-keyframes';
        style.textContent = `
            @keyframes endScreenFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes endImgPop { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
            @keyframes endTextSlide { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes endTableFade { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    }
}
