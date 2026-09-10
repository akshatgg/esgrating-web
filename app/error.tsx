"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

/** Root error boundary (Next.js App Router convention). Defense-in-depth
 * for any unexpected render-time error that isn't already handled closer
 * to its source — shows a branded message instead of the framework's
 * generic crash page. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft px-4 py-12">
      <Card className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold text-navy">
          Something went wrong
        </h1>
        <p className="mt-3 text-body">
          We hit an unexpected error loading this page. Please try again.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
        </div>
      </Card>
    </div>
  );
}
