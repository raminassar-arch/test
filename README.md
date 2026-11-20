# PAB cyfrowa – wersja Google Sites (statyczna)

Statyczna wersja programu: **same pliki HTML, CSS i JavaScript**, bez serwera
i bez Pythona na komputerze użytkownika. Wystarczy dowolny hosting statyczny
(GitHub Pages, Netlify, Cloudflare Pages, serwer WWW) albo osadzenie w Google
Sites. Dokumenty powstają w przeglądarce użytkownika.

Wersja desktopowa (`src\`, `dist\PAB-cyfrowa.exe`) i serwerowa (`web\`) pozostają
nietknięte – ten katalog jest całkowicie niezależny.

## Adres publikacji

| Co | Adres |
| --- | --- |
| Aplikacja | https://raminassar-arch.github.io/test/ |
| Pomocnik osadzania (Google Sites) | https://raminassar-arch.github.io/test/embed.html |
| Repozytorium | https://github.com/raminassar-arch/test |

Hosting: GitHub Pages, gałąź `main`, katalog główny (`/`).

---

## Jak to działa

| Warstwa | Plik | Rola |
| --- | --- | --- |
| Silnik treści | `engine\content.py`, `engine\exporters.py` | **ten sam kod co w wersji desktopowej**, uruchamiany przez Pyodide (Python w WebAssembly) |
| Formularze | `js\fields.js` | wygenerowany z `src\ui_specs.py` – jedno źródło definicji pól |
| DOCX | `js\docx.js`, `js\zip.js` | zapis OOXML i archiwum ZIP w czystym JavaScripcie |
| Podgląd i wydruk | `js\render.js` | podgląd HTML oraz samodzielny dokument A4 do druku / PDF |
| Płatności | `js\payment.js` | dostęp do PDF/DOCX per dokument; linki do uzupełnienia |
| Interfejs | `js\app.js`, `app.css`, `index.html` | routing, formularze, eksport, kontrola |

Kluczowa decyzja: **teksty prawne nie są przepisane na JavaScript**. `content.py`
(ok. 2,4 tys. linii) jest kopiowany do `engine\` i wykonywany w przeglądarce,
dzięki czemu PZT, PAB, wniosek, oświadczenie, BIOZ i wykaz załączników są
identyczne z wersją desktopową – również po każdej przyszłej zmianie przepisów.

Pyodide (0.28.3) jest pobierany z CDN `cdn.jsdelivr.net` przy pierwszym
uruchomieniu (ok. 10 MB). Potrzebny jest internet. Kolejne uruchomienia korzystają
z pamięci podręcznej przeglądarki.

---

## Publikacja

### GitHub Pages (najprościej)

1. Utwórz repozytorium, np. `pab-cyfrowa`.
2. Wgraj **całą zawartość katalogu `sites\`** do gałęzi `main`
   (`index.html` musi być w katalogu głównym repozytorium).
3. W repozytorium: *Settings → Pages → Source: Deploy from a branch*,
   gałąź `main`, katalog `/ (root)`.
4. Po chwili program będzie pod adresem
   `https://twoja-nazwa.github.io/pab-cyfrowa/`.

### Netlify Drop

1. Wejdź na `app.netlify.com/drop`.
2. Przeciągnij **katalog `sites\`** (nie pojedyncze pliki).
3. Dostaniesz adres w rodzaju `https://pab-cyfrowa.netlify.app/`.

### Własny serwer

Skopiuj zawartość `sites\` do katalogu obsługiwanego przez serwer WWW.
Wymagania: poprawne typy MIME dla `.js`, `.css`, `.svg`, `.py` oraz `.wasm`
(typy `.py` i `.wasm` ustawia Pyodide/CDN, ale `.py` musi być podawany jako
tekst – na typowych hostingach statycznych działa to domyślnie).

> **Nie otwieraj `index.html` przez `file://`.** Przeglądarki blokują wtedy
> `fetch` plików `engine\*.py` i WebAssembly. Potrzebny jest adres `http(s)://`.

### Co wgrywać na hosting

Do działania aplikacji wystarczą:

```
index.html
app.css
favicon.svg
embed.html        (opcjonalnie – pomocnik osadzania)
engine\content.py
engine\exporters.py
engine\manifest.json
js\fields.js
js\zip.js
js\docx.js
js\render.js
js\payment.js
js\boot.js
js\app.js
```

Pliki `build_site.py`, `parity_*.py`, `parity_hash.py`, `check_zip.py`
i `_parity_desktop.json` to narzędzia autora – nie są potrzebne na serwerze
i można ich nie wgrywać.

---

## Osadzenie w Google Sites

W katalogu jest gotowy pomocnik: **`embed.html`**. Otwórz go z opublikowanego
adresu (np. `https://twoja-nazwa.github.io/pab-cyfrowa/embed.html`), wklej adres
aplikacji, skopiuj wygenerowany kod i w Google Sites użyj
**Wstaw → Osadź → Kod osadzania**.

Szkielet kodu:

```html
<iframe src="https://twoja-nazwa.github.io/pab-cyfrowa/"
        title="PAB cyfrowa – dokumentacja do pozwolenia na budowę"
        style="width:100%;height:1000px;border:0;display:block"
        allow="clipboard-write"></iframe>
```

Po wstawieniu rozciągnij blok na całą szerokość i ustaw wysokość ok. 900–1200 px
(zawartość nie zmienia rozmiaru bloku w Google Sites).

### Ograniczenia osadzenia

* **Pamięć przeglądarki.** Projekt i stan dostępu do płatnych plików są zapisywane
  w `localStorage`. W części przeglądarek (Safari, tryb prywatny) pamięć jest
  blokowana dla stron osadzonych w obcej domenie – program działa, ale dane nie
  zapisują się między odświeżeniami.
* **Zalecenie:** w Google Sites umieść przede wszystkim odnośnik
  „Otwórz PAB cyfrowa” (samodzielna karta), a osadzenie traktuj jako podgląd.
* Pobrane pliki DOCX oraz wydruk PDF trafiają do pobranych przeglądarki –
  Google Sites nie pośredniczy w ich zapisie.

---

## Aktualizacja po zmianach w `src\`

Po każdej zmianie `src\content.py`, `src\exporters.py` lub `src\ui_specs.py`:

```powershell
python sites\build_site.py
```

Skrypt:

* kopiuje `content.py` i `exporters.py` do `sites\engine\` (z sumami SHA-256
  w `engine\manifest.json`),
* generuje `sites\js\fields.js` z definicji pól (`ui_specs.py`),
* wypisuje liczbę pól, grup i wersję.

Następnie **podnieś numer wersji w odnośnikach `?v=`** w `index.html`
(`app.css?v=1.6.0`, `js\app.js?v=1.6.0`, …). Bez tego przeglądarki użytkowników
mogą trzymać stare pliki z pamięci podręcznej. Wersja `1.6.0` oznacza wersję
statyczną z płatnościami za dokumenty (bez licencji i bez TXT).

---

## Weryfikacja zgodności z wersją desktopową

Skrypty pomocnicze (wymagają Pythona z `python-docx`, czyli środowiska autora):

```powershell
# 1. Porównanie DOCX: akapity i tabele, wszystkie 7 dokumentów
python sites\parity_check.py <katalog_z_pobranymi_docx>

# 2. Zrzut wzorcowych akapitów i tabel z wersji desktopowej (do porównania w przeglądarce)
python sites\parity_dump.py

# 3. Kontrola paczki ZIP pobranej z wersji desktopowej (DOCX przez python-docx)
python sites\check_zip.py <paczka.zip>
```

Wzorzec porównania: `content.demo_project()` (przycisk **Wczytaj przykład**).
Ostatni wynik: **7/7 dokumentów zgodnych** – akapity i tabele identyczne
z wersją desktopową.

`_parity_desktop.json` to plik generowany przez `parity_dump.py` na potrzeby
porównania w przeglądarce – nie jest potrzebny do działania aplikacji.

---

## Płatności za dokumenty

Wersja statyczna (GitHub Pages / Google Sites) **nie ma licencji ani okresu
próbnego**. Zamiast tego każdy dokument jest płatny osobno:

| Wariant | Cena |
| --- | --- |
| PDF + DOCX tego samego dokumentu | **40 zł** |
| sam PDF | **20 zł** |
| sam DOCX | **25 zł** |

Wersja desktopowa (`dist\PAB-cyfrowa.exe`) i wersja web (`web\`) zachowują
dotychczasową licencję kluczami `PAB-…` – zmiany nie dotyczą tych wersji.

### Konfiguracja linków płatności

W `js\payment.js` znajdują się trzy **placeholdery** w obiekcie `LINKS`
(klucze `bundle`, `pdf`, `docx`). Przed udostępnieniem trzeba podmienić je na
prawdziwe adresy (PayU, Przelewy24, PayPal.me, BLIK itp.). Obsługiwane tokeny:
`{kind}` (identyfikator dokumentu, np. `PZT`) i `{amount}` (kwota).

Aplikacja jest w pełni statyczna, więc nie weryfikuje przelewu sama. Po powrocie
ze strony płatności użytkownik klika **„Opłacone – odblokuj pliki”**, co zapisuje
dostęp w `localStorage` tej przeglądarki (`pab.sites.paid.v1`). Jest to rozwiązanie
zaufaniowe – do rzeczywistej weryfikacji potrzebny byłby backend lub callback
dostawcy płatności. Wyczyszczenie danych witryny usuwa dostęp.

---

## Eksport

| Format | Sposób | Uwagi |
| --- | --- | --- |
| DOCX | `js\docx.js` + `js\zip.js` | pełna zgodność z Wordem, LibreOffice i Google Docs; stylizacja jak w wersji desktopowej |
| PDF | okno druku przeglądarki | A4 (`@page`), marginesy 25/20/22/25 mm, „Zapisz jako PDF” |

TXT oraz zbiorczy ZIP **nie są dostępne** w wersji publicznej (zostały usunięte
z interfejsu; silnik nadal zawiera `txt()` na potrzeby zgodności kodu). Nazwy
plików: `PZT_2026.11.18.docx` itd. – identyczne z wersją desktopową.

---

## Struktura katalogu

```
sites\
  index.html        aplikacja (punkt wejścia)
  app.css           motyw zielono-złoty, układ, podgląd A4
  embed.html        pomocnik: kod osadzenia w Google Sites + podgląd
  favicon.svg
  engine\
    content.py      kopia src\content.py (teksty dokumentów)
    exporters.py    kopia src\exporters.py (TXT, nazwy plików)
    manifest.json   sumy SHA-256 i wersja
  js\
    fields.js       wygenerowany opis pól formularza
    zip.js          CRC32 i zapis ZIP (metoda „store”)
    docx.js         zapis OOXML (stylizacja jak w exporters.py)
    render.js       podgląd HTML i dokument do druku
    payment.js      płatności za dokumenty (linki + dostęp w localStorage)
    boot.js         Pyodide + mostek do content.py/exporters.py
    app.js          interfejs: routing, formularze, eksport, płatności
  build_site.py     regeneracja fields.js i kopii silnika
  parity_check.py   porównanie DOCX z wersją desktopową
  parity_dump.py    zrzut wzorca desktopowego do JSON
  check_zip.py      kontrola pobranej paczki ZIP
```

---

## Wymagania i ograniczenia

* Przeglądarki: Chrome, Edge, Firefox, Safari – wersje z obsługą WebAssembly
  i Web Crypto (wszystkie aktualne).
* Pierwsze uruchomienie: pobranie Pyodide (ok. 10 MB) – potrzebny internet.
* Telefony i tablety: interfejs działa, ale formularze są projektowane pod
  ekran komputera.
* Projekt zapisuje się automatycznie w `localStorage`; do przenoszenia służy
  **Zapisz projekt (JSON)** / **Wczytaj projekt**.
* Przycisk **Z Worda** wczytuje wartości pól z dowolnego pliku `.docx` (również
  z dokumentu wygenerowanego przez PAB cyfrową). Po analizie wyświetlany jest
  raport rozpoznanych pól z checkboxami; zaakceptowane wartości uzupełniają
  projekt i pozostają edytowalne. DOCX i PDF można następnie wygenerować ponownie.
* Część rysunkowa nie jest generowana – program przygotowuje opis i odwołuje się
  do rysunków.

---

## Autor

**Rami Nassar**, 2026 · **BIM architects & consultants**
Kontakt: **raminassar.arch@gmail.com**
