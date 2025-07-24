// Podgląd powiększenia kart
import * as moce from './moce.js';
import { krole } from './krole.js';

let powiekIndex = 0;
let powiekDeck = [];
let powiekActive = false;
let powiekMode = 'cards'; // 'cards' lub 'leaders'

function showPowiek(deck, index, mode = 'cards') {
    powiekDeck = deck;
    powiekIndex = index;
    powiekActive = true;
    powiekMode = mode;
    renderPowiek();
}

function hidePowiek() {
    powiekActive = false;
    const el = document.getElementById('powiekOverlay');
    if (el) el.remove();
    const powiekBg = document.getElementById('powiekBg');
    if(powiekBg) powiekBg.remove();
}

function renderPowiek() {
    // Usuwam poprzedni overlay i tło powiek, jeśli istnieje
    const oldOverlay = document.getElementById('powiekOverlay');
    if (oldOverlay) oldOverlay.remove();
    const oldBg = document.getElementById('powiekBg');
    if (oldBg) oldBg.remove();
    if (!powiekActive || powiekDeck.length === 0) return;
    // Pobierz gui/plansza jako bazę skalowania
    const gui = document.getElementById('gui') || document.getElementById('plansza');
    let guiRect;
    if(gui && gui.offsetWidth > 0 && gui.offsetHeight > 0) {
        guiRect = gui.getBoundingClientRect();
    } else {
        guiRect = {left:0,top:0,width:window.innerWidth,height:window.innerHeight};
    }
    // Skalowanie względem tłopowiek.webp (4K: 3837x2158)
    const tloW = guiRect.width;
    const tloH = guiRect.height;
    const scaleW = tloW / 3837;
    const scaleH = tloH / 2158;
    const offsetLeft = guiRect.left;
    const offsetTop = guiRect.top;
    // Warstwa tła powiek
    const powiekBg = document.createElement('img');
    powiekBg.id = 'powiekBg';
    powiekBg.src = 'assets/asety/tłopowiek.webp';
    powiekBg.style.position = 'absolute';
    powiekBg.style.left = guiRect.left+'px';
    powiekBg.style.top = guiRect.top+'px';
    powiekBg.style.width = guiRect.width+'px';
    powiekBg.style.height = guiRect.height+'px';
    powiekBg.style.zIndex = 99998;
    powiekBg.style.pointerEvents = 'none';
    powiekBg.style.objectFit = 'contain';
    powiekBg.style.background = 'none';
    powiekBg.style.opacity = '1';
    powiekBg.style.filter = 'none';
    document.body.appendChild(powiekBg);
    // Overlay na karty
    const overlay = document.createElement('div');
    overlay.id = 'powiekOverlay';
    overlay.className = 'powiek-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = 99999;
    overlay.style.pointerEvents = 'auto';
    overlay.style.background = 'none';
    overlay.style.opacity = '1';
    overlay.style.filter = 'none';
    overlay.style.overflow = 'hidden';
    overlay.onclick = hidePowiek;
    document.body.appendChild(overlay);
    // Funkcja pomocnicza: px w 4K -> % względem tłopowiek.webp
    function percentW(px) { return (px/3837)*100; }
    function percentH(px) { return (px/2158)*100; }
    // Pozycje kart w 4K względem tłopowiek.webp (teraz w %)
    const positions = [
        {left:percentW(468),top:percentH(444),width:percentW(899-468),height:percentH(1261-444)},
        {left:percentW(1040),top:percentH(444),width:percentW(1563-1040),height:percentH(1436-444)},
        {left:percentW(1617),top:percentH(456),width:percentW(2222-1617),height:percentH(1609-456)},
        {left:percentW(2274),top:percentH(444),width:percentW(2799-2274),height:percentH(1436-444)},
        {left:percentW(2938),top:percentH(444),width:percentW(3371-2938),height:percentH(1261-444)}
    ];
    // Karty
    for(let i=-2;i<=2;i++){
        const idx = powiekIndex+i;
        if(idx<0||idx>=powiekDeck.length) continue;
        const card = powiekDeck[idx];
        const pos = positions[i+2];
        const cardDiv = document.createElement('div');
        cardDiv.className = 'powiek-card';
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = pos.left+'%';
        cardDiv.style.top = pos.top+'%';
        cardDiv.style.width = pos.width+'%';
        cardDiv.style.height = pos.height+'%';
        cardDiv.style.zIndex = i===0?100:50;
        cardDiv.style.transition = 'all 0.4s cubic-bezier(.77,0,.18,1)';
        cardDiv.style.overflow = 'visible';
        // Warstwy karty wg infoo.txt
        // 1: podsw.webp (jeśli wybrana, tylko środkowa)
        if(i===0){
            const podsw = document.createElement('img');
            podsw.src = '/gwent/assets/dkarty/podsw.webp';
            podsw.style.position = 'absolute';
            podsw.style.left = percentW(-104)+'%';
            podsw.style.top = percentH(-10)+'%';
            podsw.style.width = percentW(523)+'%';
            podsw.style.height = percentH(992)+'%';
            podsw.style.zIndex = 1;
            cardDiv.appendChild(podsw);
            // 2: podsw2.webp (pulsuje)
            const podsw2 = document.createElement('img');
            podsw2.src = '/gwent/assets/dkarty/podsw2.webp';
            podsw2.style.position = 'absolute';
            podsw2.style.left = percentW(-104)+'%';
            podsw2.style.top = percentH(-10)+'%';
            podsw2.style.width = percentW(523)+'%';
            podsw2.style.height = percentH(992)+'%';
            podsw2.style.zIndex = 2;
            podsw2.style.animation = 'powiek-pulse 1.5s infinite';
            cardDiv.appendChild(podsw2);
        }
        // 3: obraz karty
        const img = document.createElement('img');
        img.src = card.dkarta;
        img.style.position = 'absolute';
        img.style.left = '0';
        img.style.top = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.zIndex = 3;
        cardDiv.appendChild(img);
        // 4: beton/bbeton
        const beton = document.createElement('img');
        beton.src = card.bohater ? 'assets/dkarty/bbeton.webp' : 'assets/dkarty/beton.webp';
        beton.style.position = 'absolute';
        beton.style.left = '0';
        beton.style.top = '0';
        beton.style.width = '100%';
        beton.style.height = '100%';
        beton.style.zIndex = 4;
        cardDiv.appendChild(beton);
        // 5: pasek frakcji
        if(card.frakcja && card.frakcja !== 'nie'){
            const bannerDiv = document.createElement('img');
            bannerDiv.src = `assets/dkarty/${card.frakcja === '1' ? 'polnoc.webp' : card.frakcja === '2' ? 'nilfgaard.webp' : card.frakcja === '3' ? 'scoiatael.webp' : card.frakcja === '4' ? 'potwory.webp' : 'skellige.webp'}`;
            bannerDiv.style.position = 'absolute';
            bannerDiv.style.left = '0';
            bannerDiv.style.top = '0';
            bannerDiv.style.width = '100%';
            bannerDiv.style.height = '100%';
            bannerDiv.style.zIndex = 5;
            cardDiv.appendChild(bannerDiv);
        }
        // 6: pozycja
        if(card.pozycja){
            const posIcon = document.createElement('img');
            posIcon.src = `assets/dkarty/pozycja${card.pozycja}.webp`;
            posIcon.style.position = 'absolute';
            posIcon.style.left = '0';
            posIcon.style.top = '0';
            posIcon.style.width = '100%';
            posIcon.style.height = '100%';
            posIcon.style.zIndex = 6;
            cardDiv.appendChild(posIcon);
        }
        // 7: punkty okienko
        if(card.punkty !== undefined){
            const pointsBg = document.createElement('img');
            pointsBg.src = card.bohater ? 'assets/dkarty/bohater.webp' : 'assets/dkarty/punkty.webp';
            pointsBg.style.position = 'absolute';
            pointsBg.style.left = percentW(-23)+'%';
            pointsBg.style.top = percentH(-21)+'%';
            pointsBg.style.width = percentW(523)+'%';
            pointsBg.style.height = percentH(992)+'%';
            pointsBg.style.zIndex = 7;
            cardDiv.appendChild(pointsBg);
            const pointsDiv = document.createElement('div');
            pointsDiv.innerText = card.punkty;
            pointsDiv.style.position = 'absolute';
            pointsDiv.style.top = percentH(77)+'%'; // 7.8%*992=77
            pointsDiv.style.left = percentW(76)+'%'; // 14.5%*523=76
            pointsDiv.style.width = percentW(123)+'%'; // 23.61%*523=123
            pointsDiv.style.height = percentH(88)+'%'; // 8.84%*992=88
            pointsDiv.style.fontSize = percentW(220)+'%';
            pointsDiv.style.color = card.bohater ? '#fcfdfc' : '#000000';
            pointsDiv.style.zIndex = 8;
            pointsDiv.style.display = 'flex';
            pointsDiv.style.justifyContent = 'center';
            pointsDiv.style.alignItems = 'center';
            cardDiv.appendChild(pointsDiv);
        }
        // 10: nazwa karty
        const nameDiv = document.createElement('div');
        nameDiv.innerText = card.nazwa;
        nameDiv.style.position = 'absolute';
        nameDiv.style.left = percentW(113)+'%';
        nameDiv.style.top = percentH(766)+'%';
        nameDiv.style.width = percentW(518)+'%';
        nameDiv.style.height = percentH(111)+'%';
        nameDiv.style.textAlign = 'center';
        nameDiv.style.fontSize = percentW(44)+'%';
        nameDiv.style.color = '#474747';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.zIndex = 10;
        nameDiv.style.whiteSpace = 'normal';
        nameDiv.style.wordBreak = 'break-word';
        nameDiv.style.lineHeight = '1.1';
        nameDiv.style.padding = '0 4px';
        nameDiv.style.transform = 'none';
        cardDiv.appendChild(nameDiv);
        // Opis pod dużą kartą
        if(i===0){
            const opisDiv = document.createElement('div');
            opisDiv.innerText = card.opis||'';
            opisDiv.style.position = 'absolute';
            opisDiv.style.left = percentW(9)+'%';
            opisDiv.style.top = percentH(879)+'%';
            opisDiv.style.width = percentW(514)+'%';
            opisDiv.style.height = percentH(991)+'%';
            opisDiv.style.textAlign = 'center';
            opisDiv.style.color = '#fff';
            opisDiv.style.fontSize = percentW(44)+'%';
            opisDiv.style.zIndex = 20;
            cardDiv.appendChild(opisDiv);
        }
        overlay.appendChild(cardDiv);
    }
    // Okienko infor.webp dla środkowej karty jeśli wymaga
    const card0 = powiekDeck[powiekIndex];
    if(card0 && card0.moc){
        const infoBox = document.createElement('img');
        infoBox.src = 'assets/asety/infor.webp';
        infoBox.style.position = 'absolute';
        infoBox.style.left = (1356*scaleW+offsetLeft)+'px';
        infoBox.style.top = (1661*scaleH+offsetTop)+'px';
        infoBox.style.width = (695*scaleW)+'px';
        infoBox.style.height = (202*scaleH)+'px';
        infoBox.style.zIndex = 200;
        overlay.appendChild(infoBox);
        // Ikona mocy
        const mocIcon = document.createElement('img');
        mocIcon.src = `assets/dkarty/${card0.moc}.webp`;
        mocIcon.style.position = 'absolute';
        mocIcon.style.left = (1356*scaleW+offsetLeft+10*scaleW)+'px';
        mocIcon.style.top = (1661*scaleH+offsetTop+10*scaleH)+'px';
        mocIcon.style.width = (64*scaleW)+'px';
        mocIcon.style.height = (64*scaleH)+'px';
        mocIcon.style.zIndex = 201;
        overlay.appendChild(mocIcon);
        // Nazwa mocy
        const mocName = document.createElement('div');
        mocName.textContent = window.moce?.[card0.moc]?.nazwa || '';
        mocName.style.position = 'absolute';
        mocName.style.left = (1356*scaleW+offsetLeft)+'px';
        mocName.style.top = (1735*scaleH+offsetTop)+'px';
        mocName.style.width = (695*scaleW)+'px';
        mocName.style.textAlign = 'center';
        mocName.style.fontWeight = 'bold';
        mocName.style.fontSize = (44*scaleW)+'px';
        mocName.style.color = '#c7a76e';
        mocName.style.zIndex = 202;
        overlay.appendChild(mocName);
        // Opis mocy
        const mocDesc = document.createElement('div');
        mocDesc.textContent = window.moce?.[card0.moc]?.opis || '';
        mocDesc.style.position = 'absolute';
        mocDesc.style.left = (1356*scaleW+offsetLeft)+'px';
        mocDesc.style.top = (1814*scaleH+offsetTop)+'px';
        mocDesc.style.width = (695*scaleW)+'px';
        mocDesc.style.textAlign = 'center';
        mocDesc.style.fontSize = (32*scaleW)+'px';
        mocDesc.style.color = '#c7a76e';
        mocDesc.style.zIndex = 203;
        overlay.appendChild(mocDesc);
    }
}

// Dodaj dynamiczne skalowanie powiększenia kart względem planszy/gui
window.addEventListener('resize', () => {
    if (powiekActive) {
        renderPowiek();
    }
});

// Obsługa prawego kliknięcia na kartę lub dowódcę
window.addEventListener('contextmenu', function(e){
    const cardEl = e.target.closest('.card, .powiek-card');
    if(cardEl&&cardEl.dataset&&cardEl.dataset.index){
        e.preventDefault();
        // deck i index muszą być przekazane z logiki gry
        showPowiek(window.deckForPowiek||[],parseInt(cardEl.dataset.index),'cards');
    }
    // Wybór dowódców przez przycisk 'x'
    if(e.target.classList.contains('leader-card-x')){
        e.preventDefault();
        showPowiek(krole,0,'leaders');
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'x' || event.key === 'X') {
        console.log('Naciśnięto klawisz X');
        let factionId = localStorage.getItem('faction');
        let leaders;
        if (factionId) {
            leaders = krole.filter(krol => krol.frakcja === factionId);
            if (factionId === '5') leaders = leaders.slice(0,2);
        } else {
            leaders = krole.slice(0,5); // fallback: 5 pierwszych
        }
        if (leaders.length === 0) return;
        showPowiek(leaders, 0, 'leaders');
        console.log('Podgląd dowódców aktywowany');
    }
});

export { showPowiek, hidePowiek };