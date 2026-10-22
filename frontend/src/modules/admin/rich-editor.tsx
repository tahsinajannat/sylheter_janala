'use client';

import { useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Heading2, Heading3, ImageIcon, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Underline as UnderlineIcon, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaPicker } from './media-library';

function Tool({ onClick, active, disabled, label, children }: { onClick: () => void; active?: boolean; disabled?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the text selection
      onClick={onClick}
      className={cn('flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-40 [&_svg]:size-4', active && 'bg-accent text-accent-foreground')}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link address (leave empty to remove the link)', prev ?? 'https://');
    if (url === null) return;
    if (url === '') c().extendMarkRange('link').unsetLink().run();
    else c().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1.5">
      <Tool label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}><Bold /></Tool>
      <Tool label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}><Italic /></Tool>
      <Tool label="Underline" active={s.underline} onClick={() => c().toggleUnderline().run()}><UnderlineIcon /></Tool>
      <span className="mx-1 h-5 w-px bg-border" />
      <Tool label="Heading" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 /></Tool>
      <Tool label="Sub-heading" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 /></Tool>
      <Tool label="Bulleted list" active={s.bullet} onClick={() => c().toggleBulletList().run()}><List /></Tool>
      <Tool label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()}><ListOrdered /></Tool>
      <Tool label="Quote" active={s.quote} onClick={() => c().toggleBlockquote().run()}><Quote /></Tool>
      <Tool label="Divider" onClick={() => c().setHorizontalRule().run()}><Minus /></Tool>
      <span className="mx-1 h-5 w-px bg-border" />
      <Tool label="Link" active={s.link} onClick={setLink}><Link2 /></Tool>
      <Tool label="Insert image" onClick={onImage}><ImageIcon /></Tool>
      <span className="mx-1 h-5 w-px bg-border" />
      <Tool label="Undo" disabled={!s.canUndo} onClick={() => c().undo().run()}><Undo2 /></Tool>
      <Tool label="Redo" disabled={!s.canRedo} onClick={() => c().redo().run()}><Redo2 /></Tool>
    </div>
  );
}

/** Rich-text editor that stores HTML. The initial `value` is read once; remount with a `key` to reset it. */
export function RichEditor({ value, onChange, lang = 'en', placeholder = 'Write here…' }: { value: string; onChange: (html: string) => void; lang?: 'bn' | 'en'; placeholder?: string }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false, // avoids a server/client mismatch in Next.js
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image, Placeholder.configure({ placeholder })],
    content: value,
    editorProps: { attributes: { lang, class: 'prose-article min-h-[22rem] max-w-none px-4 py-3 focus:outline-none' } },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-md border bg-background focus-within:ring-[3px] focus-within:ring-ring/30">
      {editor && <Toolbar editor={editor} onImage={() => setPickerOpen(true)} />}
      <EditorContent editor={editor} />
      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Insert an image into the story"
        onSelect={(m) => {
          editor?.chain().focus().setImage({ src: m.url, alt: m.alt ?? '' }).run();
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
