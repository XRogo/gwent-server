// Funkcje walidacyjne i wykonawcze dla kart królów (liderów) Gwinta.
// Ten plik jest ładowany dynamicznie zarówno przez serwer, jak i klienta (jeśli wymagane).
import cardsData from './cards.js';

// Na serwerze cards jest wstrzykiwane przez new Function — tu fallback dla klienta
const _cards = typeof cards !== 'undefined' ? cards : cardsData;

function getPlayerSide(isPlayer1) {
    return isPlayer1 ? 'p1' : 'p2';
}

function getOpponentSide(isPlayer1) {
    return isPlayer1 ? 'p2' : 'p1';
}

function calculateEffectivePower(cardNum, rowKey, board, state) {
    // Jeżeli funkcja jest wstrzyknięta przez serwer, użyj jej (na wypadek gdyby serwer miał nowszą wersję)
    if (typeof globalThis.calculateEffectivePower === 'function') {
        return globalThis.calculateEffectivePower(cardNum, rowKey, board, state);
    }
    const card = _cards.find(c => String(c.numer) === String(cardNum));
    if (!card || typeof card.punkty !== 'number') return -1;
    if (card.bohater) return -1;

    const rowCards = board[rowKey] || [];
    const rowNum = parseInt(rowKey.slice(-1)); 
    const rowSide = rowKey.substring(0, 2);
    const specialSlot = `${rowSide}S${rowNum}`;
    const specialCardNum = board[specialSlot];

    const weatherMap = { 1: 'mroz', 2: 'mgla', 3: 'deszcz' };
    const weatherType = weatherMap[rowNum];
    const weatherActive = (board.weather || []).some(wStr => {
        const wNum = wStr.split('-')[1];
        const wCard = _cards.find(c => String(c.numer) === String(wNum));
        return wCard && (wCard.moc === weatherType || (wCard.moc === 'sztorm' && (weatherType === 'mgla' || weatherType === 'deszcz')));
    });

    let hornActive = false;
    if (specialCardNum) {
        const sCard = _cards.find(c => String(c.numer) === String(specialCardNum));
        if (sCard && sCard.moc === 'rog') hornActive = true;
    }
    if (rowCards.some(n => { const c = _cards.find(x => String(x.numer) === String(n)); return c && !c.bohater && c.moc === 'rog'; })) {
        hornActive = true;
    }

    const moraleCount = rowCards.reduce((acc, n) => {
        const c = _cards.find(x => String(x.numer) === String(n));
        return (c && !c.bohater && c.moc === 'morale') ? acc + 1 : acc;
    }, 0);

    const wiezCount = rowCards.filter(n => {
        const c1 = _cards.find(x => String(x.numer) === String(n));
        return c1 && c1.nazwa === card.nazwa;
    }).length;

    const leaderForSide = rowSide === 'p1' ? state.p1Leader : state.p2Leader;
    const hasBran = String(leaderForSide) === '5001';

    let pts = card.punkty;
    if (weatherActive) {
        if (hasBran) {
            pts = Math.ceil(card.punkty / 2);
        } else {
            pts = 1;
        }
    }

    const isEredin4005Active = String(state.p1Leader) === '4005' || String(state.p2Leader) === '4005';
    if (isEredin4005Active && card.moc === 'szpieg') {
        pts *= 2;
    }

    if (card.moc === 'wiez') pts *= wiezCount;

    const mBuff = (card.moc === 'morale') ? (moraleCount - 1) : moraleCount;
    if (mBuff > 0) pts += mBuff;

    if (hornActive) pts *= 2;

    return pts;
}

function getRowTotalPower(rowKey, board, state) {
    // Oblicz sumę siły rzędu z uwzględnieniem buffów
    const rowCards = board[rowKey] || [];
    let total = 0;
    rowCards.forEach(cardNum => {
        const eff = calculateEffectivePower(cardNum, rowKey, board, state);
        if (eff >= 0) total += eff;
    });
    return total;
}

function isLeaderUsable(leaderNum, state, isPlayer1) {
    const side = getPlayerSide(isPlayer1);
    const opp = getOpponentSide(isPlayer1);

    // 1. Sprawdź czy lider nie został już zużyty
    if (state[`${side}LeaderUsed`]) return false;

    // 2. Sprawdź czy lider nie jest zablokowany przez przeciwnika
    if (state[`${side}LeaderBlocked`]) return false;

    const deck = isPlayer1 ? state.p1Deck : state.p2Deck;
    const hand = isPlayer1 ? state.p1Hand : state.p2Hand;
    const graveyard = isPlayer1 ? state.p1Graveyard : state.p2Graveyard;
    const oppGraveyard = isPlayer1 ? state.p2Graveyard : state.p1Graveyard;
    const oppHand = isPlayer1 ? state.p2Hand : state.p1Hand;

    const isWeather = (c) => c && ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(c.moc);
    const isNormalUnit = (c) => c && !c.bohater && c.typ !== 'specjalna' && c.moc !== 'rog' && !['000','001','002','003','004','005','006','007','008'].includes(String(c.numer)) && !isWeather(c);
    const _c = _cards;

    switch (String(leaderNum)) {
        // --- PÓŁNOC ---
        case "1001": // Foltest Król Temerii: Zagraj Gęstą mgłę z talii
            return deck.some(num => {
                const c = _c.find(x => String(x.numer) === String(num));
                return c && c.moc === 'mgla';
            });
        case "1002": // Foltest Dowódca Północy: Usuń efekty pogodowe
            return state.board.weather && state.board.weather.length > 0;
        case "1003": // Foltest Zdobywca: Róg w rzędzie oblężniczym (S3)
            return !state.board[`${side}S3`];
        case "1004": // Foltest Żelazny Władca: Zniszcz najsilniejsze oblężnicze wroga jeśli suma >= 10
            return getRowTotalPower(`${opp}R3`, state.board, state) >= 10;
        case "1005": // Foltest Syn Medella: Zniszcz najsilniejsze strzeleckie wroga jeśli suma >= 10
            return getRowTotalPower(`${opp}R2`, state.board, state) >= 10;

        // --- NILFGAARD ---
        case "2001": // Emhyr Jeż z Erlenwaldu: Zagraj Deszcz z talii
            return deck.some(num => {
                const c = _c.find(x => String(x.numer) === String(num));
                return c && c.moc === 'deszcz';
            });
        case "2002": // Emhyr Cesarz Nilfgaardu: Zobacz 3 losowe karty z ręki przeciwnika
            return (state.oppHandCount !== undefined ? state.oppHandCount > 0 : (oppHand && oppHand.length > 0));
        case "2003": // Emhyr Biały Płomień: Blokuje lidera przeciwnika (pasywny)
        case "2005": // Emhyr Najeźdźca: Pasywny
            return false; // pasywne, nieaktywowalne
        case "2004": // Emhyr Pan Południa: Wybierz kartę z cmentarza przeciwnika
            return oppGraveyard.some(num => {
                const c = _c.find(x => String(x.numer) === String(num));
                return isNormalUnit(c);
            });

        // --- SCOIA'TAEL ---
        case "3001": // Francesca Elfka czystej krwi: Zagraj Trzaskający Mróz z talii
            return deck.some(num => {
                const c = _c.find(x => String(x.numer) === String(num));
                return c && c.moc === 'mroz';
            });
        case "3002": // Francesca Stokrotka: Pasywna
            return false;
        case "3003": // Francesca Najpiękniejsza: Róg w rzędzie strzeleckim (S2)
            return !state.board[`${side}S2`];
        case "3004": // Francesca Królowa: Zniszcz najsilniejsze zwarciowe wroga jeśli suma >= 10
            return getRowTotalPower(`${opp}R1`, state.board, state) >= 10;
        case "3005": // Francesca Nadzieja: Przesuwa zręcznych do optymalnych rzędów
            {
                const r1 = state.board[`${side}R1`] || [];
                const r2 = state.board[`${side}R2`] || [];
                return r1.concat(r2).some(num => {
                    const c = _c.find(x => String(x.numer) === String(num));
                    return c && c.pozycja === 4;
                });
            }

        // --- POTWORY ---
        case "4001": // Eredin Król Dzikiego Gonu: Wybierz pogodę z talii
            return deck.some(num => {
                const c = _c.find(x => String(x.numer) === String(num));
                return isWeather(c);
            });
        case "4002": // Eredin Dowódca: Róg w zwarciu (S1)
            return !state.board[`${side}S1`];
        case "4003": // Eredin Władca: Odrzuć 2 i wybierz 1 z talii
            return hand.length >= 2 && deck.length > 0;
        case "4004": // Eredin Zabójca: Weź kartę z własnego cmentarza
            return graveyard.some(num => {
                const c = _c.find(x => String(x.numer) === String(num));
                return isNormalUnit(c);
            });
        case "4005": // Eredin Zdradziecki: Pasywna
        case "5001": // Król Bran: Pasywna
            return false;

        case "5002": // Crach an Craite: Wtasuj cmentarze
            return graveyard.length > 0 || oppGraveyard.length > 0;

        default:
            return false;
    }
}


function executeLeaderEffect(leaderNum, state, isPlayer1, io, gameCode, additionalData = {}) {
    const side = getPlayerSide(isPlayer1);
    const opp = getOpponentSide(isPlayer1);
    const deck = isPlayer1 ? state.p1Deck : state.p2Deck;
    const hand = isPlayer1 ? state.p1Hand : state.p2Hand;
    const graveyard = isPlayer1 ? state.p1Graveyard : state.p2Graveyard;
    const oppGraveyard = isPlayer1 ? state.p2Graveyard : state.p1Graveyard;

    state[`${side}LeaderUsed`] = true;

    const isWeather = (c) => c && ['mroz', 'mgla', 'deszcz', 'sztorm', 'niebo'].includes(c.moc);
    const isNormalUnit = (c) => c && !c.bohater && c.typ !== 'specjalna' && c.moc !== 'rog' && !['000','001','002','003','004','005','006','007','008'].includes(String(c.numer)) && !isWeather(c);

    const playWeatherFromDeck = (weatherMoc) => {
        const idx = deck.findIndex(num => {
            const c = cards.find(x => String(x.numer) === String(num));
            return c && c.moc === weatherMoc;
        });
        if (idx !== -1) {
            const cardNum = deck.splice(idx, 1)[0];
            state.board.weather.push(`${side}-${cardNum}`);
            return cardNum;
        }
        return null;
    };

    const destroyStrongestInRow = (rowKey) => {
        const rArray = state.board[rowKey] || [];
        let maxVal = -1;
        let targets = [];

        rArray.forEach((cNum, idx) => {
            const c = cards.find(x => String(x.numer) === String(cNum));
            if (!c || c.bohater || typeof c.punkty !== 'number') return;
            const effPts = calculateEffectivePower(cNum, rowKey, state.board, state);
            if (effPts < 0) return;
            if (effPts > maxVal) {
                maxVal = effPts;
                targets = [{ row: rowKey, index: idx, num: cNum }];
            } else if (effPts === maxVal) {
                targets.push({ row: rowKey, index: idx, num: cNum });
            }
        });

        if (maxVal >= 0) {
            targets.sort((a, b) => b.index - a.index).forEach(t => {
                state.board[t.row].splice(t.index, 1);
                if (t.row.startsWith('p1')) state.p1Graveyard.push(t.num);
                else state.p2Graveyard.push(t.num);
            });
            return targets.map(t => t.num);
        }
        return [];
    };

    switch (String(leaderNum)) {
        case "1001": // Foltest Temeria: Gęsta mgła z talii
            {
                const cardNum = playWeatherFromDeck('mgla');
                return { action: 'weather', card: cardNum };
            }
        case "1002": // Foltest Dowódca: Czyste niebo
            {
                let weatherCleared = [...state.board.weather];
                state.board.weather.forEach(wStr => {
                    const parts = wStr.split('-');
                    const wOwner = parts[0];
                    const wNum = parts[1];
                    if (wOwner === 'p1') state.p1Graveyard.push(wNum);
                    else state.p2Graveyard.push(wNum);
                });
                state.board.weather = [];
                return { action: 'clear_weather', cleared: weatherCleared };
            }
        case "1003": // Foltest Zdobywca: Róg w S3
            state.board[`${side}S3`] = "002";
            return { action: 'horn', row: 3 };

        case "1004": // Foltest Żelazny Władca: Zniszcz najsilniejsze oblężnicze wroga
            {
                const destroyed = destroyStrongestInRow(`${opp}R3`);
                return { action: 'scorch', destroyed };
            }
        case "1005": // Foltest Syn Medella: Zniszcz najsilniejsze strzeleckie wroga
            {
                const destroyed = destroyStrongestInRow(`${opp}R2`);
                return { action: 'scorch', destroyed };
            }

        case "2001": // Emhyr Jeż: Deszcz z talii
            {
                const cardNum = playWeatherFromDeck('deszcz');
                return { action: 'weather', card: cardNum };
            }
        case "2002": // Emhyr Cesarz: Zobacz 3 losowe karty wroga
            {
                const oppHand = isPlayer1 ? state.p2Hand : state.p1Hand;
                const shuffled = [...oppHand].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 3);
                return { action: 'peek_hand', cards: selected };
            }
        case "2004": // Emhyr Pan Południa: Wybierz z cmentarza wroga
            {
                const eligible = oppGraveyard.filter(num => {
                    const c = cards.find(x => String(x.numer) === String(num));
                    return isNormalUnit(c);
                });
                if (eligible.length === 1) {
                    // Automatycznie przenieś jedyną kartę do ręki
                    const num = eligible[0];
                    const idx = oppGraveyard.indexOf(num);
                    if (idx !== -1) oppGraveyard.splice(idx, 1);
                    hand.push(num);
                    return { action: 'take_graveyard_card', card: num, auto: true };
                } else if (eligible.length > 1) {
                    // Czekaj na wybór od gracza
                    state.leaderSelectPending = {
                        isPlayer1,
                        type: 'opp_graveyard',
                        cards: eligible
                    };
                    return { action: 'select_prompt', type: 'opp_graveyard', cards: eligible };
                }
                return { action: 'none' };
            }

        case "3001": // Francesca Elfka: Mróz z talii
            {
                const cardNum = playWeatherFromDeck('mroz');
                return { action: 'weather', card: cardNum };
            }
        case "3003": // Francesca Najpiękniejsza: Róg w S2
            state.board[`${side}S2`] = "002";
            return { action: 'horn', row: 2 };

        case "3004": // Francesca Królowa: Zniszcz najsilniejsze zwarciowe wroga
            {
                const destroyed = destroyStrongestInRow(`${opp}R1`);
                return { action: 'scorch', destroyed };
            }
        case "3005": // Francesca Nadzieja: Optymalizuj zręczne
            {
                const r1 = state.board[`${side}R1`] || [];
                const r2 = state.board[`${side}R2`] || [];
                const allCards = r1.concat(r2);
                const agileCards = allCards.filter(num => {
                    const c = cards.find(x => String(x.numer) === String(num));
                    return c && c.pozycja === 4;
                });
                const otherCards = allCards.filter(num => {
                    const c = cards.find(x => String(x.numer) === String(num));
                    return !c || c.pozycja !== 4;
                });

                // Sprawdźmy wszystkie możliwe przypisania (2^N permutacji) kart zręcznych do rzędów R1 i R2
                let bestScore = -1;
                let bestAssignment = null;

                const limit = 1 << agileCards.length;
                for (let mask = 0; mask < limit; mask++) {
                    const tempR1 = [...otherCards.filter(num => r1.includes(num))];
                    const tempR2 = [...otherCards.filter(num => r2.includes(num))];
                    
                    agileCards.forEach((num, idx) => {
                        if ((mask & (1 << idx)) === 0) {
                            tempR1.push(num);
                        } else {
                            tempR2.push(num);
                        }
                    });

                    // Oblicz siłę
                    const tempBoard = { ...state.board };
                    tempBoard[`${side}R1`] = tempR1;
                    tempBoard[`${side}R2`] = tempR2;

                    const score = getRowTotalPower(`${side}R1`, tempBoard, state) + getRowTotalPower(`${side}R2`, tempBoard, state);
                    if (score > bestScore) {
                        bestScore = score;
                        bestAssignment = { r1: tempR1, r2: tempR2 };
                    }
                }

                if (bestAssignment) {
                    state.board[`${side}R1`] = bestAssignment.r1;
                    state.board[`${side}R2`] = bestAssignment.r2;
                }
                return { action: 'optimize_agile' };
            }

        case "4001": // Eredin Król Gonu: Wybierz pogodę z talii
            {
                const eligible = deck.filter(num => {
                    const c = cards.find(x => String(x.numer) === String(num));
                    return isWeather(c);
                });
                state.leaderSelectPending = {
                    isPlayer1,
                    type: 'weather_deck',
                    cards: eligible
                };
                return { action: 'select_prompt', type: 'weather_deck', cards: eligible };
            }
        case "4002": // Eredin Dowódca: Róg w zwarciu
            state.board[`${side}S1`] = "002";
            return { action: 'horn', row: 1 };

        case "4003": // Eredin Władca: Odrzuć 2 i wybierz 1 z talii
            {
                state.leaderSelectPending = {
                    isPlayer1,
                    type: 'discard_two',
                    cards: hand
                };
                return { action: 'select_prompt', type: 'discard_two', cards: hand };
            }
        case "4004": // Eredin Zabójca: Weź ze swojego cmentarza
            {
                const eligible = graveyard.filter(num => {
                    const c = cards.find(x => String(x.numer) === String(num));
                    return isNormalUnit(c);
                });
                if (eligible.length === 1) {
                    const num = eligible[0];
                    const idx = graveyard.indexOf(num);
                    if (idx !== -1) graveyard.splice(idx, 1);
                    hand.push(num);
                    return { action: 'take_graveyard_card', card: num, auto: true };
                } else if (eligible.length > 1) {
                    state.leaderSelectPending = {
                        isPlayer1,
                        type: 'own_graveyard',
                        cards: eligible
                    };
                    return { action: 'select_prompt', type: 'own_graveyard', cards: eligible };
                }
                return { action: 'none' };
            }

        case "5002": // Crach an Craite: Przemieszaj cmentarze do talii
            {
                const p1Grave = [...state.p1Graveyard];
                const p2Grave = [...state.p2Graveyard];

                state.p1Deck = [...state.p1Deck, ...p1Grave];
                state.p1Graveyard = [];
                for (let i = state.p1Deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [state.p1Deck[i], state.p1Deck[j]] = [state.p1Deck[j], state.p1Deck[i]];
                }

                state.p2Deck = [...state.p2Deck, ...p2Grave];
                state.p2Graveyard = [];
                for (let i = state.p2Deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [state.p2Deck[i], state.p2Deck[j]] = [state.p2Deck[j], state.p2Deck[i]];
                }

                return { action: 'reshuffle_graveyards' };
            }

        default:
            return { action: 'none' };
    }
}

export { isLeaderUsable, executeLeaderEffect };
