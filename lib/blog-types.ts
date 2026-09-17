// Blog API shapes (esgratings-api app/blog). Kept apart from lib/types.ts so the
// blog feature stays self-contained.

/** The fixed byline the API adds to every public post (BLOG_AUTHOR_* settings).
 * Never stored per post and never sent by the editor. */
export type BlogAuthor = { name: string; title: string | null; avatar_url: string | null };

export type BlogStatus = "DRAFT" | "PUBLISHED";

/** A `blog_posts` document. `content` is a TipTap JSON document. */
export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: Record<string, unknown> | null;
  cover_image_url: string | null;
  category: string | null;
  tags: string[] | null;
  status: BlogStatus;
  is_featured: boolean;
  display_order: number;
  read_time_minutes: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  /** Only on the public `/api/blog` responses. */
  author?: BlogAuthor;
};

/** `POST /api/admin/blog` body. The API always creates a draft. */
export type BlogPostInput = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content?: Record<string, unknown> | null;
  cover_image_url?: string | null;
  category?: string | null;
  tags?: string[];
  is_featured?: boolean;
  read_time_minutes?: number | null;
};

/** `PUT /api/admin/blog/{id}` body: only the fields sent are changed. */
export type BlogPostUpdate = Partial<BlogPostInput> & {
  status?: BlogStatus;
  published_at?: string;
};

/** `POST /api/admin/blog/images`. */
export type BlogImageUpload = { url: string; key: string };
