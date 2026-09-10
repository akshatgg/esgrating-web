"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";

const REQUIRED_MESSAGE = "Please fill all fields!";

type Status = "idle" | "submitting" | "error";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setStatus("error");
      setError(REQUIRED_MESSAGE);
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      router.replace("/admin/esg");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <Card className="w-full max-w-md p-6 sm:p-9" lift={false}>
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Image
          src="/brand/logo.jpg"
          alt="ESG Ratings"
          width={96}
          height={55}
          priority
          className="h-auto w-24"
        />
        <h1 className="text-2xl font-semibold text-ink">Superadmin login</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Field
          label="Username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="field-password" className="text-sm font-medium text-label">
            Password
          </label>
          <div className="relative">
            <input
              id="field-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border border-field bg-white px-4 py-3 pr-11 text-ink placeholder:text-muted focus:border-calc-blue focus:outline-none focus:ring-2 focus:ring-calc-blue/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {status === "error" && error ? <Alert variant="error">{error}</Alert> : null}

        <Button type="submit" variant="calcBlue" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Logging in…
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>
    </Card>
  );
}
