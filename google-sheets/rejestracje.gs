/* ==========================================================================
   PAB cyfrowa – rejestr nowych kont w Google Sheets (wersja statyczna).

   INSTRUKCJA (jednorazowo, ok. 3 minuty):
   1. Otwórz https://sheets.google.com i utwórz nowy arkusz,
      np. „PAB cyfrowa – rejestracje”.
   2. W menu: Rozszerzenia → Apps Script. Usuń domyślny kod i wklej
      całą zawartość tego pliku (funkcję doPost poniżej). Zapisz.
   3. Kliknij „Wdróż” → „Nowe wdrożenie” → typ: „Aplikacja internetowa”.
      Ustaw: „Wykonaj jako”: Ja (Twoje konto Google);
      „Kto ma dostęp”: „Każdy” (bez logowania – strona wysyła zgłoszenia
      anonimowo, w trybie no-cors).
   4. Zatwierdź i przy pierwszym wdrożeniu udziel zgody na dostęp do arkusza.
   5. Skopiuj URL wdrożenia (kończy się na /exec) i wklej go w pliku
      sites/js/auth.js w zmiennej REPORT_URL (albo przekaż asystentowi).
   6. Gotowe: każda nowa rejestracja na stronie dopisze wiersz
      w zakładce „Rejestracje”: data (UTC), login, nazwa wyświetlana, źródło.

   UWAGA: wysyłane są wyłącznie login, nazwa wyświetlana i data rejestracji.
   Hasło NIGDY nie opuszcza przeglądarki użytkownika.
   ========================================================================== */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Rejestracje");
    if (!sheet) {
      sheet = ss.insertSheet("Rejestracje");
      sheet.appendRow(["Data (UTC)", "Login", "Nazwa wyświetlana", "Źródło"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    }
    sheet.appendRow([
      String(data.date || new Date().toISOString()).slice(0, 40),
      String(data.login || "").slice(0, 64),
      String(data.display || "").slice(0, 120),
      String(data.src || "sites").slice(0, 32)
    ]);
    return ContentService.createTextOutput('{"ok":true}')
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput('{"ok":false}')
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}