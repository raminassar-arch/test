/* Plik wygenerowany przez sites/build_site.py – nie edytuj ręcznie. */
window.PAB_FIELDS = {
 "app": {
  "name": "PAB cyfrowa",
  "version": "1.5.2",
  "author": "Rami Nassar",
  "year": "2026",
  "company": "BIM architects & consultants",
  "email": "raminassar.arch@gmail.com",
  "credit": "© 2026 Rami Nassar",
  "tagline": "Kompletna dokumentacja do pozwolenia na budowę"
 },
 "groups": {
  "ogolne": [
   {
    "title": "Inwestycja",
    "rows": [
     {
      "key": "nazwa",
      "label": "Nazwa zamierzenia budowlanego",
      "type": "e",
      "arg": 62
     },
     {
      "key": "adres",
      "label": "Adres inwestycji",
      "type": "e",
      "arg": 62
     },
     {
      "key": "dzialki",
      "label": "Numery działek ewidencyjnych",
      "type": "e",
      "arg": 32
     },
     {
      "key": "obreb",
      "label": "Obręb ewidencyjny",
      "type": "e",
      "arg": 32
     },
     {
      "key": "jednostka",
      "label": "Jednostka ewidencyjna",
      "type": "e",
      "arg": 32
     },
     {
      "key": "pow_dzialki",
      "label": "Powierzchnia działki [m²]",
      "type": "e",
      "arg": 14
     }
    ]
   },
   {
    "title": "Inwestor",
    "rows": [
     {
      "key": "inwestor",
      "label": "Inwestor",
      "type": "e",
      "arg": 62
     },
     {
      "key": "inwestor_adres",
      "label": "Adres inwestora",
      "type": "e",
      "arg": 62
     }
    ]
   },
   {
    "title": "Klasyfikacja obiektu",
    "rows": [
     {
      "key": "kategoria",
      "label": "Kategoria obiektu budowlanego",
      "type": "c",
      "arg": [
       "I – budynki mieszkalne jednorodzinne",
       "II – budynki mieszkalne wielorodzinne, budynki zamieszkania zbiorowego",
       "III – budynki hotelowe, administracyjne, biurowe, handlowe, usługowe",
       "IV – budynki oświaty, nauki, kultury, sportu, opieki zdrowotnej",
       "V – budynki przemysłowe, magazynowe, gospodarcze i infrastruktury",
       "Obiekt liniowy / sieć / obiekt inżynieryjny",
       "Inny obiekt budowlany"
      ]
     },
     {
      "key": "rodzaj",
      "label": "Rodzaj obiektu budowlanego",
      "type": "c",
      "arg": [
       "Budynek mieszkalny jednorodzinny",
       "Budynek mieszkalny wielorodzinny",
       "Budynek usługowy / handlowy / biurowy",
       "Budynek przemysłowy / magazynowy",
       "Budynek gospodarczy / garażowy",
       "Obiekt liniowy / sieć uzbrojenia terenu",
       "Obiekt inżynieryjny (drogowy, mostowy, hydrotechniczny)",
       "Inny obiekt budowlany"
      ]
     }
    ]
   },
   {
    "title": "Dokument",
    "rows": [
     {
      "key": "nr_projektu",
      "label": "Nr projektu",
      "type": "e",
      "arg": 20
     },
     {
      "key": "tom",
      "label": "Tom",
      "type": "e",
      "arg": 10
     },
     {
      "key": "data",
      "label": "Data opracowania",
      "type": "e",
      "arg": 14
     },
     {
      "key": "zakres",
      "label": "Zakres opracowania",
      "type": "e",
      "arg": 40
     }
    ]
   },
   {
    "title": "Organ i wnioskodawca",
    "rows": [
     {
      "key": "organ",
      "label": "Organ administracji architektoniczno-budowlanej",
      "type": "e",
      "arg": 45
     },
     {
      "key": "organ_adres",
      "label": "Adres organu",
      "type": "e",
      "arg": 62
     },
     {
      "key": "osoba_wnioskujaca",
      "label": "Wnioskodawca (imię i nazwisko)",
      "type": "e",
      "arg": 45
     },
     {
      "key": "funkcja_wnioskujacego",
      "label": "Funkcja wnioskodawcy",
      "type": "c",
      "arg": [
       "inwestor",
       "pełnomocnik inwestora",
       "użytkownik wieczysty",
       "zarządca nieruchomości"
      ]
     }
    ]
   }
  ],
  "pzt": [
   {
    "title": "Przedmiot i zakres zamierzenia (§ 14 pkt 1)",
    "rows": [
     {
      "key": "przedmiot",
      "label": "Przedmiot zamierzenia budowlanego",
      "type": "t",
      "arg": 4
     },
     {
      "key": "zakres_zamierzenia",
      "label": "Zakres zamierzenia (roboty, obiekty)",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Istniejący stan zagospodarowania (§ 14 pkt 2)",
    "rows": [
     {
      "key": "stan_istniejacy",
      "label": "Opis stanu istniejącego",
      "type": "t",
      "arg": 5
     },
     {
      "key": "rozbiorka",
      "label": "Przewiduje się rozbiórkę obiektów",
      "type": "x",
      "arg": null
     },
     {
      "key": "rozbiorka_opis",
      "label": "Zakres i sposób rozbiórki",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Projektowane zagospodarowanie (§ 14 pkt 3)",
    "rows": [
     {
      "key": "zagospodarowanie",
      "label": "Opis projektowanego zagospodarowania",
      "type": "t",
      "arg": 5
     },
     {
      "key": "urzadzenia_sel",
      "label": "Urządzenia budowlane",
      "type": "l",
      "arg": [
       [
        "przyłącza i sieci uzbrojenia terenu",
        "przyłącza i sieci uzbrojenia terenu"
       ],
       [
        "miejsca postojowe i utwardzenia",
        "miejsca postojowe i utwardzenia"
       ],
       [
        "ogrodzenie i brama wjazdowa",
        "ogrodzenie i brama wjazdowa"
       ],
       [
        "zbiornik bezodpływowy / retencyjny",
        "zbiornik bezodpływowy / retencyjny"
       ],
       [
        "oświetlenie zewnętrzne",
        "oświetlenie zewnętrzne"
       ],
       [
        "inne",
        "inne"
       ]
      ]
     },
     {
      "key": "urzadzenia",
      "label": "Opis urządzeń budowlanych (uzupełniający)",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Ścieki i wody opadowe (§ 14 pkt 3 lit. b)",
    "rows": [
     {
      "key": "scieki",
      "label": "Odprowadzanie ścieków",
      "type": "c",
      "arg": [
       "do sieci kanalizacji sanitarnej",
       "do szczelnego zbiornika bezodpływowego",
       "do przydomowej oczyszczalni ścieków",
       "do instalacji wewnętrznej z odprowadzeniem pośrednim",
       "inne / do uzupełnienia"
      ]
     },
     {
      "key": "scieki_opis",
      "label": "Opis gospodarki ściekowej",
      "type": "t",
      "arg": 3
     },
     {
      "key": "wody_opadowe",
      "label": "Wody opadowe i roztopowe",
      "type": "c",
      "arg": [
       "rozsączenie na terenie działki",
       "odprowadzenie do sieci kanalizacji deszczowej",
       "retencja w zbiorniku i wykorzystanie do nawadniania",
       "odprowadzenie na teren nieutwardzony",
       "inne / do uzupełnienia"
      ]
     },
     {
      "key": "wody_opadowe_opis",
      "label": "Opis zagospodarowania wód opadowych",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Komunikacja (§ 14 pkt 3 lit. c i d)",
    "rows": [
     {
      "key": "dostep_drogi",
      "label": "Sposób dostępu do drogi publicznej",
      "type": "c",
      "arg": [
       "bezpośredni zjazd z drogi publicznej",
       "poprzez istniejący zjazd / bramę",
       "poprzez drogę wewnętrzną",
       "na podstawie ustanowionej służebności drogowej",
       "inne / do uzupełnienia"
      ]
     },
     {
      "key": "dostep_opis",
      "label": "Opis dostępu (zjazd, służebność, parametry)",
      "type": "t",
      "arg": 3
     },
     {
      "key": "komunikacja",
      "label": "Układ komunikacyjny wewnątrz działki",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Uzbrojenie terenu (§ 14 pkt 3 lit. e)",
    "rows": [
     {
      "key": "uzbrojenie_sel",
      "label": "Projektowane / istniejące sieci",
      "type": "l",
      "arg": [
       [
        "woda",
        "sieć wodociągowa"
       ],
       [
        "kanalizacja",
        "sieć kanalizacji sanitarnej"
       ],
       [
        "deszcz",
        "sieć kanalizacji deszczowej"
       ],
       [
        "gaz",
        "sieć gazowa"
       ],
       [
        "energia",
        "sieć elektroenergetyczna"
       ],
       [
        "cieplo",
        "sieć ciepłownicza"
       ],
       [
        "telekom",
        "sieć telekomunikacyjna"
       ]
      ]
     },
     {
      "key": "uzbrojenie_opis",
      "label": "Parametry techniczne sieci i przyłączy",
      "type": "t",
      "arg": 4
     }
    ]
   },
   {
    "title": "Ukształtowanie terenu i zieleń (§ 14 pkt 3 lit. f)",
    "rows": [
     {
      "key": "ksztaltowanie",
      "label": "Ukształtowanie terenu i zmiany",
      "type": "t",
      "arg": 3
     },
     {
      "key": "zielen",
      "label": "Urządzanie zieleni",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Ograniczenia i ochrona zabytków (§ 14 pkt 5)",
    "rows": [
     {
      "key": "ograniczenia",
      "label": "Występują ograniczenia lub zakazy w zabudowie",
      "type": "x",
      "arg": null
     },
     {
      "key": "ograniczenia_opis",
      "label": "Opis ograniczeń",
      "type": "t",
      "arg": 3
     },
     {
      "key": "zabytek",
      "label": "Status konserwatorski działki",
      "type": "c",
      "arg": [
       "nie dotyczy",
       "działka wpisana do rejestru zabytków",
       "działka ujęta w gminnej ewidencji zabytków",
       "obszar objęty ochroną konserwatorską"
      ]
     },
     {
      "key": "zabytek_opis",
      "label": "Zakres ochrony konserwatorskiej",
      "type": "t",
      "arg": 3
     },
     {
      "key": "gorniczy",
      "label": "Teren położony w granicach terenu górniczego",
      "type": "x",
      "arg": null
     },
     {
      "key": "gorniczy_opis",
      "label": "Wpływ eksploatacji górniczej",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Środowisko (§ 14 pkt 5 lit. d)",
    "rows": [
     {
      "key": "srodowisko",
      "label": "Charakter i cechy zagrożeń dla środowiska oraz higieny i zdrowia ludzi",
      "type": "t",
      "arg": 4
     }
    ]
   },
   {
    "title": "Ochrona przeciwpożarowa (§ 14 pkt 6)",
    "rows": [
     {
      "key": "ppoz_drogi",
      "label": "Wymagania w zakresie dróg pożarowych",
      "type": "x",
      "arg": null
     },
     {
      "key": "ppoz_drogi_opis",
      "label": "Opis dróg pożarowych",
      "type": "t",
      "arg": 3
     },
     {
      "key": "ppoz_woda",
      "label": "Zaopatrzenie w wodę do zewnętrznego gaszenia pożaru",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Etapowanie inwestycji (§ 14 pkt 7)",
    "rows": [
     {
      "key": "etapowanie",
      "label": "Inwestycja realizowana etapami",
      "type": "x",
      "arg": null
     },
     {
      "key": "etapy",
      "label": "Opis etapów realizacji",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Obszar oddziaływania obiektu (§ 14 pkt 8 i § 18)",
    "rows": [
     {
      "key": "obszar",
      "label": "Usytuowanie obszaru oddziaływania",
      "type": "c",
      "arg": [
       "mieści się w całości na działce lub działkach, na których obiekt zaprojektowano",
       "w całości na działce – z wyjątkiem sieci i przyłączy",
       "częściowo poza granicami działki",
       "poza granicami działki"
      ]
     },
     {
      "key": "obszar_przepisy",
      "label": "Przepisy, na podstawie których wyznaczono obszar",
      "type": "t",
      "arg": 3
     },
     {
      "key": "obszar_opis",
      "label": "Opis obszaru oddziaływania",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Ustalenia planu / decyzji o warunkach zabudowy",
    "rows": [
     {
      "key": "mpzp_rodzaj",
      "label": "Podstawa ustalenia sposobu zagospodarowania",
      "type": "c",
      "arg": [
       "miejscowy plan zagospodarowania przestrzennego",
       "decyzja o warunkach zabudowy",
       "decyzja o ustaleniu lokalizacji inwestycji celu publicznego",
       "decyzja o ustaleniu lokalizacji inwestycji mieszkaniowej",
       "brak planu i decyzji – zgłoszenie / inny tryb"
      ]
     },
     {
      "key": "mpzp_nazwa",
      "label": "Oznaczenie uchwały / decyzji",
      "type": "e",
      "arg": 62
     },
     {
      "key": "mpzp_pow_zab",
      "label": "Maks. powierzchnia zabudowy [%]",
      "type": "e",
      "arg": 12
     },
     {
      "key": "mpzp_pbc",
      "label": "Min. powierzchnia biologicznie czynna [%]",
      "type": "e",
      "arg": 12
     },
     {
      "key": "mpzp_intens",
      "label": "Maks. intensywność zabudowy",
      "type": "e",
      "arg": 12
     },
     {
      "key": "mpzp_wys",
      "label": "Maks. wysokość zabudowy [m]",
      "type": "e",
      "arg": 12
     }
    ]
   },
   {
    "title": "Część rysunkowa, załączniki, uwagi",
    "rows": [
     {
      "key": "rysunki",
      "label": "Projekt zawiera część rysunkową",
      "type": "x",
      "arg": null
     },
     {
      "key": "rysunki_opis",
      "label": "Zestawienie rysunków (uzupełniające)",
      "type": "t",
      "arg": 3
     },
     {
      "key": "zalaczniki",
      "label": "Załączniki",
      "type": "t",
      "arg": 3
     },
     {
      "key": "inne",
      "label": "Inne niezbędne dane (§ 14 pkt 7)",
      "type": "t",
      "arg": 3
     }
    ]
   }
  ],
  "pab": [
   {
    "title": "Program użytkowy (§ 20 ust. 1 pkt 2)",
    "rows": [
     {
      "key": "program",
      "label": "Zamierzony sposób użytkowania i program użytkowy",
      "type": "t",
      "arg": 5
     }
    ]
   },
   {
    "title": "Układ przestrzenny i forma (§ 20 ust. 1 pkt 3)",
    "rows": [
     {
      "key": "forma",
      "label": "Układ przestrzenny oraz forma architektoniczna",
      "type": "t",
      "arg": 4
     },
     {
      "key": "wykonczenie",
      "label": "Wykończenie zewnętrzne i wewnętrzne",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Charakterystyczne parametry (§ 20 ust. 1 pkt 4)",
    "rows": [
     {
      "key": "kubatura",
      "label": "Kubatura [m³]",
      "type": "e",
      "arg": 14
     },
     {
      "key": "pow_uzytkowa",
      "label": "Powierzchnia użytkowa [m²]",
      "type": "e",
      "arg": 14
     },
     {
      "key": "pow_calkowita",
      "label": "Powierzchnia całkowita [m²]",
      "type": "e",
      "arg": 14
     },
     {
      "key": "wysokosc",
      "label": "Wysokość [m]",
      "type": "e",
      "arg": 14
     },
     {
      "key": "dlugosc",
      "label": "Długość [m]",
      "type": "e",
      "arg": 14
     },
     {
      "key": "szerokosc",
      "label": "Szerokość [m]",
      "type": "e",
      "arg": 14
     },
     {
      "key": "srednica",
      "label": "Średnica [m] (obiekty o przekroju kołowym)",
      "type": "e",
      "arg": 14
     },
     {
      "key": "kondygnacje",
      "label": "Liczba kondygnacji nadziemnych",
      "type": "e",
      "arg": 10
     },
     {
      "key": "kondygnacje_podziemne",
      "label": "Liczba kondygnacji podziemnych",
      "type": "e",
      "arg": 10
     }
    ]
   },
   {
    "title": "Liczba lokali i miejsc postojowych (§ 20 ust. 1 pkt 6 i 7)",
    "rows": [
     {
      "key": "lokale_mieszkalne",
      "label": "Liczba lokali mieszkalnych",
      "type": "e",
      "arg": 10
     },
     {
      "key": "lokale_uzytkowe",
      "label": "Liczba lokali użytkowych",
      "type": "e",
      "arg": 10
     },
     {
      "key": "lokale_dostepne",
      "label": "Liczba lokali dostępnych dla osób ze szczególnymi potrzebami",
      "type": "e",
      "arg": 10
     },
     {
      "key": "miejsca_postojowe",
      "label": "Liczba miejsc postojowych",
      "type": "e",
      "arg": 10
     }
    ]
   },
   {
    "title": "Geotechnika i posadowienie (§ 20 ust. 1 pkt 5)",
    "rows": [
     {
      "key": "geotechnika",
      "label": "Opinia geotechniczna – warunki gruntowe",
      "type": "t",
      "arg": 4
     },
     {
      "key": "posadowienie",
      "label": "Sposób posadowienia obiektu",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Dostępność dla osób ze szczególnymi potrzebami (§ 20 ust. 1 pkt 8)",
    "rows": [
     {
      "key": "dostepnosc",
      "label": "Obiekt zapewnia dostępność dla osób ze szczególnymi potrzebami",
      "type": "x",
      "arg": null
     },
     {
      "key": "dost_dojscie",
      "label": "Dojście i wejście do obiektu",
      "type": "t",
      "arg": 3
     },
     {
      "key": "dost_kondygnacje",
      "label": "Komunikacja pionowa",
      "type": "t",
      "arg": 3
     },
     {
      "key": "dost_pomieszczenia",
      "label": "Pomieszczenia i ich wyposażenie",
      "type": "t",
      "arg": 3
     },
     {
      "key": "dost_parkingi",
      "label": "Miejsca postojowe dla osób ze szczególnymi potrzebami",
      "type": "t",
      "arg": 3
     },
     {
      "key": "dost_rekreacja",
      "label": "Warunki rekreacji i wypoczynku",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Wpływ na środowisko i zdrowie ludzi (§ 20 ust. 1 pkt 9)",
    "rows": [
     {
      "key": "woda",
      "label": "Zaopatrzenie w wodę",
      "type": "t",
      "arg": 3
     },
     {
      "key": "scieki",
      "label": "Odprowadzanie ścieków",
      "type": "t",
      "arg": 3
     },
     {
      "key": "emisje",
      "label": "Emisje i uciążliwości",
      "type": "t",
      "arg": 3
     },
     {
      "key": "odpady",
      "label": "Gospodarka odpadami",
      "type": "t",
      "arg": 3
     },
     {
      "key": "akustyka",
      "label": "Ochrona przed hałasem i drganiami",
      "type": "t",
      "arg": 3
     },
     {
      "key": "srodowisko_grunt",
      "label": "Oddziaływanie na grunt i wody gruntowe",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Charakterystyka energetyczna (§ 20 ust. 1 pkt 10)",
    "rows": [
     {
      "key": "energia_zapotrzebowanie",
      "label": "Zapotrzebowanie na energię",
      "type": "t",
      "arg": 3
     },
     {
      "key": "energia_nosniki",
      "label": "Nośniki energii",
      "type": "t",
      "arg": 2
     },
     {
      "key": "energia_system_konw",
      "label": "Systemy konwencjonalne",
      "type": "t",
      "arg": 3
     },
     {
      "key": "energia_system_alt",
      "label": "Systemy alternatywne / odnawialne źródła",
      "type": "t",
      "arg": 3
     },
     {
      "key": "energia_wynik",
      "label": "Wyniki analizy wariantów",
      "type": "t",
      "arg": 3
     },
     {
      "key": "automatyka",
      "label": "Automatyczna regulacja temperatury (§ 20 ust. 1 pkt 11)",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Wyposażenie budowlano-instalacyjne (§ 20 ust. 1 pkt 12)",
    "rows": [
     {
      "key": "instalacje_sel",
      "label": "Projektowane instalacje",
      "type": "l",
      "arg": [
       [
        "wodkan",
        "instalacja wodociągowa i kanalizacyjna"
       ],
       [
        "gaz",
        "instalacja gazowa"
       ],
       [
        "co",
        "instalacja centralnego ogrzewania"
       ],
       [
        "wentylacja",
        "instalacja wentylacji"
       ],
       [
        "klima",
        "instalacja klimatyzacji / chłodzenia"
       ],
       [
        "elektryka",
        "instalacja elektroenergetyczna"
       ],
       [
        "teletechnika",
        "instalacja teletechniczna"
       ],
       [
        "odgromowa",
        "instalacja piorunochronna"
       ],
       [
        "pv",
        "instalacja fotowoltaiczna"
       ],
       [
        "sap",
        "system sygnalizacji pożaru / instalacje przeciwpożarowe"
       ]
      ]
     },
     {
      "key": "instalacje_opis",
      "label": "Opis instalacji i urządzeń",
      "type": "t",
      "arg": 4
     }
    ]
   },
   {
    "title": "Ochrona przeciwpożarowa (§ 20 ust. 1 pkt 13)",
    "rows": [
     {
      "key": "ppoz",
      "label": "Warunki ochrony przeciwpożarowej",
      "type": "t",
      "arg": 4
     }
    ]
   },
   {
    "title": "Ochrona ludności (§ 20 ust. 1 pkt 14)",
    "rows": [
     {
      "key": "ochrona_ludnosci",
      "label": "Obiekt jest budowlą ochronną / obiektem zbiorowej ochrony",
      "type": "x",
      "arg": null
     },
     {
      "key": "ol_rodzaj",
      "label": "Rodzaj budowli ochronnej",
      "type": "e",
      "arg": 45
     },
     {
      "key": "ol_pojemnosc",
      "label": "Pojemność / liczba osób",
      "type": "e",
      "arg": 20
     },
     {
      "key": "ol_kategoria",
      "label": "Kategoria odporności budowli ochronnej",
      "type": "e",
      "arg": 30
     },
     {
      "key": "ol_czas",
      "label": "Czas ochrony",
      "type": "e",
      "arg": 20
     },
     {
      "key": "ol_usytuowanie",
      "label": "Usytuowanie względem obiektu",
      "type": "t",
      "arg": 2
     },
     {
      "key": "ol_wyjscia",
      "label": "Wyjścia ewakuacyjne i zapasowe",
      "type": "t",
      "arg": 2
     },
     {
      "key": "ol_zagruzowanie",
      "label": "Strefa zagruzowania",
      "type": "t",
      "arg": 2
     },
     {
      "key": "ol_wysokosc",
      "label": "Wysokość budowli ochronnej",
      "type": "t",
      "arg": 2
     }
    ]
   },
   {
    "title": "Odstępstwo od przepisów (§ 20 ust. 2)",
    "rows": [
     {
      "key": "odstepstwo",
      "label": "Projekt obejmuje odstępstwo od przepisów",
      "type": "x",
      "arg": null
     },
     {
      "key": "odstepstwo_opis",
      "label": "Zakres i uzasadnienie odstępstwa",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Rysunki i uwagi",
    "rows": [
     {
      "key": "rysunki",
      "label": "Projekt zawiera część rysunkową",
      "type": "x",
      "arg": null
     },
     {
      "key": "uwagi",
      "label": "Uwagi i informacje dodatkowe",
      "type": "t",
      "arg": 3
     }
    ]
   }
  ],
  "bioz": [
   {
    "title": "Zakres i kolejność robót",
    "rows": [
     {
      "key": "wymagany",
      "label": "Plan BIOZ wymagany dla tej inwestycji",
      "type": "x",
      "arg": null
     },
     {
      "key": "zakres_prac",
      "label": "Zakres robót budowlanych",
      "type": "t",
      "arg": 5
     },
     {
      "key": "kolejnosc",
      "label": "Kolejność realizacji robót",
      "type": "t",
      "arg": 5
     }
    ]
   },
   {
    "title": "Stan istniejący i zagospodarowanie",
    "rows": [
     {
      "key": "istniejace",
      "label": "Wykaz istniejących obiektów budowlanych",
      "type": "t",
      "arg": 3
     },
     {
      "key": "elementy",
      "label": "Elementy zagospodarowania mogące stwarzać zagrożenie",
      "type": "t",
      "arg": 3
     }
    ]
   },
   {
    "title": "Zagrożenia i prace niebezpieczne",
    "rows": [
     {
      "key": "zagrozenia",
      "label": "Przewidywane zagrożenia podczas realizacji",
      "type": "t",
      "arg": 4
     },
     {
      "key": "prace_niebezpieczne",
      "label": "Prace szczególnie niebezpieczne",
      "type": "l",
      "arg": [
       [
        "wysokosc",
        "prace na wysokości powyżej 5 m"
       ],
       [
        "wykopy",
        "wykopy o ścianach pionowych bez rozparcia powyżej 1,5 m"
       ],
       [
        "rusztowania",
        "prace przy użyciu rusztowań i konstrukcji wsporczych"
       ],
       [
        "dzwigi",
        "prace z użyciem dźwigów i maszyn budowlanych"
       ],
       [
        "rozbiorka",
        "prace rozbiórkowe i demontażowe"
       ],
       [
        "materialy",
        "prace z materiałami niebezpiecznymi (substancje chemiczne)"
       ],
       [
        "energia",
        "prace w pobliżu czynnych sieci i instalacji elektroenergetycznych"
       ],
       [
        "gaz",
        "prace w pobliżu czynnych sieci gazowych"
       ],
       [
        "woda",
        "prace w pobliżu czynnych sieci wodociągowych i kanalizacyjnych"
       ],
       [
        "komora",
        "prace w zbiornikach, kanałach i przestrzeniach zamkniętych"
       ],
       [
        "ciezkie",
        "ręczne przemieszczanie ciężkich elementów"
       ],
       [
        "inne",
        "inne prace szczególnie niebezpieczne"
       ]
      ]
     }
    ]
   },
   {
    "title": "Instruktaż i środki ochrony",
    "rows": [
     {
      "key": "instruktaz",
      "label": "Sposób prowadzenia instruktażu pracowników",
      "type": "t",
      "arg": 3
     },
     {
      "key": "srodki",
      "label": "Środki techniczne i organizacyjne zapobiegające zagrożeniom",
      "type": "t",
      "arg": 4
     },
     {
      "key": "drogi",
      "label": "Drogi ewakuacyjne i komunikacyjne",
      "type": "t",
      "arg": 3
     },
     {
      "key": "uwagi",
      "label": "Uwagi dodatkowe",
      "type": "t",
      "arg": 3
     }
    ]
   }
  ]
 },
 "hints": {
  "ogolne.nazwa": "Pełna nazwa zamierzenia budowlanego, np. „Budowa budynku mieszkalnego jednorodzinnego z garażem”. Trafia na stronę tytułową i do metryki.",
  "ogolne.adres": "Adres inwestycji: ulica, numer, kod pocztowy i miejscowość.",
  "ogolne.dzialki": "Numery działek ewidencyjnych oddzielone przecinkami, np. 123/4, 123/5.",
  "ogolne.obreb": "Nazwa obrębu ewidencyjnego zgodna z ewidencją gruntów.",
  "ogolne.jednostka": "Nazwa jednostki ewidencyjnej (gminy), np. „m. st. Warszawa”.",
  "ogolne.pow_dzialki": "Powierzchnia działki w m², np. 1250,50. Wpływa na wskaźniki w bilansie terenu i kontrolę limitów z planu miejscowego.",
  "ogolne.inwestor": "Imię i nazwisko lub nazwa firmy inwestora. Przy kilku inwestorach wpisz wszystkie osoby oddzielone przecinkiem.",
  "ogolne.data": "Format DD.MM.RRRR. Data trafia na dokumenty i do nazw plików, np. PZT_2026.11.16.",
  "ogolne.organ": "Organ administracji architektoniczno-budowlanej właściwy dla miejsca inwestycji, np. Starosta Powiatu…, Prezydent Miasta…",
  "ogolne.osoba_wnioskujaca": "Osoba podpisująca wniosek. Pozostaw puste, jeśli wnioskodawcą jest inwestor wskazany powyżej.",
  "pzt.przedmiot": "Krótki opis tego, co ma powstać: rodzaj obiektu, funkcja, skala.",
  "pzt.stan_istniejacy": "Co znajduje się na działce obecnie: zabudowa, zieleń, uzbrojenie, ukształtowanie terenu.",
  "pzt.rozbiorka": "Zaznacz, jeśli inwestycja obejmuje rozbiórkę istniejących obiektów.",
  "pzt.zagospodarowanie": "Opis projektowanego zagospodarowania: budynki, dojścia, podjazdy, miejsca postojowe, zieleń.",
  "pzt.urzadzenia_sel": "Zaznacz urządzenia budowlane występujące na działce, np. przyłącza, zbiornik bezodpływowy, instalacje.",
  "pzt.dostep_drogi": "Sposób dostępu do drogi publicznej – bezpośredni, przez zjazd, służebność drogi koniecznej itp.",
  "pzt.mpzp_pow_zab": "Maksymalny udział powierzchni zabudowy z planu miejscowego lub decyzji o warunkach zabudowy. Program ostrzeże o przekroczeniu.",
  "pzt.mpzp_pbc": "Minimalny udział powierzchni biologicznie czynnej wymagany przepisami.",
  "pzt.obszar": "Obszar oddziaływania obiektu wyznaczony zgodnie z § 18 rozporządzenia.",
  "pab.program": "Zamierzony sposób użytkowania i program użytkowy, np. „budynek mieszkalny jednorodzinny – parter, 4 pokoje, kuchnia, 2 łazienki”.",
  "pab.forma": "Układ przestrzenny i forma architektoniczna: bryła, dach, elewacje, kolorystyka.",
  "pab.kubatura": "Kubatura brutto w m³ – zgodnie z projektem technicznym.",
  "pab.pow_uzytkowa": "Powierzchnia użytkowa w m² – suma powierzchni pomieszczeń.",
  "pab.dostepnosc": "Odznacz tylko wtedy, gdy obiekt nie musi zapewniać dostępności dla osób ze szczególnymi potrzebami.",
  "pab.ochrona_ludnosci": "Zaznacz, jeśli obiekt jest budowlą ochronną lub obiektem zbiorowej ochrony – wtedy uzupełnij dane poniżej (§ 20 ust. 1 pkt 14).",
  "pab.odstepstwo": "Zaznacz, jeśli projekt obejmuje odstępstwo od przepisów techniczno-budowlanych i opisz jego zakres.",
  "bioz.wymagany": "Plan BIOZ jest wymagany, gdy roboty obejmują prace szczególnie niebezpieczne lub trwają dłużej niż 30 dni i zatrudniają powyżej 20 osób (art. 21a Prawa budowlanego).",
  "bioz.zakres_prac": "Zakres i kolejność realizacji robót budowlanych dla całej inwestycji.",
  "bioz.prace_niebezpieczne": "Zaznacz prace szczególnie niebezpieczne występujące na budowie – lista zgodna z rozporządzeniem BIOZ.",
  "dokumenty.status": "„Dołączony” – dokument jest gotowy; „Do uzupełnienia” – brakuje go; „Nie dotyczy” – nie jest wymagany dla tej inwestycji."
 },
 "required": [
  [
   "ogolne",
   "adres"
  ],
  [
   "ogolne",
   "data"
  ],
  [
   "ogolne",
   "dzialki"
  ],
  [
   "ogolne",
   "inwestor"
  ],
  [
   "ogolne",
   "nazwa"
  ],
  [
   "ogolne",
   "pow_dzialki"
  ],
  [
   "pab",
   "forma"
  ],
  [
   "pab",
   "program"
  ]
 ],
 "specjalnosci": [
  "architektoniczna",
  "konstrukcyjno-budowlana",
  "architektoniczno-konstrukcyjna",
  "instalacyjna w zakresie sieci, instalacji i urządzeń cieplnych, wentylacyjnych, gazowych, wodociągowych i kanalizacyjnych",
  "instalacyjna w zakresie sieci, instalacji i urządzeń elektrycznych i elektroenergetycznych",
  "instalacyjna w zakresie sieci, instalacji i urządzeń telekomunikacyjnych",
  "drogowa",
  "kolejowa",
  "mostowa",
  "hydrotechniczna",
  "wyburzeniowa"
 ],
 "bilansKategorie": [
  [
   "zabudowa",
   "Powierzchnia zabudowy"
  ],
  [
   "drogi",
   "Drogi, parkingi, place i chodniki"
  ],
  [
   "pbc",
   "Powierzchnia biologicznie czynna"
  ],
  [
   "inne",
   "Inne części terenu"
  ]
 ],
 "dokumentyStatusy": [
  "Do uzupełnienia",
  "Dołączony",
  "Nie dotyczy"
 ],
 "projektanciFunkcje": [
  "Projektant",
  "Sprawdzający",
  "Autor opracowania",
  "Projektant branży"
 ],
 "dokumenty": [
  [
   "PZT",
   "PZT – projekt zagospodarowania terenu"
  ],
  [
   "PAB",
   "PAB – opis architektoniczno-budowlany"
  ],
  [
   "WNIOSEK",
   "Wniosek o pozwolenie na budowę"
  ],
  [
   "OSWIADCZENIE",
   "Oświadczenie o prawie do dysponowania nieruchomością"
  ],
  [
   "BIOZ_INFO",
   "Informacja BIOZ"
  ],
  [
   "BIOZ",
   "Plan BIOZ"
  ],
  [
   "ZALACZNIKI",
   "Wykaz dokumentów i załączników"
  ]
 ],
 "steps": [
  [
   "ogolne",
   "Dane ogólne",
   "Inwestycja, inwestor i projektanci"
  ],
  [
   "pzt",
   "PZT",
   "Projekt zagospodarowania terenu"
  ],
  [
   "pab",
   "PAB",
   "Opis architektoniczno-budowlany"
  ],
  [
   "bioz",
   "BIOZ",
   "Informacja i plan BIOZ"
  ],
  [
   "bilans",
   "Bilans i obiekty",
   "Powierzchnie, wskaźniki, obiekty"
  ],
  [
   "zal",
   "Załączniki",
   "Dokumenty i pliki do wniosku"
  ],
  [
   "check",
   "Kontrola",
   "Kompletność i zgodność danych"
  ],
  [
   "preview",
   "Podgląd",
   "Sprawdź treść dokumentów"
  ]
 ]
};
