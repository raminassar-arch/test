/* ==========================================================================
   PAB cyfrowa – wersja Google Sites
   theme.js – motywy dokumentów końcowych (DOCX i PDF).

   Motyw jest ustawieniem projektu (project.meta.motyw), nie treścią dokumentu.
   Silnik content.py buduje model bloków, a ten moduł dostarcza parametry
   wyglądu do buildera DOCX (docx.js) i strony wydruku (render.js).
   Dostępne są motywy nr 1–5; nr 1 zachowuje dotychczasowy układ urzędowy.
   Każdy dokument zawiera znak wodny
   „BIM ARCHITECTS & CONSULTANTS WERSJA TESTOWA”.
   ========================================================================== */
(function () {
  "use strict";

  const DEFAULT = "motyw-1";
  const WATERMARK_LINES = ["BIM ARCHITECTS & CONSULTANTS", "WERSJA TESTOWA"];
  const WATERMARK = WATERMARK_LINES.join("\n");

  // Aliasy zachowane dla starszych projektów i nazw z zamówienia.
  const ALIASES = {
    "1": "motyw-1",
    "nr 1": "motyw-1",
    "motyw 1": "motyw-1",
    "motyw nr 1": "motyw-1",
    klasyczny: "motyw-1",
    classic: "motyw-1",
    klasyk: "motyw-1",
    traditional: "motyw-1",
    "2": "motyw-2",
    "nr 2": "motyw-2",
    "motyw 2": "motyw-2",
    "motyw nr 2": "motyw-2",
    nowoczesny: "motyw-2",
    modern: "motyw-2",
    "3": "motyw-3",
    "nr 3": "motyw-3",
    "motyw 3": "motyw-3",
    "motyw nr 3": "motyw-3",
    "bardzo-nowoczesny": "motyw-3",
    "bardzo nowoczesny": "motyw-3",
    ultra: "motyw-3",
    "ultra-modern": "motyw-3",
    "4": "motyw-4",
    "nr 4": "motyw-4",
    "motyw 4": "motyw-4",
    "motyw nr 4": "motyw-4",
    "5": "motyw-5",
    "nr 5": "motyw-5",
    "motyw 5": "motyw-5",
    "motyw nr 5": "motyw-5",
  };

  const THEMES = {
    "motyw-1": {
      key: "motyw-1",
      label: "Motyw nr 1",
      opis: "Times New Roman, granatowe nagłówki i klasyczna linia – dotychczasowy układ urzędowy. Znak wodny w kolorze granatu.",
      watermark: WATERMARK,
      watermarkColor: "#1F3864",
      bodyFont: "Times New Roman",
      bodyCss: "'Times New Roman', Times, serif",
      headFont: "Arial",
      headCss: "Arial, sans-serif",
      bodyPt: 11,
      leading: 1.35,
      ink: "#111111",
      h1: "#1F3864",
      h2: "#2F5496",
      meta: "#404040",
      muted: "#595959",
      faint: "#7F7F7F",
      rule: "#BFBFBF",
      grid: "#8C8C8C",
      softRule: "#D9D9D9",
      noteRule: "#C9C9C9",
      labelFill: "#F2F5FA",
      headFill: "#E7ECF5",
      noteFill: "#F7F7F7",
      docx: {
        bodySize: 22, h1Size: 28, h2Size: 23, line: 276,
        h1RuleSize: 4, coverRuleSize: 8,
      },
      css: { h1Size: "14pt", h2Size: "11.5pt" },
    },

    "motyw-2": {
      key: "motyw-2",
      label: "Motyw nr 2",
      opis: "Calibri i zielone akcenty – lżejszy, uporządkowany układ biurowy. Znak wodny w kolorze głębokiej zieleni.",
      watermark: WATERMARK,
      watermarkColor: "#14563F",
      bodyFont: "Calibri",
      bodyCss: "Calibri, 'Segoe UI', sans-serif",
      headFont: "Calibri",
      headCss: "Calibri, 'Segoe UI', sans-serif",
      bodyPt: 10.5,
      leading: 1.3,
      ink: "#16241C",
      h1: "#14563F",
      h2: "#1E6B50",
      meta: "#3B4B42",
      muted: "#65766B",
      faint: "#65766B",
      rule: "#D6E0D5",
      grid: "#C4D2C8",
      softRule: "#E1EAE3",
      noteRule: "#D6E0D5",
      labelFill: "#F2F7F1",
      headFill: "#E6EFE6",
      noteFill: "#F7FAF6",
      docx: {
        bodySize: 21, h1Size: 26, h2Size: 22, line: 258,
        h1RuleSize: 0, coverRuleSize: 6,
      },
      css: { h1Size: "13pt", h2Size: "11pt" },
    },

    "motyw-3": {
      key: "motyw-3",
      label: "Motyw nr 3",
      opis: "Segoe UI, głęboka zieleń i złoto – wyrazisty układ prezentacyjny. Znak wodny w kolorze złota.",
      watermark: WATERMARK,
      watermarkColor: "#C8A24A",
      bodyFont: "Segoe UI",
      bodyCss: "'Segoe UI', Aptos, sans-serif",
      headFont: "Segoe UI",
      headCss: "'Segoe UI', Aptos, sans-serif",
      bodyPt: 10.5,
      leading: 1.28,
      ink: "#16241C",
      h1: "#0C3B2C",
      h2: "#0C6E52",
      meta: "#3B4B42",
      muted: "#65766B",
      faint: "#8A6B20",
      rule: "#C8A24A",
      grid: "#D6E0D5",
      softRule: "#E4C274",
      noteRule: "#C8A24A",
      labelFill: "#FBF4DF",
      headFill: "#E6EFE6",
      noteFill: "#FBF4DF",
      docx: {
        bodySize: 21, h1Size: 30, h2Size: 23, line: 252,
        h1RuleSize: 12, coverRuleSize: 16,
      },
      css: { h1Size: "15pt", h2Size: "11.5pt" },
    },

    "motyw-4": {
      key: "motyw-4",
      label: "Motyw nr 4",
      opis: "Georgia i bordo – elegancki, klasyczny układ o ciepłym charakterze. Znak wodny w kolorze bordo.",
      watermark: WATERMARK,
      watermarkColor: "#7A2348",
      bodyFont: "Georgia",
      bodyCss: "Georgia, 'Times New Roman', serif",
      headFont: "Georgia",
      headCss: "Georgia, 'Times New Roman', serif",
      bodyPt: 11,
      leading: 1.36,
      ink: "#2E1822",
      h1: "#7A2348",
      h2: "#A3476B",
      meta: "#4A3440",
      muted: "#6E5863",
      faint: "#A3476B",
      rule: "#E0B7C8",
      grid: "#D6A8BC",
      softRule: "#E0B7C8",
      noteRule: "#D6A8BC",
      labelFill: "#FBEDF3",
      headFill: "#F6DDE8",
      noteFill: "#FDF5F8",
      docx: {
        bodySize: 22, h1Size: 28, h2Size: 23, line: 276,
        h1RuleSize: 8, coverRuleSize: 10,
      },
      css: { h1Size: "14pt", h2Size: "11.5pt" },
    },

    "motyw-5": {
      key: "motyw-5",
      label: "Motyw nr 5",
      opis: "Verdana i turkus – nowoczesny, techniczny układ o dużej czytelności. Znak wodny w kolorze turkusu.",
      watermark: WATERMARK,
      watermarkColor: "#00838F",
      bodyFont: "Verdana",
      bodyCss: "Verdana, 'Segoe UI', sans-serif",
      headFont: "Verdana",
      headCss: "Verdana, 'Segoe UI', sans-serif",
      bodyPt: 10,
      leading: 1.32,
      ink: "#172B3A",
      h1: "#2B2D71",
      h2: "#00838F",
      meta: "#35435A",
      muted: "#5C6D84",
      faint: "#00838F",
      rule: "#B8D9DE",
      grid: "#7FD1D8",
      softRule: "#7FD1D8",
      noteRule: "#7FD1D8",
      labelFill: "#EAF7F8",
      headFill: "#D7EEF0",
      noteFill: "#F3FAFB",
      docx: {
        bodySize: 20, h1Size: 28, h2Size: 23, line: 252,
        h1RuleSize: 10, coverRuleSize: 12,
      },
      css: { h1Size: "14pt", h2Size: "11.5pt" },
    },
  };

  function resolve(value) {
    const raw = String(value || "").trim().toLowerCase().replace(/_/g, "-");
    const canonical = Object.prototype.hasOwnProperty.call(ALIASES, raw) ? ALIASES[raw] : raw;
    return Object.prototype.hasOwnProperty.call(THEMES, canonical) ? canonical : DEFAULT;
  }

  function get(value) {
    return THEMES[resolve(value)];
  }

  /** Zapisuje wybrany motyw w modelu dokumentu przed budową pliku. */
  function use(doc, value) {
    const cfg = get(value);
    if (doc) {
      doc.meta = doc.meta || {};
      doc.meta.motyw = cfg.key;
    }
    return cfg;
  }

  /** Deklaracje CSS do wstawienia bezpośrednio w atrybucie style. */
  function style(value) {
    const t = get(value);
    return [
      "--pab-body:" + t.bodyCss,
      "--pab-head:" + t.headCss,
      "--pab-size:" + t.bodyPt + "pt",
      "--pab-leading:" + t.leading,
      "--pab-ink:" + t.ink,
      "--pab-h1:" + t.h1,
      "--pab-h2:" + t.h2,
      "--pab-meta:" + t.meta,
      "--pab-muted:" + t.muted,
      "--pab-faint:" + t.faint,
      "--pab-rule:" + t.rule,
      "--pab-grid:" + t.grid,
      "--pab-soft-rule:" + t.softRule,
      "--pab-note-rule:" + t.noteRule,
      "--pab-label-fill:" + t.labelFill,
      "--pab-head-fill:" + t.headFill,
      "--pab-note-fill:" + t.noteFill,
      "--pab-watermark:" + t.watermarkColor,
      "--pab-h1-size:" + t.css.h1Size,
      "--pab-h2-size:" + t.css.h2Size,
      "--pab-cover-rule:" + (t.docx.coverRuleSize / 8) + "pt",
      "--pab-h1-rule:" + (t.docx.h1RuleSize ? (t.docx.h1RuleSize / 8) + "pt" : "0"),
    ].join(";");
  }

  /** Zmienne CSS dla wydruku (PDF) i podglądu dokumentu. */
  function cssVars(value, selector) {
    return (selector || ":root") + "{" + style(value) + "}";
  }

  window.PABTheme = {
    DEFAULT: DEFAULT,
    WATERMARK: WATERMARK,
    WATERMARK_LINES: WATERMARK_LINES,
    THEMES: THEMES,
    keys: Object.keys(THEMES),
    resolve: resolve,
    get: get,
    use: use,
    style: style,
    cssVars: cssVars,
  };
})();
