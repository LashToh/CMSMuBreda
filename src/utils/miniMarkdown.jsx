import { Fragment } from 'react';
import { parseBlocks } from './markdownBlocks';

/**
 * Tiny markdown renderer (no dependencies, no dangerouslySetInnerHTML).
 * Supports: paragraphs, **bold**, `code`, "- " lists, "1. " lists and GFM tables.
 * Everything is built as React elements, so raw text can never inject HTML.
 */

function renderInline(text, keyPrefix) {
  const out = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) out.push(<strong key={`${keyPrefix}-b${i}`}>{m[1]}</strong>);
    else out.push(<code key={`${keyPrefix}-c${i}`}>{m[2]}</code>);
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.map((node, idx) =>
    typeof node === 'string' ? <Fragment key={`${keyPrefix}-t${idx}`}>{node}</Fragment> : node,
  );
}

export default function renderMarkdown(source) {
  return parseBlocks(source).map((block, bi) => {
    const key = `md${bi}`;
    switch (block.type) {
      case 'ul':
        return (
          <ul key={key}>
            {block.items.map((item, ii) => (
              <li key={`${key}-${ii}`}>{renderInline(item, `${key}-${ii}`)}</li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol key={key}>
            {block.items.map((item, ii) => (
              <li key={`${key}-${ii}`}>{renderInline(item, `${key}-${ii}`)}</li>
            ))}
          </ol>
        );
      case 'table':
        return (
          <div className="md-table-wrap" key={key} tabIndex={0}>
            <table className="cms-table md-table">
              <thead>
                <tr>
                  {block.head.map((cell, ci) => (
                    <th key={`${key}-h${ci}`} scope="col">
                      {renderInline(cell, `${key}-h${ci}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={`${key}-r${ri}`}>
                    {block.head.map((_, ci) => (
                      <td key={`${key}-r${ri}c${ci}`}>{renderInline(row[ci] || '', `${key}-r${ri}c${ci}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return <p key={key}>{renderInline(block.text, key)}</p>;
    }
  });
}
