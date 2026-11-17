
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useState } from 'react';

interface TiptapEditorProps {
  content?: string;
  onChange: (html: string) => void;
}

export default function TiptapEditor({ content = '', onChange }: TiptapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlInput, setHtmlInput] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[300px] p-4 focus:outline-none',
      },
    },
  });

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
    setHtmlInput(editor?.getHTML() ?? '');
    setIsHtmlMode(true);
  };

  const applyHtml = () => {
    if (!htmlInput.trim()) return;
    editor?.commands.setContent(htmlInput);
    setIsHtmlMode(false);
  };

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
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
          onClick={() => isHtmlMode ? setIsHtmlMode(false) : openHtmlMode()}
          className={`px-3 py-1 rounded ${isHtmlMode ? 'bg-blue-500 text-white' : 'bg-white border'}`}
        >
          HTML
        </button>
      </div>

      {isHtmlMode && (
        <div className="space-y-2 border-b bg-gray-50 p-3">
          <label htmlFor="tiptap-html-input" className="block text-sm font-medium">
            Paste HTML content
          </label>
          <textarea
            id="tiptap-html-input"
            value={htmlInput}
            onChange={(event) => setHtmlInput(event.target.value)}
            rows={8}
            className="w-full rounded-md border bg-white p-2 font-mono text-xs"
            placeholder="<p>អត្ថបទ...</p>"
          />
          <div className="flex gap-2">
            <button type="button" onClick={applyHtml} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">
              បញ្ចូល HTML
            </button>
            <button type="button" onClick={() => setIsHtmlMode(false)} className="rounded border px-3 py-1.5 text-sm">
              បោះបង់
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}
