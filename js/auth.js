/* ==========================================================================
   PAB cyfrowa – ekran startowy z logowaniem (wersja statyczna).

   UWAGA: w aplikacji statycznej login i hasło są widoczne w źródle strony.
   Jest to brama dostępu, a nie zabezpieczenie przed osobą techniczną.
   ========================================================================== */
(function () {
  "use strict";

  var LOGIN = "Rami93";
  var PASSWORD = "test";
  var KEY = "pab.sites.auth.v1";

  /* Lekka suma kontrolna – zmiana hasła unieważnia zapisaną sesję. */
  function digest(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }
  var TOKEN = LOGIN + "|" + digest(PASSWORD);

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function saved(store) {
    try {
      return store.getItem(KEY) === TOKEN;
    } catch (err) {
      return false;
    }
  }

  function isAuthenticated() {
    return saved(window.localStorage) || saved(window.sessionStorage);
  }

  function login(loginValue, passwordValue, remember) {
    if (loginValue !== LOGIN || passwordValue !== PASSWORD) return false;
    try {
      var keep = remember ? window.localStorage : window.sessionStorage;
      var drop = remember ? window.sessionStorage : window.localStorage;
      keep.setItem(KEY, TOKEN);
      drop.removeItem(KEY);
    } catch (err) {
      /* Tryb prywatny – brak zapisu, ale logowanie na tę sesję działa. */
    }
    return true;
  }

  function logout() {
    try {
      window.localStorage.removeItem(KEY);
      window.sessionStorage.removeItem(KEY);
    } catch (err) {
      /* Ignorujemy brak dostępu do pamięci. */
    }
  }

  function appInfo() {
    var fields = window.PAB_FIELDS;
    return (fields && fields.app) || {
      name: "PAB cyfrowa",
      tagline: "Kompletna dokumentacja do pozwolenia na budowę",
      credit: "© 2026 Rami Nassar",
      company: "BIM architects & consultants"
    };
  }

  /** Wyświetla ekran logowania w kontenerze #app. */
  function showLogin(root, onSuccess) {
    if (!root) return;
    var info = appInfo();
    root.innerHTML =
      '<div class="login-screen">' +
      '<div class="login-panel">' +
      '<div class="login-brand">' +
      '<span class="login-logo">PAB</span>' +
      "<h1>" + esc(info.name) + "</h1>" +
      "<p>" + esc(info.tagline) + "</p>" +
      "</div>" +
      '<form class="login-card" id="login-form" autocomplete="on">' +
      "<h2>Logowanie</h2>" +
      '<p class="login-sub">Podaj dane dostępu, aby rozpocząć pracę.</p>' +
      '<div class="login-error" id="login-error" role="alert" hidden></div>' +
      '<label class="field"><span class="field-label">Login</span>' +
      '<input type="text" name="login" id="login-name" autocomplete="username" ' +
      "required autofocus></label>" +
      '<label class="field"><span class="field-label">Hasło</span>' +
      '<input type="password" name="password" id="login-password" ' +
      'autocomplete="current-password" required></label>' +
      '<label class="login-remember"><input type="checkbox" id="login-remember" ' +
      "checked> Zapamiętaj mnie na tym urządzeniu</label>" +
      '<button type="submit" class="btn primary login-submit">Zaloguj się</button>' +
      '<p class="login-foot">' + esc(info.credit) + " · " + esc(info.company) + "</p>" +
      "</form></div></div>";

    var form = document.getElementById("login-form");
    var error = document.getElementById("login-error");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = document.getElementById("login-name").value.trim();
      var password = document.getElementById("login-password").value;
      var remember = document.getElementById("login-remember").checked;
      if (!login(name, password, remember)) {
        error.textContent = "Nieprawidłowy login lub hasło.";
        error.hidden = false;
        document.getElementById("login-password").select();
        return;
      }
      error.hidden = true;
      if (typeof onSuccess === "function") onSuccess();
    });
  }

  /** Uruchamia aplikację tylko po pozytywnym logowaniu. */
  function gate(root, onSuccess) {
    if (isAuthenticated()) {
      onSuccess();
    } else {
      showLogin(root, onSuccess);
    }
  }

  window.PABAuth = {
    LOGIN: LOGIN,
    STORAGE_KEY: KEY,
    isAuthenticated: isAuthenticated,
    login: login,
    logout: logout,
    showLogin: showLogin,
    gate: gate
  };
})();
