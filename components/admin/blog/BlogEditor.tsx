"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import { ExternalLink, Eye, Loader2 } from "lucide-react";
import clsx from "clsx";
import PageHeader from "@/components/admin/PageHeader";
import { CARD } from "@/components/admin/styles";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { blogExtensions } from "@/components/blog/extensions";
import { ApiError } from "@/lib/api";
import { createPost, publishPost, unpublishPost, updatePost, uploadBlogImage } from "@/lib/blog-api";
import type { BlogPost, BlogPostInput, BlogStatus } from "@/lib/blog-types";
import BlogPreview from "./BlogPreview";
import BlogStatusBadge from "./BlogStatusBadge";
import CoverImageField, { IMAGE_ACCEPT } from "./CoverImageField";
import EditorToolbar from "./EditorToolbar";

/** Drafts save themselves this long after the last change. Published posts
 * never autosave: a change goes live only when "Save changes" is pressed. */
const AUTOSAVE_MS = 30_000;
const WORDS_PER_MINUTE = 200;

const editorExtensions = [...blogExtensions, Placeholder.configure({ placeholder: "Write your post…" })];

type SaveState = "idle" | "dirty" | "saving" | "saved";

/** Same rules as esgratings-api app/blog/slug.py, for the URL preview. */
function slugify(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "post";
}

function parseTags(value: string): string[] {
  return Array.from(new Set(value.split(",").map((t) => t.trim()).filter(Boolean)));
}

function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Create/edit form for a blog post: title, TipTap body and a details rail.
 * There is deliberately no author field — the API adds the fixed byline. */
export default function BlogEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(post?.id ?? null);
  const [status, setStatus] = useState<BlogStatus>(post?.status ?? "DRAFT");
  const [publishedAt, setPublishedAt] = useState<string | null>(post?.published_at ?? null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [savedSlug, setSavedSlug] = useState<string | null>(post?.slug ?? null);
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.cover_image_url ?? null);
  const [readTime, setReadTime] = useState(post?.read_time_minutes ? String(post.read_time_minutes) : "");
  const [featured, setFeatured] = useState(post?.is_featured ?? false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bodyText, setBodyText] = useState("");
  const savingRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: editorExtensions,
    content: (post?.content as object | null) ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "blog-prose min-h-[55vh] px-5 py-6 sm:px-8 focus:outline-none",
        "aria-label": "Post body",
      },
    },
    onCreate: ({ editor: e }) => setBodyText(e.getText()),
    onUpdate: ({ editor: e }) => {
      setBodyText(e.getText());
      setSaveState("dirty");
    },
  });

  const published = status === "PUBLISHED";
  const shownSlug = slugTouched ? slug : (savedSlug ?? slugify(title));
  const estimatedReadTime = estimateReadTime(bodyText);

  function edit<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setSaveState("dirty");
      setNotice(null);
    };
  }

  function payload(): BlogPostInput {
    return {
      title: title.trim(),
      ...(slugTouched && slug.trim() ? { slug: slugify(slug) } : {}),
      excerpt: excerpt.trim() || null,
      content: editor ? (editor.getJSON() as Record<string, unknown>) : null,
      cover_image_url: coverImageUrl,
      category: category.trim() || null,
      tags: parseTags(tags),
      is_featured: featured,
      read_time_minutes: readTime ? Math.max(1, Math.round(Number(readTime))) : estimatedReadTime,
    };
  }

  /** "autosave" is silent and draft-only; "save" keeps the current status;
   * "publish"/"unpublish" change it. */
  async function save(intent: "autosave" | "save" | "publish" | "unpublish"): Promise<boolean> {
    if (!editor || savingRef.current) return false;
    if (!title.trim()) {
      if (intent !== "autosave") {
        setError("Add a title before saving.");
        titleRef.current?.focus();
      }
      return false;
    }
    savingRef.current = true;
    setSaveState("saving");
    setError(null);
    try {
      let saved: BlogPost;
      if (postId) {
        saved = await updatePost(postId, payload());
      } else {
        saved = await createPost(payload());
        setPostId(saved.id);
        // Swap the URL without navigating, so the editor (and the cursor) stays put.
        window.history.replaceState(null, "", `/admin/blog/${saved.id}/edit`);
      }
      if (intent === "publish" && saved.status !== "PUBLISHED") saved = await publishPost(saved.id);
      if (intent === "unpublish" && saved.status !== "DRAFT") saved = await unpublishPost(saved.id);
      setStatus(saved.status);
      setPublishedAt(saved.published_at);
      setSavedSlug(saved.slug);
      setSlug(saved.slug);
      setSlugTouched(false);
      setSaveState("saved");
      if (intent === "publish") setNotice("Published.");
      else if (intent === "unpublish") setNotice("Moved back to drafts. It's no longer on /blogs.");
      return true;
    } catch (err) {
      setSaveState("dirty");
      setError(
        (intent === "autosave" ? "Autosave failed: " : "") +
          (err instanceof ApiError ? err.message : "Something went wrong."),
      );
      return false;
    } finally {
      savingRef.current = false;
    }
  }

  // Debounced autosave for drafts: every change restarts the timer.
  useEffect(() => {
    if (saveState !== "dirty" || published) return;
    const timer = setTimeout(() => void save("autosave"), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  });

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (saveState !== "dirty" && saveState !== "saving") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  // Cmd/Ctrl+S saves.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save("save");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Grow the title box with its text.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  async function insertImage(file: File) {
    if (!editor) return;
    setUploadingImage(true);
    setError(null);
    try {
      const { url } = await uploadBlogImage(file);
      editor.chain().focus().setImage({ src: url, alt: "" }).run();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The image could not be uploaded.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function publish() {
    if (await save("publish")) router.push("/admin/blog");
  }

  const saving = saveState === "saving";
  const stateLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "dirty"
        ? published
          ? "Unsaved changes — not live yet"
          : "Unsaved changes"
        : saveState === "saved"
          ? "All changes saved"
          : published
            ? "Live on /blogs"
            : "Draft — only admins can see it";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Blog", href: "/admin/blog" },
          { label: postId ? "Edit post" : "New post" },
        ]}
        title={postId ? "Edit post" : "New post"}
        badge={<BlogStatusBadge status={status} />}
        description={
          <span className="inline-flex items-center gap-1.5" aria-live="polite">
            {saving ? <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" /> : null}
            {stateLabel}
          </span>
        }
        actions={
          <>
            <Button variant="adminGhost" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              Preview
            </Button>
            {published && savedSlug ? (
              <Button variant="adminGhost" href={`/blogs/${savedSlug}`}>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                View
              </Button>
            ) : null}
            {published ? (
              <>
                <Button variant="adminSecondary" disabled={saving} onClick={() => void save("unpublish")}>
                  Unpublish
                </Button>
                <Button variant="adminPrimary" disabled={saving} onClick={() => void save("save")}>
                  Save changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="adminSecondary" disabled={saving} onClick={() => void save("save")}>
                  Save draft
                </Button>
                <Button variant="adminPrimary" disabled={saving} onClick={() => void publish()}>
                  Publish
                </Button>
              </>
            )}
          </>
        }
      />

      {error ? (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert variant="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={CARD}>
          <div className="px-5 pt-6 pb-4 sm:px-8">
            <label htmlFor="blog-title" className="sr-only">
              Title
            </label>
            <textarea
              id="blog-title"
              ref={titleRef}
              rows={1}
              value={title}
              onChange={(e) => edit(setTitle)(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  editor?.commands.focus("start");
                }
              }}
              placeholder="Post title"
              className="w-full resize-none overflow-hidden border-0 bg-transparent p-0 font-display text-3xl leading-tight font-semibold text-navy placeholder:text-slate-300 focus:outline-none"
            />
            <p className="mt-2 truncate text-xs text-muted">
              esgratings.co.in/blogs/<span className="text-ink">{shownSlug}</span>
            </p>
          </div>
          {editor ? (
            <>
              <EditorToolbar
                editor={editor}
                uploadingImage={uploadingImage}
                onInsertImage={() => imageInputRef.current?.click()}
              />
              <EditorContent editor={editor} />
            </>
          ) : (
            <div className="min-h-[55vh] border-t border-line" aria-busy="true" />
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void insertImage(file);
            }}
          />
        </div>

        <aside className={clsx(CARD, "flex flex-col gap-4 p-5 xl:sticky xl:top-20")} aria-label="Post details">
          <CoverImageField value={coverImageUrl} onChange={edit(setCoverImageUrl)} />
          <Field
            as="textarea"
            label="Excerpt"
            name="excerpt"
            rows={3}
            value={excerpt}
            onChange={(e) => edit(setExcerpt)(e.target.value)}
            hint="Shown on the listing cards and in search results."
            className="min-h-24"
          />
          <Field
            label="Category"
            name="category"
            value={category}
            onChange={(e) => edit(setCategory)(e.target.value)}
            placeholder="e.g. ESG"
            hint="Posts in the same category show as related posts."
          />
          <Field
            label="Tags"
            name="tags"
            value={tags}
            onChange={(e) => edit(setTags)(e.target.value)}
            placeholder="ESG, BRSR, SEBI"
            hint="Comma-separated."
          />
          <Field
            label="Read time (minutes)"
            name="read_time"
            type="number"
            inputMode="numeric"
            min={1}
            value={readTime}
            onChange={(e) => edit(setReadTime)(e.target.value)}
            placeholder={String(estimatedReadTime)}
            hint={readTime ? undefined : `Leave empty to use the estimate (${estimatedReadTime} min).`}
          />
          <Field
            label="URL slug"
            name="slug"
            value={shownSlug}
            onChange={(e) => {
              setSlugTouched(true);
              edit(setSlug)(e.target.value);
            }}
            hint={
              published
                ? "Changing it breaks existing links to this post."
                : "Filled from the title until you edit it."
            }
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line p-3">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => edit(setFeatured)(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-calc-navy"
            />
            <span>
              <span className="block text-sm font-medium text-ink">Featured</span>
              <span className="block text-xs text-muted">Leads the /blogs page, full width.</span>
            </span>
          </label>
        </aside>
      </div>

      <BlogPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        category={category.trim() || null}
        coverImageUrl={coverImageUrl}
        content={previewOpen && editor ? (editor.getJSON() as Record<string, unknown>) : null}
        readTimeMinutes={readTime ? Number(readTime) : estimatedReadTime}
        publishedAt={publishedAt}
        tags={parseTags(tags)}
      />
    </div>
  );
}
