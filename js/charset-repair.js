(() => {
  const cp1252 = new Map([
    [0x20ac,0x80],[0x201a,0x82],[0x0192,0x83],[0x201e,0x84],[0x2026,0x85],
    [0x2020,0x86],[0x2021,0x87],[0x02c6,0x88],[0x2030,0x89],[0x0160,0x8a],
    [0x2039,0x8b],[0x0152,0x8c],[0x017d,0x8e],[0x2018,0x91],[0x2019,0x92],
    [0x201c,0x93],[0x201d,0x94],[0x2022,0x95],[0x2013,0x96],[0x2014,0x97],
    [0x02dc,0x98],[0x2122,0x99],[0x0161,0x9a],[0x203a,0x9b],[0x0153,0x9c],
    [0x017e,0x9e],[0x0178,0x9f]
  ]);
  const markers = new Set([0x00c3,0x00c2,0x00e2,0x00ef,0x00f0,0xfffd]);
  const score = value => [...value].reduce((n, char) => n + (markers.has(char.codePointAt(0)) ? 1 : 0), 0);

  function decodeOne(value) {
    const chars = [...value];
    const byteOf = char => {
      const point = char.codePointAt(0);
      if (point <= 0xff) return point;
      return cp1252.get(point);
    };
    const output = [];
    const decoder = new TextDecoder('utf-8', {fatal:true});
    for (let i = 0; i < chars.length;) {
      const first = byteOf(chars[i]);
      const length = first >= 0xc2 && first <= 0xdf ? 2
        : first >= 0xe0 && first <= 0xef ? 3
        : first >= 0xf0 && first <= 0xf4 ? 4 : 0;
      if (length) {
        const bytes = [first];
        for (let offset = 1; offset < length && i + offset < chars.length; offset++) {
          const next = byteOf(chars[i + offset]);
          if (next === undefined || next < 0x80 || next > 0xbf) break;
          bytes.push(next);
        }
        if (bytes.length === length) {
          try {
            output.push(decoder.decode(Uint8Array.from(bytes)));
            i += length;
            continue;
          } catch { /* preserve malformed bytes exactly */ }
        }
      }
      output.push(chars[i]);
      i++;
    }
    return output.join('');
  }

  function repair(value) {
    let current = value;
    for (let i = 0; i < 24; i++) {
      if (!score(current)) break;
      const decoded = decodeOne(current);
      if (decoded === current) break;
      current = decoded;
    }
    return current
      .replace(/\bCAT\?LOGO\b/gi, 'CAT\u00C1LOGO')
      .replace(/\bPRESS\u00C3\?O\b/gi, 'PRESS\u00C3O')
      .replace(/\bPOT\?NCIA\b/gi, 'POT\u00CANCIA')
      .replace(/\bCR\?DITOS\b/gi, 'CR\u00C9DITOS')
      .replace(/\bMIN\?RIO\b/gi, 'MIN\u00C9RIO')
      .replace(/\bMUNI\?\?O\b/gi, 'MUNI\u00C7\u00C3O')
      .replace(/\bESTA\?\?O\b/gi, 'ESTA\u00C7\u00C3O')
      .replace(/\bN\?O\b/gi, 'N\u00C3O')
      .replace(/\bPROJ\?TEIS\b/gi, 'PROJ\u00C9TEIS')
      .replace(/\bCOMBUST\?VEL\b/gi, 'COMBUST\u00CDVEL')
      .replaceAll(' ? ', ' \u00B7 ')
      .replace(/^(\d+)\?$/, '$1\u00D7');
  }

  function repairElement(element) {
    if (element.matches?.('script,style,textarea')) return;
    for (const attr of ['aria-label','title','placeholder']) {
      if (element.hasAttribute(attr)) {
        const before = element.getAttribute(attr), after = repair(before);
        if (after !== before) element.setAttribute(attr, after);
      }
    }
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const after = repair(child.nodeValue);
        if (after !== child.nodeValue) child.nodeValue = after;
      } else if (child.nodeType === Node.ELEMENT_NODE) repairElement(child);
    }
    if (element.id === 'scan') element.firstChild && (element.firstChild.nodeValue = '\u2315  VARREDURA');
    if (element.id === 'full') element.textContent = '\u26F6';
    if (element.id === 'stationClose') {
      element.textContent = '\u00D7';
      element.setAttribute('aria-label', 'Fechar terminal da está\u00E7\u00E3o');
    }
  }

  repairElement(document.documentElement);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') {
        const after = repair(record.target.nodeValue);
        if (after !== record.target.nodeValue) record.target.nodeValue = after;
      } else for (const node of record.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const after = repair(node.nodeValue);
          if (after !== node.nodeValue) node.nodeValue = after;
        } else if (node.nodeType === Node.ELEMENT_NODE) repairElement(node);
      }
    }
  }).observe(document.documentElement, {subtree:true,childList:true,characterData:true});
})();
