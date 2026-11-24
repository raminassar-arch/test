# -*- coding: utf-8 -*-
"""
Generator treści opisowych projektu budowlanego.
Zakres opracowania oparty na:
  - ustawie z dnia 7 lipca 1994 r. - Prawo budowlane,
  - rozporządzeniu Ministra Rozwoju z dnia 11 września 2020 r.
    w sprawie szczegółowego zakresu i formy projektu budowlanego
    (Dz. U. z 2022 r. poz. 1679, z 2023 r. poz. 2405 oraz z 2026 r. poz. 597).
"""

from __future__ import annotations

import datetime as _dt
from dataclasses import dataclass, field
from typing import Any

# ---------------------------------------------------------------------------
# Motyw końcowy dokumentów DOCX/PDF
# ---------------------------------------------------------------------------

MOTYW_DOMYSLNY = "motyw-1"
MOTYWY = (
    ("motyw-1", "Motyw nr 1"),
    ("motyw-2", "Motyw nr 2"),
    ("motyw-3", "Motyw nr 3"),
    ("motyw-4", "Motyw nr 4"),
    ("motyw-5", "Motyw nr 5"),
)
MOTYW_OPIS = {
    "motyw-1": "Times New Roman, granatowe nagłówki i klasyczna linia – dotychczasowy układ urzędowy.",
    "motyw-2": "Calibri i zielone akcenty – lżejszy, uporządkowany układ biurowy.",
    "motyw-3": "Segoe UI, głęboka zieleń i złoto – wyrazisty układ prezentacyjny.",
    "motyw-4": "Georgia i bordo – elegancki układ o ciepłym charakterze.",
    "motyw-5": "Verdana i turkus – nowoczesny układ o dużej czytelności.",
}
MOTYW_ALIASY = {
    "1": "motyw-1",
    "nr 1": "motyw-1",
    "motyw 1": "motyw-1",
    "motyw nr 1": "motyw-1",
    "klasyczny": "motyw-1",
    "classic": "motyw-1",
    "klasyk": "motyw-1",
    "traditional": "motyw-1",
    "2": "motyw-2",
    "nr 2": "motyw-2",
    "motyw 2": "motyw-2",
    "motyw nr 2": "motyw-2",
    "nowoczesny": "motyw-2",
    "modern": "motyw-2",
    "3": "motyw-3",
    "nr 3": "motyw-3",
    "motyw 3": "motyw-3",
    "motyw nr 3": "motyw-3",
    "bardzo-nowoczesny": "motyw-3",
    "bardzo nowoczesny": "motyw-3",
    "ultra": "motyw-3",
    "ultra-modern": "motyw-3",
    "4": "motyw-4",
    "nr 4": "motyw-4",
    "motyw 4": "motyw-4",
    "motyw nr 4": "motyw-4",
    "5": "motyw-5",
    "nr 5": "motyw-5",
    "motyw 5": "motyw-5",
    "motyw nr 5": "motyw-5",
}


def resolve_motyw(value: Any) -> str:
    """Zwraca klucz motywu, akceptując też nazwy z interfejsu i aliasy."""
    key = str(value or "").strip().lower().replace("_", "-")
    key = MOTYW_ALIASY.get(key, key)
    return key if key in dict(MOTYWY) else MOTYW_DOMYSLNY


def motyw_z_danych(data: dict[str, Any] | None,
                   doc_obj: Any | None = None) -> str:
    """Odczytuje motyw z danych projektu lub metadanych dokumentu."""
    if data:
        raw = data.get("motyw")
        if raw:
            return resolve_motyw(raw)
        meta = data.get("meta")
        if isinstance(meta, dict) and meta.get("motyw"):
            return resolve_motyw(meta.get("motyw"))
    if doc_obj is not None:
        raw = getattr(doc_obj, "meta", {}).get("motyw")
        if raw:
            return resolve_motyw(raw)
    return MOTYW_DOMYSLNY


# ---------------------------------------------------------------------------
# Słowniki
# ---------------------------------------------------------------------------

KATEGORIE = [
    "I – budynki mieszkalne jednorodzinne",
    "II – budynki mieszkalne wielorodzinne, budynki zamieszkania zbiorowego",
    "III – budynki hotelowe, administracyjne, biurowe, handlowe, usługowe",
    "IV – budynki oświaty, nauki, kultury, sportu, opieki zdrowotnej",
    "V – budynki przemysłowe, magazynowe, gospodarcze i infrastruktury",
    "Obiekt liniowy / sieć / obiekt inżynieryjny",
    "Inny obiekt budowlany",
]

RODZAJE = [
    "Budynek mieszkalny jednorodzinny",
    "Budynek mieszkalny wielorodzinny",
    "Budynek usługowy / handlowy / biurowy",
    "Budynek przemysłowy / magazynowy",
    "Budynek gospodarczy / garażowy",
    "Obiekt liniowy / sieć uzbrojenia terenu",
    "Obiekt inżynieryjny (drogowy, mostowy, hydrotechniczny)",
    "Inny obiekt budowlany",
]

KAT_ZABUDOWA = "Powierzchnia zabudowy"
KAT_DROGI = "Drogi, parkingi, place i chodniki"
KAT_PBC = "Powierzchnia biologicznie czynna"
KAT_INNE = "Inne części terenu"

KATEGORIE_BILANSU = [
    ("zabudowa", KAT_ZABUDOWA),
    ("drogi", KAT_DROGI),
    ("pbc", KAT_PBC),
    ("inne", KAT_INNE),
]

FUNKCJE_PROJEKTANTA = [
    "Projektant",
    "Sprawdzający",
    "Autor opracowania",
    "Projektant branży",
]

FUNKCJE_WNIOSKUJACEGO = [
    "inwestor",
    "pełnomocnik inwestora",
    "użytkownik wieczysty",
    "zarządca nieruchomości",
]

DOKUMENTY_POZWOLENIE = [
    ("wniosek", "Wniosek o pozwolenie na budowę"),
    ("oswiadczenie", "Oświadczenie o prawie do dysponowania nieruchomością na cele budowlane"),
    ("projekt", "Projekt budowlany (PZT, PAB i część rysunkowa)"),
    ("bioz_info", "Informacja dotycząca bezpieczeństwa i ochrony zdrowia"),
    ("bioz_plan", "Plan BIOZ (dokument budowy, nie załącznik do wniosku)"),
    ("mapa", "Mapa do celów projektowych"),
    ("plan", "Wypis i wyrys z MPZP albo decyzja o warunkach zabudowy"),
    ("warunki", "Warunki techniczne przyłączenia do sieci uzbrojenia terenu"),
    ("uzgodnienia", "Uzgodnienia, opinie i pozwolenia (konserwator, zarządca drogi, inne)"),
    ("srodowisko", "Decyzja o środowiskowych uwarunkowaniach (jeżeli wymagana)"),
    ("pelno", "Pełnomocnictwo oraz dowód wniesienia opłaty skarbowej"),
]

PRACE_NIEBEZPIECZNE = [
    ("wysokosc", "prace na wysokości powyżej 5 m"),
    ("wykopy", "wykopy o ścianach pionowych bez rozparcia powyżej 1,5 m"),
    ("rusztowania", "prace przy użyciu rusztowań i konstrukcji wsporczych"),
    ("dzwigi", "prace z użyciem dźwigów i maszyn budowlanych"),
    ("rozbiorka", "prace rozbiórkowe i demontażowe"),
    ("materialy", "prace z materiałami niebezpiecznymi (substancje chemiczne)"),
    ("energia", "prace w pobliżu czynnych sieci i instalacji elektroenergetycznych"),
    ("gaz", "prace w pobliżu czynnych sieci gazowych"),
    ("woda", "prace w pobliżu czynnych sieci wodociągowych i kanalizacyjnych"),
    ("komora", "prace w zbiornikach, kanałach i przestrzeniach zamkniętych"),
    ("ciezkie", "ręczne przemieszczanie ciężkich elementów"),
    ("inne", "inne prace szczególnie niebezpieczne"),
]

STATUSY_DOKUMENTU = ["Do uzupełnienia", "Dołączony", "Nie dotyczy"]

SCIEKI = [
    "do sieci kanalizacji sanitarnej",
    "do szczelnego zbiornika bezodpływowego",
    "do przydomowej oczyszczalni ścieków",
    "do instalacji wewnętrznej z odprowadzeniem pośrednim",
    "inne / do uzupełnienia",
]

WODY_OPADOWE = [
    "rozsączenie na terenie działki",
    "odprowadzenie do sieci kanalizacji deszczowej",
    "retencja w zbiorniku i wykorzystanie do nawadniania",
    "odprowadzenie na teren nieutwardzony",
    "inne / do uzupełnienia",
]

DOSTEP_DROGI = [
    "bezpośredni zjazd z drogi publicznej",
    "poprzez istniejący zjazd / bramę",
    "poprzez drogę wewnętrzną",
    "na podstawie ustanowionej służebności drogowej",
    "inne / do uzupełnienia",
]

OBSZAR_ODDZIALYWANIA = [
    "mieści się w całości na działce lub działkach, na których obiekt zaprojektowano",
    "w całości na działce – z wyjątkiem sieci i przyłączy",
    "częściowo poza granicami działki",
    "poza granicami działki",
]

MPZP_RODZAJE = [
    "miejscowy plan zagospodarowania przestrzennego",
    "decyzja o warunkach zabudowy",
    "decyzja o ustaleniu lokalizacji inwestycji celu publicznego",
    "decyzja o ustaleniu lokalizacji inwestycji mieszkaniowej",
    "brak planu i decyzji – zgłoszenie / inny tryb",
]

ZABYTEK = [
    "nie dotyczy",
    "działka wpisana do rejestru zabytków",
    "działka ujęta w gminnej ewidencji zabytków",
    "obszar objęty ochroną konserwatorską",
]

URZADZENIA = [
    "przyłącza i sieci uzbrojenia terenu",
    "miejsca postojowe i utwardzenia",
    "ogrodzenie i brama wjazdowa",
    "zbiornik bezodpływowy / retencyjny",
    "oświetlenie zewnętrzne",
    "inne",
]

UZBROJENIE = [
    ("woda", "sieć wodociągowa"),
    ("kanalizacja", "sieć kanalizacji sanitarnej"),
    ("deszcz", "sieć kanalizacji deszczowej"),
    ("gaz", "sieć gazowa"),
    ("energia", "sieć elektroenergetyczna"),
    ("cieplo", "sieć ciepłownicza"),
    ("telekom", "sieć telekomunikacyjna"),
]

INSTALACJE = [
    ("wodkan", "instalacja wodociągowa i kanalizacyjna"),
    ("gaz", "instalacja gazowa"),
    ("co", "instalacja centralnego ogrzewania"),
    ("wentylacja", "instalacja wentylacji"),
    ("klima", "instalacja klimatyzacji / chłodzenia"),
    ("elektryka", "instalacja elektroenergetyczna"),
    ("teletechnika", "instalacja teletechniczna"),
    ("odgromowa", "instalacja piorunochronna"),
    ("pv", "instalacja fotowoltaiczna"),
    ("sap", "system sygnalizacji pożaru / instalacje przeciwpożarowe"),
]

# ---------------------------------------------------------------------------
# Model danych
# ---------------------------------------------------------------------------

def _text(value: Any) -> str:
    """Bezpieczna konwersja wartości na tekst (bez wartości None)."""
    return "" if value is None else str(value).strip()


def rekord_projektanta(funkcja: str = "Projektant", imie: str = "",
                       specjalnosc: str = "", uprawnienia: str = "") -> dict[str, str]:
    """Zwraca pojedynczy rekord projektanta w jednolitym formacie."""
    return {
        "funkcja": _text(funkcja) or "Projektant",
        "imie": _text(imie),
        "specjalnosc": _text(specjalnosc),
        "uprawnienia": _text(uprawnienia),
    }


def _projektanci_z_pol_pojedynczych(o: dict[str, Any]) -> list[dict[str, str]]:
    """Buduje listę projektantów z pól pojedynczych (starsze wersje projektu)."""
    rows: list[dict[str, str]] = []
    if _text(o.get("projektant")):
        rows.append(rekord_projektanta(
            "Projektant", _text(o.get("projektant")),
            _text(o.get("specjalnosc")), _text(o.get("uprawnienia"))))
    if _text(o.get("sprawdzajacy")):
        rows.append(rekord_projektanta(
            "Sprawdzający", _text(o.get("sprawdzajacy")),
            _text(o.get("specjalnosc")), _text(o.get("sprawdzajacy_uprawnienia"))))
    return rows


def projektanci_list(ogolne: dict[str, Any] | None) -> list[dict[str, str]]:
    """Znormalizowana lista projektantów zapisana w projekcie."""
    o = ogolne or {}
    rows = o.get("projektanci")
    out: list[dict[str, str]] = []
    if not isinstance(rows, list):
        return out
    for row in rows:
        if not isinstance(row, dict):
            continue
        rec = rekord_projektanta(
            row.get("funkcja"), row.get("imie"),
            row.get("specjalnosc"), row.get("uprawnienia"))
        if rec["imie"] or rec["specjalnosc"] or rec["uprawnienia"]:
            out.append(rec)
    return out


def blank_project() -> dict[str, Any]:
    """Zwraca kompletny, pusty projekt z domyślnymi wartościami."""
    return {
        "motyw": MOTYW_DOMYSLNY,
        "meta": {"wersja": 1, "program": "PAB cyfrowa", "motyw": MOTYW_DOMYSLNY},
        "ogolne": {
            "nazwa": "",
            "inwestor": "",
            "inwestor_adres": "",
            "adres": "",
            "dzialki": "",
            "obreb": "",
            "jednostka": "",
            "kategoria": KATEGORIE[0],
            "rodzaj": RODZAJE[0],
            "pow_dzialki": "",
            "data": _dt.date.today().strftime("%d.%m.%Y"),
            "nr_projektu": "",
            "tom": "",
            "projektant": "",
            "specjalnosc": "architektoniczna",
            "uprawnienia": "",
            "sprawdzajacy": "",
            "sprawdzajacy_uprawnienia": "",
            "zakres": "całość opracowania",
            "organ": "",
            "organ_adres": "",
            "osoba_wnioskujaca": "",
            "funkcja_wnioskujacego": "inwestor",
            "projektanci": [],
        },
        "pzt": {
            "przedmiot": "",
            "zakres_zamierzenia": "",
            "stan_istniejacy": "",
            "rozbiorka": False,
            "rozbiorka_opis": "",
            "zagospodarowanie": "",
            "urzadzenia": "",
            "urzadzenia_sel": [],
            "scieki": SCIEKI[0],
            "scieki_opis": "",
            "wody_opadowe": WODY_OPADOWE[0],
            "wody_opadowe_opis": "",
            "komunikacja": "",
            "dostep_drogi": DOSTEP_DROGI[0],
            "dostep_opis": "",
            "uzbrojenie_sel": ["woda", "kanalizacja", "energia"],
            "uzbrojenie_opis": "",
            "ksztaltowanie": "",
            "zielen": "",
            "ograniczenia": False,
            "ograniczenia_opis": "",
            "zabytek": ZABYTEK[0],
            "zabytek_opis": "",
            "gorniczy": False,
            "gorniczy_opis": "",
            "srodowisko": "",
            "ppoz_drogi": False,
            "ppoz_drogi_opis": "",
            "ppoz_woda": "",
            "etapowanie": False,
            "etapy": "",
            "inne": "",
            "obszar": OBSZAR_ODDZIALYWANIA[0],
            "obszar_przepisy": "",
            "obszar_opis": "",
            "mpzp_rodzaj": MPZP_RODZAJE[0],
            "mpzp_nazwa": "",
            "mpzp_pow_zab": "",
            "mpzp_pbc": "",
            "mpzp_intens": "",
            "mpzp_wys": "",
            "rysunki": True,
            "rysunki_opis": "",
            "zalaczniki": "",
        },
        "pab": {
            "program": "",
            "forma": "",
            "wykonczenie": "",
            "kubatura": "",
            "pow_uzytkowa": "",
            "pow_calkowita": "",
            "wysokosc": "",
            "dlugosc": "",
            "szerokosc": "",
            "srednica": "",
            "kondygnacje": "",
            "kondygnacje_podziemne": "",
            "lokale_mieszkalne": "",
            "lokale_uzytkowe": "",
            "lokale_dostepne": "",
            "miejsca_postojowe": "",
            "geotechnika": "",
            "posadowienie": "",
            "dostepnosc": True,
            "dost_dojscie": "",
            "dost_kondygnacje": "",
            "dost_pomieszczenia": "",
            "dost_parkingi": "",
            "dost_rekreacja": "",
            "woda": "",
            "scieki": "",
            "emisje": "",
            "odpady": "",
            "akustyka": "",
            "srodowisko_grunt": "",
            "energia_zapotrzebowanie": "",
            "energia_nosniki": "",
            "energia_system_konw": "",
            "energia_system_alt": "",
            "energia_wynik": "",
            "automatyka": "",
            "instalacje_sel": ["wodkan", "co", "wentylacja", "elektryka", "odgromowa"],
            "instalacje_opis": "",
            "ppoz": "",
            "ochrona_ludnosci": False,
            "ol_rodzaj": "",
            "ol_pojemnosc": "",
            "ol_kategoria": "",
            "ol_czas": "",
            "ol_usytuowanie": "",
            "ol_wyjscia": "",
            "ol_zagruzowanie": "",
            "ol_wysokosc": "",
            "odstepstwo": False,
            "odstepstwo_opis": "",
            "rysunki": True,
            "uwagi": "",
        },
        "bioz": {
            "wymagany": True,
            "zakres_prac": "",
            "kolejnosc": "",
            "istniejace": "",
            "elementy": "",
            "zagrozenia": "",
            "prace_niebezpieczne": [],
            "instruktaz": "",
            "srodki": "",
            "drogi": "",
            "uwagi": "",
        },
        "dokumenty": [
            {"klucz": klucz, "nazwa": nazwa,
             "wymagany": klucz != "bioz_plan",
             "status": "Do uzupełnienia",
             "uwagi": ("Wymagany tylko w przypadkach z art. 21a ust. 1a Prawa budowlanego; "
                       "sporządza go kierownik budowy przed rozpoczęciem robót."
                       if klucz == "bioz_plan" else "")}
            for klucz, nazwa in DOKUMENTY_POZWOLENIE
        ],
        "zalaczniki": [],
        "obiekty": [],
        "bilans": [
            {"pozycja": KAT_ZABUDOWA, "kategoria": "zabudowa", "powierzchnia": "0"},
            {"pozycja": KAT_DROGI, "kategoria": "drogi", "powierzchnia": "0"},
            {"pozycja": KAT_PBC, "kategoria": "pbc", "powierzchnia": "0"},
        ],
    }


def _merge_dokumenty(rows: list[Any]) -> list[dict[str, Any]]:
    """Uzupełnia listę dokumentów o pozycje domyślne (zgodność wersji)."""
    defaults = blank_project()["dokumenty"]
    known: dict[str, dict[str, Any]] = {}
    extra: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        klucz = _text(row.get("klucz"))
        if any(d["klucz"] == klucz for d in defaults):
            known[klucz] = row
        else:
            extra.append(dict(row))
    merged = []
    for default in defaults:
        row = dict(default)
        row.update(known.get(default["klucz"], {}))
        merged.append(row)
    return merged + extra


def merge_defaults(data: dict[str, Any] | None) -> dict[str, Any]:
    """Uzupełnia wczytane dane o brakujące klucze (zgodność wersji)."""
    base = blank_project()
    if not data:
        return base
    raw_ogolne = data.get("ogolne")
    if not isinstance(raw_ogolne, dict):
        raw_ogolne = {}
    had_projektanci = isinstance(raw_ogolne.get("projektanci"), list)
    out = dict(base)
    for section, value in data.items():
        if section in ("obiekty", "bilans", "zalaczniki"):
            out[section] = value
        elif section == "dokumenty" and isinstance(value, list):
            out[section] = _merge_dokumenty(value)
        elif isinstance(value, dict) and isinstance(out.get(section), dict):
            merged = dict(out[section])
            merged.update(value)
            out[section] = merged
        else:
            out[section] = value
    if not had_projektanci:
        out["ogolne"]["projektanci"] = _projektanci_z_pol_pojedynczych(out["ogolne"])
    return out


def demo_project() -> dict[str, Any]:
    """Przykładowy, kompletny projekt – do testów i prezentacji programu."""
    data = blank_project()
    data["ogolne"].update({
        "nazwa": "Budowa budynku mieszkalnego jednorodzinnego z garażem",
        "inwestor": "Jan Kowalski",
        "inwestor_adres": "ul. Przykładowa 1, 00-001 Warszawa",
        "adres": "ul. Leśna 12, 05-500 Piaseczno",
        "dzialki": "123/4, 123/5",
        "obreb": "Piaseczno",
        "jednostka": "Piaseczno",
        "pow_dzialki": "1250,00",
        "data": _dt.date.today().strftime("%d.%m.%Y"),
        "nr_projektu": "P-01/2026",
        "tom": "I",
        "projektant": "mgr inż. arch. Anna Nowak",
        "specjalnosc": "architektoniczna",
        "uprawnienia": "MA/123/2020",
        "zakres": "całość opracowania",
        "organ": "Starosta Piaseczyński",
        "organ_adres": "ul. Chyliczkowska 14, 05-500 Piaseczno",
        "osoba_wnioskujaca": "Jan Kowalski",
        "funkcja_wnioskujacego": "inwestor",
        "projektanci": [
            {"funkcja": "Projektant", "imie": "mgr inż. arch. Anna Nowak",
             "specjalnosc": "architektoniczna", "uprawnienia": "MA/123/2020"},
            {"funkcja": "Projektant branży", "imie": "mgr inż. Piotr Wiśniewski",
             "specjalnosc": "konstrukcyjno-budowlana", "uprawnienia": "MA/456/2018"},
            {"funkcja": "Sprawdzający", "imie": "dr inż. Marek Zieliński",
             "specjalnosc": "konstrukcyjno-budowlana", "uprawnienia": "MA/078/2012"},
        ],
    })
    data["pzt"].update({
        "przedmiot": "Budowa budynku mieszkalnego jednorodzinnego z garażem "
                     "wbudowanym, wraz z niezbędną infrastrukturą techniczną.",
        "zakres_zamierzenia": "Zakres obejmuje budowę budynku, wykonanie przyłączy, "
                              "utwardzeń, dojść i dojazdu oraz zagospodarowanie zielenią.",
        "stan_istniejacy": "Działka niezabudowana, uzbrojona w sieci: wodociągową, "
                           "kanalizacyjną i elektroenergetyczną. Teren płaski, "
                           "porośnięty trawą, bez zadrzewienia.",
        "zagospodarowanie": "Projektuje się budynek mieszkalny jednorodzinny, taras, "
                            "dojście do wejścia głównego, podjazd i miejsca postojowe.",
        "urzadzenia_sel": ["przyłącza i sieci uzbrojenia terenu",
                           "miejsca postojowe i utwardzenia",
                           "ogrodzenie i brama wjazdowa"],
        "scieki": SCIEKI[0],
        "wody_opadowe": WODY_OPADOWE[0],
        "dostep_drogi": DOSTEP_DROGI[0],
        "uzbrojenie_sel": ["woda", "kanalizacja", "energia"],
        "ksztaltowanie": "Teren płaski, rzędne 105,20–105,60 m n.p.m. "
                         "Ukształtowanie bez zmian.",
        "zielen": "Powierzchnia biologicznie czynna urządzona trawnikiem, "
                  "z nasadzeniami krzewów ozdobnych.",
        "zabytek": ZABYTEK[0],
        "obszar": OBSZAR_ODDZIALYWANIA[0],
        "mpzp_rodzaj": MPZP_RODZAJE[0],
        "mpzp_nazwa": "Uchwała Nr X/2020 Rady Miejskiej w Piasecznie z dnia 12.03.2020 r.",
        "mpzp_pow_zab": "30",
        "mpzp_pbc": "40",
        "mpzp_intens": "0,9",
        "mpzp_wys": "9",
    })
    data["pab"].update({
        "program": "Budynek jednorodzinny wolnostojący, parterowy z poddaszem "
                   "użytkowym, z garażem dwustanowiskowym w bryle budynku. "
                   "Program: wiatrołap, hall, salon z kuchnią, 3 sypialnie, "
                   "2 łazienki, pralnia, garaż.",
        "forma": "Bryła zwarta, dwukondygnacyjna, dach dwuspadowy o nachyleniu 35°, "
                 "pokrycie dachówką ceramiczną. Elewacja tynkowana w kolorze "
                 "jasnym, z elementami okładziny drewnianej.",
        "wykonczenie": "Wykończenie standardowe: tynki gipsowe, posadzki z płytek "
                       "i paneli, stolarka PVC, drzwi wewnętrzne płytowe.",
        "kubatura": "720,00",
        "pow_uzytkowa": "145,30",
        "pow_calkowita": "180,20",
        "wysokosc": "8,40",
        "dlugosc": "12,00",
        "szerokosc": "9,50",
        "kondygnacje": "2",
        "kondygnacje_podziemne": "0",
        "lokale_mieszkalne": "1",
        "lokale_uzytkowe": "0",
        "lokale_dostepne": "0",
        "miejsca_postojowe": "2",
        "geotechnika": "Warunki gruntowe proste. Podłoże stanowią piaski średnie "
                       "i gliny piaszczyste, woda gruntowa poniżej 2,0 m.",
        "posadowienie": "Ławy fundamentowe żelbetowe na poduszce piaskowej, "
                        "posadowione na głębokości 1,2 m.",
        "dost_dojscie": "Wejście główne od strony północnej, dojście utwardzone "
                        "o szerokości 1,5 m.",
        "dost_kondygnacje": "Komunikacja pionowa – schody wewnętrzne o szerokości "
                            "biegu 1,0 m.",
        "dost_pomieszczenia": "Drzwi o szerokości w świetle 0,9 m, bez progów.",
        "woda": "Zaopatrzenie w wodę z sieci wodociągowej.",
        "scieki": "Ścieki bytowe odprowadzane do sieci kanalizacji sanitarnej.",
        "emisje": "Brak istotnych emisji; źródłem ciepła pompa ciepła.",
        "odpady": "Odpady komunalne gromadzone w pojemnikach, odbiór przez "
                  "przedsiębiorstwo komunalne.",
        "akustyka": "Budynek nie zalicza się do obiektów uciążliwych akustycznie.",
        "energia_zapotrzebowanie": "Zapotrzebowanie na energię pierwotną "
                                   "EP = 55 kWh/(m²·rok).",
        "energia_nosniki": "Energia elektryczna – pompa ciepła.",
        "energia_system_konw": "Instalacja grzewcza wodna, niskotemperaturowa, "
                               "grzejniki płytowe i ogrzewanie podłogowe.",
        "energia_system_alt": "Instalacja fotowoltaiczna o mocy 6 kWp.",
        "instalacje_sel": ["wodkan", "co", "wentylacja", "elektryka", "odgromowa", "pv"],
        "ppoz": "Budynek niski (N), kategoria zagrożenia ludzi ZL IV. "
                "Klasa odporności pożarowej budynku – D.",
    })
    data["obiekty"] = [
        {"nazwa": "Budynek mieszkalny jednorodzinny", "rodzaj": "budynek",
         "pow_zab": "180,20", "wymiary": "12,0 × 9,5 m", "wysokosc": "8,40",
         "kondygnacje": "2", "uwagi": "garaż w bryle budynku"},
        {"nazwa": "Taras", "rodzaj": "budynek", "pow_zab": "25,00",
         "wymiary": "5,0 × 5,0 m", "wysokosc": "0,30", "kondygnacje": "0",
         "uwagi": "nawierzchnia drewniana"},
    ]
    data["bilans"] = [
        {"pozycja": KAT_ZABUDOWA, "kategoria": "zabudowa", "powierzchnia": "180,20"},
        {"pozycja": KAT_DROGI, "kategoria": "drogi", "powierzchnia": "220,00"},
        {"pozycja": KAT_PBC, "kategoria": "pbc", "powierzchnia": "849,80"},
    ]
    data["bioz"].update({
        "wymagany": True,
        "zakres_prac": "Budowa budynku mieszkalnego jednorodzinnego z garażem "
                       "wbudowanym, wykonanie przyłączy, utwardzeń, dojść i dojazdu "
                       "oraz zagospodarowanie terenu zielenią.",
        "kolejnosc": "1. Roboty przygotowawcze i zagospodarowanie placu budowy.\n"
                     "2. Wykopy i fundamenty.\n"
                     "3. Ściany kondygnacji parteru i poddasza.\n"
                     "4. Strop, dach i stolarka.\n"
                     "5. Instalacje wewnętrzne i przyłącza.\n"
                     "6. Elewacja, wykończenie i zagospodarowanie terenu.",
        "istniejace": "Działka niezabudowana. W rejonie inwestycji przebiegają sieci "
                      "wodociągowa, kanalizacyjna i elektroenergetyczna.",
        "elementy": "Przyłącza i sieci uzbrojenia terenu, utwardzenia, miejsca "
                    "postojowe, ogrodzenie z bramą wjazdową oraz zieleń urządzona.",
        "zagrozenia": "Upadek z wysokości podczas prac na dachu i rusztowaniach, "
                      "przysypanie w wykopach, uderzenie przez maszyny i elementy "
                      "budowlane, porażenie prądem w pobliżu sieci elektroenergetycznej, "
                      "zagrożenie pożarowe podczas prac spawalniczych.",
        "prace_niebezpieczne": ["wysokosc", "wykopy", "dzwigi", "energia"],
        "instruktaz": "Pracownicy przed przystąpieniem do robót przechodzą instruktaż "
                      "stanowiskowy oraz szkolenie BHP. Instruktaż powtarza się przy "
                      "zmianie technologii i przed pracami szczególnie niebezpiecznymi.",
        "srodki": "Wyznaczenie stref niebezpiecznych i ich ogrodzenie, stosowanie "
                  "środków ochrony zbiorowej i indywidualnej, nadzór kierownika budowy, "
                  "oznakowanie dróg komunikacyjnych i ewakuacyjnych, wyposażenie placu "
                  "budowy w sprzęt przeciwpożarowy i apteczkę.",
        "drogi": "Drogi ewakuacyjne i komunikacyjne wyznaczone na planie sytuacyjnym, "
                 "utrzymywane w stanie przejezdnym i oświetlone.",
        "uwagi": "Plan BIOZ należy aktualizować przed rozpoczęciem robót szczególnie "
                 "niebezpiecznych oraz w przypadku zmiany sposobu prowadzenia prac.",
    })
    data["dokumenty"] = _merge_dokumenty([
        {"klucz": "wniosek", "status": "Dołączony"},
        {"klucz": "oswiadczenie", "status": "Dołączony"},
        {"klucz": "projekt", "status": "Dołączony"},
        {"klucz": "bioz_info", "status": "Dołączony"},
        {"klucz": "bioz_plan", "status": "Do uzupełnienia",
         "uwagi": "Wymagany przed rozpoczęciem robót (art. 21a Prawa budowlanego); "
                  "nie jest załącznikiem do wniosku o pozwolenie na budowę."},
        {"klucz": "mapa", "status": "Dołączony"},
        {"klucz": "plan", "status": "Dołączony"},
        {"klucz": "warunki", "status": "Dołączony"},
        {"klucz": "uzgodnienia", "status": "Do uzupełnienia",
         "uwagi": "Oczekuje na opinię zarządcy drogi."},
        {"klucz": "srodowisko", "status": "Nie dotyczy",
         "uwagi": "Inwestycja niewymagająca decyzji środowiskowej."},
        {"klucz": "pelno", "status": "Dołączony"},
    ])
    data["zalaczniki"] = [
        {"nazwa": "Mapa do celów projektowych", "status": "Dołączony",
         "opis": "skala 1:500, aktualizacja 2026 r."},
        {"nazwa": "Wypis i wyrys z MPZP", "status": "Dołączony",
         "opis": "uchwała Nr X/2020 Rady Miejskiej w Piasecznie"},
        {"nazwa": "Warunki techniczne przyłączenia", "status": "Dołączony",
         "opis": "woda, kanalizacja, energia elektryczna"},
        {"nazwa": "Oświadczenie o prawie do dysponowania nieruchomością",
         "status": "Dołączony", "opis": "działki 123/4 i 123/5"},
        {"nazwa": "Pełnomocnictwo", "status": "Do uzupełnienia",
         "opis": "do uzupełnienia w przypadku działania pełnomocnika"},
    ]
    return data


# ---------------------------------------------------------------------------
# Pomocnicze
# ---------------------------------------------------------------------------

def s(data: dict, section: str, key: str, default: str = "") -> str:
    val = (data.get(section) or {}).get(key, default)
    if val is None:
        return default
    return str(val).strip()


def b(data: dict, section: str, key: str) -> bool:
    val = (data.get(section) or {}).get(key, False)
    return bool(val)


def number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    txt = str(value).strip().replace("\u00a0", "").replace(" ", "").replace(",", ".")
    if not txt:
        return None
    try:
        return float(txt)
    except ValueError:
        return None


def n(data: dict, section: str, key: str) -> float | None:
    return number((data.get(section) or {}).get(key))


def pl_num(x: float, dec: int = 2) -> str:
    txt = f"{x:,.{dec}f}".replace(",", "\u00a0").replace(".", ",")
    return txt


def area(x: float | None, dec: int = 2, dash: str = "—") -> str:
    if x is None:
        return dash
    return f"{pl_num(x, dec)} m²"


def pct(part: float, whole: float) -> str:
    if not whole:
        return "—"
    return f"{pl_num(part / whole * 100, 1)}%"


def val(data: dict, section: str, key: str, placeholder: str = "[uzupełnić]") -> str:
    txt = s(data, section, key)
    return txt if txt else placeholder


def join_pl(items: list[str], conj: str = "oraz") -> str:
    items = [x for x in items if x]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + f" {conj} " + items[-1]


def sentence(txt: str) -> str:
    txt = (txt or "").strip()
    if not txt:
        return ""
    if txt[-1] not in ".!?:":
        txt += "."
    return txt


def capitalize(txt: str) -> str:
    if not txt:
        return txt
    return txt[0].upper() + txt[1:]


def object_noun(kind: str) -> str:
    low = kind.lower()
    if "liniowy" in low or "sieć" in low:
        return "obiektu liniowego"
    if "budynek" in low:
        return "budynku"
    return "obiektu budowlanego"


def plot_label(data: dict) -> str:
    dzialki = s(data, "ogolne", "dzialki")
    if dzialki:
        return f"działce/działkach nr {dzialki}"
    return "działce"


def address_line(data: dict) -> str:
    adres = s(data, "ogolne", "adres")
    obreb = s(data, "ogolne", "obreb")
    jedn = s(data, "ogolne", "jednostka")
    parts = []
    if adres:
        parts.append(adres)
    loc = []
    if obreb:
        loc.append(f"obręb {obreb}")
    if jedn:
        loc.append(f"jednostka ewidencyjna {jedn}")
    if loc:
        parts.append(", ".join(loc))
    return ", ".join(parts)


def data_dnia(data: dict) -> str:
    return s(data, "ogolne", "data") or _dt.date.today().strftime("%d.%m.%Y")


# ---------------------------------------------------------------------------
# Bloki dokumentu
# ---------------------------------------------------------------------------

def h1(x: str) -> dict:
    return {"t": "h1", "x": x}


def h2(x: str) -> dict:
    return {"t": "h2", "x": x}


def p(x: str) -> dict:
    return {"t": "p", "x": x}


def ul(items: list[str]) -> dict:
    return {"t": "ul", "items": [i for i in items if i]}


def ol(items: list[str]) -> dict:
    return {"t": "ol", "items": [i for i in items if i]}


def table(head: list[str], rows: list[list[str]], widths: list[float] | None = None,
          caption: str = "") -> dict:
    return {"t": "table", "head": head, "rows": rows, "widths": widths, "caption": caption}


def note(x: str) -> dict:
    return {"t": "note", "x": x}


def pagebreak() -> dict:
    return {"t": "pagebreak"}


def sign(*lines: str) -> dict:
    """Blok podpisu – wyrównany do prawej, bez obramowania."""
    return {"t": "sign", "lines": [x for x in lines if x]}


@dataclass
class Doc:
    kind: str
    title: str
    element: str
    blocks: list[dict] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Obliczenia bilansu
# ---------------------------------------------------------------------------

def bilans_totals(data: dict) -> dict[str, float]:
    totals = {"zabudowa": 0.0, "drogi": 0.0, "pbc": 0.0, "inne": 0.0}
    for row in data.get("bilans") or []:
        key = str(row.get("kategoria") or "inne")
        amt = number(row.get("powierzchnia")) or 0.0
        if key not in totals:
            key = "inne"
        totals[key] += amt
    return totals


def bilans_sum(data: dict) -> float:
    return sum(bilans_totals(data).values())


def build_indices(data: dict) -> dict[str, Any]:
    plot = n(data, "ogolne", "pow_dzialki")
    t = bilans_totals(data)
    total = sum(t.values())
    out: dict[str, Any] = {
        "plot": plot,
        "total": total,
        "zabudowa": t["zabudowa"],
        "drogi": t["drogi"],
        "pbc": t["pbc"],
        "inne": t["inne"],
        "pct_zabudowa": (t["zabudowa"] / plot * 100) if plot else None,
        "pct_drogi": (t["drogi"] / plot * 100) if plot else None,
        "pct_pbc": (t["pbc"] / plot * 100) if plot else None,
        "pct_inne": (t["inne"] / plot * 100) if plot else None,
        "pow_calkowita": n(data, "pab", "pow_calkowita"),
        "intensywnosc": None,
        "mpzp_pow_zab": n(data, "pzt", "mpzp_pow_zab"),
        "mpzp_pbc": n(data, "pzt", "mpzp_pbc"),
        "mpzp_intens": n(data, "pzt", "mpzp_intens"),
    }
    if plot and out["pow_calkowita"]:
        out["intensywnosc"] = out["pow_calkowita"] / plot
    return out


def bilans_table_rows(data: dict) -> list[list[str]]:
    plot = n(data, "ogolne", "pow_dzialki")
    rows = []
    lp = 0
    for row in data.get("bilans") or []:
        amt = number(row.get("powierzchnia")) or 0.0
        if amt == 0 and not str(row.get("pozycja") or "").strip():
            continue
        lp += 1
        rows.append([
            str(lp),
            str(row.get("pozycja") or ""),
            area(amt),
            pct(amt, plot) if plot else "—",
        ])
    return rows


# ---------------------------------------------------------------------------
# PROJEKT ZAGOSPODAROWANIA DZIAŁKI LUB TERENU
# ---------------------------------------------------------------------------

def _mpzp_text(data: dict) -> str:
    rodzaj = s(data, "pzt", "mpzp_rodzaj")
    nazwa = s(data, "pzt", "mpzp_nazwa")
    if not rodzaj and not nazwa:
        return ("Sposób zagospodarowania terenu określono w oparciu o ustalenia "
                "miejscowego planu zagospodarowania przestrzennego / decyzji o warunkach "
                "zabudowy – [uzupełnić oznaczenie aktu].")
    rodzaj = rodzaj.rstrip(" .")
    nazwa = nazwa.rstrip(" .")
    if nazwa:
        return f"Ustalenia dla przedmiotowego terenu wynikają z: {rodzaj} – {nazwa}."
    return f"Ustalenia dla przedmiotowego terenu wynikają z: {rodzaj}."


def _limits_sentence(data: dict, idx: dict) -> str:
    parts = []
    if idx.get("mpzp_pow_zab") is not None:
        parts.append(f"maksymalna powierzchnia zabudowy {pl_num(idx['mpzp_pow_zab'], 1)}%")
    if idx.get("mpzp_pbc") is not None:
        parts.append(f"minimalna powierzchnia biologicznie czynna {pl_num(idx['mpzp_pbc'], 1)}%")
    if idx.get("mpzp_intens") is not None:
        parts.append(f"maksymalna intensywność zabudowy {pl_num(idx['mpzp_intens'], 2)}")
    wys = n(data, "pzt", "mpzp_wys")
    if wys is not None:
        parts.append(f"maksymalna wysokość zabudowy {pl_num(wys, 1)} m")
    if not parts:
        return ""
    return "Parametry ustalone dla terenu: " + join_pl(parts) + "."


def _compliance(data: dict, idx: dict) -> list[str]:
    lines = []
    if idx.get("mpzp_pow_zab") is not None and idx.get("pct_zabudowa") is not None:
        ok = idx["pct_zabudowa"] <= idx["mpzp_pow_zab"] + 1e-9
        lines.append(
            f"powierzchnia zabudowy – projektowana {pl_num(idx['pct_zabudowa'], 1)}%, "
            f"dopuszczalna {pl_num(idx['mpzp_pow_zab'], 1)}% – "
            + ("zgodna z ustaleniami." if ok else "PRZEKROCZENIE – wymaga korekty projektu.")
        )
    if idx.get("mpzp_pbc") is not None and idx.get("pct_pbc") is not None:
        ok = idx["pct_pbc"] >= idx["mpzp_pbc"] - 1e-9
        lines.append(
            f"powierzchnia biologicznie czynna – projektowana {pl_num(idx['pct_pbc'], 1)}%, "
            f"wymagana minimum {pl_num(idx['mpzp_pbc'], 1)}% – "
            + ("zgodna z ustaleniami." if ok else "NIEDOBÓR – wymaga korekty projektu.")
        )
    if idx.get("mpzp_intens") is not None and idx.get("intensywnosc") is not None:
        ok = idx["intensywnosc"] <= idx["mpzp_intens"] + 1e-9
        lines.append(
            f"intensywność zabudowy – projektowana {pl_num(idx['intensywnosc'], 2)}, "
            f"dopuszczalna {pl_num(idx['mpzp_intens'], 2)} – "
            + ("zgodna z ustaleniami." if ok else "PRZEKROCZENIE – wymaga korekty projektu.")
        )
    return lines


def build_pzt(data: dict) -> Doc:
    data = merge_defaults(data)
    o = data["ogolne"]
    idx = build_indices(data)
    totals = bilans_totals(data)

    doc = Doc(
        kind="PZT",
        title="Projekt zagospodarowania działki lub terenu – część opisowa",
        element="PROJEKT ZAGOSPODAROWANIA DZIAŁKI LUB TERENU",
        meta={
            "element": "PROJEKT ZAGOSPODAROWANIA DZIAŁKI LUB TERENU",
            "part": "CZĘŚĆ OPISOWA",
            "nazwa": o["nazwa"] or "[nazwa zamierzenia budowlanego]",
            "adres": address_line(data) or "[adres inwestycji]",
            "kategoria": o["kategoria"],
            "dzialki": o["dzialki"] or "[nr działek]",
            "inwestor": o["inwestor"] or "[inwestor]",
            "inwestor_adres": o["inwestor_adres"],
            "data": data_dnia(data),
            "projektant": o["projektant"] or "[imię i nazwisko projektanta]",
            "projektanci": projektanci_list(o),
            "specjalnosc": o["specjalnosc"],
            "uprawnienia": o["uprawnienia"] or "[nr uprawnień]",
            "zakres": o["zakres"],
            "tom": o["tom"],
            "nr_projektu": o["nr_projektu"],
            "sprawdzajacy": o["sprawdzajacy"],
            "sprawdzajacy_uprawnienia": o["sprawdzajacy_uprawnienia"],
        },
    )
    B = doc.blocks

    # --- Podstawa opracowania -------------------------------------------
    B.append(h1("1. Podstawa opracowania"))
    B.append(p(
        "Niniejszy projekt zagospodarowania działki lub terenu sporządzono na podstawie "
        "następujących dokumentów i przepisów:"
    ))
    bases = [
        "ustawa z dnia 7 lipca 1994 r. – Prawo budowlane (Dz. U. z 2026 r. poz. 524 ze zm.),",
        "rozporządzenie Ministra Rozwoju z dnia 11 września 2020 r. w sprawie szczegółowego "
        "zakresu i formy projektu budowlanego (Dz. U. z 2022 r. poz. 1679, z 2023 r. poz. 2405 "
        "oraz z 2026 r. poz. 597),",
        "rozporządzenie Ministra Infrastruktury z dnia 12 kwietnia 2002 r. w sprawie warunków "
        "technicznych, jakim powinny odpowiadać budynki i ich usytuowanie "
        "(Dz. U. z 2022 r. poz. 1225 ze zm.),",
        "ustawa z dnia 27 marca 2003 r. o planowaniu i zagospodarowaniu przestrzennym "
        "(tekst jednolity z późn. zm.),",
    ]
    if b(data, "pab", "ochrona_ludnosci"):
        bases.append(
            "ustawa z dnia 5 grudnia 2024 r. o ochronie ludności i obronie cywilnej "
            "(Dz. U. z 2024 r. poz. 1907 ze zm.)."
        )
    bases.extend([
        _mpzp_text(data),
        "mapa do celów projektowych oraz wypis i wyrys z ewidencji gruntów i budynków,",
        "opinia geotechniczna o warunkach gruntowych,",
        "warunki techniczne przyłączenia do sieci uzbrojenia terenu oraz uzgodnienia branżowe.",
    ])
    B.append(ul(bases))

    # --- 1. Przedmiot ----------------------------------------------------
    B.append(h1("2. Przedmiot i zakres zamierzenia budowlanego (§ 14 pkt 1)"))
    nazwa = (o["nazwa"] or "[nazwa zamierzenia budowlanego]").rstrip(" .")
    B.append(p(f"Przedmiotem zamierzenia budowlanego jest: {nazwa}."))
    B.append(p(
        f"Zamierzenie zlokalizowane jest na {plot_label(data)}"
        + (f", {s(data, 'ogolne', 'adres')}" if s(data, "ogolne", "adres") else "")
        + (f", obręb {s(data, 'ogolne', 'obreb')}" if s(data, "ogolne", "obreb") else "")
        + (f", jednostka ewidencyjna {s(data, 'ogolne', 'jednostka')}"
           if s(data, "ogolne", "jednostka") else "")
        + "."
    ))
    B.append(p(
        f"Rodzaj obiektu budowlanego: {o['rodzaj']}. Kategorię obiektu budowlanego określa się "
        f"jako: {o['kategoria']}."
    ))
    przedmiot = s(data, "pzt", "przedmiot")
    if przedmiot:
        B.append(p(sentence(przedmiot)))

    obiekty = data.get("obiekty") or []
    if obiekty:
        B.append(p("Zakres całego zamierzenia budowlanego obejmuje następujące obiekty:"))
        rows = []
        for i, ob in enumerate(obiekty, 1):
            rows.append([
                str(i), str(ob.get("nazwa") or ""), str(ob.get("rodzaj") or ""),
                area(number(ob.get("pow_zab")), 2, "—"),
                (f"{pl_num(number(ob.get('kubatura')), 0)} m³"
                 if number(ob.get("kubatura")) else "—"),
                str(ob.get("kondygnacje") or "—"),
                str(ob.get("uwagi") or ""),
            ])
        B.append(table(
            ["Lp.", "Nazwa obiektu", "Rodzaj", "Pow. zabudowy", "Kubatura", "Kondygnacje", "Uwagi"],
            rows, widths=[0.06, 0.26, 0.20, 0.16, 0.14, 0.10, 0.18],
        ))
    zakres = s(data, "pzt", "zakres_zamierzenia")
    if zakres:
        B.append(p(sentence(zakres)))
    else:
        B.append(p(
            "Zakres opracowania obejmuje swoim działaniem obszar działki wskazanej w metryce "
            "projektu, wraz z niezbędnymi przyłączami i urządzeniami budowlanymi związanymi "
            "z projektowanym obiektem, w granicach określonych w części rysunkowej."
        ))
    B.append(p(
        f"Inwestorem zamierzenia budowlanego jest {o['inwestor'] or '[inwestor]'}"
        + (f", {o['inwestor_adres']}." if o["inwestor_adres"] else ".")
    ))

    # --- 2. Stan istniejący ---------------------------------------------
    B.append(h1("3. Istniejący stan zagospodarowania działki lub terenu (§ 14 pkt 2)"))
    stan = s(data, "pzt", "stan_istniejacy")
    if stan:
        B.append(p(sentence(stan)))
    else:
        plot = idx.get("plot")
        B.append(p(
            f"Działka{o['dzialki'] and ' nr ' + o['dzialki'] or ''} o powierzchni "
            f"{area(plot) if plot else '[powierzchnia]'} jest zagospodarowana zgodnie z jej "
            "dotychczasowym sposobem użytkowania. Na terenie działki znajdują się istniejące "
            "obiekty budowlane, urządzenia budowlane oraz sieci uzbrojenia terenu, "
            "przedstawione w części rysunkowej projektu na mapie do celów projektowych."
        ))
    if b(data, "pzt", "rozbiorka"):
        B.append(p(
            "W ramach zamierzenia budowlanego przewiduje się rozbiórkę istniejących obiektów "
            "budowlanych: " + (sentence(s(data, "pzt", "rozbiorka_opis"))
                               if s(data, "pzt", "rozbiorka_opis") else "[uzupełnić zakres rozbiórki].")
        ))
    else:
        B.append(p(
            "Nie przewiduje się rozbiórki istniejących obiektów budowlanych, z wyjątkiem "
            "elementów, których likwidacja wynika bezpośrednio z zakresu robót ujętego "
            "w projekcie (jeżeli występują – wskazano w części rysunkowej)."
        ))

    # --- 3. Projektowane zagospodarowanie -------------------------------
    B.append(h1("4. Projektowane zagospodarowanie działki lub terenu (§ 14 pkt 3)"))
    zag = s(data, "pzt", "zagospodarowanie")
    if zag:
        B.append(p(sentence(zag)))
    else:
        B.append(p(
            f"Projektowane zagospodarowanie terenu polega na realizacji: {nazwa}, wraz "
            "z niezbędnymi urządzeniami budowlanymi, układem komunikacyjnym, miejscami "
            "postojowymi oraz przyłączami do sieci uzbrojenia terenu. Usytuowanie obiektu "
            "i urządzeń budowlanych określa część rysunkowa projektu."
        ))

    B.append(h2("4.1. Urządzenia budowlane związane z obiektem (§ 14 pkt 3 lit. a)"))
    urz_sel = [label for key, label in URZADZENIA if key in (s(data, "pzt", "urzadzenia_sel") or [])] \
        if isinstance(s(data, "pzt", "urzadzenia_sel"), list) else []
    if not urz_sel:
        # domyślna lista na podstawie opisu
        urz_sel = ["przyłącza i sieci uzbrojenia terenu", "miejsca postojowe i utwardzenia"]
    B.append(p(
        "Z projektowanym obiektem związane będą następujące urządzenia budowlane: "
        + join_pl(urz_sel) + "."
    ))
    if s(data, "pzt", "urzadzenia"):
        B.append(p(sentence(s(data, "pzt", "urzadzenia"))))
    B.append(p(
        "Urządzenia budowlane zlokalizowano w obrębie działki, w sposób umożliwiający "
        "prawidłowe funkcjonowanie obiektu oraz dostęp do nich dla celów eksploatacyjnych."
    ))

    B.append(h2("4.2. Odprowadzanie lub oczyszczanie ścieków (§ 14 pkt 3 lit. b)"))
    scieki = s(data, "pzt", "scieki")
    scieki_map = {
        SCIEKI[0]: "Ścieki bytowe odprowadzane będą do istniejącej sieci kanalizacji sanitarnej, "
                   "na podstawie warunków technicznych przyłączenia wydanych przez właściwego "
                   "przedsiębiorcę wodociągowo-kanalizacyjnego.",
        SCIEKI[1]: "Ścieki bytowe odprowadzane będą do szczelnego zbiornika bezodpływowego, "
                   "opróżnianego przez uprawnionego przedsiębiorcę posiadającego zezwolenie "
                   "na opróżnianie zbiorników bezodpływowych i transport nieczystości ciekłych.",
        SCIEKI[2]: "Ścieki bytowe odprowadzane będą do przydomowej oczyszczalni ścieków, "
                   "projektowanej i eksploatowanej zgodnie z przepisami odrębnymi.",
        SCIEKI[3]: "Ścieki odprowadzane będą do instalacji wewnętrznej z odprowadzeniem "
                   "pośrednim, zgodnie z rozwiązaniami przyjętymi w projekcie technicznym.",
    }
    B.append(p(scieki_map.get(scieki, sentence(scieki) if scieki else
                              "Sposób odprowadzania ścieków – [uzupełnić].")))
    if s(data, "pzt", "scieki_opis"):
        B.append(p(sentence(s(data, "pzt", "scieki_opis"))))

    woda_op = s(data, "pzt", "wody_opadowe")
    woda_map = {
        WODY_OPADOWE[0]: "Wody opadowe i roztopowe zagospodarowane będą na terenie działki "
                          "poprzez rozsączenie do gruntu, w granicach nieruchomości, bez "
                          "odprowadzania na tereny sąsiednie.",
        WODY_OPADOWE[1]: "Wody opadowe i roztopowe odprowadzane będą do sieci kanalizacji "
                          "deszczowej, na podstawie warunków technicznych przyłączenia.",
        WODY_OPADOWE[2]: "Wody opadowe i roztopowe retencjonowane będą w zbiorniku retencyjnym "
                          "i wykorzystywane do nawadniania terenów zieleni.",
        WODY_OPADOWE[3]: "Wody opadowe i roztopowe odprowadzane będą na teren nieutwardzony "
                          "w granicach działki, z zachowaniem naturalnej retencji gruntu.",
    }
    B.append(p(woda_map.get(woda_op, sentence(woda_op) if woda_op else
                            "Sposób odprowadzania wód opadowych – [uzupełnić].")))
    if s(data, "pzt", "wody_opadowe_opis"):
        B.append(p(sentence(s(data, "pzt", "wody_opadowe_opis"))))

    B.append(h2("4.3. Układ komunikacyjny (§ 14 pkt 3 lit. c)"))
    kom = s(data, "pzt", "komunikacja")
    if kom:
        B.append(p(sentence(kom)))
    else:
        B.append(p(
            "Obsługa komunikacyjna działki odbywać się będzie poprzez istniejący zjazd z drogi "
            "publicznej. W obrębie działki przewiduje się dojścia i dojazdy o nawierzchni "
            "utwardzonej, zapewniające dostęp do projektowanego obiektu oraz do miejsc "
            "postojowych. Układ komunikacyjny i parametry nawierzchni przedstawiono w części "
            "rysunkowej projektu."
        ))

    B.append(h2("4.4. Sposób dostępu do drogi publicznej (§ 14 pkt 3 lit. d)"))
    dost = s(data, "pzt", "dostep_drogi")
    B.append(p(
        f"Dostęp do drogi publicznej zapewniony jest {dost.lower() if dost else '[uzupełnić]'}."
        + (f" {sentence(s(data, 'pzt', 'dostep_opis'))}" if s(data, "pzt", "dostep_opis") else "")
    ))

    B.append(h2("4.5. Parametry techniczne sieci i urządzeń uzbrojenia terenu "
                "(§ 14 pkt 3 lit. e)"))
    uz_sel = s(data, "pzt", "uzbrojenie_sel")
    if not isinstance(uz_sel, list):
        uz_sel = []
    uz_nazwy = [label for key, label in UZBROJENIE if key in uz_sel]
    if uz_nazwy:
        B.append(p("Projektowane i istniejące uzbrojenie terenu obejmuje: "
                   + join_pl(uz_nazwy) + "."))
        B.append(ul([
            "przyłącza projektowane są w nawiązaniu do istniejących sieci, na podstawie "
            "warunków technicznych wydanych przez gestorów sieci;",
            "parametry techniczne sieci i przyłączy (średnice, materiał, spadki, rzędne) "
            "określono w części rysunkowej oraz w projekcie technicznym;",
            "w miejscach kolizji z istniejącym uzbrojeniem przewidziano odpowiednie "
            "zabezpieczenia, zgodnie z uzgodnieniami branżowymi.",
        ]))
    else:
        B.append(p("Zakres uzbrojenia terenu – [uzupełnić]."))
    if s(data, "pzt", "uzbrojenie_opis"):
        B.append(p(sentence(s(data, "pzt", "uzbrojenie_opis"))))

    B.append(h2("4.6. Ukształtowanie terenu i układ zieleni (§ 14 pkt 3 lit. f)"))
    if s(data, "pzt", "ksztaltowanie"):
        B.append(p(sentence(s(data, "pzt", "ksztaltowanie"))))
    else:
        B.append(p(
            "Ukształtowanie terenu nie ulega istotnym zmianom. Projektowane rzędne terenu "
            "nawiązują do istniejącej konfiguracji i zapewniają prawidłowe odwodnienie "
            "działki. Zmiany ukształtowania, jeżeli występują, przedstawiono w części "
            "rysunkowej wraz z przekrojami pionowymi."
        ))
    if s(data, "pzt", "zielen"):
        B.append(p(sentence(s(data, "pzt", "zielen"))))
    else:
        B.append(p(
            "Na terenie działki przewiduje się zachowanie istniejącej zieleni oraz "
            "wprowadzenie zieleni urządzonej (niskiej i średniej) w części nieprzeznaczonej "
            "pod zabudowę i utwardzenia. Elementy zieleni przeznaczone do likwidacji "
            "oznaczono w części rysunkowej."
        ))

    # --- 4. Bilans -------------------------------------------------------
    B.append(h1("5. Zestawienie powierzchni – bilans terenu (§ 14 pkt 4)"))
    B.append(p(
        "Zestawienie powierzchni sporządzono dla obszaru objętego opracowaniem. "
        "Powierzchnię zabudowy budynku pomniejszono o powierzchnię części zewnętrznych "
        "budynku, takich jak tarasy naziemne i podparte słupami, gzymsy oraz balkony."
    ))
    rows = bilans_table_rows(data)
    if rows:
        rows.append(["", "RAZEM", area(idx["total"]), pct(idx["total"], idx["plot"]) if idx["plot"] else "—"])
        B.append(table(
            ["Lp.", "Rodzaj powierzchni", "Powierzchnia", "Udział w działce"],
            rows, widths=[0.08, 0.58, 0.18, 0.16],
        ))
    else:
        B.append(p("[Uzupełnić bilans terenu w formularzu – brak pozycji.]"))

    B.append(p("Zestawienie zbiorcze:"))
    B.append(ul([
        f"powierzchnia działki: {area(idx['plot']) if idx['plot'] else '[uzupełnić]'}",
        f"powierzchnia zabudowy: {area(totals['zabudowa'])}"
        + (f" ({pct(totals['zabudowa'], idx['plot'])})" if idx["plot"] else ""),
        f"powierzchnia dróg, parkingów, placów i chodników: {area(totals['drogi'])}"
        + (f" ({pct(totals['drogi'], idx['plot'])})" if idx["plot"] else ""),
        f"powierzchnia biologicznie czynna: {area(totals['pbc'])}"
        + (f" ({pct(totals['pbc'], idx['plot'])})" if idx["plot"] else ""),
        f"powierzchnia innych części terenu: {area(totals['inne'])}",
        f"suma powierzchni: {area(idx['total'])}",
    ]))
    if idx["plot"] and abs(idx["total"] - idx["plot"]) > 0.5:
        B.append(note(
            f"Uwaga: suma powierzchni w bilansie ({area(idx['total'])}) różni się od "
            f"powierzchni działki ({area(idx['plot'])}) o {area(abs(idx['total'] - idx['plot']))}. "
            "Bilans wymaga uzupełnienia lub korekty."
        ))
    lim = _limits_sentence(data, idx)
    if lim:
        B.append(p(lim))
    comp = _compliance(data, idx)
    if comp:
        B.append(p("Ocena zgodności z parametrami:"))
        B.append(ul(comp))
    if idx.get("intensywnosc") is not None:
        B.append(p(
            f"Intensywność zabudowy, rozumiana jako stosunek powierzchni całkowitej zabudowy "
            f"do powierzchni działki, wynosi {pl_num(idx['intensywnosc'], 2)}."
        ))

    # --- 5. Ograniczenia -------------------------------------------------
    B.append(h1("6. Ograniczenia, ochrona zabytków i wpływy górnicze (§ 14 pkt 5)"))
    B.append(h2("6.1. Ograniczenia i zakazy w zabudowie i zagospodarowaniu terenu "
                "(§ 14 pkt 5 lit. a)"))
    B.append(p(_mpzp_text(data)))
    if b(data, "pzt", "ograniczenia") or s(data, "pzt", "ograniczenia_opis"):
        B.append(p(
            "Występują następujące ograniczenia lub zakazy w zabudowie i zagospodarowaniu "
            "terenu: " + (sentence(s(data, "pzt", "ograniczenia_opis")) if
                          s(data, "pzt", "ograniczenia_opis") else "[uzupełnić].")
        ))
    else:
        B.append(p(
            "Nie stwierdzono innych ograniczeń ani zakazów w zabudowie i zagospodarowaniu "
            "terenu, poza wynikającymi z przepisów powszechnie obowiązujących oraz ustaleń "
            "wskazanych powyżej."
        ))

    B.append(h2("6.2. Ochrona zabytków (§ 14 pkt 5 lit. b)"))
    zab = s(data, "pzt", "zabytek")
    if zab and zab != ZABYTEK[0]:
        B.append(p(
            f"Teren objęty jest ochroną konserwatorską – {zab}. "
            + (sentence(s(data, "pzt", "zabytek_opis")) if s(data, "pzt", "zabytek_opis") else
               "Projektowane rozwiązania uwzględniają wymagania właściwego wojewódzkiego "
               "konserwatora zabytków.")
        ))
    else:
        B.append(p(
            "Działka, na której projektowany jest obiekt budowlany, nie jest wpisana do "
            "rejestru zabytków ani do gminnej ewidencji zabytków. Zamierzenie budowlane nie "
            "jest lokalizowane na obszarze objętym ochroną konserwatorską."
        ))

    B.append(h2("6.3. Wpływ eksploatacji górniczej (§ 14 pkt 5 lit. c)"))
    if b(data, "pzt", "gorniczy") or s(data, "pzt", "gorniczy_opis"):
        B.append(p(
            "Zamierzenie budowlane zlokalizowane jest w granicach terenu górniczego. "
            + (sentence(s(data, "pzt", "gorniczy_opis")) if s(data, "pzt", "gorniczy_opis") else
               "[uzupełnić wpływ eksploatacji górniczej na działkę i obiekt].")
        ))
    else:
        B.append(p(
            "Zamierzenie budowlane nie znajduje się w granicach terenu górniczego, w związku "
            "z czym nie występuje wpływ eksploatacji górniczej na działkę lub teren."
        ))

    B.append(h2("6.4. Charakter i cechy zagrożeń dla środowiska oraz higieny i zdrowia "
                "(§ 14 pkt 5 lit. d)"))
    if s(data, "pzt", "srodowisko"):
        B.append(p(sentence(s(data, "pzt", "srodowisko"))))
    else:
        B.append(p(
            "Projektowane rozwiązania przestrzenne, funkcjonalne i techniczne nie powodują "
            "istotnego zagrożenia dla środowiska oraz higieny i zdrowia użytkowników obiektu "
            "i jego otoczenia. Oddziaływanie obiektu ogranicza się do typowych emisji "
            "związanych z jego przeznaczeniem i zostało przeanalizowane w projekcie "
            "architektoniczno-budowlanym oraz w projekcie technicznym. Gospodarka odpadami, "
            "ściekami i wodami opadowymi prowadzona będzie zgodnie z przepisami odrębnymi."
        ))

    # --- 6. Ppoż ---------------------------------------------------------
    B.append(h1("7. Warunki ochrony przeciwpożarowej (§ 14 pkt 6)"))
    if b(data, "pzt", "ppoz_drogi") or s(data, "pzt", "ppoz_drogi_opis"):
        B.append(p(
            "Do obiektu zapewniona jest droga pożarowa. "
            + (sentence(s(data, "pzt", "ppoz_drogi_opis")) if s(data, "pzt", "ppoz_drogi_opis")
               else "[uzupełnić parametry drogi pożarowej: szerokość, nośność, promienie skrętu].")
        ))
    else:
        B.append(p(
            "Dla projektowanego obiektu, zgodnie z § 12 rozporządzenia w sprawie warunków "
            "technicznych, jakim powinny odpowiadać budynki i ich usytuowanie, nie jest "
            "wymagane zapewnienie drogi pożarowej. Dojazd dla służb ratowniczych zapewniony "
            "jest z drogi publicznej."
        ))
    B.append(p(
        "Zaopatrzenie w wodę do celów przeciwpożarowych: "
        + (sentence(s(data, "pzt", "ppoz_woda")) if s(data, "pzt", "ppoz_woda") else
           "z istniejącej sieci wodociągowej, poprzez hydranty zewnętrzne – [uzupełnić "
           "lokalizację i wydajność].")
        + " Usytuowanie hydrantów i punktów poboru wody oraz dojazdy dla pojazdów pożarniczych "
          "przedstawiono w części rysunkowej."
    ))

    # --- 7. Inne ---------------------------------------------------------
    B.append(h1("8. Inne niezbędne dane (§ 14 pkt 7)"))
    if s(data, "pzt", "inne"):
        B.append(p(sentence(s(data, "pzt", "inne"))))
    else:
        B.append(p(
            "Nie występują inne niezbędne dane wynikające ze specyfiki, charakteru i stopnia "
            "skomplikowania obiektu budowlanego lub robót budowlanych, poza przedstawionymi "
            "w niniejszym opracowaniu."
        ))
    if b(data, "pzt", "etapowanie"):
        B.append(p(
            "Zamierzenie budowlane realizowane będzie etapowo. Kolejność realizacji "
            "poszczególnych obiektów wraz z odpowiadającymi im częściami terenu: "
            + (sentence(s(data, "pzt", "etapy")) if s(data, "pzt", "etapy") else
               "[uzupełnić etapy realizacji].")
            + " Przyjęta kolejność umożliwia użytkowanie obiektów zgodnie z przeznaczeniem "
              "po zakończeniu każdego etapu."
        ))

    # --- 8. Obszar oddziaływania ----------------------------------------
    B.append(h1("9. Informacja o obszarze oddziaływania obiektu (§ 14 pkt 8 i § 18)"))
    B.append(p(
        "Obszar oddziaływania obiektu określono na podstawie następujących przepisów prawa:"
    ))
    przep = s(data, "pzt", "obszar_przepisy")
    if przep:
        B.append(p(sentence(przep)))
    else:
        B.append(ul([
            "rozporządzenie Ministra Infrastruktury z dnia 12 kwietnia 2002 r. w sprawie "
            "warunków technicznych, jakim powinny odpowiadać budynki i ich usytuowanie "
            "(Dz. U. z 2022 r. poz. 1225 ze zm.), w szczególności w zakresie odległości "
            "budynków od granic działki, przesłaniania oraz nasłonecznienia,",
            "przepisy dotyczące ochrony przeciwpożarowej, w tym warunki techniczne "
            "usytuowania budynków ze względu na bezpieczeństwo pożarowe,",
            "przepisy dotyczące ochrony środowiska, ochrony przyrody, gospodarki wodnej "
            "i gospodarki odpadami,",
            "przepisy dotyczące dróg publicznych i dostępu do drogi publicznej,",
            "przepisy dotyczące ochrony zabytków i opieki nad zabytkami – w zakresie, "
            "w jakim mają zastosowanie.",
        ]))
    obszar = s(data, "pzt", "obszar")
    if "w całości" in obszar.lower():
        B.append(p(
            "Obszar oddziaływania obiektu mieści się w całości na działce lub działkach, "
            "na których został zaprojektowany."
        ))
    else:
        B.append(p(
            f"Obszar oddziaływania obiektu: {obszar or '[uzupełnić]'}. "
            + (sentence(s(data, "pzt", "obszar_opis")) if s(data, "pzt", "obszar_opis") else
               "Zasięg obszaru oddziaływania przedstawiono w części rysunkowej projektu.")
        ))
    if s(data, "pzt", "obszar_opis") and "w całości" in obszar.lower():
        B.append(p(sentence(s(data, "pzt", "obszar_opis"))))

    # --- 6a. Ochrona ludności -------------------------------------------
    if b(data, "pab", "ochrona_ludnosci"):
        B.append(h1("10. Warunki ochrony ludności (§ 14 pkt 6a)"))
        B.append(p(
            "Projektowany obiekt jest obiektem zbiorowej ochrony w rozumieniu ustawy z dnia "
            "5 grudnia 2024 r. o ochronie ludności i obronie cywilnej. W projekcie "
            "zagospodarowania działki lub terenu uwzględniono następujące informacje i dane:"
        ))
        B.append(ul([
            f"usytuowanie obiektu: {s(data, 'pab', 'ol_usytuowanie') or '[uzupełnić]'}; "
            "odległości od obiektów, o których mowa w załączniku nr 2 do rozporządzenia "
            "Ministra Spraw Wewnętrznych i Administracji z dnia 4 listopada 2025 r. "
            "(Dz. U. poz. 1548) – zgodnie z częścią rysunkową;",
            f"usytuowanie wyjść ewakuacyjnych i wyjść zapasowych w stosunku do strefy "
            f"prognozowanego zagruzowania: {s(data, 'pab', 'ol_wyjscia') or '[uzupełnić]'};",
            f"wysokość budynku przyjęta na potrzeby określenia strefy prognozowanego "
            f"zagruzowania: {s(data, 'pab', 'ol_wysokosc') or '[uzupełnić]'}.",
        ]))
        B.append(p(
            "Elementy dotyczące obiektu zbiorowej ochrony – oznaczenie wyjść ewakuacyjnych, "
            "wyjść zapasowych oraz stref prognozowanego zagruzowania – przedstawiono w części "
            "rysunkowej projektu zagospodarowania działki lub terenu."
        ))

    # --- 11. Rysunki -----------------------------------------------------
    if b(data, "pzt", "rysunki"):
        B.append(h1("11. Zestawienie części rysunkowej (§ 15)"))
        B.append(p(
            "Część rysunkową projektu zagospodarowania działki lub terenu sporządzono na "
            "aktualnej mapie do celów projektowych. Zestawienie rysunków:"
        ))
        B.append(ul([
            "PZT-01 – Projekt zagospodarowania terenu – rysunek podstawowy, skala 1:500,",
            "PZT-02 – Profil / przekroje terenu i układu komunikacyjnego, skala 1:500/1:100,",
            "PZT-03 – Rysunek koordynacyjny uzbrojenia terenu, skala 1:500,",
            "PZT-04 – Zestawienie elementów zieleni i małej architektury – w razie potrzeby.",
        ]))
        if s(data, "pzt", "rysunki_opis"):
            B.append(p(sentence(s(data, "pzt", "rysunki_opis"))))
        B.append(note(
            "Zakres i skala rysunków podlegają dostosowaniu do rodzaju i wielkości obiektu; "
            "dla inwestycji liniowych stosuje się skalę nie mniejszą niż 1:1000."
        ))

    # --- 12. Załączniki --------------------------------------------------
    B.append(h1("12. Załączniki do projektu"))
    zal = ["mapa do celów projektowych,",
           "wypis i wyrys z ewidencji gruntów i budynków,",
           "decyzja o warunkach zabudowy / wypis i wyrys z miejscowego planu "
           "zagospodarowania przestrzennego – stosownie do ustaleń,",
           "warunki techniczne przyłączenia do sieci uzbrojenia terenu,",
           "opinia geotechniczna,",
           "uzgodnienia, opinie i pozwolenia wymagane przepisami odrębnymi,",
           "oświadczenie projektanta o sporządzeniu projektu zgodnie z przepisami i zasadami "
           "wiedzy technicznej."]
    extra = s(data, "pzt", "zalaczniki")
    if extra:
        zal.extend([line.strip() for line in extra.splitlines() if line.strip()])
    B.append(ol(zal))

    B.append(note(
        "Niniejszy dokument stanowi część opisową projektu zagospodarowania działki lub terenu "
        "i wymaga uzupełnienia oraz weryfikacji przez projektanta posiadającego odpowiednie "
        "uprawnienia budowlane, wraz z częścią rysunkową i pozostałymi elementami projektu "
        "budowlanego."
    ))

    return doc


# ---------------------------------------------------------------------------
# PROJEKT ARCHITEKTONICZNO-BUDOWLANY
# ---------------------------------------------------------------------------

def _param_rows(data: dict) -> list[list[str]]:
    pab = data["pab"]
    rows: list[list[str]] = []

    def add(label: str, value: str) -> None:
        if value and value not in ("—",):
            rows.append([label, value])

    kub = number(pab.get("kubatura"))
    add("Kubatura", f"{pl_num(kub, 2)} m³" if kub is not None else "")
    pu = number(pab.get("pow_uzytkowa"))
    add("Powierzchnia użytkowa", area(pu) if pu is not None else "")
    pc = number(pab.get("pow_calkowita"))
    add("Powierzchnia całkowita", area(pc) if pc is not None else "")
    add("Wysokość", f"{pl_num(number(pab.get('wysokosc')), 2)} m"
        if number(pab.get("wysokosc")) is not None else "")
    add("Długość", f"{pl_num(number(pab.get('dlugosc')), 2)} m"
        if number(pab.get("dlugosc")) is not None else "")
    add("Szerokość", f"{pl_num(number(pab.get('szerokosc')), 2)} m"
        if number(pab.get("szerokosc")) is not None else "")
    add("Średnica", f"{pl_num(number(pab.get('srednica')), 2)} m"
        if number(pab.get("srednica")) is not None else "")
    add("Liczba kondygnacji", str(pab.get("kondygnacje") or ""))
    add("Kondygnacje podziemne", str(pab.get("kondygnacje_podziemne") or ""))
    add("Liczba lokali mieszkalnych", str(pab.get("lokale_mieszkalne") or ""))
    add("Liczba lokali użytkowych", str(pab.get("lokale_uzytkowe") or ""))
    add("Lokale dostępne dla osób niepełnosprawnych", str(pab.get("lokale_dostepne") or ""))
    add("Miejsca postojowe", str(pab.get("miejsca_postojowe") or ""))
    return rows


def build_pab(data: dict) -> Doc:
    data = merge_defaults(data)
    o = data["ogolne"]
    pab = data["pab"]
    idx = build_indices(data)
    nazwa = o["nazwa"] or "[nazwa zamierzenia budowlanego]"

    doc = Doc(
        kind="PAB",
        title="Projekt architektoniczno-budowlany – część opisowa",
        element="PROJEKT ARCHITEKTONICZNO-BUDOWLANY",
        meta={
            "element": "PROJEKT ARCHITEKTONICZNO-BUDOWLANY",
            "part": "CZĘŚĆ OPISOWA",
            "nazwa": nazwa,
            "adres": address_line(data) or "[adres inwestycji]",
            "kategoria": o["kategoria"],
            "dzialki": o["dzialki"] or "[nr działek]",
            "inwestor": o["inwestor"] or "[inwestor]",
            "inwestor_adres": o["inwestor_adres"],
            "data": data_dnia(data),
            "projektant": o["projektant"] or "[imię i nazwisko projektanta]",
            "projektanci": projektanci_list(o),
            "specjalnosc": o["specjalnosc"],
            "uprawnienia": o["uprawnienia"] or "[nr uprawnień]",
            "zakres": o["zakres"],
            "tom": o["tom"],
            "nr_projektu": o["nr_projektu"],
            "sprawdzajacy": o["sprawdzajacy"],
            "sprawdzajacy_uprawnienia": o["sprawdzajacy_uprawnienia"],
        },
    )
    B = doc.blocks

    B.append(h1("1. Podstawa opracowania"))
    B.append(p(
        "Projekt architektoniczno-budowlany sporządzono na podstawie ustawy z dnia 7 lipca "
        "1994 r. – Prawo budowlane (Dz. U. z 2026 r. poz. 524 ze zm.) oraz rozporządzenia "
        "Ministra Rozwoju z dnia 11 września 2020 r. w sprawie szczegółowego zakresu i formy "
        "projektu budowlanego (Dz. U. z 2022 r. poz. 1679, z 2023 r. poz. 2405 oraz z 2026 r. "
        "poz. 597), a także rozporządzenia Ministra Infrastruktury z dnia 12 kwietnia 2002 r. "
        "w sprawie warunków technicznych, jakim powinny odpowiadać budynki i ich usytuowanie "
        "(Dz. U. z 2022 r. poz. 1225 ze zm.)."
    ))
    B.append(p(
        f"Podstawę ustaleń dla zamierzenia stanowi: {_mpzp_text(data)}"
    ))
    B.append(p(
        "W zakresie rozwiązań technicznych i materiałowych projekt odwołuje się do projektu "
        "technicznego oraz do uzgodnień i opinii wymaganych przepisami odrębnymi."
    ))

    # 1
    B.append(h1("2. Rodzaj i kategoria obiektu budowlanego (§ 20 ust. 1 pkt 1)"))
    B.append(p(
        f"Przedmiotem opracowania jest {o['rodzaj'].lower()} – {nazwa}, zlokalizowany na "
        f"{plot_label(data)}. Obiekt zalicza się do kategorii: {o['kategoria']}."
    ))
    if s(data, "pzt", "przedmiot"):
        B.append(p(sentence(s(data, "pzt", "przedmiot"))))

    # 2
    B.append(h1("3. Zamierzony sposób użytkowania i program użytkowy "
                "(§ 20 ust. 1 pkt 2)"))
    program = s(data, "pab", "program")
    if program:
        B.append(p(sentence(program)))
    else:
        B.append(p(
            "Obiekt przeznaczony jest do użytkowania zgodnie z jego funkcją podstawową "
            "wynikającą z nazwy zamierzenia budowlanego. Program użytkowy obejmuje "
            "pomieszczenia niezbędne do prawidłowego funkcjonowania obiektu, wraz z "
            "pomieszczeniami pomocniczymi i technicznymi – [uzupełnić wykaz pomieszczeń]."
        ))
    if pab.get("lokale_mieszkalne") or pab.get("lokale_uzytkowe"):
        B.append(p(
            "W budynku wydzielono: "
            + f"{pab.get('lokale_mieszkalne') or '0'} lokali mieszkalnych oraz "
            + f"{pab.get('lokale_uzytkowe') or '0'} lokali użytkowych."
        ))

    # 3
    B.append(h1("4. Układ przestrzenny i forma architektoniczna "
                "(§ 20 ust. 1 pkt 3)"))
    forma = s(data, "pab", "forma")
    if forma:
        B.append(p(sentence(forma)))
    else:
        B.append(p(
            "Budynek zaprojektowano jako obiekt o zwartej bryle, z dachem płaskim lub "
            "dwuspadowym – stosownie do ustaleń planu miejscowego. Układ przestrzenny "
            "podporządkowano funkcji obiektu oraz warunkom działki. Forma architektoniczna "
            "i gabaryty nawiązują do zabudowy sąsiedniej i nie powodują istotnego "
            "przesłaniania ani zacieniania nieruchomości sąsiednich."
        ))
    wykonczenie = s(data, "pab", "wykonczenie")
    if wykonczenie:
        B.append(p(sentence(wykonczenie)))
    else:
        B.append(p(
            "Charakterystyczne wyroby wykończeniowe i kolorystyka elewacji: tynki mineralne "
            "w tonacji jasnej, elementy drewniane lub kompozytowe, stolarka okienna i drzwiowa "
            "w kolorze ciemnym, pokrycie dachu – zgodnie z częścią rysunkową. Kolorystyka "
            "i materiały zostały dobrane w sposób spójny z otoczeniem."
        ))
    B.append(p(
        "Rozwiązania projektowe dostosowano do wymagań wynikających z przepisów odrębnych, "
        "pozwoleń, uzgodnień i opinii innych organów oraz ustaleń miejscowego planu "
        "zagospodarowania przestrzennego, a w przypadku jego braku – decyzji o warunkach "
        "zabudowy i zagospodarowania terenu."
    ))

    # 4
    B.append(h1("5. Charakterystyczne parametry obiektu budowlanego "
                "(§ 20 ust. 1 pkt 4)"))
    rows = _param_rows(data)
    if rows:
        B.append(table(["Parametr", "Wartość"], rows, widths=[0.55, 0.45]))
    else:
        B.append(p("[Uzupełnić charakterystyczne parametry obiektu w formularzu.]"))
    B.append(p(
        "Powierzchnie budynku określono zgodnie z zasadami zawartymi w Polskiej Normie "
        "PN-ISO 9836 „Właściwości użytkowe w budownictwie – Określanie i obliczanie "
        "wskaźników powierzchniowych i kubaturowych”, z uwzględnieniem § 12, § 14 pkt 4 "
        "lit. a oraz § 20 ust. 1 pkt 4 lit. b rozporządzenia."
    ))
    B.append(p(
        "Przy określaniu powierzchni użytkowej powierzchnię pomieszczeń lub ich części "
        "o wysokości w świetle równej lub większej od 2,20 m zaliczono w 100%, o wysokości "
        "równej lub większej od 1,40 m, lecz mniejszej od 2,20 m – w 50%, natomiast "
        "o wysokości mniejszej od 1,40 m pominięto całkowicie. Powierzchnię użytkową "
        "pomniejszono o powierzchnię przekroju poziomego wewnętrznych przegród budowlanych, "
        "przejść i otworów w tych przegrodach, przejść w przegrodach zewnętrznych, balkonów, "
        "tarasów, loggii, schodów wewnętrznych i podestów w lokalach wielopoziomowych oraz "
        "nieużytkowych poddaszy, a powiększono o powierzchnię antresol, ogrodów zimowych "
        "oraz wbudowanych szaf, schowków i garderób."
    ))
    if idx.get("plot") and idx.get("pow_calkowita"):
        B.append(p(
            f"Powierzchnia całkowita zabudowy w stosunku do powierzchni działki daje "
            f"intensywność zabudowy {pl_num(idx['intensywnosc'], 2)}."
        ))

    # 5
    B.append(h1("6. Opinia geotechniczna i sposób posadowienia "
                "(§ 20 ust. 1 pkt 5)"))
    geo = s(data, "pab", "geotechnika")
    B.append(p(
        sentence(geo) if geo else
        "Warunki gruntowe określono na podstawie opinii geotechnicznej sporządzonej dla "
        "przedmiotowej działki. Dokumentacja określa warunki gruntowe, kategorię "
        "geotechniczną obiektu oraz zalecenia dotyczące posadowienia – [uzupełnić dane "
        "z opinii]."
    ))
    pos = s(data, "pab", "posadowienie")
    B.append(p(
        sentence(pos) if pos else
        "Obiekt posadowiony będzie bezpośrednio na gruncie rodzimym, na ławach lub płycie "
        "fundamentowej, poniżej strefy przemarzania, zgodnie z rozwiązaniami przyjętymi "
        "w projekcie technicznym."
    ))

    # 6-7
    B.append(h1("7. Liczba lokali (§ 20 ust. 1 pkt 6 i 7)"))
    if "wielorodzinny" in o["rodzaj"].lower():
        B.append(p(
            f"W budynku zaprojektowano {pab.get('lokale_mieszkalne') or '[liczba]'} lokali "
            f"mieszkalnych oraz {pab.get('lokale_uzytkowe') or '0'} lokali użytkowych. "
            f"Liczba lokali mieszkalnych dostępnych dla osób niepełnosprawnych, w tym osób "
            f"starszych, wynosi {pab.get('lokale_dostepne') or '[liczba]'}."
        ))
    else:
        B.append(p(
            f"W budynku zaprojektowano {pab.get('lokale_mieszkalne') or '0'} lokali "
            f"mieszkalnych oraz {pab.get('lokale_uzytkowe') or '0'} lokali użytkowych. "
            "Zamierzenie nie obejmuje budynku mieszkalnego wielorodzinnego, w związku z czym "
            "wymóg określenia liczby lokali dostępnych dla osób niepełnosprawnych nie znajduje "
            "zastosowania."
        ))

    # 8
    B.append(h1("8. Zapewnienie warunków korzystania przez osoby ze szczególnymi "
                "potrzebami (§ 20 ust. 1 pkt 8)"))
    if b(data, "pab", "dostepnosc"):
        B.append(p(
            "Projektowany obiekt jest obiektem użyteczności publicznej / budownictwa "
            "mieszkaniowego wielorodzinnego, w związku z czym zapewniono niezbędne warunki "
            "do korzystania z niego przez osoby niepełnosprawne, o których mowa w art. 1 "
            "Konwencji o prawach osób niepełnosprawnych, w tym osoby starsze. Sposób "
            "zapewnienia dostępu:"
        ))
        B.append(ul([
            "dojście i wejście do budynku: "
            + (s(data, "pab", "dost_dojscie") or
               "dojście o nawierzchni utwardzonej, bez progów i uskoków, o szerokości "
               "zapewniającej ruch osoby poruszającej się na wózku, z podjazdem lub rampą "
               "o dopuszczalnym nachyleniu;"),
            "kondygnacje, w tym komunikacja pionowa i pozioma: "
            + (s(data, "pab", "dost_kondygnacje") or
               "winda przystosowana dla osób niepełnosprawnych oraz ciągi komunikacyjne "
               "o szerokości i wysokości zgodnej z przepisami;"),
            "pomieszczenia i przestrzenie ogólnodostępne: "
            + (s(data, "pab", "dost_pomieszczenia") or
               "pomieszczenia ogólnodostępne pozbawione barier architektonicznych, "
               "z odpowiednią przestrzenią manewrową;"),
            "stanowiska postojowe dla samochodów osobowych: "
            + (s(data, "pab", "dost_parkingi") or
               "wyznaczone stanowiska postojowe dla osób niepełnosprawnych, zlokalizowane "
               "w pobliżu wejścia do budynku;"),
            "place zabaw dla dzieci, miejsca rekreacji i miejsca czasowego gromadzenia "
            "odpadów stałych – jeżeli są wymagane: "
            + (s(data, "pab", "dost_rekreacja") or
               "zapewniony dostęp bez barier, o nawierzchni utwardzonej i odpowiednim "
               "nasłonecznieniu."),
        ]))
    else:
        B.append(p(
            "Projektowany obiekt nie jest obiektem użyteczności publicznej ani budynkiem "
            "mieszkalnym wielorodzinnym. Wymagania w zakresie zapewnienia warunków korzystania "
            "przez osoby niepełnosprawne, o których mowa w § 20 ust. 1 pkt 8 rozporządzenia, "
            "nie znajdują zastosowania w pełnym zakresie; rozwiązania projektowe nie "
            "wprowadzają jednak barier utrudniających dostęp do obiektu."
        ))

    # 9
    B.append(h1("9. Parametry techniczne – wpływ obiektu na środowisko i zdrowie ludzi "
                "(§ 20 ust. 1 pkt 9)"))
    B.append(h2("9.1. Zapotrzebowanie i jakość wody, ścieki i wody opadowe (lit. a)"))
    B.append(p(
        sentence(s(data, "pab", "woda")) if s(data, "pab", "woda") else
        "Zapotrzebowanie na wodę wynika z funkcji obiektu i liczby użytkowników. Woda "
        "pobierana będzie z sieci wodociągowej, zgodnie z warunkami technicznymi "
        "przyłączenia. Ilość i jakość ścieków odpowiadają ściekom bytowym/gospodarczym; "
        "sposób ich odprowadzania określono w projekcie zagospodarowania terenu."
    ))
    B.append(p(
        sentence(s(data, "pab", "scieki")) if s(data, "pab", "scieki") else
        "Ścieki odprowadzane będą zgodnie z rozwiązaniami opisanymi w projekcie "
        "zagospodarowania działki lub terenu. Wody opadowe zagospodarowane będą na terenie "
        "działki lub odprowadzone do sieci kanalizacji deszczowej."
    ))

    B.append(h2("9.2. Emisja zanieczyszczeń gazowych, pyłowych i płynnych (lit. b)"))
    B.append(p(
        sentence(s(data, "pab", "emisje")) if s(data, "pab", "emisje") else
        "Obiekt nie wprowadza do środowiska zanieczyszczeń gazowych, pyłowych ani płynnych "
        "poza typowymi, wynikającymi z jego przeznaczenia. Ewentualne emisje powstające "
        "w wyniku eksploatacji odprowadzane będą zgodnie z przepisami odrębnymi, a ich zasięg "
        "nie wykracza poza granice działki."
    ))

    B.append(h2("9.3. Rodzaj i ilość wytwarzanych odpadów (lit. c)"))
    B.append(p(
        sentence(s(data, "pab", "odpady")) if s(data, "pab", "odpady") else
        "Odpady powstające podczas eksploatacji obiektu gromadzone będą w miejscu czasowego "
        "gromadzenia odpadów, w pojemnikach dostosowanych do rodzaju odpadów, i przekazywane "
        "uprawnionym podmiotom. Odpady budowlane zagospodarowane będą zgodnie z ustawą "
        "o odpadach."
    ))

    B.append(h2("9.4. Właściwości akustyczne, drgania i promieniowanie (lit. d)"))
    B.append(p(
        sentence(s(data, "pab", "akustyka")) if s(data, "pab", "akustyka") else
        "Obiekt nie jest źródłem ponadnormatywnego hałasu ani drgań. Rozwiązania "
        "materiałowe przegród zewnętrznych i wewnętrznych zapewniają wymaganą izolacyjność "
        "akustyczną. Nie występuje emisja promieniowania jonizującego ani istotne "
        "oddziaływanie pola elektromagnetycznego."
    ))

    B.append(h2("9.5. Wpływ na drzewostan, powierzchnię ziemi, glebę i wody (lit. e)"))
    B.append(p(
        sentence(s(data, "pab", "srodowisko_grunt")) if s(data, "pab", "srodowisko_grunt") else
        "Realizacja obiektu nie spowoduje istotnego wpływu na istniejący drzewostan. "
        "Powierzchnia ziemi i gleba zostaną zabezpieczone w trakcie prowadzenia robót. "
        "Wody powierzchniowe i podziemne nie zostaną naruszone; gospodarka wodno-ściekowa "
        "prowadzona będzie w sposób uniemożliwiający przenikanie zanieczyszczeń do gruntu."
    ))
    B.append(p(
        "Przyjęte rozwiązania przestrzenne, funkcjonalne i techniczne ograniczają lub "
        "eliminują wpływ obiektu na środowisko przyrodnicze, zdrowie ludzi i inne obiekty "
        "budowlane, zgodnie z przepisami odrębnymi."
    ))

    # 10
    B.append(h1("10. Analiza możliwości stosowania wysoce wydajnych systemów "
                "alternatywnych zaopatrzenia w energię (§ 20 ust. 1 pkt 10)"))
    B.append(p(
        "Dla budynku przeprowadzono analizę technicznych, środowiskowych i ekonomicznych "
        "możliwości realizacji wysoce wydajnych systemów alternatywnych zaopatrzenia w energię "
        "i ciepło, w tym zdecentralizowanych systemów dostawy energii opartych na energii ze "
        "źródeł odnawialnych, kogenerację oraz ogrzewanie lub chłodzenie lokalne lub blokowe, "
        "a także pomp ciepła."
    ))
    B.append(ul([
        "oszacowanie rocznego zapotrzebowania na energię użytkową do ogrzewania, wentylacji "
        "i przygotowania ciepłej wody użytkowej: "
        + (s(data, "pab", "energia_zapotrzebowanie") or "[uzupełnić wartość]"),
        "dostępne nośniki energii: " + (s(data, "pab", "energia_nosniki") or "[uzupełnić]"),
        "system konwencjonalny przyjęty do analizy porównawczej: "
        + (s(data, "pab", "energia_system_konw") or "[uzupełnić]"),
        "system alternatywny lub hybrydowy przyjęty do analizy porównawczej: "
        + (s(data, "pab", "energia_system_alt") or "[uzupełnić]"),
        "wyniki analizy porównawczej i wybór systemu zaopatrzenia w energię: "
        + (s(data, "pab", "energia_wynik") or "[uzupełnić]"),
    ]))
    B.append(p(
        "Analiza wykazała zasadność zastosowania rozwiązania wskazanego powyżej. Szczegółowe "
        "obliczenia i charakterystykę energetyczną budynku zawiera projekt techniczny."
    ))

    # 11
    B.append(h1("11. Automatyczna regulacja temperatury (§ 20 ust. 1 pkt 11)"))
    B.append(p(
        sentence(s(data, "pab", "automatyka")) if s(data, "pab", "automatyka") else
        "W budynku przewidziano urządzenia automatycznie regulujące temperaturę oddzielnie "
        "w poszczególnych pomieszczeniach lub w wyznaczonej strefie ogrzewanej, w tym "
        "termostatyczne zawory grzejnikowe, termostaty pokojowe oraz indywidualne sterowanie "
        "pomieszczeniowe, zgodnie z § 135 ust. 7–10 i § 147 ust. 5–7 rozporządzenia "
        "w sprawie warunków technicznych, jakim powinny odpowiadać budynki i ich usytuowanie."
    ))

    # 12
    B.append(h1("12. Zasadnicze elementy wyposażenia budowlano-instalacyjnego "
                "(§ 20 ust. 1 pkt 12)"))
    inst_sel = s(data, "pab", "instalacje_sel")
    if not isinstance(inst_sel, list):
        inst_sel = []
    inst = [label for key, label in INSTALACJE if key in inst_sel]
    if inst:
        B.append(p("Obiekt wyposażony będzie w następujące instalacje i urządzenia:"))
        B.append(ul([capitalize(x) for x in inst]))
    else:
        B.append(p("Zakres instalacji – [uzupełnić]."))
    if s(data, "pab", "instalacje_opis"):
        B.append(p(sentence(s(data, "pab", "instalacje_opis"))))
    else:
        B.append(p(
            "Instalacje zaprojektowano w sposób zapewniający użytkowanie obiektu zgodnie "
            "z przeznaczeniem, z uwzględnieniem wymagań w zakresie bezpieczeństwa, "
            "oszczędności energii i komfortu użytkowania. Sposób powiązania instalacji "
            "z sieciami zewnętrznymi oraz punkty pomiarowe określa projekt techniczny."
        ))

    # 13
    B.append(h1("13. Warunki ochrony przeciwpożarowej (§ 20 ust. 1 pkt 13)"))
    ppoz = s(data, "pab", "ppoz")
    if ppoz:
        B.append(p(sentence(ppoz)))
    else:
        B.append(p(
            "Budynek zaprojektowano jako jednokondygnacyjny / wielokondygnacyjny obiekt "
            "o klasie odporności pożarowej określonej w projekcie, z wydzielonymi strefami "
            "pożarowymi. Drogi ewakuacyjne, ich szerokość i długość, a także elementy "
            "oddzielenia przeciwpożarowego spełniają wymagania przepisów techniczno-"
            "budowlanych oraz rozporządzenia w sprawie ochrony przeciwpożarowej budynków. "
            "Obiekt wyposażono w instalacje przeciwpożarowe stosownie do jego funkcji "
            "i wielkości – zgodnie z projektem technicznym."
        ))
    B.append(p(
        "Usytuowanie obiektu względem granic działki i obiektów sąsiednich oraz odległości "
        "przeciwpożarowe przedstawiono w części rysunkowej projektu zagospodarowania "
        "działki lub terenu."
    ))

    # 14
    if b(data, "pab", "ochrona_ludnosci"):
        B.append(h1("14. Warunki ochrony ludności (§ 20 ust. 1 pkt 14)"))
        B.append(p(
            "Projektowany obiekt jest obiektem zbiorowej ochrony – budowlą ochronną / "
            "obiektem umożliwiającym zorganizowanie miejsca doraźnego schronienia. "
            "W zakresie warunków ochrony ludności przyjmuje się:"
        ))
        B.append(ul([
            f"rodzaj i pojemność obiektu: {s(data, 'pab', 'ol_rodzaj') or '[uzupełnić]'}, "
            f"pojemność {s(data, 'pab', 'ol_pojemnosc') or '[uzupełnić]'} osób, "
            f"z uwzględnieniem liczby osób mogących przebywać w poszczególnych strefach "
            f"ochronnych;",
            f"kategoria odporności budowli ochronnej: "
            f"{s(data, 'pab', 'ol_kategoria') or '[uzupełnić]'};",
            f"projektowany czas ochrony: {s(data, 'pab', 'ol_czas') or '[uzupełnić]'};",
            f"usytuowanie i strefy prognozowanego zagruzowania: "
            f"{s(data, 'pab', 'ol_zagruzowanie') or '[uzupełnić]'};",
            f"wyjścia ewakuacyjne i wyjścia zapasowe: "
            f"{s(data, 'pab', 'ol_wyjscia') or '[uzupełnić]'}.",
        ]))
        B.append(p(
            "Rozwiązania w zakresie ochrony ludności są spójne z ustaleniami projektu "
            "zagospodarowania działki lub terenu i zostały przedstawione w części rysunkowej."
        ))

    # odstępstwo
    if b(data, "pab", "odstepstwo"):
        B.append(h1("15. Zgoda na odstępstwo (§ 20 ust. 2)"))
        B.append(p(
            "Dla zamierzenia budowlanego uzyskano zgodę na odstępstwo, o którym mowa "
            "w art. 9 ustawy – Prawo budowlane, lub zgodę udzieloną w postanowieniu, "
            "o którym mowa w art. 6a ust. 2 ustawy o ochronie przeciwpożarowej. "
            + (sentence(s(data, "pab", "odstepstwo_opis")) if s(data, "pab", "odstepstwo_opis")
               else "[uzupełnić znak i zakres zgody].")
        ))

    # rysunki
    if b(data, "pab", "rysunki"):
        B.append(h1("16. Zestawienie części rysunkowej (§ 21)"))
        B.append(p("Część rysunkowa projektu architektoniczno-budowlanego obejmuje:"))
        B.append(ul([
            "rzuty wszystkich charakterystycznych poziomów, w zakresie niezbędnym do "
            "przedstawienia układu funkcjonalno-przestrzennego i rozwiązań "
            "architektoniczno-budowlanych,",
            "charakterystyczne przekroje z nawiązaniem do poziomu terenu, ukazujące "
            "powiązanie z podłożem oraz przyległymi obiektami,",
            "widoki elewacji oraz dachu lub przekrycia w liczbie dostatecznej do wyjaśnienia "
            "formy architektonicznej obiektu, z określeniem wyrobów wykończeniowych "
            "i kolorystyki.",
        ]))
        if b(data, "pab", "ochrona_ludnosci"):
            B.append(p(
                "W przypadku obiektu zbiorowej ochrony rzuty kondygnacji zawierają dodatkowo "
                "oznaczenie: wejść, wyjść ewakuacyjnych, wyjść zapasowych, płaszczyzn ochrony "
                "i hermetyzacji budowli ochronnej, stref ochronnych oraz części obiektu "
                "przeznaczonej do zorganizowania miejsca doraźnego schronienia."
            ))

    # uwagi
    if s(data, "pab", "uwagi"):
        B.append(h1("17. Uwagi i informacje dodatkowe"))
        B.append(p(sentence(s(data, "pab", "uwagi"))))

    B.append(h1("18. Załączniki"))
    B.append(ol([
        "opinia geotechniczna,",
        "wyniki badań i obliczeń konstrukcyjnych – w projekcie technicznym,",
        "charakterystyka energetyczna budynku – w projekcie technicznym,",
        "uzgodnienia i opinie wymagane przepisami odrębnymi,",
        "oświadczenie projektanta o sporządzeniu projektu zgodnie z przepisami i zasadami "
        "wiedzy technicznej.",
    ]))
    B.append(note(
        "Niniejszy dokument stanowi część opisową projektu architektoniczno-budowlanego. "
        "Wymaga weryfikacji przez projektanta posiadającego uprawnienia budowlane "
        "w odpowiedniej specjalności oraz uzupełnienia o rozwiązania techniczne zawarte "
        "w projekcie technicznym."
    ))

    return doc


# ---------------------------------------------------------------------------
# Dokumenty towarzyszące – wniosek, oświadczenie, BIOZ, załączniki
# ---------------------------------------------------------------------------

def _projektanci_meta(o: dict[str, Any]) -> dict[str, Any]:
    """Dane projektantów w formie gotowej do metryki dokumentu."""
    rows = projektanci_list(o)
    first = next((r for r in rows if r["funkcja"] == "Projektant"),
                 rows[0] if rows else {})
    chk = next((r for r in rows if r["funkcja"] == "Sprawdzający"), {})
    return {
        "projektanci": rows,
        "projektant": first.get("imie") or _text(o.get("projektant"))
                      or "[imię i nazwisko projektanta]",
        "specjalnosc": first.get("specjalnosc") or _text(o.get("specjalnosc")),
        "uprawnienia": first.get("uprawnienia") or _text(o.get("uprawnienia"))
                       or "[nr uprawnień]",
        "sprawdzajacy": chk.get("imie") or _text(o.get("sprawdzajacy")),
        "sprawdzajacy_uprawnienia": chk.get("uprawnienia")
                                    or _text(o.get("sprawdzajacy_uprawnienia")),
    }


def _meta_dokumentu(data: dict, element: str, part: str = "",
                    **extra: Any) -> dict[str, Any]:
    o = data.get("ogolne") or {}
    meta: dict[str, Any] = {
        "element": element,
        "part": part,
        "nazwa": _text(o.get("nazwa")) or "[nazwa zamierzenia budowlanego]",
        "adres": address_line(data) or "[adres inwestycji]",
        "kategoria": _text(o.get("kategoria")),
        "dzialki": _text(o.get("dzialki")) or "[nr działek]",
        "inwestor": _text(o.get("inwestor")) or "[inwestor]",
        "inwestor_adres": _text(o.get("inwestor_adres")),
        "data": data_dnia(data),
        "zakres": _text(o.get("zakres")),
        "tom": _text(o.get("tom")),
        "nr_projektu": _text(o.get("nr_projektu")),
    }
    meta.update(_projektanci_meta(o))
    meta.update(extra)
    return meta


def _organ(data: dict) -> str:
    o = data.get("ogolne") or {}
    organ = _text(o.get("organ")) or "[organ administracji architektoniczno-budowlanej]"
    adres = _text(o.get("organ_adres"))
    return organ + (("\n" + adres) if adres else "")


def _wnioskodawca(data: dict) -> tuple[str, str]:
    o = data.get("ogolne") or {}
    osoba = (_text(o.get("osoba_wnioskujaca")) or _text(o.get("inwestor"))
             or "[imię i nazwisko wnioskodawcy]")
    funkcja = _text(o.get("funkcja_wnioskujacego")) or "inwestor"
    return osoba, funkcja


def _miejscowosc(data: dict) -> str:
    o = data.get("ogolne") or {}
    return _text(o.get("jednostka")) or _text(o.get("obreb"))


def dokumenty_list(data: dict) -> list[dict[str, Any]]:
    """Znormalizowana lista dokumentów wymaganych do pozwolenia na budowę."""
    rows = data.get("dokumenty")
    if not isinstance(rows, list) or not rows:
        rows = blank_project()["dokumenty"]
    out: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        out.append({
            "klucz": _text(row.get("klucz")),
            "nazwa": _text(row.get("nazwa")) or "[dokument]",
            "wymagany": bool(row.get("wymagany", True)),
            "status": _text(row.get("status")) or "Do uzupełnienia",
            "uwagi": _text(row.get("uwagi")),
        })
    return out


def zalaczniki_list(data: dict) -> list[dict[str, str]]:
    rows = data.get("zalaczniki")
    out: list[dict[str, str]] = []
    if not isinstance(rows, list):
        return out
    for row in rows:
        if not isinstance(row, dict):
            continue
        out.append({
            "nazwa": _text(row.get("nazwa")),
            "opis": _text(row.get("opis")),
            "status": _text(row.get("status")) or "Do uzupełnienia",
        })
    return out


def dokumenty_podsumowanie(data: dict) -> tuple[list[dict], list[dict], list[dict]]:
    rows = dokumenty_list(data)
    required = [r for r in rows
                if r["wymagany"] and r["status"] != "Nie dotyczy"]
    attached = [r for r in required if r["status"] == "Dołączony"]
    missing = [r for r in required if r["status"] != "Dołączony"]
    return rows, attached, missing


def _prace_niebezpieczne(data: dict) -> list[str]:
    selected = (data.get("bioz") or {}).get("prace_niebezpieczne")
    if not isinstance(selected, list):
        selected = []
    return [label for key, label in PRACE_NIEBEZPIECZNE if key in selected]


def build_wniosek(data: dict) -> Doc:
    """Wniosek o pozwolenie na budowę (art. 33 Prawa budowlanego)."""
    o = data.get("ogolne") or {}
    osoba, funkcja = _wnioskodawca(data)
    meta = _meta_dokumentu(data, "WNIOSEK O POZWOLENIE NA BUDOWĘ",
                           cover=False, toc=False)
    doc = Doc(kind="WNIOSEK", title="Wniosek o pozwolenie na budowę",
              element="WNIOSEK O POZWOLENIE NA BUDOWĘ", meta=meta)
    B = doc.blocks

    miejsc = _miejscowosc(data)
    B.append(sign(f"{miejsc}, {data_dnia(data)}" if miejsc else data_dnia(data)))
    B.append(p(_organ(data)))
    B.append(h1("Wniosek o pozwolenie na budowę"))
    B.append(p(
        "Na podstawie art. 28 ust. 1 i art. 33 ust. 1 ustawy z dnia 7 lipca 1994 r. "
        "– Prawo budowlane (Dz. U. z 2026 r. poz. 524 ze zm.) wnoszę o udzielenie "
        "pozwolenia na budowę dla zamierzenia budowlanego:"
    ))
    rows = [
        ["Nazwa zamierzenia", _text(o.get("nazwa")) or "[nazwa]"],
        ["Adres inwestycji", address_line(data) or "[adres]"],
        ["Działki ewidencyjne", _text(o.get("dzialki")) or "[nr działek]"],
        ["Kategoria obiektu", _text(o.get("kategoria"))],
        ["Rodzaj obiektu", _text(o.get("rodzaj"))],
        ["Inwestor", _text(o.get("inwestor")) or "[inwestor]"],
    ]
    B.append(table(["Pozycja", "Dane"], rows, widths=[32, 68]))
    B.append(h2("Zakres zamierzenia budowlanego"))
    B.append(p(sentence(
        _text((data.get("pzt") or {}).get("przedmiot"))
        or _text((data.get("pzt") or {}).get("zakres_zamierzenia"))
        or "[opis zakresu zamierzenia budowlanego]"
    )))
    B.append(h2("Załączniki do wniosku"))
    _, _, _ = dokumenty_podsumowanie(data)
    zal = [r["nazwa"] for r in dokumenty_list(data)
           if r["wymagany"] and r["status"] != "Nie dotyczy"
           and r["klucz"] != "wniosek"]
    B.append(ol(zal))
    B.append(p(
        "Oświadczam, że dokumentacja dołączona do wniosku jest kompletna w zakresie "
        "wymaganym przepisami oraz że posiadam prawo do dysponowania nieruchomością "
        "na cele budowlane."
    ))
    B.append(p(
        "Jednocześnie przyjmuję do wiadomości, że niniejszy wniosek podlega "
        "rozpatrzeniu w terminie określonym w art. 35 ustawy – Prawo budowlane."
    ))
    B.append(sign(osoba, funkcja, "", "……………………………………", "podpis wnioskodawcy"))
    return doc


def build_oswiadczenie(data: dict) -> Doc:
    """Oświadczenie o prawie do dysponowania nieruchomością na cele budowlane."""
    o = data.get("ogolne") or {}
    osoba, funkcja = _wnioskodawca(data)
    meta = _meta_dokumentu(
        data, "OŚWIADCZENIE O PRAWIE DO DYSPONOWANIA NIERUCHOMOŚCIĄ",
        cover=False, toc=False)
    doc = Doc(kind="OSWIADCZENIE",
              title="Oświadczenie o prawie do dysponowania nieruchomością",
              element="OŚWIADCZENIE O PRAWIE DO DYSPONOWANIA NIERUCHOMOŚCIĄ",
              meta=meta)
    B = doc.blocks
    miejsc = _miejscowosc(data)
    B.append(sign(f"{miejsc}, {data_dnia(data)}" if miejsc else data_dnia(data)))
    B.append(h1("Oświadczenie"))
    B.append(p("o prawie do dysponowania nieruchomością na cele budowlane"))
    B.append(p(
        "Na podstawie art. 32 ust. 4 pkt 2 ustawy z dnia 7 lipca 1994 r. – Prawo "
        "budowlane (Dz. U. z 2026 r. poz. 524 ze zm.) oświadczam, że przysługuje mi "
        "prawo do dysponowania nieruchomością na cele budowlane, w szczególności "
        "działką/działkami ewidencyjnymi nr "
        f"{_text(o.get('dzialki')) or '[nr działek]'}, położoną/położonymi w "
        f"{address_line(data) or '[adres inwestycji]'}."
    ))
    B.append(p(
        "Oświadczenie dotyczy realizacji zamierzenia budowlanego polegającego na: "
        f"{_text(o.get('nazwa')) or '[nazwa zamierzenia budowlanego]'}."
    ))
    B.append(p(
        "Przyjmuję do wiadomości, że oświadczenie składa się pod rygorem "
        "odpowiedzialności karnej za podanie nieprawdy, zgodnie z art. 233 ustawy "
        "z dnia 6 czerwca 1997 r. – Kodeks karny."
    ))
    B.append(sign(osoba, funkcja, "", "……………………………………", "podpis"))
    return doc


def build_bioz_info(data: dict) -> Doc:
    """Informacja dotycząca bezpieczeństwa i ochrony zdrowia (BIOZ)."""
    meta = _meta_dokumentu(
        data, "INFORMACJA DOTYCZĄCA BEZPIECZEŃSTWA I OCHRONY ZDROWIA",
        doc_type="INFORMACJA DOTYCZĄCA BIOZ", cover=True, toc=False)
    doc = Doc(kind="BIOZ_INFO",
              title="Informacja dotycząca bezpieczeństwa i ochrony zdrowia",
              element="INFORMACJA DOTYCZĄCA BEZPIECZEŃSTWA I OCHRONY ZDROWIA",
              meta=meta)
    B = doc.blocks
    B.append(h1("1. Zakres robót i kolejność realizacji"))
    B.append(p(sentence(val(data, "bioz", "zakres_prac",
                           "[zakres robót – do uzupełnienia]"))))
    if s(data, "bioz", "kolejnosc"):
        B.append(h2("Kolejność realizacji robót"))
        B.append(p(s(data, "bioz", "kolejnosc")))
    B.append(h1("2. Wykaz istniejących obiektów budowlanych"))
    B.append(p(sentence(val(data, "bioz", "istniejace",
                           "[wykaz istniejących obiektów – do uzupełnienia]"))))
    B.append(h1("3. Elementy zagospodarowania stwarzające zagrożenie"))
    B.append(p(sentence(val(data, "bioz", "elementy",
                           "[elementy zagospodarowania – do uzupełnienia]"))))
    B.append(h1("4. Przewidywane zagrożenia podczas realizacji"))
    B.append(p(sentence(val(data, "bioz", "zagrozenia",
                           "[przewidywane zagrożenia – do uzupełnienia]"))))
    prace = _prace_niebezpieczne(data)
    if prace:
        B.append(h2("Prace szczególnie niebezpieczne"))
        B.append(ul(prace))
    B.append(h1("5. Sposób prowadzenia instruktażu pracowników"))
    B.append(p(sentence(val(data, "bioz", "instruktaz",
                           "[sposób instruktażu – do uzupełnienia]"))))
    B.append(h1("6. Środki techniczne i organizacyjne zapobiegające niebezpieczeństwom"))
    B.append(p(sentence(val(data, "bioz", "srodki",
                           "[środki ochrony – do uzupełnienia]"))))
    if s(data, "bioz", "drogi"):
        B.append(h2("Drogi ewakuacyjne i komunikacyjne"))
        B.append(p(sentence(s(data, "bioz", "drogi"))))
    if s(data, "bioz", "uwagi"):
        B.append(h2("Uwagi"))
        B.append(p(s(data, "bioz", "uwagi")))
    B.append(note(
        "Informację opracowuje projektant; jest ona elementem projektu budowlanego "
        "i podstawą sporządzenia planu BIOZ przez kierownika budowy (art. 20 ust. 1 "
        "pkt 1b Prawa budowlanego oraz § 5 ust. 1 pkt 1 lit. c rozporządzenia "
        "w sprawie szczegółowego zakresu i formy projektu budowlanego). Podstawa "
        "prawna: art. 20 ust. 1 pkt 1b ustawy z dnia 7 lipca 1994 r. – Prawo budowlane "
        "(Dz.U. z 2026 r. poz. 524, z późn. zm.), rozporządzenie Ministra Rozwoju z dnia "
        "11 września 2020 r. w sprawie szczegółowego zakresu i formy projektu budowlanego "
        "(Dz.U. z 2022 r. poz. 1679, z późn. zm.) oraz rozporządzenie Ministra "
        "Infrastruktury z dnia 23 czerwca 2003 r. w sprawie informacji dotyczącej "
        "bezpieczeństwa i ochrony zdrowia oraz planu bezpieczeństwa i ochrony zdrowia "
        "(Dz.U. nr 120, poz. 1126)."
    ))
    return doc


def build_bioz(data: dict) -> Doc:
    """Plan bezpieczeństwa i ochrony zdrowia (plan BIOZ)."""
    meta = _meta_dokumentu(
        data, "PLAN BEZPIECZEŃSTWA I OCHRONY ZDROWIA",
        doc_type="PLAN BIOZ", cover=True, toc=True)
    doc = Doc(kind="BIOZ", title="Plan bezpieczeństwa i ochrony zdrowia",
              element="PLAN BEZPIECZEŃSTWA I OCHRONY ZDROWIA", meta=meta)
    B = doc.blocks
    B.append(h1("1. Zakres robót i kolejność realizacji"))
    B.append(p(sentence(val(data, "bioz", "zakres_prac",
                           "[zakres robót – do uzupełnienia]"))))
    if s(data, "bioz", "kolejnosc"):
        B.append(p(s(data, "bioz", "kolejnosc")))
    B.append(h1("2. Wykaz istniejących obiektów budowlanych"))
    B.append(p(sentence(val(data, "bioz", "istniejace",
                           "[wykaz istniejących obiektów – do uzupełnienia]"))))
    B.append(h1("3. Elementy zagospodarowania mogące stwarzać zagrożenie"))
    B.append(p(sentence(val(data, "bioz", "elementy",
                           "[elementy zagospodarowania – do uzupełnienia]"))))
    B.append(h1("4. Przewidywane zagrożenia i ich skala"))
    B.append(p(sentence(val(data, "bioz", "zagrozenia",
                           "[przewidywane zagrożenia – do uzupełnienia]"))))
    prace = _prace_niebezpieczne(data)
    B.append(h2("Zestawienie prac szczególnie niebezpiecznych"))
    if prace:
        B.append(table(["Lp.", "Rodzaj prac szczególnie niebezpiecznych"],
                       [[str(i), label] for i, label in enumerate(prace, 1)],
                       widths=[12, 88]))
    else:
        B.append(p("Nie zidentyfikowano prac szczególnie niebezpiecznych."))
    B.append(h1("5. Sposób prowadzenia instruktażu pracowników"))
    B.append(p(sentence(val(data, "bioz", "instruktaz",
                           "[sposób instruktażu – do uzupełnienia]"))))
    B.append(h1("6. Środki techniczne i organizacyjne zapobiegające niebezpieczeństwom"))
    B.append(p(sentence(val(data, "bioz", "srodki",
                           "[środki ochrony – do uzupełnienia]"))))
    B.append(h2("Drogi ewakuacyjne i komunikacyjne"))
    B.append(p(sentence(val(data, "bioz", "drogi",
                           "[drogi ewakuacyjne – do uzupełnienia]"))))
    B.append(h1("7. Część rysunkowa"))
    B.append(p(
        "Część rysunkowa planu obejmuje plan sytuacyjny placu budowy z oznaczeniem: "
        "dróg ewakuacyjnych i komunikacyjnych, stref niebezpiecznych, miejsc "
        "składowania materiałów, punktów pierwszej pomocy oraz usytuowania sprzętu "
        "przeciwpożarowego. Rysunek stanowi załącznik do niniejszego planu."
    ))
    if s(data, "bioz", "uwagi"):
        B.append(h1("8. Uwagi"))
        B.append(p(s(data, "bioz", "uwagi")))
    B.append(note(
        "Plan BIOZ sporządza kierownik budowy przed rozpoczęciem robót, w oparciu "
        "o informację projektanta (art. 20 ust. 1 pkt 1b i art. 21a ust. 1 Prawa "
        "budowlanego). Plan wymaga się, gdy występują roboty wymienione w art. 21a "
        "ust. 2 ustawy albo gdy roboty potrwają dłużej niż 30 dni roboczych i jednocześnie "
        "będzie przy nich zatrudnionych co najmniej 20 pracowników lub pracochłonność "
        "przekroczy 500 osobodni (art. 21a ust. 1a). Plan aktualizuje się przed pracami "
        "szczególnie niebezpiecznymi i przy zmianie sposobu prowadzenia robót. Jest to "
        "dokument budowy, nie załącznik do wniosku o pozwolenie na budowę. Podstawa "
        "prawna: art. 21a ustawy z dnia 7 lipca 1994 r. – Prawo budowlane (Dz.U. z 2026 r. "
        "poz. 524, z późn. zm.) oraz rozporządzenie Ministra Infrastruktury z dnia "
        "23 czerwca 2003 r. w sprawie informacji dotyczącej bezpieczeństwa i ochrony "
        "zdrowia oraz planu bezpieczeństwa i ochrony zdrowia (Dz.U. nr 120, poz. 1126)."
    ))
    B.append(sign("……………………………………", "podpis kierownika budowy"))
    return doc


def build_zalaczniki(data: dict) -> Doc:
    """Wykaz dokumentów i załączników do wniosku o pozwolenie na budowę."""
    meta = _meta_dokumentu(
        data, "WYKAZ DOKUMENTÓW I ZAŁĄCZNIKÓW",
        cover=False, toc=False)
    doc = Doc(kind="ZALACZNIKI",
              title="Wykaz dokumentów i załączników do wniosku o pozwolenie na budowę",
              element="WYKAZ DOKUMENTÓW I ZAŁĄCZNIKÓW", meta=meta)
    B = doc.blocks
    B.append(h1("1. Dokumenty wymagane do uzyskania pozwolenia na budowę"))
    rows, attached, missing = dokumenty_podsumowanie(data)
    B.append(table(
        ["Lp.", "Dokument", "Wymagany", "Status", "Uwagi"],
        [[str(i), r["nazwa"], "tak" if r["wymagany"] else "nie",
          r["status"], r["uwagi"]]
         for i, r in enumerate(rows, 1)],
        widths=[5, 41, 13, 17, 24]))
    B.append(h1("2. Załączniki projektowe"))
    zal = zalaczniki_list(data)
    if zal:
        B.append(table(
            ["Lp.", "Nazwa załącznika", "Opis", "Status"],
            [[str(i), z["nazwa"], z["opis"], z["status"]]
             for i, z in enumerate(zal, 1)],
            widths=[6, 38, 40, 16]))
    else:
        B.append(p("Brak zarejestrowanych załączników projektowych."))
    B.append(h1("3. Podsumowanie kompletności"))
    total = len([r for r in rows if r["wymagany"] and r["status"] != "Nie dotyczy"])
    B.append(p(
        f"Dokumentów wymaganych: {total}. Dołączonych: {len(attached)}. "
        f"Do uzupełnienia: {len(missing)}."
    ))
    if missing:
        B.append(h2("Dokumenty do uzupełnienia"))
        B.append(ul([r["nazwa"] for r in missing]))
    else:
        B.append(p("Komplet dokumentów wymaganych do złożenia wniosku jest zamknięty."))
    B.append(note(
        "Wykaz ma charakter pomocniczy. Zakres dokumentów wymaganych do wniosku "
        "o pozwolenie na budowę określają art. 33 ustawy – Prawo budowlane oraz "
        "przepisy odrębne. Ostateczną kompletność dokumentacji potwierdza organ "
        "administracji architektoniczno-budowlanej."
    ))
    return doc


def build_document(kind: str, data: dict) -> Doc:
    """Buduje dokument wskazanego rodzaju."""
    builders = {
        "PZT": build_pzt,
        "PAB": build_pab,
        "WNIOSEK": build_wniosek,
        "OSWIADCZENIE": build_oswiadczenie,
        "BIOZ_INFO": build_bioz_info,
        "BIOZ": build_bioz,
        "ZALACZNIKI": build_zalaczniki,
    }
    try:
        return builders[kind](data)
    except KeyError:
        raise ValueError(f"Nieznany rodzaj dokumentu: {kind}") from None


# ---------------------------------------------------------------------------
# Sprawdzenie kompletności
# ---------------------------------------------------------------------------

def validate(data: dict) -> list[tuple[str, str]]:
    """Zwraca listę (poziom, komunikat); poziom: 'error' | 'warn' | 'info'."""
    data = merge_defaults(data)
    o = data["ogolne"]
    issues: list[tuple[str, str]] = []

    required = [
        ("ogolne", "nazwa", "Nazwa zamierzenia budowlanego"),
        ("ogolne", "inwestor", "Inwestor"),
        ("ogolne", "adres", "Adres inwestycji"),
        ("ogolne", "dzialki", "Numery działek ewidencyjnych"),
        ("ogolne", "pow_dzialki", "Powierzchnia działki"),
        ("ogolne", "data", "Data opracowania"),
        ("pab", "program", "Program użytkowy"),
        ("pab", "forma", "Układ przestrzenny i forma architektoniczna"),
    ]
    for sec, key, label in required:
        if not s(data, sec, key):
            issues.append(("error", f"Brak pola: {label}."))

    projektanci = projektanci_list(o)
    if not projektanci:
        issues.append(("error", "Brak projektanta – dodaj co najmniej jedną osobę "
                               "w sekcji „Projektanci i autorzy opracowania”."))
    else:
        for row in projektanci:
            if not row["imie"]:
                issues.append(("error",
                               f"Projektant ({row['funkcja']}): brak imienia i nazwiska."))
            if not row["uprawnienia"]:
                issues.append(("warn",
                               f"Projektant ({row['funkcja']}): brak numeru uprawnień "
                               "budowlanych."))
        if not any(r["funkcja"] == "Projektant" for r in projektanci):
            issues.append(("warn", "Na liście nie wskazano osoby pełniącej funkcję "
                                   "„Projektant”."))

    idx = build_indices(data)
    if idx["plot"] and abs(idx["total"] - idx["plot"]) > 0.5:
        issues.append((
            "warn",
            f"Bilans terenu: suma {pl_num(idx['total'])} m² różni się od powierzchni "
            f"działki {pl_num(idx['plot'])} m²."
        ))
    if idx["plot"] and idx["total"] == 0:
        issues.append(("warn", "Bilans terenu nie został wypełniony."))
    if idx.get("mpzp_pow_zab") is not None and idx.get("pct_zabudowa") is not None:
        if idx["pct_zabudowa"] > idx["mpzp_pow_zab"] + 1e-9:
            issues.append(("error",
                           f"Powierzchnia zabudowy {pl_num(idx['pct_zabudowa'], 1)}% przekracza "
                           f"limit {pl_num(idx['mpzp_pow_zab'], 1)}%."))
    if idx.get("mpzp_pbc") is not None and idx.get("pct_pbc") is not None:
        if idx["pct_pbc"] < idx["mpzp_pbc"] - 1e-9:
            issues.append(("error",
                           f"Powierzchnia biologicznie czynna {pl_num(idx['pct_pbc'], 1)}% jest "
                           f"niższa od wymaganej {pl_num(idx['mpzp_pbc'], 1)}%."))
    if idx.get("mpzp_intens") is not None and idx.get("intensywnosc") is not None:
        if idx["intensywnosc"] > idx["mpzp_intens"] + 1e-9:
            issues.append(("error",
                           f"Intensywność zabudowy {pl_num(idx['intensywnosc'], 2)} przekracza "
                           f"limit {pl_num(idx['mpzp_intens'], 2)}."))

    for sec, key, label in [
        ("pab", "pow_uzytkowa", "Powierzchnia użytkowa"),
        ("pab", "pow_calkowita", "Powierzchnia całkowita"),
        ("pab", "kubatura", "Kubatura"),
        ("pab", "kondygnacje", "Liczba kondygnacji"),
    ]:
        if not s(data, sec, key):
            issues.append(("warn", f"Brak parametru: {label}."))

    if not s(data, "pzt", "stan_istniejacy"):
        issues.append(("info", "Uzupełnij opis istniejącego stanu zagospodarowania."))
    if not s(data, "pzt", "mpzp_nazwa"):
        issues.append(("warn", "Nie wskazano oznaczenia planu miejscowego / decyzji WZ."))
    if b(data, "pab", "ochrona_ludnosci") and not s(data, "pab", "ol_rodzaj"):
        issues.append(("error", "Zaznaczono obiekt zbiorowej ochrony – uzupełnij dane ochrony ludności."))

    if b(data, "bioz", "wymagany"):
        if not s(data, "bioz", "zakres_prac"):
            issues.append(("warn", "BIOZ: uzupełnij zakres robót i kolejność realizacji."))
        if not s(data, "bioz", "zagrozenia"):
            issues.append(("warn", "BIOZ: uzupełnij przewidywane zagrożenia."))
        if not s(data, "bioz", "srodki"):
            issues.append(("warn", "BIOZ: uzupełnij środki techniczne i organizacyjne."))
        if not _prace_niebezpieczne(data):
            issues.append(("info", "BIOZ: nie wskazano prac szczególnie niebezpiecznych."))
    else:
        issues.append(("info", "BIOZ nie został oznaczony jako wymagany – "
                               "zweryfikuj obowiązek sporządzenia planu BIOZ."))

    rows, attached, missing = dokumenty_podsumowanie(data)
    if missing:
        issues.append(("warn", "Dokumenty do pozwolenia na budowę – do uzupełnienia: "
                               + ", ".join(r["nazwa"] for r in missing) + "."))
    if not zalaczniki_list(data):
        issues.append(("info", "Nie zarejestrowano załączników projektowych."))

    if not issues:
        issues.append(("info", "Dane kompletne – można generować dokumenty."))
    return issues


def export_date(data: dict) -> str:
    """Data w formacie rrrr.mm.dd używana w nazwach plików."""
    txt = s(data, "ogolne", "data")
    for fmt in ("%d.%m.%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return _dt.datetime.strptime(txt, fmt).strftime("%Y.%m.%d")
        except ValueError:
            continue
    return _dt.date.today().strftime("%Y.%m.%d")
