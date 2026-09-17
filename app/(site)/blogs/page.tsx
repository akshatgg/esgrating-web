import type { Metadata } from "next";
import PageBanner from "@/components/site/PageBanner";
import Section from "@/components/site/Section";
import { getPublishedPosts } from "@/lib/server-blog-api";
import BlogList from "./BlogList";

export const metadata: Metadata = {
  title: "Blogs",
  description: "ESG ratings, BRSR and sustainability insights from ESG Ratings.",
  alternates: { canonical: "/blogs" },
};

export default async function BlogsPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <PageBanner src="/images/banners/blogs.webp" alt="" title="Blogs" />

      <Section>
        <BlogList posts={posts} />
      </Section>
    </>
  );
}
