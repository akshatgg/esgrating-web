import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import Section from "@/components/site/Section";
import { HEADING, FAQ_ITEMS } from "@/content/faq";

export const metadata: Metadata = {
  title: "FAQ",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      {/* No hero banner on this page in the source (content.md §2.6 §1 is empty). */}
      <Section className="pt-14 md:pt-20">
        <h1 className="mb-10 text-center font-display text-2xl font-semibold text-navy md:text-3xl">
          {HEADING}
        </h1>

        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-line bg-white p-5 open:shadow-[0_10px_30px_rgba(11,28,57,0.08)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-navy">
                {item.question}
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-muted motion-safe:transition-transform motion-safe:group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm text-body">{item.answer}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
