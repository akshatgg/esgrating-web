"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import BfsiCalculatorForm from "@/components/calc/BfsiCalculatorForm";

/** Port of bfsi-calculator/admin/calculator.php: the public form's fields and
 * validation, posted to `POST /api/admin/bfsi/submissions` (which also starts
 * the analysis job), then on to the detail page's countdown. */
export default function NewBfsiAssessmentPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-xl font-semibold text-ink">BFSI Calculator — New Assessment</h1>
        <Link href="/admin/bfsi" className="text-sm font-medium text-calc-blue hover:underline">
          BFSI Data
        </Link>
      </div>
      <BfsiCalculatorForm
        endpoint="/api/admin/bfsi/submissions"
        onCreated={(id) => router.push(`/admin/bfsi/${id}`)}
      />
    </div>
  );
}
