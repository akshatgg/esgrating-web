// Thin client for the `/api/*` rewrite (next.config.ts forwards it to
// FastAPI so the session cookie stays same-origin — see the spec's API
// section). Every browser call in this repo should go through apiFetch /
// apiUpload rather than calling `fetch` directly, so error handling and the
// same-origin credentials behaviour stay consistent.

/** Thrown for any non-2xx response. `status` is 0 for a network failure
 * (server unreachable, DNS, CORS, etc.) where there is no HTTP status. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const UNREACHABLE_MESSAGE =
  "We couldn't reach the server. Please check your connection and try again.";

async function readDetail(res: Response): Promise<string | undefined> {
  try {
    const body: unknown = await res.json();
    const detail =
      body && typeof body === "object" && "detail" in body
        ? (body as { detail?: unknown }).detail
        : undefined;
    if (typeof detail === "string") return detail;
    // FastAPI's validation error: `detail` is a list of `{loc, msg, type}`.
    if (Array.isArray(detail)) {
      const messages = detail
        .map((entry: unknown) =>
          entry && typeof entry === "object" && typeof (entry as { msg?: unknown }).msg === "string"
            ? (entry as { msg: string }).msg
            : null,
        )
        .filter((msg): msg is string => !!msg);
      if (messages.length > 0) return messages.join("; ");
    }
  } catch {
    // Non-JSON error body — fall through to the generic message.
  }
  return undefined;
}

/** Fired on `window` for every 401. The admin console shell listens for it
 * and sends the admin to `/admin/login?next=<current page>` (the session
 * cookie has expired). Nothing listens on the login page or the public site,
 * where a 401 is just an error to show. */
export const UNAUTHORIZED_EVENT = "esg:unauthorized";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const detail = await readDetail(res);
    throw new ApiError(detail ?? "Request failed", res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  try {
    return (await res.json()) as T;
  } catch {
    return undefined as T;
  }
}

/** Same-origin JSON request against `/api/...`. Throws `ApiError` on any
 * non-2xx response, or on a network-level failure (status 0). */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: "include", ...init });
  } catch {
    throw new ApiError(UNREACHABLE_MESSAGE, 0);
  }
  return handle<T>(res);
}

/** Same-origin request against `/api/...` that returns a binary body (CSV,
 * PDF, etc.) as a `Blob` rather than JSON. Errors go through the same
 * `readDetail`/`ApiError` path as `apiFetch`. */
export async function apiFetchBlob(path: string, init?: RequestInit): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(path, { credentials: "include", ...init });
  } catch {
    throw new ApiError(UNREACHABLE_MESSAGE, 0);
  }
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const detail = await readDetail(res);
    throw new ApiError(detail ?? "Request failed", res.status);
  }
  return res.blob();
}

/** Same-origin multipart upload against `/api/...`. */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  init?: Omit<RequestInit, "body">,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      ...init,
      credentials: "include",
      body: formData,
    });
  } catch {
    throw new ApiError(UNREACHABLE_MESSAGE, 0);
  }
  return handle<T>(res);
}
