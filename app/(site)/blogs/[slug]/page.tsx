import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Section from "@/components/site/Section";
import { POSTS, getPostBySlug } from "@/content/blog";

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.body.find((b) => b.type === "p")?.text,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article>
      <div className="relative h-[240px] w-full overflow-hidden md:h-[360px]">
        <Image
          src={post.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/50" aria-hidden="true" />
        <div className="container-site relative flex h-full flex-col items-start justify-end gap-2 pb-8 text-white">
          <h1 className="max-w-3xl font-display text-2xl font-semibold md:text-4xl">
            {post.title}
          </h1>
          <p className="text-sm text-white/80">
            {new Date(post.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {post.author
              ? ` · ${post.authorPrefix === false ? "" : "By "}${post.author}`
              : null}
          </p>
        </div>
      </div>

      <Section>
        <div className="prose-content mx-auto max-w-3xl">
          {post.body.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2 key={i} className="mt-8 mb-3 font-display text-xl font-semibold text-navy">
                  {block.text}
                </h2>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={i} className="my-4 flex list-disc flex-col gap-2 pl-5 text-body">
                  {block.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="my-4 whitespace-pre-line text-body">
                {block.text}
              </p>
            );
          })}
        </div>
      </Section>
    </article>
  );
}
