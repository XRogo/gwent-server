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
}

function renderPowiek() {
    // Usuwam poprzedni overlay, jeśli istnieje
    const oldOverlay = document.getElementById('powiekOverlay');
    if (oldOverlay) oldOverlay.remove();
    if (!powiekActive || powiekDeck.length === 0) {
        console.log('Brak aktywacji lub pusty deck:', powiekActive, powiekDeck);
        return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'powiekOverlay';
    overlay.className = 'powiek-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = 99999;
    overlay.style.pointerEvents = 'auto';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.onclick = hidePowiek;
    document.body.appendChild(overlay);
    // TEST: dodaj tekst do overlay
    const testDiv = document.createElement('div');
    testDiv.textContent = 'POWIEK TEST';
    testDiv.style.position = 'absolute';
    testDiv.style.left = '50%';
    testDiv.style.top = '10%';
    testDiv.style.color = '#fff';
    testDiv.style.fontSize = '48px';
    testDiv.style.zIndex = 100000;
    overlay.appendChild(testDiv);

    // Pozycje kart w 4K
    const positions = [
        {left:468,top:444,width:899-468,height:1261-444},
        {left:1040,top:444,width:1563-1040,height:1436-444},
        {left:1617,top:456,width:2222-1617,height:1609-456},
        {left:2274,top:444,width:2799-2274,height:1436-444},
        {left:2938,top:444,width:3371-2938,height:1261-444}
    ];
    const scaleW = window.innerWidth / 3837;
    const scaleH = window.innerHeight / 2158;
    overlay.classList.add('powiek-anim');
    // Karty
    for(let i=-2;i<=2;i++){
        const idx = powiekIndex+i;
        if(idx<0||idx>=powiekDeck.length) continue;
        const card = powiekDeck[idx];
        const pos = positions[i+2];
        const cardDiv = document.createElement('div');
        cardDiv.className = 'powiek-card';
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = (pos.left*scaleW)+'px';
        cardDiv.style.top = (pos.top*scaleH)+'px';
        cardDiv.style.width = (pos.width*scaleW)+'px';
        cardDiv.style.height = (pos.height*scaleH)+'px';
        cardDiv.style.zIndex = i===0?100:50;
        cardDiv.style.transition = 'all 0.4s cubic-bezier(.77,0,.18,1)';
        cardDiv.style.overflow = 'visible';
        // 3: obraz dkarty
        const img = document.createElement('img');
        img.src = card.dkarta;
        img.style.position = 'absolute';
        img.style.left = '0';
        img.style.top = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.zIndex = '2';
        cardDiv.appendChild(img);
        // 4: beton/bbeton
        const beton = document.createElement('img');
        beton.src = card.bohater ? 'assets/dkarty/bbeton.webp' : 'assets/dkarty/beton.webp';
        beton.style.position = 'absolute';
        beton.style.left = '0';
        beton.style.top = '0';
        beton.style.width = '100%';
        beton.style.height = '100%';
        beton.style.zIndex = '1';
        cardDiv.appendChild(beton);
        // 1-2: podsw.webp, podsw2.webp (tylko dla wybranej środkowej karty)
        if(i===0){
            const podsw = document.createElement('img');
            podsw.src = '/gwent/assets/dkarty/podsw.webp';
            podsw.className = 'powiek-podsw';
            podsw.style.position = 'absolute';
            podsw.style.left = (pos.left - 104)*scaleW+'px';
            podsw.style.top = (pos.top - 10)*scaleH+'px';
            podsw.style.width = (523*scaleW)+'px';
            podsw.style.height = (992*scaleH)+'px';
            podsw.style.zIndex = 998;
            overlay.appendChild(podsw);
            const podsw2 = document.createElement('img');
            podsw2.src = '/gwent/assets/dkarty/podsw2.webp';
            podsw2.className = 'powiek-podsw2';
            podsw2.style.position = 'absolute';
            podsw2.style.left = (pos.left - 104)*scaleW+'px';
            podsw2.style.top = (pos.top - 10)*scaleH+'px';
            podsw2.style.width = (523*scaleW)+'px';
            podsw2.style.height = (992*scaleH)+'px';
            podsw2.style.zIndex = 999;
            podsw2.style.animation = 'powiek-pulse 1.5s infinite';
            overlay.appendChild(podsw2);
        }
        // 5: pasek frakcji (nie dla królów)
        if(powiekMode !== 'leaders'){
            const bannerFaction = card.frakcja === "nie" ? (card.frakcjaWybor || '1') : card.frakcja;
            const bannerDiv = document.createElement('img');
            bannerDiv.className = 'faction-banner';
            bannerDiv.src = `assets/dkarty/${bannerFaction === '1' ? 'polnoc.webp' : bannerFaction === '2' ? 'nilfgaard.webp' : bannerFaction === '3' ? 'scoiatael.webp' : bannerFaction === '4' ? 'potwory.webp' : 'skellige.webp'}`;
            bannerDiv.style.position = 'absolute';
            bannerDiv.style.left = '0';
            bannerDiv.style.top = '0';
            bannerDiv.style.width = '100%';
            bannerDiv.style.height = '100%';
            bannerDiv.style.zIndex = '3';
            cardDiv.appendChild(bannerDiv);
        }
        // 6: pozycja (nie dla królów)
        if(powiekMode !== 'leaders' && card.pozycja){
            const posIcon = document.createElement('img');
            posIcon.className = 'position-icon';
            posIcon.src = `assets/dkarty/pozycja${card.pozycja}.webp`;
            posIcon.style.position = 'absolute';
            posIcon.style.left = '0';
            posIcon.style.top = '0';
            posIcon.style.width = '100%';
            posIcon.style.height = '100%';
            posIcon.style.zIndex = '4';
            cardDiv.appendChild(posIcon);
        }
        // 7: punkty okienko
        if(powiekMode !== 'leaders' && card.punkty !== undefined){
            const pointsBg = document.createElement('img');
            pointsBg.className = 'points-bg';
            pointsBg.src = card.bohater ? 'assets/dkarty/bohater.webp' : 'assets/dkarty/punkty.webp';
            pointsBg.style.position = 'absolute';
            pointsBg.style.left = (-23*cardDiv.offsetWidth/523)+'px';
            pointsBg.style.top = (-21*cardDiv.offsetHeight/992)+'px';
            pointsBg.style.width = (523*cardDiv.offsetWidth/523)+'px';
            pointsBg.style.height = (992*cardDiv.offsetHeight/992)+'px';
            pointsBg.style.zIndex = '1000';
            cardDiv.appendChild(pointsBg);
            const pointsDiv = document.createElement('div');
            pointsDiv.className = 'points';
            pointsDiv.innerText = card.punkty;
            pointsDiv.style.position = 'absolute';
            pointsDiv.style.top = '7.8%';
            pointsDiv.style.left = '14.5%';
            pointsDiv.style.width = '23.61%';
            pointsDiv.style.height = '8.84%';
            pointsDiv.style.fontSize = '220%';
            pointsDiv.style.color = card.bohater ? '#fcfdfc' : '#000000';
            pointsDiv.style.zIndex = '1001';
            pointsDiv.style.display = 'flex';
            pointsDiv.style.justifyContent = 'center';
            pointsDiv.style.alignItems = 'center';
            cardDiv.appendChild(pointsDiv);
        }
        // 8: okienko mocy (nie dla królów)
        if(powiekMode !== 'leaders' && card.moc){
            const mocIcon = document.createElement('img');
            mocIcon.className = 'power-icon';
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
            mocIcon.style.zIndex = '6';
            cardDiv.appendChild(mocIcon);
        }
        // 10: nazwa karty
        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.innerText = card.nazwa;
        nameDiv.style.position = 'absolute';
        nameDiv.style.left = (113*cardDiv.offsetWidth/523)+'px';
        nameDiv.style.top = (766*cardDiv.offsetHeight/992)+'px';
        nameDiv.style.width = (518*cardDiv.offsetWidth/523)+'px';
        nameDiv.style.height = (111*cardDiv.offsetHeight/992)+'px';
        nameDiv.style.textAlign = 'center';
        nameDiv.style.fontSize = '1.2em';
        nameDiv.style.color = '#474747';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.zIndex = '11';
        nameDiv.style.whiteSpace = 'normal';
        nameDiv.style.wordBreak = 'break-word';
        nameDiv.style.lineHeight = '1.1';
        nameDiv.style.padding = '0 4px';
        nameDiv.style.transform = 'none';
        cardDiv.appendChild(nameDiv);
        // Opis pod dużą kartą
        if(i===0){
            const opisDiv = document.createElement('div');
            opisDiv.className = 'powiek-opis';
            opisDiv.innerText = card.opis||'';
            opisDiv.style.position = 'absolute';
            opisDiv.style.left = (pos.left*scaleW)+'px';
            opisDiv.style.top = ((pos.top+pos.height-60)*scaleH)+'px';
            opisDiv.style.width = (pos.width*scaleW)+'px';
            opisDiv.style.textAlign = 'center';
            opisDiv.style.color = '#fff';
            opisDiv.style.fontSize = (32*scaleW)+'px';
            opisDiv.style.zIndex = 110;
            overlay.appendChild(opisDiv);
        }
        overlay.appendChild(cardDiv);
    }
    // Strzałki lewo/prawo z animacją
    const leftArrow = document.createElement('div');
    leftArrow.className = 'powiek-arrow powiek-arrow-left';
    leftArrow.innerText = '<';
    leftArrow.style.position = 'absolute';
    leftArrow.style.left = (468*scaleW)+'px';
    leftArrow.style.top = (900*scaleH)+'px';
    leftArrow.style.fontSize = (80*scaleW)+'px';
    leftArrow.style.color = '#c7a76e';
    leftArrow.style.zIndex = 200;
    leftArrow.style.cursor = 'pointer';
    leftArrow.onclick = (e)=>{e.stopPropagation();if(powiekIndex>0){powiekIndex--;renderPowiek();}};
    overlay.appendChild(leftArrow);
    const rightArrow = document.createElement('div');
    rightArrow.className = 'powiek-arrow powiek-arrow-right';
    rightArrow.innerText = '>';
    rightArrow.style.position = 'absolute';
    rightArrow.style.left = (3371*scaleW-80*scaleW)+'px';
    rightArrow.style.top = (900*scaleH)+'px';
    rightArrow.style.fontSize = (80*scaleW)+'px';
    rightArrow.style.color = '#c7a76e';
    rightArrow.style.zIndex = 200;
    rightArrow.style.cursor = 'pointer';
    rightArrow.onclick = (e)=>{e.stopPropagation();if(powiekIndex<powiekDeck.length-1){powiekIndex++;renderPowiek();}};
    overlay.appendChild(rightArrow);
    // Wybór dowódców
    if(powiekMode==='leaders'){
        overlay.onclick = null;
        // Po kliknięciu prawego na dowódcę wybierz go
        overlay.oncontextmenu = function(e){
            e.preventDefault();
            const idx = powiekIndex;
            const krol = powiekDeck[idx];
            if(krol){
                window.selectedLeader = krol;
                hidePowiek();
            }
        };
    }
    // Obsługa strzałek i scrolla
    overlay.addEventListener('wheel', function(e){
        e.preventDefault();
        if(e.deltaY > 0 && powiekIndex < powiekDeck.length-1){
            powiekIndex++;
            renderPowiek();
        } else if(e.deltaY < 0 && powiekIndex > 0){
            powiekIndex--;
            renderPowiek();
        }
    });
    overlay.addEventListener('keydown', function(e){
        if(e.key === 'ArrowRight' && powiekIndex < powiekDeck.length-1){
            powiekIndex++;
            renderPowiek();
        } else if(e.key === 'ArrowLeft' && powiekIndex > 0){
            powiekIndex--;
            renderPowiek();
        }
    });
    overlay.tabIndex = 0;
    overlay.focus();
}

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