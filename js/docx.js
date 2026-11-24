/* ==========================================================================
   PAB cyfrowa – wersja Google Sites
   docx.js – buduje plik .docx (OOXML) z modelu bloków zwróconego przez silnik.
   Odwzorowuje układ wersji desktopowej: A4, strona tytułowa, spis treści,
   nagłówek z linią, stopka „Strona X z Y”, tabele z powtarzanym nagłówkiem.
   ========================================================================== */
(function () {
  "use strict";

  const PAGE_W = 11906; // A4 w twips (21 cm)
  const PAGE_H = 16838; // 29,7 cm
  const MARGIN = { top: 1417, bottom: 1247, left: 1417, right: 1134 };
  const USABLE = PAGE_W - MARGIN.left - MARGIN.right; // 9355 = 16,5 cm

  // Ustawienia wybranego motywu dokumentu (project.meta.motyw).
  let T = window.PABTheme.get("motyw-1");

  function useTheme(doc, value) {
    const chosen = value === undefined || value === null
      ? (doc && doc.meta ? doc.meta.motyw : null)
      : value;
    T = window.PABTheme.use(doc, chosen);
    return T;
  }

  /** Kolor w formacie OOXML (bez znaku #). */
  function hx(color) {
    return String(color || "").replace("#", "").toUpperCase();
  }

  function esc(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rPr(o) {
    o = o || {};
    let out = "";
    const font = o.font || "";
    if (font) {
      out +=
        '<w:rFonts w:ascii="' + font + '" w:hAnsi="' + font + '" w:cs="' + font + '"/>';
    }
    if (o.b) out += "<w:b/>";
    if (o.i) out += "<w:i/>";
    if (o.color) out += '<w:color w:val="' + o.color + '"/>';
    if (o.size) {
      out += '<w:sz w:val="' + o.size + '"/><w:szCs w:val="' + o.size + '"/>';
    }
    return out ? "<w:rPr>" + out + "</w:rPr>" : "";
  }

  function run(text, o) {
    const body = String(text === undefined || text === null ? "" : text)
      .split("\n")
      .map(function (line) {
        return '<w:t xml:space="preserve">' + esc(line) + "</w:t>";
      })
      .join("<w:br/>");
    return "<w:r>" + rPr(o) + body + "</w:r>";
  }

  function pPr(o) {
    o = o || {};
    let out = "";
    if (o.style) out += '<w:pStyle w:val="' + o.style + '"/>';
    if (o.keepNext) out += "<w:keepNext/>";
    if (o.keepLines) out += "<w:keepLines/>";
    if (o.border && o.border.size) {
      out +=
        '<w:pBdr><w:bottom w:val="single" w:sz="' +
        (o.border.size || 4) +
        '" w:space="' +
        (o.border.space === undefined ? 1 : o.border.space) +
        '" w:color="' +
        (o.border.color || "auto") +
        '"/></w:pBdr>';
    }
    if (o.shd) {
      out += '<w:shd w:val="clear" w:color="auto" w:fill="' + o.shd + '"/>';
    }
    const sp = o.spacing || {};
    if (sp.before !== undefined || sp.after !== undefined || sp.line !== undefined) {
      out += "<w:spacing";
      if (sp.before !== undefined) out += ' w:before="' + sp.before + '"';
      if (sp.after !== undefined) out += ' w:after="' + sp.after + '"';
      if (sp.line !== undefined) {
        out += ' w:line="' + sp.line + '" w:lineRule="' + (sp.rule || "auto") + '"';
      }
      out += "/>";
    }
    const ind = o.ind || {};
    if (ind.left !== undefined || ind.hanging !== undefined) {
      out += "<w:ind";
      if (ind.left !== undefined) out += ' w:left="' + ind.left + '"';
      if (ind.hanging !== undefined) out += ' w:hanging="' + ind.hanging + '"';
      out += "/>";
    }
    if (o.jc) out += '<w:jc w:val="' + o.jc + '"/>';
    if (o.outline !== undefined) out += '<w:outlineLvl w:val="' + o.outline + '"/>';
    return out ? "<w:pPr>" + out + "</w:pPr>" : "";
  }

  function para(content, o) {
    return "<w:p>" + pPr(o) + (content || "") + "</w:p>";
  }

  function field(instr, placeholder, o) {
    return (
      "<w:r>" +
      rPr(o) +
      '<w:fldChar w:fldCharType="begin"/></w:r>' +
      "<w:r>" +
      rPr(o) +
      '<w:instrText xml:space="preserve"> ' +
      esc(instr) +
      " </w:instrText></w:r>" +
      "<w:r>" +
      rPr(o) +
      '<w:fldChar w:fldCharType="separate"/></w:r>' +
      run(placeholder || "", o) +
      "<w:r>" +
      rPr(o) +
      '<w:fldChar w:fldCharType="end"/></w:r>'
    );
  }

  function pageBreak() {
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  }

  function spacer(points) {
    return para("", { spacing: { before: 0, after: 0, line: points * 20, rule: "exact" } });
  }

  function cell(text, o) {
    o = o || {};
    const width = o.width || 2000;
    const lines = String(text === undefined || text === null ? "" : text).split("\n");
    const paragraphs = lines
      .map(function (line) {
        return para(run(line, { font: o.font, size: o.size || 17, b: o.bold, i: o.italic, color: o.color }), {
          spacing: { before: 0, after: 20, line: 240, rule: "auto" },
          jc: o.align || "left",
        });
      })
      .join("");
    return (
      "<w:tc><w:tcPr>" +
      '<w:tcW w:w="' + width + '" w:type="dxa"/>' +
      (o.fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' : "") +
      '<w:vAlign w:val="center"/>' +
      "</w:tcPr>" +
      (paragraphs || para("")) +
      "</w:tc>"
    );
  }

  function tableXml(opts) {
    const cols = opts.cols;
    const widths = opts.widths;
    let xml =
      "<w:tbl><w:tblPr>" +
      '<w:tblW w:w="' +
      USABLE +
      '" w:type="dxa"/>' +
      '<w:jc w:val="' +
      (opts.align || "center") +
      '"/>' +
      "<w:tblBorders>" +
      ["top", "left", "bottom", "right", "insideH", "insideV"]
        .map(function (side) {
          return (
            '<w:' +
            side +
            ' w:val="single" w:sz="' +
            (opts.borderSize || 4) +
            '" w:space="0" w:color="' +
            (opts.borderColor || hx(T.grid)) +
            '"/>'
          );
        })
        .join("") +
      "</w:tblBorders>" +
      '<w:tblLayout w:type="fixed"/>' +
      '<w:tblCellMar><w:top w:w="' +
      (opts.marginTop === undefined ? 40 : opts.marginTop) +
      '" w:type="dxa"/><w:left w:w="' +
      (opts.marginLeft === undefined ? 80 : opts.marginLeft) +
      '" w:type="dxa"/><w:bottom w:w="' +
      (opts.marginBottom === undefined ? 40 : opts.marginBottom) +
      '" w:type="dxa"/><w:right w:w="' +
      (opts.marginRight === undefined ? 80 : opts.marginRight) +
      '" w:type="dxa"/></w:tblCellMar>' +
      "</w:tblPr><w:tblGrid>" +
      widths
        .map(function (w) {
          return '<w:gridCol w:w="' + w + '"/>';
        })
        .join("") +
      "</w:tblGrid>";

    if (opts.head && opts.head.length) {
      xml +=
        "<w:tr><w:trPr><w:tblHeader/></w:trPr>" +
        opts.head
          .map(function (label, i) {
            return cell(label, {
              width: widths[i],
              fill: opts.headFill || hx(T.headFill),
              bold: true,
              size: opts.size || 17,
              align: "center",
            });
          })
          .join("") +
        "</w:tr>";
    }

    (opts.rows || []).forEach(function (values) {
      xml +=
        "<w:tr>" +
        widths
          .map(function (w, i) {
            return cell(values[i] === undefined ? "" : values[i], {
              width: w,
              size: opts.size || 17,
              align: opts.cellAlign || "left",
              fill: opts.colFill ? opts.colFill[i] : opts.cellFill,
              bold: opts.colBold ? opts.colBold[i] : false,
              italic: opts.italic,
            });
          })
          .join("") +
        "</w:tr>";
    });

    return (
      xml +
      "</w:tbl>" +
      (opts.trail === false
        ? ""
        : para("", { spacing: { before: 0, after: 80, line: 80, rule: "exact" } }))
    );
  }

  // --- strona tytułowa -----------------------------------------------------

  function titlePage(meta, element) {
    const parts = [];
    parts.push(spacer(12));
    parts.push(
      para(run(meta.part === undefined || meta.part === null ? "CZĘŚĆ OPISOWA" : meta.part, { font: T.headFont, size: 20, b: true, color: hx(T.faint) }), {
        jc: "center",
        spacing: { after: 40 },
      })
    );
    parts.push(
      para(run(meta.element || element, { font: T.headFont, size: 34, b: true, color: hx(T.h1) }), {
        jc: "center",
        spacing: { after: 80 },
      })
    );
    parts.push(
      para(
        run(meta.doc_type || "PROJEKT BUDOWLANY", { font: T.headFont, size: 22, color: hx(T.meta) }),
        { jc: "center", spacing: { after: 520 }, border: { color: hx(T.h1), size: T.docx.coverRuleSize, space: 4 } }
      )
    );
    parts.push(
      para(run(meta.nazwa || "", { font: T.headFont, size: 28, b: true }), {
        jc: "center",
        spacing: { before: 200, after: 360 },
      })
    );

    const rows = [
      ["Adres inwestycji", meta.adres || ""],
      ["Działki ewidencyjne", meta.dzialki || ""],
      ["Kategoria obiektu", meta.kategoria || ""],
      [
        "Inwestor",
        (meta.inwestor || "") + (meta.inwestor_adres ? "\n" + meta.inwestor_adres : ""),
      ],
    ];
    if (meta.nr_projektu) rows.push(["Nr projektu", meta.nr_projektu]);
    if (meta.tom) rows.push(["Tom", meta.tom]);

    parts.push(
      tableXml({
        widths: [2381, 6974],
        borderColor: hx(T.rule),
        marginTop: 70,
        marginLeft: 110,
        marginBottom: 70,
        marginRight: 110,
        size: 19,
        rows: rows,
        cellAlign: "left",
        colFill: [hx(T.labelFill), undefined],
        colBold: [true, false],
        trail: false,
      })
    );

    parts.push(spacer(20));

    let signRows = (meta.projektanci || []).map(function (row) {
      return [row.funkcja || "", row.imie || "", row.specjalnosc || "", row.uprawnienia || ""];
    });
    if (!signRows.length) {
      signRows = [
        ["Projektant", meta.projektant || "", meta.specjalnosc || "", meta.uprawnienia || ""],
      ];
      if (meta.sprawdzajacy) {
        signRows.push([
          "Sprawdzający",
          meta.sprawdzajacy,
          meta.specjalnosc || "",
          meta.sprawdzajacy_uprawnienia || "",
        ]);
      }
    }

    const widths = [1928, 3402, 2381, 1644];
    parts.push(
      tableXml({
        widths: widths,
        borderColor: hx(T.faint),
        headFill: hx(T.headFill),
        marginTop: 60,
        marginLeft: 90,
        marginBottom: 60,
        marginRight: 90,
        size: 17,
        head: ["Funkcja", "Imię i nazwisko / specjalność", "Nr uprawnień", "Podpis"],
        rows: signRows.map(function (row) {
          return [row[0], row[1] + (row[2] ? "\n" + row[2] : ""), row[3], ""];
        }),
        trail: false,
      })
    );

    parts.push(spacer(26));
    parts.push(
      para(run(meta.adres || "", { size: 18, color: hx(T.meta) }), {
        jc: "right",
        spacing: { after: 40 },
      })
    );
    parts.push(
      para(run(meta.data || "", { size: 19, b: true }), { jc: "right", spacing: { after: 40 } })
    );
    parts.push(
      para(run("Zakres opracowania: " + (meta.zakres || ""), { size: 16, i: true, color: hx(T.muted) }), {
        jc: "right",
        spacing: { before: 40 },
      })
    );
    return parts.join("");
  }

  function tocPage() {
    return (
      pageBreak() +
      para(run("SPIS TREŚCI", { font: T.headFont, size: T.docx.h1Size, b: true }), {
        spacing: { after: 240 },
      }) +
      para(
        field(
          'TOC \\o "1-2" \\h \\z \\u',
          "Spis treści zostanie zaktualizowany po otwarciu dokumentu w programie Word (Ctrl+A, F9).",
          { size: 20 }
        ),
        { spacing: { after: 0 } }
      )
    );
  }

  // --- treść ---------------------------------------------------------------

  function bodyBlocks(blocks) {
    const out = [];
    (blocks || []).forEach(function (block) {
      const kind = block.t;
      if (kind === "h1") {
        out.push(
          para(run(block.x || "", { font: T.headFont, size: T.docx.h1Size, b: true, color: hx(T.h1) }), {
            style: "Heading1",
            keepNext: true,
            outline: 0,
            spacing: { before: 360, after: 160, line: 240, rule: "auto" },
            border: { color: hx(T.softRule), size: T.docx.h1RuleSize, space: 1 },
          })
        );
      } else if (kind === "h2") {
        out.push(
          para(run(block.x || "", { font: T.headFont, size: T.docx.h2Size, b: true, color: hx(T.h2) }), {
            style: "Heading2",
            keepNext: true,
            outline: 1,
            spacing: { before: 240, after: 80, line: 240, rule: "auto" },
          })
        );
      } else if (kind === "p") {
        out.push(para(run(block.x || ""), { jc: "both" }));
      } else if (kind === "ul") {
        (block.items || []).forEach(function (item) {
          out.push(
            para(run("•\t") + run(item), {
              ind: { left: 510, hanging: 255 },
              jc: "both",
              spacing: { after: 40 },
            })
          );
        });
      } else if (kind === "ol") {
        (block.items || []).forEach(function (item, index) {
          out.push(
            para(run(index + 1 + ".\t") + run(item), {
              ind: { left: 510, hanging: 255 },
              jc: "both",
              spacing: { after: 40 },
            })
          );
        });
      } else if (kind === "table") {
        const head = block.head || [];
        const rows = block.rows || [];
        const ncols = Math.max(head.length, rows.reduce(function (max, r) { return Math.max(max, r.length); }, 0), 1);
        let widths;
        if (block.widths && block.widths.length === ncols) {
          const total = block.widths.reduce(function (a, b) { return a + b; }, 0) || 1;
          widths = block.widths.map(function (w) {
            return Math.round((USABLE * w) / total);
          });
        } else {
          widths = new Array(ncols).fill(Math.round(USABLE / ncols));
        }
        if (block.caption) {
          out.push(
            para(run(block.caption, { font: T.headFont, size: 18, b: true, color: hx(T.meta) }), {
              keepNext: true,
              spacing: { before: 160, after: 60 },
            })
          );
        }
        out.push(tableXml({ widths: widths, head: head, rows: rows }));
      } else if (kind === "note") {
        out.push(
          tableXml({
            widths: [USABLE],
            borderColor: hx(T.noteRule),
            marginTop: 80,
            marginLeft: 140,
            marginBottom: 80,
            marginRight: 140,
            rows: [[block.x || ""]],
            cellAlign: "both",
            cellFill: hx(T.noteFill),
            size: 18,
            italic: true,
          })
        );
      } else if (kind === "sign") {
        const lines = block.lines || [];
        if (lines.length) {
          out.push(
            para(
              lines
                .map(function (line) {
                  return run(line, { font: T.headFont, size: 20 });
                })
                .join("<w:r><w:br/></w:r>"),
              { jc: "right", spacing: { before: 280, after: 40 } }
            )
          );
        }
      } else if (kind === "pagebreak") {
        out.push(pageBreak());
      }
    });
    return out.join("");
  }

  // --- części pakietu ------------------------------------------------------

  const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  function stylesXml() {
    const body = T.bodyFont;
    const spacing = '<w:spacing w:after="120" w:line="' + T.docx.line + '" w:lineRule="auto"/>';
    return (
      XML_HEAD +
      '<w:styles xmlns:w="' + NS_W + '">' +
      "<w:docDefaults><w:rPrDefault><w:rPr>" +
      '<w:rFonts w:ascii="' + body + '" w:hAnsi="' + body + '" w:cs="' + body + '"/>' +
      '<w:sz w:val="' + T.docx.bodySize + '"/><w:szCs w:val="' + T.docx.bodySize + '"/>' +
      '<w:lang w:val="pl-PL"/>' +
      "</w:rPr></w:rPrDefault>" +
      '<w:pPrDefault><w:pPr>' + spacing + '<w:jc w:val="both"/></w:pPr></w:pPrDefault>' +
      "</w:docDefaults>" +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/>' +
      "<w:pPr>" + spacing + '<w:jc w:val="both"/></w:pPr>' +
      '<w:rPr><w:rFonts w:ascii="' + body + '" w:hAnsi="' + body + '" w:cs="' + body + '"/>' +
      '<w:sz w:val="' + T.docx.bodySize + '"/><w:szCs w:val="' + T.docx.bodySize + '"/></w:rPr>' +
      "</w:style>" +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>' +
      '<w:pPr><w:keepNext/><w:spacing w:before="360" w:after="160"/><w:outlineLvl w:val="0"/></w:pPr>' +
      '<w:rPr><w:rFonts w:ascii="' + T.headFont + '" w:hAnsi="' + T.headFont + '"/><w:b/>' +
      '<w:color w:val="' + hx(T.h1) + '"/><w:sz w:val="' + T.docx.h1Size + '"/><w:szCs w:val="' + T.docx.h1Size + '"/></w:rPr>' +
      "</w:style>" +
      '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>' +
      '<w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr>' +
      '<w:rPr><w:rFonts w:ascii="' + T.headFont + '" w:hAnsi="' + T.headFont + '"/><w:b/>' +
      '<w:color w:val="' + hx(T.h2) + '"/><w:sz w:val="' + T.docx.h2Size + '"/><w:szCs w:val="' + T.docx.h2Size + '"/></w:rPr>' +
      "</w:style>" +
      "</w:styles>"
    );
  }

  /** Znak wodny w nagłówku – VML czytelny także w Wordzie. */
  function watermarkXml(suffix) {
    const color = hx(T.watermarkColor);
    const font = esc(T.headFont);
    const lines = T.watermark.split("\n");
    const text = lines.map(esc).join("&#13;");
    return (
      '<w:r><w:pict xmlns:v="urn:schemas-microsoft-com:vml" ' +
      'xmlns:o="urn:schemas-microsoft-com:office:office">' +
      '<v:shapetype id="_x0000_t136_' + suffix + '" coordsize="21600,21600" ' +
      'o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e">' +
      '<v:formulas>' +
      '<v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/>' +
      '<v:f eqn="sum 21600 0 @1"/><v:f eqn="sum 0 0 @2"/>' +
      '<v:f eqn="sum 21600 0 @3"/><v:f eqn="if @0 @3 0"/>' +
      '<v:f eqn="if @0 21600 @1"/><v:f eqn="if @0 0 @2"/>' +
      '<v:f eqn="if @0 @4 21600"/><v:f eqn="mid @5 @6"/>' +
      '<v:f eqn="mid @8 @5"/><v:f eqn="mid @7 @8"/>' +
      '<v:f eqn="mid @6 @7"/><v:f eqn="sum @6 0 @5"/>' +
      '</v:formulas>' +
      '<v:path textpathok="t" o:connecttype="custom" ' +
      'o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800" ' +
      'o:connectangles="270,180,90,0"/>' +
      '<v:textpath on="t" fitshape="t"/>' +
      '<v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles>' +
      '<o:lock v:ext="edit" text="t" shapetype="t"/>' +
      '</v:shapetype>' +
      '<v:shape id="' + suffix + 'Watermark" o:spid="_x0000_s' +
      (suffix === "wm1" ? "2049" : "2050") + '" ' +
      'type="#_x0000_t136_' + suffix + '" ' +
      'style="position:absolute;margin-left:0;margin-top:0;width:468pt;height:170pt;' +
      'rotation:315;z-index:-251658752;mso-position-horizontal:center;' +
      'mso-position-horizontal-relative:margin;mso-position-vertical:center;' +
      'mso-position-vertical-relative:margin" fillcolor="#' + color + '" stroked="f">' +
      '<v:fill opacity=".12"/>' +
      '<v:textpath style="font-family:&quot;' + font + '&quot;;font-size:1pt" ' +
      'string="' + text + '"/>' +
      '</v:shape></w:pict></w:r>'
    );
  }

  function headerXml(shortName) {
    return (
      XML_HEAD +
      '<w:hdr xmlns:w="' + NS_W + '">' +
      para(
        run(shortName, { font: T.headFont, size: 16, color: hx(T.muted) }),
        { spacing: { after: 0 }, border: { color: hx(T.rule), size: 4, space: 4 } }
      ) +
      para(watermarkXml("wm1"), { spacing: { before: 0, after: 0 } }) +
      "</w:hdr>"
    );
  }

  /** Nagłówek strony tytułowej – sam znak wodny. */
  function firstHeaderXml() {
    return (
      XML_HEAD +
      '<w:hdr xmlns:w="' + NS_W + '">' +
      para(watermarkXml("wm2"), { spacing: { before: 0, after: 0 } }) +
      "</w:hdr>"
    );
  }

  function footerXml() {
    const style = { font: T.headFont, size: 16, color: hx(T.muted) };
    return (
      XML_HEAD +
      '<w:ftr xmlns:w="' + NS_W + '">' +
      para(
        run("Strona ", style) + field("PAGE", "1", style) + run(" z ", style) + field("NUMPAGES", "1", style),
        { jc: "center", spacing: { before: 0, after: 0 } }
      ) +
      "</w:ftr>"
    );
  }

  function documentXml(doc) {
    const meta = doc.meta || {};
    const showCover = meta.cover !== false;
    const showToc = meta.toc !== false;
    const short = (meta.element || doc.element || "") + " – " + (meta.nazwa || "");

    let body = "";
    if (showCover) body += titlePage(meta, doc.element);
    if (showToc) body += tocPage();
    if (showCover || showToc) body += pageBreak();
    body += bodyBlocks(doc.blocks);

    const sect =
      "<w:sectPr>" +
      '<w:headerReference w:type="default" r:id="rId3"/>' +
      '<w:headerReference w:type="first" r:id="rId5"/>' +
      '<w:footerReference w:type="default" r:id="rId4"/>' +
      '<w:footerReference w:type="first" r:id="rId6"/>' +
      '<w:pgSz w:w="' + PAGE_W + '" w:h="' + PAGE_H + '"/>' +
      '<w:pgMar w:top="' + MARGIN.top + '" w:right="' + MARGIN.right + '" w:bottom="' +
      MARGIN.bottom + '" w:left="' + MARGIN.left + '" w:header="680" w:footer="624" w:gutter="0"/>' +
      '<w:cols w:space="708"/>' +
      "<w:titlePg/>" +
      '<w:docGrid w:linePitch="360"/>' +
      "</w:sectPr>";

    return (
      XML_HEAD +
      '<w:document xmlns:w="' + NS_W + '" xmlns:r="' + NS_R + '">' +
      "<w:body>" + body + sect + "</w:body></w:document>"
    );
  }

  function coreXml(doc) {
    const meta = doc.meta || {};
    const authors = (meta.projektanci || [])
      .map(function (row) { return row.imie; })
      .filter(Boolean)
      .join(", ");
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    return (
      XML_HEAD +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"' +
      ' xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/"' +
      ' xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      "<dc:title>" + esc(doc.title || "") + "</dc:title>" +
      "<dc:subject>" + esc(meta.nazwa || "") + "</dc:subject>" +
      "<dc:creator>" + esc(authors || meta.projektant || "") + "</dc:creator>" +
      "<cp:lastModifiedBy>" + esc(authors || meta.projektant || "") + "</cp:lastModifiedBy>" +
      "<dc:description>" + esc("Wygenerowano programem PAB cyfrowa") + "</dc:description>" +
      "<dc:language>pl-PL</dc:language>" +
      "<cp:category>" + esc(meta.doc_type || "Projekt budowlany") + "</cp:category>" +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + now + "</dcterms:created>" +
      '<dcterms:modified xsi:type="dcterms:W3CDTF">' + now + "</dcterms:modified>" +
      "</cp:coreProperties>"
    );
  }

  function appXml() {
    return (
      XML_HEAD +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"' +
      ' xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
      "<Application>PAB cyfrowa</Application><AppVersion>1.5000</AppVersion>" +
      "<Company>BIM architects &amp; consultants</Company>" +
      "</Properties>"
    );
  }

  function contentTypesXml() {
    const w = "application/vnd.openxmlformats-officedocument.wordprocessingml";
    return (
      XML_HEAD +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="' + w + '.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="' + w + '.styles+xml"/>' +
      '<Override PartName="/word/settings.xml" ContentType="' + w + '.settings+xml"/>' +
      '<Override PartName="/word/header1.xml" ContentType="' + w + '.header+xml"/>' +
      '<Override PartName="/word/header2.xml" ContentType="' + w + '.header+xml"/>' +
      '<Override PartName="/word/footer1.xml" ContentType="' + w + '.footer+xml"/>' +
      '<Override PartName="/word/footer2.xml" ContentType="' + w + '.footer+xml"/>' +
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>' +
      "</Types>"
    );
  }

  function rootRelsXml() {
    return (
      XML_HEAD +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>' +
      "</Relationships>"
    );
  }

  function documentRelsXml() {
    return (
      XML_HEAD +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' +
      '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
      '<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header2.xml"/>' +
      '<Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>' +
      "</Relationships>"
    );
  }

  function settingsXml() {
    return (
      XML_HEAD +
      '<w:settings xmlns:w="' + NS_W + '">' +
      '<w:zoom w:percent="100"/>' +
      "<w:updateFields w:val=\"true\"/>" +
      '<w:defaultTabStop w:val="708"/>' +
      '<w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat>' +
      '<w:themeFontLang w:val="pl-PL"/>' +
      "</w:settings>"
    );
  }

  function build(doc, theme) {
    useTheme(doc, theme);
    const meta = doc.meta || {};
    const short = (meta.element || doc.element || "") + " – " + (meta.nazwa || "");
    const entries = [
      { name: "[Content_Types].xml", data: contentTypesXml() },
      { name: "_rels/.rels", data: rootRelsXml() },
      { name: "docProps/core.xml", data: coreXml(doc) },
      { name: "docProps/app.xml", data: appXml() },
      { name: "word/document.xml", data: documentXml(doc) },
      { name: "word/styles.xml", data: stylesXml() },
      { name: "word/settings.xml", data: settingsXml() },
      { name: "word/header1.xml", data: headerXml(short) },
      { name: "word/header2.xml", data: firstHeaderXml() },
      { name: "word/footer1.xml", data: footerXml() },
      { name: "word/footer2.xml", data: footerXml() },
      { name: "word/_rels/document.xml.rels", data: documentRelsXml() },
    ];
    return window.PABZip.zip(entries);
  }

  window.PABDocx = { build: build, esc: esc };
})();
