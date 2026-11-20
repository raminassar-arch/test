# -*- coding: utf-8 -*-
"""Import wartości pól z dowolnego dokumentu DOCX.

Moduł jest współdzielony przez wersję desktopową, lokalny WEB oraz stronę
statyczną (Pyodide). Używa wyłącznie biblioteki standardowej: ``zipfile`` oraz
``xml.etree.ElementTree`` — nie wymaga ``python-docx`` ani ``tkinter``.

Dokument DOCX jest ZIP-em z XML-em OOXML. Ekstraktor czyta akapity i tabele,
rozpoznaje etykiety pól (na podstawie etykiet z ``ui_specs`` oraz dodatkowych
aliasów) i zamienia znalezione wartości na typy zgodne z modelem projektu
(``content.blank_project``): tekst, wartość logiczną, wybór jednokrotny lub
listę wyborów.

Publiczne API:

    report = word_import.extract_docx(scieżka_lub_bajty)
    project = word_import.apply_import(project, report)
    project, report = word_import.import_docx(scieżka, project)

``report.matches`` zawiera rozpoznane pola wraz z wartością i fragmentem źródła.
Interfejsy mogą pokazać tę listę do akceptacji przed zastosowaniem importu.
"""

from __future__ import annotations

import copy
import io
import re
import unicodedata
import zipfile
from dataclasses import dataclass, field
from typing import Any, Iterable, Sequence
from xml.etree import ElementTree as ET

try:  # pragma: no cover – zależnie od sposobu uruchomienia
    import content as C
except ImportError:  # pragma: no cover
    from . import content as C  # type: ignore

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


# ---------------------------------------------------------------------------
# Specyfikacja pól
# ---------------------------------------------------------------------------

def _urzadzenia_pary() -> list[tuple[str, str]]:
    return [(str(x), str(x)) for x in C.URZADZENIA]


#: (sekcja, klucz, etykieta, rodzaj, opcje)
#: Kopia definicji z ``src/ui_specs.py`` — celowo bez importu tkinteru, aby ten
#: sam moduł działał w przeglądarce. Funkcja ``verify_specs()`` sprawdza zgodność.
FIELD_SPECS: list[tuple[str, str, str, str, Any]] = [
    ("ogolne", "nazwa", "Nazwa zamierzenia budowlanego", "e", None),
    ("ogolne", "adres", "Adres inwestycji", "e", None),
    ("ogolne", "dzialki", "Numery działek ewidencyjnych", "e", None),
    ("ogolne", "obreb", "Obręb ewidencyjny", "e", None),
    ("ogolne", "jednostka", "Jednostka ewidencyjna", "e", None),
    ("ogolne", "pow_dzialki", "Powierzchnia działki [m²]", "e", None),
    ("ogolne", "inwestor", "Inwestor", "e", None),
    ("ogolne", "inwestor_adres", "Adres inwestora", "e", None),
    ("ogolne", "kategoria", "Kategoria obiektu budowlanego", "c", C.KATEGORIE),
    ("ogolne", "rodzaj", "Rodzaj obiektu budowlanego", "c", C.RODZAJE),
    ("ogolne", "nr_projektu", "Nr projektu", "e", None),
    ("ogolne", "tom", "Tom", "e", None),
    ("ogolne", "data", "Data opracowania", "e", None),
    ("ogolne", "zakres", "Zakres opracowania", "e", None),
    ("ogolne", "organ", "Organ administracji architektoniczno-budowlanej", "e", None),
    ("ogolne", "organ_adres", "Adres organu", "e", None),
    ("ogolne", "osoba_wnioskujaca", "Wnioskodawca (imię i nazwisko)", "e", None),
    ("ogolne", "funkcja_wnioskujacego", "Funkcja wnioskodawcy", "c",
     C.FUNKCJE_WNIOSKUJACEGO),
    ("bioz", "wymagany", "Plan BIOZ wymagany dla tej inwestycji", "x", None),
    ("bioz", "zakres_prac", "Zakres robót budowlanych", "t", None),
    ("bioz", "kolejnosc", "Kolejność realizacji robót", "t", None),
    ("bioz", "istniejace", "Wykaz istniejących obiektów budowlanych", "t", None),
    ("bioz", "elementy", "Elementy zagospodarowania mogące stwarzać zagrożenie",
     "t", None),
    ("bioz", "zagrozenia", "Przewidywane zagrożenia podczas realizacji", "t", None),
    ("bioz", "prace_niebezpieczne", "Prace szczególnie niebezpieczne", "l",
     list(C.PRACE_NIEBEZPIECZNE)),
    ("bioz", "instruktaz", "Sposób prowadzenia instruktażu pracowników", "t", None),
    ("bioz", "srodki", "Środki techniczne i organizacyjne zapobiegające zagrożeniom",
     "t", None),
    ("bioz", "drogi", "Drogi ewakuacyjne i komunikacyjne", "t", None),
    ("bioz", "uwagi", "Uwagi dodatkowe", "t", None),
    ("pzt", "przedmiot", "Przedmiot zamierzenia budowlanego", "t", None),
    ("pzt", "zakres_zamierzenia", "Zakres zamierzenia (roboty, obiekty)", "t", None),
    ("pzt", "stan_istniejacy", "Opis stanu istniejącego", "t", None),
    ("pzt", "rozbiorka", "Przewiduje się rozbiórkę obiektów", "x", None),
    ("pzt", "rozbiorka_opis", "Zakres i sposób rozbiórki", "t", None),
    ("pzt", "zagospodarowanie", "Opis projektowanego zagospodarowania", "t", None),
    ("pzt", "urzadzenia_sel", "Urządzenia budowlane", "l", _urzadzenia_pary()),
    ("pzt", "urzadzenia", "Opis urządzeń budowlanych (uzupełniający)", "t", None),
    ("pzt", "scieki", "Odprowadzanie ścieków", "c", C.SCIEKI),
    ("pzt", "scieki_opis", "Opis gospodarki ściekowej", "t", None),
    ("pzt", "wody_opadowe", "Wody opadowe i roztopowe", "c", C.WODY_OPADOWE),
    ("pzt", "wody_opadowe_opis", "Opis zagospodarowania wód opadowych", "t", None),
    ("pzt", "dostep_drogi", "Sposób dostępu do drogi publicznej", "c", C.DOSTEP_DROGI),
    ("pzt", "dostep_opis", "Opis dostępu (zjazd, służebność, parametry)", "t", None),
    ("pzt", "komunikacja", "Układ komunikacyjny wewnątrz działki", "t", None),
    ("pzt", "uzbrojenie_sel", "Projektowane / istniejące sieci", "l", C.UZBROJENIE),
    ("pzt", "uzbrojenie_opis", "Parametry techniczne sieci i przyłączy", "t", None),
    ("pzt", "ksztaltowanie", "Ukształtowanie terenu i zmiany", "t", None),
    ("pzt", "zielen", "Urządzanie zieleni", "t", None),
    ("pzt", "ograniczenia", "Występują ograniczenia lub zakazy w zabudowie", "x", None),
    ("pzt", "ograniczenia_opis", "Opis ograniczeń", "t", None),
    ("pzt", "zabytek", "Status konserwatorski działki", "c", C.ZABYTEK),
    ("pzt", "zabytek_opis", "Zakres ochrony konserwatorskiej", "t", None),
    ("pzt", "gorniczy", "Teren położony w granicach terenu górniczego", "x", None),
    ("pzt", "gorniczy_opis", "Wpływ eksploatacji górniczej", "t", None),
    ("pzt", "srodowisko", "Charakter i cechy zagrożeń dla środowiska oraz higieny "
                          "i zdrowia ludzi", "t", None),
    ("pzt", "ppoz_drogi", "Wymagania w zakresie dróg pożarowych", "x", None),
    ("pzt", "ppoz_drogi_opis", "Opis dróg pożarowych", "t", None),
    ("pzt", "ppoz_woda", "Zaopatrzenie w wodę do zewnętrznego gaszenia pożaru",
     "t", None),
    ("pzt", "etapowanie", "Inwestycja realizowana etapami", "x", None),
    ("pzt", "etapy", "Opis etapów realizacji", "t", None),
    ("pzt", "obszar", "Usytuowanie obszaru oddziaływania", "c",
     C.OBSZAR_ODDZIALYWANIA),
    ("pzt", "obszar_przepisy", "Przepisy, na podstawie których wyznaczono obszar",
     "t", None),
    ("pzt", "obszar_opis", "Opis obszaru oddziaływania", "t", None),
    ("pzt", "mpzp_rodzaj", "Podstawa ustalenia sposobu zagospodarowania", "c",
     C.MPZP_RODZAJE),
    ("pzt", "mpzp_nazwa", "Oznaczenie uchwały / decyzji", "e", None),
    ("pzt", "mpzp_pow_zab", "Maks. powierzchnia zabudowy [%]", "e", None),
    ("pzt", "mpzp_pbc", "Min. powierzchnia biologicznie czynna [%]", "e", None),
    ("pzt", "mpzp_intens", "Maks. intensywność zabudowy", "e", None),
    ("pzt", "mpzp_wys", "Maks. wysokość zabudowy [m]", "e", None),
    ("pzt", "rysunki", "Projekt zawiera część rysunkową", "x", None),
    ("pzt", "rysunki_opis", "Zestawienie rysunków (uzupełniające)", "t", None),
    ("pzt", "zalaczniki", "Załączniki", "t", None),
    ("pzt", "inne", "Inne niezbędne dane (§ 14 pkt 7)", "t", None),
    ("pab", "program", "Zamierzony sposób użytkowania i program użytkowy", "t", None),
    ("pab", "forma", "Układ przestrzenny oraz forma architektoniczna", "t", None),
    ("pab", "wykonczenie", "Wykończenie zewnętrzne i wewnętrzne", "t", None),
    ("pab", "kubatura", "Kubatura [m³]", "e", None),
    ("pab", "pow_uzytkowa", "Powierzchnia użytkowa [m²]", "e", None),
    ("pab", "pow_calkowita", "Powierzchnia całkowita [m²]", "e", None),
    ("pab", "wysokosc", "Wysokość [m]", "e", None),
    ("pab", "dlugosc", "Długość [m]", "e", None),
    ("pab", "szerokosc", "Szerokość [m]", "e", None),
    ("pab", "srednica", "Średnica [m] (obiekty o przekroju kołowym)", "e", None),
    ("pab", "kondygnacje", "Liczba kondygnacji nadziemnych", "e", None),
    ("pab", "kondygnacje_podziemne", "Liczba kondygnacji podziemnych", "e", None),
    ("pab", "lokale_mieszkalne", "Liczba lokali mieszkalnych", "e", None),
    ("pab", "lokale_uzytkowe", "Liczba lokali użytkowych", "e", None),
    ("pab", "lokale_dostepne", "Liczba lokali dostępnych dla osób ze szczególnymi "
                               "potrzebami", "e", None),
    ("pab", "miejsca_postojowe", "Liczba miejsc postojowych", "e", None),
    ("pab", "geotechnika", "Opinia geotechniczna – warunki gruntowe", "t", None),
    ("pab", "posadowienie", "Sposób posadowienia obiektu", "t", None),
    ("pab", "dostepnosc", "Obiekt zapewnia dostępność dla osób ze szczególnymi "
                          "potrzebami", "x", None),
    ("pab", "dost_dojscie", "Dojście i wejście do obiektu", "t", None),
    ("pab", "dost_kondygnacje", "Komunikacja pionowa", "t", None),
    ("pab", "dost_pomieszczenia", "Pomieszczenia i ich wyposażenie", "t", None),
    ("pab", "dost_parkingi", "Miejsca postojowe dla osób ze szczególnymi potrzebami",
     "t", None),
    ("pab", "dost_rekreacja", "Warunki rekreacji i wypoczynku", "t", None),
    ("pab", "woda", "Zaopatrzenie w wodę", "t", None),
    ("pab", "scieki", "Odprowadzanie ścieków", "t", None),
    ("pab", "emisje", "Emisje i uciążliwości", "t", None),
    ("pab", "odpady", "Gospodarka odpadami", "t", None),
    ("pab", "akustyka", "Ochrona przed hałasem i drganiami", "t", None),
    ("pab", "srodowisko_grunt", "Oddziaływanie na grunt i wody gruntowe", "t", None),
    ("pab", "energia_zapotrzebowanie", "Zapotrzebowanie na energię", "t", None),
    ("pab", "energia_nosniki", "Nośniki energii", "t", None),
    ("pab", "energia_system_konw", "Systemy konwencjonalne", "t", None),
    ("pab", "energia_system_alt", "Systemy alternatywne / odnawialne źródła", "t", None),
    ("pab", "energia_wynik", "Wyniki analizy wariantów", "t", None),
    ("pab", "automatyka", "Automatyczna regulacja temperatury (§ 20 ust. 1 pkt 11)",
     "t", None),
    ("pab", "instalacje_sel", "Projektowane instalacje", "l", C.INSTALACJE),
    ("pab", "instalacje_opis", "Opis instalacji i urządzeń", "t", None),
    ("pab", "ppoz", "Warunki ochrony przeciwpożarowej", "t", None),
    ("pab", "ochrona_ludnosci", "Obiekt jest budowlą ochronną / obiektem zbiorowej "
                                "ochrony", "x", None),
    ("pab", "ol_rodzaj", "Rodzaj budowli ochronnej", "e", None),
    ("pab", "ol_pojemnosc", "Pojemność / liczba osób", "e", None),
    ("pab", "ol_kategoria", "Kategoria odporności budowli ochronnej", "e", None),
    ("pab", "ol_czas", "Czas ochrony", "e", None),
    ("pab", "ol_usytuowanie", "Usytuowanie względem obiektu", "t", None),
    ("pab", "ol_wyjscia", "Wyjścia ewakuacyjne i zapasowe", "t", None),
    ("pab", "ol_zagruzowanie", "Strefa zagruzowania", "t", None),
    ("pab", "ol_wysokosc", "Wysokość budowli ochronnej", "t", None),
    ("pab", "odstepstwo", "Projekt obejmuje odstępstwo od przepisów", "x", None),
    ("pab", "odstepstwo_opis", "Zakres i uzasadnienie odstępstwa", "t", None),
    ("pab", "rysunki", "Projekt zawiera część rysunkową", "x", None),
    ("pab", "uwagi", "Uwagi i informacje dodatkowe", "t", None),
]

_SPEC_BY_TARGET = {(s, k): (s, k, label, kind, options)
                   for s, k, label, kind, options in FIELD_SPECS}


def verify_specs() -> bool:
    """Zwraca True, gdy kopia specyfikacji zgadza się z ``ui_specs``."""
    try:  # pragma: no cover – tkinter bywa niedostępny w Pyodide
        try:
            import ui_specs as S
        except ImportError:
            from . import ui_specs as S  # type: ignore
    except ImportError:
        return True
    expected: list[tuple[str, str, str, str]] = []
    for section, groups in (
        ("ogolne", S.OGOLNE_GROUPS),
        ("bioz", S.BIOZ_GROUPS),
        ("pzt", S.PZT_GROUPS),
        ("pab", S.PAB_GROUPS),
    ):
        for _title, fields in groups:
            for key, label, kind, _arg in fields:
                expected.append((section, key, label, kind))
    actual = [(s, k, label, kind) for s, k, label, kind, _options in FIELD_SPECS]
    return actual == expected


# ---------------------------------------------------------------------------
# Aliasy etykiet
# ---------------------------------------------------------------------------

#: Dodatkowe nazwy spotykane w dokumentach Word (także w dokumentach wygenerowanych
#: przez PAB cyfrową). Klucze są normalizowane przez ``_alias_key``.
ALIASES: dict[str, list[tuple[str, str]]] = {
    "nazwa zamierzenia": [("ogolne", "nazwa")],
    "nazwa inwestycji": [("ogolne", "nazwa")],
    "przedmiotem zamierzenia budowlanego jest": [("ogolne", "nazwa")],
    "oświadczenie dotyczy realizacji zamierzenia budowlanego polegającego na":
        [("ogolne", "nazwa")],
    "adres zamierzenia": [("ogolne", "adres")],
    "dzialki ewidencyjne": [("ogolne", "dzialki")],
    "nr dzialek": [("ogolne", "dzialki")],
    "numery dzialek": [("ogolne", "dzialki")],
    "powierzchnia dzialki": [("ogolne", "pow_dzialki")],
    "kategoria obiektu": [("ogolne", "kategoria")],
    "kategoria obiektu budowlanego": [("ogolne", "kategoria")],
    "rodzaj obiektu": [("ogolne", "rodzaj")],
    "nr projektu": [("ogolne", "nr_projektu")],
    "numer projektu": [("ogolne", "nr_projektu")],
    "data": [("ogolne", "data")],
    "data opracowania": [("ogolne", "data")],
    "organ administracji architektoniczno budowlanej": [("ogolne", "organ")],
    "wnioskodawca": [("ogolne", "osoba_wnioskujaca")],
    "osoba wnioskujaca": [("ogolne", "osoba_wnioskujaca")],
    "przedmiot zamierzenia": [("pzt", "przedmiot")],
    "opis stanu istniejacego": [("pzt", "stan_istniejacy")],
    "rozbiorka": [("pzt", "rozbiorka")],
    "przewiduje sie rozbiorka obiektow": [("pzt", "rozbiorka")],
    "zagospodarowanie": [("pzt", "zagospodarowanie")],
    "urzadzenia budowlane": [("pzt", "urzadzenia_sel")],
    "odprowadzanie sciekow": [("pzt", "scieki"), ("pab", "scieki")],
    "gospodarka sciekowa": [("pzt", "scieki_opis")],
    "wody opadowe": [("pzt", "wody_opadowe")],
    "dostep do drogi publicznej": [("pzt", "dostep_drogi")],
    "uklad komunikacyjny": [("pzt", "komunikacja")],
    "projektowane istniejace sieci": [("pzt", "uzbrojenie_sel")],
    "uzbrojenie terenu": [("pzt", "uzbrojenie_sel")],
    "ksztaltowanie terenu": [("pzt", "ksztaltowanie")],
    "ochrona zabytkow": [("pzt", "zabytek")],
    "wymagania w zakresie drog pozarowych": [("pzt", "ppoz_drogi")],
    "drogi pozarowe": [("pzt", "ppoz_drogi")],
    "zaopatrzenie w wode do zewnetrznego gaszenia pozaru": [("pzt", "ppoz_woda")],
    "etapowanie": [("pzt", "etapowanie")],
    "obszar oddzialywania obiektu": [("pzt", "obszar")],
    "podstawa ustalenia zagospodarowania": [("pzt", "mpzp_rodzaj")],
    "oznaczenie uchwaly decyzji": [("pzt", "mpzp_nazwa")],
    "maks powierzchnia zabudowy": [("pzt", "mpzp_pow_zab")],
    "min powierzchnia biologicznie czynna": [("pzt", "mpzp_pbc")],
    "maks intensywnosc zabudowy": [("pzt", "mpzp_intens")],
    "maks wysokosc zabudowy": [("pzt", "mpzp_wys")],
    "czesc rysunkowa": [("pzt", "rysunki"), ("pab", "rysunki")],
    "program uzytkowy": [("pab", "program")],
    "zamierzony sposob uzytkowania": [("pab", "program")],
    "forma architektoniczna": [("pab", "forma")],
    "uklad przestrzenny": [("pab", "forma")],
    "wykonczenie": [("pab", "wykonczenie")],
    "kubatura": [("pab", "kubatura")],
    "powierzchnia uzytkowa": [("pab", "pow_uzytkowa")],
    "powierzchnia calkowita": [("pab", "pow_calkowita")],
    "wysokosc": [("pab", "wysokosc")],
    "dlugosc": [("pab", "dlugosc")],
    "szerokosc": [("pab", "szerokosc")],
    "srednica": [("pab", "srednica")],
    "kondygnacje": [("pab", "kondygnacje")],
    "liczba kondygnacji nadziemnych": [("pab", "kondygnacje")],
    "liczba kondygnacji podziemnych": [("pab", "kondygnacje_podziemne")],
    "liczba lokali mieszkalnych": [("pab", "lokale_mieszkalne")],
    "liczba lokali uzytkowych": [("pab", "lokale_uzytkowe")],
    "liczba lokali dostepnych dla osob ze szczegonymi potrzebami":
        [("pab", "lokale_dostepne")],
    "liczba miejsc postojowych": [("pab", "miejsca_postojowe")],
    "opinia geotechniczna": [("pab", "geotechnika")],
    "warunki gruntowe": [("pab", "geotechnika")],
    "sposob posadowienia": [("pab", "posadowienie")],
    "dostepnosc": [("pab", "dostepnosc")],
    "dostepnosc dla osob ze szczegonymi potrzebami": [("pab", "dostepnosc")],
    "dojscie i wejscie": [("pab", "dost_dojscie")],
    "komunikacja pionowa": [("pab", "dost_kondygnacje")],
    "pomieszczenia": [("pab", "dost_pomieszczenia")],
    "miejsca postojowe dla osob ze szczegonymi potrzebami": [("pab", "dost_parkingi")],
    "warunki rekreacji i wypoczynku": [("pab", "dost_rekreacja")],
    "zaopatrzenie w wode": [("pab", "woda")],
    "emisje i uciazliwosci": [("pab", "emisje")],
    "gospodarka odpadami": [("pab", "odpady")],
    "ochrona przed halasem": [("pab", "akustyka")],
    "oddzialywanie na grunt i wody gruntowe": [("pab", "srodowisko_grunt")],
    "zapotrzebowanie na energie": [("pab", "energia_zapotrzebowanie")],
    "nosniki energii": [("pab", "energia_nosniki")],
    "systemy konwencjonalne": [("pab", "energia_system_konw")],
    "systemy alternatywne": [("pab", "energia_system_alt")],
    "odnawialne zrodla energii": [("pab", "energia_system_alt")],
    "wyniki analizy wariantow": [("pab", "energia_wynik")],
    "automatyczna regulacja temperatury": [("pab", "automatyka")],
    "projektowane instalacje": [("pab", "instalacje_sel")],
    "instalacje i urzadzenia": [("pab", "instalacje_opis")],
    "ochrona przeciwpozarowa": [("pab", "ppoz")],
    "ochrona ludnosci": [("pab", "ochrona_ludnosci")],
    "rodzaj budowli ochronnej": [("pab", "ol_rodzaj")],
    "pojemnosc liczba osob": [("pab", "ol_pojemnosc")],
    "kategoria odpornosci budowli ochronnej": [("pab", "ol_kategoria")],
    "czas ochrony": [("pab", "ol_czas")],
    "usytuowanie wzgledem obiektu": [("pab", "ol_usytuowanie")],
    "wyjscia ewakuacyjne i zapasowe": [("pab", "ol_wyjscia")],
    "strefa zagruzowania": [("pab", "ol_zagruzowanie")],
    "wysokosc budowli ochronnej": [("pab", "ol_wysokosc")],
    "odstepstwo od przepisow": [("pab", "odstepstwo")],
    "zakres i uzasadnienie odstepstwa": [("pab", "odstepstwo_opis")],
    "uwagi dodatkowe": [("bioz", "uwagi")],
    "uwagi i informacje dodatkowe": [("pab", "uwagi")],
    "plan bioz": [("bioz", "wymagany")],
    "wymagany plan bioz": [("bioz", "wymagany")],
    "zakres robot budowlanych": [("bioz", "zakres_prac")],
    "kolejnosc realizacji robot": [("bioz", "kolejnosc")],
    "wykaz istniejacych obiektow budowlanych": [("bioz", "istniejace")],
    "elementy zagospodarowania": [("bioz", "elementy")],
    "przewidywane zagrozenia": [("bioz", "zagrozenia")],
    "prace szczegolnie niebezpieczne": [("bioz", "prace_niebezpieczne")],
    "instruktaz pracownikow": [("bioz", "instruktaz")],
    "srodki techniczne i organizacyjne": [("bioz", "srodki")],
    "drogi ewakuacyjne i komunikacyjne": [("bioz", "drogi")],
}


def _norm(text: Any) -> str:
    """Normalizuje tekst do porównywania etykiet (bez polskich znaków)."""
    raw = "" if text is None else str(text).lower()
    # 'ł' nie rozkłada się przez NFKD – musi być zamienione ręcznie.
    raw = raw.replace("ł", "l").replace("Ł", "l")
    raw = "".join(ch for ch in unicodedata.normalize("NFKD", raw)
                  if not unicodedata.combining(ch))
    raw = re.sub(r"^\s*\d+\s*[\.\)]\s*", "", raw)
    raw = re.sub(r"[^a-z0-9]+", " ", raw)
    return re.sub(r"\s+", " ", raw).strip()


def _alias_key(text: Any) -> str:
    key = _norm(text)
    key = re.sub(r"\s*\([^)]*\)\s*$", "", key)
    key = re.sub(r"\s*\[[^\]]*\]\s*$", "", key)
    return key.strip()


def _build_alias_index() -> dict[str, list[tuple[str, str]]]:
    index: dict[str, list[tuple[str, str]]] = {}

    def add(alias: str, target: tuple[str, str]) -> None:
        key = _alias_key(alias)
        if not key:
            return
        bucket = index.setdefault(key, [])
        if target not in bucket:
            bucket.append(target)

    for section, key, label, _kind, _options in FIELD_SPECS:
        add(label, (section, key))
        add(re.sub(r"\s*\([^)]*\)\s*$", "", label), (section, key))
        add(re.sub(r"\s*\[[^\]]*\]\s*$", "", label), (section, key))
    for alias, targets in ALIASES.items():
        for target in targets:
            add(alias, target)
    return index


ALIAS_INDEX = _build_alias_index()

_TRUE_WORDS = {"tak", "yes", "true", "1", "x", "wymagany", "jest", "obecny",
               "zaznaczone", "zaznaczona", "zaznaczony"}
_FALSE_WORDS = {"nie", "no", "false", "0", "brak", "nie dotyczy", "nie wymagany",
                "niezaznaczone", "odznaczone"}
_PLACEHOLDER_RE = re.compile(
    r"^(?:[\[\(‹「].*[\]\)›」]|do uzupełnienia|uzupełnić|brak|nie dotyczy|"
    r"—+|-+|\.{3,}|…+)$", re.I)

_INLINE_RE = re.compile(
    r"^\s*(?P<label>[^:;–—\n]{2,140}?)\s*(?::|;|–|—|\s+-\s+)\s*(?P<value>.+?)\s*$",
    re.S)

_NARRATIVE_RULES: list[tuple[re.Pattern[str], tuple[str, str]]] = [
    (re.compile(r"Przedmiotem zamierzenia budowlanego jest\s*:\s*(.+?)\s*(?:\.\s|$)",
                re.I | re.S), ("ogolne", "nazwa")),
    (re.compile(r"Rodzaj obiektu budowlanego\s*:\s*(.+?)\s*(?:\.|,|$)",
                re.I | re.S), ("ogolne", "rodzaj")),
    (re.compile(r"Kategori\w*\s+obiektu budowlanego\s+określa się jako\s*:\s*(.+?)\s*(?:\.|$)",
                re.I | re.S), ("ogolne", "kategoria")),
    (re.compile(r"Inwestorem zamierzenia budowlanego jest\s+(.+?)(?:,\s|\.\s|$)",
                re.I | re.S), ("ogolne", "inwestor")),
    (re.compile(r"Zakres opracowania\s*:\s*(.+?)\s*(?:\.|$)", re.I | re.S),
     ("ogolne", "zakres")),
    (re.compile(r"działk\w*(?:/działk\w*)?\s+ewidencyjnymi nr\s+(.+?)\s*,\s*położon",
                re.I | re.S), ("ogolne", "dzialki")),
]


# ---------------------------------------------------------------------------
# Wynik importu
# ---------------------------------------------------------------------------

@dataclass
class FieldMatch:
    """Pojedyncze rozpoznane pole."""

    section: str
    key: str
    label: str
    value: Any
    kind: str
    source: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "section": self.section,
            "key": self.key,
            "label": self.label,
            "value": self.value,
            "kind": self.kind,
            "source": self.source,
        }

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "FieldMatch":
        return cls(
            section=str(payload.get("section", "")),
            key=str(payload.get("key", "")),
            label=str(payload.get("label", "")),
            value=payload.get("value", ""),
            kind=str(payload.get("kind", "")),
            source=str(payload.get("source", "")),
        )

    def display_value(self) -> str:
        if isinstance(self.value, bool):
            return "tak" if self.value else "nie"
        if isinstance(self.value, list):
            return ", ".join(str(x) for x in self.value)
        return str(self.value)


@dataclass
class ImportReport:
    """Raport ekstrakcji DOCX."""

    matches: list[FieldMatch] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "matches": [m.to_dict() for m in self.matches],
            "warnings": list(self.warnings),
            "count": len(self.matches),
        }

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "ImportReport":
        return cls(
            matches=[FieldMatch.from_dict(x) for x in (payload.get("matches") or [])],
            warnings=[str(x) for x in (payload.get("warnings") or [])],
        )

    def summary(self) -> str:
        if not self.matches:
            return "Nie rozpoznano żadnych pól w dokumencie."
        names = ", ".join(
            "%s.%s" % (m.section, m.key) for m in self.matches[:6])
        if len(self.matches) > 6:
            names += ", …"
        return "Rozpoznano %d pól: %s." % (len(self.matches), names)


# ---------------------------------------------------------------------------
# Parsowanie OOXML
# ---------------------------------------------------------------------------

def _local(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _paragraph_text(paragraph: ET.Element) -> str:
    parts: list[str] = []
    for node in paragraph.iter():
        tag = _local(node.tag)
        if tag == "t" and node.text:
            parts.append(node.text)
        elif tag == "tab":
            parts.append("\t")
        elif tag in ("br", "cr"):
            parts.append("\n")
    return "".join(parts)


def _table_rows(table: ET.Element) -> list[list[str]]:
    rows: list[list[str]] = []
    for tr in table.findall(W + "tr"):
        row: list[str] = []
        for tc in tr.findall(W + "tc"):
            texts = [_paragraph_text(p) for p in tc.findall(".//" + W + "p")]
            row.append("\n".join(t for t in texts if t.strip()))
        if any(cell.strip() for cell in row):
            rows.append(row)
    return rows


def _iter_blocks(parent: ET.Element) -> Iterable[dict[str, Any]]:
    """Oddaje akapity i tabele w kolejności dokumentu (bez duplikatów)."""
    for child in list(parent):
        tag = _local(child.tag)
        if tag == "p":
            text = _paragraph_text(child)
            if text.strip():
                yield {"type": "p", "text": text}
        elif tag == "tbl":
            rows = _table_rows(child)
            if rows:
                yield {"type": "tbl", "rows": rows}
        else:
            yield from _iter_blocks(child)


def _blocks_from_xml(xml: bytes) -> list[dict[str, Any]]:
    root = ET.fromstring(xml)
    body = root.find(W + "body")
    return list(_iter_blocks(body if body is not None else root))


def _docx_parts(raw: bytes) -> list[str]:
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = set(archive.namelist())
        if "word/document.xml" not in names:
            raise ValueError("Plik nie jest dokumentem DOCX (brak word/document.xml).")
        ordered = ["word/document.xml"]
        for name in sorted(names):
            if (name.startswith("word/header") or name.startswith("word/footer")) \
                    and name.endswith(".xml") and name not in ordered:
                ordered.append(name)
        return [name for name in ordered if name in names]


def _read_blocks(raw: bytes) -> tuple[list[dict[str, Any]], zipfile.ZipFile]:
    """Zwraca bloki tekstu. ZIP jest zamykany po odczycie."""
    blocks: list[dict[str, Any]] = []
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = set(archive.namelist())
        if "word/document.xml" not in names:
            raise ValueError("Plik nie jest dokumentem DOCX (brak word/document.xml).")
        ordered = ["word/document.xml"]
        for name in sorted(names):
            if (name.startswith("word/header") or name.startswith("word/footer")) \
                    and name.endswith(".xml") and name not in ordered:
                ordered.append(name)
        for name in ordered:
            try:
                blocks.extend(_blocks_from_xml(archive.read(name)))
            except ET.ParseError:
                continue
    return blocks, None  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Konwersja wartości
# ---------------------------------------------------------------------------

def _clean_value(value: Any) -> str:
    text = "" if value is None else str(value)
    text = text.replace("\u00a0", " ").replace("\r\n", "\n").replace("\r", "\n")
    text = "\n".join(line.strip() for line in text.split("\n"))
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip(" \t\n")


def _is_placeholder(value: str) -> bool:
    return bool(_PLACEHOLDER_RE.match(value.strip()))


def _parse_bool(value: str) -> bool | None:
    stripped = value.strip()
    if stripped[:1] in ("☑", "✓", "✔"):
        return True
    if stripped[:1] in ("☐", "○", "◯"):
        return False
    norm = _norm(value)
    if norm in _TRUE_WORDS:
        return True
    if norm in _FALSE_WORDS:
        return False
    if norm.startswith("nie "):
        return False
    if norm.startswith("tak "):
        return True
    return None


def _option_pairs(options: Any) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    if not options:
        return pairs
    for item in options:
        if isinstance(item, (tuple, list)) and len(item) >= 2:
            pairs.append((str(item[0]), str(item[1])))
        else:
            pairs.append((str(item), str(item)))
    return pairs


def _choice_value(value: str, options: Any, for_key: bool = False) -> Any | None:
    pairs = _option_pairs(options)
    if not pairs:
        return None
    norm = _norm(value)
    if not norm:
        return None
    for key, label in pairs:
        if norm == _norm(label) or norm == _norm(key):
            return key if for_key else label
    if len(norm) < 4:
        return None
    found: list[tuple[str, str]] = []
    for key, label in pairs:
        nlabel, nkey = _norm(label), _norm(key)
        if norm in nlabel or nlabel in norm or norm in nkey or nkey in norm:
            found.append((key, label))
    if len(found) == 1:
        key, label = found[0]
        return key if for_key else label
    return None


def _list_values(value: str, options: Any) -> list[str] | None:
    parts = [p for p in re.split(r"[;\n•]+|,\s*", value) if p.strip()]
    out: list[str] = []
    for part in parts:
        key = _choice_value(part, options, for_key=True)
        if key is not None and key not in out:
            out.append(key)
    return out or None


def _convert(value: str, spec: tuple[str, str, str, str, Any]) -> Any | None:
    _section, _key, _label, kind, options = spec
    if kind == "x":
        return _parse_bool(value)
    if kind == "c":
        return _choice_value(value, options)
    if kind == "l":
        return _list_values(value, options)
    if _is_placeholder(value):
        return None
    return value


def _resolve_targets(label: str, value: str) -> list[tuple[str, str]]:
    key = _alias_key(label)
    targets = list(ALIAS_INDEX.get(key, ()))
    if len(targets) <= 1:
        return targets
    scored: list[tuple[int, tuple[str, str]]] = []
    for target in targets:
        spec = _SPEC_BY_TARGET.get(target)
        if spec is None:
            scored.append((0, target))
            continue
        kind, options = spec[3], spec[4]
        score = 0
        if kind in ("c", "l") and _choice_value(value, options) is not None:
            score += 3
        if kind == "x" and _parse_bool(value) is not None:
            score += 3
        if kind in ("e", "t") and not _is_placeholder(value):
            score += 1
        scored.append((score, target))
    best = max(score for score, _target in scored)
    if best == 0:
        return targets[:1]
    return [target for score, target in scored if score == best][:2]


# ---------------------------------------------------------------------------
# Ekstrakcja
# ---------------------------------------------------------------------------

#: Wartość, która sama jest nazwą pola, to najprawdopodobniej nagłówek tabeli
#: lub sąsiednia etykieta – nie może nadpisać prawdziwej danej.
_LIST_ITEM_RE = re.compile(r"^\s*(?:[•◦▪‣]|[-\u2013\u2014]|\d+[\.\)])\s")


def _add_candidate(report: ImportReport, seen: set[str], label: str,
                   raw_value: Any, source: str) -> None:
    value = _clean_value(raw_value)
    if not value:
        return
    # Pojedyncze kropki i znaki interpunkcyjne to w PDF-ach fragmenty spisu
    # treści / linii wypełniających, a nie wartości pól.
    if re.fullmatch(r"[.\s,…\-–—_]+", value):
        return
    if len(value) <= 80 and _alias_key(value) in ALIAS_INDEX:
        return
    if _LIST_ITEM_RE.match(value):
        return
    targets = _resolve_targets(label, value)
    if not targets:
        return
    for target in targets:
        spec = _SPEC_BY_TARGET.get(target)
        if spec is None:
            continue
        parsed = _convert(value, spec)
        if parsed is None:
            continue
        signature = "%s.%s=%s" % (target[0], target[1], repr(parsed))
        if signature in seen:
            continue
        seen.add(signature)
        report.matches.append(FieldMatch(
            section=target[0], key=target[1], label=spec[2],
            value=parsed, kind=spec[3], source=source[:160]))

        # W dokumentach PAB strona tytułowa trzyma inwestora i jego adres
        # w jednej komórce, w drugiej linii.
        if target == ("ogolne", "inwestor") and "\n" in value:
            lines = [line.strip() for line in value.split("\n") if line.strip()]
            if len(lines) > 1:
                addr = _clean_value("\n".join(lines[1:]))
                sig2 = "ogolne.inwestor_adres=" + repr(addr)
                if addr and sig2 not in seen:
                    seen.add(sig2)
                    report.matches.append(FieldMatch(
                        section="ogolne", key="inwestor_adres",
                        label="Adres inwestora", value=addr, kind="e",
                        source=source[:160]))


def _looks_like_header_row(cells: list[str]) -> bool:
    """Wykrywa wiersz nagłówkowy tabeli (same krótkie etykiety bez liczb)."""
    non_empty = [cell for cell in cells if cell]
    if len(non_empty) < 3:
        return False
    short = 0
    for cell in non_empty:
        plain = _alias_key(cell)
        if plain and len(plain) <= 40 and not re.search(r"\d", plain):
            short += 1
    return short >= max(2, len(non_empty) - 1)


def _source_snippet(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()[:160]


def _scan_blocks(blocks: list[dict[str, Any]], report: ImportReport,
                 seen: set[str]) -> None:
    for index, block in enumerate(blocks):
        if block["type"] == "p":
            text = _clean_value(block["text"])
            if not text:
                continue
            source = _source_snippet(text)
            applied_narrative = False
            for regex, target in _NARRATIVE_RULES:
                match = regex.search(text)
                if not match:
                    continue
                spec = _SPEC_BY_TARGET.get(target)
                if spec is None:
                    continue
                parsed = _convert(_clean_value(match.group(1)), spec)
                if parsed is None:
                    continue
                signature = "%s.%s=%s" % (target[0], target[1], repr(parsed))
                if signature not in seen:
                    seen.add(signature)
                    report.matches.append(FieldMatch(
                        section=target[0], key=target[1], label=spec[2],
                        value=parsed, kind=spec[3], source=source))
                    applied_narrative = True
            inline = _INLINE_RE.match(text)
            if inline:
                _add_candidate(report, seen, inline.group("label"),
                               inline.group("value"), source)
                continue
            if applied_narrative:
                continue
            # Etykieta w osobnym akapicie, wartość w kolejnym bloku.
            # Pomiń punkty listy i nagłówki zakończone przecinkiem – w plikach
            # wygenerowanych przez PAB tworzyły fałszywe dopasowania.
            if (len(text) <= 140 and not _LIST_ITEM_RE.match(text)
                    and not text.rstrip().endswith(",")
                    and _alias_key(text) in ALIAS_INDEX):
                for next_block in blocks[index + 1:index + 4]:
                    if next_block["type"] == "p":
                        candidate = _clean_value(next_block["text"])
                    else:
                        rows = next_block["rows"]
                        flat = [cell for row in rows for cell in row if cell.strip()]
                        candidate = flat[0] if flat else ""
                    if candidate:
                        _add_candidate(report, seen, text, candidate,
                                       _source_snippet(text + " " + candidate))
                        break
        else:
            for row in block["rows"]:
                cells = [_clean_value(cell) for cell in row]
                if _looks_like_header_row(cells):
                    continue
                source = _source_snippet(" | ".join(cells))
                for pos in range(len(cells) - 1):
                    label, value = cells[pos], cells[pos + 1]
                    if not label or not value:
                        continue
                    inline = _INLINE_RE.match(value)
                    if inline and _alias_key(inline.group("label")) in ALIAS_INDEX:
                        _add_candidate(report, seen, inline.group("label"),
                                       inline.group("value"), source)
                    _add_candidate(report, seen, label, value, source)


def _text_to_blocks(text: str) -> list[dict[str, Any]]:
    """Zamienia tekst z PDF-a na bloki zgodne z :func:`_scan_blocks`.

    PDF-y generowane przez PAB cyfrową (oraz większość dokumentów
    „etykieta – wartość”) mają etykietę i wartość w tej samej linii, rozdzielone
    kilkoma spacjami. Zamieniamy taką linię na wiersz tabeli, dzięki czemu
    wielokrotnie użyty mechanizm dopasowań DOCX działa identycznie dla PDF.
    """
    text = text.replace("\f", "\n").replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in text.split("\n")]
    blocks: list[dict[str, Any]] = []

    def split_columns(line: str) -> list[str]:
        return [cell.strip() for cell in re.split(r"\s{2,}", line.strip())
                if cell.strip()]

    def is_label(line: str) -> bool:
        return bool(_alias_key(line) in ALIAS_INDEX)

    def is_inline_label(line: str) -> bool:
        match = _INLINE_RE.match(line)
        return bool(match and _alias_key(match.group("label")) in ALIAS_INDEX)

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        cells = split_columns(line)
        if len(cells) >= 2 and is_label(cells[0]):
            blocks.append({"type": "tbl", "rows": [cells]})
            i += 1
            continue

        if is_inline_label(line):
            blocks.append({"type": "p", "text": line})
            i += 1
            continue

        if is_label(line):
            # Etykieta w osobnej linii – wartość może być wieloliniowa.
            blocks.append({"type": "p", "text": line})
            values: list[str] = []
            j = i + 1
            while j < len(lines) and len(values) < 8:
                nxt = lines[j].strip()
                if not nxt:
                    break
                ncells = split_columns(nxt)
                if (len(ncells) >= 3
                        or (len(ncells) >= 2 and is_label(ncells[0]))
                        or is_label(nxt) or is_inline_label(nxt)):
                    break
                values.append(nxt)
                j += 1
            if values:
                blocks.append({"type": "p", "text": "\n".join(values)})
                i = j
            else:
                i += 1
            continue

        blocks.append({"type": "p", "text": line})
        i += 1
    return blocks


def extract_text(text: str, source_name: str = "dokumentu") -> ImportReport:
    """Wyciąga pola z już odczytanego tekstu (używane przez import PDF).

    ``source_name`` trafia tylko do komunikatów dla użytkownika.
    """
    report = ImportReport()
    _scan_blocks(_text_to_blocks(text or ""), report, set())
    if not report.matches:
        report.warnings.append(
            "Nie znaleziono etykiet znanych pól w tekście %s. Sprawdź, czy "
            "PDF zawiera tekst (nie jest skanem) i czy użyto np. „Inwestor:” "
            "albo „Adres inwestycji:”." % source_name)
    return report


def extract_docx(source: Any) -> ImportReport:
    """Wyciąga rozpoznane wartości pól z dokumentu DOCX.

    ``source`` może być ścieżką, bajtami lub obiektem plikowym. Zwraca
    :class:`ImportReport`; żadne dane projektu nie są zmieniane.
    """
    if isinstance(source, (bytes, bytearray, memoryview)):
        raw = bytes(source)
    elif hasattr(source, "read"):
        raw = source.read()
    else:
        with open(str(source), "rb") as fh:
            raw = fh.read()
    if not raw:
        raise ValueError("Plik DOCX jest pusty.")

    report = ImportReport()
    try:
        blocks, _ = _read_blocks(raw)
    except zipfile.BadZipFile as exc:
        raise ValueError("Plik nie jest prawidłowym dokumentem DOCX (ZIP uszkodzony).") \
            from exc
    _scan_blocks(blocks, report, set())
    if not report.matches:
        report.warnings.append(
            "Nie znaleziono etykiet znanych pól. Sprawdź, czy w dokumencie "
            "użyto np. „Inwestor:”, „Adres inwestycji:” albo tabeli etykieta–wartość.")
    return report


# ---------------------------------------------------------------------------
# Stosowanie wyników
# ---------------------------------------------------------------------------

def _selected_flags(selected: Any, count: int) -> list[bool]:
    if selected is None:
        return [True] * count
    if isinstance(selected, set):
        return [i in selected for i in range(count)]
    if isinstance(selected, dict):
        return [bool(selected.get(i, selected.get(str(i), True))) for i in range(count)]
    if isinstance(selected, Sequence) and not isinstance(selected, (str, bytes)):
        if len(selected) == count and all(isinstance(x, bool) for x in selected):
            return [bool(x) for x in selected]
        chosen = {int(x) for x in selected}
        return [i in chosen for i in range(count)]
    return [True] * count


def _has_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, tuple, dict)):
        return bool(value)
    return bool(value)


def apply_import(project: dict[str, Any] | None, report: ImportReport,
                 selected: Any = None, overwrite: bool = True) -> dict[str, Any]:
    """Stosuje wybrane wyniki do kopii projektu i zwraca nowy słownik.

    ``selected`` może być listą flag, zbiorem indeksów lub słownikiem
    ``{indeks: bool}``. Domyślnie stosowane są wszystkie rozpoznane pola.
    """
    out = copy.deepcopy(project) if project is not None else C.blank_project()
    if not isinstance(out, dict):
        out = C.blank_project()
    flags = _selected_flags(selected, len(report.matches))
    changed: dict[tuple[str, str], Any] = {}
    for i, match in enumerate(report.matches):
        if not flags[i]:
            continue
        section = out.get(match.section)
        if not isinstance(section, dict):
            section = {}
            out[match.section] = section
        if not overwrite and _has_value(section.get(match.key)):
            continue
        section[match.key] = copy.deepcopy(match.value)
        changed[(match.section, match.key)] = match.value
    # Scalenie uzupełnia brakujące sekcje/klucze i normalizuje „dokumenty”.
    return C.merge_defaults(out)


def import_docx(source: Any, project: dict[str, Any] | None = None,
                selected: Any = None, overwrite: bool = True
                ) -> tuple[dict[str, Any], ImportReport]:
    """Wygodny skrót: ekstrakcja + zastosowanie do projektu."""
    report = extract_docx(source)
    return apply_import(project, report, selected=selected,
                        overwrite=overwrite), report


__all__ = [
    "FIELD_SPECS", "FieldMatch", "ImportReport", "ALIASES",
    "extract_docx", "extract_text", "apply_import", "import_docx",
    "verify_specs",
]
