import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import type { BlogPost } from "@/lib/blog-types";
import Alert from "@/components/ui/Alert";
import BlogEditor from "@/components/admin/blog/BlogEditor";

export const metadata: Metadata = { title: "Edit blog post" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let res: Response;
  try {
    res = await serverFetch(`/api/admin/blog/${encodeURIComponent(id)}`);
  } catch {
    return <Alert variant="error">We couldn&apos;t reach the server. Please try again.</Alert>;
  }
  if (res.status === 404) notFound();
  if (!res.ok) {
    return <Alert variant="error">This post could not be loaded.</Alert>;
  }
  const post = (await res.json()) as BlogPost;
  // Keyed by id: after autosave creates a post and moves to its edit URL, the
  // editor keeps its state; a different post always gets a fresh editor.
  return <BlogEditor key={post.id} post={post} />;
}
