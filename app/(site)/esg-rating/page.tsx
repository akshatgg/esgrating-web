import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, FileText } from "lucide-react";
import Section from "@/components/site/Section";
import Button from "@/components/ui/Button";
import RatingsTable from "./RatingsTable";
import {
  HERO_BG,
  BADGE,
  HEADING,
  CHECK_CARDS,
  CALCULATOR_CTAS,
  GRADE_SCALE,
  METHODOLOGY_PDF,
  RATING_LIST_HEADING,
} from "@/content/esgRating";

export const metadata: Metadata = {
  title: "ESG Rating",
  alternates: { canonical: "/esg-rating" },
};

export default function EsgRatingPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy py-16 md:py-24">
        <Image src={HERO_BG} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-navy/60" aria-hidden="true" />

        <div className="container-site relative flex flex-col items-center gap-8 text-center text-white">
          <div className="glass-surface glass-badge reveal flex items-center gap-3 rounded-full bg-white/20 px-5 py-2.5">
            <Image src={BADGE.icon} alt="" width={28} height={28} className="h-7 w-7" />
            <span className="text-left text-sm">
              <span className="block font-semibold">{BADGE.title}</span>
              <span className="block text-white/80">{BADGE.description}</span>
            </span>
          </div>

          <h1 className="reveal stagger-1 max-w-2xl font-display text-3xl font-semibold md:text-4xl">
            {HEADING}
          </h1>

          <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            {CHECK_CARDS.map((text, i) => (
              <div
                key={i}
                className={`glass-surface card-lift reveal stagger-${i + 2} flex flex-col gap-2 rounded-2xl bg-white/10 p-5`}
              >
                <CheckCircle2
                  className={`glass-check-icon glass-check-icon--${i + 1} h-6 w-6 rounded-full text-grade-a`}
                  aria-hidden="true"
                />
                <p className="text-sm text-white/90">{text}</p>
              </div>
            ))}
          </div>

          <div className="reveal stagger-5 flex flex-wrap items-center justify-center gap-5">
            {CALCULATOR_CTAS.map((cta) => (
              <Button key={cta.href} href={cta.href} variant={cta.variant}>
                {cta.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <Section className="scroll-reveal">
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[560px] border-collapse text-center text-sm">
            <tbody>
              <tr className="border-b border-line bg-bg-soft">
                <th className="px-4 py-3 text-left font-semibold text-label">ESG Rating</th>
                {GRADE_SCALE.esgRating.map((v) => (
                  <td key={v} className="px-4 py-3 font-medium text-ink">
                    {v}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-left font-semibold text-label">Grade</th>
                {GRADE_SCALE.grade.map((v) => (
                  <td key={v} className="px-4 py-3 font-medium text-ink">
                    {v}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-label">Category</th>
                {GRADE_SCALE.category.map((v) => (
                  <td key={v} className="px-4 py-3 text-body">
                    {v}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href={METHODOLOGY_PDF.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[28px] border border-line bg-white px-6 py-3 font-medium text-ink motion-safe:transition-shadow hover:shadow-[0_10px_24px_rgba(10,16,47,0.12)]"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            {METHODOLOGY_PDF.label}
          </Link>
        </div>
      </Section>

      <Section className="scroll-reveal bg-bg-soft">
        <h2 className="mb-8 text-center font-display text-2xl font-semibold text-navy md:text-3xl">
          {RATING_LIST_HEADING}
        </h2>
        <RatingsTable />
      </Section>
    </>
  );
}
