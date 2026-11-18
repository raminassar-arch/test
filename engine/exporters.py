# -*- coding: utf-8 -*-
"""
Eksport dokumentów (DOCX / PDF / TXT) z modelu bloków generowanego przez
:mod:`content`.

Model bloków:
    {"t": "h1", "x": "..."}                 – nagłówek rozdziału
    {"t": "h2", "x": "..."}                 – nagłówek podrozdziału
    {"t": "p",  "x": "..."}                 – akapit
    {"t": "ul", "items": [...]}             – lista punktowana
    {"t": "ol", "items": [...]}             – lista numerowana
    {"t": "table", "head": [...], "rows": [[...]],
     "widths": [0.3, 0.7], "caption": "..."} – tabela
    {"t": "note", "x": "..."}               – ramka z uwagą / zastrzeżeniem
    {"t": "pagebreak"}                      – podział strony
"""

from __future__ import annotations

import os
import re
from typing import Any

try:  # reportlab jest potrzebny tylko do PDF – DOCX/TXT działają bez niego
    from reportlab.platypus import Flowable as _FlowableBase
except Exception:  # pragma: no cover
    class _FlowableBase:  # type: ignore[no-redef]
        def __init__(self):
            pass

# ---------------------------------------------------------------------------
# Wspólne
# ---------------------------------------------------------------------------

DOCX_BODY_FONT = "Times New Roman"
DOCX_HEAD_FONT = "Arial"
PDF_SANS = "ArialPL"
PDF_SANS_BOLD = "ArialPL-Bold"
PROGRAM_NAME = "PAB cyfrowa"

FONT_CANDIDATES = {
    "regular": [
        ("C:/Windows/Fonts/arial.ttf", 0),
        ("C:/Windows/Fonts/calibri.ttf", 0),
        ("C:/Windows/Fonts/segoeui.ttf", 0),
    ],
    "bold": [
        ("C:/Windows/Fonts/arialbd.ttf", 0),
        ("C:/Windows/Fonts/calibrib.ttf", 0),
        ("C:/Windows/Fonts/segoeuib.ttf", 0),
    ],
}


def safe_filename(name: str) -> str:
    """Usuwa znaki niedozwolone w nazwach plików Windows."""
    name = re.sub(r'[\\/:*?"<>|]+', "_", name or "").strip(" .")
    return name or "dokument"


def suggest_filename(doc, data: dict) -> str:
    """Nazwa pliku zgodna z § 2b rozporządzenia, np. ``PZT_2026.11.12``."""
    try:
        from . import content as C
    except ImportError:  # uruchomienie z katalogu src
        import content as C

    return safe_filename(f"{doc.kind}_{C.export_date(data)}")


# ---------------------------------------------------------------------------
# DOCX
# ---------------------------------------------------------------------------

def _docx_set_style_font(style, name: str, size: float | None = None,
                         bold: bool | None = None, color: str | None = None) -> None:
    from docx.oxml.ns import qn
    from docx.shared import Pt, RGBColor

    font = style.font
    font.name = name
    if size is not None:
        font.size = Pt(size)
    if bold is not None:
        font.bold = bold
    if color:
        font.color.rgb = RGBColor.from_string(color)
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = rpr.makeelement(qn("w:rFonts"), {})
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(attr), name)
    lang = rpr.find(qn("w:lang"))
    if lang is None:
        lang = rpr.makeelement(qn("w:lang"), {})
        rpr.append(lang)
    lang.set(qn("w:val"), "pl-PL")


def _docx_field(paragraph, instr: str, placeholder: str = "") -> None:
    """Wstawia pole Worda (np. PAGE, NUMPAGES, TOC)."""
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    fld_begin.set(qn("w:dirty"), "true")
    run._r.append(fld_begin)

    run = paragraph.add_run()
    instr_el = OxmlElement("w:instrText")
    instr_el.set(qn("xml:space"), "preserve")
    instr_el.text = f" {instr} "
    run._r.append(instr_el)

    run = paragraph.add_run()
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    run._r.append(fld_sep)

    if placeholder:
        paragraph.add_run(placeholder)

    run = paragraph.add_run()
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_end)


def _docx_shade(cell, fill: str) -> None:
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def _docx_cell_margins(table, top: int = 40, left: int = 80,
                       bottom: int = 40, right: int = 80) -> None:
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    tbl_pr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for tag, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement(f"w:{tag}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tbl_pr.append(mar)


def _docx_borders(table, color: str = "7F7F7F", size: int = 6) -> None:
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    tbl_pr = table._tbl.tblPr
    for old in tbl_pr.findall(qn("w:tblBorders")):
        tbl_pr.remove(old)
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(size))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        borders.append(el)
    tbl_pr.append(borders)


def _docx_repeat_header(row) -> None:
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    tr_pr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    tr_pr.append(header)
    cant = OxmlElement("w:cantSplit")
    tr_pr.append(cant)


def _docx_cell_text(cell, text: str, bold: bool = False, size: float = 9.0,
                    align: str | None = None, italic: bool = False,
                    color: str | None = None) -> None:
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt, RGBColor

    cell.text = ""
    lines = str(text).split("\n")
    for i, line in enumerate(lines):
        par = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
        fmt = par.paragraph_format
        fmt.space_before = Pt(0)
        fmt.space_after = Pt(1)
        fmt.line_spacing = 1.0
        if align == "center":
            par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif align == "right":
            par.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        elif align == "justify":
            par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        else:
            par.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = par.add_run(line)
        run.bold = bold
        run.italic = italic
        run.font.size = Pt(size)
        if color:
            run.font.color.rgb = RGBColor.from_string(color)


def _docx_paragraph_border_bottom(paragraph, color: str = "1F3864",
                                  size: int = 8) -> None:
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), color)
    p_bdr.append(bottom)
    p_pr.append(p_bdr)


def _docx_spacer(doc, pts: float) -> None:
    from docx.shared import Pt

    par = doc.add_paragraph()
    par.paragraph_format.space_after = Pt(0)
    par.paragraph_format.space_before = Pt(0)
    par.paragraph_format.line_spacing = Pt(pts)


def _docx_setup(doc) -> None:
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
    from docx.shared import Cm, Pt, RGBColor

    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.2)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.0)
    section.header_distance = Cm(1.2)
    section.footer_distance = Cm(1.1)
    section.different_first_page_header_footer = True

    normal = doc.styles["Normal"]
    _docx_set_style_font(normal, DOCX_BODY_FONT, 11)
    pf = normal.paragraph_format
    pf.space_before = Pt(0)
    pf.space_after = Pt(6)
    pf.line_spacing = 1.15
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    h1 = doc.styles["Heading 1"]
    _docx_set_style_font(h1, DOCX_HEAD_FONT, 14, bold=True, color="1F3864")
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)
    h1.paragraph_format.keep_with_next = True
    h1.paragraph_format.line_spacing = 1.0
    h1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    h2 = doc.styles["Heading 2"]
    _docx_set_style_font(h2, DOCX_HEAD_FONT, 11.5, bold=True, color="2F5496")
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(4)
    h2.paragraph_format.keep_with_next = True
    h2.paragraph_format.line_spacing = 1.0
    h2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # Pola Worda (spis treści, numery stron) odświeżane przy otwarciu.
    settings = doc.settings.element
    update = settings.find(
        "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}updateFields")
    if update is None:
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn
        update = OxmlElement("w:updateFields")
        update.set(qn("w:val"), "true")
        settings.append(update)


def _docx_header_footer(doc, doc_title: str, short_name: str) -> None:
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.shared import Pt, RGBColor

    section = doc.sections[0]

    header = section.header
    par = header.paragraphs[0]
    par.text = ""
    par.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = par.add_run(short_name)
    run.font.size = Pt(8)
    run.font.name = DOCX_HEAD_FONT
    run.font.color.rgb = RGBColor(0x59, 0x59, 0x59)
    par.paragraph_format.space_after = Pt(0)
    _docx_paragraph_border_bottom(par, "BFBFBF", 4)

    footer = section.footer
    par = footer.paragraphs[0]
    par.text = ""
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.space_before = Pt(0)
    run = par.add_run("Strona ")
    run.font.size = Pt(8)
    run.font.name = DOCX_HEAD_FONT
    run.font.color.rgb = RGBColor(0x59, 0x59, 0x59)
    _docx_field(par, "PAGE", "1")
    run = par.add_run(" z ")
    run.font.size = Pt(8)
    run.font.name = DOCX_HEAD_FONT
    run.font.color.rgb = RGBColor(0x59, 0x59, 0x59)
    _docx_field(par, "NUMPAGES", "1")
    for r in par.runs:
        r.font.size = Pt(8)
        r.font.name = DOCX_HEAD_FONT
        r.font.color.rgb = RGBColor(0x59, 0x59, 0x59)


def _docx_title_page(doc, doc_obj) -> None:
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Cm, Pt, RGBColor

    meta = doc_obj.meta

    _docx_spacer(doc, 12)
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.space_after = Pt(2)
    run = par.add_run(meta.get("part", "CZĘŚĆ OPISOWA"))
    run.font.name = DOCX_HEAD_FONT
    run.font.size = Pt(10)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0x7F, 0x7F, 0x7F)

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.space_after = Pt(4)
    run = par.add_run(meta.get("element", doc_obj.element))
    run.font.name = DOCX_HEAD_FONT
    run.font.size = Pt(17)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0x1F, 0x38, 0x64)

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.space_after = Pt(26)
    run = par.add_run(meta.get("doc_type") or "PROJEKT BUDOWLANY")
    run.font.name = DOCX_HEAD_FONT
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(0x40, 0x40, 0x40)
    _docx_paragraph_border_bottom(par, "1F3864", 8)

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.CENTER
    par.paragraph_format.space_before = Pt(10)
    par.paragraph_format.space_after = Pt(18)
    run = par.add_run(meta.get("nazwa", ""))
    run.font.name = DOCX_HEAD_FONT
    run.font.size = Pt(14)
    run.font.bold = True

    rows = [
        ("Adres inwestycji", meta.get("adres", "")),
        ("Działki ewidencyjne", meta.get("dzialki", "")),
        ("Kategoria obiektu", meta.get("kategoria", "")),
        ("Inwestor", meta.get("inwestor", "")
         + (("\n" + meta["inwestor_adres"]) if meta.get("inwestor_adres") else "")),
    ]
    if meta.get("nr_projektu"):
        rows.append(("Nr projektu", meta["nr_projektu"]))
    if meta.get("tom"):
        rows.append(("Tom", meta["tom"]))

    table = doc.add_table(rows=0, cols=2)
    table.autofit = False
    _docx_borders(table, "BFBFBF", 4)
    _docx_cell_margins(table, 70, 110, 70, 110)
    for label, value in rows:
        cells = table.add_row().cells
        cells[0].width = Cm(4.2)
        cells[1].width = Cm(12.3)
        _docx_shade(cells[0], "F2F5FA")
        _docx_cell_text(cells[0], label, bold=True, size=9.5)
        _docx_cell_text(cells[1], value, size=9.5)

    _docx_spacer(doc, 20)

    sign_rows = [(r.get("funkcja", ""), r.get("imie", ""), r.get("specjalnosc", ""),
                  r.get("uprawnienia", "")) for r in (meta.get("projektanci") or [])]
    if not sign_rows:
        sign_rows = [("Projektant", meta.get("projektant", ""),
                      meta.get("specjalnosc", ""), meta.get("uprawnienia", ""))]
        if meta.get("sprawdzajacy"):
            sign_rows.append(("Sprawdzający", meta["sprawdzajacy"],
                              meta.get("specjalnosc", ""),
                              meta.get("sprawdzajacy_uprawnienia", "")))

    table = doc.add_table(rows=1, cols=4)
    table.autofit = False
    _docx_borders(table, "7F7F7F", 4)
    _docx_cell_margins(table, 60, 90, 60, 90)
    head = table.rows[0]
    _docx_repeat_header(head)
    widths = [Cm(3.4), Cm(6.0), Cm(4.2), Cm(2.9)]
    for cell, label, width in zip(head.cells, ("Funkcja", "Imię i nazwisko / specjalność",
                                               "Nr uprawnień", "Podpis"), widths):
        cell.width = width
        _docx_shade(cell, "E7ECF5")
        _docx_cell_text(cell, label, bold=True, size=8.5, align="center")

    for role, person, spec, lic in sign_rows:
        cells = table.add_row().cells
        for cell, width in zip(cells, widths):
            cell.width = width
        _docx_cell_text(cells[0], role, bold=True, size=8.5)
        _docx_cell_text(cells[1], person + (f"\n{spec}" if spec else ""), size=8.5)
        _docx_cell_text(cells[2], lic, size=8.5, align="center")
        _docx_cell_text(cells[3], "", size=8.5)

    _docx_spacer(doc, 26)

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    par.paragraph_format.space_after = Pt(2)
    run = par.add_run(meta.get("adres", ""))
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x40, 0x40, 0x40)

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = par.add_run(meta.get("data", ""))
    run.font.size = Pt(9.5)
    run.font.bold = True

    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    par.paragraph_format.space_before = Pt(2)
    run = par.add_run(f"Zakres opracowania: {meta.get('zakres', '')}")
    run.font.size = Pt(8)
    run.font.italic = True
    run.font.color.rgb = RGBColor(0x59, 0x59, 0x59)


def _docx_toc(doc) -> None:
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt

    doc.add_page_break()
    par = doc.add_paragraph()
    par.alignment = WD_ALIGN_PARAGRAPH.LEFT
    par.paragraph_format.space_after = Pt(12)
    run = par.add_run("SPIS TREŚCI")
    run.font.name = DOCX_HEAD_FONT
    run.font.size = Pt(14)
    run.font.bold = True

    par = doc.add_paragraph()
    par.paragraph_format.space_after = Pt(0)
    _docx_field(
        par,
        'TOC \\o "1-2" \\h \\z \\u',
        "Spis treści zostanie zaktualizowany po otwarciu dokumentu w programie Word "
        "(Ctrl+A, F9).",
    )


def _docx_table(doc, block: dict) -> None:
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Cm, Pt, RGBColor

    head = list(block.get("head") or [])
    rows = list(block.get("rows") or [])
    widths = block.get("widths")
    caption = block.get("caption") or ""

    if caption:
        par = doc.add_paragraph()
        par.paragraph_format.space_before = Pt(8)
        par.paragraph_format.space_after = Pt(3)
        par.paragraph_format.keep_with_next = True
        par.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = par.add_run(caption)
        run.font.size = Pt(9)
        run.font.bold = True
        run.font.name = DOCX_HEAD_FONT
        run.font.color.rgb = RGBColor(0x40, 0x40, 0x40)

    ncols = max([len(head)] + [len(r) for r in rows] + [1])
    table = doc.add_table(rows=0, cols=ncols)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    _docx_borders(table, "8C8C8C", 4)
    _docx_cell_margins(table, 40, 80, 40, 80)

    usable_cm = 16.5
    if widths and len(widths) == ncols:
        total = sum(widths) or 1.0
        col_cm = [usable_cm * w / total for w in widths]
    else:
        col_cm = [usable_cm / ncols] * ncols

    if head:
        row = table.add_row()
        _docx_repeat_header(row)
        for cell, label, width in zip(row.cells, head, col_cm):
            cell.width = Cm(width)
            _docx_shade(cell, "E7ECF5")
            _docx_cell_text(cell, label, bold=True, size=8.5, align="center")

    for values in rows:
        row = table.add_row()
        for cell, value, width in zip(row.cells, list(values) + [""] * ncols, col_cm):
            cell.width = Cm(width)
            _docx_cell_text(cell, value, size=8.5)

    par = doc.add_paragraph()
    par.paragraph_format.space_after = Pt(4)
    par.paragraph_format.line_spacing = Pt(4)


def _docx_note(doc, text: str) -> None:
    from docx.shared import Cm, Pt, RGBColor

    table = doc.add_table(rows=1, cols=1)
    table.autofit = False
    _docx_borders(table, "C9C9C9", 4)
    _docx_cell_margins(table, 80, 140, 80, 140)
    cell = table.rows[0].cells[0]
    cell.width = Cm(16.5)
    _docx_shade(cell, "F7F7F7")
    _docx_cell_text(cell, text, size=9, italic=True, align="justify",
                    color="333333")
    par = doc.add_paragraph()
    par.paragraph_format.space_after = Pt(4)
    par.paragraph_format.line_spacing = Pt(4)


def _docx_sign(doc, block: dict) -> None:
    """Blok podpisu – wyrównany do prawej, bez obramowania."""
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt

    lines = block.get("lines") or []
    if not lines:
        return
    par = doc.add_paragraph()
    par.paragraph_format.space_before = Pt(14)
    par.paragraph_format.space_after = Pt(2)
    par.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    for idx, line in enumerate(lines):
        if idx:
            par.add_run().add_break()
        run = par.add_run(line)
        run.font.size = Pt(10)
        run.font.name = DOCX_HEAD_FONT


def export_docx(doc_obj, path: str, data: dict | None = None) -> str:
    """Zapisuje dokument jako plik .docx. Zwraca ścieżkę."""
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
    from docx.shared import Cm, Pt

    doc = Document()
    _docx_setup(doc)

    core = doc.core_properties
    core.title = doc_obj.title
    core.subject = doc_obj.meta.get("nazwa", "")
    core.author = ", ".join(
        r.get("imie", "") for r in (doc_obj.meta.get("projektanci") or [])
        if r.get("imie")) or doc_obj.meta.get("projektant", "")
    core.comments = f"Wygenerowano programem {PROGRAM_NAME}"
    core.language = "pl-PL"
    core.category = doc_obj.meta.get("doc_type") or "Projekt budowlany"

    short = f"{doc_obj.element} – {doc_obj.meta.get('nazwa', '')}"
    _docx_header_footer(doc, doc_obj.title, short)

    show_cover = bool(doc_obj.meta.get("cover", True))
    show_toc = bool(doc_obj.meta.get("toc", True))
    if show_cover:
        _docx_title_page(doc, doc_obj)
    if show_toc:
        _docx_toc(doc)
    if show_cover or show_toc:
        doc.add_page_break()

    for block in doc_obj.blocks:
        kind = block.get("t")
        if kind == "h1":
            par = doc.add_paragraph(block.get("x", ""), style="Heading 1")
            _docx_paragraph_border_bottom(par, "D9D9D9", 4)
        elif kind == "h2":
            doc.add_paragraph(block.get("x", ""), style="Heading 2")
        elif kind == "p":
            par = doc.add_paragraph(block.get("x", ""))
            par.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        elif kind == "ul":
            for item in block.get("items") or []:
                par = doc.add_paragraph()
                fmt = par.paragraph_format
                fmt.left_indent = Cm(0.9)
                fmt.first_line_indent = Cm(-0.45)
                fmt.space_after = Pt(2)
                fmt.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                par.add_run("•\t")
                par.add_run(item)
        elif kind == "ol":
            for idx, item in enumerate(block.get("items") or [], start=1):
                par = doc.add_paragraph()
                fmt = par.paragraph_format
                fmt.left_indent = Cm(0.9)
                fmt.first_line_indent = Cm(-0.45)
                fmt.space_after = Pt(2)
                fmt.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                par.add_run(f"{idx}.\t")
                par.add_run(item)
        elif kind == "table":
            _docx_table(doc, block)
        elif kind == "note":
            _docx_note(doc, block.get("x", ""))
        elif kind == "sign":
            _docx_sign(doc, block)
        elif kind == "pagebreak":
            doc.add_page_break()

    path = os.path.abspath(path)
    if not path.lower().endswith(".docx"):
        path += ".docx"
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    doc.save(path)
    return path


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------

_FONTS_READY = False
_FONTS_OK = True


def _register_pdf_fonts() -> bool:
    """Rejestruje TTF z polskimi znakami. Zwraca False, gdy brak fontów."""
    global _FONTS_READY, _FONTS_OK
    if _FONTS_READY:
        return _FONTS_OK
    _FONTS_READY = True
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        chosen: dict[str, str] = {}
        for role, candidates in FONT_CANDIDATES.items():
            for file_path, index in candidates:
                if os.path.exists(file_path):
                    chosen[role] = file_path
                    break
        if "regular" not in chosen:
            _FONTS_OK = False
            return False
        pdfmetrics.registerFont(TTFont(PDF_SANS, chosen["regular"]))
        if "bold" in chosen:
            pdfmetrics.registerFont(TTFont(PDF_SANS_BOLD, chosen["bold"]))
        else:
            pdfmetrics.registerFont(TTFont(PDF_SANS_BOLD, chosen["regular"]))
        from reportlab.pdfbase.pdfmetrics import registerFontFamily
        registerFontFamily(
            PDF_SANS,
            normal=PDF_SANS,
            bold=PDF_SANS_BOLD,
            italic=PDF_SANS,
            boldItalic=PDF_SANS_BOLD,
        )
        return True
    except Exception:
        _FONTS_OK = False
        return False


def _make_doc_template(base_cls):
    class NumberedTemplate(base_cls):
        """Szablon z powiadamianiem spisu treści o nagłówkach."""

        def afterFlowable(self, flowable):
            try:
                from reportlab.platypus import Paragraph
            except Exception:  # pragma: no cover
                return
            if not isinstance(flowable, Paragraph):
                return
            name = getattr(flowable.style, "name", "")
            if name == "H1":
                self.notify("TOCEntry", (0, flowable.getPlainText(), self.page))
            elif name == "H2":
                self.notify("TOCEntry", (1, flowable.getPlainText(), self.page))

    return NumberedTemplate


class _TocFlowable(_FlowableBase):
    """Spis treści rysowany bezpośrednio na kanwie (kropki + numery stron).

    Zachowuje protokół ``IndexingFlowable`` z reportlab, dzięki czemu
    ``multiBuild`` sam ustala numery stron w kolejnych przebiegach.
    """

    def __init__(self, level_styles, page_width: float = 26.0):
        super().__init__()
        self._level_styles = level_styles
        self._entries: list[tuple] = []
        self._last: list[tuple] = []
        self._page_width = page_width
        self._layout: list[dict] = []
        self.width = 0.0
        self.height = 0.0

    # -- protokół reportlab --------------------------------------------
    def isIndexing(self):
        return 1

    def beforeBuild(self):
        self._last = self._entries[:]
        self._entries = []

    def afterBuild(self):
        pass

    def isSatisfied(self):
        return self._entries == self._last

    def notify(self, kind, stuff):
        if kind == "TOCEntry":
            self._entries.append(tuple(stuff))

    def wrap(self, availWidth, availHeight):
        from reportlab.lib.utils import simpleSplit
        from reportlab.pdfbase.pdfmetrics import stringWidth

        entries = self._last or [(0, "Spis treści", 0)]
        self.width = availWidth
        self._layout = []
        total = 0.0
        for entry in entries:
            level, text, page = entry[0], entry[1], entry[2]
            style = self._level_styles[0] if level == 0 else self._level_styles[1]
            indent = 0 if level == 0 else 14
            page_str = str(page)
            page_w = stringWidth(page_str, style.fontName, style.fontSize)
            avail = availWidth - indent - page_w - 24
            lines = simpleSplit(str(text), style.fontName, style.fontSize, avail) or [""]
            leading = style.leading
            height = len(lines) * leading + (style.spaceBefore or 0)
            self._layout.append({
                "lines": lines,
                "page": page_str,
                "style": style,
                "indent": indent,
                "page_w": page_w,
                "leading": leading,
                "space_before": style.spaceBefore or 0,
                "height": height,
            })
            total += height
        self.height = total
        return availWidth, total

    def drawOn(self, canv, x, y, _sW=0):
        from reportlab.pdfbase.pdfmetrics import stringWidth

        canv.saveState()
        canv.translate(x, y)
        cursor = self.height
        for item in self._layout:
            style = item["style"]
            cursor -= item["space_before"]
            for idx, line in enumerate(item["lines"]):
                cursor -= item["leading"]
                baseline = cursor + 2.5
                canv.setFont(style.fontName, style.fontSize)
                canv.setFillColor(style.textColor)
                canv.drawString(item["indent"], baseline, line)
                if idx == len(item["lines"]) - 1:
                    page_x = self.width - item["page_w"]
                    canv.drawRightString(self.width, baseline, item["page"])
                    line_w = stringWidth(line, style.fontName, style.fontSize)
                    dot = " . "
                    dot_w = stringWidth(dot, style.fontName, style.fontSize)
                    start = item["indent"] + line_w + 5
                    end = page_x - 5
                    n = int((end - start) / dot_w) if dot_w else 0
                    if n > 0:
                        canv.setFillColor(style.textColor)
                        canv.drawString(start, baseline, dot * n)
        canv.restoreState()


class _PdfBuilder:
    """Buduje dokument PDF na bazie modelu bloków."""

    def __init__(self, doc_obj, footer_text: str):
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate

        self.doc_obj = doc_obj
        self.footer_text = footer_text
        self.font = PDF_SANS if _register_pdf_fonts() else "Helvetica"
        self.font_bold = PDF_SANS_BOLD if _register_pdf_fonts() else "Helvetica-Bold"
        self.page_w, self.page_h = A4
        self.left = 22 * mm
        self.right = 18 * mm
        self.top = 24 * mm
        self.bottom = 20 * mm

        template_cls = _make_doc_template(BaseDocTemplate)
        self.doc = template_cls(
            "placeholder.pdf",
            pagesize=A4,
            leftMargin=self.left,
            rightMargin=self.right,
            topMargin=self.top,
            bottomMargin=self.bottom,
            title=doc_obj.title,
            author=", ".join(
                r.get("imie", "") for r in (doc_obj.meta.get("projektanci") or [])
                if r.get("imie")) or doc_obj.meta.get("projektant", ""),
            subject=doc_obj.meta.get("nazwa", ""),
            creator=PROGRAM_NAME,
        )
        frame = Frame(
            self.left,
            self.bottom,
            self.page_w - self.left - self.right,
            self.page_h - self.top - self.bottom,
            id="body",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        cover_tpl = PageTemplate(id="cover", frames=[frame], onPage=self._on_cover)
        body_tpl = PageTemplate(id="body", frames=[frame], onPage=self._on_body)
        if doc_obj.meta.get("cover", True):
            self.doc.addPageTemplates([cover_tpl, body_tpl])
        else:
            self.doc.addPageTemplates([body_tpl, cover_tpl])

    # -- strony ---------------------------------------------------------
    def _on_cover(self, canvas, doc):
        pass

    def _on_body(self, canvas, doc):
        from reportlab.lib import colors
        from reportlab.lib.units import mm

        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#BFBFBF"))
        canvas.setLineWidth(0.5)
        y = self.page_h - 16 * mm
        canvas.line(self.left, y, self.page_w - self.right, y)
        canvas.setFont(self.font, 7.5)
        canvas.setFillColor(colors.HexColor("#595959"))
        canvas.drawString(self.left, y + 2 * mm, self.footer_text[:110])
        canvas.restoreState()

    # -- story ----------------------------------------------------------
    def _styles(self):
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
        from reportlab.lib.styles import ParagraphStyle

        base = dict(fontName=self.font, fontSize=10, leading=14.5,
                    textColor=colors.black)
        return {
            "body": ParagraphStyle("Body", alignment=TA_JUSTIFY,
                                   spaceAfter=5, **base),
            "h1": ParagraphStyle("H1", fontName=self.font_bold, fontSize=13,
                                 leading=17, spaceBefore=14, spaceAfter=6,
                                 textColor=colors.HexColor("#1F3864"),
                                 keepWithNext=1, alignment=TA_LEFT),
            "h2": ParagraphStyle("H2", fontName=self.font_bold, fontSize=10.8,
                                 leading=14, spaceBefore=9, spaceAfter=3,
                                 textColor=colors.HexColor("#2F5496"),
                                 keepWithNext=1, alignment=TA_LEFT),
            "caption": ParagraphStyle("Caption", fontName=self.font_bold,
                                      fontSize=8.8, leading=11,
                                      spaceBefore=7, spaceAfter=3,
                                      textColor=colors.HexColor("#404040"),
                                      alignment=TA_LEFT),
            "cell": ParagraphStyle("Cell", fontName=self.font, fontSize=8,
                                   leading=10, alignment=TA_LEFT),
            "cell_c": ParagraphStyle("CellC", fontName=self.font, fontSize=8,
                                     leading=10, alignment=TA_CENTER),
            "head": ParagraphStyle("Head", fontName=self.font_bold, fontSize=8,
                                   leading=10, alignment=TA_CENTER,
                                   textColor=colors.HexColor("#1F3864")),
            "note": ParagraphStyle("Note", fontName=self.font, fontSize=8.7,
                                   leading=11.5,
                                   textColor=colors.HexColor("#333333"),
                                   alignment=TA_JUSTIFY),
            "toc0": ParagraphStyle("TOC0", fontName=self.font_bold, fontSize=9.5,
                                   leading=13, spaceBefore=4),
            "toc1": ParagraphStyle("TOC1", fontName=self.font, fontSize=9,
                                   leading=12, leftIndent=12),
            "toc_title": ParagraphStyle("TOCTitle", fontName=self.font_bold,
                                        fontSize=14, leading=18, spaceAfter=14,
                                        textColor=colors.HexColor("#1F3864")),
            "cover_part": ParagraphStyle("CoverPart", fontName=self.font_bold,
                                         fontSize=9, leading=12,
                                         alignment=TA_CENTER,
                                         textColor=colors.HexColor("#7F7F7F")),
            "cover_element": ParagraphStyle("CoverElement", fontName=self.font_bold,
                                            fontSize=16, leading=20,
                                            alignment=TA_CENTER,
                                            textColor=colors.HexColor("#1F3864")),
            "cover_doc": ParagraphStyle("CoverDoc", fontName=self.font, fontSize=11,
                                        leading=14, alignment=TA_CENTER,
                                        textColor=colors.HexColor("#404040")),
            "cover_name": ParagraphStyle("CoverName", fontName=self.font_bold,
                                         fontSize=13.5, leading=18,
                                         alignment=TA_CENTER),
            "cover_small": ParagraphStyle("CoverSmall", fontName=self.font,
                                          fontSize=8.5, leading=11,
                                          alignment=TA_RIGHT,
                                          textColor=colors.HexColor("#404040")),
            "sign": ParagraphStyle("Sign", fontName=self.font, fontSize=10,
                                   leading=14, alignment=TA_RIGHT,
                                   spaceBefore=10),
        }

    def _cover(self, st):
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import (HRFlowable, Paragraph, Spacer, Table,
                                        TableStyle)

        meta = self.doc_obj.meta
        story = [Spacer(1, 14 * mm),
                 Paragraph(meta.get("part", "CZĘŚĆ OPISOWA"), st["cover_part"]),
                 Spacer(1, 3 * mm),
                 Paragraph(meta.get("element", self.doc_obj.element),
                           st["cover_element"]),
                 Spacer(1, 2 * mm),
                 Paragraph(meta.get("doc_type") or "PROJEKT BUDOWLANY", st["cover_doc"]),
                 Spacer(1, 4 * mm),
                 HRFlowable(width="100%", thickness=1.1, color=colors.HexColor("#1F3864")),
                 Spacer(1, 8 * mm),
                 Paragraph(meta.get("nazwa", ""), st["cover_name"]),
                 Spacer(1, 10 * mm)]

        rows = [
            ("Adres inwestycji", meta.get("adres", "")),
            ("Działki ewidencyjne", meta.get("dzialki", "")),
            ("Kategoria obiektu", meta.get("kategoria", "")),
            ("Inwestor", meta.get("inwestor", "")),
        ]
        if meta.get("inwestor_adres"):
            rows.append(("Adres inwestora", meta["inwestor_adres"]))
        if meta.get("nr_projektu"):
            rows.append(("Nr projektu", meta["nr_projektu"]))
        if meta.get("tom"):
            rows.append(("Tom", meta["tom"]))

        data = [[Paragraph(f"<b>{label}</b>", st["cell"]),
                 Paragraph(str(value).replace("\n", "<br/>"), st["cell"])]
                for label, value in rows]
        table = Table(data, colWidths=[36 * mm, 129 * mm])
        table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#BFBFBF")),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F2F5FA")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ]))
        story.append(table)
        story.append(Spacer(1, 12 * mm))

        sign = [[Paragraph("Funkcja", st["head"]),
                 Paragraph("Imię i nazwisko / specjalność", st["head"]),
                 Paragraph("Nr uprawnień", st["head"]),
                 Paragraph("Podpis", st["head"])]]
        projektanci = list(meta.get("projektanci") or [])
        if not projektanci:
            projektanci = [{"funkcja": "Projektant",
                            "imie": meta.get("projektant", ""),
                            "specjalnosc": meta.get("specjalnosc", ""),
                            "uprawnienia": meta.get("uprawnienia", "")}]
            if meta.get("sprawdzajacy"):
                projektanci.append({"funkcja": "Sprawdzający",
                                    "imie": meta["sprawdzajacy"],
                                    "specjalnosc": meta.get("specjalnosc", ""),
                                    "uprawnienia": meta.get("sprawdzajacy_uprawnienia", "")})
        for row in projektanci:
            sign.append([
                Paragraph(f"<b>{row.get('funkcja', '')}</b>", st["cell"]),
                Paragraph(str(row.get("imie", ""))
                          + ("<br/>" + str(row.get("specjalnosc", ""))
                             if row.get("specjalnosc") else ""), st["cell"]),
                Paragraph(str(row.get("uprawnienia", "")), st["cell_c"]),
                Paragraph("", st["cell"]),
            ])
        table = Table(sign, colWidths=[28 * mm, 62 * mm, 45 * mm, 30 * mm])
        table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#8C8C8C")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E7ECF5")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(table)
        story.append(Spacer(1, 16 * mm))
        story.append(Paragraph(meta.get("adres", ""), st["cover_small"]))
        story.append(Paragraph(f"<b>{meta.get('data', '')}</b>", st["cover_small"]))
        story.append(Paragraph(
            f"<i>Zakres opracowania: {meta.get('zakres', '')}</i>", st["cover_small"]))
        return story

    def _block_flowables(self, block, st):
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, Spacer, Table, TableStyle

        kind = block.get("t")
        if kind in ("h1", "h2"):
            style = st["h1"] if kind == "h1" else st["h2"]
            return [Paragraph(block.get("x", ""), style)]
        if kind == "p":
            return [Paragraph(block.get("x", ""), st["body"])]
        if kind in ("ul", "ol"):
            out = []
            for idx, item in enumerate(block.get("items") or [], start=1):
                bullet = "•" if kind == "ul" else f"{idx}."
                par = Paragraph(item, st["body"], bulletText=bullet)
                out.append(par)
            return out
        if kind == "table":
            head = list(block.get("head") or [])
            rows = list(block.get("rows") or [])
            ncols = max([len(head)] + [len(r) for r in rows] + [1])
            usable = self.page_w - self.left - self.right
            widths = block.get("widths")
            if widths and len(widths) == ncols:
                total = sum(widths) or 1.0
                col_w = [usable * w / total for w in widths]
            else:
                col_w = [usable / ncols] * ncols

            def cell_style(value, index):
                txt = str(value).strip()
                if index > 0 and len(txt) <= 20 and re.fullmatch(
                        r"[0-9\s.,%²m³m³\-–—]+", txt):
                    return st["cell_c"]
                return st["cell"]

            data = []
            if head:
                data.append([Paragraph(str(h), st["head"]) for h in head])
            for r in rows:
                cells = list(r) + [""] * (ncols - len(r))
                data.append([
                    Paragraph(str(c).replace("\n", "<br/>"), cell_style(c, i))
                    for i, c in enumerate(cells)
                ])
            table = Table(data, colWidths=col_w, repeatRows=1 if head else 0)
            style = [
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#8C8C8C")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
            if head:
                style.append(("BACKGROUND", (0, 0), (-1, 0),
                              colors.HexColor("#E7ECF5")))
            flows = []
            if block.get("caption"):
                flows.append(Paragraph(block["caption"], st["caption"]))
            flows.append(table)
            flows.append(Spacer(1, 3 * mm))
            return flows
        if kind == "note":
            table = Table([[Paragraph(block.get("x", ""), st["note"])]],
                          colWidths=[self.page_w - self.left - self.right])
            table.setStyle(TableStyle([
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#C9C9C9")),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7F7F7")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            return [table, Spacer(1, 3 * mm)]
        if kind == "sign":
            lines = [str(x) for x in (block.get("lines") or []) if x]
            if not lines:
                return []
            return [Paragraph("<br/>".join(lines), st["sign"])]
        return []

    def build(self, path: str) -> str:
        from reportlab.platypus import NextPageTemplate, PageBreak, Paragraph

        st = self._styles()
        toc = _TocFlowable([st["toc0"], st["toc1"]])

        show_cover = bool(self.doc_obj.meta.get("cover", True))
        show_toc = bool(self.doc_obj.meta.get("toc", True))

        story = []
        if show_cover:
            story.extend(self._cover(st))
            story.append(NextPageTemplate("body"))
            story.append(PageBreak())
        if show_toc:
            story.append(Paragraph("SPIS TREŚCI", st["toc_title"]))
            story.append(toc)
            story.append(PageBreak())

        for block in self.doc_obj.blocks:
            story.extend(self._block_flowables(block, st))

        self.doc.filename = path
        self.doc.multiBuild(story,
                            canvasmaker=_footer_canvas(self.footer_text, self.font))
        return path


def _footer_canvas(footer_text: str, font_name: str):
    """Kanwa z numeracją „Strona X z Y”."""
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas as _canvas

    class FooterCanvas(_canvas.Canvas):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._saved = []

        def showPage(self):
            self._saved.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            total = len(self._saved)
            for state in self._saved:
                self.__dict__.update(state)
                if self._pageNumber > 1:
                    self.saveState()
                    self.setFont(font_name, 8)
                    self.setFillColor(colors.HexColor("#595959"))
                    self.drawCentredString(self._pagesize[0] / 2, 11 * mm,
                                           f"Strona {self._pageNumber} z {total}")
                    self.restoreState()
                super().showPage()
            super().save()

    return FooterCanvas


def export_pdf(doc_obj, path: str, data: dict | None = None) -> str:
    """Zapisuje dokument jako plik .pdf. Zwraca ścieżkę."""
    path = os.path.abspath(path)
    if not path.lower().endswith(".pdf"):
        path += ".pdf"
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    footer = f"{doc_obj.element} – {doc_obj.meta.get('nazwa', '')}"
    builder = _PdfBuilder(doc_obj, footer)
    return builder.build(path)


# ---------------------------------------------------------------------------
# TXT
# ---------------------------------------------------------------------------

def txt_text(doc_obj) -> str:
    """Zwraca treść dokumentu jako tekst (podgląd / wersja do korekty)."""
    lines: list[str] = []
    meta = doc_obj.meta
    lines.append(meta.get("element", doc_obj.element).center(78))
    lines.append(meta.get("part", "CZĘŚĆ OPISOWA").center(78))
    lines.append("")
    lines.append(meta.get("nazwa", "").center(78))
    lines.append("=" * 78)
    for label, key in (("Adres", "adres"), ("Działki", "dzialki"),
                       ("Kategoria", "kategoria"), ("Inwestor", "inwestor"),
                       ("Nr projektu", "nr_projektu"), ("Data", "data")):
        value = meta.get(key)
        if value:
            lines.append(f"{label + ':':<16}{value}")
    projektanci = meta.get("projektanci") or []
    if projektanci:
        for row in projektanci:
            head = f"{row.get('funkcja', '')}:"
            value = row.get("imie", "")
            if row.get("specjalnosc"):
                value += f" ({row['specjalnosc']})"
            if row.get("uprawnienia"):
                value += f", upr. {row['uprawnienia']}"
            lines.append(f"{head:<16}{value}")
    else:
        for label, key in (("Projektant", "projektant"), ("Uprawnienia", "uprawnienia")):
            value = meta.get(key)
            if value:
                lines.append(f"{label + ':':<16}{value}")
    lines.append("")

    for block in doc_obj.blocks:
        kind = block.get("t")
        if kind == "h1":
            lines.append("")
            lines.append(block.get("x", ""))
            lines.append("-" * max(len(block.get("x", "")), 10))
        elif kind == "h2":
            lines.append("")
            lines.append(block.get("x", ""))
        elif kind == "p":
            lines.append("")
            lines.extend(_wrap(block.get("x", ""), 78))
        elif kind == "ul":
            for item in block.get("items") or []:
                lines.extend(_wrap(item, 74, prefix="  • "))
        elif kind == "ol":
            for idx, item in enumerate(block.get("items") or [], start=1):
                lines.extend(_wrap(item, 74, prefix=f"  {idx}. "))
        elif kind == "table":
            if block.get("caption"):
                lines.append("")
                lines.append(block["caption"])
            lines.append("")
            lines.extend(_txt_table(block))
        elif kind == "note":
            lines.append("")
            lines.append("!" * 78)
            lines.extend(_wrap(block.get("x", ""), 74))
            lines.append("!" * 78)
        elif kind == "sign":
            lines.append("")
            for item in block.get("lines") or []:
                lines.append(str(item).rjust(78))
            lines.append("")
        elif kind == "pagebreak":
            lines.append("\f")
    return "\r\n".join(lines) + "\r\n"


def export_txt(doc_obj, path: str, data: dict | None = None) -> str:
    """Zapisuje dokument jako tekst UTF-8 (z BOM) – wersja do korekty."""
    path = os.path.abspath(path)
    if not path.lower().endswith(".txt"):
        path += ".txt"
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8-sig", newline="") as handle:
        handle.write(txt_text(doc_obj))
    return path


def _wrap(text: str, width: int, prefix: str = "") -> list[str]:
    import textwrap

    return textwrap.wrap(str(text), width=width, initial_indent=prefix,
                         subsequent_indent=" " * len(prefix)) or [prefix.rstrip()]


def _txt_table(block: dict) -> list[str]:
    head = [str(x) for x in (block.get("head") or [])]
    rows = [[str(c) for c in r] for r in (block.get("rows") or [])]
    ncols = max([len(head)] + [len(r) for r in rows] + [1])
    matrix = ([head] if head else []) + [r + [""] * (ncols - len(r)) for r in rows]
    widths = [0] * ncols
    for row in matrix:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(cell))
    lines = []
    for row in matrix:
        lines.append(" | ".join(cell.ljust(widths[i]) for i, cell in enumerate(row)).rstrip())
    separator = "-+-".join("-" * w for w in widths)
    if head:
        lines.insert(1, separator)
        lines.append(separator)
    return lines


# ---------------------------------------------------------------------------
# Eksport zbiorczy
# ---------------------------------------------------------------------------

def export_all(doc_obj, folder: str, data: dict,
               formats: list[str] | None = None,
               base_name: str | None = None) -> list[str]:
    """Zapisuje dokument we wskazanych formatach. Zwraca listę ścieżek."""
    formats = formats or ["docx", "pdf"]
    base = base_name or suggest_filename(doc_obj, data)
    os.makedirs(folder, exist_ok=True)
    produced = []
    for fmt in formats:
        target = os.path.join(folder, f"{base}.{fmt}")
        if fmt == "docx":
            produced.append(export_docx(doc_obj, target, data))
        elif fmt == "pdf":
            produced.append(export_pdf(doc_obj, target, data))
        elif fmt == "txt":
            produced.append(export_txt(doc_obj, target, data))
    return produced
