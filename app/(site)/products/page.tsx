import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageBanner from "@/components/site/PageBanner";
import Section from "@/components/site/Section";
import Card from "@/components/ui/Card";
import { ICONS } from "@/lib/icons";
import {
  BANNER,
  INTRO,
  PRODUCT_CARDS,
  ESG_RATING_SECTION,
  PRODUCT_MARQUEE,
  CORE_ESG_RATING_SECTION,
  CLOSING_NOTE,
} from "@/content/products";

export const metadata: Metadata = {
  title: "Products",
};

function IconBoxGrid({
  boxes,
}: {
  boxes: {
    icon: keyof typeof ICONS;
    title: string;
    description: string;
    formula?: string;
  }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {boxes.map((box) => {
        const Icon = ICONS[box.icon];
        return (
          <Card key={box.title} className="flex flex-col gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="font-display text-lg font-semibold text-navy">{box.title}</h3>
            <p className="text-sm text-body">{box.description}</p>
            {box.formula ? (
              <p className="rounded-lg bg-bg-soft px-3 py-2 text-sm font-medium text-navy">
                {box.formula}
              </p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <>
      <PageBanner src={BANNER.src} alt="" title={BANNER.title} />

      <Section>
        <p className="mx-auto max-w-3xl text-center text-body">{INTRO}</p>
      </Section>

      <Section className="pt-0">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PRODUCT_CARDS.map((card) => {
            const Icon = ICONS[card.icon];
            return (
              <Card key={card.title} lift className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="font-display text-xl font-semibold text-navy">{card.title}</h2>
                <Link
                  href={card.href}
                  className="cta-sweep rounded-[28px] bg-brand px-6 py-2.5 text-sm font-medium text-white"
                >
                  Learn more
                </Link>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section id={ESG_RATING_SECTION.id} className="bg-bg-soft scroll-mt-[101px]">
        <h2 className="mb-10 text-center font-display text-2xl font-semibold text-navy md:text-3xl">
          {ESG_RATING_SECTION.heading}
        </h2>
        <IconBoxGrid boxes={ESG_RATING_SECTION.boxes} />
      </Section>

      <div className="overflow-hidden border-y border-line bg-white py-8">
        <div className="marquee-track">
          {[...PRODUCT_MARQUEE, ...PRODUCT_MARQUEE, ...PRODUCT_MARQUEE].map((src, i) => (
            <div key={i} className="flex w-48 shrink-0 items-center justify-center px-6">
              <Image
                src={src}
                alt={src.includes("indian-bank") ? "Indian Bank" : "Race"}
                width={140}
                height={48}
                className="h-10 w-auto opacity-80"
              />
            </div>
          ))}
        </div>
      </div>

      <Section id={CORE_ESG_RATING_SECTION.id} className="bg-bg-soft scroll-mt-[101px]">
        <h2 className="mb-10 text-center font-display text-2xl font-semibold text-navy md:text-3xl">
          {CORE_ESG_RATING_SECTION.heading}
        </h2>
        <IconBoxGrid boxes={CORE_ESG_RATING_SECTION.boxes} />
      </Section>

      <Section>
        <p className="mx-auto max-w-3xl text-center text-sm text-muted">{CLOSING_NOTE}</p>
      </Section>
    </>
  );
}
