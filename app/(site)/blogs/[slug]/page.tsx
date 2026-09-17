import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Section from "@/components/site/Section";
import BlogContent from "@/components/blog/BlogContent";
import BlogPostCard from "@/components/blog/BlogPostCard";
import { formatPostDate, isApiImage } from "@/components/blog/format";
import { getPublishedPost, getRelatedPosts } from "@/lib/server-blog-api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://esgratings.co.in";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Post not found" };
  const description = post.excerpt ?? `Read “${post.title}” on the ESG Ratings blog.`;
  const image = post.cover_image_url ? [{ url: post.cover_image_url, alt: post.title }] : undefined;
  return {
    title: post.title,
    description,
    keywords: post.tags ?? undefined,
    alternates: { canonical: `/blogs/${post.slug}` },
    openGraph: {
      type: "article",
      url: `/blogs/${post.slug}`,
      title: post.title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: post.author ? [post.author.name] : undefined,
      tags: post.tags ?? undefined,
      images: image,
    },
    twitter: { card: "summary_large_image", title: post.title, description, images: image },
  };
}

/** JSON for a <script> tag: `<` escaped so text in a post can't close the tag. */
function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  const related = await getRelatedPosts(slug);

  const url = `${SITE_URL}/blogs/${post.slug}`;
  const date = formatPostDate(post.published_at);
  const author = post.author;
  const byline = author ? `By ${author.name}${author.title ? `, ${author.title}` : ""}` : null;
  const meta = [byline, date, post.read_time_minutes ? `${post.read_time_minutes} min read` : null]
    .filter(Boolean)
    .join(" · ");

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt ?? undefined,
      image: post.cover_image_url ? new URL(post.cover_image_url, SITE_URL).toString() : undefined,
      datePublished: post.published_at ?? undefined,
      dateModified: post.updated_at ?? post.published_at ?? undefined,
      author: author ? { "@type": "Person", name: author.name } : undefined,
      publisher: {
        "@type": "Organization",
        name: "ESG Ratings",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo.jpg` },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      keywords: post.tags?.join(", ") || undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Blogs", item: `${SITE_URL}/blogs` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <div className="relative h-[260px] w-full overflow-hidden bg-navy md:h-[380px]">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt=""
            fill
            priority
            unoptimized={isApiImage(post.cover_image_url)}
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/50 to-navy/30" aria-hidden="true" />
        <div className="container-site relative flex h-full flex-col items-start justify-end gap-3 pb-8 text-white">
          {post.category ? (
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-[0.1em] uppercase backdrop-blur-sm">
              {post.category}
            </span>
          ) : null}
          <h1 className="max-w-3xl font-display text-2xl font-semibold md:text-4xl">{post.title}</h1>
          {meta ? <p className="text-sm text-white/80">{meta}</p> : null}
        </div>
      </div>

      <Section>
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blogs"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-calc-blue hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All posts
          </Link>
          <BlogContent content={post.content} />
          {post.tags && post.tags.length > 0 ? (
            <ul className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag} className="rounded-full bg-bg-soft px-3 py-1 text-xs font-medium text-label">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Section>

      {related.length > 0 ? (
        <Section className="bg-bg-soft">
          <h2 className="mb-8 text-center font-display text-2xl font-semibold text-navy">Related posts</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <BlogPostCard key={p.id} post={p} headingLevel="h3" />
            ))}
          </div>
        </Section>
      ) : null}
    </article>
  );
}
