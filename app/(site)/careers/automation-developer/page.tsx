import type { Metadata } from "next";
import { Briefcase, MapPin, Building2, Mail, CheckCircle2 } from "lucide-react";
import Section from "@/components/site/Section";
import Button from "@/components/ui/Button";
import { JOB } from "@/content/careers";

export const metadata: Metadata = {
  title: "Automation Developer",
  alternates: { canonical: "/careers/automation-developer" },
};

export default function AutomationDeveloperPage() {
  return (
    <Section className="pt-14 md:pt-20">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy md:text-3xl">
            {JOB.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" aria-hidden="true" />
              {JOB.type}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {JOB.industry}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Remote (India)
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold text-navy">About ESG Ratings</h2>
          <p className="text-body">{JOB.companyDescription}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold text-navy">Role Description</h2>
          <p className="text-body">{JOB.description}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-navy">Qualifications</h2>
          <ul className="flex flex-col gap-2">
            {JOB.qualifications.map((q) => (
              <li key={q} className="flex items-start gap-2 text-body">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-grade-a" aria-hidden="true" />
                {q}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-bg-soft p-6">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Contact: {JOB.contact}
          </p>
          <Button href={JOB.applyHref} variant="calcNavy">
            Apply now
          </Button>
        </div>
      </div>
    </Section>
  );
}
