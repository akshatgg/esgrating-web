"use client";

import { useMemo } from "react";
import { generateHTML, type JSONContent } from "@tiptap/core";
import { blogExtensions } from "./extensions";

/** A post's TipTap JSON as HTML. Only nodes and marks from `blogExtensions`
 * can appear, each with its own fixed attributes, so the output carries no
 * arbitrary markup. Rendered in the browser: `generateHTML` builds real DOM
 * nodes, which a Server Component doesn't have. */
export default function BlogContent({ content }: { content: Record<string, unknown> | null }) {
  const html = useMemo(() => {
    if (!content) return "";
    try {
      return generateHTML(content as JSONContent, blogExtensions);
    } catch {
      return "";
    }
  }, [content]);

  if (!html) return null;
  return <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
