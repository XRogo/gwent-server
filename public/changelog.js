//    {
//        version: "9.4", <- Info o danej warsji
//        wath: "1", <- info czego dotyczy update (0 - strona główna, 1 - gwint klasyczny, 2 - mix kart ...) obecnie jest tylko 0/1
//        data: "26.10.2026", <- data
//        zmiany: {  < pokoleji w osobnych liniach osobnych punktach (jakaś kropka czy coś przed tym napisem żeby oddzielić od innych zmian)
//            line1: "", <- poprostu nowa linia
//            line2: {
//                title:"" <- teskt jak noramlnie w nowej lini
//                subtitle1:"" < pod tekst oddalony troszke w nowym wierszu ma wyglądac jak pod kategoria drzewa
//                subtitle2:""
//            }
//            line3: ""
//        },
//        image: "" < link do obrazu z grafiką z discorda
//    }, <- jeśli coś jest usunięte to ignoruj i nie pisz np czego dotyczy (bo najprawdopodobniej wszystkeigo) 
    
const wersja = [
    {
        version0: "3.0",
        version1: "10.7",
        data: ".10.2026",
        zmiany: {
            line1: 'Naprawiłem zagrywanie medyków pod gdy ręka była już pusta',
            line2: 'Naprawiłem błąd przez który automatycznie pasowało runde gdy nie było nic w ręce ale dowódca ciągle był możliwy do zagrania',
            line3: 'Wstępnie wprowadzam podwaliny pod nową wersje lobby',
            line4: 'Bies pojawia się w prawidłowej lini po krowie',
        },
        image: "https://cdn.discordapp.com/attachments/1366510061383450674/1564463348051869696/image.png?ex=6ae15b88&is=6ae00a08&hm=c1443c8fe3a38ca492f51b9adbe2b92324e9ddc5a98868fb590698931de6b06f&animated=true"
    }, 
    {
        version1: "10.6",
        data: "27.10.2026",
        zmiany: {
            line1: "Karty z mocą morale i bohater od teraz poprawnie zwiększają pk innym kartom ",
            line2: 'Dowódca "Król Bran" działa poprawnie i jego opis jest poprawny',
            line3: 'Karta "Pirat klanu Dimun" poprawnie działa i ma poprawną nazwe',
            line4: 'Berserki od teraz poprawnie przemieniają sie w Vildkaarl\'y'
        },
        image: "https://cdn.discordapp.com/attachments/1366510061383450674/1564463348051869696/image.png?ex=6ae15b88&is=6ae00a08&hm=c1443c8fe3a38ca492f51b9adbe2b92324e9ddc5a98868fb590698931de6b06f&animated=true"
    },
    {
        version1: "10.6",
        data: "27.10.2026",
        zmiany: {
            line1: "Karty z mocą morale i bohater od teraz poprawnie zwiększają pk innym kartom ",
            line2: 'Dowódca "Król Bran" działa poprawnie i jego opis jest poprawny',
            line3: 'Karta "Pirat klanu Dimun" poprawnie działa i ma poprawną nazwe',
            line4: 'Berserki od teraz poprawnie przemieniają sie w Vildkaarl\'y'
        },
        image: "https://cdn.discordapp.com/attachments/1366510061383450674/1564463348051869696/image.png?ex=6ae15b88&is=6ae00a08&hm=c1443c8fe3a38ca492f51b9adbe2b92324e9ddc5a98868fb590698931de6b06f&animated=true"
    },
    {
        version1: "10.5",
        data: "01.10.2026",
        zmiany: {
            line1: "Karty na planszy są ułożone w poprawnej kolejności a nie losowo",
            line2: "Effekt mrozu działa wizualnie"
        },
        image: "https://cdn.discordapp.com/attachments/1366510061383450674/1564073472710156481/image.png?ex=6adff06e&is=6ade9eee&hm=210456346b8c938ed732469f4faf34e1b7cf68649468ef33493f72093e4169ed&animated=true"
    },
    {
        version1: "10.4",
        data: "01.10.2026",
        zmiany: {
            line1: {
                title: "Dodałem animacje",
                subtitle1: "Spalania kart przez pożoge",
                subtitle2: "Lądowania podstawowych kart",
                subtitle3: "Wezwania innych kart",
                subtitle4: "Ikony działania mocy (Morale / Więź / Wezwanie / Róg dowódcy / Szpieg)"
            }
        }
    },
    {
        version1: "10.1",
        data: "15.10.2026",
        zmiany: {
            line1: 'Napis "Rozpocznij grę" już nie przeskakuje do nowego wiersza'
        }
    },
    {
        version1: "10.0",
        data: "01.10.2026",
        zmiany: {
            line1: "Zostały dodane alternatywne karty (dlc8) (możliwe do włączenia w menu w prawym dolnym rogu ikonka karty)",
        },
        image: "https://media.discordapp.net/attachments/1366510061383450674/1555039903006593134/image.png?backend=b2&ex=6adf6004&is=6ade0e84&hm=29817935dfaa6f02904a8b4bc911008bc0f3e433c9413e1962e53952585dd81c&animated=true&width=2066&height=1162"
    },
    {
        version1: "9.8.3",
        data: "01.10.2026",
        zmiany: {
            line1: "Naprawiłem zepsute suwaki w wyborze",
        }
    },
    {
        version1: "9.8.2",
        data: "01.10.2026",
        zmiany: {
            line1: "Poprawiłem wyświetlanie opisów kart, mieści się teraz w obszarze i nie powinno wychodzić poza obszar w dół",
            line2: {
                title: "Zostały poprawione opisy kart:",
                subtitle1: 'Vesemira, Geralta, Cień Odima',
                subtitle2: 'Vernon Roche, Philippa Eilhart, Katapulta, Trebusz, Balista, Wieża oblężnicza, Ves, Keira Metz, Książe Penis, Sabrina Glebissig, Talar, Pierdolona Piechota, Redański piechur',
                subtitle3: 'Menno Coehorn, Morvran Voorhos, Assire var Anahid, Cahir, Puttkammer, Kawaleria Nauzicaa',
                subtitle4: 'Eithne, Isengrim, Schirru, Ida Emean aep Sivney, Filavandel aen Fidhail, Barclay Els, Kadet Vrihedd, Łucznik z Dol Blathanna, Toruviel',
                subtitle5: 'Gryf, Wilkołak, Przeraza, Lodowy Gigant, Baba cmentaarna, Krabopająk, Ekimma, Wiwerna',
                subtitle6:'Łucznika klanu Brokvar, Pirat klanu Dimun, Holger Czarna Ręka, Berserk, Płatnerz klanu Torrdaroch, Tarczowniczka klanu Drummond'
            },
            line3: "Pozycja Gauntera została poprawiona"
        }
    },
    {
        version1: "9.8.1",
        data: "01.10.2026",
        zmiany: {
            line1: "Na telefonach / tabletach od teraz da się grać",
            line2: "Dodałem płynne i animowanie zmienianie kart (tych powiększonych)",
            line3: "Od teraz wszystkie ustawienie związane z klikaniem są identycznie 1:1 jak w Widźmine 3"
        }
    },
    {
        version1: "9.8",
        data: "12.09.2026",
        zmiany: {
            line1: 'Od teraz wyjście z trwającej gry przyblokuje komunikat "Czy na pewno chcesz wyjść z gry?" aby uniknąć przypadkowego wyjcia',
            line2: "Dodałem automatycznego passa jak skończą sie karty i umiejętność dowódcy",
            line3: "Suwaki z wersji 9.7.1 nie wyświetlają się już podczas gry",
            line4: "Od teraz poprawnie pokazuje informacje o karcie zagrywanej przez przeciwnika",
            line5: "Karta z Pożogą liniową działa po przywróceniu medykiem",
            line6: "Przypadkowe wyjście ze strony podczas gry i powrót już nie powinien błednie przypisywac ruchu"
        },
        image: "https://media.discordapp.net/attachments/1366510061383450674/1548177143165354034/image.png?ex=6adf7512&is=6ade2392&hm=633e6a5ec20508c32ba012affa3970ad93a88ef10fe1c801e6e495c1790ed30d&animated=true&width=2066&height=1162"
    },
    {
        version1: "9.7.3",
        data: "12.09.2026",
        zmiany: {
            line1: "W wyborze kart od teraz po najechaniu na karte pokazuje poświatę"
        }
    },
    {
        version1: "9.7.2",
        data: "12.09.2026",
        zmiany: {
            line1: "Ułożenie kart w wyborze kart jest teraz 1:1 jak w wiedźminie 3",
            line2: "Dodałem suwak w wyborze kart obok kontenerów z kartami",
            line3: "Scrolowanie przesuwa karty o wysokość jednej karty a nie o przypadkową ilość"
        }
    },
    {
        version1: "9.7.1",
        data: "12.09.2026",
        zmiany: {
            line1: 'Karta "Ghul" ma lepszą jakość',
            line2: 'Karta "Nilfgaardzki łucznik" ma od teraz poprawną grafike',
            line3: "Plik card został wstępnie przygotowany pod obsługę wielu języków"
        }
    },
    {
        version1: "9.7",
        data: "06.09.2026",
        zmiany: {
            line1: "Zagranie karty pokazuje poprawnie swój opis i moc",
            line2: "Dowódca w powiększeniu nie ma już poświaty",
        },
        image: "https://media.discordapp.net/attachments/1366510061383450674/1546000122146725951/image.png?ex=6adf7290&is=6ade2110&hm=d1ee09a904770aa818e3acd343dea2cf11c8326a80850c39d311e2c018dd4d44&animated=true"
    },
    {
        version1: "9.6.1",
        data: "06.09.2026",
        zmiany: {
            line1: "Karty z mocą więź działają poprawnie i nie psują sie w kontakcie z kartami pogodowymi",
            line2: 'Karta "Trebusz" już nie ma graficznego 6pk',
            line3: "Karty z mocą Rogu dowódcy od teraz nie mnożą się przez siebie",
            line4: "Karty z mocą Pożogi liniowej liczą od teraz punkty również z kart bohaterów",
            line5: "Przycisk pełnego ekranu działa podczas powiększenia kart",
            line6: "Powiększenie kart dowódców poprawnie wyświetla opis mocy",
            line7: "Karta dowódcy ma wycentrowaną nazwe"
        }
    },
    {
        version1: "9.6",
        data: "26.10.2026",
        zmiany: {
            line1: "Dodałem funkcje odpowiedzialną za działanie mocy specjalnej frakcji (Nilfgaardu / Potworów / Skellige)",
            line2: "Naprawiłem błąd przez który czasami informacje wyskakiwały podwójnie"
            }
    },
    {
        version1: "9.5.1",
        data: "02.09.2026",
        zmiany: {
            line1: "Naprawiłem niedziałającego Łucznika klanu Brokvar"
        }
    },
    {
        version1: "9.5",
        data: "31.08.2026",
        zmiany: {
            line1: "Poprawiłem teksture dymu w tle wybotu, na taką bezszwową",
            line2: "Dodałem wyswietlanie jej również w osi Z",
        },
        image: "https://cdn.discordapp.com/attachments/1366510061383450674/1543831594102554745/image.png?ex=6adf77f7&is=6ade2677&hm=3b988330323e29f03de4701c175468d574fcc7085c04b283895fb99f1344d25a&animated=true"
    },
    {
        version1: "9.4.1",
        data: "31.08.2026",
        zmiany: {
            line1: "Dodałem napisy o następnych frakcjach w wyborze kart",
            line2: "Dodałem opisy i nazwy obecnych filtrów na kartach",
            line3: "Naprawiłem zepsutą kropkę informującą o stronie"
        }
    },
    {
        version1: "9.4",
        data: "30.08.2026",
        zmiany: {
            line1: "Poprawiłem wielkość napisów informujących o ilości kart itp (widoczne na obrazku)",
            line2: "Poprawiłem pozycje herbu aby była identycznie jak w Wiedźminie 3",
        },
        image: "https://cdn.discordapp.com/attachments/1366510061383450674/1543454298187239614/image.png?ex=6adf6a14&is=6ade1894&hm=d63edc2760f8b0c3a738e0e898b9e938a1dd5883265b617f60b3f17c8cabfa90&animated=true"
    },
    {
        version1: "9.3.5",
        data: "30.08.2026",
        zmiany: {
            line1: 'Poprawiłem wygląd przycisków "Zapisz talię" "Rozpocznij gre" aby wyglądały jak w Wiedźminie 3',
            line2: "Dodałem ładny komunikat o zapisaniu tali i rozpoczęciu gry"
        },
    },
    {
        version1: "9.3.4",
        data: "30.08.2026",
        zmiany: {
            line1: "Dodałem minimalny limit kart w grze",
            line2: "Od teraz jeśli gracz wejdzie do gry z zbyt małą ilością kart jednostek to serwer doda mu losowe karty aby spełnić warunek 22 kart",
        },
    },
    {
        version: "9.3.3",
        data: "30.08.2026",
        zmiany: {
            line1: "Dodałem tokeny do weryfikacji graczy aby lobby było bezpieczniejsze",
        },
    },
    {
        version1: "9.3",
        data: "25.08.2026",
        zmiany: {
            line1: " Został przebudowany system łączenia się między graczami",
            line2: " Naprawiłem błąd przez który karty z zręcznością i braterstwa nie miały opisu",
            line3: " Poprawiłem wyświetlanie nazw i opisów kart"
        },
    },
    {
        version: "9.2.3",
        data: "24.08.2026",
        zmiany: {
            line1: " Od teraz działa wiele lobby (Przynajmniej powinno xD)",
        },
    },
    {
        version1: "9.2",
        data: "23.08.2026",
        zmiany: {
            line1: "W menu można od teraz kliknąć w generuj kod a nie tylko w ikonke",
            line2: "Można od teraz akceptować kod Enterem",
            line3: "Dodałem / Naprawiłem - od teraz poprawnie wyświetlają sie opisy umiętnosci kart"
        },
        image: "https://cdn.discordapp.com/attachments/1366510061383450674/1541182649559941191/image.png?ex=6adfb831&is=6ade66b1&hm=3d8b606454f1d13ec6b617cc8c70ee34f54745aa2cae7eb62d26ffba86bf5214&animated=true"
    },
    {
        version1: "9.1.1",
        data: "18.08.2026",
        zmiany: {
            line1: "Naprawiłem błąd z brakiem informacji o pozycji dla kart z zręcznością",
            line2: "Naprawiłem Lekki drakar, teraz poprawnie przywołuje karty",
            line3: "Naprawiłem karty z mocą więź, od teraz działają poprawnie z kartami o innym numerze",
            line4: "Naprawiłem grafiki końcowe, już nie mają czerwonej lini"
        },
    },
    {
        version1: "9.1",
        data: "16.08.2026",
        zmiany: {
            line1: "Dodałem obsługę kart dowódców, nie mam pewności czy wszystkie działają w różnych sytułacjach",
            line2: "Kilka innych błędów poprawiłem",
            line3: "Pewnie jeszcze więcej dodałem xD"
        },
        image: "https://cdn.discordapp.com/attachments/1366510061383450674/1538323728704864296/image.png?ex=6adfdd9d&is=6ade8c1d&hm=645a775383cf1b154c7764c8236def42e68e839c5870fd8b2952fb04c65d3004&animated=true"
    },
    {
        version0: "2.1",
        data: "14.08.2026",
        zmiany: {
            line1: "Dodałem obsługę języków (angielski i hiszpański) w menu"
        },
        image: "https://cdn.discordapp.com/attachments/1366510061383450674/1537809911428292779/image.png?ex=6adf5096&is=6addff16&hm=600aac4b14600b7fb297fb811afb0ce070a3639804abd3b269638f020ec3ab44&animated=true"
    },
];
