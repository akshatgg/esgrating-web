"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminStats } from "@/lib/types";
import { apiFetch, ApiError } from "@/lib/api";

type StatsState = { data: AdminStats | null; error: string | null; loading: boolean };

/** `GET /api/admin/stats` (esgratings-api app/dashboard/router.py) — the
 * Dashboard's data, also reused by list pages for their stat strips. A failed
 * refresh keeps the last good data alongside the error. */
export function useAdminStats() {
  const [state, setState] = useState<StatsState>({ data: null, error: null, loading: true });
  const [token, setToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch<AdminStats>("/api/admin/stats")
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Something went wrong.";
        setState((s) => ({ data: s.data, error: message, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    setToken((t) => t + 1);
  }, []);

  return { ...state, refresh };
}
