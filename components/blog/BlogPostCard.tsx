import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import Card from "@/components/ui/Card";
import type { BlogPost } from "@/lib/blog-types";
import { formatPostDate, isApiImage } from "./format";

/** One post in the listing grid, the related-posts row and the homepage
 * teaser. `featured` spans the full width with the image beside the text. */
export default function BlogPostCard({
  post,
  featured = false,
  headingLevel = "h2",
}: {
  post: BlogPost;
  featured?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const date = formatPostDate(post.published_at);

  return (
    <Link href={`/blogs/${post.slug}`} className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
      <Card
        lift
        className={clsx(
          "h-full gap-0 overflow-hidden p-0",
          featured ? "grid md:grid-cols-2" : "flex flex-col",
        )}
      >
        <div className={clsx("relative w-full bg-bg-soft", featured ? "aspect-[16/10] md:aspect-auto md:min-h-72" : "aspect-[16/10]")}>
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt=""
              fill
              unoptimized={isApiImage(post.cover_image_url)}
              sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
              className="object-cover"
            />
          ) : null}
        </div>
        <div className={clsx("flex flex-1 flex-col gap-2", featured ? "p-6 md:p-8" : "p-6")}>
          {post.category ? (
            <span className="text-[11px] font-semibold tracking-[0.1em] text-calc-blue uppercase">
              {post.category}
            </span>
          ) : null}
          <Heading
            className={clsx(
              "font-display font-semibold text-navy",
              featured ? "text-2xl md:text-3xl" : "text-lg",
            )}
          >
            {post.title}
          </Heading>
          {post.excerpt ? (
            <p className={clsx("text-sm text-body", featured ? "line-clamp-4" : "line-clamp-2")}>
              {post.excerpt}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-x-2 pt-3 text-xs text-muted">
            {date ? <span>{date}</span> : null}
            {date && post.read_time_minutes ? <span aria-hidden="true">·</span> : null}
            {post.read_time_minutes ? <span>{post.read_time_minutes} min read</span> : null}
            <span className="ml-auto font-medium text-calc-blue">Read more</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
