const cards = [
    //pogoda===============================================================================================

    {
        nazwa: "Manekin do ćwiczeń",
        karta: "/gwent/assets/karty/niezalerzne/manekin_do_cwiczen.webp",
        dkarta: "/gwent/assets/dkarty/1/manek.webp",
        opis: '"Niespodzianka skurwysyny!"',
        bohater: false,
        moc: "manek",
        frakcja: "nie",
        ilosc: 3,
        numer: "001"
    },

    {
        nazwa: "Róg dowódcy",
        karta: "/gwent/assets/karty/niezalerzne/rog_dowodcy.webp",
        dkarta: "/gwent/assets/dkarty/1/rog.webp",
        opis: '"Do atakuuuuu!!!"',
        bohater: false,
        moc: "rog",
        frakcja: "nie",
        ilosc: 3,
        numer: "002"
    },

    {
        nazwa: "Pożoga",
        karta: "/gwent/assets/karty/niezalerzne/pozoga.webp",
        dkarta: "/gwent/assets/dkarty/1/porz.webp",
        opis: '"Że też zawsze musi jebnąć, tma gdzie najbardziej boli".',
        bohater: false,
        moc: "porz",
        frakcja: "nie",
        ilosc: 3,
        numer: "003"
    },

    {
        nazwa: "Trzaskający mróz",
        karta: "/gwent/assets/karty/niezalerzne/trzaskajacy_mroz.webp",
        dkarta: "/gwent/assets/dkarty/1/mroz.webp",
        opis: '"Tak mi palce zgrabiały, że lewie miecz trzymam... A tujeszcze machać trzeba".',
        bohater: false,
        moc: "mroz",
        frakcja: "nie",
        ilosc: 3,
        numer: "004"
    },

    {
        nazwa: "Gęsta mgła",
        karta: "/gwent/assets/karty/niezalerzne/gesta_mgla.webp",
        dkarta: "/gwent/assets/dkarty/1/mgla.webp",
        opis: '"Mgła, że oko wykol... Cokolwiek to znaczy".',
        bohater: false,
        moc: "mgla",
        frakcja: "nie",
        ilosc: 3,
        numer: "005"
    },

    {
        nazwa: "Ulewny deszcz",
        karta: "/gwent/assets/karty/niezalerzne/ulewny_deszcz.webp",
        dkarta: "/gwent/assets/dkarty/1/deszcz.webp",
        opis: '"Wieża oblężnicz utkneła w błocie!" "Widzę, idioto. Trąb na odwrót".',
        bohater: false,
        moc: "deszcz",
        frakcja: "nie",
        ilosc: 3,
        numer: "006"
    },
    
    {
        nazwa: "Czyste niebo",
        karta: "/gwent/assets/karty/niezalerzne/czyste_niebo.webp",
        dkarta: "/gwent/assets/dkarty/1/niebo.webp",
        opis: '"Piękny dzień, żeby umrzeć".',
        bohater: false,
        moc: "niebo",
        frakcja: "nie",
        ilosc: 3,
        numer: "007"
    },
    
    {
        nazwa: "Skelligijski sztorm",
        karta: "/gwent/assets/karty/niezalerzne/skelligijski_sztorm.webp",
        dkarta: "/gwent/assets/dkarty/1/008.webp",
        opis: '"To nie jest zwykła burza. To gniew bogów."',
        bohater: false,
        moc: "sztorm",
        frakcja: "nie",
        ilosc: 3,
        numer: "008"
    },

    {
        nazwa: "Mardroeme",
        karta: "/gwent/assets/karty/niezalerzne/mardroeme.webp",
        dkarta: "/gwent/assets/dkarty/1/000.webp",
        opis: "WORK.",
        bohater: false,
        moc: "grzybki",
        frakcja: "5",
        ilosc: 3,
        numer: "000"
    },

    

//neutralne=============================================================================================================================================================

    {
        nazwa: "Geralt z Rivi",
        karta: "/gwent/assets/karty/niezalerzne/geralt_z_rivi.webp",
        dkarta: "/gwent/assets/dkarty/1/009.webp",
        opis: '"Jeżeli mam wybierać pomiędzy jednym złem a drugim, to wole nie wybierać wcale."',
        bohater: true,
        moc: "wezwanie",
        frakcja: "nie",
        punkty: 15,
        pozycja: 1,
        summon: "020",
        ilosc: 1,
        numer: "009"
    },
    
    {
        nazwa: "Ciri",
        karta: "/gwent/assets/karty/niezalerzne/ciri.webp",
        dkarta: "/gwent/assets/dkarty/1/010.webp",
        opis: '"Wiesz, kiedy bajki przestają być bajkami? Kiedy ludzie zaczynają w nie wierzyć."',
        bohater: true,
        moc: "wezwanie",
        frakcja: "nie",
        punkty: 15,
        pozycja: 1,
        summon: "020",
        ilosc: 1,
        numer: "010"
    },

    {
        nazwa: "Yennefer z Vengerbergu",
        karta: "/gwent/assets/karty/niezalerzne/yenneder_z_vengerbergu.webp",
        dkarta: "/gwent/assets/dkarty/1/011.webp",
        opis: '"Odziana w kompozycje czerni i bieli, przywodziła na myśl grudniowy poranek".',
        bohater: true,
        moc: "medyk",
        frakcja: "nie",
        punkty: 7,
        pozycja: 2,
        ilosc: 1,
        numer: "011"
    },

    {
        nazwa: "Triss Merigold",
        karta: "/gwent/assets/karty/niezalerzne/triss.webp",
        dkarta: "/gwent/assets/dkarty/1/012.webp",
        opis: '"Potrafię o siebie zadbać. Wierz mi"',
        bohater: true,
        frakcja: "nie",
        punkty: 7,
        pozycja: 1,
        ilosc: 1,
        numer: "012"
    },

    {
        nazwa: "Villentretenmerth",
        karta: "/gwent/assets/karty/niezalerzne/villentretenmerth.webp",
        dkarta: "/gwent/assets/dkarty/1/013.webp",
        opis: '"Było w tym stworzeniu coś pełnego niewysławionej gracji".',
        bohater: false,
        moc: "iporz",
        frakcja: "nie",
        punkty: 7,
        pozycja: 1,
        ilosc: 1,
        numer: "013"
    },

    {
        nazwa: "Vesemir",
        karta: "/gwent/assets/karty/niezalerzne/vesemir.webp",
        dkarta: "/gwent/assets/dkarty/1/014.webp",
        opis: '"Gdy cie mają wieszać, poproś o wode. Nie wiadomo co może sie zdarzyć zanim przyniosą".',
        bohater: false,
        frakcja: "nie",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "014"
    },

    {
        nazwa: "Olgierd von Everec",
        karta: "/gwent/assets/karty/niezalerzne/olgierd_von_everec.webp",
        dkarta: "/gwent/assets/dkarty/1/015.webp",
        opis: '"Teraz przynajmniej wiesz, że łatwo nie trace głowy"',
        bohater: false,
        moc: "morale",
        frakcja: "nie",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "015"
    },

    {
        nazwa: "Zoltan Chivay",
        karta: "/gwent/assets/karty/niezalerzne/zoltan_chivay.webp",
        dkarta: "/gwent/assets/dkarty/1/016.webp",
        opis: '"Lubie czynić dobro. Zwłaszcza dla siebie i mego bezpośredniego otocznia"',
        bohater: false,
        frakcja: "nie",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "016"
    },

    {
        nazwa: "Emiel Regis Rohellec Terzieff",
        karta: "/gwent/assets/karty/niezalerzne/emirl_regis_rohellec_terzieff.webp",
        dkarta: "/gwent/assets/dkarty/1/017.webp",
        opis: '"Uchodzę, delikatnie mówiąc, za potwora. Za krwiożercze monstrum".',
        bohater: false,
        frakcja: "nie",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "017"
    },

    {
        nazwa: "Guanter O'Dim: Cień",
        karta: "/gwent/assets/karty/niezalerzne/gaunter_o'dim_cien.webp",
        dkarta: "/gwent/assets/dkarty/1/018.webp",
        opis: '"Bój sie nie ciemnosci, a światła"',
        bohater: false,
        moc: "wezwanie",
        frakcja: "nie",
        punkty: 4,
        pozycja: 2,
        summon: "018",
        ilosc: 3,
        numer: "018"
    },

    {
        nazwa: "Guanter O'Dim",
        karta: "/gwent/assets/karty/niezalerzne/gaunter_o'dim.webp",
        dkarta: "/gwent/assets/dkarty/1/019.webp",
        opis: "Życzenia twe zawsze spełni z ochotą, da ci brylant i srebro, i złoto",
        bohater: false,
        moc: "wezwanie",
        frakcja: "nie",
        punkty: 2,
        pozycja: 3,
        summon: "018",
        ilosc: 1,
        numer: "019"
    },

    {
        nazwa: "Płotka",
        karta: "/gwent/assets/niezalerzne/plotka.webp",
        dkarta: "/gwent/assets/dkarty/1/020.webp",
        opis: "Płotka! Potrzebuję cie!",
        bohater: false,
        frakcja: "nie",
        punkty: 3,
        pozycja: 1,
        ilosc: 1,
        numer: "020"
    },

    {
        nazwa: "Jaskier",
        karta: "/gwent/assets/karty/niezalerzne/jaskier.webp",
        dkarta: "/gwent/assets/dkarty/1/021.webp",
        opis: '"Julian Alfred Pankratz wicehrabia de Lettenhove. Dla przyjaciół - Jaskier".',
        bohater: false,
        moc: "rog",
        frakcja: "nie",
        punkty: 2,
        pozycja: 1,
        ilosc: 1,
        numer: "021"
    },

    {
        nazwa: "Tajemniczy elf",
        karta: "/gwent/assets/karty/niezalerzne/tajemniczy_elf.webp",
        dkarta: "/gwent/assets/dkarty/1/022.webp",
        opis: '"WORK."',
        bohater: true,
        moc: "szpieg",
        frakcja: "nie",
        punkty: 0,
        pozycja: 1,
        ilosc: 1,
        numer: "022"
    },

    {
        nazwa: "Krowa",
        karta: "/gwent/assets/karty/niezalerzne/krowa.webp",
        dkarta: "/gwent/assets/dkarty/1/023.webp",
        opis: '"Muuu!"',
        bohater: false,
        moc: "wezwarniezza",
        frakcja: "nie",
        punkty: 0,
        pozycja: 2,
        summon: "407",
        ilosc: 1,
        numer: "023"
    },

    //polnoc==============================================================================================================================================================

    {
        nazwa: "Vernon Roche",
        karta: "/gwent/assets/karty/polnoc/vernon_rosh.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: true,
        frakcja: "1",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "101"
    },

    {
        nazwa: "Jan Natalis",
        karta: "/gwent/assets/karty/polnoc/jan_natalis.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: true,
        frakcja: "1",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "102"
    },

    {
        nazwa: "Esterad Thyssen",
        karta: "/gwent/assets/karty/polnoc/esterad_thyssen.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: true,
        frakcja: "1",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "103"
    },

    {
        nazwa: "Philippa Eilhart",
        karta: "/gwent/assets/karty/polnoc/philippa_eilhart.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: true,
        frakcja: "1",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "104"
    },

    {
        nazwa: "Katapulta",
        karta: "/gwent/assets/karty/polnoc/katapulta.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "wiez",
        frakcja: "1",
        punkty: 8,
        pozycja: 3,
        ilosc: 2,
        numer: "105"
    },

    {
        nazwa: "Detmold",
        karta: "/gwent/assets/karty/polnoc/detmold.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 2,
        ilosc: 1,
        numer: "106"
    },

    {
        nazwa: "Trebusz",
        karta: "/gwent/assets/karty/polnoc/trebusz2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "107"
    },

    {
        nazwa: "Trebusz",
        karta: "/gwent/assets/karty/polnoc/trebusz1.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "108"
    },

    {
        nazwa: "Balista",
        karta: "/gwent/assets/karty/polnoc/balista1.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "109"
    },

    {
        nazwa: "Balista",
        karta: "/gwent/assets/karty/polnoc/balista.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "110"
    },

    {
        nazwa: "Wieża oblężnicza",
        karta: "/gwent/assets/karty/polnoc/wieza_obleznicza.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "111"
    },

    {
        nazwa: "Ves",
        karta: "/gwent/assets/karty/polnoc/ves.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "1",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "112"
    },

    {
        nazwa: "Zygfryd z Denesle",
        karta: "/gwent/assets/karty/polnoc/zygfryd_z_denesle.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "1",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "113"
    },

    {
        nazwa: "Keira Metz",
        karta: "/gwent/assets/karty/polnoc/keira_metz.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 5,
        pozycja: 2,
        ilosc: 1,
        numer: "114"
    },

    {
        nazwa: "Sheala de Tancarville",
        karta: "/gwent/assets/karty/polnoc/sheale_de_tancarville.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 5,
        pozycja: 2,
        ilosc: 1,
        numer: "115"
    },

    {
        nazwa: "Książe Stenis",
        karta: "/gwent/assets/karty/polnoc/ksiaze_stennis.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "szpieg",
        frakcja: "1",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "116"
    },

    {
        nazwa: "Rębacze z Crinfrid",
        karta: "/gwent/assets/karty/polnoc/rebacze_z_crinfrid.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "wiez",
        frakcja: "1",
        punkty: 5,
        pozycja: 2,
        ilosc: 3,
        numer: "117"
    },

    {
        nazwa: "Medyczka Burej Chorągwi",
        karta: "/gwent/assets/karty/polnoc/medyczka_burej_choragwi.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "medyk",
        frakcja: "1",
        punkty: 5,
        pozycja: 3,
        ilosc: 1,
        numer: "118"
    },

    {
        nazwa: "Sigismund Dijkstra",
        karta: "/gwent/assets/karty/polnoc/sigismund_dijkstra.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "szpieg",
        frakcja: "1",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "119"
    },

    {
        nazwa: "Sabrina Glebissig",
        karta: "/gwent/assets/karty/polnoc/sabrina_glevissig.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "120"
    },

    {
        nazwa: "Sheldon Skaggs",
        karta: "/gwent/assets/karty/polnoc/sheldon_skaggs.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "121"
    },

    {
        nazwa: "Komandos Niebieskich Pasów",
        karta: "/gwent/assets/karty/polnoc/komandos_niebieskich_pasow.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "wiez",
        frakcja: "1",
        punkty: 4,
        pozycja: 1,
        ilosc: 3,
        numer: "122"
    },

    {
        nazwa: "Yarpen Zigrin",
        karta: "/gwent/assets/karty/polnoc/yarpen_zigrin.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "1",
        punkty: 2,
        pozycja: 1,
        ilosc: 1,
        numer: "123"
    },

    {
        nazwa: "Talar",
        karta: "/gwent/assets/karty/polnoc/talar.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "szpieg",
        frakcja: "1",
        punkty: 1,
        pozycja: 3,
        ilosc: 1,
        numer: "124"
    },

    {
        nazwa: "Biedna Pierdolona Piechota",
        karta: "/gwent/assets/karty/polnoc/biedna_pierdolona_piechota.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "wiez",
        frakcja: "1",
        punkty: 1,
        pozycja: 1,
        ilosc: 4,
        numer: "125"
    },

    {
        nazwa: "Redański piechur",
        karta: "/gwent/assets/karty/polnoc/redanski_piechur.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 1,
        pozycja: 1,
        ilosc: 1,
        numer: "126"
    },

    {
        nazwa: "Redański piechur",
        karta: "/gwent/assets/karty/polnoc/redanski_piechur2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "1",
        punkty: 1,
        pozycja: 1,
        ilosc: 1,
        numer: "127"
    },

    {
        nazwa: "Mistrz Oblężeń z Kaedwen",
        karta: "/gwent/assets/karty/polnoc/mistrz_oblezen_z_kaedwen.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "morale",
        frakcja: "1",
        punkty: 1,
        pozycja: 3,
        ilosc: 3,
        numer: "128"
    },

    //nilfgard========================================================================================================================================================

    {
        nazwa: "Letho z Gulety",
        karta: "/gwent/assets/karty/nilftgard/letho_z_gulety.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: true,
        frakcja: "2",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "201"
    },

    {
        nazwa: "Menno Coehoorn",
        karta: "/gwent/assets/karty/nilftgard/menno_coehoorn.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "medyk",
        frakcja: "2",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "202"
    },

    {
        nazwa: "Morvran Voorhis",
        karta: "/gwent/assets/karty/nilftgard/morvran_voorhis.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: true,
        frakcja: "2",
        punkty: 10,
        pozycja: 3,
        ilosc: 1,
        numer: "203"
    },

    {
        nazwa: "Tibor Eggebracht",
        karta: "/gwent/assets/karty/nilftgard/tibor_eggebracht.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: true,
        frakcja: "2",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "204"
    },

    {
        nazwa: "Nilfgaardzki łucznik",
        karta: "/gwent/assets/karty/nilftgard/wielki_ognisty_skorpion2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "2",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "205"
    },

    {
        nazwa: "Nilfgaardzki łucznik",
        karta: "/gwent/assets/karty/nilftgard/nilfgaardzki-lucznik.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "2",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "206"
    },

    {
        nazwa: "Wielki Ognisty Skorpion",
        karta: "/gwent/assets/karty/nilftgard/wielki_ognisty_skorpion.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "2",
        punkty: 10,
        pozycja: 3,
        ilosc: 1,
        numer: "207"
    },
    
    {
        nazwa: "Stefan Skellen",
        karta: "/gwent/assets/karty/nilftgard/stefan_skellen.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        moc: "szpieg",
        frakcja: "2",
        punkty: 9,
        pozycja: 1,
        ilosc: 1,
        numer: "208"
    },

    {
        nazwa: "Shilard Fitz-Oesterlen",
        karta: "/gwent/assets/karty/nilftgard/shilard_fitz-oesterlen.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "szpieg",
        frakcja: "2",
        punkty: 7,
        pozycja: 1,
        ilosc: 1,
        numer: "209"
    },

    {
        nazwa: "Assire var Anahid",
        karta: "/gwent/assets/karty/nilftgard/assire_var_anachid.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "2",
        punkty: 6,
        pozycja: 2,
        ilosc: 1,
        numer: "210"
    },
 
    {
        nazwa: "Fringilla Vigo",
        karta: "/gwent/assets/karty/nilftgard/fringilla_vigo.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: '"WORK."',
        bohater: false,
        frakcja: "2",
        punkty: 6,
        pozycja: 2,
        ilosc: 1,
        numer: "211"
    },

    {
        nazwa: "Cahir Mawr Dyffryn aep Ceallach",
        karta: "/gwent/assets/karty/nilftgard/cahir_mawr_dyffryn_aep_ceallach.webp",
        dkarta: "/gwent/assets/dkarty/3/kachir.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "212"
    },

    {
        nazwa: "Saper",
        karta: "/gwent/assets/karty/nilftgard/saper.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "213"
    },

    {
        nazwa: "Renuald aep Matsen",
        karta: "/gwent/assets/karty/nilftgard/renuald_aep_matsen.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 5,
        pozycja: 2,
        ilosc: 1,
        numer: "214"
    },

    {
        nazwa: "Zerrikański Ognisty Skorpion",
        karta: "/gwent/assets/karty/nilftgard/zerrikanski_ognisty_skorpion.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 5,
        pozycja: 3,
        ilosc: 1,
        numer: "215"
    },

    {
        nazwa: "Młody emisariusz",
        karta: "/gwent/assets/karty/nilftgard/mlody_emisariusz.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wiez",
        frakcja: "2",
        punkty: 5,
        pozycja: 1,
        summon: "217",
        ilosc: 1,
        numer: "216"
    },

    {
        nazwa: "Młody emisariusz",
        karta: "/gwent/assets/karty/nilftgard/mlody_emisariusz2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wiez",
        frakcja: "2",
        punkty: 5,
        pozycja: 1,
        summon: "216",
        ilosc: 1,
        numer: "217"
    },

    {
        nazwa: "Cynthia",
        karta: "/gwent/assets/karty/nilftgard/cynthia.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "218"
    },

    {
        nazwa: "Rainfarn",
        karta: "/gwent/assets/karty/nilftgard/rainfarn.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "219"
    },

    {
        nazwa: "Vanhemar",
        karta: "/gwent/assets/karty/nilftgard/vanhemar.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "220"
    },

    {
        nazwa: "Vattier de Rideaux",
        karta: "/gwent/assets/karty/nilftgard/vattier_de_rideaux.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "szpieg",
        frakcja: "2",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "221"
    },

    {
        nazwa: "Moeteisen",
        karta: "/gwent/assets/karty/nilftgard/mortiesen.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 3,
        pozycja: 1,
        ilosc: 1,
        numer: "222"
    },

    {
        nazwa: "Zdezelowana mangonela",
        karta: "/gwent/assets/karty/nilftgard/zdezelowana_mangonela.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 3,
        pozycja: 3,
        ilosc: 1,
        numer: "223"
    },

    {
        nazwa: "Puttkammer",
        karta: "/gwent/assets/karty/nilftgard/puttkammer.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 3,
        pozycja: 2,
        ilosc: 1,
        numer: "224"
    },

    {
        nazwa: "Brygada Impera",
        karta: "/gwent/assets/karty/nilftgard/brygada_impera.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wiez",
        frakcja: "2",
        punkty: 3,
        pozycja: 1,
        ilosc: 4,
        numer: "225"
    },

    {
        nazwa: "Albrich",
        karta: "gwent/assets/karty/nilftgard/albrich.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 2,
        pozycja: 3,
        ilosc: 1,
        numer: "226"
    },

    {
        nazwa: "Sweers",
        karta: "/gwent/assets/karty/nilftgard/sweers.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 2,
        pozycja: 2,
        ilosc: 1,
        numer: "227"
    },

    {
        nazwa: "Vreemde",
        karta: "/gwent/assets/karty/nilftgard/vreemde.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "2",
        punkty: 2,
        pozycja: 1,
        ilosc: 1,
        numer: "228"
    },

    {
        nazwa: "Kawaleria Nauzicaa",
        karta: "/gwent/assets/karty/nilftgard/kawaleria_nauzicaa.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wiez",
        frakcja: "2",
        punkty: 2,
        pozycja: 1,
        ilosc: 3,
        numer: "229"
    },

    {
        nazwa: "Wsparcie łuczników",
        karta: "/gwent/assets/karty/nilftgard/wsparcie_lucznikow2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "medyk",
        frakcja: "2",
        punkty: 1,
        pozycja: 2,
        ilosc: 1,
        numer: "230"
    },

    {
        nazwa: "Wsparcie łuczników",
        karta: "/gwent/assets/karty/nilftgard/wsparcie_lucznikow.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "medyk",
        frakcja: "2",
        punkty: 1,
        pozycja: 2,
        ilosc: 1,
        numer: "231"
    },

    {
        nazwa: "Wsparcie oblężnicze",
        karta: "/gwent/assets/karty/nilftgard/wsparcie_obleznicze.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "medyk",
        frakcja: "2",
        punkty: 0,
        pozycja: 3,
        ilosc: 1,
        numer: "232"
    },

    //wiwwiury============================================================================================================================================================

    {
        nazwa: "Eithné",
        karta: "/gwent/assets/karty/scio'tel/eithne.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: true,
        frakcja: "3",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "301"
    },

    {
        nazwa: "Saesenthessis",
        karta: "/gwent/assets/karty/scio'tel/saesenthessis.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: true,
        frakcja: "3",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "302"
    },

    {
        nazwa: "Isengrim Faoiltiarna",
        karta: "/gwent/assets/karty/scio'tel/isengrim_faoiltiarna.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: true,
        moc: "morale",
        frakcja: "3",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "303"
    },

    {
        nazwa: "Iorveth",
        karta: "/gwent/assets/karty/scio'tel/iorwet.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: true,
        frakcja: "3",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "304"
    },
    
    {
        nazwa: "Milva",
        karta: "/gwent/assets/karty/scio'tel/milva.webp",
        dkarta: "/gwent/assets/dkarty/4/milwa.webp",
        opis: "WORK.",
        bohater: false,
        moc: "morale",
        frakcja: "3",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "305"
    },

    {
        nazwa: "Schirrú",
        karta: "/gwent/assets/karty/scio'tel/schirru.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "iporz",
        frakcja: "3",
        punkty: 8,
        pozycja: 3,
        ilosc: 1,
        numer: "306"
    },

    {
        nazwa: "Dennis Cranmer",
        karta: "/gwent/assets/karty/scio'tel/dennis_cranmer.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "307"
    },

    {
        nazwa: "Ida Emean aep Sivney",
        karta: "/gwent/assets/karty/scio'tel/ida_emean_aep_sivney.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 2,
        ilosc: 1,
        numer: "308"
    },

    {
        nazwa: "Filavandrel aén Fidháil",
        karta: "/gwent/assets/karty/scio'tel/filavandrel_aen_fidhail.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "309"
    },

    {
        nazwa: "Yaevinn",
        karta: "/gwent/assets/karty/scio'tel/yaevinn.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "310"
    },
    
    {
        nazwa: "Barcayl Els",
        karta: "/gwent/assets/karty/scio'tel/barclay_els.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "311"
    },

    {
        nazwa: "Zwiadowca z Dol Blathanna",
        karta: "/gwent/assets/karty/scio'tel/zwiadowca_z_dol_blathanna3.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        summon: "",
        ilosc: 1,
        numer: "312"
    },   
    
    {
        nazwa: "Zwiadowca z Dol Blathanna",
        karta: "/gwent/assets/karty/scio'tel/zwiadowca_z_dol_blathanna.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        summon: "",
        ilosc: 1,
        numer: "313"
    },   

    {
        nazwa: "Zwiadowca z Dol Blathanna",
        karta: "/gwent/assets/karty/scio'tel/zwiadowca_z_dol_blathanna2.webp-",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        summon: "",
        ilosc: 1,
        numer: "314"
    },   
    
    {
        nazwa: "Hevekarskie wsparcie",
        karta: "/gwent/assets/karty/scio'tel/havekarskie_wsparcie3.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "315"
    }, 

    {
        nazwa: "Hevekarskie wsparcie",
        karta: "/gwent/assets/karty/scio'tel/havekarskie_wsparcie.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "316"
    },    
       
    {
        nazwa: "Hevekarskie wsparcie",
        karta: "/gwent/assets/karty/scio'tel/havekarskie_wsparcie2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "317"
    },      

    {
        nazwa: "Bryada Vrihedd",
        karta: "/gwent/assets/karty/scio'tel/brygada_vrihedd2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 4,
        ilosc: 1,
        numer: "318"
    },
    
    {
        nazwa: "Bryada Vrihedd",
        karta: "/gwent/assets/karty/scio'tel/brygada_vrihedd.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 4,
        ilosc: 1,
        numer: "319"
    },

    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/gwent/assets/karty/scio'tel/obronca_mahakamu.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "320"
    },

    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/gwent/assets/karty/scio'tel/obronca_mahakamu2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "321"
    },
    
    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/gwent/assets/karty/scio'tel/obronca_mahakamu3.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "322"
    },
    
    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/gwent/assets/karty/scio'tel/obronca_mahakamu5.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "323"
    },
    
    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/gwent/assets/karty/scio'tel/obronca_mahakamu4.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "324"
    },

    {
        nazwa: "Kadet Vrihedd",
        karta: "/gwent/assets/karty/scio'tel/kadet_vrihedd.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "325"
    },
       
    {
        nazwa: "Łucznik z Dol Blathanna",
        karta: "/gwent/assets/karty/scio'tel/lucznik_z_blathanna.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "326"
    },
    
    {
        nazwa: "Ciran aep Easnillien",
        karta: "/gwent/assets/karty/scio'tel/ciaran_aep_easnillien.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 3,
        pozycja: 4,
        ilosc: 1,
        numer: "327"
    },

    {
        nazwa: "Krasnolud Harcownik",
        karta: "/gwent/assets/karty/scio'tel/krasnolud_harcownik3.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 3,
        pozycja: 1,
        ilosc: 1,
        numer: "328"
    },

    {
        nazwa: "Krasnolud Harcownik",
        karta: "/gwent/assets/karty/scio'tel/krasnolud_harcownik2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 3,
        pozycja: 1,
        ilosc: 1,
        numer: "329"
    }, 

    {
        nazwa: "Krasnolud Harcownik",
        karta: "/gwent/assets/karty/scio'tel/krasnolud_harcownik.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 3,
        pozycja: 1,
        ilosc: 1,
        numer: "330"
    },

    {
        nazwa: "Toruviel",
        karta: "/gwent/assets/karty/scio'tel/toruviel.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 2,
        pozycja: 2, 
        ilosc: 1,
        numer: "331"
    },

    {
        nazwa: "Elfi harcownik",
        karta: "/gwent/assets/karty/scio'tel/elfi_harcownik.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 2,
        pozycja: 2,
        summon: "Elfi harcownik",
        ilosc: 1,
        numer: "332"
    },

    {
        nazwa: "Elfi harcownik",
        karta: "/gwent/assets/karty/scio'tel/elfi_harcownik3.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 2,
        pozycja: 2,
        summon: "Elfi harcownik",
        ilosc: 1,
        numer: "333"
    },

    {
        nazwa: "Elfi harcownik",
        karta: "/gwent/assets/karty/scio'tel/elfi_harcownik2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 2,
        pozycja: 2,
        summon: "Elfi harcownik",
        ilosc: 1,
        numer: "334"
    },

    {
        nazwa: "Riordain",
        karta: "/gwent/assets/karty/scio'tel/riordain.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "3",
        punkty: 0,
        pozycja: 2,
        ilosc: 1,
        numer: "335"
    },

    {
        nazwa: "Havekarski medyk",
        karta: "/gwent/assets/karty/scio'tel/havekarski_medyk3.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "medyk",
        frakcja: "3",
        punkty: 0,
        pozycja: 2,
        ilosc: 1,
        numer: "336"
    },

    {
        nazwa: "Havekarski medyk",
        karta: "/gwent/assets/karty/scio'tel/havekarski_medyk2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "medyk",
        frakcja: "3",
        punkty: 0,
        pozycja: 2,
        ilosc: 1,
        numer: "337"
    },

    {
        nazwa: "Havekarski medyk",
        karta: "/gwent/assets/karty/scio'tel/havekarski_medyk.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "medyk",
        frakcja: "3",
        punkty: 0,
        pozycja: 2,
        ilosc: 1,
        numer: "338"
    },

    // powfory ==========================================================================================================================================================

    {
        nazwa: "Draug",
        karta: "/gwent/assets/karty/potwory/draug.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: "true",
        frakcja: "4",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "401"
    },
 
    {
        nazwa: "Imlerith",
        karta: "/gwent/assets/karty/potwory/imlerith.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: true,
        frakcja: "4",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "402"
    },
    
    {
        nazwa: "Leszy",
        karta: "/gwent/assets/karty/potwory/leszy.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: true,
        frakcja: "4",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "403"
    },

    {
        nazwa: "Kejran",
        karta: "/gwent/assets/karty/potwory/kejran.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: true,
        moc: "morale",
        frakcja: "4",
        punkty: 8,
        pozycja: 4,
        ilosc: 1,
        numer: "404"
    },

    {
        nazwa: "Królewicz ropuch",
        karta: "/gwent/assets/karty/potwory/krolewicz_ropuch.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "iporz",
        frakcja: "4",
        punkty: 7,
        pozycja: 2,
        ilosc: 1,
        numer: "405"
    },

    {
        nazwa: "Żywiołak ziemi",
        karta: "/gwent/assets/karty/potwory/zywiolak_ziemi.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "406"
    },

    {
        nazwa: "Bies",
        karta: "/gwent/assets/karty/potwory/bies.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "407"
    },

    {
        nazwa: "Żywiołak ognia",
        karta: "/gwent/assets/karty/potwory/zywiolak_ognia.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "408"
    },
     
    {
        nazwa: "Olbrzymi krabopająk",
        karta: "/gwent/assets/karty/potwory/olbrzymi_krabopajak.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 6,
        pozycja: 3,
        summon: "Krabopająk",
        ilosc: 1,
        numer: "409"
    },
  
    {
        nazwa: "Wiedzma: Kuchta",
        karta: "/gwent/assets/karty/potwory/wiedzma_kuchta.webp",
        dkarta: "/gwent/assets/dkarty/4/410.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 6,
        pozycja: 1,
        summon: "Wiedzma: Szepciucha, Wiedzma: Prządka",
        ilosc: 1,
        numer: "410"
    },

    {
        nazwa: "Wiedzma: Prządka",
        karta: "/gwent/assets/karty/potwory/",
        dkarta: "/gwent/assets/dkarty/4/411.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 6,
        pozycja: 1,
        summon: "Wiedzma: Kuchta, Wiedzma: Szepciucha",
        ilosc: 1,
        numer: "411"
    },

    {
        nazwa: "Wiedzma: Szepciucha",
        karta: "/gwent/assets/karty/potwory/wiedzma_przadka.webp",
        dkarta: "/gwent/assets/dkarty/4/412.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 6,
        pozycja: 1,
        summon: "Wiedzma: Kuchta, Wiedzma: Prządka",
        ilosc: 1,
        numer: "412"
    },

    {
        nazwa: "Widłogon",
        karta: "/gwent/assets/karty/potwory/widlogon.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "413"
    },              

    {
        nazwa: "Morowa dziewica",
        karta: "/gwent/assets/karty/potwory/morowa_dziewica.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "414"
    },

    {
        nazwa: "Gryf",
        karta: "/gwent/assets/karty/potwory/gryf.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "415"
    },

    {
        nazwa: "Wilkołak",
        karta: "/gwent/assets/karty/potwory/wilkolak.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "416"
    },

    {
        nazwa: "Przeraza",
        karta: "/gwent/assets/karty/potwory/przeraza.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "417"
    },

    {
        nazwa: "Lodowy Gigant",
        karta: "/gwent/assets/karty/potwory/lodowt_gigant.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 3,
        ilosc: 1,
        numer: "418"
    },

    {
        nazwa: "Baba cmentarna",
        karta: "/gwent/assets/karty/potwory/baba_cmentarna.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 2,
        ilosc: 1,
        numer: "419"
    },

    {
        nazwa: "Wampir: Katakan",
        karta: "/gwent/assets/karty/potwory/wampir_katakan.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        summon: "",
        ilosc: 1,
        numer: "420"
    },

    {
        nazwa: "Poroniec",
        karta: "/gwent/assets/karty/potwory/poroniec.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "421"
    },

    {
        nazwa: "Krabopająk",
        karta: "/gwent/assets/karty/potwory/krabopajak3.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "Krabopająk",
        ilosc: 1,
        numer: "422"
    },

    {
        nazwa: "Krabopająk",
        karta: "/gwent/assets/karty/potwory/krabopajak2.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "Krabopająk",
        ilosc: 1,
        numer: "423"
    },

    {
        nazwa: "Krabopająk",
        karta: "/gwent/assets/karty/potwory/krabopajak1.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "Krabopająk",
        ilosc: 1,
        numer: "424"
    },

    {
        nazwa: "Wampir: Ekimma",
        karta: "/gwent/assets/karty/potwory/wampir_ekimma.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "Wampir",
        ilosc: 1,
        numer: "425"
    },
     
    {
        nazwa: "Wampir: Fleder",
        karta: "/gwent/assets/karty/potwory/wampir_fleader.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "Wampir",
        ilosc: 1,
        numer: "426"
    },
     
    {
        nazwa: "Wampir: Garkain",
        karta: "/gwent/assets/karty/potwory/wampir_garkain.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "Wampir",
        ilosc: 1,
        numer: "427"
    },

    {
        nazwa: "Wampir: Bruxa",
        karta: "/gwent/assets/karty/potwory/wampir_bruxa.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "Wampir",
        ilosc: 1,
        numer: "428"
    },

    {
        nazwa: "Endriaga",
        karta: "/gwent/assets/karty/potwory/endriaga.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "Work",
        bohater: false,
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "429"
    },
    
    {
        nazwa: "Harpia",
        karta: "/gwent/assets/karty/potwory/harpia.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 4,
        ilosc: 1,
        numer: "430"
    },     
    
    {
        nazwa: "Kuroliszek",
        karta: "/gwent/assets/karty/potwory/kuroliszek.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 2,
        ilosc: 1,
        numer: "431"
    },     

    {
        nazwa: "Gargulec",
        karta: "/gwent/assets/karty/potwory/gargulec.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 2,
        ilosc: 1,
        numer: "432"
    },     
    
    {
        nazwa: "Harpia Celaeno",
        karta: "/gwent/assets/karty/potwory/harpia_celaeno.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 4,
        ilosc: 1,
        numer: "433"
    },     
    
    {
        nazwa: "Mglak",
        karta: "/gwent/assets/karty/potwory/mglak.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 1,
        ilosc: 1,
        numer: "434"
    },     

    {
        nazwa: "Wiwerna",
        karta: "/gwent/assets/karty/potwory/wiwerna.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 2,
        ilosc: 1,
        numer: "435"
    },


    {
        nazwa: "Nekker",
        karta: "/gwent/assets/karty/potwory/nekker3.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 2,
        pozycja: 1,
        summon:"Nekker",
        ilosc: 1,
        numer: "436"
    },

    {
        nazwa: "Nekker",
        karta: "/gwent/assets/karty/potwory/nekker2.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 2,
        pozycja: 1,
        summon:"Nekker",
        ilosc: 1,
        numer: "437"
    },

    {
        nazwa: "Nekker",
        karta: "/gwent/assets/karty/potwory/nekker1.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 2,
        pozycja: 1,
        summon:"Nekker",
        ilosc: 1,
        numer: "438"
    },    

    {
        nazwa: "Ghul",
        karta: "/gwent/assets/karty/potwory/ghul3.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 1,
        pozycja: 1,
        summon:"Ghul",
        ilosc: 1,
        numer: "439"
    },
    
    {
        nazwa: "Ghul",
        karta: "/gwent/assets/karty/potwory/ghul2.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 1,
        pozycja: 1,
        summon:"Ghul",
        ilosc: 1,
        numer: "440"
    },    
    
    {
        nazwa: "Ghul",
        karta: "/gwent/assets/karty/potwory/ghul1.webp",
        dkarta: "/gwent/assets/dkarty/4/4.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 1,
        pozycja: 1,
        summon:"Ghul",
        ilosc: 1,
        numer: "441"
    },
    
//skellige ==============================================
//skellige ==============================================
//skellige ==============================================
    
    {
        nazwa: "Olaf",
        karta: "/gwent/assets/karty/Skellige/olaf.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "morale",
        frakcja: "5",
        punkty: 12,
        pozycja: 4,
        ilosc: 1,
        numer: "501"
    },   
    
    {
        nazwa: "Hjalmar",
        karta: "/gwent/assets/karty/Skellige/hjalmar.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: true,
        frakcja: "5",
        punkty: 10,
        pozycja: 2,          
        ilosc: 1,
        numer: "502"
    },    
    
    {
        nazwa: "Cerys",
        karta: "/gwent/assets/karty/Skellige/cerys.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "5",
        punkty: 10,
        pozycja: 1,
        summon:"",
        ilosc: 1,
        numer: "503"
    },    
    
    {
        nazwa: "Myszowór",
        karta: "/gwent/assets/karty/Skellige/myszowór.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: true,
        moc: "grzybki",
        frakcja: "5",
        punkty: 8,
        pozycja: 2,
        ilosc: 1,
        numer: "504"
    },    
    
    {
        nazwa: "Lugos Szalony",
        karta: "/gwent/assets/karty/Skellige/lugos_szalony.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "5",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "505"
    },    
    
    {
        nazwa: "Lugos Siny",
        karta: "/gwent/assets/karty/Skellige/lugos_siny.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "5",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "506"
    },
    
    {
        nazwa: "Wojownik klanu Craite",
        karta: "/gwent/assets/karty/Skellige/wojownik_klanu_craite.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wiez",
        frakcja: "5",
        punkty: 6,
        pozycja: 1,
        ilosc: 3,
        numer: "507"
    },    
    
    {
        nazwa: "Drakkar wojenny",
        karta: "/gwent/assets/karty/Skellige/lucznik_klanu_brokvar.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wiez",
        frakcja: "5",
        punkty: 6,
        pozycja: 3,
        ilosc: 3,
        numer: "508"
    },    
    
    {
        nazwa: "Łucznik klanu Brokvar",
        karta: "/gwent/assets/karty/Skellige/",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "5",
        punkty: 6,
        pozycja: 5,
        ilosc: 3,
        numer: "509"
    },    
    
    {
        nazwa: "Purat klanu Dimun",
        karta: "/gwent/assets/karty/Skellige/pirat_z_klanu_dimun.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "porz",
        frakcja: "5",
        punkty: 6,
        pozycja: 2,
        ilosc: 1,
        numer: "510"
    },    
    
    {
        nazwa: "Holger Czarna Ręka",
        karta: "/gwent/assets/karty/Skellige/holger_czarna_reka.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 3,
        ilosc: 1,
        numer: "511"
    },    
    
    {
        nazwa: "Donar an Hindar",
        karta: "/gwent/assets/karty/Skellige/donar_an_hindar.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "512"
    },

    {
        nazwa: "Udarlyk",
        karta: "/gwent/assets/karty/Skellige/udarlyk.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "513"
    },    
    
    {
        nazwa: "Svanrige",
        karta: "/gwent/assets/karty/Skellige/svanrige.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "514"
    },    
    
    {
        nazwa: "Berserk",
        karta: "/gwent/assets/karty/Skellige/berserk.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "berserk",
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        summon:"",
        ilosc: 1,
        numer: "515"
    },
    
    {
        nazwa: "Płatnerz klanu Torrdaroch",
        karta: "/gwent/assets/karty/Skellige/platnerz_klanu_tordarroch.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "5",
        punkty: 4 ,
        pozycja: 1,
        ilosc: 1,
        numer: "516"
    },    
    
    {
        nazwa: "Sklad klanu Heymaey",
        karta: "/gwent/assets/karty/Skellige/skald_klanu_heymaey.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 1, 
        ilosc: 1,
        numer: "517"
    },    
    
    {
        nazwa: "Lekki Drakkar",
        karta: "/gwent/assets/karty/Skellige/lekki_drakkar.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwanie",
        frakcja: "5",
        punkty: 4,
        pozycja: 2,
        ilosc: 3,
        numer: "518"
    },

    {
        nazwa: "Tarczowniczka klanu Drummond",
        karta: "/gwent/assets/karty/Skellige/tarczowniczka_klanu_drummond1.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wiez",
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "519"
    },        

    {
        nazwa: "Tarczowniczka klanu Drummond",
        karta: "/gwent/assets/karty/Skellige/tarczowniczka_klanu_drummond2.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wiez",
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "520"
    },  
      
    {
        nazwa: "Tarczowniczka klanu Drummond",
        karta: "/gwent/assets/karty/Skellige/tarczowniczka_klanu_drummond3.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wiez",
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "521"
    },  
  
    {
        nazwa: "Draig Bon-Duh",
        karta: "/gwent/assets/karty/Skellige/draig_bon_dhu.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "rog",
        frakcja: "5",
        punkty: 2,
        pozycja: 3,
        ilosc: 1,
        numer: "522"
    },

    {
        nazwa: "Birna Bran",
        karta: "/gwent/assets/karty/Skellige/birna_bran.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "medyk",
        frakcja: "5",
        punkty: 2,
        pozycja: 1,
        ilosc: 1,
        numer: "523"
    },
    
    {
        nazwa: "Młody berserk",
        karta: "/gwent/assets/karty/Skellige/mlody_berserker.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "berserk",
        frakcja: "5",
        punkty: 2,
        pozycja: 2,
        summon:"",
        ilosc: 3,
        numer: "524"
    },
    
    {
        nazwa: "Kambi",
        karta: "/gwent/assets/karty/Skellige/kambi.webp",
        dkarta: "/gwent/assets/dkarty/6/tymaczasem.webp",
        opis: "WORK.",
        bohater: false,
        moc: "wezwarniezza",
        frakcja: "5",
        punkty: 0,
        pozycja: 1,
        summon:"",
        ilosc: 1,
        numer: "525"
    },

    //inne===============================================================================================================================================================

    {
        nazwa: "Hemdal",
        karta: "/gwent/assets/karty/Skellige/hemdal.webp",
        dkarta: "/gwent/assets/dkarty/6/hemdal.webp",
        opis: '"Kiedy nadejdzie Czas Białego Mrozu Hemdall wezwie nas do walki."',
        bohater: true,
        punkty: 11,
        pozycja: 1,
        numer: "601"
    },   
    
    {
        nazwa: "Przemieniony Vildkaarl",
        karta: "/gwent/assets/karty/Skellige/kambi.webp",
        dkarta: "/gwent/assets/dkarty/6/berserk.webp",
        opis: "Raz w życiu widziałem jak walczą... I więcej nie chce.",
        bohater: false,
        moc: "morale",
        punkty: 14,
        pozycja: 1,
        numer: "502"
    },    
    
    {
        nazwa: "Przemieniony Młody Vildkaarl",
        karta: "/gwent/assets/karty/Skellige/kambi.webp",
        dkarta: "/gwent/assets/dkarty/6/berserk2.webp",
        opis: "Arrrgh!",
        bohater: false,
        moc: "wiez",
        punkty: 8,
        pozycja: 2,
        numer: "603"
    },
];
export default cards;
