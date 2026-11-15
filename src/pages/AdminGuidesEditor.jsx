import { useState } from 'react';
import './AdminGuidesEditor.scss';
import { GUIDE_ICON_NAMES } from '../utils/guideIcons';
import RichTextEditor from '../components/RichTextEditor';

const LANGS = [
  { key: 'es', label: 'ES' },
  { key: 'en', label: 'EN' },
  { key: 'pt', label: 'PT' },
];

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 100)}`;
}

function move(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = list.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

function TextTriple({ label, value, onChange, rich = false }) {
  return (
    <div className="guides-editor__triple">
      <span className="guides-editor__label">{label}</span>
      {LANGS.map((l) => {
        if (rich) {
          return (
            <div key={l.key} className="guides-editor__lang guides-editor__lang--rich">
              <b>{l.label}</b>
              <RichTextEditor
                value={value?.[l.key] || ''}
                onChange={(html) => onChange({ ...value, [l.key]: html })}
                placeholder={l.label}
                label={`${label} (${l.label})`}
              />
            </div>
          );
        }
        return (
          <label key={l.key} className="guides-editor__lang">
            <b>{l.label}</b>
            <input
              type="text"
              value={value?.[l.key] || ''}
              onChange={(e) => onChange({ ...value, [l.key]: e.target.value })}
              aria-label={`${label} (${l.label})`}
              placeholder={l.label}
            />
          </label>
        );
      })}
    </div>
  );
}

/** <details> that tells its children whether it is open (editors only mount while open: they are heavy). */
function ItemDetails({ summary, children }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="guides-editor__item" onToggle={(e) => setOpen(e.currentTarget.open)}>
      {summary}
      {children(open)}
    </details>
  );
}

function Toolbar({ index, count, onMove, onDelete }) {
  return (
    <span className="guides-editor__tools">
      <button type="button" className="btn btn--secondary" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up">
        ↑
      </button>
      <button type="button" className="btn btn--secondary" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Move down">
        ↓
      </button>
      <button type="button" className="btn btn--secondary" onClick={onDelete} aria-label="Delete">
        ✕
      </button>
    </span>
  );
}

/** Controlled editor for the guides object: { intro, categories: [{ id, icon, title, items: [...] }] }. */
export default function AdminGuidesEditor({ value, onChange }) {
  const data = value || { intro: { es: '', en: '', pt: '' }, categories: [] };
  const cats = data.categories || [];

  const setCats = (next) => onChange({ ...data, categories: next });
  const patchCat = (ci, patch) => setCats(cats.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
  const patchItem = (ci, ii, patch) =>
    patchCat(ci, { items: cats[ci].items.map((it, i) => (i === ii ? { ...it, ...patch } : it)) });

  return (
    <div className="guides-editor">
      <TextTriple
        label="Intro"
        value={data.intro}
        rich
        onChange={(intro) => onChange({ ...data, intro })}
      />

      {cats.map((cat, ci) => (
        <details key={ci} className="guides-editor__cat">
          <summary>
            <span className="guides-editor__summary-title">
              {cat.title?.es || cat.id || '(sin título)'}
              <small> · {cat.items.length} ítems</small>
            </span>
            <Toolbar
              index={ci}
              count={cats.length}
              onMove={(d) => setCats(move(cats, ci, ci + d))}
              onDelete={() => {
                if (window.confirm(`¿Borrar la categoría "${cat.title?.es || cat.id}" y sus ítems?`)) {
                  setCats(cats.filter((_, i) => i !== ci));
                }
              }}
            />
          </summary>

          <div className="guides-editor__row">
            <label className="guides-editor__field">
              <span className="guides-editor__label">ID</span>
              <input type="text" value={cat.id} onChange={(e) => patchCat(ci, { id: e.target.value })} />
            </label>
            <label className="guides-editor__field">
              <span className="guides-editor__label">Icono</span>
              <select value={cat.icon} onChange={(e) => patchCat(ci, { icon: e.target.value })}>
                {GUIDE_ICON_NAMES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <TextTriple label="Título" value={cat.title} onChange={(title) => patchCat(ci, { title })} />

          <div className="guides-editor__items">
            {cat.items.map((item, ii) => (
              <ItemDetails
                key={ii}
                summary={(
                  <summary>
                  <span className="guides-editor__summary-title">{item.title?.es || item.id || '(sin título)'}</span>
                  <Toolbar
                    index={ii}
                    count={cat.items.length}
                    onMove={(d) => patchCat(ci, { items: move(cat.items, ii, ii + d) })}
                    onDelete={() => {
                      if (window.confirm(`¿Borrar el ítem "${item.title?.es || item.id}"?`)) {
                        patchCat(ci, { items: cat.items.filter((_, i) => i !== ii) });
                      }
                    }}
                  />
                </summary>
                )}
              >
                {(open) => (
                  <>
                <label className="guides-editor__field">
                  <span className="guides-editor__label">ID (usado en el link #id)</span>
                  <input type="text" value={item.id} onChange={(e) => patchItem(ci, ii, { id: e.target.value })} />
                </label>
                <TextTriple label="Título" value={item.title} onChange={(title) => patchItem(ci, ii, { title })} />
                {open ? (
                      <TextTriple label="Contenido" value={item.body} rich onChange={(body) => patchItem(ci, ii, { body })} />
                    ) : null}

                  </>
                )}
              </ItemDetails>
            ))}
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() =>
                patchCat(ci, {
                  items: [
                    ...cat.items,
                    { id: uid('item'), title: { es: '', en: '', pt: '' }, body: { es: '', en: '', pt: '' } },
                  ],
                })
              }
            >
              + Agregar ítem
            </button>
          </div>
        </details>
      ))}

      <button
        type="button"
        className="btn btn--secondary"
        onClick={() =>
          setCats([
            ...cats,
            { id: uid('cat'), icon: 'FaBook', title: { es: '', en: '', pt: '' }, items: [] },
          ])
        }
      >
        + Agregar categoría
      </button>
    </div>
  );
}
