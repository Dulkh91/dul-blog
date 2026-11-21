
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { useRef, useState } from 'react';
import { HtmlMode } from './HtmlMode';

interface TiptapEditorProps {
  content?: string;
  onChange: (html: string) => void;
}

function parsePastedTable(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  // Check if it's Markdown table
  const hasMarkdownDivider = lines.some((l) => /^\|?(\s*:?-+:?\s*\|?)+$/.test(l));
  const hasPipes = lines.filter((l) => l.includes('|')).length >= 2;

  if (hasMarkdownDivider || (hasPipes && lines[0].startsWith('|'))) {
    const dataLines = lines.filter((l) => !/^\|?(\s*:?-+:?\s*\|?)+$/.test(l));
    if (dataLines.length >= 1) {
      const rows = dataLines.map((line) => {
        let content = line;
        if (content.startsWith('|')) content = content.slice(1);
        if (content.endsWith('|')) content = content.slice(0, -1);
        return content.split('|').map((c) => c.trim());
      });

      if (rows.length > 0 && rows[0].length > 0) {
        let html = '<table class="border-collapse border border-gray-300 dark:border-zinc-700 w-full my-4"><thead><tr>';
        rows[0].forEach((cell) => {
          html += `<th class="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 p-2 font-semibold text-left">${cell || '&nbsp;'}</th>`;
        });
        html += '</tr></thead><tbody>';
        for (let i = 1; i < rows.length; i++) {
          html += '<tr class="border-b border-gray-300 dark:border-zinc-700">';
          rows[i].forEach((cell) => {
            html += `<td class="border border-gray-300 dark:border-zinc-700 p-2 align-top">${cell || '&nbsp;'}</td>`;
          });
          html += '</tr>';
        }
        html += '</tbody></table>';
        return html;
      }
    }
  }

  // Check if it's Tab-Separated Values (TSV from Excel / Google Sheets when copied as text)
  const isTsv = lines.length >= 2 && lines.every((l) => l.includes('\t'));
  if (isTsv) {
    const rows = lines.map((l) => l.split('\t').map((c) => c.trim()));
    let html = '<table class="border-collapse border border-gray-300 dark:border-zinc-700 w-full my-4"><thead><tr>';
    rows[0].forEach((cell) => {
      html += `<th class="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 p-2 font-semibold text-left">${cell || '&nbsp;'}</th>`;
    });
    html += '</tr></thead><tbody>';
    for (let i = 1; i < rows.length; i++) {
      html += '<tr class="border-b border-gray-300 dark:border-zinc-700">';
      rows[i].forEach((cell) => {
        html += `<td class="border border-gray-300 dark:border-zinc-700 p-2 align-top">${cell || '&nbsp;'}</td>`;
      });
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  return null;
}

const blockTags = new Set([
  'address', 'article', 'aside', 'blockquote', 'div', 'dl', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
  'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'tbody',
  'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
]);

function formatHtmlDocument(html: string): string {
  const tokens = html.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[A-Za-z][^>]*>|[^<]+/g) ?? [];
  const lines: string[] = [];
  let inlineContent = '';
  let depth = 0;

  const flushInline = () => {
    const content = inlineContent.trim();
    if (content) lines.push(`${'  '.repeat(Math.max(0, depth))}${content}`);
    inlineContent = '';
  };

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      inlineContent += token;
      continue;
    }

    const tagName = token.match(/^<\/?([A-Za-z][\w:-]*)/)?.[1]?.toLowerCase();
    if (!tagName || !blockTags.has(tagName)) {
      inlineContent += token;
      continue;
    }

    flushInline();
    const isClosing = /^<\//.test(token);
    const isVoid = /\/>$/.test(token) || /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i.test(tagName);
    if (isClosing) depth = Math.max(0, depth - 1);
    lines.push(`${'  '.repeat(depth)}${token.trim()}`);
    if (!isClosing && !isVoid) depth += 1;
  }

  flushInline();
  return lines.join('\n');
}

export default function TiptapEditor({ content = '', onChange }: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');
  const [originalHtml, setOriginalHtml] = useState('');
  const editorRef = useRef<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 dark:border-zinc-700 w-full my-4 table-auto',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-gray-300 dark:border-zinc-700',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 p-2 font-semibold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-zinc-700 p-2 align-top',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[300px] p-4 focus:outline-none tiptap',
      },
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData('text/html');
        // If HTML contains a table, Tiptap's built-in parser will convert it into a Table node!
        if (html && /<table[\s>]/i.test(html)) {
          return false;
        }

        // If plain text is a markdown table or TSV, parse and insert as table!
        const text = event.clipboardData?.getData('text/plain');
        if (text) {
          const tableHtml = parsePastedTable(text);
          if (tableHtml && editorRef.current) {
            editorRef.current.commands.insertContent(tableHtml);
            return true;
          }
        }

        return false;
      },
    },
  });

  editorRef.current = editor;

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const { url } = await res.json();
        editor?.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    };
    
    input.click();
  };

  const openHtmlMode = () => {
    const current = editor?.getHTML() ?? '';
    setHtmlInput(current);
    setOriginalHtml(current);
    setIsHtmlMode(true);
  };

  const applyHtml = () => {
    if (htmlInput.trim()) {
      editor?.commands.setContent(htmlInput);
      onChange(htmlInput);
    }
    setIsHtmlMode(false);
  };

  const cancelHtml = () => {
    if (originalHtml) {
      editor?.commands.setContent(originalHtml);
    }
    setIsHtmlMode(false);
  };

  if (!editor) return null;

  return (
    <div className="border rounded-lg flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1 sticky top-0 z-10 shrink-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded ${editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white border'}`}
        >
          Bold
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded ${editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white border'}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded ${editor.isActive('heading') ? 'bg-blue-500 text-white' : 'bg-white border'}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded ${editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white border'}`}
        >
          List
        </button>
        <button
          type="button"
          onClick={addImage}
          disabled={isUploading}
          className="px-3 py-1 rounded bg-white border"
        >
          {isUploading ? 'Uploading...' : 'Image'}
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          className={`px-3 py-1 rounded ${editor.isActive('table') ? 'bg-blue-500 text-white' : 'bg-white border'}`}
          title="បញ្ចូលតារាង (Insert Table)"
        >
          Table
        </button>
        <button
          type="button"
          onClick={() => isHtmlMode ? cancelHtml() : openHtmlMode()}
          className={`px-3 py-1 rounded ${isHtmlMode ? 'bg-blue-500 text-white' : 'bg-white border'}`}
        >
          HTML
        </button>
      </div>

      {/* Contextual Table Controls */}
      {editor.isActive('table') && (
        <div className="bg-blue-50/80 border-b px-3 py-1.5 flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-blue-900 mr-1">តារាង:</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="px-2 py-1 rounded bg-white border hover:bg-gray-50 text-gray-700"
          >
            + ជួរដេកលើ
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="px-2 py-1 rounded bg-white border hover:bg-gray-50 text-gray-700"
          >
            + ជួរដេកក្រោម
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="px-2 py-1 rounded bg-white border text-red-600 hover:bg-red-50"
          >
            - លុបជួរដេក
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="px-2 py-1 rounded bg-white border hover:bg-gray-50 text-gray-700"
          >
            + ជួរឈរឆ្វេង
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="px-2 py-1 rounded bg-white border hover:bg-gray-50 text-gray-700"
          >
            + ជួរឈរស្តាំ
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="px-2 py-1 rounded bg-white border text-red-600 hover:bg-red-50"
          >
            - លុបជួរឈរ
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          >
            លុបតារាង
          </button>
        </div>
      )}

      {/* Editor Content */}
      {!isHtmlMode && <EditorContent editor={editor} className="bg-white flex-1 overflow-y-auto min-h-0" />}

      {/* Fullscreen HTML Mode (Split: Left HTML, Right Live Preview) */}
      {isHtmlMode && (
        <HtmlMode
          htmlInput={htmlInput}
          setHtmlInput={setHtmlInput}
          onApply={applyHtml}
          onClose={cancelHtml}
          onFormat={() => setHtmlInput((current) => formatHtmlDocument(current))}
          editor={editor}
        />
      )}
    </div>
  );
}
