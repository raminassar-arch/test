/* ==========================================================================
   PAB cyfrowa – wersja Google Sites
   payment.js – dostęp do płatnych plików PDF / DOCX (per dokument).

   CENNIK (netto, zł):
     PDF + DOCX  40 zł
     sam PDF     20 zł
     sam DOCX    25 zł

   linki płatności są NA RAZIE PLACEHOLDERAMI – przed publikacją trzeba
   podmienić trzy adresy w LINKS poniżej na prawdziwe linki PayU /
   Przelewy24 / PayPal.me / BLIK. Aplikacja jest statyczna, więc nie potrafi
   sama zweryfikować przelewu: po powrocie ze strony płatności użytkownik
   klika „Opłacone”, co zapisuje dostęp w localStorage tej przeglądarki.

   Nie dotyczy wersji desktopowej (dist\PAB-cyfrowa.exe) ani wersji web
   (web\) – tam obowiązuje dotychczasowa licencja kluczami PAB-… .
   ========================================================================== */
(function () {
  "use strict";

  const STORAGE_KEY = "pab.sites.paid.v1";

  /* TODO: wstaw tu prawdziwe adresy. Obsługiwane tokeny: {kind}, {amount}. */
  const LINKS = {
    bundle: "https://TODO-PAYMENT-LINK.example/pay?amount=40&product=PAB-{kind}-PDF-DOCX",
    pdf: "https://TODO-PAYMENT-LINK.example/pay?amount=20&product=PAB-{kind}-PDF",
    docx: "https://TODO-PAYMENT-LINK.example/pay?amount=25&product=PAB-{kind}-DOCX",
  };

  const PRICES = { bundle: 40, pdf: 20, docx: 25 };
  const FORMATS = { bundle: ["pdf", "docx"], pdf: ["pdf"], docx: ["docx"] };

  let state = read();

  function read() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function write() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* tryb prywatny – dostęp działa tylko w tej sesji */
    }
  }

  function label(kind) {
    const docs = (window.PAB_FIELDS || {}).dokumenty || [];
    for (let i = 0; i < docs.length; i++) {
      if (docs[i][0] === kind) return docs[i][1];
    }
    return kind;
  }

  function configured() {
    return !/TODO-PAYMENT-LINK/.test(LINKS.pdf + LINKS.docx + LINKS.bundle);
  }

  function url(kind, option) {
    const template = LINKS[option];
    if (!template) return "";
    return template
      .replace(/\{kind\}/g, encodeURIComponent(kind))
      .replace(/\{amount\}/g, String(PRICES[option]));
  }

  function isUnlocked(kind, format) {
    const entry = state[kind];
    return !!(entry && (format === "both" ? entry.pdf && entry.docx : entry[format]));
  }

  function status(kind) {
    if (kind) {
      return {
        kind: kind,
        pdf: isUnlocked(kind, "pdf"),
        docx: isUnlocked(kind, "docx"),
      };
    }
    const out = {};
    Object.keys(state).forEach(function (k) {
      out[k] = status(k);
    });
    return out;
  }

  function markPaid(kind, option) {
    const formats = FORMATS[option];
    if (!formats) throw new Error("Nieznana opcja płatności: " + option);
    const entry = state[kind] || {};
    formats.forEach(function (f) {
      entry[f] = true;
    });
    entry.at = new Date().toISOString();
    state[kind] = entry;
    write();
    return status(kind);
  }

  function reset() {
    state = {};
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* brak dostępu do pamięci – stan i tak wyczyszczony w pamięci */
    }
  }

  window.PABPayment = {
    PRICES: PRICES,
    LINKS: LINKS,
    configured: configured,
    label: label,
    url: url,
    isUnlocked: isUnlocked,
    status: status,
    markPaid: markPaid,
    reset: reset,
  };
})();
