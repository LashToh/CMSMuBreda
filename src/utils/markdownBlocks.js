/**
 * Pure markdown helpers (no React): block parser shared by the markdown renderer and the
 * markdown -> HTML converter used when an old (markdown) guide body is opened in the editor.
 */

const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const UL = /^\s*[-*]\s+(.*)$/;
const OL = /^\s*\d+[.)]\s+(.*)$/;

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

export function parseBlocks(source) {
  const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  const isTableStart = (idx) =>
    idx + 1 < lines.length && lines[idx].includes('|') && TABLE_SEP.test(lines[idx + 1]) && lines[idx + 1].includes('-');
  const nextNonBlank = (idx) => {
    let j = idx;
    while (j < lines.length && !lines[j].trim()) j += 1;
    return j;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (isTableStart(i)) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: 'table', head, rows });
      continue;
    }

    const listRe = UL.test(line) ? UL : OL.test(line) ? OL : null;
    if (listRe) {
      const items = [];
      while (i < lines.length) {
        const mm = lines[i].match(listRe);
        if (mm) {
          items.push(mm[1]);
          i += 1;
          continue;
        }
        // Allow blank lines between items of the same list.
        const j = nextNonBlank(i);
        if (j > i && j < lines.length && listRe.test(lines[j])) {
          i = j;
          continue;
        }
        break;
      }
      blocks.push({ type: listRe === UL ? 'ul' : 'ol', items });
      continue;
    }

    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !UL.test(lines[i]) &&
      !OL.test(lines[i]) &&
      !isTableStart(i)
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'p', text: para.join(' ') });
  }
  return blocks;
}


/** True when a stored body is HTML (starts with a tag) instead of legacy markdown. */
export function looksLikeHtml(value) {
  return /^\s*</.test(String(value || ''));
}

function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineHtml(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '$1');
}

/** Markdown (paragraphs, **bold**, lists, GFM tables) -> HTML string. Input is escaped. */
export function markdownToHtml(source) {
  return parseBlocks(source)
    .map((block) => {
      if (block.type === 'ul' || block.type === 'ol') {
        return `<${block.type}>${block.items.map((i) => `<li>${inlineHtml(i)}</li>`).join('')}</${block.type}>`;
      }
      if (block.type === 'table') {
        const head = block.head.map((c) => `<th>${inlineHtml(c)}</th>`).join('');
        const rows = block.rows
          .map((r) => `<tr>${block.head.map((_, ci) => `<td>${inlineHtml(r[ci] || '')}</td>`).join('')}</tr>`)
          .join('');
        return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
      }
      return `<p>${inlineHtml(block.text)}</p>`;
    })
    .join('\n');
}
