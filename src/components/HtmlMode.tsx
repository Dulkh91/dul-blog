import type React from 'react';
import { useState, useEffect } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@components/components/ui/resizable"


interface HtmlModeProps {
  htmlInput: string;
  setHtmlInput: (value: string | ((prev: string) => string)) => void;
  onApply: () => void;
  onClose: () => void;
  onFormat: () => void;
  editor: Editor | null;
}

export function HtmlMode({
  htmlInput,
  setHtmlInput,
  onApply,
  onClose,
  onFormat,
  editor,
}: HtmlModeProps) {
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  useEffect(() => {
    const update = () =>
      setOrientation(window.innerWidth >= 768 ? 'horizontal' : 'vertical');
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    setHtmlInput(nextValue);
    try {
      editor?.commands.setContent(nextValue, false);
    } catch {
      // Ignore parse errors while user is halfway typing
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col w-screen h-screen bg-background">
      {/* Top Bar Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 bg-muted/40">
        <div className=" hid md:flex items-center gap-2">
          <span className="font-semibold text-sm sm:text-base">កែសម្រួលកូដ HTML (HTML Mode)</span>
          <span className="rounded bg-blue-100 text-blue-800 text-xs px-2 py-0.5 font-mono dark:bg-blue-900/60 dark:text-blue-200">
            Split View
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onFormat}
            className="rounded border border-input bg-background px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-muted transition-colors"
          >
            Format Document
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded bg-blue-600 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            បញ្ចូល HTML
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-input bg-background px-3 py-1.5 text-xs sm:text-sm hover:bg-muted transition-colors"
          >
            បោះបង់
          </button>
        </div>
      </div>
    {/* Resizable Edit */}
            <ResizablePanelGroup
                orientation={orientation}
                className="min-h-50 rounded-lg border mx-2"
                >
                {/* ខាងឆ្វេង: Left Column - HTML Source */}
                <ResizablePanel defaultSize={60}>
                    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 bg-zinc-900 text-zinc-300 text-xs font-mono">
                        <span className="font-semibold">HTML Source (កូដ)</span>
                        <span className="text-zinc-500 hidden sm:inline">អ្នកអាចសរសេរ ឬ paste HTML ចូលដោយផ្ទាល់</span>
                    </div>
                    <div className="flex-1 p-2 overflow-hidden">
                        <textarea
                        id="tiptap-html-input"
                        value={htmlInput}
                        onChange={handleTextChange}
                        spellCheck={false}
                        className="w-full h-full resize-none bg-transparent p-3 font-mono text-xs sm:text-sm text-zinc-100 leading-relaxed overflow-auto focus:outline-none"
                        placeholder="<p>សរសេរ ឬ paste HTML នៅទីនេះ...</p>"
                        />
                    </div>
                    </div>
                </ResizablePanel>
             {/* ខាងស្តាំ: Right Column - Live Preview / EditorContent */}
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40}>
                    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
                    <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30 text-xs font-mono text-muted-foreground">
                        <span className="font-semibold">ការបង្ហាញផ្ទាល់ (Live Preview - EditorContent)</span>
                        <span className="text-xs">Output</span>
                    </div>
                    <div className="flex-1 p-6 overflow-auto">
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                        {editor && <EditorContent editor={editor} />}
                        </div>
                    </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

    </div>
  );
}
