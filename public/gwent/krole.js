///połnoc

// Lista dowódców Gwent

const krole = [
    // Północ
    {
        nazwa: "Foltest Król Temerii",
        karta: "/gwent/assets/karty/polnoc/foltest1.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "Przecież to naturalne, że brat darzy miłością swoją siostrę.",
        dowodca: true,
        frakcja: "1",
        numer: "1001",
        umiejetnosc: "Zniszcz wszystkie szpiegowskie karty na własnym polu.",
        funkcja: function (gameState) {
            // Przykładowa funkcja specjalna dowódcy
            // ...kod efektu...
        }
    },
    // ...kolejni dowódcy północy...
    // Nilfgaard
    {
        nazwa: "Emhyr var Emreis",
        karta: "/gwent/assets/karty/nilftgard/emhyr1.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "Nilfgaard nie wybacza.",
        dowodca: true,
        frakcja: "2",
        numer: "2001",
        umiejetnosc: "Dobierz jedną kartę po wygranej rundzie.",
        funkcja: function (gameState) {
            // ...kod efektu...
        }
    },
    // ...kolejni dowódcy nilfgaardu...
    // Scoia'tael
    {
        nazwa: "Francesca Findabair",
        karta: "/gwent/assets/karty/scio'tel/francesca1.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "Piękno i śmierć.",
        dowodca: true,
        frakcja: "3",
        numer: "3001",
        umiejetnosc: "Zagraj dowolną kartę specjalną z talii.",
        funkcja: function (gameState) {
            // ...kod efektu...
        }
    },
    // ...kolejni dowódcy scoia'tael...
    // Potwory
    {
        nazwa: "Eredin Bringer of Death",
        karta: "/gwent/assets/karty/potwory/eredin1.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "Król Dzikiego Gonu.",
        dowodca: true,
        frakcja: "4",
        numer: "4001",
        umiejetnosc: "Wybierz i zagraj dowolną kartę potwora z cmentarza.",
        funkcja: function (gameState) {
            // ...kod efektu...
        }
    },
    // ...kolejni dowódcy potworów...
    // Skellige (tylko 2 dowódców)
    {
        nazwa: "Bran Tuirseach",
        karta: "/gwent/assets/karty/Skellige/bran1.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "Wódz Skellige.",
        dowodca: true,
        frakcja: "5",
        numer: "5001",
        umiejetnosc: "Odrzuć 2 karty i dobierz 1.",
        funkcja: function (gameState) {
            // ...kod efektu...
        }
    },
    {
        nazwa: "Crach an Craite",
        karta: "/gwent/assets/karty/Skellige/crach1.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "Nieustraszony wojownik.",
        dowodca: true,
        frakcja: "5",
        numer: "5002",
        umiejetnosc: "Wskrześ jedną brązową jednostkę.",
        funkcja: function (gameState) {
            // ...kod efektu...
        }
    }
    // ...pozostali dowódcy...
];

// Przykładowa funkcja pomocnicza
function getKrolByNumer(numer) {
    return krole.find(krol => krol.numer === numer);
}

export { krole, getKrolByNumer };