import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaBold,
  FaEraser,
  FaImage,
  FaItalic,
  FaLink,
  FaListOl,
  FaListUl,
  FaQuoteRight,
  FaRedo,
  FaStrikethrough,
  FaTable,
  FaUnderline,
  FaUndo,
  FaUnlink,
  FaYoutube,
} from 'react-icons/fa';
import { ApiError, uploadAdminImage } from '../../services/api';
import { parseYoutubeId } from '../../utils/guideHtml';
import './RichTextEditor.scss';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function Btn({ label, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      className={`rte__btn${active ? ' is-active' : ''}`}
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : Boolean(active)}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="rte__sep" aria-hidden="true" />;
}

/** Popover for inserting an image (upload or https URL) or a YouTube video. */
function InsertDialog({ kind, onClose, onInsertImage, onInsertYoutube }) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (kind === 'youtube') {
      const id = parseYoutubeId(url);
      if (!id) {
        setErr('Pegá un link de YouTube válido (watch?v=, youtu.be/, shorts/ o embed/).');
        return;
      }
      onInsertYoutube(id);
      onClose();
      return;
    }
    if (file) {
      if (!IMAGE_TYPES.includes(file.type)) {
        setErr('Solo PNG, JPG, WEBP o GIF.');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setErr('La imagen supera los 5 MB.');
        return;
      }
      setBusy(true);
      try {
        const res = await uploadAdminImage(file);
        onInsertImage(res.data.url, alt);
        onClose();
      } catch (error) {
        setErr(error instanceof ApiError ? error.message : 'No se pudo subir la imagen.');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!/^https:\/\//i.test(url.trim())) {
      setErr('Elegí un archivo o pegá una URL https://.');
      return;
    }
    onInsertImage(url.trim(), alt);
    onClose();
  };

  return (
    <form className="rte__dialog" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <strong className="rte__dialog-title">{kind === 'youtube' ? 'Video de YouTube' : 'Insertar imagen'}</strong>
      {kind === 'image' && (
        <label>
          <span>Subir archivo (PNG, JPG, WEBP, GIF, máx. 5 MB)</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      )}
      <label>
        <span>{kind === 'youtube' ? 'Link del video' : 'o pegar URL (https)'}</span>
        <input
          type="url"
          value={url}
          placeholder={kind === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
        />
      </label>
      {kind === 'image' && (
        <label>
          <span>Texto alternativo (opcional)</span>
          <input type="text" value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} />
        </label>
      )}
      {err && <p className="rte__error" role="alert">{err}</p>}
      <div className="rte__dialog-actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Subiendo…' : 'Insertar'}
        </button>
        <button type="button" className="btn btn--secondary" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/**
 * WYSIWYG editor (TipTap). `value` / `onChange` carry an HTML string.
 * The server sanitizes again on save.
 */
export default function RichTextEditor({ value, onChange, placeholder = '', label = '' }) {
  const [dialog, setDialog] = useState(null);
  const lastEmitted = useRef(value || '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3, 4] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ allowBase64: false }),
      Youtube.configure({ nocookie: true, controls: true, width: 640, height: 360 }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'rte__prose', 'aria-label': label || 'Editor de texto', role: 'textbox', 'aria-multiline': 'true' },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? '' : ed.getHTML();
      lastEmitted.current = html;
      onChangeRef.current(html);
    },
  });

  // Follow external changes (reload after save / reset / reorder).
  useEffect(() => {
    if (!editor) return;
    if ((value || '') !== lastEmitted.current) {
      lastEmitted.current = value || '';
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const chain = () => editor.chain().focus();
  const inTable = editor.isActive('table');

  const setLink = () => {
    const previous = editor.getAttributes('link').href || '';
    const input = window.prompt('URL del link (http, https o mailto)', previous);
    if (input === null) return;
    const href = input.trim();
    if (href === '') {
      chain().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:)/i.test(href)) {
      window.alert('Solo se permiten links http://, https:// o mailto:');
      return;
    }
    chain().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="rte">
      <div className="rte__toolbar" role="toolbar" aria-label="Formato de texto">
        <Btn label="Negrita" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}><FaBold /></Btn>
        <Btn label="Cursiva" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}><FaItalic /></Btn>
        <Btn label="Subrayado" active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()}><FaUnderline /></Btn>
        <Btn label="Tachado" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}><FaStrikethrough /></Btn>
        <Sep />
        <Btn label="Título 3" active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}><span className="rte__txt">H3</span></Btn>
        <Btn label="Título 4" active={editor.isActive('heading', { level: 4 })} onClick={() => chain().toggleHeading({ level: 4 }).run()}><span className="rte__txt">H4</span></Btn>
        <Sep />
        <Btn label="Lista con viñetas" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}><FaListUl /></Btn>
        <Btn label="Lista numerada" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}><FaListOl /></Btn>
        <Btn label="Cita" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()}><FaQuoteRight /></Btn>
        <Sep />
        <Btn label="Alinear a la izquierda" active={editor.isActive({ textAlign: 'left' })} onClick={() => chain().setTextAlign('left').run()}><FaAlignLeft /></Btn>
        <Btn label="Centrar" active={editor.isActive({ textAlign: 'center' })} onClick={() => chain().setTextAlign('center').run()}><FaAlignCenter /></Btn>
        <Btn label="Alinear a la derecha" active={editor.isActive({ textAlign: 'right' })} onClick={() => chain().setTextAlign('right').run()}><FaAlignRight /></Btn>
        <Sep />
        <Btn label="Link" active={editor.isActive('link')} onClick={setLink}><FaLink /></Btn>
        <Btn label="Quitar link" disabled={!editor.isActive('link')} onClick={() => chain().extendMarkRange('link').unsetLink().run()}><FaUnlink /></Btn>
        <Btn label="Imagen" onClick={() => setDialog('image')}><FaImage /></Btn>
        <Btn label="Video de YouTube" onClick={() => setDialog('youtube')}><FaYoutube /></Btn>
        <Btn label="Insertar tabla 3x3" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><FaTable /></Btn>
        {inTable && (
          <>
            <Btn label="Agregar fila abajo" onClick={() => chain().addRowAfter().run()}><span className="rte__txt">+F</span></Btn>
            <Btn label="Borrar fila" onClick={() => chain().deleteRow().run()}><span className="rte__txt">-F</span></Btn>
            <Btn label="Agregar columna a la derecha" onClick={() => chain().addColumnAfter().run()}><span className="rte__txt">+C</span></Btn>
            <Btn label="Borrar columna" onClick={() => chain().deleteColumn().run()}><span className="rte__txt">-C</span></Btn>
            <Btn label="Borrar tabla" onClick={() => chain().deleteTable().run()}><span className="rte__txt">✕T</span></Btn>
          </>
        )}
        <Sep />
        <Btn label="Deshacer" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}><FaUndo /></Btn>
        <Btn label="Rehacer" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}><FaRedo /></Btn>
        <Btn label="Limpiar formato" onClick={() => chain().unsetAllMarks().clearNodes().run()}><FaEraser /></Btn>
      </div>

      {dialog && (
        <InsertDialog
          kind={dialog}
          onClose={() => setDialog(null)}
          onInsertImage={(src, alt) => chain().setImage({ src, alt: alt || '' }).run()}
          onInsertYoutube={(id) =>
            chain().setYoutubeVideo({ src: `https://www.youtube.com/watch?v=${id}` }).run()
          }
        />
      )}

      <EditorContent editor={editor} className="rte__content" />
    </div>
  );
}
