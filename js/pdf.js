/* ==========================================================================
   PAB cyfrowa – wersja Google Sites
   pdf.js – bezpośrednie generowanie PDF w przeglądarce (bez okna druku).

   Używa pdf-lib + fontkit oraz fontów DejaVu (pełne polskie znaki).
   PDF ma A4, motyw dokumentu, znak wodny w dwóch liniach oraz numerację
   „Strona X z Y” już na pierwszej stronie – tak samo jak wersja desktopowa.
   ========================================================================== */
(function () {
  "use strict";

  const PDFLIB_URL = "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
  const FONTKIT_URL = "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/+esm";
  const FONT_REGULAR = "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf";
  const FONT_BOLD = "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf";

  const PAGE_W = 595.28;   // A4
  const PAGE_H = 841.89;
  const MARGIN = { left: 70.9, right: 56.7, top: 68, bottom: 56.7 };
  const USABLE = PAGE_W - MARGIN.left - MARGIN.right;

  let cached = null;

  async function loadLibs() {
    if (cached) return cached;
    const [pdfLib, fontkitModule, regularResponse, boldResponse] = await Promise.all([
      import(PDFLIB_URL),
      import(FONTKIT_URL),
      fetch(FONT_REGULAR, { cache: "force-cache" }),
      fetch(FONT_BOLD, { cache: "force-cache" }),
    ]);
    if (!regularResponse.ok || !boldResponse.ok) {
      throw new Error("Nie udało się pobrać fontów PDF (DejaVu).");
    }
    cached = {
      PDFDocument: pdfLib.PDFDocument,
      rgb: pdfLib.rgb,
      degrees: pdfLib.degrees,
      fontkit: fontkitModule.default || fontkitModule,
      regular: await regularResponse.arrayBuffer(),
      bold: await boldResponse.arrayBuffer(),
    };
    return cached;
  }

  function parseColor(value, fallback) {
    const hex = String(value || fallback || "#000000").trim().replace(/^#/, "");
    if (hex.length !== 6) return fallback || "#000000";
    return "#" + hex.toLowerCase();
  }

  function rgbOf(libs, hex) {
    const value = parseColor(hex, "#000000").slice(1);
    return libs.rgb(
      parseInt(value.slice(0, 2), 16) / 255,
      parseInt(value.slice(2, 4), 16) / 255,
      parseInt(value.slice(4, 6), 16) / 255
    );
  }

  /** Kolor znaku wodnego: odpowiednik setFillAlpha(0.13) na białym tle. */
  function pale(hex, alpha) {
    const value = parseColor(hex, "#1F3864").slice(1);
    const channels = [0, 2, 4].map(function (offset) {
      const c = parseInt(value.slice(offset, offset + 2), 16) / 255;
      return Math.round(255 * (1 - alpha * (1 - c)));
    });
    return "#" + channels.map(function (c) {
      return c.toString(16).padStart(2, "0");
    }).join("");
  }

  function wrap(text, font, size, maxWidth) {
    const out = [];
    String(text === undefined || text === null ? "" : text)
      .split(/\r?\n/)
      .forEach(function (paragraph) {
        if (!paragraph.trim()) {
          out.push("");
          return;
        }
        let line = "";
        paragraph.trim().split(/\s+/).forEach(function (word) {
          const candidate = line ? line + " " + word : word;
          if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
            line = candidate;
            return;
          }
          if (line) out.push(line);
          if (font.widthOfTextAtSize(word, size) <= maxWidth) {
            line = word;
            return;
          }
          let chunk = "";
          for (const character of word) {
            if (font.widthOfTextAtSize(chunk + character, size) > maxWidth && chunk) {
              out.push(chunk);
              chunk = "";
            }
            chunk += character;
          }
          line = chunk;
        });
        if (line) out.push(line);
      });
    return out.length ? out : [""];
  }

  function Layout(libs, theme) {
    this.libs = libs;
    this.theme = theme;
    this.pages = [];
  }

  Layout.prototype.start = async function () {
    // PDFDocument.create() w pdf-lib 1.17.1 zwraca Promise.
    this.pdf = await this.libs.PDFDocument.create();
    this.pdf.registerFontkit(this.libs.fontkit);
    // Fonty muszą być osadzone w tym samym dokumencie, w którym są używane.
    this.fonts = {
      regular: await this.pdf.embedFont(this.libs.regular, { subset: true }),
      bold: await this.pdf.embedFont(this.libs.bold, { subset: true }),
    };
    this.newPage();
  };

  Layout.prototype.newPage = function () {
    const page = this.pdf.addPage([PAGE_W, PAGE_H]);
    this.page = page;
    this.pages.push(page);
    this.y = PAGE_H - MARGIN.top;
    this.watermark(page);
    return page;
  };

  Layout.prototype.watermark = function (page) {
    const font = this.fonts.bold;
    const color = rgbOf(this.libs, pale(this.theme.watermarkColor, 0.13));
    const angle = this.libs.degrees(32);
    const rad = 32 * Math.PI / 180;
    const cx = PAGE_W / 2;
    const cy = PAGE_H / 2;
    window.PABTheme.WATERMARK_LINES.forEach(function (line, index) {
      const size = 22;
      const width = font.widthOfTextAtSize(line, size);
      const y = cy + (index ? -14 : 10);
      page.drawText(line, {
        x: cx - (width / 2) * Math.cos(rad),
        y: y - (width / 2) * Math.sin(rad),
        size: size,
        font: font,
        color: color,
        rotate: angle,
      });
    });
  };

  Layout.prototype.ensure = function (height) {
    if (this.y - height < MARGIN.bottom) this.newPage();
  };

  Layout.prototype.line = function (text, options) {
    options = options || {};
    const font = options.bold ? this.fonts.bold : this.fonts.regular;
    const size = options.size || 10.5;
    const leading = options.leading || size * 1.45;
    this.ensure(leading);
    this.page.drawText(String(text || ""), {
      x: options.x === undefined ? MARGIN.left : options.x,
      y: this.y,
      size: size,
      font: font,
      color: rgbOf(this.libs, options.color || this.theme.ink),
    });
    this.y -= leading;
  };

  Layout.prototype.paragraph = function (text, options) {
    const opts = options || {};
    const font = opts.bold ? this.fonts.bold : this.fonts.regular;
    const size = opts.size || 10.5;
    const leading = size * 1.45;
    const x = opts.indent || MARGIN.left;
    wrap(text, font, size, PAGE_W - MARGIN.right - x).forEach(function (part) {
      opts.bold = opts.bold; // zachowaj styl kolejnych wierszy
      this.line(part, {
        x: x,
        size: size,
        leading: leading,
        bold: opts.bold,
        color: opts.color,
      });
    }, this);
    this.y -= (opts.after || 4);
  };

  Layout.prototype.heading = function (text, level) {
    const h1 = level === 1;
    this.y += h1 ? 10 : 7;
    this.paragraph(text, {
      bold: true,
      size: h1 ? 15 : 12,
      color: h1 ? this.theme.h1 : this.theme.h2,
      after: h1 ? 6 : 4,
    });
    if (h1 && this.theme.docx.h1RuleSize) {
      this.ensure(3);
      this.page.drawLine({
        start: { x: MARGIN.left, y: this.y + 4 },
        end: { x: PAGE_W - MARGIN.right, y: this.y + 4 },
        thickness: 0.7,
        color: rgbOf(this.libs, this.theme.softRule),
      });
    }
  };

  Layout.prototype.table = function (block) {
    const head = block.head || [];
    const rows = block.rows || [];
    if (!head.length && !rows.length) return;
    const ratios = (block.widths || head.map(function () { return 1; }))
      .map(function (value) { return Number(value) || 1; });
    const total = ratios.reduce(function (a, b) { return a + b; }, 0) || 1;
    const widths = ratios.map(function (value) { return USABLE * value / total; });
    const size = 8.5;
    const leading = 11;

    function cells(row) {
      return (row || []).map(function (cell, index) {
        return wrap(cell, this.fonts.regular, size, widths[index] - 10);
      }, this);
    }
    const header = cells.call(this, head);
    const body = rows.map(function (row) { return cells.call(this, row); }, this);
    const headerHeight = Math.max.apply(null, header.map(function (lines) {
      return lines.length * leading + 8;
    }).concat([18]));

    function drawRow(self, data, height, isHead) {
      self.ensure(height + 3);
      let x = MARGIN.left;
      const top = self.y;
      data.forEach(function (lines, index) {
        const width = widths[index] || 0;
        self.page.drawRectangle({
          x: x,
          y: top - height,
          width: width,
          height: height,
          color: isHead ? rgbOf(self.libs, self.theme.headFill) : undefined,
          borderColor: rgbOf(self.libs, self.theme.grid),
          borderWidth: 0.4,
        });
        lines.forEach(function (text, lineIndex) {
          if (!text) return;
          self.page.drawText(text, {
            x: x + 5,
            y: top - 5 - size - lineIndex * leading,
            size: size,
            font: isHead ? self.fonts.bold : self.fonts.regular,
            color: rgbOf(self.libs, isHead ? self.theme.meta : self.theme.ink),
          });
        });
        x += width;
      });
      self.y -= height;
    }

    if (head.length) drawRow(this, header, headerHeight, true);
    body.forEach(function (row) {
      const height = Math.max.apply(null, row.map(function (lines) {
        return lines.length * leading + 8;
      }).concat([18]));
      if (this.y - height < MARGIN.bottom) {
        this.newPage();
        if (head.length) drawRow(this, header, headerHeight, true);
      }
      drawRow(this, row, height, false);
    }, this);
    this.y -= 5;
    if (block.caption) {
      this.paragraph(block.caption, { bold: true, size: 9, color: this.theme.meta, after: 4 });
    }
  };

  Layout.prototype.note = function (text) {
    const size = 9;
    const leading = 12;
    const lines = wrap(text, this.fonts.regular, size, USABLE - 18);
    const height = lines.length * leading + 14;
    this.ensure(height + 6);
    const top = this.y;
    this.page.drawRectangle({
      x: MARGIN.left,
      y: top - height,
      width: USABLE,
      height: height,
      color: rgbOf(this.libs, this.theme.noteFill),
      borderColor: rgbOf(this.libs, this.theme.noteRule),
      borderWidth: 0.5,
    });
    lines.forEach(function (line, index) {
      this.page.drawText(line, {
        x: MARGIN.left + 9,
        y: top - 8 - size - index * leading,
        size: size,
        font: this.fonts.regular,
        color: rgbOf(this.libs, this.theme.ink),
      });
    }, this);
    this.y -= height + 6;
  };

  function cover(doc, layout) {
    const meta = doc.meta || {};
    const center = function (text, font, size, color, gap) {
      const width = font.widthOfTextAtSize(text, size);
      layout.ensure(size + 12);
      layout.page.drawText(text, {
        x: (PAGE_W - width) / 2,
        y: layout.y,
        size: size,
        font: font,
        color: rgbOf(layout.libs, color),
      });
      layout.y -= size + (gap || 10);
    };
    center("BIM ARCHITECTS & CONSULTANTS", layout.fonts.bold, 10, layout.theme.h1, 26);
    center(String(meta.part === undefined || meta.part === null ? "CZĘŚĆ OPISOWA" : meta.part),
      layout.fonts.regular, 10, layout.theme.faint, 18);
    center(String(meta.element || doc.element || ""), layout.fonts.bold, 16, layout.theme.h1, 12);
    center(String(meta.doc_type || "PROJEKT BUDOWLANY"), layout.fonts.regular, 11, layout.theme.meta, 24);
    center(String(meta.nazwa || ""), layout.fonts.bold, 13, layout.theme.ink, 24);

    const rows = [
      ["Adres inwestycji", meta.adres || ""],
      ["Działki ewidencyjne", meta.dzialki || ""],
      ["Kategoria obiektu", meta.kategoria || ""],
      ["Inwestor", (meta.inwestor || "") + (meta.inwestor_adres ? "\n" + meta.inwestor_adres : "")],
    ];
    if (meta.nr_projektu) rows.push(["Nr projektu", meta.nr_projektu]);
    if (meta.tom) rows.push(["Tom", meta.tom]);
    rows.forEach(function (row) {
      layout.paragraph(row[0] + ": " + row[1], {
        bold: false,
        size: 9.5,
        color: layout.theme.meta,
        after: 2,
      });
    });

    layout.paragraph("Sporządził: " + (meta.projektant || ""), { size: 9, after: 2 });
    layout.paragraph("Data opracowania: " + (meta.data || ""), { size: 9, after: 2 });
    layout.newPage();
  }

  function toc(doc, layout) {
    const headings = [];
    (doc.blocks || []).forEach(function (block) {
      if (block.t === "h1" || block.t === "h2") {
        headings.push({ text: block.x || "", level: block.t === "h1" ? 1 : 2 });
      }
    });
    if (!headings.length) return;
    layout.paragraph("SPIS TREŚCI", { bold: true, size: 14, color: layout.theme.h1, after: 10 });
    headings.forEach(function (item) {
      layout.paragraph((item.level === 2 ? "    " : "") + item.text, {
        size: item.level === 1 ? 10.5 : 9.5,
        color: item.level === 1 ? layout.theme.ink : layout.theme.muted,
        after: 1,
      });
    });
    layout.newPage();
  }

  function drawBlocks(doc, layout) {
    let index = 0;
    (doc.blocks || []).forEach(function (block) {
      index += 1;
      const kind = block.t;
      if (kind === "h1" || kind === "h2") {
        layout.heading(block.x || "", kind === "h1" ? 1 : 2);
      } else if (kind === "p") {
        layout.paragraph(block.x || "", { after: 5 });
      } else if (kind === "ul" || kind === "ol") {
        (block.items || []).forEach(function (item, itemIndex) {
          const marker = kind === "ul" ? "• " : (itemIndex + 1) + ". ";
          layout.paragraph(marker + item, {
            indent: MARGIN.left + 8,
            after: 2,
          });
        });
        layout.y -= 3;
      } else if (kind === "table") {
        layout.table(block);
      } else if (kind === "note") {
        layout.note(block.x || "");
      } else if (kind === "sign") {
        const lines = (block.lines || []).filter(Boolean);
        lines.forEach(function (line) {
          const font = layout.fonts.regular;
          const size = 10;
          const width = font.widthOfTextAtSize(String(line), size);
          layout.line(String(line), {
            x: Math.max(MARGIN.left, PAGE_W - MARGIN.right - width),
            size: size,
            leading: 15,
          });
        });
        layout.y -= 4;
      } else if (kind === "pagebreak") {
        layout.newPage();
      }
    });
    return index;
  }

  async function generate(doc, themeKey) {
    const libs = await loadLibs();
    const theme = window.PABTheme.get(themeKey === undefined || themeKey === null
      ? (doc.meta && doc.meta.motyw) : themeKey);
    const layout = new Layout(libs, theme);
    await layout.start();
    const fonts = layout.fonts;
    const meta = doc.meta || {};
    if (meta.cover !== false) cover(doc, layout);
    if (meta.toc !== false) toc(doc, layout);
    drawBlocks(doc, layout);

    const total = layout.pages.length;
    layout.pages.forEach(function (page, index) {
      const text = "Strona " + (index + 1) + " z " + total;
      const width = fonts.regular.widthOfTextAtSize(text, 8);
      page.drawText(text, {
        x: (PAGE_W - width) / 2,
        y: 28,
        size: 8,
        font: fonts.regular,
        color: rgbOf(libs, theme.muted),
      });
    });
    return layout.pdf.save();
  }

  window.PABPdf = {
    generate: generate,
    version: "1.9.19",
  };
})();
