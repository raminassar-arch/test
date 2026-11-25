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
| Motywy | `js\theme.js` | pięć wyglądów dokumentów, znak wodny, aliasy dawnych nazw |
| Podgląd i wydruk | `js\render.js` | podgląd HTML oraz samodzielny dokument A4 do druku |
| Eksport | `js\app.js`, `js\docx.js`, `js\pdf.js` | bezpośredni PDF (pdf-lib + fontkit, fonty DejaVu) i DOCX bez płatności, także dla kompletu dokumentacji |
| Konta | `accounts.json` | edytowalna lista użytkowników |
| Ekran startowy | `js\auth.js` | logowanie przed uruchomieniem aplikacji |
| Interfejs | `js\app.js`, `app.css`, `index.html` | routing, formularze, podgląd, eksport i kontrola |

Kluczowa decyzja: **teksty prawne nie są przepisane na JavaScript**. `content.py`
(ok. 2,4 tys. linii) jest kopiowany do `engine\` i wykonywany w przeglądarce,
dzięki czemu PZT, PAB, wniosek, oświadczenie, BIOZ i wykaz załączników są
identyczne z wersją desktopową – również po każdej przyszłej zmianie przepisów.

Pyodide (0.28.3) jest pobierany z CDN `cdn.jsdelivr.net` przy pierwszym
uruchomieniu (ok. 10 MB). Potrzebny jest internet. Kolejne uruchomienia korzystają
z pamięci podręcznej przeglądarki.

---

## Logowanie i konta (pierwsza strona)

Aplikacja nie uruchamia się od razu – najpierw wyświetla ekran logowania.
Lista kont znajduje się w pliku **`accounts.json`** obok `index.html`. Plik jest
edytowalny; domyślnie zawiera jedno konto **`Rami93` / `test`**:

```json
{
  "users": [
    {"login": "Rami93", "password": "test", "display": "Rami Nassar"},
    {"login": "anna",   "password": "haslo1", "display": "Anna Kowalska"}
  ]
}
```

`display` to nazwa wyświetlana w pasku nagłówka. Po dodaniu konta wystarczy
odświeżyć stronę (`accounts.json` jest pobierany przy każdym uruchomieniu).
Zmiana hasła unieważnia zapisaną sesję tego konta, bo zapisywana jest tylko
suma kontrolna loginu i hasła.

### Tworzenie konta („Utwórz konto") – osobna strona

Na ekranie logowania jest odnośnik **„Nie masz konta? Utwórz konto"**, który
przechodzi na **osobną stronę `rejestracja.html`**. Formularz przyjmuje login,
nazwę wyświetlaną i hasło (dwukrotnie), po czym od razu loguje i przenosi
do aplikacji (`index.html`) z osobnym projektem. Odnośnik „Masz już konto?
Zaloguj się" wraca na stronę logowania. Ponieważ hosting statyczny nie pozwala
zapisywać plików, takie konto jest przechowywane **wyłącznie w pamięci tej
przeglądarki** (`localStorage`, klucz `pab.sites.accounts.local.v1`) i działa
tylko na tym urządzeniu. Hasło konta lokalnego jest zapisywane jako skrót,
nie jawny tekst. Konta z `accounts.json` są wspólne dla wszystkich urządzeń;
konta lokalne – nie. Login: 3–32 znaki (litery angielskie, cyfry, `.`, `-`, `_`),
hasło: min. 4 znaki.

* **„Zapamiętaj mnie na tym urządzeniu"** (domyślnie zaznaczone) zapisuje sesję
  w `localStorage` pod kluczem `pab.sites.auth.v1`. Bez zaznaczenia sesja trwa
  do zamknięcia karty (`sessionStorage`).
* **Panel konta** (`#/konto`, przycisk „Panel konta" w pasku nagłówka) pozwala
  zarządzać projektami i ustawieniami konta. Nazwa zalogowanej osoby jest
  widoczna w pasku nagłówka. Usunięcie konta lokalnego najpierw pyta, czy pobrać
  kopię projektów do pliku ZIP, a potem wymaga drugiego, wyraźnego
  potwierdzenia.
* **Do 10 projektów na konto**: nowy, otwieranie, zmiana nazwy, duplikowanie
  i usuwanie (z licznikiem `x / 10`). Dane każdego projektu leżą pod kluczem
  `pab.sites.project.v1|<login>|<id>`, a spis projektów pod
  `pab.sites.projects.v1|<login>`. Stary, pojedynczy projekt
  (`pab.sites.project.v1`) jest jednorazowo przenoszony do pierwszego projektu
  konta, które było nim zalogowane.
* **Wybór projektu** jest dostępny w nagłówku (lista rozwijana) – zmiana wyboru
  zapisuje bieżący projekt i otwiera wskazany. W zakładkach formularzy
  (`Dane ogólne`, `PZT`, `PAB`, `BIOZ`, `Projektanci`, `Bilans`, `Załączniki`)
  jest przycisk **„Zapisz do projektu"**, który wymusza natychmiastowy zapis
  danych tej zakładki do aktywnie wybranego projektu.
* **Ustawienia konta lokalnego**: zmiana nazwy wyświetlanej i hasła (zmianę
  hasła zabezpiecza podanie aktualnego) oraz **usunięcie konta** razem ze
  wszystkimi jego projektami, po potwierdzeniu w oknie aplikacji. Operacji nie
  można cofnąć. Konta z `accounts.json` są w panelu tylko do odczytu – zmienia
  je właściciel w pliku.
* **Administrator** (`"admin": true` przy koncie w `accounts.json`, domyślnie
  `Rami93`) widzi w panelu listę kont dostępnych na tym urządzeniu: login,
  nazwę wyświetlaną, źródło konta i liczbę projektów – **bez haseł**. To jedyne
  możliwe źródło w wersji statycznej: aplikacja nie wysyła danych na serwer
  i nie widzi kont utworzonych na innych urządzeniach.
* Przycisk **„Wyloguj"** w prawym górnym rogu paska nagłówka czyści oba zapisy
  i przeładowuje stronę na ekran logowania.
* Eksport PDF i DOCX jest dostępny bez płatności w zakładce **Podgląd**.

> **Ważne:** w aplikacji statycznej login i hasło są widoczne w źródle strony
> i w pliku `accounts.json`. Ekran logowania chroni przed przypadkowym wejściem
> i porządkuje projekty osób, ale **nie jest zabezpieczeniem** przed osobą
> techniczną. Jeśli dostęp ma być naprawdę ograniczony, trzeba go ustawić
> na poziomie hostingu (np. HTTP Basic Auth w konfiguracji serwera).

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

* **Pamięć przeglądarki.** Projekt i ustawienia są zapisywane w `localStorage`.
  W części przeglądarek (Safari, tryb prywatny) pamięć jest
  blokowana dla stron osadzonych w obcej domenie – program działa, ale dane nie
  zapisują się między odświeżeniami.
* **Zalecenie:** w Google Sites umieść przede wszystkim odnośnik
  „Otwórz PAB cyfrowa” (samodzielna karta), a osadzenie traktuj jako podgląd.
* Pobrane pliki DOCX oraz PDF trafiają do folderu pobrań przeglądarki –
  Google Sites nie pośredniczy w ich zapisie. Po zapisie PDF program pokazuje
  własny komunikat z nazwą pliku i wskazówką, jak otworzyć lokalizację
  (`Ctrl+J` → „Pokaż w folderze”); nie używa `alert()` ani `confirm()`.

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
(`app.css?v=1.9.19`, `js\app.js?v=1.9.19`, …). Bez tego przeglądarki użytkowników
mogą trzymać stare pliki z pamięci podręcznej. Wersja `1.9.19` oznacza wersję
statyczną bez płatności, z bezpośrednim eksportem PDF/DOCX w *Podglądzie*
(bez licencji i bez TXT). PDF jest budowany w przeglądarce przez `js\pdf.js`,
bez okna druku.

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

## Płatności – wyłączone

Wersja statyczna (GitHub Pages / Google Sites) **nie pobiera opłat**. Pliki
PDF i DOCX są dostępne od razu w zakładce **Podgląd** – zarówno dla pojedynczego
dokumentu, jak i dla całego kompletu. Dawny plik `js\payment.js` pozostaje w
repozytorium wyłącznie jako archiwum i nie jest już ładowany przez `index.html`.
Klucz `pab.sites.paid.v1` nie jest używany.

Wersja desktopowa (`dist\PAB-cyfrowa.exe`) i wersja web (`web\`) zachowują
dotychczasową licencję kluczami `PAB-…` – zmiany nie dotyczą tych wersji.

---

## Eksport

Widok *Eksport* jest tymczasowo ukryty – kliknięcie starego odnośnika
`#/eksport` przekierowuje do *Podglądu*. W *Podglądzie* znajdują się przyciski
**PDF** i **Word (DOCX)**; działają dla pojedynczego dokumentu oraz dla opcji
**Komplet dokumentacji** (jeden plik DOCX ze wszystkimi dokumentami, jeden PDF
z całego kompletu). Numeracja „Strona X z Y” jest na każdej stronie, także na
okładce.

| Format | Sposób | Uwagi |
| --- | --- | --- |
| DOCX | `js\docx.js` + `js\zip.js` | pełna zgodność z Wordem, LibreOffice i Google Docs; stylizacja jak w wersji desktopowej |
| PDF | `js\pdf.js` + pdf-lib/fontkit | A4, marginesy jak w wersji desktopowej, pełne polskie znaki (DejaVu), znak wodny i „Strona X z Y” na każdej stronie; plik trafia od razu do pobrań |

TXT oraz zbiorczy ZIP **nie są dostępne** w wersji publicznej (zostały usunięte
z interfejsu; silnik nadal zawiera `txt()` na potrzeby zgodności kodu). Nazwy
plików: `PZT_2026.11.18.docx` itd. – identyczne z wersją desktopową.

### Motywy dokumentów

W widoku *Podgląd* dostępny jest wybór **Motyw nr 1** … **Motyw nr 5**
(kolejność zakładek: *Kontrola*, potem *Podgląd*). Ustawienie jest zapisywane
w projekcie jako `meta.motyw` (klucze
`motyw-1` … `motyw-5`) i dotyczy wyłącznie wyglądu plików DOCX/PDF: fontów,
kolorów nagłówków, tabel, linii i znaku wodnego. Domyślny jest *Motyw nr 1*
(granat, układ urzędowy); pozostałe to zieleń, głęboka zieleń ze złotem,
bordo i turkus. Dawne nazwy `klasyczny`, `nowoczesny`, `bardzo-nowoczesny`
są rozpoznawane jako aliasy, dzięki czemu starsze projekty nie tracą wyglądu.
Każdy DOCX (nagłówek VML) i każda strona wydruku/PDF zawierają dwulinijkowy znak
wodny **„BIM ARCHITECTS & CONSULTANTS / WERSJA TESTOWA”**. Zmiana motywu nie
zmienia treści dokumentów – `sites\parity_hash.py` nadal potwierdza identyczne
akapity. Statyczna wersja używa cache-bustingu `?v=1.9.19`.

---

## Struktura katalogu

```
sites\
  index.html        aplikacja (punkt wejścia, ekran logowania)
  rejestracja.html  osobna strona tworzenia konta („Utwórz konto”)
  app.css           motyw zielono-złoty, układ, podgląd A4
  embed.html        pomocnik: kod osadzenia w Google Sites + podgląd
  favicon.svg
  accounts.json     lista kont (login, hasło, nazwa wyświetlana)
  engine\
    content.py      kopia src\content.py (teksty dokumentów)
    exporters.py    kopia src\exporters.py (TXT, nazwy plików)
    manifest.json   sumy SHA-256 i wersja
  js\
    fields.js       wygenerowany opis pól formularza
    zip.js          CRC32 i zapis ZIP (metoda „store”)
    docx.js         zapis OOXML (stylizacja jak w exporters.py)
    theme.js        motywy nr 1–5, znak wodny i aliasy
    render.js       podgląd HTML, komplet i dokument do druku
    pdf.js          bezpośredni PDF w przeglądarce (pdf-lib, fontkit, DejaVu)
    boot.js         Pyodide + mostek do content.py/exporters.py
    auth.js         logowanie, rejestracja kont i zapis sesji w przeglądarce
    register.js     uruchomienie osobnej strony rejestracja.html
    app.js          interfejs: routing, formularze, podgląd i eksport bez płatności
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
* Przycisk **Z PDF** wczytuje wartości pól z tekstowego pliku `.pdf` (także
  wyeksportowanego z PAB cyfrowej). Tekst jest wyciągany w przeglądarce przez
  biblioteką pdf.js (pdfjs-dist z CDN), a rozpoznawanie etykiet odbywa się
  w tym samym silniku co przy
  imporcie DOCX. Zeskanowane PDF-y wymagają OCR i nie są obsługiwane.
* Część rysunkowa nie jest generowana – program przygotowuje opis i odwołuje się
  do rysunków.

---

## Autor

**Rami Nassar**, 2026 · **BIM architects & consultants**
Kontakt: **raminassar.arch@gmail.com**
