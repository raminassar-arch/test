/* ==========================================================================
   PAB cyfrowa – wersja Google Sites
   app.js – interfejs: routing, formularze, podgląd, eksport, płatności.
   Wszystkie dane projektu są przechowywane lokalnie w przeglądarce
   (localStorage). Nic nie jest wysyłane na serwer.
   ========================================================================== */
(function () {
  "use strict";

  const F = window.PAB_FIELDS;
  const LEGACY_PROJECT_KEY = "pab.sites.project.v1";
  const PROJECT_PREFIX = LEGACY_PROJECT_KEY + "|";
  const PROJECTS_INDEX_PREFIX = "pab.sites.projects.v1|";
  const MAX_PROJECTS = 10;

  function currentLogin() {
    const user = window.PABAuth && window.PABAuth.currentUser
      ? window.PABAuth.currentUser() : "";
    return user || "gosc";
  }

  function indexKey(login) {
    return PROJECTS_INDEX_PREFIX + (login || currentLogin());
  }

  function projectKey(id) {
    return PROJECT_PREFIX + currentLogin() + "|" + (id || activeId);
  }

  /** Spis projektów danego konta: {active, items:[{id,name,updated}]}. */
  function readIndex(login) {
    try {
      const raw = localStorage.getItem(indexKey(login));
      const idx = raw ? JSON.parse(raw) : null;
      if (!idx || !Array.isArray(idx.items)) return null;
      idx.items = idx.items.filter(function (item) {
        return item && typeof item.id === "string" && item.id;
      }).map(function (item) {
        return {
          id: item.id,
          name: String(item.name || "Projekt").slice(0, 60),
          updated: Number(item.updated) || Date.now()
        };
      });
      if (!idx.items.length) return null;
      if (!idx.items.some(function (item) { return item.id === idx.active; })) {
        idx.active = idx.items[0].id;
      }
      return idx;
    } catch (err) {
      return null;
    }
  }

  function writeIndex(idx, login) {
    try {
      localStorage.setItem(indexKey(login), JSON.stringify(idx));
      return true;
    } catch (err) {
      toast("Nie udało się zapisać listy projektów w przeglądarce.", "err");
      return false;
    }
  }

  function newIndex() {
    return {
      active: "p1",
      items: [{ id: "p1", name: "Projekt 1", updated: Date.now() }]
    };
  }

  function nextId(idx) {
    let n = 1;
    while (idx.items.some(function (item) { return item.id === "p" + n; })) n += 1;
    return "p" + n;
  }

  function nextName(idx) {
    let n = 1;
    while (idx.items.some(function (item) { return item.name === "Projekt " + n; })) n += 1;
    return "Projekt " + n;
  }

  /** Pierwsze uruchomienie: przenosi stary, pojedynczy projekt do spisu. */
  function migrateLegacyProject() {
    const login = currentLogin();
    let idx = readIndex(login);
    if (!idx) {
      idx = newIndex();
      const users = window.PABAuth && window.PABAuth.users ? window.PABAuth.users() : [];
      const first = users.length && users[0].login === login;
      const own = LEGACY_PROJECT_KEY + "|" + login;
      const raw = localStorage.getItem(own) ||
        (first ? localStorage.getItem(LEGACY_PROJECT_KEY) : null);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (data && data.ogolne && data.ogolne.nazwa) {
            idx.items[0].name = String(data.ogolne.nazwa).slice(0, 60);
          }
        } catch (err) { /* uszkodzony stary projekt – zostaje pusty */ }
        try {
          localStorage.setItem(projectKey(idx.items[0].id), raw);
          localStorage.removeItem(own);
          if (first) localStorage.removeItem(LEGACY_PROJECT_KEY);
        } catch (err) { /* brak dostępu do pamięci */ }
      }
      writeIndex(idx, login);
    }
    activeId = idx.active;
  }

  function projectCountFor(login) {
    const idx = readIndex(login);
    if (idx) return idx.items.length;
    try {
      return localStorage.getItem(PROJECT_PREFIX + login) ||
        localStorage.getItem(LEGACY_PROJECT_KEY) ? 1 : 0;
    } catch (err) {
      return 0;
    }
  }

  function removeAllProjects(login) {
    const who = login || currentLogin();
    const idx = readIndex(who);
    if (idx) {
      idx.items.forEach(function (item) {
        try { localStorage.removeItem(PROJECT_PREFIX + who + "|" + item.id); }
        catch (err) { /* brak dostępu do pamięci */ }
      });
    }
    try {
      localStorage.removeItem(indexKey(who));
      localStorage.removeItem(PROJECT_PREFIX + who);
      localStorage.removeItem(LEGACY_PROJECT_KEY + "|" + who);
    } catch (err) { /* brak dostępu do pamięci */ }
  }

  let activeId = "p1";
  let project = null;
  let engine = { state: "idle", error: "" }; // idle | loading | ready | error
  let enginePromise = null;
  let saveTimer = null;
  let busy = 0;
  let toastTimer = null;

  // --- pomocnicze ----------------------------------------------------------

  function esc(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function num(value) {
    const n = parseFloat(String(value === undefined || value === null ? "" : value).replace(/\s/g, "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  }

  function pl(n, dec) {
    return Number(n || 0)
      .toFixed(dec === undefined ? 2 : dec)
      .replace(".", ",");
  }

  function todayISO() {
    const d = new Date();
    const pad = function (v) {
      return (v < 10 ? "0" : "") + v;
    };
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
  }

  function toast(message, kind) {
    let box = $("#toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "toast";
      document.body.appendChild(box);
    }
    box.className = "toast show" + (kind ? " " + kind : "");
    box.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      box.className = "toast";
    }, 4200);
  }

  function busyStart(label) {
    busy += 1;
    let box = $("#busy");
    if (!box) {
      box = document.createElement("div");
      box.id = "busy";
      box.innerHTML = '<div class="busy-card"><div class="spinner"></div><p></p></div>';
      document.body.appendChild(box);
    }
    $("p", box).textContent = label || "Pracuję…";
    box.classList.add("show");
  }

  function busyStop() {
    busy = Math.max(0, busy - 1);
    const box = $("#busy");
    if (box && busy === 0) box.classList.remove("show");
  }

  /** Potwierdzenie wewnątrz aplikacji. Natywne confirm() bywa blokowane
      w osadzonych ramkach (np. Google Sites) i wtedy nic się nie dzieje. */
  function askConfirm(message, confirmLabel) {
    return new Promise(function (resolve) {
      let box = $("#ask");
      if (!box) {
        box = document.createElement("div");
        box.id = "ask";
        box.innerHTML =
          '<div class="ask-card" role="dialog" aria-modal="true">' +
          '<p class="ask-msg"></p>' +
          '<div class="ask-actions">' +
          '<button type="button" class="btn" data-ask="no">Anuluj</button>' +
          '<button type="button" class="btn primary" data-ask="yes"></button>' +
          "</div></div>";
        document.body.appendChild(box);
      }
      if (box.classList.contains("show")) { resolve(false); return; }
      $(".ask-msg", box).textContent = message;
      $('[data-ask="yes"]', box).textContent = confirmLabel || "Potwierdź";
      box.classList.add("show");
      function done(ok) {
        box.classList.remove("show");
        box.removeEventListener("click", onAskClick);
        document.removeEventListener("keydown", onAskKey);
        resolve(ok);
      }
      function onAskClick(ev) {
        if (ev.target === box) { done(false); return; }
        const btn = ev.target.closest("[data-ask]");
        if (btn) done(btn.getAttribute("data-ask") === "yes");
      }
      function onAskKey(ev) {
        if (ev.key === "Escape") done(false);
      }
      box.addEventListener("click", onAskClick);
      document.addEventListener("keydown", onAskKey);
      $('[data-ask="no"]', box).focus();
    });
  }

  // --- projekt -------------------------------------------------------------

  function emptyProject() {
    return {
      meta: { wersja: 1, program: F.app.name },
      ogolne: {
        nazwa: "",
        inwestor: "",
        inwestor_adres: "",
        adres: "",
        dzialki: "",
        obreb: "",
        jednostka: "",
        kategoria: "",
        rodzaj: "",
        pow_dzialki: "",
        data: todayISO(),
        nr_projektu: "",
        tom: "",
        projektant: "",
        specjalnosc: "",
        uprawnienia: "",
        sprawdzajacy: "",
        sprawdzajacy_uprawnienia: "",
        zakres: "",
        organ: "",
        organ_adres: "",
        osoba_wnioskujaca: "",
        funkcja_wnioskujacego: "inwestor",
        projektanci: [],
      },
      pzt: {},
      pab: {},
      bioz: {},
      dokumenty: [],
      zalaczniki: [],
      obiekty: [],
      bilans: [],
    };
  }

  function loadProject() {
    try {
      const raw = localStorage.getItem(projectKey());
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : null;
    } catch (err) {
      return null;
    }
  }

  function saveProject(immediate) {
    clearTimeout(saveTimer);
    const write = function () {
      try {
        localStorage.setItem(projectKey(), JSON.stringify(project));
        touchProject(activeId);
        const chip = $("#save-state");
        if (chip) {
          chip.textContent = "zapisano " + new Date().toLocaleTimeString("pl-PL");
          chip.classList.add("flash");
          setTimeout(function () {
            chip.classList.remove("flash");
          }, 900);
        }
      } catch (err) {
        toast("Nie udało się zapisać projektu w przeglądarce.", "err");
      }
    };
    if (immediate) write();
    else saveTimer = setTimeout(write, 400);
  }

  function setProject(data, message) {
    project = data;
    if (!project.ogolne) project.ogolne = {};
    if (!Array.isArray(project.ogolne.projektanci)) project.ogolne.projektanci = [];
    ["dokumenty", "zalaczniki", "obiekty", "bilans"].forEach(function (key) {
      if (!Array.isArray(project[key])) project[key] = [];
    });
    if (!project.ogolne.data) project.ogolne.data = todayISO();
    saveProject(true);
    if (message) toast(message);
    render();
  }

  function touchProject(id) {
    const idx = readIndex(currentLogin());
    if (!idx) return;
    const item = idx.items.find(function (entry) { return entry.id === id; });
    if (!item) return;
    item.updated = Date.now();
    writeIndex(idx);
  }

  // --- zarządzanie projektami (panel konta) --------------------------------

  function createProject() {
    const idx = readIndex(currentLogin()) || newIndex();
    if (idx.items.length >= MAX_PROJECTS) {
      toast("Możesz mieć najwyżej 10 projektów. Usuń jeden, aby dodać kolejny.", "err");
      return;
    }
    saveProject(true);
    const id = nextId(idx);
    const name = nextName(idx);
    idx.items.push({ id: id, name: name, updated: Date.now() });
    idx.active = id;
    if (!writeIndex(idx)) return;
    activeId = id;
    project = emptyProject();
    saveProject(true);
    render();
    toast("Utworzono projekt „" + name + "” (" + idx.items.length + "/" + MAX_PROJECTS + ").");
  }

  function openProject(id) {
    const idx = readIndex(currentLogin());
    if (!idx || id === activeId) return;
    const item = idx.items.find(function (entry) { return entry.id === id; });
    if (!item) return;
    saveProject(true);
    idx.active = id;
    if (!writeIndex(idx)) return;
    activeId = id;
    project = loadProject() || emptyProject();
    render();
    go("start");
    toast("Otwarto projekt „" + item.name + "”.");
  }

  function renameProject(id) {
    const input = document.getElementById("project-name-" + id);
    if (!input) return;
    const name = input.value.trim().slice(0, 60);
    if (!name) { toast("Podaj nazwę projektu.", "err"); return; }
    const idx = readIndex(currentLogin());
    if (!idx) return;
    const item = idx.items.find(function (entry) { return entry.id === id; });
    if (!item) return;
    item.name = name;
    item.updated = Date.now();
    if (!writeIndex(idx)) return;
    render();
    toast("Zmieniono nazwę projektu.");
  }

  function copyProject(id) {
    const idx = readIndex(currentLogin());
    if (!idx) return;
    if (idx.items.length >= MAX_PROJECTS) {
      toast("Możesz mieć najwyżej 10 projektów. Usuń jeden, aby dodać kolejny.", "err");
      return;
    }
    const source = idx.items.find(function (entry) { return entry.id === id; });
    if (!source) return;
    let raw = null;
    try { raw = localStorage.getItem(PROJECT_PREFIX + currentLogin() + "|" + id); }
    catch (err) { /* brak dostępu do pamięci */ }
    if (!raw) { toast("Nie udało się odczytać projektu.", "err"); return; }
    saveProject(true);
    const newId = nextId(idx);
    try { localStorage.setItem(PROJECT_PREFIX + currentLogin() + "|" + newId, raw); }
    catch (err) { toast("Nie udało się skopiować projektu.", "err"); return; }
    const name = (source.name.slice(0, 54) + " (kopia)").slice(0, 60);
    idx.items.push({ id: newId, name: name, updated: Date.now() });
    idx.active = newId;
    if (!writeIndex(idx)) return;
    activeId = newId;
    project = loadProject() || emptyProject();
    render();
    go("start");
    toast("Utworzono kopię projektu „" + source.name + "”.");
  }

  function deleteProject(id) {
    const idx = readIndex(currentLogin());
    if (!idx) return;
    const item = idx.items.find(function (entry) { return entry.id === id; });
    if (!item) return;
    askConfirm("Usunąć projekt „" + item.name + "” z tej przeglądarki? Tej operacji nie można cofnąć.",
      "Usuń projekt").then(function (ok) {
      if (!ok) return;
      saveProject(true);
      const login = currentLogin();
      try { localStorage.removeItem(PROJECT_PREFIX + login + "|" + id); }
      catch (err) { toast("Nie udało się usunąć danych projektu.", "err"); return; }
      idx.items = idx.items.filter(function (entry) { return entry.id !== id; });
      if (!idx.items.length) {
        const fresh = newIndex();
        idx.items = fresh.items;
        try {
          localStorage.setItem(PROJECT_PREFIX + login + "|" + fresh.items[0].id,
            JSON.stringify(emptyProject()));
        } catch (err) { /* brak dostępu do pamięci */ }
      }
      if (idx.active === id) idx.active = idx.items[0].id;
      if (!writeIndex(idx)) return;
      activeId = idx.active;
      project = loadProject() || emptyProject();
      render();
      toast("Usunięto projekt „" + item.name + "”.");
    });
  }

  function getVal(section, key) {
    const bag = project[section] || {};
    const value = bag[key];
    return value === undefined || value === null ? "" : value;
  }

  function setVal(section, key, value) {
    if (!project[section]) project[section] = {};
    project[section][key] = value;
  }

  function isRequired(section, key) {
    return F.required.some(function (pair) {
      return pair[0] === section && pair[1] === key;
    });
  }

  function missingRequired() {
    return F.required.filter(function (pair) {
      const value = getVal(pair[0], pair[1]);
      return String(value || "").trim() === "";
    });
  }

  // --- silnik --------------------------------------------------------------

  function ensureEngine() {
    if (engine.state === "ready") return Promise.resolve();
    if (enginePromise) return enginePromise;
    engine.state = "loading";
    updateEngineChip();
    enginePromise = window.PABEngine.init(function (message) {
      const chip = $("#engine-chip");
      if (chip) chip.textContent = message;
    })
      .then(function () {
        engine.state = "ready";
        engine.error = "";
        updateEngineChip();
        return true;
      })
      .catch(function (err) {
        engine.state = "error";
        engine.error = err && err.message ? err.message : String(err);
        enginePromise = null;
        updateEngineChip();
        throw err;
      });
    return enginePromise;
  }

  function updateEngineChip() {
    const chip = $("#engine-chip");
    if (!chip) return;
    const labels = {
      idle: "silnik: nieuruchomiony",
      loading: "silnik: ładowanie…",
      ready: "silnik: gotowy",
      error: "silnik: błąd",
    };
    chip.textContent = labels[engine.state] || "";
    chip.className = "chip engine " + engine.state;
  }

  // --- routing -------------------------------------------------------------

  function route() {
    const raw = (location.hash || "").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    return parts.length ? parts : ["start"];
  }

  function go(path) {
    location.hash = "#/" + path;
  }

  const TITLES = {
    start: "Start",
    ogolne: "Dane ogólne",
    pzt: "PZT",
    pab: "PAB",
    bioz: "BIOZ",
    bilans: "Bilans i obiekty",
    zal: "Załączniki",
    preview: "Podgląd",
    podglad: "Podgląd",
    export: "Eksport",
    eksport: "Eksport",
    check: "Kontrola",
    kontrola: "Kontrola",
    projektanci: "Projektanci",
    obiekty: "Obiekty",
    dokumenty: "Dokumenty",
    zalaczniki: "Załączniki",
    "o-programie": "O programie",
    konto: "Panel konta",
  };

  // --- widoki --------------------------------------------------------------

  function viewStart() {
    const missing = missingRequired();
    const filled = F.required.length - missing.length;
    const pct = Math.round((filled / Math.max(1, F.required.length)) * 100);
    const totalFields = Object.keys(F.groups).reduce(function (sum, section) {
      return (
        sum +
        F.groups[section].reduce(function (inner, group) {
          return inner + group.rows.length;
        }, 0)
      );
    }, 0);

    return (
      '<section class="hero">' +
      '<div class="hero-text">' +
      "<h1>Dokumentacja do pozwolenia na budowę</h1>" +
      "<p>PZT, PAB, wniosek, oświadczenie, informacja i plan BIOZ oraz wykaz załączników – " +
      "wypełnij dane raz, a program przygotuje komplet dokumentów w formatach DOCX i PDF.</p>" +
      '<div class="hero-actions">' +
      '<button class="btn primary" data-act="new">Nowy projekt</button>' +
      '<button class="btn" data-act="demo">Wczytaj przykład</button>' +
      '<label class="btn file">Import JSON<input type="file" accept=".json,application/json" data-act="import" hidden></label>' +
      '<label class="btn file">Z Worda<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" data-act="import-word" hidden></label>' +
      '<label class="btn file">Z PDF<input type="file" accept=".pdf,application/pdf" data-act="import-pdf" hidden></label>' +
      "</div>" +
      "</div>" +
      '<div class="hero-card">' +
      '<div class="ring" style="--pct:' + pct + '"><span>' + pct + "%</span></div>" +
      "<h2>Kompletność danych</h2>" +
      "<p>" + filled + " z " + F.required.length + " pól wymaganych</p>" +
      (missing.length
        ? '<p class="small">Brakuje: ' + missing.map(function (p) { return esc(labelOf(p[0], p[1])); }).join(", ") + "</p>"
        : '<p class="small ok">Wszystkie pola wymagane są wypełnione.</p>') +
      "</div>" +
      "</section>" +

      '<section class="cards">' +
      card("ogolne", "Dane ogólne", "Inwestycja, inwestor, działki, data opracowania.", "dane/ogolne") +
      card("pzt", "PZT", "Projekt zagospodarowania terenu – " + countRows("pzt") + " pól.", "dane/pzt") +
      card("pab", "PAB", "Opis architektoniczno-budowlany – " + countRows("pab") + " pól.", "dane/pab") +
      card("bioz", "BIOZ", "Informacja i plan bezpieczeństwa – " + countRows("bioz") + " pól.", "dane/bioz") +
      card("bilans", "Bilans i obiekty", "Powierzchnie, wskaźniki i wykaz obiektów.", "bilans") +
      card("zal", "Załączniki", "Dokumenty i pliki dołączane do wniosku.", "zalaczniki") +
      card("preview", "Podgląd", "Zobacz gotową treść dokumentu.", "podglad") +
      card("export", "Eksport", "DOCX i PDF – płatne osobno za każdy dokument.", "eksport") +
      card("check", "Kontrola", "Sprawdź kompletność i spójność danych.", "kontrola") +
      "</section>" +

      '<section class="panel">' +
      '<h2>Projekt w tej przeglądarce</h2>' +
      '<p class="small">Dane są zapisywane wyłącznie lokalnie (localStorage). ' +
      "Możesz przenieść projekt na inne urządzenie, eksportując plik JSON.</p>" +
      '<div class="row-actions">' +
      '<button class="btn" data-act="save-json">Zapisz projekt (JSON)</button>' +
      '<button class="btn danger" data-act="reset">Wyczyść projekt</button>' +
      "</div>" +
      '<p class="small muted">Pól w formularzach: ' + totalFields + ".</p>" +
      "</section>"
    );
  }

  function labelOf(section, key) {
    const groups = F.groups[section] || [];
    for (let i = 0; i < groups.length; i++) {
      for (let j = 0; j < groups[i].rows.length; j++) {
        if (groups[i].rows[j].key === key) return groups[i].rows[j].label;
      }
    }
    return key;
  }

  function countRows(section) {
    return (F.groups[section] || []).reduce(function (sum, group) {
      return sum + group.rows.length;
    }, 0);
  }

  function card(step, title, text, path) {
    return (
      '<a class="card" href="#/' + path + '">' +
      "<h3>" + esc(title) + "</h3>" +
      "<p>" + esc(text) + "</p>" +
      '<span class="card-go">otwórz →</span>' +
      "</a>"
    );
  }

  function fieldControl(section, row) {
    const path = section + "." + row.key;
    const value = getVal(section, row.key);
    const hint = F.hints[path] || "";
    const req = isRequired(section, row.key) ? ' <span class="req" title="pole wymagane">*</span>' : "";
    let control = "";

    if (row.type === "t") {
      control =
        '<textarea rows="' + (row.arg || 3) + '" data-bind="' + path + '">' + esc(value) + "</textarea>";
    } else if (row.type === "x") {
      control =
        '<label class="switch"><input type="checkbox" data-bind="' + path + '"' +
        (value ? " checked" : "") +
        "><span></span></label>";
    } else if (row.type === "c") {
      const options = (row.arg || [])
        .map(function (option) {
          const text = Array.isArray(option) ? option[1] : option;
          const val = Array.isArray(option) ? option[0] : option;
          return '<option value="' + esc(val) + '"' + (String(value) === String(val) ? " selected" : "") + ">" + esc(text) + "</option>";
        })
        .join("");
      control = '<select data-bind="' + path + '"><option value="">— wybierz —</option>' + options + "</select>";
    } else if (row.type === "l") {
      const selected = Array.isArray(value) ? value : [];
      control =
        '<div class="checks">' +
        (row.arg || [])
          .map(function (pair) {
            return (
              '<label class="check"><input type="checkbox" data-list="' + path + '" value="' +
              esc(pair[0]) + '"' + (selected.indexOf(pair[0]) >= 0 ? " checked" : "") +
              "><span>" + esc(pair[1]) + "</span></label>"
            );
          })
          .join("") +
        "</div>";
    } else {
      control = '<input type="text" data-bind="' + path + '" value="' + esc(value) + '">';
    }

    return (
      '<div class="field' + (row.type === "t" || row.type === "l" || row.type === "x" ? " wide" : "") + '">' +
      '<label class="field-label">' + esc(row.label) + req + "</label>" +
      control +
      (hint ? '<small class="hint">' + esc(hint) + "</small>" : "") +
      "</div>"
    );
  }

  function viewSection(section) {
    const groups = F.groups[section] || [];
    const meta = {
      ogolne: ["Dane ogólne", "Podstawowe informacje o inwestycji, inwestorze i opracowaniu."],
      pzt: ["Projekt zagospodarowania terenu", "Zakres i sposób zagospodarowania działki."],
      pab: ["Opis architektoniczno-budowlany", "Rozwiązania architektoniczne, techniczne i środowiskowe."],
      bioz: ["Bezpieczeństwo i ochrona zdrowia", "Informacja BIOZ oraz plan BIOZ."],
    }[section] || ["Dane", ""];

    let html =
      '<div class="page-head"><div><h1>' + esc(meta[0]) + "</h1><p>" + esc(meta[1]) + "</p></div>" +
      '<div class="head-actions">' +
      '<button class="btn small" data-act="fill-empty">Uzupełnij datę</button>' +
      "</div></div>";

    if (section === "ogolne") {
      html +=
        '<div class="panel tinted"><h3>Projektanci i autorzy opracowania</h3>' +
        "<p>Osoby podpisujące dokumenty – trafiają na stronę tytułową każdego opracowania.</p>" +
        '<a class="btn small" href="#/projektanci">Edytuj projektantów (' +
        (project.ogolne.projektanci || []).length + ")</a></div>";
    }

    groups.forEach(function (group, index) {
      html +=
        '<section class="panel' + (index === 0 ? "" : "") + '">' +
        "<h2>" + esc(group.title) + "</h2>" +
        '<div class="grid">' +
        group.rows.map(function (row) { return fieldControl(section, row); }).join("") +
        "</div></section>";
    });

    return html;
  }

  function viewProjektanci() {
    const rows = project.ogolne.projektanci || [];
    const funkcje = F.projektanciFunkcje || ["Projektant"];
    const specjalnosci = F.specjalnosci || [];

    return (
      '<div class="page-head"><div><h1>Projektanci i autorzy</h1>' +
      "<p>Co najmniej jedna osoba jest wymagana do wygenerowania dokumentacji.</p></div>" +
      '<div class="head-actions"><button class="btn primary small" data-act="add-projektant">Dodaj osobę</button></div></div>' +
      '<section class="panel">' +
      (rows.length
        ? '<div class="table-editor"><table><thead><tr><th>Funkcja</th><th>Imię i nazwisko</th><th>Specjalność</th><th>Nr uprawnień</th><th></th></tr></thead><tbody>' +
          rows
            .map(function (row, index) {
              return (
                "<tr>" +
                "<td>" + selectCell("projektanci", index, "funkcja", funkcje, row.funkcja) + "</td>" +
                '<td><input data-row="projektanci" data-index="' + index + '" data-field="imie" value="' + esc(row.imie) + '"></td>' +
                "<td>" + selectCell("projektanci", index, "specjalnosc", specjalnosci, row.specjalnosc) + "</td>" +
                '<td><input data-row="projektanci" data-index="' + index + '" data-field="uprawnienia" value="' + esc(row.uprawnienia) + '"></td>' +
                '<td class="tight"><button class="icon" title="Usuń" data-act="del-projektant" data-index="' + index + '">✕</button></td>' +
                "</tr>"
              );
            })
            .join("") +
          "</tbody></table></div>"
        : '<p class="empty">Nie dodano jeszcze żadnej osoby.</p>') +
      "</section>" +
      '<section class="panel"><h3>Podpowiedź</h3><p class="small">Kolejność osób odpowiada kolejności na stronie tytułowej. ' +
      "Pierwsza osoba z funkcją „Projektant” jest autorem opracowania.</p></section>"
    );
  }

  function selectCell(kind, index, field, options, value) {
    return (
      '<select data-row="' + kind + '" data-index="' + index + '" data-field="' + field + '">' +
      '<option value="">—</option>' +
      options
        .map(function (option) {
          const val = Array.isArray(option) ? option[0] : option;
          return '<option value="' + esc(val) + '"' + (String(value) === String(val) ? " selected" : "") + ">" + esc(val) + "</option>";
        })
        .join("") +
      "</select>"
    );
  }

  function viewBilans() {
    const rows = project.bilans || [];
    const dzialka = num(project.ogolne.pow_dzialki);
    const sum = rows.reduce(function (acc, row) { return acc + num(row.powierzchnia); }, 0);
    const zabudowa = rows
      .filter(function (row) { return row.kategoria === "zabudowa"; })
      .reduce(function (acc, row) { return acc + num(row.powierzchnia); }, 0);
    const pbc = rows
      .filter(function (row) { return row.kategoria === "pbc"; })
      .reduce(function (acc, row) { return acc + num(row.powierzchnia); }, 0);
    const rest = sum - zabudowa - pbc;

    return (
      '<div class="page-head"><div><h1>Bilans terenu i obiekty</h1>' +
      "<p>Powierzchnie w m². Wskaźniki liczone są względem powierzchni działki.</p></div>" +
      '<div class="head-actions"><button class="btn small" data-act="add-bilans">Dodaj pozycję</button></div></div>' +

      '<section class="panel">' +
      '<div class="stats">' +
      stat("Powierzchnia działki", dzialka ? pl(dzialka) + " m²" : "—") +
      stat("Suma bilansu", pl(sum) + " m²") +
      stat("Zabudowa", dzialka ? pl((100 * zabudowa) / dzialka) + " %" : "—") +
      stat("Biologicznie czynna", dzialka ? pl((100 * pbc) / dzialka) + " %" : "—") +
      stat("Pozostałe", pl(rest) + " m²") +
      "</div>" +
      (dzialka && Math.abs(sum - dzialka) > 0.5
        ? '<p class="small warn">Suma bilansu różni się od powierzchni działki o ' + pl(sum - dzialka) + " m².</p>"
        : "") +
      "</section>" +

      '<section class="panel">' +
      (rows.length
        ? '<div class="table-editor"><table><thead><tr><th>Pozycja</th><th>Kategoria</th><th>Powierzchnia [m²]</th><th></th></tr></thead><tbody>' +
          rows
            .map(function (row, index) {
              return (
                "<tr>" +
                '<td><input data-row="bilans" data-index="' + index + '" data-field="pozycja" value="' + esc(row.pozycja) + '"></td>' +
                "<td>" +
                '<select data-row="bilans" data-index="' + index + '" data-field="kategoria">' +
                (F.bilansKategorie || [])
                  .map(function (pair) {
                    return '<option value="' + esc(pair[0]) + '"' + (row.kategoria === pair[0] ? " selected" : "") + ">" + esc(pair[1]) + "</option>";
                  })
                  .join("") +
                "</select></td>" +
                '<td class="num"><input inputmode="decimal" data-row="bilans" data-index="' + index + '" data-field="powierzchnia" value="' + esc(row.powierzchnia) + '"></td>' +
                '<td class="tight"><button class="icon" title="Usuń" data-act="del-bilans" data-index="' + index + '">✕</button></td>' +
                "</tr>"
              );
            })
            .join("") +
          "</tbody></table></div>"
        : '<p class="empty">Brak pozycji bilansu.</p>') +
      "</section>" +

      '<section class="panel">' +
      '<div class="panel-head"><h2>Obiekty na działce</h2>' +
      '<button class="btn small" data-act="add-obiekt">Dodaj obiekt</button></div>' +
      (project.obiekty.length
        ? '<div class="table-editor"><table><thead><tr><th>Nazwa</th><th>Rodzaj</th><th>Pow. zab. [m²]</th><th>Wymiary</th><th>Wys. [m]</th><th>Kond.</th><th>Uwagi</th><th></th></tr></thead><tbody>' +
          project.obiekty
            .map(function (row, index) {
              return (
                "<tr>" +
                '<td><input data-row="obiekty" data-index="' + index + '" data-field="nazwa" value="' + esc(row.nazwa) + '"></td>' +
                "<td>" +
                '<select data-row="obiekty" data-index="' + index + '" data-field="rodzaj">' +
                ['budynek', 'obiekt inżynieryjny', 'infrastruktura']
                  .map(function (option) {
                    return '<option value="' + option + '"' + (row.rodzaj === option ? " selected" : "") + ">" + option + "</option>";
                  })
                  .join("") +
                "</select></td>" +
                '<td class="num"><input inputmode="decimal" data-row="obiekty" data-index="' + index + '" data-field="pow_zab" value="' + esc(row.pow_zab) + '"></td>' +
                '<td><input data-row="obiekty" data-index="' + index + '" data-field="wymiary" value="' + esc(row.wymiary) + '"></td>' +
                '<td class="num"><input inputmode="decimal" data-row="obiekty" data-index="' + index + '" data-field="wysokosc" value="' + esc(row.wysokosc) + '"></td>' +
                '<td class="num"><input inputmode="numeric" data-row="obiekty" data-index="' + index + '" data-field="kondygnacje" value="' + esc(row.kondygnacje) + '"></td>' +
                '<td><input data-row="obiekty" data-index="' + index + '" data-field="uwagi" value="' + esc(row.uwagi) + '"></td>' +
                '<td class="tight"><button class="icon" title="Usuń" data-act="del-obiekt" data-index="' + index + '">✕</button></td>' +
                "</tr>"
              );
            })
            .join("") +
          "</tbody></table></div>"
        : '<p class="empty">Brak obiektów – dodaj budynek lub inne obiekty.</p>') +
      "</section>"
    );
  }

  function stat(label, value) {
    return '<div class="stat"><span>' + esc(label) + "</span><strong>" + esc(value) + "</strong></div>";
  }

  function viewDokumenty() {
    const rows = project.dokumenty || [];
    return (
      '<div class="page-head"><div><h1>Dokumenty do wniosku</h1>' +
      "<p>Lista dokumentów wymaganych przy pozwoleniu na budowę wraz ze statusem.</p></div>" +
      '<div class="head-actions"><button class="btn small" data-act="mark-all">Oznacz wszystkie jako dołączone</button></div></div>' +
      '<section class="panel">' +
      '<div class="table-editor"><table><thead><tr><th>Dokument</th><th>Wymagany</th><th>Status</th><th>Uwagi</th></tr></thead><tbody>' +
      rows
        .map(function (row, index) {
          return (
            "<tr>" +
            '<td><input data-row="dokumenty" data-index="' + index + '" data-field="nazwa" value="' + esc(row.nazwa) + '"></td>' +
            '<td class="c"><input type="checkbox" data-row="dokumenty" data-index="' + index + '" data-field="wymagany"' + (row.wymagany ? " checked" : "") + "></td>" +
            "<td>" +
            '<select data-row="dokumenty" data-index="' + index + '" data-field="status">' +
            (F.dokumentyStatusy || [])
              .map(function (option) {
                return '<option value="' + esc(option) + '"' + (row.status === option ? " selected" : "") + ">" + esc(option) + "</option>";
              })
              .join("") +
            "</select></td>" +
            '<td><input data-row="dokumenty" data-index="' + index + '" data-field="uwagi" value="' + esc(row.uwagi) + '"></td>' +
            "</tr>"
          );
        })
        .join("") +
      "</tbody></table></div>" +
      '<p class="small muted">Lista pochodzi z rozporządzenia i jest gotowa do uzupełnienia.</p>' +
      "</section>"
    );
  }

  function viewZalaczniki() {
    const rows = project.zalaczniki || [];
    return (
      '<div class="page-head"><div><h1>Załączniki</h1>' +
      "<p>Wykaz plików i opracowań dołączanych do wniosku.</p></div>" +
      '<div class="head-actions"><button class="btn primary small" data-act="add-zalacznik">Dodaj załącznik</button></div></div>' +
      '<section class="panel">' +
      (rows.length
        ? '<div class="table-editor"><table><thead><tr><th>Nazwa</th><th>Status</th><th>Opis</th><th></th></tr></thead><tbody>' +
          rows
            .map(function (row, index) {
              return (
                "<tr>" +
                '<td><input data-row="zalaczniki" data-index="' + index + '" data-field="nazwa" value="' + esc(row.nazwa) + '"></td>' +
                "<td>" +
                '<select data-row="zalaczniki" data-index="' + index + '" data-field="status">' +
                (F.dokumentyStatusy || [])
                  .map(function (option) {
                    return '<option value="' + esc(option) + '"' + (row.status === option ? " selected" : "") + ">" + esc(option) + "</option>";
                  })
                  .join("") +
                "</select></td>" +
                '<td><input data-row="zalaczniki" data-index="' + index + '" data-field="opis" value="' + esc(row.opis) + '"></td>' +
                '<td class="tight"><button class="icon" title="Usuń" data-act="del-zalacznik" data-index="' + index + '">✕</button></td>' +
                "</tr>"
              );
            })
            .join("") +
          "</tbody></table></div>"
        : '<p class="empty">Brak załączników. Dodaj mapę do celów projektowych, wypis z MPZP itd.</p>') +
      "</section>"
    );
  }

  function viewPreview() {
    return (
      '<div class="page-head"><div><h1>Podgląd dokumentu</h1>' +
      "<p>Treść generowana przez ten sam silnik co w wersji desktopowej.</p></div>" +
      '<div class="head-actions">' +
      '<select id="preview-kind" class="inline">' +
      (F.dokumenty || [])
        .map(function (pair) {
          return '<option value="' + pair[0] + '">' + esc(pair[1]) + "</option>";
        })
        .join("") +
      "</select>" +
      '<button class="btn small" data-act="preview-print">Drukuj / PDF</button>' +
      '<button class="btn small" data-act="preview-docx">DOCX</button>' +
      "</div></div>" +
      '<div id="preview-stage" class="preview-stage"><div class="panel"><p>Wybierz dokument i poczekaj na wczytanie silnika…</p></div></div>'
    );
  }

  function priceCard(title, price, note) {
    return (
      '<div class="price-card">' +
      '<span class="price-name">' + esc(title) + "</span>" +
      '<strong class="price-value">' + price + " zł</strong>" +
      '<span class="price-note">' + esc(note || "za dokument") + "</span>" +
      "</div>"
    );
  }

  function accessText(st) {
    if (st.pdf && st.docx) return "PDF + DOCX opłacone";
    if (st.pdf) return "opłacony PDF";
    if (st.docx) return "opłacony DOCX";
    return "brak dostępu";
  }

  function viewExport() {
    const P = window.PABPayment.PRICES;
    return (
      '<div class="page-head"><div><h1>Eksport dokumentacji</h1>' +
      "<p>Płatność jest przypisana do pojedynczego dokumentu. Po opłaceniu pliki pobierzesz od razu w tej przeglądarce.</p></div></div>" +
      '<section class="panel pay-intro">' +
      '<h2>Cennik – każdy dokument osobno</h2>' +
      '<div class="price-grid">' +
      priceCard("PDF + DOCX", P.bundle, "najkorzystniej") +
      priceCard("Sam PDF", P.pdf, "wydruk A4 do pliku") +
      priceCard("Sam DOCX", P.docx, "edytowalny w Wordzie") +
      "</div>" +
      '<p class="small muted">TXT nie jest dostępny w tej wersji. Projekt możesz zapisać jako JSON na stronie startowej.</p>' +
      (window.PABPayment.configured()
        ? ""
        : '<p class="small err">Linki płatności nie są jeszcze skonfigurowane — do uzupełnienia w <code>js/payment.js</code>.</p>') +
      "</section>" +
      '<section class="panel">' +
      '<h2>Dokumenty</h2>' +
      '<div class="pay-list">' +
      (F.dokumenty || [])
        .map(function (pair) {
          const kind = pair[0];
          const st = window.PABPayment.status(kind);
          return (
            '<div class="pay-doc">' +
            '<div class="pay-doc-head"><strong>' + esc(pair[1]) + "</strong>" +
            '<span class="pay-state' + ((st.pdf || st.docx) ? " ok" : "") + '">' + accessText(st) + "</span></div>" +
            '<div class="pay-doc-actions">' +
            '<button class="btn small" data-act="dl-docx" data-kind="' + esc(kind) + '"' + (st.docx ? "" : " disabled") + ">DOCX</button>" +
            '<button class="btn small" data-act="dl-pdf" data-kind="' + esc(kind) + '"' + (st.pdf ? "" : " disabled") + ">PDF</button>" +
            '<button class="link" data-act="buy" data-kind="' + esc(kind) + '" data-opt="bundle">PDF+DOCX · ' + P.bundle + " zł</button>" +
            '<button class="link" data-act="buy" data-kind="' + esc(kind) + '" data-opt="pdf">PDF · ' + P.pdf + " zł</button>" +
            '<button class="link" data-act="buy" data-kind="' + esc(kind) + '" data-opt="docx">DOCX · ' + P.docx + " zł</button>" +
            "</div></div>"
          );
        })
        .join("") +
      "</div>" +
      '<p class="small muted">PDF powstaje przez okno druku przeglądarki – wybierz „Zapisz jako PDF”. ' +
      "Dostęp zapisuje się w tej przeglądarce (localStorage).</p>" +
      "</section>"
    );
  }

  function viewCheck() {
    return (
      '<div class="page-head"><div><h1>Kontrola dokumentacji</h1>' +
      "<p>Sprawdzenie kompletności danych i spójności opracowania.</p></div>" +
      '<div class="head-actions"><button class="btn small" data-act="run-check">Sprawdź ponownie</button></div></div>' +
      '<div id="check-stage"><div class="panel"><p>Uruchamiam kontrolę…</p></div></div>'
    );
  }

  function viewAbout() {
    return (
      '<div class="page-head"><div><h1>O programie</h1></div></div>' +
      '<section class="panel about">' +
      '<div class="about-brand"><span class="logo">PAB</span><div>' +
      "<h2>" + esc(F.app.name) + "</h2>" +
      "<p>" + esc(F.app.tagline) + "</p></div></div>" +
      '<div class="lic-grid">' +
      stat("Wersja", F.app.version) +
      stat("Wydanie", "Google Sites / przeglądarka") +
      stat("Autor", F.app.author + " " + F.app.year) +
      stat("Firma", F.app.company) +
      stat("Kontakt", F.app.email) +
      "</div>" +
      '<p class="small">Program przygotowuje komplet dokumentacji do wniosku o pozwolenie na budowę: ' +
      "PZT, PAB, wniosek, oświadczenie o prawie do dysponowania nieruchomością, informację BIOZ, plan BIOZ " +
      "oraz wykaz dokumentów i załączników.</p>" +
      '<p class="small">Treść opracowana zgodnie z rozporządzeniem Ministra Rozwoju z 11 września 2020 r. ' +
      "w sprawie szczegółowego zakresu i formy projektu budowlanego (Dz.U. 2022 poz. 1679 ze zm., " +
      "w tym Dz.U. 2023 poz. 2405 i Dz.U. 2026 poz. 597) oraz Prawem budowlanym (Dz.U. 2026 poz. 524 ze zm.).</p>" +
      '<p class="small muted">' + esc(F.app.credit) + " · " + esc(F.app.company) + " · " + esc(F.app.email) + "</p>" +
      "</section>" +
      '<section class="panel"><h3>Prywatność</h3>' +
      "<p class=\"small\">Wszystkie dane projektu pozostają w Twojej przeglądarce. Aplikacja nie wysyła ich na żaden serwer. " +
      "Jedynym zasobem pobieranym z internetu jest środowisko Python (Pyodide) oraz pliki programu.</p></section>"
    );
  }

  // --- panel konta ---------------------------------------------------------

  function viewAccount() {
    const auth = window.PABAuth || {};
    const login = auth.currentUser ? auth.currentUser() : "";
    const display = auth.displayName ? auth.displayName() : login;
    const local = auth.isLocalAccount ? auth.isLocalAccount() : false;
    const idx = readIndex(currentLogin()) || newIndex();
    const count = idx.items.length;

    const projectRows = idx.items.map(function (item) {
      const active = item.id === idx.active;
      return "<tr>" +
        "<td><strong>" + esc(item.name) + "</strong>" +
          (active ? ' <span class="chip ready">aktywny</span>' : "") +
          '<div class="small muted">id: ' + esc(item.id) + "</div></td>" +
        '<td class="small">' + esc(new Date(item.updated).toLocaleString("pl-PL")) + "</td>" +
        '<td><div class="row-actions">' +
          '<button class="btn small' + (active ? "" : " primary") + '" data-act="project-open" ' +
            'data-id="' + esc(item.id) + '"' + (active ? " disabled" : "") + ">Otwórz</button>" +
          '<input id="project-name-' + esc(item.id) + '" type="text" maxlength="60" ' +
            'value="' + esc(item.name) + '" aria-label="Nazwa projektu">' +
          '<button class="btn small" data-act="project-rename" data-id="' + esc(item.id) +
            '">Zapisz nazwę</button>' +
          '<button class="btn small" data-act="project-copy" data-id="' + esc(item.id) + '"' +
            (count >= MAX_PROJECTS ? " disabled" : "") + ">Duplikuj</button>" +
          '<button class="btn small danger" data-act="project-delete" data-id="' + esc(item.id) +
            '">Usuń</button>' +
          "</div></td></tr>";
    }).join("");

    const admin = !!(auth.isAdmin && auth.isAdmin());
    const userRows = admin ? (auth.accountList ? auth.accountList() : []).map(function (u) {
      return "<tr><td><strong>" + esc(u.login) + "</strong>" +
          (u.admin ? ' <span class="chip ready">administrator</span>' : "") + "</td>" +
        "<td>" + esc(u.display) + "</td>" +
        "<td>" + (u.local ? "lokalne na tym urządzeniu" : "accounts.json") + "</td>" +
        "<td>" + projectCountFor(u.login) + " / " + MAX_PROJECTS + "</td></tr>";
    }).join("") : "";

    return (
      '<section class="panel">' +
      '<div class="panel-head"><h2>Panel konta</h2><span class="chip user">' + esc(display) +
        "</span></div>" +
      '<p class="small">Login: <strong>' + esc(login) + "</strong> · " +
        (local ? "konto lokalne zapisane na tym urządzeniu" : "konto z pliku accounts.json") +
        "</p></section>" +

      '<section class="panel">' +
      '<div class="panel-head"><h2>Projekty</h2><span class="chip' +
        (count >= MAX_PROJECTS ? " ready" : "") + '">' + count + " / " + MAX_PROJECTS +
        "</span></div>" +
      '<p class="small">Każde konto może mieć najwyżej 10 projektów. Dane każdego z nich ' +
        "są zapisywane osobno w tej przeglądarce.</p>" +
      '<div class="table-editor project-table"><table><thead><tr>' +
        "<th>Projekt</th><th>Ostatnia zmiana</th><th>Akcje</th>" +
        "</tr></thead><tbody>" + projectRows + "</tbody></table></div>" +
      '<div class="row-actions"><button class="btn primary" data-act="project-new"' +
        (count >= MAX_PROJECTS ? " disabled" : "") + ">Nowy projekt</button></div>" +
      "</section>" +

      '<section class="panel">' +
      "<h2>Ustawienia konta</h2>" +
      (local
        ? '<p class="small">Zmiana nazwy działa od razu. Przy zmianie hasła podaj aktualne ' +
            "hasło oraz nowe hasło dwukrotnie.</p>" +
          '<div class="grid two">' +
          '<label class="field"><span class="field-label">Nazwa wyświetlana</span>' +
            '<input type="text" id="account-display" maxlength="60" value="' + esc(display) +
            '"></label>' +
          '<label class="field"><span class="field-label">Aktualne hasło ' +
            "(tylko przy zmianie)</span>" +
            '<input type="password" id="account-current" autocomplete="current-password"></label>' +
          '<label class="field"><span class="field-label">Nowe hasło ' +
            "(zostaw puste, aby nie zmieniać)</span>" +
            '<input type="password" id="account-password" autocomplete="new-password" ' +
            'minlength="4"></label>' +
          '<label class="field"><span class="field-label">Powtórz nowe hasło</span>' +
            '<input type="password" id="account-password2" autocomplete="new-password" ' +
            'minlength="4"></label>' +
          "</div>" +
          '<div class="row-actions"><button class="btn primary" data-act="account-save">' +
            "Zapisz ustawienia</button>" +
          '<button class="btn danger" data-act="delete-account">Usuń konto</button></div>'
        : '<p class="small">To konto pochodzi z pliku <code>accounts.json</code>. Nazwę ' +
          "i hasło zmienia właściciel strony w tym pliku; usunięcie konta z poziomu " +
          "strony nie jest możliwe.</p>") +
      "</section>" +

      (admin
        ? '<section class="panel"><h2>Użytkownicy (widoczni na tym urządzeniu)</h2>' +
          '<p class="small">Administrator widzi konta z pliku <code>accounts.json</code> ' +
          "oraz konta utworzone na tym urządzeniu. Aplikacja nie zbiera danych z innych " +
          "urządzeń i nie pokazuje haseł.</p>" +
          '<div class="table-editor"><table><thead><tr>' +
          "<th>Login</th><th>Nazwa wyświetlana</th><th>Źródło</th><th>Projekty</th>" +
          "</tr></thead><tbody>" + userRows + "</tbody></table></div></section>"
        : "")
    );
  }

  // --- render --------------------------------------------------------------

  function render() {
    if (!project) project = emptyProject();

    const parts = route();
    const head = parts[0];
    const view = $("#view");
    if (!view) return;

    updateEngineChip();

    let html = "";
    if (head === "start") html = viewStart();
    else if (head === "dane") html = viewSection(parts[1] || "ogolne");
    else if (head === "projektanci") html = viewProjektanci();
    else if (head === "bilans" || head === "obiekty") html = viewBilans();
    else if (head === "dokumenty") html = viewDokumenty();
    else if (head === "zalaczniki" || head === "zal") html = viewZalaczniki();
    else if (head === "podglad" || head === "preview") html = viewPreview();
    else if (head === "eksport" || head === "export") html = viewExport();
    else if (head === "kontrola" || head === "check") html = viewCheck();
    else if (head === "o-programie") html = viewAbout();
    else if (head === "konto") html = viewAccount();
    else html = viewStart();

    view.innerHTML = html;
    renderSteps(head, parts[1]);
    document.title = (TITLES[head === "dane" ? parts[1] || "ogolne" : head] || "Start") + " – " + F.app.name;

    if (head === "podglad" || head === "preview") initPreview();
    if (head === "kontrola" || head === "check") runCheck();
  }

  function renderSteps(head, sub) {
    const box = $("#steps");
    if (!box) return;
    const active = head === "dane" ? sub : head;
    box.innerHTML = (F.steps || [])
      .map(function (step) {
        const key = step[0];
        const target =
          key === "ogolne" || key === "pzt" || key === "pab" || key === "bioz"
            ? "dane/" + key
            : key === "zal"
            ? "zalaczniki"
            : key === "preview"
            ? "podglad"
            : key === "export"
            ? "eksport"
            : key === "check"
            ? "kontrola"
            : key;
        const isActive =
          active === key ||
          (key === "bilans" && (head === "bilans" || head === "obiekty")) ||
          (key === "zal" && head === "zalaczniki") ||
          (key === "preview" && head === "podglad") ||
          (key === "export" && head === "eksport") ||
          (key === "check" && head === "kontrola");
        return (
          '<a class="step' + (isActive ? " active" : "") + '" href="#/' + target + '">' +
          "<span>" + esc(step[1]) + "</span><small>" + esc(step[2]) + "</small></a>"
        );
      })
      .join("");
  }

  // --- podgląd -------------------------------------------------------------

  let previewKind = "PZT";

  function initPreview() {
    const select = $("#preview-kind");
    if (select) {
      select.value = previewKind;
      select.addEventListener("change", function () {
        previewKind = select.value;
        renderPreview();
      });
    }
    renderPreview();
  }

  function renderPreview() {
    const stage = $("#preview-stage");
    if (!stage) return;
    if (engine.state === "error") {
      stage.innerHTML =
        '<div class="panel"><h2>Silnik nie został uruchomiony</h2><p>' + esc(engine.error) +
        "</p><p class=\"small\">Sprawdź połączenie z internetem – środowisko Python (Pyodide) jest pobierane z CDN.</p>" +
        '<button class="btn" data-act="reload-engine">Spróbuj ponownie</button></div>';
      return;
    }
    if (engine.state !== "ready") {
      stage.innerHTML = '<div class="panel"><p>Wczytywanie silnika dokumentów…</p></div>';
      ensureEngine()
        .then(function () {
          renderPreview();
        })
        .catch(function () {
          renderPreview();
        });
      return;
    }

    stage.innerHTML = '<div class="panel"><p>Generuję podgląd…</p></div>';
    window.PABEngine.build(previewKind, project)
      .then(function (doc) {
        stage.innerHTML = '<div class="paper">' + window.PABRender.document(doc) + "</div>";
      })
      .catch(function (err) {
        stage.innerHTML = '<div class="panel"><h2>Nie udało się zbudować dokumentu</h2><p>' + esc(err.message || err) + "</p></div>";
      });
  }

  // --- eksport -------------------------------------------------------------

  function download(bytes, filename, mime) {
    const blob = new Blob([bytes], { type: mime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 400);
  }

  function docxBytes(doc) {
    return window.PABDocx.build(doc);
  }

  function exportDocx(kind) {
    return ensureEngine()
      .then(function () {
        return window.PABEngine.build(kind, project);
      })
      .then(function (doc) {
        return window.PABEngine.filename(kind, project).then(function (base) {
          download(docxBytes(doc), base + ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        });
      });
  }

  function printDoc(kind) {
    return ensureEngine()
      .then(function () {
        return window.PABEngine.build(kind, project);
      })
      .then(function (doc) {
        const html = window.PABRender.printable(doc);
        const frame = document.createElement("iframe");
        frame.setAttribute("aria-hidden", "true");
        frame.style.position = "fixed";
        frame.style.right = "0";
        frame.style.bottom = "0";
        frame.style.width = "0";
        frame.style.height = "0";
        frame.style.border = "0";
        document.body.appendChild(frame);
        const cdoc = frame.contentWindow.document;
        cdoc.open();
        cdoc.write(html);
        cdoc.close();
        const run = function () {
          try {
            frame.contentWindow.focus();
            frame.contentWindow.print();
          } catch (err) {
            toast("Przeglądarka zablokowała druk. Otwórz podgląd i użyj Ctrl+P.", "err");
          }
          setTimeout(function () {
            if (frame.parentNode) frame.parentNode.removeChild(frame);
          }, 60000);
        };
        if (cdoc.readyState === "complete") setTimeout(run, 250);
        else frame.onload = function () { setTimeout(run, 250); };
      });
  }

  function hasAccess(kind, format) {
    return window.PABPayment.isUnlocked(kind, format);
  }

  function downloadDocx(kind) {
    if (!hasAccess(kind, "docx")) return openPayModal(kind, "docx");
    busyStart("Generuję DOCX…");
    exportDocx(kind)
      .then(function () { toast("Pobrano " + kind + ".docx"); })
      .catch(function (err) { toast("Błąd eksportu: " + (err.message || err), "err"); })
      .then(busyStop);
  }

  function downloadPdf(kind) {
    if (!hasAccess(kind, "pdf")) return openPayModal(kind, "pdf");
    busyStart("Przygotowuję wydruk…");
    printDoc(kind)
      .catch(function (err) { toast("Błąd: " + (err.message || err), "err"); })
      .then(busyStop);
  }

  /* --- bramka płatności ---------------------------------------------------- */

  const OPTION_LABEL = {
    bundle: "PDF + DOCX",
    pdf: "sam PDF",
    docx: "sam DOCX",
  };

  function openPayModal(kind, suggested) {
    closePayModal();
    const P = window.PABPayment.PRICES;
    const label = window.PABPayment.label(kind);
    const box = document.createElement("div");
    box.id = "pay-modal";
    box.className = "pay-modal";
    box.innerHTML =
      '<div class="pay-modal-card">' +
      '<button class="pay-close" data-act="pay-close" aria-label="Zamknij">×</button>' +
      "<h2>Pobierz: " + esc(label) + "</h2>" +
      '<p class="small">Wybierz wariant płatności dla tego dokumentu. Link otworzy się w nowej karcie.</p>' +
      '<div class="price-grid">' +
      priceCard("PDF + DOCX", P.bundle, "najkorzystniej") +
      priceCard("Sam PDF", P.pdf, "wydruk A4 do pliku") +
      priceCard("Sam DOCX", P.docx, "edytowalny w Wordzie") +
      "</div>" +
      '<div class="pay-modal-options">' +
      ["bundle", "pdf", "docx"]
        .map(function (opt) {
          const active = opt === suggested ? " primary" : "";
          return (
            '<button class="btn' + active + '" data-act="pay-go" data-kind="' + esc(kind) +
            '" data-opt="' + opt + '">Kup ' + OPTION_LABEL[opt] + " · " + P[opt] + " zł</button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="pay-confirm">' +
      '<button class="link" data-act="pay-done" data-kind="' + esc(kind) + '" data-opt="' + esc(suggested || "bundle") +
      '">Opłacone – odblokuj pliki</button>' +
      '<p class="small muted">Wersja statyczna nie weryfikuje przelewu sama. Po zapłacie kliknij przycisk powyżej; ' +
      "dostęp zapisze się w localStorage tej przeglądarki.</p>" +
      "</div>" +
      "</div>";
    document.body.appendChild(box);
  }

  function closePayModal() {
    const old = $("#pay-modal");
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function payGo(kind, option) {
    const url = window.PABPayment.url(kind, option);
    if (!window.PABPayment.configured() || !url) {
      toast("Skonfiguruj linki płatności w js/payment.js.", "err");
      return;
    }
    window.open(url, "_blank", "noopener");
    toast("Otworzono stronę płatności. Po zapłacie kliknij „Opłacone”.", "ok");
  }

  function payDone(kind, option) {
    window.PABPayment.markPaid(kind, option);
    closePayModal();
    toast("Dostęp odblokowany: " + OPTION_LABEL[option] + ".", "ok");
    render();
  }

  // --- kontrola ------------------------------------------------------------

  function runCheck() {
    const stage = $("#check-stage");
    if (!stage) return;
    if (engine.state !== "ready") {
      stage.innerHTML = '<div class="panel"><p>Wczytywanie silnika kontroli…</p></div>';
      ensureEngine()
        .then(runCheck)
        .catch(function () {
          stage.innerHTML =
            '<div class="panel"><h2>Silnik nie został uruchomiony</h2><p>' + esc(engine.error) +
            "</p></div>";
        });
      return;
    }
    stage.innerHTML = '<div class="panel"><p>Sprawdzam dane…</p></div>';
    window.PABEngine.validate(project)
      .then(function (issues) {
        const errors = issues.filter(function (i) { return i[0] === "error"; });
        const warns = issues.filter(function (i) { return i[0] === "warn"; });
        const infos = issues.filter(function (i) { return i[0] === "info"; });
        const cls = errors.length ? "bad" : warns.length ? "warn" : "ok";
        const label = errors.length
          ? "Dokumentacja wymaga uzupełnienia"
          : warns.length
          ? "Dokumentacja gotowa – z uwagami"
          : "Dokumentacja kompletna";

        stage.innerHTML =
          '<section class="panel check ' + cls + '"><h2>' + label + "</h2>" +
          '<p class="small">Błędy: ' + errors.length + " · Uwagi: " + warns.length + " · Informacje: " + infos.length + "</p></section>" +
          (issues.length
            ? '<section class="panel"><ul class="issues">' +
              issues
                .map(function (item) {
                  return '<li class="' + item[0] + '"><span class="tag">' + esc(levelLabel(item[0])) + "</span>" + esc(item[1]) + "</li>";
                })
                .join("") +
              "</ul></section>"
            : '<section class="panel"><p>Brak uwag – dane są kompletne.</p></section>');
      })
      .catch(function (err) {
        stage.innerHTML = '<div class="panel"><p>Błąd kontroli: ' + esc(err.message || err) + "</p></div>";
      });
  }

  function levelLabel(level) {
    return { error: "błąd", warn: "uwaga", info: "info" }[level] || level;
  }

  // --- zdarzenia -----------------------------------------------------------

  function bindField(target) {
    const path = target.getAttribute("data-bind");
    if (!path) return;
    const dot = path.indexOf(".");
    const section = path.slice(0, dot);
    const key = path.slice(dot + 1);
    let value;
    if (target.type === "checkbox") value = target.checked;
    else value = target.value;
    setVal(section, key, value);
    saveProject();
    if (section === "ogolne" && (key === "pow_dzialki" || key === "data")) {
      /* wskaźniki bilansu odświeżą się po powrocie na stronę bilansu */
    }
  }

  function bindList(target) {
    const path = target.getAttribute("data-list");
    const dot = path.indexOf(".");
    const section = path.slice(0, dot);
    const key = path.slice(dot + 1);
    const current = getVal(section, key);
    const list = Array.isArray(current) ? current.slice() : [];
    const value = target.value;
    const index = list.indexOf(value);
    if (target.checked && index < 0) list.push(value);
    if (!target.checked && index >= 0) list.splice(index, 1);
    setVal(section, key, list);
    saveProject();
  }

  function bindRow(target) {
    const kind = target.getAttribute("data-row");
    const index = Number(target.getAttribute("data-index"));
    const field = target.getAttribute("data-field");
    if (!kind || isNaN(index) || !field) return;
    let list;
    if (kind === "projektanci") list = project.ogolne.projektanci;
    else list = project[kind];
    if (!list || !list[index]) return;
    if (target.type === "checkbox") list[index][field] = target.checked;
    else list[index][field] = target.value;
    saveProject();
  }

  function addRow(kind) {
    if (kind === "projektanci") {
      project.ogolne.projektanci.push({ funkcja: "Projektant", imie: "", specjalnosc: "architektoniczna", uprawnienia: "" });
    } else if (kind === "bilans") {
      project.bilans.push({ pozycja: "Inne części terenu", kategoria: "inne", powierzchnia: "0" });
    } else if (kind === "obiekty") {
      project.obiekty.push({ nazwa: "", rodzaj: "budynek", pow_zab: "", wymiary: "", wysokosc: "", kondygnacje: "1", uwagi: "" });
    } else if (kind === "zalaczniki") {
      project.zalaczniki.push({ nazwa: "", status: "Dołączony", opis: "" });
    }
    saveProject(true);
    render();
  }

  function delRow(kind, index) {
    const list = kind === "projektanci" ? project.ogolne.projektanci : project[kind];
    if (!list) return;
    list.splice(index, 1);
    saveProject(true);
    render();
  }

  function onClick(event) {
    const target = event.target.closest("[data-act]");
    if (!target) return;
    const act = target.getAttribute("data-act");

    if (act === "logout") {
      askConfirm("Wylogować się z PAB cyfrowej na tym urządzeniu?", "Wyloguj").then(function (ok) {
        if (!ok) return;
        window.PABAuth.logout();
        window.location.reload();
      });
      return;
    }
    if (act === "project-new") { createProject(); return; }
    if (act === "project-open") { openProject(target.getAttribute("data-id")); return; }
    if (act === "project-rename") { renameProject(target.getAttribute("data-id")); return; }
    if (act === "project-copy") { copyProject(target.getAttribute("data-id")); return; }
    if (act === "project-delete") { deleteProject(target.getAttribute("data-id")); return; }
    if (act === "account-save") {
      const value = function (id) {
        const input = document.getElementById(id);
        return input ? input.value : "";
      };
      const password = value("account-password");
      if (password !== value("account-password2")) {
        toast("Nowe hasła nie są identyczne.", "err");
        return;
      }
      const result = window.PABAuth.updateAccount({
        display: value("account-display"),
        current: value("account-current"),
        password: password
      });
      if (!result.ok) { toast(result.error, "err"); return; }
      const chip = $("#user-chip");
      if (chip) chip.textContent = window.PABAuth.displayName();
      render();
      toast("Ustawienia konta zapisane.");
      return;
    }
    if (act === "delete-account") {
      const login = window.PABAuth.currentUser();
      askConfirm("Usunąć konto „" + login + "” razem ze wszystkimi jego projektami " +
        "zapisanymi w tej przeglądarce? Tej operacji nie można cofnąć.", "Usuń konto").then(function (ok) {
        if (!ok) return;
        removeAllProjects(login);
        const result = window.PABAuth.deleteAccount();
        if (!result.ok) { toast(result.error, "err"); return; }
        window.location.reload();
      });
      return;
    }
    if (act === "new") {
      askConfirm("Utworzyć nowy, pusty projekt? Bieżące dane zostaną zastąpione.", "Nowy projekt").then(function (ok) {
        if (!ok) return;
        setProject(emptyProject(), "Utworzono nowy projekt.");
        go("dane/ogolne");
      });
      return;
    }
    if (act === "demo") {
      busyStart("Wczytuję przykład…");
      ensureEngine()
        .then(function () { return window.PABEngine.demo(); })
        .then(function (data) {
          setProject(data, "Wczytano projekt przykładowy.");
          go("dane/ogolne");
        })
        .catch(function (err) {
          toast("Nie udało się wczytać przykładu: " + (err.message || err), "err");
        })
        .then(busyStop);
      return;
    }
    if (act === "reset") {
      askConfirm("Usunąć wszystkie dane projektu z tej przeglądarki?", "Wyczyść").then(function (ok) {
        if (!ok) return;
        localStorage.removeItem(projectKey());
        setProject(emptyProject(), "Projekt wyczyszczony.");
        go("start");
      });
      return;
    }
    if (act === "save-json") {
      download(
        new TextEncoder().encode(JSON.stringify(project, null, 2)),
        "PAB-projekt-" + todayISO().replace(/\./g, "-") + ".json",
        "application/json"
      );
      return;
    }
    if (act === "fill-empty") {
      const section = route()[1] || "ogolne";
      if (section === "ogolne" && !project.ogolne.data) {
        project.ogolne.data = todayISO();
        saveProject(true);
        toast("Uzupełniono datę opracowania.");
        render();
      } else {
        toast("Nie ma pustych pól, które można uzupełnić automatycznie.");
      }
      return;
    }
    if (act === "add-projektant") return addRow("projektanci");
    if (act === "del-projektant") return delRow("projektanci", Number(target.getAttribute("data-index")));
    if (act === "add-bilans") return addRow("bilans");
    if (act === "del-bilans") return delRow("bilans", Number(target.getAttribute("data-index")));
    if (act === "add-obiekt") return addRow("obiekty");
    if (act === "del-obiekt") return delRow("obiekty", Number(target.getAttribute("data-index")));
    if (act === "add-zalacznik") return addRow("zalaczniki");
    if (act === "del-zalacznik") return delRow("zalaczniki", Number(target.getAttribute("data-index")));
    if (act === "mark-all") {
      (project.dokumenty || []).forEach(function (row) {
        if (row.wymagany) row.status = "Dołączony";
      });
      saveProject(true);
      toast("Wszystkie wymagane dokumenty oznaczone jako dołączone.");
      render();
      return;
    }
    if (act === "preview-print") return downloadPdf(previewKind);
    if (act === "preview-docx") return downloadDocx(previewKind);
    if (act === "dl-pdf" || act === "dl-docx") {
      const kind = target.getAttribute("data-kind");
      return act === "dl-pdf" ? downloadPdf(kind) : downloadDocx(kind);
    }
    if (act === "buy") {
      openPayModal(target.getAttribute("data-kind"), target.getAttribute("data-opt"));
      return;
    }
    if (act === "pay-go") {
      payGo(target.getAttribute("data-kind"), target.getAttribute("data-opt"));
      return;
    }
    if (act === "pay-done") {
      payDone(target.getAttribute("data-kind"), target.getAttribute("data-opt"));
      return;
    }
    if (act === "pay-close") {
      closePayModal();
      return;
    }
    if (act === "word-close") {
      closeWordModal();
      return;
    }
    if (act === "word-apply") {
      applyWordImport();
      return;
    }
    if (act === "run-check") return runCheck();
    if (act === "reload-engine") {
      enginePromise = null;
      engine.state = "idle";
      render();
      return;
    }
  }

  function onChange(event) {
    const target = event.target;
    if (target.matches("[data-bind]")) return bindField(target);
    if (target.matches("[data-list]")) return bindList(target);
    if (target.matches("[data-row]")) return bindRow(target);
  }

  function onInput(event) {
    const target = event.target;
    if (target.matches("input[data-bind], textarea[data-bind], select[data-bind]")) {
      return bindField(target);
    }
    if (target.matches("input[data-row], textarea[data-row], select[data-row]")) {
      return bindRow(target);
    }
  }

  function onFile(event) {
    const input = event.target;
    const act = input.getAttribute("data-act");
    if (act !== "import" && act !== "import-word" && act !== "import-pdf") return;
    const file = input.files && input.files[0];
    if (!file) return;
    if (act === "import-word") {
      importWordFile(file);
      input.value = "";
      return;
    }
    if (act === "import-pdf") {
      importPdfFile(file);
      input.value = "";
      return;
    }
    busyStart("Wczytuję projekt…");
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result));
        ensureEngine()
          .then(function () { return window.PABEngine.merge(data); })
          .then(function (merged) {
            setProject(merged, "Projekt wczytany z pliku.");
            go("dane/ogolne");
          })
          .catch(function () {
            setProject(data, "Projekt wczytany z pliku (bez uzupełnienia brakujących pól).");
            go("dane/ogolne");
          })
          .then(busyStop);
      } catch (err) {
        busyStop();
        toast("Nie udało się odczytać pliku JSON.", "err");
      }
    };
    reader.onerror = function () {
      busyStop();
      toast("Nie udało się odczytać pliku.", "err");
    };
    reader.readAsText(file, "utf-8");
    input.value = "";
  }

  // --- import pól z dokumentów Word i PDF ---------------------------------

  const PDFJS_VERSION = "3.11.174";
  const PDFJS_BASE = "https://cdn.jsdelivr.net/npm/pdfjs-dist@" +
    PDFJS_VERSION + "/build/";
  let pdfJsPromise = null;

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = new Promise(function (resolve, reject) {
      const tag = document.createElement("script");
      tag.src = PDFJS_BASE + "pdf.min.js";
      tag.async = true;
      tag.onload = function () {
        if (!window.pdfjsLib) {
          reject(new Error("Nie udało się załadować pdf.js"));
          return;
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          PDFJS_BASE + "pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      tag.onerror = function () {
        reject(new Error("Nie udało się pobrać pdf.js"));
      };
      document.head.appendChild(tag);
    });
    pdfJsPromise.catch(function () { pdfJsPromise = null; });
    return pdfJsPromise;
  }

  /** Wyciąga tekst z PDF-a, odtwarzając układ kolumn spacjami. */
  async function pdfToText(bytes) {
    const lib = await loadPdfJs();
    const task = lib.getDocument({ data: bytes.slice() });
    const pdf = await task.promise;
    const pages = [];
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      const rows = new Map();
      content.items.forEach(function (item) {
        if (!item.str || !item.str.trim() || !item.transform) return;
        const y = Math.round(item.transform[5] / 2) * 2;
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y).push(item);
      });
      const coords = Array.from(rows.keys()).sort(function (a, b) { return b - a; });
      const lines = [];
      coords.forEach(function (y) {
        const row = rows.get(y).sort(function (a, b) {
          return a.transform[4] - b.transform[4];
        });
        let line = "";
        let previousEnd = null;
        row.forEach(function (item) {
          const text = String(item.str).replace(/\s+/g, " ").trim();
          if (!text) return;
          const x = item.transform[4];
          if (previousEnd !== null && x - previousEnd > 6) line += "   ";
          line += text;
          previousEnd = x + (typeof item.width === "number"
            ? item.width : text.length * 5);
        });
        if (line.trim()) lines.push(line.trim());
      });
      pages.push(lines.join("\n"));
      page.cleanup();
    }
    return pages.join("\n");
  }

  function importWordFile(file) {
    busyStart("Analizuję dokument Word…");
    const reader = new FileReader();
    reader.onload = function () {
      ensureEngine()
        .then(function () {
          return window.PABEngine.wordAnalyze(new Uint8Array(reader.result));
        })
        .then(function (report) {
          busyStop();
          openWordModal(report, file.name);
        })
        .catch(function (err) {
          busyStop();
          toast("Błąd analizy DOCX: " + (err.message || err), "err");
        });
    };
    reader.onerror = function () {
      busyStop();
      toast("Nie udało się odczytać pliku DOCX.", "err");
    };
    reader.readAsArrayBuffer(file);
  }

  function importPdfFile(file) {
    busyStart("Analizuję dokument PDF…");
    const reader = new FileReader();
    reader.onload = function () {
      pdfToText(new Uint8Array(reader.result))
        .then(function (text) {
          return ensureEngine().then(function () {
            return window.PABEngine.textAnalyze(text);
          });
        })
        .then(function (report) {
          busyStop();
          openWordModal(report, file.name, "PDF");
        })
        .catch(function (err) {
          busyStop();
          toast("Błąd analizy PDF: " + (err.message || err), "err");
        });
    };
    reader.onerror = function () {
      busyStop();
      toast("Nie udało się odczytać pliku PDF.", "err");
    };
    reader.readAsArrayBuffer(file);
  }

  function closeWordModal() {
    const old = $("#word-modal");
    if (old) old.remove();
  }

  function openWordModal(report, fileName, sourceLabel) {
    closeWordModal();
    const label = sourceLabel || "Worda";
    const matches = report.matches || [];
    const box = document.createElement("div");
    box.id = "word-modal";
    box.className = "pay-modal";
    box._report = report;
    box._sourceLabel = label;
    let rows = "";
    matches.forEach(function (m, i) {
      let val = m.value;
      if (val instanceof Array) val = val.join(", ");
      else if (typeof val === "boolean") val = val ? "tak" : "nie";
      rows +=
        '<label class="word-row">' +
        '<input type="checkbox" data-word-index="' + i + '" checked>' +
        "<span><strong>" + esc(m.label || (m.section + "." + m.key)) + "</strong>: " +
        esc(String(val)) + "</span></label>";
    });
    if (!rows) rows = '<p class="small">Nie rozpoznano żadnych znanych pól.</p>';
    const warnings = (report.warnings || []).length
      ? '<p class="small word-warn">' + esc(report.warnings.join(" ")) + "</p>"
      : "";
    box.innerHTML =
      '<div class="pay-modal-card">' +
      '<button class="pay-close" data-act="word-close" aria-label="Zamknij">×</button>' +
      "<h2>Import z " + esc(label) + "</h2>" +
      '<p class="small">Rozpoznano ' + (report.count || matches.length) +
      " pól w pliku " + esc(fileName || "") +
      ". Zaznacz te, które mają uzupełnić projekt.</p>" +
      '<div class="word-list">' + rows + "</div>" +
      warnings +
      '<div class="pay-modal-options">' +
      '<button class="btn primary" data-act="word-apply"' +
      (matches.length ? "" : " disabled") + ">Importuj zaznaczone</button>" +
      '<button class="btn" data-act="word-close">Anuluj</button>' +
      "</div></div>";
    document.body.appendChild(box);
  }

  function applyWordImport() {
    const box = $("#word-modal");
    if (!box || !box._report) return;
    const checks = Array.prototype.slice.call(
      box.querySelectorAll("[data-word-index]"));
    const selected = checks.map(function (c) { return c.checked; });
    busyStart("Importuję pola…");
    window.PABEngine.wordApply(project, box._report, selected)
      .then(function (merged) {
        closeWordModal();
        setProject(merged, "Uzupełniono " + selected.filter(Boolean).length +
          " pól z " + (box._sourceLabel || "Worda") + ".");
        go("dane/ogolne");
      })
      .catch(function (err) {
        toast("Błąd importu: " + (err.message || err), "err");
      })
      .then(busyStop);
  }

  // --- start ---------------------------------------------------------------

  function mount() {
    const app = document.getElementById("app");
    const who = window.PABAuth && window.PABAuth.displayName
      ? window.PABAuth.displayName() : "";
    app.innerHTML =
      '<header class="topbar">' +
      '<a class="brand" href="#/start"><span class="logo">PAB</span>' +
      '<span class="brand-text"><strong>' + esc(F.app.name) + "</strong><small>" + esc(F.app.tagline) + "</small></span></a>" +
      '<div class="topbar-tools">' +
      '<span class="chip" id="engine-chip">silnik: nieuruchomiony</span>' +
      '<span class="chip save" id="save-state">zapis lokalny</span>' +
      (who ? '<span class="chip user" id="user-chip" title="Zalogowano jako ' + esc(who) + '">' + esc(who) + '</span>' : "") +
      '<a class="btn small" href="#/konto" title="Projekty i ustawienia konta">Panel konta</a>' +
      '<button type="button" class="btn small" data-act="logout">Wyloguj</button>' +
      "</div>" +
      "</header>" +
      '<nav class="steps" id="steps"></nav>' +
      '<main id="view"></main>' +
      '<footer class="footer">' +
      '<span>' + esc(F.app.credit) + " · " + esc(F.app.company) + "</span>" +
      '<span><a href="#/eksport">Płatności</a> · <a href="#/o-programie">O programie</a> · ' +
      '<a href="#/dokumenty">Dokumenty</a></span>' +
      "</footer>";

    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    document.addEventListener("input", onInput);
    document.addEventListener("change", onFile);
    window.addEventListener("hashchange", render);

    migrateLegacyProject();
    const stored = loadProject();
    project = stored || emptyProject();
    if (!stored) saveProject(true);

    ensureEngine().catch(function () {
      /* błąd pokaże się na stronach wymagających silnika */
    });

    render();
  }

  function boot() {
    if (window.PABAuth) {
      window.PABAuth.gate(document.getElementById("app"), mount);
    } else {
      mount();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
