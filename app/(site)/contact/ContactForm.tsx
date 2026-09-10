"use client";

import { useState, type FormEvent } from "react";
import Field from "@/components/ui/Field";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", number: "", message: "" });

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let detail = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.detail) detail = body.detail;
        } catch {
          // ignore non-JSON error bodies
        }
        throw new Error(detail);
      }

      setStatus("success");
      setForm({ name: "", email: "", number: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-[820px] flex-col gap-5 rounded-2xl border border-line bg-white p-9 shadow-[0_10px_30px_rgba(11,28,57,0.08)]"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          label="Name"
          name="name"
          value={form.name}
          onChange={update("name")}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={update("email")}
        />
        <Field
          label="Number"
          name="number"
          type="tel"
          value={form.number}
          onChange={update("number")}
        />
        <Field
          as="textarea"
          label="Message"
          name="message"
          value={form.message}
          onChange={update("message")}
          className="sm:col-span-2"
        />
      </div>

      {status === "success" ? (
        <Alert variant="success">Thank you! We will get back to you shortly.</Alert>
      ) : null}
      {status === "error" && errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

      <Button type="submit" variant="calcNavy" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Request Demo"}
      </Button>
    </form>
  );
}
