"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Newspaper, Pencil, Plus, Star, Trash2 } from "lucide-react";
import clsx from "clsx";
import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import { TableSkeleton } from "@/components/admin/Skeleton";
import { CARD, FOCUS_RING, ICON_BUTTON, ICON_BUTTON_DANGER } from "@/components/admin/styles";
import BlogStatusBadge from "@/components/admin/blog/BlogStatusBadge";
import { formatPostDate } from "@/components/blog/format";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ApiError } from "@/lib/api";
import { deletePost, listAllPosts, publishPost, reorderPosts, unpublishPost, updatePost } from "@/lib/blog-api";
import type { BlogPost } from "@/lib/blog-types";

const TH = "h-10 border-b border-line px-4 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-muted uppercase";

function message(err: unknown): string {
  return err instanceof ApiError ? err.message : "Something went wrong.";
}

function PostRow({
  post,
  busy,
  onToggleFeatured,
  onTogglePublished,
  onDelete,
}: {
  post: BlogPost;
  busy: boolean;
  onToggleFeatured: () => void;
  onTogglePublished: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: post.id });
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 5 : undefined,
  };
  const published = post.status === "PUBLISHED";
  const date = formatPostDate(published ? post.published_at : (post.updated_at ?? post.created_at));

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group h-[56px] border-b border-line last:border-0 hover:bg-slate-50/70",
        isDragging && "bg-white shadow-lg",
      )}
    >
      <td className="w-10 pl-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder “${post.title}”`}
          title="Drag to reorder"
          className={clsx(ICON_BUTTON, "cursor-grab touch-none active:cursor-grabbing")}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </td>
      <td className="max-w-[28rem] px-4 py-2">
        <Link
          href={`/admin/blog/${post.id}/edit`}
          className={clsx("block truncate rounded font-medium text-ink hover:text-brand", FOCUS_RING)}
        >
          {post.title}
        </Link>
        <span className="block truncate text-xs text-muted">/blogs/{post.slug}</span>
      </td>
      <td className="px-4 py-2">
        <BlogStatusBadge status={post.status} />
      </td>
      <td className="px-4 py-2 text-ink/80">{post.category || "—"}</td>
      <td className="px-4 py-2 whitespace-nowrap text-ink/80">
        {date}
        <span className="block text-xs text-muted">{published ? "Published" : "Last edited"}</span>
      </td>
      <td className="px-4 py-2">
        <button
          type="button"
          onClick={onToggleFeatured}
          disabled={busy}
          aria-pressed={post.is_featured}
          aria-label={post.is_featured ? `Unfeature “${post.title}”` : `Feature “${post.title}”`}
          title={post.is_featured ? "Featured — click to unfeature" : "Feature on /blogs"}
          className={ICON_BUTTON}
        >
          <Star
            className={clsx("h-4 w-4", post.is_featured && "fill-amber-400 text-amber-500")}
            aria-hidden="true"
          />
        </button>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-1">
          <Button variant="adminSecondary" size="sm" disabled={busy} onClick={onTogglePublished}>
            {published ? "Unpublish" : "Publish"}
          </Button>
          <Link href={`/admin/blog/${post.id}/edit`} aria-label={`Edit “${post.title}”`} title="Edit" className={ICON_BUTTON}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Link>
          {published ? (
            <a
              href={`/blogs/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View “${post.title}” on the site`}
              title="View on the site"
              className={ICON_BUTTON}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : (
            <span className="h-8 w-8" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            aria-label={`Delete “${post.title}”`}
            title="Delete"
            className={ICON_BUTTON_DANGER}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(() => {
    return listAllPosts()
      .then((data) => {
        setPosts(data);
        setError(null);
      })
      .catch((err: unknown) => setError(message(err)));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function replace(saved: BlogPost) {
    setPosts((current) => current?.map((p) => (p.id === saved.id ? saved : p)) ?? current);
  }

  async function run(post: BlogPost, action: () => Promise<BlogPost>) {
    setBusyId(post.id);
    setError(null);
    try {
      replace(await action());
    } catch (err) {
      setError(message(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!posts || !over || active.id === over.id) return;
    const from = posts.findIndex((p) => p.id === active.id);
    const to = posts.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(posts, from, to);
    setPosts(reordered); // optimistic
    try {
      await reorderPosts(reordered.map((p) => p.id));
    } catch (err) {
      setError(`The new order wasn't saved: ${message(err)}`);
      void load();
    }
  }

  const publishedCount = posts?.filter((p) => p.status === "PUBLISHED").length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Blog" }]}
        title="Blog"
        description={
          posts && posts.length > 0
            ? `${posts.length} post${posts.length === 1 ? "" : "s"} · ${publishedCount} published on /blogs. Drag rows to set the order.`
            : "Posts published here appear on the public /blogs page."
        }
        actions={
          <Button variant="adminPrimary" href="/admin/blog/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New post
          </Button>
        }
      />

      {error ? (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {posts === null ? (
        error ? null : <TableSkeleton />
      ) : posts.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={Newspaper}
            title="No blog posts yet"
            description="Write your first post — it stays a draft until you publish it."
            action={
              <Button variant="adminPrimary" href="/admin/blog/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New post
              </Button>
            }
          />
        </div>
      ) : (
        <div className={clsx(CARD, "overflow-x-auto rounded-xl")}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50/90">
                  <th scope="col" className={clsx(TH, "w-10 px-0")}>
                    <span className="sr-only">Order</span>
                  </th>
                  <th scope="col" className={TH}>Title</th>
                  <th scope="col" className={TH}>Status</th>
                  <th scope="col" className={TH}>Category</th>
                  <th scope="col" className={TH}>Date</th>
                  <th scope="col" className={TH}>Featured</th>
                  <th scope="col" className={clsx(TH, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext items={posts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  {posts.map((post) => (
                    <PostRow
                      key={post.id}
                      post={post}
                      busy={busyId === post.id}
                      onToggleFeatured={() =>
                        void run(post, () => updatePost(post.id, { is_featured: !post.is_featured }))
                      }
                      onTogglePublished={() =>
                        void run(post, () =>
                          post.status === "PUBLISHED" ? unpublishPost(post.id) : publishPost(post.id),
                        )
                      }
                      onDelete={() => setDeleteTarget(post)}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete post"
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deletePost(deleteTarget.id);
          setPosts((current) => current?.filter((p) => p.id !== deleteTarget.id) ?? current);
        }}
      >
        <p>
          Delete <strong>{deleteTarget?.title}</strong>? It will be removed from /blogs straight away.
          This can&apos;t be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
