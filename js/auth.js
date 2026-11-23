/* ==========================================================================
   PAB cyfrowa – ekran startowy z logowaniem (wersja statyczna).

   Konta są czytane z pliku accounts.json obok index.html. Można tam dodać
   kolejne osoby, np.:

     {"users": [
       {"login": "Rami93", "password": "test", "display": "Rami Nassar"},
       {"login": "anna", "password": "MOJE_HASLO", "display": "Anna Kowalska"}
     ]}

   UWAGA: w aplikacji statycznej login i hasło są widoczne w źródle i w pliku
   accounts.json. Jest to wygodna brama dostępu, a nie zabezpieczenie przed
   osobą techniczną. Osobne projekty są zapisywane pod kluczem z loginem.
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "pab.sites.auth.v1";
  var ACCOUNTS_URL = "accounts.json?cb=" + Date.now();
  var accounts = [];

  /* Lekka suma kontrolna – zmiana loginu lub hasła unieważnia zapisaną sesję. */
  function digest(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function tokenFor(user) {
    return user.login + "|" + digest(user.login + "|" + user.password);
  }

  function validUsers(raw) {
    var list = raw && raw.users;
    if (!Array.isArray(list)) return [];
    return list.filter(function (user) {
      return user && typeof user.login === "string" && user.login &&
        typeof user.password === "string" && user.password;
    }).map(function (user) {
      return {
        login: user.login,
        password: user.password,
        display: user.display || user.login
      };
    });
  }

  var ready = fetch(ACCOUNTS_URL, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (raw) {
      accounts = validUsers(raw);
      if (!accounts.length) throw new Error("Brak kont w accounts.json");
      return accounts;
    });

  function find(login) {
    for (var i = 0; i < accounts.length; i += 1) {
      if (accounts[i].login === login) return accounts[i];
    }
    return null;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Zwraca login tylko z poprawnej sesji zapisanej w danym magazynie. */
  function validLogin(store) {
    try {
      var raw = store.getItem(KEY);
      if (!raw) return "";
      var cut = raw.indexOf("|");
      if (cut < 1) return "";
      var user = find(raw.slice(0, cut));
      if (!user || raw.slice(cut + 1) !== digest(user.login + "|" + user.password)) {
        return "";
      }
      return user.login;
    } catch (err) {
      return "";
    }
  }

  function isAuthenticated() {
    return !!validLogin(window.localStorage) || !!validLogin(window.sessionStorage);
  }

  function currentUser() {
    return validLogin(window.localStorage) || validLogin(window.sessionStorage) || "";
  }

  function displayName() {
    var user = find(currentUser());
    return user ? user.display : "";
  }

  function login(loginValue, passwordValue, remember) {
    var user = find(String(loginValue || "").trim());
    if (!user || user.password !== String(passwordValue || "")) return false;
    try {
      var keep = remember ? window.localStorage : window.sessionStorage;
      var drop = remember ? window.sessionStorage : window.localStorage;
      keep.setItem(KEY, tokenFor(user));
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

  function showError(root, message) {
    if (!root) return;
    root.innerHTML =
      '<div class="login-screen"><div class="login-panel">' +
      '<div class="login-brand"><span class="login-logo">PAB</span>' +
      "<h1>PAB cyfrowa</h1></div>" +
      '<div class="login-card"><h2>Brak dostępu do kont</h2>' +
      '<p class="login-sub">' + esc(message) + "</p></div></div></div>";
  }

  /** Uruchamia aplikację tylko po pozytywnym logowaniu. */
  function gate(root, onSuccess) {
    return ready.then(function () {
      if (isAuthenticated()) {
        if (typeof onSuccess === "function") onSuccess();
      } else {
        showLogin(root, onSuccess);
      }
    }).catch(function () {
      showError(root, "Nie udało się wczytać listy kont (accounts.json). " +
        "Sprawdź, czy aplikacja jest otwarta przez serwer HTTP.");
    });
  }

  window.PABAuth = {
    STORAGE_KEY: KEY,
    ready: ready,
    users: function () { return accounts.slice(); },
    currentUser: currentUser,
    displayName: displayName,
    isAuthenticated: isAuthenticated,
    login: login,
    logout: logout,
    showLogin: showLogin,
    gate: gate
  };
})();
