// One-off import of the four WordPress-era posts in content/blog.ts into the
// blog_posts collection, through the admin API (esgratings-api app/blog), so they
// become editable in /admin/blog. Each post keeps its slug (the legacy redirects
// in next.config.ts point at it) and its original publish date. Safe to re-run:
// a slug that already exists is skipped.
//
//   ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run seed:blog
//
// API_URL defaults to http://localhost:8000 (the FastAPI service itself).
import { POSTS, type Block } from "../content/blog";

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

type Node = Record<string, unknown>;

const text = (value: string): Node[] => (value ? [{ type: "text", text: value }] : []);

/** The h2 / p / ul blocks as a TipTap document (StarterKit node names). */
function toTipTap(blocks: Block[]): Node {
  const content: Node[] = blocks.map((block) => {
    if (block.type === "h2") return { type: "heading", attrs: { level: 2 }, content: text(block.text) };
    if (block.type === "ul") {
      return {
        type: "bulletList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: text(item) }],
        })),
      };
    }
    // Paragraphs may hold hard line breaks (the old page used whitespace-pre-line).
    const lines = block.text.split("\n");
    return {
      type: "paragraph",
      content: lines.flatMap((line, i) => [...(i > 0 ? [{ type: "hardBreak" }] : []), ...text(line)]),
    };
  });
  return { type: "doc", content };
}

function excerpt(blocks: Block[]): string | null {
  const first = blocks.find((b) => b.type === "p");
  if (!first || first.type !== "p") return null;
  return first.text.length > 220 ? `${first.text.slice(0, 217).trimEnd()}…` : first.text;
}

function readTime(blocks: Block[]): number {
  const words = blocks
    .flatMap((b) => (b.type === "ul" ? b.items : [b.text]))
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function login(): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed (${res.status}): ${await res.text()}`);
  const session = res.headers.getSetCookie().find((c) => c.startsWith("esg_session="));
  if (!session) throw new Error("Login succeeded but no esg_session cookie came back.");
  return session.split(";")[0];
}

async function main() {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD (an /admin login).");
  }
  const cookie = await login();
  const api = (path: string, init: RequestInit = {}) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Cookie: cookie },
    });

  // Oldest first, so display_order follows publish order.
  const posts = [...POSTS].sort((a, b) => a.date.localeCompare(b.date));
  let created = 0;
  for (const post of posts) {
    const res = await api("/api/admin/blog", {
      method: "POST",
      body: JSON.stringify({
        title: post.title,
        slug: post.slug,
        excerpt: excerpt(post.body),
        content: toTipTap(post.body),
        cover_image_url: post.image,
        category: "ESG",
        tags: post.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        read_time_minutes: readTime(post.body),
      }),
    });
    if (res.status === 422) {
      console.log(`- ${post.slug}: skipped (${(await res.json()).detail})`);
      continue;
    }
    if (!res.ok) throw new Error(`Creating ${post.slug} failed (${res.status}): ${await res.text()}`);
    const { id } = (await res.json()) as { id: string };

    const publish = await api(`/api/admin/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "PUBLISHED", published_at: `${post.date}T00:00:00Z` }),
    });
    if (!publish.ok) throw new Error(`Publishing ${post.slug} failed (${publish.status}): ${await publish.text()}`);
    created += 1;
    console.log(`✓ ${post.slug} (published ${post.date})`);
  }
  console.log(`Done: ${created} imported, ${posts.length - created} skipped.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
