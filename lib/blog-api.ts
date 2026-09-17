// Browser calls for the admin blog console (esgratings-api app/blog/router_admin.py),
// all through lib/api.ts so errors and the 401 → login bounce behave like every
// other admin page.
import { apiFetch, apiUpload } from "./api";
import type { BlogImageUpload, BlogPost, BlogPostInput, BlogPostUpdate } from "./blog-types";

const JSON_HEADERS = { "Content-Type": "application/json" };

export function listAllPosts(): Promise<BlogPost[]> {
  return apiFetch<BlogPost[]>("/api/admin/blog");
}

export function createPost(data: BlogPostInput): Promise<BlogPost> {
  return apiFetch<BlogPost>("/api/admin/blog", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
}

export function updatePost(id: string, data: BlogPostUpdate): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/admin/blog/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
}

export function deletePost(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/admin/blog/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function publishPost(id: string): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/admin/blog/${encodeURIComponent(id)}/publish`, { method: "POST" });
}

export function unpublishPost(id: string): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/api/admin/blog/${encodeURIComponent(id)}/unpublish`, { method: "POST" });
}

export function reorderPosts(postIds: string[]): Promise<{ ok: boolean }> {
  return apiFetch("/api/admin/blog/reorder", {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ post_ids: postIds }),
  });
}

export function uploadBlogImage(file: File): Promise<BlogImageUpload> {
  const form = new FormData();
  form.append("file", file);
  return apiUpload<BlogImageUpload>("/api/admin/blog/images", form);
}
