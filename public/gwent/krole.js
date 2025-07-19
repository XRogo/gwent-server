///połnoc

// Lista dowódców Gwent

const krole = [

    // Północ ██████████████████████████████████████████████████████████████████████████████████████████████████
     
    {
        ////////////////////////////////////////////////////////////////////
        nazwa: "Foltest Król Temerii",
        karta: "/gwent/assets/karty/polnoc/foltest1.webp",
        dkarta: "/gwent/assets/dkarty/kure/1001.webp",
        opis: "Przecież to naturalne, że brat darzy miłością swoją siostrę.",
        frakcja: "1",
        numer: "1001",
        umiejetnosc: "Znajdź kartę Gęsta mgła w swojej talii i natychmiast ją zagraj.",
        funkcja: function (gameState) {
            //sprzawdza czy w kupce i w talli gry znajduje sie karta gęsta magła i ją wrzuca na plansze gry (jeśnie jej nie ma któl na effekt urzycia i nie da sie go urzyć)
        }
    },

    {
        /////////////////////////////////////////////////////////////////////
        nazwa: "Foltest Dowódca Północyi",
        karta: "/gwent/assets/karty/polnoc/foltest2.webp",
        dkarta: "/gwent/assets/dkarty/kure/1002.webp",
        opis: '"Pieprzeni doradcy i ich polityczne układanki. Na polu bitwy ufam sobie i swoim zbrojnym".',
        frakcja: "1",
        numer: "1002",
        umiejetnosc: '"Usuń aktywne efekty pogodowe wynikające z kart Trzaskający Mróz, Ulewny deszcz i Gęsta mgła".',
        funkcja: function (gameState) {
            // urzywa czyste niebo (dodaje karte a nie zabiera z tali czy kupki)
        }
    },

    {
        /////////////////////////////////////////////////////////////////////
        nazwa: "Foltest Zdobywca",
        karta: "/gwent/assets/karty/polnoc/foltest3.webp",
        dkarta: "/gwent/assets/dkarty/kure/1003.webp",
        opis: '"Dobrze wymierzony strzał z balisty druzgocze nie tylko umocnienia, ale też morale wroga".',
        frakcja: "1",
        numer: "1003",
        umiejetnosc: "Podwaja siłę wszystkich twoich jednostek oblężniczych (o ile w ich rzędzie nie ma już Rogu Dowódcy).",
        funkcja: function (gameState) {
            //urzywa rogu dowódcy dla katapult (dodaje karte a nie zabiera z tali czy kupki)
        }
    },
    
    {
        /////////////////////////////////////////////////////////////
        nazwa: "Foltest Żelazny Władca",
        karta: "/gwent/assets/karty/polnoc/foltest4.webp",
        dkarta: "/gwent/assets/dkarty/kure/1004.webp",
        opis: '"Cóż za piękny dzień na bitwę!"',
        frakcja: "1",
        numer: "1004",
        umiejetnosc: "Zniszcz najsilniejszą jednostke/ jednostki oblężniczą/e twojego przeciwnika, jeśli suma siły wszystkich jego kart oblężniczych wynosi 10 bądź więcej.",
        funkcja: function (gameState) {
            // Niszczy najsilniejszą jednostke/i katapult twojego przeciwnika, jeśli suma siły jego katapult wynosi 10 lub więcej.
        }
    },

    {
        ////////////////////////////////////////////////////////////////
        nazwa: "Foltest Syn Medella",
        karta: "/gwent/assets/karty/polnoc/foltest5.webp",
        dkarta: "/gwent/assets/dkarty/kurl/1005.webp",
        opis: '"Ja tu rządę i nie będę się krył po kątach".',
        frakcja: "1",
        numer: "1005",
        umiejetnosc: "Niszczy najsilniejszą jednostke/i dalekiego zasięgu twojego przeciwnika, jeśli suma siły jego jednostek dalekiego zasięgu wynosi 10 lub więcej.",
        funkcja: function (gameState) {
            // Niszczy najsilniejszą jednostke/i łuczników twojego przeciwnika, jeśli suma siły jego łuczników wynosi 10 lub więcej.
        }
    },

    // Nilfgaard ██████████████████████████████████████████████████████████████████████████████████████████████████

    {
        ///////////////////////////////////////////////////////////////
        nazwa: "Emhyr var Emreis Jeż z Erlenwaldu",
        karta: "/gwent/assets/karty/nilftgard/emhyr1.webp",
        dkarta: "/gwent/assets/dkarty/kure/2001.webp",
        opis: '"Niebo nie płakało, gdy zabrali mi Pawette".',
        frakcja: "2",
        numer: "2001",
        umiejetnosc: "Znajdz w swojej talii kartę Deszcz i natychmiast ją zagraj.",
        funkcja: function (gameState) {
            // sprzawdza czy w kupce i w talli gry znajduje sie karta deszcz i ją wrzuca na plansze gry (jeśnie jej nie ma któl na effekt urzycia i nie da sie go urzyć)    
        }
    },
    
    {
        ///////////////////////////////////////////////////////////////
        nazwa: "Emhyr var Emreis Cesarz Nilfgaardu",
        karta: "/gwent/assets/karty/nilftgard/emhyr2.webp",
        dkarta: "/gwent/assets/dkarty/kure/2002.webp",
        opis: '"Nie interesują mnie twoje przesłaniki. Oczekikję wyników".',
        frakcja: "2",
        numer: "2001",
        umiejetnosc: "Obejrzyj 3 losowe karty z ręki przeciwnika",
        funkcja: function (gameState) {
            // w podglądzie widzisz 3 losowe karty z ręki przeciwnika nic więcej nie możesz z nimi zrobić
        }
    },
    
    {
        ///////////////////////////////////////////////////////////////
        nazwa: "Emhyr var Emreis Biały Płomień Tańczący na Kurhanach Wrogów",
        karta: "/gwent/assets/karty/nilftgard/emhyr3.webp",
        dkarta: "/gwent/assets/dkarty/kure/2003.webp",
        opis: '"Miecz jest raptem jednym z narzędzi w dyspozycji cesarza".',
        frakcja: "2",
        numer: "2003",
        umiejetnosc: "Blokuje umiejętności dowódcy twojego przeciwnika.",
        funkcja: function (gameState) {
            //blokuje umiejątnośc dowódcy twojego przeciwnika (czyli nie może on użyć swojej umiejętności) jest odrazu aktywowane
        }
    },
    
    {
        ///////////////////////////////////////////////////////////////
        nazwa: "Emhyr var Emreis Pan Południa",
        karta: "/gwent/assets/karty/nilftgard/emhyr4.webp",
        dkarta: "/gwent/assets/dkarty/kure/2004.webp",
        opis: '"Nie jestem znany ze swojej cierpliwości. Poczyń, prosze, kroki , abym nie być znanym z braku głowy na karku".',
        frakcja: "2",
        numer: "2004",
        umiejetnosc: "Wybierz karte ze stosu kart odrzuconych twojego przeciwnika",
        funkcja: function (gameState) {
            // ...kod efektu...
        }
    },
    
    {
        ///////////////////////////////////////////////////////////////
        nazwa: "Emhyr var Emreis Najeźca Północy",
        karta: "/gwent/assets/karty/nilftgard/emhyr5.webp",
        dkarta: "/gwent/assets/dkarty/kure/2005.webp",
        opis: '"Cesarze władają imperium, ale dwiem rzeczami rządzić nie mogą swojim sercem i swojim czasem".',
        frakcja: "2",
        numer: "2005",
        umiejetnosc: "Gdy grzcze przywraca kednostkę na pole bitwy, przywrucona zostaje losowa jednostka. Dotyczy obydwu graczy.",
        funkcja: function (gameState) {
            //jak ta to jest aktywan stale i gdy kóryś z graczy urzyje przywrócenia jednostki to przywrócona zostaje losowa jednostka z talii gracza (czyli nie ma podglądu i nie można wybrać karty)
        }
    },

    // Scoia'tael ██████████████████████████████████████████████████████████████████████████████████████████████████

    {
        //////////////////////////////////////////////////////////
        nazwa: "Francesca Findabair Elfka czystej krwi",
        karta: "/gwent/assets/karty/scio'tel/ffrancesca_findabair1.webp",
        dkarta: "/gwent/assets/dkarty/kure/3001.webp",
        opis: '"Znowu jesteśmy Ludem, aie wygnańcami. A popiół użyźnia".',
        frakcja: "3",
        numer: "3001",
        umiejetnosc: "Znajdz w swojej talli kartę Trzaskający Mróz i natychmiast ją zagraj.",
        funkcja: function (gameState) {
                //sprzawdza czy w kupce i w talli gry znajduje sie karta tzrzaskający mróz i ją wrzuca na plansze gry (jeśnie jej nie ma któl na effekt urzycia i nie da sie go urzyć)
        }
    },

        {
        /////////////////////////////////////////////////////////
        nazwa: "Francesca Findabair Stokrotka z Dolin",
        karta: "/gwent/assets/karty/scio'tel/ffrancesca_findabair2.webp",
        dkarta: "/gwent/assets/dkarty/kure/3002.webp",
        opis: '"Powszechnei uważa się ją za najpiękniejszą kobietę świata".',
        frakcja: "3",
        numer: "3001",
        umiejetnosc: "Weź o jedną kartę więcej na początku bitwy.",
        funkcja: function (gameState) {
            // na początku bitwy bierze o jedną kartę więcej (czyli 11 zamiast 10) i dodaje ją do ręki gracza
        }
    },

        {
        ///////////////////////////////////////////////////////
        nazwa: "Francesca Findabair Najpiękniejsza kobieta na świecie",
        karta: "/gwent/assets/karty/scio'tel/ffrancesca_findabair3.webp",
        dkarta: "/gwent/assets/dkarty/kure/3003.webp",
        opis: '"Komanda muszą nadal prowadzić walkę".',
        frakcja: "3",
        numer: "3003",
        umiejetnosc: "Podwaja siłę twoich jednostek dalekiego zasięgu (o ile w ich rzędzie nie ma już Rogu Dowódcy).",
        funkcja: function (gameState) {
            // urzywa rogu dowódcy dla łuczników (dodaje karte a nie zabiera z tali czy kupki)
        }
    },

        {
        /////////////////////////////////////////////////////
        nazwa: "Francesca Findabair Królowa Dol Blathanna",
        karta: "/gwent/assets/karty/scio'tel/ffrancesca_findabair4.webp",
        dkarta: "/gwent/assets/dkarty/kure/3004.webp",
        opis: '"Wszystko ma swoją cenę. Wojna wymaga ofiar. Pokój, jak się okazuje, również".',
        frakcja: "3",
        numer: "3004",
        umiejetnosc: "Zniszcz najsilniejszą jednostkę/ki bliskiego starcia twojego przeciwnika, jeśli suma siły jego jednostek bliskiego starcia wynosi 10 lub więcej.",
        funkcja: function (gameState) {
            // Niszczy najsilniejszą jednostke/i wojowników twojego przeciwnika, jeśli suma siły jego wojowników wynosi 10 lub więcej.
        }
    },

        {
        ////////////////////////////////////////////////////
        nazwa: "Francesca Findabair Nadzieja Dol Blathanna",
        karta: "/gwent/assets/karty/scio'tel/ffrancesca_findabair5.webp",
        dkarta: "/gwent/assets/dkarty/kure/3005.webp",
        opis: '"Daede sian caente, Aen Seidhe en\'allane ael coeden...".',
        frakcja: "3",
        numer: "3005",
        umiejetnosc: "Przesuwa jednostki ze zdolnością Zręczności do rzędóow, które maksymalizują ich siłę. (jednostki w optymalnym rzędzie nie zostaną przesunięte)",
        funkcja: function (gameState) {
            //karty z umiejętnością zręczności zostaną przesunięte do rzędów, które maksymalizują ich siłę (np. łucznicy do rzędu wojowników jeśli w tym rzędzie jest róg który podwoji ich siłę)
        }
    },

    // Potwory ██████████████████████████████████████████████████████████████████████████████████████████████████

    {
        ////////////////////////////////////////////////
        nazwa: "Eredin Bréacc Glas Król Dzikiego Gonu",
        karta: "/gwent/assets/karty/potwory/eredin1.webp",
        dkarta: "/gwent/assets/dkarty/kure/4001.webp",
        opis: '"Va faill, luned".',
        frakcja: "4",
        numer: "4001",
        umiejetnosc: "Wybierz jedną kartę pogody ze swojej talii i natychmiast ją zagraj.",
        funkcja: function (gameState) {
            // aktywóje podgląd i pokazuje wszystkie dostępne karty pogodowe (jeśnie ich nie ma któl na effekt urzycia i nie da sie go urzyć)
        }
    },

        {
        ////////////////////////////////////////////////
        nazwa: "Eredin Bréacc Glas Dowódca Czerwonych Jeźdźców",
        karta: "/gwent/assets/karty/potwory/eredin2.webp",
        dkarta: "/gwent/assets/dkarty/kure/4002.webp",
        opis: '"Król Goun świeje się, kłapią przegniłe zęby nad zardzewiałym kołnierzem zbroi".',
        frakcja: "4",
        numer: "4002",
        umiejetnosc: 'Podwaja siłę wszystkich swojich jednostek bliskiego starcia (o ile w ich rzędzie nie ma już Rogu Dowódcy).',
        funkcja: function (gameState) {
            //dodaje róg dowódcy do wojowników (czyli podwaja ich siłę) (dodaje karte a nie zabiera z tali czy kupki)
        }
    },

        {
        //////////////////////////////////////////////
        nazwa: "Eredin Bréacc Glas Władca Tir ná Lia",
        karta: "/gwent/assets/karty/potwory/eredin3.webp",
        dkarta: "/gwent/assets/dkarty/kure/4003.webp",
        opis: '"Im byli bliżej, tym piękno tego miejsca silniej chwytało za serce".',
        frakcja: "4",
        numer: "4003",
        umiejetnosc: 'Odrzuć 2 karty, a następnie wybierz jedną dowolną kratę ze swojej talii.',
        funkcja: function (gameState) {
            //owtiera podgląd wszystkich wylosowanych kart gracz musi odrzucić 2 karty, a następnie wybiera jedną dowolną kartę ze swojej talii 
        }
    },

        {
        ////////////////////////////////////////////////////
        nazwa: "Eredin Bréacc Glas Zabujca Auberona",
        karta: "/gwent/assets/karty/potwory/eredin4.webp",
        dkarta: "/gwent/assets/dkarty/kure/4004.webp",
        opis: '"Czerwpni Jeźdżcy zdołają doścignąć cię nawet w odchłani czasów i  miejsc".',
        frakcja: "4",
        numer: "4004",
        umiejetnosc: 'Weź karte ze stosu kart odrzuconych.',
        funkcja: function (gameState) {
            // weź 1 karte ze stosu odrzuconych kart  aktywuje sie podgląd kart odrzuconych i można wygrać 1 kartę która wróci do ręki gracza 
        }
    },

        {
        //////////////////////////////////////////////////////
        nazwa: "Eredin Bréacc Glas Zdradziecki",
        karta: "/gwent/assets/karty/potwory/eredin5.webp",
        dkarta: "/gwent/assets/dkarty/kure/4005.webp",
        opis: '"Bo się tobą bawię".',
        frakcja: "4",
        numer: "4005",
        umiejetnosc: 'Pasywna - podwaja siłę kart szpiegów obu graczy.',
        funkcja: function (gameState) {
            //szpiedzy dostają podwojenie punktów siły (czyli jeśli szpieg ma 3 punkty siły to będzie miał 6 punktów siły)
        }
    },


    // Skellige ██████████████████████████████████████████████████████████████████████████████████████████████████

    {
        //////////////////////////////////////////////////////////
        nazwa: "Król Bran",
        karta: "/gwent/assets/karty/Skellige/bran.webp",
        dkarta: "/gwent/assets/dkarty/kure/5001.webp",
        opis: '"Nikt nie zastąpi Brana. Moge jedynie próbować."',
        frakcja: "5",
        numer: "5001",
        umiejetnosc: "Odrzuć 2 karty i dobierz 1.",
        funkcja: function (gameState) {
            // jeśli ten dowódca jest wybrany to nie musi być aktywowany działa całyczas i karty tracą tylko połowe podczs niesprzyjające pogody
        }
    },

    {
        ///////////////////////////////////////////////////////////////////
        nazwa: "Crach an Craite",
        karta: "/gwent/assets/karty/Skellige/crach.webp",
        dkarta: "/gwent/assets/dkarty/kure/5002.webp",
        opis: '"Król musi być madry. Król musi cieszyć się szacunkiem. Król miusi mieć jaja".',
        frakcja: "5",
        numer: "5002",
        umiejetnosc: "Wskrześ jedną brązową jednostkę.",
        funkcja: function (gameState) {
            // karty odrzucone każdego gracza zostają przetasowane i przywrócone do talii
        }
    }
];

// Przykładowa funkcja pomocnicza
function getKrolByNumer(numer) {
    return krole.find(krol => krol.numer === numer);
}

export { krole, getKrolByNumer };