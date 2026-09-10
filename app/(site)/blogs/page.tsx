import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageBanner from "@/components/site/PageBanner";
import Section from "@/components/site/Section";
import Card from "@/components/ui/Card";
import { postsByDateDesc } from "@/content/blog";

export const metadata: Metadata = {
  title: "Blogs",
};

export default function BlogsPage() {
  const posts = postsByDateDesc();

  return (
    <>
      <PageBanner src="/images/banners/blogs.webp" alt="" title="Blogs" />

      <Section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blogs/${post.slug}`} className="block">
              <Card lift className="flex h-full flex-col gap-0 overflow-hidden p-0">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-6">
                  <h2 className="font-display text-lg font-semibold text-navy">{post.title}</h2>
                  <span className="mt-auto text-sm font-medium text-calc-blue">Read more</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
