# -*- coding: utf-8 -*-
"""Import wartości pól z dokumentów PDF.

Moduł jest odpowiednikiem :mod:`word_import` dla formatu PDF. Sam nie implementuje
parsera PDF — do odczytu warstwy tekstowej używa biblioteki ``pypdf`` (czysty
Python). Rozpoznawanie etykiet i konwersja wartości są współdzielone z
importem DOCX dzięki funkcji :func:`word_import.extract_text`.

Publiczne API:

    report = pdf_import.extract_pdf(ścieżka_lub_bajty)
    project = pdf_import.apply_import(project, report)
    project, report = pdf_import.import_pdf(ścieżka, project)

Działa w wersji desktopowej oraz lokalnym WEB-ie. W statycznej wersji
(GitHub Pages) tekst PDF jest wyciągany w przeglądarce przez pdf.js, a następnie
przekazywany do ``word_import.extract_text`` przez bridge Pyodide.
"""

from __future__ import annotations

import io
from typing import Any

try:  # pragma: no cover – zależnie od sposobu uruchomienia
    import word_import as WI
except ImportError:  # pragma: no cover
    from . import word_import as WI  # type: ignore

try:  # pragma: no cover – biblioteka jest opcjonalna poza importem PDF
    from pypdf import PdfReader
except ImportError:  # pragma: no cover
    PdfReader = None  # type: ignore


def _available() -> None:
    if PdfReader is None:
        raise RuntimeError(
            "Import PDF wymaga biblioteki pypdf. Zainstaluj ją poleceniem: "
            "python -m pip install pypdf")


def _pdf_bytes(source: Any) -> bytes:
    if isinstance(source, (bytes, bytearray, memoryview)):
        raw = bytes(source)
    elif hasattr(source, "read"):
        raw = source.read()
    else:
        with open(str(source), "rb") as fh:
            raw = fh.read()
    if not raw:
        raise ValueError("Plik PDF jest pusty.")
    if not raw.lstrip().startswith(b"%PDF"):
        raise ValueError("Plik nie jest dokumentem PDF (brak nagłówka %PDF).")
    return raw


def _texts(raw: bytes) -> list[str]:
    """Zwraca tekst stron w trybie układu i (jeśli się różni) zwykłym."""
    _available()
    try:
        reader = PdfReader(io.BytesIO(raw))  # type: ignore[misc]
    except Exception as exc:  # uszkodzony lub zaszyfrowany plik
        raise ValueError(f"Nie udało się otworzyć dokumentu PDF: {exc}") from exc

    if getattr(reader, "is_encrypted", False):
        try:
            # Większość PDF-ów zabezpieczonych ma puste hasło użytkownika.
            if reader.decrypt("") == 0:
                raise ValueError(
                    "Dokument PDF jest zaszyfrowany. Podaj wersję niezaszyfrowaną.")
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(
                f"Nie udało się odszyfrować dokumentu PDF: {exc}") from exc

    def pages_text(mode: str | None) -> str:
        chunks: list[str] = []
        for page in reader.pages:
            try:
                if mode:
                    text = page.extract_text(extraction_mode=mode) or ""
                else:
                    text = page.extract_text() or ""
            except TypeError:  # starsza wersja pypdf bez extraction_mode
                text = page.extract_text() or ""
            except Exception as exc:
                raise ValueError(
                    f"Nie udało się odczytać tekstu strony PDF: {exc}") from exc
            chunks.append(text)
        return "\n".join(chunks)

    layout = pages_text("layout")
    plain = pages_text(None)
    return [text for text in (layout, plain) if text.strip()]


def extract_pdf(source: Any) -> WI.ImportReport:
    """Wyciąga rozpoznane wartości pól z dokumentu PDF.

    ``source`` może być ścieżką, bajtami lub obiektem plikowym. Zwraca ten sam
    typ raportu co import DOCX, więc interfejsy mogą używać wspólnego okna
    podglądu i tej samej funkcji ``apply_import``.
    """
    texts = _pdf_bytes_and_texts(source)
    if not texts:
        report = WI.ImportReport()
        report.warnings.append(
            "Dokument PDF nie zawiera warstwy tekstowej. Import obsługuje "
            "pliki tekstowe; zeskanowanych dokumentów nie da się odczytać "
            "bez OCR.")
        return report

    # Tryb układu jest pierwszy, bo poprawnie czyta tabele etykieta–wartość.
    # Tryb zwykły bywa bogatszy w treść, ale w tabelach pomiesza nagłówki
    # z wartościami – sięgamy po niego tylko wtedy, gdy układ nic nie znalazł.
    reports = [WI.extract_text(text, "PDF") for text in texts]
    for report in reports:
        if report.matches:
            return report
    return reports[0] if reports else WI.ImportReport()


def _pdf_bytes_and_texts(source: Any) -> list[str]:
    return _texts(_pdf_bytes(source))


apply_import = WI.apply_import

ImportReport = WI.ImportReport
FieldMatch = WI.FieldMatch


def import_pdf(source: Any, project: dict[str, Any] | None = None,
               selected: Any = None, overwrite: bool = True
               ) -> tuple[dict[str, Any], ImportReport]:
    """Wygodny skrót: ekstrakcja z PDF + zastosowanie do projektu."""
    report = extract_pdf(source)
    return WI.apply_import(project, report, selected=selected,
                           overwrite=overwrite), report


__all__ = [
    "extract_pdf", "apply_import", "import_pdf",
    "ImportReport", "FieldMatch",
]
