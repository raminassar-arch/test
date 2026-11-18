/* ==========================================================================
   PAB cyfrowa – wersja Google Sites
   zip.js – minimalny zapis ZIP (metoda „store”, bez kompresji).
   Wystarcza do złożenia pliku .docx (DOCX to archiwum ZIP z plikami XML).
   ========================================================================== */
(function () {
  "use strict";

  const TABLE = (function () {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function utf8(text) {
    return new TextEncoder().encode(text);
  }

  function dosTime(date) {
    const time =
      (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
    const day =
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate();
    return { time: time & 0xffff, date: day & 0xffff };
  }

  function zip(entries, when) {
    const stamp = dosTime(when || new Date());
    const chunks = [];
    const central = [];
    let offset = 0;

    entries.forEach(function (entry) {
      const name = utf8(entry.name);
      const data = typeof entry.data === "string" ? utf8(entry.data) : entry.data;
      const crc = crc32(data);

      const local = new Uint8Array(30 + name.length);
      const view = new DataView(local.buffer);
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0x0800, true); // nazwy w UTF-8
      view.setUint16(8, 0, true); // metoda: store
      view.setUint16(10, stamp.time, true);
      view.setUint16(12, stamp.date, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, data.length, true);
      view.setUint32(22, data.length, true);
      view.setUint16(26, name.length, true);
      view.setUint16(28, 0, true);
      local.set(name, 30);

      chunks.push(local, data);

      const head = new Uint8Array(46 + name.length);
      const hv = new DataView(head.buffer);
      hv.setUint32(0, 0x02014b50, true);
      hv.setUint16(4, 20, true);
      hv.setUint16(6, 20, true);
      hv.setUint16(8, 0x0800, true);
      hv.setUint16(10, 0, true);
      hv.setUint16(12, stamp.time, true);
      hv.setUint16(14, stamp.date, true);
      hv.setUint32(16, crc, true);
      hv.setUint32(20, data.length, true);
      hv.setUint32(24, data.length, true);
      hv.setUint16(28, name.length, true);
      hv.setUint16(30, 0, true);
      hv.setUint16(32, 0, true);
      hv.setUint16(34, 0, true);
      hv.setUint16(36, 0, true);
      hv.setUint32(38, 0, true);
      hv.setUint32(42, offset, true);
      head.set(name, 46);
      central.push(head);

      offset += local.length + data.length;
    });

    let centralSize = 0;
    central.forEach(function (part) {
      centralSize += part.length;
    });

    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    const all = chunks.concat(central, [end]);
    let total = 0;
    all.forEach(function (part) {
      total += part.length;
    });
    const out = new Uint8Array(total);
    let pos = 0;
    all.forEach(function (part) {
      out.set(part, pos);
      pos += part.length;
    });
    return out;
  }

  window.PABZip = { zip: zip, crc32: crc32, utf8: utf8 };
})();
