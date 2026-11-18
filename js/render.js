/* ==========================================================================
   PAB cyfrowa – wersja Google Sites
   render.js – zamienia model bloków (z src/content.py) na HTML podglądu
   oraz na stronę gotową do wydruku (PDF przez okno druku przeglądarki).
   ========================================================================== */
(function () {
  "use strict";

  function esc(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nl(text) {
    return esc(text).replace(/\n/g, "<br>");
  }

  function cover(doc) {
    const meta = doc.meta || {};
    const rows = [
      ["Adres inwestycji", meta.adres || ""],
      ["Działki ewidencyjne", meta.dzialki || ""],
      ["Kategoria obiektu", meta.kategoria || ""],
      ["Inwestor", (meta.inwestor || "") + (meta.inwestor_adres ? "\n" + meta.inwestor_adres : "")],
    ];
    if (meta.nr_projektu) rows.push(["Nr projektu", meta.nr_projektu]);
    if (meta.tom) rows.push(["Tom", meta.tom]);

    let designers = (meta.projektanci || []).map(function (row) {
      return [row.funkcja || "", row.imie || "", row.specjalnosc || "", row.uprawnienia || ""];
    });
    if (!designers.length) {
      designers = [["Projektant", meta.projektant || "", meta.specjalnosc || "", meta.uprawnienia || ""]];
      if (meta.sprawdzajacy) {
        designers.push([
          "Sprawdzający",
          meta.sprawdzajacy,
          meta.specjalnosc || "",
          meta.sprawdzajacy_uprawnienia || "",
        ]);
      }
    }

    const part = meta.part === undefined || meta.part === null ? "CZĘŚĆ OPISOWA" : String(meta.part);

    return (
      '<section class="doc-cover">' +
      (part ? '<div class="doc-part">' + esc(part) + "</div>" : "") +
      '<h1 class="doc-element">' + esc(meta.element || doc.element) + "</h1>" +
      '<div class="doc-type">' + esc(meta.doc_type || "PROJEKT BUDOWLANY") + "</div>" +
      '<div class="doc-name">' + esc(meta.nazwa || "") + "</div>" +
      '<table class="doc-meta"><tbody>' +
      rows
        .map(function (row) {
          return "<tr><th>" + esc(row[0]) + "</th><td>" + nl(row[1]) + "</td></tr>";
        })
        .join("") +
      "</tbody></table>" +
      '<table class="doc-sign"><thead><tr><th>Funkcja</th><th>Imię i nazwisko / specjalność</th>' +
      "<th>Nr uprawnień</th><th>Podpis</th></tr></thead><tbody>" +
      designers
        .map(function (row) {
          return (
            "<tr><td class=\"b\">" + esc(row[0]) + "</td><td>" + esc(row[1]) +
            (row[2] ? '<span class="spec">' + esc(row[2]) + "</span>" : "") +
            '</td><td class="c">' + esc(row[3]) + '</td><td class="sign-cell"></td></tr>'
          );
        })
        .join("") +
      "</tbody></table>" +
      '<div class="doc-foot">' +
      '<div>' + esc(meta.adres || "") + "</div>" +
      "<div class=\"b\">" + esc(meta.data || "") + "</div>" +
      "<div class=\"small i\">Zakres opracowania: " + esc(meta.zakres || "") + "</div>" +
      "</div>" +
      "</section>"
    );
  }

  function slug(index) {
    return "h-" + index;
  }

  function blocks(list, opts) {
    opts = opts || {};
    const headings = [];
    let counter = 0;
    const body = (list || [])
      .map(function (block) {
        const kind = block.t;
        if (kind === "h1" || kind === "h2") {
          const id = slug(counter++);
          headings.push({ id: id, level: kind === "h1" ? 1 : 2, text: block.x || "" });
          return (
            '<h' + (kind === "h1" ? 2 : 3) + ' id="' + id + '" class="doc-' + kind + '">' +
            esc(block.x || "") + "</h" + (kind === "h1" ? 2 : 3) + ">"
          );
        }
        if (kind === "p") return "<p>" + nl(block.x || "") + "</p>";
        if (kind === "ul" || kind === "ol") {
          const tag = kind;
          return (
            "<" + tag + ">" +
            (block.items || [])
              .map(function (item) {
                return "<li>" + nl(item) + "</li>";
              })
              .join("") +
            "</" + tag + ">"
          );
        }
        if (kind === "table") {
          const head = block.head || [];
          const rows = block.rows || [];
          const ncols = Math.max(
            head.length,
            rows.reduce(function (max, r) {
              return Math.max(max, r.length);
            }, 0),
            1
          );
          let cols = "";
          if (block.widths && block.widths.length === ncols) {
            const total = block.widths.reduce(function (a, b) {
              return a + b;
            }, 0) || 1;
            cols =
              "<colgroup>" +
              block.widths
                .map(function (w) {
                  return '<col style="width:' + ((100 * w) / total).toFixed(2) + '%">';
                })
                .join("") +
              "</colgroup>";
          }
          return (
            (block.caption ? '<div class="doc-caption">' + esc(block.caption) + "</div>" : "") +
            '<div class="doc-table-wrap"><table class="doc-table">' + cols +
            (head.length
              ? "<thead><tr>" +
                head
                  .map(function (cell) {
                    return "<th>" + nl(cell) + "</th>";
                  })
                  .join("") +
                "</tr></thead>"
              : "") +
            "<tbody>" +
            rows
              .map(function (row) {
                let cells = "";
                for (let i = 0; i < ncols; i++) {
                  cells += "<td>" + nl(row[i] === undefined ? "" : row[i]) + "</td>";
                }
                return "<tr>" + cells + "</tr>";
              })
              .join("") +
            "</tbody></table></div>"
          );
        }
        if (kind === "note") {
          return '<div class="doc-note">' + nl(block.x || "") + "</div>";
        }
        if (kind === "sign") {
          return (
            '<div class="doc-signblock">' +
            (block.lines || [])
              .map(function (line) {
                return "<div>" + esc(line) + "</div>";
              })
              .join("") +
            "</div>"
          );
        }
        if (kind === "pagebreak") {
          return '<div class="doc-pagebreak"></div>';
        }
        return "";
      })
      .join("");

    return { html: body, headings: headings };
  }

  function toc(headings) {
    if (!headings.length) return "";
    return (
      '<nav class="doc-toc"><h2 class="doc-toc-title">SPIS TREŚCI</h2><ol>' +
      headings
        .map(function (item) {
          return (
            '<li class="lvl' + item.level + '"><a href="#' + item.id + '">' + esc(item.text) + "</a></li>"
          );
        })
        .join("") +
      "</ol></nav>"
    );
  }

  function document(doc) {
    const meta = doc.meta || {};
    const showCover = meta.cover !== false;
    const showToc = meta.toc !== false;
    const rendered = blocks(doc.blocks);
    let html = "";
    if (showCover) html += cover(doc);
    if (showToc) html += toc(rendered.headings);
    html += '<div class="doc-body">' + rendered.html + "</div>";
    return html;
  }

  /** Pełny, samodzielny dokument HTML do wydruku / zapisu jako PDF. */
  function printable(doc, meta) {
    meta = meta || {};
    const title = (meta.nazwa || doc.title || "Dokument") + " – " + (doc.kind || "");
    return (
      "<!doctype html><html lang=\"pl\"><head><meta charset=\"utf-8\">" +
      "<title>" + esc(title) + "</title>" +
      "<style>" +
      "@page{size:A4;margin:25mm 20mm 22mm 25mm}" +
      "html,body{margin:0;padding:0}" +
      "body{font-family:'Times New Roman',Times,serif;font-size:11pt;line-height:1.35;color:#111}" +
      ".doc-cover{page-break-after:always}" +
      ".doc-toc{page-break-after:always}" +
      ".doc-part{text-align:center;font-family:Arial,sans-serif;font-size:10pt;font-weight:bold;color:#7f7f7f;margin-top:8mm}" +
      ".doc-element{text-align:center;font-family:Arial,sans-serif;font-size:17pt;color:#1f3864;margin:4mm 0 2mm}" +
      ".doc-type{text-align:center;font-family:Arial,sans-serif;font-size:11pt;color:#404040;border-bottom:1pt solid #1f3864;padding-bottom:4mm;margin:0 0 6mm}" +
      ".doc-name{text-align:center;font-family:Arial,sans-serif;font-size:14pt;font-weight:bold;margin:0 0 8mm}" +
      "table.doc-meta{width:100%;border-collapse:collapse;margin-bottom:8mm;font-size:9.5pt}" +
      "table.doc-meta th,table.doc-meta td{border:0.5pt solid #bfbfbf;padding:1.4mm 2mm;text-align:left;vertical-align:top}" +
      "table.doc-meta th{background:#f2f5fa;width:25%;font-weight:bold}" +
      "table.doc-sign{width:100%;border-collapse:collapse;font-size:8.5pt}" +
      "table.doc-sign th,table.doc-sign td{border:0.5pt solid #7f7f7f;padding:1.4mm 2mm;vertical-align:top;text-align:left}" +
      "table.doc-sign th{background:#e7ecf5;text-align:center}" +
      "table.doc-sign .b{font-weight:bold}.doc-sign .spec{display:block;font-size:8pt;color:#333}" +
      "table.doc-sign .c{text-align:center}.sign-cell{height:11mm}" +
      ".doc-foot{margin-top:12mm;text-align:right;font-size:9pt}" +
      ".doc-foot .b{font-weight:bold;font-size:9.5pt}.doc-foot .small{font-size:8pt;color:#595959}" +
      ".doc-foot .i{font-style:italic}" +
      ".doc-toc-title{font-family:Arial,sans-serif;font-size:14pt;margin:0 0 5mm}" +
      ".doc-toc ol{list-style:none;padding:0;margin:0;font-size:10.5pt}" +
      ".doc-toc li{margin:0 0 1.4mm}.doc-toc li.lvl2{margin-left:6mm;font-size:10pt;color:#333}" +
      ".doc-toc a{color:#111;text-decoration:none}" +
      ".doc-h1{font-family:Arial,sans-serif;font-size:14pt;color:#1f3864;margin:7mm 0 3mm;padding-bottom:1mm;border-bottom:0.5pt solid #d9d9d9;page-break-after:avoid}" +
      ".doc-h2{font-family:Arial,sans-serif;font-size:11.5pt;color:#2f5496;margin:5mm 0 2mm;page-break-after:avoid}" +
      "p{margin:0 0 2.6mm;text-align:justify}" +
      "ul,ol{margin:0 0 3mm;padding-left:6mm}li{margin-bottom:1mm;text-align:justify}" +
      ".doc-table-wrap{margin:2mm 0 4mm;overflow:visible}" +
      ".doc-table{width:100%;border-collapse:collapse;font-size:8.5pt}" +
      ".doc-table th,.doc-table td{border:0.5pt solid #8c8c8c;padding:1.3mm 1.6mm;vertical-align:top}" +
      ".doc-table th{background:#e7ecf5;font-weight:bold;text-align:center}" +
      ".doc-caption{font-family:Arial,sans-serif;font-size:9pt;font-weight:bold;color:#404040;margin:3mm 0 1mm}" +
      ".doc-note{border:0.5pt solid #c9c9c9;background:#f7f7f7;padding:2.4mm 3mm;font-size:9pt;font-style:italic;color:#333;margin:3mm 0 4mm;text-align:justify}" +
      ".doc-signblock{margin:6mm 0 4mm;text-align:right;font-family:Arial,sans-serif;font-size:10pt;line-height:1.6}" +
      ".doc-pagebreak{page-break-after:always}" +
      "thead{display:table-header-group}" +
      "tr{page-break-inside:avoid}" +
      "</style></head><body>" + document(doc) + "</body></html>"
    );
  }

  window.PABRender = { document: document, printable: printable, blocks: blocks, esc: esc };
})();
