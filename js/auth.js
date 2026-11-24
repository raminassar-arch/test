/* ==========================================================================
   PAB cyfrowa – ekran startowy z logowaniem i rejestracją (wersja statyczna).

   Konta „stałe” są czytane z pliku accounts.json obok index.html. Można tam
   dodać kolejne osoby, np.:

     {"users": [
       {"login": "Rami93", "password": "test", "display": "Rami Nassar"},
       {"login": "anna", "password": "MOJE_HASLO", "display": "Anna Kowalska"}
     ]}

   Dodatkowo każdy może utworzyć własne konto na osobnej stronie
   rejestracja.html (odnośnik „Utwórz konto” na ekranie logowania).
   Takie konto zapisuje się WYŁĄCZNIE w pamięci tej przeglądarki (localStorage)
   i jest widoczne tylko na tym urządzeniu. Hasło konta lokalnego jest
   przechowywane jako skrót, nie jawny tekst.

   Rejestr zdarzeń kont nie jest prowadzony – konta lokalne istnieją wyłącznie
   w przeglądarce użytkownika.

   Panel konta (#/konto) pozwala zmienić nazwę wyświetlaną i hasło konta
   lokalnego oraz usunąć je wraz ze wszystkimi projektami. Konta z accounts.json
   są tam tylko do odczytu – zmienia je właściciel w pliku. Administrator
   („admin": true w accounts.json) widzi w panelu listę kont dostępnych
   na tym urządzeniu (bez haseł).

   UWAGA: w aplikacji statycznej login i hasło kont z accounts.json są widoczne
   w źródle i w pliku accounts.json. Jest to wygodna brama dostępu, a nie
   zabezpieczenie przed osobą techniczną. Osobne projekty są zapisywane pod
   kluczem z loginem.
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "pab.sites.auth.v1";
  var LOCAL_KEY = "pab.sites.accounts.local.v1";
  var ACCOUNTS_URL = "accounts.json?cb=" + Date.now();

  var accounts = [];          // konta z pliku accounts.json
  var localAccounts = [];     // konta utworzone w tej przeglądarce

  /* Lekka suma kontrolna – zmiana loginu lub hasła unieważnia zapisaną sesję. */
  function digest(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  /* Skrót trzymany dla konta: lokalne mają gotowy hash, plikowe liczymy z hasła. */
  function secretOf(user) {
    if (user.hash) return user.hash;
    return digest(user.login + "|" + user.password);
  }

  function tokenFor(user) {
    return user.login + "|" + secretOf(user);
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
        display: user.display || user.login,
        admin: !!user.admin
      };
    });
  }

  function loadLocal() {
    try {
      var raw = window.localStorage.getItem(LOCAL_KEY);
      if (!raw) return [];
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      return list.filter(function (user) {
        return user && typeof user.login === "string" && user.login &&
          typeof user.hash === "string" && user.hash;
      }).map(function (user) {
        return {
          login: user.login,
          hash: user.hash,
          display: user.display || user.login,
          local: true
        };
      });
    } catch (err) {
      return [];
    }
  }

  function saveLocal() {
    try {
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(localAccounts));
      return true;
    } catch (err) {
      return false;
    }
  }

  localAccounts = loadLocal();

  function allAccounts() {
    return accounts.concat(localAccounts);
  }

  var ready = fetch(ACCOUNTS_URL, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (raw) {
      accounts = validUsers(raw);
      if (!accounts.length) throw new Error("Brak kont w accounts.json");
      return allAccounts();
    });

  function find(login) {
    var list = allAccounts();
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].login === login) return list[i];
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
      if (!user || raw.slice(cut + 1) !== secretOf(user)) {
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

  function passwordMatches(user, given) {
    if (user.hash) return digest(user.login + "|" + given) === user.hash;
    return user.password === given;
  }

  function login(loginValue, passwordValue, remember) {
    var user = find(String(loginValue || "").trim());
    if (!user || !passwordMatches(user, String(passwordValue || ""))) return false;
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

  /* Rejestracja konta lokalnego. Zwraca {ok:true} albo {ok:false, error:"…"}. */
  function register(loginValue, passwordValue, displayValue) {
    var loginName = String(loginValue || "").trim();
    var password = String(passwordValue || "");
    var display = String(displayValue || "").trim() || loginName;
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{2,31}$/.test(loginName)) {
      return { ok: false, error: "Login musi mieć 3–32 znaki i zaczynać się literą lub cyfrą. " +
        "Dozwolone: litery angielskie, cyfry, kropka, myślnik, podkreślenie." };
    }
    if (password.length < 4) {
      return { ok: false, error: "Hasło musi mieć co najmniej 4 znaki." };
    }
    var list = allAccounts();
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].login.toLowerCase() === loginName.toLowerCase()) {
        return { ok: false, error: "Konto o takim loginie już istnieje. Wybierz inny login." };
      }
    }
    var user = {
      login: loginName,
      hash: digest(loginName + "|" + password),
      display: display.slice(0, 60),
      local: true
    };
    localAccounts.push(user);
    if (!saveLocal()) {
      localAccounts.pop();
      return { ok: false, error: "Nie udało się zapisać konta w pamięci przeglądarki. " +
        "Sprawdź, czy nie jesteś w trybie prywatnym." };
    }
    return { ok: true, user: user };
  }

  function logout() {
    try {
      window.localStorage.removeItem(KEY);
      window.sessionStorage.removeItem(KEY);
    } catch (err) {
      /* Ignorujemy brak dostępu do pamięci. */
    }
  }

  /** Czy konto (domyślnie bieżące) jest kontem lokalnym tej przeglądarki. */
  function isLocalAccount(loginName) {
    var login = loginName || currentUser();
    if (!login) return false;
    for (var i = 0; i < localAccounts.length; i += 1) {
      if (localAccounts[i].login === login) return true;
    }
    return false;
  }

  /** Lista kont widocznych w tej przeglądarce (bez haseł) – dla panelu admina. */
  function accountList() {
    return allAccounts().map(function (user) {
      return {
        login: user.login,
        display: user.display || user.login,
        local: !!user.local,
        admin: !!user.admin
      };
    });
  }

  function isAdmin() {
    var user = find(currentUser());
    return !!(user && user.admin);
  }

  /** Zmienia nazwę i/lub hasło konta lokalnego. Zmianę hasła zabezpiecza
      podanie aktualnego hasła. Sesja pozostaje zalogowana w tym samym
      magazynie (localStorage albo sessionStorage). */
  function updateAccount(input) {
    var login = currentUser();
    var idx = -1;
    for (var i = 0; i < localAccounts.length; i += 1) {
      if (localAccounts[i].login === login) { idx = i; break; }
    }
    if (idx < 0) {
      return { ok: false, error: "Ustawienia konta z accounts.json zmienia właściciel w pliku." };
    }
    var user = localAccounts[idx];
    var changes = input || {};
    var store = validLogin(window.localStorage) ? window.localStorage : window.sessionStorage;
    var oldDisplay = user.display;
    var oldHash = user.hash;
    var display = String(changes.display == null ? "" : changes.display).trim();
    var password = String(changes.password == null ? "" : changes.password);
    if (display.length > 60) display = display.slice(0, 60);
    if (password) {
      if (password.length < 4) {
        return { ok: false, error: "Nowe hasło musi mieć co najmniej 4 znaki." };
      }
      if (!passwordMatches(user, String(changes.current == null ? "" : changes.current))) {
        return { ok: false, error: "Aktualne hasło jest nieprawidłowe." };
      }
      user.hash = digest(user.login + "|" + password);
    }
    if (display) user.display = display;
    if (!saveLocal()) {
      user.display = oldDisplay;
      user.hash = oldHash;
      return { ok: false, error: "Nie udało się zapisać ustawień w pamięci przeglądarki." };
    }
    try { store.setItem(KEY, tokenFor(user)); } catch (err) { /* sesja trwa dalej */ }
    return { ok: true };
  }

  /* Usuwa zalogowane konto lokalne wraz z sesją. Projekt usuwa aplikacja
     (app.js) przed wywołaniem tej funkcji. Konta z accounts.json może
     usunąć tylko właściciel strony, edytując plik.
     Zwraca {ok:true} albo {ok:false, error:"…"}. */
  function deleteAccount() {
    var login = currentUser();
    if (!login) return { ok: false, error: "Brak zalogowanego konta." };
    var idx = -1;
    for (var i = 0; i < localAccounts.length; i += 1) {
      if (localAccounts[i].login === login) { idx = i; break; }
    }
    if (idx < 0) {
      return { ok: false, error: "To konto pochodzi z pliku accounts.json – " +
        "może je usunąć tylko właściciel strony." };
    }
    var user = localAccounts[idx];
    localAccounts.splice(idx, 1);
    if (!saveLocal()) {
      localAccounts.splice(idx, 0, user);
      return { ok: false, error: "Nie udało się zapisać zmiany w pamięci przeglądarki." };
    }
    logout();
    return { ok: true };
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

  /** Wyświetla ekran logowania w kontenerze #app. Rejestracja: rejestracja.html. */
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
      '<p class="login-switch">Nie masz konta? ' +
      '<a href="rejestracja.html">Utwórz konto</a></p>' +
      '<p class="login-foot">' + esc(info.credit) + " · " + esc(info.company) + "</p>" +
      "</form>" +

      "</div></div>";

    var loginForm = document.getElementById("login-form");
    var loginError = document.getElementById("login-error");

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = document.getElementById("login-name").value.trim();
      var password = document.getElementById("login-password").value;
      var remember = document.getElementById("login-remember").checked;
      if (!login(name, password, remember)) {
        loginError.textContent = "Nieprawidłowy login lub hasło.";
        loginError.hidden = false;
        document.getElementById("login-password").select();
        return;
      }
      loginError.hidden = true;
      if (typeof onSuccess === "function") onSuccess();
    });
  }

  /** Wyświetla ekran tworzenia konta (osobna strona rejestracja.html). */
  function showRegister(root, onSuccess) {
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

      '<form class="login-card" id="register-form" autocomplete="on">' +
      "<h2>Utwórz konto</h2>" +
      '<p class="login-sub">Nowe konto dostanie własny, osobny projekt. ' +
      "Zapisze się tylko w tej przeglądarce na tym urządzeniu.</p>" +
      '<div class="login-error" id="register-error" role="alert" hidden></div>' +
      '<label class="field"><span class="field-label">Login</span>' +
      '<input type="text" name="login" id="register-name" autocomplete="username" ' +
      "required autofocus></label>" +
      '<p class="login-hint">3–32 znaki: litery angielskie, cyfry, kropka, myślnik, ' +
      "podkreślenie.</p>" +
      '<label class="field"><span class="field-label">Imię i nazwisko (wyświetlane)</span>' +
      '<input type="text" name="display" id="register-display" autocomplete="name"></label>' +
      '<label class="field"><span class="field-label">Hasło</span>' +
      '<input type="password" name="password" id="register-password" ' +
      'autocomplete="new-password" required minlength="4"></label>' +
      '<label class="field"><span class="field-label">Powtórz hasło</span>' +
      '<input type="password" name="password2" id="register-password2" ' +
      'autocomplete="new-password" required minlength="4"></label>' +
      '<label class="login-remember"><input type="checkbox" id="register-remember" ' +
      "checked> Zapamiętaj mnie na tym urządzeniu</label>" +
      '<button type="submit" class="btn primary login-submit">Utwórz konto i zaloguj</button>' +
      '<p class="login-switch">Masz już konto? <a href="index.html">Zaloguj się</a></p>' +
      '<p class="login-foot">' + esc(info.credit) + " · " + esc(info.company) + "</p>" +
      "</form>" +

      "</div></div>";

    var registerForm = document.getElementById("register-form");
    var registerError = document.getElementById("register-error");

    registerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = document.getElementById("register-name").value.trim();
      var display = document.getElementById("register-display").value.trim();
      var password = document.getElementById("register-password").value;
      var password2 = document.getElementById("register-password2").value;
      var remember = document.getElementById("register-remember").checked;
      if (password !== password2) {
        registerError.textContent = "Hasła nie są identyczne.";
        registerError.hidden = false;
        document.getElementById("register-password2").select();
        return;
      }
      var result = register(name, password, display);
      if (!result.ok) {
        registerError.textContent = result.error;
        registerError.hidden = false;
        return;
      }
      registerError.hidden = true;
      login(name, password, remember);
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

  /** Osobna strona rejestracji: zalogowanych odsyła dalej, reszcie pokazuje formularz. */
  function registerGate(root, onSuccess) {
    return ready.then(function () {
      if (isAuthenticated()) {
        if (typeof onSuccess === "function") onSuccess();
      } else {
        showRegister(root, onSuccess);
      }
    }).catch(function () {
      showError(root, "Nie udało się wczytać listy kont (accounts.json). " +
        "Sprawdź, czy aplikacja jest otwarta przez serwer HTTP.");
    });
  }

  window.PABAuth = {
    STORAGE_KEY: KEY,
    LOCAL_KEY: LOCAL_KEY,
    ready: ready,
    users: function () { return allAccounts().slice(); },
    currentUser: currentUser,
    displayName: displayName,
    isAuthenticated: isAuthenticated,
    login: login,
    register: register,
    isLocalAccount: isLocalAccount,
    accountList: accountList,
    isAdmin: isAdmin,
    updateAccount: updateAccount,
    deleteAccount: deleteAccount,
    logout: logout,
    showLogin: showLogin,
    showRegister: showRegister,
    gate: gate,
    registerGate: registerGate
  };
})();