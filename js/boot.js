/* ==========================================================================
   PAB cyfrowa – wersja Google Sites
   boot.js – uruchamia silnik dokumentów (src/content.py + src/exporters.py)
   w przeglądarce przez Pyodide (Python w WebAssembly).

   Dzięki temu treść dokumentów jest dokładnie taka sama jak w wersji
   desktopowej i web – nie ma drugiej, „przepisanej” kopii tekstów prawnych.
   ========================================================================== */
(function () {
  "use strict";

  const PYODIDE_VERSION = "0.28.3";
  const CDN = "https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/";

  const BRIDGE = [
    "import json as _json",
    "import content as _content",
    "import exporters as _exporters",
    "import word_import as _word",
    "",
    "def _dump(obj):",
    "    return _json.dumps(obj, ensure_ascii=False, default=str)",
    "",
    "def pab_demo():",
    "    return _dump(_content.demo_project())",
    "",
    "def pab_blank():",
    "    return _dump(_content.blank_project())",
    "",
    "def pab_merge(text):",
    "    return _dump(_content.merge_defaults(_json.loads(text)))",
    "",
    "def pab_build(kind, text):",
    "    doc = _content.build_document(kind, _json.loads(text))",
    "    return _dump({'kind': doc.kind, 'title': doc.title,",
    "                  'element': doc.element, 'blocks': doc.blocks,",
    "                  'meta': doc.meta})",
    "",
    "def pab_txt(kind, text):",
    "    doc = _content.build_document(kind, _json.loads(text))",
    "    return _exporters.txt_text(doc)",
    "",
    "def pab_filename(kind, text):",
    "    data = _json.loads(text)",
    "    doc = _content.build_document(kind, data)",
    "    return _exporters.suggest_filename(doc, data)",
    "",
    "def pab_validate(text):",
    "    return _dump([list(pair) for pair in _content.validate(_json.loads(text))])",
    "",
    "def pab_indices(text):",
    "    return _dump(_content.build_indices(_json.loads(text)))",
    "",
    "def pab_program():",
    "    return _exporters.PROGRAM_NAME",
    "",
    "# --- import pól z dokumentu Word ---------------------------------------",
    "def pab_word_analyze():",
    "    report = _word.extract_docx('/pab/_import.docx')",
    "    return _dump(report.to_dict())",
    "",
    "def pab_word_apply(project_text, report_text, selected_text):",
    "    project = _json.loads(project_text)",
    "    report = _word.ImportReport.from_dict(_json.loads(report_text))",
    "    allowed = {(s, k) for s, k, _l, _kd, _o in _word.FIELD_SPECS}",
    "    report.matches = [m for m in report.matches if (m.section, m.key) in allowed]",
    "    merged = _word.apply_import(project, report,",
    "                                 selected=_json.loads(selected_text),",
    "                                 overwrite=True)",
    "    return _dump(merged)",
  ].join("\n");

  let instance = null;
  let pending = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const tag = document.createElement("script");
      tag.src = src;
      tag.async = true;
      tag.onload = function () {
        resolve();
      };
      tag.onerror = function () {
        reject(new Error("Nie udało się pobrać " + src));
      };
      document.head.appendChild(tag);
    });
  }

  async function fetchText(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Nie udało się pobrać " + url + " (HTTP " + response.status + ")");
    }
    return response.text();
  }

  /**
   * Ładuje Pyodide i moduły silnika.
   * @param {(message: string) => void} [onProgress]
   */
  function init(onProgress) {
    if (instance) return Promise.resolve(instance);
    if (pending) return pending;
    const note = onProgress || function () {};

    pending = (async function () {
      note("Pobieram środowisko Python (Pyodide, ok. 10 MB)…");
      if (!window.loadPyodide) await loadScript(CDN + "pyodide.js");
      const py = await window.loadPyodide({ indexURL: CDN });

      note("Wczytuję silnik dokumentów…");
      const sources = await Promise.all([
        fetchText("engine/content.py"),
        fetchText("engine/exporters.py"),
        fetchText("engine/word_import.py"),
      ]);
      py.FS.mkdirTree("/pab");
      py.FS.writeFile("/pab/content.py", sources[0]);
      py.FS.writeFile("/pab/exporters.py", sources[1]);
      py.FS.writeFile("/pab/word_import.py", sources[2]);

      note("Uruchamiam silnik dokumentów…");
      py.runPython('import sys\nif "/pab" not in sys.path:\n    sys.path.insert(0, "/pab")');
      py.runPython(BRIDGE);
      instance = py;
      return py;
    })();

    pending.catch(function () {
      pending = null;
    });
    return pending;
  }

  function ready() {
    return !!instance;
  }

  async function call(name, args) {
    const py = await init();
    const fn = py.globals.get(name);
    try {
      return fn.apply(null, args || []);
    } finally {
      if (fn && fn.destroy) fn.destroy();
    }
  }

  function asJson(text) {
    return JSON.parse(text);
  }

  window.PABEngine = {
    init: init,
    ready: ready,
    cdn: CDN,
    version: PYODIDE_VERSION,
    demo: function () {
      return call("pab_demo").then(asJson);
    },
    blank: function () {
      return call("pab_blank").then(asJson);
    },
    merge: function (data) {
      return call("pab_merge", [JSON.stringify(data)]).then(asJson);
    },
    build: function (kind, data) {
      return call("pab_build", [kind, JSON.stringify(data)]).then(asJson);
    },
    txt: function (kind, data) {
      return call("pab_txt", [kind, JSON.stringify(data)]);
    },
    filename: function (kind, data) {
      return call("pab_filename", [kind, JSON.stringify(data)]);
    },
    validate: function (data) {
      return call("pab_validate", [JSON.stringify(data)]).then(asJson);
    },
    indices: function (data) {
      return call("pab_indices", [JSON.stringify(data)]).then(asJson);
    },
    program: function () {
      return call("pab_program");
    },
    /** Analizuje bajty DOCX zapisane wcześniej w wirtualnym FS Pyodide. */
    wordAnalyze: async function (bytes) {
      const py = await init();
      py.FS.writeFile("/pab/_import.docx", bytes);
      return call("pab_word_analyze").then(asJson);
    },
    wordApply: function (project, report, selected) {
      return call("pab_word_apply", [
        JSON.stringify(project),
        JSON.stringify(report),
        JSON.stringify(selected),
      ]).then(asJson);
    },
  };
})();
