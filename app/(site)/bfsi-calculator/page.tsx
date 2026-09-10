import type { Metadata } from "next";
import PageBanner from "@/components/site/PageBanner";
import Section from "@/components/site/Section";
import BfsiCalculatorForm from "@/components/calc/BfsiCalculatorForm";

export const metadata: Metadata = {
  title: "BFSI Sector Calculator",
};

export default function BfsiCalculatorPage() {
  return (
    <>
      <PageBanner
        src="/images/banners/bfsi.webp"
        alt="BFSI Calculator"
        title="BFSI Sector Calculator"
      />

      <Section>
        <p className="mx-auto mb-8 max-w-2xl text-center text-body">
          Share your borrower and report details. We analyse them and email your ESG Credit Risk
          Report.
        </p>
        <BfsiCalculatorForm />
      </Section>
    </>
  );
}
