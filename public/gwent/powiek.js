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
    hidePowiek();
    if (!powiekActive || powiekDeck.length === 0) return;
    const overlay = document.createElement('div');
    overlay.id = 'powiekOverlay';
    overlay.className = 'powiek-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = 9999;
    overlay.style.pointerEvents = 'auto';
    overlay.style.background = 'rgba(0,0,0,0.7)'; // poszarzenie tła
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
        // Obraz karty
        const img = document.createElement('img');
        img.src = powiekMode==='leaders'?card.dkarta:card.karta;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '12px';
        img.style.boxShadow = '0 0 16px #000';
        img.style.position = 'absolute';
        img.style.left = '0';
        img.style.top = '0';
        cardDiv.appendChild(img);
        // Beton i nazwa dla leaders
        if(powiekMode==='leaders'){
            const beton = document.createElement('div');
            beton.className = 'beton';
            beton.style.position = 'absolute';
            beton.style.left = '0';
            beton.style.top = '0';
            beton.style.width = '100%';
            beton.style.height = '100%';
            beton.style.backgroundImage = "url('assets/dkarty/beton.webp')";
            beton.style.backgroundSize = 'cover';
            beton.style.backgroundRepeat = 'no-repeat';
            beton.style.zIndex = '1';
            cardDiv.appendChild(beton);
            const nameDiv = document.createElement('div');
            nameDiv.innerText = card.nazwa;
            nameDiv.style.position = 'absolute';
            nameDiv.style.left = '50%';
            nameDiv.style.top = '90%';
            nameDiv.style.transform = 'translateX(-50%)';
            nameDiv.style.fontFamily = 'PFDinTextCondPro-Bold, Cinzel, serif';
            nameDiv.style.fontWeight = 'bold';
            nameDiv.style.color = '#474747';
            nameDiv.style.fontSize = '2em';
            nameDiv.style.textAlign = 'center';
            nameDiv.style.zIndex = '3';
            cardDiv.appendChild(nameDiv);
        }
        // Opis pod dużą kartą
        if(i===0){
            const opisDiv = document.createElement('div');
            opisDiv.className = 'powiek-opis';
            opisDiv.innerText = powiekMode==='leaders'?card.nazwa:(card.opis||'');
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
    // Pod główną kartą podsw.webp
    const podsw = document.createElement('img');
    podsw.src = '/gwent/assets/asety/podsw.webp';
    podsw.className = 'powiek-podsw';
    podsw.style.position = 'absolute';
    podsw.style.left = (1617*scaleW)+'px';
    podsw.style.top = (1609*scaleH)+'px';
    podsw.style.width = (605*scaleW)+'px';
    podsw.style.height = (120*scaleH)+'px';
    podsw.style.zIndex = 140;
    overlay.appendChild(podsw);
    // Nad główną kartą podsw2.webp z animacją pulsowania
    const podsw2 = document.createElement('img');
    podsw2.src = '/gwent/assets/asety/podsw2.webp';
    podsw2.className = 'powiek-podsw2';
    podsw2.style.position = 'absolute';
    podsw2.style.left = (1617*scaleW)+'px';
    podsw2.style.top = (456*scaleH)+'px';
    podsw2.style.width = (605*scaleW)+'px';
    podsw2.style.height = (120*scaleH)+'px';
    podsw2.style.zIndex = 141;
    podsw2.style.animation = 'powiek-pulse 4s infinite';
    overlay.appendChild(podsw2);
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