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
    const scaleW = guiRect.width / 3837;
    const scaleH = guiRect.height / 2158;
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
    powiekBg.style.objectFit = 'cover';
    document.body.appendChild(powiekBg);
    // Overlay na karty
    const overlay = document.createElement('div');
    overlay.id = 'powiekOverlay';
    overlay.className = 'powiek-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = guiRect.left+'px';
    overlay.style.top = guiRect.top+'px';
    overlay.style.width = guiRect.width+'px';
    overlay.style.height = guiRect.height+'px';
    overlay.style.zIndex = 99999;
    overlay.style.pointerEvents = 'auto';
    overlay.onclick = hidePowiek;
    document.body.appendChild(overlay);
    // Pozycje kart w 4K
    const positions = [
        {left:468,top:444,width:899-468,height:1261-444},
        {left:1040,top:444,width:1563-1040,height:1436-444},
        {left:1617,top:456,width:2222-1617,height:1609-456},
        {left:2274,top:444,width:2799-2274,height:1436-444},
        {left:2938,top:444,width:3371-2938,height:1261-444}
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
        cardDiv.style.left = (pos.left*scaleW+offsetLeft)+'px';
        cardDiv.style.top = (pos.top*scaleH+offsetTop)+'px';
        cardDiv.style.width = (pos.width*scaleW)+'px';
        cardDiv.style.height = (pos.height*scaleH+'px');
        cardDiv.style.zIndex = i===0?100:50;
        cardDiv.style.transition = 'all 0.4s cubic-bezier(.77,0,.18,1)';
        cardDiv.style.overflow = 'visible';
        // Warstwy karty wg infoo.txt
        // 1: podsw.webp (jeśli wybrana, tylko środkowa)
        if(i===0){
            const podsw = document.createElement('img');
            podsw.src = '/gwent/assets/dkarty/podsw.webp';
            podsw.style.position = 'absolute';
            podsw.style.left = (-104*scaleW)+'px';
            podsw.style.top = (-10*scaleH)+'px';
            podsw.style.width = (523*scaleW)+'px';
            podsw.style.height = (992*scaleH)+'px';
            podsw.style.zIndex = 1;
            cardDiv.appendChild(podsw);
            // 2: podsw2.webp (pulsuje)
            const podsw2 = document.createElement('img');
            podsw2.src = '/gwent/assets/dkarty/podsw2.webp';
            podsw2.style.position = 'absolute';
            podsw2.style.left = (-104*scaleW)+'px';
            podsw2.style.top = (-10*scaleH)+'px';
            podsw2.style.width = (523*scaleW)+'px';
            podsw2.style.height = (992*scaleH)+'px';
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
            pointsBg.style.left = (-23*scaleW)+'px';
            pointsBg.style.top = (-21*scaleH)+'px';
            pointsBg.style.width = (523*scaleW)+'px';
            pointsBg.style.height = (992*scaleH)+'px';
            pointsBg.style.zIndex = 7;
            cardDiv.appendChild(pointsBg);
            const pointsDiv = document.createElement('div');
            pointsDiv.innerText = card.punkty;
            pointsDiv.style.position = 'absolute';
            pointsDiv.style.top = (7.8*cardDiv.offsetHeight/100)+'px';
            pointsDiv.style.left = (14.5*cardDiv.offsetWidth/100)+'px';
            pointsDiv.style.width = (23.61*cardDiv.offsetWidth/100)+'px';
            pointsDiv.style.height = (8.84*cardDiv.offsetHeight/100)+'px';
            pointsDiv.style.fontSize = (220*cardDiv.offsetWidth/523)+'px';
            pointsDiv.style.color = card.bohater ? '#fcfdfc' : '#000000';
            pointsDiv.style.zIndex = 8;
            pointsDiv.style.display = 'flex';
            pointsDiv.style.justifyContent = 'center';
            pointsDiv.style.alignItems = 'center';
            cardDiv.appendChild(pointsDiv);
        }
        // 8: okienko mocy
        if(card.moc){
            const mocIcon = document.createElement('img');
            let mocSrc = `assets/dkarty/${card.moc}.webp`;
            if(card.moc==='porz' && card.numer==='510') mocSrc = 'assets/dkarty/2porz.webp';
            if(card.moc==='grzybki' && card.numer==='504') mocSrc = 'assets/dkarty/igrzybki.webp';
            if(card.moc==='grzybki' && card.numer==='000') mocSrc = 'assets/dkarty/grzybki.webp';
            mocIcon.src = mocSrc;
            mocIcon.style.position = 'absolute';
            mocIcon.style.left = '0';
            mocIcon.style.top = '0';
            mocIcon.style.width = '100%';
            mocIcon.style.height = '100%';
            mocIcon.style.zIndex = 9;
            cardDiv.appendChild(mocIcon);
        }
        // 10: nazwa karty
        const nameDiv = document.createElement('div');
        nameDiv.innerText = card.nazwa;
        nameDiv.style.position = 'absolute';
        nameDiv.style.left = (113*cardDiv.offsetWidth/523)+'px';
        nameDiv.style.top = (766*cardDiv.offsetHeight/992)+'px';
        nameDiv.style.width = (518*cardDiv.offsetWidth/523)+'px';
        nameDiv.style.height = (111*cardDiv.offsetHeight/992)+'px';
        nameDiv.style.textAlign = 'center';
        nameDiv.style.fontSize = (44*cardDiv.offsetWidth/524)+'px';
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
            opisDiv.style.left = (9*cardDiv.offsetWidth/523)+'px';
            opisDiv.style.top = (879*cardDiv.offsetHeight/992)+'px';
            opisDiv.style.width = (514*cardDiv.offsetWidth/523)+'px';
            opisDiv.style.height = (991*cardDiv.offsetHeight/992)+'px';
            opisDiv.style.textAlign = 'center';
            opisDiv.style.color = '#fff';
            opisDiv.style.fontSize = (44*cardDiv.offsetWidth/524)+'px';
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