const cards = [
    //pogoda===============================================================================================

    {
        nazwa: "Manekin do ćwiczeń",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/manekin_do_cwiczen.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/manek.webp",
        opis: '"Niespodzianka skurwysyny!"',
        bohater: false,
        moc: "manek",
        frakcja: "nie",
        ilosc: 3,
        numer: "001"
    },

    {
        nazwa: "Róg dowódcy",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/rog_dowodcy.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/rog.webp",
        opis: '"Do atakuuuuu!!!"',
        bohater: false,
        moc: "rog",
        frakcja: "nie",
        ilosc: 3,
        numer: "002"
    },

    {
        nazwa: "Pożoga",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/pozoga.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/porz.webp",
        opis: '"Że też zawsze musi jebnąć, tma gdzie\nnajbardziej boli".',
        bohater: false,
        moc: "porz",
        frakcja: "nie",
        ilosc: 3,
        numer: "003"
    },

    {
        nazwa: "Trzaskający mróz",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/trzaskajacy_mroz.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/mroz.webp",
        opis: '"Tak mi palce zgrabiały, że lewie miecz\ntrzymam... A tujeszcze machać trzeba".',
        bohater: false,
        moc: "mroz",
        frakcja: "nie",
        ilosc: 3,
        numer: "004"
    },

    {
        nazwa: "Gęsta mgła",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/gesta_mgla.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/mgla.webp",
        opis: '"Mgła, że oko wykol... Cokolwiek to\nznaczy".',
        bohater: false,
        moc: "mgla",
        frakcja: "nie",
        ilosc: 3,
        numer: "005"
    },

    {
        nazwa: "Ulewny deszcz",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/ulewny_deszcz.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/deszcz.webp",
        opis: '"Wieża oblężnicz utkneła w błocie!"\n"Widzę, idioto. Trąb na odwrót".',
        bohater: false,
        moc: "deszcz",
        frakcja: "nie",
        ilosc: 3,
        numer: "006"
    },

    {
        nazwa: "Czyste niebo",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/czyste_niebo.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/niebo.webp",
        opis: '"Piękny dzień, żeby umrzeć".',
        bohater: false,
        moc: "niebo",
        frakcja: "nie",
        ilosc: 3,
        numer: "007"
    },

    {
        nazwa: "Skelligijski sztorm",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/skelligijski_sztorm.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/008.webp",
        opis: '"To nie jest zwykła burza. To gniew\nbogów."',
        bohater: false,
        moc: "sztorm",
        frakcja: "nie",
        ilosc: 3,
        numer: "008"
    },

    {
        nazwa: "Mardroeme",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/mardroeme.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/000.webp",
        opis: '"Zjedz ich odpowiednio dużo, a świat już\nnigdy nie będzie taki sam..."',
        bohater: false,
        moc: "grzybki",
        frakcja: "5",
        ilosc: 3,
        numer: "000"
    },



    //neutralne=============================================================================================================================================================

    {
        nazwa: "Geralt z Rivi",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/geralt_z_rivi.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/009.webp",
        opis: '"Jeżeli mam wybierać pomiędzy jednym\nzłem a drugim, to wole nie wybierać\nwcale."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/ciri.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/010.webp",
        opis: '"Wiesz, kiedy bajki przestają być\nbajkami? Kiedy ludzie zaczynają w nie\nwierzyć."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/yenneder_z_vengerbergu.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/011.webp",
        opis: '"Odziana w kompozycje czerni i bieli,\nprzywodziła na myśl grudniowy poranek".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/triss.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/012.webp",
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/villentretenmerth.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/013.webp",
        opis: '"Było w tym stworzeniu coś pełnego\nniewysławionej gracji".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/vesemir.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/014.webp",
        opis: '"Gdy cie mają wieszać, poproś o wode.\nNie wiadomo co może sie zdarzyć zanim\nprzyniosą".',
        bohater: false,
        frakcja: "nie",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "014"
    },

    {
        nazwa: "Olgierd von Everec",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/olgierd_von_everec.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/015.webp",
        opis: '"Teraz przynajmniej wiesz, że łatwo nie\ntrace głowy"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/zoltan_chivay.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/016.webp",
        opis: '"Lubie czynić dobro. Zwłaszcza dla siebie\ni mego bezpośredniego otocznia"',
        bohater: false,
        frakcja: "nie",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "016"
    },

    {
        nazwa: "Emiel Regis Rohellec Terzieff",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/emirl_regis_rohellec_terzieff.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/017.webp",
        opis: '"Uchodzę, delikatnie mówiąc, za potwora.\nZa krwiożercze monstrum".',
        bohater: false,
        frakcja: "nie",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "017"
    },

    {
        nazwa: "Guanter O'Dim: Cień",
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/gaunter_o'dim_cien.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/018.webp",
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/gaunter_o'dim.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/019.webp",
        opis: "Życzenia twe zawsze spełni z ochotą, da\nci brylant i srebro, i złoto",
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/plotka.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/020.webp",
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/jaskier.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/021.webp",
        opis: '"Julian Alfred Pankratz wicehrabia de\nLettenhove. Dla przyjaciół - Jaskier".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/tajemniczy_elf.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/022.webp",
        opis: '"Nie zwykłem żartować."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/niezalerzne/krowa.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/1/023.webp",
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
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/vernon_rosh.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/101.webp",
        opis: '"Patriota, chociarz chuj".',
        bohater: true,
        frakcja: "1",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "101"
    },

    {
        nazwa: "Jan Natalis",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/jan_natalis.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/102.webp",
        opis: '"Ten skwer powinien nosić imię poległych\nżołnierzy. Nie moje".',
        bohater: true,
        frakcja: "1",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "102"
    },

    {
        nazwa: "Esterad Thyssen",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/esterad_thyssen.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/103.webp",
        opis: '"Jak wszyscy Thyssenidzi, był wysoki,\npotężnie zbudowany i - zbójecko\nprzystojny".',
        bohater: true,
        frakcja: "1",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "103"
    },

    {
        nazwa: "Philippa Eilhart",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/philippa_eilhart.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/104.webp",
        opis: '"Philippa Elihart, choć bardzo atrakcyjna,\nbyła zdecydowanie bardzo niemiła".',
        bohater: true,
        frakcja: "1",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "104"
    },

    {
        nazwa: "Katapulta",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/katapulta.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/105.webp",
        opis: '"Bogowie są po stronie tego, co ma\nlepsze katapulty"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/detmold.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/106.webp",
        opis: '"Tysiąc trupów w jednej chwili! Takimi\nczarami wygrywa się wojny!"',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 2,
        ilosc: 1,
        numer: "106"
    },

    {
        nazwa: "Trebusz",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/trebusz2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/107.webp",
        opis: '"Jeden trebuszet jest wart stu piechurów. I trzystu łachudrów,  jak ty".',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "107"
    },

    {
        nazwa: "Trebusz",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/trebusz1.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/108.webp",
        opis: '"Jeden trebuszet jest wart stu piechurów. I trzystu łachudrów,  jak ty".',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "108"
    },

    {
        nazwa: "Balista",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/balista1.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/109.webp",
        opis: '"Zwykle dajemy im dźwięczne kobiece imiona. Jak Helga".',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "109"
    },

    {
        nazwa: "Balista",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/balista.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/110.webp",
        opis: '"Zwykle dajemy im dźwięczne kobiece imiona. Jak Helga".',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "110"
    },

    {
        nazwa: "Wieża oblężnicza",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/wieza_obleznicza.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/111.webp",
        opis: '"Wieża na kulkach... Czego to, kurwa, nie\nwymyślą!"',
        bohater: false,
        frakcja: "1",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "111"
    },

    {
        nazwa: "Ves",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/ves.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/112.webp",
        opis: '"Lepiej przeżyć jeden dzień jak król, niż\ncałe życie jak dziad".',
        bohater: false,
        frakcja: "1",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "112"
    },

    {
        nazwa: "Zygfryd z Denesle",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/zygfryd_z_denesle.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/113.webp",
        opis: '"O pokoju zdecydowanie łatwiej gadać niż\ngo utrzymać".',
        bohater: false,
        frakcja: "1",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "113"
    },

    {
        nazwa: "Keira Metz",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/keira_metz.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/114.webp",
        opis: '"Skoro mam dziś umrzeć,\nmuszę ładnie wyglądać".',
        bohater: false,
        frakcja: "1",
        punkty: 5,
        pozycja: 2,
        ilosc: 1,
        numer: "114"
    },

    {
        nazwa: "Sheala de Tancarville",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/sheale_de_tancarville.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/115.webp",
        opis: '"Nie ma nic gorszego niz naukowo\npodbudowany szowinizm".',
        bohater: false,
        frakcja: "1",
        punkty: 5,
        pozycja: 2,
        ilosc: 1,
        numer: "115"
    },

    {
        nazwa: "Książe Stenis",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/ksiaze_stennis.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/116.webp",
        opis: '"Od razu było widać, że to kawał fiuta. Kto\nnosi złotą zbroje?!"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/rebacze_z_crinfrid.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/117.webp",
        opis: '"Naszą specjalizacją były smoki, ale i\nwojaczka dobra".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/medyczka_burej_choragwi.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/118.webp",
        opis: '"Zszyj czerwone z czerwonym, żółte z\nżółtym a białe z białym i będzie dobrze".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/sigismund_dijkstra.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/119.webp",
        opis: '"Naprawdę myślisz, że się nabiorę na tę\nwyjęta z dupy historyjke?"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/sabrina_glevissig.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/120.webp",
        opis: '"Córa kaedweńskich puszczy".',
        bohater: false,
        frakcja: "1",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "120"
    },

    {
        nazwa: "Sheldon Skaggs",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/sheldon_skaggs.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/121.webp",
        opis: '"Ja byłem w pierwszej linii. Tam, gdzie\nbyło gorąco!"',
        bohater: false,
        frakcja: "1",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "121"
    },

    {
        nazwa: "Komandos Niebieskich Pasów",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/komandos_niebieskich_pasow.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/122.webp",
        opis: '"Dla Temerii zrobiłbym wszystko. Ale\ngłównie zabijam".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/yarpen_zigrin.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/123.webp",
        opis: '"Nie pozjadałem wszystkich rozumów.\nRobie to, co uważam za dobre".',
        bohater: false,
        frakcja: "1",
        punkty: 2,
        pozycja: 1,
        ilosc: 1,
        numer: "123"
    },

    {
        nazwa: "Talar",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/talar.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/124.webp",
        opis: '"No, to jak kurwa będzie. Robimy/ninteres?"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/biedna_pierdolona_piechota.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/125.webp",
        opis: '"Z werbunku? Dawać papiery! Czego\nkurwa stoisz jeden z drugim? W lewo\nzwrot!"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/redanski_piechur.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/126.webp",
        opis: '"Dla Redanii wszystko. Znaczy, ile żołd\nna czas dostanie"',
        bohater: false,
        frakcja: "1",
        punkty: 1,
        pozycja: 1,
        ilosc: 1,
        numer: "126"
    },

    {
        nazwa: "Redański piechur",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/redanski_piechur2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/127.webp",
        opis: '"Dla Redanii wszystko. Znaczy, ile żołd\nna czas dostanie"',
        bohater: false,
        frakcja: "1",
        punkty: 1,
        pozycja: 1,
        ilosc: 1,
        numer: "127"
    },

    {
        nazwa: "Mistrz Oblężeń z Kaedwen",
        karta: "/tryby/klasyczny_gwint/assets/karty/polnoc/mistrz_oblezen_z_kaedwen.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/2/128.webp",
        opis: '"Przekalibrujcie kąt ramienia o pięć\nstopni!"\n"Przeka-,  kurwa, -co?"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/letho_z_gulety.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/201.webp",
        opis: '"Czekam na tych, którzy chcą mnie zabić".',
        bohater: true,
        frakcja: "2",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "201"
    },

    {
        nazwa: "Menno Coehoorn",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/menno_coehoorn.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/202.webp",
        opis: '"Albo wrócę z rekonesansu z\ninformacją o formacji wroga - albo was\npowieszą".',
        bohater: true,
        moc: "medyk",
        frakcja: "2",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "202"
    },

    {
        nazwa: "Morvran Voorhis",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/morvran_voorhis.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/203.webp",
        opis: '"A ty kto? też jakiś balwierz?"\n"Nie Morvran Voorhis. Dowódca dywizji\nAlba".',
        bohater: true,
        frakcja: "2",
        punkty: 10,
        pozycja: 3,
        ilosc: 1,
        numer: "203"
    },

    {
        nazwa: "Tibor Eggebracht",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/tibor_eggebracht.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/204.webp",
        opis: '"Naprzód, Alba! Niech żyje cesarz!"',
        bohater: true,
        frakcja: "2",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "204"
    },

    {
        nazwa: "Nilfgaardzki łucznik",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/error.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/205.webp",
        opis: '"Zawsze celuję w kolano".',
        bohater: false,
        frakcja: "2",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "205"
    },

    {
        nazwa: "Nilfgaardzki łucznik",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/nilfgaardzki-lucznik.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/206.webp",
        opis: '"Zawsze celuję w kolano".',
        bohater: false,
        frakcja: "2",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "206"
    },

    {
        nazwa: "Wielki Ognisty Skorpion",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/wielki_ognisty_skorpion.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/207.webp",
        opis: '"W Zerrikanii wszystko jest takie\nwielkie?"',
        bohater: false,
        frakcja: "2",
        punkty: 10,
        pozycja: 3,
        ilosc: 1,
        numer: "207"
    },

    {
        nazwa: "Stefan Skellen",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/stefan_skellen.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/208.webp",
        opis: '"Blizna na twarzy przyszłej cesarzowej\nstanowi moje największe osiągnięcie".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/shilard_fitz-oesterlen.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/209.webp",
        opis: '"Wojna to tylko krew i wrzaski. Bieg\nhistorii wytycza  dyplomacja".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/assire_var_anachid.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/210.webp",
        opis: '"Nilfgaardzcy czarodzieje maja do wyboru\nserwilizm - lub szafot".',
        bohater: false,
        frakcja: "2",
        punkty: 6,
        pozycja: 2,
        ilosc: 1,
        numer: "210"
    },

    {
        nazwa: "Fringilla Vigo",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/fringilla_vigo.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/211.webp",
        opis: '"Ach, miło rzucić wreszcie jakieś\nzaklęcie..."',
        bohater: false,
        frakcja: "2",
        punkty: 6,
        pozycja: 2,
        ilosc: 1,
        numer: "211"
    },

    {
        nazwa: "Cahir Mawr Dyffryn aep Ceallach",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/cahir_mawr_dyffryn_aep_ceallach.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/212.webp",
        opis: '"Poszukiwany za dezercję, Raptus Puellae,\nkradzieży i fałszowanie dokumentów".',
        bohater: false,
        frakcja: "2",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "212"
    },

    {
        nazwa: "Saper",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/saper.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/213.webp",
        opis: '"W odpowiednich rękach poziomica może\nbyć zabójczą bronią".',
        bohater: false,
        frakcja: "2",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "213"
    },

    {
        nazwa: "Renuald aep Matsen",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/renuald_aep_matsen.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/214.webp",
        opis: '"Żołnierze brygady impera nie boją sie\nniczego... Z wyjątkiem Renualda aep\nMatsena".',
        bohater: false,
        frakcja: "2",
        punkty: 5,
        pozycja: 2,
        ilosc: 1,
        numer: "214"
    },

    {
        nazwa: "Zerrikański Ognisty Skorpion",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/zerrikanski_ognisty_skorpion.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/215.webp",
        opis: '"Zerrikania słynie z swoich skorpionów".',
        bohater: false,
        frakcja: "2",
        punkty: 5,
        pozycja: 3,
        ilosc: 1,
        numer: "215"
    },

    {
        nazwa: "Młody emisariusz",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/mlody_emisariusz.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/216.webp",
        opis: '"Szpieg to trochę zbyt dużo powiedziane.\nJestem raczej obserwatorem".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/mlody_emisariusz2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/217.webp",
        opis: '"Szpieg to trochę zbyt dużo powiedziane.\nJestem raczej obserwatorem".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/cynthia.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/218.webp",
        opis: '"Talent Cynthii jest olbrzymi. Trzeba jej\nkrótszej smyczy".',
        bohater: false,
        frakcja: "2",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "218"
    },

    {
        nazwa: "Rainfarn",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/rainfarn.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/219.webp",
        opis: '"Ten Rainfarn... On sie kiedyś uśmiecha?"\n"Mhm. Jak kogoś zabije".',
        bohater: false,
        frakcja: "2",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "219"
    },

    {
        nazwa: "Vanhemar",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/vanhemar.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/220.webp",
        opis: '"Lubie bawić się ogniem. Zwłaszcza z\nNordlingami".',
        bohater: false,
        frakcja: "2",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "220"
    },

    {
        nazwa: "Vattier de Rideaux",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/vattier_de_rideaux.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/221.webp",
        opis: '"Nie ma problemu, którego nie da sie\nrozwiązać skrytobójstwem".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/mortiesen.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/222.webp",
        opis: '"Wiesz co jest największą bronią\nNilfgaardu? Dyscyplina".',
        bohater: false,
        frakcja: "2",
        punkty: 3,
        pozycja: 1,
        ilosc: 1,
        numer: "222"
    },

    {
        nazwa: "Zdezelowana mangonela",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/zdezelowana_mangonela.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/223.webp",
        opis: '"To badziewie jeszcze działa?!"\n"Zależy, co przez to rozumiesz..."',
        bohater: false,
        frakcja: "2",
        punkty: 3,
        pozycja: 3,
        ilosc: 1,
        numer: "223"
    },

    {
        nazwa: "Puttkammer",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/puttkammer.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/224.webp",
        opis: "Zatruć studnie? Ależ... To by było\nniehonorowe!",
        bohater: false,
        frakcja: "2",
        punkty: 3,
        pozycja: 2,
        ilosc: 1,
        numer: "224"
    },

    {
        nazwa: "Brygada Impera",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/brygada_impera.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/225.webp",
        opis: '"Brygada Impera nigdy sie nie poddaje.\nNigdy".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/albrich.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/226.webp",
        opis: '"Kula ognia? Oczywiscie. Co tylko Wasza\nCesarska Mość sobie życzy".',
        bohater: false,
        frakcja: "2",
        punkty: 2,
        pozycja: 3,
        ilosc: 1,
        numer: "226"
    },

    {
        nazwa: "Sweers",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/sweers.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/227.webp",
        opis: '"Jazda do roboty, chamy!"',
        bohater: false,
        frakcja: "2",
        punkty: 2,
        pozycja: 2,
        ilosc: 1,
        numer: "227"
    },

    {
        nazwa: "Vreemde",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/vreemde.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/228.webp",
        opis: '"Vreemde znany był z nieugiętego\ncharakteru. I okrucieństwa".',
        bohater: false,
        frakcja: "2",
        punkty: 2,
        pozycja: 1,
        ilosc: 1,
        numer: "228"
    },

    {
        nazwa: "Kawaleria Nauzicaa",
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/kawaleria_nauzicaa.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/229.webp",
        opis: '"Vreemde znany był z nieugiętego charakteru. I okrucieństwa"\n"Nie to brygada kawalerii Nausica".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/wsparcie_lucznikow2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/230.webp",
        opis: '"Szkolenie? Proszę bardzo. Strzelasz\nostrym do przodu".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/wsparcie_lucznikow.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/231.webp",
        opis: '"Szkolenie? Proszę bardzo. Strzelasz\nostrym do przodu".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/nilftgard/wsparcie_obleznicze.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/3/232.webp",
        opis: '"Nigdy nie chybiam dwa razy z rzędu."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/eithne.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/301.webp",
        opis: '"Bądź pozdrowienia, Srebrników Eithné,\nPani Brokilonu!"',
        bohater: true,
        frakcja: "3",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "301"
    },

    {
        nazwa: "Saesenthessis",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/saesenthessis.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/302.webp",
        opis: '"Wielu z nas nie zobaczy jutrzenki. A my\nbędziemy pielęgnować ich groby".',
        bohater: true,
        frakcja: "3",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "302"
    },

    {
        nazwa: "Isengrim Faoiltiarna",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/isengrim_faoiltiarna.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/303.webp",
        opis: '"Jak mało który ludziom za skórę zalazł.\nWieklka cena jest za jego głowę".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/iorwet.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/304.webp",
        opis: '"Kurewsko celny jak na faceta z jednym\nokiem".',
        bohater: true,
        frakcja: "3",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "304"
    },

    {
        nazwa: "Milva",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/milva.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/milwa.webp",
        opis: '"Jestem głupia, prosta dziewczyna ze wsi.\nAle z łuku strzelam, jak nikt".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/schirru.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/306.webp",
        opis: '"Miecze na podłogę. Inaczej poszerzę tej dziewce uśmiech".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/dennis_cranmer.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/307.webp",
        opis: '"Wiem, jak wykonywać rozkazy, obejdę\nsię bez pouczeń".',
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "307"
    },

    {
        nazwa: "Ida Emean aep Sivney",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/ida_emean_aep_sivney.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/308.webp",
        opis: '"Ida Emean aep Sivney. Jak zwyczaju".',
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 2,
        ilosc: 1,
        numer: "308"
    },

    {
        nazwa: "Filavandrel aén Fidháil",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/filavandrel_aen_fidhail.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/309.webp",
        opis: '"Jestem Filavandrel aén Fidháil ze\nSrebnych Wież, z rodu Feleaornów z Białych Okrętów".',
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "309"
    },

    {
        nazwa: "Yaevinn",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/yaevinn.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/310.webp",
        opis: '"Znam ludzi na wylot - jesteście równie\nskomplikowani jak konstrukcja cepa".',
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "310"
    },

    {
        nazwa: "Barcayl Els",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/barclay_els.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/311.webp",
        opis: '"Ze śpiewem na ustach! Ale gromko, żeby\ntamci ze strachu se plusy obsługi!"',
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "311"
    },

    {
        nazwa: "Zwiadowca z Dol Blathanna",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/zwiadowca_z_dol_blathanna3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/312.webp",
        opis: '"Nosy mają jak psy gończe. Oczy jak\nsokoły. A serca z lodu".',
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "312"
    },

    {
        nazwa: "Zwiadowca z Dol Blathanna",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/zwiadowca_z_dol_blathanna.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/313.webp",
        opis: '"Nosy mają jak psy gończe. Oczy jak\nsokoły. A serca z lodu".',
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "313"
    },

    {
        nazwa: "Zwiadowca z Dol Blathanna",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/zwiadowca_z_dol_blathanna2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/314.webp",
        opis: '"Nosy mają jak psy gończe. Oczy jak\nsokoły. A serca z lodu".',
        bohater: false,
        frakcja: "3",
        punkty: 6,
        pozycja: 4,
        ilosc: 1,
        numer: "314"
    },

    {
        nazwa: "Hevekarskie wsparcie",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/havekarskie_wsparcie3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/315.webp",
        opis: '"Walczę dla tych, którzy więcej zapłacą.\nAlbo tych, których łatwiej okraść".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        summon: "316, 317",
        ilosc: 1,
        numer: "315"
    },

    {
        nazwa: "Hevekarskie wsparcie",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/havekarskie_wsparcie.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/316.webp",
        opis: '"Walczę dla tych, którzy więcej zapłacą.\nAlbo tych, których łatwiej okraść".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        summon: "315, 317",
        ilosc: 1,
        numer: "316"
    },

    {
        nazwa: "Hevekarskie wsparcie",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/havekarskie_wsparcie2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/317.webp",
        opis: '"Walczę dla tych, którzy więcej zapłacą.\nAlbo tych, których łatwiej okraść".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        summon: "315, 316",
        ilosc: 1,
        numer: "317"
    },

    {
        nazwa: "Bryada Vrihedd",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/brygada_vrihedd2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/318.webp",
        opis: '"Jak przetłumaczyć słowo Vrihedd? Nie\nwiem. Ale oznacza kłopoty".',
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 4,
        ilosc: 1,
        numer: "318"
    },

    {
        nazwa: "Bryada Vrihedd",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/brygada_vrihedd.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/319.webp",
        opis: '"Jak przetłumaczyć słowo Vrihedd? Nie\nwiem. Ale oznacza kłopoty".',
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 4,
        ilosc: 1,
        numer: "319"
    },

    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/obronca_mahakamu.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/320.webp",
        opis: '"Walka z krasnoludami z Mahakamu... To\njakby żużel żuć".',
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "320"
    },

    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/obronca_mahakamu2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/321.webp",
        opis: '"Walka z krasnoludami z Mahakamu... To\njakby żużel żuć".',
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "321"
    },

    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/obronca_mahakamu3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/322.webp",
        opis: '"Walka z krasnoludami z Mahakamu... To\njakby żużel żuć".',
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "322"
    },

    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/obronca_mahakamu5.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/323.webp",
        opis: '"Walka z krasnoludami z Mahakamu... To\njakby żużel żuć".',
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "323"
    },

    {
        nazwa: "Obrońcy Mahakamu",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/obronca_mahakamu4.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/324.webp",
        opis: '"Walka z krasnoludami z Mahakamu... To\njakby żużel żuć".',
        bohater: false,
        frakcja: "3",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "324"
    },

    {
        nazwa: "Kadet Vrihedd",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/kadet_vrihedd.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/325.webp",
        opis: '"Zamordowałeś jeńców, chodź nie dostałeś\ntakiego rozkazu... Dobra robota".',
        bohater: false,
        frakcja: "3",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "325"
    },

    {
        nazwa: "Łucznik z Dol Blathanna",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/lucznik_z_blathanna.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/326.webp",
        opis: `"Jeszcze krok, dh'oine, a spakuje ci\nstrzałe między oczy".`,
        bohater: false,
        frakcja: "3",
        punkty: 4,
        pozycja: 2,
        ilosc: 1,
        numer: "326"
    },

    {
        nazwa: "Ciran aep Easnillien",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/ciaran_aep_easnillien.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/327.webp",
        opis: `"Bloede dh'oine!"`,
        bohater: false,
        frakcja: "3",
        punkty: 3,
        pozycja: 4,
        ilosc: 1,
        numer: "327"
    },

    {
        nazwa: "Krasnolud Harcownik",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/krasnolud_harcownik3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/328.webp",
        opis: '"Całe życie robiłem z kilofem, to i z\nmieczem sobie poradzę".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 3,
        pozycja: 1,
        summon: "329, 330",
        ilosc: 1,
        numer: "328"
    },

    {
        nazwa: "Krasnolud Harcownik",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/krasnolud_harcownik2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/329.webp",
        opis: '"Całe życie robiłem z kilofem, to i z\nmieczem sobie poradzę".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 3,
        pozycja: 1,
        summon: "328, 330",
        ilosc: 1,
        numer: "329"
    },

    {
        nazwa: "Krasnolud Harcownik",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/krasnolud_harcownik.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/330.webp",
        opis: '"Całe życie robiłem z kilofem, to i z\nmieczem sobie poradzę".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 3,
        pozycja: 1,
        summon: "328, 329",
        ilosc: 1,
        numer: "330"
    },

    {
        nazwa: "Toruviel",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/toruviel.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/331.webp",
        opis: '"Chętnie pchnęłabym cie z bliska,\npatrząc w oczy. Ale śmierdzisz, człowieku".',
        bohater: false,
        frakcja: "3",
        punkty: 2,
        pozycja: 2,
        ilosc: 1,
        numer: "331"
    },

    {
        nazwa: "Elfi harcownik",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/elfi_harcownik.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/332.webp",
        opis: '"Skończy już tańcować, długouchu jebany,\nbo trafić nie mogę!"',
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 2,
        pozycja: 2,
        summon: "333, 334",
        ilosc: 1,
        numer: "332"
    },

    {
        nazwa: "Elfi harcownik",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/elfi_harcownik3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/333.webp",
        opis: '"Skończy już tańcować, długouchu jebany,\nbo trafić nie mogę!"',
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 2,
        pozycja: 2,
        summon: "332, 334",
        ilosc: 1,
        numer: "333"
    },

    {
        nazwa: "Elfi harcownik",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/elfi_harcownik2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/334.webp",
        opis: '"Skończy już tańcować, długouchu jebany,\nbo trafić nie mogę!"',
        bohater: false,
        moc: "wezwanie",
        frakcja: "3",
        punkty: 2,
        pozycja: 2,
        summon: "332, 333",
        ilosc: 1,
        numer: "334"
    },

    {
        nazwa: "Riordain",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/riordain.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/335.webp",
        opis: '"Jeśli wpadnie na oddział Riordaina,\npoderżnij sobie od razu gardło. On\ntorturuje. Długo".',
        bohater: false,
        frakcja: "3",
        punkty: 0,
        pozycja: 2,
        ilosc: 1,
        numer: "335"
    },

    {
        nazwa: "Havekarski medyk",
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/havekarski_medyk3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/336.webp",
        opis: '"Opatrzę was, opatrzę. Ale za\nodpowidnią opłatą".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/havekarski_medyk2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/337.webp",
        opis: '"Opatrzę was, opatrzę. Ale za\nodpowidnią opłatą".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/scio'tel/havekarski_medyk.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/5/338.webp",
        opis: '"Opatrzę was, opatrzę. Ale za\nodpowidnią opłatą".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/draug.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/401.webp",
        opis: '"Generał nie pogodził się z przegraną.\nZginą, ale walczył dalej".',
        bohater: true,
        frakcja: "4",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "401"
    },

    {
        nazwa: "Imlerith",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/imlerith.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/402.webp",
        opis: '"Imlerith...? Lepiej od razu sie poddajmy".',
        bohater: true,
        frakcja: "4",
        punkty: 10,
        pozycja: 1,
        ilosc: 1,
        numer: "402"
    },

    {
        nazwa: "Leszy",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/leszy.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/403.webp",
        opis: '"W tym lesie sie nie poluje. Nigdy. Choćby\nwieś umierała z głodu".',
        bohater: true,
        frakcja: "4",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "403"
    },

    {
        nazwa: "Kejran",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/kejran.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/404.webp",
        opis: '"Ten pień tam, z lewej... On sie rusza!"\n"To nie pień. To macka".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/krolewicz_ropuch.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/405.webp",
        opis: '"Czy pocałunek go odczaruje? Nie wiem,\nnikt nie próbował".',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/zywiolak_ziemi.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/406.webp",
        opis: '"Jak przeżyć spotkanie z żywiołakiem\nziemi? Proste. Uciekać, ile sił w nogach".',
        bohater: false,
        frakcja: "4",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "406"
    },

    {
        nazwa: "Bies",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/bies.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/407.webp",
        opis: '"Bies wygląda trochę jak jeleń. Wielki,\nwkurwiony jeleń".',
        bohater: false,
        frakcja: "4",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "407"
    },

    {
        nazwa: "Żywiołak ognia",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/zywiolak_ognia.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/408.webp",
        opis: '"No, teraz to się zrobi gorąco".',
        bohater: false,
        frakcja: "4",
        punkty: 6,
        pozycja: 3,
        ilosc: 1,
        numer: "408"
    },

    {
        nazwa: "Olbrzymi krabopająk",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/olbrzymi_krabopajak.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/409.webp",
        opis: '"To... To się rusza!"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wiedzma_kuchta.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/410.webp",
        opis: '"Wiem, co mówię. W tej zupie pływają\noczy! Nie oka!"',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 6,
        pozycja: 1,
        summon: "411, 412",
        ilosc: 1,
        numer: "410"
    },

    {
        nazwa: "Wiedzma: Prządka",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wiedzma_przadka.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/411.webp",
        opis: '"Czuję twój ból, widzę twój starch".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 6,
        pozycja: 1,
        summon: "410, 412",
        ilosc: 1,
        numer: "411"
    },

    {
        nazwa: "Wiedzma: Szepciucha",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wiedzma_szepciucha.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/412.webp",
        opis: '"Hi hi hi hi hi hi hi!"',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 6,
        pozycja: 1,
        summon: "410, 411",
        ilosc: 1,
        numer: "412"
    },

    {
        nazwa: "Widłogon",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/widlogon.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/413.webp",
        opis: '"Widłogon... Dobre sobie. Raczej, kurwa,\nmieczogon!".',
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "413"
    },

    {
        nazwa: "Morowa dziewica",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/morowa_dziewica.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/414.webp",
        opis: '"Chorzy majaczyli o pokrytej liszajami\nkobiecie otoczonej przez oszalałe\nszczury..."',
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "414"
    },

    {
        nazwa: "Gryf",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/gryf.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/415.webp",
        opis: '"Gryfy lubią pomęczyć. Jeść żywcem po kawałku".',
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "415"
    },

    {
        nazwa: "Wilkołak",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wilkolak.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/416.webp",
        opis: '"Nie taki wilk straszny, jak go malują. Za to wilkołak jak najbardziej".',
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "416"
    },

    {
        nazwa: "Przeraza",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/przeraza.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/417.webp",
        opis: '"Skąd ta nazwa? Poczekaj, aż ją zobaczysz".',
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        ilosc: 1,
        numer: "417"
    },

    {
        nazwa: "Lodowy Gigant",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/lodowt_gigant.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/418.webp",
        opis: '"Uciekłem w życiu jeden raz. Przed\nlodowym gigantem. I nawet się tego nie\nwstydzę..."',
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 3,
        ilosc: 1,
        numer: "418"
    },

    {
        nazwa: "Baba cmentarna",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/baba_cmentarna.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/419.webp",
        opis: '"Uważaj... Leziesz po trupach. Smacznych trupach.... Hi, hi".',
        bohater: false,
        frakcja: "4",
        punkty: 5,
        pozycja: 2,
        ilosc: 1,
        numer: "419"
    },

    {
        nazwa: "Wampir: Katakan",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wampir_katakan.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/420.webp",
        opis: '"Melitele, Matko, uchroń nas ode złego\nnade wszystko zaś od szponów\nkatakana".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 5,
        pozycja: 1,
        summon: "425, 426, 427, 428",
        ilosc: 1,
        numer: "420"
    },

    {
        nazwa: "Poroniec",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/poroniec.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/421.webp",
        opis: '"Mogiła jest rozkopana... Znaczy, poroniec\nwyszedł na żer".',
        bohater: false,
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "421"
    },

    {
        nazwa: "Krabopająk",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/krabopajak3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/422.webp",
        opis: '"Pół krab, pół pająk. Słowem, skurwysyn".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "423, 424",
        ilosc: 1,
        numer: "422"
    },

    {
        nazwa: "Krabopająk",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/krabopajak2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/423.webp",
        opis: '"Pół krab, pół pająk. Słowem, skurwysyn".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "422, 424",
        ilosc: 1,
        numer: "423"
    },

    {
        nazwa: "Krabopająk",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/krabopajak1.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/424.webp",
        opis: '"Pół krab, pół pająk. Słowem, skurwysyn".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "422, 423",
        ilosc: 1,
        numer: "424"
    },

    {
        nazwa: "Wampir: Ekimma",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wampir_ekimma.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/425.webp",
        opis: '"Ekimma to taki jakby nietiperz... Tyle, że wielkości człowieka".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "420, 426, 427, 428",
        ilosc: 1,
        numer: "425"
    },

    {
        nazwa: "Wampir: Fleder",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wampir_fleader.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/426.webp",
        opis: '"Łysa głowa, szpiczaste uszy, skóra\npokryta brodawkami... Przystojniaczek."',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "420, 425, 427, 428",
        ilosc: 1,
        numer: "426"
    },

    {
        nazwa: "Wampir: Garkain",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wampir_garkain.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/427.webp",
        opis: '"Nic nie chroni przed garkainem. Ani\nświęte znak, ani czosnek, ani osinowy\nkołek',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "420, 425, 426, 428",
        ilosc: 1,
        numer: "427"
    },

    {
        nazwa: "Wampir: Bruxa",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wampir_bruxa.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/428.webp",
        opis: '"Spod burzy splątanych włosów\nbłyszczały ogromne oczy koloru\nantracytów..."',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        summon: "420, 425, 426, 427",
        ilosc: 1,
        numer: "428"
    },

    {
        nazwa: "Endriaga",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/endriaga.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/429.webp",
        opis: '"Do lasu lepiej teraz nie zachodzić.\nEndriagi się wyroiły."',
        bohater: false,
        frakcja: "4",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "429"
    },

    {
        nazwa: "Harpia",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/harpia.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/430.webp",
        opis: '"Schowajcie te błyskotki, pani. Bo jeszcze\nharpie się zlecą".',
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 4,
        ilosc: 1,
        numer: "430"
    },

    {
        nazwa: "Kuroliszek",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/kuroliszek.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/431.webp",
        opis: '"Mierzy bezbłędnie między kręgi lub w\naortę. Jeden cios i jesteś martwy".',
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 2,
        ilosc: 1,
        numer: "431"
    },

    {
        nazwa: "Gargulec",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/gargulec.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/432.webp",
        opis: '"Mnie się zdaje, czy ten rzygacz wodzi za\nnami wzrokiem?"',
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 2,
        ilosc: 1,
        numer: "432"
    },

    {
        nazwa: "Harpia Celaeno",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/harpia_celaeno.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/433.webp",
        opis: '"Zwykle harpie żywią się padliną. A\nCelaeno - snami".',
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 4,
        ilosc: 1,
        numer: "433"
    },

    {
        nazwa: "Mglak",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/mglak.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/434.webp",
        opis: '"Jak widzisz światło we mgle, zawracaj.\nNatychmiast".',
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 1,
        ilosc: 1,
        numer: "434"
    },

    {
        nazwa: "Wiwerna",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/wiwerna.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/435.webp",
        opis: '"To było coś, co żyło tylko po to, by zabijać"',
        bohater: false,
        frakcja: "4",
        punkty: 2,
        pozycja: 2,
        ilosc: 1,
        numer: "435"
    },


    {
        nazwa: "Nekker",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/nekker3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/436.webp",
        opis: '"Małe, szybkie i wredne".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 2,
        pozycja: 1,
        summon: "437, 438",
        ilosc: 1,
        numer: "436"
    },

    {
        nazwa: "Nekker",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/nekker2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/437.webp",
        opis: '"Małe, szybkie i wredne".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 2,
        pozycja: 1,
        summon: "436, 438",
        ilosc: 1,
        numer: "437"
    },

    {
        nazwa: "Nekker",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/nekker1.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/438.webp",
        opis: '"Małe, szybkie i wredne".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 2,
        pozycja: 1,
        summon: "436, 437",
        ilosc: 1,
        numer: "438"
    },

    {
        nazwa: "Ghul",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/ghul3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/439.webp",
        opis: '"Chodzą ghule koło drogi, zeżrą ręce,\nzeżrą nogi".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 1,
        pozycja: 1,
        summon: "440, 441",
        ilosc: 1,
        numer: "439"
    },

    {
        nazwa: "Ghul",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/ghul2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/440.webp",
        opis: '"Chodzą ghule koło drogi, zeżrą ręce,\nzeżrą nogi".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 1,
        pozycja: 1,
        summon: "439, 441",
        ilosc: 1,
        numer: "440"
    },

    {
        nazwa: "Ghul",
        karta: "/tryby/klasyczny_gwint/assets/karty/potwory/ghul1.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/4/441.webp",
        opis: '"Chodzą ghule koło drogi, zeżrą ręce,\nzeżrą nogi".',
        bohater: false,
        moc: "wezwanie",
        frakcja: "4",
        punkty: 1,
        pozycja: 1,
        summon: "439, 440",
        ilosc: 1,
        numer: "441"
    },

    //skellige ==============================================
    //skellige ==============================================
    //skellige ==============================================

    {
        nazwa: "Olaf",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/olaf.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/501.webp",
        opis: '"Wielu próbowało pokonać Olafa. Nie\nopowiedzą ci o tym, bo nie żyją"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/hjalmar.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/502.webp",
        opis: '"Zamiast użalać się nad poległymi, lepiej\nwypijmy za ich pamięć!"',
        bohater: true,
        frakcja: "5",
        punkty: 10,
        pozycja: 2,
        ilosc: 1,
        numer: "502"
    },

    {
        nazwa: "Cerys",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/cerys.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/503.webp",
        opis: "Chodź, już ja ci pokaże Przepióreczkę...",
        bohater: true,
        moc: "wezwanie",
        frakcja: "5",
        punkty: 10,
        pozycja: 1,
        summon: "519, 520, 521",
        ilosc: 1,
        numer: "503"
    },

    {
        nazwa: "Myszowór",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/myszowór.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/504.webp",
        opis: '"Tylko ignoranci bagatelizują znaczenie\nmitów."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/lugos_szalony.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/505.webp",
        opis: '"WAAAAAAAAAAGH!!!!"',
        bohater: false,
        frakcja: "5",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "505"
    },

    {
        nazwa: "Lugos Siny",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/lugos_siny.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/506.webp",
        opis: '"Zaraz porzygam się z nudów."',
        bohater: false,
        frakcja: "5",
        punkty: 6,
        pozycja: 1,
        ilosc: 1,
        numer: "506"
    },

    {
        nazwa: "Wojownik klanu Craite",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/wojownik_klanu_craite.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/507.webp",
        opis: '"Przyniosę klanowi Craite chwale, a moje\nimię będą sławić w pieśniach!"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/drakkar_wojenny.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/508.webp",
        opis: '"Mówi się, że kiedy drakkary wypływają\nna rejzę, serce Hemdalla rośnie."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/lucznik_klanu_brokvar.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/509.webp",
        opis: '"Trafisz w pędzący cel z 200 kroków?\nJa też. W czasie sztormu."',
        bohater: false,
        frakcja: "5",
        punkty: 6,
        pozycja: 5,
        ilosc: 3,
        numer: "509"
    },

    {
        nazwa: "Purat klanu Dimun",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/pirat_z_klanu_dimun.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/510.webp",
        opis: '"W ich oczach widzę starch. Boją sie... Za mną! Za klan Dimun!"',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/holger_czarna_reka.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/511.webp",
        opis: '"A teraz wypijemy za to, żeby cesarzowi\nnilfgaardu kutas nigdy więcej nie stanął!"',
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 3,
        ilosc: 1,
        numer: "511"
    },

    {
        nazwa: "Donar an Hindar",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/donar_an_hindar.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/512.webp",
        opis: '"Zwołałem rade jarlów na twoje żądanie.\nPrzedstaw swoje racje."',
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "512"
    },

    {
        nazwa: "Udarlyk",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/udarlyk.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/513.webp",
        opis: '"Haaaa! Za mną, kto odważny!"',
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "513"
    },

    {
        nazwa: "Svanrige",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/svanrige.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/514.webp",
        opis: '"Cesarz też miał go za króla z przypadku.\nDo czasu."',
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "514"
    },

    {
        nazwa: "Berserker",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/berserk.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/515.webp",
        opis: '"Zabić, zadeptać, rozerwać!"',
        bohater: false,
        moc: "berserk",
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        summon: "527",
        ilosc: 1,
        numer: "515"
    },

    {
        nazwa: "Płatnerz klanu Torrdaroch",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/platnerz_klanu_tordarroch.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/516.webp",
        opis: '"Wyklepie sie."',
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "516"
    },

    {
        nazwa: "Sklad klanu Heymaey",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/skald_klanu_heymaey.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/517.webp",
        opis: '"Czyny wojowników klanów Heymeay\nprzejdą do wieczności."',
        bohater: false,
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "517"
    },

    {
        nazwa: "Lekki Drakkar",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/lekki_drakkar.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/518.webp",
        opis: '"Uciec im? Na wodach skellige?\nPowodzenia."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/tarczowniczka_klanu_drummond1.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/519.webp",
        opis: '"Rozbiją się o tarcze jak moze o\nbrzeg."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/tarczowniczka_klanu_drummond2.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/520.webp",
        opis: '"Rozbiją się o tarcze jak moze o\nbrzeg."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/tarczowniczka_klanu_drummond3.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/521.webp",
        opis: '"Rozbiją się o tarcze jak moze o\nbrzeg."',
        bohater: false,
        moc: "wiez",
        frakcja: "5",
        punkty: 4,
        pozycja: 1,
        ilosc: 1,
        numer: "521"
    },

    {
        nazwa: "Draig Bon-Dhu",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/draig_bon_dhu.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/522.webp",
        opis: '"Posłuchaj sagi o bohaterskich czynach\nwojowników Craite."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/birna_bran.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/523.webp",
        opis: '"Skellige potrzebuje silnego króla Bez\nwzględu na konsekwencje."',
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
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/mlody_berserker.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/524.webp",
        opis: '"Wperdol?"',
        bohater: false,
        moc: "berserk",
        frakcja: "5",
        punkty: 2,
        pozycja: 2,
        summon: "528",
        ilosc: 3,
        numer: "524"
    },

    {
        nazwa: "Kambi",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/kambi.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/525.webp",
        opis: '"Kiedy przyjdzie czas Kambi zapieje i\nostrzeże Hemdalla."',
        bohater: false,
        moc: "wezwarniezza",
        frakcja: "5",
        punkty: 0,
        pozycja: 1,
        summon: "526",
        ilosc: 1,
        numer: "525"
    },

    //inne===============================================================================================================================================================

    {
        nazwa: "Hemdal",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/hemdal.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/hemdal.webp",
        opis: '"Kiedy nadejdzie Czas Białego Mrozu\nHemdall wezwie nas do walki."',
        bohater: true,
        punkty: 11,
        pozycja: 1,
        numer: "526"
    },

    {
        nazwa: "Przemieniony Vildkaarl",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/kambi.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/berserk.webp",
        opis: "Raz w życiu widziałem jak walczą... I\nwięcej nie chce.",
        bohater: false,
        moc: "morale",
        punkty: 14,
        pozycja: 1,
        numer: "527"
    },

    {
        nazwa: "Przemieniony Młody Vildkaarl",
        karta: "/tryby/klasyczny_gwint/assets/karty/Skellige/kambi.webp",
        dkarta: "/tryby/klasyczny_gwint/assets/dkarty/6/berserk2.webp",
        opis: "Arrrgh!",
        bohater: false,
        moc: "wiez",
        punkty: 8,
        pozycja: 2,
        numer: "528"
    },
];
export default cards;
