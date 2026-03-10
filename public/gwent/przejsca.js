const przejscia = [
    {
        numer: "t01",
        opis: "TWÓJ RUCH",
        obraz: "assets/asety/przejscia/ty.webp",
        czas: 2000
    },
    {
        numer: "t02",
        opis: "RUCH PRZECIWNIKA",
        obraz: "assets/asety/przejscia/klepsydra.webp",
        czas: 2000
    },
    {
        numer: "t03",
        opis: "PRZECIWNIK SPASOWAŁ",
        obraz: "assets/asety/przejscia/pass.webp",
        czas: 2500
    },
    {
        numer: "t04",
        opis: "WYGRAŁEŚ TĘ RUNDĘ!",
        obraz: "assets/asety/przejscia/ty.webp",
        czas: 3000
    },
    {
        numer: "t05",
        opis: "PRZEGRAŁEŚ TĘ RUNDĘ",
        obraz: "assets/asety/przejscia/lostr.webp",
        czas: 3000
    },
    {
        numer: "t06",
        opis: "REMIS",
        obraz: "assets/asety/przejscia/remisr.webp",
        czas: 3000
    },
    {
        numer: "t07",
        opis: "UŻYJ UMIEJĘTNOŚCI DOWÓDCY",
        obraz: null, // dynamiczne - ustawiane wg frakcji
        czas: 2500,
        obrazFrakcji: {
            "1": "assets/asety/przejscia/umiejentnosc_polnoc.webp",
            "2": "assets/asety/przejscia/umiejentnosc_nilfgard.webp",
            "3": "assets/asety/przejscia/umiejentnosc_wiewiurki.webp",
            "4": "assets/asety/przejscia/umiejentnosc_potwory.webp",
            "5": "assets/asety/przejscia/umiejentnosc_skelige.webp"
        }
    },
    {
        numer: "t08",
        opis: "SPASOWAŁEŚ",
        obraz: "assets/asety/przejscia/pass.webp",
        czas: 2000
    },
    {
        numer: "t09",
        opis: "ZWYCIĘSTWO!",
        obraz: "assets/asety/przejscia/ty.webp",
        czas: 4000
    },
    {
        numer: "t10",
        opis: "PORAŻKA",
        obraz: "assets/asety/przejscia/lostr.webp",
        czas: 4000
    }
];

export default przejscia;
