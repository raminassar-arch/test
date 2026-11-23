/* ==========================================================================
   PAB cyfrowa – osobna strona tworzenia konta (rejestracja.html).

   Po poprawnej rejestracji konto jest zapisywane lokalnie w przeglądarce,
   użytkownik zostaje zalogowany i przeniesiony do aplikacji (index.html).
   Osoba już zalogowana jest od razu przenoszona do aplikacji.
   ========================================================================== */
(function () {
  "use strict";

  function enterApp() {
    window.location.replace("index.html");
  }

  window.PABAuth.registerGate(document.getElementById("app"), enterApp);
})();