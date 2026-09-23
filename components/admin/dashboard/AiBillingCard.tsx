"use client";

import { useCallback, useEffect, useState } from "react";
import { Cloud, KeyRound, Loader2 } from "lucide-react";
import clsx from "clsx";
import { apiFetch, ApiError } from "@/lib/api";
import Alert from "@/components/ui/Alert";
import { CARD, FOCUS_RING } from "@/components/admin/styles";

// Which account the AI usage is billed to, for both calculators
// (esgratings-api app/core/llm_settings.py). "AWS" sends the same OpenAI models through
// Amazon Bedrock and draws on AWS; "OpenAI" calls the OpenAI API with its own key. The
// setting is read on every scoring call, so a change here applies to the next analysis.

type Option = { value: string; label: string };
type State = {
  provider: string;
  effective: string;
  chosen_by_admin: boolean;
  default: string;
  aws_available: boolean;
  options: Option[];
};

const PATH = "/api/admin/settings/llm-provider";

const ICON: Record<string, typeof Cloud> = { aws: Cloud, openai: KeyRound };

const BLURB: Record<string, string> = {
  aws: "Billed to AWS. No OpenAI key is used.",
  openai: "Billed to your OpenAI account.",
};

export default function AiBillingCard() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<State>(PATH)
      .then((d) => !cancelled && setState(d))
      .catch((e: unknown) => !cancelled && setError(e instanceof ApiError ? e.message : "Could not load."));
    return () => {
      cancelled = true;
    };
  }, []);

  const choose = useCallback(
    async (value: string) => {
      if (!state || value === state.provider || saving) return;
      setSaving(value);
      setError(null);
      try {
        setState(await apiFetch<State>(PATH, { method: "PUT", body: JSON.stringify({ provider: value }) }));
      } catch (e: unknown) {
        setError(e instanceof ApiError ? e.message : "Could not save.");
      } finally {
        setSaving(null);
      }
    },
    [state, saving],
  );

  return (
    <section className={clsx(CARD, "p-5")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">AI billing</h2>
        <span className="text-xs text-muted">Applies to ESG and BFSI</span>
      </div>
      <p className="mt-1 text-[13px] text-muted">
        Which account pays for the analysis. Takes effect on the next report.
      </p>

      {error ? (
        <Alert variant="error" className="mt-3">
          {error}
        </Alert>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {(state?.options ?? []).map((o) => {
          const Icon = ICON[o.value] ?? Cloud;
          const active = state?.provider === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              disabled={Boolean(saving)}
              onClick={() => choose(o.value)}
              className={clsx(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition disabled:opacity-60",
                FOCUS_RING,
                active
                  ? "border-calc-blue bg-calc-blue/5 ring-1 ring-calc-blue/30"
                  : "border-border hover:border-calc-blue/40",
              )}
            >
              <Icon className={clsx("mt-0.5 h-4 w-4 shrink-0", active ? "text-calc-blue" : "text-muted")} />
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-[13px] font-medium">
                  {o.label}
                  {saving === o.value ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{BLURB[o.value]}</span>
              </span>
            </button>
          );
        })}
        {!state && !error ? (
          <>
            <div className="h-[62px] animate-pulse rounded-lg bg-border/40" />
            <div className="h-[62px] animate-pulse rounded-lg bg-border/40" />
          </>
        ) : null}
      </div>

      {/* The server decides what is actually used: an admin can pick AWS on a deployment
          that has no AWS credentials, and the API falls back rather than failing every
          call. Say so plainly rather than showing a setting that is not in force. */}
      {state && state.provider === "aws" && !state.aws_available ? (
        <Alert variant="error" className="mt-3">
          AWS is selected but this server has no AWS credentials, so reports are still being
          billed to OpenAI. Check the deployment&rsquo;s IAM keys.
        </Alert>
      ) : null}
      {state && !state.chosen_by_admin ? (
        <p className="mt-3 text-xs text-muted">
          Using the default ({state.options.find((o) => o.value === state.default)?.label ?? state.default}).
        </p>
      ) : null}
    </section>
  );
}
