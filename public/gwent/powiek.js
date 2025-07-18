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
    // Animacja przesuwania
    overlay.classList.add('powiek-anim');
    // Karty
    for(let i=-2;i<=2;i++){
        const idx = powiekIndex+i;
        if(idx<0||idx>=powiekDeck.length) continue;
        const card = powiekDeck[idx];
        const pos = positions[i+2];
        const cardDiv = document.createElement('img');
        cardDiv.className = 'powiek-card';
        cardDiv.src = powiekMode==='leaders'?card.dkarta:card.karta;
        cardDiv.style.position = 'absolute';
        cardDiv.style.left = (pos.left*scaleW)+'px';
        cardDiv.style.top = (pos.top*scaleH)+'px';
        cardDiv.style.width = (pos.width*scaleW)+'px';
        cardDiv.style.height = (pos.height*scaleH)+'px';
        cardDiv.style.zIndex = i===0?100:50;
        cardDiv.style.transition = 'all 0.4s cubic-bezier(.77,0,.18,1)';
        overlay.appendChild(cardDiv);
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
    }
    // Okienko info (tylko dla kart)
    if(powiekMode==='cards'){
        const infoDiv = document.createElement('div');
        infoDiv.className = 'powiek-info';
        infoDiv.style.position = 'absolute';
        infoDiv.style.left = (1356*scaleW)+'px';
        infoDiv.style.top = (1661*scaleH)+'px';
        infoDiv.style.width = (inforW=866*scaleW)+'px';
        infoDiv.style.height = (inforH=74*scaleH)+'px';
        infoDiv.style.background = `url('/gwent/assets/asety/infor.webp')`;
        infoDiv.style.backgroundSize = 'cover';
        infoDiv.style.zIndex = 120;
        overlay.appendChild(infoDiv);
        // Ikona mocy
        const card = powiekDeck[powiekIndex];
        if(card&&card.moc){
            const moc = moce[card.moc];
            if(moc&&moc.ikona){
                const ikonaDiv = document.createElement('img');
                ikonaDiv.className = 'powiek-ikona';
                ikonaDiv.src = moc.ikona;
                ikonaDiv.style.position = 'absolute';
                ikonaDiv.style.left = (1356*scaleW)+'px';
                ikonaDiv.style.top = (1661*scaleH)+'px';
                ikonaDiv.style.width = (64*scaleW)+'px';
                ikonaDiv.style.height = (64*scaleH)+'px';
                ikonaDiv.style.zIndex = 130;
                overlay.appendChild(ikonaDiv);
            }
            // Nazwa mocy
            const nazwaDiv = document.createElement('div');
            nazwaDiv.className = 'powiek-nazwa';
            nazwaDiv.innerText = moc.nazwa||'';
            nazwaDiv.style.position = 'absolute';
            nazwaDiv.style.left = (1356*scaleW)+'px';
            nazwaDiv.style.top = (1735*scaleH)+'px';
            nazwaDiv.style.width = (inforW)+'px';
            nazwaDiv.style.textAlign = 'center';
            nazwaDiv.style.color = '#c7a76e';
            nazwaDiv.style.fontWeight = 'bold';
            nazwaDiv.style.fontSize = (36*scaleW)+'px';
            nazwaDiv.style.zIndex = 131;
            overlay.appendChild(nazwaDiv);
            // Opis mocy
            const opisDiv = document.createElement('div');
            opisDiv.className = 'powiek-moc-opis';
            opisDiv.innerText = moc.opis||'';
            opisDiv.style.position = 'absolute';
            opisDiv.style.left = (1356*scaleW)+'px';
            opisDiv.style.top = (1814*scaleH)+'px';
            opisDiv.style.width = (inforW)+'px';
            opisDiv.style.textAlign = 'center';
            opisDiv.style.color = '#fff';
            opisDiv.style.fontSize = (28*scaleW)+'px';
            opisDiv.style.zIndex = 132;
            overlay.appendChild(opisDiv);
        }
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

export { showPowiek, hidePowiek };