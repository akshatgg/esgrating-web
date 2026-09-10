import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Mail } from "lucide-react";
import PageBanner from "@/components/site/PageBanner";
import Section from "@/components/site/Section";
import { PDF_BUTTONS, CONTACT_LINE, CONTACT_EMAIL } from "@/content/policy";

export const metadata: Metadata = {
  title: "Policies",
  alternates: { canonical: "/policy" },
};

export default function PolicyPage() {
  return (
    <>
      <PageBanner src="/images/banners/policy.webp" alt="" title="Policies" />

      <Section>
        <div className="flex flex-wrap items-center justify-center gap-5">
          {PDF_BUTTONS.map((btn) => (
            <Link
              key={btn.href}
              href={btn.href}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-sweep inline-flex items-center gap-2 rounded-[28px] bg-brand px-7 py-3 font-medium text-white"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {btn.label}
            </Link>
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <p className="flex items-center justify-center gap-2 text-center text-body">
          <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {CONTACT_LINE.replace(CONTACT_EMAIL, "")}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-calc-blue hover:underline">
              {CONTACT_EMAIL}
            </a>
          </span>
        </p>
      </Section>
    </>
  );
}
