"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BfsiCalculatorForm from "@/components/calc/BfsiCalculatorForm";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/admin/PageHeader";
import NextSteps from "@/components/admin/NextSteps";

/** Port of bfsi-calculator/admin/calculator.php: the public form's fields and
 * validation, posted to `POST /api/admin/bfsi/submissions` (which also starts
 * the analysis job), then on to the detail page's countdown. */
export default function NewBfsiAssessmentPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "BFSI Submissions", href: "/admin/bfsi" },
          { label: "New assessment" },
        ]}
        title="BFSI Calculator — New Assessment"
        description="Score a borrower's sustainability report for an ESG credit-risk rating."
        actions={
          <Button variant="adminSecondary" href="/admin/bfsi">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            BFSI Data
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <BfsiCalculatorForm
          appearance="admin"
          cancelHref="/admin/bfsi"
          endpoint="/api/admin/bfsi/submissions"
          onCreated={(id) => router.push(`/admin/bfsi/${id}`)}
        />
        <NextSteps
          steps={[
            "The borrower and report are saved to BFSI Submissions.",
            "AI analysis starts straight away and takes about 4 minutes.",
            "You land on the submission, where the detailed and one-page reports appear.",
          ]}
        />
      </div>
    </div>
  );
}
