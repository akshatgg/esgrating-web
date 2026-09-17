"use client";

import { useState, type ReactNode } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import clsx from "clsx";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { INPUT } from "@/components/admin/styles";

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      // Keep the editor's selection: a mousedown on the button would blur it.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={clsx(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-calc-navy text-white" : "text-ink/70 hover:bg-slate-100 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />;
}

/** The fixed formatting bar above the post body. */
export default function EditorToolbar({
  editor,
  onInsertImage,
  uploadingImage,
}: {
  editor: Editor;
  onInsertImage: () => void;
  uploadingImage: boolean;
}) {
  // TipTap v3 doesn't re-render on every transaction; subscribe to what the
  // buttons show.
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const chain = () => editor.chain().focus();

  function openLink() {
    setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setLinkOpen(true);
  }

  function applyLink() {
    const url = linkUrl.trim();
    if (!url) {
      chain().extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : `https://${url}`;
      chain().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-y border-line bg-white/95 px-3 py-1.5 backdrop-blur"
      >
        <ToolButton label="Undo" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Redo" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <Divider />
        <ToolButton label="Heading 1" active={s.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Heading 2" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Heading 3" active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <Divider />
        <ToolButton label="Bold" active={s.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Italic" active={s.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Inline code" active={s.code} onClick={() => chain().toggleCode().run()}>
          <Code className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <Divider />
        <ToolButton label="Bulleted list" active={s.bulletList} onClick={() => chain().toggleBulletList().run()}>
          <List className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Numbered list" active={s.orderedList} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Quote" active={s.blockquote} onClick={() => chain().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Divider line" onClick={() => chain().setHorizontalRule().run()}>
          <Minus className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <Divider />
        <ToolButton label="Link" active={s.link} onClick={openLink}>
          <Link2 className="h-4 w-4" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Insert image" disabled={uploadingImage} onClick={onInsertImage}>
          {uploadingImage ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          )}
        </ToolButton>
      </div>

      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="Link">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            applyLink();
          }}
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium text-label">
            URL
            <input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className={INPUT}
            />
          </label>
          <p className="text-xs text-muted">Leave empty to remove the link from the selected text.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="adminSecondary" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button variant="adminPrimary" type="submit">
              {linkUrl.trim() ? "Apply link" : "Remove link"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
