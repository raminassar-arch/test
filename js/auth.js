/* ==========================================================================
   PAB cyfrowa – ekran startowy z logowaniem i rejestracją (wersja statyczna).

   Konta „stałe” są czytane z pliku accounts.json obok index.html. Można tam
   dodać kolejne osoby, np.:

     {"users": [
       {"login": "Rami93", "password": "test", "display": "Rami Nassar"},
       {"login": "anna", "password": "MOJE_HASLO", "display": "Anna Kowalska"}
     ]}

   Dodatkowo każdy może utworzyć własne konto przyciskiem „Utwórz konto”.
   Takie konto zapisuje się WYŁĄCZNIE w pamięci tej przeglądarki (localStorage)
   i jest widoczne tylko na tym urządzeniu. Hasło konta lokalnego jest
   przechowywane jako skrót, nie jawny tekst.

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
        display: user.display || user.login
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

  function appInfo() {
    var fields = window.PAB_FIELDS;
    return (fields && fields.app) || {
      name: "PAB cyfrowa",
      tagline: "Kompletna dokumentacja do pozwolenia na budowę",
      credit: "© 2026 Rami Nassar",
      company: "BIM architects & consultants"
    };
  }

  /** Wyświetla ekran logowania / rejestracji w kontenerze #app. */
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
      '<a href="#" id="to-register">Utwórz konto</a></p>' +
      '<p class="login-foot">' + esc(info.credit) + " · " + esc(info.company) + "</p>" +
      "</form>" +

      '<form class="login-card" id="register-form" autocomplete="on" hidden>' +
      "<h2>Utwórz konto</h2>" +
      '<p class="login-sub">Nowe konto dostanie własny, osobny projekt. ' +
      "Zapisze się tylko w tej przeglądarce na tym urządzeniu.</p>" +
      '<div class="login-error" id="register-error" role="alert" hidden></div>' +
      '<label class="field"><span class="field-label">Login</span>' +
      '<input type="text" name="login" id="register-name" autocomplete="username" ' +
      "required></label>" +
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
      '<p class="login-switch">Masz już konto? <a href="#" id="to-login">Zaloguj się</a></p>' +
      '<p class="login-foot">' + esc(info.credit) + " · " + esc(info.company) + "</p>" +
      "</form>" +

      "</div></div>";

    var loginForm = document.getElementById("login-form");
    var registerForm = document.getElementById("register-form");
    var loginError = document.getElementById("login-error");
    var registerError = document.getElementById("register-error");

    function show(which) {
      var toRegister = which === "register";
      loginForm.hidden = toRegister;
      registerForm.hidden = !toRegister;
      loginError.hidden = true;
      registerError.hidden = true;
      var focus = document.getElementById(toRegister ? "register-name" : "login-name");
      if (focus) focus.focus();
    }

    document.getElementById("to-register").addEventListener("click", function (event) {
      event.preventDefault();
      show("register");
    });
    document.getElementById("to-login").addEventListener("click", function (event) {
      event.preventDefault();
      show("login");
    });

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
    logout: logout,
    showLogin: showLogin,
    gate: gate
  };
})();