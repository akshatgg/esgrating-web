// The TipTap schema for blog posts, shared by the admin editor
// (components/admin/blog/BlogEditor.tsx) and the reader (BlogContent.tsx).
// Both must use the same node/mark set: content saved with an extension the
// reader lacks would silently disappear from the published page.
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

export const blogExtensions = [
  // StarterKit v3 bundles Link and Underline.
  StarterKit.configure({
    link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
  }),
  Image,
];
