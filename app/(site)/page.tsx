import Image from "next/image";
import Link from "next/link";
import Section from "@/components/site/Section";
import Card from "@/components/ui/Card";
import HeroVideo from "@/components/site/HeroVideo";
import { ICONS } from "@/lib/icons";
import {
  HERO,
  BRAND_MARQUEE,
  AI_DRIVEN_SECTION,
  AUTOMATED_RATING,
  RECENT_ARTICLES_HEADING,
} from "@/content/home";
import { postsByDateDesc } from "@/content/blog";

export default function Home() {
  const recentPosts = postsByDateDesc().slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy py-16 md:py-24">
        <Image
          src={HERO.bg}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="container-site relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="reveal flex flex-col items-start gap-4 text-white">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold">
                {HERO.badgeLine1}
              </span>
              <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold">
                {HERO.badgeLine2}
              </span>
            </div>
            <h1 className="font-display text-3xl font-semibold md:text-5xl">
              {HERO.tagline}
            </h1>
            <Link
              href={HERO.ctaHref}
              className="cta-sweep mt-2 inline-flex items-center justify-center rounded-[28px] bg-brand px-7 py-3 font-medium text-white"
            >
              {HERO.ctaLabel}
            </Link>
          </div>
          <div className="reveal aspect-video w-full">
            <HeroVideo src={HERO.video.src} poster={HERO.video.poster} />
          </div>
        </div>
      </section>

      {/* Brand marquee */}
      <div className="overflow-hidden border-b border-line bg-white py-8">
        <div className="marquee-track">
          {[...BRAND_MARQUEE, ...BRAND_MARQUEE].map((src, i) => (
            <div key={i} className="flex w-40 shrink-0 items-center justify-center px-6">
              <Image src={src} alt="" width={120} height={48} className="h-10 w-auto opacity-70" />
            </div>
          ))}
        </div>
      </div>

      {/* AI-Driven ESG Ratings for Smarter Sustainable Decisions */}
      <Section>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="relative order-2 aspect-[4/3] w-full overflow-hidden rounded-2xl lg:order-1">
            <Image
              src={AI_DRIVEN_SECTION.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="order-1 flex flex-col gap-4 lg:order-2">
            <h2 className="font-display text-2xl font-semibold text-navy md:text-3xl">
              {AI_DRIVEN_SECTION.title}
            </h2>
            {AI_DRIVEN_SECTION.paragraphs.map((p, i) => (
              <p key={i} className="text-body">
                {p}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* AI AUTOMATED ESG RATING */}
      <Section className="bg-bg-soft">
        <h2 className="mb-10 text-center font-display text-2xl font-semibold text-navy md:text-3xl">
          {AUTOMATED_RATING.heading}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AUTOMATED_RATING.boxes.map((box) => {
            const Icon = ICONS[box.icon];
            return (
              <Card key={box.title} className="flex flex-col gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-cover text-brand"
                  style={{ backgroundImage: `url(${AUTOMATED_RATING.bg})` }}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold text-navy">{box.title}</h3>
                <p className="text-sm text-body">{box.description}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Recent Article and News */}
      <Section
        className="relative"
        style={{
          backgroundImage: "url(/images/shared/bg-shape.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h2 className="mb-10 text-center font-display text-2xl font-semibold text-navy md:text-3xl">
          {RECENT_ARTICLES_HEADING}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {recentPosts.map((post) => (
            <Link key={post.slug} href={`/blogs/${post.slug}`} className="block">
              <Card lift className="flex h-full flex-col gap-4 p-0 overflow-hidden">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-6 pt-0">
                  <h3 className="font-display text-lg font-semibold text-navy">{post.title}</h3>
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
