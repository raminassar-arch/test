/* ==========================================================================
   PAB cyfrowa – wersja Google Sites
   license.js – weryfikacja kluczy PAB-XXXX-… w przeglądarce.

   Algorytm jest identyczny z src/license.py:
     treść klucza  = 20 znaków alfabetu base32 (bez 0/O/1/I)
     blob          = 12 bajtów: 5 bajtów danych + 7 bajtów HMAC-SHA256
     dane          = [wersja|rodzaj] [ważność uint16] [numer seryjny uint16]

   Stan licencji trafia do localStorage przeglądarki. Okres próbny trwa
   30 dni; zegar cofnięty nie skraca naliczonych dni (last_seen).
   ========================================================================== */
(function () {
  "use strict";

  const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const PREFIX = "PAB";
  const GROUPS = 5;
  const GROUP_LEN = 4;
  const KEY_LENGTH = GROUPS * GROUP_LEN;
  const TRIAL_DAYS = 30;
  const MAX_DAY = 0xffff;
  const VERSION = 1;
  const KIND_LIMITED = 1;
  const KIND_PERPETUAL = 2;
  const KIND_DURATION = 3;
  const SECRET = "PABc-2026-BIMa-9f3c1d7e5a2b8c4f6d0e1a3b5c7d9e2f-PABcyfrowa";
  const STORAGE_KEY = "pab.sites.license.v1";

  const REASONS = {
    format:
      "Klucz ma nieprawidłową postać. Powinien wyglądać tak: PAB-XXXX-XXXX-XXXX-XXXX-XXXX.",
    checksum:
      "Klucz jest nieprawidłowy lub został zmieniony. Skopiuj go dokładnie w postaci otrzymanej od autora.",
    version: "Ten klucz nie pasuje do tej wersji programu.",
  };

  // --- daty (czas lokalny, format RRRR-MM-DD) ------------------------------

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function iso(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function today() {
    return iso(new Date());
  }

  function parseISO(text) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || "").slice(0, 10));
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  function addDays(isoText, days) {
    const d = parseISO(isoText);
    if (!d) return "";
    d.setDate(d.getDate() + Number(days));
    return iso(d);
  }

  function diffDays(fromIso, toIso) {
    const a = parseISO(fromIso);
    const b = parseISO(toIso);
    if (!a || !b) return 0;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function fmt(isoText) {
    const d = parseISO(isoText);
    if (!d) return "—";
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
  }

  // --- klucze --------------------------------------------------------------

  function normalizeKey(text) {
    let raw = String(text || "")
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "");
    if (raw.length === KEY_LENGTH + PREFIX.length && raw.indexOf(PREFIX) === 0) {
      raw = raw.slice(PREFIX.length);
    }
    return raw.length === KEY_LENGTH ? raw : "";
  }

  function formatKey(text) {
    const body = normalizeKey(text);
    if (!body) return "";
    const groups = [];
    for (let i = 0; i < KEY_LENGTH; i += GROUP_LEN) {
      groups.push(body.slice(i, i + GROUP_LEN));
    }
    return PREFIX + "-" + groups.join("-");
  }

  function decode(body) {
    let value = 0n;
    for (let i = 0; i < body.length; i++) {
      const index = ALPHABET.indexOf(body[i]);
      if (index < 0) return null;
      value = (value << 5n) | BigInt(index);
    }
    if (value >= 1n << 96n) return null;
    const out = new Uint8Array(12);
    for (let i = 11; i >= 0; i--) {
      out[i] = Number(value & 0xffn);
      value >>= 8n;
    }
    return out;
  }

  let cryptoKey = null;

  async function hmac(payload) {
    if (!cryptoKey) {
      cryptoKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
    }
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, payload);
    return new Uint8Array(sig).slice(0, 7);
  }

  function sameBytes(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }

  async function parseKey(text) {
    const body = normalizeKey(text);
    if (!body) return { ok: false, reason: "format" };
    const blob = decode(body);
    if (!blob) return { ok: false, reason: "format" };
    const payload = blob.slice(0, 5);
    const mac = blob.slice(5, 12);
    const expected = await hmac(payload);
    if (!sameBytes(mac, expected)) return { ok: false, reason: "checksum" };

    const head = payload[0];
    const value = (payload[1] << 8) | payload[2];
    const serial = (payload[3] << 8) | payload[4];
    const version = head >> 4;
    const kind = head & 0x0f;
    if (version !== VERSION || [KIND_LIMITED, KIND_PERPETUAL, KIND_DURATION].indexOf(kind) < 0) {
      return { ok: false, reason: "version" };
    }
    if (kind === KIND_PERPETUAL) {
      return {
        ok: true,
        kind: kind,
        serial: serial,
        perpetual: true,
        expiry: null,
        duration: null,
        fromActivation: false,
      };
    }
    if (kind === KIND_DURATION) {
      if (!(value >= 1 && value < MAX_DAY)) return { ok: false, reason: "version" };
      return {
        ok: true,
        kind: kind,
        serial: serial,
        perpetual: false,
        expiry: null,
        duration: value,
        fromActivation: true,
      };
    }
    if (value === MAX_DAY) return { ok: false, reason: "version" };
    return {
      ok: true,
      kind: kind,
      serial: serial,
      perpetual: false,
      expiry: addDays("2020-01-01", value),
      duration: null,
      fromActivation: false,
    };
  }

  // --- stan w przeglądarce -------------------------------------------------

  function readState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch (err) {
      return {};
    }
  }

  function writeState(state) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          first_run: state.first_run || "",
          last_seen: state.last_seen || "",
          key: state.key || "",
          holder: state.holder || "",
          activated: state.activated || "",
        })
      );
    } catch (err) {
      /* tryb prywatny – licencja działa tylko w tej sesji */
    }
  }

  function daysText(count) {
    if (count === 1) return "pozostał 1 dzień";
    return "pozostało " + count + " dni";
  }

  function maskedKey(key) {
    const body = normalizeKey(key);
    if (!body) return "";
    const groups = [];
    for (let i = 0; i < KEY_LENGTH; i += GROUP_LEN) groups.push(body.slice(i, i + GROUP_LEN));
    return PREFIX + "-" + groups.slice(0, -1).map(function () {
      return "••••";
    }).concat(groups.slice(-1)).join("-");
  }

  function decorate(st) {
    Object.defineProperty(st, "valid", {
      enumerable: false,
      get: function () {
        return st.state === "trial" || st.state === "licensed";
      },
    });
    Object.defineProperty(st, "licensed", {
      enumerable: false,
      get: function () {
        return st.state === "licensed";
      },
    });
    Object.defineProperty(st, "summary", {
      enumerable: false,
      get: function () {
        if (st.state === "licensed") {
          if (st.perpetual) return "Licencja pełna – bezterminowa";
          if (st.durationDays) {
            return (
              "Licencja pełna – " +
              st.durationDays +
              " dni od aktywacji (do " +
              fmt(st.expires) +
              ")"
            );
          }
          return "Licencja pełna – ważna do " + fmt(st.expires);
        }
        if (st.state === "trial") {
          return (
            "Wersja próbna – " +
            daysText(st.trialDaysLeft || 0) +
            " (do " +
            fmt(st.trialEnd) +
            ")"
          );
        }
        if (st.state === "trial_expired") return "Okres próbny upłynął " + fmt(st.trialEnd);
        if (st.state === "expired") return "Licencja wygasła " + fmt(st.expires);
        return "Klucz licencyjny jest nieprawidłowy";
      },
    });
    Object.defineProperty(st, "short", {
      enumerable: false,
      get: function () {
        if (st.state === "licensed") return "licencja pełna";
        if (st.state === "trial") return "próbna: " + st.trialDaysLeft + " dni";
        if (st.state === "trial_expired") return "okres próbny upłynął";
        if (st.state === "expired") return "licencja wygasła";
        return "brak ważnej licencji";
      },
    });
    Object.defineProperty(st, "maskedKey", {
      enumerable: false,
      get: function () {
        return maskedKey(st.key);
      },
    });
    return st;
  }

  async function status() {
    const now = today();
    const state = readState();

    let firstRun = state.first_run || now;
    if (firstRun > now) firstRun = now;
    const lastSeen = state.last_seen || "";
    let effective = now;
    if (lastSeen && lastSeen > now) effective = lastSeen;

    const trialEnd = addDays(firstRun, TRIAL_DAYS);
    const trialLeft = Math.max(0, diffDays(effective, trialEnd));

    const st = decorate({
      state: "trial",
      trialStart: firstRun,
      trialEnd: trialEnd,
      trialDaysLeft: trialLeft,
      trialDays: TRIAL_DAYS,
      daysLeft: trialLeft,
      key: state.key || "",
      holder: state.holder || "",
      perpetual: false,
      expires: "",
      durationDays: null,
      activated: state.activated || "",
      serial: null,
      error: "",
    });

    let parsed = null;
    if (st.key) {
      parsed = await parseKey(st.key);
      if (!parsed.ok) st.error = REASONS[parsed.reason] || REASONS.format;
    }

    if (parsed && parsed.ok) {
      st.perpetual = !!parsed.perpetual;
      st.serial = parsed.serial;
      st.durationDays = parsed.duration || null;
      if (st.perpetual) {
        st.expires = "";
        st.state = "licensed";
        st.daysLeft = null;
      } else {
        if (st.durationDays) {
          if (!st.activated) st.activated = now;
          st.expires = addDays(st.activated, st.durationDays);
        } else {
          st.expires = parsed.expiry;
        }
        const left = diffDays(effective, st.expires);
        if (left >= 0) {
          st.state = "licensed";
          st.daysLeft = left;
        } else if (trialLeft > 0) {
          st.state = "trial";
          st.daysLeft = trialLeft;
        } else {
          st.state = "expired";
          st.daysLeft = 0;
        }
      }
    } else if (trialLeft > 0) {
      st.state = "trial";
      st.daysLeft = trialLeft;
    } else if (st.key && parsed && !parsed.ok) {
      st.state = "invalid";
      st.daysLeft = 0;
    } else {
      st.state = "trial_expired";
      st.daysLeft = 0;
    }

    const newSeen = !lastSeen || effective > lastSeen ? effective : lastSeen;
    if (
      state.first_run !== firstRun ||
      state.last_seen !== newSeen ||
      (state.key || "") !== st.key ||
      (state.activated || "") !== (st.activated || "")
    ) {
      writeState({
        first_run: firstRun,
        last_seen: newSeen,
        key: st.key,
        holder: st.holder,
        activated: st.activated || "",
      });
    }
    return st;
  }

  async function activate(text, holder) {
    const parsed = await parseKey(text);
    if (!parsed.ok) throw new Error(REASONS[parsed.reason] || REASONS.format);
    if (!parsed.perpetual && !parsed.duration) {
      if (!parsed.expiry || diffDays(parsed.expiry, today()) > 0) {
        throw new Error(
          "Ten klucz wygasł " + fmt(parsed.expiry) + ". Poproś o nowy klucz licencyjny."
        );
      }
    }

    const state = readState();
    const now = today();
    if (!state.first_run) state.first_run = now;
    const keyText = formatKey(text);
    if (state.key !== keyText || !state.activated) state.activated = now;
    state.key = keyText;
    state.holder = String(holder || "").trim().slice(0, 120);
    state.last_seen = state.last_seen && state.last_seen > now ? state.last_seen : now;
    writeState(state);
    return status();
  }

  async function deactivate() {
    const state = readState();
    state.key = "";
    state.holder = "";
    state.activated = "";
    writeState(state);
    return status();
  }

  window.PABLicense = {
    TRIAL_DAYS: TRIAL_DAYS,
    normalizeKey: normalizeKey,
    formatKey: formatKey,
    parseKey: parseKey,
    status: status,
    activate: activate,
    deactivate: deactivate,
    storageKey: STORAGE_KEY,
  };
})();
