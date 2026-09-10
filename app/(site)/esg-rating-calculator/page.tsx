import type { Metadata } from "next";
import PageBanner from "@/components/site/PageBanner";
import Section from "@/components/site/Section";
import EsgCalculatorForm from "@/components/calc/EsgCalculatorForm";

export const metadata: Metadata = {
  title: "All Other Sector Calculator",
  alternates: { canonical: "/esg-rating-calculator" },
};

export default function EsgRatingCalculatorPage() {
  return (
    <>
      <PageBanner
        src="/images/banners/other.webp"
        alt="Other Sector Calculator"
        title="All Other Sector Calculator"
      />

      <Section>
        <h2 className="mb-8 text-center font-display text-2xl font-semibold text-navy md:text-3xl">
          Calculate your ESG Rating
        </h2>
        <EsgCalculatorForm />
      </Section>
    </>
  );
}
